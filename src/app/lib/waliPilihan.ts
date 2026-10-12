import { useEffect, useState } from "react";

/**
 * Tagihan yang sedang dipilih untuk dibayar. Dipakai bersama oleh portal wali
 * santri dan halaman pembayaran, sama seperti rujukan.
 */
let pilihan: string[] = [];
const pendengar = new Set<() => void>();

function beritahu() {
  pendengar.forEach((p) => p());
}

export function usePilihan() {
  const [, setVersi] = useState(0);
  useEffect(() => {
    const perbarui = () => setVersi((v) => v + 1);
    pendengar.add(perbarui);
    return () => {
      pendengar.delete(perbarui);
    };
  }, []);
  return pilihan;
}

export function ubahPilihan(daftar: string[]) {
  pilihan = daftar;
  beritahu();
}

export function togolPilihan(id: string) {
  pilihan = pilihan.includes(id) ? pilihan.filter((p) => p !== id) : [...pilihan, id];
  beritahu();
}

export function pilihSemua(idBelumDibayar: string[]) {
  pilihan = pilihan.length === idBelumDibayar.length ? [] : idBelumDibayar;
  beritahu();
}

export function bersihkanPilihan() {
  pilihan = [];
  beritahu();
}
