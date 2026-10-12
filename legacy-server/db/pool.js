/**
 * Sambungan database bersama untuk seluruh layanan.
 * Tidak menyimpan sambungan menganggur terlalu lama: layanan yang tidur akan
 * kehilangan sambungannya, jadi setiap kueri dicoba ulang sekali bila gagal.
 */
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL belum tersedia — layanan tidak bisa dijalankan.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 4,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 15000,
  ssl: /sslmode=require/.test(DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (e) => console.error("Kesalahan koneksi database:", e.message));

const PESAN_TIDUR = /Connection terminated|ECONNRESET|EPIPE|terminating connection|client has encountered a connection error|Connection ended/i;

/** Kueri dengan satu kali percobaan ulang saat sambungan sempat tidur. */
async function tanya(sql, params = []) {
  try {
    return await pool.query(sql, params);
  } catch (e) {
    if (!PESAN_TIDUR.test(String(e && e.message))) throw e;
    await new Promise((r) => setTimeout(r, 250));
    return pool.query(sql, params);
  }
}

module.exports = { pool, tanya };
