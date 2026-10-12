import { useEffect, useState } from "react";
import {
  identitas as identitasStatis,
  pengurus as pengurusStatis,
  profil as profilStatis,
} from "../data/content";

/**
 * Data halaman profil (identitas lembaga, profil, susunan pengurus) yang dibaca
 * dari database. Nilai statis dipakai sebagai cadangan, sehingga situs tetap
 * tampil utuh bila layanan belum menjawab atau sesuatu belum diisi di database.
 */

type Jawaban = {
  identitas?: Record<string, string | null>;
  profil?: {
    gambarUrl?: string | null;
    gambarAlt?: string | null;
    ringkasan?: string[] | null;
    motto?: string | null;
    periode?: string | null;
    visi?: string | null;
    misi?: string[] | null;
  };
  pengurus?: { id: string; nama: string; jabatan: string; bidang?: string | null; periode?: string | null }[];
};

export type IdentitasGabungan = typeof identitasStatis & { logoAlt: string };

export type ProfilGabungan = {
  identitas: IdentitasGabungan;
  profil: typeof profilStatis;
  pengurus: typeof pengurusStatis;
  dariDatabase: boolean;
};

const awal: ProfilGabungan = {
  identitas: { ...identitasStatis, logoAlt: "Logo Persatuan Islam (PERSIS)" },
  profil: profilStatis,
  pengurus: pengurusStatis,
  dariDatabase: false,
};

let keadaan: ProfilGabungan = awal;
let janji: Promise<ProfilGabungan> | null = null;
const pendengar = new Set<(v: ProfilGabungan) => void>();

function pilih<T>(nilaiBaru: T | null | undefined, cadangan: T): T {
  if (nilaiBaru === null || nilaiBaru === undefined) return cadangan;
  if (typeof nilaiBaru === "string" && nilaiBaru.trim() === "") return cadangan;
  if (Array.isArray(nilaiBaru) && nilaiBaru.length === 0) return cadangan;
  return nilaiBaru;
}

function gabung(j: Jawaban): ProfilGabungan {
  if (!j || (!j.identitas && !j.profil && !j.pengurus)) return awal;
  const i = j.identitas ?? {};
  const p = j.profil ?? {};
  return {
    identitas: {
      logo: pilih(i.logo, identitasStatis.logo),
      logoAlt: pilih(i.logoAlt, "Logo Persatuan Islam (PERSIS)"),
      pimpinan: pilih(i.pimpinan, identitasStatis.pimpinan),
      nama: pilih(i.nama, identitasStatis.nama),
      namaLengkap: pilih(i.namaLengkap, identitasStatis.namaLengkap),
      wilayah: pilih(i.wilayah, identitasStatis.wilayah),
      wilayahLengkap: pilih(i.wilayahLengkap, identitasStatis.wilayahLengkap),
      alamat: pilih(i.alamat, identitasStatis.alamat),
      telepon: pilih(i.telepon, identitasStatis.telepon),
      whatsapp: pilih(i.whatsapp, identitasStatis.whatsapp),
      email: pilih(i.email, identitasStatis.email),
      jam: pilih(i.jam, identitasStatis.jam),
    },
    profil: {
      image: pilih(p.gambarUrl, profilStatis.image),
      imageAlt: pilih(p.gambarAlt, profilStatis.imageAlt),
      summary: pilih(p.ringkasan, profilStatis.summary),
      motto: pilih(p.motto, profilStatis.motto),
      periode: pilih(p.periode, profilStatis.periode),
      visi: pilih(p.visi, profilStatis.visi),
      misi: pilih(p.misi, profilStatis.misi),
    },
    pengurus: j.pengurus && j.pengurus.length > 0 ? (j.pengurus as typeof pengurusStatis) : pengurusStatis,
    dariDatabase: true,
  };
}

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

/** Ambil ulang data profil dari layanan. */
export function segarkanProfil(): Promise<ProfilGabungan> {
  janji = fetch("/api/profil", { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Layanan menjawab ${r.status}`))))
    .then((j: Jawaban) => {
      keadaan = gabung(j);
      kabari();
      return keadaan;
    })
    .catch(() => keadaan);
  return janji;
}

export function useProfil(): ProfilGabungan {
  const [data, setData] = useState<ProfilGabungan>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    void segarkanProfil();
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}

export { identitasStatis, profilStatis, pengurusStatis };
