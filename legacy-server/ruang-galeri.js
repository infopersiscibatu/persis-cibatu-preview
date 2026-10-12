/**
 * Rute Galeri: teks halaman, gambar halaman, kategori (tabel galeri_album),
 * dan daftar foto (tabel galeri_foto) beserta CRUD-nya untuk panel admin.
 */

const BATAS_PENDEK = 200;
const BATAS_TEKS = 5000;
const BATAS_JUDUL = 300;

function rapikan(nilai, batas = BATAS_PENDEK) {
  if (nilai === null || nilai === undefined) return null;
  return String(nilai).replace(/\r\n/g, "\n").trim().slice(0, batas);
}

/** Ubah nama menjadi slug sederhana (huruf kecil dan tanda hubung). */
function jadikanSlug(teks) {
  return String(teks || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Tanggal ISO (YYYY-MM-DD); kosong berarti pakai tanggal hari ini. */
function tanggalIso(nilai) {
  const t = rapikan(nilai, 20);
  if (!t) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

module.exports = function pasangRuteGaleri(app, { tanya }) {
  const simpanPengaturan = (kunci, nilai) =>
    tanya(
      `insert into pengaturan (kunci, nilai, kelompok) values ($1, $2::jsonb, 'galeri')
       on conflict (kunci) do update set nilai = excluded.nilai`,
      [kunci, JSON.stringify(nilai)],
    );

  const bacaPengaturan = async (kunci, cadangan = {}) => {
    const baris = (await tanya("select nilai from pengaturan where kunci = $1", [kunci])).rows[0];
    return baris && baris.nilai ? baris.nilai : cadangan;
  };

  const ambilGaleri = async () => {
    const halaman = await bacaPengaturan("halaman_galeri", {});
    const foto = (
      await tanya(
        `select f.id, f.album_id, f.judul, f.gambar_url, f.tanggal, f.urutan, f.aktif,
                a.nama as kategori
           from galeri_foto f
           left join galeri_album a on a.id = f.album_id
          order by f.tanggal desc nulls last, f.urutan, f.judul`,
      )
    ).rows;
    const kategori = (
      await tanya(
        `select a.id, a.slug, a.nama, a.keterangan, a.urutan, a.aktif,
                (select count(*)::int from galeri_foto f where f.album_id = a.id) as jumlah
           from galeri_album a
          order by a.urutan nulls last, a.nama`,
      )
    ).rows;

    return {
      halaman: { judul: halaman.judul ?? null, pengantar: halaman.pengantar ?? null },
      gambar: { url: halaman.gambar_url ?? null, alt: halaman.gambar_alt ?? null },
      kategori: kategori.map((a) => ({
        id: a.id,
        slug: a.slug,
        nama: a.nama,
        keterangan: a.keterangan,
        aktif: a.aktif,
        jumlah: a.jumlah,
      })),
      foto: foto.map((f) => ({
        id: f.id,
        albumId: f.album_id,
        kategori: f.kategori,
        judul: f.judul,
        gambarUrl: f.gambar_url,
        tanggal: f.tanggal ? new Date(f.tanggal).toISOString().slice(0, 10) : null,
        aktif: f.aktif,
      })),
    };
  };

  const kirimGaleri = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, ...(await ambilGaleri()) });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  const kodeBaru = (awalan) => `${awalan}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  app.get("/api/galeri", async (_req, res) => {
    try {
      res.json({ ok: true, ...(await ambilGaleri()) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* --------------------------- teks halaman --------------------------- */

  app.put("/api/admin/galeri-halaman", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["judul", "pengantar"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimGaleri(res, async () => {
      const sekarang = await bacaPengaturan("halaman_galeri", {});
      await simpanPengaturan("halaman_galeri", { ...sekarang, ...nilai });
    });
  });

  /* --------------------------- gambar halaman --------------------------- */

  app.put("/api/admin/galeri-gambar", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["gambar_url", "gambar_alt"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimGaleri(res, async () => {
      const sekarang = await bacaPengaturan("halaman_galeri", {});
      await simpanPengaturan("halaman_galeri", { ...sekarang, ...nilai });
    });
  });

  /* --------------------------- kategori --------------------------- */

  app.post("/api/admin/galeri-kategori", async (req, res) => {
    const b = req.body || {};
    const nama = rapikan(b.nama, BATAS_PENDEK);
    if (!nama) return res.status(400).json({ pesan: "Nama kategori tidak boleh kosong." });

    await kirimGaleri(res, async () => {
      const dasar = jadikanSlug(nama) || kodeBaru("album");
      let slug = dasar;
      let n = 2;
      while ((await tanya("select 1 from galeri_album where slug = $1", [slug])).rowCount > 0) {
        slug = `${dasar}-${n}`;
        n += 1;
      }
      const urutan = (await tanya("select coalesce(max(urutan), 0)::int + 1 as n from galeri_album")).rows[0].n ?? 1;
      await tanya(
        `insert into galeri_album (id, slug, nama, keterangan, urutan, aktif)
         values ($1, $2, $3, $4, $5, true)`,
        [kodeBaru("al"), slug, nama, rapikan(b.keterangan, BATAS_TEKS), urutan],
      );
    });
  });

  app.put("/api/admin/galeri-kategori/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    if ("nama" in b) {
      const nama = rapikan(b.nama, BATAS_PENDEK);
      if (!nama) return res.status(400).json({ pesan: "Nama kategori tidak boleh kosong." });
      nilai.push(nama);
      setel.push(`nama = $${nilai.length}`);
    }
    if ("keterangan" in b) {
      nilai.push(rapikan(b.keterangan, BATAS_TEKS));
      setel.push(`keterangan = $${nilai.length}`);
    }
    if ("aktif" in b) {
      nilai.push(!!b.aktif);
      setel.push(`aktif = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimGaleri(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update galeri_album set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Kategori tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/galeri-kategori/:id", async (req, res) => {
    await kirimGaleri(res, async () => {
      const pakai = (
        await tanya("select count(*)::int as n from galeri_foto where album_id = $1", [req.params.id])
      ).rows[0].n;
      if (pakai > 0) {
        const e = new Error(
          `Kategori ini masih dipakai oleh ${pakai} foto. Pindahkan fotonya ke kategori lain lebih dahulu.`,
        );
        e.status = 400;
        throw e;
      }
      const hasil = await tanya("delete from galeri_album where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Kategori tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.post("/api/admin/galeri-kategori-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, 60) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirimGaleri(res, async () => {
      for (let i = 0; i < daftar.length; i += 1) {
        await tanya("update galeri_album set urutan = $1 where id = $2", [i + 1, daftar[i]]);
      }
    });
  });

  /* --------------------------- foto --------------------------- */

  /** Kategori yang dipilih harus ada, kalau tidak foto menjadi tanpa kategori. */
  const periksaKategori = async (albumId) => {
    if (!albumId) return null;
    const ada = (await tanya("select id from galeri_album where id = $1", [albumId])).rows[0];
    if (!ada) {
      const e = new Error("Kategori yang dipilih tidak ditemukan.");
      e.status = 400;
      throw e;
    }
    return albumId;
  };

  app.post("/api/admin/galeri-foto", async (req, res) => {
    const b = req.body || {};
    const judul = rapikan(b.judul, BATAS_JUDUL);
    if (!judul) return res.status(400).json({ pesan: "Caption foto tidak boleh kosong." });

    await kirimGaleri(res, async () => {
      const albumId = await periksaKategori(rapikan(b.album_id, 60));
      await tanya(
        `insert into galeri_foto (id, album_id, judul, gambar_url, tanggal, urutan, aktif)
         values ($1, $2, $3, $4, coalesce($5::date, current_date), 0, $6)`,
        [kodeBaru("gf"), albumId, judul, rapikan(b.gambar_url, BATAS_TEKS), tanggalIso(b.tanggal), b.aktif !== false],
      );
    });
  });

  app.put("/api/admin/galeri-foto/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    if ("judul" in b) {
      const judul = rapikan(b.judul, BATAS_JUDUL);
      if (!judul) return res.status(400).json({ pesan: "Caption foto tidak boleh kosong." });
      nilai.push(judul);
      setel.push(`judul = $${nilai.length}`);
    }
    if ("gambar_url" in b) {
      nilai.push(rapikan(b.gambar_url, BATAS_TEKS));
      setel.push(`gambar_url = $${nilai.length}`);
    }
    if ("tanggal" in b) {
      nilai.push(tanggalIso(b.tanggal));
      setel.push(`tanggal = coalesce($${nilai.length}::date, tanggal)`);
    }
    if ("album_id" in b) {
      const albumId = await periksaKategori(rapikan(b.album_id, 60));
      nilai.push(albumId);
      setel.push(`album_id = $${nilai.length}`);
    }
    if ("aktif" in b) {
      nilai.push(!!b.aktif);
      setel.push(`aktif = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimGaleri(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update galeri_foto set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Foto tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/galeri-foto/:id", async (req, res) => {
    await kirimGaleri(res, async () => {
      const hasil = await tanya("delete from galeri_foto where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Foto tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });
};
