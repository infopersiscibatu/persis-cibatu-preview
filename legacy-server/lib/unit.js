/**
 * Bantuan bersama halaman unit sekolah: memastikan sesi yang masuk memang milik
 * sebuah sekolah (bukan akun ZIS), lalu mengembalikan sesinya.
 */
module.exports = function bantuanUnit(tanya) {
  const satu = async (sql, nilai) => (await tanya(sql, nilai)).rows[0] ?? null;

  /** Sesi unit sekolah yang sah; bila bukan, balasannya sudah dikirim dan hasilnya null. */
  const sekolahWajib = (req, res) => {
    const sesi = req.unit;
    if (!sesi || !sesi.unit_id) {
      res.status(403).json({ pesan: "Halaman ini khusus untuk akun sekolah." });
      return null;
    }
    return sesi;
  };

  const angka = (nilai) => Number(nilai ?? 0);

  /**
   * Id angka (bigint) dari alamat halaman. Id yang bukan angka dikembalikan null supaya
   * permintaannya dijawab "'tidak ditemukan" alih-alih gagal di basis data.
   */
  const idAngka = (nilai) => {
    const teks = String(nilai ?? "").trim();
    if (!/^[0-9]{1,18}$/.test(teks)) return null;
    const angka10 = Number(teks);
    return Number.isSafeInteger(angka10) ? angka10 : null;
  };

  /** Jawab 404 untuk id angka yang tidak sah; hasilnya null bila idnya sah. */
  const angkaWajib = (req, res, pesan) => {
    const id = idAngka(req.params.id);
    if (id === null) res.status(404).json({ pesan });
    return id;
  };

  return { satu, sekolahWajib, angka, idAngka, angkaWajib };
};
