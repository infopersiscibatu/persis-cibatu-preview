import { useSyncExternalStore } from "react";

/**
 * Sesi panel admin: token disimpan di peramban setelah masuk dengan PIN.
 * Token yang sama dikirim pada setiap permintaan ke /api/admin.
 */

const KUNCI = "pc-persis-admin-sesi";

let token = "";
try {
  token = localStorage.getItem(KUNCI) ?? "";
} catch {
  token = "";
}

const pendengar = new Set<() => void>();
let keadaan = { token };

function kabari() {
  keadaan = { token };
  for (const dengar of pendengar) dengar();
}

export const ambilToken = () => token;

export function simpanToken(baru: string) {
  token = baru;
  try {
    localStorage.setItem(KUNCI, baru);
  } catch {
    /* penyimpanan peramban tidak tersedia: sesi hanya berlaku selama halaman terbuka */
  }
  kabari();
}

export function hapusToken() {
  token = "";
  try {
    localStorage.removeItem(KUNCI);
  } catch {
    /* abaikan */
  }
  kabari();
}

/**
 * Ganti PIN panel admin. PIN lama diperiksa server, dan sesi di perangkat lain
 * ditutup supaya PIN lama tidak lagi bisa dipakai.
 */
export async function gantiPinAdmin(lama: string, baru: string, ulang: string): Promise<string> {
  const jawab = await fetch("/api/admin/pin", {
    method: "POST",
    headers: { "content-type": "application/json", "x-sesi-admin": ambilToken() },
    body: JSON.stringify({ lama, baru, ulang }),
  });
  const isi = (await jawab.json().catch(() => ({}))) as { ok?: boolean; pesan?: string };
  if (!jawab.ok || !isi.ok) throw new Error(isi.pesan ?? "PIN tidak bisa diperbarui.");
  return isi.pesan ?? "PIN sudah diperbarui.";
}

/** Masuk ke panel admin memakai PIN. Mengembalikan nama akun bila berhasil. */
export async function masuk(pin: string): Promise<string> {
  const jawab = await fetch("/api/admin/masuk", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ pin }),
  });
  const isi = (await jawab.json().catch(() => ({}))) as { pesan?: string; token?: string; nama?: string };
  if (!jawab.ok || !isi.token) throw new Error(isi.pesan || "PIN tidak bisa diverifikasi.");
  simpanToken(isi.token);
  return isi.nama ?? "Administrator";
}

/** Keluar dari panel admin dan batalkan sesi di layanan. */
export async function keluar(): Promise<void> {
  const sekarang = token;
  hapusToken();
  if (!sekarang) return;
  try {
    await fetch("/api/admin/keluar", {
      method: "POST",
      headers: { "x-sesi-admin": sekarang, Accept: "application/json" },
    });
  } catch {
    /* sesi sudah dihapus di peramban; kegagalan jaringan tidak menghalangi keluar */
  }
}

const langganan = (dengar: () => void) => {
  pendengar.add(dengar);
  return () => pendengar.delete(dengar);
};

export function useSesiAdmin() {
  const { token: sekarang } = useSyncExternalStore(langganan, () => keadaan, () => keadaan);
  return { token: sekarang, masuk: sekarang !== "" };
}
