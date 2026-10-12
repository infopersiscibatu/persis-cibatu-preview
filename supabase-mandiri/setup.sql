-- PC PERSIS Cibatu: penyiapan database lengkap untuk proyek Supabase baru.
-- Jalankan SEKALI di SQL Editor. Data awal terisi otomatis saat situs pertama dibuka.

-- ===== skema.sql =====
-- =====================================================================================
--  Skema database PC PERSIS Cibatu
--  Seluruh isi situs disimpan di sini supaya bisa diubah dari halaman admin.
--  Bersifat idempoten: aman dijalankan berulang kali.
-- =====================================================================================

-- Aturan umum:
--   * Tabel isi (konten) memakai id teks seperti "nw-1" agar sama dengan data awal situs.
--   * Tabel catatan (pendaftar, pembayaran, aktivitas) memakai bigserial.
--   * Kolom diperbarui diisi otomatis oleh trigger.

-- -------------------------------------------------------------------------------------
-- 1. Fungsi bantu
-- -------------------------------------------------------------------------------------
create or replace function set_diperbarui() returns trigger as $$
begin
  new.diperbarui := now();
  return new;
end;
$$ language plpgsql;

-- -------------------------------------------------------------------------------------
-- 2. Identitas & pengaturan situs
-- -------------------------------------------------------------------------------------
create table if not exists pengguna (
  id              text primary key,
  nama            text not null,
  nama_pengguna   text unique,
  email           text unique,
  telepon         text,
  kata_sandi_hash text,
  peran           text not null default 'editor'
                  check (peran in ('admin','admin_unit','editor','bendahara','guru','wali','santri')),
  -- Unit kerja untuk akun login halaman unit (spmb / sekolah / tata-usaha / zis).
  unit_kerja      text,
  aktif           boolean not null default true,
  avatar_media_id text,
  terakhir_masuk  timestamptz,
  dibuat          timestamptz not null default now(),
  diperbarui      timestamptz not null default now()
);
create index if not exists idx_pengguna_peran on pengguna (peran) where aktif;

create table if not exists media (
  id           text primary key,
  kunci        text unique not null,          -- nama berkas di dalam penyimpanan
  url          text not null,                 -- alamat publik berkas
  nama_asli    text,
  tipe         text,                          -- image/jpeg, application/pdf, ...
  ukuran       bigint,
  lebar        integer,
  tinggi       integer,
  folder       text not null default 'umum',
  alt          text,
  keterangan   text,
  pengunggah_id text,
  dibuat       timestamptz not null default now(),
  diperbarui   timestamptz not null default now()
);
create index if not exists idx_media_folder on media (folder, dibuat desc);

create table if not exists situs (
  id               text primary key default 'utama',
  pimpinan         text not null default 'Pimpinan Cabang',
  nama             text not null default 'Persatuan Islam (PERSIS)',
  nama_lengkap     text not null default 'Persatuan Islam (PERSIS) Cibatu',
  singkatan        text not null default 'PERSIS',
  wilayah          text default 'Cibatu – Garut',
  wilayah_lengkap  text default 'Cibatu · Garut · Jawa Barat',
  alamat           text,
  telepon          text,
  whatsapp         text,
  email            text,
  jam_layanan      text,
  logo_url         text default '/logo-persis.png',
  logo_media_id    text references media(id) on delete set null,
  favicon_url      text,
  meta_judul       text,
  meta_deskripsi   text,
  og_gambar_media_id text references media(id) on delete set null,
  dibuat           timestamptz not null default now(),
  diperbarui       timestamptz not null default now()
);

create table if not exists pengaturan (
  kunci      text primary key,
  nilai      jsonb not null default '{}'::jsonb,
  kelompok   text not null default 'umum',
  keterangan text,
  diperbarui timestamptz not null default now()
);
create index if not exists idx_pengaturan_kelompok on pengaturan (kelompok);

-- -------------------------------------------------------------------------------------
-- 3. Akun, sesi, dan catatan aktivitas
-- -------------------------------------------------------------------------------------
create table if not exists sesi (
  token       text primary key,
  pengguna_id text not null references pengguna(id) on delete cascade,
  kedaluwarsa timestamptz not null,
  alamat_ip   text,
  agen        text,
  dibuat      timestamptz not null default now()
);
create index if not exists idx_sesi_pengguna on sesi (pengguna_id);

create table if not exists aktivitas (
  id          bigserial primary key,
  pengguna_id text references pengguna(id) on delete set null,
  aksi        text not null,
  entitas     text,
  entitas_id  text,
  ringkasan   text,
  data        jsonb,
  dibuat      timestamptz not null default now()
);
create index if not exists idx_aktivitas_dibuat on aktivitas (dibuat desc);

-- -------------------------------------------------------------------------------------
-- 4. Media / berkas unggahan (storage)
-- -------------------------------------------------------------------------------------
-- -------------------------------------------------------------------------------------
-- 5. Beranda: sorotan, statistik, menu, tautan sosial
-- -------------------------------------------------------------------------------------
create table if not exists hero_slide (
  id          text primary key,
  urutan      integer not null default 0,
  tag         text,
  judul       text not null,
  teks        text,
  gambar_url  text,
  media_id    text references media(id) on delete set null,
  tombol_label text,
  tombol_halaman text,
  aktif       boolean not null default true,
  dibuat      timestamptz not null default now(),
  diperbarui  timestamptz not null default now()
);

create table if not exists statistik (
  id         text primary key,
  urutan     integer not null default 0,
  ikon       text default 'users',
  label      text not null,
  label_pendek text,
  nilai      text not null,
  satuan     text,
  catatan    text,
  tone       text default 'green',
  -- Sumber hitungan otomatis: 'jenjang', 'siswa', atau 'mahasiswa'.
  -- Bila diisi, angka pada kartu statistik beranda dihitung dari tabel terkait.
  sumber     text,
  aktif      boolean not null default true,
  diperbarui timestamptz not null default now()
);

create table if not exists menu_cepat (
  id         text primary key,
  urutan     integer not null default 0,
  label      text not null,
  keterangan text,
  ikon       text default 'circle',
  tone       text default 'green',
  halaman    text not null,
  lencana    text,
  aktif      boolean not null default true,
  diperbarui timestamptz not null default now()
);

create table if not exists tautan_sosial (
  id     text primary key,
  urutan integer not null default 0,
  nama   text not null,
  url    text not null,
  ikon   text,
  aktif  boolean not null default true
);

-- -------------------------------------------------------------------------------------
-- 6. Profil lembaga & pengurus
-- -------------------------------------------------------------------------------------
create table if not exists profil (
  id           text primary key default 'utama',
  gambar_url   text,
  media_id     text references media(id) on delete set null,
  gambar_alt   text,
  ringkasan    jsonb not null default '[]'::jsonb,
  motto        text,
  periode      text,
  visi         text,
  misi         jsonb not null default '[]'::jsonb,
  sejarah      jsonb not null default '[]'::jsonb,
  diperbarui   timestamptz not null default now()
);

create table if not exists pengurus (
  id         text primary key,
  urutan     integer not null default 0,
  nama       text not null,
  jabatan    text not null,
  bidang     text,
  periode    text,
  foto_media_id text references media(id) on delete set null,
  aktif      boolean not null default true,
  diperbarui timestamptz not null default now()
);

