import { useCallback, useEffect, useState } from "react";
import { unggahGambar } from "./unggah";
import { mintaUnit } from "./unitSpmb";

/**
 * Data halaman Admin ZIS (donasi, infak, wakaf).
 *
 * Semua angkanya dihitung di layanan dari database, sehingga Admin ZIS tidak perlu
 * mengisi angka apa pun secara manual.
 */

export type StatistikZis = {
  donasi: {
    /** Total nominal dana terkumpul dari seluruh program donasi. */
    total: number;
    /** Donasi lewat formulir situs yang sudah dikonfirmasi petugas. */
    masuk: number;
    /** Donasi lewat formulir yang belum diperiksa. */
    menunggu: number;
  };
  program: { total: number; aktif: number };
  donatur: { total: number; tercatat: number };
  penyaluran: { total: number; jumlah: number; terakhir: string | null };
};

type Jawaban = { ok: boolean; statistik: StatistikZis };

export async function ambilStatistikZis(): Promise<StatistikZis> {
  const jawab = await mintaUnit<Jawaban>("/api/unit/zis/statistik");
  return jawab.statistik;
}

/** Memuat statistik ZIS sekali saat halaman dibuka, lengkap dengan tombol muat ulang. */
export function useStatistikZis() {
  const [data, setData] = useState<StatistikZis | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      setData(await ambilStatistikZis());
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Statistik ZIS belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  return { data, memuat, galat, muat };
}

/* --------------------------------- donasi --------------------------------- */

export type DonasiZis = {
  id: number;
  /** Nomor donasi yang mudah dibaca petugas, mis. DN-0007. */
  nomor: string;
  nama: string;
  anonim: boolean;
  telepon: string;
  adaTelepon: boolean;
  jumlah: number;
  metode: string;
  pesan: string;
  buktiUrl: string | null;
  program: string;
  programSlug: string;
  status: "menunggu" | "dikonfirmasi" | "ditolak";
  dibuat: string;
  diperbarui: string;
  /** Teks verifikasi untuk dikirim ke WhatsApp donatur (hanya yang sudah diverifikasi). */
  pesanWhatsApp: string;
  tautanWhatsApp: string | null;
};

export type DaftarDonasiZis = {
  /** Donasi yang masuk lewat formulir situs dan belum diperiksa. */
  perlu: DonasiZis[];
  /** Donasi yang sudah diverifikasi petugas. */
  diverifikasi: DonasiZis[];
  ditolak: number;
  lembaga: string;
};

export async function ambilDonasiZis(): Promise<DaftarDonasiZis> {
  const jawab = await mintaUnit<{ ok: boolean } & DaftarDonasiZis>("/api/unit/zis/donasi");
  return { perlu: jawab.perlu, diverifikasi: jawab.diverifikasi, ditolak: jawab.ditolak, lembaga: jawab.lembaga };
}

/** Verifikasi donasi: dana masuk ke program dan teks WhatsApp disiapkan. */
export async function verifikasiDonasiZis(id: number): Promise<DonasiZis> {
  const jawab = await mintaUnit<{ ok: boolean; donasi: DonasiZis }>(
    `/api/unit/zis/donasi/${id}/verifikasi`,
    { method: "POST", body: "{}" },
  );
  return jawab.donasi;
}

/** Tandai donasi tidak memenuhi syarat supaya tidak menumpuk di daftar periksa. */
export async function tolakDonasiZis(id: number): Promise<void> {
  await mintaUnit(`/api/unit/zis/donasi/${id}/tolak`, { method: "POST", body: "{}" });
}

/** Memuat statistik ZIS sekali saat halaman dibuka, lengkap dengan tombol muat ulang. */
export function useDonasiZis() {
  const [data, setData] = useState<DaftarDonasiZis | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      setData(await ambilDonasiZis());
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Daftar donasi belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  return { data, memuat, galat, muat };
}

/* ---------------------- pengelolaan ZIS dari panel admin ---------------------- */

export type KategoriProgram = {
  id: string;
  nama: string;
  keterangan: string;
  aktif: boolean;
  /** Berapa program donasi yang memakai kategori ini. */
  program: number;
};

