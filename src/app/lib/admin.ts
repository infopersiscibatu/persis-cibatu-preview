/** Pemanggil layanan panel admin. Semua kesalahan dilempar sebagai Error berisi pesan. */

import { ambilToken, hapusToken } from "./sesi";

async function baca(jawab: Response) {
  const tipe = jawab.headers.get("content-type") ?? "";
  const isi = tipe.includes("application/json") ? await jawab.json().catch(() => ({})) : {};
  if (!jawab.ok) throw new Error(isi.pesan || `Layanan menjawab ${jawab.status}`);
  return isi;
}

async function minta<T = Record<string, unknown>>(jalur: string, opsi: RequestInit = {}): Promise<T> {
  const token = ambilToken();
  const jawab = await fetch(jalur, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { "x-sesi-admin": token } : {}),
    },
    ...opsi,
  });
  /* Sesi kedaluwarsa atau dibatalkan: bersihkan agar panel kembali ke layar PIN. */
  if (jawab.status === 401) {
    hapusToken();
    throw new Error("Sesi sudah berakhir. Silakan masuk kembali dengan PIN.");
  }
  return (await baca(jawab)) as T;
}

/** Angka ringkas halaman Dashboard panel admin. */
export const ambilStatistikAdmin = () => minta("/api/admin/statistik");

/* ------------------------- admin unit per sekolah ------------------------------- */

export type SekolahUnit = {
  unitId: string;
  nama: string;
  jenjang: string;
  pin: string;
  adminSpmb: string;
  adminSekolah: string;
  adminTu: string;
  aktif: boolean;
};

export type JawabanSekolah = {
  sekolah?: SekolahUnit[];
  ringkasan?: { total: number; aktif: number };
  akses?: string[];
  pin?: string;
  pesan?: string;
};

export const ambilAdminUnitSekolah = () => minta<JawabanSekolah>("/api/admin/unit-sekolah");

export const simpanAdminUnitSekolah = (unitId: string, nilai: Record<string, unknown>) =>
  minta<JawabanSekolah>(`/api/admin/unit-sekolah/${encodeURIComponent(unitId)}`, {
    method: "PUT",
    body: JSON.stringify(nilai),
  });

/** PIN baru untuk satu sekolah; tanpa isi nilai, PIN diacak oleh layanan. */
export const acakPinSekolah = (unitId: string, pin?: string) =>
  minta<JawabanSekolah>(`/api/admin/unit-sekolah/${encodeURIComponent(unitId)}/pin`, {
    method: "POST",
    body: JSON.stringify(pin ? { pin } : {}),
  });

/* --------------------------------- admin ZIS ----------------------------------- */

export type Zis = { pin: string; nama: string; aktif: boolean };

export const ambilAdminZis = () => minta<{ zis?: Zis }>("/api/admin/zis");

export const simpanAdminZis = (nilai: { nama: string; aktif: boolean }) =>
  minta<{ zis?: Zis }>("/api/admin/zis", { method: "PUT", body: JSON.stringify(nilai) });

export const acakPinZis = (pin?: string) =>
  minta<{ zis?: Zis }>("/api/admin/zis/pin", { method: "POST", body: JSON.stringify(pin ? { pin } : {}) });

const kirim = <T,>(jalur: string, metode: string, isi?: unknown) =>
  minta<T>(jalur, { method: metode, body: isi === undefined ? undefined : JSON.stringify(isi) });

export const simpanIdentitas = (nilai: Record<string, string>) => kirim("/api/admin/identitas", "PUT", nilai);

export const simpanLogo = (url: string, alt?: string) => kirim("/api/admin/logo", "PUT", { url, alt });

export const simpanLayanan = (nilai: Record<string, string>) => kirim("/api/admin/layanan", "PUT", nilai);

export const simpanProfil = (nilai: Record<string, unknown>) => kirim("/api/admin/profil", "PUT", nilai);

export const tambahPengurus = (nilai: Record<string, string>) => kirim("/api/admin/pengurus", "POST", nilai);

