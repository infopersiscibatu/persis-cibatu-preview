/** Data portal wali santri — sama seperti situs rujukan. */

export const santri = {
  nama: "Muhammad Rizky Ramadhan",
  nis: "2024.0187",
  jenjang: "Madrasah Tsanawiyah (MTs) PERSIS Cibatu",
  jurusan: "Program Tahfizh Al-Qur'an",
  kelas: "Kelas VIII – B",
  semester: "Semester Ganjil 1447 H",
};

export type Pelajaran = { id: string; mapel: string; nilai: number; predikat: string };

export const nilaiWali: Pelajaran[] = [
  { id: "nl-1", mapel: "Al-Qur'an & Tahfizh", nilai: 92, predikat: "A" },
  { id: "nl-2", mapel: "Fikih", nilai: 88, predikat: "B+" },
  { id: "nl-3", mapel: "Bahasa Arab", nilai: 85, predikat: "B+" },
  { id: "nl-4", mapel: "Matematika", nilai: 79, predikat: "B" },
  { id: "nl-5", mapel: "Bahasa Indonesia", nilai: 86, predikat: "B+" },
  { id: "nl-6", mapel: "Bahasa Inggris", nilai: 82, predikat: "B+" },
  { id: "nl-7", mapel: "IPA Terpadu", nilai: 80, predikat: "B" },
  { id: "nl-8", mapel: "PPKn", nilai: 84, predikat: "B+" },
];

export type Setoran = { id: string; tanggal: string; materi: string; jenis: string; penilai: string; nilai: string };

export const setoranTahfidz: Setoran[] = [
  { id: "st-1", tanggal: "2026-09-28", materi: "Juz 1 · Al-Baqarah 1 – 20", jenis: "Setoran Baru", penilai: "Ust. Hilman Nurhakim", nilai: "Mumtaz" },
  { id: "st-2", tanggal: "2026-09-25", materi: "Juz 30 · An-Naba 1 – 40", jenis: "Murojaah", penilai: "Ust. Hilman Nurhakim", nilai: "Jayyid Jiddan" },
  { id: "st-3", tanggal: "2026-09-21", materi: "Juz 1 · Al-Fatihah & awal Al-Baqarah", jenis: "Setoran Baru", penilai: "Ust. Fauzan Ramdhani", nilai: "Jayyid Jiddan" },
  { id: "st-4", tanggal: "2026-09-18", materi: "Juz 30 · An-Nazi'at 1 – 46", jenis: "Murojaah", penilai: "Ust. Hilman Nurhakim", nilai: "Jayyid" },
  { id: "st-5", tanggal: "2026-09-14", materi: "Juz 30 · 'Abasa 1 – 42", jenis: "Murojaah", penilai: "Ust. Fauzan Ramdhani", nilai: "Jayyid Jiddan" },
  { id: "st-6", tanggal: "2026-09-11", materi: "Juz 1 · Al-Baqarah 21 – 39", jenis: "Setoran Baru", penilai: "Ust. Hilman Nurhakim", nilai: "Jayyid" },
  { id: "st-7", tanggal: "2026-09-07", materi: "Juz 30 · At-Takwir 1 – 29", jenis: "Murojaah", penilai: "Ust. Fauzan Ramdhani", nilai: "Perlu Diulang" },
];

export const tahfidz = {
  capaian: "6 Juz 14 Lembar",
  target: "10 Juz — target kelas VIII",
  persen: 64,
  pembimbing: "Ust. Hilman Nurhakim, S.Pd.I",
  jadwal: "Setiap Senin & Kamis, 07.30 – 09.00 WIB",
  tempat: "Masjid Al-Furqan",
};

export type MetodeBayarWali = { id: string; nama: string; keterangan: string; detail: string[] };

