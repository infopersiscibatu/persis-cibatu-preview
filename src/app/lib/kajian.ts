import { useEffect, useState } from "react";
import {
  gambar,
  identitas,
  kajian as kajianStatis,
  kajianRutin as kajianRutinStatis,
  type Kajian,
  type KajianRutin,
} from "../data/content";

/**
 * Data halaman Kajian dari database (teks, gambar, jadwal kajian, kajian rutin)
 * dengan data bawaan situs sebagai cadangan. Bentuknya sengaja sama dengan tipe
 * bawaan supaya halaman situs tidak perlu banyak berubah.
 */

export type KajianTampil = Kajian & {
  /** Belum terbit = masih draf, tidak tampil di situs. */
  terbit: boolean;
};

export type KajianRutinTampil = KajianRutin & { aktif: boolean };

export type KajianGabungan = {
  halaman: { judul: string; pengantar: string };
  gambar: { url: string; alt: string };
  kajian: KajianTampil[];
  rutin: KajianRutinTampil[];
  dariDatabase: boolean;
};

const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const HARI_PANJANG = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** Teks hari dari tanggal, contoh: "Selasa, 6 Okt 2026". */
export function hariDariTanggal(iso: string) {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!cocok) return "";
  const d = new Date(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3]));
  return `${HARI_PANJANG[d.getDay()]}, ${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}`;
}

const PENGANTAR_BAWAAN = `Majelis ilmu PC PERSIS Cibatu terbuka untuk seluruh kaum muslimin. Kajian rutin dilaksanakan di ${
  identitas.alamat.split(",")[0]
} dan aula madrasah bersama para ustadz serta ustadzah, dengan kajian kitab, tafsir, fikih, dan pembinaan keluarga.`;

function dariStatis(): KajianGabungan {
  return {
    halaman: { judul: "Kajian", pengantar: PENGANTAR_BAWAAN },
    gambar: { url: gambar.masjid, alt: "Suasana masjid tempat kajian PC PERSIS Cibatu" },
    kajian: kajianStatis.map((k) => ({ ...k, terbit: true })),
    rutin: kajianRutinStatis.map((k) => ({ ...k, aktif: true })),
    dariDatabase: false,
  };
}

type Jawaban = {
  halaman?: { judul?: string | null; pengantar?: string | null };
  gambar?: { url?: string | null; alt?: string | null };
  kajian?: {
    id: string;
    judul: string;
    ustadz?: string | null;
    hari?: string | null;
    tanggal?: string | null;
    waktu?: string | null;
    tempat?: string | null;
    kitab?: string | null;
    langsung?: boolean | null;
    terbit?: boolean | null;
  }[];
  rutin?: {
    id: string;
    hari?: string | null;
    waktu?: string | null;
    judul: string;
    ustadz?: string | null;
    tempat?: string | null;
    peserta?: string | null;
    aktif?: boolean | null;
  }[];
};

const teks = (nilai: string | null | undefined, cadangan = "") => {
  if (nilai === null || nilai === undefined) return cadangan;
  const t = String(nilai).trim();
  return t === "" ? cadangan : t;
};

function gabung(j: Jawaban | null): KajianGabungan {
  const bawaan = dariStatis();
  if (!j) return bawaan;

  const h = j.halaman ?? {};
  const g = j.gambar ?? {};

  const kajian: KajianTampil[] =
    j.kajian && j.kajian.length > 0
      ? j.kajian.map((k) => ({
          id: k.id,
          title: k.judul,
          ustadz: teks(k.ustadz, "Belum ditentukan"),
          day: teks(k.hari, hariDariTanggal(k.tanggal ?? "")),
          date: k.tanggal ?? "",
          time: teks(k.waktu, "—"),
          place: teks(k.tempat, "—"),
          kitab: teks(k.kitab, ""),
          live: !!k.langsung,
          terbit: k.terbit !== false,
        }))
      : bawaan.kajian;

  const rutin: KajianRutinTampil[] =
    j.rutin && j.rutin.length > 0
      ? j.rutin.map((r) => ({
          id: r.id,
          hari: teks(r.hari, "-"),
          waktu: teks(r.waktu, "—"),
          judul: r.judul,
          ustadz: teks(r.ustadz, ""),
          tempat: teks(r.tempat, ""),
          peserta: teks(r.peserta, ""),
          aktif: r.aktif !== false,
        }))
      : bawaan.rutin;

  return {
    halaman: { judul: teks(h.judul, bawaan.halaman.judul), pengantar: teks(h.pengantar, PENGANTAR_BAWAAN) },
    gambar: { url: teks(g.url, bawaan.gambar.url), alt: teks(g.alt, bawaan.gambar.alt) },
    kajian,
    rutin,
    dariDatabase: true,
  };
}

let keadaan: KajianGabungan = gabung(null);
const pendengar = new Set<(v: KajianGabungan) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

export function segarkanKajian(): Promise<KajianGabungan> {
  return fetch("/api/kajian", { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Layanan menjawab ${r.status}`))))
    .then((j: Jawaban) => {
      keadaan = gabung(j);
      kabari();
      return keadaan;
    })
    .catch(() => keadaan);
}

export function useKajian(): KajianGabungan {
  const [data, setData] = useState<KajianGabungan>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    void segarkanKajian();
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}

/* ------------------------------ penyaring data ------------------------------ */

/** Jadwal yang boleh tampil di situs (sudah terbit), urut dari yang paling dekat. */
export const kajianTerdekat = (data: KajianGabungan) =>
  data.kajian.filter((k) => k.terbit).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

/** Kajian rutin pekanan yang aktif. */
export const kajianRutinAktif = (data: KajianGabungan) => data.rutin.filter((k) => k.aktif);
