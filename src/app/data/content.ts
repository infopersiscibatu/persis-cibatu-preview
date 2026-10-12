import { angkaRingkas, hariKe } from "../lib/format";

/* ------------------------------------------------------------------ */
/* Identitas lembaga                                                   */
/* ------------------------------------------------------------------ */

export const identitas = {
  logo: "/logo-persis.png",
  pimpinan: "Pimpinan Cabang",
  nama: "Persatuan Islam (PERSIS)",
  namaLengkap: "Persatuan Islam (PERSIS) Cibatu",
  wilayah: "Cibatu – Garut",
  wilayahLengkap: "Cibatu · Garut · Jawa Barat",
  alamat: "Jl. Raya Cibatu No. 12, Kec. Cibatu, Kab. Garut, Jawa Barat 44185",
  telepon: "(0262) 555-1234",
  whatsapp: "0812-3456-7890",
  email: "sekretariat@persiscibatu.or.id",
  jam: "Senin – Jumat, 07.30 – 15.30 WIB",
};

/* ------------------------------------------------------------------ */
/* Gambar                                                              */
/* ------------------------------------------------------------------ */

export const gambar = {
  masjid: "https://images.unsplash.com/photo-1569929919600-59123640bc02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  kelas1: "https://images.pexels.com/photos/35548841/pexels-photo-35548841.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  kelas2: "https://images.pexels.com/photos/35548840/pexels-photo-35548840.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  santriwati: "https://images.unsplash.com/photo-1589104760192-ccab0ce0d90f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  mengaji: "https://images.unsplash.com/photo-1629273229664-11fabc0becc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  berdiskusi: "https://images.unsplash.com/photo-1629273229214-d96be4552b9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  kubahHijau: "https://images.unsplash.com/photo-1667456416191-43ba057635c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  menara: "https://images.unsplash.com/photo-1601191362988-ac6ebec629c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ujian: "https://images.pexels.com/photos/19520532/pexels-photo-19520532.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  masjidPutih: "https://images.pexels.com/photos/38973253/pexels-photo-38973253.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  masjidJabar: "https://images.pexels.com/photos/37945700/pexels-photo-37945700.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
};

/* ------------------------------------------------------------------ */
/* Beranda                                                             */
/* ------------------------------------------------------------------ */

export const slide = [
  {
    id: "sl-1",
    image: gambar.masjid,
    tag: "Selamat Datang",
    title: "Membangun Generasi Qur'ani & Berakhlak Mulia",
    text: "Pendidikan Islam terpadu di bawah naungan Pimpinan Cabang Persatuan Islam Cibatu, Garut.",
  },
  {
    id: "sl-2",
    image: gambar.kelas1,
    tag: "SPMB 2026/2027",
    title: "Sistem Penerimaan Murid & Mahasiswa Baru Telah Dibuka",
    text: "RA, MI, MTs, MA, dan Perguruan Tinggi. Kuota terbatas — daftar lebih awal, dapatkan potongan biaya pendaftaran.",
  },
  {
    id: "sl-3",
    image: gambar.kelas2,
    tag: "Program Unggulan",
    title: "Tahfidz, Bahasa, dan Sains dalam Satu Kurikulum",
    text: "Kelas tahfidz 30 juz, program bilingual Arab–Inggris, dan laboratorium sains untuk jenjang menengah.",
  },
  {
    id: "sl-4",
    image: gambar.masjidPutih,
    tag: "Kajian Rutin",
    title: "Kajian Ahad Subuh Bersama PC PERSIS Cibatu",
    text: "Setiap Ahad, 05.30 WIB di Masjid Al-Furqan Cibatu. Terbuka untuk seluruh kaum muslimin.",
  },
];

export const statistik = [
  {
    icon: "graduation-cap",
    labelPendek: "Jenjang",
    id: "st-1",
    label: "Jenjang Pendidikan",
    value: "5",
    unit: "jenjang",
    note: "RA — Perguruan Tinggi",
    tone: "green",
  },
  {
    icon: "users",
    labelPendek: "Siswa & Santri",
    id: "st-2",
    label: "Siswa & Santri",
    value: "1.248",
    unit: "jiwa",
    note: "Tahun ajaran ini",
    tone: "gold",
  },
  {
    icon: "book-open",
    labelPendek: "Mahasiswa",
    id: "st-3",
    label: "Mahasiswa",
    value: "312",
    unit: "mahasiswa",
    note: "Perguruan Tinggi PERSIS Cibatu",
    tone: "mint",
  },
];

export const menu = [
  {
    id: "mn-1",
    label: "Profil",
    desc: "Sejarah & struktur",
    icon: "user",
    tone: "green",
    testid: "profil",
    halaman: "profil",
  },
  {
    id: "mn-2",
    label: "Jenjang",
    desc: "RA – Perguruan Tinggi",
    icon: "graduation-cap",
    tone: "gold",
    testid: "jenjang",
    halaman: "jenjang",
  },
  {
    id: "mn-3",
    label: "SPMB",
    desc: "Daftar online",
    icon: "clipboard",
    tone: "peach",
    testid: "ppdb",
    halaman: "ppdb",
    badge: "Buka",
  },
  {
    id: "mn-4",
    label: "Wali Santri",
    desc: "Portal wali",
    icon: "users",
    tone: "sky",
    testid: "wali",
    halaman: "wali",
  },
  {
    id: "mn-5",
    label: "Galeri",
    desc: "Foto kegiatan",
    icon: "image",
    tone: "lilac",
    testid: "galeri",
    halaman: "galeri",
  },
  {
    id: "mn-6",
    label: "Berita",
    desc: "Kabar lembaga",
    icon: "newspaper",
    tone: "mint",
    testid: "berita",
    halaman: "berita",
  },
  {
    id: "mn-7",
    label: "Kajian",
    desc: "Jadwal & rekaman",
    icon: "book-open",
    tone: "green",
    testid: "kajian",
    halaman: "kajian",
  },
  {
    id: "mn-8",
    label: "Kontak",
    desc: "Hubungi kami",
    icon: "phone",
    tone: "gold",
    testid: "kontak",
    halaman: "kontak",
  },
];

export const profil = {
  image: gambar.masjidJabar,
  imageAlt: "Masjid berkubah hijau di lingkungan PC PERSIS Cibatu, Jawa Barat",
  summary: [
    "Pimpinan Cabang Persatuan Islam (PERSIS) Cibatu adalah bagian dari jamiyah Persatuan Islam yang bergerak di bidang pendidikan, dakwah, dan sosial kemasyarakatan di wilayah Kecamatan Cibatu, Kabupaten Garut.",
    "Sejak awal berdirinya, PC PERSIS Cibatu mengelola lembaga pendidikan formal dan non-formal — mulai dari Raudhatul Athfal, Madrasah Ibtidaiyah, Madrasah Tsanawiyah, Madrasah Aliyah, hingga majelis taklim dan program tahfizh — dengan rujukan utama Al-Qur'an dan As-Sunnah.",
  ],
  motto: "Iman, Ilmu, dan Amal",
  periode: "Periode 2026 – 2030",
  visi: "Menjadi lembaga pendidikan Islam yang unggul dan terpercaya dalam melahirkan generasi beriman, berilmu, dan beramal sesuai tuntunan Al-Qur'an dan As-Sunnah.",
  misi: [
    "Menyelenggarakan pendidikan yang memadukan ilmu agama dan ilmu umum secara seimbang.",
    "Membina akhlak, ibadah, dan kemandirian peserta didik melalui keteladanan pendidik.",
    "Menggerakkan dakwah, kajian, dan kegiatan sosial bagi jamaah serta masyarakat sekitar.",
    "Mengembangkan tata kelola lembaga yang amanah, transparan, dan berorientasi mutu.",
  ],
};

