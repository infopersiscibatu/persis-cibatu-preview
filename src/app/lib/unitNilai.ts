import { mintaUnit } from "./unitSpmb";

/**
 * Nilai rapor dan catatan tahfidz satu siswa/mahasiswa untuk halaman Admin Sekolah.
 *
 * Semua isian disimpan sebagai rancangan lebih dulu. Setelah ditekan Terbitkan, barisnya
 * tampil di portal wali dan notifikasi push dikirim ke HP wali yang terikat pada siswa itu.
 */

export type NilaiUnit = {
  id: string;
  mapelId: string;
  mapel: string;
  semester: string;
  nilai: number;
  predikat: string;
  terbit: boolean;
  terbitPada: string | null;
  diperbarui: string | null;
};

export type SetoranUnit = {
  id: string;
  tanggal: string | null;
  juz: number | null;
  /** Surat Al-Qur'an dan rentang ayat yang disetor. */
  surah: number | null;
  ayatMulai: number | null;
  ayatSelesai: number | null;
  /** Jumlah ayat yang disetor pada rentang itu. */
  jumlahAyat: number | null;
  materi: string;
  jenis: string;
  penilai: string;
  nilai: string;
  catatan: string;
  terbit: boolean;
  terbitPada: string | null;
};

export type MuatanNilai = {
  ok: boolean;
  semesterBerjalan?: string;
  siswa: { id: string; nama: string; kelas: string; jenjang: string };
  /** Mata pelajaran/mata kuliah yang terdaftar pada jenjang ini (menu Mata Pelajaran). */
  mapel: { id: string; nama: string }[];
  nilai: NilaiUnit[];
  /** Tahfidz hanya berisi catatan setoran — tanpa capaian/target. */
  tahfidz: { setoran: SetoranUnit[] };
  ringkas: {
    nilai: { jumlah: number; terbit: number; menunggu: number };
    tahfidz: { setoran: number; menunggu: number };
  };
  /** Keterangan hasil, termasuk berapa HP wali yang menerima notifikasi. */
  pesan?: string;
  jumlah?: number;
  notifikasi?: { perangkat: number; terkirim: number } | null;
};

export const ambilNilaiSiswa = (santriId: string) =>
  mintaUnit<MuatanNilai>(`/api/unit/sekolah/nilai/${encodeURIComponent(santriId)}`);

export const simpanNilaiUnit = (isian: {
  santriId: string;
  /** Mata pelajaran diambil dari daftar menu Mata Pelajaran. */
  mapelId: string;
  nilai: string;
  predikat?: string;
  semester?: string;
}) =>
  mintaUnit<MuatanNilai>("/api/unit/sekolah/nilai", {
    method: "POST",
    body: JSON.stringify(isian),
  });

export const ubahNilaiUnit = (id: string, isian: { nilai: string; predikat?: string; semester?: string }) =>
  mintaUnit<MuatanNilai>(`/api/unit/sekolah/nilai/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(isian),
  });

export const hapusNilaiUnit = (id: string) =>
  mintaUnit<MuatanNilai>(`/api/unit/sekolah/nilai/${encodeURIComponent(id)}`, { method: "DELETE" });

/** Terbitkan seluruh nilai yang masih berupa rancangan, lalu beri tahu HP wali. */
export const terbitkanNilaiUnit = (santriId: string) =>
  mintaUnit<MuatanNilai>("/api/unit/sekolah/nilai/terbit", {
    method: "POST",
    body: JSON.stringify({ santriId }),
  });

export const tambahSetoranTahfidz = (isian: {
  santriId: string;
  tanggal: string;
  /** Nomor surat 1–114 beserta ayat awal dan ayat akhir yang disetor. */
  surah: number;
  ayatMulai: number;
  ayatSelesai: number;
  /** Tulisan setoran, mis. "Al-Baqarah ayat 1–20". */
  materi: string;
  jenis: string;
  penilai: string;
  nilai: string;
  catatan: string;
}) =>
  mintaUnit<MuatanNilai>("/api/unit/sekolah/tahfidz", {
    method: "POST",
    body: JSON.stringify(isian),
  });

export const hapusSetoranTahfidz = (id: string) =>
  mintaUnit<MuatanNilai>(`/api/unit/sekolah/tahfidz/${encodeURIComponent(id)}`, { method: "DELETE" });

/** Terbitkan target dan catatan setoran tahfidz, lalu beri tahu HP wali. */
export const terbitkanTahfidzUnit = (santriId: string) =>
  mintaUnit<MuatanNilai>("/api/unit/sekolah/tahfidz/terbit", {
    method: "POST",
    body: JSON.stringify({ santriId }),
  });

/* --------------------------- mata pelajaran/mata kuliah --------------------------- */

/** Satu mata pelajaran terdaftar pada jenjang unit ini. */
export type MapelUnit = {
  id: string;
  nama: string;
  kode: string;
  kelompok: string;
  aktif: boolean;
  /** Berapa nilai yang sudah memakai mata pelajaran ini di unit ini. */
  jumlahNilai: number;
  jumlahTerbit: number;
};

export type JawabanMapel = {
  ok: boolean;
  mapel: MapelUnit[];
  pesan?: string;
};

export const daftarMapelUnit = () => mintaUnit<JawabanMapel>("/api/unit/sekolah/mapel");

export const tambahMapelUnit = (isian: { nama: string; kode?: string; kelompok?: string }) =>
  mintaUnit<JawabanMapel>("/api/unit/sekolah/mapel", { method: "POST", body: JSON.stringify(isian) });

export const ubahMapelUnit = (id: string, isian: { nama: string; kode?: string; kelompok?: string; aktif?: boolean }) =>
  mintaUnit<JawabanMapel>(`/api/unit/sekolah/mapel/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(isian),
  });

export const hapusMapelUnit = (id: string) =>
  mintaUnit<JawabanMapel>(`/api/unit/sekolah/mapel/${encodeURIComponent(id)}`, { method: "DELETE" });
