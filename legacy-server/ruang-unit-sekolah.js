/**
 * Rute halaman Admin Sekolah:
 *  - statistik sekolah (jumlah siswa, alumni, rombel, guru, sebaran kelas);
 *  - daftar siswa beserta tambah, ubah, dan hapus — isiannya sama dengan formulir SPMB;
 *  - daftar alumni, termasuk memindahkan siswa yang sudah lulus menjadi alumni.
 *
 * Siswa hasil pendaftaran SPMB yang sudah diverifikasi petugas SPMB masuk sendiri ke
 * tabel siswa di sini (lihat ruang-unit.js → selaraskanSantri). Semua permintaan
 * disaring dengan unit_id dari sesi, jadi satu sekolah tidak melihat data sekolah lain.
 */
const bantuanUnit = require("./lib/unit");
const pesanWali = require("./lib/notifikasiWali");
const { periksaSetoran } = require("./lib/quran");

const STATUS_SANTRI = ["aktif", "calon", "lulus", "pindah", "nonaktif"];

module.exports = function pasangRuteUnitSekolah(app, { tanya, push }) {
  const { satu, sekolahWajib, angka } = bantuanUnit(tanya);

  const rapikan = (nilai, batas) => {
    if (nilai === null || nilai === undefined) return null;
    const teks = String(nilai).replace(/\r\n/g, "\n").trim();
    return teks ? teks.slice(0, batas) : null;
  };

  const tanggalSah = (nilai) => {
    const teks = rapikan(nilai, 10);
    if (!teks) return null;
    return /^\d{4}-\d{2}-\d{2}$/.test(teks) ? teks : null;
  };

  const angkaBulat = (nilai, cadangan = null) => {
    const n = Number.parseInt(String(nilai ?? ""), 10);
    return Number.isFinite(n) ? n : cadangan;
  };

  const barisSiswa = (r) => ({
    id: r.id,
    nama: r.nama ?? "",
    program: r.program ?? "",
    /** Kelas/rombel peserta didik, dipakai panel nilai & tahfidz. */
    kelas: r.kelas ?? "",
    waliNama: r.wali_nama ?? "",
    waliTelepon: r.wali_telepon ?? "",
    /** PIN yang dipakai wali santri untuk masuk ke portal wali. */
    pinWali: r.pin_wali ?? "",
    /** Nama jurusan (program) yang dipakai, bila terdaftar pada jenjang ini. */
    programNama: r.program_nama ?? "",
    /** Foto profil yang diunggah wali, bila sudah ada. */
    foto: r.foto_url ?? "",
    jenjang: r.jenjang ?? "",
    sekolah: r.sekolah ?? "",
    status: r.status ?? "aktif",
    /** Sudah tercatat di daftar alumni — dipakai borang untuk memilih tombol yang tepat. */
    alumni: Number(r.alumni ?? 0) > 0,
    /** Jumlah tagihan yang belum lunas, dipakai untuk menjelaskan kelulusan yang tertahan. */
    tagihanTerbuka: Number(r.tagihan_terbuka ?? 0),
    dariSpmb: r.pendaftar_id !== null && r.pendaftar_id !== undefined,
    dibuat: r.dibuat ? new Date(r.dibuat).toISOString() : null,
    diperbarui: r.diperbarui ? new Date(r.diperbarui).toISOString() : null,
  });

  /**
   * Daftar program (jurusan) pada jenjang sebuah unit, urut mengikuti daftar
   * program yang dipakai unit itu. Dipakai borang siswa/mahasiswa dan tabelnya.
   */
  const programJenjang = async (unitId) => {
    const u = await satu("select jenjang_id, jurusan from unit_pendidikan where id = $1", [unitId]);
    if (!u) return [];
    const { rows } = await tanya(
      "select slug, nama from jurusan where jenjang_id = $1 order by urutan nulls last, nama",
      [u.jenjang_id],
    );
    const peta = new Map(rows.map((r) => [r.slug, r.nama]));
    const dipakai = Array.isArray(u.jurusan) ? u.jurusan : [];
    const daftar = dipakai.map((slug) => ({ slug, nama: peta.get(slug) ?? slug }));
    for (const r of rows) if (!dipakai.includes(r.slug)) daftar.push({ slug: r.slug, nama: r.nama });
    return daftar;
  };

  const barisAlumni = (r) => ({
    id: r.id,
    nama: r.nama ?? "",
    nis: r.nis ?? "",
    tahunLulus: r.tahun_lulus ?? null,
    pekerjaan: r.pekerjaan ?? "",
    instansi: r.instansi ?? "",
    kota: r.kota ?? "",
    telepon: r.telepon ?? "",
    catatan: r.catatan ?? "",
    dariSiswa: (r.santri_id ?? null) !== null,
    santriId: r.santri_id ?? "",
    dibuat: r.dibuat ? new Date(r.dibuat).toISOString() : null,
  });

  const hitungSiswa = async (unitId) => {
    const r = await satu(
      `select count(*) filter (where status = 'aktif')::int as aktif,
              count(*) filter (where status = 'calon')::int as calon,
              count(*) filter (where status = 'lulus')::int as lulus,
              count(*)::int as semua
         from santri where unit_id = $1`,
      [unitId],
    );
    return {
      aktif: angka(r?.aktif),
      calon: angka(r?.calon),
      lulus: angka(r?.lulus),
      semua: angka(r?.semua),
    };
  };

  const hitungAlumni = async (unitId) =>
    angka((await satu("select count(*)::int as n from alumni where unit_id = $1 and aktif", [unitId]))?.n);

  /* ------------------------------- statistik ------------------------------- */

  app.get("/api/unit/sekolah/statistik", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const unit = await satu(
        `select u.id, u.nama, u.slug, u.daerah, u.alamat, u.pimpinan, u.rombel, u.guru, u.staf,
                u.akreditasi, u.npsn, u.berdiri, u.jam, u.status, u.ekstrakurikuler,
                coalesce(jsonb_array_length(u.jurusan), 0) as jurusan,
                j.singkatan, j.nama as jenjang_nama
           from unit_pendidikan u
           left join jenjang j on j.id = u.jenjang_id
          where u.id = $1`,
        [sesi.unit_id],
      );
      if (!unit) return res.status(404).json({ pesan: "Sekolah tidak ditemukan." });

      const siswa = await satu(
        `select count(*)::int as aktif,
                count(distinct kelas)::int as kelas
           from santri
          where unit_id = $1 and status = 'aktif'`,
        [unit.id],
      );

      const calon = await satu(`select count(*)::int as n from santri where unit_id = $1 and status = 'calon'`, [
        unit.id,
      ]);
      const lulus = await satu(`select count(*)::int as n from santri where unit_id = $1 and status = 'lulus'`, [
        unit.id,
      ]);

      const perKelas = (
        await tanya(
          `select coalesce(nullif(trim(kelas), ''), '') as kelas,
                  count(*)::int as jumlah
             from santri
            where unit_id = $1 and status = 'aktif'
            group by 1
            order by 1`,
          [unit.id],
        )
      ).rows.map((r) => ({
        kelas: r.kelas || "Belum ada kelas",
        jumlah: angka(r.jumlah),
      }));

      const alumni = await satu(
        `select count(*)::int as total,
                count(distinct tahun_lulus)::int as angkatan,
                max(tahun_lulus)::int as terakhir
           from alumni where unit_id = $1 and aktif`,
        [unit.id],
      );

      const alumniPerTahun = (
        await tanya(
          `select coalesce(tahun_lulus, 0)::int as tahun, count(*)::int as jumlah
             from alumni
            where unit_id = $1 and aktif
            group by 1
            order by 1 desc`,
          [unit.id],
        )
      ).rows.map((r) => ({ tahun: r.tahun ? String(r.tahun) : "Tahun belum dicatat", jumlah: angka(r.jumlah) }));

      const pengurus = await satu("select admin_sekolah from admin_unit_sekolah where unit_id = $1", [unit.id]);

      res.json({
        ok: true,
        diperbarui: new Date().toISOString(),
        unit: {
          id: unit.id,
          nama: unit.nama,
          slug: unit.slug,
          jenjang: unit.singkatan ?? unit.jenjang_nama ?? "-",
          jenjangNama: unit.jenjang_nama ?? "",
          daerah: unit.daerah ?? "",
          alamat: unit.alamat ?? "",
          pimpinan: unit.pimpinan ?? "",
          akreditasi: unit.akreditasi ?? "",
          npsn: unit.npsn ?? "",
          berdiri: unit.berdiri ? String(unit.berdiri) : "",
          jam: unit.jam ?? "",
          status: unit.status ?? "",
          rombel: angka(unit.rombel),
          guru: angka(unit.guru),
          staf: angka(unit.staf),
          jurusan: angka(unit.jurusan),
          ekstrakurikuler: Array.isArray(unit.ekstrakurikuler) ? unit.ekstrakurikuler.length : 0,
        },
        siswa: {
          aktif: angka(siswa?.aktif),
          kelas: angka(siswa?.kelas),
          calon: angka(calon?.n),
          lulus: angka(lulus?.n),
          perKelas,
        },
        alumni: {
          total: angka(alumni?.total),
          angkatan: angka(alumni?.angkatan),
          terakhir: alumni?.terakhir ? String(alumni.terakhir) : "",
          perTahun: alumniPerTahun,
        },
        pengurusSekolah: String(pengurus?.admin_sekolah ?? "").trim(),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* --------------------------------- siswa --------------------------------- */

  /* status: aktif | calon | lulus | semua */
  app.get("/api/unit/sekolah/siswa", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const status = ["aktif", "calon", "lulus", "semua"].includes(String(req.query.status ?? ""))
        ? String(req.query.status)
        : "aktif";
      const cari = rapikan(req.query.cari, 60) ?? "";
      const kelas = rapikan(req.query.kelas, 30) ?? "";
      const batas = Math.min(Math.max(angkaBulat(req.query.batas, 60) ?? 60, 1), 200);
      const lewat = Math.max(angkaBulat(req.query.lewat, 0) ?? 0, 0);

      const nilai = [sesi.unit_id];
      let kondisi = "s.unit_id = $1";
      if (status !== "semua") {
        nilai.push(status);
        kondisi += ` and s.status = $${nilai.length}`;
      }
      if (cari) {
        nilai.push(`%${cari}%`);
        kondisi += ` and (s.nama ilike $${nilai.length} or coalesce(s.wali_nama,'') ilike $${nilai.length} or coalesce(s.wali_telepon,'') ilike $${nilai.length})`;
      }
      if (kelas) {
        nilai.push(kelas);
        kondisi += ` and coalesce(nullif(trim(kelas), ''), '') = $${nilai.length}`;
      }

      const { rows } = await tanya(
        `select s.id, s.nama, s.program, s.kelas, s.wali_nama, s.wali_telepon, s.pin_wali, s.status, s.pendaftar_id,
                (select p.nama from jurusan p where p.jenjang_id = s.jenjang_id and p.slug = s.program) as program_nama,
                (select m.url from media m where m.id = s.foto_media_id) as foto_url,
                (select count(*)::int from alumni a where a.santri_id = s.id) as alumni,
                (select count(*)::int from tagihan t
                  where t.santri_id = s.id and t.status in ('belum', 'menunggu')) as tagihan_terbuka,
                s.dibuat, s.diperbarui,
                coalesce(j.singkatan, j.nama, '') as jenjang,
                u.nama as sekolah
           from santri s
           left join unit_pendidikan u on u.id = s.unit_id
           left join jenjang j on j.id = s.jenjang_id
          where ${kondisi}
          order by s.nama
          limit ${batas} offset ${lewat}`,
        nilai,
      );

      const unit = await satu(
        `select u.nama, u.jurusan, coalesce(j.singkatan, j.nama, '') as jenjang
           from unit_pendidikan u left join jenjang j on j.id = u.jenjang_id
          where u.id = $1`,
        [sesi.unit_id],
      );

      /* Program jurusan yang tersedia pada jenjang unit ini. */
      const programUnit = await programJenjang(sesi.unit_id);

      res.json({
        ok: true,
        status,
        cari,
        kelas,
        batas,
        lewat,
        sekolah: {
          nama: unit?.nama ?? "",
          jenjang: unit?.jenjang ?? "",
          jurusan: Array.isArray(unit?.jurusan) ? unit.jurusan : [],
          /* Daftar program pada jenjang unit ini (slug beserta namanya) untuk pilihan jurusan. */
          program: programUnit,
        },
        siswa: rows.map(barisSiswa),
        penuh: rows.length >= batas,
        ringkasan: await hitungSiswa(sesi.unit_id),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /*
   * Isian siswa sengaja ringkas: nama lengkap, jurusan (bila sekolah punya jurusan),
   * nama orang tua, dan nomor WhatsApp. Jenjang dan nama sekolah mengikuti sekolahnya.
   */
  const bacaIsianSiswa = (b) => ({
    nama: rapikan(b.nama, 80),
    program: rapikan(b.program, 60),
    wali_nama: rapikan(b.waliNama, 90),
    wali_telepon: rapikan(b.waliTelepon, 30),
    pin_wali: /^[0-9]{4,8}$/.test(String(b.pinWali ?? "").trim()) ? String(b.pinWali).trim() : null,
  });

  /** PIN wali tidak boleh dipakai dua siswa. */
  const pinTerpakai = async (pin, kecualiId) => {
    if (!pin) return null;
    return satu("select id, nama from santri where pin_wali = $1 and id <> coalesce($2, '') limit 1", [
      pin,
      kecualiId ?? null,
    ]);
  };

  app.post("/api/unit/sekolah/siswa", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const isian = bacaIsianSiswa(req.body || {});
      if (!isian.nama || isian.nama.length < 3)
        return res.status(400).json({ pesan: "Nama siswa minimal 3 huruf." });

      const unit = await satu("select id, jenjang_id from unit_pendidikan where id = $1", [sesi.unit_id]);
      if (!unit) return res.status(404).json({ pesan: "Sekolah tidak ditemukan." });

      const dipakai = await pinTerpakai(isian.pin_wali);
      if (dipakai) {
        return res.status(409).json({ pesan: `PIN ${isian.pin_wali} sudah dipakai oleh ${dipakai.nama}. Gunakan PIN lain.` });
      }

      const id = `sn-${unit.id}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
      await tanya(
        `insert into santri (id, nama, jenjang_id, unit_id, program, wali_nama, wali_telepon,
                             pin_wali, tahun_masuk, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'aktif')`,
        [
          id,
          isian.nama,
          unit.jenjang_id,
          unit.id,
          isian.program,
          isian.wali_nama,
          isian.wali_telepon,
          isian.pin_wali,
          new Date().getFullYear(),
        ],
      );

      res.json({ ok: true, id, ringkasan: await hitungSiswa(sesi.unit_id) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/unit/sekolah/siswa/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const isian = bacaIsianSiswa(req.body || {});
      if (!isian.nama || isian.nama.length < 3)
        return res.status(400).json({ pesan: "Nama siswa minimal 3 huruf." });

      const dipakai = await pinTerpakai(isian.pin_wali, req.params.id);
      if (dipakai) {
        return res.status(409).json({ pesan: `PIN ${isian.pin_wali} sudah dipakai oleh ${dipakai.nama}. Gunakan PIN lain.` });
      }

      const hasil = await tanya(
        `update santri set
           nama = $3, program = $4, wali_nama = $5, wali_telepon = $6, pin_wali = $7, diperbarui = now()
         where id = $1 and unit_id = $2`,
        [req.params.id, sesi.unit_id, isian.nama, isian.program, isian.wali_nama, isian.wali_telepon, isian.pin_wali],
      );
      if (hasil.rowCount === 0) return res.status(404).json({ pesan: "Siswa tidak ditemukan pada sekolah ini." });

      res.json({ ok: true, ringkasan: await hitungSiswa(sesi.unit_id) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.delete("/api/unit/sekolah/siswa/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const hasil = await tanya("delete from santri where id = $1 and unit_id = $2", [req.params.id, sesi.unit_id]);
      if (hasil.rowCount === 0) return res.status(404).json({ pesan: "Siswa tidak ditemukan pada sekolah ini." });

      res.json({ ok: true, ringkasan: await hitungSiswa(sesi.unit_id) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* -------------------------------- alumni --------------------------------- */

  app.get("/api/unit/sekolah/alumni", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const cari = rapikan(req.query.cari, 60) ?? "";
      const nilai = [sesi.unit_id];
      let kondisi = "unit_id = $1 and aktif";
      if (cari) {
        nilai.push(`%${cari}%`);
        kondisi += ` and (nama ilike $${nilai.length} or coalesce(nis,'') ilike $${nilai.length} or coalesce(instansi,'') ilike $${nilai.length})`;
      }

      const { rows } = await tanya(
        `select id, nama, nis, tahun_lulus, pekerjaan, instansi, kota, telepon, catatan, santri_id, dibuat
           from alumni where ${kondisi}
          order by tahun_lulus desc nulls last, nama`,
        nilai,
      );

      res.json({
        ok: true,
        cari,
        alumni: rows.map(barisAlumni),
        total: await hitungAlumni(sesi.unit_id),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  const bacaIsianAlumni = (b) => ({
    nama: rapikan(b.nama, 80),
    nis: rapikan(b.nis, 24),
    tahun_lulus: angkaBulat(b.tahunLulus, null),
    pekerjaan: rapikan(b.pekerjaan, 60),
    instansi: rapikan(b.instansi, 90),
    kota: rapikan(b.kota, 60),
    telepon: rapikan(b.telepon, 30),
    catatan: rapikan(b.catatan, 300),
  });

  app.post("/api/unit/sekolah/alumni", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const isian = bacaIsianAlumni(req.body || {});
      if (!isian.nama || isian.nama.length < 3)
        return res.status(400).json({ pesan: "Nama alumni minimal 3 huruf." });

      const unit = await satu("select id, jenjang_id from unit_pendidikan where id = $1", [sesi.unit_id]);
      const id = `al-${unit.id}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

      await tanya(
        `insert into alumni (id, nis, nama, jenjang_id, unit_id, tahun_lulus, pekerjaan, instansi, kota, telepon, catatan, aktif)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)`,
        [
          id,
          isian.nis,
          isian.nama,
          unit.jenjang_id,
          unit.id,
          isian.tahun_lulus,
          isian.pekerjaan,
          isian.instansi,
          isian.kota,
          isian.telepon,
          isian.catatan,
        ],
      );

      res.json({ ok: true, id, total: await hitungAlumni(sesi.unit_id) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/unit/sekolah/alumni/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const isian = bacaIsianAlumni(req.body || {});
      if (!isian.nama || isian.nama.length < 3)
        return res.status(400).json({ pesan: "Nama alumni minimal 3 huruf." });

      const hasil = await tanya(
        `update alumni set nama = $3, nis = $4, tahun_lulus = $5, pekerjaan = $6, instansi = $7,
                            kota = $8, telepon = $9, catatan = $10, diperbarui = now()
          where id = $1 and unit_id = $2`,
        [
          req.params.id,
          sesi.unit_id,
          isian.nama,
          isian.nis,
          isian.tahun_lulus,
          isian.pekerjaan,
          isian.instansi,
          isian.kota,
          isian.telepon,
          isian.catatan,
        ],
      );
      if (hasil.rowCount === 0) return res.status(404).json({ pesan: "Alumni tidak ditemukan pada sekolah ini." });

      res.json({ ok: true, total: await hitungAlumni(sesi.unit_id) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.delete("/api/unit/sekolah/alumni/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const hasil = await tanya("delete from alumni where id = $1 and unit_id = $2", [req.params.id, sesi.unit_id]);
      if (hasil.rowCount === 0) return res.status(404).json({ pesan: "Alumni tidak ditemukan pada sekolah ini." });

      res.json({ ok: true, total: await hitungAlumni(sesi.unit_id) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /**
   * Selaraskan daftar alumni dengan data siswa. Siswa yang berstatus lulus tetapi belum
   * tercatat sebagai alumni — biasanya karena dulu masih ada tunggakan yang kini sudah
   * lunas — dimasukkan sekaligus, selama tidak ada tagihan yang masih terbuka.
   */
  app.post("/api/unit/sekolah/alumni/selaraskan", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const { rows } = await tanya(
        `select s.id, s.nis, s.nama, s.jenjang_id, s.unit_id, s.wali_telepon
           from santri s
          where s.unit_id = $1 and s.status = 'lulus'
            and not exists (select 1 from alumni a where a.santri_id = s.id)
            and not exists (select 1 from tagihan t
                             where t.santri_id = s.id and t.status in ('belum', 'menunggu'))
          order by s.nama`,
        [sesi.unit_id],
      );

      const totalAlumni = await hitungAlumni(sesi.unit_id);

      if (rows.length === 0)
        return res.json({
          ok: true,
          ditambah: 0,
          nama: [],
          totalAlumni,
          pesan: "Tidak ada yang perlu ditambahkan. Semua siswa lulus tanpa tunggakan sudah tercatat sebagai alumni.",
        });

      const tahun = new Date().getFullYear();
      for (const s of rows) {
        await tanya(
          `insert into alumni (id, nis, nama, jenjang_id, unit_id, tahun_lulus, telepon, santri_id, aktif)
           values ($1,$2,$3,$4,$5,$6,$7,$8,true)
           on conflict (santri_id) do update set aktif = true, diperbarui = now()`,
          [`al-${s.id}`, s.nis, s.nama, s.jenjang_id, s.unit_id, tahun, s.wali_telepon, s.id],
        );
      }

      res.json({
        ok: true,
        ditambah: rows.length,
        nama: rows.map((s) => s.nama),
        totalAlumni: await hitungAlumni(sesi.unit_id),
        pesan: `${rows.length} siswa lulus dimasukkan ke daftar alumni (tahun lulus diisi ${tahun}, bisa diubah dari borang alumni).`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Pindahkan siswa menjadi alumni: status siswa jadi lulus, datanya masuk daftar alumni. */
  app.post("/api/unit/sekolah/siswa/:id/lulus", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const siswa = await satu(
        `select id, nama, nis, kelas, jenjang_id, unit_id, wali_nama, wali_telepon, status
           from santri where id = $1 and unit_id = $2`,
        [req.params.id, sesi.unit_id],
      );
      if (!siswa) return res.status(404).json({ pesan: "Siswa tidak ditemukan pada sekolah ini." });

      const tahun = angkaBulat(req.body?.tahunLulus, null) ?? new Date().getFullYear();
      const id = `al-${siswa.id}`;

      /* Data hanya masuk daftar alumni bila tidak ada tunggakan. Siswa yang masih punya
         tunggakan tetap ditandai lulus, lalu ditahan di menu Tunggakan & Lunas Admin Tata Usaha. */
      const tunggakan =
        (await satu(
          `select count(*)::int as jumlah, coalesce(sum(t.jumlah), 0) as nominal
             from tagihan t where t.santri_id = $1 and t.status in ('belum', 'menunggu')`,
          [siswa.id],
        )) || { jumlah: 0, nominal: 0 };

      if (Number(tunggakan.nominal) > 0) {
        await tanya("update santri set status = 'lulus', diperbarui = now() where id = $1 and unit_id = $2", [
          siswa.id,
          sesi.unit_id,
        ]);
        return res.json({
          ok: true,
          masukAlumni: false,
          pesan: `Status ${siswa.nama} menjadi lulus, tetapi datanya belum masuk daftar alumni karena masih ada tunggakan Rp${Math.round(Number(tunggakan.nominal)).toLocaleString("id-ID")} pada ${tunggakan.jumlah} tagihan. Selesaikan lewat menu Tunggakan & Lunas di Admin Tata Usaha.`,
          siswa: { id: siswa.id, nama: siswa.nama, status: "lulus" },
          ringkasan: await hitungSiswa(sesi.unit_id),
          totalAlumni: await hitungAlumni(sesi.unit_id),
        });
      }

      await tanya(
        `insert into alumni (id, nis, nama, jenjang_id, unit_id, tahun_lulus, pekerjaan, instansi, kota, telepon, catatan, santri_id, aktif)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true)
         on conflict (santri_id) do update set
           nama = excluded.nama,
           nis = excluded.nis,
           tahun_lulus = excluded.tahun_lulus,
           pekerjaan = excluded.pekerjaan,
           instansi = excluded.instansi,
           kota = excluded.kota,
           telepon = excluded.telepon,
           catatan = excluded.catatan,
           aktif = true,
           diperbarui = now()`,
        [
          id,
          siswa.nis,
          siswa.nama,
          siswa.jenjang_id,
          siswa.unit_id,
          tahun,
          rapikan(req.body?.pekerjaan, 60),
          rapikan(req.body?.instansi, 90),
          rapikan(req.body?.kota, 60),
          rapikan(req.body?.telepon, 30) ?? siswa.wali_telepon,
          rapikan(req.body?.catatan, 300),
          siswa.id,
        ],
      );

      await tanya("update santri set status = 'lulus', diperbarui = now() where id = $1 and unit_id = $2", [
        siswa.id,
        sesi.unit_id,
      ]);

      res.json({
        ok: true,
        masukAlumni: true,
        pesan:
          siswa.status === "lulus"
            ? `${siswa.nama} sudah berstatus lulus, dan namanya kini masuk daftar alumni.`
            : `${siswa.nama} dipindahkan ke daftar alumni.`,
        siswa: { id: siswa.id, nama: siswa.nama, status: "lulus" },
        ringkasan: await hitungSiswa(sesi.unit_id),
        totalAlumni: await hitungAlumni(sesi.unit_id),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });
  /* ------------------------------ nilai & tahfidz ------------------------------ */

  /**
   * Nilai rapor dan catatan tahfidz milik satu siswa/mahasiswa.
   *
   * Semua isian disimpan lebih dulu sebagai rancangan (terbit = false) sehingga portal wali
   * belum melihatnya. Setelah petugas menekan Terbitkan, baris itu tampil di portal wali dan
   * notifikasi push dikirim ke HP wali yang sedang terikat pada siswa tersebut.
   */
  const santriMilikUnit = async (sesi, santriId, res) => {
    const s = await satu(
      `select s.id, s.nama, s.kelas, s.unit_id, s.jenjang_id, s.status,
              u.nama as unit_nama,
              coalesce(j.singkatan, j.nama, '') as jenjang, j.slug as jenjang_slug, j.nama as jenjang_nama
         from santri s
         left join unit_pendidikan u on u.id = s.unit_id
         left join jenjang j on j.id = s.jenjang_id
        where s.id = $1 and s.unit_id = $2`,
      [String(santriId ?? ""), sesi.unit_id],
    );
    if (!s) {
      res.status(404).json({ pesan: "Siswa tidak ditemukan pada sekolah ini." });
      return null;
    }
    return s;
  };

  /** Semester yang sedang berjalan, dipakai sebagai nilai bawaan saat menambah nilai. */
  const semesterBerjalan = async () => {
    const ta = await satu(
      "select nama, semester from tahun_ajaran where aktif order by mulai desc nulls last limit 1",
    );
    if (!ta) return "";
    return [ta.semester, ta.nama].filter(Boolean).join(" ").trim();
  };

  const nilaiSah = (nilai) => {
    const n = Number(String(nilai ?? "").replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 100) return null;
    return Math.round(n * 100) / 100;
  };

  /** Predikat otomatis bila petugas tidak menuliskannya sendiri. */
  const predikatDari = (nilai) => {
    if (nilai >= 90) return "A";
    if (nilai >= 80) return "B+";
    if (nilai >= 70) return "B";
    if (nilai >= 60) return "C";
    return "D";
  };

  const keTanggalIso = (nilai) => {
    if (!nilai) return null;
    if (typeof nilai === "string") return nilai.slice(0, 10);
    const d = new Date(nilai);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  /**
   * Mencari mata pelajaran/mata kuliah yang sudah terdaftar pada jenjang unit ini.
   * Daftarnya didata lewat menu Mata Pelajaran, jadi isian nilai selalu memakai
   * mata pelajaran yang sama dan tidak membuat nama baru yang berbeda-beda.
   */
  const mapelTerdaftar = async (jenjangId, mapelId, namaMapel) => {
    const idDikenal = rapikan(mapelId, 60);
    if (idDikenal) {
      const ada = await satu(
        "select id, nama from mata_pelajaran where id = $1 and jenjang_id = $2",
        [idDikenal, jenjangId],
      );
      if (ada) return ada;
    }
    const nama = rapikan(namaMapel, 80);
    if (!nama) return null;
    return satu(
      "select id, nama from mata_pelajaran where jenjang_id = $1 and lower(nama) = lower($2)",
      [jenjangId, nama],
    );
  };

  const barisNilai = (r) => ({
    id: r.id,
    mapelId: r.mapel_id ?? "",
    mapel: r.mapel ?? "",
    semester: r.semester ?? "",
    nilai: Number(r.nilai) || 0,
    predikat: r.predikat ?? "",
    terbit: r.terbit === true,
    terbitPada: r.terbit_pada ? new Date(r.terbit_pada).toISOString() : null,
    diperbarui: r.diperbarui ? new Date(r.diperbarui).toISOString() : null,
  });

  const barisSetoran = (r) => ({
    id: r.id,
    tanggal: keTanggalIso(r.tanggal),
    juz: r.juz ?? null,
    surah: r.surah ?? null,
    ayatMulai: r.ayat_mulai ?? null,
    ayatSelesai: r.ayat_selesai ?? null,
    /* Berapa ayat yang disetor pada rentang itu. */
    jumlahAyat:
      r.ayat_mulai && r.ayat_selesai && r.ayat_selesai >= r.ayat_mulai
        ? r.ayat_selesai - r.ayat_mulai + 1
        : null,
    materi: r.materi ?? "",
    jenis: r.jenis ?? "",
    penilai: r.penilai ?? "",
    nilai: r.nilai ?? "",
    catatan: r.catatan ?? "",
    terbit: r.terbit === true,
    terbitPada: r.terbit_pada ? new Date(r.terbit_pada).toISOString() : null,
  });

  /** Seluruh nilai & catatan tahfidz satu siswa, termasuk yang belum diterbitkan. */
  const muatanNilai = async (s) => {
    const nilai = await tanya(
      `select n.id, n.mapel_id, n.semester, n.nilai, n.predikat, n.terbit, n.terbit_pada, n.diperbarui,
              m.nama as mapel
         from nilai n
         join mata_pelajaran m on m.id = n.mapel_id
        where n.santri_id = $1
        order by m.nama`,
      [s.id],
    );
    /* Hanya mata pelajaran yang terdaftar pada jenjang unit ini (menu Mata Pelajaran). */
    const mapel = await tanya(
      `select id, nama from mata_pelajaran
        where aktif and jenjang_id = $1
        order by kelompok nulls last, nama`,
      [s.jenjang_id],
    );
    const setoran = await tanya(
      `select id, tanggal, juz, surah, ayat_mulai, ayat_selesai, materi, jenis, penilai, nilai, catatan, terbit, terbit_pada
         from setoran_tahfidz
        where santri_id = $1
        order by tanggal desc nulls last, diperbarui desc
        limit 200`,
      [s.id],
    );

    const daftarNilai = nilai.rows.map(barisNilai);
    const daftarSetoran = setoran.rows.map(barisSetoran);
    return {
      siswa: {
        id: s.id,
        nama: s.nama,
        kelas: s.kelas ?? "",
        jenjang: s.jenjang ?? "",
      },
      mapel: mapel.rows.map((m) => ({ id: m.id, nama: m.nama })),
      nilai: daftarNilai,
      /* Tahfidz hanya berisi catatan setoran; capaian/target tidak dipakai lagi. */
      tahfidz: { setoran: daftarSetoran },
      ringkas: {
        nilai: {
          jumlah: daftarNilai.length,
          terbit: daftarNilai.filter((n) => n.terbit).length,
          menunggu: daftarNilai.filter((n) => !n.terbit).length,
        },
        tahfidz: {
          setoran: daftarSetoran.length,
          menunggu: daftarSetoran.filter((t) => !t.terbit).length,
        },
      },
    };
  };

  /**
   * Kirim notifikasi ke HP wali siswa ini memakai kalimat baku dari modul notifikasiWali,
   * supaya isinya sama dengan peristiwanya dan menyebut nama lengkap peserta.
   */
  const beriTahuWali = async (s, buatPesan) => {
    try {
      return await push.kirimKeSantri(s.id, buatPesan(s));
    } catch (e) {
      console.error("Notifikasi push gagal:", e.message);
      return null;
    }
  };

  const catatanPengiriman = pesanWali.catatanPengiriman;

  app.get("/api/unit/sekolah/nilai/:santriId", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const s = await santriMilikUnit(sesi, req.params.santriId, res);
      if (!s) return;
      res.json({ ok: true, semesterBerjalan: await semesterBerjalan(), ...(await muatanNilai(s)) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Tambah atau perbarui satu nilai. Isian baru selalu berstatus belum terbit. */
  app.post("/api/unit/sekolah/nilai", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const s = await santriMilikUnit(sesi, req.body?.santriId, res);
      if (!s) return;

      const angka = nilaiSah(req.body?.nilai);
      if (angka === null) return res.status(400).json({ pesan: "Nilai harus berupa angka 0 sampai 100." });
      const mapel = await mapelTerdaftar(s.jenjang_id, req.body?.mapelId, req.body?.mapel);
      if (!mapel) {
        return res.status(400).json({
          pesan: "Mata pelajaran belum terdaftar pada jenjang ini. Tambahkan dulu pada menu Mata Pelajaran.",
        });
      }

      const semester = rapikan(req.body?.semester, 60) ?? (await semesterBerjalan()) ?? "";
      const predikat = rapikan(req.body?.predikat, 8) ?? predikatDari(angka);

      await tanya(
        `insert into nilai (santri_id, mapel_id, semester, nilai, predikat, terbit, terbit_pada, diperbarui)
         values ($1, $2, $3, $4, $5, false, null, now())
         on conflict (santri_id, mapel_id, semester) do update
           set nilai = excluded.nilai, predikat = excluded.predikat,
               terbit = false, terbit_pada = null, diperbarui = now()`,
        [s.id, mapel.id, semester, angka, predikat],
      );

      res.json({
        ok: true,
        ...(await muatanNilai(s)),
        pesan: `Nilai ${mapel.nama} untuk ${s.nama} disimpan. Tekan Terbitkan nilai agar tampil di portal wali.`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/unit/sekolah/nilai/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const baris = await satu(
        `select n.id, n.santri_id from nilai n join santri s on s.id = n.santri_id
          where n.id = $1 and s.unit_id = $2`,
        [String(req.params.id), sesi.unit_id],
      );
      if (!baris) return res.status(404).json({ pesan: "Nilai tidak ditemukan pada sekolah ini." });
      const s = await santriMilikUnit(sesi, baris.santri_id, res);
      if (!s) return;

      const angka = nilaiSah(req.body?.nilai);
      if (angka === null) return res.status(400).json({ pesan: "Nilai harus berupa angka 0 sampai 100." });
      const predikat = rapikan(req.body?.predikat, 8) ?? predikatDari(angka);
      const semester = rapikan(req.body?.semester, 60);

      await tanya(
        `update nilai
            set nilai = $2, predikat = $3, semester = coalesce($4, semester),
                terbit = false, terbit_pada = null, diperbarui = now()
          where id = $1`,
        [baris.id, angka, predikat, semester],
      );

      res.json({
        ok: true,
        ...(await muatanNilai(s)),
        pesan: "Nilai diperbarui dan perlu diterbitkan kembali agar perubahan tampil di portal wali.",
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.delete("/api/unit/sekolah/nilai/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const baris = await satu(
        `select n.id, n.santri_id from nilai n join santri s on s.id = n.santri_id
          where n.id = $1 and s.unit_id = $2`,
        [String(req.params.id), sesi.unit_id],
      );
      if (!baris) return res.status(404).json({ pesan: "Nilai tidak ditemukan pada sekolah ini." });
      const s = await santriMilikUnit(sesi, baris.santri_id, res);
      if (!s) return;

      await tanya("delete from nilai where id = $1", [baris.id]);
      res.json({ ok: true, ...(await muatanNilai(s)), pesan: "Nilai dihapus." });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Terbitkan seluruh nilai yang belum terbit, lalu beri tahu HP wali siswa ini. */
  app.post("/api/unit/sekolah/nilai/terbit", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const s = await santriMilikUnit(sesi, req.body?.santriId, res);
      if (!s) return;

      const hasil = await tanya(
        `update nilai set terbit = true, terbit_pada = now()
          where santri_id = $1 and terbit = false
          returning id`,
        [s.id],
      );
      const jumlah = hasil.rowCount ?? 0;
      if (jumlah === 0) {
        return res.json({ ok: true, jumlah: 0, ...(await muatanNilai(s)), pesan: "Tidak ada nilai baru untuk diterbitkan." });
      }

      /* Wali diberi tahu nilai mana yang sudah terbit, lengkap dengan nama peserta. */
      const semester = await satu(
        `select n.semester from nilai n where n.santri_id = $1 and n.semester is not null
          order by n.terbit_pada desc nulls last limit 1`,
        [s.id],
      );
      const notifikasi = await beriTahuWali(s, (peserta) =>
        pesanWali.nilaiTerbit({ santri: peserta, jumlah, semester: semester?.semester ?? "" }),
      );

      res.json({
        ok: true,
        jumlah,
        notifikasi: notifikasi ? { perangkat: notifikasi.perangkat, terkirim: notifikasi.terkirim } : null,
        ...(await muatanNilai(s)),
        pesan: `Nilai ${s.nama} diterbitkan dan sudah tampil di portal wali.${catatanPengiriman(notifikasi)}`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* -------------------------------- tahfidz -------------------------------- */

  /** Catat satu setoran hafalan: surat, rentang ayat, jenis, penilai. */
  app.post("/api/unit/sekolah/tahfidz", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const s = await santriMilikUnit(sesi, req.body?.santriId, res);
      if (!s) return;

      /* Surat dan ayat setoran diperiksa terhadap jumlah ayat surat yang bersangkutan. */
      const pilihan = periksaSetoran({
        surah: req.body?.surah,
        ayatMulai: req.body?.ayatMulai,
        ayatSelesai: req.body?.ayatSelesai,
      });
      if (!pilihan.sah) return res.status(400).json({ pesan: pilihan.pesan });

      const materi = rapikan(req.body?.materi, 160) ?? `Surat ke-${pilihan.surah} ayat ${pilihan.mulai}–${pilihan.selesai}`;

      await tanya(
        `insert into setoran_tahfidz (id, santri_id, tanggal, juz, surah, ayat_mulai, ayat_selesai, materi, jenis, penilai, nilai, catatan, terbit, terbit_pada, diperbarui)
         values ($1, $2, coalesce($3::date, current_date), $4, $5, $6, $7, $8, $9, $10, $11, $12, false, null, now())`,
        [
          `st-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
          s.id,
          tanggalSah(req.body?.tanggal),
          angkaBulat(req.body?.juz, null),
          pilihan.surah,
          pilihan.mulai,
          pilihan.selesai,
          materi,
          rapikan(req.body?.jenis, 40) ?? "Setoran Baru",
          rapikan(req.body?.penilai, 120) ?? "",
          rapikan(req.body?.nilai, 40) ?? "",
          rapikan(req.body?.catatan, 200),
        ],
      );

      res.json({
        ok: true,
        ...(await muatanNilai(s)),
        pesan: `Setoran ${materi} dicatat (${pilihan.ayat} ayat). Tekan Terbitkan tahfidz agar tampil di portal wali.`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.delete("/api/unit/sekolah/tahfidz/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const baris = await satu(
        `select t.id, t.santri_id from setoran_tahfidz t join santri s on s.id = t.santri_id
          where t.id = $1 and s.unit_id = $2`,
        [String(req.params.id), sesi.unit_id],
      );
      if (!baris) return res.status(404).json({ pesan: "Setoran tidak ditemukan pada sekolah ini." });
      const s = await santriMilikUnit(sesi, baris.santri_id, res);
      if (!s) return;

      await tanya("delete from setoran_tahfidz where id = $1", [baris.id]);
      res.json({ ok: true, ...(await muatanNilai(s)), pesan: "Setoran tahfidz dihapus." });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Terbitkan catatan setoran tahfidz, lalu beri tahu HP wali siswa ini. */
  app.post("/api/unit/sekolah/tahfidz/terbit", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const s = await santriMilikUnit(sesi, req.body?.santriId, res);
      if (!s) return;

      const setoran = await tanya(
        `update setoran_tahfidz set terbit = true, terbit_pada = now()
          where santri_id = $1 and terbit = false
          returning id`,
        [s.id],
      );
      const jumlahSetoran = setoran.rowCount ?? 0;
      if (jumlahSetoran === 0) {
        return res.json({
          ok: true,
          jumlah: 0,
          ...(await muatanNilai(s)),
          pesan: "Tidak ada catatan setoran baru untuk diterbitkan.",
        });
      }

      const notifikasi = await beriTahuWali(s, (peserta) =>
        pesanWali.tahfidzTerbit({ santri: peserta, jumlahSetoran }),
      );

      res.json({
        ok: true,
        jumlah: jumlahSetoran,
        notifikasi: notifikasi ? { perangkat: notifikasi.perangkat, terkirim: notifikasi.terkirim } : null,
        ...(await muatanNilai(s)),
        pesan: `Catatan setoran ${s.nama} diterbitkan dan sudah tampil di portal wali.${catatanPengiriman(notifikasi)}`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });
  /* ----------------------------- mata pelajaran ----------------------------- */

  /**
   * Pendataan mata pelajaran / mata kuliah pada jenjang unit ini.
   *
   * Daftar ini dipakai menu Nilai sebagai pilihan, sehingga nama mata pelajaran tetap
   * seragam. Mata pelajaran yang sudah dipakai pada sebuah nilai tidak dapat dihapus
   * sebelum nilainya dibersihkan, agar nilai peserta didik tidak ikut terhapus.
   */
  const jenjangUnit = async (unitId) => (await satu("select jenjang_id from unit_pendidikan where id = $1", [unitId]))?.jenjang_id ?? null;

  const barisMapel = (r) => ({
    id: r.id,
    nama: r.nama ?? "",
    kode: r.kode ?? "",
    kelompok: r.kelompok ?? "",
    aktif: r.aktif !== false,
    jumlahNilai: angka(r.jumlah_nilai),
    jumlahTerbit: angka(r.jumlah_terbit),
  });

  const daftarMapel = async (unitId, jenjangId) => {
    const { rows } = await tanya(
      `select m.id, m.nama, m.kode, m.kelompok, m.aktif,
              (select count(*)::int from nilai n join santri s on s.id = n.santri_id
                where n.mapel_id = m.id and s.unit_id = $1) as jumlah_nilai,
              (select count(*)::int from nilai n join santri s on s.id = n.santri_id
                where n.mapel_id = m.id and s.unit_id = $1 and n.terbit) as jumlah_terbit
         from mata_pelajaran m
        where m.jenjang_id = $2
        order by m.kelompok nulls last, m.nama`,
      [unitId, jenjangId],
    );
    return rows.map(barisMapel);
  };

  app.get("/api/unit/sekolah/mapel", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const jenjang = await jenjangUnit(sesi.unit_id);
      res.json({ ok: true, mapel: await daftarMapel(sesi.unit_id, jenjang) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/unit/sekolah/mapel", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const nama = rapikan(req.body?.nama, 80);
      if (!nama) return res.status(400).json({ pesan: "Nama mata pelajaran belum diisi." });
      const jenjang = await jenjangUnit(sesi.unit_id);

      const sama = await satu(
        "select id from mata_pelajaran where jenjang_id = $1 and lower(nama) = lower($2)",
        [jenjang, nama],
      );
      if (sama) return res.status(400).json({ pesan: `Mata pelajaran "${nama}" sudah terdaftar.` });

      const id = `mp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
      await tanya(
        `insert into mata_pelajaran (id, nama, kode, jenjang_id, kelompok, aktif)
         values ($1, $2, $3, $4, $5, true)`,
        [id, nama, rapikan(req.body?.kode, 20), jenjang, rapikan(req.body?.kelompok, 40)],
      );

      res.json({
        ok: true,
        id,
        mapel: await daftarMapel(sesi.unit_id, jenjang),
        pesan: `Mata pelajaran ${nama} ditambahkan dan siap dipakai pada menu Nilai.`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/unit/sekolah/mapel/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const jenjang = await jenjangUnit(sesi.unit_id);
      const mapel = await satu(
        "select id, nama from mata_pelajaran where id = $1 and jenjang_id = $2",
        [String(req.params.id), jenjang],
      );
      if (!mapel) return res.status(404).json({ pesan: "Mata pelajaran tidak ditemukan pada jenjang ini." });

      const nama = rapikan(req.body?.nama, 80) ?? mapel.nama;
      const sama = await satu(
        "select id from mata_pelajaran where jenjang_id = $1 and lower(nama) = lower($2) and id <> $3",
        [jenjang, nama, mapel.id],
      );
      if (sama) return res.status(400).json({ pesan: `Mata pelajaran "${nama}" sudah terdaftar.` });

      await tanya(
        `update mata_pelajaran
            set nama = $2, kode = $3, kelompok = $4, aktif = $5
          where id = $1`,
        [
          mapel.id,
          nama,
          rapikan(req.body?.kode, 20),
          rapikan(req.body?.kelompok, 40),
          req.body?.aktif === false ? false : true,
        ],
      );

      res.json({
        ok: true,
        mapel: await daftarMapel(sesi.unit_id, jenjang),
        pesan: `Mata pelajaran ${nama} diperbarui.`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.delete("/api/unit/sekolah/mapel/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const jenjang = await jenjangUnit(sesi.unit_id);
      const mapel = await satu(
        "select id, nama from mata_pelajaran where id = $1 and jenjang_id = $2",
        [String(req.params.id), jenjang],
      );
      if (!mapel) return res.status(404).json({ pesan: "Mata pelajaran tidak ditemukan pada jenjang ini." });

      const dipakai = await satu(
        `select count(*)::int as n from nilai n join santri s on s.id = n.santri_id
          where n.mapel_id = $1 and s.unit_id = $2`,
        [mapel.id, sesi.unit_id],
      );
      if ((dipakai?.n ?? 0) > 0) {
        return res.status(400).json({
          pesan: `Mata pelajaran ini sudah dipakai pada ${dipakai.n} nilai. Hapus nilainya lebih dahulu pada menu Nilai.`,
        });
      }

      await tanya("delete from mata_pelajaran where id = $1", [mapel.id]);
      res.json({
        ok: true,
        mapel: await daftarMapel(sesi.unit_id, jenjang),
        pesan: `Mata pelajaran ${mapel.nama} dihapus.`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });
};
