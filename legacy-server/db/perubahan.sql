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
--  Data siswa/mahasiswa awal.
--  Jumlah peserta didik pada kartu jenjang dan kartu sekolah dihitung dari tabel santri
--  (status aktif atau calon). Supaya angka yang sudah tampil punya datanya, tabel santri
--  diisi sekali saja sebanyak angka yang berlaku saat ini. Dijalankan sekali (ada penanda).
-- -------------------------------------------------------------------------------------
do $$
declare
  depan text[] := array['Ahmad','Muhammad','Abdul','Abdullah','Fajar','Rizki','Ilham','Yusuf','Hafiz','Zaki','Aisyah','Fatimah','Siti','Nur','Dewi','Rina','Hana','Salma','Zahra','Nabila'];
  tengah text[] := array['Fauzan','Ramadhan','Hidayat','Nurhalim','Saputra','Pratama','Maulana','Syahputra','Kurniawan','Setiawan','Rahmawati','Anggraeni','Kusuma','Mardhiyah','Azzahra','Wulandari','Nuraini','Fitriani','Handayani','Lestari'];
  belakang text[] := array['Cibatu','Garut','Sindangsari','Padasuka','Mekarsari','Al-Furqan','Persis','Darul Falah','Nurul Huda','Al-Hidayah'];
begin
  if not exists (select 1 from pengaturan where kunci = 'santri_awal') then
    insert into santri (id, nis, nama, jenjang_id, unit_id, kelas, jenis_kelamin, tahun_masuk, status)
    select 'sn-' || u.id || '-' || lpad(g::text, 3, '0'),
           coalesce(u.nomor, right(u.id, 4)) || '.' || lpad(g::text, 4, '0'),
           depan[1 + (g % 20)] || ' ' || tengah[1 + ((g * 7) % 20)] || ' ' || belakang[1 + ((g * 3) % 10)],
           j.id,
           u.id,
           case j.slug
             when 'ra'  then 'Kelompok ' || case when g % 2 = 0 then 'A' else 'B' end
             when 'mi'  then 'Kelas ' || (1 + (g % 6))::text
             when 'mts' then 'Kelas ' || (7 + (g % 3))::text
             when 'ma'  then 'Kelas ' || (10 + (g % 3))::text
             when 'pt'  then 'Semester ' || (1 + (g % 8))::text
             else 'Awaliyah'
           end,
           case when g % 2 = 0 then 'L' else 'P' end,
           2019 + (g % 6),
           'aktif'
      from unit_pendidikan u
      join jenjang j on j.id = u.jenjang_id
      cross join generate_series(1, greatest(coalesce(u.jumlah_peserta, 0), 0)) as g
     where not exists (select 1 from santri s where s.id = 'sn-' || u.id || '-' || lpad(g::text, 3, '0'));

    insert into pengaturan (kunci, nilai, kelompok)
    values ('santri_awal', to_jsonb(true), 'sistem')
    on conflict (kunci) do nothing;
  end if;
end $$;

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

insert into iklan (id, urutan, label, judul, teks, gambar_url, tautan, aktif) values
  ('ik-1', 1, 'Iklan', 'Penerimaan Murid & Mahasiswa Baru 2026/2027',
   'Kuota terbatas untuk RA, MI, MTs, MA, dan Perguruan Tinggi. Daftar lebih awal dan dapatkan potongan biaya pendaftaran.',
   'https://images.unsplash.com/photo-1629273229664-11fabc0becc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
   '#/spmb', true),
  ('ik-2', 2, 'Iklan', 'Kajian Ahad Subuh Terbuka untuk Umum',
   'Setiap Ahad, 05.30 WIB di Masjid Al-Furqan Cibatu. Hadir bersama jama''ah PC PERSIS Cibatu.',
   'https://images.unsplash.com/photo-1569929919600-59123640bc02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
   '#/kajian', true),
  ('ik-3', 3, 'Iklan', 'Donasi Beasiswa Santri & Mahasiswa',
   'Salurkan ZIS Anda untuk beasiswa santri dan mahasiswa berprestasi di lingkungan PC PERSIS Cibatu.',
   'https://images.unsplash.com/photo-1589104760192-ccab0ce0d90f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
   '#/donasi', true)
on conflict (id) do nothing;

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
