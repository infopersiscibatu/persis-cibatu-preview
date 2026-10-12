const { istilahUntukJenjang } = require("./lib/istilah");
/**
 * Rute panel admin: identitas lembaga, profil, layanan jamaah, dan susunan pengurus.
 * Hanya menyentuh kunci pengaturan, kolom profil, dan tabel pengurus yang diizinkan.
 */

const BATAS_PENDEK = 200;
const BATAS_TEKS = 5000;
const KUNCI_IDENTITAS = ["pimpinan", "nama", "namaLengkap", "wilayah", "wilayahLengkap"];
const KUNCI_LAYANAN = ["alamat", "telepon", "whatsapp", "email", "jam"];
const KOLOM_PROFIL = ["motto", "visi", "periode", "gambar_url", "gambar_alt"];

/** Potong spasi berlebih dan batasi panjangnya. */
function rapikan(nilai, batas = BATAS_PENDEK) {
  if (nilai === null || nilai === undefined) return null;
  return String(nilai).replace(/\r\n/g, "\n").trim().slice(0, batas);
}

/** Daftar teks (untuk ringkasan profil & misi). */
function daftarTeks(nilai, maks = 40) {
  if (!Array.isArray(nilai)) return null;
  return nilai
    .map((t) => rapikan(t, BATAS_TEKS))
    .filter((t) => t && t.length > 0)
    .slice(0, maks);
}