/** Metode pembayaran resmi lembaga (tabel donasi_metode) yang bisa dipilih per program. */
export type MetodeBayarZis = {
  id: string;
  nama: string;
  keterangan: string;
  /** Langkah pembayaran yang dibaca donatur di popup situs. */
  langkah: string[];
  /** Alamat gambar (mis. kode QRIS) yang tampil di popup donasi. */
  gambarUrl: string;
  mediaId: string | null;
  aktif: boolean;
  urutan: number;
};

export type BorangMetodeZis = {
  nama: string;
  keterangan: string;
  langkah: string[];
  gambarUrl: string;
  mediaId: string | null;
  aktif: boolean;
};

export async function ambilMetodeZis(): Promise<MetodeBayarZis[]> {
  const jawab = await mintaUnit<{ metode: MetodeBayarZis[] }>("/api/unit/zis/metode");
  return jawab.metode ?? [];
}

export async function simpanMetodeZis(id: string, nilai: BorangMetodeZis): Promise<MetodeBayarZis[]> {
  const jawab = await mintaUnit<{ metode: MetodeBayarZis[] }>(`/api/unit/zis/metode/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(nilai),
  });
  return jawab.metode ?? [];
}

export type ProgramZis = {
  id: string;
  slug: string;
  judul: string;
  kategori: string;
  gambarUrl: string;
  mediaId: string | null;
  target: number;
  terkumpul: number;
  donatur: number;
  batas: string | null;
  ringkasan: string;
  pengelola: string;
  isi: string[];
  rincian: { item: string; jumlah: number }[];
  /** Id metode pembayaran yang berlaku untuk program ini. */
  metode: string[];
  aktif: boolean;
  riwayat: number;
  donasi: number;
  dibuat: string;
  diperbarui: string;
};

export type LaporanZis = {
  id: string;
  programId: string;
  program: string;
  tanggal: string;
  judul: string;
  keterangan: string;
  jenis: "laporan" | "penyaluran";
  nominal: number;
};

export type PilihanProgram = { id: string; judul: string };

export type DonaturZis = {
  id: string;
  nama: string;
  telepon: string;
  jumlahDonasi: number;
  jumlahTotal: number;
  program: string;
  aktif: boolean;
  catatan: string;
  dibuat: string;
  diperbarui: string;
};

export type RingkasDonatur = { jumlah: number; total: number; bertelepon: number };

export type RiwayatDonasiZis = {
  id: number;
  nomor: string;
  nama: string;
  anonim: boolean;
  program: string;
  jumlah: number;
  metode: string;
  status: "menunggu" | "dikonfirmasi" | "ditolak";
  dibuat: string;
  diperbarui: string;
};

export type RingkasRiwayatDonasi = {
  transaksi: number;
  dikonfirmasi: number;
  menunggu: number;
  ditolak: number;
  total: number;
};

/** Unggah gambar lewat sesi Admin ZIS (folder khusus supaya berkas mudah dicari). */
export const unggahGambarZis = (berkas: File, folder = "program-donasi") => unggahGambar(berkas, folder);


/* kategori program */

export async function ambilKategoriZis(): Promise<KategoriProgram[]> {
  return (await mintaUnit<{ kategori: KategoriProgram[] }>("/api/unit/zis/kategori")).kategori;
}

export async function simpanKategoriZis(
  nilai: { nama: string; keterangan: string; aktif: boolean },
  id?: string,
): Promise<KategoriProgram[]> {
  const jalur = id ? `/api/unit/zis/kategori/${encodeURIComponent(id)}` : "/api/unit/zis/kategori";
  const jawab = await mintaUnit<{ kategori: KategoriProgram[] }>(jalur, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(nilai),
  });
  return jawab.kategori;
}

export async function hapusKategoriZis(id: string): Promise<KategoriProgram[]> {
  const jawab = await mintaUnit<{ kategori: KategoriProgram[] }>(
    `/api/unit/zis/kategori/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  return jawab.kategori;
}

/* program donasi */

export type BorangProgramZis = {
  judul: string;
  kategori: string;
  gambarUrl: string;
  mediaId: string | null;
  pengelola: string;
  target: number;
  batas: string;
  ringkasan: string;
  isi: string[];
  rincian: { item: string; jumlah: number }[];
  metode: string[];
  aktif: boolean;
};

export type DaftarProgramZis = {
  program: ProgramZis[];
  kategori: KategoriProgram[];
  metode: MetodeBayarZis[];
};

export async function ambilProgramZis(): Promise<DaftarProgramZis> {
  const jawab = await mintaUnit<DaftarProgramZis>("/api/unit/zis/program");
  return { program: jawab.program, kategori: jawab.kategori, metode: jawab.metode ?? [] };
}

export async function simpanProgramZis(nilai: BorangProgramZis, id?: string): Promise<ProgramZis[]> {
  const jalur = id ? `/api/unit/zis/program/${encodeURIComponent(id)}` : "/api/unit/zis/program";
  const jawab = await mintaUnit<{ program: ProgramZis[] }>(jalur, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(nilai),
  });
  return jawab.program;
}

