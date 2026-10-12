import { hariKe, hariTersisa, rupiah } from "../lib/format";
import { gambar } from "./content";

export type ProgramDonasi = {
  id: string;
  slug: string;
  judul: string;
  kategori: string;
  gambar: string;
  target: number;
  terkumpul: number;
  donatur: number;
  batas: string;
  ringkasan: string;
  pengelola: string;
  body: string[];
  rincian: { item: string; jumlah: number }[];
};

/** Program donasi — data & angka seperti pada situs rujukan. */
export const programDonasi: ProgramDonasi[] = [
  {
    id: "dn-1",
    slug: "pembangunan-ruang-kelas-baru-mts",
    judul: "Pembangunan Ruang Kelas Baru MTs Putra",
    kategori: "Pembangunan",
    gambar: gambar.kelas1,
    target: 350000000,
    terkumpul: 224500000,
    donatur: 487,
    batas: hariKe(24),
    ringkasan: "Empat ruang kelas baru untuk menampung 128 santri MTs putra yang saat ini belajar bergiliran di ruang serbaguna.",
    pengelola: "Bidang Pendidikan & Sarana PC PERSIS Cibatu",
    body: [
      "Jumlah santri MTs putra terus bertambah setiap tahun, sementara ruang kelas yang tersedia belum bertambah sejak empat tahun terakhir. Akibatnya sebagian rombongan belajar harus memakai ruang serbaguna dan belajar bergiliran pada jam siang.",
      "Pembangunan empat ruang kelas baru ini direncanakan di lahan sebelah timur gedung utama, satu bangunan dengan koridor penghubung agar santri tidak kehujanan saat berpindah kelas. Setiap ruang berukuran 7 x 8 meter dengan ventilasi silang dan pencahayaan alami.",
      "Dana yang terkumpul digunakan secara bertahap: pondasi dan struktur terlebih dahulu, lalu dinding, kusen, dan atap, kemudian lantai, listrik, dan pengecatan. Laporan penggunaan dana diumumkan setiap pekan melalui pengumuman resmi lembaga.",
      "Seluruh donasi masuk ke rekening resmi lembaga dan dicatat oleh bendahara. Wali santri, alumni, dan masyarakat umum dapat menyumbang berapa pun jumlahnya, serta dapat menyalurkan bahan bangunan bila lebih mudah.",
    ],
    rincian: [
      { item: "Pondasi, struktur, dan cor dak", jumlah: 148000000 },
      { item: "Dinding, kusen, dan atap", jumlah: 121000000 },
      { item: "Lantai, listrik, dan pengecatan", jumlah: 64000000 },
      { item: "Meja, kursi, dan papan tulis", jumlah: 17000000 },
    ],
  },
  {
    id: "dn-2",
    slug: "beasiswa-santri-yatim-dhuafa",
    judul: "Beasiswa Santri Yatim & Dhuafa",
    kategori: "Pendidikan",
    gambar: gambar.santriwati,
    target: 120000000,
    terkumpul: 92250000,
    donatur: 313,
    batas: hariKe(31),
    ringkasan: "Membiayai pendidikan setahun penuh bagi 60 santri yatim dan dhuafa, mulai dari SPP, seragam, sampai buku pelajaran.",
    pengelola: "Bidang Sosial & Kesejahteraan PC PERSIS Cibatu",
    body: [
      "Lembaga mendata 60 santri yang orang tuanya telah meninggal atau berpenghasilan di bawah kebutuhan dasar. Mereka belajar dengan tekun, namun sebagian sempat berhenti karena tidak sanggup membayar iuran pendidikan.",
      "Beasiswa ini menutup seluruh kebutuhan belajar selama satu tahun ajaran: iuran pendidikan, seragam, buku pelajaran, perlengkapan tulis, serta biaya kegiatan yang bersifat wajib. Keluarga penerima tidak lagi menerima tagihan bulanan selama periode beasiswa.",
      "Penyaluran dilakukan langsung oleh bendahara ke rekening tagihan tiap santri, sehingga tidak ada uang tunai yang berpindah tangan. Nama penerima hanya diketahui oleh pengurus, wali kelas, dan wali santri yang bersangkutan.",
      "Laporan jumlah penerima dan dana tersalur dari program ini dibacakan pada pertemuan wali santri setiap semester sebagai bentuk pertanggungjawaban.",
    ],
    rincian: [
      { item: "Iuran pendidikan 60 santri (1 tahun)", jumlah: 72000000 },
      { item: "Seragam dan perlengkapan belajar", jumlah: 24000000 },
      { item: "Buku pelajaran dan kegiatan wajib", jumlah: 18000000 },
      { item: "Cadangan darurat keluarga santri", jumlah: 6000000 },
    ],
  },
  {
    id: "dn-3",
    slug: "wakaf-al-quran-buku-pelajaran",
    judul: "Wakaf Al-Qur'an & Buku Pelajaran",
    kategori: "Pendidikan",
    gambar: gambar.mengaji,
    target: 45000000,
    terkumpul: 41400000,
    donatur: 206,
    batas: hariKe(12),
    ringkasan: "Pengadaan 600 mushaf Al-Qur'an, 200 terjemah, dan buku pelajaran untuk perpustakaan dan halaqah tahfizh.",
    pengelola: "Bidang Pendidikan & Sarana PC PERSIS Cibatu",
    body: [
      "Setiap halaqah tahfizh memerlukan mushaf dengan standar cetak yang sama supaya ayat dan halaman tidak berbeda antar santri. Saat ini sebagian mushaf sudah rusak dan jumlahnya belum cukup untuk 24 halaqah yang berjalan.",
      "Program ini mengadakan 600 mushaf Al-Qur'an ukuran standar, 200 Al-Qur'an terjemah untuk kelas bawah, serta buku pelajaran pendamping fikih, hadis, dan bahasa Arab untuk perpustakaan lembaga.",
      "Wakaf Al-Qur'an sangat tepat untuk orang tua, alumni, dan donatur yang ingin menyisihkan sebagian rezeki sebagai amal jariyah. Setiap mushaf diberi label nomor wakaf dan dicatat penggunaannya oleh musyrif tahfizh.",
    ],
    rincian: [
      { item: "600 mushaf Al-Qur'an", jumlah: 24000000 },
      { item: "200 Al-Qur'an terjemah", jumlah: 11000000 },
      { item: "Buku pelajaran & rak perpustakaan", jumlah: 10000000 },
    ],
  },
  {
    id: "dn-4",
    slug: "renovasi-tempat-wudhu-toilet-santri",
    judul: "Renovasi Tempat Wudhu & Toilet Santri",
    kategori: "Sarana Ibadah",
    gambar: gambar.masjidJabar,
    target: 60000000,
    terkumpul: 24000000,
    donatur: 120,
    batas: hariKe(18),
    ringkasan: "Perbaikan 18 kran wudhu, saluran air, dan toilet santri yang sudah tidak layak pakai sejak musim hujan lalu.",
    pengelola: "Bidang Sarana & Umum PC PERSIS Cibatu",
    body: [
      "Tempat wudhu dan toilet santri dipakai bergantian oleh ratusan santri setiap hari. Saluran airnya sering tersumbat dan beberapa kran sudah rusak, sehingga air tergenang dan lantai menjadi licin.",
      "Renovasi mencakup penggantian kran dan keramik lantai, pembuatan saluran pembuangan baru, penambahan sekat kayu, serta pemasangan lampu dan kipas angin agar ruang tidak lembap.",
      "Pekerjaan direncanakan berlangsung pada masa libur semester supaya kegiatan belajar tidak terganggu. Selama pengerjaan, santri memakai tempat wudhu masjid utama.",
    ],
    rincian: [
      { item: "Kran, keramik, dan sekat ruang", jumlah: 27000000 },
      { item: "Saluran air dan septictank", jumlah: 22000000 },
      { item: "Lampu, kipas, dan pengecatan", jumlah: 11000000 },
    ],
  },
  {
    id: "dn-5",
    slug: "santunan-bulanan-anak-yatim",
    judul: "Santunan Bulanan Anak Yatim",
    kategori: "Sosial",
    gambar: gambar.masjid,
    target: 30000000,
    terkumpul: 28100000,
    donatur: 265,
    batas: hariKe(9),
    ringkasan: "Santunan bulanan untuk 75 anak yatim di lingkungan Cibatu, disalurkan bersamaan dengan pengajian bulanan.",
    pengelola: "Bidang Sosial & Kesejahteraan PC PERSIS Cibatu",
    body: [
      "Setiap bulan lembaga menyalurkan santunan kepada 75 anak yatim di lingkungan sekitar Cibatu. Penyaluran dilakukan pada pengajian bulanan agar keluarga penerima sekaligus mendapat pendampingan keagamaan.",
      "Dana santunan dipakai untuk kebutuhan dasar anak: makanan bergizi, pakaian, alat tulis, serta biaya pengobatan sederhana. Sisanya disisihkan untuk kegiatan bersama seperti buka puasa dan rihlah anak yatim.",
      "Wali santri dan masyarakat dapat menyumbang rutin setiap bulan berapa pun jumlahnya. Donatur yang menyumbang rutin akan dicatat pada laporan bulanan bidang sosial.",
    ],
    rincian: [
      { item: "Santunan tunai 75 anak", jumlah: 18750000 },
      { item: "Bahan makanan dan pakaian", jumlah: 7500000 },
      { item: "Pengobatan dan kegiatan bersama", jumlah: 3750000 },
    ],
  },
  {
    id: "dn-6",
    slug: "ambulans-layanan-kesehatan-warga",
    judul: "Ambulans & Layanan Kesehatan Warga",
    kategori: "Sosial",
    gambar: gambar.menara,
    target: 180000000,
    terkumpul: 41500000,
    donatur: 97,
    batas: hariKe(45),
    ringkasan: "Pengadaan satu unit ambulans desa untuk melayani rujukan warga Cibatu, khususnya pada malam hari dan musim hujan.",
    pengelola: "Bidang Sosial & Kesejahteraan PC PERSIS Cibatu",
    body: [
      "Warga Cibatu sering kesulitan mencari kendaraan saat harus merujuk pasien ke rumah sakit di Garut pada malam hari. Selama ini keluarga pasien harus mencari mobil sewaan atau menunggu bantuan tetangga.",
      "Lembaga bersama tokoh masyarakat menginisiasi pengadaan satu unit ambulans yang dapat dipinjam warga tanpa biaya, termasuk bantuan tenaga pengemudi dari relawan masjid.",
      "Selain pengadaan kendaraan, program ini menyiapkan peralatan pertolongan pertama, tabung oksigen, dan pelatihan singkat bagi relawan tentang pertolongan pertama dasar.",
    ],
    rincian: [
      { item: "Pengadaan kendaraan ambulans", jumlah: 145000000 },
      { item: "Peralatan medis dan oksigen", jumlah: 22000000 },
      { item: "Pelatihan relawan dan perizinan", jumlah: 13000000 },
    ],
  },
  {
    id: "dn-7",
    slug: "pembangunan-masjid-al-furqan-lantai-dua",
    judul: "Pembangunan Masjid Al-Furqan Lantai Dua",
    kategori: "Pembangunan",
    gambar: gambar.kubahHijau,
    target: 500000000,
    terkumpul: 168300000,
    donatur: 403,
    batas: hariKe(60),
    ringkasan: "Penambahan lantai dua Masjid Al-Furqan untuk menampung jamaah kajian yang terus bertambah setiap pekan.",
    pengelola: "Bidang Dakwah & Masjid PC PERSIS Cibatu",
    body: [
      "Jamaah kajian pekanan Masjid Al-Furqan sudah melebihi daya tampung masjid. Pada kajian besar, sebagian jamaah mengikuti kajian dari halaman dan koridor sekolah.",
      "Pembangunan lantai dua direncanakan seluas 420 meter persegi, dengan ruang utama, tempat wudhu tambahan, dan tangga dua sisi agar arus jamaah tidak menumpuk di satu titik.",
      "Masjid ini juga menjadi pusat kegiatan tahfizh harian santri, sehingga penambahan ruang akan langsung dipakai untuk halaqah pagi dan kajian umum pada malam hari.",
    ],
    rincian: [
      { item: "Struktur dan cor lantai dua", jumlah: 265000000 },
      { item: "Keramik, kusen, dan pengecatan", jumlah: 138000000 },
      { item: "Tempat wudhu dan pencahayaan", jumlah: 62000000 },
      { item: "Karpet dan perlengkapan masjid", jumlah: 35000000 },
    ],
  },
  {
    id: "dn-8",
    slug: "pengadaan-komputer-laboratorium",
    judul: "Pengadaan Komputer Laboratorium MA",
    kategori: "Pendidikan",
    gambar: gambar.ujian,
    target: 90000000,
    terkumpul: 33750000,
    donatur: 88,
    batas: hariKe(38),
    ringkasan: "16 unit komputer untuk praktik informatika dan asesmen berbasis komputer santri Madrasah Aliyah.",
    pengelola: "Bidang Pendidikan & Sarana PC PERSIS Cibatu",
    body: [
      "Madrasah Aliyah menyelenggarakan mata pelajaran informatika dan asesmen berbasis komputer, namun jumlah komputer yang tersedia baru delapan unit dan sebagian berusia lebih dari tujuh tahun.",
      "Program ini mengadakan 16 unit komputer, meja praktik, jaringan lokal, serta pemasangan instalasi listrik yang memadai agar satu kelas dapat praktik bersama.",
      "Perangkat akan ditempatkan di laboratorium lantai satu dan dapat dipakai bergantian oleh jenjang MTs untuk pengenalan teknologi dasar.",
    ],
    rincian: [
      { item: "16 unit komputer dan layar", jumlah: 64000000 },
      { item: "Meja, kursi, dan jaringan lokal", jumlah: 16000000 },
      { item: "Instalasi listrik dan pendingin ruang", jumlah: 10000000 },
    ],
  },
];

