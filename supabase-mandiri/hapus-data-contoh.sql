-- =====================================================================================
--  HAPUS SELURUH DATA CONTOH
-- =====================================================================================
--  Jalankan berkas ini SEKALI di SQL Editor database Anda untuk membersihkan semua
--  data contoh (berita, artikel, santri, donasi, galeri, iklan, dan lain-lain).
--
--  Yang DIPERTAHANKAN (tidak dihapus):
--    * pengguna            — akun admin panel (PIN 8081) dan akun lain yang sudah dibuat
--    * admin_unit_sekolah  — PIN login tiap unit/sekolah
--    * pengaturan          — konfigurasi sistem (termasuk PIN Admin ZIS)
--    * situs & profil      — identitas lembaga (nama, alamat, logo, visi-misi)
--    * sesi & sesi_unit    — sesi login yang sedang berjalan
--
--  Setelah dijalankan, seluruh angka dan daftar di situs berasal dari data asli
--  yang Anda isi sendiri lewat panel admin.
-- =====================================================================================

do $$
declare
  t record;
  -- Daftar tabel yang TIDAK boleh dikosongkan.
  aman text[] := array[
    'pengguna',
    'admin_unit_sekolah',
    'pengaturan',
    'situs',
    'profil',
    'sesi',
    'sesi_unit'
  ];
begin
  for t in
    select tablename
      from pg_tables
     where schemaname = 'public'
       and tablename <> all (aman)
  loop
    execute format('delete from public.%I', t.tablename);
  end loop;
end $$;

-- Tandai benih sudah terisi supaya data contoh tidak pernah diisi ulang oleh aplikasi.
insert into pengaturan (kunci, nilai, kelompok)
values ('benih', '{"versi": "v4"}'::jsonb, 'sistem')
on conflict (kunci) do update set nilai = excluded.nilai;
