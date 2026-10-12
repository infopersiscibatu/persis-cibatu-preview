import { mintaUnit } from "./unitSpmb";

/**
 * Data halaman Admin Tata Usaha: statistik tagihan dan pembayaran sekolah yang
 * sedang masuk. Tagihan terhubung ke siswa, jadi angkanya hanya mencakup sekolah
 * pemilik sesi.
 */

export type RingkasNominal = { jumlah: number; nominal: number };
export type RingkasJumlah = { jumlah: number };

export type TagihanTataUsaha = {
  id: string;
  label: string;
  jenis: string;
  keterangan: string;
  jumlah: number;
  status: string;
  jatuhTempo: string | null;
  dibuat: string | null;
  santri: string;
  kelas: string;
};

export type JenisTagihan = {
  jenis: string;
  jumlah: number;
  total: number;
  lunas: number;
  tunggakan: number;
};

export type StatistikTataUsaha = {
  ok: boolean;
  diperbarui: string;
  unit: { id: string; nama: string; jenjang: string; pimpinan: string };
  pengurusTu: string;
  /** Jumlah tagihan bulanan yang baru dibuat otomatis saat halaman ini dibuka. */
  dibuatOtomatis: number;
  /** Berapa notifikasi tagihan otomatis itu yang diantre untuk wali. */
  notifikasiOtomatis: number;
  /** Berapa HP wali pada unit ini yang sudah terdaftar menerima notifikasi. */
  perangkatOtomatis: number;
  tahunAjaran: { id: string; nama: string } | null;
  tagihan: {
    jumlah: number;
    total: number;
    siswaMenunggak: number;
    lunas: RingkasNominal;
    belum: RingkasNominal;
    menunggu: RingkasNominal;
    batal: RingkasJumlah;
    lewatJatuhTempo: RingkasNominal;
    belumLunas: RingkasNominal;
    perJenis: JenisTagihan[];
    terbaru: TagihanTataUsaha[];
    belumDibayar: TagihanTataUsaha[];
  };
  pembayaran: {
    menunggu: RingkasNominal;
    terverifikasi: RingkasNominal;
    ditolak: RingkasJumlah;
    bulanIni: RingkasNominal;
  };
};

export const ambilStatistikTataUsaha = () => mintaUnit<StatistikTataUsaha>("/api/unit/tata-usaha/statistik");

export const LABEL_TAGIHAN: Record<string, string> = {
  belum: "Belum bayar",
  menunggu: "Menunggu verifikasi",
  lunas: "Lunas",
  batal: "Batal",
};

/* ------------------------------- kategori tagihan ------------------------------- */

export type TipeKategori = "bulanan" | "sekali";

export type KategoriTagihan = {
  id: string;
  nama: string;
  keterangan: string;
  tipe: TipeKategori;
  /** Tanggal jatuh tempo tiap bulan (1–31) untuk kategori bulanan. */
  jatuhTempoHari: number | null;
  /** Besaran nominal standar kategori: mis. Rp450.000 per bulan untuk SPP Bulanan. */
  nominal: number;
  /** Total nominal tagihan yang sudah dibuat dengan kategori ini. */
  nilai: number;
  /** Tahun yang sedang ditampilkan untuk kategori bulanan. */
  tahun?: number;
  /** Daftar bulan setahun: lunas, menunggu verifikasi, belum bayar, atau belum ditagihkan. */
  bulan?: BulanSiswa[];
  bulanLunas?: number;
  bulanMenunggu?: number;
  bulanBelum?: number;
  bulanKosong?: number;
  aktif: boolean;
  jumlah: number;
  belum: number;
  hanyaJenis?: boolean;
};

export type IsianKategori = {
  nama: string;
  keterangan: string;
  tipe: TipeKategori;
  nominal: string;
  jatuhTempoHari: string;
};

export const daftarKategori = () =>
  mintaUnit<{ ok: boolean; kategori: KategoriTagihan[]; total: number }>("/api/unit/tata-usaha/kategori");

export const tambahKategori = (isian: IsianKategori) =>
  mintaUnit<{ ok: boolean; kategori: KategoriTagihan[] }>("/api/unit/tata-usaha/kategori", {
    method: "POST",
    body: JSON.stringify(isian),
  });