/** Kategori program, dipakai untuk saringan di halaman donasi. */
export const kategoriDonasi = ["Pembangunan","Pendidikan","Sarana Ibadah","Sosial"];

/** Jumlah seluruh program donasi. */
export const jumlahProgram = () => programDonasi.length;

/** Kemajuan sebuah program dalam persen (maksimal 100). */
export function progresProgram(p: ProgramDonasi) {
  return {
    terkumpul: p.terkumpul,
    donatur: p.donatur,
    persen: Math.min(100, Math.round((p.terkumpul / p.target) * 100)),
  };
}

/** Seluruh program, batas waktu terdekat lebih dahulu. */
export const programUrut = () => [...programDonasi].sort((a, b) => a.batas.localeCompare(b.batas));

/** Program dengan batas waktu terdekat lebih dahulu. */
export const programMendesak = (jumlah = 5) => programUrut().slice(0, jumlah);

/** Sisa hari sebuah program. */
export const sisaHari = (p: ProgramDonasi) => hariTersisa(p.batas);

/** Ringkas target untuk program utama: "Rp28.100.000 dari target Rp30.000.000". */
export const ringkasTarget = (p: ProgramDonasi) => `${rupiah(p.terkumpul)} dari target ${rupiah(p.target)}`;

/** Cari program berdasarkan alamat. */
export function cariProgram(slug: string) {
  return programDonasi.find((p) => p.slug === slug);
}

