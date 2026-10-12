import { hariKe, tanggalBulanSingkat } from "../lib/format";

/* Data halaman SPMB — sama seperti situs rujukan. */

export const halamanSpmb = {
  judul: "SPMB",
  pengantar:
    "Sistem Penerimaan Murid & Mahasiswa Baru (SPMB) PC PERSIS Cibatu dibuka untuk lima jenjang formal, dari Raudhatul Athfal sampai perguruan tinggi. Pendaftaran dilakukan secara daring melalui formulir di bawah ini atau langsung ke sekretariat pada jam layanan.",
  catatan:
    "Data pendaftaran diteruskan ke panitia SPMB untuk diverifikasi. Setelah terkirim, isian dapat Anda teruskan ke WhatsApp admin dari tombol yang muncul.",
};

export type Gelombang = { id: string; nama: string; periode: string; kuota: string; sisa: string; status: string };

const geser = (hari: number) => tanggalBulanSingkat(hariKe(hari));

export const gelombang: Gelombang[] = [
  {
    id: "gl-1",
    nama: "Gelombang I",
    periode: `${geser(-6)} – ${geser(24)}`,
    kuota: "120 kursi",
    sisa: "38 kursi tersisa",
    status: "Dibuka",
  },
  {
    id: "gl-2",
    nama: "Gelombang II",
    periode: `${geser(31)} – ${geser(61)}`,
    kuota: "80 kursi",
    sisa: "Belum dibuka",
    status: "Segera",
  },
];

export const biaya = [
  { id: "bi-1", label: "Formulir pendaftaran", nilai: "Rp 100.000" },
  { id: "bi-2", label: "Tes seleksi & wawancara", nilai: "Gratis" },
  { id: "bi-3", label: "Administrasi daftar ulang", nilai: "Sesuai jenjang" },
];

/** Nomor WhatsApp admin panitia SPMB. */
export const waAdmin = "088224597479";
export const waAdminLink = waAdmin.replace(/\D/g, "").replace(/^0/, "62");
export const waAdminTeks = waAdmin.replace(/(\d{4})(\d{4})(\d+)/, "$1 $2 $3");
