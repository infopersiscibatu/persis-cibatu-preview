/**
 * Rute Kontak: teks halaman, gambar halaman, alamat sekretariat, formulir pesan,
 * dan daftar topik pesan.
 *
 * Alamat dan jam layanan disimpan pada pengaturan yang sama dengan halaman Profil
 * (identitas + layanan_jamaah) supaya alamat lembaga tetap satu sumber di seluruh situs.
 * Nomor WhatsApp admin pada formulir dipakai bersama dengan halaman SPMB.
 */

const BATAS_PENDEK = 200;
const BATAS_TEKS = 20000;

function rapikan(nilai, batas = BATAS_PENDEK) {
  if (nilai === null || nilai === undefined) return null;
  return String(nilai).replace(/\r\n/g, "\n").trim().slice(0, batas);
}

module.exports = function pasangRuteKontak(app, { tanya }) {
  const simpanPengaturan = (kunci, nilai, kelompok = "kontak") =>
    tanya(
      `insert into pengaturan (kunci, nilai, kelompok) values ($1, $2::jsonb, $3)
       on conflict (kunci) do update set nilai = excluded.nilai`,
      [kunci, JSON.stringify(nilai), kelompok],
    );

  const bacaPengaturan = async (kunci, cadangan = {}) => {
    const baris = (await tanya("select nilai from pengaturan where kunci = $1", [kunci])).rows[0];
    return baris && baris.nilai ? baris.nilai : cadangan;
  };

  const ambilKontak = async () => {
    const halaman = await bacaPengaturan("halaman_kontak", {});
    const formulir = await bacaPengaturan("formulir_kontak", {});
    const identitas = await bacaPengaturan("identitas", {});
    const layananJamaah = await bacaPengaturan("layanan_jamaah", {});
    const spmbFormulir = await bacaPengaturan("formulir_spmb", {});

    /* Kolom teks pada tabel topik_kontak sudah ada sejak skema awal. */
    const topik = (
      await tanya("select id, teks, aktif, urutan from topik_kontak order by urutan, teks")
    ).rows;

    return {
      halaman: {
        judul: halaman.judul ?? null,
        subjudul: halaman.subjudul ?? null,
        pengantar: halaman.pengantar ?? null,
        gambar_url: halaman.gambar_url ?? null,
        gambar_alt: halaman.gambar_alt ?? null,
      },
      alamat: {
        nama: identitas.namaLengkap ?? null,
        alamat: layananJamaah.alamat ?? null,
        jam: layananJamaah.jam ?? null,
        catatanJam: halaman.catatan_jam ?? null,
        peta: halaman.peta ?? null,
      },
      formulir: {
        judul: formulir.judul ?? null,
        pengantar: formulir.pengantar ?? null,
        waAdmin: spmbFormulir.wa_admin ?? null,
        judulSukses: formulir.judul_sukses ?? null,
        statusSukses: formulir.status_sukses ?? null,
        catatanSukses: formulir.catatan_sukses ?? null,
      },
      topik: topik.map((t) => ({ id: t.id, nama: t.teks, aktif: t.aktif !== false, urutan: t.urutan })),
    };
  };

  const kirim = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, ...(await ambilKontak()) });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  const kodeBaru = () => `tk-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  app.get("/api/kontak", async (_req, res) => {
    try {
      res.json({ ok: true, ...(await ambilKontak()) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ------------------------------ teks halaman ------------------------------ */

  app.put("/api/admin/kontak-halaman", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["judul", "subjudul", "pengantar"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });
    await kirim(res, async () => {
      const sekarang = await bacaPengaturan("halaman_kontak", {});
      await simpanPengaturan("halaman_kontak", { ...sekarang, ...nilai });
    });
  });

  /* ----------------------------- gambar halaman ----------------------------- */

  app.put("/api/admin/kontak-gambar", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["gambar_url", "gambar_alt"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });
    await kirim(res, async () => {
      const sekarang = await bacaPengaturan("halaman_kontak", {});
      await simpanPengaturan("halaman_kontak", { ...sekarang, ...nilai });
    });
  });

  /* -------------------------------- alamat -------------------------------- */

  app.put("/api/admin/kontak-alamat", async (req, res) => {
    const b = req.body || {};
    const nama = "nama" in b ? rapikan(b.nama, BATAS_PENDEK) : undefined;
    if (nama !== undefined && !nama) return res.status(400).json({ pesan: "Nama lembaga tidak boleh kosong." });

    const alamat = "alamat" in b ? rapikan(b.alamat, BATAS_TEKS) : undefined;
    const jam = "jam" in b ? rapikan(b.jam, BATAS_PENDEK) : undefined;
    const catatanJam = "catatanJam" in b ? rapikan(b.catatanJam, BATAS_TEKS) : undefined;
    const peta = "peta" in b ? rapikan(b.peta, BATAS_TEKS) : undefined;

    if ([nama, alamat, jam, catatanJam, peta].every((v) => v === undefined)) {
      return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });
    }

    await kirim(res, async () => {
      if (nama !== undefined) {
        const sekarang = await bacaPengaturan("identitas", {});
        await simpanPengaturan("identitas", { ...sekarang, namaLengkap: nama }, "profil");
      }
      if (alamat !== undefined || jam !== undefined) {
        const sekarang = await bacaPengaturan("layanan_jamaah", {});
        await simpanPengaturan(
          "layanan_jamaah",
          {
            ...sekarang,
            ...(alamat !== undefined ? { alamat } : {}),
            ...(jam !== undefined ? { jam } : {}),
          },
          "profil",
        );
      }
      if (catatanJam !== undefined || peta !== undefined) {
        const sekarang = await bacaPengaturan("halaman_kontak", {});
        await simpanPengaturan("halaman_kontak", {
          ...sekarang,
          ...(catatanJam !== undefined ? { catatan_jam: catatanJam } : {}),
          ...(peta !== undefined ? { peta } : {}),
        });
      }
    });
  });

  /* ------------------------------- formulir ------------------------------- */

  app.put("/api/admin/kontak-formulir", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const kunci of ["judul", "pengantar", "judul_sukses", "status_sukses", "catatan_sukses"]) {
      if (kunci in b) nilai[kunci] = rapikan(b[kunci], BATAS_TEKS);
    }
    const waAdmin = "waAdmin" in b ? rapikan(b.waAdmin, BATAS_PENDEK) : undefined;
    if (Object.keys(nilai).length === 0 && waAdmin === undefined) {
      return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });
    }

    await kirim(res, async () => {
      if (Object.keys(nilai).length > 0) {
        const sekarang = await bacaPengaturan("formulir_kontak", {});
        await simpanPengaturan("formulir_kontak", { ...sekarang, ...nilai });
      }
      /* Nomor WhatsApp admin dipakai bersama halaman SPMB, jadi disimpan di pengaturan yang sama. */
      if (waAdmin !== undefined) {
        const sekarang = await bacaPengaturan("formulir_spmb", {});
        await simpanPengaturan("formulir_spmb", { ...sekarang, wa_admin: waAdmin }, "spmb");
      }
    });
  });

  /* ---------------------------- topik pesan ---------------------------- */

  app.post("/api/admin/kontak-topik", async (req, res) => {
    const nama = rapikan((req.body || {}).nama, BATAS_PENDEK);
    if (!nama) return res.status(400).json({ pesan: "Nama topik tidak boleh kosong." });

    await kirim(res, async () => {
      const ada = (await tanya("select 1 from topik_kontak where lower(teks) = lower($1)", [nama])).rowCount > 0;
      if (ada) {
        const e = new Error(`Topik ${nama} sudah ada.`);
        e.status = 400;
        throw e;
      }
      const urutan = (await tanya("select coalesce(max(urutan), 0)::int + 1 as n from topik_kontak")).rows[0].n ?? 1;
      await tanya("insert into topik_kontak (id, urutan, teks, aktif) values ($1, $2, $3, true)", [
        kodeBaru(),
        urutan,
        nama,
      ]);
    });
  });

  app.put("/api/admin/kontak-topik/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    if ("nama" in b) {
      const nama = rapikan(b.nama, BATAS_PENDEK);
      if (!nama) return res.status(400).json({ pesan: "Nama topik tidak boleh kosong." });
      nilai.push(nama);
      setel.push(`teks = $${nilai.length}`);
    }
    if ("aktif" in b) {
      nilai.push(!!b.aktif);
      setel.push(`aktif = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirim(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(`update topik_kontak set ${setel.join(", ")} where id = $${nilai.length} returning id`, nilai);
      if (hasil.rowCount === 0) {
        const e = new Error("Topik tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/kontak-topik/:id", async (req, res) => {
    await kirim(res, async () => {
      const hasil = await tanya("delete from topik_kontak where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Topik tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.post("/api/admin/kontak-topik-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, 40) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirim(res, async () => {
      for (let i = 0; i < daftar.length; i += 1) {
        await tanya("update topik_kontak set urutan = $1 where id = $2", [i + 1, daftar[i]]);
      }
    });
  });
};