-- Halaman statis tambahan (dibuat admin bila perlu).
create table if not exists halaman (
  id         text primary key,
  slug       text unique not null,
  judul      text not null,
  ringkasan  text,
  isi        jsonb not null default '[]'::jsonb,
  urutan     integer not null default 0,
  aktif      boolean not null default true,
  dibuat     timestamptz not null default now(),
  diperbarui timestamptz not null default now()
);

-- -------------------------------------------------------------------------------------
-- 7. Pendidikan: jenjang, unit, jurusan
-- -------------------------------------------------------------------------------------
create table if not exists jenjang (
  id         text primary key,
  slug       text unique not null,
  singkatan  text,
  nama       text not null,
  tagline    text,
  rentang    text,
  pimpinan_label text,
  jumlah     text,
  satuan     text,
  lokasi     text,
  tone       text default 'green',
  gambar_url text,
  media_id   text references media(id) on delete set null,
  intro      text,
  fasilitas  jsonb not null default '[]'::jsonb,
  istilah    jsonb not null default '{}'::jsonb,
  urutan     integer not null default 0,
  hitung_jenjang boolean not null default true,
  aktif      boolean not null default true,
  diperbarui timestamptz not null default now()
);

create table if not exists unit_pendidikan (
  id            text primary key,
  jenjang_id    text not null references jenjang(id) on delete cascade,
  slug          text unique not null,
  nomor         text,
  nama          text not null,
  daerah        text,
  alamat        text,
  pimpinan      text,
  jumlah_peserta integer default 0,
  rombel        integer default 0,
  guru          integer default 0,
  akreditasi    text,
  kontak        text,
  email         text,
  npsn          text,
  berdiri       integer,
  jam           text,
  gambar_url    text,
  media_id      text references media(id) on delete set null,
  jurusan       jsonb not null default '[]'::jsonb,
  ekstrakurikuler jsonb not null default '[]'::jsonb,
  aktif         boolean not null default true,
  diperbarui    timestamptz not null default now()
);
create index if not exists idx_unit_jenjang on unit_pendidikan (jenjang_id);

create table if not exists jurusan (
  id         text primary key,
  jenjang_id text not null references jenjang(id) on delete cascade,
  slug       text not null,
  singkatan  text,
  nama       text not null,
  intro      text,
  fokus      jsonb not null default '[]'::jsonb,
  gambar_url text,
  ukt        text,
  urutan     integer not null default 0,
  aktif      boolean not null default true,
  diperbarui timestamptz not null default now(),
  unique (jenjang_id, slug)
);

-- -------------------------------------------------------------------------------------
-- 8. Kategori (berita, artikel, pengumuman, agenda, kajian, galeri)
-- -------------------------------------------------------------------------------------
create table if not exists kategori (
  id     text primary key,
  jenis  text not null check (jenis in ('berita','artikel','pengumuman','agenda','kajian','galeri','donasi')),
  nama   text not null,
  slug   text not null,
  urutan integer not null default 0,
  aktif  boolean not null default true,
  unique (jenis, slug)
);

-- -------------------------------------------------------------------------------------
-- 9. Berita, artikel, pengumuman, agenda, kajian
-- -------------------------------------------------------------------------------------
create table if not exists berita (
  id         text primary key,
  slug       text unique not null,
  judul      text not null,
  tanggal    date not null default current_date,
  kategori   text,
  penulis    text,
  gambar_url text,
  media_id   text references media(id) on delete set null,
  dibaca     integer not null default 0,
  ringkasan  text,
  isi        jsonb not null default '[]'::jsonb,
  sorotan    boolean not null default false,
  terbit     boolean not null default true,
  terbit_pada timestamptz default now(),
  dibuat     timestamptz not null default now(),
  diperbarui timestamptz not null default now()
);
create index if not exists idx_berita_tanggal on berita (tanggal desc);
create index if not exists idx_berita_dibaca on berita (dibaca desc);
create index if not exists idx_berita_kategori on berita (kategori);

create table if not exists artikel (
  id         text primary key,
  slug       text unique not null,
  judul      text not null,
  kategori   text,
  penulis    text,
  tanggal    date not null default current_date,
  menit_baca integer not null default 3,
  dibaca     integer not null default 0,
  gambar_url text,
  media_id   text references media(id) on delete set null,
  ringkasan  text,
  isi        jsonb not null default '[]'::jsonb,
  terbit     boolean not null default true,
  dibuat     timestamptz not null default now(),
  diperbarui timestamptz not null default now()
);
create index if not exists idx_artikel_tanggal on artikel (tanggal desc);
create index if not exists idx_artikel_dibaca on artikel (dibaca desc);

create table if not exists pengumuman (
  id         text primary key,
  judul      text not null,
  tanggal    date not null default current_date,
  kategori   text,
  ringkasan  text,
  isi        jsonb not null default '[]'::jsonb,
  disematkan boolean not null default false,
  dibaca     integer not null default 0,
  lampiran_media_id text references media(id) on delete set null,
  terbit     boolean not null default true,
  berlaku_sampai date,
  dibuat     timestamptz not null default now(),
  diperbarui timestamptz not null default now()
);
create index if not exists idx_pengumuman_tanggal on pengumuman (tanggal desc);
create index if not exists idx_pengumuman_disematkan on pengumuman (disematkan desc, tanggal desc);

create table if not exists agenda (
  id         text primary key,
  judul      text not null,
  tanggal    date not null,
  waktu      text,
  tempat     text,
  tag        text,
  isi        jsonb not null default '[]'::jsonb,
  media_id   text references media(id) on delete set null,
  terbit     boolean not null default true,
  dibuat     timestamptz not null default now(),
  diperbarui timestamptz not null default now()
);
create index if not exists idx_agenda_tanggal on agenda (tanggal);

create table if not exists kajian (
  id         text primary key,
  judul      text not null,
  ustadz     text,
  hari       text,
  tanggal    date,
  waktu      text,
  tempat     text,
  kitab      text,
  kategori   text,
  ringkasan  text,
  media_id   text references media(id) on delete set null,
  langsung   boolean not null default false,   -- siaran/pekan ini
  terbit     boolean not null default true,
  dibuat     timestamptz not null default now(),
  diperbarui timestamptz not null default now()
);
create index if not exists idx_kajian_tanggal on kajian (tanggal);

create table if not exists kajian_rutin (
  id         text primary key,
  urutan     integer not null default 0,
  hari       text not null,
  waktu      text,
  judul      text not null,
  ustadz     text,
  tempat     text,
  peserta    text,
  aktif      boolean not null default true,
  diperbarui timestamptz not null default now()
);

-- -------------------------------------------------------------------------------------
-- 10. Galeri
-- -------------------------------------------------------------------------------------
create table if not exists galeri_album (
  id         text primary key,
  slug       text unique not null,
  nama       text not null,
  keterangan text,
  gambar_url text,
  media_id   text references media(id) on delete set null,
  urutan     integer not null default 0,
  aktif      boolean not null default true,
  diperbarui timestamptz not null default now()
);

