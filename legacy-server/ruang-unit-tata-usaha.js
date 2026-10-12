/**
 * Rute halaman Admin Tata Usaha:
 *  - statistik tagihan sekolah yang sedang masuk;
 *  - kategori tagihan (SPP bulanan, seragam, dan lain-lain);
 *  - tabel siswa beserta tagihannya: pilih siswa, pilih jenis tagihan, lalu isi datanya.
 *
 * Tagihan tersimpan pada tabel `tagihan` yang terhubung ke siswa, jadi sekolah
 * pemiliknya dibaca lewat `santri.unit_id`. Semua permintaan disaring dengan unit
 * dari sesi, sehingga satu sekolah tidak pernah melihat atau mengubah data sekolah lain.
 */
const bantuanUnit = require("./lib/unit");
const pesanWali = require("./lib/notifikasiWali");

module.exports = function pasangRuteUnitTataUsaha(app, { tanya, push, tagihanBulanan }) {
  const { satu, sekolahWajib, angka } = bantuanUnit(tanya);

  const daftar = async (sql, nilai) => (await tanya(sql, nilai)).rows || [];

  /* Kolom tanggal dari Postgres kembali sebagai objek Date, jadi diformat ke YYYY-MM-DD. */
  const keTanggalIso = (nilai) => {
    if (!nilai) return null;
    const d = nilai instanceof Date ? nilai : new Date(nilai);
    return Number.isNaN(d.getTime()) ? String(nilai).slice(0, 10) : d.toISOString().slice(0, 10);
  };

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

  const nominalSah = (nilai) => {
    const n = Number(String(nilai ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
  };

  /** Data peserta didik untuk menyusun notifikasi: nama, kelas, dan unit pendidikannya. */
  const pesertaLengkap = async (santriId) =>
    satu(
      `select s.id, s.nama, s.kelas, u.nama as unit_nama,
              coalesce(j.singkatan, j.nama, '') as jenjang, j.slug as jenjang_slug, j.nama as jenjang_nama
         from santri s
         left join unit_pendidikan u on u.id = s.unit_id
         left join jenjang j on j.id = s.jenjang_id
        where s.id = $1`,
      [santriId],
    );

  /**
   * Kirim notifikasi ke HP wali satu peserta didik. Isi pesannya disusun modul
   * notifikasiWali supaya selalu menyebut nama lengkap peserta dan kejadian aslinya.
   * Kegagalan push tidak pernah membatalkan data yang baru disimpan.
   */
  const beriTahuWali = async (santriId, buatPesan) => {
    try {
      const peserta = await pesertaLengkap(santriId);
      if (!peserta) return null;
      return await push.kirimKeSantri(santriId, buatPesan(peserta));
    } catch (e) {
      console.error("Notifikasi push gagal:", e.message);
      return null;
    }
  };

  const barisTagihan = (r) => ({
    id: r.id,
    jenis: r.jenis ?? "",
    label: r.label ?? "",
    jumlah: angka(r.jumlah),
    status: r.status ?? "belum",
    keterangan: r.keterangan ?? "",
    jatuhTempo: keTanggalIso(r.jatuh_tempo),
    periode: r.periode ?? null,
    kategoriId: r.kategori_id ?? "",
    dibuat: r.dibuat ? new Date(r.dibuat).toISOString() : null,
    santri: r.santri ?? "",
    kelas: r.kelas ?? "",
  });

  /* --------------------------------- statistik -------------------------------- */

  app.get("/api/unit/tata-usaha/statistik", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const otomatisBulanan = await siapkanTagihanBulanan(sesi.unit_id);
      const dibuatBulanIni = otomatisBulanan.dibuat;
      /* Berapa HP wali yang benar-benar terdaftar untuk menerima notifikasi unit ini. */
      const perangkatWali = await satu(
        `select count(*)::int as n from push_langganan l
           join santri s on s.id = l.santri_id
          where s.unit_id = $1`,
        [sesi.unit_id],
      );

      const unit = await satu(
        `select u.id, u.nama, u.slug, u.pimpinan, coalesce(j.singkatan, j.nama, '') as jenjang,
                a.admin_tu
           from unit_pendidikan u
           left join jenjang j on j.id = u.jenjang_id
           left join admin_unit_sekolah a on a.unit_id = u.id
          where u.id = $1`,
        [sesi.unit_id],
      );
      if (!unit) return res.status(404).json({ pesan: "Sekolah tidak ditemukan." });

      /* Ringkasan tagihan: lunas, belum bayar, menunggu verifikasi, lewat jatuh tempo. */
      const t = (await satu(
        `select count(*)::int as jumlah,
                coalesce(sum(t.jumlah), 0) as total,
                count(*) filter (where t.status = 'lunas')::int as jumlah_lunas,
                coalesce(sum(t.jumlah) filter (where t.status = 'lunas'), 0) as lunas,
                count(*) filter (where t.status = 'belum')::int as jumlah_belum,
                coalesce(sum(t.jumlah) filter (where t.status = 'belum'), 0) as belum,
                count(*) filter (where t.status = 'menunggu')::int as jumlah_menunggu,
                coalesce(sum(t.jumlah) filter (where t.status = 'menunggu'), 0) as menunggu,
                count(*) filter (where t.status = 'batal')::int as jumlah_batal,
                count(distinct t.santri_id) filter (where t.status in ('belum', 'menunggu'))::int as siswa_menunggak,
                count(*) filter (where t.status in ('belum','menunggu') and t.jatuh_tempo < current_date)::int as jumlah_lewat,
                coalesce(sum(t.jumlah) filter (where t.status in ('belum','menunggu') and t.jatuh_tempo < current_date), 0) as lewat
           from tagihan t
           join santri s on s.id = t.santri_id
          where s.unit_id = $1`,
        [unit.id],
      )) || {};

      /* Ringkasan pembayaran dari wali santri. */
      const p = (await satu(
        `select coalesce(sum(p.jumlah) filter (where p.status = 'menunggu'), 0) as menerima_jumlah,
                count(*) filter (where p.status = 'menunggu')::int as jumlah_menunggu,
                coalesce(sum(p.jumlah) filter (where p.status = 'terverifikasi'), 0) as terverifikasi,
                count(*) filter (where p.status = 'terverifikasi')::int as jumlah_terverifikasi,
                count(*) filter (where p.status = 'ditolak')::int as jumlah_ditolak,
                coalesce(sum(p.jumlah) filter (
                  where p.status = 'terverifikasi'
                    and date_trunc('month', coalesce(p.diverifikasi_pada, p.dibayar_pada::timestamptz)) = date_trunc('month', current_date)
                ), 0) as bulan_ini,
                count(*) filter (
                  where p.status = 'terverifikasi'
                    and date_trunc('month', coalesce(p.diverifikasi_pada, p.dibayar_pada::timestamptz)) = date_trunc('month', current_date)
                )::int as jumlah_bulan_ini
           from pembayaran p
           join santri s on s.id = p.santri_id
          where s.unit_id = $1`,
        [unit.id],
      )) || {};

      /* Tunggakan per jenis tagihan. */
      const perJenis = (
        await daftar(
          `select coalesce(nullif(trim(t.jenis), ''), 'Lain-lain') as jenis,
                  count(*)::int as jumlah,
                  coalesce(sum(t.jumlah), 0) as total,
                  coalesce(sum(t.jumlah) filter (where t.status = 'lunas'), 0) as lunas
             from tagihan t
             join santri s on s.id = t.santri_id
            where s.unit_id = $1 and t.status <> 'batal'
            group by 1
            order by 3 desc`,
          [unit.id],
        )
      ).map((r) => ({
        jenis: r.jenis,
        jumlah: angka(r.jumlah),
        total: angka(r.total),
        lunas: angka(r.lunas),
        tunggakan: angka(r.total) - angka(r.lunas),
      }));

      /* Tagihan terbaru dan tagihan yang belum dibayar. */
      const pilihTagihan = `select t.id, t.label, t.jenis, t.jumlah, t.status, t.keterangan, t.jatuh_tempo, t.dibuat,
                                   s.nama as santri, coalesce(s.kelas, '') as kelas
                              from tagihan t
                              join santri s on s.id = t.santri_id`;

      const belumDibayar = (
        await daftar(
          `${pilihTagihan}
            where s.unit_id = $1 and t.status in ('belum','menunggu')
            order by t.jatuh_tempo nulls last, t.dibuat desc
            limit 5`,
          [unit.id],
        )
      ).map(barisTagihan);

      const tahunAjaran = await satu("select id, nama from tahun_ajaran where aktif order by mulai desc nulls last limit 1");

      res.json({
        ok: true,
        diperbarui: new Date().toISOString(),
        unit: {
          id: unit.id,
          nama: unit.nama,
          jenjang: unit.jenjang || "",
          pimpinan: unit.pimpinan ?? "",
        },
        pengurusTu: String(unit.admin_tu ?? "").trim(),
        dibuatOtomatis: dibuatBulanIni,
        notifikasiOtomatis: otomatisBulanan.notifikasi,
        perangkatOtomatis: perangkatWali?.n ?? 0,
        tahunAjaran: tahunAjaran ? { id: tahunAjaran.id, nama: tahunAjaran.nama } : null,
        tagihan: {
          jumlah: angka(t.jumlah),
          total: angka(t.total),
          siswaMenunggak: angka(t.siswa_menunggak),
          lunas: { jumlah: angka(t.jumlah_lunas), nominal: angka(t.lunas) },
          belum: { jumlah: angka(t.jumlah_belum), nominal: angka(t.belum) },
          menunggu: { jumlah: angka(t.jumlah_menunggu), nominal: angka(t.menunggu) },
          batal: { jumlah: angka(t.jumlah_batal) },
          lewatJatuhTempo: { jumlah: angka(t.jumlah_lewat), nominal: angka(t.lewat) },
          belumLunas: {
            jumlah: angka(t.jumlah_belum) + angka(t.jumlah_menunggu),
            nominal: angka(t.belum) + angka(t.menunggu),
          },
          perJenis,
          belumDibayar,
        },
        pembayaran: {
          menunggu: { jumlah: angka(p.jumlah_menunggu), nominal: angka(p.menerima_jumlah) },
          terverifikasi: { jumlah: angka(p.jumlah_terverifikasi), nominal: angka(p.terverifikasi) },
          ditolak: { jumlah: angka(p.jumlah_ditolak) },
          bulanIni: { jumlah: angka(p.jumlah_bulan_ini), nominal: angka(p.bulan_ini) },
        },
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* --------------------------- tagihan bulanan otomatis --------------------------- */

  /** "2026-10" untuk bulan yang sedang berjalan. */
  const periodeSekarang = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  /** Tanggal jatuh tempo (YYYY-MM-DD) pada bulan tertentu, dijaga agar tetap sah. */
  const tanggalTempo = (periode, hari) => {
    const [tahun, bulan] = String(periode).split("-").map((n) => Number.parseInt(n, 10));
    const akhir = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
    const tgl = Math.min(Math.max(Number.parseInt(String(hari), 10) || 1, 1), akhir);
    return `${periode}-${String(tgl).padStart(2, "0")}`;
  };

  /** Tanggal jatuh tempo kategori: angka 1–31, atau null bila tidak diisi. */
  const tanggalBulanSah = (nilai) => {
    const n = Number.parseInt(String(nilai ?? ""), 10);
    return Number.isFinite(n) && n >= 1 && n <= 31 ? n : null;
  };

  /**
   * Membuat tagihan bulan berjalan sekaligus menyiapkan notifikasinya untuk wali.
   *
   * Tagihan bulanan dibuat otomatis saat halaman ini dibuka (layanan ini tidak punya
   * penjadwal). Notifikasi untuk seluruh wali dimasukkan ke antrean lalu dikerjakan
   * bertahap, supaya permintaan petugas tidak menunggu lama.
   */
  const siapkanTagihanBulanan = async (unitId) => {
    const otomatis = await tagihanBulanan.pastikan(unitId);
    if (otomatis.dibuat > 0) {
      const antre = await tagihanBulanan.antreNotifikasi(otomatis.baris);
      tagihanBulanan.kerjakanAntrean(unitId, { batas: 60, waktuMs: 20000 }).catch(() => {});
      return { ...otomatis, notifikasi: antre.jumlah };
    }
    return { ...otomatis, notifikasi: 0 };
  };

  /* ----------------------------- kategori tagihan ----------------------------- */

  /** Siswa atau mahasiswa, menurut jenjang sekolah yang sedang masuk. */
  const ambilSebutan = async (unitId) => {
    const j = await satu(
      `select (j.nama ilike '%tinggi%' or coalesce(j.singkatan, '') ilike 'PT') as tinggi
         from unit_pendidikan u left join jenjang j on j.id = u.jenjang_id
        where u.id = $1`,
      [unitId],
    );
    return j && j.tinggi ? "mahasiswa" : "siswa";
  };

  const barisKategori = (r) => ({
    id: r.id,
    nama: r.nama,
    keterangan: r.keterangan ?? "",
    tipe: r.tipe === "bulanan" ? "bulanan" : "sekali",
    jatuhTempoHari: r.jatuh_tempo_hari ? angka(r.jatuh_tempo_hari) : null,
    nominal: angka(r.nominal),
    nilai: angka(r.nilai),
    aktif: r.aktif !== false,
    jumlah: angka(r.jumlah),
    nominal: angka(r.nominal),
    belum: angka(r.belum),
  });

  /** Daftar kategori sekolah beserta berapa tagihan yang memakainya. */
  const ambilKategori = (unitId) =>
    daftar(
      `select k.id, k.nama, k.keterangan, k.aktif, k.tipe, k.nominal, k.jatuh_tempo_hari,
              count(t.id)::int as jumlah,
              coalesce(sum(t.jumlah), 0) as nilai,
              coalesce(sum(t.jumlah) filter (where t.status <> 'lunas' and t.status <> 'batal'), 0) as belum
         from kategori_tagihan k
         left join santri s on s.unit_id = k.unit_id
         left join tagihan t on t.santri_id = s.id and lower(trim(t.jenis)) = lower(k.nama)
        where k.unit_id = $1
        group by k.id
        order by k.urutan, k.nama`,
      [unitId],
    );

  app.get("/api/unit/tata-usaha/kategori", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      await siapkanTagihanBulanan(sesi.unit_id);
      const rows = await ambilKategori(sesi.unit_id);
      res.json({ ok: true, kategori: rows.map(barisKategori), total: rows.length });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/unit/tata-usaha/kategori", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const nama = rapikan(req.body?.nama, 60);
      if (!nama || nama.length < 2) return res.status(400).json({ pesan: "Nama kategori minimal 2 huruf." });

      const id = `kt-${sesi.unit_id}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
      await tanya(
        `insert into kategori_tagihan (id, unit_id, nama, keterangan, tipe, nominal, jatuh_tempo_hari)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [
          id,
          sesi.unit_id,
          nama,
          rapikan(req.body?.keterangan, 200),
          req.body?.tipe === "bulanan" ? "bulanan" : "sekali",
          Math.max(nominalSah(req.body?.nominal) ?? 0, 0),
          tanggalBulanSah(req.body?.jatuhTempoHari),
        ],
      );
      res.json({ ok: true, kategori: (await ambilKategori(sesi.unit_id)).map(barisKategori) });
    } catch (e) {
      if (e && e.code === "23505")
        return res.status(409).json({ pesan: "Kategori dengan nama itu sudah ada. Gunakan nama lain." });
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/unit/tata-usaha/kategori/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const nama = rapikan(req.body?.nama, 60);
      if (!nama || nama.length < 2) return res.status(400).json({ pesan: "Nama kategori minimal 2 huruf." });

      const hasil = await tanya(
        `update kategori_tagihan
            set nama = $3, keterangan = $4, aktif = $5, tipe = $6, nominal = $7,
                jatuh_tempo_hari = $8, diperbarui = now()
          where id = $1 and unit_id = $2`,
        [
          req.params.id,
          sesi.unit_id,
          nama,
          rapikan(req.body?.keterangan, 200),
          req.body?.aktif !== false,
          req.body?.tipe === "bulanan" ? "bulanan" : "sekali",
          Math.max(nominalSah(req.body?.nominal) ?? 0, 0),
          tanggalBulanSah(req.body?.jatuhTempoHari),
        ],
      );
      if (hasil.rowCount === 0) return res.status(404).json({ pesan: "Kategori tidak ditemukan pada sekolah ini." });

      res.json({ ok: true, kategori: (await ambilKategori(sesi.unit_id)).map(barisKategori) });
    } catch (e) {
      if (e && e.code === "23505")
        return res.status(409).json({ pesan: "Kategori dengan nama itu sudah ada. Gunakan nama lain." });
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Tagihan satu kategori: dikelompokkan per bulan bila kategorinya bulanan. */
  app.get("/api/unit/tata-usaha/kategori/:id/tagihan", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const kategori = await satu(
        "select id, nama, keterangan, tipe, nominal, jatuh_tempo_hari from kategori_tagihan where id = $1 and unit_id = $2",
        [req.params.id, sesi.unit_id],
      );
      if (!kategori) return res.status(404).json({ pesan: "Kategori tidak ditemukan pada sekolah ini." });

      const rows = await daftar(
        `select t.id, t.label, t.jenis, t.jumlah, t.status, t.keterangan, t.jatuh_tempo, t.dibuat,
                s.nama as santri, coalesce(s.kelas, '') as kelas,
                to_char(coalesce(t.jatuh_tempo, t.dibuat::date), 'YYYY-MM') as bulan
           from tagihan t
           join santri s on s.id = t.santri_id
          where s.unit_id = $1 and lower(trim(t.jenis)) = lower($2)
          order by coalesce(t.jatuh_tempo, t.dibuat::date) desc, s.nama
          limit 200`,
        [sesi.unit_id, kategori.nama],
      );
      const tagihan = rows.map((r) => ({ ...barisTagihan(r), bulan: r.bulan }));

      /* Dikelompokkan per bulan, bulan terbaru lebih dahulu. */
      const peta = new Map();
      for (const t of tagihan) {
        const kunci = t.bulan ? String(t.bulan) : "tanpa-bulan";
        if (!peta.has(kunci)) peta.set(kunci, { bulan: kunci, jumlah: 0, nominal: 0, lunas: 0, belum: 0, tagihan: [] });
        const b = peta.get(kunci);
        b.jumlah += 1;
        b.nominal += t.jumlah;
        if (t.status === "lunas") b.lunas += t.jumlah;
        else if (t.status !== "batal") b.belum += t.jumlah;
        if (b.tagihan.length < 30) b.tagihan.push(t);
      }

      const bulanIni = await satu(
        `select count(*)::int as siswa,
                count(*) filter (where exists (
                  select 1 from tagihan t
                   where t.santri_id = s.id and lower(trim(t.jenis)) = lower($2) and t.periode = $3
                ))::int as sudah
           from santri s
          where s.unit_id = $1 and coalesce(s.status, 'aktif') = 'aktif'`,
        [sesi.unit_id, kategori.nama, periodeSekarang()],
      );

      res.json({
        ok: true,
        periode: periodeSekarang(),
        bulanIni: { siswa: angka(bulanIni?.siswa), sudahDitagih: angka(bulanIni?.sudah) },
        kategori: { ...barisKategori({ ...kategori, jumlah: tagihan.length }), jumlah: tagihan.length },
        bulan: [...peta.values()].sort((a, b) => String(b.bulan).localeCompare(String(a.bulan))),
        tagihan,
        ringkasan: {
          jumlah: tagihan.length,
          nominal: tagihan.reduce((n, t) => n + t.jumlah, 0),
          lunas: tagihan.filter((t) => t.status === "lunas").reduce((n, t) => n + t.jumlah, 0),
          belum: tagihan.filter((t) => t.status !== "lunas" && t.status !== "batal").reduce((n, t) => n + t.jumlah, 0),
        },
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.delete("/api/unit/tata-usaha/kategori/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const hasil = await tanya("delete from kategori_tagihan where id = $1 and unit_id = $2", [
        req.params.id,
        sesi.unit_id,
      ]);
      if (hasil.rowCount === 0) return res.status(404).json({ pesan: "Kategori tidak ditemukan pada sekolah ini." });

      res.json({ ok: true, kategori: (await ambilKategori(sesi.unit_id)).map(barisKategori) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ------------------------------- menu tagihan ------------------------------- */

  /** Tabel siswa satu sekolah beserta jenis tagihan yang sudah dibuat untuknya. */
  app.get("/api/unit/tata-usaha/tagihan/siswa", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      await siapkanTagihanBulanan(sesi.unit_id);

      const cari = rapikan(req.query.cari, 60) ?? "";
      const saring = req.query.saring === "punya" ? "punya" : "semua";
      const batas = Math.min(Math.max(Number.parseInt(String(req.query.batas ?? "60"), 10) || 60, 1), 200);
      const lewat = Math.max(Number.parseInt(String(req.query.lewat ?? "0"), 10) || 0, 0);

      /* Peserta yang sudah dinyatakan lulus tidak lagi di sini: tagihannya ditangani
         di menu Tunggakan & Lunas. */
      const nilai = [sesi.unit_id];
      let kondisi = "s.unit_id = $1 and s.status is distinct from 'lulus'";
      if (cari) {
        nilai.push(`%${cari}%`);
        kondisi += ` and (s.nama ilike $${nilai.length} or coalesce(s.wali_nama,'') ilike $${nilai.length})`;
      }
      const punya = saring === "punya" ? " having count(t.id) > 0" : "";

      const { rows } = await tanya(
        `select s.id, s.nama, coalesce(s.kelas, '') as kelas, coalesce(s.status, 'aktif') as status,
                coalesce(s.program, '') as program,
                (select p.nama from jurusan p where p.jenjang_id = s.jenjang_id and p.slug = s.program) as program_nama,
                count(t.id)::int as jumlah_tagihan,
                coalesce(sum(t.jumlah) filter (where t.status <> 'lunas' and t.status <> 'batal'), 0) as tunggakan,
                coalesce(array_agg(distinct nullif(trim(t.jenis), ''))
                         filter (where nullif(trim(t.jenis), '') is not null), '{}') as jenis
           from santri s
           left join tagihan t on t.santri_id = s.id
          where ${kondisi}
          group by s.id, s.nama, s.kelas, s.program, s.program, s.jenjang_id, s.status${punya}
          order by s.nama
          limit ${batas} offset ${lewat}`,
        nilai,
      );

      const ringkasan = await satu(
        `select count(distinct s.id)::int as semua,
                count(distinct s.id) filter (where t.id is not null)::int as sudah_ditagih
           from santri s
           left join tagihan t on t.santri_id = s.id
          where s.unit_id = $1 and s.status is distinct from 'lulus'`,
        [sesi.unit_id],
      );

      res.json({
        ok: true,
        cari,
        saring,
        batas,
        lewat,
        penuh: rows.length >= batas,
        sebutan: await ambilSebutan(sesi.unit_id),
        ringkasan: { semua: angka(ringkasan?.semua), sudahDitagih: angka(ringkasan?.sudah_ditagih) },
        siswa: rows.map((r) => ({
          id: r.id,
          nama: r.nama,
          kelas: r.kelas ?? "",
          program: r.program ?? "",
          programNama: r.program_nama ?? "",
          status: r.status ?? "aktif",
          jumlahTagihan: angka(r.jumlah_tagihan),
          tunggakan: angka(r.tunggakan),
          jenis: Array.isArray(r.jenis) ? r.jenis : [],
        })),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Satu siswa: identitasnya, daftar tagihannya, dan pilihan jenis tagihan. */
  app.get("/api/unit/tata-usaha/tagihan/siswa/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const siswa = await satu(
        `select s.id, s.nama, coalesce(s.kelas, '') as kelas, coalesce(s.status, 'aktif') as status,
                coalesce(s.wali_nama, '') as wali_nama, coalesce(s.wali_telepon, '') as wali_telepon,
                coalesce(s.program, '') as program,
                (select p.nama from jurusan p where p.jenjang_id = s.jenjang_id and p.slug = s.program) as program_nama
           from santri s where s.id = $1 and s.unit_id = $2`,
        [req.params.id, sesi.unit_id],
      );
      if (!siswa) return res.status(404).json({ pesan: "Siswa tidak ditemukan pada sekolah ini." });

      const rows = await daftar(
        `select t.id, t.label, t.jenis, t.jumlah, t.status, t.keterangan, t.jatuh_tempo, t.dibuat,
                t.periode, t.kategori_id
           from tagihan t
          where t.santri_id = $1
          order by t.status = 'lunas', t.jatuh_tempo nulls last, t.dibuat desc`,
        [siswa.id],
      );
      const tagihan = rows.map(barisTagihan);

      /* Jenis tagihan yang sudah dipakai pada tagihan siswa ini tetap disertakan. */
      /* Daftar bulan untuk kategori bulanan: lunas, menunggu, belum bayar, atau belum ditagihkan. */
      const tahun = Math.min(Math.max(Number.parseInt(String(req.query.tahun ?? ""), 10) || new Date().getFullYear(), 2000), 2100);
      const petaBulan = new Map();
      for (const t of tagihan) {
        if (!t.periode) continue;
        const kunci = String(t.jenis).trim().toLowerCase();
        if (!petaBulan.has(kunci)) petaBulan.set(kunci, new Map());
        petaBulan.get(kunci).set(String(t.periode), t);
      }

      const bulanKategori = (k) => {
        const peta = petaBulan.get(String(k.nama).trim().toLowerCase());
        const daftarBulan = [];
        for (let b = 1; b <= 12; b += 1) {
          const periode = `${tahun}-${String(b).padStart(2, "0")}`;
          const ada = peta?.get(periode);
          daftarBulan.push({
            bulan: periode,
            status: ada ? ada.status : "kosong",
            tagihanId: ada?.id ?? "",
            jumlah: ada ? ada.jumlah : angka(k.nominal),
            jatuhTempo: ada?.jatuhTempo ?? null,
          });
        }
        const lunas = daftarBulan.filter((b) => b.status === "lunas").length;
        const menunggu = daftarBulan.filter((b) => b.status === "menunggu").length;
        const belum = daftarBulan.filter((b) => b.status === "belum").length;
        return {
          bulan: daftarBulan,
          bulanLunas: lunas,
          bulanMenunggu: menunggu,
          bulanBelum: belum,
          bulanKosong: daftarBulan.filter((b) => b.status === "kosong").length,
        };
      };

      const kategoriList = (await ambilKategori(sesi.unit_id))
        .map(barisKategori)
        .map((k) => (k.tipe === "bulanan" ? { ...k, tahun, ...bulanKategori(k) } : k));
      const namaKategori = new Set(kategoriList.map((k) => k.nama.toLowerCase()));
      const dariTagihan = [...new Set(tagihan.map((t) => t.jenis).filter(Boolean))]
        .filter((j) => !namaKategori.has(j.toLowerCase()))
        .map((j) => ({ id: `jenis:${j}`, nama: j, keterangan: "", aktif: true, jumlah: 0, nominal: 0, belum: 0, hanyaJenis: true }));

      const riwayat = await daftar(
        `select p.id, p.jumlah, p.metode, p.status, p.label, p.catatan, p.bukti_media_id,
                p.dibayar_pada, p.diverifikasi_pada, p.dibuat, p.tagihan_id, m.url as bukti_url
           from pembayaran p
           left join media m on m.id = p.bukti_media_id
          where p.santri_id = $1
          order by coalesce(p.diverifikasi_pada, p.dibuat) desc
          limit 50`,
        [siswa.id],
      );

      const metode = await daftar(
        `select id, nama, keterangan, bank, nomor, atas_nama, langkah, gambar_url
           from metode_pembayaran where aktif order by urutan, nama`,
      );

      res.json({
        ok: true,
        sebutan: await ambilSebutan(sesi.unit_id),
        tahun,
        periodeSekarang: periodeSekarang(),
        riwayat: riwayat.map((p) => ({
          id: p.id,
          label: p.label ?? "",
          jumlah: angka(p.jumlah),
          metode: p.metode ?? "",
          status: p.status,
          catatan: p.catatan ?? "",
          buktiUrl: p.bukti_url ?? "",
          tagihanId: p.tagihan_id ?? "",
          dibayarPada: keTanggalIso(p.dibayar_pada),
          diverifikasiPada: p.diverifikasi_pada ? new Date(p.diverifikasi_pada).toISOString() : null,
          dibuat: p.dibuat ? new Date(p.dibuat).toISOString() : null,
        })),
        metode: metode.map((m) => ({
          id: m.id,
          nama: m.nama,
          keterangan: m.keterangan ?? "",
          bank: m.bank ?? "",
          nomor: m.nomor ?? "",
          atasNama: m.atas_nama ?? "",
          langkah: Array.isArray(m.langkah) ? m.langkah : [],
          /* Gambar kanal pembayaran (kode QRIS) untuk ditayangkan di portal wali. */
          gambar: m.gambar_url ?? "",
        })),
        siswa: {
          id: siswa.id,
          nama: siswa.nama,
          kelas: siswa.kelas ?? "",
          /* Nama jurusan dipakai bila kelasnya belum ditentukan petugas. */
          program: siswa.program ?? "",
          programNama: siswa.program_nama ?? "",
          status: siswa.status ?? "aktif",
          waliNama: siswa.wali_nama ?? "",
          waliTelepon: siswa.wali_telepon ?? "",
        },
        tagihan,
        kategori: [...kategoriList, ...dariTagihan],
        ringkasan: {
          jumlah: tagihan.length,
          total: tagihan.reduce((n, t) => n + t.jumlah, 0),
          belumLunas: tagihan
            .filter((t) => t.status === "belum" || t.status === "menunggu")
            .reduce((n, t) => n + t.jumlah, 0),
        },
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Nama jenis tagihan dari pilihan kategori; kategori boleh berupa jenis lepasan. */
  const jenisDariPilihan = async (unitId, kategoriId, jenis) => {
    if (kategoriId && !String(kategoriId).startsWith("jenis:")) {
      const k = await satu("select nama from kategori_tagihan where id = $1 and unit_id = $2", [kategoriId, unitId]);
      if (k) return k.nama;
    }
    if (jenis) return rapikan(jenis, 60);
    if (kategoriId) return rapikan(String(kategoriId).slice("jenis:".length), 60);
    return null;
  };

  app.post("/api/unit/tata-usaha/tagihan", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const siswa = await satu("select id, nama, kelas, jenjang_id from santri where id = $1 and unit_id = $2", [
        req.body?.santriId,
        sesi.unit_id,
      ]);
      if (!siswa) return res.status(404).json({ pesan: "Siswa tidak ditemukan pada sekolah ini." });

      const jenis = await jenisDariPilihan(sesi.unit_id, req.body?.kategoriId, req.body?.jenis);
      if (!jenis) return res.status(400).json({ pesan: "Pilih jenis tagihan terlebih dahulu." });

      const jumlah = nominalSah(req.body?.jumlah);
      if (!jumlah) return res.status(400).json({ pesan: "Jumlah tagihan harus lebih dari nol." });

      const tahun = await satu("select id from tahun_ajaran where aktif order by mulai desc nulls last limit 1");
      const id = `tg-${siswa.id}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

      await tanya(
        `insert into tagihan (id, santri_id, jenis, label, keterangan, jumlah, jatuh_tempo, tahun_ajaran_id, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,'belum')`,
        [
          id,
          siswa.id,
          jenis,
          jenis,
          rapikan(req.body?.keterangan, 200),
          jumlah,
          tanggalSah(req.body?.jatuhTempo),
          tahun?.id ?? null,
        ],
      );

      /* Wali diberi tahu begitu tagihannya aktif, lengkap dengan nominal dan jatuh temponya. */
      const notifikasi = await beriTahuWali(siswa.id, (peserta) =>
        pesanWali.tagihanBaru({
          santri: peserta,
          tagihan: { id, label: jenis, jumlah, jatuh_tempo: tanggalSah(req.body?.jatuhTempo) },
        }),
      );

      res.json({
        ok: true,
        id,
        siswa: { id: siswa.id, nama: siswa.nama, kelas: siswa.kelas ?? "" },
        jenis,
        notifikasi: notifikasi ? { perangkat: notifikasi.perangkat, terkirim: notifikasi.terkirim } : null,
        pesan: `Tagihan ${jenis} untuk ${siswa.nama} dibuat dan aktif.${pesanWali.catatanPengiriman(notifikasi)}`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/unit/tata-usaha/tagihan/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const jumlah = nominalSah(req.body?.jumlah);
      if (!jumlah) return res.status(400).json({ pesan: "Jumlah tagihan harus lebih dari nol." });

      const hasil = await tanya(
        `update tagihan t
            set jumlah = $3, jatuh_tempo = $4, keterangan = $5, diperbarui = now()
           from santri s
          where t.id = $1 and s.id = t.santri_id and s.unit_id = $2`,
        [req.params.id, sesi.unit_id, jumlah, tanggalSah(req.body?.jatuhTempo), rapikan(req.body?.keterangan, 200)],
      );
      if (hasil.rowCount === 0) return res.status(404).json({ pesan: "Tagihan tidak ditemukan pada sekolah ini." });

      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.delete("/api/unit/tata-usaha/tagihan/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const hasil = await tanya(
        `delete from tagihan t
           using santri s
          where t.id = $1 and s.id = t.santri_id and s.unit_id = $2`,
        [req.params.id, sesi.unit_id],
      );
      if (hasil.rowCount === 0) return res.status(404).json({ pesan: "Tagihan tidak ditemukan pada sekolah ini." });

      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Buat tagihan satu bulan untuk kategori bulanan (mis. SPP bulan yang terlewat). */
  app.post("/api/unit/tata-usaha/tagihan/bulanan", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const periode = String(req.body?.bulan ?? "").trim();
      if (!/^\d{4}-\d{2}$/.test(periode)) return res.status(400).json({ pesan: "Bulan tagihan tidak sah." });

      const kategori = await satu(
        `select id, nama, tipe, nominal, jatuh_tempo_hari from kategori_tagihan
          where id = $1 and unit_id = $2 and aktif`,
        [req.body?.kategoriId, sesi.unit_id],
      );
      if (!kategori) return res.status(404).json({ pesan: "Kategori tidak ditemukan pada sekolah ini." });
      if (kategori.tipe !== "bulanan") return res.status(400).json({ pesan: "Kategori ini bukan tagihan bulanan." });

      const siswa = await satu("select id, nama, status from santri where id = $1 and unit_id = $2", [
        req.body?.santriId,
        sesi.unit_id,
      ]);
      if (!siswa) return res.status(404).json({ pesan: "Siswa tidak ditemukan pada sekolah ini." });

      const jumlah = nominalSah(req.body?.jumlah) ?? angka(kategori.nominal);
      if (jumlah <= 0) {
        return res.status(400).json({ pesan: "Nominal kategori belum diisi. Isi nominalnya di menu Kategori lebih dahulu." });
      }

      const ada = await satu("select id from tagihan where santri_id = $1 and kategori_id = $2 and periode = $3", [
        siswa.id,
        kategori.id,
        periode,
      ]);
      if (ada) return res.json({ ok: true, sudahAda: true, id: ada.id, pesan: `Tagihan ${kategori.nama} bulan itu sudah ada.` });

      const tahunAjaran = await satu("select id from tahun_ajaran where aktif order by mulai desc nulls last limit 1");
      const tempo = tanggalTempo(periode, kategori.jatuh_tempo_hari ?? 1);

      const hasil = await tanya(
        `insert into tagihan (id, santri_id, jenis, label, keterangan, jumlah, jatuh_tempo, tahun_ajaran_id, status, kategori_id, periode)
         values ('tg-' || $1 || '-' || md5($8 || $3), $1, $2, $2, $4, $5, $6::date, $7, 'belum', $8, $3)
         returning id`,
        [
          siswa.id,
          kategori.nama,
          periode,
          rapikan(req.body?.keterangan, 200),
          jumlah,
          tempo,
          tahunAjaran?.id ?? null,
          kategori.id,
        ],
      );

      const nama = new Date(`${periode}-01T00:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      const notifikasi = await beriTahuWali(siswa.id, (peserta) =>
        pesanWali.tagihanBaru({
          santri: peserta,
          tagihan: { id: hasil.rows[0].id, label: kategori.nama, jumlah, jatuh_tempo: tempo, periode },
        }),
      );

      res.json({
        ok: true,
        id: hasil.rows[0].id,
        notifikasi: notifikasi ? { perangkat: notifikasi.perangkat, terkirim: notifikasi.terkirim } : null,
        pesan: `Tagihan ${kategori.nama} ${nama} untuk ${siswa.nama} dibuat dan aktif.${pesanWali.catatanPengiriman(notifikasi)}`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ------------------------------ menu pembayaran ------------------------------ */

  const rupiahTeks = (nilai) => `Rp${Math.round(Number(nilai) || 0).toLocaleString("id-ID")}`;

  /** Tunggakan satu siswa: jumlah tagihan dan nominal yang belum dibayar. */
  const barisPembayaran = (p) => ({
    id: String(p.id),
    santriId: p.santri_id,
    santri: p.santri,
    kelas: p.kelas ?? "",
    jumlah: angka(p.jumlah),
    metode: p.metode ?? "",
    status: p.status,
    label: p.label ?? "",
    jenis: p.jenis ?? "",
    perLabel: p.tagihan_label ?? "",
    tagihanId: p.tagihan_id ?? "",
    buktiUrl: p.bukti_url ?? "",
    catatan: p.catatan ?? "",
    dibayarPada: keTanggalIso(p.dibayar_pada),
    dibuat: p.dibuat ? new Date(p.dibuat).toISOString() : null,
    diverifikasiPada: p.diverifikasi_pada ? new Date(p.diverifikasi_pada).toISOString() : null,
  });

  const KOLOM_PEMBAYARAN = `p.id, p.jumlah, p.metode, p.status, p.label, p.catatan, p.dibayar_pada, p.dibuat,
              p.diverifikasi_pada, p.tagihan_id, p.santri_id, m.url as bukti_url,
              t.label as tagihan_label, t.jenis,
              s.nama as santri, coalesce(s.kelas, '') as kelas`;

  /**
   * Riwayat pembayaran dikelompokkan per nama: satu baris satu peserta didik, berisi
   * berapa kali ia membayar, berapa nominalnya, dan berapa yang masih menunggu
   * pemeriksaan. Rincian tiap pembayarannya ikut dikirim agar bisa langsung dibuka.
   */
  const ambilPembayaranPerSantri = async (unitId, { saring, cari, santriId }) => {
    const nilai = [unitId];
    let kondisi = "";
    if (saring === "menunggu") kondisi += " and p.status = 'menunggu'";
    if (santriId) {
      nilai.push(santriId);
      kondisi += ` and p.santri_id = $${nilai.length}`;
    }
    if (cari) {
      nilai.push(`%${cari}%`);
      kondisi += ` and (s.nama ilike $${nilai.length} or coalesce(s.kelas, '') ilike $${nilai.length})`;
    }

    const kelompok = await daftar(
      `select p.santri_id, s.nama as santri, coalesce(s.kelas, '') as kelas,
              count(*)::int as jumlah,
              coalesce(sum(p.jumlah), 0) as total,
              count(*) filter (where p.status = 'menunggu')::int as menunggu_jumlah,
              coalesce(sum(p.jumlah) filter (where p.status = 'menunggu'), 0) as menunggu_nominal,
              count(*) filter (where p.status = 'terverifikasi')::int as terverifikasi_jumlah,
              coalesce(sum(p.jumlah) filter (where p.status = 'terverifikasi'), 0) as terverifikasi_nominal,
              count(*) filter (where p.status = 'ditolak')::int as ditolak_jumlah,
              max(p.dibuat) as terakhir
         from pembayaran p
         join santri s on s.id = p.santri_id
        where s.unit_id = $1 ${kondisi}
        group by p.santri_id, s.nama, s.kelas
        order by max(p.dibuat) desc
        limit 120`,
      nilai,
    );
    if (kelompok.length === 0) return [];

    /* Seluruh riwayat milik nama-nama itu, pembayaran terbaru lebih dahulu. */
    const riwayat = await daftar(
      `select ${KOLOM_PEMBAYARAN}
         from pembayaran p
         join santri s on s.id = p.santri_id
         left join tagihan t on t.id = p.tagihan_id
         left join media m on m.id = p.bukti_media_id
        where s.unit_id = $1 and p.santri_id = any($2::text[])
        order by p.dibuat desc, p.dibayar_pada desc
        limit 900`,
      [unitId, kelompok.map((k) => k.santri_id)],
    );

    const perSantri = new Map();
    for (const r of riwayat) {
      const daftarBaris = perSantri.get(r.santri_id) ?? [];
      daftarBaris.push(barisPembayaran(r));
      perSantri.set(r.santri_id, daftarBaris);
    }

    return kelompok.map((k) => ({
      id: k.santri_id,
      nama: k.santri,
      kelas: k.kelas ?? "",
      jumlah: angka(k.jumlah),
      total: angka(k.total),
      menunggu: { jumlah: angka(k.menunggu_jumlah), nominal: angka(k.menunggu_nominal) },
      terverifikasi: { jumlah: angka(k.terverifikasi_jumlah), nominal: angka(k.terverifikasi_nominal) },
      ditolak: { jumlah: angka(k.ditolak_jumlah) },
      terakhir: k.terakhir ? new Date(k.terakhir).toISOString() : null,
      pembayaran: perSantri.get(k.santri_id) ?? [],
    }));
  };

  app.get("/api/unit/tata-usaha/pembayaran", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      await siapkanTagihanBulanan(sesi.unit_id);
      const saring = req.query.saring === "semua" ? "semua" : "menunggu";
      const cari = rapikan(req.query.cari, 60) ?? "";

      const ringkasan = (await satu(
        `select count(*) filter (where p.status = 'menunggu')::int as jumlah_menunggu,
                coalesce(sum(p.jumlah) filter (where p.status = 'menunggu'), 0) as nominal_menunggu,
                count(*) filter (where p.status = 'terverifikasi')::int as jumlah_terverifikasi,
                coalesce(sum(p.jumlah) filter (where p.status = 'terverifikasi'), 0) as nominal_terverifikasi,
                count(*) filter (where p.status = 'terverifikasi'
                                   and date_trunc('month', coalesce(p.diverifikasi_pada, p.dibuat)) = date_trunc('month', current_date))::int as jumlah_bulan_ini,
                coalesce(sum(p.jumlah) filter (where p.status = 'terverifikasi'
                                   and date_trunc('month', coalesce(p.diverifikasi_pada, p.dibuat)) = date_trunc('month', current_date)), 0) as nominal_bulan_ini
           from pembayaran p
           join santri s on s.id = p.santri_id
          where s.unit_id = $1`,
        [sesi.unit_id],
      )) || {};

      res.json({
        ok: true,
        saring,
        cari,
        sebutan: await ambilSebutan(sesi.unit_id),
        ringkasan: {
          menunggu: { jumlah: angka(ringkasan.jumlah_menunggu), nominal: angka(ringkasan.nominal_menunggu) },
          terverifikasi: { jumlah: angka(ringkasan.jumlah_terverifikasi), nominal: angka(ringkasan.nominal_terverifikasi) },
          bulanIni: { jumlah: angka(ringkasan.jumlah_bulan_ini), nominal: angka(ringkasan.nominal_bulan_ini) },
        },
        santri: await ambilPembayaranPerSantri(sesi.unit_id, { saring, cari }),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /**
   * Riwayat pembayaran satu peserta beserta ringkasan tagihannya.
   * Dipakai tabel Lunas di menu Tunggakan & Lunas: menekan satu nama menampilkan
   * riwayat pembayarannya, bukan borang pembayaran.
   */
  app.get("/api/unit/tata-usaha/pembayaran/santri/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const santri = await satu(
        `select s.id, s.nama, coalesce(s.kelas, '') as kelas, coalesce(s.program, '') as program,
                coalesce(s.status, 'aktif') as status,
                (select p.nama from jurusan p where p.jenjang_id = s.jenjang_id and p.slug = s.program) as program_nama,
                (select count(*)::int from tagihan t where t.santri_id = s.id and t.status <> 'batal') as jumlah_tagihan,
                coalesce((select sum(t.jumlah) from tagihan t where t.santri_id = s.id and t.status in ('belum','menunggu')), 0) as tunggakan,
                (select max(coalesce(t.diperbarui, t.dibuat)) from tagihan t
                  where t.santri_id = s.id and t.status = 'lunas') as lunas_terakhir
           from santri s
          where s.id = $1 and s.unit_id = $2`,
        [req.params.id, sesi.unit_id],
      );
      if (!santri) return res.status(404).json({ pesan: "Peserta ini tidak ditemukan pada unit tersebut." });

      const riwayat = await ambilPembayaranPerSantri(sesi.unit_id, {
        saring: "semua",
        cari: "",
        santriId: santri.id,
      });

      res.json({
        ok: true,
        sebutan: await ambilSebutan(sesi.unit_id),
        santri: {
          id: santri.id,
          nama: santri.nama,
          kelas: santri.kelas ?? "",
          program: santri.program ?? "",
          programNama: santri.program_nama ?? "",
          status: santri.status ?? "aktif",
          jumlahTagihan: angka(santri.jumlah_tagihan),
          tunggakan: angka(santri.tunggakan),
          lunasTerakhir: santri.lunas_terakhir ? new Date(santri.lunas_terakhir).toISOString() : null,
        },
        riwayat: riwayat[0] ?? null,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Verifikasi pembayaran: tagihannya jadi lunas dan pembayarannya masuk riwayat. */
  app.post("/api/unit/tata-usaha/pembayaran/:id/verifikasi", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const p = await satu(
        `select p.id, p.status, p.jumlah, p.tagihan_id, p.label, p.santri_id, s.nama as santri
           from pembayaran p join santri s on s.id = p.santri_id
          where p.id = $1 and s.unit_id = $2`,
        [req.params.id, sesi.unit_id],
      );
      if (!p) return res.status(404).json({ pesan: "Pembayaran tidak ditemukan pada sekolah ini." });
      if (p.status === "terverifikasi") return res.json({ ok: true, pesan: "Pembayaran ini sudah diverifikasi." });

      await tanya(
        `update pembayaran set status = 'terverifikasi', diverifikasi_pada = now(), diperbarui = now() where id = $1`,
        [p.id],
      );

      let lunas = false;
      if (p.tagihan_id) {
        const hasil = await tanya(
          `update tagihan set status = 'lunas', diperbarui = now() where id = $1 and status <> 'batal'`,
          [p.tagihan_id],
        );
        lunas = (hasil.rowCount ?? 0) > 0;
      }

      /* Notifikasi ke HP wali santri yang bersangkutan — hanya HP milik wali itu. */
      const notifikasi = await beriTahuWali(p.santri_id, (peserta) =>
        pesanWali.pembayaranDiverifikasi({ santri: peserta, pembayaran: p, lunas }),
      );

      res.json({
        ok: true,
        lunas,
        notifikasi: notifikasi ? { perangkat: notifikasi.perangkat, terkirim: notifikasi.terkirim } : null,
        pesan: `${
          lunas
            ? `Pembayaran ${rupiahTeks(p.jumlah)} diverifikasi. Tagihan ${p.label || ""} lunas dan tersimpan di riwayat.`
            : `Pembayaran ${rupiahTeks(p.jumlah)} diverifikasi dan tersimpan di riwayat.`
        }${pesanWali.catatanPengiriman(notifikasi)}`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Tolak pembayaran: tagihannya kembali jadi belum dibayar. */
  app.post("/api/unit/tata-usaha/pembayaran/:id/tolak", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const p = await satu(
        `select p.id, p.status, p.tagihan_id, p.jumlah, p.label, p.santri_id, s.nama as santri
           from pembayaran p join santri s on s.id = p.santri_id
          where p.id = $1 and s.unit_id = $2`,
        [req.params.id, sesi.unit_id],
      );
      if (!p) return res.status(404).json({ pesan: "Pembayaran tidak ditemukan pada sekolah ini." });

      const alasan = rapikan(req.body?.catatan, 200);
      await tanya(
        `update pembayaran set status = 'ditolak', catatan = coalesce($2, catatan), diperbarui = now() where id = $1`,
        [p.id, alasan],
      );

      if (p.tagihan_id) {
        await tanya(
          `update tagihan set status = 'belum', diperbarui = now() where id = $1 and status = 'menunggu'`,
          [p.tagihan_id],
        );
      }

      const notifikasi = await beriTahuWali(p.santri_id, (peserta) =>
        pesanWali.pembayaranDitolak({ santri: peserta, pembayaran: p, alasan }),
      );

      res.json({
        ok: true,
        notifikasi: notifikasi ? { perangkat: notifikasi.perangkat, terkirim: notifikasi.terkirim } : null,
        pesan: `Pembayaran ditolak. Tagihannya kembali berstatus belum dibayar.${pesanWali.catatanPengiriman(notifikasi)}`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Catat pembayaran yang diterima bendahara, lalu menunggu verifikasi. */
  app.post("/api/unit/tata-usaha/tagihan/:id/bayar", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const t = await satu(
        `select t.id, t.label, t.jenis, t.jumlah, t.status, t.santri_id, s.nama as santri
           from tagihan t join santri s on s.id = t.santri_id
          where t.id = $1 and s.unit_id = $2`,
        [req.params.id, sesi.unit_id],
      );
      if (!t) return res.status(404).json({ pesan: "Tagihan tidak ditemukan pada sekolah ini." });
      if (t.status === "lunas") return res.status(400).json({ pesan: "Tagihan ini sudah lunas." });
      if (t.status === "batal") return res.status(400).json({ pesan: "Tagihan ini dibatalkan." });

      const metode = rapikan(req.body?.metode, 60) ?? "Tunai di Bendahara";
      /* Bila metodenya dipilih dari daftar, id-nya ikut disimpan agar asalnya tetap terlacak. */
      const metodeId = rapikan(req.body?.metodeId, 40) ?? null;
      const jumlah = nominalSah(req.body?.jumlah) ?? angka(t.jumlah);
      const id = `pb-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

      await tanya(
        `insert into pembayaran (santri_id, tagihan_id, label, jumlah, metode_id, metode, status, catatan, dibayar_pada)
         values ($1,$2,$3,$4,$5,$6,'menunggu',$7,$8)`,
        [
          t.santri_id,
          t.id,
          t.label,
          jumlah,
          metodeId,
          metode,
          rapikan(req.body?.catatan, 200),
          tanggalSah(req.body?.dibayarPada) ?? keTanggalIso(new Date()),
        ],
      );

      await tanya(`update tagihan set status = 'menunggu', diperbarui = now() where id = $1`, [t.id]);

      res.json({
        ok: true,
        id,
        pesan: `Pembayaran ${rupiahTeks(jumlah)} untuk ${t.santri} dicatat dan menunggu verifikasi.`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ----------------------------- tunggakan & lunas ----------------------------- */

  const barisLaporan = (r) => ({
    id: r.id,
    nama: r.nama,
    kelas: r.kelas ?? "",
    program: r.program ?? "",
    programNama: r.program_nama ?? "",
    status: r.status ?? "aktif",
    jumlahTagihan: angka(r.jumlah),
    nominal: angka(r.nominal),
    /* Tunggakan: jatuh tempo terdekat. Lunas: kapan tagihannya terakhir diperbarui. */
    jatuhTempo: keTanggalIso(r.jatuh_terdekat),
    terakhir: r.terakhir ? new Date(r.terakhir).toISOString() : null,
  });

  /**
   * Laporan tagihan untuk peserta didik yang sudah dinyatakan lulus di Admin Sekolah:
   *  - Tunggakan: lulus tetapi masih ada tagihan yang belum lunas (termasuk yang menunggu
   *               verifikasi) — inilah yang menahan namanya keluar dari daftar tunggakan.
   *  - Lunas    : lulus dan tidak ada tagihan yang belum lunas, termasuk yang sejak awal
   *               memang tidak punya tagihan.
   * Peserta didik yang masih aktif tidak masuk laporan ini; tagihannya dilihat di menu
   * Tagihan.
   */
  app.get("/api/unit/tata-usaha/tunggakan", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      await siapkanTagihanBulanan(sesi.unit_id);
      const cari = rapikan(req.query.cari, 60) ?? "";
      const nilai = [sesi.unit_id];
      let saringCari = "";
      if (cari) {
        nilai.push(`%${cari}%`);
        saringCari = ` and (s.nama ilike $${nilai.length} or coalesce(s.kelas, '') ilike $${nilai.length})`;
      }

      const tunggakan = await daftar(
        `select s.id, s.nama, coalesce(s.kelas, '') as kelas, coalesce(s.program, '') as program,
                coalesce(s.status, 'aktif') as status,
                (select p.nama from jurusan p where p.jenjang_id = s.jenjang_id and p.slug = s.program) as program_nama,
                count(t.id)::int as jumlah,
                coalesce(sum(t.jumlah), 0) as nominal,
                min(t.jatuh_tempo) as jatuh_terdekat
           from santri s
           join tagihan t on t.santri_id = s.id and t.status in ('belum', 'menunggu')
          where s.unit_id = $1 and s.status = 'lulus' ${saringCari}
          group by s.id, s.nama, s.kelas, s.program, s.status, s.jenjang_id
          order by coalesce(sum(t.jumlah), 0) desc, s.nama
          limit 200`,
        nilai,
      );

      /* Lulus yang tidak punya tagihan belum lunas — termasuk yang tanpa tagihan sama sekali. */
      const lunas = await daftar(
        `select s.id, s.nama, coalesce(s.kelas, '') as kelas, coalesce(s.program, '') as program,
                coalesce(s.status, 'aktif') as status,
                (select p.nama from jurusan p where p.jenjang_id = s.jenjang_id and p.slug = s.program) as program_nama,
                count(t.id) filter (where t.status = 'lunas')::int as jumlah,
                coalesce(sum(t.jumlah) filter (where t.status = 'lunas'), 0) as nominal,
                max(coalesce(t.diperbarui, t.dibuat)) filter (where t.status = 'lunas') as terakhir
           from santri s
           left join tagihan t on t.santri_id = s.id
          where s.unit_id = $1 and s.status = 'lulus' ${saringCari}
            and not exists (
              select 1 from tagihan x
               where x.santri_id = s.id and x.status in ('belum', 'menunggu')
            )
          group by s.id, s.nama, s.kelas, s.program, s.status, s.jenjang_id
          order by terakhir desc nulls last, s.nama
          limit 200`,
        nilai,
      );

      const ringkas = (await satu(
        `select
           (select count(*)::int from santri s
             where s.unit_id = $1 and s.status = 'lulus'
               and exists (select 1 from tagihan t where t.santri_id = s.id and t.status in ('belum','menunggu'))) as menunggak,
           (select coalesce(sum(t.jumlah), 0) from tagihan t join santri s on s.id = t.santri_id
             where s.unit_id = $1 and s.status = 'lulus' and t.status in ('belum','menunggu')) as nominal_tunggakan,
           (select count(*)::int from santri s
             where s.unit_id = $1 and s.status = 'lulus'
               and not exists (select 1 from tagihan x where x.santri_id = s.id and x.status in ('belum','menunggu'))) as lunas`,
        [sesi.unit_id],
      )) || {};

      res.json({
        ok: true,
        cari,
        sebutan: await ambilSebutan(sesi.unit_id),
        ringkasan: {
          menunggak: angka(ringkas.menunggak),
          nominalTunggakan: angka(ringkas.nominal_tunggakan),
          lunas: angka(ringkas.lunas),
        },
        tunggakan: tunggakan.map(barisLaporan),
        lunas: lunas.map(barisLaporan),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ---------------------------- metode pembayaran ---------------------------- */

  const barisMetode = (m) => ({
    id: m.id,
    nama: m.nama,
    keterangan: m.keterangan ?? "",
    bank: m.bank ?? "",
    nomor: m.nomor ?? "",
    atasNama: m.atas_nama ?? "",
    langkah: Array.isArray(m.langkah) ? m.langkah : [],
    gambarUrl: m.gambar_url ?? "",
    mediaId: m.media_id ?? null,
    urutan: angka(m.urutan),
    aktif: m.aktif !== false,
    /* Berapa pembayaran yang tercatat memakai metode ini. */
    dipakai: angka(m.dipakai),
  });

  const isianMetode = (body) => ({
    nama: rapikan(body?.nama, 60),
    keterangan: rapikan(body?.keterangan, 120),
    bank: rapikan(body?.bank, 60),
    nomor: rapikan(body?.nomor, 60),
    atasNama: rapikan(body?.atasNama, 80),
    /* Langkah pembayaran bebas: dipakai bendahara untuk instruksi khusus kepada wali. */
    langkah: (Array.isArray(body?.langkah) ? body.langkah : []).map((l) => rapikan(l, 400)).filter((l) => l.length > 0),
    gambarUrl: rapikan(body?.gambarUrl, 600) ?? "",
    mediaId: rapikan(body?.mediaId, 60) ?? null,
    urutan: Number.parseInt(String(body?.urutan ?? ""), 10),
    aktif: body?.aktif !== false,
  });

  /**
   * Metode QRIS wajib memakai gambar kode QR supaya wali dapat langsung memindainya di
   * portal; metode lain boleh memakai gambar atau tidak.
   */
  const galatGambarMetode = (isi) =>
    /qris/i.test(isi.nama) && !isi.gambarUrl
      ? "Metode QRIS wajib memakai gambar kode QR agar bisa dipindai wali di portal."
      : null;

  /**
   * Daftar metode pembayaran. Satu daftar dipakai bersama seluruh unit: tampil di portal
   * wali, di borang Catat pembayaran menu Tagihan, dan di menu ini untuk dirapikan.
   */
  app.get("/api/unit/tata-usaha/metode", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const rows = await daftar(
        `select m.id, m.nama, m.keterangan, m.bank, m.nomor, m.atas_nama, m.langkah, m.gambar_url, m.media_id,
                m.urutan, m.aktif,
                (select count(*)::int
                   from pembayaran p
                  where p.metode_id = m.id
                     or (p.metode is not null and lower(trim(p.metode)) = lower(trim(m.nama)))) as dipakai
           from metode_pembayaran m
          order by m.urutan, m.nama`,
      );
      res.json({ ok: true, metode: rows.map(barisMetode) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/unit/tata-usaha/metode", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const isi = isianMetode(req.body);
      if (!isi.nama || isi.nama.length < 3) {
        return res.status(400).json({ pesan: "Nama metode minimal 3 huruf, misalnya Transfer Bank." });
      }
      const kembar = await satu(
        "select id from metode_pembayaran where lower(trim(nama)) = lower(trim($1))",
        [isi.nama],
      );
      if (kembar) return res.status(400).json({ pesan: `Metode “${isi.nama}” sudah ada di daftar.` });
      const galatGambar = galatGambarMetode(isi);
      if (galatGambar) return res.status(400).json({ pesan: galatGambar });

      let urutan = Number.isFinite(isi.urutan) ? isi.urutan : null;
      if (urutan === null) {
        const terakhir = await satu("select coalesce(max(urutan), 0) + 1 as berikutnya from metode_pembayaran");
        urutan = angka(terakhir?.berikutnya) || 1;
      }

      const id = `mb-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
      await tanya(
        `insert into metode_pembayaran (id, urutan, nama, keterangan, bank, nomor, atas_nama, langkah,
                                       gambar_url, media_id, aktif, diperbarui)
         values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11, now())`,
        [
          id,
          urutan,
          isi.nama,
          isi.keterangan,
          isi.bank,
          isi.nomor,
          isi.atasNama,
          JSON.stringify(isi.langkah),
          isi.gambarUrl || null,
          isi.mediaId,
          isi.aktif,
        ],
      );

      res.json({ ok: true, id, pesan: `Metode pembayaran “${isi.nama}” ditambahkan.` });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/unit/tata-usaha/metode/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const isi = isianMetode(req.body);
      if (!isi.nama || isi.nama.length < 3) {
        return res.status(400).json({ pesan: "Nama metode minimal 3 huruf, misalnya Transfer Bank." });
      }
      const kembar = await satu(
        "select id from metode_pembayaran where lower(trim(nama)) = lower(trim($1)) and id <> $2",
        [isi.nama, req.params.id],
      );
      if (kembar) return res.status(400).json({ pesan: `Metode “${isi.nama}” sudah ada di daftar.` });
      const galatGambar = galatGambarMetode(isi);
      if (galatGambar) return res.status(400).json({ pesan: galatGambar });

      const lamaMetode = await satu("select urutan from metode_pembayaran where id = $1", [req.params.id]);
      if (!lamaMetode) return res.status(404).json({ pesan: "Metode pembayaran tidak ditemukan." });

      await tanya(
        `update metode_pembayaran
            set nama = $2, keterangan = $3, bank = $4, nomor = $5, atas_nama = $6,
                langkah = $7::jsonb, gambar_url = $8, media_id = $9, urutan = $10, aktif = $11,
                diperbarui = now()
          where id = $1`,
        [
          req.params.id,
          isi.nama,
          isi.keterangan,
          isi.bank,
          isi.nomor,
          isi.atasNama,
          JSON.stringify(isi.langkah),
          isi.gambarUrl || null,
          isi.mediaId,
          Number.isFinite(isi.urutan) ? isi.urutan : angka(lamaMetode.urutan),
          isi.aktif,
        ],
      );

      res.json({
        ok: true,
        pesan: `Metode pembayaran “${isi.nama}” disimpan.${isi.aktif ? "" : " Karena dimatikan, metodenya tidak lagi ditawarkan di portal wali dan borang catat pembayaran."}`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.delete("/api/unit/tata-usaha/metode/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const m = await satu("select id, nama from metode_pembayaran where id = $1", [req.params.id]);
      if (!m) return res.status(404).json({ pesan: "Metode pembayaran tidak ditemukan." });

      await tanya("delete from metode_pembayaran where id = $1", [m.id]);
      res.json({
        ok: true,
        pesan: `Metode pembayaran “${m.nama}” dihapus dari daftar. Riwayat pembayaran yang sudah tercatat tetap utuh.`,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });
};
