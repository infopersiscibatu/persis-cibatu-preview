/**
 * Rute Artikel: teks halaman, gambar halaman, kategori (tabel kategori jenis 'artikel'),
 * dan daftar artikel (tabel artikel) beserta CRUD untuk panel admin.
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

/** Waktu baca dalam menit, dibatasi 1–180. */
function menitBaca(nilai) {
  const n = Number.parseInt(String(nilai ?? "").trim(), 10);
  if (!Number.isFinite(n)) return 3;
  return Math.min(180, Math.max(1, n));
}

function rapikanIsi(nilai) {
  if (!Array.isArray(nilai)) return null;
  return nilai
    .map((p) => rapikan(p, BATAS_TEKS))
    .filter((p) => p && p.length > 0)
    .slice(0, MAKS_BAGIAN);
}

const isiKeTeks = (isi) => (Array.isArray(isi) ? isi.join("\n\n") : "");

module.exports = function pasangRuteArtikel(app, { tanya }) {
  const simpanPengaturan = (kunci, nilai) =>
    tanya(
      `insert into pengaturan (kunci, nilai, kelompok) values ($1, $2::jsonb, 'artikel')
       on conflict (kunci) do update set nilai = excluded.nilai`,
      [kunci, JSON.stringify(nilai)],
    );

  const bacaPengaturan = async (kunci, cadangan = {}) => {
    const baris = (await tanya("select nilai from pengaturan where kunci = $1", [kunci])).rows[0];
    return baris && baris.nilai ? baris.nilai : cadangan;
  };

  const ambilArtikel = async () => {
    const halaman = await bacaPengaturan("halaman_artikel", {});
    const kategori = (
      await tanya(
        `select k.id, k.nama, k.aktif,
                (select count(*)::int from artikel a where a.kategori = k.nama) as jumlah
           from kategori k
          where k.jenis = 'artikel'
          order by k.urutan nulls last, k.nama`,
      )
    ).rows;
    const artikel = (
      await tanya(
        `select id, slug, judul, kategori, penulis, tanggal, menit_baca, dibaca, gambar_url, ringkasan, isi, terbit
           from artikel
          order by tanggal desc nulls last, dibaca desc`,
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
      artikel: artikel.map((a) => ({
        id: a.id,
        slug: a.slug,
        judul: a.judul,
        kategori: a.kategori,
        penulis: a.penulis,
        tanggal: a.tanggal ? new Date(a.tanggal).toISOString().slice(0, 10) : null,
        menitBaca: Number(a.menit_baca ?? 3),
        dibaca: Number(a.dibaca ?? 0),
        gambarUrl: a.gambar_url,
        ringkasan: a.ringkasan,
        isi: Array.isArray(a.isi) ? a.isi : [],
        isiTeks: isiKeTeks(a.isi),
        terbit: a.terbit !== false,
      })),
    };
  };

  const kirim = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, ...(await ambilArtikel()) });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  const kodeBaru = (awalan) => `${awalan}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  app.get("/api/artikel", async (_req, res) => {
    try {
      res.json({ ok: true, ...(await ambilArtikel()) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* Penghitung dibaca: satu tambahan setiap artikel dibuka. */
  app.post("/api/artikel/:slug/dibaca", async (req, res) => {
    try {
      const hasil = await tanya("update artikel set dibaca = dibaca + 1 where slug = $1 returning dibaca", [
        req.params.slug,
      ]);
      res.json({ ok: true, dibaca: hasil.rowCount > 0 ? Number(hasil.rows[0].dibaca) : null });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* --------------------------- teks & gambar halaman --------------------------- */

  app.put("/api/admin/artikel-halaman", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["judul", "pengantar"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });
    await kirim(res, async () => {
      const sekarang = await bacaPengaturan("halaman_artikel", {});
      await simpanPengaturan("halaman_artikel", { ...sekarang, ...nilai });
    });
  });

  app.put("/api/admin/artikel-gambar", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["gambar_url", "gambar_alt"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });
    await kirim(res, async () => {
      const sekarang = await bacaPengaturan("halaman_artikel", {});
      await simpanPengaturan("halaman_artikel", { ...sekarang, ...nilai });
    });
  });

  /* --------------------------- kategori --------------------------- */

  app.post("/api/admin/artikel-kategori", async (req, res) => {
    const b = req.body || {};
    const nama = rapikan(b.nama, BATAS_PENDEK);
    if (!nama) return res.status(400).json({ pesan: "Nama kategori tidak boleh kosong." });

    await kirim(res, async () => {
      const ada = (await tanya("select 1 from kategori where jenis = 'artikel' and nama = $1", [nama])).rowCount > 0;
      if (ada) {
        const e = new Error(`Kategori ${nama} sudah ada.`);
        e.status = 400;
        throw e;
      }
      const dasar = jadikanSlug(nama) || kodeBaru("artikel");
      let slug = dasar;
      let n = 2;
      while ((await tanya("select 1 from kategori where jenis = 'artikel' and slug = $1", [slug])).rowCount > 0) {
        slug = `${dasar}-${n}`;
        n += 1;
      }
      const urutan =
        (await tanya("select coalesce(max(urutan), 0)::int + 1 as n from kategori where jenis = 'artikel'")).rows[0]
          .n ?? 1;
      await tanya(
        `insert into kategori (id, jenis, nama, slug, urutan, aktif) values ($1, 'artikel', $2, $3, $4, true)`,
        [kodeBaru("kt"), nama, slug, urutan],
      );
    });
  });

  app.put("/api/admin/artikel-kategori/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    let namaLama = null;
    let namaBaru = null;

    if ("nama" in b) {
      const nama = rapikan(b.nama, BATAS_PENDEK);
      if (!nama) return res.status(400).json({ pesan: "Nama kategori tidak boleh kosong." });
      const lama = (await tanya("select nama from kategori where id = $1 and jenis = 'artikel'", [req.params.id]))
        .rows[0];
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

    await kirim(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update kategori set ${setel.join(", ")} where id = $${nilai.length} and jenis = 'artikel' returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Kategori tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      /* Artikel menyimpan nama kategori, jadi ikut diperbarui saat namanya diganti. */
      if (namaLama && namaBaru && namaLama !== namaBaru) {
        await tanya("update artikel set kategori = $1, diperbarui = now() where kategori = $2", [namaBaru, namaLama]);
      }
    });
  });

  app.delete("/api/admin/artikel-kategori/:id", async (req, res) => {
    await kirim(res, async () => {
      const baris = (await tanya("select nama from kategori where id = $1 and jenis = 'artikel'", [req.params.id]))
        .rows[0];
      if (!baris) {
        const e = new Error("Kategori tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      const pakai = (await tanya("select count(*)::int as n from artikel where kategori = $1", [baris.nama])).rows[0]
        .n;
      if (pakai > 0) {
        const e = new Error(
          `Kategori ini masih dipakai oleh ${pakai} artikel. Pindahkan artikelnya ke kategori lain lebih dahulu.`,
        );
        e.status = 400;
        throw e;
      }
      await tanya("delete from kategori where id = $1", [req.params.id]);
    });
  });

  app.post("/api/admin/artikel-kategori-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, 60) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirim(res, async () => {
      for (let i = 0; i < daftar.length; i += 1) {
        await tanya("update kategori set urutan = $1 where id = $2", [i + 1, daftar[i]]);
      }
    });
  });

  /* --------------------------- artikel --------------------------- */

  const slugUnik = async (judul, idDikecualikan = null) => {
    const dasar = jadikanSlug(judul) || kodeBaru("artikel");
    let slug = dasar;
    let n = 2;
    for (;;) {
      const baris = await tanya("select id from artikel where slug = $1", [slug]);
      if (baris.rowCount === 0 || (idDikecualikan && baris.rows[0].id === idDikecualikan)) return slug;
      slug = `${dasar}-${n}`;
      n += 1;
    }
  };

  app.post("/api/admin/artikel", async (req, res) => {
    const b = req.body || {};
    const judul = rapikan(b.judul, BATAS_JUDUL);
    if (!judul) return res.status(400).json({ pesan: "Judul artikel tidak boleh kosong." });

    await kirim(res, async () => {
      const slug = await slugUnik(judul);
      await tanya(
        `insert into artikel (id, slug, judul, kategori, penulis, tanggal, menit_baca, gambar_url, ringkasan, isi, terbit)
         values ($1, $2, $3, $4, $5, coalesce($6::date, current_date), $7, $8, $9, $10::jsonb, $11)`,
        [
          kodeBaru("ar"),
          slug,
          judul,
          rapikan(b.kategori, BATAS_PENDEK) || null,
          rapikan(b.penulis, BATAS_PENDEK),
          tanggalIso(b.tanggal),
          menitBaca(b.menitBaca),
          rapikan(b.gambar_url, BATAS_TEKS),
          rapikan(b.ringkasan, BATAS_TEKS),
          JSON.stringify(rapikanIsi(b.isi) ?? []),
          b.terbit !== false,
        ],
      );
    });
  });

  app.put("/api/admin/artikel/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];

    if ("judul" in b) {
      const judul = rapikan(b.judul, BATAS_JUDUL);
      if (!judul) return res.status(400).json({ pesan: "Judul artikel tidak boleh kosong." });
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
    if ("menitBaca" in b) {
      nilai.push(menitBaca(b.menitBaca));
      setel.push(`menit_baca = $${nilai.length}`);
    }
    if ("isi" in b) {
      nilai.push(JSON.stringify(rapikanIsi(b.isi) ?? []));
      setel.push(`isi = $${nilai.length}::jsonb`);
    }
    if ("terbit" in b) {
      nilai.push(!!b.terbit);
      setel.push(`terbit = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirim(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update artikel set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id, judul, slug`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Artikel tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      const { id, judul, slug } = hasil.rows[0];
      const seharusnya = jadikanSlug(judul);
      if (seharusnya && seharusnya !== slug && seharusnya.slice(0, 60) !== slug) {
        const baru = await slugUnik(judul, id);
        await tanya("update artikel set slug = $1 where id = $2", [baru, id]);
      }
    });
  });

  app.delete("/api/admin/artikel/:id", async (req, res) => {
    await kirim(res, async () => {
      const hasil = await tanya("delete from artikel where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Artikel tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });
};
