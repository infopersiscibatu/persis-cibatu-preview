import { useSyncExternalStore } from "react";
import { setIstilahUnit, type Istilah } from "./istilah";

/**
 * Sesi halaman unit sekolah (Admin SPMB, Sekolah, Tata Usaha, ZIS).
 * Satu PIN sekolah berlaku untuk seluruh unit sekolah itu, jadi tokennya
 * disimpan sekali dan dikirim sebagai header x-sesi-unit.
 */

const KUNCI = "pc-persis-unit-sesi";

export type UnitSekolah = { id: string; nama: string; jenjang: string };

export type SesiUnit = {
  jenis: string;
  unit: UnitSekolah | null;
  /** Nama petugas untuk sesi yang tidak terikat sekolah (Admin ZIS). */
  nama?: string;
  akses: string[];
  /** Kosa kata penyebutan sesuai jenjang: sekolah/madrasah atau kampus (mahasiswa, UKT, dst.). */
  istilah?: Istilah | null;
};

type Keadaan = { token: string; sesi: SesiUnit | null };

let token = "";
try {
  token = localStorage.getItem(KUNCI) ?? "";
} catch {
  token = "";
}

let keadaan: Keadaan = { token, sesi: null };
const pendengar = new Set<() => void>();

function pasangToken(baru: string, sesi: SesiUnit | null) {
  token = baru;
  keadaan = { token, sesi };
  /* Seluruh halaman unit membaca penyebutan dari sini. */
  setIstilahUnit(sesi?.istilah ?? null);
  try {
    if (baru) localStorage.setItem(KUNCI, baru);
    else localStorage.removeItem(KUNCI);
  } catch {
    /* penyimpanan peramban tidak tersedia: sesi hanya berlaku selama halaman terbuka */
  }
  for (const dengar of pendengar) dengar();
}

export const ambilTokenUnit = () => token;

export function hapusSesiUnit() {
  pasangToken("", null);
}

/** Masuk dengan PIN sekolah dan simpan sesinya. */
export async function masukUnit(pin: string): Promise<SesiUnit> {
  const jawab = await fetch("/api/unit/masuk", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ pin }),
  });
  const isi = (await jawab.json().catch(() => ({}))) as {
    pesan?: string;
    token?: string;
    jenis?: string;
    unit?: UnitSekolah | null;
    nama?: string;
    akses?: string[];
    istilah?: Istilah | null;
  };
  if (!jawab.ok || !isi.token) throw new Error(isi.pesan || "PIN tidak bisa diverifikasi.");
  const sesi: SesiUnit = {
    jenis: isi.jenis ?? "sekolah",
    unit: isi.unit ?? null,
    nama: isi.nama ?? "",
    akses: isi.akses ?? [],
    istilah: (isi as { istilah?: Istilah | null }).istilah ?? null,
  };
  pasangToken(isi.token, sesi);
  return sesi;
}

/** Periksa token yang tersimpan; bila sudah berakhir, sesi dibersihkan. */
export async function periksaSesiUnit(): Promise<SesiUnit | null> {
  if (!token) return null;
  try {
    const jawab = await fetch("/api/unit/saya", {
      headers: { "x-sesi-unit": token, Accept: "application/json" },
    });
    const isi = (await jawab.json().catch(() => ({}))) as {
      masuk?: boolean;
      jenis?: string;
      unit?: UnitSekolah | null;
      nama?: string;
      akses?: string[];
      istilah?: Istilah | null;
    };
    if (!isi.masuk) {
      hapusSesiUnit();
      return null;
    }
    const sesi: SesiUnit = {
      jenis: isi.jenis ?? "sekolah",
      unit: isi.unit ?? null,
      nama: isi.nama ?? "",
      akses: isi.akses ?? [],
      istilah: isi.istilah ?? null,
    };
    pasangToken(token, sesi);
    return sesi;
  } catch {
    /* jaringan bermasalah: sesi dibiarkan, permintaan berikutnya yang memutuskan */
    return keadaan.sesi;
  }
}

/** Keluar dari halaman unit. */
export async function keluarUnit(): Promise<void> {
  const sekarang = token;
  hapusSesiUnit();
  if (!sekarang) return;
  try {
    await fetch("/api/unit/keluar", {
      method: "POST",
      headers: { "x-sesi-unit": sekarang, Accept: "application/json" },
    });
  } catch {
    /* sesi sudah dibersihkan di peramban */
  }
}

const langganan = (dengar: () => void) => {
  pendengar.add(dengar);
  return () => pendengar.delete(dengar);
};

export function useSesiUnit() {
  const sekarang = useSyncExternalStore(langganan, () => keadaan, () => keadaan);
  return { token: sekarang.token, sesi: sekarang.sesi, masuk: sekarang.token !== "" };
}
