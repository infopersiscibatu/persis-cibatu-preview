/**
 * Notifikasi push ke layar HP.
 *
 * Ada dua macam sasaran:
 *  - siaran   : seluruh perangkat yang pernah mengaktifkan notifikasi (berita,
 *               artikel, pengumuman, agenda) — lihat ruang-berita.js dan sekitarnya;
 *  - per wali : hanya perangkat milik wali santri tertentu (tagihan terverifikasi,
 *               nilai terbit, nilai tahfidz terbit).
 *
 * Satu perangkat (endpoint) hanya terikat pada satu wali santri pada satu waktu.
 * Itulah penguncian "sesuai HP yang login": begitu wali lain masuk lewat HP yang
 * sama, langganan itu berpindah ke siswa/mahasiswa yang baru, sehingga notifikasi
 * tagihan, nilai, dan tahfidz tidak pernah tertukar dengan wali lain.
 *
 * Setiap kiriman dicatat pada tabel push_pesan dengan kunci unik, sehingga peristiwa
 * yang sama tidak diberitakan dua kali.
 */
const crypto = require("node:crypto");
const webpush = require("web-push");

const LABEL_LEMBAGA = "PC PERSIS Cibatu";
const IKON = "/logo-persis.png";

module.exports = function bantuanPush(tanya) {
  let kunciVapid = null;

  const acak = (n = 3) => crypto.randomBytes(n).toString("hex");

  /** Kunci VAPID dibuat sekali dan disimpan di database agar tetap sama setelah tidur. */
  async function siapkanKunci() {
    if (kunciVapid) return kunciVapid;
    const ada = await tanya("select publik, privat from push_vapid where id = 1");
    if (ada.rows.length > 0) {
      kunciVapid = { publicKey: ada.rows[0].publik, privateKey: ada.rows[0].privat };
    } else {
      kunciVapid = webpush.generateVAPIDKeys();
      await tanya(
        `insert into push_vapid (id, publik, privat) values (1, $1, $2)
         on conflict (id) do update set publik = excluded.publik, privat = excluded.privat`,
        [kunciVapid.publicKey, kunciVapid.privateKey],
      );
    }
    const alamat = process.env.PUBLIC_CONTACT_EMAIL || "sekretariat@persiscibatu.or.id";
    webpush.setVapidDetails(`mailto:${alamat}`, kunciVapid.publicKey, kunciVapid.privateKey);
    return kunciVapid;
  }

  /** Bentuk pesan yang dikenali service worker (lihat public/sw.js). */
  function pesanDari({ jenis, judul, isi, tautan, kunci }) {
    return {
      title: judul || LABEL_LEMBAGA,
      body: isi || "Ada kabar terbaru dari PC PERSIS Cibatu.",
      url: tautan || "/",
      tag: kunci || `persis-${Date.now()}`,
      ikon: IKON,
      jenis: jenis || null,
    };
  }

  /** Kirim satu pesan ke daftar langganan; langganan mati dibersihkan. */
  async function kirimKe(rows, teks) {
    let terkirim = 0;
    let gagal = 0;
    await Promise.all(
      rows.map(async (l) => {
        try {
          await webpush.sendNotification(
            { endpoint: l.endpoint, keys: { p256dh: l.p256dh, auth: l.auth } },
            teks,
            { TTL: 60 * 60 * 24 * 7 },
          );
          terkirim += 1;
        } catch (e) {
          gagal += 1;
          const status = e && e.statusCode;
          if (status === 404 || status === 410) {
            await tanya("delete from push_langganan where endpoint = $1", [l.endpoint]).catch(() => {});
          } else {
            console.error("Gagal kirim push:", status || e.message);
          }
        }
      }),
    );
    return { terkirim, gagal };
  }

  /**
   * Kirim satu pesan ke satu perangkat (dipakai tombol uji coba). Bila langganannya
   * sudah tidak berlaku, barisnya dibersihkan dan galatnya ditandai status 410.
   */
  async function kirimKePerangkat(endpoint, item) {
    await siapkanKunci();
    const { rows } = await tanya(
      "select endpoint, p256dh, auth from push_langganan where endpoint = $1",
      [endpoint],
    );
    if (rows.length === 0) return { ada: false, terkirim: 0, gagal: 0 };
    try {
      await webpush.sendNotification(
        { endpoint: rows[0].endpoint, keys: { p256dh: rows[0].p256dh, auth: rows[0].auth } },
        JSON.stringify(pesanDari(item)),
        { TTL: 600 },
      );
      return { ada: true, terkirim: 1, gagal: 0 };
    } catch (e) {
      const status = e && e.statusCode;
      if (status === 404 || status === 410) {
        await tanya("delete from push_langganan where endpoint = $1", [endpoint]).catch(() => {});
        const galat = new Error("Langganan perangkat ini sudah tidak berlaku.");
        galat.status = 410;
        throw galat;
      }
      const galat = new Error(e && e.message ? e.message : "Notifikasi gagal dikirim.");
      galat.status = status || 500;
      throw galat;
    }
  }

  /** Siaran ke seluruh perangkat yang pernah mengaktifkan notifikasi. */
  async function kirimKeSemua(item) {
    await siapkanKunci();
    const { rows } = await tanya("select endpoint, p256dh, auth from push_langganan");
    const hasil = await kirimKe(rows, JSON.stringify(pesanDari(item)));
    return { total: rows.length, ...hasil };
  }

  /** Catat pesan pada tabel push_pesan; kunci unik menjaga agar tidak diberitakan dua kali. */
  async function catatPesan(santriId, item, { langsung = false } = {}) {
    const kunci = item.kunci || `${item.jenis || "pesan"}-${santriId}-${Date.now()}`;
    const id = `pp-${Date.now().toString(36)}-${acak(3)}`;
    const baru = await tanya(
      `insert into push_pesan (id, santri_id, jenis, judul, isi, tautan, kunci, diproses)
       values ($1, $2, $3, $4, $5, $6, $7, case when $8 then now() else null end)
       on conflict (kunci) do nothing
       returning id`,
      [
        id,
        santriId,
        item.jenis || null,
        item.judul,
        item.isi || null,
        item.tautan || null,
        kunci,
        langsung,
      ],
    );
    if ((baru.rowCount ?? 0) === 0) return null;
    return {
      id,
      santri_id: santriId,
      jenis: item.jenis ?? null,
      judul: item.judul,
      isi: item.isi ?? null,
      tautan: item.tautan ?? null,
      kunci,
    };
  }

  /** Kirim satu pesan yang sudah tercatat di push_pesan ke HP wali pemiliknya. */
  async function kirimPesanTercatat(p) {
    /* Hanya perangkat yang terikat pada siswa ini — jadi tidak bertabrakan dengan wali lain. */
    const { rows } = await tanya(
      "select endpoint, p256dh, auth from push_langganan where santri_id = $1",
      [p.santri_id],
    );
    const teks = JSON.stringify(
      pesanDari({ jenis: p.jenis, judul: p.judul, isi: p.isi, tautan: p.tautan, kunci: p.kunci }),
    );
    const hasil = await kirimKe(rows, teks);
    await tanya("update push_pesan set terkirim = $2, gagal = $3, diproses = now() where id = $1", [
      p.id,
      hasil.terkirim,
      hasil.gagal,
    ]);
    return { perangkat: rows.length, ...hasil };
  }

  /**
   * Notifikasi pribadi untuk wali dari satu siswa/mahasiswa, dikirim saat itu juga.
   * Kuncinya dipakai sebagai penanda: peristiwa dengan kunci yang sama hanya dikirim sekali.
   */
  async function kirimKeSantri(santriId, item) {
    if (!santriId) return { perangkat: 0, terkirim: 0, gagal: 0, ulang: true };
    await siapkanKunci();

    const tercatat = await catatPesan(santriId, item, { langsung: true });
    if (!tercatat) return { perangkat: 0, terkirim: 0, gagal: 0, ulang: true };

    const hasil = await kirimPesanTercatat(tercatat);
    return { ...hasil, ulang: false };
  }

  /**
   * Masukkan notifikasi ke antrean tanpa mengirimnya sekarang. Dipakai untuk peristiwa
   * yang terjadi beramai-ramai (mis. tagihan bulanan otomatis untuk seluruh peserta),
   * supaya satu permintaan tidak menunggu lama. Antreannya dikerjakan kerjakanAntrean().
   */
  async function antreKeSantri(santriId, item) {
    if (!santriId) return { antre: false };
    await siapkanKunci();
    const tercatat = await catatPesan(santriId, item, { langsung: false });
    return { antre: Boolean(tercatat), id: tercatat?.id ?? null };
  }

  /**
   * Kerjakan sisa antrean notifikasi: dikirim bertahap dengan batas waktu, sisanya
   * dilanjutkan pada permintaan berikutnya sehingga tidak ada notifikasi yang hilang
   * bila layanan sempat tidur di tengah pengiriman.
   */
  async function kerjakanAntrean({ unitId = null, batas = 40, waktuMs = 15000 } = {}) {
    await siapkanKunci();
    const jumlah = Math.max(1, Math.min(200, Number(batas) || 40));
    const { rows } = await tanya(
      `select p.id, p.santri_id, p.jenis, p.judul, p.isi, p.tautan, p.kunci
         from push_pesan p
         left join santri s on s.id = p.santri_id
        where p.diproses is null and p.santri_id is not null
          and ($1::text is null or s.unit_id = $1)
        order by p.dibuat
        limit $2`,
      [unitId, jumlah],
    );
    if (rows.length === 0) return { dikerjakan: 0, terkirim: 0, gagal: 0, sisa: 0 };

    const batasWaktu = Date.now() + Math.max(1000, Number(waktuMs) || 15000);
    let terkirim = 0;
    let gagal = 0;
    let dikerjakan = 0;

    for (const p of rows) {
      if (Date.now() > batasWaktu) break;
      try {
        const hasil = await kirimPesanTercatat(p);
        terkirim += hasil.terkirim;
        gagal += hasil.gagal;
      } catch (e) {
        console.error("Antrean notifikasi gagal dikirim:", e.message);
        await tanya("update push_pesan set diproses = now(), gagal = gagal + 1 where id = $1", [p.id]).catch(() => {});
      }
      dikerjakan += 1;
    }

    const sisa = await tanya(
      "select count(*)::int as n from push_pesan where diproses is null and santri_id is not null",
    );
    return { dikerjakan, terkirim, gagal, sisa: sisa.rows[0].n };
  }

  /** Ringkasan untuk panel: jumlah perangkat, jumlah terikat wali, kiriman terakhir. */
  async function status() {
    await siapkanKunci();
    const jumlah = await tanya(
      `select count(*)::int as total,
              count(*) filter (where santri_id is not null)::int as terikat
         from push_langganan`,
    );
    const terakhir = await tanya(
      "select id, jenis, judul, dikirim from push_terkirim order by dikirim desc limit 1",
    );
    const pesan = await tanya(
      "select id, jenis, judul, terkirim, gagal, dibuat, diproses from push_pesan order by dibuat desc limit 1",
    );
    const antrean = await tanya(
      "select count(*)::int as n from push_pesan where diproses is null and santri_id is not null",
    );
    return {
      perangkat: jumlah.rows[0].total,
      perangkatTerikat: jumlah.rows[0].terikat,
      terakhir: terakhir.rows[0] || null,
      pesanTerakhir: pesan.rows[0] || null,
      antrean: antrean.rows[0].n,
    };
  }

  return {
    siapkanKunci,
    kirimKeSemua,
    kirimKeSantri,
    antreKeSantri,
    kerjakanAntrean,
    kirimKePerangkat,
    status,
    pesanDari,
  };
};
