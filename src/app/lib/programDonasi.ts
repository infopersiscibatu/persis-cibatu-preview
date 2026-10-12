import { useEffect, useState } from "react";
import {
  metodeDonasi as metodeBawaan,
  programDonasi as programBawaan,
  rekeningDonasi as rekeningBawaan,
  type ProgramDonasi,
} from "../data/donasi";

/**
 * Katalog program donasi untuk situs.
 *
 * Datanya dibaca dari server, sehingga program, gambar, rincian penggunaan dana,
 * dan riwayat laporan yang diubah petugas di halaman Admin ZIS langsung tampil di
 * situs. Sebelum jawaban server tiba (atau bila layanan sedang tidak bisa
 * dihubungi), data contoh dipakai lebih dahulu supaya halaman tetap terisi.
 */

export type CatatanRiwayatApi = {
  id: string;
  tanggal: string;
  judul: string;
  keterangan: string;
  /** "Laporan" atau "Penyaluran". */
  jenis: string;
  nominal: number;
  /** Bagian dana terkumpul (hanya dipakai data contoh). */
  porsi?: number;
};

export type DonaturApi = { id: string; nama: string; jumlah: number; metode: string; waktu: string };

export type MetodeBayar = {
  id: string;
  nama: string;
  keterangan: string;
  langkah: string[];
  /** Gambar kanal pembayaran (kode QRIS) yang tampil di popup donasi. */
  gambar?: string;
};

export type Rekening = { id: string; bank: string; nomor: string; atasNama: string };

export type ProgramLengkap = ProgramDonasi & {
  riwayat?: CatatanRiwayatApi[];
  donaturTampil?: DonaturApi[];
  /** Id metode pembayaran yang berlaku untuk program ini. */
  metode?: string[];
};

export type KatalogDonasi = {
  program: ProgramLengkap[];
  metode: MetodeBayar[];
  rekening: Rekening[];
};

let simpanan: KatalogDonasi | null = null;
let janji: Promise<KatalogDonasi> | null = null;

const katalogBawaan: KatalogDonasi = { program: programBawaan, metode: metodeBawaan, rekening: rekeningBawaan };

/** Ambil katalog sekali saja; pemanggilan berikutnya memakai hasil yang sama. */
export function muatProgramDonasi(): Promise<KatalogDonasi> {
  if (simpanan) return Promise.resolve(simpanan);
  if (!janji) {
    janji = fetch("/api/program-donasi", { headers: { Accept: "application/json" } })
      .then(async (jawab) => {
        const isi = (await jawab.json().catch(() => ({}))) as
          | ({ ok?: boolean } & Partial<KatalogDonasi>)
          | undefined;
        if (!jawab.ok || !isi?.ok || !Array.isArray(isi.program) || isi.program.length === 0) {
          throw new Error("Katalog program donasi belum tersedia.");
        }
        simpanan = {
          program: isi.program,
          metode: isi.metode && isi.metode.length > 0 ? isi.metode : metodeBawaan,
          rekening: isi.rekening && isi.rekening.length > 0 ? isi.rekening : rekeningBawaan,
        };
        return simpanan;
      })
      .finally(() => {
        janji = null;
      });
  }
  return janji;
}

/** Katalog program donasi yang siap dipakai halaman situs. */
export function useKatalogDonasi() {
  const [katalog, setKatalog] = useState<KatalogDonasi>(simpanan ?? katalogBawaan);
  const [siap, setSiap] = useState(simpanan !== null);

  useEffect(() => {
    if (simpanan) return;
    let batal = false;
    void muatProgramDonasi()
      .then((hasil) => {
        if (!batal) {
          setKatalog(hasil);
          setSiap(true);
        }
      })
      .catch(() => {
        /* data contoh tetap dipakai bila server belum menjawab */
      });
    return () => {
      batal = true;
    };
  }, []);

  /** Metode pembayaran yang berlaku untuk satu program. */
  const metodeProgram = (p: ProgramLengkap | undefined) => {
    if (!p || !p.metode || p.metode.length === 0) return katalog.metode;
    const dipilih = katalog.metode.filter((m) => p.metode?.includes(m.id));
    return dipilih.length > 0 ? dipilih : katalog.metode;
  };

  return { daftar: katalog.program, metode: katalog.metode, rekening: katalog.rekening, metodeProgram, siap };
}

/** Program yang paling mendesak: batas waktunya paling dekat lebih dahulu. */
export const urutMendesak = (daftar: ProgramLengkap[]) =>
  [...daftar].sort((a, b) => String(a.batas).localeCompare(String(b.batas)));

/** Kategori yang benar-benar dipakai program, untuk pilihan saring di situs. */
export const kategoriDipakai = (daftar: ProgramLengkap[]) => [
  "Semua",
  ...Array.from(new Set(daftar.map((p) => p.kategori).filter(Boolean))),
];
