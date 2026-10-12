// @ts-nocheck
/**
 * Penyiapan database (versi Lovable Cloud). Skema sudah dipasang lewat migrasi;
 * di sini hanya pengisian data awal (benih) sekali saja, sama seperti aslinya.
 */
import benihModul from "./benih.js";
import dataBenih from "./benih.json";

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

async function siapkanSkema() {}

async function isiBenih(tanya) {
  const { isiSemua, VERSI_BENIH } = benihModul;
  const tanda = await bacaTanda(tanya, "benih");
  if (tanda && tanda.versi === VERSI_BENIH) return { diisi: false, versi: tanda.versi };
  const versiSaatIni = tanda && tanda.versi ? String(tanda.versi) : null;
  const hanyaVersi = versiSaatIni ? VERSI_BENIH : undefined;
  const laporan = await isiSemua({
    tanya,
    data: dataBenih,
    hanyaVersi,
    idBaru: (awalan) => `${awalan}-${Math.random().toString(36).slice(2, 8)}`,
  });
  await tandai(tanya, "benih", { versi: VERSI_BENIH, sebelumnya: versiSaatIni, diisi: new Date().toISOString() });
  return { diisi: true, versi: VERSI_BENIH, baru: hanyaVersi ?? null, laporan };
}

async function siapkanDatabase(tanya) {
  await siapkanSkema(tanya);
  return isiBenih(tanya);
}

export default { siapkanDatabase, siapkanSkema, isiBenih, bacaTanda, tandai };
