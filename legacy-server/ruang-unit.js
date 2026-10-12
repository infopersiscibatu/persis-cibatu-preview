/**
 * Halaman unit sekolah bagian Admin SPMB: statistik pendaftaran, daftar pendaftar
 * terverifikasi dan tertolak, serta verifikasi langsung dari Dashboard.
 *
 * Sekolah masuk memakai satu PIN sekolah (lihat ruang-akun.js). Semua data di
 * sini dibatasi pada sekolah yang sedang masuk, jadi tidak mungkin menyentuh
 * data sekolah lain.
 */

const bantuanUnit = require("./lib/unit");

const hariPendek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function pasangRuteUnitSpmb(app, { tanya }) {
  const { satu, sekolahWajib, angka, angkaWajib } = bantuanUnit(tanya);

  /**
   * Selaraskan data santri dengan status pendaftaran.
   * Pendaftar yang diverifikasi (atau diterima) menambah satu baris di tabel santri
   * sehingga jumlah siswa/mahasiswa di situs ikut bertambah; bila statusnya dikembalikan,
   * ditolak, atau dibatalkan, baris santri itu dicabut lagi.
   */
  const selaraskanSantri = async (p, status) => {
    if (status === "diverifikasi" || status === "diterima") {
      const catatan = [`Dari SPMB ${p.nomor ?? ""}`.trim(), p.catatan ?? ""].filter(Boolean).join(" · ").slice(0, 300);
      await tanya(
        `insert into santri (id, nama, jenjang_id, unit_id, tempat_lahir, tanggal_lahir,
                             tahun_masuk, status, wali_nama, wali_telepon, asal_sekolah, alamat, email,
                             catatan, program, pendaftar_id)
         values ($1,$2,$3,$4,$5,$6,$7,'aktif',$8,$9,$10,$11,$12,$13,$14,$15)
         on conflict (pendaftar_id) do update set
           nama = excluded.nama,
           jenjang_id = excluded.jenjang_id,
           unit_id = excluded.unit_id,
           tempat_lahir = excluded.tempat_lahir,
           tanggal_lahir = excluded.tanggal_lahir,
           wali_nama = excluded.wali_nama,
           wali_telepon = excluded.wali_telepon,
           asal_sekolah = excluded.asal_sekolah,
           alamat = excluded.alamat,
           email = excluded.email,
           catatan = excluded.catatan,
           program = coalesce(excluded.program, santri.program),
           status = 'aktif',
           diperbarui = now()`,
        [
          `sn-spmb-${p.id}`,
          p.nama,
          p.jenjang_id,
          p.unit_id,
          p.tempat_lahir,
          p.tanggal_lahir,
          new Date().getFullYear(),
          p.nama_wali,
          p.telepon,
          p.asal_sekolah,
          p.alamat,
          p.email,
          catatan,
          /* Jurusan yang diisi pada formulir SPMB ikut tersimpan pada data siswa/mahasiswa. */
          p.program ?? null,
          p.id,
        ],
      );
      return { ditambah: true, dicabut: false };
    }
    const hapus = await tanya("delete from santri where pendaftar_id = $1", [p.id]);
    return { ditambah: false, dicabut: hapus.rowCount > 0 };
  };

  app.get("/api/unit/spmb/statistik", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const sekolah = await satu(
        `select u.id, u.nama, u.slug, u.jumlah_peserta, u.rombel, u.guru,
                coalesce(jsonb_array_length(u.jurusan), 0) as jurusan,
                coalesce(jsonb_array_length(u.ekstrakurikuler), 0) as ekstrakurikuler,
                j.singkatan, j.nama as jenjang_nama
           from unit_pendidikan u
           left join jenjang j on j.id = u.jenjang_id
          where u.id = $1`,
        [sesi.unit_id],
      );
      if (!sekolah) return res.status(404).json({ pesan: "Sekolah tidak ditemukan." });

      const pendaftar = await satu(
        `select count(*)::int as total,
                count(*) filter (where status = 'baru')::int as baru,
                count(*) filter (where status = 'diverifikasi')::int as diverifikasi,
                count(*) filter (where status = 'diterima')::int as diterima,
                count(*) filter (where status = 'ditolak')::int as ditolak,
                count(*) filter (where status = 'batal')::int as batal,
                count(*) filter (where dibuat::date = current_date)::int as hari_ini,
                count(*) filter (where dibuat >= date_trunc('week', now()))::int as minggu_ini,
                count(*) filter (where dibuat::date = current_date)::int as hari_ini_siswa
           from spmb_pendaftar
          where unit_id = $1`,
        [sekolah.id],
      );

      /* Tujuh hari terakhir, termasuk hari yang belum ada pendaftar. */
      const hari = (
        await tanya(
          `select to_char(d::date, 'YYYY-MM-DD') as tanggal,
                  (select count(*)::int from spmb_pendaftar p
                    where p.unit_id = $1 and p.dibuat::date = d::date) as jumlah
             from generate_series(current_date - interval '6 days', current_date, interval '1 day') as d
            order by d`,
          [sekolah.id],
        )
      ).rows.map((r) => ({
        tanggal: r.tanggal,
        label: hariPendek[new Date(`${r.tanggal}T00:00:00`).getDay()] ?? "",
        jumlah: angka(r.jumlah),
      }));

      const gelombang = (
        await tanya(
          `select g.id, g.nama, g.periode, g.kuota, g.sisa, g.status, g.aktif,
                  count(p.id)::int as total,
                  count(p.id) filter (where p.status = 'baru')::int as baru,
                  count(p.id) filter (where p.status = 'diverifikasi')::int as diverifikasi,
                  count(p.id) filter (where p.status = 'diterima')::int as diterima
             from spmb_gelombang g
             left join spmb_pendaftar p on p.gelombang_id = g.id and p.unit_id = $1
            group by g.id
            order by g.urutan, g.id`,
          [sekolah.id],
        )
      ).rows.map((r) => ({
        id: r.id,
        nama: r.nama,
        periode: r.periode ?? "",
        kuota: r.kuota ?? "",
        sisa: r.sisa ?? "",
        status: r.status ?? "",
        aktif: r.aktif !== false,
        total: angka(r.total),
        baru: angka(r.baru),
        diverifikasi: angka(r.diverifikasi),
        diterima: angka(r.diterima),
        /* Angka pada teks kuota dipakai untuk bar keterisian. */
        kuotaAngka: angka(String(r.kuota ?? "").replace(/[^0-9]/g, "")) || 0,
        sisaAngka: angka(String(r.sisa ?? "").replace(/[^0-9]/g, "")) || 0,
      }));

      const santri = await satu(
        `select count(*)::int as aktif,
                count(*) filter (where status = 'aktif')::int as aktif_saja
           from santri where unit_id = $1 and status = 'aktif'`,
        [sekolah.id],
      );

      const info = await satu("select form_aktif, judul from spmb_info where id = 'utama'");
      const pengurus = await satu("select admin_spmb from admin_unit_sekolah where unit_id = $1", [sekolah.id]);

      res.json({
        ok: true,
        diperbarui: new Date().toISOString(),
        unit: {
          id: sekolah.id,
          nama: sekolah.nama,
          slug: sekolah.slug,
          jenjang: sekolah.singkatan ?? sekolah.jenjang_nama ?? "-",
          jenjangNama: sekolah.jenjang_nama ?? "",
        },
        pendaftar: {
          total: angka(pendaftar?.total),
          baru: angka(pendaftar?.baru),
          diverifikasi: angka(pendaftar?.diverifikasi),
          diterima: angka(pendaftar?.diterima),
          ditolak: angka(pendaftar?.ditolak),
          batal: angka(pendaftar?.batal),
          hariIni: angka(pendaftar?.hari_ini),
          mingguIni: angka(pendaftar?.minggu_ini),

        },
        tujuhHari: hari,
        gelombang,
        sekolah: {
          santriAktif: angka(santri?.aktif),

          peserta: angka(sekolah.jumlah_peserta),
          rombel: angka(sekolah.rombel),
          guru: angka(sekolah.guru),
          jurusan: angka(sekolah.jurusan),
          ekstrakurikuler: angka(sekolah.ekstrakurikuler),
        },
        formulir: {
          aktif: info?.form_aktif !== false,
          judul: info?.judul ?? "SPMB",
        },
        pengurusSpmb: String(pengurus?.admin_spmb ?? "").trim(),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ------------------------------ daftar pendaftar ------------------------------ */

  const STATUS_DIIZINKAN = ["baru", "diverifikasi", "diterima", "ditolak", "batal"];

  const barisPendaftar = (r) => ({
    id: r.id,
    nomor: r.nomor ?? "",
    nama: r.nama ?? "",
    telepon: r.telepon ?? "",
    asalSekolah: r.asal_sekolah ?? "",
    /** Jurusan yang dipilih pada formulir SPMB (slug dan namanya). */
    program: r.program ?? "",
    programNama: r.program_nama ?? "",
    status: r.status ?? "baru",
    catatan: r.catatan ?? "",
    gelombang: r.gelombang ?? "",
    gelombangId: r.gelombang_id ?? "",
    dibuat: r.dibuat ? new Date(r.dibuat).toISOString() : null,
    diperbarui: r.diperbarui ? new Date(r.diperbarui).toISOString() : null,
    jumlahBerkas: angka(r.jumlah_berkas),
  });

  const ringkasanStatus = async (unitId) => {
    const r = await satu(
      `select count(*)::int as total,
              count(*) filter (where status = 'baru')::int as baru,
              count(*) filter (where status = 'diverifikasi')::int as diverifikasi,
              count(*) filter (where status = 'diterima')::int as diterima,
              count(*) filter (where status = 'ditolak')::int as ditolak,
              count(*) filter (where status = 'batal')::int as batal
         from spmb_pendaftar where unit_id = $1`,
      [unitId],
    );
    return {
      total: angka(r?.total),
      baru: angka(r?.baru),
      diverifikasi: angka(r?.diverifikasi),
      diterima: angka(r?.diterima),
      ditolak: angka(r?.ditolak),
      batal: angka(r?.batal),
    };
  };

  /* status: baru | diverifikasi | diterima | ditolak | batal | tidak-lanjut | semua */
  app.get("/api/unit/spmb/pendaftar", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;

      const diminta = String(req.query.status ?? "semua");
      const pilihan = [
        "baru",
        "diverifikasi",
        "diterima",
        "ditolak",
        "batal",
        "tidak-lanjut",
        "semua",
      ];
      const status = pilihan.includes(diminta) ? diminta : "semua";
      const cari = String(req.query.cari ?? "").trim().slice(0, 60);
      const batas = Math.min(Math.max(Number(req.query.batas ?? 60) || 60, 1), 200);

      const nilai = [sesi.unit_id];
      let kondisi = "p.unit_id = $1";
      if (status === "tidak-lanjut") {
        kondisi += " and p.status in ('ditolak','batal')";
      } else if (status !== "semua") {
        nilai.push(status);
        kondisi += ` and p.status = $${nilai.length}`;
      }
      if (cari) {
        nilai.push(`%${cari}%`);
        kondisi += ` and (p.nama ilike $${nilai.length} or coalesce(p.nomor,'') ilike $${nilai.length} or coalesce(p.asal_sekolah,'') ilike $${nilai.length})`;
      }

      const { rows } = await tanya(
        `select p.id, p.nomor, p.nama, p.telepon, p.asal_sekolah, p.status, p.catatan,
                p.dibuat, p.diperbarui, p.gelombang_id, g.nama as gelombang, p.program,
                pr.nama as program_nama,
                coalesce(jsonb_array_length(p.berkas), 0) as jumlah_berkas
           from spmb_pendaftar p
           left join spmb_gelombang g on g.id = p.gelombang_id
           left join jurusan pr on pr.jenjang_id = p.jenjang_id and pr.slug = p.program
          where ${kondisi}
          order by p.dibuat desc, p.id desc
          limit ${batas}`,
        nilai,
      );

      res.json({
        ok: true,
        status,
        cari,
        batas,
        penuh: rows.length >= batas,
        pendaftar: rows.map(barisPendaftar),
        ringkasan: await ringkasanStatus(sesi.unit_id),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.get("/api/unit/spmb/pendaftar/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const id = angkaWajib(req, res, "Pendaftar tidak ditemukan pada sekolah ini.");
      if (id === null) return;

      const r = await satu(
        `select p.*, g.nama as gelombang, j.singkatan as jenjang, pr.nama as program_nama,
                coalesce(jsonb_array_length(p.berkas), 0) as jumlah_berkas
           from spmb_pendaftar p
           left join spmb_gelombang g on g.id = p.gelombang_id
           left join jenjang j on j.id = p.jenjang_id
           left join jurusan pr on pr.jenjang_id = p.jenjang_id and pr.slug = p.program
          where p.id = $1 and p.unit_id = $2`,
        [id, sesi.unit_id],
      );
      if (!r) return res.status(404).json({ pesan: "Pendaftar tidak ditemukan pada sekolah ini." });

      res.json({
        ok: true,
        pendaftar: {
          ...barisPendaftar(r),
          jenjang: r.jenjang ?? "",
          tempatLahir: r.tempat_lahir ?? "",
          tanggalLahir: r.tanggal_lahir ?? "",
          namaWali: r.nama_wali ?? "",
          email: r.email ?? "",
          alamat: r.alamat ?? "",
          berkas: Array.isArray(r.berkas) ? r.berkas : [],
        },
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Ubah status pendaftar: verifikasi, terima, tolak, atau kembalikan ke baru. */
  app.put("/api/unit/spmb/pendaftar/:id/status", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const id = angkaWajib(req, res, "Pendaftar tidak ditemukan pada sekolah ini.");
      if (id === null) return;

      const status = String(req.body?.status ?? "");
      if (!STATUS_DIIZINKAN.includes(status))
        return res.status(400).json({ pesan: "Status pendaftar tidak dikenali." });

      const catatan = req.body?.catatan === undefined ? null : String(req.body.catatan).trim().slice(0, 500);

      const p = await satu(
        `select id, nomor, nama, jenjang_id, unit_id, tempat_lahir, tanggal_lahir,
                nama_wali, telepon, alamat, asal_sekolah, email, catatan, program
           from spmb_pendaftar where id = $1 and unit_id = $2`,
        [id, sesi.unit_id],
      );
      if (!p) return res.status(404).json({ pesan: "Pendaftar tidak ditemukan pada sekolah ini." });

      if (catatan === null) {
        await tanya(`update spmb_pendaftar set status = $3, diperbarui = now() where id = $1 and unit_id = $2`, [
          p.id,
          sesi.unit_id,
          status,
        ]);
      } else {
        await tanya(
          `update spmb_pendaftar set status = $3, catatan = $4, diperbarui = now()
            where id = $1 and unit_id = $2`,
          [p.id, sesi.unit_id, status, catatan],
        );
      }

      const santri = await selaraskanSantri(p, status);

      res.json({ ok: true, status, santri, ringkasan: await ringkasanStatus(sesi.unit_id) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Perbaiki data pendaftar: catatan, telepon, nama wali, alamat. */
  app.put("/api/unit/spmb/pendaftar/:id", async (req, res) => {
    try {
      const sesi = sekolahWajib(req, res);
      if (!sesi) return;
      const id = angkaWajib(req, res, "Pendaftar tidak ditemukan pada sekolah ini.");
      if (id === null) return;

      /* Hanya kolom yang dikirim yang diubah. */
      const peta = [
        ["catatan", "catatan", 500],
        ["telepon", "telepon", 30],
        ["nama_wali", "namaWali", 80],
        ["alamat", "alamat", 300],
      ];

      const set = [];
      const nilai = [id, sesi.unit_id];
      for (const [kolom, kunci, batas] of peta) {
        if (req.body?.[kunci] === undefined) continue;
        nilai.push(String(req.body[kunci]).trim().slice(0, batas));
        set.push(`${kolom} = $${nilai.length}`);
      }
      if (set.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

      const hasil = await tanya(
        `update spmb_pendaftar set ${set.join(", ")}, diperbarui = now()
          where id = $1 and unit_id = $2 returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) return res.status(404).json({ pesan: "Pendaftar tidak ditemukan pada sekolah ini." });

      res.json({ ok: true, ringkasan: await ringkasanStatus(sesi.unit_id) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });
}

module.exports = { pasangRuteUnitSpmb };
