/**
 * Rute SPMB (Sistem Penerimaan Murid & Mahasiswa Baru): teks halaman, gambar halaman,
 * gelombang pendaftaran, biaya, pengaturan formulir, dan layanan informasi.
 * Hanya menyentuh tabel spmb_* dan daftar layanan (kontak_unit) yang diizinkan.
 */

const BATAS_PENDEK = 200;
const BATAS_TEKS = 5000;

/** Potong spasi berlebih dan batasi panjangnya. */
function rapikan(nilai, batas = BATAS_PENDEK) {
  if (nilai === null || nilai === undefined) return null;
  return String(nilai).replace(/\r\n/g, "\n").trim().slice(0, batas);
}

/** Susun ulang daftar urutan baris sesuai id yang dikirim. */
async function susun(tanya, tabel, daftar) {
  for (let i = 0; i < daftar.length; i += 1) {
    await tanya(`update ${tabel} set urutan = $1 where id = $2`, [i + 1, daftar[i]]);
  }
}

const ID_FORMULIR = {
  aktif: "form_aktif",
};

module.exports = function pasangRuteSpmb(app, { tanya }) {
  const simpanPengaturan = (kunci, nilai) =>
    tanya(
      `insert into pengaturan (kunci, nilai, kelompok) values ($1, $2::jsonb, 'spmb')
       on conflict (kunci) do update set nilai = excluded.nilai`,
      [kunci, JSON.stringify(nilai)],
    );

  const bacaPengaturan = async (kunci, cadangan = {}) => {
    const baris = (await tanya("select nilai from pengaturan where kunci = $1", [kunci])).rows[0];
    return baris && baris.nilai ? baris.nilai : cadangan;
  };

  /** Seluruh data halaman SPMB (dipakai situs publik maupun borang admin). */
  const ambilSpmb = async () => {
    const info = (await tanya("select * from spmb_info where id = 'utama'")).rows[0] || {};
    const gambar = await bacaPengaturan("halaman_spmb", {});
    const formulir = await bacaPengaturan("formulir_spmb", {});

    const gelombang = (
      await tanya(
        "select id, urutan, nama, periode, kuota, sisa, status, aktif from spmb_gelombang order by urutan nulls last, nama",
      )
    ).rows;
    const biaya = (
      await tanya("select id, urutan, label, nilai, aktif from spmb_biaya order by urutan nulls last, label")
    ).rows;
    const layanan = (
      await tanya(
        `select id, urutan, nama, keterangan, telepon, whatsapp, jam, aktif
           from kontak_unit order by urutan nulls last, nama`,
      )
    ).rows;

    return {
      halaman: {
        judul: info.judul ?? null,
        pengantar: info.pengantar ?? null,
        catatan: info.catatan ?? null,
        waAdmin: info.wa_admin ?? null,
        formAktif: info.form_aktif !== false,
      },
      gambar: { url: gambar.gambar_url ?? null, alt: gambar.gambar_alt ?? null },
      formulir: {
        aktif: formulir.aktif !== false,
        judul: formulir.judul ?? null,
        tombol: formulir.tombol ?? null,
        waAdmin: formulir.wa_admin ?? null,
        waNama: formulir.wa_nama ?? null,
        pesanPembuka: formulir.pesan_pembuka ?? null,
        judulSukses: formulir.judul_sukses ?? null,
        statusSukses: formulir.status_sukses ?? null,
        pesanTutup: formulir.pesan_tutup ?? null,
        isian: formulir.isian && typeof formulir.isian === "object" ? formulir.isian : {},
      },
      gelombang: gelombang.map((g) => ({
        id: g.id,
        nama: g.nama,
        periode: g.periode,
        kuota: g.kuota,
        sisa: g.sisa,
        status: g.status,
        aktif: g.aktif,
      })),
      biaya: biaya.map((b) => ({ id: b.id, label: b.label, nilai: b.nilai, aktif: b.aktif })),
      layanan: layanan.map((l) => ({
        id: l.id,
        nama: l.nama,
        keterangan: l.keterangan,
        telepon: l.telepon,
        whatsapp: l.whatsapp,
        jam: l.jam,
        aktif: l.aktif,
      })),
    };
  };

  const kirimSpmb = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, ...(await ambilSpmb()) });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  const kodeBaru = (awalan) => `${awalan}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  app.get("/api/spmb", async (_req, res) => {
    try {
      res.json({ ok: true, ...(await ambilSpmb()) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* --------------------------- pendaftaran publik --------------------------- */

  /**
   * Pendaftaran dari formulir SPMB di situs. Pendaftar masuk dengan status 'baru'
   * pada sekolah yang dituju; petugas sekolah itulah yang memverifikasi nanti dari
   * halaman Admin SPMB.
   */
  app.post("/api/spmb/daftar", async (req, res) => {
    try {
      const b = req.body || {};
      const info = (await tanya("select form_aktif from spmb_info where id = 'utama'")).rows[0] || {};
      if (info.form_aktif === false)
        return res.status(400).json({ pesan: "Formulir pendaftaran sedang ditutup. Hubungi panitia SPMB." });

      const nama = rapikan(b.nama, 80);
      const wali = rapikan(b.wali, 80);
      const wa = String(b.wa ?? "").replace(/[^0-9+]/g, "").slice(0, 20);
      const unitId = String(b.unitId ?? "").trim().slice(0, 40);

      if (!nama || nama.length < 3) return res.status(400).json({ pesan: "Nama calon peserta didik belum lengkap." });
      if (!unitId) return res.status(400).json({ pesan: "Sekolah atau madrasah yang dituju belum dipilih." });
      if (!wali || wali.length < 3)
        return res.status(400).json({ pesan: "Nama orang tua / wali belum lengkap." });
      if (wa.replace(/\D/g, "").length < 9)
        return res.status(400).json({ pesan: "Nomor WhatsApp aktif belum lengkap." });

      const unit = (
        await tanya("select id, nama, jenjang_id, aktif from unit_pendidikan where id = $1", [unitId])
      ).rows[0];
      if (!unit || !unit.aktif)
        return res.status(400).json({ pesan: "Sekolah atau madrasah yang dituju belum terdaftar." });

      /* Jurusan yang dipilih mengikuti daftar program pada jenjang unit yang dituju. */
      const programJenjang = (
        await tanya("select slug, nama from jurusan where jenjang_id = $1 order by urutan nulls last, nama", [
          unit.jenjang_id,
        ])
      ).rows;
      const programDiminta = String(b.program ?? "").trim().slice(0, 80);
      if (programJenjang.length > 0 && programDiminta && !programJenjang.some((p) => p.slug === programDiminta))
        return res.status(400).json({ pesan: "Jurusan yang dipilih tidak ada pada jenjang tersebut." });
      const program = programJenjang.some((p) => p.slug === programDiminta) ? programDiminta : null;

      const gelombang = (
        await tanya(
          `select id from spmb_gelombang where aktif order by urutan nulls last, id limit 1`,
        )
      ).rows[0];

      /* Cegah kiriman ganda: nama dan nomor yang sama dalam 10 menit terakhir dianggap sama. */
      const kembar = (
        await tanya(
          `select nomor from spmb_pendaftar
            where unit_id = $1 and lower(nama) = lower($2) and right(regexp_replace(coalesce(telepon,''), '[^0-9]', '', 'g'), 9)
                  = right($3, 9)
              and dibuat > now() - interval '10 minutes'
            limit 1`,
          [unit.id, nama, wa.replace(/\D/g, "")],
        )
      ).rows[0];
      if (kembar)
        return res
          .status(409)
          .json({ pesan: `Pendaftaran dengan nama dan nomor ini baru saja dikirim. Nomor Anda: ${kembar.nomor}.` });

      const urut = (
        await tanya(
          `select count(*)::int + 1 as n from spmb_pendaftar
            where date_part('year', dibuat) = date_part('year', now())`,
        )
      ).rows[0].n;
      const nomor = `SPMB-${new Date().getFullYear()}-${String(urut).padStart(4, "0")}`;

      const baris = (
        await tanya(
          `insert into spmb_pendaftar
             (nomor, nama, jenjang_id, unit_id, tempat_lahir, asal_sekolah, nama_wali,
              telepon, email, alamat, gelombang_id, status, catatan, program)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'baru',$12,$13)
           returning id, nomor`,
          [
            nomor,
            nama,
            unit.jenjang_id,
            unit.id,
            rapikan(b.tempatLahir, 120),
            rapikan(b.asalSekolah, 120),
            wali,
            wa,
            rapikan(b.email, 120),
            rapikan(b.alamat, 300),
            gelombang ? gelombang.id : null,
            rapikan(b.catatan, 300),
            program,
          ],
        )
      ).rows[0];

      res.json({
        ok: true,
        id: String(baris.id),
        nomor: baris.nomor,
        unit: unit.nama,
        pesan: "Pendaftaran diterima. Panitia sekolah akan memverifikasi data Anda.",
      });
    } catch (e) {
      if (e && e.code === "23505")
        return res.status(409).json({ pesan: "Pendaftaran Anda sudah tercatat. Hubungi panitia SPMB." });
      res.status(500).json({ pesan: e.message });
    }
  });

  /* --------------------------- teks halaman --------------------------- */

  app.put("/api/admin/spmb-halaman", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["judul", "pengantar", "catatan", "wa_admin"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if ("form_aktif" in b) nilai.form_aktif = !!b.form_aktif;
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimSpmb(res, async () => {
      await tanya(
        `insert into spmb_info (id, judul, pengantar, catatan, wa_admin, form_aktif, diperbarui)
         values ('utama', coalesce($1, 'SPMB'), $2, $3, $4, coalesce($5, true), now())
         on conflict (id) do update set
           judul = coalesce(excluded.judul, spmb_info.judul),
           pengantar = coalesce(excluded.pengantar, spmb_info.pengantar),
           catatan = coalesce(excluded.catatan, spmb_info.catatan),
           wa_admin = coalesce(excluded.wa_admin, spmb_info.wa_admin),
           form_aktif = coalesce($5, spmb_info.form_aktif),
           diperbarui = now()`,
        [
          nilai.judul ?? null,
          nilai.pengantar ?? null,
          nilai.catatan ?? null,
          nilai.wa_admin ?? null,
          "form_aktif" in nilai ? nilai.form_aktif : null,
        ],
      );
    });
  });

  /* --------------------------- gambar halaman --------------------------- */

  app.put("/api/admin/spmb-gambar", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["gambar_url", "gambar_alt"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimSpmb(res, async () => {
      const sekarang = await bacaPengaturan("halaman_spmb", {});
      await simpanPengaturan("halaman_spmb", { ...sekarang, ...nilai });
    });
  });

  /* --------------------------- formulir --------------------------- */

  app.put("/api/admin/spmb-formulir", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["judul", "tombol", "wa_admin", "wa_nama", "pesan_pembuka", "judul_sukses", "status_sukses", "pesan_tutup"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if ("aktif" in b) nilai.aktif = !!b.aktif;
    if (b.isian && typeof b.isian === "object") {
      const isian = {};
      for (const kunci of Object.keys(b.isian).slice(0, 20)) {
        const satu = b.isian[kunci] || {};
        isian[String(kunci).slice(0, 40)] = { tampil: satu.tampil !== false, wajib: !!satu.wajib };
      }
      nilai.isian = isian;
    }
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimSpmb(res, async () => {
      const sekarang = await bacaPengaturan("formulir_spmb", {});
      await simpanPengaturan("formulir_spmb", { ...sekarang, ...nilai });
    });
  });

  /* --------------------------- gelombang --------------------------- */

  app.post("/api/admin/spmb-gelombang", async (req, res) => {
    const b = req.body || {};
    const nama = rapikan(b.nama, BATAS_PENDEK);
    if (!nama) return res.status(400).json({ pesan: "Nama gelombang tidak boleh kosong." });

    await kirimSpmb(res, async () => {
      const ada = (await tanya("select 1 from spmb_gelombang where nama = $1", [nama])).rowCount > 0;
      if (ada) {
        const e = new Error(`Gelombang dengan nama ${nama} sudah ada.`);
        e.status = 400;
        throw e;
      }
      const urutan =
        (await tanya("select coalesce(max(urutan), 0)::int + 1 as n from spmb_gelombang")).rows[0].n ?? 1;
      await tanya(
        `insert into spmb_gelombang (id, urutan, nama, periode, kuota, sisa, status, aktif)
         values ($1, $2, $3, $4, $5, $6, $7, true)`,
        [
          kodeBaru("gl"),
          urutan,
          nama,
          rapikan(b.periode, BATAS_PENDEK),
          rapikan(b.kuota, BATAS_PENDEK),
          rapikan(b.sisa, BATAS_PENDEK),
          rapikan(b.status, 20) || "Dibuka",
        ],
      );
    });
  });

  app.put("/api/admin/spmb-gelombang/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    if ("nama" in b) {
      const nama = rapikan(b.nama, BATAS_PENDEK);
      if (!nama) return res.status(400).json({ pesan: "Nama gelombang tidak boleh kosong." });
      nilai.push(nama);
      setel.push(`nama = $${nilai.length}`);
    }
    for (const kolom of ["periode", "kuota", "sisa", "status"]) {
      if (kolom in b) {
        nilai.push(rapikan(b[kolom], BATAS_PENDEK));
        setel.push(`${kolom} = $${nilai.length}`);
      }
    }
    if ("aktif" in b) {
      nilai.push(!!b.aktif);
      setel.push(`aktif = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimSpmb(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update spmb_gelombang set ${setel.join(", ")} where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Gelombang tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/spmb-gelombang/:id", async (req, res) => {
    await kirimSpmb(res, async () => {
      const pakai = (
        await tanya("select count(*)::int as n from spmb_pendaftar where gelombang_id = $1", [req.params.id])
      ).rows[0].n;
      if (pakai > 0) {
        const e = new Error(
          `Gelombang ini sudah dipakai oleh ${pakai} pendaftar. Pindahkan datanya lebih dahulu.`,
        );
        e.status = 400;
        throw e;
      }
      const hasil = await tanya("delete from spmb_gelombang where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Gelombang tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.post("/api/admin/spmb-gelombang-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, 50) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirimSpmb(res, () => susun(tanya, "spmb_gelombang", daftar));
  });

  /* --------------------------- biaya --------------------------- */

  app.post("/api/admin/spmb-biaya", async (req, res) => {
    const b = req.body || {};
    const label = rapikan(b.label, BATAS_PENDEK);
    if (!label) return res.status(400).json({ pesan: "Nama biaya tidak boleh kosong." });

    await kirimSpmb(res, async () => {
      const urutan = (await tanya("select coalesce(max(urutan), 0)::int + 1 as n from spmb_biaya")).rows[0].n ?? 1;
      await tanya(
        `insert into spmb_biaya (id, urutan, label, nilai, aktif) values ($1, $2, $3, $4, true)`,
        [kodeBaru("bi"), urutan, label, rapikan(b.nilai, BATAS_PENDEK)],
      );
    });
  });

  app.put("/api/admin/spmb-biaya/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    if ("label" in b) {
      const label = rapikan(b.label, BATAS_PENDEK);
      if (!label) return res.status(400).json({ pesan: "Nama biaya tidak boleh kosong." });
      nilai.push(label);
      setel.push(`label = $${nilai.length}`);
    }
    if ("nilai" in b) {
      nilai.push(rapikan(b.nilai, BATAS_PENDEK));
      setel.push(`nilai = $${nilai.length}`);
    }
    if ("aktif" in b) {
      nilai.push(!!b.aktif);
      setel.push(`aktif = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimSpmb(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update spmb_biaya set ${setel.join(", ")} where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Biaya tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/spmb-biaya/:id", async (req, res) => {
    await kirimSpmb(res, async () => {
      const hasil = await tanya("delete from spmb_biaya where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Biaya tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.post("/api/admin/spmb-biaya-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, 50) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirimSpmb(res, () => susun(tanya, "spmb_biaya", daftar));
  });

  /* --------------------------- layanan informasi --------------------------- */

  app.post("/api/admin/spmb-layanan", async (req, res) => {
    const b = req.body || {};
    const nama = rapikan(b.nama, BATAS_PENDEK);
    if (!nama) return res.status(400).json({ pesan: "Nama layanan tidak boleh kosong." });

    await kirimSpmb(res, async () => {
      const urutan = (await tanya("select coalesce(max(urutan), 0)::int + 1 as n from kontak_unit")).rows[0].n ?? 1;
      await tanya(
        `insert into kontak_unit (id, urutan, nama, keterangan, telepon, whatsapp, jam, aktif)
         values ($1, $2, $3, $4, $5, $6, $7, true)`,
        [
          kodeBaru("kt"),
          urutan,
          nama,
          rapikan(b.keterangan, BATAS_TEKS),
          rapikan(b.telepon, BATAS_PENDEK),
          rapikan(b.whatsapp, BATAS_PENDEK),
          rapikan(b.jam, BATAS_PENDEK),
        ],
      );
    });
  });

  app.put("/api/admin/spmb-layanan/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    if ("nama" in b) {
      const nama = rapikan(b.nama, BATAS_PENDEK);
      if (!nama) return res.status(400).json({ pesan: "Nama layanan tidak boleh kosong." });
      nilai.push(nama);
      setel.push(`nama = $${nilai.length}`);
    }
    for (const kolom of ["keterangan", "telepon", "whatsapp", "jam"]) {
      if (kolom in b) {
        nilai.push(rapikan(b[kolom], kolom === "keterangan" ? BATAS_TEKS : BATAS_PENDEK));
        setel.push(`${kolom} = $${nilai.length}`);
      }
    }
    if ("aktif" in b) {
      nilai.push(!!b.aktif);
      setel.push(`aktif = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimSpmb(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update kontak_unit set ${setel.join(", ")} where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Layanan tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/spmb-layanan/:id", async (req, res) => {
    await kirimSpmb(res, async () => {
      const hasil = await tanya("delete from kontak_unit where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Layanan tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.post("/api/admin/spmb-layanan-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, 50) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirimSpmb(res, () => susun(tanya, "kontak_unit", daftar));
  });
};
