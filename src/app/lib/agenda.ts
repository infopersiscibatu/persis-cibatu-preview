import { useEffect, useState } from "react";
import { agenda as agendaStatis, type Agenda } from "../data/content";

/**
 * Data agenda dari database (daftar agenda dan kategorinya), dengan data bawaan situs
 * sebagai cadangan. Bentuk datanya sama dengan tipe Agenda bawaan supaya halaman situs
 * tidak perlu banyak berubah.
 */

export type AgendaTampil = Agenda & {
  /** Belum terbit = draf, tidak tampil di situs. */
  terbit: boolean;
  /** Jumlah dibaca, dihitung otomatis setiap detail agenda dibuka pengunjung. */
  views: number;
};

export type KategoriAgenda = { id: string; nama: string; aktif: boolean; jumlah: number };

export type AgendaGabungan = {
  kategori: KategoriAgenda[];
  agenda: AgendaTampil[];
  dariDatabase: boolean;
};

function dariStatis(): AgendaGabungan {
  const daftar: AgendaTampil[] = agendaStatis.map((a) => ({ ...a, terbit: true, views: 0 }));
  const nama = [...new Set(daftar.map((a) => a.tag))].sort();
  return {
    kategori: nama.map((n, i) => ({
      id: `kt-agenda-${i + 1}`,
      nama: n,
      aktif: true,
      jumlah: daftar.filter((a) => a.tag === n).length,
    })),
    agenda: daftar,
    dariDatabase: false,
  };
}

type Jawaban = {
  kategori?: { id: string; nama: string; aktif?: boolean | null; jumlah?: number | null }[];
  agenda?: {
    id: string;
    judul: string;
    tanggal?: string | null;
    waktu?: string | null;
    tempat?: string | null;
    tag?: string | null;
    isi?: string[] | null;
    dibaca?: number | null;
    terbit?: boolean | null;
  }[];
};

const teks = (nilai: string | null | undefined, cadangan = "") => {
  if (nilai === null || nilai === undefined) return cadangan;
  const t = String(nilai).trim();
  return t === "" ? cadangan : t;
};

function gabung(j: Jawaban | null): AgendaGabungan {
  const bawaan = dariStatis();
  if (!j) return bawaan;

  const kategori: KategoriAgenda[] =
    j.kategori && j.kategori.length > 0
      ? j.kategori.map((k) => ({ id: k.id, nama: k.nama, aktif: k.aktif !== false, jumlah: Number(k.jumlah ?? 0) }))
      : bawaan.kategori;

  const agenda: AgendaTampil[] =
    j.agenda && j.agenda.length > 0
      ? j.agenda.map((a) => ({
          id: a.id,
          title: a.judul,
          date: a.tanggal ?? "",
          time: teks(a.waktu, "—"),
          place: teks(a.tempat, "—"),
          tag: teks(a.tag, "Umum"),
          detail: Array.isArray(a.isi) ? a.isi : [],
          views: Number(a.dibaca ?? 0),
          terbit: a.terbit !== false,
        }))
      : bawaan.agenda;

  return { kategori, agenda, dariDatabase: true };
}

let keadaan: AgendaGabungan = gabung(null);
let janji: Promise<AgendaGabungan> | null = null;
const pendengar = new Set<(v: AgendaGabungan) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

/**
 * Menambah penghitung dibaca sebuah agenda (dipanggil saat pengunjung membuka
 * detailnya). Nilai balikannya adalah jumlah dibaca terbaru menurut layanan.
 */
export async function hitungDibaca(id: string): Promise<number | null> {
  try {
    const jawab = await fetch(`/api/agenda/${encodeURIComponent(id)}/dibaca`, {
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

export function segarkanAgenda(): Promise<AgendaGabungan> {
  if (janji) return janji;
  janji = fetch("/api/agenda", { headers: { Accept: "application/json" } })
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

export function useAgenda(): AgendaGabungan {
  const [data, setData] = useState<AgendaGabungan>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    void segarkanAgenda();
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}

/* ------------------------------ penyaring data ------------------------------ */

/** Agenda yang boleh tampil di situs (sudah terbit). */
export const terbitSajaAgenda = (data: AgendaGabungan) => data.agenda.filter((a) => a.terbit);

/** Jadwal terdekat lebih dahulu (tanggal paling awal). */
export const agendaTerdekat = (data: AgendaGabungan, n = 5) =>
  [...terbitSajaAgenda(data)].sort((a, b) => a.date.localeCompare(b.date)).slice(0, n);

export const cariAgenda = (data: AgendaGabungan, id: string) => data.agenda.find((a) => a.id === id);

/** Kategori aktif, urut abjad. */
export const kategoriAgenda = (data: AgendaGabungan) =>
  data.kategori
    .filter((k) => k.aktif)
    .map((k) => k.nama)
    .sort();
