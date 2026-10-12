/**
 * Alat bantu (di luar aplikasi): menyalin seluruh data awal situs dari
 * src/data/*.ts menjadi server/db/benih.json, yaitu bahan pengisian database.
 *
 * Cara pakai (dari akar proyek):
 *   node server/db/buat-benih.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const disini = path.dirname(fileURLToPath(import.meta.url));
const akar = path.resolve(disini, "../..");

const pintuMasuk = `
export {
  identitas, gambar, slide, statistik, menu, profil, pengurus, pengumuman, berita, agenda,
  kajian, kajianRutin, artikel, topikKontak, kontakUnit, daftarNotifikasi
} from "./src/data/content";
export { istilahSekolah, istilahMadrasah, Kampus, jenjang, unit, jurusan, halamanJenjang } from "./src/data/pendidikan";
export { halamanSpmb, gelombang, biaya, waAdmin } from "./src/data/spmb";
export {
  programDonasi, metodeDonasi, rekeningDonasi, nominalCepat, tabDonasi, donaturProgram, riwayatProgram
} from "./src/data/donasi";
export { albumGaleri, galeri } from "./src/data/galeri";
export { hariKe } from "./src/lib/format";
export {
  santri, nilaiWali, setoranTahfidz, tahfidz, metodeBayarWali, tagihanAwal, menungguAwal, riwayatAwal
} from "./src/data/wali";
`;

const keluaran = await build({
  stdin: { contents: pintuMasuk, resolveDir: akar, loader: "js" },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  logLevel: "warning",
});

const sementara = path.join("/tmp", `benih-sumber-${Date.now()}.mjs`);
fs.writeFileSync(sementara, keluaran.outputFiles[0].text);
const d = await import(pathToFileURL(sementara).href);
fs.rmSync(sementara, { force: true });

/* ------------------------------- alat bantu ------------------------------- */

