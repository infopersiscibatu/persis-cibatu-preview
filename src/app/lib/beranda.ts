import { useEffect, useState } from "react";
/* Data contoh dari ../data/content tidak dipakai lagi sebagai cadangan tampilan:
   beranda hanya menampilkan data asli dari database. */

/** Susunan bawaan navigasi bawah, dipakai bila pengaturan belum tersimpan. */
const NAV_STATIS = [
  { id: "beranda", label: "Beranda", icon: "home" },
  { id: "berita", label: "Berita", icon: "newspaper" },
  { id: "ppdb", label: "SPMB", icon: "clipboard" },
  { id: "artikel", label: "Artikel", icon: "book-open" },
  { id: "info", label: "Info", icon: "info" },
];

/**
 * Data tampilan beranda dari database: carousel sorotan, susunan grid menu,
 * susunan navigasi bawah, dan tautan media sosial. Data bawaan situs dipakai
 * sebagai cadangan supaya beranda tetap utuh bila layanan belum menjawab.
 */

export type Carousel = {
  id: string;
  urutan: number;
  tag: string | null;
  judul: string;
  teks: string | null;
  gambarUrl: string;
  tombolLabel: string | null;
  tombolHalaman: string | null;
  aktif: boolean;
};

export type MenuGrid = {
  id: string;
  urutan: number;
  label: string;
  keterangan: string | null;
  ikon: string;
  halaman: string;
  lencana: string | null;
  aktif: boolean;
};

export type NavBawah = { halaman: string; label: string; ikon: string; aktif: boolean };

export type TautanSosial = { id: string; urutan: number; nama: string; url: string; ikon: string; aktif: boolean };

export type PilihanHalaman = { nilai: string; label: string };

/**
 * Satu kartu statistik di bawah hero. Bila `sumber` terisi ('jenjang', 'siswa',
 * atau 'mahasiswa'), angkanya dihitung layanan dari tabel jenjang dan santri
 * sehingga selalu sama dengan data terbaru di database.
 */
export type StatistikKartu = {
  id: string;
  urutan: number;
  ikon: string;
  label: string;
  labelPendek: string;
  nilai: string;
  satuan: string | null;
  catatan: string | null;
  tone: string;
  aktif: boolean;
  sumber: string | null;
};

export type BerandaGabungan = {
  statistik: StatistikKartu[];
  carousel: Carousel[];
  gridMenu: MenuGrid[];
  navigasi: NavBawah[];
  sosial: TautanSosial[];
  halaman: PilihanHalaman[];
  dariDatabase: boolean;
};

export const HALAMAN_BAWAAN: PilihanHalaman[] = [
  { nilai: "beranda", label: "Beranda" },
  { nilai: "berita", label: "Berita" },
  { nilai: "kajian", label: "Kajian" },
  { nilai: "artikel", label: "Artikel" },
  { nilai: "galeri", label: "Galeri" },
  { nilai: "jenjang", label: "Jenjang" },
  { nilai: "ppdb", label: "SPMB / PPDB" },
  { nilai: "wali", label: "Wali Santri" },
  { nilai: "profil", label: "Profil" },
  { nilai: "kontak", label: "Kontak" },
  { nilai: "info", label: "Info" },
];

export const IKON_SOSIAL = ["whatsapp", "instagram", "facebook", "youtube", "mail", "phone", "info"];

function dariStatis(): BerandaGabungan {
  return {
    /* Kartu statistik, carousel, grid menu, dan tautan sosial sengaja kosong:
       angka contoh tidak boleh tampil sebelum data asli tiba dari database. */
    statistik: [],
    carousel: [],
    gridMenu: [],
    navigasi: NAV_STATIS.map((t) => ({ halaman: t.id, label: t.label, ikon: t.icon, aktif: true })),
    sosial: [],
    halaman: HALAMAN_BAWAAN,
    dariDatabase: false,
  };
}

type Jawaban = Partial<{
  statistik: Partial<StatistikKartu>[] | null;
  carousel: Partial<Carousel>[] | null;
  gridMenu: Partial<MenuGrid>[] | null;
  navigasi: Partial<NavBawah>[] | null;
  sosial: Partial<TautanSosial>[] | null;
  halaman: PilihanHalaman[] | null;
}>;

const teks = (nilai: string | null | undefined) => (nilai === null || nilai === undefined ? null : nilai);

