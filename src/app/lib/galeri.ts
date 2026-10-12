import { useEffect, useState } from "react";
import { gambar } from "../data/content";
import { albumGaleri, galeri as galeriStatis } from "../data/galeri";
import { hariKe, tanggalBulanSingkat } from "../lib/format";

/**
 * Data halaman Galeri dari database (teks, gambar utama, kategori, dan foto)
 * dengan data bawaan situs sebagai cadangan.
 */

export type KategoriGaleri = {
  id: string;
  nama: string;
  keterangan: string;
  aktif: boolean;
  jumlah: number;
};

export type FotoGaleri = {
  id: string;
  kategoriId: string;
  kategori: string;
  judul: string;
  gambar: string;
  /** Tanggal ISO (YYYY-MM-DD). */
  tanggal: string;
  tanggalTeks: string;
  aktif: boolean;
};

export type GaleriGabungan = {
  halaman: { judul: string; pengantar: string };
  gambar: { url: string; alt: string };
  kategori: KategoriGaleri[];
  foto: FotoGaleri[];
  dariDatabase: boolean;
};

export const SEMUA_KATEGORI = "Semua";

const slug = (teks: string) =>
  teks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function dariStatis(): GaleriGabungan {
  const kategori: KategoriGaleri[] = albumGaleri
    .filter((a) => a !== SEMUA_KATEGORI)
    .map((a) => ({
      id: `al-${slug(a)}`,
      nama: a,
      keterangan: "",
      aktif: true,
      jumlah: galeriStatis.filter((f) => f.album === a).length,
    }));

  return {
    halaman: { judul: "Galeri", pengantar: "" },
    gambar: { url: gambar.kelas1, alt: "Dokumentasi kegiatan pendidikan PC PERSIS Cibatu" },
    kategori,
    foto: galeriStatis.map((f) => {
      const tanggal = hariKe(f.hari);
      return {
        id: f.id,
        kategoriId: `al-${slug(f.album)}`,
        kategori: f.album,
        judul: f.judul,
        gambar: f.gambar,
        tanggal,
        tanggalTeks: tanggalBulanSingkat(tanggal),
        aktif: true,
      };
    }),
    dariDatabase: false,
  };
}

type Jawaban = {
  halaman?: { judul?: string | null; pengantar?: string | null };
  gambar?: { url?: string | null; alt?: string | null };
  kategori?: { id: string; nama: string; keterangan?: string | null; aktif?: boolean | null; jumlah?: number | null }[];
  foto?: {
    id: string;
    albumId?: string | null;
    kategori?: string | null;
    judul: string;
    gambarUrl?: string | null;
    tanggal?: string | null;
    aktif?: boolean | null;
  }[];
};

function teks(nilai: string | null | undefined, cadangan: string) {
  if (nilai === null || nilai === undefined) return cadangan;
  const t = String(nilai).trim();
  return t === "" ? cadangan : t;
}

function tanggalTerbaca(iso: string | null | undefined) {
  if (!iso) return "";
  return tanggalBulanSingkat(iso);
}

function gabung(j: Jawaban | null): GaleriGabungan {
  const bawaan = dariStatis();
  if (!j) return bawaan;

  const h = j.halaman ?? {};
  const g = j.gambar ?? {};
  const kategori: KategoriGaleri[] =
    j.kategori && j.kategori.length > 0
      ? j.kategori.map((k) => ({
          id: k.id,
          nama: k.nama,
          keterangan: k.keterangan ?? "",
          aktif: k.aktif !== false,
          jumlah: Number(k.jumlah ?? 0),
        }))
      : bawaan.kategori;

  const namaKategori = new Map(kategori.map((k) => [k.id, k.nama]));

  const foto: FotoGaleri[] =
    j.foto && j.foto.length > 0
      ? j.foto.map((f) => ({
          id: f.id,
          kategoriId: f.albumId ?? "",
          kategori: f.kategori ?? namaKategori.get(f.albumId ?? "") ?? "Tanpa kategori",
          judul: f.judul,
          gambar: f.gambarUrl ?? "",
          tanggal: f.tanggal ?? "",
          tanggalTeks: tanggalTerbaca(f.tanggal),
          aktif: f.aktif !== false,
        }))
      : bawaan.foto;

  return {
    halaman: {
      judul: teks(h.judul, bawaan.halaman.judul),
      pengantar: h.pengantar === null || h.pengantar === undefined ? "" : String(h.pengantar).trim(),
    },
    gambar: { url: teks(g.url, bawaan.gambar.url), alt: teks(g.alt, bawaan.gambar.alt) },
    kategori,
    foto,
    dariDatabase: true,
  };
}

let keadaan: GaleriGabungan = gabung(null);
const pendengar = new Set<(v: GaleriGabungan) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

export function segarkanGaleri(): Promise<GaleriGabungan> {
  return fetch("/api/galeri", { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Layanan menjawab ${r.status}`))))
    .then((j: Jawaban) => {
      keadaan = gabung(j);
      kabari();
      return keadaan;
    })
    .catch(() => keadaan);
}

export function useGaleri(): GaleriGabungan {
  const [data, setData] = useState<GaleriGabungan>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    void segarkanGaleri();
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}

/** Foto yang tampil di situs: hanya yang aktif, disaring per kategori. */
export function fotoTampil(data: GaleriGabungan, kategoriId: string): FotoGaleri[] {
  const aktif = data.foto.filter((f) => f.aktif);
  return kategoriId === SEMUA_KATEGORI ? aktif : aktif.filter((f) => f.kategoriId === kategoriId);
}