create table if not exists galeri_foto (
  id         text primary key,
  album_id   text references galeri_album(id) on delete set null,
  judul      text not null,
  gambar_url text,
  media_id   text references media(id) on delete set null,
  tanggal    date not null default current_date,
  urutan     integer not null default 0,
  aktif      boolean not null default true,
  diperbarui timestamptz not null default now()
);
create index if not exists idx_galeri_foto_album on galeri_foto (album_id, tanggal desc);

-- -------------------------------------------------------------------------------------
-- 11. SPMB (penerimaan murid & mahasiswa baru)
-- -------------------------------------------------------------------------------------
create table if not exists spmb_info (
  id         text primary key default 'utama',
  judul      text not null default 'SPMB',
  pengantar  text,
  catatan    text,
  wa_admin   text,
  form_aktif boolean not null default true,
  diperbarui timestamptz not null default now()
);

create table if not exists spmb_gelombang (
  id      text primary key,
  urutan  integer not null default 0,
  nama    text not null,
  periode text,
  mulai   date,
  selesai date,
  kuota   text,
  sisa    text,
  status  text default 'Dibuka',
  aktif   boolean not null default true,
  unique (nama)
);

create table if not exists spmb_biaya (
  id     text primary key,
  urutan integer not null default 0,
  label  text not null,
  nilai  text,
  aktif  boolean not null default true
);

create table if not exists spmb_persyaratan (
  id         text primary key,
  urutan     integer not null default 0,
  teks       text not null,
  jenjang_id text references jenjang(id) on delete cascade,
  wajib      boolean not null default true,
  aktif      boolean not null default true
);

create table if not exists spmb_tahapan (
  id         text primary key,
  urutan     integer not null default 0,
  nama       text not null,
  keterangan text,
  media_id   text references media(id) on delete set null,
  aktif      boolean not null default true
);

create table if not exists spmb_pendaftar (
  id            bigserial primary key,
  nomor         text unique,
  nama          text not null,
  jenjang_id    text references jenjang(id) on delete set null,
  unit_id       text references unit_pendidikan(id) on delete set null,
  jenis_kelamin text,
  tempat_lahir  text,
  tanggal_lahir date,
  asal_sekolah  text,
  nama_wali     text,
  telepon       text,
  email         text,
  alamat        text,
  catatan       text,
  berkas        jsonb not null default '[]'::jsonb,
  status        text not null default 'baru'
                check (status in ('baru','diverifikasi','diterima','ditolak','batal')),
  gelombang_id  text references spmb_gelombang(id) on delete set null,
  dibuat        timestamptz not null default now(),
  diperbarui    timestamptz not null default now()
);
create index if not exists idx_pendaftar_status on spmb_pendaftar (status, dibuat desc);

-- -------------------------------------------------------------------------------------
-- 12. Akademik: tahun ajaran, santri, mata pelajaran, nilai, tahfizh
-- -------------------------------------------------------------------------------------
create table if not exists tahun_ajaran (
  id       text primary key,
  nama     text not null,
  semester text,
  mulai    date,
  selesai  date,
  aktif    boolean not null default false
);

create table if not exists santri (
  id            text primary key,
  nis           text unique,
  nisn          text,
  nama          text not null,
  jenjang_id    text references jenjang(id) on delete set null,
  unit_id       text references unit_pendidikan(id) on delete set null,
  kelas         text,
  program       text,
  jenis_kelamin text check (jenis_kelamin in ('L','P')),
  tanggal_lahir date,
  tahun_masuk   integer,
  status        text not null default 'aktif'
                check (status in ('aktif','lulus','pindah','nonaktif','calon')),
  wali_nama     text,
  wali_telepon  text,
  wali_pengguna_id text references pengguna(id) on delete set null,
  foto_media_id text references media(id) on delete set null,
  catatan       text,
  dibuat        timestamptz not null default now(),
  diperbarui    timestamptz not null default now()
);
create index if not exists idx_santri_unit on santri (unit_id, kelas);
create index if not exists idx_santri_wali on santri (wali_pengguna_id);

-- Admin unit per sekolah: satu PIN untuk masuk ke halaman SPMB, Sekolah, dan
-- Tata Usaha sekolah tersebut. Nama pengurus tiap unit dicatat di kolomnya.
create table if not exists admin_unit_sekolah (
  unit_id       text primary key references unit_pendidikan(id) on delete cascade,
  pin           text not null,
  admin_spmb    text,
  admin_sekolah text,
  admin_tu      text,
  aktif         boolean not null default true,
  diperbarui    timestamptz not null default now()
);

-- Sesi login halaman unit (SPMB / Sekolah / Tata Usaha / ZIS).
create table if not exists sesi_unit (
  token       text primary key,
  unit_id     text,
  kode        text not null,
  kedaluwarsa timestamptz not null,
  dibuat      timestamptz not null default now()
);
create index if not exists idx_sesi_unit_kode on sesi_unit (kode);

create table if not exists mata_pelajaran (
  id         text primary key,
  nama       text not null,
  kode       text,
  jenjang_id text references jenjang(id) on delete set null,
  kelompok   text,
  aktif      boolean not null default true,
  unique (nama, jenjang_id)
);

create table if not exists nilai (
  id              bigserial primary key,
  santri_id       text not null references santri(id) on delete cascade,
  mapel_id        text not null references mata_pelajaran(id) on delete cascade,
  tahun_ajaran_id text references tahun_ajaran(id) on delete set null,
  semester        text,
  nilai           numeric(5,2) not null,
  predikat        text,
  catatan         text,
  dinilai_oleh    text,
  diperbarui      timestamptz not null default now(),
  unique (santri_id, mapel_id, semester)
);
create index if not exists idx_nilai_santri on nilai (santri_id);

create table if not exists tahfidz_target (
  id          text primary key,
  santri_id   text not null references santri(id) on delete cascade,
  capaian     text,
  target      text,
  persen      integer not null default 0,
  target_juz  integer,
  pembimbing  text,
  jadwal      text,
  tempat      text,
  diperbarui  timestamptz not null default now(),
  unique (santri_id)
);

create table if not exists setoran_tahfidz (
  id         text primary key,
  santri_id  text not null references santri(id) on delete cascade,
  tanggal    date not null default current_date,
  juz        integer,
  -- Surat dan rentang ayat yang disetor, dipilih dari daftar 114 surat.
  surah      integer,
  ayat_mulai integer,
  ayat_selesai integer,
  materi     text not null,
  jenis      text,
  penilai    text,
  nilai      text,
  catatan    text,
  diperbarui timestamptz not null default now()
);
create index if not exists idx_setoran_santri on setoran_tahfidz (santri_id, tanggal desc);

-- Alumni: lulusan yang sudah tercatat (data contoh, diisi lewat halaman admin).
create table if not exists alumni (
  id          text primary key,
  nis         text,
  nama        text not null,
  jenjang_id  text references jenjang(id) on delete set null,
  unit_id     text references unit_pendidikan(id) on delete set null,
  tahun_lulus integer,
  pekerjaan   text,
  instansi    text,
  kota        text,
  telepon     text,
  catatan     text,
  aktif       boolean not null default true,
  dibuat      timestamptz not null default now(),
  diperbarui  timestamptz not null default now()
);
create index if not exists idx_alumni_tahun on alumni (tahun_lulus desc);
create index if not exists idx_alumni_unit on alumni (unit_id);

