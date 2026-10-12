/**
 * Iklan yang disisipkan di dalam isi Berita dan Artikel.
 *
 * Datanya diambil sekali dari layanan (`/api/iklan`) lalu dipakai bersama oleh semua
 * halaman. Bila layanan tidak menjawab, dipakai daftar bawaan supaya slotnya tidak
 * kosong saat pratinjau.
 *
 * Bila ada lebih dari satu iklan aktif, halaman memilih satu secara tetap berdasarkan
 * judul postingan (`iklanUntuk`): pilihannya bisa berbeda antar postingan, tetapi tidak
 * berubah-ubah setiap kali halaman dibuka.
 */

import { useEffect, useState } from "react";
import { bukaHalaman } from "./navigasi";

export type Iklan = {
  id: string;
  label: string;
  judul: string;
  teks: string | null;
  gambarUrl: string | null;
  /** Alamat tujuan: `#/halaman` untuk halaman situs, atau http(s) untuk tautan luar. */
  tautan: string | null;
  /** Iklan yang dimatikan tetap tersimpan di panel admin, tapi tidak tampil di situs. */
  aktif: boolean;
};

/** Iklan bawaan sebelum layanan menjawab (sekaligus contoh isi iklan). */
export const IKLAN_BAWAAN: Iklan[] = [
  {
    id: "ik-1",
    label: "Iklan",
    judul: "Penerimaan Murid & Mahasiswa Baru 2026/2027",
    teks: "Kuota terbatas untuk RA, MI, MTs, MA, dan Perguruan Tinggi. Daftar lebih awal dan dapatkan potongan biaya pendaftaran.",
    gambarUrl:
      "https://images.unsplash.com/photo-1629273229664-11fabc0becc0?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900&h=300",
    tautan: "#/spmb",
    aktif: true,
  },
  {
    id: "ik-2",
    label: "Iklan",
    judul: "Kajian Ahad Subuh Terbuka untuk Umum",
    teks: "Setiap Ahad, 05.30 WIB di Masjid Al-Furqan Cibatu. Hadir bersama jama'ah PC PERSIS Cibatu.",
    gambarUrl:
      "https://images.unsplash.com/photo-1569929919600-59123640bc02?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900&h=300",
    tautan: "#/kajian",
    aktif: true,
  },
  {
    id: "ik-3",
    label: "Iklan",
    judul: "Donasi Beasiswa Santri & Mahasiswa",
    teks: "Salurkan ZIS Anda untuk beasiswa santri dan mahasiswa berprestasi di lingkungan PC PERSIS Cibatu.",
    gambarUrl:
      "https://images.unsplash.com/photo-1589104760192-ccab0ce0d90f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900&h=300",
    tautan: "#/donasi",
    aktif: true,
  },
];

type Jawaban = { iklan?: Partial<Iklan>[] | null };

const teks = (nilai: unknown, cadangan = ""): string => {
  if (nilai === null || nilai === undefined) return cadangan;
  const t = String(nilai).trim();
  return t === "" ? cadangan : t;
};

const teksOpsional = (nilai: unknown): string | null => {
  const t = teks(nilai);
  return t === "" ? null : t;
};

function rapikan(j: Partial<Iklan>, i: number): Iklan {
  return {
    id: teks(j.id, `ik-${i + 1}`),
    label: teks(j.label, "Iklan"),
    judul: teks(j.judul),
    teks: teksOpsional(j.teks),
    gambarUrl: teksOpsional(j.gambarUrl),
    tautan: teksOpsional(j.tautan),
    aktif: j.aktif !== false,
  };
}

/* Daftar iklan dipakai bersama semua halaman. Setiap perubahan dari panel admin
   dikabarkan ke komponen yang sedang menampilkan slot iklan. */
let keadaan: Iklan[] = [];
let janji: Promise<Iklan[]> | null = null;
const pendengar = new Set<(v: Iklan[]) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

/** Mengambil ulang daftar iklan dari layanan. */
export function segarkanIklan(): Promise<Iklan[]> {
  janji = (async () => {
    try {
      const jawab = await fetch("/api/iklan", { headers: { accept: "application/json" } });
      if (!jawab.ok) throw new Error(String(jawab.status));
      const data = (await jawab.json()) as Jawaban;
      /* Daftar kosong dari layanan berarti memang tidak ada iklan: slotnya tidak tampil. */
      if (Array.isArray(data.iklan)) keadaan = data.iklan.map(rapikan);
    } catch {
      /* Layanan belum menjawab: pakai contoh bawaan supaya pratinjau tidak kosong. */
      if (keadaan.length === 0) keadaan = IKLAN_BAWAAN;
    }
    kabari();
    return keadaan;
  })();
  return janji;
}

/** Mengambil iklan sekali saja; pemanggilan berikutnya memakai hasil yang tersimpan. */
export function muatIklan(): Promise<Iklan[]> {
  if (janji) return janji;
  return segarkanIklan();
}

export function useIklan(): Iklan[] {
  const [daftar, setDaftar] = useState<Iklan[]>(keadaan);
  useEffect(() => {
    pendengar.add(setDaftar);
    setDaftar(keadaan);
    void muatIklan();
    return () => {
      pendengar.delete(setDaftar);
    };
  }, []);
  return daftar;
}

/** Angka tetap dari sebuah teks, dipakai untuk memilih iklan secara stabil. */
function angkaKunci(kunci: string): number {
  let n = 0;
  for (let i = 0; i < kunci.length; i += 1) n = (n * 31 + kunci.charCodeAt(i)) % 100003;
  return n;
}

/**
 * Satu iklan untuk sebuah postingan; `null` bila belum ada iklan yang tampil.
 * Iklan kini berupa gambar, jadi iklan tanpa gambar tidak ikut dipilih.
 */
export function iklanUntuk(daftar: Iklan[], kunci: string): Iklan | null {
  const tampil = daftar.filter((i) => i.aktif && i.gambarUrl);
  if (tampil.length === 0) return null;
  return tampil[angkaKunci(kunci) % tampil.length];
}

/** Membuka tautan iklan: halaman situs (`#/...`) atau tautan luar. */
export function bukaTautanIklan(tautan: string | null): void {
  if (!tautan) return;
  if (tautan.startsWith("#")) {
    bukaHalaman(tautan);
    return;
  }
  window.open(tautan, "_blank", "noopener,noreferrer");
}