export const ubahKategori = (id: string, isian: IsianKategori & { aktif: boolean }) =>
  mintaUnit<{ ok: boolean; kategori: KategoriTagihan[] }>(`/api/unit/tata-usaha/kategori/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(isian),
  });

export const hapusKategori = (id: string) =>
  mintaUnit<{ ok: boolean; kategori: KategoriTagihan[] }>(`/api/unit/tata-usaha/kategori/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

/* --------------------------------- menu tagihan --------------------------------- */

export type SiswaTagihan = {
  id: string;
  nama: string;
  kelas: string;
  /** Jurusan yang dipilih; namanya dipakai bila kelas belum ditentukan. */
  program: string;
  programNama: string;
  status: string;
  jumlahTagihan: number;
  tunggakan: number;
  jenis: string[];
};

export type JawabanSiswaTagihan = {
  ok: boolean;
  cari: string;
  saring: string;
  penuh: boolean;
  sebutan: string;
  ringkasan: { semua: number; sudahDitagih: number };
  siswa: SiswaTagihan[];
};

export const daftarSiswaTagihan = (opsi: { cari?: string; saring?: string; batas?: number; lewat?: number } = {}) => {
  const q = new URLSearchParams({
    saring: opsi.saring ?? "semua",
    batas: String(opsi.batas ?? 60),
    lewat: String(opsi.lewat ?? 0),
  });
  if (opsi.cari?.trim()) q.set("cari", opsi.cari.trim());
  return mintaUnit<JawabanSiswaTagihan>(`/api/unit/tata-usaha/tagihan/siswa?${q.toString()}`);
};

export type BulanTagihan = {
  bulan: string;
  jumlah: number;
  nominal: number;
  lunas: number;
  belum: number;
  tagihan: TagihanTataUsaha[];
};

export type JawabanTagihanKategori = {
  ok: boolean;
  periode: string;
  bulanIni: { siswa: number; sudahDitagih: number };
  kategori: KategoriTagihan;
  bulan: BulanTagihan[];
  tagihan: TagihanTataUsaha[];
  ringkasan: { jumlah: number; nominal: number; lunas: number; belum: number };
};

export const tagihanKategori = (id: string) =>
  mintaUnit<JawabanTagihanKategori>(`/api/unit/tata-usaha/kategori/${encodeURIComponent(id)}/tagihan`);

export type BulanSiswa = {
  bulan: string;
  status: string;
  tagihanId: string;
  jumlah: number;
  jatuhTempo: string | null;
};

export type RiwayatPembayaran = {
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
  dibuat: string | null;
};

export type MetodePembayaran = {
  id: string;
  nama: string;
  keterangan: string;
  bank: string;
  nomor: string;
  atasNama: string;
  langkah: string[];
  /** Gambar kanal pembayaran (kode QRIS) dari bendahara; tampil pada instruksi pembayaran. */
  gambar: string;
};

export type DetailSiswaTagihan = {
  ok: boolean;
  sebutan: string;
  tahun: number;
  periodeSekarang: string;
  riwayat: RiwayatPembayaran[];
  metode: MetodePembayaran[];
  siswa: {
    id: string;
    nama: string;
    kelas: string;
    program: string;
    programNama: string;
    status: string;
    waliNama: string;
    waliTelepon: string;
  };
  tagihan: TagihanTataUsaha[];
  kategori: KategoriTagihan[];
  ringkasan: { jumlah: number; total: number; belumLunas: number };
};

/** Tagihan satu bulan pada kategori bulanan (mis. SPP bulan yang terlewat). */
export const buatTagihanBulanan = (isian: { santriId: string; kategoriId: string; bulan: string; jumlah?: string }) =>
  mintaUnit<{ ok: boolean; id: string; sudahAda?: boolean; pesan: string }>("/api/unit/tata-usaha/tagihan/bulanan", {
    method: "POST",
    body: JSON.stringify(isian),
  });

export const detailSiswaTagihan = (id: string, tahun?: number) =>
  mintaUnit<DetailSiswaTagihan>(
    `/api/unit/tata-usaha/tagihan/siswa/${encodeURIComponent(id)}${tahun ? `?tahun=${tahun}` : ""}`,
  );

export const buatTagihan = (isian: {
  santriId: string;
  kategoriId: string;
  jenis?: string;
  jumlah: string;
  jatuhTempo: string;
  keterangan: string;
}) =>
  mintaUnit<{
    ok: boolean;
    id: string;
    siswa: { id: string; nama: string; kelas: string };
    jenis: string;
    /** Keterangan tagihan dibuat, termasuk keadaan notifikasi ke HP wali. */
    pesan?: string;
    notifikasi?: { perangkat: number; terkirim: number } | null;
  }>("/api/unit/tata-usaha/tagihan", { method: "POST", body: JSON.stringify(isian) });

export const ubahTagihan = (id: string, isian: { jumlah: string; jatuhTempo: string; keterangan: string }) =>
  mintaUnit<{ ok: boolean }>(`/api/unit/tata-usaha/tagihan/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(isian),
  });

export const hapusTagihan = (id: string) =>
  mintaUnit<{ ok: boolean }>(`/api/unit/tata-usaha/tagihan/${encodeURIComponent(id)}`, { method: "DELETE" });

/* ------------------------------- menu pembayaran ------------------------------- */

export type PembayaranUnit = {
  id: string;
  santriId: string;
  santri: string;
  kelas: string;
  jumlah: number;
  metode: string;
  status: string;
  label: string;
  jenis: string;
  perLabel: string;
  tagihanId: string;
  buktiUrl: string;
  catatan: string;
  dibayarPada: string | null;
  dibuat: string | null;
  diverifikasiPada: string | null;
};

/** Ringkasan pembayaran satu nama: berapa kali, berapa nominalnya, dan rinciannya. */
export type PembayaranSantri = {
  id: string;
  nama: string;
  kelas: string;
  /** Berapa pembayaran yang tercatat untuk nama ini. */
  jumlah: number;
  total: number;
  menunggu: { jumlah: number; nominal: number };
  terverifikasi: { jumlah: number; nominal: number };
  ditolak: { jumlah: number };
  /** Waktu pembayaran terbaru milik nama ini. */
  terakhir: string | null;
  /** Seluruh riwayat pembayarannya, pembayaran terbaru lebih dahulu. */
  pembayaran: PembayaranUnit[];
};

export type JawabanPembayaran = {
  ok: boolean;
  saring: string;
  cari: string;
  sebutan: string;
  ringkasan: {
    menunggu: { jumlah: number; nominal: number };
    terverifikasi: { jumlah: number; nominal: number };
    bulanIni: { jumlah: number; nominal: number };
  };
  /** Satu baris satu nama; rinciannya dibuka dengan menekan namanya. */
  santri: PembayaranSantri[];
};

export const daftarPembayaran = (saring: "menunggu" | "semua" = "menunggu", cari = "") => {
  const q = new URLSearchParams({ saring });
  if (cari.trim()) q.set("cari", cari.trim());
  return mintaUnit<JawabanPembayaran>(`/api/unit/tata-usaha/pembayaran?${q.toString()}`);
};

export const verifikasiPembayaran = (id: string) =>
  mintaUnit<{ ok: boolean; lunas: boolean; pesan: string }>(
    `/api/unit/tata-usaha/pembayaran/${encodeURIComponent(id)}/verifikasi`,
    { method: "POST", body: "{}" },
  );

export const tolakPembayaran = (id: string, catatan: string) =>
  mintaUnit<{ ok: boolean; pesan: string }>(`/api/unit/tata-usaha/pembayaran/${encodeURIComponent(id)}/tolak`, {
    method: "POST",
    body: JSON.stringify({ catatan }),
  });

/** Catat pembayaran yang diterima bendahara; menunggu verifikasi sebelum tagihan lunas. */
export const catatPembayaran = (
  tagihanId: string,
  isian: { metode: string; metodeId?: string; catatan: string; dibayarPada?: string },
) =>
  mintaUnit<{ ok: boolean; id: string; pesan: string }>(
    `/api/unit/tata-usaha/tagihan/${encodeURIComponent(tagihanId)}/bayar`,
    { method: "POST", body: JSON.stringify(isian) },
  );

/* ------------------------------ tunggakan & lunas ------------------------------ */

export type PesertaTunggakan = {
  id: string;
  nama: string;
  kelas: string;
  /** Jurusan yang dipilih; namanya dipakai bila kelas belum ditentukan. */
  program: string;
  programNama: string;
  /** aktif | calon | lulus | pindah | nonaktif */
  status: string;
  jumlahTagihan: number;
  nominal: number;
  /** Tunggakan: jatuh tempo terdekat. Lunas: waktu tagihan terakhir berubah. */
  jatuhTempo: string | null;
  terakhir: string | null;
};

/* ---------------------------- metode pembayaran ---------------------------- */

export type MetodeUnit = {
  id: string;
  nama: string;
  keterangan: string;
  bank: string;
  nomor: string;
  atasNama: string;
  /** Langkah pembayaran khusus metode ini; bila kosong portal memakai langkah bawaan. */
  langkah: string[];
  /** Gambar kanal pembayaran (kode QRIS) yang tampil di portal wali. */
  gambarUrl: string;
  mediaId: string | null;
  urutan: number;
  aktif: boolean;
  /** Berapa pembayaran yang tercatat memakai metode ini. */
  dipakai: number;
};

export type IsianMetode = {
  nama: string;
  keterangan: string;
  bank: string;
  nomor: string;
  atasNama: string;
  langkah: string[];
  gambarUrl: string;
  mediaId: string | null;
  urutan: string;
  aktif: boolean;
};

export const daftarMetodeTU = () => mintaUnit<{ ok: boolean; metode: MetodeUnit[] }>("/api/unit/tata-usaha/metode");

export const tambahMetodeTU = (isian: IsianMetode) =>
  mintaUnit<{ ok: boolean; id: string; pesan: string }>("/api/unit/tata-usaha/metode", {
    method: "POST",
    body: JSON.stringify(isian),
  });

export const ubahMetodeTU = (id: string, isian: IsianMetode) =>
  mintaUnit<{ ok: boolean; pesan: string }>(`/api/unit/tata-usaha/metode/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(isian),
  });

