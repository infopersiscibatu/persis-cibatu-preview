import { useEffect, useState } from "react";
import {
  artikel as artikelStatis,
  gambar,
  kategoriArtikel as kategoriStatis,
  type Artikel,
} from "../data/content";

/**
 * Data halaman Artikel dari database (teks, gambar utama, kategori, dan artikel),
 * dengan data bawaan situs sebagai cadangan. Bentuk datanya sama dengan tipe Artikel
 * bawaan supaya halaman situs tidak perlu banyak berubah.
 */

export type ArtikelTampil = Artikel & {
  /** Belum terbit = masih draf, tidak tampil di situs. */
  terbit: boolean;
};

export type KategoriArtikel = { id: string; nama: string; aktif: boolean; jumlah: number };

export type ArtikelGabungan = {
  halaman: { judul: string; pengantar: string };
  gambar: { url: string; alt: string };
  kategori: KategoriArtikel[];
  artikel: ArtikelTampil[];
  dariDatabase: boolean;
};

const PENGANTAR_BAWAAN =
  "Kumpulan tulisan para asatidz dan pembina lembaga: kajian adab, fikih praktis, tarbiyah keluarga, hingga sirah perjuangan dakwah. Tulisan disusun ringkas agar mudah dibaca dan diamalkan, disertai keterangan waktu baca pada setiap artikel.";

function dariStatis(): ArtikelGabungan {
  const daftar: ArtikelTampil[] = artikelStatis.map((a) => ({ ...a, terbit: true }));
  return {
    halaman: { judul: "Artikel", pengantar: PENGANTAR_BAWAAN },
    gambar: { url: gambar.berdiskusi, alt: "Suasana kajian dan pembelajaran di PC PERSIS Cibatu" },
    kategori: kategoriStatis().map((nama) => ({
      id: `kt-artikel-${nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      nama,
      aktif: true,
      jumlah: daftar.filter((a) => a.kategori === nama).length,
    })),
    artikel: daftar,
    dariDatabase: false,
  };
}

type Jawaban = {
  halaman?: { judul?: string | null; pengantar?: string | null };
  gambar?: { url?: string | null; alt?: string | null };
  kategori?: { id: string; nama: string; aktif?: boolean | null; jumlah?: number | null }[];
  artikel?: {
    id: string;
    slug: string;
    judul: string;
    kategori?: string | null;
    penulis?: string | null;
    tanggal?: string | null;
    menitBaca?: number | null;
    dibaca?: number | null;
    gambarUrl?: string | null;
    ringkasan?: string | null;
    isi?: string[] | null;
    terbit?: boolean | null;
  }[];
};

const teks = (nilai: string | null | undefined, cadangan = "") => {
  if (nilai === null || nilai === undefined) return cadangan;
  const t = String(nilai).trim();
  return t === "" ? cadangan : t;
};

function gabung(j: Jawaban | null): ArtikelGabungan {
  const bawaan = dariStatis();
  if (!j) return bawaan;

  const h = j.halaman ?? {};
  const g = j.gambar ?? {};

  const kategori: KategoriArtikel[] =
    j.kategori && j.kategori.length > 0
      ? j.kategori.map((k) => ({
          id: k.id,
          nama: k.nama,
          aktif: k.aktif !== false,
          jumlah: Number(k.jumlah ?? 0),
        }))
      : bawaan.kategori;

  const artikel: ArtikelTampil[] =
    j.artikel && j.artikel.length > 0
      ? j.artikel.map((a) => ({
          id: a.id,
          slug: a.slug,
          judul: a.judul,
          kategori: teks(a.kategori, "Umum"),
          penulis: teks(a.penulis, ""),
          tanggal: a.tanggal ?? "",
          menitBaca: Number(a.menitBaca ?? 3),
          dibaca: Number(a.dibaca ?? 0),
          gambar: teks(a.gambarUrl, ""),
          ringkasan: teks(a.ringkasan, ""),
          isi: Array.isArray(a.isi) ? a.isi : [],
          terbit: a.terbit !== false,
        }))
      : bawaan.artikel;

  return {
    halaman: { judul: teks(h.judul, bawaan.halaman.judul), pengantar: teks(h.pengantar, PENGANTAR_BAWAAN) },
    gambar: { url: teks(g.url, bawaan.gambar.url), alt: teks(g.alt, bawaan.gambar.alt) },
    kategori,
    artikel,
    dariDatabase: true,
  };
}

let keadaan: ArtikelGabungan = gabung(null);
const pendengar = new Set<(v: ArtikelGabungan) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

export function segarkanArtikel(): Promise<ArtikelGabungan> {
  return fetch("/api/artikel", { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Layanan menjawab ${r.status}`))))
    .then((j: Jawaban) => {
      keadaan = gabung(j);
      kabari();
      return keadaan;
    })
    .catch(() => keadaan);
}

export function useArtikel(): ArtikelGabungan {
  const [data, setData] = useState<ArtikelGabungan>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    void segarkanArtikel();
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}

/* ------------------------------ penyaring data ------------------------------ */

/** Artikel yang boleh tampil di situs (sudah terbit). */
export const terbitSajaArtikel = (data: ArtikelGabungan) => data.artikel.filter((a) => a.terbit);

export const artikelTerbaru = (data: ArtikelGabungan, n?: number) =>
  [...terbitSajaArtikel(data)]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, n ?? Number.MAX_SAFE_INTEGER);

export const artikelTerpopuler = (data: ArtikelGabungan, n = 5) =>
  [...terbitSajaArtikel(data)].sort((a, b) => b.dibaca - a.dibaca).slice(0, n);

export const cariArtikel = (data: ArtikelGabungan, slug: string) => data.artikel.find((a) => a.slug === slug);

/** Daftar kategori artikel yang aktif, urut abjad. */
export const kategoriArtikel = (data: ArtikelGabungan) =>
  data.kategori
    .filter((k) => k.aktif)
    .map((k) => k.nama)
    .sort();

/** Artikel lain: kategori yang sama lebih dahulu, lalu artikel terbaru lainnya. */
export const artikelLainnya = (data: ArtikelGabungan, slug: string, n = 1) => {
  const sedang = cariArtikel(data, slug);
  const lain = artikelTerbaru(data).filter((a) => a.slug !== slug);
  const sekategori = sedang ? lain.filter((a) => a.kategori === sedang.kategori) : [];
  return [...sekategori, ...lain.filter((a) => !sekategori.includes(a))].slice(0, n);
};

/** Jumlah kartu "baca juga" mengikuti panjang isi (1–3 kartu). */
export const jumlahBacaJuga = (a: Artikel) => Math.min(3, Math.max(1, Math.ceil(a.isi.length / 3)));

/** Tambah penghitung dibaca artikel (dipanggil saat halaman detail dibuka). */
export function hitungDibaca(slug: string) {
  return fetch(`/api/artikel/${encodeURIComponent(slug)}/dibaca`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Layanan menjawab ${r.status}`))))
    .catch(() => null);
}
