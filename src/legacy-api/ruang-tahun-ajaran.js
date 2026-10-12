// @ts-nocheck
/**
 * Tahun ajaran: dikelola dari panel admin. Hanya satu yang aktif, dan seluruh
 * halaman admin lain (sekolah, tata usaha, nilai, tagihan) membaca yang aktif.
 */
const SEMESTER = ["Ganjil", "Genap"];

function rapikan(v, batas = 60) {
  if (v === null || v === undefined) return null;
  const t = String(v).trim().slice(0, batas);
  return t || null;
}
function tanggal(v) {
  const t = rapikan(v, 10);
  return t && /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

export default function pasangRuteTahunAjaran(app, { tanya }) {
  const daftar = async () =>
    (
      await tanya(
        "select id, nama, semester, to_char(mulai,'YYYY-MM-DD') as mulai, to_char(selesai,'YYYY-MM-DD') as selesai, aktif from tahun_ajaran order by aktif desc, mulai desc nulls last, nama desc",
      )
    ).rows;

  const jawab = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, tahunAjaran: await daftar() });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  const galat = (pesan, status = 400) => Object.assign(new Error(pesan), { status });

  const aktifkan = async (id) => {
    await tanya("update tahun_ajaran set aktif = false where aktif and id <> $1", [id]);
    await tanya("update tahun_ajaran set aktif = true where id = $1", [id]);
  };

  const bacaIsi = (b) => {
    const nama = rapikan(b.nama);
    if (!nama) throw galat("Nama tahun ajaran wajib diisi.");
    const semester = SEMESTER.includes(b.semester) ? b.semester : null;
    const mulai = tanggal(b.mulai);
    const selesai = tanggal(b.selesai);
    if (mulai && selesai && selesai < mulai) throw galat("Tanggal selesai tidak boleh sebelum tanggal mulai.");
    return { nama, semester, mulai, selesai };
  };

  /* Publik: tahun ajaran aktif (ditampilkan di kepala halaman admin unit). */
  app.get("/api/tahun-ajaran/aktif", async (_req, res) => {
    try {
      const { rows } = await tanya(
        "select id, nama, semester from tahun_ajaran where aktif order by mulai desc nulls last limit 1",
      );
      res.json({ tahunAjaran: rows[0] ?? null });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.get("/api/admin/tahun-ajaran", (_req, res) => jawab(res, async () => {}));

  app.post("/api/admin/tahun-ajaran", (req, res) =>
    jawab(res, async () => {
      const b = req.body || {};
      const v = bacaIsi(b);
      const id = `ta-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const { rows } = await tanya("select count(*)::int as n from tahun_ajaran where aktif");
      await tanya("insert into tahun_ajaran (id, nama, semester, mulai, selesai, aktif) values ($1,$2,$3,$4,$5,false)", [
        id, v.nama, v.semester, v.mulai, v.selesai,
      ]);
      if (b.aktif || rows[0].n === 0) await aktifkan(id);
    }),
  );

  app.put("/api/admin/tahun-ajaran/:id", (req, res) =>
    jawab(res, async () => {
      const v = bacaIsi(req.body || {});
      const r = await tanya("update tahun_ajaran set nama=$2, semester=$3, mulai=$4, selesai=$5 where id=$1", [
        req.params.id, v.nama, v.semester, v.mulai, v.selesai,
      ]);
      if (!r.rowCount) throw galat("Tahun ajaran tidak ditemukan.", 404);
    }),
  );

  app.post("/api/admin/tahun-ajaran/:id/aktif", (req, res) =>
    jawab(res, async () => {
      const { rows } = await tanya("select id from tahun_ajaran where id = $1", [req.params.id]);
      if (!rows[0]) throw galat("Tahun ajaran tidak ditemukan.", 404);
      await aktifkan(req.params.id);
    }),
  );

  app.delete("/api/admin/tahun-ajaran/:id", (req, res) =>
    jawab(res, async () => {
      const { rows } = await tanya("select aktif from tahun_ajaran where id = $1", [req.params.id]);
      if (!rows[0]) throw galat("Tahun ajaran tidak ditemukan.", 404);
      if (rows[0].aktif) throw galat("Tahun ajaran yang sedang aktif tidak bisa dihapus. Aktifkan tahun lain dulu.");
      await tanya("delete from tahun_ajaran where id = $1", [req.params.id]);
    }),
  );
}
