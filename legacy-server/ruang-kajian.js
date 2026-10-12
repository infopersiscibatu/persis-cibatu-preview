/**
 * Rute Kajian: teks halaman, gambar halaman, jadwal kajian terdekat (tabel kajian),
 * dan kajian rutin pekanan (tabel kajian_rutin) beserta CRUD untuk panel admin.
 */

const BATAS_PENDEK = 200;
const BATAS_TEKS = 5000;
const BATAS_JUDUL = 300;

function rapikan(nilai, batas = BATAS_PENDEK) {
  if (nilai === null || nilai === undefined) return null;
  return String(nilai).replace(/\r\n/g, "\n").trim().slice(0, batas);
}

function tanggalIso(nilai) {
  const t = rapikan(nilai, 20);
  if (!t) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

module.exports = function pasangRuteKajian(app, { tanya }) {
  const simpanPengaturan = (kunci, nilai) =>
    tanya(
      `insert into pengaturan (kunci, nilai, kelompok) values ($1, $2::jsonb, 'kajian')
       on conflict (kunci) do update set nilai = excluded.nilai`,
      [kunci, JSON.stringify(nilai)],
    );

  const bacaPengaturan = async (kunci, cadangan = {}) => {
    const baris = (await tanya("select nilai from pengaturan where kunci = $1", [kunci])).rows[0];
    return baris && baris.nilai ? baris.nilai : cadangan;
  };

  const ambilKajian = async () => {
    const halaman = await bacaPengaturan("halaman_kajian", {});
    const kajian = (
      await tanya(
        `select id, judul, ustadz, hari, tanggal, waktu, tempat, kitab, kategori, ringkasan, langsung, terbit
           from kajian
          order by tanggal asc nulls last, waktu asc`,
      )
    ).rows;
    const rutin = (
      await tanya(
        `select id, urutan, hari, waktu, judul, ustadz, tempat, peserta, aktif
           from kajian_rutin
          order by urutan nulls last, hari`,
      )
    ).rows;

    return {
      halaman: { judul: halaman.judul ?? null, pengantar: halaman.pengantar ?? null },
      gambar: { url: halaman.gambar_url ?? null, alt: halaman.gambar_alt ?? null },
      kajian: kajian.map((k) => ({
        id: k.id,
        judul: k.judul,
        ustadz: k.ustadz,
        hari: k.hari,
        tanggal: k.tanggal ? new Date(k.tanggal).toISOString().slice(0, 10) : null,
        waktu: k.waktu,
        tempat: k.tempat,
        kitab: k.kitab,
        kategori: k.kategori,
        ringkasan: k.ringkasan,
        langsung: !!k.langsung,
        terbit: k.terbit !== false,
      })),
      rutin: rutin.map((r) => ({
        id: r.id,
        hari: r.hari,
        waktu: r.waktu,
        judul: r.judul,
        ustadz: r.ustadz,
        tempat: r.tempat,
        peserta: r.peserta,
        aktif: r.aktif !== false,
      })),
    };
  };

  const kirim = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, ...(await ambilKajian()) });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  const kodeBaru = (awalan) => `${awalan}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  app.get("/api/kajian", async (_req, res) => {
    try {
      res.json({ ok: true, ...(await ambilKajian()) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* --------------------------- teks & gambar halaman --------------------------- */

  app.put("/api/admin/kajian-halaman", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["judul", "pengantar"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });
    await kirim(res, async () => {
      const sekarang = await bacaPengaturan("halaman_kajian", {});
      await simpanPengaturan("halaman_kajian", { ...sekarang, ...nilai });
    });
  });

  app.put("/api/admin/kajian-gambar", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["gambar_url", "gambar_alt"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });
    await kirim(res, async () => {
      const sekarang = await bacaPengaturan("halaman_kajian", {});
      await simpanPengaturan("halaman_kajian", { ...sekarang, ...nilai });
    });
  });

  /* --------------------------- jadwal kajian terdekat --------------------------- */

  app.post("/api/admin/kajian", async (req, res) => {
    const b = req.body || {};
    const judul = rapikan(b.judul, BATAS_JUDUL);
    if (!judul) return res.status(400).json({ pesan: "Judul kajian tidak boleh kosong." });

    await kirim(res, async () => {
      await tanya(
        `insert into kajian (id, judul, ustadz, hari, tanggal, waktu, tempat, kitab, kategori, ringkasan, langsung, terbit)
         values ($1, $2, $3, $4, $5::date, $6, $7, $8, $9, $10, $11, $12)`,
        [
          kodeBaru("kj"),
          judul,
          rapikan(b.ustadz, BATAS_PENDEK),
          rapikan(b.hari, BATAS_PENDEK),
          tanggalIso(b.tanggal),
          rapikan(b.waktu, BATAS_PENDEK),
          rapikan(b.tempat, BATAS_PENDEK),
          rapikan(b.kitab, BATAS_PENDEK),
          rapikan(b.kategori, BATAS_PENDEK),
          rapikan(b.ringkasan, BATAS_TEKS),
          !!b.langsung,
          b.terbit !== false,
        ],
      );
    });
  });

  app.put("/api/admin/kajian/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];

    if ("judul" in b) {
      const judul = rapikan(b.judul, BATAS_JUDUL);
      if (!judul) return res.status(400).json({ pesan: "Judul kajian tidak boleh kosong." });
      nilai.push(judul);
      setel.push(`judul = $${nilai.length}`);
    }
    for (const kolom of ["ustadz", "hari", "waktu", "tempat", "kitab", "kategori"]) {
      if (kolom in b) {
        nilai.push(rapikan(b[kolom], BATAS_PENDEK));
        setel.push(`${kolom} = $${nilai.length}`);
      }
    }
    if ("ringkasan" in b) {
      nilai.push(rapikan(b.ringkasan, BATAS_TEKS));
      setel.push(`ringkasan = $${nilai.length}`);
    }
    if ("tanggal" in b) {
      nilai.push(tanggalIso(b.tanggal));
      setel.push(`tanggal = coalesce($${nilai.length}::date, tanggal)`);
    }
    if ("langsung" in b) {
      nilai.push(!!b.langsung);
      setel.push(`langsung = $${nilai.length}`);
    }
    if ("terbit" in b) {
      nilai.push(!!b.terbit);
      setel.push(`terbit = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirim(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update kajian set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Jadwal kajian tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/kajian/:id", async (req, res) => {
    await kirim(res, async () => {
      const hasil = await tanya("delete from kajian where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Jadwal kajian tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  /* --------------------------- kajian rutin --------------------------- */

  app.post("/api/admin/kajian-rutin", async (req, res) => {
    const b = req.body || {};
    const judul = rapikan(b.judul, BATAS_JUDUL);
    if (!judul) return res.status(400).json({ pesan: "Judul kajian rutin tidak boleh kosong." });

    await kirim(res, async () => {
      const urutan =
        (await tanya("select coalesce(max(urutan), 0)::int + 1 as n from kajian_rutin")).rows[0].n ?? 1;
      await tanya(
        `insert into kajian_rutin (id, urutan, hari, waktu, judul, ustadz, tempat, peserta, aktif)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          kodeBaru("kr"),
          urutan,
          rapikan(b.hari, BATAS_PENDEK) || "-",
          rapikan(b.waktu, BATAS_PENDEK),
          judul,
          rapikan(b.ustadz, BATAS_PENDEK),
          rapikan(b.tempat, BATAS_PENDEK),
          rapikan(b.peserta, BATAS_PENDEK),
          b.aktif !== false,
        ],
      );
    });
  });

  app.put("/api/admin/kajian-rutin/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];

    if ("judul" in b) {
      const judul = rapikan(b.judul, BATAS_JUDUL);
      if (!judul) return res.status(400).json({ pesan: "Judul kajian rutin tidak boleh kosong." });
      nilai.push(judul);
      setel.push(`judul = $${nilai.length}`);
    }
    for (const kolom of ["hari", "waktu", "ustadz", "tempat", "peserta"]) {
      if (kolom in b) {
        nilai.push(rapikan(b[kolom], BATAS_PENDEK) || (kolom === "hari" ? "-" : null));
        setel.push(`${kolom} = $${nilai.length}`);
      }
    }
    if ("aktif" in b) {
      nilai.push(!!b.aktif);
      setel.push(`aktif = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirim(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update kajian_rutin set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Kajian rutin tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/kajian-rutin/:id", async (req, res) => {
    await kirim(res, async () => {
      const hasil = await tanya("delete from kajian_rutin where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Kajian rutin tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.post("/api/admin/kajian-rutin-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, 60) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirim(res, async () => {
      for (let i = 0; i < daftar.length; i += 1) {
        await tanya("update kajian_rutin set urutan = $1 where id = $2", [i + 1, daftar[i]]);
      }
    });
  });
};
