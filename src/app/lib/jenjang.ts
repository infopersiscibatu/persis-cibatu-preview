import { useEffect, useState } from "react";
import {
  halamanJenjang as halamanStatis,
  jenjang as jenjangStatis,
  jurusan as jurusanStatis,
  istilahSekolah,
  unit as unitStatis,
} from "../data/pendidikan";

/**
 * Data halaman Jenjang Pendidikan dari database, dengan data bawaan sebagai cadangan.
 */

export type IstilahJenjang = typeof istilahSekolah;

export type JenjangTampil = {
  id: string;
  slug: string;
  short: string;
  nama: string;
  tagline: string;
  rentang: string;
  pimpinan: string;
  jumlah: string;
  satuan: string;
  lokasi: string;
  tone: string;
  gambar: string;
  intro: string;
  fasilitas: string[];
  istilah: IstilahJenjang;
  hitungJenjang: boolean;
  jumlahUnit: number;
};

/** Unit pendidikan (sekolah/madrasah/kampus) sebagaimana tampil di situs. */
export type UnitTampil = {
  id: string;
  slug: string;
  jenjangSlug: string;
  nomor: string;
  nama: string;
  daerah: string;
  alamat: string;
  pimpinan: string;
  siswa: number;
  rombel: number;
  guru: number;
  staf: number;
  akreditasi: string;
  status: string;
  kontak: string;
  email: string;
  npsn: string;
  berdiri: string;
  jam: string;
  /** Gambar yang tampil (gambar khusus bila ada, kalau tidak gambar bawaan). */
  gambar: string;
  /** Gambar yang diunggah sendiri lewat panel admin; kosong bila belum ada. */
  gambarKhusus: string;
  alumni: number;
  jurusan: string[];
  ekstra: string[];
  fasilitas: string[];
  aktif: boolean;
};

/** Program jurusan pada sebuah jenjang. */
export type JurusanTampil = {
  id: string;
  slug: string;
  jenjangSlug: string;
  short: string;
  nama: string;
  intro: string;
  fokus: string[];
  ukt: string;
  gambar: string;
  aktif: boolean;
};

export type HalamanJenjangTampil = {
  judul: string;
  pengantar: string;
  gambar: string;
  gambarAlt: string;
};

export type JenjangGabungan = {
  halaman: HalamanJenjangTampil;
  jenjang: JenjangTampil[];
  unit: UnitTampil[];
  jurusan: JurusanTampil[];
  dariDatabase: boolean;
};

type Jawaban = {
  halaman?: { judul?: string | null; pengantar?: string | null; gambarUrl?: string | null; gambarAlt?: string | null };
  jenjang?: {
    id: string;
    slug: string;
    singkatan?: string | null;
    nama: string;
    tagline?: string | null;
    rentang?: string | null;
    jumlah?: string | null;
    satuan?: string | null;
    lokasi?: string | null;
    tone?: string | null;
    gambarUrl?: string | null;
    hitungJenjang?: boolean | null;
    jumlahUnit?: number | null;
    jumlahPeserta?: number | null;
    istilah?: IstilahJenjang | null;
  }[];
  unit?: {
    id: string;
    slug: string;
    jenjangSlug?: string | null;
    nomor?: string | null;
    nama: string;
    daerah?: string | null;
    alamat?: string | null;
    pimpinan?: string | null;
    jumlahPeserta?: number | null;
    rombel?: number | null;
    guru?: number | null;
    staf?: number | null;
    akreditasi?: string | null;
    status?: string | null;
    kontak?: string | null;
    email?: string | null;
    npsn?: string | null;
    berdiri?: number | null;
    jam?: string | null;
    gambarUrl?: string | null;
    jumlahAlumni?: number | null;
    jurusan?: string[] | null;
    ekstrakurikuler?: string[] | null;
    fasilitas?: string[] | null;
    aktif?: boolean | null;
  }[];
  jurusan?: {
    id: string;
    slug: string;
    jenjangSlug?: string | null;
    singkatan?: string | null;
    nama: string;
    intro?: string | null;
    fokus?: string[] | null;
    ukt?: string | null;
    gambarUrl?: string | null;
    aktif?: boolean | null;
  }[];
};