export async function hapusProgramZis(id: string): Promise<ProgramZis[]> {
  const jawab = await mintaUnit<{ program: ProgramZis[] }>(`/api/unit/zis/program/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return jawab.program;
}

/* laporan penyaluran */

export type BorangLaporanZis = {
  programId: string;
  tanggal: string;
  jenis: "laporan" | "penyaluran";
  judul: string;
  keterangan: string;
  nominal: number;
};

export async function ambilLaporanZis(program?: string): Promise<{ laporan: LaporanZis[]; program: PilihanProgram[] }> {
  const jalur = program ? `/api/unit/zis/laporan?program=${encodeURIComponent(program)}` : "/api/unit/zis/laporan";
  const jawab = await mintaUnit<{ laporan: LaporanZis[]; program: PilihanProgram[] }>(jalur);
  return { laporan: jawab.laporan, program: jawab.program };
}

export async function simpanLaporanZis(nilai: BorangLaporanZis, id?: string) {
  const jalur = id ? `/api/unit/zis/laporan/${encodeURIComponent(id)}` : "/api/unit/zis/laporan";
  return mintaUnit<{ laporan: LaporanZis[]; program: PilihanProgram[] }>(jalur, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(nilai),
  });
}

export async function hapusLaporanZis(id: string) {
  return mintaUnit<{ laporan: LaporanZis[]; program: PilihanProgram[] }>(
    `/api/unit/zis/laporan/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

/* daftar donatur */

export async function ambilDonaturZis(cari?: string) {
  const jalur = cari ? `/api/unit/zis/donatur?cari=${encodeURIComponent(cari)}` : "/api/unit/zis/donatur";
  return mintaUnit<{ donatur: DonaturZis[]; ringkas: RingkasDonatur }>(jalur);
}

export async function simpanDonaturZis(
  nilai: { nama: string; telepon: string; catatan: string; aktif: boolean },
  id?: string,
) {
  const jalur = id ? `/api/unit/zis/donatur/${encodeURIComponent(id)}` : "/api/unit/zis/donatur";
  return mintaUnit<{ donatur: DonaturZis[]; ringkas: RingkasDonatur }>(jalur, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(nilai),
  });
}

export async function hapusDonaturZis(id: string) {
  return mintaUnit<{ donatur: DonaturZis[]; ringkas: RingkasDonatur }>(
    `/api/unit/zis/donatur/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

/* riwayat donasi */

export async function ambilRiwayatDonasiZis(status?: string) {
  const jalur = status && status !== "semua"
    ? `/api/unit/zis/riwayat-donasi?status=${encodeURIComponent(status)}`
    : "/api/unit/zis/riwayat-donasi";
  return mintaUnit<{ donasi: RiwayatDonasiZis[]; ringkas: RingkasRiwayatDonasi }>(jalur);
}

/** Pemuat data ZIS yang sederhana: sekali muat, bisa disegarkan, dan hasil simpan bisa dipasang. */
export function useZisData<T>(muat: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const jalan = useCallback(async () => {
    setMemuat(true);
    try {
      setData(await muat());
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Data belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, [muat]);

  useEffect(() => {
    void jalan();
  }, [jalan]);

  return { data, setData, memuat, galat, muat: jalan };
}
