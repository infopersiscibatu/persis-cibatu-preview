import { useEffect, useState } from "react";
import { gambar } from "../data/content";
import { kontakUnit } from "../data/content";
import { biaya as biayaStatis, gelombang as gelombangStatis, halamanSpmb, waAdmin } from "../data/spmb";

/**
 * Data halaman SPMB (teks, gambar, gelombang, biaya, pengaturan formulir, dan layanan
 * informasi) dari database, dengan data bawaan sebagai cadangan.
 */

export type GelombangTampil = {
  id: string;
  nama: string;
  periode: string;
  kuota: string;
  sisa: string;
  status: string;
};

export type BiayaTampil = { id: string; label: string; nilai: string };

export type LayananTampil = {
  id: string;
  nama: string;
  keterangan: string;
  telepon: string;
  whatsapp: string;
  jam: string;
  aktif: boolean;
};

export type SifatIsian = { tampil: boolean; wajib: boolean };

export type FormulirTampil = {
  aktif: boolean;
  judul: string;
  tombol: string;
  waAdmin: string;
  waNama: string;
  pesanPembuka: string;
  judulSukses: string;
  statusSukses: string;
  pesanTutup: string;
  isian: Record<string, SifatIsian>;
};

export type SpmbGabungan = {
  halaman: { judul: string; pengantar: string; catatan: string; waAdmin: string };
  gambar: { url: string; alt: string };
  formulir: FormulirTampil;
  gelombang: GelombangTampil[];
  biaya: BiayaTampil[];
  layanan: LayananTampil[];
  dariDatabase: boolean;
};

/** Isian tambahan yang bisa dinyalakan dari panel admin. */
/** Kiriman pendaftaran dari formulir SPMB ke server. */
export type KirimanPendaftaran = {
  nama: string;
  jenjangSlug: string;
  unitId: string;
  wali: string;
  wa: string;
  alamat?: string;
  asalSekolah?: string;
  tempatLahir?: string;
  email?: string;
  /** Jurusan (program) yang dipilih calon peserta didik, bila jenjangnya punya program. */
  program?: string;
};

/**
 * Kirim pendaftaran ke server. Pendaftar masuk dengan status "baru" pada sekolah
 * yang dituju, lalu diverifikasi petugas sekolah dari halaman Admin SPMB.
 */
export async function kirimPendaftaran(kiriman: KirimanPendaftaran) {
  const jawab = await fetch("/api/spmb/daftar", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(kiriman),
  });
  const isi = (await jawab.json().catch(() => null)) as
    | { ok?: boolean; pesan?: string; nomor?: string; unit?: string }
    | null;
  if (!jawab.ok || !isi?.ok) {
    throw new Error(isi?.pesan ?? "Pendaftaran belum bisa dikirim. Coba lagi sebentar lagi.");
  }
  return { nomor: isi.nomor ?? "", unit: isi.unit ?? "" };
}

export const ISIAN_TAMBAHAN = [
  { kunci: "alamat", label: "Alamat tempat tinggal" },
  { kunci: "asal_sekolah", label: "Asal sekolah / madrasah" },
  { kunci: "tempat_lahir", label: "Tempat & tanggal lahir" },
  { kunci: "email", label: "Surel (email)" },
] as const;

export const KETERANGAN_ISIAN: Record<string, string> = {
  alamat: "Alamat lengkap calon peserta didik.",
  asal_sekolah: "Sekolah atau madrasah asal sebelum masuk.",
  tempat_lahir: "Tempat dan tanggal lahir calon peserta didik.",
  email: "Surel untuk surat pemberitahuan panitia.",
};

const isianBawaan: Record<string, SifatIsian> = {
  alamat: { tampil: false, wajib: false },
  asal_sekolah: { tampil: false, wajib: false },
  tempat_lahir: { tampil: false, wajib: false },
  email: { tampil: false, wajib: false },
};

const formulirBawaan: FormulirTampil = {
  aktif: true,
  judul: "Formulir Pendaftaran",
  tombol: "Kirim Pendaftaran",
  waAdmin: waAdmin,
  waNama: "Panitia SPMB",
  pesanPembuka: "Assalamu'alaikum, saya ingin mendaftar SPMB PC PERSIS Cibatu.",
  judulSukses: "Pendaftaran Terkirim",
  statusSukses:
    "Isian pendaftaran Anda sudah lengkap dan siap dicatat panitia SPMB. Teruskan lewat WhatsApp admin agar segera diverifikasi.",
  pesanTutup:
    "Formulir pendaftaran daring sedang ditutup sementara. Silakan menghubungi sekretariat pada jam layanan untuk mendaftar.",
  isian: isianBawaan,
};

type Jawaban = {
  halaman?: { judul?: string | null; pengantar?: string | null; catatan?: string | null; waAdmin?: string | null };
  gambar?: { url?: string | null; alt?: string | null };
  formulir?: Partial<FormulirTampil> & { isian?: Record<string, SifatIsian> | null };
  gelombang?: { id: string; nama: string; periode?: string | null; kuota?: string | null; sisa?: string | null; status?: string | null; aktif?: boolean | null }[];
  biaya?: { id: string; label: string; nilai?: string | null; aktif?: boolean | null }[];
  layanan?: {
    id: string;
    nama: string;
    keterangan?: string | null;
    telepon?: string | null;
    whatsapp?: string | null;
    jam?: string | null;
    aktif?: boolean | null;
  }[];
};