export const hapusMetodeTU = (id: string) =>
  mintaUnit<{ ok: boolean; pesan: string }>(`/api/unit/tata-usaha/metode/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

/** Identitas peserta lulus yang riwayatnya dibuka dari tabel Lunas. */
export type PesertaLulus = {
  id: string;
  nama: string;
  kelas: string;
  program: string;
  programNama: string;
  status: string;
  jumlahTagihan: number;
  tunggakan: number;
  /** Waktu tagihan terakhirnya dinyatakan lunas. */
  lunasTerakhir: string | null;
};

export type JawabanRiwayatPeserta = {
  ok: boolean;
  sebutan: string;
  santri: PesertaLulus;
  /** Ringkasan dan seluruh riwayat pembayaran nama ini; null bila belum ada pembayaran. */
  riwayat: PembayaranSantri | null;
};

/** Riwayat pembayaran satu peserta — dipakai tabel Lunas (hanya untuk dilihat). */
export const riwayatPesertaTU = (id: string) =>
  mintaUnit<JawabanRiwayatPeserta>(
    `/api/unit/tata-usaha/pembayaran/santri/${encodeURIComponent(id)}`,
  );

export type JawabanTunggakanTU = {
  ok: boolean;
  cari: string;
  sebutan: string;
  ringkasan: { menunggak: number; nominalTunggakan: number; lunas: number };
  /** Lulus, tetapi masih punya tagihan yang belum lunas. */
  tunggakan: PesertaTunggakan[];
  /** Lulus dan tidak ada tagihan yang belum lunas lagi. */
  lunas: PesertaTunggakan[];
};

export const daftarTunggakanTU = (cari = "") => {
  const q = new URLSearchParams();
  if (cari.trim()) q.set("cari", cari.trim());
  const akhir = q.toString();
  return mintaUnit<JawabanTunggakanTU>(`/api/unit/tata-usaha/tunggakan${akhir ? `?${akhir}` : ""}`);
};