export const pengurus = [
  {
    id: "pg-1",
    nama: "Ust. H. Ahmad Fauzan, Lc., M.A.",
    jabatan: "Ketua Pimpinan Cabang",
  },
  {
    id: "pg-2",
    nama: "Ust. Dedi Rosyadi, S.Ag.",
    jabatan: "Wakil Ketua",
  },
  {
    id: "pg-3",
    nama: "Ust. Rizki Hidayatullah, S.Pd.",
    jabatan: "Sekretaris",
  },
  {
    id: "pg-4",
    nama: "H. Endang Kusnadi",
    jabatan: "Bendahara",
  },
  {
    id: "pg-5",
    nama: "Ust. Muhammad Nurdin, Lc.",
    jabatan: "Bidang Dakwah",
  },
  {
    id: "pg-6",
    nama: "Ust. Agus Salim, S.Pd.",
    jabatan: "Bidang Pendidikan",
  },
];

/* ------------------------------------------------------------------ */
/* Inisial nama                                                        */
/* ------------------------------------------------------------------ */

const GELAR = new Set([
  "ust",
  "ustadz",
  "ustadzah",
  "kh",
  "h",
  "hj",
  "haji",
  "hajjah",
  "drs",
  "dra",
  "dr",
  "prof",
  "ir",
  "lc",
  "ma",
  "mpd",
  "spd",
  "sag",
  "ssi",
  "se",
  "sh",
  "mh",
  "mm",
  "ba",
]);

