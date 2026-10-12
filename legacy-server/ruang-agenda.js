/**
 * Rute Agenda: daftar agenda (tabel agenda) dan kategori
 * (tabel kategori jenis 'agenda', disimpan pada kolom tag) beserta CRUD panel admin.
 */

const BATAS_PENDEK = 200;
const BATAS_TEKS = 20000;
const BATAS_JUDUL = 300;
const MAKS_BAGIAN = 60;

function rapikan(nilai, batas = BATAS_PENDEK) {
  if (nilai === null || nilai === undefined) return null;
  return String(nilai).replace(/\r\n/g, "\n").trim().slice(0, batas);
}

function tanggalIso(nilai) {
  const t = rapikan(nilai, 20);
  if (!t) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

function rapikanIsi(nilai) {
  if (!Array.isArray(nilai)) return null;
  return nilai
    .map((p) => rapikan(p, BATAS_TEKS))
    .filter((p) => p && p.length > 0)
    .slice(0, MAKS_BAGIAN);
}

const isiKeTeks = (isi) => (Array.isArray(isi) ? isi.join("\n\n") : "");

module.exports = function pasangRuteAgenda(app, { tanya }) {
  const ambilAgenda = async () => {
    const kategori = (
      await tanya(
        `select k.id, k.nama, k.aktif,
                (select count(*)::int from agenda a where a.tag = k.nama) as jumlah
           from kategori k
          where k.jenis = 'agenda'
          order by k.urutan nulls last, k.nama`,
      )
    ).rows;
    const agenda = (
      await tanya(
        `select id, judul, tanggal, waktu, tempat, tag, isi, dibaca, terbit
           from agenda
          order by tanggal asc, waktu asc nulls last`,
      )
    ).rows;

    return {
      kategori: kategori.map((k) => ({
        id: k.id,
        nama: k.nama,
        aktif: k.aktif !== false,
        jumlah: Number(k.jumlah ?? 0),
      })),
      agenda: agenda.map((a) => ({
        id: a.id,
        judul: a.judul,
        tanggal: a.tanggal ? new Date(a.tanggal).toISOString().slice(0, 10) : null,
        waktu: a.waktu,
        tempat: a.tempat,
        tag: a.tag,
        isi: Array.isArray(a.isi) ? a.isi : [],
        dibaca: Number(a.dibaca ?? 0),
        isiTeks: isiKeTeks(a.isi),
        terbit: a.terbit !== false,
      })),
    };
  };

  const kirim = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, ...(await ambilAgenda()) });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  const kodeBaru = (awalan) => `${awalan}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  app.get("/api/agenda", async (_req, res) => {
    try {
      res.json({ ok: true, ...(await ambilAgenda()) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

/* Penghitung dibaca: satu tambahan setiap detail agenda dibuka pengunjung. */
  app.post("/api/agenda/:id/dibaca", async (req, res) => {
    try {
      const hasil = await tanya("update agenda set dibaca = dibaca + 1 where id = $1 returning dibaca", [
        req.params.id,
      ]);
      res.json({ ok: true, dibaca: hasil.rowCount > 0 ? Number(hasil.rows[0].dibaca) : null });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

    /* ------------------------------- kategori ------------------------------- */

  app.post("/api/admin/agenda-kategori", async (req, res) => {
    const nama = rapikan((req.body || {}).nama, BATAS_PENDEK);
    if (!nama) return res.status(400).json({ pesan: "Nama kategori tidak boleh kosong." });

    await kirim(res, async () => {
      const ada =
        (await tanya("select 1 from kategori where jenis = 'agenda' and lower(nama) = lower($1)", [nama])).rowCount > 0;
      if (ada) {
        const e = new Error(`Kategori ${nama} sudah ada.`);
        e.status = 400;
        throw e;
      }
      const slug =
        nama
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 60) || kodeBaru("agenda");
      const urutan =
        (await tanya("select coalesce(max(urutan), 0)::int + 1 as n from kategori where jenis = 'agenda'")).rows[0]
          .n ?? 1;
      await tanya(`insert into kategori (id, jenis, nama, slug, urutan, aktif) values ($1, 'agenda', $2, $3, $4, true)`, [
        kodeBaru("kt"),
        nama,
        slug,
        urutan,
      ]);
    });
  });

  app.put("/api/admin/agenda-kategori/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    let namaLama = null;
    let namaBaru = null;

    if ("nama" in b) {
      const nama = rapikan(b.nama, BATAS_PENDEK);
      if (!nama) return res.status(400).json({ pesan: "Nama kategori tidak boleh kosong." });
      const lama = (await tanya("select nama from kategori where id = $1 and jenis = 'agenda'", [req.params.id])).rows[0];
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
        `update kategori set ${setel.join(", ")} where id = $${nilai.length} and jenis = 'agenda' returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Kategori tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      /* Agenda menyimpan nama kategori pada kolom tag, jadi ikut diperbarui. */
      if (namaLama && namaBaru && namaLama !== namaBaru) {
        await tanya("update agenda set tag = $1, diperbarui = now() where tag = $2", [namaBaru, namaLama]);
      }
    });
  });

  app.delete("/api/admin/agenda-kategori/:id", async (req, res) => {
    await kirim(res, async () => {
      const baris = (await tanya("select nama from kategori where id = $1 and jenis = 'agenda'", [req.params.id]))
        .rows[0];
      if (!baris) {
        const e = new Error("Kategori tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      const pakai = (await tanya("select count(*)::int as n from agenda where tag = $1", [baris.nama])).rows[0].n;
      if (pakai > 0) {
        const e = new Error(
          `Kategori ini masih dipakai oleh ${pakai} agenda. Pindahkan agendanya ke kategori lain lebih dahulu.`,
        );
        e.status = 400;
        throw e;
      }
      await tanya("delete from kategori where id = $1", [req.params.id]);
    });
  });

  app.post("/api/admin/agenda-kategori-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, 60) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirim(res, async () => {
      for (let i = 0; i < daftar.length; i += 1) {
        await tanya("update kategori set urutan = $1 where id = $2", [i + 1, daftar[i]]);
      }
    });
  });

  /* --------------------------------- agenda --------------------------------- */

  app.post("/api/admin/agenda", async (req, res) => {
    const b = req.body || {};
    const judul = rapikan(b.judul, BATAS_JUDUL);
    if (!judul) return res.status(400).json({ pesan: "Judul agenda tidak boleh kosong." });

    await kirim(res, async () => {
      await tanya(
        `insert into agenda (id, judul, tanggal, waktu, tempat, tag, isi, terbit)
         values ($1, $2, coalesce($3::date, current_date), $4, $5, $6, $7::jsonb, $8)`,
        [
          kodeBaru("ag"),
          judul,
          tanggalIso(b.tanggal),
          rapikan(b.waktu, BATAS_PENDEK),
          rapikan(b.tempat, BATAS_PENDEK),
          rapikan(b.tag, BATAS_PENDEK) || null,
          JSON.stringify(rapikanIsi(b.isi) ?? []),
          b.terbit !== false,
        ],
      );
    });
  });

  app.put("/api/admin/agenda/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];

    if ("judul" in b) {
      const judul = rapikan(b.judul, BATAS_JUDUL);
      if (!judul) return res.status(400).json({ pesan: "Judul agenda tidak boleh kosong." });
      nilai.push(judul);
      setel.push(`judul = $${nilai.length}`);
    }
    for (const kolom of ["waktu", "tempat", "tag"]) {
      if (kolom in b) {
        nilai.push(rapikan(b[kolom], BATAS_PENDEK));
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
    if ("terbit" in b) {
      nilai.push(!!b.terbit);
      setel.push(`terbit = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirim(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update agenda set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Agenda tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/agenda/:id", async (req, res) => {
    await kirim(res, async () => {
      const hasil = await tanya("delete from agenda where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Agenda tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });
};
