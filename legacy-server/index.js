/**
 * Layanan PC PERSIS Cibatu: notifikasi push, database, dan penyimpanan berkas.
 *
 *  - Database  : menyiapkan skema + mengisi data awal (benih) sekali saja.
 *  - Push      : menyimpan langganan perangkat & mengirim notifikasi ke layar HP.
 *  - Penyimpanan: menerima unggahan foto/dokumen dari halaman admin.
 *
 * Halaman admin belum dibangun; endpoint di sini adalah fondasinya.
 */
const express = require("express");

const { tanya } = require("./db/pool");
const bantuanPush = require("./lib/push");
const bantuanTagihanBulanan = require("./lib/tagihanBulanan");
const { siapkanDatabase } = require("./db/siapkan");
const storage = require("./lib/storage");
const pasangRuteAdmin = require("./ruang-admin");
const pasangRuteSpmb = require("./ruang-spmb");
const pasangRuteGaleri = require("./ruang-galeri");
const pasangRuteBerita = require("./ruang-berita");
const pasangRuteKajian = require("./ruang-kajian");
const pasangRuteArtikel = require("./ruang-artikel");
const pasangRuteKontak = require("./ruang-kontak");
const pasangRutePengumuman = require("./ruang-pengumuman");
const pasangRuteAgenda = require("./ruang-agenda");
const pasangRuteBeranda = require("./ruang-beranda");
const pasangRuteIklan = require("./ruang-iklan");
const { pasangRuteLogin, pasangRuteUnit, pasangRuteLoginUnit } = require("./ruang-akun");
const { pasangRuteUnitSpmb } = require("./ruang-unit");
const pasangRuteUnitSekolah = require("./ruang-unit-sekolah");
const pasangRuteUnitTataUsaha = require("./ruang-unit-tata-usaha");
const pasangRuteWali = require("./ruang-wali");
const pasangRuteZis = require("./ruang-zis");
const pasangRuteDonasi = require("./ruang-donasi");

const PORT = Number(process.env.PORT || 8080);
const PUSH_TOKEN = process.env.PUSH_TOKEN || "";
const TOKEN_ADMIN = process.env.ADMIN_TOKEN || "";
const LABEL_LEMBAGA = "PC PERSIS Cibatu";

/* ---------------------------------- push ---------------------------------- */

/* Notifikasi HP ditangani modul bersama; rute di bawah ini memakai modul itu. */
const push = bantuanPush(tanya);

/* Tagihan bulanan otomatis beserta notifikasi tagihannya (lihat lib/tagihanBulanan.js). */
const tagihanBulanan = bantuanTagihanBulanan(tanya, push);

/* ---------------------------------- aplikasi -------------------------------- */

const app = express();
app.disable("x-powered-by");

/* Setoran wali boleh membawa foto bukti transfer, jadi badan permintaannya lebih besar. */
app.use("/api/wali/bayar", express.json({ limit: "40mb" }));
/* Foto profil wali dikirim sebagai base64, jadi batasnya dinaikkan. */
app.use("/api/wali/foto", express.json({ limit: "40mb" }));
app.use(express.json({ limit: "2mb" }));

/** Permintaan dari halaman situs sendiri (bukan dari situs lain / alat luar). */
function dariSitusSendiri(req) {
  const asal = req.get("origin");
  const situs = req.get("sec-fetch-site");
  if (situs === "same-origin") return true;
  if (!asal) return false;
  try {
    const u = new URL(asal);
    return u.host === req.get("host");
  } catch {
    return false;
  }
}

function bolehMenulis(req, res) {
  if (TOKEN_ADMIN && req.get("x-admin-token") === TOKEN_ADMIN) return true;
  if (dariSitusSendiri(req)) return true;
  res.status(403).json({ pesan: "Permintaan ditolak: hanya bisa dari halaman situs ini." });
  return false;
}

app.get("/api/health", async (_req, res) => {
  try {
    const { rows } = await tanya("select now() as waktu");
    res.json({ ok: true, layanan: "persis-cibatu", waktu: rows[0].waktu });
  } catch (e) {
    res.status(503).json({ ok: false, pesan: e.message });
  }
});

/* --------------------------- push (notifikasi HP) --------------------------- */

