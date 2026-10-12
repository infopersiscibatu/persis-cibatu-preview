import { useEffect, useState } from "react";

/**
 * Pemberitahuan panel admin: pesan singkat yang muncul di atas (untuk simpan/tambah)
 * dan kotak konfirmasi sebelum menghapus. Dipakai bersama lewat fungsi di bawah,
 * jadi halaman admin mana pun bisa memanggilnya tanpa saling mengirim properti.
 */

export type TipeNotif = "sukses" | "galat";

export type Notif = { id: number; tipe: TipeNotif; teks: string };

type Konfirmasi = {
  id: number;
  pesan: string;
  judul: string;
  nada: "bahaya" | "tanya";
  labelYa: string;
  labelTidak: string;
  selesai: (ya: boolean) => void;
};

let urut = 0;
let daftar: Notif[] = [];
let konfirmasi: Konfirmasi | null = null;
const pendengar = new Set<() => void>();

function kabari() {
  for (const dengar of pendengar) dengar();
}

/** Munculkan pesan singkat; hilang sendiri setelah beberapa detik. */
export function beritahu(tipe: TipeNotif, teks: string, durasi = 4500) {
  const baru: Notif = { id: (urut += 1), tipe, teks };
  daftar = [...daftar, baru];
  kabari();
  window.setTimeout(() => {
    daftar = daftar.filter((n) => n.id !== baru.id);
    kabari();
  }, durasi);
}

/** Tutup satu pesan lebih cepat. */
export function tutupNotif(id: number) {
  daftar = daftar.filter((n) => n.id !== id);
  kabari();
}

/** Tanya dulu sebelum bertindak; jawabannya true bila pemakai menekan tombol setuju. */
export function mintaKonfirmasi(
  pesan: string,
  opsi?: { judul?: string; nada?: "bahaya" | "tanya"; labelYa?: string; labelTidak?: string },
): Promise<boolean> {
  return new Promise((selesai) => {
    konfirmasi = {
      id: (urut += 1),
      pesan,
      judul: opsi?.judul ?? "Konfirmasi hapus",
      nada: opsi?.nada ?? "bahaya",
      labelYa: opsi?.labelYa ?? "Ya, lanjutkan",
      labelTidak: opsi?.labelTidak ?? "Batal",
      selesai,
    };
    kabari();
  });
}

/** Dipakai kotak konfirmasi saat tombolnya ditekan atau kotak ditutup. */
export function jawabKonfirmasi(ya: boolean) {
  const sekarang = konfirmasi;
  konfirmasi = null;
  kabari();
  sekarang?.selesai(ya);
}

/** Keadaan pemberitahuan yang sedang tampil. */
export function useNotifikasiAdmin(): { daftar: Notif[]; konfirmasi: Konfirmasi | null } {
  const [, paksa] = useState(0);

  useEffect(() => {
    const dengar = () => paksa((n) => n + 1);
    pendengar.add(dengar);
    return () => {
      pendengar.delete(dengar);
    };
  }, []);

  return { daftar, konfirmasi };
}
