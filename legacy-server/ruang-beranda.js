/**
 * Rute Beranda: carousel sorotan (tabel hero_slide), susunan grid menu
 * (tabel menu_cepat), susunan navigasi bawah (pengaturan.navigasi_bawah),
 * dan tautan media sosial (tabel tautan_sosial) beserta CRUD panel admin.
 */

const BATAS_PENDEK = 200;
const BATAS_TEKS = 5000;
const BATAS_URL = 600;

const HALAMAN = [
  { nilai: "beranda", label: "Beranda" },
  { nilai: "berita", label: "Berita" },
  { nilai: "kajian", label: "Kajian" },
  { nilai: "artikel", label: "Artikel" },
  { nilai: "galeri", label: "Galeri" },
  { nilai: "jenjang", label: "Jenjang" },
  { nilai: "ppdb", label: "SPMB / PPDB" },
  { nilai: "wali", label: "Wali Santri" },
  { nilai: "profil", label: "Profil" },
  { nilai: "kontak", label: "Kontak" },
  { nilai: "info", label: "Info" },
];
const KUNCI_HALAMAN = new Set(HALAMAN.map((h) => h.nilai));

const MAKS_CAROUSEL = 8;
const MAKS_GRID = 16;
const MAKS_NAV = 6;

const NAV_BAWAAN = [
  { halaman: "beranda", label: "Beranda", ikon: "home", aktif: true },
  { halaman: "berita", label: "Berita", ikon: "newspaper", aktif: true },
  { halaman: "ppdb", label: "SPMB", ikon: "clipboard", aktif: true },
  { halaman: "artikel", label: "Artikel", ikon: "book-open", aktif: true },
  { halaman: "info", label: "Info", ikon: "info", aktif: true },
];

function rapikan(nilai, batas = BATAS_PENDEK) {
  if (nilai === null || nilai === undefined) return null;
  return String(nilai).replace(/\r\n/g, "\n").trim().slice(0, batas);
}

