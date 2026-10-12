/**
 * Pengisian data awal (benih) ke database.
 * Dipanggil sekali oleh siapkanDatabase(); aman dijalankan ulang karena setiap
 * baris memakai "on conflict do nothing".
 */

/** Versi bahan benih saat ini. Bagian dengan versi lebih baru hanya diisi sekali. */
const VERSI_BENIH = "v3";

/** Urutan penting: tabel induk didahulukan agar kunci asing terpenuhi. */
const RENCANA = [
  { tabel: "situs", kunci: "situs", satuan: true },
  { tabel: "pengaturan", kunci: "pengaturan", konflik: ["kunci"], versi: "v3" },
  { tabel: "profil", kunci: "profil", satuan: true },
  { tabel: "pengurus", kunci: "pengurus" },
  { tabel: "hero_slide", kunci: "hero_slide" },
  { tabel: "statistik", kunci: "statistik" },
  { tabel: "menu_cepat", kunci: "menu_cepat" },
  { tabel: "tautan_sosial", kunci: "tautan_sosial" },
  { tabel: "jenjang", kunci: "jenjang" },
  { tabel: "unit_pendidikan", kunci: "unit_pendidikan" },
  { tabel: "jurusan", kunci: "jurusan" },
  { tabel: "kategori", kunci: "kategori" },
  { tabel: "berita", kunci: "berita" },
  { tabel: "artikel", kunci: "artikel" },
  { tabel: "pengumuman", kunci: "pengumuman" },
  { tabel: "agenda", kunci: "agenda" },
  { tabel: "kajian", kunci: "kajian" },
  { tabel: "kajian_rutin", kunci: "kajian_rutin" },
  { tabel: "galeri_album", kunci: "galeri_album" },
  { tabel: "galeri_foto", kunci: "galeri_foto" },
  { tabel: "spmb_info", kunci: "spmb_info", satuan: true },
  { tabel: "spmb_gelombang", kunci: "spmb_gelombang" },
  { tabel: "spmb_biaya", kunci: "spmb_biaya" },
  { tabel: "tahun_ajaran", kunci: "tahun_ajaran" },
  { tabel: "santri", kunci: "santri" },
  { tabel: "mata_pelajaran", kunci: "mata_pelajaran" },
  { tabel: "nilai", kunci: "nilai", tanpaId: true, konflik: ["santri_id", "mapel_id", "semester"] },
  { tabel: "setoran_tahfidz", kunci: "setoran_tahfidz" },
  { tabel: "alumni", kunci: "alumni", versi: "v2" },
  { tabel: "metode_pembayaran", kunci: "metode_pembayaran" },
  { tabel: "tagihan", kunci: "tagihan" },
  { tabel: "pembayaran", kunci: "pembayaran", tanpaId: true },
  { tabel: "donasi_program", kunci: "donasi_program" },
  { tabel: "donasi_metode", kunci: "donasi_metode" },
  { tabel: "donasi_rekening", kunci: "donasi_rekening" },
  { tabel: "donasi_donatur", kunci: "donasi_donatur" },
  { tabel: "donasi_riwayat", kunci: "donasi_riwayat" },
  { tabel: "topik_kontak", kunci: "topik_kontak" },
  { tabel: "kontak_unit", kunci: "kontak_unit" },
  { tabel: "notifikasi", kunci: "notifikasi" },
];

/** Nilai objek/daftar disimpan sebagai jsonb. */
const nilaiKolom = (v) => (v !== null && typeof v === "object" ? JSON.stringify(v) : v);

async function sisipkan(tanya, tabel, baris, opsi = {}) {
  if (!baris || baris.length === 0) return 0;
  let jumlah = 0;
  for (const asli of baris) {
    const isi = { ...asli };
    if (opsi.tanpaId) delete isi.id;
    const kolom = Object.keys(isi).filter((k) => isi[k] !== undefined);
    const nilai = kolom.map((k) => nilaiKolom(isi[k]));
    const tanda = kolom.map((_, i) => `$${i + 1}`).join(", ");
    const konflik = opsi.konflik && opsi.konflik.length ? ` on conflict (${opsi.konflik.join(", ")}) do nothing` : "";
    let hasil;
    try {
      hasil = await tanya(`insert into ${tabel} (${kolom.join(", ")}) values (${tanda})${konflik}`, nilai);
    } catch (e) {
      const label = isi.id ?? isi.slug ?? isi.kunci ?? JSON.stringify(isi).slice(0, 60);
      throw new Error(`${tabel} (${label}): ${e.message}`);
    }
    jumlah += hasil.rowCount ?? 0;
  }
  return jumlah;
}

async function isiSemua({ tanya, data, hanyaVersi }) {
  const laporan = {};
  await tanya("begin");
  try {
    for (const rencana of RENCANA) {
      const versi = rencana.versi ?? "v1";
      if (hanyaVersi && versi !== hanyaVersi) continue;
      const sumber = data[rencana.kunci];
      if (sumber === undefined || sumber === null) continue;
      const baris = rencana.satuan || !Array.isArray(sumber) ? [sumber] : sumber;
      laporan[rencana.tabel] = await sisipkan(tanya, rencana.tabel, baris, rencana);
    }
    await tanya("commit");
  } catch (e) {
    await tanya("rollback").catch(() => {});
    throw e;
  }
  return laporan;
}

module.exports = { isiSemua, RENCANA, VERSI_BENIH };
