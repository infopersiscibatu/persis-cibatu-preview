# Terbit di Vercel + Supabase sendiri

## 1. Siapkan Supabase
1. Buat proyek baru di supabase.com.
2. Buka **SQL Editor**, tempel seluruh isi `supabase-mandiri/setup.sql`, lalu **Run** (sekali saja).
   Ini membuat semua tabel, mengunci akses (hanya server), fungsi `jalankan_sql`, dan bucket privat `media`.
3. Data awal (berita, sekolah, akun bawaan) terisi otomatis saat situs pertama kali dibuka.
4. Catat dari **Project Settings → API**: Project URL, kunci `anon/publishable`, kunci `service_role/secret`.

## 2. Siapkan Vercel
1. Hubungkan repositori GitHub proyek ini ke Vercel (Framework: Other; Build: `npm run build`).
2. Isi **Environment Variables**:

| Nama | Isi |
|---|---|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | kunci anon/publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | kunci service_role/secret (rahasia!) |
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | kunci anon/publishable |
| `PUBLIC_CONTACT_EMAIL` | (opsional) email kontak untuk notifikasi HP |
| `PUSH_TOKEN` | (opsional) token kirim notifikasi manual |

3. Deploy. Keluaran Vercel dipilih otomatis saat dibangun di Vercel.

## 3. Setelah online
- Masuk admin (PIN bawaan 8081) dan **segera ganti PIN** admin, unit, dan wali.
- Pengguna perlu mengizinkan notifikasi HP lagi (kunci notifikasi baru dibuat di database baru).
- Data yang sudah diisi di database lama tidak ikut pindah otomatis.
