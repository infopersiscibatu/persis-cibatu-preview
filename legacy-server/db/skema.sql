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