-- -------------------------------------------------------------------------------------
-- 13. Keuangan wali santri: metode bayar, tagihan, pembayaran
-- -------------------------------------------------------------------------------------
create table if not exists metode_pembayaran (
  id         text primary key,
  urutan     integer not null default 0,
  nama       text not null,
  keterangan text,
  bank       text,
  nomor      text,
  atas_nama  text,
  langkah    jsonb not null default '[]'::jsonb,
  aktif      boolean not null default true,
  diperbarui timestamptz not null default now()
);

create table if not exists tagihan (
  id              text primary key,
  santri_id       text not null references santri(id) on delete cascade,
  jenis           text,
  label           text not null,
  keterangan      text,
  jumlah          numeric(14,2) not null default 0,
  jatuh_tempo     date,
  tahun_ajaran_id text references tahun_ajaran(id) on delete set null,
  status          text not null default 'belum'
                  check (status in ('belum','menunggu','lunas','batal')),
  dibuat          timestamptz not null default now(),
  diperbarui      timestamptz not null default now()
);
create index if not exists idx_tagihan_santri on tagihan (santri_id, status);

create table if not exists pembayaran (
  id             bigserial primary key,
  santri_id      text not null references santri(id) on delete cascade,
  tagihan_id     text references tagihan(id) on delete set null,
  label          text,
  jumlah         numeric(14,2) not null default 0,
  metode_id      text references metode_pembayaran(id) on delete set null,
  metode         text,
  bukti_media_id text references media(id) on delete set null,
  status         text not null default 'menunggu'
                 check (status in ('menunggu','terverifikasi','ditolak')),
  catatan        text,
  diverifikasi_oleh text references pengguna(id) on delete set null,
  dibayar_pada   date default current_date,
  diverifikasi_pada timestamptz,
  dibuat         timestamptz not null default now(),
  diperbarui     timestamptz not null default now()
);
create index if not exists idx_pembayaran_santri on pembayaran (santri_id, status);
create index if not exists idx_pembayaran_status on pembayaran (status, dibuat desc);

-- -------------------------------------------------------------------------------------
-- 14. Donasi, infak, dan wakaf
-- -------------------------------------------------------------------------------------
create table if not exists donasi_program (
  id         text primary key,
  slug       text unique not null,
  judul      text not null,
  kategori   text,
  gambar_url text,
  media_id   text references media(id) on delete set null,
  target     numeric(16,2) not null default 0,
  terkumpul  numeric(16,2) not null default 0,
  jumlah_donatur integer not null default 0,
  batas      date,
  ringkasan  text,
  pengelola  text,
  isi        jsonb not null default '[]'::jsonb,
  rincian    jsonb not null default '[]'::jsonb,
  aktif      boolean not null default true,
  dibuat     timestamptz not null default now(),
  diperbarui timestamptz not null default now()
);
create index if not exists idx_donasi_program_aktif on donasi_program (aktif, batas);

create table if not exists donasi_metode (
  id         text primary key,
  urutan     integer not null default 0,
  nama       text not null,
  keterangan text,
  langkah    jsonb not null default '[]'::jsonb,
  aktif      boolean not null default true
);

create table if not exists donasi_rekening (
  id        text primary key,
  urutan    integer not null default 0,
  bank      text not null,
  nomor     text not null,
  atas_nama text,
  aktif     boolean not null default true
);

create table if not exists donasi_donatur (
  id         text primary key,
  program_id text not null references donasi_program(id) on delete cascade,
  nama       text not null,
  jumlah     numeric(16,2) not null default 0,
  metode     text,
  waktu      text,
  tampil     boolean not null default true
);
create index if not exists idx_donatur_program on donasi_donatur (program_id);

create table if not exists donasi_riwayat (
  id         text primary key,
  program_id text not null references donasi_program(id) on delete cascade,
  urutan     integer not null default 0,
  tanggal    text,
  judul      text not null,
  keterangan text
);
create index if not exists idx_riwayat_program on donasi_riwayat (program_id, urutan);

create table if not exists donasi (
  id             bigserial primary key,
  program_id     text references donasi_program(id) on delete set null,
  nama           text,
  telepon        text,
  email          text,
  jumlah         numeric(16,2) not null default 0,
  metode_id      text references donasi_metode(id) on delete set null,
  metode         text,
  pesan          text,
  anonim         boolean not null default false,
  bukti_media_id text references media(id) on delete set null,
  status         text not null default 'menunggu'
                 check (status in ('menunggu','dikonfirmasi','ditolak')),
  dicatat_oleh   text references pengguna(id) on delete set null,
  dibuat         timestamptz not null default now(),
  diperbarui     timestamptz not null default now()
);
create index if not exists idx_donasi_program on donasi (program_id, status);

-- -------------------------------------------------------------------------------------
-- 15. Kontak
-- -------------------------------------------------------------------------------------
create table if not exists topik_kontak (
  id     text primary key,
  urutan integer not null default 0,
  teks   text not null,
  aktif  boolean not null default true
);

create table if not exists kontak_unit (
  id         text primary key,
  urutan     integer not null default 0,
  nama       text not null,
  keterangan text,
  telepon    text,
  whatsapp   text,
  jam        text,
  aktif      boolean not null default true
);

create table if not exists pesan_kontak (
  id            bigserial primary key,
  nama          text not null,
  email         text,
  telepon       text,
  topik         text,
  pesan         text not null,
  status        text not null default 'baru'
                check (status in ('baru','dibaca','dibalas','selesai')),
  catatan       text,
  ditangani_oleh text references pengguna(id) on delete set null,
  dibuat        timestamptz not null default now(),
  diperbarui    timestamptz not null default now()
);
create index if not exists idx_pesan_status on pesan_kontak (status, dibuat desc);

-- -------------------------------------------------------------------------------------
-- 16. Notifikasi & push
-- -------------------------------------------------------------------------------------
create table if not exists notifikasi (
  id            text primary key,
  pengguna_id   text references pengguna(id) on delete cascade,  -- null = siaran
  sasaran       text not null default 'semua'
                check (sasaran in ('semua','wali','santri','guru','pengguna')),
  jenis         text,
  judul         text not null,
  ringkasan     text,
  tautan        text,
  media_id      text references media(id) on delete set null,
  sumber_tabel  text,       -- berita / artikel / pengumuman / agenda / kajian
  sumber_id     text,
  terbit        boolean not null default false,
  terkirim_pada timestamptz,
  jumlah_terkirim integer not null default 0,
  jumlah_gagal    integer not null default 0,
  dibuat        timestamptz not null default now(),
  diperbarui    timestamptz not null default now()
);
create index if not exists idx_notifikasi_terbit on notifikasi (terbit desc, dibuat desc);

create table if not exists notifikasi_dibaca (
  id             bigserial primary key,
  notifikasi_id  text not null references notifikasi(id) on delete cascade,
  pengguna_id    text not null references pengguna(id) on delete cascade,
  dibaca_pada    timestamptz not null default now(),
  unique (notifikasi_id, pengguna_id)
);

create table if not exists push_langganan (
  endpoint    text primary key,
  p256dh      text not null,
  auth        text not null,
  perangkat   text,
  pengguna_id text references pengguna(id) on delete set null,
  dibuat      timestamptz not null default now(),
  diubah      timestamptz not null default now()
);

