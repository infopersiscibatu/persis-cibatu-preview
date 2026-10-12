import { useEffect, useState } from "react";
import { pengumuman as pengumumanStatis, type Pengumuman } from "../data/content";

/**
 * Data pengumuman dari database (daftar pengumuman dan kategorinya), dengan data
 * bawaan situs sebagai cadangan. Bentuk datanya sama dengan tipe Pengumuman bawaan
 * supaya halaman situs tidak perlu banyak berubah.
 */

export type PengumumanTampil = Pengumuman & {
  /** Belum terbit = draf, tidak tampil di situs. */
  terbit: boolean;
};

export type KategoriPengumuman = { id: string; nama: string; aktif: boolean; jumlah: number };

export type PengumumanGabungan = {
  kategori: KategoriPengumuman[];
  pengumuman: PengumumanTampil[];
  dariDatabase: boolean;
};

function dariStatis(): PengumumanGabungan {
  const daftar: PengumumanTampil[] = pengumumanStatis.map((p) => ({ ...p, terbit: true }));
  const nama = [...new Set(daftar.map((p) => p.category))].sort();
  return {
    kategori: nama.map((n, i) => ({
      id: `kt-pengumuman-${i + 1}`,
      nama: n,
      aktif: true,
      jumlah: daftar.filter((p) => p.category === n).length,
    })),
    pengumuman: daftar,
    dariDatabase: false,
  };
}

type Jawaban = {
  kategori?: { id: string; nama: string; aktif?: boolean | null; jumlah?: number | null }[];
  pengumuman?: {
    id: string;
    judul: string;
    tanggal?: string | null;
    kategori?: string | null;
    ringkasan?: string | null;
    isi?: string[] | null;
    disematkan?: boolean | null;
    dibaca?: number | null;
    terbit?: boolean | null;
  }[];
};

const teks = (nilai: string | null | undefined, cadangan = "") => {
  if (nilai === null || nilai === undefined) return cadangan;
  const t = String(nilai).trim();
  return t === "" ? cadangan : t;
};

function gabung(j: Jawaban | null): PengumumanGabungan {
  const bawaan = dariStatis();
  if (!j) return bawaan;

  const kategori: KategoriPengumuman[] =
    j.kategori && j.kategori.length > 0
      ? j.kategori.map((k) => ({ id: k.id, nama: k.nama, aktif: k.aktif !== false, jumlah: Number(k.jumlah ?? 0) }))
      : bawaan.kategori;

  const pengumuman: PengumumanTampil[] =
    j.pengumuman && j.pengumuman.length > 0
      ? j.pengumuman.map((p) => ({
          id: p.id,
          title: p.judul,
          date: p.tanggal ?? "",
          category: teks(p.kategori, "Umum"),
          summary: teks(p.ringkasan),
          detail: Array.isArray(p.isi) ? p.isi : [],
          pinned: p.disematkan === true,
          views: Number(p.dibaca ?? 0),
          terbit: p.terbit !== false,
        }))
      : bawaan.pengumuman;

  return { kategori, pengumuman, dariDatabase: true };
}

let keadaan: PengumumanGabungan = gabung(null);
let janji: Promise<PengumumanGabungan> | null = null;
const pendengar = new Set<(v: PengumumanGabungan) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

/**
 * Menambah penghitung dibaca sebuah pengumuman (dipanggil saat pengunjung membuka
 * detailnya). Nilai balikannya adalah jumlah dibaca terbaru menurut layanan.
 */
export async function hitungDibaca(id: string): Promise<number | null> {
  try {
    const jawab = await fetch(`/api/pengumuman/${encodeURIComponent(id)}/dibaca`, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    if (!jawab.ok) return null;
    const data = (await jawab.json()) as { dibaca?: number | null };
    return typeof data.dibaca === "number" ? data.dibaca : null;
  } catch {
    return null;
  }
}

export function segarkanPengumuman(): Promise<PengumumanGabungan> {
  if (janji) return janji;
  janji = fetch("/api/pengumuman", { headers: { Accept: "application/json" } })
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

export function usePengumuman(): PengumumanGabungan {
  const [data, setData] = useState<PengumumanGabungan>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    void segarkanPengumuman();
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}

/* ------------------------------ penyaring data ------------------------------ */

/** Pengumuman yang boleh tampil di situs (sudah terbit). */
export const terbitSajaPengumuman = (data: PengumumanGabungan) => data.pengumuman.filter((p) => p.terbit);

/** Lima pengumuman terbaru (sematan lebih dahulu). */
export const pengumumanTerbaru = (data: PengumumanGabungan, n = 5) =>
  [...terbitSajaPengumuman(data)]
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date))
    .slice(0, n);

/** Pengumuman utama: yang disematkan, atau yang paling baru. */
export const pengumumanUtama = (data: PengumumanGabungan) => {
  const daftar = terbitSajaPengumuman(data);
  return daftar.find((p) => p.pinned) ?? pengumumanTerbaru(data, 1)[0];
};

export const cariPengumuman = (data: PengumumanGabungan, id: string) => data.pengumuman.find((p) => p.id === id);

/** Kategori aktif, urut abjad. */
export const kategoriPengumuman = (data: PengumumanGabungan) =>
  data.kategori
    .filter((k) => k.aktif)
    .map((k) => k.nama)
    .sort();
