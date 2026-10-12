/**
 * Rute Berita: teks halaman, gambar halaman, kategori (tabel kategori jenis 'berita'),
 * dan daftar berita (tabel berita) beserta CRUD-nya untuk panel admin.
 */

const BATAS_PENDEK = 200;
const BATAS_TEKS = 20000;
const BATAS_JUDUL = 300;
const MAKS_BAGIAN = 60;

function rapikan(nilai, batas = BATAS_PENDEK) {
  if (nilai === null || nilai === undefined) return null;
  return String(nilai).replace(/\r\n/g, "\n").trim().slice(0, batas);
}

function jadikanSlug(teks) {
  return String(teks || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function tanggalIso(nilai) {
  const t = rapikan(nilai, 20);
  if (!t) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

/** Isi berita disimpan sebagai larik paragraf. */
function rapikanIsi(nilai) {
  if (!Array.isArray(nilai)) return null;
  return nilai
    .map((p) => rapikan(p, BATAS_TEKS))
    .filter((p) => p && p.length > 0)
    .slice(0, MAKS_BAGIAN);
}

/** Ubah larik paragraf menjadi teks (satu paragraf per baris kosong). */
const isiKeTeks = (isi) => (Array.isArray(isi) ? isi.join("\n\n") : "");

module.exports = function pasangRuteBerita(app, { tanya }) {
  const simpanPengaturan = (kunci, nilai) =>
    tanya(
      `insert into pengaturan (kunci, nilai, kelompok) values ($1, $2::jsonb, 'berita')
       on conflict (kunci) do update set nilai = excluded.nilai`,
      [kunci, JSON.stringify(nilai)],
    );

  const bacaPengaturan = async (kunci, cadangan = {}) => {
    const baris = (await tanya("select nilai from pengaturan where kunci = $1", [kunci])).rows[0];
    return baris && baris.nilai ? baris.nilai : cadangan;
  };

  const ambilBerita = async () => {
    const halaman = await bacaPengaturan("halaman_berita", {});
    const kategori = (
      await tanya(
        `select k.id, k.nama, k.urutan, k.aktif,
                (select count(*)::int from berita b where b.kategori = k.nama) as jumlah
           from kategori k
          where k.jenis = 'berita'
          order by k.urutan nulls last, k.nama`,
      )
    ).rows;
    const berita = (
      await tanya(
        `select id, slug, judul, tanggal, kategori, penulis, gambar_url, dibaca, ringkasan, isi, sorotan, terbit
           from berita
          order by sorotan desc, tanggal desc nulls last, dibaca desc`,
      )
    ).rows;

    return {
      halaman: { judul: halaman.judul ?? null, pengantar: halaman.pengantar ?? null },
      gambar: { url: halaman.gambar_url ?? null, alt: halaman.gambar_alt ?? null },
      kategori: kategori.map((k) => ({
        id: k.id,
        nama: k.nama,
        aktif: k.aktif !== false,
        jumlah: Number(k.jumlah ?? 0),
      })),
      berita: berita.map((b) => ({
        id: b.id,
        slug: b.slug,
        judul: b.judul,
        tanggal: b.tanggal ? new Date(b.tanggal).toISOString().slice(0, 10) : null,
        kategori: b.kategori,
        penulis: b.penulis,
        gambarUrl: b.gambar_url,
        dibaca: Number(b.dibaca ?? 0),
        ringkasan: b.ringkasan,
        isi: Array.isArray(b.isi) ? b.isi : [],
        isiTeks: isiKeTeks(b.isi),
        sorotan: !!b.sorotan,
        terbit: b.terbit !== false,
      })),
    };
  };

  const kirimBerita = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, ...(await ambilBerita()) });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  const kodeBaru = (awalan) => `${awalan}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  app.get("/api/berita", async (_req, res) => {
    try {
      res.json({ ok: true, ...(await ambilBerita()) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* Penghitung dibaca: satu tambahan setiap berita dibuka. */
  app.post("/api/berita/:slug/dibaca", async (req, res) => {
    try {
      const hasil = await tanya("update berita set dibaca = dibaca + 1 where slug = $1 returning dibaca", [
        req.params.slug,
      ]);
      res.json({ ok: true, dibaca: hasil.rowCount > 0 ? Number(hasil.rows[0].dibaca) : null });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* --------------------------- teks halaman --------------------------- */

  app.put("/api/admin/berita-halaman", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["judul", "pengantar"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimBerita(res, async () => {
      const sekarang = await bacaPengaturan("halaman_berita", {});
      await simpanPengaturan("halaman_berita", { ...sekarang, ...nilai });
    });
  });

  /* --------------------------- gambar halaman --------------------------- */

  app.put("/api/admin/berita-gambar", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["gambar_url", "gambar_alt"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimBerita(res, async () => {
      const sekarang = await bacaPengaturan("halaman_berita", {});
      await simpanPengaturan("halaman_berita", { ...sekarang, ...nilai });
    });
  });

  /* --------------------------- kategori --------------------------- */

  app.post("/api/admin/berita-kategori", async (req, res) => {
    const b = req.body || {};
    const nama = rapikan(b.nama, BATAS_PENDEK);
    if (!nama) return res.status(400).json({ pesan: "Nama kategori tidak boleh kosong." });

    await kirimBerita(res, async () => {
      const ada = (await tanya("select 1 from kategori where jenis = 'berita' and nama = $1", [nama])).rowCount > 0;
      if (ada) {
        const e = new Error(`Kategori ${nama} sudah ada.`);
        e.status = 400;
        throw e;
      }
      const dasar = jadikanSlug(nama) || kodeBaru("berita");
      let slug = dasar;
      let n = 2;
      while ((await tanya("select 1 from kategori where jenis = 'berita' and slug = $1", [slug])).rowCount > 0) {
        slug = `${dasar}-${n}`;
        n += 1;
      }
      const urutan =
        (await tanya("select coalesce(max(urutan), 0)::int + 1 as n from kategori where jenis = 'berita'")).rows[0].n ??
        1;
      await tanya(
        `insert into kategori (id, jenis, nama, slug, urutan, aktif) values ($1, 'berita', $2, $3, $4, true)`,
        [kodeBaru("kt"), nama, slug, urutan],
      );
    });
  });

  app.put("/api/admin/berita-kategori/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    let namaLama = null;
    let namaBaru = null;

    if ("nama" in b) {
      const nama = rapikan(b.nama, BATAS_PENDEK);
      if (!nama) return res.status(400).json({ pesan: "Nama kategori tidak boleh kosong." });
      const lama = (
        await tanya("select nama from kategori where id = $1 and jenis = 'berita'", [req.params.id])
      ).rows[0];
      if (!lama) return res.status(404).json({ pesan: "Kategori tidak ditemukan." });
      namaLama = lama.nama;
      namaBaru = nama;
      nilai.push(nama);
      setel.push(`nama = $${nilai.length}`);
    }
    if ("aktif" in b) {
      nilai.push(!!b.aktif);
      setel.push(`aktif = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimBerita(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update kategori set ${setel.join(", ")} where id = $${nilai.length} and jenis = 'berita' returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Kategori tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      /* Berita menyimpan nama kategori, jadi ikut diperbarui saat namanya diganti. */
      if (namaLama && namaBaru && namaLama !== namaBaru) {
        await tanya("update berita set kategori = $1, diperbarui = now() where kategori = $2", [namaBaru, namaLama]);
      }
    });
  });

  app.delete("/api/admin/berita-kategori/:id", async (req, res) => {
    await kirimBerita(res, async () => {
      const baris = (await tanya("select nama from kategori where id = $1 and jenis = 'berita'", [req.params.id]))
        .rows[0];
      if (!baris) {
        const e = new Error("Kategori tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      const pakai = (await tanya("select count(*)::int as n from berita where kategori = $1", [baris.nama])).rows[0].n;
      if (pakai > 0) {
        const e = new Error(
          `Kategori ini masih dipakai oleh ${pakai} berita. Pindahkan beritanya ke kategori lain lebih dahulu.`,
        );
        e.status = 400;
        throw e;
      }
      await tanya("delete from kategori where id = $1", [req.params.id]);
    });
  });

  app.post("/api/admin/berita-kategori-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, 60) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirimBerita(res, async () => {
      for (let i = 0; i < daftar.length; i += 1) {
        await tanya("update kategori set urutan = $1 where id = $2", [i + 1, daftar[i]]);
      }
    });
  });

  /* --------------------------- berita --------------------------- */

  const slugUnik = async (judul, idDikecualikan = null) => {
    const dasar = jadikanSlug(judul) || kodeBaru("berita");
    let slug = dasar;
    let n = 2;
    for (;;) {
      const baris = await tanya("select id from berita where slug = $1", [slug]);
      if (baris.rowCount === 0 || (idDikecualikan && baris.rows[0].id === idDikecualikan)) return slug;
      slug = `${dasar}-${n}`;
      n += 1;
    }
  };

  app.post("/api/admin/berita", async (req, res) => {
    const b = req.body || {};
    const judul = rapikan(b.judul, BATAS_JUDUL);
    if (!judul) return res.status(400).json({ pesan: "Judul berita tidak boleh kosong." });

    await kirimBerita(res, async () => {
      const slug = await slugUnik(judul);
      await tanya(
        `insert into berita (id, slug, judul, tanggal, kategori, penulis, gambar_url, ringkasan, isi, sorotan, terbit, terbit_pada)
         values ($1, $2, $3, coalesce($4::date, current_date), $5, $6, $7, $8, $9::jsonb, $10, $11, now())`,
        [
          kodeBaru("nw"),
          slug,
          judul,
          tanggalIso(b.tanggal),
          rapikan(b.kategori, BATAS_PENDEK) || null,
          rapikan(b.penulis, BATAS_PENDEK),
          rapikan(b.gambar_url, BATAS_TEKS),
          rapikan(b.ringkasan, BATAS_TEKS),
          JSON.stringify(rapikanIsi(b.isi) ?? []),
          !!b.sorotan,
          b.terbit !== false,
        ],
      );
    });
  });

  app.put("/api/admin/berita/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];

    if ("judul" in b) {
      const judul = rapikan(b.judul, BATAS_JUDUL);
      if (!judul) return res.status(400).json({ pesan: "Judul berita tidak boleh kosong." });
      nilai.push(judul);
      setel.push(`judul = $${nilai.length}`);
    }
    for (const [kolom, batas] of [
      ["kategori", BATAS_PENDEK],
      ["penulis", BATAS_PENDEK],
      ["gambar_url", BATAS_TEKS],
      ["ringkasan", BATAS_TEKS],
    ]) {
      if (kolom in b) {
        nilai.push(rapikan(b[kolom], batas));
        setel.push(`${kolom} = $${nilai.length}`);
      }
    }
    if ("tanggal" in b) {
      nilai.push(tanggalIso(b.tanggal));
      setel.push(`tanggal = coalesce($${nilai.length}::date, tanggal)`);
    }
    if ("isi" in b) {
      nilai.push(JSON.stringify(rapikanIsi(b.isi) ?? []));
      setel.push(`isi = $${nilai.length}::jsonb`);
    }
    if ("sorotan" in b) {
      nilai.push(!!b.sorotan);
      setel.push(`sorotan = $${nilai.length}`);
    }
    if ("terbit" in b) {
      nilai.push(!!b.terbit);
      setel.push(`terbit = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimBerita(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update berita set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id, judul, slug`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Berita tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      /* Judul berubah → alamat (slug) disesuaikan agar tetap mudah dibaca. */
      const { id, judul, slug } = hasil.rows[0];
      const seharusnya = jadikanSlug(judul);
      if (seharusnya && seharusnya !== slug && seharusnya.slice(0, 60) !== slug) {
        const baru = await slugUnik(judul, id);
        await tanya("update berita set slug = $1 where id = $2", [baru, id]);
      }
    });
  });

  app.delete("/api/admin/berita/:id", async (req, res) => {
    await kirimBerita(res, async () => {
      const hasil = await tanya("delete from berita where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Berita tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });
};