function idPengurus() {
  return `pg-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const KUNCI_HALAMAN_JENJANG = ["judul", "pengantar", "gambar_url", "gambar_alt"];

/** Ubah nama jenjang menjadi alamat (slug) yang aman. */
function jadikanSlug(teks) {
  return String(teks || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

module.exports = function pasangRuteAdmin(app, { tanya }) {
  /** Seluruh data halaman profil (dipakai situs publik maupun borang admin). */
  const ambilProfil = async () => {
    const baris = (
      await tanya("select kunci, nilai from pengaturan where kunci = any($1)", [["identitas", "logo", "layanan_jamaah"]])
    ).rows;
    const map = Object.fromEntries(baris.map((r) => [r.kunci, r.nilai || {}]));
    const idn = map.identitas || {};
    const lyn = map.layanan_jamaah || {};
    const logo = map.logo || {};

    const prof =
      (await tanya("select gambar_url, gambar_alt, ringkasan, motto, periode, visi, misi from profil where id = 'utama'"))
        .rows[0] || {};

    const pengurus = (
      await tanya(
        "select id, nama, jabatan, bidang, periode, urutan from pengurus where aktif order by urutan nulls last, nama",
      )
    ).rows;

    return {
      identitas: {
        pimpinan: idn.pimpinan ?? null,
        nama: idn.nama ?? null,
        namaLengkap: idn.namaLengkap ?? null,
        wilayah: idn.wilayah ?? null,
        wilayahLengkap: idn.wilayahLengkap ?? null,
        logo: logo.url ?? null,
        logoAlt: logo.alt ?? null,
        alamat: lyn.alamat ?? null,
        telepon: lyn.telepon ?? null,
        whatsapp: lyn.whatsapp ?? null,
        email: lyn.email ?? null,
        jam: lyn.jam ?? null,
      },
      profil: {
        gambarUrl: prof.gambar_url ?? null,
        gambarAlt: prof.gambar_alt ?? null,
        ringkasan: prof.ringkasan ?? [],
        motto: prof.motto ?? null,
        periode: prof.periode ?? null,
        visi: prof.visi ?? null,
        misi: prof.misi ?? [],
      },
      pengurus: pengurus.map((p) => ({
        id: p.id,
        nama: p.nama,
        jabatan: p.jabatan,
        bidang: p.bidang,
        periode: p.periode,
        urutan: p.urutan,
      })),
    };
  };

  const simpanPengaturan = (kunci, nilai) =>
    tanya(
      `insert into pengaturan (kunci, nilai, kelompok, keterangan)
       values ($1, $2::jsonb, 'umum', '')
       on conflict (kunci) do update set nilai = pengaturan.nilai || excluded.nilai, diperbarui = now()`,
      [kunci, JSON.stringify(nilai)],
    );

  const kirim = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, ...(await ambilProfil()) });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  /* ------------------------------ publik ------------------------------ */

  app.get("/api/profil", async (_req, res) => {
    try {
      res.json({ ok: true, ...(await ambilProfil()) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ------------------------- identitas lembaga ------------------------- */

  app.put("/api/admin/identitas", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const k of KUNCI_IDENTITAS) if (k in b) nilai[k] = rapikan(b[k], BATAS_PENDEK);
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });
    if (nilai.namaLengkap !== undefined && !nilai.namaLengkap)
      return res.status(400).json({ pesan: "Nama lembaga tidak boleh kosong." });
    await kirim(res, () => simpanPengaturan("identitas", nilai));
  });

  app.put("/api/admin/logo", async (req, res) => {
    const b = req.body || {};
    const url = rapikan(b.url, 500);
    if (!url) return res.status(400).json({ pesan: "Alamat logo tidak boleh kosong." });
    await kirim(res, () => simpanPengaturan("logo", { url, alt: rapikan(b.alt, BATAS_PENDEK) ?? "Logo lembaga" }));
  });

  app.put("/api/admin/layanan", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const k of KUNCI_LAYANAN) if (k in b) nilai[k] = rapikan(b[k], BATAS_TEKS);
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });
    await kirim(res, () => simpanPengaturan("layanan_jamaah", nilai));
  });

  /* --------------------------- halaman profil --------------------------- */

  app.put("/api/admin/profil", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    for (const kolom of KOLOM_PROFIL) {
      if (kolom in b) {
        nilai.push(rapikan(b[kolom], BATAS_TEKS));
        setel.push(`${kolom} = $${nilai.length}`);
      }
    }
    if ("ringkasan" in b) {
      nilai.push(JSON.stringify(daftarTeks(b.ringkasan) ?? []));
      setel.push(`ringkasan = $${nilai.length}::jsonb`);
    }
    if ("misi" in b) {
      nilai.push(JSON.stringify(daftarTeks(b.misi) ?? []));
      setel.push(`misi = $${nilai.length}::jsonb`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirim(res, () =>
      tanya(
        `update profil set ${setel.join(", ")}, diperbarui = now() where id = 'utama'`,
        nilai,
      ),
    );
  });

  /* ------------------------- jenjang pendidikan ------------------------- */

  const ambilJenjang = async () => {
    const halaman = (
      await tanya("select nilai from pengaturan where kunci = 'halaman_jenjang'")
    ).rows[0]?.nilai || {};

    const baris = (
      await tanya(
        `select j.id, j.slug, j.singkatan, j.nama, j.tagline, j.rentang, j.jumlah, j.satuan, j.lokasi,
                j.tone, j.gambar_url, j.urutan, j.hitung_jenjang,
                (select count(*)::int from unit_pendidikan u where u.jenjang_id = j.id) as jumlah_unit,
                (select count(*)::int from santri s
                  where s.jenjang_id = j.id and s.status in ('aktif','calon')) as peserta
           from jenjang j
          where j.aktif
          order by j.urutan nulls last, j.nama`,
      )
    ).rows;

    /* Unit pendidikan (sekolah/madrasah/kampus) beserta program jurusannya. */
    const unit = (
      await tanya(
        `select u.id, u.jenjang_id, j.slug as jenjang_slug, u.slug, u.nomor, u.nama, u.daerah, u.alamat, u.pimpinan,
                u.rombel, u.guru, u.staf, u.akreditasi, u.status, u.kontak, u.email, u.npsn,
                u.berdiri, u.jam, u.gambar_url, u.jurusan, u.ekstrakurikuler, u.fasilitas, u.aktif,
                (select count(*)::int from santri s
                  where s.unit_id = u.id and s.status in ('aktif','calon')) as peserta,
                (select count(*)::int from santri s where s.unit_id = u.id and s.status = 'lulus') as alumni
           from unit_pendidikan u
           join jenjang j on j.id = u.jenjang_id
          order by j.urutan nulls last, u.nomor nulls last, u.nama`,
      )
    ).rows;

    const jurusan = (
      await tanya(
        `select p.id, p.jenjang_id, j.slug as jenjang_slug, p.slug, p.singkatan, p.nama, p.intro, p.fokus, p.ukt,
                p.gambar_url, p.urutan, p.aktif
           from jurusan p
           join jenjang j on j.id = p.jenjang_id
          order by j.urutan nulls last, p.urutan nulls last, p.nama`,
      )
    ).rows;

    return {
      halaman: {
        judul: halaman.judul ?? null,
        pengantar: halaman.pengantar ?? null,
        gambarUrl: halaman.gambar_url ?? null,
        gambarAlt: halaman.gambar_alt ?? null,
      },
      jenjang: baris.map((j) => ({
        id: j.id,
        slug: j.slug,
        singkatan: j.singkatan,
        nama: j.nama,
        tagline: j.tagline,
        rentang: j.rentang,
        jumlah: j.jumlah,
        satuan: j.satuan,
        lokasi: j.lokasi,
        tone: j.tone,
        gambarUrl: j.gambar_url,
        urutan: j.urutan,
        hitungJenjang: j.hitung_jenjang,
        jumlahUnit: j.jumlah_unit,
        jumlahPeserta: j.peserta,
        /* Kosa kata penyebutan untuk jenjang ini (mahasiswa/kampus/UKT bila perguruan tinggi). */
        istilah: istilahUntukJenjang(j),
      })),
      unit: unit.map((u) => ({
        id: u.id,
        jenjangId: u.jenjang_id,
        jenjangSlug: u.jenjang_slug,
        slug: u.slug,
        nomor: u.nomor,
        nama: u.nama,
        daerah: u.daerah,
        alamat: u.alamat,
        pimpinan: u.pimpinan,
        jumlahPeserta: u.peserta,
        jumlahAlumni: u.alumni,
        rombel: u.rombel,
        guru: u.guru,
        staf: u.staf,
        akreditasi: u.akreditasi,
        status: u.status,
        kontak: u.kontak,
        email: u.email,
        npsn: u.npsn,
        berdiri: u.berdiri,
        jam: u.jam,
        gambarUrl: u.gambar_url,
        jurusan: Array.isArray(u.jurusan) ? u.jurusan : [],
        ekstrakurikuler: Array.isArray(u.ekstrakurikuler) ? u.ekstrakurikuler : [],
        fasilitas: Array.isArray(u.fasilitas) ? u.fasilitas : [],
        aktif: u.aktif,
      })),
      jurusan: jurusan.map((p) => ({
        id: p.id,
        jenjangId: p.jenjang_id,
        jenjangSlug: p.jenjang_slug,
        slug: p.slug,
        singkatan: p.singkatan,
        nama: p.nama,
        intro: p.intro,
        fokus: Array.isArray(p.fokus) ? p.fokus : [],
        ukt: p.ukt,
        gambarUrl: p.gambar_url,
        urutan: p.urutan,
        aktif: p.aktif,
      })),
    };
  };

  const kirimJenjang = async (res, kerja) => {
    try {
      await kerja();
      res.json({ ok: true, ...(await ambilJenjang()) });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  };

  app.get("/api/jenjang", async (_req, res) => {
    try {
      res.json({ ok: true, ...(await ambilJenjang()) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/admin/jenjang-halaman", async (req, res) => {
    const b = req.body || {};
    const nilai = {};
    for (const k of KUNCI_HALAMAN_JENJANG) if (k in b) nilai[k] = rapikan(b[k], BATAS_TEKS);
    if (Object.keys(nilai).length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });
    await kirimJenjang(res, () => simpanPengaturan("halaman_jenjang", nilai));
  });

  app.post("/api/admin/jenjang", async (req, res) => {
    const b = req.body || {};
    const nama = rapikan(b.nama, BATAS_PENDEK);
    const singkatan = rapikan(b.singkatan, 20);
    const tagline = rapikan(b.tagline, BATAS_PENDEK);
    if (!nama) return res.status(400).json({ pesan: "Nama jenjang tidak boleh kosong." });

    await kirimJenjang(res, async () => {
      let slug = jadikanSlug(singkatan || nama);
      if (!slug) slug = `jenjang-${Date.now().toString(36)}`;
      const ada = (await tanya("select 1 from jenjang where slug = $1", [slug])).rowCount > 0;
      if (ada) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
      const urutan =
        (await tanya("select coalesce(max(urutan), 0)::int + 1 as berikutnya from jenjang")).rows[0].berikutnya ?? 1;
      await tanya(
        `insert into jenjang (id, slug, singkatan, nama, tagline, rentang, pimpinan_label, jumlah, satuan, lokasi,
                              tone, intro, fasilitas, istilah, urutan, hitung_jenjang, aktif)
         values ($1, $2, $3, $4, $5, '', '', '0', 'siswa', '', 'mint', '', '[]'::jsonb, $6::jsonb, $7, true, true)`,
        [
          `jg-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
          slug,
          singkatan || nama.slice(0, 6).toUpperCase(),
          nama,
          tagline ?? "",
          JSON.stringify({ unit: "unit", santri: "siswa", pendidik: "pendidik", rombel: "rombongan belajar" }),
          urutan,
        ],
      );
    });
  });

  app.put("/api/admin/jenjang/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    if ("nama" in b) {
      const nama = rapikan(b.nama, BATAS_PENDEK);
      if (!nama) return res.status(400).json({ pesan: "Nama jenjang tidak boleh kosong." });
      nilai.push(nama);
      setel.push(`nama = $${nilai.length}`);
    }
    if ("singkatan" in b) {
      nilai.push(rapikan(b.singkatan, 20));
      setel.push(`singkatan = $${nilai.length}`);
    }
    if ("tagline" in b) {
      nilai.push(rapikan(b.tagline, BATAS_PENDEK));
      setel.push(`tagline = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimJenjang(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update jenjang set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Jenjang tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  /** Hapus hanya bila belum dipakai, karena relasinya berantai (cascade). */
  app.delete("/api/admin/jenjang/:id", async (req, res) => {
    await kirimJenjang(res, async () => {
      const pakai = (
        await tanya(
          `select (select count(*)::int from unit_pendidikan where jenjang_id = $1) as unit,
                  (select count(*)::int from jurusan where jenjang_id = $1) as jurusan,
                  (select count(*)::int from mata_pelajaran where jenjang_id = $1) as mapel,
                  (select count(*)::int from santri where jenjang_id = $1) as santri`,
          [req.params.id],
        )
      ).rows[0];
      if (pakai.unit > 0 || pakai.jurusan > 0 || pakai.mapel > 0 || pakai.santri > 0) {
        const e = new Error(
          `Jenjang ini masih dipakai (${pakai.unit} unit, ${pakai.jurusan} jurusan, ${pakai.mapel} mata pelajaran, ${pakai.santri} santri). Pindahkan atau hapus datanya lebih dahulu.`,
        );
        e.status = 400;
        throw e;
      }
      const hasil = await tanya("delete from jenjang where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Jenjang tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.post("/api/admin/jenjang-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, 100) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirimJenjang(res, async () => {
      for (let i = 0; i < daftar.length; i += 1) {
        await tanya("update jenjang set urutan = $1, diperbarui = now() where id = $2", [i + 1, daftar[i]]);
      }
    });
  });

  /* ------------------------------ sekolah ------------------------------ */

  /** Angka bulat dari isian teks; kosong berarti null. */
  const angka = (nilai, maks = 100000) => {
    if (nilai === null || nilai === undefined || nilai === "") return null;
    const n = Math.round(Number(String(nilai).replace(/[^0-9]/g, "")));
    if (!Number.isFinite(n)) return null;
    return Math.min(n, maks);
  };

  /** Daftar teks pendek (fasilitas, ekstrakurikuler). */
  const daftarPendek = (nilai, maks = 30) =>
    nilai
      .map((t) => rapikan(t, BATAS_PENDEK))
      .filter((t) => t && t.length > 0)
      .slice(0, maks);

  /** Cari jenjang dari id atau slug yang dikirim borang. */
  const jenjangDariKode = async (b) => {
    const kode = rapikan((b || {}).jenjangId || (b || {}).jenjang_id || (b || {}).jenjangSlug || (b || {}).jenjang_slug, 60);
    if (!kode) return null;
    const { rows } = await tanya("select id, slug from jenjang where id = $1 or slug = $1 limit 1", [kode]);
    return rows[0] || null;
  };

  const KOLOM_SEKOLAH_JSON = new Set(["jurusan", "ekstrakurikuler", "fasilitas"]);

  /** Baca isian borang sekolah; hanya kolom yang dikirim yang dipakai. */
  const bacaSekolah = (b) => {
    const isi = {};
    const teks = ["nama", "nomor", "daerah", "alamat", "pimpinan", "kontak", "email", "npsn", "jam", "akreditasi", "status", "gambar_url"];
    for (const kolom of teks) {
      if (kolom in b) isi[kolom] = rapikan(b[kolom], kolom === "alamat" || kolom === "gambar_url" ? BATAS_TEKS : BATAS_PENDEK);
    }
    /* Jumlah peserta didik tidak diisi manual: dihitung dari data santri. */
    for (const kolom of ["rombel", "guru", "staf", "berdiri"]) {
      if (kolom in b) isi[kolom] = angka(b[kolom]);
    }
    if (Array.isArray(b.jurusan)) isi.jurusan = b.jurusan.map((x) => rapikan(x, 60)).filter(Boolean).slice(0, 20);
    if (Array.isArray(b.ekstrakurikuler)) isi.ekstrakurikuler = daftarPendek(b.ekstrakurikuler);
    if (Array.isArray(b.fasilitas)) isi.fasilitas = daftarPendek(b.fasilitas);
    if ("aktif" in b) isi.aktif = !!b.aktif;
    return isi;
  };

  /** Sisakan hanya jurusan yang memang terdaftar pada jenjang itu. */
  const sahkanJurusan = async (jenjangId, daftar) => {
    const ada = (await tanya("select slug from jurusan where jenjang_id = $1", [jenjangId])).rows.map((r) => r.slug);
    return daftar.filter((x) => ada.includes(x));
  };

  const KUNCI_SEKOLAH_ISI = [
    "nama",
    "nomor",
    "daerah",
    "alamat",
    "pimpinan",
    "gambar_url",
    "rombel",
    "guru",
    "staf",
    "akreditasi",
    "status",
    "kontak",
    "email",
    "npsn",
    "berdiri",
    "jam",
    "jurusan",
    "ekstrakurikuler",
    "fasilitas",
    "aktif",
  ];

  app.post("/api/admin/sekolah", async (req, res) => {
    const b = req.body || {};
    const isi = bacaSekolah(b);
    if (!isi.nama) return res.status(400).json({ pesan: "Nama sekolah tidak boleh kosong." });

    await kirimJenjang(res, async () => {
      const jj = await jenjangDariKode(b);
      if (!jj) {
        const e = new Error("Jenjang pendidikan belum dipilih atau tidak ditemukan.");
        e.status = 400;
        throw e;
      }
      let slug = jadikanSlug(isi.nama);
      if (!slug) slug = `sekolah-${Date.now().toString(36)}`;
      if ((await tanya("select 1 from unit_pendidikan where slug = $1", [slug])).rowCount > 0) {
        slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
      }
      const nomor = rapikan(b.nomor, 20);
      const jurusan = await sahkanJurusan(jj.id, Array.isArray(isi.jurusan) ? isi.jurusan : []);
      const kolom = {
        id: `sk-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
        jenjang_id: jj.id,
        slug,
        nomor,
        nama: isi.nama,
        daerah: isi.daerah ?? null,
        alamat: isi.alamat ?? null,
        pimpinan: isi.pimpinan ?? null,
        rombel: isi.rombel ?? 0,
        guru: isi.guru ?? 0,
        staf: isi.staf ?? 0,
        akreditasi: isi.akreditasi ?? null,
        status: isi.status ?? "Swasta",
        kontak: isi.kontak ?? null,
        email: isi.email ?? null,
        npsn: isi.npsn ?? null,
        berdiri: isi.berdiri ?? null,
        jam: isi.jam ?? null,
        gambar_url: isi.gambar_url ?? null,
        jurusan: JSON.stringify(jurusan),
        ekstrakurikuler: JSON.stringify(isi.ekstrakurikuler ?? []),
        fasilitas: JSON.stringify(isi.fasilitas ?? []),
        aktif: isi.aktif === false ? false : true,
      };

      await tanya(
        `insert into unit_pendidikan (id, jenjang_id, slug, nomor, nama, daerah, alamat, pimpinan,
                                      rombel, guru, staf, akreditasi, status, kontak, email, npsn, berdiri, jam, gambar_url,
                                      jurusan, ekstrakurikuler, fasilitas, aktif)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
                 $20::jsonb, $21::jsonb, $22::jsonb, $23)`,
        [
          kolom.id,
          kolom.jenjang_id,
          kolom.slug,
          kolom.nomor,
          kolom.nama,
          kolom.daerah,
          kolom.alamat,
          kolom.pimpinan,
          kolom.rombel,
          kolom.guru,
          kolom.staf,
          kolom.akreditasi,
          kolom.status,
          kolom.kontak,
          kolom.email,
          kolom.npsn,
          kolom.berdiri,
          kolom.jam,
          kolom.gambar_url,
          kolom.jurusan,
          kolom.ekstrakurikuler,
          kolom.fasilitas,
          kolom.aktif,
        ],
      );
    });
  });

  app.put("/api/admin/sekolah/:id", async (req, res) => {
    const b = req.body || {};
    const isi = bacaSekolah(b);
    if ("nama" in isi && !isi.nama) return res.status(400).json({ pesan: "Nama sekolah tidak boleh kosong." });

    await kirimJenjang(res, async () => {
      const setel = [];
      const nilai = [];
      const tambah = (kolom, v) => {
        nilai.push(KOLOM_SEKOLAH_JSON.has(kolom) ? JSON.stringify(v) : v);
        setel.push(`${kolom} = $${nilai.length}${KOLOM_SEKOLAH_JSON.has(kolom) ? "::jsonb" : ""}`);
      };

      const gantiJenjang = "jenjangId" in b || "jenjang_id" in b || "jenjangSlug" in b || "jenjang_slug" in b;
      let jenjangId = null;
      if (gantiJenjang) {
        const jj = await jenjangDariKode(b);
        if (!jj) {
          const e = new Error("Jenjang pendidikan tidak ditemukan.");
          e.status = 400;
          throw e;
        }
        jenjangId = jj.id;
        tambah("jenjang_id", jj.id);
      }

      for (const kolom of KUNCI_SEKOLAH_ISI) {
        if (!(kolom in isi)) continue;
        if (kolom === "nama" && !isi.nama) continue;
        if (kolom === "jurusan") {
          /* Pilihan jurusan harus milik jenjang sekolah ini. */
          const idJenjang =
            jenjangId ||
            (
              await tanya("select jenjang_id from unit_pendidikan where id = $1", [req.params.id])
            ).rows[0]?.jenjang_id;
          tambah("jurusan", await sahkanJurusan(idJenjang, isi.jurusan));
          continue;
        }
        tambah(kolom, isi[kolom]);
      }
      /* Pindah jenjang tanpa memilih jurusan baru: kosongkan jurusan lama. */
      if (jenjangId && !("jurusan" in isi)) tambah("jurusan", []);

      if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

      nilai.push(req.params.id);
      const hasil = await tanya(
        `update unit_pendidikan set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Sekolah tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/sekolah/:id", async (req, res) => {
    await kirimJenjang(res, async () => {
      const hasil = await tanya("delete from unit_pendidikan where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Sekolah tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  /* --------------------------- program jurusan --------------------------- */

  app.post("/api/admin/jurusan", async (req, res) => {
    const b = req.body || {};
    const nama = rapikan(b.nama, BATAS_PENDEK);
    if (!nama) return res.status(400).json({ pesan: "Nama program jurusan tidak boleh kosong." });

    await kirimJenjang(res, async () => {
      const jj = await jenjangDariKode(b);
      if (!jj) {
        const e = new Error("Jenjang pendidikan belum dipilih atau tidak ditemukan.");
        e.status = 400;
        throw e;
      }
      let slug = jadikanSlug(rapikan(b.singkatan, 20) || nama);
      if (!slug) slug = `jurusan-${Date.now().toString(36)}`;
      if ((await tanya("select 1 from jurusan where jenjang_id = $1 and slug = $2", [jj.id, slug])).rowCount > 0) {
        slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
      }
      const urutan =
        (await tanya("select coalesce(max(urutan), 0)::int + 1 as n from jurusan where jenjang_id = $1", [jj.id])).rows[0]
          .n ?? 1;
      await tanya(
        `insert into jurusan (id, jenjang_id, slug, singkatan, nama, intro, keterangan, fokus, gambar_url, urutan, aktif)
         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, null, $9, true)`,
        [
          `ju-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
          jj.id,
          slug,
          rapikan(b.singkatan, 20) || nama.slice(0, 4).toUpperCase(),
          nama,
          rapikan(b.intro, BATAS_TEKS),
          rapikan(b.keterangan, BATAS_PENDEK),
          JSON.stringify(Array.isArray(b.fokus) ? daftarPendek(b.fokus) : []),
          urutan,
        ],
      );
    });
  });

  app.put("/api/admin/jurusan/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    if ("nama" in b) {
      const nama = rapikan(b.nama, BATAS_PENDEK);
      if (!nama) return res.status(400).json({ pesan: "Nama program jurusan tidak boleh kosong." });
      nilai.push(nama);
      setel.push(`nama = $${nilai.length}`);
    }
    if ("singkatan" in b) {
      nilai.push(rapikan(b.singkatan, 20));
      setel.push(`singkatan = $${nilai.length}`);
    }
    if ("intro" in b) {
      nilai.push(rapikan(b.intro, BATAS_TEKS));
      setel.push(`intro = $${nilai.length}`);
    }
    if ("keterangan" in b) {
      nilai.push(rapikan(b.keterangan, BATAS_PENDEK));
      setel.push(`keterangan = $${nilai.length}`);
    }
    if ("ukt" in b) {
      nilai.push(rapikan(b.ukt, 40));
      setel.push(`ukt = $${nilai.length}`);
    }
    if (Array.isArray(b.fokus)) {
      nilai.push(JSON.stringify(daftarPendek(b.fokus, 20)));
      setel.push(`fokus = $${nilai.length}::jsonb`);
    }
    if ("aktif" in b) {
      nilai.push(!!b.aktif);
      setel.push(`aktif = $${nilai.length}`);
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirimJenjang(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update jurusan set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Program jurusan tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  /** Jurusan tidak bisa dihapus bila masih dipilih oleh sebuah sekolah. */
  app.delete("/api/admin/jurusan/:id", async (req, res) => {
    await kirimJenjang(res, async () => {
      const baris = (await tanya("select slug, nama from jurusan where id = $1", [req.params.id])).rows[0];
      if (!baris) {
        const e = new Error("Program jurusan tidak ditemukan.");
        e.status = 404;
        throw e;
      }
      const pakai = (
        await tanya("select count(*)::int as n from unit_pendidikan where jurusan @> $1::jsonb", [
          JSON.stringify([baris.slug]),
        ])
      ).rows[0].n;
      if (pakai > 0) {
        const e = new Error(
          `Program jurusan ${baris.nama} masih dipilih oleh ${pakai} sekolah. Lepaskan pilihannya lebih dahulu pada menu Nama Sekolah.`,
        );
        e.status = 400;
        throw e;
      }
      await tanya("delete from jurusan where id = $1", [req.params.id]);
    });
  });

  /* --------------------------- susunan pengurus --------------------------- */

  app.post("/api/admin/pengurus", async (req, res) => {
    const b = req.body || {};
    const nama = rapikan(b.nama, BATAS_PENDEK);
    const jabatan = rapikan(b.jabatan, BATAS_PENDEK);
    if (!nama) return res.status(400).json({ pesan: "Nama pengurus tidak boleh kosong." });
    if (!jabatan) return res.status(400).json({ pesan: "Jabatan pengurus tidak boleh kosong." });

    await kirim(res, async () => {
      const urutan =
        (await tanya("select coalesce(max(urutan), 0)::int + 1 as berikutnya from pengurus")).rows[0].berikutnya ?? 1;
      await tanya(
        `insert into pengurus (id, urutan, nama, jabatan, bidang, periode, aktif)
         values ($1, $2, $3, $4, $5, $6, true)`,
        [idPengurus(), urutan, nama, jabatan, rapikan(b.bidang, BATAS_PENDEK), rapikan(b.periode, BATAS_PENDEK)],
      );
    });
  });

  app.put("/api/admin/pengurus/:id", async (req, res) => {
    const b = req.body || {};
    const setel = [];
    const nilai = [];
    for (const kolom of ["nama", "jabatan", "bidang", "periode"]) {
      if (kolom in b) {
        nilai.push(rapikan(b[kolom], BATAS_PENDEK));
        setel.push(`${kolom} = $${nilai.length}`);
      }
    }
    if (setel.length === 0) return res.status(400).json({ pesan: "Tidak ada perubahan yang dikirim." });

    await kirim(res, async () => {
      nilai.push(req.params.id);
      const hasil = await tanya(
        `update pengurus set ${setel.join(", ")}, diperbarui = now() where id = $${nilai.length} returning id`,
        nilai,
      );
      if (hasil.rowCount === 0) {
        const e = new Error("Pengurus tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  app.delete("/api/admin/pengurus/:id", async (req, res) => {
    await kirim(res, async () => {
      const hasil = await tanya("delete from pengurus where id = $1 returning id", [req.params.id]);
      if (hasil.rowCount === 0) {
        const e = new Error("Pengurus tidak ditemukan.");
        e.status = 404;
        throw e;
      }
    });
  });

  /** Menyusun ulang urutan pengurus sesuai daftar id yang dikirim. */
  app.post("/api/admin/pengurus-urut", async (req, res) => {
    const daftar = Array.isArray((req.body || {}).urut) ? req.body.urut.map(String).slice(0, 200) : null;
    if (!daftar) return res.status(400).json({ pesan: "Daftar urutan tidak dikenali." });
    await kirim(res, async () => {
      for (let i = 0; i < daftar.length; i += 1) {
        await tanya("update pengurus set urutan = $1, diperbarui = now() where id = $2", [i + 1, daftar[i]]);
      }
    });
  });
};