/* ------------------------------------------------------------------ */
/* Halaman detail program                                             */
/* ------------------------------------------------------------------ */

export type MetodeDonasi = {
  id: string;
  nama: string;
  keterangan: string;
  langkah: string[];
};

/** Cara menyalurkan donasi, sama seperti rujukan. */
export const metodeDonasi: MetodeDonasi[] = [
  {
    id: "md-1",
    nama: "Transfer Bank",
    keterangan: "Rekening resmi lembaga",
    langkah: [
      "Transfer ke salah satu rekening resmi lembaga yang tercantum di bawah.",
      "Cantumkan nama program pada berita transfer, contoh: Donasi - Beasiswa Santri Yatim & Dhuafa.",
      "Kirim bukti transfer ke bendahara melalui WhatsApp agar donasi tercatat atas nama Anda.",
    ],
  },
  {
    id: "md-2",
    nama: "QRIS",
    keterangan: "Pindai kode di sekretariat",
    langkah: [
      "Kode QRIS resmi lembaga tersedia di sekretariat dan ruang bendahara, dapat dipindai dengan aplikasi pembayaran apa pun.",
      "Pastikan nama penerima yang muncul adalah PC PERSIS Cibatu sebelum menyelesaikan pembayaran.",
      "Tunjukkan bukti pembayaran kepada petugas, lalu kirim salinannya ke bendahara melalui WhatsApp.",
    ],
  },
  {
    id: "md-3",
    nama: "Tunai di Bendahara",
    keterangan: "Serahkan langsung di sekretariat",
    langkah: [
      "Serahkan donasi langsung kepada bendahara pada jam layanan sekretariat, Senin sampai Jumat pukul 07.00–15.00.",
      "Petugas mencatat jumlah dan identitas donatur pada buku penerimaan donasi.",
      "Simpan tanda terima yang diberikan sebagai bukti pencatatan.",
    ],
  },
];

