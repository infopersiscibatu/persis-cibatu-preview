/**
 * Menjalankan penyiapan database dari terminal:
 *   node server/db/jalankan.js            → skema + perubahan + benih
 *   node server/db/jalankan.js --skema    → hanya skema & perubahan
 *   node server/db/jalankan.js --benih    → hanya pengisian benih
 *   node server/db/jalankan.js --periksa  → ringkasan isi tiap tabel
 */
const { pool, tanya } = require("./pool");
const { siapkanSkema, isiBenih } = require("./siapkan");

const TABEL = [
  "situs", "pengaturan", "pengguna", "sesi", "aktivitas", "media",
  "hero_slide", "statistik", "menu_cepat", "tautan_sosial", "profil", "pengurus", "halaman",
  "jenjang", "unit_pendidikan", "jurusan", "kategori",
  "berita", "artikel", "pengumuman", "agenda", "kajian", "kajian_rutin",
  "galeri_album", "galeri_foto",
  "spmb_info", "spmb_gelombang", "spmb_biaya", "spmb_persyaratan", "spmb_tahapan", "spmb_pendaftar",
  "tahun_ajaran", "santri", "mata_pelajaran", "nilai", "tahfidz_target", "setoran_tahfidz", "alumni",
  "metode_pembayaran", "tagihan", "pembayaran",
  "donasi_program", "donasi_metode", "donasi_rekening", "donasi_donatur", "donasi_riwayat", "donasi",
  "donasi_penyaluran", "donasi_kategori", "donatur",
  "topik_kontak", "kontak_unit", "pesan_kontak",
  "notifikasi", "notifikasi_dibaca", "push_langganan", "push_terkirim",
  "iklan",
];

async function ringkasan() {
  let total = 0;
  for (const tabel of TABEL) {
    const { rows } = await tanya(`select count(*)::int as n from ${tabel}`);
    total += rows[0].n;
    console.log(`${tabel.padEnd(20)} ${String(rows[0].n).padStart(5)}`);
  }
  console.log("-".repeat(27));
  console.log(`${"TOTAL".padEnd(20)} ${String(total).padStart(5)} baris · ${TABEL.length} tabel`);
}

async function utama() {
  const arg = process.argv[2] ?? "";
  if (arg === "--periksa") {
    await ringkasan();
  } else {
    if (process.argv.includes("--ulang")) {
      await tanya("delete from pengaturan where kunci = 'benih'");
      console.log("Tanda benih dihapus, data awal akan diisi ulang.");
    }
    if (arg !== "--benih") {
      await siapkanSkema(tanya);
      console.log("Skema & perubahan susulan dijalankan.");
    }
    if (arg !== "--skema") {
      const hasil = await isiBenih(tanya);
      console.log(hasil.diisi ? `Benih ${hasil.versi} diisi ke database.` : `Benih dilewati (sudah ada: ${hasil.versi}).`);
    }
    await ringkasan();
  }
  await pool.end();
}

utama().catch(async (e) => {
  console.error("Gagal:", e.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
