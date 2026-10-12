/**
 * Tagihan bulanan otomatis.
 *
 * Layanan ini tidak punya penjadwal, jadi tagihan bulan berjalan dibuat saat ada yang
 * membuka halaman tagihan — portal wali maupun panel Admin Tata Usaha. Supaya tagihan
 * yang aktif dengan sendirinya itu tetap sampai ke wali, setiap tagihan baru langsung
 * diberitakan lewat notifikasi:
 *
 *  - wali yang sedang membuka portal dikirimi langsung (satu kiriman, cepat);
 *  - wali lainnya masuk antrean push, lalu dikerjakan bertahap pada permintaan berikutnya
 *    supaya satu permintaan tidak menunggu lama dan tidak ada notifikasi yang hilang
 *    bila layanan sempat tidur di tengah pengiriman.
 */
const pesanWali = require("./notifikasiWali");

const BULAN_PAD = (n) => String(n).padStart(2, "0");
const periodeSekarang = () => {
  const d = new Date();
  return `${d.getFullYear()}-${BULAN_PAD(d.getMonth() + 1)}`;
};

/** Tanggal jatuh tempo pada bulan periode, paling lama di hari terakhir bulan itu. */
function tanggalTempo(periode, hari) {
  const [tahun, bulan] = String(periode).split("-").map((n) => Number.parseInt(n, 10));
  const akhir = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
  return `${periode}-${BULAN_PAD(Math.min(Math.max(1, Number(hari) || 1), akhir))}`;
}

module.exports = function bantuanTagihanBulanan(tanya, push) {
  const daftar = async (sql, nilai = []) => (await tanya(sql, nilai)).rows;
  /* Waktu pembuatan terakhir per unit agar kueri ini tidak dijalankan berulang kali. */
  const terakhir = new Map();

  /**
   * Membuat tagihan bulan berjalan untuk setiap kategori bulanan yang punya tanggal
   * jatuh tempo: satu tagihan per peserta aktif yang belum punya tagihan kategori itu
   * pada bulan ini. Aman dipanggil berulang.
   *
   * Hasilnya `{ dibuat, baris }` — `baris` berisi tagihan yang baru saja dibuat supaya
   * pemanggilnya bisa menyiapkan notifikasi untuk wali yang bersangkutan.
   */
  async function pastikan(unitId, { paksa = false, jedaMs = 60000 } = {}) {
    /*
     * Jeda hanya berlaku pada jalur yang dipanggil berulang oleh petugas (panel Tata Usaha).
     * Dengan jedaMs 0 — dipakai portal wali — pengecekannya selalu dijalankan dan waktu
     * jeda jalur petugas tidak ikut diperbarui, sehingga keduanya tidak saling menutup.
     */
    const pakaiJeda = !paksa && jedaMs > 0;
    if (pakaiJeda && Date.now() - (terakhir.get(unitId) ?? 0) < jedaMs) return { dibuat: 0, baris: [] };

    const periode = periodeSekarang();
    const kategori = await daftar(
      `select id, nama, nominal, jatuh_tempo_hari
         from kategori_tagihan
        where unit_id = $1 and aktif and tipe = 'bulanan' and jatuh_tempo_hari is not null and nominal > 0`,
      [unitId],
    );
    if (pakaiJeda) terakhir.set(unitId, Date.now());
    if (kategori.length === 0) return { dibuat: 0, baris: [] };

    const tahun = await tanya("select id from tahun_ajaran where aktif order by mulai desc nulls last limit 1");
    const tahunId = tahun.rows[0]?.id ?? null;
    const baris = [];

    for (const k of kategori) {
      const tempo = tanggalTempo(periode, k.jatuh_tempo_hari);
      const hasil = await tanya(
        `insert into tagihan (id, santri_id, jenis, label, keterangan, jumlah, jatuh_tempo, tahun_ajaran_id, status, kategori_id, periode)
         select 'tg-' || s.id || '-' || md5($1 || $5), s.id, $2, $2, null, $3, $4::date, $6, 'belum', $1, $5
           from santri s
          where s.unit_id = $7
            and coalesce(s.status, 'aktif') = 'aktif'
            and not exists (
              select 1 from tagihan t
               where t.santri_id = s.id and t.kategori_id = $1 and t.periode = $5
            )
         returning id, santri_id, label, jumlah, jatuh_tempo, periode`,
        [k.id, k.nama, k.nominal, tempo, periode, tahunId, unitId],
      );
      baris.push(...hasil.rows);
    }

    return { dibuat: baris.length, baris };
  }

  /**
   * Siapkan notifikasi untuk tagihan yang baru aktif. Wali yang sedang membuka halaman
   * (`segeraSantriId`) dikirimi langsung; sisanya masuk antrean.
   */
  async function antreNotifikasi(baris, { segeraSantriId = null } = {}) {
    if (!baris || baris.length === 0) return { jumlah: 0 };

    const ids = [...new Set(baris.map((b) => b.santri_id).filter(Boolean))];
    if (ids.length === 0) return { jumlah: 0 };
    const peserta = await daftar(
      `select s.id, s.nama, s.kelas, u.nama as unit_nama,
              coalesce(j.singkatan, j.nama, '') as jenjang, j.slug as jenjang_slug, j.nama as jenjang_nama
         from santri s
         left join unit_pendidikan u on u.id = s.unit_id
         left join jenjang j on j.id = s.jenjang_id
        where s.id = any($1::text[])`,
      [ids],
    );
    const peta = new Map(peserta.map((p) => [p.id, p]));

    let jumlah = 0;
    for (const b of baris) {
      const s = peta.get(b.santri_id);
      if (!s) continue;
      const item = pesanWali.tagihanBaru({ santri: s, tagihan: b });
      try {
        if (segeraSantriId && b.santri_id === segeraSantriId) {
          await push.kirimKeSantri(b.santri_id, item);
        } else {
          await push.antreKeSantri(b.santri_id, item);
        }
        jumlah += 1;
      } catch (e) {
        console.error("Notifikasi tagihan bulanan gagal disiapkan:", e.message);
      }
    }
    return { jumlah };
  }

  /** Kerjakan sisa antrean notifikasi milik satu unit (dipanggil tanpa ditunggu). */
  function kerjakanAntrean(unitId, opsi = {}) {
    return push.kerjakanAntrean({ unitId, batas: 40, waktuMs: 15000, ...opsi });
  }

  return { pastikan, antreNotifikasi, kerjakanAntrean, periodeSekarang, tanggalTempo };
};
