import {
  menungguAwal,
  riwayatAwal,
  tagihanAwal,
  type PembayaranRiwayat,
  type Tagihan,
  type TagihanMenunggu,
} from "../data/wali";

/**
 * Tidak ada server penyimpanan, jadi pembayaran yang ditandai "Sudah Bayar"
 * disimpan di peramban pengunjung agar tagihan berpindah ke bagian
 * Menunggu Verifikasi seperti di situs rujukan.
 */
const KUNCI = "persis-cibatu-wali-dibayar-v1";

type Catatan = { tagihan: Tagihan; metode: string; waktu: string };

export function catatanDibayar(): Catatan[] {
  try {
    const isi = JSON.parse(window.localStorage.getItem(KUNCI) ?? "[]");
    return Array.isArray(isi) ? (isi as Catatan[]) : [];
  } catch {
    return [];
  }
}

export function simpanDibayar(tagihan: Tagihan[], metode: string, waktu: string) {
  const baru: Catatan[] = tagihan.map((t) => ({ tagihan: t, metode, waktu }));
  try {
    window.localStorage.setItem(KUNCI, JSON.stringify([...baru, ...catatanDibayar()]));
  } catch {
    /* penyimpanan peramban tidak tersedia — abaikan */
  }
}

export type KeadaanTagihan = {
  belum: Tagihan[];
  menunggu: TagihanMenunggu[];
  riwayat: PembayaranRiwayat[];
};

/** Tagihan portal: data awal dikurangi yang sudah ditandai dibayar. */
export function keadaanTagihan(): KeadaanTagihan {
  const dibayar = catatanDibayar();
  const idDibayar = new Set(dibayar.map((d) => d.tagihan.id));
  return {
    belum: tagihanAwal.filter((t) => !idDibayar.has(t.id)),
    menunggu: [
      ...dibayar.map((d) => ({
        id: d.tagihan.id,
        label: d.tagihan.label,
        jumlah: d.tagihan.jumlah,
        metode: d.metode,
        dibayarPada: undefined,
      })),
      ...menungguAwal,
    ],
    riwayat: riwayatAwal,
  };
}
