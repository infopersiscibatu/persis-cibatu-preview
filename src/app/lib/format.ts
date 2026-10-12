const HARI = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_PANJANG = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Tanggal ISO (YYYY-MM-DD) untuk N hari dari hari ini — dipakai agar beranda selalu terlihat segar. */
export function hariKe(offsetHari: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetHari);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Ubah teks tanggal jadi Date. Menerima tanggal biasa ("2026-10-04") maupun
 * penanda waktu lengkap dari database ("2026-10-04T07:41:00.000Z").
 */
function keTanggal(iso: string): Date {
  const teks = String(iso ?? "");
  if (teks.length > 10) {
    const waktu = new Date(teks);
    if (!Number.isNaN(waktu.getTime())) {
      waktu.setHours(12, 0, 0, 0);
      return waktu;
    }
  }
  const [y, m, d] = teks.slice(0, 10).split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

/** "Rabu, 8 Oktober 2026 · 14.05 WIB" — untuk data yang punya jam (mis. waktu pendaftaran). */
export function tanggalJam(iso: string): string {
  if (!iso) return "";
  const waktu = new Date(iso);
  if (Number.isNaN(waktu.getTime())) return tanggalLengkap(iso);
  const jam = `${String(waktu.getHours()).padStart(2, "0")}.${String(waktu.getMinutes()).padStart(2, "0")}`;
  return `${tanggalLengkap(iso)} · ${jam} WIB`;
}

/** "4 Oktober 2026" */
export function tanggalPanjang(iso: string): string {
  const d = keTanggal(iso);
  return `${d.getDate()} ${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`;
}

/** "1 Okt 2026" */
export function tanggalPendek(iso: string): string {
  const d = keTanggal(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** "29 Sep" — dipakai rentang tanggal gelombang SPMB. */
export function tanggalBulanSingkat(iso: string): string {
  const d = keTanggal(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]}`;
}

/** "Rabu" */
export function namaHari(iso: string): string {
  return HARI[keTanggal(iso).getDay()];
}

/** "Rabu, 8 Oktober 2026" */
export function tanggalLengkap(iso: string): string {
  const d = keTanggal(iso);
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`;
}

/** { day: "04", month: "Okt" } untuk blok tanggal di daftar pengumuman & agenda. */
export function tanggalKotak(iso: string): { day: string; month: string } {
  const d = keTanggal(iso);
  return { day: String(d.getDate()).padStart(2, "0"), month: BULAN[d.getMonth()] };
}

/** "Kemarin", "4 hari lalu", "2 pekan lalu", "1 bulan lalu". */
export function tanggalRelatif(iso: string): string {
  const d = keTanggal(iso);
  const kini = new Date();
  kini.setHours(12, 0, 0, 0);
  const selisih = Math.round((kini.getTime() - d.getTime()) / 86400000);
  if (selisih <= 0) return "Hari ini";
  if (selisih === 1) return "Kemarin";
  if (selisih < 7) return `${selisih} hari lalu`;
  if (selisih < 30) return `${Math.floor(selisih / 7)} pekan lalu`;
  return tanggalPendek(iso);
}

/** "3 hari lagi" / "8 Okt 2026" untuk agenda mendatang. */
export function hitungHari(iso: string): string {
  const d = keTanggal(iso);
  const kini = new Date();
  kini.setHours(12, 0, 0, 0);
  const selisih = Math.round((d.getTime() - kini.getTime()) / 86400000);
  if (selisih <= 0) return "Hari ini";
  if (selisih === 1) return "Besok";
  return `${selisih} hari lagi`;
}

/** 4820 → "4,8 rb" */
export function angkaRingkas(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(".", ",")} jt`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",")} rb`;
  return String(n);
}

/** Label tanggal untuk daftar notifikasi: "3 hari lagi" bila mendatang, "2 hari lalu" bila sudah lewat. */
export function labelNotifikasi(iso: string): string {
  const d = keTanggal(iso);
  const kini = new Date();
  kini.setHours(12, 0, 0, 0);
  const selisih = Math.round((d.getTime() - kini.getTime()) / 86400000);
  return selisih > 0 ? hitungHari(iso) : tanggalRelatif(iso);
}

/** 28100000 → "Rp28.100.000" */
export function rupiah(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}`;
}

/** 224500000 → "Rp224,5 jt" */
export function rupiahSingkat(n: number): string {
  if (n >= 1000000000) return `Rp${(n / 1000000000).toFixed(1).replace(".", ",")} M`;
  if (n >= 1000000) return `Rp${(n / 1000000).toFixed(1).replace(".", ",")} jt`;
  if (n >= 1000) return `Rp${Math.round(n / 1000)} rb`;
  return rupiah(n);
}

/** Sisa hari sampai sebuah tanggal (0 bila sudah lewat). */
export function hariTersisa(iso: string): number {
  const batas = new Date(`${iso}T00:00:00`).getTime();
  const kini = new Date();
  kini.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((batas - kini.getTime()) / 86400000));
}
