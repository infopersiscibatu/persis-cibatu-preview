/**
 * Donasi yang baru disalurkan lewat formulir.
 *
 * Setiap donasi dikirim ke server dan tersimpan dengan status "menunggu" supaya
 * petugas ZIS dapat memverifikasinya dari halaman Admin ZIS. Salinannya juga
 * disimpan di peramban pengunjung agar daftar "Menunggu Verifikasi" pada halaman
 * program langsung menampilkan donasi yang baru saja dikirim.
 */
export type IsianDonasiServer = {
  program: string;
  nama: string;
  anonim: boolean;
  telepon: string;
  jumlah: number;
  pesan: string;
  metode: string;
};

/** Kirim donasi ke server; mengembalikan nomor donasi yang dibuat petugas lihat. */
export async function kirimDonasiKeServer(isian: IsianDonasiServer): Promise<{ id: number; nomor: string }> {
  const jawab = await fetch("/api/donasi", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(isian),
  });
  const isi = (await jawab.json().catch(() => ({}))) as {
    ok?: boolean;
    pesan?: string;
    donasi?: { id: number; nomor: string };
  };
  if (!jawab.ok || !isi.ok || !isi.donasi) {
    throw new Error(isi.pesan || "Donasi belum bisa dikirim. Periksa sambungan lalu coba lagi.");
  }
  return isi.donasi;
}

export type DonasiMenunggu = {
  id: string;
  slug: string;
  nama: string;
  anonim: boolean;
  nominal: number;
  whatsapp: string;
  pesan: string;
  metode: string;
  waktu: string;
};

const KUNCI = "persis-cibatu-donasi-menunggu-v1";

export function daftarMenunggu(): DonasiMenunggu[] {
  try {
    const isi = JSON.parse(window.localStorage.getItem(KUNCI) ?? "[]");
    return Array.isArray(isi) ? (isi as DonasiMenunggu[]) : [];
  } catch {
    return [];
  }
}

export function simpanMenunggu(donasi: DonasiMenunggu) {
  try {
    window.localStorage.setItem(KUNCI, JSON.stringify([donasi, ...daftarMenunggu()].slice(0, 25)));
  } catch {
    /* penyimpanan peramban penuh atau diblokir — abaikan */
  }
}

export const menungguProgram = (slug: string) => daftarMenunggu().filter((d) => d.slug === slug);