function gabung(j: Jawaban | null): BerandaGabungan {
  const bawaan = dariStatis();
  if (!j) return bawaan;

  const statistik: StatistikKartu[] =
    j.statistik && j.statistik.length > 0
      ? j.statistik
          .filter((k) => k && k.nilai !== undefined && k.nilai !== null)
          .map((k, i) => ({
            id: String(k.id ?? `st-${i + 1}`),
            urutan: Number(k.urutan ?? i + 1),
            ikon: String(k.ikon ?? "users"),
            label: String(k.label ?? "Statistik"),
            labelPendek: String(k.labelPendek ?? k.label ?? "Statistik"),
            nilai: String(k.nilai),
            satuan: teks(k.satuan as string | null | undefined),
            catatan: teks(k.catatan as string | null | undefined),
            tone: String(k.tone ?? "green"),
            aktif: k.aktif !== false,
            sumber: teks(k.sumber as string | null | undefined),
          }))
      : bawaan.statistik;

  const carousel: Carousel[] =
    j.carousel && j.carousel.length > 0
      ? j.carousel
          .filter((s) => s && s.judul && s.gambarUrl)
          .map((s, i) => ({
            id: String(s.id ?? `sl-${i + 1}`),
            urutan: Number(s.urutan ?? i + 1),
            tag: teks(s.tag),
            judul: String(s.judul),
            teks: teks(s.teks),
            gambarUrl: String(s.gambarUrl),
            tombolLabel: teks(s.tombolLabel as string | null | undefined),
            tombolHalaman: teks(s.tombolHalaman as string | null | undefined),
            aktif: s.aktif !== false,
          }))
      : bawaan.carousel;

  const gridMenu: MenuGrid[] =
    j.gridMenu && j.gridMenu.length > 0
      ? j.gridMenu
          .filter((m) => m && m.label && m.halaman)
          .map((m, i) => ({
            id: String(m.id ?? `mn-${i + 1}`),
            urutan: Number(m.urutan ?? i + 1),
            label: String(m.label),
            keterangan: teks(m.keterangan),
            ikon: String(m.ikon ?? "circle"),
            halaman: String(m.halaman),
            lencana: teks(m.lencana),
            aktif: m.aktif !== false,
          }))
      : bawaan.gridMenu;

  const navigasi: NavBawah[] =
    j.navigasi && j.navigasi.length > 0
      ? j.navigasi
          .filter((n) => n && n.halaman && n.label)
          .map((n) => ({
            halaman: String(n.halaman),
            label: String(n.label),
            ikon: String(n.ikon ?? "circle"),
            aktif: n.aktif !== false,
          }))
      : bawaan.navigasi;

  const sosial: TautanSosial[] =
    j.sosial && j.sosial.length > 0
      ? j.sosial
          .filter((s) => s && s.url)
          .map((s, i) => ({
            id: String(s.id ?? `ts-${i + 1}`),
            urutan: Number(s.urutan ?? i + 1),
            nama: String(s.nama ?? "Tautan"),
            url: String(s.url),
            ikon: String(s.ikon ?? "circle"),
            aktif: s.aktif !== false,
          }))
      : bawaan.sosial;

  return {
    statistik,
    carousel,
    gridMenu,
    navigasi,
    sosial,
    halaman: j.halaman && j.halaman.length > 0 ? j.halaman : HALAMAN_BAWAAN,
    dariDatabase: true,
  };
}

let keadaan: BerandaGabungan = gabung(null);
let janji: Promise<BerandaGabungan> | null = null;
const pendengar = new Set<(v: BerandaGabungan) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

export function segarkanBeranda(): Promise<BerandaGabungan> {
  if (janji) return janji;
  janji = fetch("/api/beranda", { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Layanan menjawab ${r.status}`))))
    .then((j: Jawaban) => {
      keadaan = gabung(j);
      kabari();
      return keadaan;
    })
    .catch(() => keadaan)
    .finally(() => {
      janji = null;
    });
  return janji;
}

export function useBeranda(): BerandaGabungan {
  const [data, setData] = useState<BerandaGabungan>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    void segarkanBeranda();
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}

/* ------------------------------ penyaring data ------------------------------ */

const urutkan = <T extends { urutan: number }>(daftar: T[]) => [...daftar].sort((a, b) => a.urutan - b.urutan);

/** Kartu statistik yang tampil di beranda, urut sesuai pengaturan. */
export const statistikTampil = (data: BerandaGabungan) => urutkan(data.statistik).filter((k) => k.aktif);

/** Gambar carousel yang tampil di beranda. */
export const carouselTampil = (data: BerandaGabungan) => urutkan(data.carousel).filter((s) => s.aktif);

/** Susunan grid menu yang tampil di beranda. */
export const gridTampil = (data: BerandaGabungan) => urutkan(data.gridMenu).filter((m) => m.aktif);

/** Susunan navigasi bawah yang tampil. */
export const navTampil = (data: BerandaGabungan) => data.navigasi.filter((n) => n.aktif);

/** Tautan media sosial yang tampil di footer. */
export const sosialTampil = (data: BerandaGabungan) => urutkan(data.sosial).filter((s) => s.aktif);

/** Nama halaman dari kuncinya, untuk keterangan di panel. */
export const labelHalaman = (data: BerandaGabungan, kunci: string) =>
  data.halaman.find((h) => h.nilai === kunci)?.label ?? kunci;
