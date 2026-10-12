import { ambilTokenUnit, hapusSesiUnit } from "./sesiUnit";

/** Permintaan ke layanan halaman unit: selalu membawa sesi unit. */
export async function mintaUnit<T>(jalur: string, opsi: RequestInit = {}): Promise<T> {
  const token = ambilTokenUnit();
  const jawab = await fetch(jalur, {
    ...opsi,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { "x-sesi-unit": token } : {}),
      ...(opsi.headers ?? {}),
    },
  });
  const isi = (await jawab.json().catch(() => ({}))) as T & { pesan?: string };
  if (jawab.status === 401) {
    hapusSesiUnit();
    throw new Error(isi.pesan || "Sesi sudah berakhir. Silakan masuk kembali dengan PIN sekolah.");
  }
  if (!jawab.ok) throw new Error(isi.pesan || "Permintaan tidak berhasil.");
  return isi;
}

/* ------------------------- statistik Admin SPMB ------------------------- */

export type StatistikPendaftar = {
  total: number;
  baru: number;
  diverifikasi: number;
  diterima: number;
  ditolak: number;
  batal: number;
  hariIni: number;
  mingguIni: number;
};

export type HariPendaftar = { tanggal: string; label: string; jumlah: number };

export type GelombangStatistik = {
  id: string;
  nama: string;
  periode: string;
  kuota: string;
  sisa: string;
  status: string;
  aktif: boolean;
  total: number;
  baru: number;
  diverifikasi: number;
  diterima: number;
  kuotaAngka: number;
  sisaAngka: number;
};

export type StatistikSekolah = {
  santriAktif: number;
  peserta: number;
  rombel: number;
  guru: number;
  jurusan: number;
  ekstrakurikuler: number;
};

export type StatistikSpmb = {
  ok: boolean;
  diperbarui: string;
  unit: { id: string; nama: string; slug: string; jenjang: string; jenjangNama: string };
  pendaftar: StatistikPendaftar;
  tujuhHari: HariPendaftar[];
  gelombang: GelombangStatistik[];
  sekolah: StatistikSekolah;
  formulir: { aktif: boolean; judul: string };
  pengurusSpmb: string;
};

export const ambilStatistikSpmb = () => mintaUnit<StatistikSpmb>("/api/unit/spmb/statistik");

/* --------------------------- pendaftar Admin SPMB --------------------------- */

export type StatusPendaftar = "baru" | "diverifikasi" | "diterima" | "ditolak" | "batal";

export const LABEL_STATUS: Record<StatusPendaftar, string> = {
  baru: "Perlu verifikasi",
  diverifikasi: "Diverifikasi",
  diterima: "Diterima",
  ditolak: "Ditolak",
  batal: "Dibatalkan",
};

export type RingkasanStatus = {
  total: number;
  baru: number;
  diverifikasi: number;
  diterima: number;
  ditolak: number;
  batal: number;
};

export type Pendaftar = {
  id: string;
  nomor: string;
  nama: string;
  telepon: string;
  asalSekolah: string;
  status: StatusPendaftar;
  catatan: string;
  gelombang: string;
  gelombangId: string;
  dibuat: string | null;
  diperbarui: string | null;
  jumlahBerkas: number;
  /** Jurusan yang dipilih pada formulir SPMB (slug dan namanya). */
  program: string;
  programNama: string;
};

export type PendaftarLengkap = Pendaftar & {
  jenjang: string;
  tempatLahir: string;
  tanggalLahir: string;
  namaWali: string;
  email: string;
  alamat: string;
  berkas: { nama?: string; url?: string }[];
};

export type JawabanDaftarPendaftar = {
  ok: boolean;
  status: string;
  cari: string;
  penuh: boolean;
  pendaftar: Pendaftar[];
  ringkasan: RingkasanStatus;
};

/** status: baru | diverifikasi | diterima | ditolak | batal | tidak-lanjut | semua */
export const daftarPendaftar = (status: string, cari = "", batas = 60) => {
  const q = new URLSearchParams({ status, batas: String(batas) });
  if (cari.trim()) q.set("cari", cari.trim());
  return mintaUnit<JawabanDaftarPendaftar>(`/api/unit/spmb/pendaftar?${q.toString()}`);
};

export const detailPendaftar = (id: string) =>
  mintaUnit<{ ok: boolean; pendaftar: PendaftarLengkap }>(`/api/unit/spmb/pendaftar/${encodeURIComponent(id)}`);

/** Ubah status: baru (kembalikan), diverifikasi, diterima, ditolak, atau batal. */
export const ubahStatusPendaftar = (id: string, status: StatusPendaftar, catatan?: string) =>
  mintaUnit<{ ok: boolean; status: string; santri: { ditambah: boolean; dicabut: boolean }; ringkasan: RingkasanStatus }>(
    `/api/unit/spmb/pendaftar/${encodeURIComponent(id)}/status`,
    { method: "PUT", body: JSON.stringify(catatan === undefined ? { status } : { status, catatan }) },
  );

/** Perbaiki data pendaftar: catatan, telepon, nama wali, alamat. */
export const simpanDataPendaftar = (
  id: string,
  nilai: { catatan?: string; telepon?: string; namaWali?: string; alamat?: string },
) =>
  mintaUnit<{ ok: boolean; ringkasan: RingkasanStatus }>(`/api/unit/spmb/pendaftar/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(nilai),
  });
