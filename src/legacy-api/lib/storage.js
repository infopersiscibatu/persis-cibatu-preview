// @ts-nocheck
/**
 * Pengganti lib/storage.js: berkas disimpan di penyimpanan Lovable Cloud (wadah "media").
 * Bentuk fungsi sama dengan aslinya: unggah, hapus, status.
 */
import { adminKlien } from "../db.js";

const WADAH = "media";
const BATAS_UKURAN = 25 * 1024 * 1024;
const JENIS_DIIZINKAN = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

function galatPengguna(pesan, status = 400) {
  const e = new Error(pesan);
  e.status = status;
  return e;
}

const namaAman = (nama) =>
  String(nama || "berkas")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-80);

function acakHex(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

function buatKunci(folder, nama, tipe) {
  const bersih = String(folder || "umum").replace(/[^a-z0-9\-_/]+/gi, "").replace(/^\/+|\/+$/g, "") || "umum";
  const ekstensi = JENIS_DIIZINKAN[tipe] ?? (namaAman(nama).split(".").pop() || "bin");
  const dasar = namaAman(nama).replace(/\.[a-z0-9]+$/, "") || "berkas";
  return `${bersih}/${Date.now().toString(36)}-${acakHex(6)}-${dasar}.${ekstensi}`;
}

function base64KeBytes(data) {
  const s = String(data || "").replace(/^data:[^;]+;base64,/, "");
  const biner = atob(s);
  const out = new Uint8Array(biner.length);
  for (let i = 0; i < biner.length; i++) out[i] = biner.charCodeAt(i);
  return out;
}

export async function unggah({ nama, tipe, data, folder, alt, keterangan }) {
  if (!JENIS_DIIZINKAN[tipe]) throw galatPengguna("Jenis berkas tidak diizinkan. Gunakan JPG, PNG, WEBP, GIF, SVG, atau PDF.");
  let isi;
  try {
    isi = base64KeBytes(data);
  } catch {
    throw galatPengguna("Berkas kosong atau tidak terbaca.");
  }
  if (isi.length === 0) throw galatPengguna("Berkas kosong atau tidak terbaca.");
  if (isi.length > BATAS_UKURAN) throw galatPengguna("Ukuran berkas lebih dari 25 MB. Perkecil dulu gambarnya.", 413);
  const kunci = buatKunci(folder, nama, tipe);
  const db = await adminKlien();
  const { error } = await db.storage.from(WADAH).upload(kunci, isi, {
    contentType: tipe,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error("Gagal menyimpan berkas: " + error.message);
  return { kunci, url: `/berkas/${kunci}`, ukuran: isi.length, tipe, nama: namaAman(nama), alt, keterangan };
}

export async function hapus(kunci) {
  if (!kunci) return false;
  const db = await adminKlien();
  await db.storage.from(WADAH).remove([kunci]);
  return true;
}

export function status() {
  return { aktif: true, awalan: null, alamat_publik: "Lovable Cloud", variabel: {} };
}

export function konfigurasi() {
  return { lengkap: true };
}

export { JENIS_DIIZINKAN, BATAS_UKURAN };
export default { unggah, hapus, status, konfigurasi, JENIS_DIIZINKAN, BATAS_UKURAN };
