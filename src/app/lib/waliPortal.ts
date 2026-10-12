/**
 * Sambungan portal wali santri ke server.
 *
 * Wali masuk memakai PIN yang dibuat Admin Sekolah pada tabel siswa. Setelah masuk,
 * token sesi disimpan di peramban dan dipakai pada setiap permintaan lewat header
 * x-sesi-wali. Semua data yang tampil di portal berasal dari basis data sekolah.
 */

import type { Istilah } from "./istilah";

const KUNCI = "persis-cibatu-wali-sesi-v1";

export type SantriWali = {
  id: string;
  nama: string;
  nis: string;
  /** Apakah jenjang unit ini punya jurusan/program studi. */
  adaJurusan: boolean;
  /** Foto profil yang diunggah wali sendiri (alamat gambar, kosong bila belum ada). */
  foto: string;
  /** Nomor induk nasional, bila diisi petugas. */
  nisn: string;
  kelas: string;
  status: string;
  /** Jurusan (program) yang dipilih: slug dan namanya untuk ditampilkan. */
  program: string;
  programNama: string;
  asalSekolah: string;
  alamat: string;
  tempatLahir: string;
  tanggalLahir: string;
  email: string;
  tahunMasuk: number | null;
  sebutan: string;
  waliNama: string;
  waliTelepon: string;
  sekolah: string;
  jenjang: string;
};

export type TagihanWali = {
  id: string;
  label: string;
  jenis: string;
  jumlah: number;
  status: string;
  keterangan: string;
  jatuhTempo: string | null;
  periode: string | null;
  lewatTempo: boolean;
  bulanan: boolean;
};

export type PembayaranWali = {
  id: string;
  label: string;
  jumlah: number;
  metode: string;
  status: string;
  catatan: string;
  buktiUrl: string;
  tagihanId: string;
  dibayarPada: string | null;
  diverifikasiPada: string | null;
};

export type MetodeWali = {
  id: string;
  nama: string;
  keterangan: string;
  bank: string;
  nomor: string;
  atasNama: string;
  /** Langkah pembayaran dari bendahara; bila kosong portal memakai instruksi bawaannya. */
  langkah: string[];
  /** Gambar kanal pembayaran (kode QRIS) dari bendahara. */
  gambar: string;
};

/** Satu baris nilai rapor yang sudah diterbitkan petugas. */
export type NilaiWali = {
  id: string;
  mapel: string;
  nilai: number;
  predikat: string;
  semester: string;
  terbitPada: string | null;
};

/** Catatan hafalan yang sudah diterbitkan petugas. */
export type SetoranWali = {
  id: string;
  tanggal: string | null;
  juz: number | null;
  surah: number | null;
  ayatMulai: number | null;
  ayatSelesai: number | null;
  /** Jumlah ayat yang disetor pada setoran ini. */
  jumlahAyat: number | null;
  materi: string;
  jenis: string;
  penilai: string;
  nilai: string;
  catatan: string;
};

export type DataWali = {
  ok: boolean;
  /** Penyebutan sesuai jenjang: siswa/sekolah/SPP atau mahasiswa/kampus/UKT. */
  istilah?: Istilah | null;
  santri: SantriWali;
  ringkasan: {
    belum: { jumlah: number; nominal: number };
    menunggu: { jumlah: number; nominal: number };
    lunas: { jumlah: number; nominal: number };
    bulanBelum: number;
  };
  tagihan: TagihanWali[];
  menunggu: PembayaranWali[];
  riwayat: PembayaranWali[];
  metode: MetodeWali[];
  /** Nilai rapor yang sudah diterbitkan; kosong berarti belum ada yang terbit. */
  nilai: NilaiWali[];
  rataNilai: number;
  /** Catatan setoran hafalan yang sudah diterbitkan. */
  tahfidz: {
    setoran: SetoranWali[];
  };
  /** Berapa HP wali ini yang sudah menerima notifikasi. */
  notifikasi: { perangkat: number };
};

export function tokenWali(): string {
  try {
    return window.localStorage.getItem(KUNCI) ?? "";
  } catch {
    return "";
  }
}

function simpanToken(token: string) {
  try {
    if (token) window.localStorage.setItem(KUNCI, token);
    else window.localStorage.removeItem(KUNCI);
  } catch {
    /* penyimpanan peramban tidak tersedia — sesi tetap jalan selama halaman terbuka */
  }
}

/** Galat sesi berakhir — portal akan meminta PIN lagi. */
export class SesiWaliHabis extends Error {}