/** Data bawaan (dari berkas situs) sebagai bentuk yang seragam. */
function dariStatis(): JenjangTampil[] {
  return (jenjangStatis as readonly Record<string, unknown>[]).map((j) => ({
    id: String(j.id ?? ""),
    slug: String(j.slug ?? ""),
    short: String(j.short ?? ""),
    nama: String(j.nama ?? ""),
    tagline: String(j.tagline ?? ""),
    rentang: String(j.rentang ?? ""),
    pimpinan: String(j.pimpinan ?? ""),
    jumlah: String(j.jumlah ?? "0"),
    satuan: String(j.satuan ?? "siswa"),
    lokasi: String(j.lokasi ?? ""),
    tone: String(j.tone ?? "mint"),
    gambar: String(j.gambar ?? ""),
    intro: String(j.intro ?? ""),
    fasilitas: Array.isArray(j.fasilitas) ? (j.fasilitas as string[]) : [],
    istilah: (j.istilah as IstilahJenjang) ?? istilahSekolah,
    hitungJenjang: (j as { hitungJenjang?: boolean }).hitungJenjang !== false,
    jumlahUnit: 0,
  }));
}

function dariStatisUnit(): UnitTampil[] {
  return (unitStatis as readonly Record<string, unknown>[]).map((u) => ({
    id: String(u.id ?? ""),
    slug: String(u.slug ?? ""),
    jenjangSlug: String(u.jenjang ?? ""),
    nomor: String(u.nomor ?? ""),
    nama: String(u.nama ?? ""),
    daerah: String(u.daerah ?? ""),
    alamat: String(u.alamat ?? ""),
    pimpinan: String(u.pimpinan ?? ""),
    siswa: Number(u.siswa ?? 0),
    rombel: Number(u.rombel ?? 0),
    guru: Number(u.guru ?? 0),
    staf: 0,
    akreditasi: String(u.akreditasi ?? ""),
    status: "Swasta",
    kontak: String(u.kontak ?? ""),
    email: String(u.email ?? ""),
    npsn: String(u.npsn ?? ""),
    berdiri: String(u.berdiri ?? ""),
    jam: String(u.jam ?? ""),
    gambar: String(u.gambar ?? ""),
    gambarKhusus: "",
    alumni: 0,
    jurusan: Array.isArray(u.jurusan) ? (u.jurusan as string[]) : [],
    ekstra: Array.isArray(u.ekstra) ? (u.ekstra as string[]) : [],
    fasilitas: [],
    aktif: true,
  }));
}

function dariStatisJurusan(): JurusanTampil[] {
  return (jurusanStatis as readonly Record<string, unknown>[]).map((b) => ({
    id: String(b.id ?? ""),
    slug: String(b.slug ?? ""),
    jenjangSlug: String(b.jenjang ?? ""),
    short: String(b.singkat ?? ""),
    nama: String(b.nama ?? ""),
    intro: String(b.intro ?? ""),
    fokus: Array.isArray(b.fokus) ? (b.fokus as string[]) : [],
    ukt: String(b.ukt ?? ""),
    gambar: String(b.gambar ?? ""),
    aktif: true,
  }));
}

function teks(nilai: string | null | undefined, cadangan: string) {
  if (nilai === null || nilai === undefined) return cadangan;
  const t = String(nilai).trim();
  return t === "" ? cadangan : t;
}

