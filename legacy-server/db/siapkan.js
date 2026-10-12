/**
 * Penyiapan database: menjalankan skema, perubahan susulan, lalu mengisi data
 * awal (benih) sekali saja.
 */
const fs = require("fs");
const path = require("path");

const AKAR = __dirname;

function bacaBerkas(nama) {
  const berkas = path.join(AKAR, nama);
  return fs.existsSync(berkas) ? fs.readFileSync(berkas, "utf8") : "";
}

async function jalankanSql(tanya, nama) {
  const isi = bacaBerkas(nama);
  if (!isi.trim()) return;
  await tanya(isi);
}

async function tandai(tanya, kunci, nilai) {
  await tanya(
    `insert into pengaturan (kunci, nilai, kelompok) values ($1, $2::jsonb, 'sistem')
     on conflict (kunci) do update set nilai = excluded.nilai`,
    [kunci, JSON.stringify(nilai)],
  );
}

async function bacaTanda(tanya, kunci) {
  const { rows } = await tanya("select nilai from pengaturan where kunci = $1", [kunci]);
  return rows[0] ? rows[0].nilai : null;
}

/** Skema + perubahan susulan. Aman dipanggil setiap kali layanan menyala. */
async function siapkanSkema(tanya) {
  await jalankanSql(tanya, "skema.sql");
  await jalankanSql(tanya, "perubahan.sql");
}

/** Isi data awal dari benih.json — hanya sekali (ditandai di tabel pengaturan). */
async function isiBenih(tanya) {
  const { VERSI_BENIH: VERSI_SEKARANG } = require("./benih.js");
  const tanda = await bacaTanda(tanya, "benih");
  if (tanda && tanda.versi === VERSI_SEKARANG) return { diisi: false, versi: tanda.versi };

  const berkas = path.join(AKAR, "benih.json");
  if (!fs.existsSync(berkas)) return { diisi: false, versi: null };
  const data = JSON.parse(fs.readFileSync(berkas, "utf8"));

  const { isiSemua, VERSI_BENIH } = require("./benih.js");
  const versiSaatIni = tanda && tanda.versi ? String(tanda.versi) : null;
  /* Pertama kali: isi semua. Sudah pernah (versi lama): hanya bagian yang baru. */
  const hanyaVersi = versiSaatIni ? VERSI_BENIH : undefined;
  const laporan = await isiSemua({
    tanya,
    data,
    hanyaVersi,
    idBaru: (awalan) => `${awalan}-${Math.random().toString(36).slice(2, 8)}`,
  });
  await tandai(tanya, "benih", {
    versi: VERSI_BENIH,
    sebelumnya: versiSaatIni,
    diisi: new Date().toISOString(),
  });
  return { diisi: true, versi: VERSI_BENIH, baru: hanyaVersi ?? null, laporan };
}

async function siapkanDatabase(tanya) {
  await siapkanSkema(tanya);
  const hasil = await isiBenih(tanya);
  return hasil;
}

module.exports = { siapkanDatabase, siapkanSkema, isiBenih, bacaTanda, tandai };