create table if not exists push_vapid (
  id     integer primary key default 1,
  publik text not null,
  privat text not null,
  dibuat timestamptz not null default now(),
  constraint push_vapid_satu_baris check (id = 1)
);

-- Riwayat notifikasi pribadi wali (tagihan terverifikasi, nilai terbit, tahfidz terbit).
-- Kolom kunci yang unik menjaga agar satu peristiwa tidak diberitakan dua kali.
create table if not exists push_pesan (
  id        text primary key,
  santri_id text references santri(id) on delete cascade,
  jenis     text,
  judul     text not null,
  isi       text,
  tautan    text,
  kunci     text unique,
  terkirim  integer not null default 0,
  gagal     integer not null default 0,
  -- Waktu pesan mulai dikirim. Kosong berarti masih menunggu di antrean push.
  diproses  timestamptz,
  dibuat    timestamptz not null default now()
);
create index if not exists idx_push_pesan_santri on push_pesan (santri_id, dibuat desc);

create table if not exists push_terkirim (
  id     text primary key,
  jenis  text,
  judul  text,
  dikirim timestamptz not null default now()
);

-- -------------------------------------------------------------------------------------
-- 17. Trigger diperbarui
-- -------------------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'situs','pengaturan','pengguna','media','hero_slide','statistik','menu_cepat','profil','pengurus',
    'halaman','jenjang','unit_pendidikan','jurusan','berita','artikel','pengumuman','agenda','kajian',
    'kajian_rutin','galeri_album','galeri_foto','spmb_info','spmb_pendaftar','santri','nilai',
    'tahfidz_target','setoran_tahfidz','alumni','metode_pembayaran','tagihan','pembayaran','donasi_program',
    'donasi','pesan_kontak','notifikasi'
  ]
  loop
    execute format('drop trigger if exists trg_%s_diperbarui on %I', t, t);
    execute format(
      'create trigger trg_%s_diperbarui before update on %I for each row execute function set_diperbarui()',
      t, t
    );
  end loop;
end $$;

-- -------------------------------------------------------------------------------------
-- 18. Tampilan bantu (view) untuk pembacaan cepat
-- -------------------------------------------------------------------------------------
create or replace view v_berita_trending as
  select id, slug, judul, kategori, tanggal, gambar_url, dibaca, ringkasan, penulis
  from berita where terbit order by dibaca desc, tanggal desc;

create or replace view v_pengumuman_terbaru as
  select id, judul, tanggal, kategori, ringkasan, disematkan, dibaca
  from pengumuman where terbit order by disematkan desc, tanggal desc;

create or replace view v_agenda_terdekat as
  select id, judul, tanggal, waktu, tempat, tag from agenda
  where terbit and tanggal >= current_date order by tanggal asc;

create or replace view v_konten_terbaru as
  select 'berita' as jenis, id, judul, ringkasan, tanggal::timestamptz as tanggal, '/#/berita/' || slug as tautan
    from berita where terbit
  union all
  select 'artikel', id, judul, ringkasan, tanggal::timestamptz, '/#/artikel/' || slug
    from artikel where terbit
  union all
  select 'pengumuman', id, judul, ringkasan, tanggal::timestamptz, '/#/beranda/pengumuman/' || id
    from pengumuman where terbit
  order by tanggal desc;

-- -------------------------------------------------------------------------------------
-- 19. Kunci asing susulan (pengguna <-> media)
-- -------------------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_pengguna_avatar') then
    alter table pengguna add constraint fk_pengguna_avatar
      foreign key (avatar_media_id) references media(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fk_media_pengunggah') then
    alter table media add constraint fk_media_pengunggah
      foreign key (pengunggah_id) references pengguna(id) on delete set null;
  end if;
end $$;

-- ===== perubahan.sql =====
-- =====================================================================================
--  Perubahan susulan (migrasi ringan)
--  Semua perintah harus idempoten: pakai "add column if not exists" / "if not exists".
-- =====================================================================================

-- Tabel push sudah ada sebelum skema lengkap disiapkan: lengkapi kolomnya.
alter table push_langganan add column if not exists pengguna_id text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_push_langganan_pengguna') then
    alter table push_langganan add constraint fk_push_langganan_pengguna
      foreign key (pengguna_id) references pengguna(id) on delete set null;
  end if;
end $$;

-- Indeks pencarian teks untuk berita, artikel, dan pengumuman.
create index if not exists idx_berita_cari on berita
  using gin (to_tsvector('simple', coalesce(judul,'') || ' ' || coalesce(ringkasan,'')));
create index if not exists idx_artikel_cari on artikel
  using gin (to_tsvector('simple', coalesce(judul,'') || ' ' || coalesce(ringkasan,'')));
create index if not exists idx_pengumuman_cari on pengumuman
  using gin (to_tsvector('simple', coalesce(judul,'') || ' ' || coalesce(ringkasan,'')));

-- Kolom tambahan pada unit pendidikan (menu Sekolah):
--   status    → status sekolah (mis. Swasta / Negeri)
--   staf      → jumlah guru & tenaga kependidikan di luar pengajar
--   fasilitas → daftar fasilitas milik sekolah tersebut
alter table unit_pendidikan add column if not exists status text default 'Swasta';
alter table unit_pendidikan add column if not exists staf integer default 0;
alter table unit_pendidikan add column if not exists fasilitas jsonb not null default '[]'::jsonb;

-- Program jurusan: kolom penunjang informasi.
alter table jurusan add column if not exists keterangan text;
alter table jurusan add column if not exists diperbarui timestamptz not null default now();

-- -------------------------------------------------------------------------------------
--  Data siswa/mahasiswa awal: DIHAPUS. Tabel santri sengaja dibiarkan kosong supaya
--  seluruh angka di situs berasal dari data asli yang diisi pengelola, bukan data contoh.
-- -------------------------------------------------------------------------------------

-- ---------------------------------------------------------------------------------------
-- Kartu statistik beranda: angka jumlah jenjang, siswa, dan mahasiswa dihitung
-- langsung dari tabel jenjang dan santri supaya selalu sama dengan data terbaru.
-- ---------------------------------------------------------------------------------------
alter table statistik add column if not exists sumber text;

update statistik set sumber = 'jenjang' where id = 'st-1' and sumber is null;
update statistik set sumber = 'siswa' where id = 'st-2' and sumber is null;
update statistik set sumber = 'mahasiswa' where id = 'st-3' and sumber is null;

-- ---------------------------------------------------------------------------------------
-- Sistem login panel admin dan akun login tiap unit kerja
-- ---------------------------------------------------------------------------------------
alter table pengguna add column if not exists unit_kerja text;
create index if not exists idx_pengguna_unit on pengguna (unit_kerja, peran) where aktif;

-- Peran akun unit kerja ('admin_unit') ditambahkan ke batasan peran pengguna.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'pengguna_peran_check') then
    alter table pengguna drop constraint pengguna_peran_check;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pengguna_peran_check') then
    alter table pengguna add constraint pengguna_peran_check
      check (peran in ('admin','admin_unit','editor','bendahara','guru','wali','santri'));
  end if;
end $$;