function gabung(j: Jawaban | null): JenjangGabungan {
  const bawaan = dariStatis();
  const halamanBawaan = {
    judul: halamanStatis.judul,
    pengantar: halamanStatis.pengantar,
    gambar: String((jenjangStatis as readonly Record<string, unknown>[])[0]?.gambar ?? ""),
    gambarAlt: "Suasana kelas di lembaga pendidikan PC PERSIS Cibatu",
  };

  const unitBawaan = dariStatisUnit();
  const jurusanBawaan = dariStatisJurusan();

  if (!j) {
    return { halaman: halamanBawaan, jenjang: bawaan, unit: unitBawaan, jurusan: jurusanBawaan, dariDatabase: false };
  }

  const peta = new Map(bawaan.map((b) => [b.slug, b]));
  const daftar: JenjangTampil[] =
    j.jenjang && j.jenjang.length > 0
      ? j.jenjang.map((d) => {
          const s = peta.get(d.slug);
          const dasar = s ?? {
            ...bawaan[0],
            id: d.id,
            slug: d.slug,
            intro: "",
            fasilitas: [],
            tagline: "",
            rentang: "",
            pimpinan: "",
            gambar: "",
            istilah: istilahSekolah,
            jumlahUnit: 0,
          };
          return {
            ...dasar,
            id: d.id,
            slug: d.slug,
            short: teks(d.singkatan, dasar.short),
            nama: teks(d.nama, dasar.nama),
            tagline: teks(d.tagline, dasar.tagline),
            rentang: teks(d.rentang, dasar.rentang),
            /* Angka peserta didik mengikuti data siswa/mahasiswa bila tersedia. */
            jumlah: d.jumlahPeserta === null || d.jumlahPeserta === undefined
              ? teks(d.jumlah, dasar.jumlah)
              : String(d.jumlahPeserta),
            satuan: teks(d.satuan, dasar.satuan),
            lokasi: teks(d.lokasi, dasar.lokasi),
            tone: teks(d.tone, dasar.tone),
            gambar: teks(d.gambarUrl, dasar.gambar),
            /* Penyebutan dari server (menyesuaikan jenjang), cadangan dari data bawaan. */
            istilah: d.istilah ?? dasar.istilah,
            hitungJenjang: d.hitungJenjang !== false,
            jumlahUnit: Number(d.jumlahUnit ?? 0),
          };
        })
      : bawaan;

  const h = j.halaman ?? {};
  const unit = j.unit && j.unit.length > 0 ? j.unit.map((u) => gabungUnit(u)) : unitBawaan;
  const jurusan = j.jurusan && j.jurusan.length > 0 ? j.jurusan.map((p) => gabungJurusan(p)) : jurusanBawaan;

  return {
    halaman: {
      judul: teks(h.judul, halamanBawaan.judul),
      pengantar: teks(h.pengantar, halamanBawaan.pengantar),
      gambar: teks(h.gambarUrl, halamanBawaan.gambar),
      gambarAlt: teks(h.gambarAlt, halamanBawaan.gambarAlt),
    },
    jenjang: daftar,
    unit,
    jurusan,
    dariDatabase: true,
  };
}

/** Unit: gambar dan angka diambil dari data bawaan bila kolomnya kosong. */
function gabungUnit(u: NonNullable<Jawaban["unit"]>[number]): UnitTampil {
  const bawaan = dariStatisUnit().find((b) => b.slug === u.slug);
  const dasar = bawaan ?? dariStatisUnit()[0];
  return {
    id: u.id,
    slug: u.slug,
    jenjangSlug: teks(u.jenjangSlug, dasar.jenjangSlug),
    nomor: u.nomor ?? dasar.nomor,
    nama: u.nama,
    daerah: u.daerah ?? dasar.daerah,
    alamat: u.alamat ?? dasar.alamat,
    pimpinan: u.pimpinan ?? dasar.pimpinan,
    siswa: Number(u.jumlahPeserta ?? 0),
    rombel: Number(u.rombel ?? 0),
    guru: Number(u.guru ?? 0),
    staf: Number(u.staf ?? 0),
    akreditasi: teks(u.akreditasi, dasar.akreditasi),
    status: teks(u.status, "Swasta"),
    kontak: u.kontak ?? dasar.kontak,
    email: u.email ?? dasar.email,
    npsn: u.npsn ?? dasar.npsn,
    berdiri: u.berdiri ? String(u.berdiri) : dasar.berdiri,
    jam: u.jam ?? dasar.jam,
    gambar: teks(u.gambarUrl, fotoBawaanUnit(u.slug, u.jenjangSlug, dasar.gambar)),
    gambarKhusus: (u.gambarUrl ?? "").trim(),
    alumni: Number(u.jumlahAlumni ?? 0),
    jurusan: Array.isArray(u.jurusan) ? u.jurusan : [],
    ekstra: Array.isArray(u.ekstrakurikuler) && u.ekstrakurikuler.length > 0 ? u.ekstrakurikuler : dasar.ekstra,
    fasilitas: Array.isArray(u.fasilitas) ? u.fasilitas : [],
    aktif: u.aktif !== false,
  };
}

