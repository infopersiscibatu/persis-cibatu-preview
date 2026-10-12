/**
 * Penyimpanan berkas (storage) untuk foto & dokumen yang diunggah admin.
 *
 * Nilai sambungan diberikan platform lewat process.env saat "storage" diaktifkan
 * pada konfigurasi jalan. Semua berkas disimpan di dalam STORAGE_PREFIX proyek ini,
 * dan alamat publiknya adalah STORAGE_PUBLIC_URL + "/" + kunci.
 */
const crypto = require("node:crypto");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

/** Nama variabel lingkungan yang mungkin dipakai platform (diperiksa berurutan). */
const KANDIDAT = {
  endpoint: ["STORAGE_ENDPOINT", "STORAGE_URL", "S3_ENDPOINT", "AWS_ENDPOINT_URL", "STORAGE_S3_ENDPOINT"],
  bucket: ["STORAGE_BUCKET", "STORAGE_BUCKET_NAME", "S3_BUCKET", "BUCKET_NAME"],
  region: ["STORAGE_REGION", "AWS_REGION", "S3_REGION"],
  accessKeyId: ["STORAGE_ACCESS_KEY_ID", "STORAGE_ACCESS_KEY", "STORAGE_KEY", "S3_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID"],
  secretAccessKey: ["STORAGE_SECRET_ACCESS_KEY", "STORAGE_SECRET_KEY", "STORAGE_SECRET", "S3_SECRET_ACCESS_KEY", "AWS_SECRET_ACCESS_KEY"],
  prefix: ["STORAGE_PREFIX"],
  publicUrl: ["STORAGE_PUBLIC_URL"],
};

const ambil = (nama) => {
  const nilai = process.env[nama];
  return nilai && nilai.trim() ? nilai.trim() : undefined;
};

function pertama(kunci) {
  for (const nama of KANDIDAT[kunci]) {
    const nilai = ambil(nama);
    if (nilai) return { nama, nilai };
  }
  return { nama: null, nilai: undefined };
}

/** Ringkasan konfigurasi penyimpanan (tanpa membocorkan nilai rahasia). */
function konfigurasi() {
  const endpoint = pertama("endpoint");
  const bucket = pertama("bucket");
  const region = pertama("region");
  const accessKeyId = pertama("accessKeyId");
  const secretAccessKey = pertama("secretAccessKey");
  const prefix = pertama("prefix");
  const publicUrl = pertama("publicUrl");

  const lengkap = Boolean(
    (endpoint.nilai || region.nilai) && bucket.nilai && accessKeyId.nilai && secretAccessKey.nilai,
  );

  return {
    lengkap,
    endpoint: endpoint.nilai,
    bucket: bucket.nilai,
    region: region.nilai,
    accessKeyId: accessKeyId.nilai,
    secretAccessKey: secretAccessKey.nilai,
    prefix: (prefix.nilai ?? "").replace(/\/+$/, ""),
    publicUrl: (publicUrl.nilai ?? "").replace(/\/+$/, ""),
    namaTerdeteksi: {
      endpoint: endpoint.nama,
      bucket: bucket.nama,
      region: region.nama,
      accessKeyId: accessKeyId.nama,
      secretAccessKey: secretAccessKey.nama,
      prefix: prefix.nama,
      publicUrl: publicUrl.nama,
    },
  };
}

let klien = null;

function s3() {
  if (klien) return klien;
  const k = konfigurasi();
  if (!k.lengkap) throw new Error("Penyimpanan berkas belum aktif untuk proyek ini.");
  klien = new S3Client({
    region: k.region || "auto",
    endpoint: k.endpoint,
    forcePathStyle: Boolean(k.endpoint),
    credentials: { accessKeyId: k.accessKeyId, secretAccessKey: k.secretAccessKey },
  });
  return klien;
}

/** Galat karena isi permintaan tidak sesuai (bukan kesalahan server). */
function galatPengguna(pesan, status = 400) {
  const e = new Error(pesan);
  e.status = status;
  return e;
}

/** Ukuran berkas terbesar yang diterima (byte). */
const BATAS_UKURAN = 25 * 1024 * 1024;

const JENIS_DIIZINKAN = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

const namaAman = (nama) =>
  String(nama || "berkas")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-80);

/** Kunci penyimpanan: selalu di dalam folder proyek (STORAGE_PREFIX). */
function buatKunci(folder, nama, tipe) {
  const k = konfigurasi();
  const bersih = String(folder || "umum").replace(/[^a-z0-9\-_/]+/gi, "").replace(/^\/+|\/+$/g, "") || "umum";
  const ekstensi = JENIS_DIIZINKAN[tipe] ?? (namaAman(nama).split(".").pop() || "bin");
  const acak = crypto.randomBytes(6).toString("hex");
  const dasar = namaAman(nama).replace(/\.[a-z0-9]+$/, "") || "berkas";
  const bagian = [k.prefix, bersih, `${Date.now().toString(36)}-${acak}-${dasar}.${ekstensi}`].filter(Boolean);
  return bagian.join("/");
}

function alamatPublik(kunci) {
  const k = konfigurasi();
  return k.publicUrl ? `${k.publicUrl}/${kunci}` : `/${kunci}`;
}

async function unggah({ nama, tipe, data, folder, alt, keterangan }) {
  const k = konfigurasi();
  if (!k.lengkap) throw galatPengguna("Penyimpanan berkas belum aktif untuk proyek ini.");
  const jenis = JENIS_DIIZINKAN[tipe];
  if (!jenis) throw galatPengguna("Jenis berkas tidak diizinkan. Gunakan JPG, PNG, WEBP, GIF, SVG, atau PDF.");

  const isi = Buffer.from(String(data || ""), "base64");
  if (isi.length === 0) throw galatPengguna("Berkas kosong atau tidak terbaca.");
  if (isi.length > BATAS_UKURAN)
    throw galatPengguna("Ukuran berkas lebih dari 25 MB. Perkecil dulu gambarnya.", 413);

  const kunci = buatKunci(folder, nama, tipe);
  await s3().send(
    new PutObjectCommand({ Bucket: k.bucket, Key: kunci, Body: isi, ContentType: tipe, CacheControl: "public, max-age=31536000" }),
  );
  return { kunci, url: alamatPublik(kunci), ukuran: isi.length, tipe, nama: namaAman(nama), alt, keterangan };
}

async function hapus(kunci) {
  const k = konfigurasi();
  if (!k.lengkap || !kunci) return false;
  await s3().send(new DeleteObjectCommand({ Bucket: k.bucket, Key: kunci }));
  return true;
}

/** Keterangan singkat untuk pemeriksaan (tanpa nilai rahasia). */
function status() {
  const k = konfigurasi();
  return {
    aktif: k.lengkap,
    awalan: k.prefix || null,
    alamat_publik: k.publicUrl || null,
    variabel: k.namaTerdeteksi,
  };
}

module.exports = { unggah, hapus, status, konfigurasi, JENIS_DIIZINKAN, BATAS_UKURAN };