function teks(nilai: string | null | undefined, cadangan: string) {
  if (nilai === null || nilai === undefined) return cadangan;
  const t = String(nilai).trim();
  return t === "" ? cadangan : t;
}

function dariStatis(): SpmbGabungan {
  return {
    halaman: {
      judul: halamanSpmb.judul,
      pengantar: halamanSpmb.pengantar,
      catatan: halamanSpmb.catatan,
      waAdmin: waAdmin,
    },
    gambar: { url: gambar.ujian, alt: "Suasana pendaftaran murid dan mahasiswa baru" },
    formulir: formulirBawaan,
    gelombang: gelombangStatis.map((g) => ({
      id: g.id,
      nama: g.nama,
      periode: g.periode,
      kuota: g.kuota,
      sisa: g.sisa,
      status: g.status,
    })),
    biaya: biayaStatis.map((b) => ({ id: b.id, label: b.label, nilai: b.nilai })),
    layanan: kontakUnit.map((l) => ({
      id: l.id,
      nama: l.nama,
      keterangan: l.keterangan ?? "",
      telepon: l.telepon ?? "",
      whatsapp: l.whatsapp ?? "",
      jam: l.jam ?? "",
      aktif: true,
    })),
    dariDatabase: false,
  };
}

function gabung(j: Jawaban | null): SpmbGabungan {
  const bawaan = dariStatis();
  if (!j) return bawaan;

  const h = j.halaman ?? {};
  const g = j.gambar ?? {};
  const f = j.formulir ?? {};
  const waHalaman = teks(h.waAdmin, bawaan.halaman.waAdmin);

  return {
    halaman: {
      judul: teks(h.judul, bawaan.halaman.judul),
      pengantar: teks(h.pengantar, bawaan.halaman.pengantar),
      catatan: teks(h.catatan, bawaan.halaman.catatan),
      waAdmin: waHalaman,
    },
    gambar: { url: teks(g.url, bawaan.gambar.url), alt: teks(g.alt, bawaan.gambar.alt) },
    formulir: {
      aktif: f.aktif !== false,
      judul: teks(f.judul, bawaan.formulir.judul),
      tombol: teks(f.tombol, bawaan.formulir.tombol),
      /* Nomor WhatsApp formulir memakai nomor halaman bila belum diatur sendiri. */
      waAdmin: teks(f.waAdmin, waHalaman),
      waNama: teks(f.waNama, bawaan.formulir.waNama),
      pesanPembuka: teks(f.pesanPembuka, bawaan.formulir.pesanPembuka),
      judulSukses: teks(f.judulSukses, bawaan.formulir.judulSukses),
      statusSukses: teks(f.statusSukses, bawaan.formulir.statusSukses),
      pesanTutup: teks(f.pesanTutup, bawaan.formulir.pesanTutup),
      isian: {
        ...isianBawaan,
        ...Object.fromEntries(
          Object.entries(f.isian ?? {}).map(([kunci, nilai]) => [
            kunci,
            { tampil: nilai?.tampil !== false, wajib: !!nilai?.wajib },
          ]),
        ),
      },
    },
    gelombang:
      j.gelombang && j.gelombang.length > 0
        ? j.gelombang.map((x) => ({
            id: x.id,
            nama: x.nama,
            periode: x.periode ?? "",
            kuota: x.kuota ?? "",
            sisa: x.sisa ?? "",
            status: x.status ?? "Dibuka",
          }))
        : bawaan.gelombang,
    biaya:
      j.biaya && j.biaya.length > 0
        ? j.biaya.map((x) => ({ id: x.id, label: x.label, nilai: x.nilai ?? "" }))
        : bawaan.biaya,
    layanan:
      j.layanan && j.layanan.length > 0
        ? j.layanan.map((x) => ({
            id: x.id,
            nama: x.nama,
            keterangan: x.keterangan ?? "",
            telepon: x.telepon ?? "",
            whatsapp: x.whatsapp ?? "",
            jam: x.jam ?? "",
            aktif: x.aktif !== false,
          }))
        : bawaan.layanan,
    dariDatabase: true,
  };
}

let keadaan: SpmbGabungan = gabung(null);
const pendengar = new Set<(v: SpmbGabungan) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

export function segarkanSpmb(): Promise<SpmbGabungan> {
  return fetch("/api/spmb", { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Layanan menjawab ${r.status}`))))
    .then((j: Jawaban) => {
      keadaan = gabung(j);
      kabari();
      return keadaan;
    })
    .catch(() => keadaan);
}

export function useSpmb(): SpmbGabungan {
  const [data, setData] = useState<SpmbGabungan>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    void segarkanSpmb();
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}

/** Nomor WhatsApp yang siap dipakai pada tautan wa.me. */
export function tautanWhatsapp(nomor: string) {
  return nomor.replace(/\D/g, "").replace(/^0/, "62");
}

/** Nomor WhatsApp dengan spasi agar mudah dibaca. */
export function nomorTerbaca(nomor: string) {
  const angka = nomor.replace(/\D/g, "");
  return angka.length >= 11 ? angka.replace(/(\d{4})(\d{4})(\d+)/, "$1 $2 $3") : nomor;
}