export function inisial(nama: string | null | undefined): string {
  const bagian = (nama ?? "")
    .split(/[\s,]+/)
    .map((k) => k.replace(/\./g, "").toLowerCase())
    .filter((k) => k.length > 1 && !GELAR.has(k));
  return ((bagian[0]?.[0] ?? "P") + (bagian[1]?.[0] ?? "")).toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Pengumuman                                                          */
/* ------------------------------------------------------------------ */

export type Pengumuman = {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  detail: string[];
  pinned?: boolean;
  views: number;
};

export const pengumuman: Pengumuman[] = [
  {
    id: "an-1",
    title: "Jadwal Ujian Akhir Semester Ganjil 1447 H",
    date: hariKe(-1),
    category: "Akademik",
    summary: "Ujian berlangsung 24 Februari – 3 Maret 2026 untuk seluruh jenjang. Kartu ujian dapat diambil di ruang tata usaha mulai pekan depan.",
    detail: [
      "Ujian Akhir Semester Ganjil 1447 H dilaksanakan serentak untuk jenjang RA, MI, MTs, MA, dan Perguruan Tinggi mulai 24 Februari sampai 3 Maret 2026. Jadwal tiap mata pelajaran berbeda, sehingga peserta diharapkan memeriksa jadwal jenjangnya masing-masing.",
      "Kartu ujian dapat diambil di ruang tata usaha setiap hari kerja mulai pekan depan dengan menunjukkan bukti pembayaran administrasi. Peserta yang administrasinya belum lunas diarahkan menemui bagian keuangan sebelum kartu ujian dicetak.",
      "Peserta wajib hadir lima belas menit sebelum ujian dimulai, membawa alat tulis sendiri, dan mengenakan seragam sesuai ketentuan jenjang. Ponsel dan catatan dalam bentuk apa pun tidak diperkenankan masuk ke ruang ujian.",
      "Bagi peserta yang sakit atau berhalangan, orang tua dapat mengajukan ujian susulan melalui wali kelas paling lambat tiga hari setelah jadwal berakhir.",
    ],
    pinned: true,
    views: 1840,
  },
  {
    id: "an-2",
    title: "Kuota SPMB Gelombang I Tersisa 38 Kursi",
    date: hariKe(-4),
    category: "SPMB",
    summary: "Pendaftaran gelombang I ditutup 28 Februari 2026. Pastikan berkas akta kelahiran dan kartu keluarga diunggah lengkap.",
    detail: [
      "Pendaftaran SPMB gelombang I ditutup pada 28 Februari 2026 pukul 15.00 WIB. Hingga pengumuman ini diterbitkan, sisa kuota tercatat 38 kursi dengan sebaran berbeda di setiap jenjang.",
      "Berkas yang perlu dilengkapi meliputi akta kelahiran, kartu keluarga, pas foto ukuran 3x4 berlatar merah, serta nilai rapor semester terakhir bagi pendaftar jenjang MTs dan MA.",
      "Berkas yang belum lengkap masih dapat menyusul maksimal satu pekan setelah pendaftaran, dengan syarat orang tua atau wali mengonfirmasi kepada panitia SPMB melalui WhatsApp resmi.",
      "Pendaftar yang mendaftar setelah kuota gelombang I habis akan otomatis diarahkan ke gelombang II dengan ketentuan biaya yang berlaku pada gelombang tersebut.",
    ],
    views: 1522,
  },
  {
    id: "an-3",
    title: "Pembagian Rapor & Pertemuan Wali Santri",
    date: hariKe(-8),
    category: "Umum",
    summary: "Pertemuan wali santri dilaksanakan serentak di aula PC PERSIS Cibatu, pukul 08.00 WIB, dilanjutkan sesi tanya jawab.",
    detail: [
      "Pembagian rapor sekaligus pertemuan wali santri dilaksanakan serentak di aula PC PERSIS Cibatu mulai pukul 08.00 WIB. Kegiatan dibuka dengan tausiyah singkat, dilanjutkan penyerahan rapor per kelas, dan diakhiri sesi tanya jawab bersama wali kelas.",
      "Orang tua atau wali diharapkan hadir tepat waktu dan membawa kartu wali santri. Bagi yang berhalangan hadir, rapor dapat diambil di ruang tata usaha pada hari kerja berikutnya.",
      "Pertemuan ini menjadi kesempatan membahas perkembangan belajar, hafalan, serta pembinaan akhlak ananda bersama dewan guru, sehingga kehadiran orang tua sangat kami harapkan.",
    ],
    views: 964,
  },
  {
    id: "an-4",
    title: "Libur Awal Ramadhan dan Kegiatan Pesantren Kilat",
    date: hariKe(-12),
    category: "Dakwah",
    summary: "KBM diliburkan pada dua hari pertama Ramadhan, digantikan jadwal khusus pesantren kilat untuk seluruh jenjang.",
    detail: [
      "Kegiatan belajar mengajar diliburkan pada dua hari pertama Ramadhan. Sebagai gantinya, seluruh jenjang mengikuti pesantren kilat dengan jadwal khusus yang lebih ringkas, dimulai pukul 07.30 sampai 11.30 WIB.",
      "Materi pesantren kilat meliputi tadarus bersama, kajian fiqih puasa, praktik wudhu dan shalat, serta lomba hafalan antar kelas. Peserta membawa perlengkapan ibadah dan Al-Qur'an masing-masing.",
      "Setelah pekan pesantren kilat, KBM kembali berjalan dengan jadwal Ramadhan yang berlaku hingga berakhirnya bulan suci.",
    ],
    views: 1187,
  },
  {
    id: "an-5",
    title: "Pengambilan Seragam & Buku Pegangan Siswa Baru",
    date: hariKe(-16),
    category: "Umum",
    summary: "Seragam dapat diambil di koperasi sekolah setiap hari kerja pukul 08.00 – 14.00 WIB dengan membawa bukti pembayaran.",
    detail: [
      "Pengambilan seragam dan buku pegangan siswa baru dilayani di koperasi sekolah setiap hari kerja pukul 08.00 sampai 14.00 WIB. Petugas koperasi akan memeriksa ukuran seragam bersama siswa agar tidak perlu penukaran.",
      "Harap membawa bukti pembayaran asli atau tangkapan layar bukti transfer. Pengambilan tidak dapat diwakilkan kepada pihak lain di luar keluarga siswa.",
      "Bila ukuran seragam tidak sesuai, penukaran dapat dilakukan paling lambat tujuh hari setelah pengambilan, dengan syarat label dan kemasan belum dilepas.",
    ],
    views: 703,
  },
];

/* ------------------------------------------------------------------ */
/* Berita                                                              */
/* ------------------------------------------------------------------ */

export type Berita = {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: string;
  image: string;
  views: number;
  author: string;
  excerpt: string;
  body: string[];
};

export const berita: Berita[] = [
  {
    id: "nw-1",
    slug: "santri-juara-mtq-kabupaten-garut",
    title: "Santri PC PERSIS Cibatu Raih Juara I MTQ Tingkat Kabupaten Garut",
    date: hariKe(-2),
    category: "Prestasi",
    image: gambar.masjidPutih,
    views: 4820,
    author: "Humas PC PERSIS Cibatu",
    excerpt: "Ananda Rizky Nurhakim, santri kelas XI, berhasil menyisihkan 42 peserta dari berbagai lembaga pendidikan Islam di Garut.",
    body: [
      "Ananda Rizky Nurhakim, santri kelas XI Madrasah Aliyah PC PERSIS Cibatu, berhasil meraih juara I cabang tilawah dewasa pada Musabaqah Tilawatil Qur'an tingkat Kabupaten Garut. Ia menyisihkan 42 peserta dari berbagai lembaga pendidikan Islam dan pesantren di seluruh Garut.",
      "Penilaian mencakup tajwid, lagu, dan adab pembacaan. Dewan hakim menilai bacaan Ananda Rizky stabil sejak babak penyisihan hingga final, terutama pada maqam bayati dan hijaz yang menjadi kekuatannya.",
      "Kepala Madrasah Aliyah menyampaikan bahwa capaian ini adalah buah pembinaan tahsin dan tahfizh harian yang berjalan sejak kelas X. Lembaga berencana mengirimkan kembali para juara pada MTQ tingkat provinsi Jawa Barat tahun depan.",
      "Kepala Kantor Kementerian Agama Kabupaten Garut menyerahkan trofi dan piagam kepada para juara pada upacara penutupan. Ia menekankan bahwa MTQ bukan sekadar lomba, melainkan sarana pembinaan generasi Qur'ani di lingkungan pendidikan.",
      "Pembina tahfizh lembaga menyebut persiapan Ananda Rizky berlangsung sekitar dua bulan dengan latihan harian usai pembelajaran, meliputi muraja'ah hafalan, latihan pernapasan, dan penguatan tajwid.",
      "Setelah kompetisi, santri tersebut tetap menjalani kegiatan belajar seperti biasa dan akan mendampingi santri junior pada pembinaan tilawah pekanan di masjid lembaga.",
      "Lembaga mengucapkan terima kasih kepada para guru, musyrif, dan wali santri atas dukungan yang diberikan. Doa serta dukungan serupa diharapkan menyertai persiapan menuju MTQ tingkat provinsi.",
    ],
  },
  {
    id: "nw-2",
    slug: "kunjungan-studi-banding-pc-persis-sumedang",
    title: "Kunjungan Studi Banding dari PC PERSIS Sumedang",
    date: hariKe(-6),
    category: "Lembaga",
    image: gambar.kubahHijau,
    views: 3610,
    author: "Sekretariat PC PERSIS Cibatu",
    excerpt: "Delegasi membahas pengelolaan ma'had, kurikulum tahfidz, dan tata kelola keuangan lembaga pendidikan.",
    body: [
      "Sebanyak 24 pengurus dan kepala sekolah dari PC PERSIS Sumedang berkunjung ke kompleks pendidikan PC PERSIS Cibatu. Delegasi diterima pimpinan cabang dan para kepala jenjang di Aula Utama.",
      "Pertemuan membahas pengelolaan ma'had, penyusunan kurikulum tahfidz, tata kelola keuangan lembaga, serta pembinaan guru baru. Diskusi berlangsung dua arah dan dilanjutkan dengan peninjauan ruang kelas, asrama, dan masjid.",
      "Pimpinan Cabang menyambut baik silaturahim ini dan berharap kerja sama antar cabang PERSIS terus berlanjut, terutama dalam penguatan mutu pendidikan diniyyah dan kaderisasi pengajar.",
      "Dalam sesi peninjauan, delegasi melihat langsung kegiatan belajar di ruang kelas, asrama santri, serta laboratorium komputer dan robotika yang baru diresmikan.",
      "Sebagai penutup, kedua cabang menyepakati kerja sama bidang pelatihan guru dan pertukaran pengalaman kurikulum. Pertemuan lanjutan direncanakan berlangsung di Sumedang pada semester depan.",
    ],
  },
  {
    id: "nw-3",
    slug: "pelatihan-guru-bahasa-arab-kontemporer",
    title: "Pelatihan Guru: Metode Pembelajaran Bahasa Arab Kontemporer",
    date: hariKe(-9),
    category: "Akademik",
    image: gambar.mengaji,
    views: 2985,
    author: "Bidang Pendidikan",
    excerpt: "Diikuti 68 guru dari semua jenjang, pelatihan menekankan pendekatan komunikatif dan praktik kelas dua arah.",
    body: [
      "Sebanyak 68 guru dari seluruh jenjang mengikuti pelatihan metode pembelajaran bahasa Arab yang digelar bidang pendidikan PC PERSIS Cibatu. Kegiatan berlangsung tiga hari dengan pendekatan komunikatif dan praktik kelas dua arah.",
      "Peserta dilatih menyusun skenario pembelajaran, memanfaatkan media sederhana, dan menyusun asesmen yang mengukur kemampuan berbicara, bukan hanya hafalan kosakata. Setiap guru mempraktikkan langsung materi di depan peserta lain untuk mendapat masukan.",
      "Hasil pelatihan akan diterapkan pada semester berikutnya dengan pendampingan berkala dari tim kurikulum, sehingga perbaikan mutu pembelajaran bahasa Arab dapat terukur dari kelas ke kelas.",
      "Selain materi kelas, peserta menyusun perangkat ajar sederhana untuk diuji coba pada kelas masing-masing. Hasil uji coba dibahas kembali dalam pertemuan lanjutan bulan depan.",
    ],
  },
  {
    id: "nw-4",
    slug: "bakti-sosial-ramadhan-500-paket-sembako",
    title: "Bakti Sosial Ramadhan: 500 Paket Sembako untuk Warga Cibatu",
    date: hariKe(-14),
    category: "Sosial",
    image: gambar.berdiskusi,
    views: 2410,
    author: "Bidang Sosial",
    excerpt: "Program tahunan bidang sosial PC PERSIS Cibatu menyasar delapan desa di wilayah Kecamatan Cibatu.",
    body: [
      "Bidang sosial PC PERSIS Cibatu menyalurkan 500 paket sembako kepada warga di delapan desa wilayah Kecamatan Cibatu menjelang akhir Ramadhan. Paket berisi beras, minyak, gula, dan kebutuhan pokok harian.",
      "Penyaluran melibatkan pengurus cabang, guru, dan relawan santri yang mendata penerima bersama aparat desa. Data penerima disusun dari usulan RT dan RW agar bantuan tepat sasaran, terutama untuk janda, lansia, dan keluarga prasejahtera.",
      "Kegiatan ini dibiayai dari infak jamaah dan donasi wali santri. Lembaga mengucapkan terima kasih atas kepercayaan tersebut dan berkomitmen menyampaikan laporan penyaluran secara terbuka.",
    ],
  },
  {
    id: "nw-5",
    slug: "peresmian-laboratorium-komputer-dan-robotika",
    title: "Peresmian Laboratorium Komputer dan Robotika",
    date: hariKe(-19),
    category: "Fasilitas",
    image: gambar.ujian,
    views: 1975,
    author: "Sekretariat PC PERSIS Cibatu",
    excerpt: "Fasilitas baru berisi 40 unit komputer ini dipakai untuk pembelajaran informatika dan ekstrakurikuler robotika.",
    body: [
      "PC PERSIS Cibatu meresmikan laboratorium komputer dan robotika berisi 40 unit komputer lengkap dengan jaringan internet. Fasilitas ini dipakai untuk pembelajaran informatika di MTs dan MA, serta ekstrakurikuler robotika.",
      "Ruang laboratorium ditata dengan penataan meja berkelompok agar guru dapat mendampingi praktik siswa secara langsung. Tersedia juga satu area kerja khusus untuk penyusunan dan pengujian proyek robotik.",
      "Pengelolaan laboratorium diserahkan kepada tim teknologi pendidikan dengan jadwal pemakaian per kelas. Sekolah berencana menambah modul sensor dan kit mikrokontroler secara bertahap sesuai kebutuhan praktik.",
    ],
  },
  {
    id: "nw-6",
    slug: "pekan-olahraga-dan-seni-antarjenjang",
    title: "Pekan Olahraga dan Seni Antarjenjang Berlangsung Meriah",
    date: hariKe(-26),
    category: "Kesiswaan",
    image: gambar.santriwati,
    views: 1320,
    author: "Bidang Kesiswaan",
    excerpt: "Enam belas cabang lomba dipertandingkan selama empat hari, ditutup dengan malam penampilan seni santri.",
    body: [
      "Pekan Olahraga dan Seni antarjenjang berlangsung empat hari dengan 16 cabang lomba, mulai dari futsal, voli, bulu tangkis, hingga kaligrafi, pidato tiga bahasa, dan tahfizh.",
      "Setiap jenjang mengirimkan kontingen terbaiknya, termasuk peserta dari program MDT sore hari. Pertandingan berlangsung sportif dan dimeriahkan dukungan wali santri yang hadir di lapangan.",
      "Acara ditutup dengan malam penampilan seni santri berupa nasyid, tilawah, dan teater bertema adab menuntut ilmu. Juara umum diraih Madrasah Tsanawiyah dengan selisih dua poin dari MA.",
    ],
  },
  {
    id: "nw-7",
    slug: "tablig-akbar-dan-silaturahim-jamaah-persis",
    title: "Tablig Akbar dan Silaturahim Jamaah PERSIS Cibatu",
    date: hariKe(-33),
    category: "Dakwah",
    image: gambar.kubahHijau,
    views: 1685,
    author: "Bidang Dakwah",
    excerpt: "Kegiatan dihadiri lebih dari 1.200 jamaah dari Cibatu dan kecamatan sekitar, diisi kajian dan tanya jawab fiqih.",
    body: [
      "Bidang dakwah PC PERSIS Cibatu menggelar tablig akbar dan silaturahim jamaah yang dihadiri lebih dari 1.200 peserta dari Cibatu dan kecamatan sekitar. Acara berlangsung di Masjid Al-Furqan Cibatu.",
      "Kajian membahas kedudukan ilmu dan adab dalam kehidupan sehari-hari, dilanjutkan sesi tanya jawab fiqih yang dipandu pengurus cabang. Jamaah juga mendapat kesempatan berkonsultasi langsung dengan para asatidz.",
      "Kegiatan seperti ini direncanakan berlangsung berkala sebagai sarana pembinaan jamaah sekaligus mempererat ukhuwah antarwarga dan wali santri di lingkungan lembaga pendidikan.",
    ],
  },
  {
    id: "nw-8",
    slug: "wisuda-hafizh-30-juz-angkatan-tahun-ini",
    title: "Wisuda 12 Santri Hafizh 30 Juz Angkatan Tahun Ini",
    date: hariKe(-40),
    category: "Prestasi",
    image: gambar.mengaji,
    views: 1450,
    author: "Bidang Tahfizh",
    excerpt: "Prosesi wisuda berlangsung khidmat dengan pengujian hafalan terbuka di hadapan penguji dan wali santri.",
    body: [
      "Sebanyak 12 santri dan santriwati diwisuda sebagai hafizh 30 juz pada angkatan tahun ini. Prosesi berlangsung khidmat dengan pengujian hafalan terbuka di hadapan penguji dan wali santri.",
      "Setiap peserta menyetorkan beberapa juz pilihan secara acak untuk memastikan mutu hafalan, disertai penilaian tajwid dan kelancaran. Rata-rata masa penyelesaian hafalan berkisar tiga sampai empat tahun sejak jenjang MTs.",
      "Lembaga memberikan apresiasi berupa piagam dan beasiswa lanjutan bagi yang melanjutkan ke perguruan tinggi. Program tahfizh tetap dibuka bagi santri baru dengan kelas persiapan dan pendampingan musyrif.",
    ],
  },
  {
    id: "nw-9",
    slug: "kurikulum-tahfidz-terpadu-mulai-semester-baru",
    title: "Kurikulum Tahfidz Terpadu Mulai Diterapkan Semester Baru",
    date: hariKe(-47),
    category: "Akademik",
    image: gambar.kelas1,
    views: 1120,
    author: "Bidang Kurikulum",
    excerpt: "Setiap jenjang memiliki target hafalan bertingkat, dipantau melalui buku mutaba'ah harian dan laporan daring.",
    body: [
      "Mulai semester baru, lembaga menerapkan kurikulum tahfidz terpadu dengan target hafalan bertingkat untuk tiap jenjang, mulai dari juz 30 di tingkat dasar hingga 10 juz di jenjang menengah.",
      "Setiap santri memakai buku mutaba'ah harian yang mencatat setoran, muraja'ah, dan catatan musyrif. Wali santri dapat memantau capaian tersebut melalui laporan berkala dari wali kelas.",
      "Tim kurikulum menilai pemisahan target per jenjang membuat pembinaan lebih terukur, sehingga santri yang cepat dapat memperoleh program pengayaan sementara yang perlu pendampingan mendapat kelas perbaikan.",
    ],
  },
  {
    id: "nw-10",
    slug: "rapat-kerja-penyusunan-rkas-lembaga",
    title: "Rapat Kerja Penyusunan RKAS dan Program Tahun Berjalan",
    date: hariKe(-55),
    category: "Lembaga",
    image: gambar.masjidJabar,
    views: 890,
    author: "Sekretariat PC PERSIS Cibatu",
    excerpt: "Seluruh kepala jenjang, bendahara, dan bidang menyusun rencana kegiatan serta anggaran satu tahun ke depan.",
    body: [
      "Seluruh kepala jenjang, bendahara, dan perwakilan bidang mengikuti rapat kerja penyusunan rencana kegiatan dan anggaran sekolah (RKAS) untuk tahun berjalan. Rapat berlangsung dua hari di aula lembaga.",
      "Pembahasan mencakup program pembelajaran, pengembangan sarana, kesejahteraan guru, serta alokasi beasiswa bagi santri kurang mampu. Setiap jenjang memaparkan usulan dan prioritas kegiatannya.",
      "Hasil rapat kerja menjadi dasar pelaksanaan program sepanjang tahun dan akan dievaluasi setiap triwulan. Laporan penggunaan anggaran disampaikan kepada pimpinan cabang dan dewan penasihat.",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Agenda                                                              */
/* ------------------------------------------------------------------ */

export type Agenda = {
  id: string;
  title: string;
  date: string;
  time: string;
  place: string;
  tag: string;
  detail: string[];
};

export const agenda: Agenda[] = [
  {
    id: "ag-1",
    title: "Peringatan Isra Mi'raj 1447 H",
    date: hariKe(3),
    time: "07.30 – 11.00 WIB",
    place: "Aula PC PERSIS Cibatu",
    tag: "Dakwah",
    detail: [
      "Peringatan Isra Mi'raj 1447 H digelar di aula PC PERSIS Cibatu mulai pukul 07.30 WIB dan terbuka untuk seluruh siswa, wali santri, serta masyarakat umum.",
      "Acara diisi tausiyah tentang hikmah perjalanan Isra Mi'raj, penampilan hadrah santri, dan doa bersama untuk keberkahan lembaga. Peserta diharapkan membawa alas duduk sendiri.",
      "Panitia menyediakan konsumsi ringan bagi peserta yang mendaftar lebih dahulu melalui wali kelas atau pengurus jenjang.",
    ],
  },
  {
    id: "ag-2",
    title: "Tes Baca Al-Qur'an Calon Santri Baru",
    date: hariKe(6),
    time: "08.00 – 12.00 WIB",
    place: "Gedung B, Lantai 2",
    tag: "SPMB",
    detail: [
      "Tes baca Al-Qur'an diikuti seluruh calon santri baru yang pendaftarannya telah diverifikasi. Tes dibagi dalam beberapa sesi mulai pukul 08.00 sampai 12.00 WIB.",
      "Materi tes mencakup kelancaran membaca, makharijul huruf, dan hafalan surat pendek sesuai jenjang yang dituju. Calon santri cukup membawa kartu peserta tes.",
      "Hasil tes disampaikan melalui WhatsApp orang tua atau wali paling lambat tiga hari kerja setelah pelaksanaan, dan menjadi bahan penempatan kelas tahsin.",
    ],
  },
  {
    id: "ag-3",
    title: "Rapat Koordinasi Dewan Guru & Wali Kelas",
    date: hariKe(9),
    time: "13.00 – 15.00 WIB",
    place: "Ruang Rapat Sekretariat",
    tag: "Internal",
    detail: [
      "Rapat koordinasi dewan guru dan wali kelas membahas evaluasi tengah semester, kesiapan ujian akhir, serta pembagian tugas pendampingan santri berprestasi dan yang perlu perhatian khusus.",
      "Setiap wali kelas menyerahkan laporan singkat perkembangan kelasnya. Agenda berikutnya adalah penyusunan jadwal ujian dan penetapan target capaian hafalan.",
      "Rapat hanya untuk internal pengajar. Hasil rapat akan disampaikan kepada orang tua melalui surat edaran jenjang masing-masing.",
    ],
  },
  {
    id: "ag-4",
    title: "Manasik Haji Anak & Latihan Qurban",
    date: hariKe(13),
    time: "06.30 – 10.00 WIB",
    place: "Lapangan Cibatu",
    tag: "Kesiswaan",
    detail: [
      "Manasik haji anak dan latihan qurban dilaksanakan di Lapangan Cibatu mulai pukul 06.30 WIB. Kegiatan ini melatih tata cara ibadah haji sekaligus tata cara penyembelihan qurban sesuai syariat.",
      "Seluruh peserta mengenakan pakaian ihram atau seragam sekolah, membawa botol minum, dan topi. Perwakilan wali santri diundang hadir untuk mendampingi.",
      "Panitia menyiapkan area terpisah bagi peserta jenjang RA dan MI, dengan pengawasan guru pendamping di setiap kelompok.",
    ],
  },
  {
    id: "ag-5",
    title: "Tablig Akbar & Buka Puasa Bersama",
    date: hariKe(17),
    time: "16.30 – 19.00 WIB",
    place: "Masjid Al-Furqan",
    tag: "Umum",
    detail: [
      "Tablig akbar dan buka puasa bersama digelar di Masjid Al-Furqan mulai pukul 16.30 WIB sampai selesai. Acara terbuka untuk umum dan seluruh keluarga besar PC PERSIS Cibatu.",
      "Rangkaian acara meliputi kultum menjelang berbuka, shalat Maghrib berjamaah, makan bersama, dan penutup berupa doa serta pengumuman program Ramadhan lembaga.",
      "Panitia menyediakan takjil bagi peserta yang hadir. Bagi yang ingin berbagi, donasi dapat disalurkan melalui sekretariat untuk mendukung kegiatan pesantren kilat dan santunan anak yatim.",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Kajian                                                              */
/* ------------------------------------------------------------------ */

export type Kajian = {
  id: string;
  title: string;
  ustadz: string;
  day: string;
  date: string;
  time: string;
  place: string;
  kitab: string;
  live?: boolean;
};

export const kajian: Kajian[] = [
  {
    id: "kj-1",
    title: "Kajian Ahad Subuh: Tafsir Surah Al-Fatihah",
    ustadz: "Ust. H. Ahmad Fauzan, Lc., M.A.",
    day: "Selasa, 6 Okt 2026",
    date: hariKe(1),
    time: "05.30 WIB",
    place: "Masjid Al-Furqan Cibatu",
    kitab: "Tafsir Ibnu Katsir",
    live: true,
  },
  {
    id: "kj-2",
    title: "Kajian Rutin Muslimah: Adab Keluarga Sakinah",
    ustadz: "Ustadzah Nur Aisyah, S.Pd.I.",
    day: "Jumat, 9 Okt 2026",
    date: hariKe(4),
    time: "09.00 WIB",
    place: "Aula Muslimah",
    kitab: "Riyadhus Shalihin",
  },
  {
    id: "kj-3",
    title: "Fiqih Ibadah Praktis untuk Wali Santri",
    ustadz: "Ust. Deden Saepudin, M.Pd.",
    day: "Sabtu, 10 Okt 2026",
    date: hariKe(5),
    time: "16.00 WIB",
    place: "Gedung B, Lantai 1",
    kitab: "Fikih Sunnah",
  },
  {
    id: "kj-4",
    title: "Kajian Kitab Tauhid untuk Remaja Masjid",
    ustadz: "Ust. Hilmi Rahman, Lc.",
    day: "Ahad, 11 Okt 2026",
    date: hariKe(6),
    time: "19.30 WIB",
    place: "Masjid Al-Furqan Cibatu",
    kitab: "Kitab Tauhid",
  },
  {
    id: "kj-5",
    title: "Sirah Nabawiyah: Pelajaran dari Perang Badar",
    ustadz: "Ust. M. Ihsan Nurdin, Lc.",
    day: "Senin, 12 Okt 2026",
    date: hariKe(7),
    time: "20.00 WIB",
    place: "Masjid Baiturrahman",
    kitab: "Ar-Rahiq Al-Makhtum",
  },
  {
    id: "kj-6",
    title: "Kajian Tafsir Juz 'Amma untuk Santri MDT",
    ustadz: "Ust. Deden Supriatna, S.Pd.I",
    day: "Rabu, 14 Okt 2026",
    date: hariKe(9),
    time: "15.30 WIB",
    place: "Masjid Al-Furqan Cibatu",
    kitab: "Tafsir Jalalain",
  },
  {
    id: "kj-7",
    title: "Kajian Ekonomi Syari'ah untuk Wali Santri",
    ustadz: "Ust. Dr. H. Abdul Hakim, Lc., M.A.",
    day: "Jumat, 16 Okt 2026",
    date: hariKe(11),
    time: "16.00 WIB",
    place: "Gedung Perguruan Tinggi",
    kitab: "Fikih Muamalah",
  },
  {
    id: "kj-8",
    title: "Kajian Hadits Pilihan: Akhlak Sesama",
    ustadz: "Ust. M. Ihsan Nurdin, Lc.",
    day: "Ahad, 18 Okt 2026",
    date: hariKe(13),
    time: "20.00 WIB",
    place: "Masjid Baiturrahman",
    kitab: "Riyadhus Shalihin",
  },
  {
    id: "kj-9",
    title: "Kajian Muslimah: Fikih Wanita & Ibadah Harian",
    ustadz: "Ustadzah Nur Aisyah, S.Pd.I.",
    day: "Rabu, 21 Okt 2026",
    date: hariKe(16),
    time: "09.00 WIB",
    place: "Aula Muslimah",
    kitab: "Fikih Wanita",
  },
];

export type KajianRutin = {
  id: string;
  hari: string;
  waktu: string;
  judul: string;
  ustadz: string;
  tempat: string;
  peserta: string;
};

export const kajianRutin: KajianRutin[] = [
  {
    id: "kr-1",
    hari: "Ahad",
    waktu: "05.30 WIB",
    judul: "Tafsir Al-Qur'an (Ahad Subuh)",
    ustadz: "Ust. H. Ahmad Fauzan, Lc., M.A.",
    tempat: "Masjid Al-Furqan Cibatu",
    peserta: "Umum",
  },
  {
    id: "kr-2",
    hari: "Senin",
    waktu: "15.30 WIB",
    judul: "Diniyyah MDT: Fikih Ibadah",
    ustadz: "Ust. Deden Supriatna, S.Pd.I",
    tempat: "Masjid Al-Furqan Cibatu",
    peserta: "Santri MDT",
  },
  {
    id: "kr-3",
    hari: "Rabu",
    waktu: "09.00 WIB",
    judul: "Adab Keluarga Sakinah",
    ustadz: "Ustadzah Nur Aisyah, S.Pd.I.",
    tempat: "Aula Muslimah",
    peserta: "Muslimah",
  },
  {
    id: "kr-4",
    hari: "Kamis",
    waktu: "16.00 WIB",
    judul: "Fiqih Ibadah Praktis",
    ustadz: "Ust. Deden Saepudin, M.Pd.",
    tempat: "Gedung B, Lantai 1",
    peserta: "Wali santri",
  },
  {
    id: "kr-5",
    hari: "Jumat",
    waktu: "19.30 WIB",
    judul: "Kitab Tauhid",
    ustadz: "Ust. Hilmi Rahman, Lc.",
    tempat: "Masjid Al-Furqan Cibatu",
    peserta: "Remaja masjid",
  },
  {
    id: "kr-6",
    hari: "Sabtu",
    waktu: "20.00 WIB",
    judul: "Sirah Nabawiyah",
    ustadz: "Ust. M. Ihsan Nurdin, Lc.",
    tempat: "Masjid Baiturrahman",
    peserta: "Umum",
  },
];

/* ------------------------------------------------------------------ */
/* Artikel                                                             */
/* ------------------------------------------------------------------ */

export type Artikel = {
  id: string;
  slug: string;
  judul: string;
  kategori: string;
  penulis: string;
  tanggal: string;
  menitBaca: number;
  dibaca: number;
  gambar: string;
  ringkasan: string;
  isi: string[];
};

export const artikel: Artikel[] = [
  {
    id: "ar-1",
    slug: "adab-menuntut-ilmu-sebelum-pelajaran",
    judul: "Adab Menuntut Ilmu Lebih Dahulu daripada Pelajaran",
    kategori: "Tarbiyah",
    penulis: "Ust. H. Ahmad Fauzan, Lc., M.A.",
    tanggal: hariKe(-3),
    menitBaca: 7,
    dibaca: 3420,
    gambar: gambar.berdiskusi,
    ringkasan: "Para ulama menyusun kitab tentang adab sebelum menyusun kitab tentang ilmu. Adab bukan pelengkap, melainkan pintu masuk keberkahan sebuah ilmu.",
    isi: [
      "Para ulama terdahulu memiliki kebiasaan yang menarik: sebelum menulis kitab tentang ilmu, mereka menulis kitab tentang adab. Imam An-Nawawi misalnya menulis at-Tibyan fi Adabi Hamalatil Qur'an, dan Imam al-Khatib al-Baghdadi menulis al-Jami' li Akhlaqir Rawi. Ini menunjukkan bahwa adab bukan pelengkap, melainkan pintu masuk.",
      "Adab kepada ilmu berarti menempatkan ilmu pada kedudukannya yang mulia: datang tepat waktu, menyiapkan alat tulis, menyimak dengan tenang, dan tidak memotong penjelasan guru. Kebiasaan kecil ini melatih kesabaran yang nantinya menjadi bekal utama dalam menuntut ilmu yang lebih tinggi.",
      "Adab kepada guru meliputi menghormati pendapatnya, bertanya dengan bahasa yang baik, dan tidak menyebarkan kesalahpahaman tentangnya. Murid yang menjaga adab akan lebih mudah menerima ilmu, karena hati yang lapang lebih cepat menyerap daripada hati yang penuh keberatan.",
      "Adab kepada teman juga penting. Belajar bersama membutuhkan kejujuran, tidak saling menyembunyikan catatan, dan mau menjelaskan kepada yang belum paham. Dengan begitu, kelas berubah menjadi tempat saling menguatkan, bukan ajang saling mendahului.",
      "Di lembaga kami, pembiasaan adab dilakukan melalui hal sederhana: salam sebelum masuk kelas, menata sandal, merapikan meja sebelum pulang, dan membaca doa bersama. Guru mendampingi langsung agar pembiasaan ini tidak hanya menjadi aturan tertulis, tetapi tumbuh menjadi karakter.",
      "Semoga Allah menjadikan anak-anak kita sebagai penuntut ilmu yang beradab, sebab ilmu yang bermanfaat adalah ilmu yang jatuh pada hati yang telah dihiasi adab.",
    ],
  },
  {
    id: "ar-2",
    slug: "murajaah-harian-hafalan-quran",
    judul: "Mengapa Hafalan Al-Qur'an Perlu Muraja'ah Harian",
    kategori: "Al-Qur'an",
    penulis: "Ust. Deden Supriatna, S.Pd.I",
    tanggal: hariKe(-7),
    menitBaca: 6,
    dibaca: 2980,
    gambar: gambar.mengaji,
    ringkasan: "Hafalan itu seperti tanaman: ia tidak mati sekali dengan keras, tetapi layu sedikit demi sedikit ketika ditinggalkan.",
    isi: [
      "Setiap penghafal Al-Qur'an pasti pernah merasakan hafalan yang tiba-tiba terasa berat. Yang sering tidak disadari, hafalan tidak hilang dalam satu malam, melainkan melemah karena ditinggalkan sedikit demi sedikit dalam hitungan hari.",
      "Karena itu para musyrif menekankan muraja'ah harian, meskipun hanya satu halaman. Tujuannya bukan menambah hafalan, tetapi menjaga ikatan dengan ayat yang sudah dihafal agar tetap melekat dalam ingatan dan lisan.",
      "Cara yang paling terbukti adalah menggabungkan setoran baru dengan muraja'ah lama dalam satu majelis: setor satu halaman baru, lalu muraja'ah dua halaman lama. Porsi lama yang lebih besar menjaga hafalan tetap utuh saat hafalan baru bertambah.",
      "Anak yang merasa hafalannya sering hilang biasanya terlalu banyak menambah hafalan baru dan sedikit mengulang. Bila pola ini dibiarkan, yang terjadi bukan bertambah hafal, melainkan kehilangan hafal yang lama secara perlahan.",
      "Selain waktu, kualitas muraja'ah dipengaruhi suasana hati dan tempat. Membaca di tempat yang tenang, dengan wudhu, dan menghadap kiblat membantu lisan serta hati lebih siap menerima ayat-ayat yang diulang.",
    ],
  },
  {
    id: "ar-3",
    slug: "fikih-zakat-fitrah-keluarga",
    judul: "Fikih Ringkas: Zakat Fitrah untuk Seorang Keluarga",
    kategori: "Fikih",
    penulis: "Ust. Deden Saepudin, M.Pd.",
    tanggal: hariKe(-12),
    menitBaca: 5,
    dibaca: 2410,
    gambar: gambar.masjid,
    ringkasan: "Siapa yang wajib menunaikannya, berapa besarannya, dan kapan waktu terbaik menyalurkannya — dijelaskan ringkas dengan dalilnya.",
    isi: [
      "Zakat fitrah wajib bagi setiap muslim yang memiliki kelebihan makanan pokok untuk dirinya dan keluarganya pada malam hari raya. Kewajiban ini meliputi kepala keluarga, istri, anak-anak, dan orang yang menjadi tanggungannya.",
      "Besarannya satu sha' makanan pokok, yaitu sekitar dua setengah kilogram beras, untuk setiap jiwa. Boleh ditunaikan dalam bentuk beras sesuai kebiasaan setempat, atau dalam bentuk uang senilai makanan pokok tersebut bila dianggap lebih bermanfaat bagi penerima.",
      "Waktunya dibagi menjadi tiga: sejak awal Ramadhan (waktu yang boleh), sejak beberapa hari sebelum hari raya (waktu yang lebih utama), dan setelah shalat Idul Fitri (waktu yang tidak sah sebagai zakat fitrah, melainkan menjadi sedekah biasa). Karena itu panitia zakat lembaga menutup penerimaan sebelum shalat Id.",
      "Yang perlu dijaga adalah penyalurannya: didahulukan kepada kaum fakir dan miskin di lingkungan terdekat. Menyalurkan melalui panitia yang amanah membuat distribusi lebih rapi dan tepat sasaran, terutama bagi keluarga yang menjaga wibawa dan tidak menampakkan kebutuhan.",
    ],
  },
  {
    id: "ar-4",
    slug: "mendidik-anak-dengan-keteladanan",
    judul: "Mendidik Anak dengan Keteladanan, Bukan Sekadar Perintah",
    kategori: "Keluarga",
    penulis: "Ustadzah Nur Aisyah, S.Pd.I.",
    tanggal: hariKe(-16),
    menitBaca: 5,
    dibaca: 1980,
    gambar: gambar.santriwati,
    ringkasan: "Anak lebih cepat meniru apa yang kita kerjakan daripada mendengar apa yang kita perintahkan. Rumah adalah madrasah pertama yang tidak pernah libur.",
    isi: [
      "Allah menjadikan anak sebagai amanah sekaligus ujian. Salah satu hikmahnya, kehadiran anak menuntut orang tua memperbaiki diri lebih dulu, karena anak belajar paling cepat dari apa yang ia lihat setiap hari.",
      "Keteladanan bekerja secara diam-diam tetapi mendalam. Anak yang melihat ayahnya bergegas ke masjid saat azan akan tumbuh dengan kebiasaan itu; anak yang melihat ibunya membaca Al-Qur'an setiap pagi akan menganggapnya hal biasa dan wajar diperbuat.",
      "Sebaliknya, perintah tanpa contoh menumbuhkan kebingungan. Anak diminta jujur tetapi melihat kebohongan kecil di rumah, diminta menjaga waktu tetapi melihat orang tuanya selalu terlambat. Lama-kelamaan anak menyimpulkan bahwa aturan hanyalah untuk anak-anak.",
      "Ada tiga langkah praktis yang bisa dilakukan setiap keluarga. Pertama, sepakati satu kebiasaan harian yang dilakukan bersama, misalnya shalat berjamaah atau mengaji setelah maghrib. Kedua, jelaskan alasannya dengan bahasa sederhana, bukan hanya perintah. Ketiga, konsisten dan jangan menuntut kesempurnaan, karena yang dinilai adalah istiqamah.",
      "Mendidik anak adalah perjalanan panjang yang hasilnya jarang terlihat dalam satu semester. Yang perlu dijaga adalah arah, kesabaran, dan doa, sebab Allah-lah yang menumbuhkan apa yang kita tanam.",
    ],
  },
  {
    id: "ar-5",
    slug: "meneladani-perjuangan-dakwah-priangan",
    judul: "Meneladani Perjuangan Dakwah di Tanah Priangan",
    kategori: "Sirah",
    penulis: "Ust. Hilmi Rahman, Lc.",
    tanggal: hariKe(-21),
    menitBaca: 8,
    dibaca: 1640,
    gambar: gambar.kubahHijau,
    ringkasan: "Perjalanan dakwah ahlus sunnah di Jawa Barat mengajarkan kesabaran, kedisiplinan, dan keberanian membangun lembaga pendidikan dari yang paling sederhana.",
    isi: [
      "Dakwah di Tanah Priangan tumbuh dari majelis-majelis kecil: pengajian di rumah, surau, dan pasar. Para pendahulu berpindah dari satu kampung ke kampung lain dengan bekal kitab yang dihafal di luar kepala dan kesabaran yang tidak habis.",
      "Salah satu pelajaran terpenting dari generasi awal adalah kedisiplinan. Mereka menepati jadwal pengajian, tepat waktu, dan mencatat setiap pertanyaan jamaah untuk dibahas pada pertemuan berikutnya. Keteladanan ini membuat jamaah percaya bahwa majelis mereka dikelola dengan sungguh-sungguh.",
      "Mereka juga membangun lembaga pendidikan sebagai jembatan dakwah. Madrasah yang berdiri pertama mungkin hanya berlantai tanah dan berdinding bilik, tetapi menjadi tempat lahirnya kader yang kemudian mengajar di tempat lain. Usaha ini membutuhkan keberanian lebih daripada sekadar berbicara di mimbar.",
      "Meneladani mereka bukan berarti mengulang keadaannya, tetapi mengambil semangatnya. Zaman berubah, media berganti, namun kebutuhan umat akan ilmu yang bersih dan pengajaran yang penuh kasih sayang tidak berubah.",
      "Warisan yang paling nyata adalah keberanian menyerahkan sebagian rezeki untuk pendidikan: membangun ruang kelas, menggaji guru, dan menyantuni santri yatim. Inilah bentuk dakwah besar yang sering luput dari catatan.",
    ],
  },
  {
    id: "ar-6",
    slug: "tauhid-fondasi-pendidikan-anak",
    judul: "Tauhid sebagai Fondasi Pendidikan Anak",
    kategori: "Aqidah",
    penulis: "Ust. Hilmi Rahman, Lc.",
    tanggal: hariKe(-27),
    menitBaca: 6,
    dibaca: 1320,
    gambar: gambar.masjidPutih,
    ringkasan: "Sebelum anak menghafal banyak dalil, ia perlu mengenal siapa Rabb-nya melalui bahasa kasih sayang dan kebiasaan harian yang sederhana.",
    isi: [
      "Pendidikan tauhid pada anak tidak dimulai dari definisi yang rumit, melainkan dari pengenalan yang hangat. Sebelum ia memahami istilah, ia perlu merasakan bahwa ada Allah yang menciptakan, menjaga, dan menyayanginya sepanjang hari.",
      "Percakapan harian menjadi sarana yang paling mudah. Saat hujan turun, orang tua bisa menyebut bahwa Allah yang menurunkan hujan; saat sakit, bahwa Allah yang menyembuhkan. Anak merekam makna itu jauh lebih kuat daripada sekadar menghafal urutan dalil.",
      "Setelah pengenalan, barulah dibimbing kepada pemahaman tentang ibadah: siapa yang berhak disembah, mengapa kita shalat, dan mengapa kita memohon hanya kepada-Nya. Pembelajaran bertahap ini menjaga rasa cinta anak tetap tumbuh bersama pemahaman yang benar.",
      "Yang perlu dijaga adalah keseimbangan antara ilmu dan amal. Anak yang menghafal dalil tetapi tidak melihat orang tuanya berdoa dengan sepenuh hati akan kehilangan kaitan antara keduanya. Karena itu guru dan orang tua dituntut berjalan bersama, saling memperbaiki.",
    ],
  },
  {
    id: "ar-7",
    slug: "adab-shalat-berjamaah-di-masjid",
    judul: "Adab dan Keutamaan Shalat Berjamaah di Masjid",
    kategori: "Fikih",
    penulis: "Ust. M. Ihsan Nurdin, Lc.",
    tanggal: hariKe(-34),
    menitBaca: 4,
    dibaca: 1120,
    gambar: gambar.menara,
    ringkasan: "Berjalan ke masjid bukan sekadar urusan pahala, tetapi juga latihan disiplin waktu dan menjaga hubungan baik dengan tetangga.",
    isi: [
      "Rasulullah shallallahu alaihi wa sallam menyebutkan keutamaan besar bagi orang yang menjaga shalat berjamaah. Setiap langkah menuju masjid bernilai kebaikan, dan shalat berjamaah memiliki keutamaan derajat di atas shalat yang dikerjakan sendiri.",
      "Adab pertama yang perlu dijaga adalah waktu. Berangkat lebih awal memberi kesempatan memperoleh takbir pertama, menata niat, dan tidak mengganggu jamaah yang sudah berdiri. Keterlambatan yang terus-menerus membuat seseorang kehilangan bagian besar dari keutamaan ini.",
      "Adab berikutnya berkaitan dengan lingkungan masjid: merapikan sandal, tidak menaikkan suara, mematikan telepon, dan merapikan barisan dengan menempelkan kaki dan bahu. Barisan yang rapi menjaga kekhusyukan jamaah dan menunjukkan akhlak yang baik kepada tetangga.",
      "Membiasakan anak ikut ke masjid sejak kecil memerlukan pendampingan, bukan sekadar membawa. Kita perlu mengajarkan adabnya secara bertahap agar ia tumbuh sebagai bagian dari jamaah yang menjaga masjid, bukan sebagai tamu yang mengganggu.",
    ],
  },
  {
    id: "ar-8",
    slug: "peran-wali-santri-menjaga-adab",
    judul: "Peran Wali Santri dalam Menjaga Adab Anak di Rumah",
    kategori: "Tarbiyah",
    penulis: "Ust. Deden Saepudin, M.Pd.",
    tanggal: hariKe(-41),
    menitBaca: 5,
    dibaca: 940,
    gambar: gambar.kelas1,
    ringkasan: "Sekolah dan rumah harus berjalan searah. Tiga kebiasaan sederhana ini membantu adab anak tumbuh konsisten, bukan hanya di madrasah.",
    isi: [
      "Adab yang diajarkan di madrasah akan cepat luntur bila di rumah ia melihat hal yang berlawanan. Karena itu komunikasi antara wali kelas dan wali santri kami jadikan bagian dari pembinaan, bukan sekadar laporan nilai akhir semester.",
      "Kebiasaan pertama, mintalah anak menyampaikan satu adab yang dipelajarinya hari itu di sekolah. Percakapan ringan ini membuat ia mengulang ilmu yang sudah disampaikan guru sekaligus merasakan bahwa orang tua menaruh perhatian pada pembelajarannya.",
      "Kebiasaan kedua, berikan tanggung jawab kecil yang rutin: membersihkan alat makan, menata sepatu, atau menyiapkan buku esok hari. Tanggung jawab membuat anak terlatih disiplin dan memahami bahwa kebaikan itu dikerjakan setiap hari, bukan sesaat.",
      "Kebiasaan ketiga, jaga nada bicara di rumah. Anak belajar menjaga lisan dari cara kita menyapa pasangan, memanggil kakak, dan memberi komentar tentang orang lain. Yang paling berpengaruh pada adab anak biasanya bukan nasihat, melainkan contoh yang berulang.",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Kontak                                                             */
/* ------------------------------------------------------------------ */

export const topikKontak = [
  "Pendaftaran & SPMB",
  "Informasi jenjang pendidikan",
  "Layanan wali santri",
  "Kerja sama & undangan",
  "Donasi, infak, dan wakaf",
  "Lainnya",
];

export type KontakUnit = {
  id: string;
  nama: string;
  keterangan: string;
  telepon: string;
  whatsapp: string;
  jam: string;
};

export const kontakUnit: KontakUnit[] = [
  {
    id: "kt-1",
    nama: "Sekretariat PC PERSIS Cibatu",
    keterangan: "Surat menyurat, informasi umum, dan layanan tamu",
    telepon: "(0262) 555-1234",
    whatsapp: "0812-3456-7890",
    jam: "Senin – Jumat, 07.30 – 15.30 WIB",
  },
  {
    id: "kt-2",
    nama: "Panitia SPMB",
    keterangan: "Pendaftaran, berkas, dan jadwal tes masuk",
    telepon: "(0262) 555-1235",
    whatsapp: "0812-3456-7891",
    jam: "Senin – Sabtu, 08.00 – 15.00 WIB",
  },
];

/* ------------------------------------------------------------------ */
/* Penurunan data                                                      */
/* ------------------------------------------------------------------ */

/** Berita terbaru lebih dahulu. */
export const beritaTerbaru = (n?: number) =>
  [...berita].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n ?? berita.length);

/** Artikel terbaru lebih dahulu. */
export const artikelTerbaru = (n?: number) =>
  [...artikel].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, n ?? artikel.length);

/** Artikel dengan pembaca terbanyak — untuk bagian "Paling Banyak Dibaca". */
export const artikelTerpopuler = (n = 5) => [...artikel].sort((a, b) => b.dibaca - a.dibaca).slice(0, n);

/** Cari satu artikel dari alamatnya. */
export const cariArtikel = (slug: string) => artikel.find((a) => a.slug === slug);

/** Artikel lain: kategori yang sama lebih dahulu, lalu yang terbaru. */
export const artikelLainnya = (slug: string, n = 1) => {
  const ini = cariArtikel(slug);
  const lain = artikelTerbaru().filter((a) => a.slug !== slug);
  const sekategori = ini ? lain.filter((a) => a.kategori === ini.kategori) : [];
  return [...sekategori, ...lain.filter((a) => !sekategori.includes(a))].slice(0, n);
};

/** Jumlah sisipan "Baca juga" di tengah isi artikel. */
export const jumlahBacaJuga = (a: Artikel) => Math.min(3, Math.max(1, Math.ceil(a.isi.length / 3)));

/** Daftar kategori berita, urut abjad. */
export const kategoriBerita = () => [...new Set(berita.map((b) => b.category))].sort();

/** Daftar kategori artikel, urut abjad. */
export const kategoriArtikel = () => [...new Set(artikel.map((a) => a.kategori))].sort();

/** Pengumuman Terbaru — urut postingan terbaru. */
export const pengumumanTerbaru = (n = 5) =>
  [...pengumuman].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n);

/** Berita Trending — urut jumlah pembaca terbanyak. */
export const beritaTrending = (n = 5) => [...berita].sort((a, b) => b.views - a.views).slice(0, n);

/** Agenda — jadwal terdekat lebih dahulu. */
export const agendaTerdekat = (n = 5) => [...agenda].sort((a, b) => a.date.localeCompare(b.date)).slice(0, n);

/** Satu berita berdasarkan alamatnya. */
export const cariBerita = (slug: string) => berita.find((b) => b.slug === slug);

/** Berita lain: urut terbaru, tanpa berita yang sedang dibuka. */
export const beritaLain = (slug: string, n = 3) =>
  beritaTerbaru().filter((b) => b.slug !== slug).slice(0, n);

/** Baca juga: kategori yang sama lebih dahulu, lalu berita terbaru lainnya. */
export const beritaTerkait = (slug: string, n = 1) => {
  const kini = cariBerita(slug);
  const lain = beritaTerbaru().filter((b) => b.slug !== slug);
  const sekategori = kini ? lain.filter((b) => b.category === kini.category) : [];
  const sisanya = lain.filter((b) => !sekategori.includes(b));
  return [...sekategori, ...sisanya].slice(0, n);
};

export type Notifikasi = {
  id: string;
  jenis: string;
  judul: string;
  ringkas: string;
  tanggal: string;
  halaman: string;
  /** Alamat postingan bila notifikasi menuju halaman detail. */
  slug?: string;
  /** Alamat lengkap yang dibuka saat notifikasi diketuk. */
  tautan?: string;
};

/** Notifikasi disusun dari postingan terbaru: berita, pengumuman, agenda, dan kajian. */
export const daftarNotifikasi = (n = 6): Notifikasi[] => {
  const dariBerita = [...berita]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((b) => ({
      id: `nf-${b.id}`,
      jenis: "Berita",
      judul: b.title,
      ringkas: b.excerpt,
      tanggal: b.date,
      halaman: "berita-detail",
      slug: b.slug,
      tautan: `/#/berita/${b.slug}`,
    }));
  const dariPengumuman = pengumumanTerbaru(5).map((p) => ({
    id: `nf-${p.id}`,
    jenis: "Pengumuman",
    judul: p.title,
    ringkas: p.summary,
    tanggal: p.date,
    halaman: "beranda",
    tautan: `/#/beranda/pengumuman/${p.id}`,
  }));
  const dariAgenda = agendaTerdekat(2).map((a) => ({
    id: `nf-${a.id}`,
    jenis: "Agenda",
    judul: a.title,
    ringkas: `${a.time} · ${a.place}`,
    tanggal: a.date,
    halaman: "beranda",
    tautan: `/#/beranda/agenda/${a.id}`,
  }));
  const dariKajian = kajian.slice(0, 2).map((k) => ({
    id: `nf-${k.id}`,
    jenis: "Kajian",
    judul: k.title,
    ringkas: `${k.ustadz} · ${k.time} · ${k.place}`,
    tanggal: k.date,
    halaman: "kajian",
    tautan: `/#/kajian/${k.id}`,
  }));
  return [...dariBerita, ...dariPengumuman, ...dariAgenda, ...dariKajian]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, n);
};

/**
 * Postingan terbaru untuk notifikasi push ke layar HP:
 * berita, artikel, dan pengumuman — diurutkan dari yang paling baru.
 */
export const daftarNotifikasiPostingan = (n = 8): Notifikasi[] => {
  const dariBerita = [...berita]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((b) => ({
      id: `np-${b.id}`,
      jenis: "Berita",
      judul: b.title,
      ringkas: b.excerpt,
      tanggal: b.date,
      halaman: "berita-detail",
      slug: b.slug,
      tautan: `/#/berita/${b.slug}`,
    }));
  const dariArtikel = [...artikel]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .map((a) => ({
      id: `np-${a.id}`,
      jenis: "Artikel",
      judul: a.judul,
      ringkas: a.ringkasan,
      tanggal: a.tanggal,
      halaman: "artikel-detail",
      slug: a.slug,
      tautan: `/#/artikel/${a.slug}`,
    }));
  const dariPengumuman = pengumumanTerbaru(6).map((p) => ({
    id: `np-${p.id}`,
    jenis: "Pengumuman",
    judul: p.title,
    ringkas: p.summary,
    tanggal: p.date,
    halaman: "beranda",
    tautan: `/#/beranda/pengumuman/${p.id}`,
  }));
  return [...dariBerita, ...dariArtikel, ...dariPengumuman]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, n);
};

export const judulDibaca = (views: number) => `${angkaRingkas(views)} dibaca`;
