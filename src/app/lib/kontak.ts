import { useEffect, useState } from "react";
import { identitas as identitasStatis, gambar, topikKontak } from "../data/content";
import { waAdmin } from "../data/spmb";

/**
 * Data halaman Kontak dari database: teks halaman, gambar, alamat sekretariat,
 * formulir pesan, dan daftar topik pesan. Data bawaan situs dipakai sebagai cadangan
 * bila layanan belum tersedia.
 */

export type TopikKontak = { id: string; nama: string; aktif: boolean; urutan: number | null };

export type KontakGabungan = {
  halaman: { judul: string; subjudul: string; pengantar: string; gambarUrl: string; gambarAlt: string };
  alamat: { nama: string; alamat: string; jam: string; catatanJam: string; peta: string };
  formulir: {
    judul: string;
    pengantar: string;
    waAdmin: string;
    judulSukses: string;
    statusSukses: string;
    catatanSukses: string;
  };
  topik: TopikKontak[];
  dariDatabase: boolean;
};

const PENGANTAR_BAWAAN =
  "Sekretariat PC PERSIS Cibatu melayani pertanyaan seputar pendaftaran, jenjang pendidikan, layanan wali santri, hingga kerja sama dan donasi. Silakan hubungi kami pada jam layanan, atau kirimkan pesan melalui formulir di bawah ini agar langsung diteruskan ke petugas yang tepat.";

const CATATAN_JAM_BAWAAN =
  "Di luar jam tersebut, pesan WhatsApp tetap kami balas pada hari kerja berikutnya.";

const PETA_BAWAAN = "Jl. Raya Cibatu No. 12, Kec. Cibatu, Kab. Garut";

const STATUS_SUKSES_BAWAAN =
  "Pesan Anda sudah masuk ke pengurus PC PERSIS Cibatu. Bila ingin ditindaklanjuti lebih cepat, teruskan isian ini ke WhatsApp admin.";

const CATATAN_SUKSES_BAWAAN =
  "Pesan belum tersimpan di server pengurus. Silakan teruskan lewat WhatsApp admin agar sampai ke petugas yang tepat.";

function dariStatis(): KontakGabungan {
  return {
    halaman: {
      judul: "Kontak",
      subjudul: "Sekretariat & Layanan",
      pengantar: PENGANTAR_BAWAAN,
      gambarUrl: gambar.masjidJabar,
      gambarAlt: "Gedung sekretariat PC PERSIS Cibatu",
    },
    alamat: {
      nama: identitasStatis.namaLengkap,
      alamat: identitasStatis.alamat,
      jam: identitasStatis.jam,
      catatanJam: CATATAN_JAM_BAWAAN,
      peta: PETA_BAWAAN,
    },
    formulir: {
      judul: "Formulir Pertanyaan",
      pengantar: "",
      waAdmin,
      judulSukses: "Pesan Terkirim",
      statusSukses: STATUS_SUKSES_BAWAAN,
      catatanSukses: CATATAN_SUKSES_BAWAAN,
    },
    topik: topikKontak.map((nama, i) => ({ id: `tp-${i + 1}`, nama, aktif: true, urutan: i + 1 })),
    dariDatabase: false,
  };
}

type Jawaban = {
  halaman?: {
    judul?: string | null;
    subjudul?: string | null;
    pengantar?: string | null;
    gambar_url?: string | null;
    gambar_alt?: string | null;
  };
  alamat?: {
    nama?: string | null;
    alamat?: string | null;
    jam?: string | null;
    catatanJam?: string | null;
    peta?: string | null;
  };
  formulir?: {
    judul?: string | null;
    pengantar?: string | null;
    waAdmin?: string | null;
    judulSukses?: string | null;
    statusSukses?: string | null;
    catatanSukses?: string | null;
  };
  topik?: { id: string; nama: string; aktif?: boolean | null; urutan?: number | null }[];
};

const teks = (nilai: string | null | undefined, cadangan: string) => {
  if (nilai === null || nilai === undefined) return cadangan;
  const t = String(nilai).trim();
  return t === "" ? cadangan : t;
};

/** Sama seperti teks(), tetapi boleh benar-benar kosong (mis. kalimat pengantar formulir). */
const teksBolehKosong = (nilai: string | null | undefined, cadangan: string) =>
  nilai === null || nilai === undefined ? cadangan : String(nilai);

function gabung(j: Jawaban | null): KontakGabungan {
  const bawaan = dariStatis();
  if (!j) return bawaan;

  const h = j.halaman ?? {};
  const a = j.alamat ?? {};
  const f = j.formulir ?? {};

  return {
    halaman: {
      judul: teks(h.judul, bawaan.halaman.judul),
      subjudul: teks(h.subjudul, bawaan.halaman.subjudul),
      pengantar: teks(h.pengantar, bawaan.halaman.pengantar),
      gambarUrl: teks(h.gambar_url, bawaan.halaman.gambarUrl),
      gambarAlt: teks(h.gambar_alt, bawaan.halaman.gambarAlt),
    },
    alamat: {
      nama: teks(a.nama, bawaan.alamat.nama),
      alamat: teks(a.alamat, bawaan.alamat.alamat),
      jam: teks(a.jam, bawaan.alamat.jam),
      catatanJam: teks(a.catatanJam, bawaan.alamat.catatanJam),
      peta: teks(a.peta, bawaan.alamat.peta),
    },
    formulir: {
      judul: teks(f.judul, bawaan.formulir.judul),
      pengantar: teksBolehKosong(f.pengantar, ""),
      waAdmin: teks(f.waAdmin, bawaan.formulir.waAdmin),
      judulSukses: teks(f.judulSukses, bawaan.formulir.judulSukses),
      statusSukses: teks(f.statusSukses, bawaan.formulir.statusSukses),
      catatanSukses: teks(f.catatanSukses, bawaan.formulir.catatanSukses),
    },
    topik:
      j.topik && j.topik.length > 0
        ? j.topik.map((t, i) => ({
            id: t.id,
            nama: t.nama,
            aktif: t.aktif !== false,
            urutan: t.urutan ?? i + 1,
          }))
        : bawaan.topik,
    dariDatabase: true,
  };
}

let keadaan: KontakGabungan = gabung(null);
let janji: Promise<KontakGabungan> | null = null;
const pendengar = new Set<(v: KontakGabungan) => void>();

function kabari() {
  for (const dengar of pendengar) dengar(keadaan);
}

export function segarkanKontak(): Promise<KontakGabungan> {
  if (janji) return janji;
  janji = fetch("/api/kontak", { headers: { Accept: "application/json" } })
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

export function useKontak(): KontakGabungan {
  const [data, setData] = useState<KontakGabungan>(keadaan);

  useEffect(() => {
    pendengar.add(setData);
    void segarkanKontak();
    return () => {
      pendengar.delete(setData);
    };
  }, []);

  return data;
}

/** Pilihan topik yang tampil pada formulir (hanya yang aktif). */
export const topikAktif = (data: KontakGabungan) =>
  data.topik.filter((t) => t.aktif).map((t) => t.nama);