function gabungJurusan(p: NonNullable<Jawaban["jurusan"]>[number]): JurusanTampil {
  const dasar = dariStatisJurusan().find((b) => b.slug === p.slug) ?? dariStatisJurusan()[0];
  return {
    id: p.id,
    slug: p.slug,
    jenjangSlug: teks(p.jenjangSlug, dasar.jenjangSlug),
    short: teks(p.singkatan, dasar.short),
    nama: p.nama,
    intro: teks(p.intro, dasar.intro),
    fokus: Array.isArray(p.fokus) && p.fokus.length > 0 ? p.fokus : dasar.fokus,
    ukt: p.ukt ?? "",
    gambar: teks(p.gambarUrl, dasar.gambar),
    aktif: p.aktif !== false,
  };
}

/** Gambar bawaan sebuah unit: gambar unit bawaan, atau gambar jenjangnya. */
function fotoBawaanUnit(slug: string, jenjangSlug: string | null | undefined, cadangan: string): string {
  const unitBawaan = dariStatisUnit().find((u) => u.slug === slug);
  if (unitBawaan?.gambar) return unitBawaan.gambar;
  const jenjang = dariStatis().find((j) => j.slug === (jenjangSlug ?? ""));
  return jenjang?.gambar || cadangan;
}

/** Gambar bawaan sebuah jenjang (dipakai borang admin saat sekolah belum punya foto). */
export function fotoBawaanJenjang(jenjangSlug: string): string {
  return dariStatis().find((j) => j.slug === jenjangSlug)?.gambar ?? "";
}

/** Unit pada keadaan terakhir (dipakai penyusun alamat halaman, bukan hook). */
export function unitSaatIni(slug: string): UnitTampil | undefined {
  return keadaan.unit.find((u) => u.slug === slug);
}

/** Jenjang dari sebuah unit, dibaca dari data terakhir. */
export function jenjangDariUnit(slugUnit: string): JenjangTampil | undefined {
  const u = unitSaatIni(slugUnit);
  return u ? keadaan.jenjang.find((j) => j.slug === u.jenjangSlug) : undefined;
}

/** Daftar unit pada satu jenjang (berdasarkan slug jenjang). */
export function unitJenjangDari(unit: UnitTampil[], jenjangSlug: string): UnitTampil[] {
  return unit.filter((u) => u.jenjangSlug === jenjangSlug && u.aktif);
}

let keadaan: JenjangGabungan = gabung(null);
const pendengar = new Set<(v: JenjangGabungan) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

export function segarkanJenjang(): Promise<JenjangGabungan> {
  return fetch("/api/jenjang", { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Layanan menjawab ${r.status}`))))
    .then((j: Jawaban) => {
      keadaan = gabung(j);
      kabari();
      return keadaan;
    })
    .catch(() => keadaan);
}

export function useJenjang(): JenjangGabungan {
  const [data, setData] = useState<JenjangGabungan>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    void segarkanJenjang();
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}
