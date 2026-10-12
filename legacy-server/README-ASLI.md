# PC Persis Cibatu — Situs & Panel Lembaga

Situs resmi **Pimpinan Cabang Persatuan Islam (PERSIS) Cibatu – Garut** beserta panel pengurusnya.
Tampilannya dirancang seperti aplikasi ponsel (lebar 390 × 844) dan seluruh teksnya berbahasa Indonesia.

## Isi situs

- **Halaman publik**: Beranda, Profil, Jenjang pendidikan, PPDB/SPMB (formulir pendaftaran daring),
  Berita, Artikel, Kajian, Galeri, Pengumuman, Agenda, Donasi (ZIS), dan Kontak.
- **Portal wali santri**: masuk dengan PIN wali untuk melihat nilai, tagihan, setoran tahfidz, dan
  membayar tagihan dengan bukti pembayaran.
- **Panel Admin Pusat**: identitas lembaga, jenjang, unit pendidikan, pimpinan, berita, artikel,
  pengumuman, agenda, kajian, galeri, iklan, menu beranda, notifikasi, dan akun.
- **Panel unit (PIN sekolah/kampus)**: Admin PMB, Admin Sekolah (siswa, nilai, tahfidz, mata pelajaran,
  alumni), Admin Tata Usaha (kategori tagihan, tagihan, pembayaran, tunggakan, metode pembayaran),
  dan Admin ZIS (program donasi, kategori, donatur, metode pembayaran, laporan penyaluran).

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Tampilan | React 19 + Vite 6 + TypeScript + Tailwind CSS 4 |
| Server | Node.js + Express 4 + `pg` (CommonJS) |
| Basis data | PostgreSQL (`DATABASE_URL`) — skema di `server/db/skema.sql` |
| Berkas | Penyimpanan objek S3 (`STORAGE_*`) untuk logo, gambar, dan bukti pembayaran |

## Menjalankan di komputer sendiri

```bash
# tampilan
npm install
npm run dev          # http://localhost:5173

# server (terminal lain)
cd server
npm install
npm start            # http://localhost:41001
```

Variabel lingkungan yang dibutuhkan server:

- `DATABASE_URL` — sambungan PostgreSQL
- `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`,
  `STORAGE_PREFIX`, `STORAGE_PUBLIC_URL` — penyimpanan berkas

Menyiapkan basis data baru:

```bash
cd server
node db/jalankan.js --skema     # membuat seluruh tabel dan mengisi data awal
```

## Susunan folder

```
src/               tampilan (halaman publik, portal wali, panel admin)
  components/      komponen bersama (ikon, form, kartu)
  lib/             pemanggilan API dan jenis data
  pages/           halaman per bagian
server/            server API Express
  db/              skema basis data, perubahan, dan data awal
  lib/             bantuan bersama (sesi, penyimpanan berkas, satuan unit)
  ruang-*.js       rute API per bagian
public/            gambar statis (logo, favicon)
```

## Catatan keamanan

- PIN panel admin bawaan **wajib diganti** lewat menu Akun → Ubah PIN panel setelah pemasangan.
- PIN unit sekolah/kampus dan PIN Admin ZIS diatur dari **Panel Admin → Unit**.
- Data wali santri dibuka memakai PIN wali; jangan bagikan PIN kepada orang lain.
- Berkas rahasia (`.env`, `.env.mythex`) tidak ikut disimpan di repositori ini.