app.get("/api/push/kunci", async (_req, res) => {
  try {
    const kunci = await push.siapkanKunci();
    res.json({ kunci: kunci.publicKey });
  } catch (e) {
    res.status(500).json({ pesan: e.message });
  }
});

app.post("/api/push/daftar", async (req, res) => {
  try {
    const { endpoint, kunci, auth, perangkat } = req.body || {};
    if (!endpoint || !kunci || !auth) return res.status(400).json({ pesan: "Data langganan tidak lengkap." });
    await push.siapkanKunci();
    await tanya(
      `insert into push_langganan (endpoint, p256dh, auth, perangkat, diubah)
       values ($1, $2, $3, $4, now())
       on conflict (endpoint) do update
         set p256dh = excluded.p256dh, auth = excluded.auth,
             perangkat = excluded.perangkat, diubah = now()`,
      [endpoint, kunci, auth, perangkat ? String(perangkat).slice(0, 160) : null],
    );
    const { rows } = await tanya("select count(*)::int as jumlah from push_langganan");
    res.json({ ok: true, jumlah: rows[0].jumlah });
  } catch (e) {
    res.status(500).json({ pesan: e.message });
  }
});

app.post("/api/push/hapus", async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ pesan: "Endpoint tidak ada." });
    await tanya("delete from push_langganan where endpoint = $1", [endpoint]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ pesan: e.message });
  }
});

app.post("/api/push/uji", async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ pesan: "Endpoint tidak ada." });
    const hasil = await push.kirimKePerangkat(endpoint, {
      jenis: "uji",
      judul: `Uji notifikasi \u00b7 ${LABEL_LEMBAGA}`,
      isi: "Notifikasi uji coba. Postingan terbaru akan muncul seperti ini di layar HP Anda.",
      tautan: "/",
      kunci: `uji-${Date.now()}`,
    });
    if (!hasil.ada) return res.status(404).json({ pesan: "Perangkat ini belum terdaftar." });
    res.json({ ok: true });
  } catch (e) {
    res.status(e && e.status ? e.status : 500).json({
      pesan:
        e && e.status === 410
          ? "Langganan perangkat ini sudah tidak berlaku. Aktifkan ulang notifikasi."
          : e.message,
    });
  }
});

/** Dipanggil setiap situs dibuka; bila ada postingan baru, semua perangkat diberi tahu. */
app.post("/api/push/cek", async (req, res) => {
  try {
    const item = req.body || {};
    if (!item.id || !item.judul) return res.status(400).json({ pesan: "Data postingan tidak lengkap." });
    await push.siapkanKunci();
    const { rows } = await tanya("select id from push_terkirim order by dikirim desc limit 1");
    if (rows.length > 0 && rows[0].id === item.id) return res.json({ baru: false, id: item.id });
    await tanya(
      `insert into push_terkirim (id, jenis, judul) values ($1, $2, $3)
       on conflict (id) do update set jenis = excluded.jenis, judul = excluded.judul, dikirim = now()`,
      [String(item.id).slice(0, 120), String(item.jenis || "").slice(0, 40), String(item.judul).slice(0, 300)],
    );
    const hasil = await push.kirimKeSemua(item);
    res.json({ baru: true, id: item.id, ...hasil });
  } catch (e) {
    res.status(500).json({ pesan: e.message });
  }
});

/** Kirim manual dari luar (webhook/integrasi); perlu PUSH_TOKEN. */
app.post("/api/push/kirim", async (req, res) => {
  try {
    if (!PUSH_TOKEN) return res.status(503).json({ pesan: "PUSH_TOKEN belum diatur di lingkungan aplikasi." });
    if (req.get("x-push-token") !== PUSH_TOKEN) return res.status(403).json({ pesan: "Token tidak sesuai." });
    const hasil = await push.kirimKeSemua(req.body || {});
    res.json({ ok: true, ...hasil });
  } catch (e) {
    res.status(500).json({ pesan: e.message });
  }
});

app.get("/api/push/status", async (_req, res) => {
  try {
    const ringkas = await push.status();
    res.json({ ...ringkas, tokenManual: Boolean(PUSH_TOKEN) });
  } catch (e) {
    res.status(500).json({ pesan: e.message });
  }
});

/* --------------------------------- database -------------------------------- */