/** Rekening resmi lembaga. */
export const rekeningDonasi = [
  { id: "rk-1", bank: "Bank BRI", nomor: "0123-4567-8901-234", atasNama: "PC PERSIS Cibatu" },
  { id: "rk-2", bank: "Bank Syariah Indonesia", nomor: "7112-345-678", atasNama: "Yayasan Pendidikan PERSIS Cibatu" },
];

/** Pilihan nominal cepat pada formulir donasi. */
export const nominalCepat = [50000, 100000, 250000, 500000, 1000000, 2500000];

/** Tab informasi program. */
export const tabDonasi = [
  { id: "keterangan", label: "Keterangan" },
  { id: "donatur", label: "Donatur" },
  { id: "riwayat", label: "Riwayat" },
];

export type CatatanRiwayat = {
  id: string;
  tanggal: string;
  judul: string;
  keterangan: string;
  jenis: string;
  /** Porsi dana terkumpul (dipakai data contoh bila nominal tidak tersedia). */
  porsi?: number;
  /** Nominal penyaluran yang dicatat petugas ZIS di panel admin. */
  nominal?: number;
};

const riwayatDasar: { hari: number; judul: string; keterangan: string; jenis: string; porsi?: number }[] = [
  {
    hari: -3,
    judul: "Pemeriksaan internal bendahara",
    keterangan:
      "Bendahara memeriksa kesesuaian penggunaan dana dengan rincian kebutuhan yang diumumkan, termasuk bukti pembelian dan foto pelaksanaan.",
    jenis: "Laporan",
  },
  {
    hari: -9,
    judul: "Laporan penggunaan dana tahap 1",
    keterangan:
      "Nota pembelian dan dokumentasi tahap pertama diarsipkan di sekretariat dan dapat diperiksa oleh donatur kapan saja pada jam layanan.",
    jenis: "Laporan",
  },
  {
    hari: -31,
    judul: "Pencairan dana tahap 1",
    keterangan:
      "Dana tahap pertama diserahkan kepada penanggung jawab program sesuai rencana kebutuhan yang tercantum pada halaman ini.",
    jenis: "Penyaluran",
    porsi: 0.3,
  },
  {
    hari: -58,
    judul: "Laporan penerimaan donasi pekan pertama",
    keterangan:
      "Rekap donasi awal beserta jumlah donatur diumumkan melalui pengumuman resmi lembaga dan kanal informasi wali santri.",
    jenis: "Laporan",
  },
  {
    hari: -96,
    judul: "Program dibuka",
    keterangan:
      "Program diumumkan kepada wali santri, alumni, dan masyarakat beserta target, batas waktu, dan rincian penggunaan dana.",
    jenis: "Program",
  },
];