module.exports = function pasangRuteBeranda(app, { tanya }) {
  const bacaPengaturan = async (kunci, bawaan) => {
    const baris = (await tanya("select nilai from pengaturan where kunci = $1", [kunci])).rows[0];
    return baris && baris.nilai ? baris.nilai : bawaan;
  };

  const tulisPengaturan = (kunci, nilai, keterangan = "") =>
    tanya(
      `insert into pengaturan (kunci, nilai, kelompok, keterangan)
       values ($1, $2::jsonb, 'beranda', $3)
       on conflict (kunci) do update set nilai = excluded.nilai, diperbarui = now()`,
      [kunci, JSON.stringify(nilai), keterangan],
    );

  const ambilNamaSosial = (ikon) => ikon;

  /**
   * Angka kartu statistik beranda yang dihitung langsung dari database:
   * jumlah jenjang formal, siswa (santri berstatus aktif pada jenjang sekolah), dan
   * mahasiswa (santri aktif pada jenjang perguruan tinggi).
   * Santri yang sudah lulus dihitung pada daftar alumni, bukan pada angka siswa ini.
   */
  const hitungStatistik = async () => {
    const angka = async (sql) => {
      try {
        return Number((await tanya(sql)).rows[0].n ?? 0);
      } catch (e) {
        return null;
      }
    };
    const jenjang = await angka("select count(*)::int as n from jenjang where aktif and hitung_jenjang");
    const santriSekolah = await angka(
      `select count(*)::int as n
         from santri s
         join jenjang j on j.id = s.jenjang_id
        where s.status = 'aktif' and j.aktif and j.hitung_jenjang and j.slug <> 'pt'`,
    );
    const santriKuliah = await angka(
      `select count(*)::int as n
         from santri s
         join jenjang j on j.id = s.jenjang_id
        where s.status = 'aktif' and j.aktif and j.slug = 'pt'`,
    );
    return { jenjang, siswa: santriSekolah, mahasiswa: santriKuliah };
  };

  const angkaTampil = (nilai) => (nilai === null || nilai === undefined ? null : Number(nilai).toLocaleString("id-ID"));

  const ambilBeranda = async () => {
    const carousel = (
      await tanya(
        `select id, urutan, tag, judul, teks, gambar_url, tombol_label, tombol_halaman, aktif
           from hero_slide order by urutan, id`,
      )
    ).rows;
    const gridMenu = (
      await tanya(
        `select id, urutan, label, keterangan, ikon, halaman, lencana, aktif
           from menu_cepat order by urutan, id`,
      )
    ).rows;
    const sosial = (
      await tanya("select id, urutan, nama, url, ikon, aktif from tautan_sosial order by urutan, id")
    ).rows;
    const statistik = (await tanya(
      `select id, urutan, ikon, label, label_pendek, nilai, satuan, catatan, tone, aktif, sumber
         from statistik order by urutan, id`,
    )).rows;
    const hitungan = await hitungStatistik();
    const navMentah = await bacaPengaturan("navigasi_bawah", NAV_BAWAAN);
    const navigasi = Array.isArray(navMentah) && navMentah.length > 0 ? navMentah : NAV_BAWAAN;

    return {
      halaman: HALAMAN,
      statistik: statistik.map((k) => {
        const sumber = k.sumber && k.sumber in hitungan ? k.sumber : null;
        const live = sumber ? hitungan[sumber] : null;
        return {
          id: k.id,
          urutan: Number(k.urutan ?? 0),
          ikon: k.ikon ?? "users",
          label: k.label,
          labelPendek: k.label_pendek ?? k.label,
          nilai: live === null || live === undefined ? k.nilai : angkaTampil(live),
          satuan: k.satuan,
          catatan: k.catatan,
          tone: k.tone ?? "green",
          aktif: k.aktif !== false,
          sumber,
        };
      }),
      carousel: carousel.map((s) => ({
        id: s.id,
        urutan: Number(s.urutan ?? 0),
        tag: s.tag,
        judul: s.judul,
        teks: s.teks,
        gambarUrl: s.gambar_url,
        tombolLabel: s.tombol_label,
        tombolHalaman: s.tombol_halaman,
        aktif: s.aktif !== false,
      })),
      gridMenu: gridMenu.map((m) => ({
        id: m.id,
        urutan: Number(m.urutan ?? 0),
        label: m.label,
        keterangan: m.keterangan,
        ikon: m.ikon,
        halaman: m.halaman,
        lencana: m.lencana,
        aktif: m.aktif !== false,
      })),
      navigasi: navigasi
        .filter((n) => n && KUNCI_HALAMAN.has(String(n.halaman ?? n.id ?? "")))
        .map((n) => ({
          halaman: String(n.halaman ?? n.id),
          label: String(n.label ?? "Menu"),
          ikon: String(n.ikon ?? "circle"),
          aktif: n.aktif !== false,
        })),
      sosial: sosial.map((s) => ({
        id: s.id,
        urutan: Number(s.urutan ?? 0),
        nama: s.nama,
        url: s.url,
        ikon: s.ikon ?? ambilNamaSosial(s.nama),
        aktif: s.aktif !== false,
      })),
    };
  };

  const kirim = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, ...(await ambilBeranda()) });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  const kodeBaru = (awalan) => `${awalan}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  app.get("/api/beranda", async (_req, res) => {
    try {
      res.json({ ok: true, ...(await ambilBeranda()) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* -------------------------------- carousel -------------------------------- */

  app.post("/api/admin/carousel", async (req, res) => {
    const b = req.body || {};
    const judul = rapikan(b.judul, BATAS_PENDEK);
    if (!judul) return res.status(400).json({ pesan: "Caption carousel tidak boleh kosong." });
    const gambarUrl = rapikan(b.gambarUrl, BATAS_URL);
    if (!gambarUrl) return res.status(400).json({ pesan: "Gambar carousel belum dipilih." });

    await kirim(res, async () => {
      const jumlah = (await tanya("select count(*)::int as n from hero_slide")).rows[0].n;
      if (jumlah >= MAKS_CAROUSEL) {
        const e = new Error(`Carousel maksimal ${MAKS_CAROUSEL} gambar. Hapus salah satu lebih dahulu.`);
        e.status = 400;
        throw e;
      }
      await tanya(
        `insert into hero_slide (id, urutan, tag, judul, teks, gambar_url, tombol_label, tombol_halaman, aktif)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          kodeBaru("sl"),
          jumlah + 1,
          rapikan(b.tag, BATAS_PENDEK),
          judul,
          rapikan(b.teks, BATAS_TEKS),
          gambarUrl,
          rapikan(b.tombolLabel, BATAS_PENDEK),
          KUNCI_HALAMAN.has(String(b.tombolHalaman ?? "")) ? String(b.tombolHalaman) : null,
          b.aktif !== false,
        ],
      );
    });
  });

  app.put("/api/admin/carousel/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];

    if ("judul" in b) {
      const judul = rapikan(b.judul, BATAS_PENDEK);
      if (!judul) return res.status(400).json({ pesan: "Caption carousel tidak boleh kosong." });
      nilai.push(judul);
      setel.push(`judul = $${nilai.length}`);
    }
    if ("gambarUrl" in b) {
      const url = rapikan(b.gambarUrl, BATAS_URL);
      if (!url) return res.status(400).json({ pesan: "Gambar carousel belum dipilih." });
      nilai.push(url);
      setel.push(`gambar_url = $${nilai.length}`);
    }
    if ("tag" in b) {
      nilai.push(rapikan(b.tag, BATAS_PENDEK));
      setel.push(`tag = $${nilai.length}`);
    }
    if ("teks" in b) {
      nilai.push(rapikan(b.teks, BATAS_TEKS));
      setel.push(`teks = $${nilai.length}`);
    }
    if ("tombolLabel" in b) {
      nilai.push(rapikan(b.tombolLabel, BATAS_PENDEK));
      setel.push(`tombol_label = $${nilai.length}`);
    }
    if ("tombolHalaman" in b) {
      nilai.push(KUNCI_HALAMAN.has(String(b.tombolHalaman ?? "")) ? String(b.tombolHalaman) : null);
      setel.push(`tombol_halaman = $${nilai.length}`);
    }
    if ("aktif" in b) {
      nilai.push(!!b.aktif);
      setel.push(`aktif = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirim(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update hero_slide set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Gambar carousel tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/carousel/:id", async (req, res) => {
    await kirim(res, async () => {
      const sisa = (await tanya("select count(*)::int as n from hero_slide")).rows[0].n;
      if (sisa <= 1) {
        const e = new Error("Carousel harus menyisakan minimal satu gambar.");
        e.status = 400;
        throw e;
      }
      const hasil = await tanya("delete from hero_slide where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Gambar carousel tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      await tanya(
        `update hero_slide set urutan = posisi.baru
           from (select id, row_number() over (order by urutan, id) as baru from hero_slide) posisi
          where hero_slide.id = posisi.id`,
      );
    });
  });

  app.post("/api/admin/carousel-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, MAKS_CAROUSEL) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirim(res, async () => {
      for (let i = 0; i < daftar.length; i += 1) {
        await tanya("update hero_slide set urutan = $1, diperbarui = now() where id = $2", [i + 1, daftar[i]]);
      }
    });
  });

  /* -------------------------------- grid menu -------------------------------- */

  app.post("/api/admin/grid-menu", async (req, res) => {
    const b = req.body || {};
    const label = rapikan(b.label, BATAS_PENDEK);
    if (!label) return res.status(400).json({ pesan: "Nama menu tidak boleh kosong." });
    const halaman = String(b.halaman ?? "");
    if (!KUNCI_HALAMAN.has(halaman)) return res.status(400).json({ pesan: "Halaman tujuan belum dipilih." });

    await kirim(res, async () => {
      const jumlah = (await tanya("select count(*)::int as n from menu_cepat")).rows[0].n;
      if (jumlah >= MAKS_GRID) {
        const e = new Error(`Grid menu maksimal ${MAKS_GRID} menu.`);
        e.status = 400;
        throw e;
      }
      await tanya(
        `insert into menu_cepat (id, urutan, label, keterangan, ikon, tone, halaman, lencana, aktif)
         values ($1, $2, $3, $4, $5, 'green', $6, $7, $8)`,
        [
          kodeBaru("mn"),
          jumlah + 1,
          label,
          rapikan(b.keterangan, BATAS_PENDEK),
          rapikan(b.ikon, 40) || "circle",
          halaman,
          rapikan(b.lencana, 40),
          b.aktif !== false,
        ],
      );
    });
  });

  app.put("/api/admin/grid-menu/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];

    if ("label" in b) {
      const label = rapikan(b.label, BATAS_PENDEK);
      if (!label) return res.status(400).json({ pesan: "Nama menu tidak boleh kosong." });
      nilai.push(label);
      setel.push(`label = $${nilai.length}`);
    }
    if ("halaman" in b) {
      const halaman = String(b.halaman ?? "");
      if (!KUNCI_HALAMAN.has(halaman)) return res.status(400).json({ pesan: "Halaman tujuan belum dipilih." });
      nilai.push(halaman);
      setel.push(`halaman = $${nilai.length}`);
    }
    if ("ikon" in b) {
      nilai.push(rapikan(b.ikon, 40) || "circle");
      setel.push(`ikon = $${nilai.length}`);
    }
    if ("keterangan" in b) {
      nilai.push(rapikan(b.keterangan, BATAS_PENDEK));
      setel.push(`keterangan = $${nilai.length}`);
    }
    if ("lencana" in b) {
      nilai.push(rapikan(b.lencana, 40));
      setel.push(`lencana = $${nilai.length}`);
    }
    if ("aktif" in b) {
      nilai.push(!!b.aktif);
      setel.push(`aktif = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirim(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update menu_cepat set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Menu tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/grid-menu/:id", async (req, res) => {
    await kirim(res, async () => {
      const sisa = (await tanya("select count(*)::int as n from menu_cepat")).rows[0].n;
      if (sisa <= 1) {
        const e = new Error("Grid menu harus menyisakan minimal satu menu.");
        e.status = 400;
        throw e;
      }
      const hasil = await tanya("delete from menu_cepat where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Menu tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      await tanya(
        `update menu_cepat set urutan = posisi.baru
           from (select id, row_number() over (order by urutan, id) as baru from menu_cepat) posisi
          where menu_cepat.id = posisi.id`,
      );
    });
  });

  app.post("/api/admin/grid-menu-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, MAKS_GRID) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirim(res, async () => {
      for (let i = 0; i < daftar.length; i += 1) {
        await tanya("update menu_cepat set urutan = $1, diperbarui = now() where id = $2", [i + 1, daftar[i]]);
      }
    });
  });

  /* ----------------------------- navigasi bawah ----------------------------- */

  app.put("/api/admin/navigasi", async (req, res) => {
    const mentah = (req.body || {}).navigasi;
    if (!Array.isArray(mentah)) return res.status(400).json({ pesan: "Susunan navigasi tidak dikenali." });
    if (mentah.length < 2) return res.status(400).json({ pesan: "Navigasi bawah minimal dua menu." });
    if (mentah.length > MAKS_NAV) return res.status(400).json({ pesan: `Navigasi bawah maksimal ${MAKS_NAV} menu.` });

    const rapi = [];
    const dipakai = new Set();
    for (const n of mentah) {
      const halaman = String((n && n.halaman) ?? "");
      if (!KUNCI_HALAMAN.has(halaman)) return res.status(400).json({ pesan: "Ada menu navigasi yang belum dipilih halamannya." });
      if (dipakai.has(halaman)) return res.status(400).json({ pesan: "Satu halaman hanya boleh muncul sekali di navigasi bawah." });
      dipakai.add(halaman);
      const label = rapikan(n.label, 40);
      if (!label) return res.status(400).json({ pesan: "Nama menu navigasi tidak boleh kosong." });
      rapi.push({ halaman, label, ikon: rapikan(n.ikon, 40) || "circle", aktif: n.aktif !== false });
    }
    if (rapi.filter((n) => n.aktif).length < 2) {
      return res.status(400).json({ pesan: "Minimal dua menu navigasi harus dalam keadaan tampil." });
    }

    await kirim(res, () => tulisPengaturan("navigasi_bawah", rapi, "Susunan navigasi bawah"));
  });

  /* ---------------------------- tautan sosial ---------------------------- */

  app.post("/api/admin/sosial", async (req, res) => {
    const b = req.body || {};
    const nama = rapikan(b.nama, BATAS_PENDEK);
    const url = rapikan(b.url, BATAS_URL);
    if (!nama) return res.status(400).json({ pesan: "Nama media sosial tidak boleh kosong." });
    if (!url) return res.status(400).json({ pesan: "Alamat tautan tidak boleh kosong." });

    await kirim(res, async () => {
      const jumlah = (await tanya("select count(*)::int as n from tautan_sosial")).rows[0].n;
      await tanya("insert into tautan_sosial (id, urutan, nama, url, ikon, aktif) values ($1, $2, $3, $4, $5, $6)", [
        kodeBaru("ts"),
        jumlah + 1,
        nama,
        url,
        rapikan(b.ikon, 40) || "circle",
        b.aktif !== false,
      ]);
    });
  });

  app.put("/api/admin/sosial/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];

    for (const kolom of ["nama", "url", "ikon"]) {
      if (kolom in b) {
        const isi = rapikan(b[kolom], kolom === "url" ? BATAS_URL : BATAS_PENDEK);
        if (!isi) return res.status(400).json({ pesan: `Isian ${kolom} tidak boleh kosong.` });
        nilai.push(isi);
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
      const hasil = await tanya(`update tautan_sosial set ${setel.join(", ")} where id = $${nilai.length} returning id`, nilai);
      if (hasil.rowCount === 0) {
        const e = new Error("Tautan tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/sosial/:id", async (req, res) => {
    await kirim(res, async () => {
      const hasil = await tanya("delete from tautan_sosial where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Tautan tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.post("/api/admin/sosial-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, 20) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirim(res, async () => {
      for (let i = 0; i < daftar.length; i += 1) {
        await tanya("update tautan_sosial set urutan = $1 where id = $2", [i + 1, daftar[i]]);
      }
    });
  });
};
