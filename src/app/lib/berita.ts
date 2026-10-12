import { useEffect, useState } from "react";
import { berita as beritaStatis, gambar, kategoriBerita as kategoriStatis, type Berita } from "../data/content";

/**
 * Data halaman Berita dari database (teks, gambar utama, kategori, dan berita),
 * dengan data bawaan situs sebagai cadangan. Bentuk datanya sengaja sama dengan
 * tipe Berita bawaan supaya halaman situs tidak perlu banyak berubah.
 */

export type BeritaTampil = Berita & {
  /** Belum terbit = masih draf, tidak tampil di situs. */
  terbit: boolean;
  /** Sorotan = dijadikan Berita Utama di halaman berita. */
  sorotan: boolean;
};

export type KategoriBerita = { id: string; nama: string; aktif: boolean; jumlah: number };

export type BeritaGabungan = {
  halaman: { judul: string; pengantar: string };
  gambar: { url: string; alt: string };
  kategori: KategoriBerita[];
  berita: BeritaTampil[];
  dariDatabase: boolean;
};

const PENGANTAR_BAWAAN =
  "Kabar terbaru dari lembaga pendidikan PC PERSIS Cibatu: prestasi santri, kegiatan akademik, program dakwah, hingga informasi kelembagaan. Berita disusun dari yang paling baru, dan setiap berita dapat dibuka untuk dibaca selengkapnya.";

function dariStatis(): BeritaGabungan {
  const daftar: BeritaTampil[] = beritaStatis.map((b) => ({ ...b, terbit: true, sorotan: false }));
  return {
    halaman: { judul: "Berita", pengantar: PENGANTAR_BAWAAN },
    gambar: { url: gambar.masjidPutih, alt: "Gedung pendidikan PC PERSIS Cibatu" },
    kategori: kategoriStatis().map((nama) => ({
      id: `kt-berita-${nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      nama,
      aktif: true,
      jumlah: daftar.filter((b) => b.category === nama).length,
    })),
    berita: daftar,
    dariDatabase: false,
  };
}

type Jawaban = {
  halaman?: { judul?: string | null; pengantar?: string | null };
  gambar?: { url?: string | null; alt?: string | null };
  kategori?: { id: string; nama: string; aktif?: boolean | null; jumlah?: number | null }[];
  berita?: {
    id: string;
    slug: string;
    judul: string;
    tanggal?: string | null;
    kategori?: string | null;
    penulis?: string | null;
    gambarUrl?: string | null;
    dibaca?: number | null;
    ringkasan?: string | null;
    isi?: string[] | null;
    sorotan?: boolean | null;
    terbit?: boolean | null;
  }[];
};

function teks(nilai: string | null | undefined, cadangan: string) {
  if (nilai === null || nilai === undefined) return cadangan;
  const t = String(nilai).trim();
  return t === "" ? cadangan : t;
}

function gabung(j: Jawaban | null): BeritaGabungan {
  const bawaan = dariStatis();
  if (!j) return bawaan;

  const h = j.halaman ?? {};
  const g = j.gambar ?? {};
  const kategori: KategoriBerita[] =
    j.kategori && j.kategori.length > 0
      ? j.kategori.map((k) => ({
          id: k.id,
          nama: k.nama,
          aktif: k.aktif !== false,
          jumlah: Number(k.jumlah ?? 0),
        }))
      : bawaan.kategori;

  const berita: BeritaTampil[] =
    j.berita && j.berita.length > 0
      ? j.berita.map((b) => ({
          id: b.id,
          slug: b.slug,
          title: b.judul,
          date: b.tanggal ?? "",
          category: b.kategori ?? "Umum",
          image: b.gambarUrl ?? "",
          views: Number(b.dibaca ?? 0),
          author: b.penulis ?? "",
          excerpt: b.ringkasan ?? "",
          body: Array.isArray(b.isi) ? b.isi : [],
          terbit: b.terbit !== false,
          sorotan: !!b.sorotan,
        }))
      : bawaan.berita;

  return {
    halaman: { judul: teks(h.judul, bawaan.halaman.judul), pengantar: teks(h.pengantar, PENGANTAR_BAWAAN) },
    gambar: { url: teks(g.url, bawaan.gambar.url), alt: teks(g.alt, bawaan.gambar.alt) },
    kategori,
    berita,
    dariDatabase: true,
  };
}

let keadaan: BeritaGabungan = gabung(null);
const pendengar = new Set<(v: BeritaGabungan) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

export function segarkanBerita(): Promise<BeritaGabungan> {
  return fetch("/api/berita", { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Layanan menjawab ${r.status}`))))
    .then((j: Jawaban) => {
      keadaan = gabung(j);
      kabari();
      return keadaan;
    })
    .catch(() => keadaan);
}

export function useBerita(): BeritaGabungan {
  const [data, setData] = useState<BeritaGabungan>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    void segarkanBerita();
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}

/* ------------------------------ penyaring data ------------------------------ */

/** Berita yang boleh tampil di situs (sudah terbit). */
export const terbitSaja = (data: BeritaGabungan) => data.berita.filter((b) => b.terbit);

export const beritaTerbaru = (data: BeritaGabungan, n?: number) =>
  [...terbitSaja(data)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n ?? Number.MAX_SAFE_INTEGER);

/** Berita utama: sorotan terbaru, kalau tidak ada dipakai yang paling baru. */
export const beritaUtama = (data: BeritaGabungan) => {
  const daftar = beritaTerbaru(data);
  return daftar.find((b) => b.sorotan) ?? daftar[0];
};

export const beritaTrending = (data: BeritaGabungan, n = 5) =>
  [...terbitSaja(data)].sort((a, b) => b.views - a.views).slice(0, n);

/** Daftar kategori berita yang aktif, urut abjad. */
export const kategoriBerita = (data: BeritaGabungan) =>
  data.kategori
    .filter((k) => k.aktif)
    .map((k) => k.nama)
    .sort();

export const cariBerita = (data: BeritaGabungan, slug: string) => data.berita.find((b) => b.slug === slug);

/** Berita lain: urut terbaru, tanpa berita yang sedang dibuka. */
export const beritaLain = (data: BeritaGabungan, slug: string, n = 3) =>
  beritaTerbaru(data)
    .filter((b) => b.slug !== slug)
    .slice(0, n);

/** Baca juga: kategori yang sama lebih dahulu, lalu berita terbaru lainnya. */
export const beritaTerkait = (data: BeritaGabungan, slug: string, n = 1) => {
  const sedang = cariBerita(data, slug);
  const lain = beritaTerbaru(data).filter((b) => b.slug !== slug);
  const sekategori = sedang ? lain.filter((b) => b.category === sedang.category) : [];
  return [...sekategori, ...lain.filter((b) => !sekategori.includes(b))].slice(0, n);
};

/** Tambah penghitung dibaca berita (dipanggil saat halaman detail dibuka). */
export function hitungDibaca(slug: string) {
  return fetch(`/api/berita/${encodeURIComponent(slug)}/dibaca`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Layanan menjawab ${r.status}`))))
    .catch(() => null);
}
