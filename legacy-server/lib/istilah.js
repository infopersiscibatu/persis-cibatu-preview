/**
 * Kosa kata istilah per jenjang pendidikan.
 *
 * Sekolah dan madrasah memakai penyebutan sekolah, sedangkan perguruan tinggi memakai
 * penyebutan kampus — misalnya Siswa → Mahasiswa, Sekolah → Kampus, SPP → UKT,
 * Mata Pelajaran → Mata Kuliah, NIS → NIM, Ekstrakurikuler → Unit Kegiatan Mahasiswa.
 * Istilah ini dikirim ke halaman unit pada saat wali/pengurus masuk, agar seluruh
 * kalimat di halaman itu ikut menyesuaikan jenjangnya.
 */

const ISTILAH_SEKOLAH = {
  unit: "sekolah",
  unitKumpulan: "Daftar Sekolah",
  unitLain: "Sekolah Lain",
  peserta: "Peserta didik",
  pengajar: "Guru & staf",
  rombel: "Rombongan belajar",
  kegiatan: "Ekstrakurikuler",
  jurusan: "Jurusan",
  materi: "Mata pelajaran khas",
  statUnit: "Sekolah",
  statPeserta: "Siswa & Santri",
  kode: "NPSN",
  identitas: "Identitas Sekolah",
  status: "Swasta – PERSIS",
  pimpinanUnit: "Kepala Sekolah",
  tahunAkademik: "Tahun Ajaran",
  sebutan: "Siswa",
  sebutanKecil: "siswa",
  pengajarTunggal: "Guru",
  pengajarTunggalKecil: "guru",
  wali: "Wali santri",
  waliKecil: "wali santri",
  iuran: "SPP",
  nomorInduk: "NIS",
  penerimaan: "SPMB",
  calon: "Calon siswa",
  calonKecil: "calon siswa",
  materiKecil: "mata pelajaran",
  portal: "Portal wali santri",
};

const ISTILAH_MADRASAH = {
  ...ISTILAH_SEKOLAH,
  unit: "madrasah",
  unitKumpulan: "Daftar Madrasah",
  unitLain: "Madrasah Lain",
  peserta: "Santri",
  pengajar: "Ustadz & staf",
  rombel: "Kelas diniyyah",
  kegiatan: "Kegiatan Diniyyah",
  jurusan: "Program",
  materi: "Mata pelajaran",
  statUnit: "Madrasah",
  statPeserta: "Santri",
  kode: "Nomor Izin",
  identitas: "Identitas Madrasah",
  status: "Non-formal – PERSIS",
  pimpinanUnit: "Kepala Madrasah",
  tahunAkademik: "Tahun Ajaran",
  sebutan: "Santri",
  sebutanKecil: "santri",
  pengajarTunggal: "Ustadz",
  pengajarTunggalKecil: "ustadz",
  calon: "Calon santri",
  calonKecil: "calon santri",
};

const ISTILAH_KAMPUS = {
  ...ISTILAH_SEKOLAH,
  unit: "kampus",
  unitKumpulan: "Daftar Kampus",
  unitLain: "Kampus Lain",
  peserta: "Mahasiswa",
  pengajar: "Dosen & staf",
  rombel: "Kelas kuliah",
  kegiatan: "Unit Kegiatan Mahasiswa",
  jurusan: "Program Studi",
  materi: "Mata kuliah",
  statUnit: "Kampus",
  statPeserta: "Mahasiswa",
  kode: "Kode PT",
  identitas: "Identitas Kampus",
  status: "Perguruan Tinggi – PERSIS",
  pimpinanUnit: "Rektor",
  tahunAkademik: "Tahun Akademik",
  sebutan: "Mahasiswa",
  sebutanKecil: "mahasiswa",
  pengajarTunggal: "Dosen",
  pengajarTunggalKecil: "dosen",
  wali: "Wali mahasiswa",
  waliKecil: "wali mahasiswa",
  iuran: "UKT",
  nomorInduk: "NIM",
  penerimaan: "PMB",
  calon: "Calon mahasiswa",
  calonKecil: "calon mahasiswa",
  materiKecil: "mata kuliah",
  portal: "Portal wali mahasiswa",
};

/** Kosa kata untuk sebuah baris jenjang (slug "pt" = perguruan tinggi). */
function istilahUntukJenjang(row) {
  const slug = String(row?.slug ?? "").trim().toLowerCase();
  const nama = String(row?.nama ?? "").trim().toLowerCase();
  if (slug === "pt" || /tinggi|kampus/.test(nama)) return ISTILAH_KAMPUS;
  if (slug === "mdt" || /diniyyah/.test(nama)) return ISTILAH_MADRASAH;
  return ISTILAH_SEKOLAH;
}

module.exports = { ISTILAH_SEKOLAH, ISTILAH_MADRASAH, ISTILAH_KAMPUS, istilahUntukJenjang };