/** Riwayat program, terbaru lebih dahulu. */
export const riwayatProgram = (p: ProgramDonasi): CatatanRiwayat[] =>
  riwayatDasar
    .map((r, i) => ({ ...r, id: `${p.id}-rw-${i + 1}`, tanggal: hariKe(r.hari) }))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

/** Donatur yang sudah tercatat tiap program (urut terbaru). */
const donaturDasar: Record<string, { nama: string; jumlah: number; hari: number; metode: string }[]> = {
  "pembangunan-ruang-kelas-baru-mts": [
    { nama: "Hamba Allah", jumlah: 10000000, hari: -5, metode: "Transfer Bank" },
  ],
  "beasiswa-santri-yatim-dhuafa": [
    { nama: "H. Asep Saepudin", jumlah: 5000000, hari: -6, metode: "Transfer Bank" },
  ],
  "wakaf-al-quran-buku-pelajaran": [
    { nama: "Keluarga Bapak Umar", jumlah: 2500000, hari: -7, metode: "QRIS" },
  ],
  "renovasi-tempat-wudhu-toilet-santri": [
    { nama: "Hudan Miftahurroji", jumlah: 100000, hari: -4, metode: "Transfer Bank" },
    { nama: "Ibu Nenden Hasanah", jumlah: 1500000, hari: -7, metode: "Tunai di Bendahara" },
  ],
  "santunan-bulanan-anak-yatim": [
    { nama: "Alumni MA 2015", jumlah: 1000000, hari: -7, metode: "Transfer Bank" },
  ],
  "ambulans-layanan-kesehatan-warga": [{ nama: "Hamba Allah", jumlah: 500000, hari: -7, metode: "QRIS" }],
  "pembangunan-masjid-al-furqan-lantai-dua": [
    { nama: "Komunitas Pengajian Cibatu", jumlah: 300000, hari: -7, metode: "Tunai di Bendahara" },
  ],
  "pengadaan-komputer-laboratorium": [
    { nama: "Bapak Rahmat Hidayat", jumlah: 250000, hari: -14, metode: "Transfer Bank" },
  ],
};

export type DonaturProgram = { id: string; nama: string; jumlah: number; waktu: string; metode: string };

/** Donatur sebuah program, terbaru lebih dahulu. */
export const donaturProgram = (slug: string): DonaturProgram[] =>
  (donaturDasar[slug] ?? []).map((d, i) => ({
    id: `${slug}-dnr-${i + 1}`,
    nama: d.nama,
    jumlah: d.jumlah,
    waktu: hariKe(d.hari),
    metode: d.metode,
  }));

/** Program lain untuk bagian "Program Lainnya": batas waktu terdekat lebih dahulu. */
export const programLainnya = (slug: string, n = 3) => programUrut().filter((p) => p.slug !== slug).slice(0, n);