-- ---------------------------------------------------------------------------------------
-- Admin unit per sekolah: satu PIN untuk semua unit (SPMB, Sekolah, Tata Usaha).
-- Seluruh sekolah yang belum punya baris didaftarkan otomatis dengan PIN acak.
-- ---------------------------------------------------------------------------------------
create table if not exists admin_unit_sekolah (
  unit_id       text primary key references unit_pendidikan(id) on delete cascade,
  pin           text not null,
  admin_spmb    text,
  admin_sekolah text,
  admin_tu      text,
  aktif         boolean not null default true,
  diperbarui    timestamptz not null default now()
);

create table if not exists sesi_unit (
  token       text primary key,
  unit_id     text,
  kode        text not null,
  kedaluwarsa timestamptz not null,
  dibuat      timestamptz not null default now()
);
create index if not exists idx_sesi_unit_kode on sesi_unit (kode);

insert into admin_unit_sekolah (unit_id, pin)
select u.id, lpad((floor(random() * 9000) + 1000)::int::text, 4, '0')
  from unit_pendidikan u
 where not exists (select 1 from admin_unit_sekolah a where a.unit_id = u.id);

-- Pastikan tidak ada dua sekolah berbagi PIN yang sama.
do $$
declare
  baris record;
  baru text;
begin
  for baris in
    select a.unit_id from admin_unit_sekolah a
     where exists (select 1 from admin_unit_sekolah b where b.pin = a.pin and b.unit_id < a.unit_id)
  loop
    loop
      baru := lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
      exit when not exists (select 1 from admin_unit_sekolah where pin = baru);
    end loop;
    update admin_unit_sekolah set pin = baru where unit_id = baris.unit_id;
  end loop;
end $$;

-- PIN halaman Admin ZIS (satu PIN untuk lembaga, bukan per sekolah).
insert into pengaturan (kunci, nilai, kelompok)
values ('admin_zis',
        jsonb_build_object('pin', lpad((floor(random() * 9000) + 1000)::int::text, 4, '0'),
                           'nama', '', 'aktif', true),
        'sistem')
on conflict (kunci) do nothing;

-- -------------------------------------------------------------------------------------
--  Hubungan SPMB dengan data santri.
--  Pendaftar yang sudah diverifikasi petugas sekolah ditambahkan ke tabel santri, sehingga
--  jumlah siswa/mahasiswa di situs ikut bertambah. Kolom pendaftar_id menjaga supaya satu
--  pendaftar hanya menghasilkan satu baris santri, dan baris itu bisa dicabut kembali bila
--  status pendaftarannya dikembalikan atau ditolak.
-- -------------------------------------------------------------------------------------
alter table santri add column if not exists pendaftar_id bigint references spmb_pendaftar(id) on delete set null;
create unique index if not exists idx_santri_pendaftar on santri (pendaftar_id);

-- -------------------------------------------------------------------------------------
--  Data siswa hasil pendaftaran SPMB dan pemindahan siswa menjadi alumni.
--  Tiga kolom tambahan pada santri menyamakan datanya dengan isian formulir SPMB,
--  sedangkan alumni.santri_id menandai alumnus yang berasal dari data siswa sekolah.
-- -------------------------------------------------------------------------------------
alter table santri add column if not exists asal_sekolah text;
alter table santri add column if not exists alamat       text;
alter table santri add column if not exists tempat_lahir text;
alter table santri add column if not exists email        text;
alter table alumni add column if not exists santri_id text references santri(id) on delete set null;
create unique index if not exists idx_alumni_santri on alumni (santri_id);

-- -------------------------------------------------------------------------------------
--  Kategori tagihan per sekolah (SPP bulanan, seragam, dan lain-lain).
--  Kategori hanya membantu pengisian: jenis tagihan tetap tersimpan pada tagihannya,
--  jadi menghapus kategori tidak menghapus tagihan yang sudah dibuat.
-- -------------------------------------------------------------------------------------
create table if not exists kategori_tagihan (
  id         text primary key,
  unit_id    text not null references unit_pendidikan(id) on delete cascade,
  nama       text not null,
  keterangan text,
  urutan     integer not null default 0,
  aktif      boolean not null default true,
  dibuat     timestamptz not null default now(),
  diperbarui timestamptz not null default now()
);
create unique index if not exists idx_kategori_tagihan_nama on kategori_tagihan (unit_id, lower(nama));
create index if not exists idx_kategori_tagihan_urutan on kategori_tagihan (unit_id, urutan, nama);

-- Jenis tagihan yang sudah dipakai pada tagihan lama didaftarkan sebagai kategori sekolah.
insert into kategori_tagihan (id, unit_id, nama)
select 'kt-' || unit_id || '-' || md5(lower(jenis)), unit_id, jenis
  from (
    select distinct s.unit_id, trim(t.jenis) as jenis
      from tagihan t
      join santri s on s.id = t.santri_id
     where nullif(trim(t.jenis), '') is not null
  ) x
on conflict do nothing;

-- -------------------------------------------------------------------------------------
--  Kategori tagihan: jenis periode (bulanan / sekali bayar) dan besaran nominalnya.
--  Kategori bulanan dipakai untuk tagihan rutin seperti SPP, sehingga tagihannya bisa
--  dilihat per bulan beserta nominal standarnya.
-- -------------------------------------------------------------------------------------
alter table kategori_tagihan add column if not exists tipe    text not null default 'sekali';
alter table kategori_tagihan add column if not exists nominal numeric(14,2) not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'kategori_tagihan_tipe_check') then
    alter table kategori_tagihan
      add constraint kategori_tagihan_tipe_check check (tipe in ('bulanan', 'sekali'));
  end if;
end $$;

/* Sekali saja: kategori lama yang jelas bulanan ditandai bulanan, dan nominal standarnya
   diambil dari nominal tagihan yang paling sering dipakai untuk kategori itu. */
do $$
begin
  if not exists (select 1 from pengaturan where kunci = 'kategori_tagihan_tipe_v1') then
    update kategori_tagihan k
       set tipe = 'bulanan'
     where k.nama ~* 'bulan' or k.nama ~* '(^|\s)spp(\s|$)';

    update kategori_tagihan k
       set nominal = x.jumlah
      from (
        select s.unit_id, lower(trim(t.jenis)) as jenis, t.jumlah,
               row_number() over (partition by s.unit_id, lower(trim(t.jenis)) order by count(*) desc, t.jumlah desc) as rn
          from tagihan t
          join santri s on s.id = t.santri_id
         where nullif(trim(t.jenis), '') is not null and t.jumlah > 0
         group by 1, 2, 3
      ) x
     where x.rn = 1 and x.unit_id = k.unit_id and x.jenis = lower(k.nama) and k.nominal = 0;

    insert into pengaturan (kunci, nilai, kelompok) values ('kategori_tagihan_tipe_v1', 'true'::jsonb, 'sistem');
  end if;
end $$;

-- -------------------------------------------------------------------------------------
--  Tagihan bulanan otomatis: kategori bulanan punya tanggal jatuh tempo (mis. tanggal 10),
--  dan tiap bulan dibuatkan tagihan untuk seluruh siswa aktif yang belum punya.
--  Kolom periode ('YYYY-MM') + indeks unik membuat pembuatan tagihan aman diulang.
-- -------------------------------------------------------------------------------------
alter table kategori_tagihan add column if not exists jatuh_tempo_hari integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'kategori_tagihan_tanggal_check') then
    alter table kategori_tagihan
      add constraint kategori_tagihan_tanggal_check
      check (jatuh_tempo_hari is null or (jatuh_tempo_hari between 1 and 31));
  end if;
