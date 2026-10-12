/**
 * Rute Iklan: iklan berupa gambar yang disisipkan di dalam isi Berita dan Artikel,
 * beserta pengelolaannya dari panel admin (menu Berita → Iklan).
 *
 * Situs hanya menampilkan iklan yang aktif. Panel admin melihat semuanya, termasuk
 * yang sedang disembunyikan, supaya bisa diubah kembali.
 */

const BATAS_JUDUL = 200;
const BATAS_TEKS = 600;
const BATAS_LABEL = 40;
const BATAS_TAUTAN = 1000;
const MAKS_IKLAN = 12;

function rapikan(nilai, batas) {
  if (nilai === null || nilai === undefined) return null;
  const teks = String(nilai).replace(/\r\n/g, "\n").trim();
  return teks === "" ? null : teks.slice(0, batas);
}

const kodeBaru = () => `ik-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

function keBaris(b) {
  return {
    id: b.id,
    urutan: Number(b.urutan ?? 0),
    label: rapikan(b.label, BATAS_LABEL) ?? "Iklan",
    judul: rapikan(b.judul, BATAS_JUDUL) ?? "",
    teks: rapikan(b.teks, BATAS_TEKS),
    gambarUrl: rapikan(b.gambar_url, BATAS_TAUTAN),
    tautan: rapikan(b.tautan, BATAS_TAUTAN),
    aktif: b.aktif !== false,
  };
}

async function ambilIklan(tanya) {
  const baris = (
    await tanya(
      `select id, urutan, label, judul, teks, gambar_url, tautan, aktif
         from iklan
        order by urutan nulls last, dibuat`,
    )
  ).rows;
  return baris.map(keBaris);
}

/** Tautan iklan: halaman situs (#/...) atau alamat luar (http/https). */
function tautanSah(nilai) {
  const t = rapikan(nilai, BATAS_TAUTAN);
  if (!t) return null;
  if (t.startsWith("#/") || /^https?:\/\//i.test(t)) return t;
  return null;
}

module.exports = function pasangRuteIklan(app, { tanya }) {
  const kirim = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, iklan: await ambilIklan(tanya) });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  app.get("/api/iklan", async (_req, res) => {
    try {
      res.json({ ok: true, iklan: await ambilIklan(tanya) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ------------------------------- panel admin ------------------------------- */

  app.post("/api/admin/iklan", async (req, res) => {
    const b = req.body || {};
    const judul = rapikan(b.judul, BATAS_JUDUL);
    if (!judul) return res.status(400).json({ pesan: "Nama iklan tidak boleh kosong." });
    const gambarUrl = rapikan(b.gambarUrl, BATAS_TAUTAN);
    if (!gambarUrl) return res.status(400).json({ pesan: "Gambar iklan belum diunggah." });

    await kirim(res, async () => {
      const jumlah = (await tanya("select count(*)::int as n from iklan")).rows[0].n;
      if (jumlah >= MAKS_IKLAN) {
        const e = new Error(`Iklan maksimal ${MAKS_IKLAN} baris. Hapus salah satu lebih dahulu.`);
        e.status = 400;
        throw e;
      }
      await tanya(
        `insert into iklan (id, urutan, label, judul, teks, gambar_url, tautan, aktif)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          kodeBaru(),
          jumlah + 1,
          "Iklan",
          judul,
          null,
          gambarUrl,
          tautanSah(b.tautan),
          b.aktif !== false,
        ],
      );
    });
  });

  app.put("/api/admin/iklan/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];

    if ("judul" in b) {
      const judul = rapikan(b.judul, BATAS_JUDUL);
      if (!judul) return res.status(400).json({ pesan: "Nama iklan tidak boleh kosong." });
      nilai.push(judul);
      setel.push(`judul = $${nilai.length}`);
    }
    if ("label" in b) {
      nilai.push(rapikan(b.label, BATAS_LABEL) ?? "Iklan");
      setel.push(`label = $${nilai.length}`);
    }
    if ("teks" in b) {
      nilai.push(rapikan(b.teks, BATAS_TEKS));
      setel.push(`teks = $${nilai.length}`);
    }
    if ("gambarUrl" in b) {
      nilai.push(rapikan(b.gambarUrl, BATAS_TAUTAN));
      setel.push(`gambar_url = $${nilai.length}`);
    }
    if ("tautan" in b) {
      const tautan = rapikan(b.tautan, BATAS_TAUTAN);
      if (tautan && !tautanSah(tautan)) {
        return res.status(400).json({ pesan: "Tautan harus dimulai dengan #/ (halaman situs) atau http(s)://" });
      }
      nilai.push(tautanSah(b.tautan));
      setel.push(`tautan = $${nilai.length}`);
    }
    if ("aktif" in b) {
      nilai.push(!!b.aktif);
      setel.push(`aktif = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirim(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update iklan set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Iklan tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/iklan/:id", async (req, res) => {
    await kirim(res, async () => {
      const hasil = await tanya("delete from iklan where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Iklan tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      await tanya(
        `update iklan set urutan = posisi.baru
           from (select id, row_number() over (order by urutan, id) as baru from iklan) posisi
          where iklan.id = posisi.id`,
      );
    });
  });

  app.post("/api/admin/iklan-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, MAKS_IKLAN) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirim(res, async () => {
      for (let i = 0; i < daftar.length; i += 1) {
        await tanya("update iklan set urutan = $1, diperbarui = now() where id = $2", [i + 1, daftar[i]]);
      }
    });
  });
};
