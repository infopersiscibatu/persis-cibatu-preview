/**
 * Kosa kata istilah yang dipakai bersama oleh seluruh halaman unit.
 *
 * Penyebutan menyesuaikan jenjang pendidikan unitnya: sekolah dan madrasah memakai
 * istilah sekolah (Siswa, Sekolah, SPP, NIS), sedangkan perguruan tinggi memakai
 * istilah kampus (Mahasiswa, Kampus, UKT, NIM, Program Studi, mata kuliah).
 *
 * Halaman unit mengisi kosa kata ini dari sesi masuknya (server mengirim "istilah"),
 * lalu setiap komponen membacanya lewat useIstilah() agar kalimatnya ikut menyesuaikan.
 */
import { useSyncExternalStore } from "react";
import { istilahMadrasah, istilahSekolah, Kampus, type Istilah } from "../data/pendidikan";

export type { Istilah };

/** Kosa kata bawaan sebelum sesi unit terbaca: istilah sekolah. */
export const ISTILAH_BAWAAN: Istilah = istilahSekolah;

/** Menentukan kosa kata dari jenjang sebuah unit. */
export function istilahDariJenjang(jenjang?: { slug?: string | null; nama?: string | null } | null): Istilah {
  const slug = String(jenjang?.slug ?? "").trim().toLowerCase();
  const nama = String(jenjang?.nama ?? "").trim().toLowerCase();
  if (slug === "pt" || /tinggi|kampus/.test(nama)) return Kampus;
  if (slug === "mdt" || /diniyyah/.test(nama)) return istilahMadrasah;
  return istilahSekolah;
}

let keadaan: Istilah = ISTILAH_BAWAAN;
const pendengar = new Set<() => void>();

/** Dipanggil halaman unit setelah sesi masuknya terbaca. */
export function setIstilahUnit(baru?: Istilah | null) {
  keadaan = baru ?? ISTILAH_BAWAAN;
  for (const dengar of pendengar) dengar();
}

export function ambilIstilah(): Istilah {
  return keadaan;
}

export function useIstilah(): Istilah {
  return useSyncExternalStore(
    (dengar) => {
      pendengar.add(dengar);
      return () => pendengar.delete(dengar);
    },
    () => keadaan,
    () => ISTILAH_BAWAAN,
  );
}