end $$;

alter table tagihan add column if not exists kategori_id text references kategori_tagihan(id) on delete set null;
alter table tagihan add column if not exists periode text;

create unique index if not exists idx_tagihan_bulanan
  on tagihan (santri_id, kategori_id, periode)
  where kategori_id is not null and periode is not null;

create index if not exists idx_tagihan_periode on tagihan (periode, kategori_id);

create index if not exists idx_pembayaran_belum on pembayaran (status, dibuat desc);

-- -------------------------------------------------------------------------------------
--  Portal wali santri: masuk memakai PIN yang dibuat Admin Sekolah pada tabel siswa.
--  Satu PIN dipakai satu siswa, dan sesinya disimpan di sesi_wali.
-- -------------------------------------------------------------------------------------
alter table santri add column if not exists pin_wali text;

create unique index if not exists idx_santri_pin_wali on santri (pin_wali) where pin_wali is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'santri_pin_wali_check') then
    alter table santri add constraint santri_pin_wali_check
      check (pin_wali is null or pin_wali ~ '^[0-9]{4,8}$');
  end if;
end $$;

create table if not exists sesi_wali (
  token       text primary key,
  santri_id   text not null references santri(id) on delete cascade,
  kedaluwarsa timestamptz not null,
  dibuat      timestamptz not null default now()
);
create index if not exists idx_sesi_wali_santri on sesi_wali (santri_id);

-- -------------------------------------------------------------------------------------
-- Jurusan yang dipilih calon peserta didik pada formulir SPMB dikirim sampai ke
-- tabel siswa/mahasiswa, jadi kolomnya disimpan pada pendaftar.
-- -------------------------------------------------------------------------------------
alter table spmb_pendaftar add column if not exists program text;

-- -------------------------------------------------------------------------------------
--  Notifikasi push terkunci pada HP yang sedang login sebagai wali.
--
--  Satu langganan perangkat (endpoint) hanya boleh terikat pada satu siswa/mahasiswa.
--  Begitu wali lain masuk lewat HP yang sama, langganannya berpindah ke siswa yang baru
--  sehingga notifikasi tagihan, nilai, dan tahfidz tidak tertukar antar wali.
--
--  Nilai dan catatan tahfidz juga diberi penanda "terbit": baris yang belum terbit
--  hanya terlihat oleh petugas di Admin Sekolah, dan baru tampil di portal wali
--  (serta memicu notifikasi) setelah ditekan tombol Terbitkan.
-- -------------------------------------------------------------------------------------
alter table push_langganan add column if not exists santri_id text references santri(id) on delete cascade;
create index if not exists idx_push_langganan_santri on push_langganan (santri_id);

alter table nilai add column if not exists terbit boolean not null default false;
alter table nilai add column if not exists terbit_pada timestamptz;

alter table setoran_tahfidz add column if not exists terbit boolean not null default false;
alter table setoran_tahfidz add column if not exists terbit_pada timestamptz;

alter table tahfidz_target add column if not exists terbit boolean not null default false;
alter table tahfidz_target add column if not exists terbit_pada timestamptz;

-- -------------------------------------------------------------------------------------
--  Antrean notifikasi tagihan otomatis.
--
--  Tagihan bulanan dibuat saat ada yang membuka halaman tagihan (portal wali atau panel
--  Tata Usaha), karena layanan ini tidak punya penjadwal. Notifikasi untuk wali-wali itu
--  dikirim bertahap: kolom diproses menandai pesan yang sudah dicoba dikirim, sehingga
--  sisa antreannya bisa dilanjutkan pada permintaan berikutnya tanpa mengulang kiriman.
-- -------------------------------------------------------------------------------------
alter table push_pesan add column if not exists diproses timestamptz;
create index if not exists idx_push_pesan_antre on push_pesan (dibuat) where diproses is null;

-- -------------------------------------------------------------------------------------
--  Setoran tahfidz memakai daftar surat Al-Qur'an.
--
--  Pembimbing memilih surat dari 114 surat lalu menentukan ayat awal dan ayat akhir yang
--  disetor, sehingga jumlah ayatnya dapat dihitung (mis. Al-Baqarah ayat 1–20 = 20 ayat).
-- -------------------------------------------------------------------------------------
alter table setoran_tahfidz add column if not exists surah integer;
alter table setoran_tahfidz add column if not exists ayat_mulai integer;
alter table setoran_tahfidz add column if not exists ayat_selesai integer;

-- -------------------------------------------------------------------------------------
--  Slot iklan di dalam isi Berita dan Artikel.
--
--  Iklan tampil di tengah paragraf dengan ukuran kecil (satu kartu ringkas), sehingga
--  tidak mengganggu bacaan. Bila ada lebih dari satu iklan aktif, pilihannya diacak
--  secara tetap menurut judul postingan supaya tidak berubah-ubah saat halaman dibuka.
-- -------------------------------------------------------------------------------------
create table if not exists iklan (
  id          text primary key,
  urutan      integer not null default 0,
  label       text not null default 'Iklan',
  judul       text not null,
  teks        text,
  gambar_url  text,
  media_id    text references media(id) on delete set null,
  tautan      text,
  aktif       boolean not null default true,
  dibuat      timestamptz not null default now(),
  diperbarui  timestamptz not null default now()
);

-- Iklan bawaan: DIHAPUS. Slot iklan dibiarkan kosong; pengelola mengisinya sendiri
-- dari panel admin supaya tidak ada konten contoh yang tampil di situs.

-- -------------------------------------------------------------------------------------
--  Agenda juga menghitung jumlah dibaca seperti berita, artikel, dan pengumuman.
--  Angkanya bertambah otomatis setiap kali pengunjung membuka detail agenda.
-- -------------------------------------------------------------------------------------
alter table agenda add column if not exists dibaca integer not null default 0;

-- -------------------------------------------------------------------------------------
--  Pencatatan penyaluran dana ZIS (donasi, infak, wakaf).
--
--  Dana yang sudah disalurkan dicatat di sini beserta nominalnya, sehingga halaman
--  Admin ZIS dapat menampilkan total penyaluran yang benar-benar tercatat — bukan
--  angka yang diketik manual. Data awal mengikuti riwayat program donasi di situs:
--  "Pencairan dana tahap 1" sebesar 30% dari dana terkumpul tiap program.
-- -------------------------------------------------------------------------------------
create table if not exists donasi_penyaluran (
  id             text primary key,
  program_id     text references donasi_program(id) on delete set null,
  tanggal        date,
  judul          text not null,
  keterangan     text,
  nominal        numeric(16,2) not null default 0,
  bukti_media_id text references media(id) on delete set null,
  dicatat_oleh   text references pengguna(id) on delete set null,
  dibuat         timestamptz not null default now(),
  diperbarui     timestamptz not null default now()
);
create index if not exists idx_penyaluran_program on donasi_penyaluran (program_id, tanggal desc);