/** Cara pembayaran tagihan wali santri (halaman "Sudah Bayar"). */
export const metodeBayarWali: MetodeBayarWali[] = [
  {
    id: "mb-1",
    nama: "Transfer Bank",
    keterangan: "Rekening resmi lembaga",
    detail: [
      "Transfer ke rekening Bank BRI 0123-4567-8901-234 atas nama PC PERSIS Cibatu.",
      "Cantumkan nama santri dan NIS pada berita transfer, contoh: SPP - Muhammad Rizky - 2024.0187.",
      "Simpan bukti transfer, lalu tekan tombol Sudah Bayar pada halaman ini agar tagihan masuk ke pemeriksaan bendahara.",
    ],
  },
  {
    id: "mb-2",
    nama: "QRIS",
    keterangan: "Pindai kode di sekretariat",
    detail: [
      "Kode QRIS resmi lembaga tersedia di sekretariat dan ruang bendahara. Silakan pindai menggunakan aplikasi pembayaran apa pun.",
      "Pastikan nama penerima yang muncul adalah PC PERSIS Cibatu sebelum menyelesaikan pembayaran.",
      "Setelah pembayaran berhasil, tekan tombol Sudah Bayar dan tunjukkan bukti pembayaran kepada petugas.",
    ],
  },
  {
    id: "mb-3",
    nama: "Tunai di Bendahara",
    keterangan: "Senin – Jumat, 07.30 – 15.30 WIB",
    detail: [
      "Pembayaran tunai dilayani langsung di ruang bendahara lembaga pada hari kerja, pukul 07.30 – 15.30 WIB.",
      "Petugas akan mencatat pembayaran dan memberikan tanda terima sementara kepada wali santri.",
      "Tekan tombol Sudah Bayar setelah pembayaran dilakukan agar tagihan tercatat menunggu verifikasi.",
    ],
  },
];

/** Rata-rata nilai seluruh mata pelajaran. */
export const rataRataNilai = () =>
  Math.round(nilaiWali.reduce((t, n) => t + n.nilai, 0) / Math.max(1, nilaiWali.length));

export type Tagihan = {
  id: string;
  label: string;
  keterangan: string;
  jumlah: number;
  jatuhTempo: string;
  status: string;
};

/** Tagihan yang belum dibayar (data awal). */
export const tagihanAwal: Tagihan[] = [
  {
    id: "tg-spmb",
    label: "Daftar ulang (SPMB)",
    keterangan:
      "Tagihan otomatis dari verifikasi SPMB — Perguruan Tinggi PERSIS Cibatu — Kampus Putra. Nominal bisa diubah petugas tata usaha.",
    jumlah: 250000,
    jatuhTempo: "",
    status: "Belum dibayar",
  },
];

export type TagihanMenunggu = {
  id: string;
  label: string;
  jumlah: number;
  metode: string;
  dibayarPada?: string;
};

/** Pembayaran yang sudah dicatat dan menunggu pemeriksaan bendahara (data awal). */
export const menungguAwal: TagihanMenunggu[] = [
  { id: "mn-spp", label: "SPP Bulan Ini", jumlah: 450000, metode: "Transfer Bank" },
  { id: "mn-seragam", label: "Seragam & Perlengkapan", jumlah: 385000, metode: "Transfer Bank" },
];

export type PembayaranRiwayat = { id: string; label: string; jumlah: number; metode: string; tanggal: string };

/** Riwayat pembayaran yang sudah terverifikasi (data awal). */
export const riwayatAwal: PembayaranRiwayat[] = [
  { id: "rw-1", label: "SPP Bulan Lalu", jumlah: 450000, metode: "Transfer Bank", tanggal: "2026-08-11" },
  { id: "rw-2", label: "Uang Kegiatan Semester", jumlah: 275000, metode: "Tunai di Bendahara", tanggal: "2026-08-04" },
  { id: "rw-3", label: "Buku Paket & LKS", jumlah: 320000, metode: "Tunai di Bendahara", tanggal: "2026-07-13" },
  { id: "rw-4", label: "SPP Bulan Juni", jumlah: 450000, metode: "Transfer Bank", tanggal: "2026-06-09" },
  { id: "rw-5", label: "Infaq Pembangunan", jumlah: 200000, metode: "Transfer Bank", tanggal: "2026-05-18" },
  { id: "rw-6", label: "SPP Bulan April", jumlah: 450000, metode: "Tunai di Bendahara", tanggal: "2026-04-10" },
];

/* ---------------------------- paginasi ---------------------------- */

export const UKURAN_HALAMAN = 5;

/** Potongan daftar untuk satu halaman. */
export function potongHalaman<T>(daftar: T[], halaman: number) {
  return daftar.slice((halaman - 1) * UKURAN_HALAMAN, halaman * UKURAN_HALAMAN);
}

/** Nomor halaman yang sah untuk sejumlah data. */
export function halamanSah(total: number, halaman: number) {
  return Math.min(Math.max(1, halaman), Math.max(1, Math.ceil(total / UKURAN_HALAMAN)));
}

export function batasHalaman(total: number, halaman: number) {
  return {
    dari: total === 0 ? 0 : (halaman - 1) * UKURAN_HALAMAN + 1,
    sampai: Math.min(total, halaman * UKURAN_HALAMAN),
    totalHalaman: Math.max(1, Math.ceil(total / UKURAN_HALAMAN)),
  };
}