const slug = (teks) =>
  String(teks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const angka = (teks) => Number(String(teks).replace(/[^\d]/g, "")) || 0;
const juzDari = (materi) => {
  const cocok = /juz\s+(\d+)/i.exec(String(materi));
  return cocok ? Number(cocok[1]) : null;
};

/* --------------------------------- isi --------------------------------- */

const situs = {
  id: "utama",
  pimpinan: d.identitas.pimpinan,
  nama: d.identitas.nama,
  nama_lengkap: d.identitas.namaLengkap,
  singkatan: "PERSIS",
  wilayah: d.identitas.wilayah,
  wilayah_lengkap: d.identitas.wilayahLengkap,
  alamat: d.identitas.alamat,
  telepon: d.identitas.telepon,
  whatsapp: d.identitas.whatsapp,
  email: d.identitas.email,
  jam_layanan: d.identitas.jam,
  logo_url: d.identitas.logo,
  meta_judul: `${d.identitas.namaLengkap} — ${d.identitas.pimpinan} PERSIS`,
  meta_deskripsi:
    "Pendidikan Islam terpadu di bawah naungan Pimpinan Cabang Persatuan Islam Cibatu, Garut: RA, MI, MDT, MTs, MA, dan Perguruan Tinggi.",
};

const pengaturan = [
  { kunci: "halaman_jenjang", kelompok: "jenjang", nilai: d.halamanJenjang, keterangan: "Judul & pengantar halaman Jenjang" },
  {
    kunci: "istilah",
    kelompok: "jenjang",
    nilai: { sekolah: d.istilahSekolah, madrasah: d.istilahMadrasah, kampus: d.Kampus },
    keterangan: "Sebutan istilah per jenis unit pendidikan",
  },
  { kunci: "galeri_urut_album", kelompok: "galeri", nilai: d.albumGaleri, keterangan: "Urutan tab album pada halaman Galeri" },
  {
    kunci: "donasi",
    kelompok: "donasi",
    nilai: { nominal_cepat: d.nominalCepat, tab: d.tabDonasi },
    keterangan: "Pilihan nominal cepat & tab halaman donasi",
  },
  {
    kunci: "sosial",
    kelompok: "umum",
    nilai: { whatsapp: d.identitas.whatsapp, instagram: "", facebook: "", youtube: "" },
    keterangan: "Tautan media sosial lembaga",
  },
  { kunci: "push", kelompok: "notifikasi", nilai: { aktif: true, pengirim: "PC PERSIS Cibatu" }, keterangan: "Pengaturan notifikasi push" },
  {
    kunci: "identitas",
    kelompok: "umum",
    nilai: {
      pimpinan: d.identitas.pimpinan,
      nama: d.identitas.nama,
      namaLengkap: d.identitas.namaLengkap,
      wilayah: d.identitas.wilayah,
      wilayahLengkap: d.identitas.wilayahLengkap,
    },
    keterangan: "Nama, sebutan, dan wilayah lembaga",
  },
  {
    kunci: "logo",
    kelompok: "umum",
    nilai: { url: d.identitas.logo, alt: "Logo Persatuan Islam (PERSIS)" },
    keterangan: "Logo lembaga yang dipakai di kepala situs & halaman profil",
  },
  {
    kunci: "layanan_jamaah",
    kelompok: "umum",
    nilai: {
      alamat: d.identitas.alamat,
      telepon: d.identitas.telepon,
      whatsapp: d.identitas.whatsapp,
      email: d.identitas.email,
      jam: d.identitas.jam,
    },
    keterangan: "Layanan jamaah: alamat sekretariat, kontak, dan jam layanan",
  },
  {
    kunci: "seo",
    kelompok: "umum",
    nilai: { deskripsi: situs.meta_deskripsi, kata_kunci: ["PERSIS Cibatu", "pendidikan Islam Garut", "pesantren Cibatu"] },
    keterangan: "Keterangan mesin pencari",
  },
];

const profil = {
  id: "utama",
  gambar_url: d.profil.image,
  gambar_alt: d.profil.imageAlt,
  ringkasan: d.profil.summary,
  motto: d.profil.motto,
  periode: d.profil.periode,
  visi: d.profil.visi,
  misi: d.profil.misi,
};

const hero_slide = d.slide.map((s, i) => ({
  id: s.id,
  urutan: i + 1,
  tag: s.tag,
  judul: s.title,
  teks: s.text,
  gambar_url: s.image,
  tombol_label: "Jelajahi Jenjang",
  tombol_halaman: "jenjang",
  aktif: true,
}));

const statistik = d.statistik.map((s, i) => ({
  id: s.id,
  urutan: i + 1,
  ikon: s.icon,
  label: s.label,
  label_pendek: s.labelPendek,
  nilai: s.value,
  satuan: s.unit,
  catatan: s.note,
  tone: s.tone,
  aktif: true,
}));

const menu_cepat = d.menu.map((m, i) => ({
  id: m.id,
  urutan: i + 1,
  label: m.label,
  keterangan: m.desc,
  ikon: m.icon,
  tone: m.tone,
  halaman: m.halaman,
  lencana: m.badge ?? null,
  aktif: true,
}));

const tautan_sosial = [
  { id: "ts-wa", urutan: 1, nama: "WhatsApp", url: `https://wa.me/${d.identitas.whatsapp.replace(/\D/g, "").replace(/^0/, "62")}`, ikon: "whatsapp" },
  { id: "ts-ig", urutan: 2, nama: "Instagram", url: "https://instagram.com", ikon: "instagram" },
  { id: "ts-fb", urutan: 3, nama: "Facebook", url: "https://facebook.com", ikon: "facebook" },
  { id: "ts-yt", urutan: 4, nama: "YouTube", url: "https://youtube.com", ikon: "youtube" },
];

const pengurus = d.pengurus.map((p, i) => ({ id: p.id, urutan: i + 1, nama: p.nama, jabatan: p.jabatan, periode: d.profil.periode, aktif: true }));

const idJenjang = Object.fromEntries(d.jenjang.map((j) => [j.slug, j.id]));

const jenjang = d.jenjang.map((j, i) => ({
  id: j.id,
  slug: j.slug,
  singkatan: j.short,
  nama: j.nama,
  tagline: j.tagline,
  rentang: j.rentang,
  pimpinan_label: j.pimpinan,
  jumlah: j.jumlah,
  satuan: j.satuan,
  lokasi: j.lokasi,
  tone: j.tone,
  gambar_url: j.gambar,
  intro: j.intro,
  fasilitas: j.fasilitas,
  istilah: j.istilah,
  urutan: i + 1,
  hitung_jenjang: j.hitungJenjang !== false,
  aktif: true,
}));

const unit_pendidikan = d.unit.map((u) => ({
  id: u.id,
  jenjang_id: idJenjang[u.jenjang] ?? null,
  slug: u.slug,
  nomor: u.nomor,
  nama: u.nama,
  daerah: u.daerah,
  alamat: u.alamat,
  pimpinan: u.pimpinan,
  jumlah_peserta: u.siswa,
  rombel: u.rombel,
  guru: u.guru,
  akreditasi: u.akreditasi,
  kontak: u.kontak,
  email: u.email,
  npsn: u.npsn,
  berdiri: u.berdiri,
  jam: u.jam,
  gambar_url: u.gambar,
  jurusan: u.jurusan,
  ekstrakurikuler: u.ekstra,
  aktif: true,
}));

const jurusan = d.jurusan.map((j, i) => ({
  id: j.id,
  jenjang_id: idJenjang[j.jenjang] ?? null,
  slug: j.slug,
  singkatan: j.singkat,
  nama: j.nama,
  intro: j.intro,
  fokus: j.fokus,
  gambar_url: j.gambar,
  ukt: j.ukt ?? null,
  urutan: i + 1,
  aktif: true,
}));

const kategori = [];
const tambahKategori = (jenis, daftar) => {
  [...new Set(daftar.filter(Boolean))].sort().forEach((nama, i) => {
    kategori.push({ id: `kt-${jenis}-${slug(nama)}`, jenis, nama, slug: slug(nama), urutan: i + 1, aktif: true });
  });
};
tambahKategori("berita", d.berita.map((b) => b.category));
tambahKategori("artikel", d.artikel.map((a) => a.kategori));
tambahKategori("pengumuman", d.pengumuman.map((p) => p.category));
tambahKategori("agenda", d.agenda.map((a) => a.tag));
tambahKategori("donasi", d.programDonasi.map((p) => p.kategori));

const berita = d.berita.map((b) => ({
  id: b.id,
  slug: b.slug,
  judul: b.title,
  tanggal: b.date,
  kategori: b.category,
  penulis: b.author,
  gambar_url: b.image,
  dibaca: b.views,
  ringkasan: b.excerpt,
  isi: b.body,
  sorotan: false,
  terbit: true,
}));

const artikel = d.artikel.map((a) => ({
  id: a.id,
  slug: a.slug,
  judul: a.judul,
  kategori: a.kategori,
  penulis: a.penulis,
  tanggal: a.tanggal,
  menit_baca: a.menitBaca,
  dibaca: a.dibaca,
  gambar_url: a.gambar,
  ringkasan: a.ringkasan,
  isi: a.isi,
  terbit: true,
}));

const pengumuman = d.pengumuman.map((p) => ({
  id: p.id,
  judul: p.title,
  tanggal: p.date,
  kategori: p.category,
  ringkasan: p.summary,
  isi: p.detail,
  disematkan: Boolean(p.pinned),
  dibaca: p.views,
  terbit: true,
}));

const agenda = d.agenda.map((a) => ({
  id: a.id,
  judul: a.title,
  tanggal: a.date,
  waktu: a.time,
  tempat: a.place,
  tag: a.tag,
  isi: a.detail,
  terbit: true,
}));

const kajian = d.kajian.map((k) => ({
  id: k.id,
  judul: k.title,
  ustadz: k.ustadz,
  hari: k.day,
  tanggal: k.date,
  waktu: k.time,
  tempat: k.place,
  kitab: k.kitab,
  langsung: Boolean(k.live),
  terbit: true,
}));

const kajian_rutin = d.kajianRutin.map((k, i) => ({
  id: k.id,
  urutan: i + 1,
  hari: k.hari,
  waktu: k.waktu,
  judul: k.judul,
  ustadz: k.ustadz,
  tempat: k.tempat,
  peserta: k.peserta,
  aktif: true,
}));

const albumNama = d.albumGaleri.filter((a) => a !== "Semua");
const galeri_album = albumNama.map((nama, i) => ({
  id: `al-${slug(nama)}`,
  slug: slug(nama),
  nama,
  urutan: i + 1,
  aktif: true,
}));
const idAlbum = (nama) => `al-${slug(nama)}`;

const galeri_foto = d.galeri.map((f, i) => ({
  id: f.id,
  album_id: idAlbum(f.album),
  judul: f.judul,
  gambar_url: f.gambar,
  tanggal: d.hariKe(f.hari),
  urutan: i + 1,
  aktif: true,
}));

const spmb_info = {
  id: "utama",
  judul: d.halamanSpmb.judul,
  pengantar: d.halamanSpmb.pengantar,
  catatan: d.halamanSpmb.catatan,
  wa_admin: "088224597479",
  form_aktif: true,
};

const spmb_gelombang = d.gelombang.map((g, i) => ({
  id: g.id,
  urutan: i + 1,
  nama: g.nama,
  periode: g.periode,
  kuota: g.kuota,
  sisa: g.sisa,
  status: g.status,
  aktif: true,
}));

const spmb_biaya = d.biaya.map((b, i) => ({ id: b.id, urutan: i + 1, label: b.label, nilai: b.nilai, aktif: true }));

const tahun_ajaran = [{ id: "ta-1447-ganjil", nama: "1447 H", semester: "Ganjil", aktif: true }];

const santri = [
  {
    id: "sn-1",
    nis: d.santri.nis,
    nama: d.santri.nama,
    jenjang_id: "jg-4",
    unit_id: "sk-9",
    kelas: d.santri.kelas,
    program: d.santri.jurusan,
    jenis_kelamin: "L",
    status: "aktif",
  },
];

const mata_pelajaran = d.nilaiWali.map((n, i) => ({
  id: `mp-${i + 1}`,
  nama: n.mapel,
  kode: `MP-${String(i + 1).padStart(2, "0")}`,
  jenjang_id: "jg-4",
  aktif: true,
}));

const nilai = d.nilaiWali.map((n, i) => ({
  id: n.id,
  santri_id: "sn-1",
  mapel_id: `mp-${i + 1}`,
  tahun_ajaran_id: "ta-1447-ganjil",
  semester: d.santri.semester,
  nilai: n.nilai,
  predikat: n.predikat,
}));

const tahfidz_target = [
  {
    id: "tt-1",
    santri_id: "sn-1",
    capaian: d.tahfidz.capaian,
    target: d.tahfidz.target,
    persen: d.tahfidz.persen,
    target_juz: 10,
    pembimbing: d.tahfidz.pembimbing,
    jadwal: d.tahfidz.jadwal,
    tempat: d.tahfidz.tempat,
  },
];

const setoran_tahfidz = d.setoranTahfidz.map((s) => ({
  id: s.id,
  santri_id: "sn-1",
  tanggal: s.tanggal,
  juz: juzDari(s.materi),
  materi: s.materi,
  jenis: s.jenis,
  penilai: s.penilai,
  nilai: s.nilai,
}));

const rekeningUtama = d.rekeningDonasi[0];
const metode_pembayaran = d.metodeBayarWali.map((m, i) => ({
  id: m.id,
  urutan: i + 1,
  nama: m.nama,
  keterangan: m.keterangan,
  bank: m.id === "mb-1" ? rekeningUtama.bank : null,
  nomor: m.id === "mb-1" ? rekeningUtama.nomor : null,
  atas_nama: m.id === "mb-1" ? rekeningUtama.atasNama : null,
  langkah: m.detail,
  aktif: true,
}));

const tagihan = [
  ...d.tagihanAwal.map((t) => ({
    id: t.id,
    santri_id: "sn-1",
    jenis: "SPMB",
    label: t.label,
    keterangan: t.keterangan,
    jumlah: t.jumlah,
    tahun_ajaran_id: "ta-1447-ganjil",
    status: "belum",
  })),
  ...d.menungguAwal.map((t) => ({
    id: t.id,
    santri_id: "sn-1",
    jenis: "Bulanan",
    label: t.label,
    jumlah: t.jumlah,
    tahun_ajaran_id: "ta-1447-ganjil",
    status: "menunggu",
  })),
];

const pembayaran = [
  ...d.menungguAwal.map((t, i) => ({
    id: `pb-${i + 1}`,
    santri_id: "sn-1",
    tagihan_id: t.id,
    label: t.label,
    jumlah: t.jumlah,
    metode: t.metode,
    status: "menunggu",
  })),
  ...d.riwayatAwal.map((r, i) => ({
    id: `pb-r${i + 1}`,
    santri_id: "sn-1",
    label: r.label,
    jumlah: r.jumlah,
    metode: r.metode,
    status: "terverifikasi",
    dibayar_pada: r.tanggal,
  })),
];

const donasi_program = d.programDonasi.map((p) => ({
  id: p.id,
  slug: p.slug,
  judul: p.judul,
  kategori: p.kategori,
  gambar_url: p.gambar,
  target: p.target,
  terkumpul: p.terkumpul,
  jumlah_donatur: p.donatur,
  batas: p.batas,
  ringkasan: p.ringkasan,
  pengelola: p.pengelola,
  isi: p.body,
  rincian: p.rincian,
  aktif: true,
}));

const donasi_metode = d.metodeDonasi.map((m, i) => ({
  id: m.id,
  urutan: i + 1,
  nama: m.nama,
  keterangan: m.keterangan,
  langkah: m.langkah,
  aktif: true,
}));

const donasi_rekening = d.rekeningDonasi.map((r, i) => ({
  id: r.id,
  urutan: i + 1,
  bank: r.bank,
  nomor: r.nomor,
  atas_nama: r.atasNama,
  aktif: true,
}));

const donasi_donatur = d.programDonasi.flatMap((p) =>
  d.donaturProgram(p.slug).map((o) => ({
    id: o.id,
    program_id: p.id,
    nama: o.nama,
    jumlah: o.jumlah,
    metode: o.metode,
    waktu: o.waktu,
    tampil: true,
  })),
);

const donasi_riwayat = d.programDonasi.flatMap((p) =>
  d.riwayatProgram(p).map((r, i) => ({
    id: r.id,
    program_id: p.id,
    urutan: i + 1,
    tanggal: r.tanggal,
    judul: r.judul,
    keterangan: r.keterangan,
  })),
);

const topik_kontak = d.topikKontak.map((t, i) => ({ id: `tp-${i + 1}`, urutan: i + 1, teks: t, aktif: true }));

const kontak_unit = d.kontakUnit.map((k, i) => ({
  id: k.id,
  urutan: i + 1,
  nama: k.nama,
  keterangan: k.keterangan,
  telepon: k.telepon,
  whatsapp: k.whatsapp,
  jam: k.jam,
  aktif: true,
}));

const jenisNotifikasi = { Berita: "berita", Artikel: "artikel", Pengumuman: "pengumuman", Agenda: "agenda", Kajian: "kajian" };
const alumni = [
  { id: "al-1", nis: "2018.0041", nama: "Aulia Rahman", jenjang_id: "jg-4", unit_id: "sk-9", tahun_lulus: 2021, pekerjaan: "Santri lanjutan", instansi: "Pesantren Darul Falah", kota: "Garut", aktif: true },
  { id: "al-2", nis: "2019.0113", nama: "Nadia Salsabila", jenjang_id: "jg-5", unit_id: "sk-12", tahun_lulus: 2022, pekerjaan: "Mahasiswi", instansi: "Universitas Islam Bandung", kota: "Bandung", aktif: true },
  { id: "al-3", nis: "PT-2019-007", nama: "Fikri Maulana", jenjang_id: "jg-6", unit_id: "sk-14", tahun_lulus: 2023, pekerjaan: "Guru", instansi: "MI PERSIS 02 Cibatu", kota: "Garut", aktif: true },
  { id: "al-4", nis: "2017.0058", nama: "Siti Zulfa Nurhaliza", jenjang_id: "jg-5", unit_id: "sk-13", tahun_lulus: 2020, pekerjaan: "Mahasiswi", instansi: "UIN Sunan Gunung Djati", kota: "Bandung", aktif: true },
  { id: "al-5", nis: "2016.0022", nama: "Ahmad Dzaki Mubarok", jenjang_id: "jg-4", unit_id: "sk-10", tahun_lulus: 2019, pekerjaan: "Wirausaha", instansi: "Toko Bangunan Berkah", kota: "Garut", aktif: true },
  { id: "al-6", nis: "2012.0301", nama: "Riani Kartika", jenjang_id: "jg-2", unit_id: "sk-5", tahun_lulus: 2018, pekerjaan: "Mahasiswi", instansi: "Universitas Garut", kota: "Garut", aktif: true },
  { id: "al-7", nis: "PT-2020-012", nama: "Hafizh Alfarizi", jenjang_id: "jg-6", unit_id: "sk-15", tahun_lulus: 2024, pekerjaan: "Pengajar tahfizh", instansi: "Pesantren Al-Furqan", kota: "Garut", aktif: true },
  { id: "al-8", nis: "2022.0148", nama: "Mutiara Fadhilah", jenjang_id: "jg-5", unit_id: "sk-12", tahun_lulus: 2025, pekerjaan: "Mahasiswi", instansi: "IPB University", kota: "Bogor", aktif: true },
];

const notifikasi = d.daftarNotifikasi(12).map((n) => ({
  id: `nt-${n.id}`,
  sasaran: "semua",
  jenis: n.jenis,
  judul: n.judul,
  ringkasan: n.ringkas,
  tautan: n.tautan ?? "/#/beranda",
  sumber_tabel: jenisNotifikasi[n.jenis] ?? null,
  sumber_id: n.id.replace(/^nf-/, ""),
  terbit: true,
}));

const benih = {
  versi: "v3",
  dibuat: new Date().toISOString(),
  situs,
  pengaturan,
  profil,
  pengurus,
  hero_slide,
  statistik,
  menu_cepat,
  tautan_sosial,
  jenjang,
  unit_pendidikan,
  jurusan,
  kategori,
  berita,
  artikel,
  pengumuman,
  agenda,
  kajian,
  kajian_rutin,
  galeri_album,
  galeri_foto,
  spmb_info,
  spmb_gelombang,
  spmb_biaya,
  tahun_ajaran,
  santri,
  mata_pelajaran,
  nilai,
  tahfidz_target,
  setoran_tahfidz,
  alumni,
  metode_pembayaran,
  tagihan,
  pembayaran,
  donasi_program,
  donasi_metode,
  donasi_rekening,
  donasi_donatur,
  donasi_riwayat,
  topik_kontak,
  kontak_unit,
  notifikasi,
};

fs.writeFileSync(path.join(disini, "benih.json"), `${JSON.stringify(benih, null, 1)}\n`);

const ringkas = Object.entries(benih)
  .filter(([, v]) => Array.isArray(v))
  .map(([k, v]) => `${k}: ${v.length}`)
  .join(", ");
console.log("benih.json ditulis.");
console.log(ringkas);