async function mintaWali<T>(jalur: string, opsi: RequestInit = {}): Promise<T> {
  const token = tokenWali();
  const jawab = await fetch(jalur, {
    ...opsi,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-sesi-wali": token } : {}),
      ...(opsi.headers ?? {}),
    },
  });

  let isi: { pesan?: string } = {};
  try {
    isi = await jawab.json();
  } catch {
    throw new Error("Server tidak merespons dengan benar. Coba lagi sebentar.");
  }

  if (jawab.status === 401 && !jalur.endsWith("/masuk")) {
    simpanToken("");
    throw new SesiWaliHabis(isi.pesan ?? "Sesi sudah berakhir. Silakan masuk lagi dengan PIN.");
  }
  if (!jawab.ok) throw new Error(isi.pesan ?? "Permintaan gagal diproses.");

  return isi as T;
}

export const masukWali = async (pin: string) => {
  const jawab = await mintaWali<{ ok: boolean; token: string; santri: SantriWali }>("/api/wali/masuk", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
  simpanToken(jawab.token);
  return jawab;
};

export const keluarWali = async () => {
  try {
    await mintaWali<{ ok: boolean }>("/api/wali/keluar", { method: "POST", body: "{}" });
  } catch {
    /* bila gagal, sesi lokal tetap dibersihkan */
  }
  simpanToken("");
};

export const ambilTagihanWali = () => mintaWali<DataWali>("/api/wali/tagihan");

/**
 * Unggah foto profil peserta didik dari portal wali. Berkas dikirim sebagai base64
 * (sama seperti bukti transfer) dan alamatnya disimpan pada data siswa/mahasiswa.
 */
export async function unggahFotoWali(kiriman: { nama: string; tipe: string; data: string }) {
  return mintaWali<{ ok: boolean; foto: string; santri: SantriWali }>("/api/wali/foto", {
    method: "POST",
    body: JSON.stringify(kiriman),
  });
}

/** Baca berkas pilihan pengguna menjadi teks base64 untuk dikirim ke server. */
export function bacaBase64(berkas: File): Promise<string> {
  return new Promise((selesai, gagal) => {
    const pembaca = new FileReader();
    pembaca.onload = () => {
      const isi = String(pembaca.result ?? "");
      selesai(isi.includes(",") ? isi.slice(isi.indexOf(",") + 1) : isi);
    };
    pembaca.onerror = () => gagal(new Error("Foto tidak terbaca. Coba pilih berkas lain."));
    pembaca.readAsDataURL(berkas);
  });
}

/* --------------------------- notifikasi HP wali --------------------------- */

/**
 * Mendaftarkan HP yang sedang login ke layanan notifikasi. Server mengikat HP ini
 * pada akun siswa/mahasiswa dari sesi wali, jadi notifikasi tidak tertukar antar wali.
 */
export const daftarkanNotifikasiWali = (langganan: {
  endpoint: string;
  kunci: string;
  auth: string;
  perangkat?: string;
}) =>
  mintaWali<{ ok: boolean; santriId: string; perangkat: number }>("/api/wali/push/daftar", {
    method: "POST",
    body: JSON.stringify(langganan),
  });

/** Melepas ikatan HP ini dari akun wali yang sedang masuk. */
export const lepasNotifikasiWali = (endpoint: string) =>
  mintaWali<{ ok: boolean }>("/api/wali/push/lepas", {
    method: "POST",
    body: JSON.stringify({ endpoint }),
  });

export const statusNotifikasiWali = (endpoint: string) =>
  mintaWali<{ ok: boolean; terdaftar: boolean; perangkat: number }>(
    `/api/wali/push?endpoint=${encodeURIComponent(endpoint)}`,
  );

export const ujiNotifikasiWali = () =>
  mintaWali<{ ok: boolean; pesan: string }>("/api/wali/push/uji", { method: "POST", body: "{}" });

/** Hapus foto profil sehingga portal kembali memakai inisial nama. */
export async function hapusFotoWali() {
  return mintaWali<{ ok: boolean; foto: string; santri: SantriWali }>("/api/wali/foto", { method: "DELETE" });
}

export const kirimSetoran = (isian: {
  tagihanIds: string[];
  metode: string;
  catatan: string;
  bukti?: { nama: string; tipe: string; data: string } | null;
}) =>
  mintaWali<{ ok: boolean; jumlah: number; nominal: number; pesan: string }>("/api/wali/bayar", {
    method: "POST",
    body: JSON.stringify(isian),
  });
