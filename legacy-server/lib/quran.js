/**
 * Jumlah ayat setiap surat Al-Qur'an (surat 1 – 114) untuk memeriksa setoran tahfidz.
 *
 * Borang setoran di Admin Sekolah memakai daftar surat di sisi tampilan
 * (src/data/quran.ts); di sini hanya jumlah ayatnya, supaya server dapat memastikan
 * ayat awal dan ayat akhir yang dikirim memang ada pada surat yang dipilih.
 */
const AYAT_PER_SURAH = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77,
  227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62,
  55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19,
  36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

/** Jumlah ayat satu surat, atau null bila nomor suratnya tidak sah. */
function jumlahAyat(nomor) {
  const n = Number.parseInt(String(nomor ?? ""), 10);
  if (!Number.isFinite(n) || n < 1 || n > AYAT_PER_SURAH.length) return null;
  return AYAT_PER_SURAH[n - 1];
}

/**
 * Memeriksa pilihan surat dan ayat setoran.
 * Hasilnya `{ sah, surah, mulai, selesai, ayat }` — `ayat` adalah jumlah ayat yang disetor.
 */
function periksaSetoran({ surah, ayatMulai, ayatSelesai } = {}) {
  const nomor = Number.parseInt(String(surah ?? ""), 10);
  const batas = jumlahAyat(nomor);
  if (batas === null) return { sah: false, pesan: "Surat Al-Qur'an belum dipilih." };

  const mulai = Number.parseInt(String(ayatMulai ?? ""), 10);
  if (!Number.isFinite(mulai) || mulai < 1) return { sah: false, pesan: "Ayat awal setoran belum diisi." };
  if (mulai > batas) return { sah: false, pesan: `Ayat awal melebihi jumlah ayat surat ini (${batas} ayat).` };

  const selesaiMentah = String(ayatSelesai ?? "").trim();
  const selesai = selesaiMentah ? Number.parseInt(selesaiMentah, 10) : mulai;
  if (!Number.isFinite(selesai) || selesai < mulai) {
    return { sah: false, pesan: "Ayat akhir harus sama atau setelah ayat awal." };
  }
  if (selesai > batas) return { sah: false, pesan: `Ayat akhir melebihi jumlah ayat surat ini (${batas} ayat).` };

  return { sah: true, surah: nomor, mulai, selesai, ayat: selesai - mulai + 1, batas };
}

module.exports = { AYAT_PER_SURAH, jumlahAyat, periksaSetoran };
