import { hariKe, tanggalBulanSingkat } from "../lib/format";

/* Album dan foto galeri — sama seperti situs rujukan. */

export const albumGaleri = [
  "Semua",
  "Kegiatan Belajar",
  "Kajian & Dakwah",
  "Tahfizhul Qur'an",
  "Ekstrakurikuler",
  "Wisuda & Kelulusan",
  "Fasilitas & Kampus",
];

type FotoMentah = { id: string; judul: string; album: string; hari: number; gambar: string };

const fotoMentah: FotoMentah[] = [
  { id: "gf-1", judul: "Suasana belajar di kelas MI PERSIS 01 Cibatu", album: "Kegiatan Belajar", hari: -2, gambar:
    "https://images.unsplash.com/photo-1757141975350-e5702ecff5bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { id: "gf-2", judul: "Belajar membaca Al-Qur'an dengan metode tartil", album: "Kegiatan Belajar", hari: -6, gambar:
    "https://images.pexels.com/photos/37350650/pexels-photo-37350650.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
  { id: "gf-3", judul: "Diskusi kelompok siswa di ruang kelas", album: "Kegiatan Belajar", hari: -11, gambar:
    "https://images.unsplash.com/photo-1629273229214-d96be4552b9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { id: "gf-4", judul: "Kajian rutin Ahad subuh di Masjid Al-Furqan", album: "Kajian & Dakwah", hari: -4, gambar:
    "https://images.unsplash.com/photo-1540567736792-f78f6242e4e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { id: "gf-5", judul: "Jamaah menanti kajian ba'da Maghrib", album: "Kajian & Dakwah", hari: -13, gambar:
    "https://images.unsplash.com/photo-1671811542591-42765d45650c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { id: "gf-6", judul: "Tablig akbar bersama pengurus cabang", album: "Kajian & Dakwah", hari: -25, gambar:
    "https://images.pexels.com/photos/35236671/pexels-photo-35236671.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
  { id: "gf-7", judul: "Setoran hafalan santri kepada ustadz", album: "Tahfizhul Qur'an", hari: -3, gambar:
    "https://images.pexels.com/photos/39838896/pexels-photo-39838896.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
  { id: "gf-8", judul: "Muraja'ah hafalan sebelum kegiatan belajar", album: "Tahfizhul Qur'an", hari: -17, gambar:
    "https://images.pexels.com/photos/39838892/pexels-photo-39838892.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
  { id: "gf-9", judul: "Halaqah tahfizh juz 30 tingkat MI", album: "Tahfizhul Qur'an", hari: -32, gambar:
    "https://images.pexels.com/photos/37350652/pexels-photo-37350652.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
  { id: "gf-10", judul: "Latihan basket di lapangan madrasah", album: "Ekstrakurikuler", hari: -8, gambar:
    "https://images.pexels.com/photos/10643703/pexels-photo-10643703.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
  { id: "gf-11", judul: "Kegiatan kepanduan di lapangan hijau", album: "Ekstrakurikuler", hari: -20, gambar:
    "https://images.unsplash.com/photo-1606092195808-3107b7ed4c98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { id: "gf-12", judul: "Pentas seni dan permainan tradisional santri", album: "Ekstrakurikuler", hari: -44, gambar:
    "https://images.unsplash.com/photo-1774437792146-6453787e715c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { id: "gf-13", judul: "Wisuda tahfizh angkatan terakhir", album: "Wisuda & Kelulusan", hari: -38, gambar:
    "https://images.unsplash.com/photo-1599943821034-8cb5c7526922?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { id: "gf-14", judul: "Prosesi kelulusan peserta didik MA", album: "Wisuda & Kelulusan", hari: -52, gambar:
    "https://images.pexels.com/photos/30562665/pexels-photo-30562665.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
  { id: "gf-15", judul: "Foto bersama wisudawan dan dewan guru", album: "Wisuda & Kelulusan", hari: -67, gambar:
    "https://images.pexels.com/photos/31958032/pexels-photo-31958032.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
  { id: "gf-16", judul: "Kubah hijau Masjid Al-Furqan Cibatu", album: "Fasilitas & Kampus", hari: -29, gambar:
    "https://images.unsplash.com/photo-1692977579997-948328cdb7d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { id: "gf-17", judul: "Gedung madrasah dan komplek pendidikan PERSIS", album: "Fasilitas & Kampus", hari: -58, gambar:
    "https://images.pexels.com/photos/37945700/pexels-photo-37945700.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
  { id: "gf-18", judul: "Halaman dan lapangan olahraga madrasah", album: "Fasilitas & Kampus", hari: -81, gambar:
    "https://images.pexels.com/photos/10643697/pexels-photo-10643697.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
];

export type Foto = { id: string; judul: string; album: string; gambar: string; tanggal: string; hari: number };

/** Foto terbaru lebih dahulu. */
export const galeri: Foto[] = [...fotoMentah]
  .sort((a, b) => b.hari - a.hari)
  .map((f) => ({ id: f.id, judul: f.judul, album: f.album, gambar: f.gambar, tanggal: tanggalBulanSingkat(hariKe(f.hari)), hari: f.hari }));

export const fotoAlbum = (album: string) => (album === "Semua" ? galeri : galeri.filter((f) => f.album === album));