const TABEL_PENTING = [
  "situs", "pengaturan", "pengguna", "media", "hero_slide", "statistik", "menu_cepat", "tautan_sosial",
  "profil", "pengurus", "halaman", "jenjang", "unit_pendidikan", "jurusan", "kategori",
  "berita", "artikel", "pengumuman", "agenda", "kajian", "kajian_rutin", "galeri_album", "galeri_foto",
  "spmb_info", "spmb_gelombang", "spmb_biaya", "spmb_persyaratan", "spmb_tahapan", "spmb_pendaftar",
  "tahun_ajaran", "santri", "mata_pelajaran", "nilai", "tahfidz_target", "setoran_tahfidz", "alumni",
  "metode_pembayaran", "tagihan", "pembayaran", "donasi_program", "donasi_metode", "donasi_rekening",
  "donasi_donatur", "donasi_riwayat", "donasi", "topik_kontak", "kontak_unit", "pesan_kontak",
  "notifikasi", "notifikasi_dibaca", "push_langganan", "push_pesan",
];

app.get("/api/db/status", async (_req, res) => {
  try {
    const isi = [];
    let total = 0;
    for (const tabel of TABEL_PENTING) {
      const { rows } = await tanya(`select count(*)::int as n from ${tabel}`);
      total += rows[0].n;
      isi.push({ tabel, baris: rows[0].n });
    }
    res.json({ ok: true, tabel: isi.length, total_baris: total, isi });
  } catch (e) {
    res.status(500).json({ pesan: e.message });
  }
});

/* ------------------------------ rute panel admin ---------------------------- */

/*
 * Login lebih dulu: rute masuk/keluar/saya dibuka tanpa sesi, lalu penjaga sesi
 * dipasang sehingga seluruh permintaan /api/admin berikutnya wajib bertoken.
 */
const akses = pasangRuteLogin(app, { tanya });
app.use("/api/admin", akses.penjagaSesi);

pasangRuteAdmin(app, { tanya });
pasangRuteSpmb(app, { tanya });
pasangRuteGaleri(app, { tanya });
pasangRuteBerita(app, { tanya });
pasangRuteKajian(app, { tanya });
pasangRuteArtikel(app, { tanya });
pasangRuteKontak(app, { tanya });
pasangRuteDonasi(app, { tanya });
pasangRutePengumuman(app, { tanya });
pasangRuteAgenda(app, { tanya });
pasangRuteBeranda(app, { tanya });
pasangRuteIklan(app, { tanya });
pasangRuteUnit(app, { tanya });
const unit = pasangRuteLoginUnit(app, { tanya });
app.use("/api/unit", unit.penjagaUnit);
pasangRuteUnitSpmb(app, { tanya });
pasangRuteUnitSekolah(app, { tanya, push });
pasangRuteUnitTataUsaha(app, { tanya, push, tagihanBulanan });
pasangRuteZis(app, { tanya });
pasangRuteWali(app, { tanya, storage, push, tagihanBulanan });

/* ---------------------------------- admin --------------------------------- */

/** Statistik untuk halaman admin. Semua angka dihitung dari database. */
app.get("/api/admin/statistik", async (_req, res) => {
  try {
    const konten = (
      await tanya(`select
        (select count(*)::int from berita)     as berita,
        (select count(*)::int from artikel)    as artikel,
        (select count(*)::int from pengumuman) as pengumuman,
        (select count(*)::int from agenda)     as agenda,
        (select count(*)::int from kajian)     as kajian,
        (select count(*)::int from galeri_foto) as galeri,
        (select count(*)::int from kategori)   as kategori`)
    ).rows[0];

    const lembaga = (
      await tanya(`select
        (select count(*)::int from unit_pendidikan where aktif)                            as sekolah,
        (select count(*)::int from jenjang where aktif and hitung_jenjang)                 as jenjang,
        (select count(*)::int from santri s join jenjang j on j.id = s.jenjang_id
          where s.status in ('aktif','calon') and j.slug <> 'pt')                          as siswa,
        (select count(*)::int from santri s join jenjang j on j.id = s.jenjang_id
          where s.status in ('aktif','calon') and j.slug = 'pt')                           as mahasiswa,
        (select count(*)::int from santri where status in ('aktif','calon'))               as peserta,
        (select count(*)::int from santri where status = 'lulus')                          as lulus,
        (select count(*)::int from alumni where aktif)                                     as alumni,
        (select count(*)::int from santri where status = 'aktif')                          as santri_aktif,
        (select count(distinct tahun_lulus)::int from alumni)                              as angkatan_alumni`)
    ).rows[0];

    res.json({ ok: true, diperbarui: new Date().toISOString(), konten, lembaga });
  } catch (e) {
    res.status(500).json({ pesan: e.message });
  }
});