export const ubahPengurus = (id: string, nilai: Record<string, string>) =>
  kirim(`/api/admin/pengurus/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusPengurus = (id: string) => kirim(`/api/admin/pengurus/${encodeURIComponent(id)}`, "DELETE");

export const urutPengurus = (urut: string[]) => kirim("/api/admin/pengurus-urut", "POST", { urut });

/* ---------------------------- jenjang pendidikan ---------------------------- */

export const simpanHalamanJenjang = (nilai: Record<string, string>) =>
  kirim("/api/admin/jenjang-halaman", "PUT", nilai);

export const ubahJenjang = (id: string, nilai: Record<string, string>) =>
  kirim(`/api/admin/jenjang/${encodeURIComponent(id)}`, "PUT", nilai);

export const tambahJenjang = (nilai: Record<string, string>) => kirim("/api/admin/jenjang", "POST", nilai);

export const hapusJenjang = (id: string) => kirim(`/api/admin/jenjang/${encodeURIComponent(id)}`, "DELETE");

export const urutJenjang = (urut: string[]) => kirim("/api/admin/jenjang-urut", "POST", { urut });

/** Unggah berkas ke penyimpanan Mythex, hasilnya alamat publik gambar. */
export async function unggahBerkas(berkas: File, folder = "umum"): Promise<{ id: string; url: string }> {
  const data = await new Promise<string>((selesai, gagal) => {
    const pembaca = new FileReader();
    pembaca.onload = () => selesai(String(pembaca.result).split(",")[1] ?? "");
    pembaca.onerror = () => gagal(new Error("Berkas tidak bisa dibaca."));
    pembaca.readAsDataURL(berkas);
  });
  if (!data) throw new Error("Berkas kosong atau tidak bisa dibaca.");
  const hasil = await minta<{ media: { id: string; url: string } }>("/api/unggah", {
    method: "POST",
    body: JSON.stringify({ nama: berkas.name, tipe: berkas.type, data, folder, alt: berkas.name }),
  });
  return { id: hasil.media.id, url: hasil.media.url };
}

/* --------------------------------- iklan --------------------------------- */

export const tambahIklan = (nilai: Record<string, unknown>) => kirim("/api/admin/iklan", "POST", nilai);

export const ubahIklan = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/iklan/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusIklan = (id: string) => kirim(`/api/admin/iklan/${encodeURIComponent(id)}`, "DELETE");

export const urutIklan = (urut: string[]) => kirim("/api/admin/iklan-urut", "POST", { urut });

/* ------------------------------- sekolah ------------------------------- */

export const tambahSekolah = (nilai: Record<string, unknown>) => kirim("/api/admin/sekolah", "POST", nilai);

export const ubahSekolah = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/sekolah/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusSekolah = (id: string) => kirim(`/api/admin/sekolah/${encodeURIComponent(id)}`, "DELETE");

/* --------------------------- program jurusan --------------------------- */

export const tambahJurusan = (nilai: Record<string, unknown>) => kirim("/api/admin/jurusan", "POST", nilai);

export const ubahJurusan = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/jurusan/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusJurusan = (id: string) => kirim(`/api/admin/jurusan/${encodeURIComponent(id)}`, "DELETE");

/* --------------------------------- SPMB --------------------------------- */

export const simpanHalamanSpmb = (nilai: Record<string, unknown>) => kirim("/api/admin/spmb-halaman", "PUT", nilai);

export const simpanGambarSpmb = (nilai: Record<string, unknown>) => kirim("/api/admin/spmb-gambar", "PUT", nilai);

export const simpanFormulirSpmb = (nilai: Record<string, unknown>) =>
  kirim("/api/admin/spmb-formulir", "PUT", nilai);

export const tambahGelombang = (nilai: Record<string, string>) => kirim("/api/admin/spmb-gelombang", "POST", nilai);

export const ubahGelombang = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/spmb-gelombang/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusGelombang = (id: string) =>
  kirim(`/api/admin/spmb-gelombang/${encodeURIComponent(id)}`, "DELETE");

export const urutGelombang = (urut: string[]) => kirim("/api/admin/spmb-gelombang-urut", "POST", { urut });

export const tambahBiaya = (nilai: Record<string, string>) => kirim("/api/admin/spmb-biaya", "POST", nilai);

export const ubahBiaya = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/spmb-biaya/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusBiaya = (id: string) => kirim(`/api/admin/spmb-biaya/${encodeURIComponent(id)}`, "DELETE");

export const urutBiaya = (urut: string[]) => kirim("/api/admin/spmb-biaya-urut", "POST", { urut });

export const tambahLayanan = (nilai: Record<string, string>) => kirim("/api/admin/spmb-layanan", "POST", nilai);

export const ubahLayanan = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/spmb-layanan/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusLayanan = (id: string) => kirim(`/api/admin/spmb-layanan/${encodeURIComponent(id)}`, "DELETE");

export const urutLayanan = (urut: string[]) => kirim("/api/admin/spmb-layanan-urut", "POST", { urut });

/* -------------------------------- Galeri -------------------------------- */

export const simpanHalamanGaleri = (nilai: Record<string, unknown>) => kirim("/api/admin/galeri-halaman", "PUT", nilai);

export const simpanGambarGaleri = (nilai: Record<string, unknown>) => kirim("/api/admin/galeri-gambar", "PUT", nilai);

export const tambahKategoriGaleri = (nilai: Record<string, string>) =>
  kirim("/api/admin/galeri-kategori", "POST", nilai);

export const ubahKategoriGaleri = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/galeri-kategori/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusKategoriGaleri = (id: string) =>
  kirim(`/api/admin/galeri-kategori/${encodeURIComponent(id)}`, "DELETE");

export const urutKategoriGaleri = (urut: string[]) => kirim("/api/admin/galeri-kategori-urut", "POST", { urut });

export const tambahFotoGaleri = (nilai: Record<string, unknown>) => kirim("/api/admin/galeri-foto", "POST", nilai);

export const ubahFotoGaleri = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/galeri-foto/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusFotoGaleri = (id: string) => kirim(`/api/admin/galeri-foto/${encodeURIComponent(id)}`, "DELETE");

/* --------------------------------- Berita -------------------------------- */

export const simpanHalamanBerita = (nilai: Record<string, unknown>) => kirim("/api/admin/berita-halaman", "PUT", nilai);

export const simpanGambarBerita = (nilai: Record<string, unknown>) => kirim("/api/admin/berita-gambar", "PUT", nilai);

export const tambahKategoriBerita = (nilai: Record<string, string>) =>
  kirim("/api/admin/berita-kategori", "POST", nilai);

export const ubahKategoriBerita = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/berita-kategori/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusKategoriBerita = (id: string) =>
  kirim(`/api/admin/berita-kategori/${encodeURIComponent(id)}`, "DELETE");

export const urutKategoriBerita = (urut: string[]) => kirim("/api/admin/berita-kategori-urut", "POST", { urut });

export const tambahBerita = (nilai: Record<string, unknown>) => kirim("/api/admin/berita", "POST", nilai);

export const ubahBerita = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/berita/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusBerita = (id: string) => kirim(`/api/admin/berita/${encodeURIComponent(id)}`, "DELETE");

/* ---------------------------------- Kajian --------------------------------- */

export const simpanHalamanKajian = (nilai: Record<string, unknown>) => kirim("/api/admin/kajian-halaman", "PUT", nilai);

export const simpanGambarKajian = (nilai: Record<string, unknown>) => kirim("/api/admin/kajian-gambar", "PUT", nilai);

export const tambahKajian = (nilai: Record<string, unknown>) => kirim("/api/admin/kajian", "POST", nilai);

export const ubahKajian = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/kajian/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusKajian = (id: string) => kirim(`/api/admin/kajian/${encodeURIComponent(id)}`, "DELETE");

export const tambahKajianRutin = (nilai: Record<string, unknown>) => kirim("/api/admin/kajian-rutin", "POST", nilai);

export const ubahKajianRutin = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/kajian-rutin/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusKajianRutin = (id: string) => kirim(`/api/admin/kajian-rutin/${encodeURIComponent(id)}`, "DELETE");

export const urutKajianRutin = (urut: string[]) => kirim("/api/admin/kajian-rutin-urut", "POST", { urut });

/* --------------------------------- Artikel --------------------------------- */

export const simpanHalamanArtikel = (nilai: Record<string, unknown>) =>
  kirim("/api/admin/artikel-halaman", "PUT", nilai);

export const simpanGambarArtikel = (nilai: Record<string, unknown>) =>
  kirim("/api/admin/artikel-gambar", "PUT", nilai);

export const tambahKategoriArtikel = (nilai: Record<string, string>) =>
  kirim("/api/admin/artikel-kategori", "POST", nilai);

export const ubahKategoriArtikel = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/artikel-kategori/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusKategoriArtikel = (id: string) =>
  kirim(`/api/admin/artikel-kategori/${encodeURIComponent(id)}`, "DELETE");

export const urutKategoriArtikel = (urut: string[]) => kirim("/api/admin/artikel-kategori-urut", "POST", { urut });

export const tambahArtikel = (nilai: Record<string, unknown>) => kirim("/api/admin/artikel", "POST", nilai);

export const ubahArtikel = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/artikel/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusArtikel = (id: string) => kirim(`/api/admin/artikel/${encodeURIComponent(id)}`, "DELETE");

/* ---------------------------------- Kontak ---------------------------------- */

export const simpanHalamanKontak = (nilai: Record<string, string>) =>
  kirim("/api/admin/kontak-halaman", "PUT", nilai);

export const simpanGambarKontak = (nilai: Record<string, string>) =>
  kirim("/api/admin/kontak-gambar", "PUT", nilai);

export const simpanAlamatKontak = (nilai: Record<string, string>) =>
  kirim("/api/admin/kontak-alamat", "PUT", nilai);

export const simpanFormulirKontak = (nilai: Record<string, string>) =>
  kirim("/api/admin/kontak-formulir", "PUT", nilai);

export const tambahTopikKontak = (nilai: Record<string, string>) =>
  kirim("/api/admin/kontak-topik", "POST", nilai);

export const ubahTopikKontak = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/kontak-topik/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusTopikKontak = (id: string) =>
  kirim(`/api/admin/kontak-topik/${encodeURIComponent(id)}`, "DELETE");

export const urutTopikKontak = (urut: string[]) => kirim("/api/admin/kontak-topik-urut", "POST", { urut });

/* --------------------------------- Pengumuman --------------------------------- */

export const tambahPengumuman = (nilai: Record<string, unknown>) =>
  kirim("/api/admin/pengumuman", "POST", nilai);

export const ubahPengumuman = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/pengumuman/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusPengumuman = (id: string) => kirim(`/api/admin/pengumuman/${encodeURIComponent(id)}`, "DELETE");

export const tambahKategoriPengumuman = (nilai: Record<string, string>) =>
  kirim("/api/admin/pengumuman-kategori", "POST", nilai);

export const ubahKategoriPengumuman = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/pengumuman-kategori/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusKategoriPengumuman = (id: string) =>
  kirim(`/api/admin/pengumuman-kategori/${encodeURIComponent(id)}`, "DELETE");

export const urutKategoriPengumuman = (urut: string[]) =>
  kirim("/api/admin/pengumuman-kategori-urut", "POST", { urut });

/* ----------------------------------- Agenda ----------------------------------- */

export const tambahAgenda = (nilai: Record<string, unknown>) => kirim("/api/admin/agenda", "POST", nilai);

export const ubahAgenda = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/agenda/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusAgenda = (id: string) => kirim(`/api/admin/agenda/${encodeURIComponent(id)}`, "DELETE");

export const tambahKategoriAgenda = (nilai: Record<string, string>) =>
  kirim("/api/admin/agenda-kategori", "POST", nilai);

export const ubahKategoriAgenda = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/agenda-kategori/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusKategoriAgenda = (id: string) =>
  kirim(`/api/admin/agenda-kategori/${encodeURIComponent(id)}`, "DELETE");

export const urutKategoriAgenda = (urut: string[]) => kirim("/api/admin/agenda-kategori-urut", "POST", { urut });

/* ---------------------------------- Beranda ---------------------------------- */

export const tambahCarousel = (nilai: Record<string, unknown>) => kirim("/api/admin/carousel", "POST", nilai);

export const ubahCarousel = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/carousel/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusCarousel = (id: string) => kirim(`/api/admin/carousel/${encodeURIComponent(id)}`, "DELETE");

export const urutCarousel = (urut: string[]) => kirim("/api/admin/carousel-urut", "POST", { urut });

export const tambahGridMenu = (nilai: Record<string, unknown>) => kirim("/api/admin/grid-menu", "POST", nilai);

export const ubahGridMenu = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/grid-menu/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusGridMenu = (id: string) => kirim(`/api/admin/grid-menu/${encodeURIComponent(id)}`, "DELETE");

export const urutGridMenu = (urut: string[]) => kirim("/api/admin/grid-menu-urut", "POST", { urut });

export const simpanNavigasi = (navigasi: Record<string, unknown>[]) =>
  kirim("/api/admin/navigasi", "PUT", { navigasi });

export const tambahSosial = (nilai: Record<string, unknown>) => kirim("/api/admin/sosial", "POST", nilai);

export const ubahSosial = (id: string, nilai: Record<string, unknown>) =>
  kirim(`/api/admin/sosial/${encodeURIComponent(id)}`, "PUT", nilai);

export const hapusSosial = (id: string) => kirim(`/api/admin/sosial/${encodeURIComponent(id)}`, "DELETE");

export const urutSosial = (urut: string[]) => kirim("/api/admin/sosial-urut", "POST", { urut });

/* ------------------------------ tahun ajaran ------------------------------ */

export type TahunAjaran = {
  id: string;
  nama: string;
  semester: string | null;
  mulai: string | null;
  selesai: string | null;
  aktif: boolean;
};
type JawabTA = { tahunAjaran: TahunAjaran[] };
export const ambilTahunAjaran = () => minta<JawabTA>("/api/admin/tahun-ajaran");
export const tambahTahunAjaran = (nilai: Record<string, unknown>) =>
  kirim<JawabTA>("/api/admin/tahun-ajaran", "POST", nilai);
export const ubahTahunAjaran = (id: string, nilai: Record<string, unknown>) =>
  kirim<JawabTA>(`/api/admin/tahun-ajaran/${encodeURIComponent(id)}`, "PUT", nilai);
export const aktifkanTahunAjaran = (id: string) =>
  kirim<JawabTA>(`/api/admin/tahun-ajaran/${encodeURIComponent(id)}/aktif`, "POST");
export const hapusTahunAjaran = (id: string) =>
  kirim<JawabTA>(`/api/admin/tahun-ajaran/${encodeURIComponent(id)}`, "DELETE");
