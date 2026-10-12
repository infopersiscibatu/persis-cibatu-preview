import { mintaUnit } from "./unitSpmb";

/** Data halaman Admin Sekolah — semuanya milik sekolah yang sedang masuk. */

export type KelasSiswa = { kelas: string; jumlah: number };
export type TahunAlumni = { tahun: string; jumlah: number };

export type StatistikSekolah = {
  ok: boolean;
  diperbarui: string;
  unit: {
    id: string;
    nama: string;
    slug: string;
    jenjang: string;
    jenjangNama: string;
    daerah: string;
    alamat: string;
    pimpinan: string;
    akreditasi: string;
    npsn: string;
    berdiri: string;
    jam: string;
    status: string;
    rombel: number;
    guru: number;
    staf: number;
    jurusan: number;
    ekstrakurikuler: number;
  };
  siswa: {
    aktif: number;
    kelas: number;
    calon: number;
    lulus: number;
    perKelas: KelasSiswa[];
  };
  alumni: {
    total: number;
    angkatan: number;
    terakhir: string;
    perTahun: TahunAlumni[];
  };
  pengurusSekolah: string;
};

export const ambilStatistikSekolah = () => mintaUnit<StatistikSekolah>("/api/unit/sekolah/statistik");

/* -------------------------- siswa & alumni Admin Sekolah -------------------------- */

export const STATUS_SISWA: { id: string; label: string }[] = [
  { id: "aktif", label: "Aktif" },
  { id: "lulus", label: "Lulus" },
  { id: "pindah", label: "Pindah" },
  { id: "nonaktif", label: "Nonaktif" },
];

export const labelStatusSiswa = (id: string) => STATUS_SISWA.find((s) => s.id === id)?.label ?? id;

/*
 * Data siswa sengaja ringkas: nama lengkap, jenjang pendidikan dan nama sekolah
 * (mengikuti sekolah yang sedang dibuka), jurusan bila ada, nama orang tua, dan
 * nomor WhatsApp. Bila siswa masuk dari verifikasi SPMB, isian itu terisi sendiri.
 */
export type SiswaUnit = {
  id: string;
  nama: string;
  program: string;
  /** Kelas/rombel peserta didik, dipakai panel nilai & tahfidz. */
  kelas: string;
  waliNama: string;
  waliTelepon: string;
  /** PIN yang dipakai wali santri untuk masuk ke portal wali. */
  pinWali: string;
  /** Nama jurusan (program) yang tercatat, bila ada pada jenjang ini. */
  programNama: string;
  /** Foto profil yang diunggah wali, bila sudah ada. */
  foto: string;
  jenjang: string;
  sekolah: string;
  status: string;
  /** Sudah tercatat di daftar alumni. */
  alumni: boolean;
  /** Jumlah tagihan yang belum lunas; kelulusan tertahan selama masih ada. */
  tagihanTerbuka: number;
  dariSpmb: boolean;
  dibuat: string | null;
  diperbarui: string | null;
};

export type IsianSiswa = {
  nama: string;
  program: string;
  waliNama: string;
  waliTelepon: string;
  pinWali: string;
};

/** Program jurusan sebuah unit: slug yang disimpan dan namanya untuk ditampilkan. */
export type ProgramUnit = { slug: string; nama: string };

export type SekolahSiswa = { nama: string; jenjang: string; jurusan: string[]; program: ProgramUnit[] };
export type RingkasanSiswa = { aktif: number; calon: number; lulus: number; semua: number };

export type JawabanSiswa = {
  ok: boolean;
  siswa: SiswaUnit[];
  penuh: boolean;
  sekolah: SekolahSiswa;
  ringkasan: RingkasanSiswa;
};

export const daftarSiswa = (opsi: { status?: string; cari?: string; batas?: number; lewat?: number } = {}) => {
  const q = new URLSearchParams({
    status: opsi.status ?? "aktif",
    batas: String(opsi.batas ?? 60),
    lewat: String(opsi.lewat ?? 0),
  });
  if (opsi.cari?.trim()) q.set("cari", opsi.cari.trim());
  return mintaUnit<JawabanSiswa>(`/api/unit/sekolah/siswa?${q.toString()}`);
};

export const tambahSiswa = (isian: IsianSiswa) =>
  mintaUnit<{ ok: boolean; id: string; ringkasan: RingkasanSiswa }>("/api/unit/sekolah/siswa", {
    method: "POST",
    body: JSON.stringify(isian),
  });

export const ubahSiswa = (id: string, isian: IsianSiswa) =>
  mintaUnit<{ ok: boolean; ringkasan: RingkasanSiswa }>(`/api/unit/sekolah/siswa/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(isian),
  });

export const hapusSiswa = (id: string) =>
  mintaUnit<{ ok: boolean; ringkasan: RingkasanSiswa }>(`/api/unit/sekolah/siswa/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

export type AlumniUnit = {
  id: string;
  nama: string;
  nis: string;
  tahunLulus: number | null;
  pekerjaan: string;
  instansi: string;
  kota: string;
  telepon: string;
  catatan: string;
  dariSiswa: boolean;
  santriId: string;
  dibuat: string | null;
};

export type IsianAlumni = {
  nama: string;
  nis: string;
  tahunLulus: string;
  pekerjaan: string;
  instansi: string;
  kota: string;
  telepon: string;
  catatan: string;
};

export const daftarAlumni = (cari = "") => {
  const q = new URLSearchParams();
  if (cari.trim()) q.set("cari", cari.trim());
  return mintaUnit<{ ok: boolean; alumni: AlumniUnit[]; total: number }>(
    `/api/unit/sekolah/alumni${q.toString() ? `?${q.toString()}` : ""}`,
  );
};

export const tambahAlumni = (isian: IsianAlumni) =>
  mintaUnit<{ ok: boolean; id: string; total: number }>("/api/unit/sekolah/alumni", {
    method: "POST",
    body: JSON.stringify(isian),
  });

export const ubahAlumni = (id: string, isian: IsianAlumni) =>
  mintaUnit<{ ok: boolean; total: number }>(`/api/unit/sekolah/alumni/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(isian),
  });

export const hapusAlumni = (id: string) =>
  mintaUnit<{ ok: boolean; total: number }>(`/api/unit/sekolah/alumni/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

/**
 * Selaraskan daftar alumni dengan data siswa: siswa yang berstatus lulus tetapi belum
 * tercatat sebagai alumni (misalnya tunggakannya sudah lunas) dimasukkan sekaligus.
 */
export const selaraskanAlumni = () =>
  mintaUnit<{ ok: boolean; ditambah: number; nama: string[]; totalAlumni: number; pesan: string }>(
    "/api/unit/sekolah/alumni/selaraskan",
    { method: "POST", body: JSON.stringify({}) },
  );

/** Pindahkan siswa menjadi alumni: statusnya jadi lulus dan masuk daftar alumni. */
export const luluskanSiswa = (id: string, isian: Partial<IsianAlumni> = {}) =>
  mintaUnit<{
    ok: boolean;
    masukAlumni?: boolean;
    pesan?: string;
    siswa: { id: string; nama: string; status: string };
    ringkasan: RingkasanSiswa;
    totalAlumni: number;
  }>(`/api/unit/sekolah/siswa/${encodeURIComponent(id)}/lulus`, { method: "POST", body: JSON.stringify(isian) });