/* --------------------------------- penyimpanan ------------------------------ */

app.get("/api/storage/status", (_req, res) => {
  res.json({ ok: true, ...storage.status() });
});

app.get("/api/media", async (req, res) => {
  try {
    const folder = req.query.folder ? String(req.query.folder) : null;
    const { rows } = await tanya(
      `select id, kunci, url, nama_asli, tipe, ukuran::int as ukuran, lebar, tinggi, folder, alt, keterangan, dibuat
         from media
        where ($1::text is null or folder = $1)
        order by dibuat desc
        limit 200`,
      [folder],
    );
    res.json({ ok: true, jumlah: rows.length, media: rows });
  } catch (e) {
    res.status(500).json({ pesan: e.message });
  }
});

/** Unggah berkas (foto/dokumen) dari halaman admin. Badan permintaan besar. */
app.post("/api/unggah", express.json({ limit: "40mb" }), async (req, res) => {
  if (!bolehMenulis(req, res)) return;
  try {
    const { nama, tipe, data, folder, alt, keterangan, lebar, tinggi } = req.body || {};
    const berkas = await storage.unggah({ nama, tipe, data, folder, alt, keterangan });
    const id = `md-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const { rows } = await tanya(
      `insert into media (id, kunci, url, nama_asli, tipe, ukuran, lebar, tinggi, folder, alt, keterangan)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       returning id, kunci, url, nama_asli, tipe, ukuran::int as ukuran, lebar, tinggi, folder, alt, keterangan, dibuat`,
      [
        id,
        berkas.kunci,
        berkas.url,
        berkas.nama,
        berkas.tipe,
        berkas.ukuran,
        Number(lebar) || null,
        Number(tinggi) || null,
        String(folder || "umum").replace(/[^a-z0-9\-_/]+/gi, "") || "umum",
        alt ? String(alt).slice(0, 200) : null,
        keterangan ? String(keterangan).slice(0, 300) : null,
      ],
    );
    res.json({ ok: true, media: rows[0] });
  } catch (e) {
    res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
  }
});

/** Hapus berkas dari penyimpanan dan dari daftar media. */
app.post("/api/media/hapus", async (req, res) => {
  if (!bolehMenulis(req, res)) return;
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ pesan: "Id media tidak ada." });
    const { rows } = await tanya("select kunci from media where id = $1", [id]);
    if (rows.length === 0) return res.status(404).json({ pesan: "Media tidak ditemukan." });
    await storage.hapus(rows[0].kunci).catch((e) => console.error("Gagal menghapus berkas:", e.message));
    await tanya("delete from media where id = $1", [id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ pesan: e.message });
  }
});

/** Badan permintaan terlalu besar atau bukan JSON yang sah. */
app.use((e, req, res, next) => {
  if (!e) return next();
  if (e.type === "entity.too.large") {
    return res.status(413).json({ pesan: "Berkas terlalu besar. Batas maksimal 25 MB per berkas." });
  }
  if (e instanceof SyntaxError) return res.status(400).json({ pesan: "Format permintaan tidak dikenali." });
  console.error("Kesalahan permintaan:", e.message);
  res.status(500).json({ pesan: "Terjadi kesalahan pada layanan." });
});

/* ---------------------------------- mulai ---------------------------------- */

siapkanDatabase(tanya)
  .then(async (hasil) => {
    console.log(
      hasil.diisi ? `Database siap & data awal ${hasil.versi} diisi.` : `Database siap (data awal ${hasil.versi ?? "belum ada"}).`,
    );
    const bawaan = await akses.siapkanAkses();
    if (bawaan.dibuat) console.log("Akun admin dibuat dengan PIN bawaan 8081.");
    await push.siapkanKunci();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Layanan PC PERSIS Cibatu siap pada port ${PORT}.`);
    });
  })
  .catch((e) => {
    console.error("Gagal menyiapkan layanan:", e.message);
    process.exit(1);
  });