insert into donasi_penyaluran (id, program_id, tanggal, judul, keterangan, nominal)
select 'px-tahap1-' || p.slug,
       p.id,
       date '2026-09-04',
       'Pencairan dana tahap 1',
       'Penyaluran tahap pertama sebesar 30% dari dana terkumpul, sesuai rencana penggunaan dana pada halaman program.',
       round(p.terkumpul * 0.3)
  from donasi_program p
 where p.terkumpul > 0
on conflict (id) do nothing;

-- -------------------------------------------------------------------------------------
--  ZIS: kategori program, jenis laporan, dan daftar donatur.
--
--  1. Kategori program dipakai pada formulir Program Donasi di halaman Admin ZIS.
--  2. Riwayat program memuat jenis laporan ('laporan' atau 'penyaluran') dan nominal
--     penyaluran, sehingga laporan yang diubah petugas langsung tampil di situs.
--  3. Daftar donatur menampung nama dan nomor WhatsApp donatur, diisi otomatis dari
--     donasi yang sudah diverifikasi dan bisa pula diurus petugas ZIS.
-- -------------------------------------------------------------------------------------
create table if not exists donasi_kategori (
  id         text primary key,
  urutan     integer not null default 0,
  nama       text not null,
  keterangan text,
  aktif      boolean not null default true,
  dibuat     timestamptz not null default now(),
  diperbarui timestamptz not null default now()
);

insert into donasi_kategori (id, urutan, nama)
select 'dk-' || regexp_replace(lower(trim(k.kategori)), '[^a-z0-9]+', '-', 'g'),
       row_number() over (order by k.kategori),
       trim(k.kategori)
  from (select distinct kategori from donasi_program where trim(coalesce(kategori, '')) <> '') k
on conflict (id) do nothing;

alter table donasi_riwayat add column if not exists jenis text not null default 'laporan';
alter table donasi_riwayat add column if not exists nominal numeric(16,2) not null default 0;

update donasi_riwayat set jenis = 'penyaluran' where judul ilike '%pencairan%' and jenis <> 'penyaluran';

update donasi_riwayat r
   set nominal = p.nominal
  from donasi_penyaluran p
 where p.program_id = r.program_id
   and r.jenis = 'penyaluran'
   and r.nominal = 0;

create table if not exists donatur (
  id               text primary key,
  nama             text not null,
  telepon          text,
  jumlah_donasi    integer not null default 0,
  jumlah_total     numeric(16,2) not null default 0,
  program_terakhir text references donasi_program(id) on delete set null,
  catatan          text,
  aktif            boolean not null default true,
  dibuat           timestamptz not null default now(),
  diperbarui       timestamptz not null default now()
);
create unique index if not exists idx_donatur_telepon_uniq on donatur (telepon) where telepon is not null and telepon <> '';

insert into donatur (id, nama, jumlah_donasi, jumlah_total)
select 'dntr-' || md5(lower(trim(d.nama))),
       trim(d.nama),
       count(*)::int,
       coalesce(sum(d.jumlah), 0)
  from donasi_donatur d
 where trim(coalesce(d.nama, '')) <> ''
 group by lower(trim(d.nama)), trim(d.nama)
on conflict (id) do nothing;

/* Program terakhir pada data awal donatur diisi dari daftar donatur program. */
update donatur d
   set program_terakhir = x.program_id
  from (
        select lower(trim(nama)) as kunci,
               (array_agg(program_id order by waktu desc nulls last))[1] as program_id
          from donasi_donatur
         where trim(coalesce(nama, '')) <> ''
         group by lower(trim(nama))
       ) x
 where d.id = 'dntr-' || md5(x.kunci)
   and d.program_terakhir is null;

-- -------------------------------------------------------------------------------------
--  Metode pembayaran per program donasi.
--
--  Tiap program bisa memakai metode pembayaran yang berbeda (mis. hanya QRIS, atau
--  Transfer Bank dan Tunai). Daftar metode dan rekeningnya tetap diurus sekali di
--  tabel donasi_metode dan donasi_rekening; program hanya menyimpan pilihannya.
-- -------------------------------------------------------------------------------------
alter table donasi_program add column if not exists metode jsonb not null default '[]'::jsonb;

update donasi_program
   set metode = (select coalesce(jsonb_agg(m.id order by m.urutan), '[]'::jsonb) from donasi_metode m where m.aktif)
 where metode is null or jsonb_array_length(metode) = 0;

-- -------------------------------------------------------------------------------------
--  Gambar QRIS pada metode pembayaran.
--
--  Metode QRIS memerlukan gambar kode QR resmi lembaga supaya donatur bisa langsung
--  memindainya dari popup di situs. Gambar disimpan di penyimpanan objek platform dan
--  alamatnya dicatat di sini (kolom media_id menyimpan berkasnya di tabel media).
-- -------------------------------------------------------------------------------------
alter table donasi_metode add column if not exists gambar_url text;
alter table donasi_metode add column if not exists media_id text references media(id) on delete set null;
alter table donasi_metode add column if not exists diperbarui timestamptz not null default now();

-- -------------------------------------------------------------------------------------
--  Gambar pada metode pembayaran tata usaha (mis. kode QRIS).
--
--  Sama seperti pada metode donasi: gambar disimpan di penyimpanan objek platform dan
--  alamatnya dicatat di sini supaya bendahara bisa menayangkan kode QR di portal wali.
--  Kolom langkah (jsonb) sudah ada sejak awal dan kini diisi dari panel Tata Usaha.
-- -------------------------------------------------------------------------------------
alter table metode_pembayaran add column if not exists gambar_url text;
alter table metode_pembayaran add column if not exists media_id text references media(id) on delete set null;

-- ===== kunci akses (hanya server) + fungsi jalankan_sql =====
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('revoke all on public.%I from anon, authenticated', t.tablename);
    execute format('grant all on public.%I to service_role', t.tablename);
  end loop;
end $$;
revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.jalankan_sql(q text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare hasil jsonb; n bigint; awal text;
begin
  awal := lower(ltrim(regexp_replace(q, '^\s*(--[^\n]*\n\s*)*', '')));
  if awal like 'select%' or awal like 'with%' or awal like 'values%' or awal like '(%' or q ~* '\mreturning\M' then
    execute format('with t as (%s) select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from t', q) into hasil;
    return jsonb_build_object('rows', hasil, 'rowCount', jsonb_array_length(hasil));
  end if;
  execute q;
  get diagnostics n = row_count;
  return jsonb_build_object('rows', '[]'::jsonb, 'rowCount', n);
end $fn$;
revoke all on function public.jalankan_sql(text) from public, anon, authenticated;
grant execute on function public.jalankan_sql(text) to service_role;
-- ===== penyimpanan berkas (bucket privat 'media') =====
insert into storage.buckets (id, name, public) values ('media','media',false) on conflict (id) do nothing;

-- ===== tahun ajaran: kelola dari panel admin, hanya satu yang aktif =====
alter table public.tahun_ajaran add column if not exists dibuat timestamptz not null default now();
alter table public.tahun_ajaran add column if not exists diperbarui timestamptz not null default now();
create unique index if not exists idx_tahun_ajaran_satu_aktif on public.tahun_ajaran ((true)) where aktif;
drop trigger if exists trg_tahun_ajaran_diperbarui on public.tahun_ajaran;
create trigger trg_tahun_ajaran_diperbarui before update on public.tahun_ajaran
  for each row execute function public.set_diperbarui();
