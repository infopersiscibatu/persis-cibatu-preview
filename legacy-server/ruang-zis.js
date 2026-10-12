/**
 * Halaman Admin ZIS (donasi, infak, dan wakaf).
 *
 * Rutenya berada di bawah /api/unit sehingga dijaga oleh sesi halaman unit: hanya
 * sesi yang masuk memakai PIN Admin ZIS (`kode = 'zis'`) yang boleh membaca datanya.
 *
 * Isi halaman:
 *   - Statistik: jumlah donasi, program, donatur, dan penyaluran (dihitung dari database)
 *   - Verifikasi donasi: donasi yang masuk lewat formulir situs diperiksa di sini.
 *     Setelah diverifikasi, dana otomatis masuk ke program terkait dan teks verifikasi
 *     disiapkan untuk dikirim ke WhatsApp donatur.
 */

const NAMA_LEMBAGA_BAWAAN = "PC PERSIS Cibatu";

/** Nomor donasi yang mudah dibaca petugas: 1 → DN-0001. */
const nomorDonasi = (id) => `DN-${String(id ?? 0).padStart(4, "0")}`;

/** 0812-3456-7890 / +62 812 3456 7890 → 6281234567890 */
function nomorWhatsApp(telepon) {
  const digit = String(telepon ?? "").replace(/\D/g, "");
  if (digit.length < 9) return "";
  if (digit.startsWith("62")) return digit;
  if (digit.startsWith("0")) return `62${digit.slice(1)}`;
  if (digit.startsWith("8")) return `62${digit}`;
  return digit;
}

const tautanWhatsApp = (telepon, teks) => {
  const nomor = nomorWhatsApp(telepon);
  return nomor ? `https://wa.me/${nomor}?text=${encodeURIComponent(teks)}` : null;
};

/** Rupiah tanpa spasi, sama seperti yang tampil di situs: Rp1.500.000 */
const rupiah = (n) => `Rp${Number(n ?? 0).toLocaleString("id-ID")}`;

const tanggalIndonesia = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

function pasangRuteZis(app, { tanya }) {
  const angka = (nilai) => Number(nilai ?? 0);

  const rapikan = (nilai, batas) =>
    typeof nilai === "string"
      ? nilai.trim().slice(0, batas)
      : nilai === undefined || nilai === null
        ? ""
        : String(nilai).trim().slice(0, batas);

  const sekarangKe = (nilai) => nilai || new Date().toISOString().slice(0, 10);

  /** id baru untuk baris ZIS: dn-…, dk-…, rw-…, dntr-… */
  const idBaru = (awalan) => `${awalan}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  /** Alamat halaman program dari namanya: "Beasiswa Santri" → beasiswa-santri */
  const slugDari = (teks) =>
    String(teks ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "program-donasi";

  /** Daftar rincian penggunaan dana: [{ item, jumlah }] */
  const rapikanRincian = (nilai) => {
    if (!Array.isArray(nilai)) return [];
    return nilai
      .map((r) => ({ item: rapikan(r?.item, 160), jumlah: Math.max(0, Math.round(angka(r?.jumlah))) }))
      .filter((r) => r.item || r.jumlah > 0)
      .slice(0, 15);
  };

  /** Isi program: satu paragraf per baris daftar. */
  const rapikanIsi = (nilai) => {
    if (!Array.isArray(nilai)) return [];
    return nilai.map((t) => rapikan(t, 1500)).filter(Boolean).slice(0, 20);
  };

  const teleponRapi = (nilai) => rapikan(nilai, 30).replace(/[^\d+\-\s()]/g, "");

  /** Hanya sesi Admin ZIS yang boleh melihat data ZIS. */
  const wajibZis = (req, res) => {
    if (!req.unit || req.unit.kode !== "zis") {
      res.status(403).json({ pesan: "Halaman ini hanya untuk Admin ZIS. Masuk memakai PIN Admin ZIS." });
      return false;
    }
    return true;
  };

  const namaLembaga = async () => {
    const baris = (await tanya("select nilai from pengaturan where kunci = 'identitas'")).rows[0];
    const nama = String(baris?.nilai?.namaLengkap ?? "").trim();
    return nama || NAMA_LEMBAGA_BAWAAN;
  };

  /** Teks verifikasi yang dikirim ke WhatsApp donatur. */
  const pesanVerifikasi = (d, lembaga) =>
    [
      "Assalamu'alaikum warahmatullahi wabarakatuh,",
      "",
      `${d.anonim ? "Bapak/Ibu" : `Bapak/Ibu ${d.nama}`},`,
      "",
      `Alhamdulillah, donasi Anda sudah kami terima dan verifikasi.`,
      "",
      `Program   : ${d.program}`,
      `Nominal   : ${rupiah(d.jumlah)}`,
      `No. donasi: ${d.nomor}`,
      `Tanggal   : ${tanggalIndonesia(d.dibuat)}`,
      "",
      "Jazakumullahu khairan katsiran atas kebaikannya. Semoga Allah Subhanahu wa Ta'ala membalas dengan keberkahan yang berlipat, dan menyalurkannya melalui program tersebut sesuai amanahnya.",
      "",
      "Untuk pertanyaan, silakan balas pesan ini.",
      "",
      `Barakallahu fiikum,`,
      lembaga,
    ].join("\n");

  /* ------------------------------- statistik ------------------------------- */

  const ambilStatistik = async () => {
    const { rows } = await tanya(
      `select
         (select count(*)::int from donasi_program)                                     as program_total,
         (select count(*)::int from donasi_program where aktif)                         as program_aktif,
         (select coalesce(sum(terkumpul), 0) from donasi_program)                       as donasi_total,
         (select coalesce(sum(jumlah_donatur), 0)::int from donasi_program)             as donatur_program,
         (select count(distinct lower(trim(nama)))::int from donasi_donatur
           where trim(coalesce(nama, '')) <> '')                                        as donatur_tercatat,
         (select coalesce(sum(nominal), 0) from donasi_riwayat where jenis = 'penyaluran') as penyaluran_total,
         (select count(*)::int from donasi_riwayat where jenis = 'penyaluran')             as penyaluran_jumlah,
         (select max(tanggal) from donasi_riwayat where jenis = 'penyaluran')             as penyaluran_terakhir,
         (select coalesce(sum(jumlah), 0) from donasi where status = 'dikonfirmasi')    as donasi_masuk,
         (select count(*)::int from donasi where status = 'menunggu')                   as donasi_menunggu`,
    );
    const b = rows[0] ?? {};

    return {
      donasi: {
        /** Total nominal dana yang sudah terkumpul dari seluruh program. */
        total: angka(b.donasi_total),
        /** Donasi yang masuk lewat formulir situs dan sudah dikonfirmasi. */
        masuk: angka(b.donasi_masuk),
        /** Donasi lewat formulir yang belum diperiksa petugas. */
        menunggu: angka(b.donasi_menunggu),
      },
      program: {
        total: angka(b.program_total),
        aktif: angka(b.program_aktif),
      },
      donatur: {
        /** Jumlah donatur tercatat pada semua program (angka yang tampil di situs). */
        total: angka(b.donatur_program),
        /** Nama donatur berbeda yang tersimpan pada daftar donatur program. */
        tercatat: angka(b.donatur_tercatat),
      },
      penyaluran: {
        total: angka(b.penyaluran_total),
        jumlah: angka(b.penyaluran_jumlah),
        terakhir: b.penyaluran_terakhir ? new Date(b.penyaluran_terakhir).toISOString().slice(0, 10) : null,
      },
    };
  };

  /* -------------------------------- donasi --------------------------------- */

  const KOLOM_DONASI = `
    select d.id, d.nama, d.telepon, d.jumlah, d.metode, d.pesan, d.anonim, d.status,
           d.dibuat, d.diperbarui, m.url as bukti_url,
           p.judul as program_judul, p.slug as program_slug
      from donasi d
      left join donasi_program p on p.id = d.program_id
      left join media m on m.id = d.bukti_media_id`;

  const barisDonasi = (d, lembaga) => {
    const hasil = {
      id: Number(d.id),
      nomor: nomorDonasi(d.id),
      nama: d.nama ?? "Hamba Allah",
      anonim: d.anonim === true,
      telepon: d.telepon ?? "",
      adaTelepon: nomorWhatsApp(d.telepon) !== "",
      jumlah: angka(d.jumlah),
      metode: d.metode ?? "",
      pesan: d.pesan ?? "",
      buktiUrl: d.bukti_url ?? null,
      program: d.program_judul ?? "",
      programSlug: d.program_slug ?? "",
      status: d.status,
      dibuat: d.dibuat,
      diperbarui: d.diperbarui,
    };
    /* Teks verifikasi hanya disiapkan untuk donasi yang sudah dikonfirmasi. */
    if (d.status === "dikonfirmasi") {
      const teks = pesanVerifikasi(hasil, lembaga);
      hasil.pesanWhatsApp = teks;
      hasil.tautanWhatsApp = tautanWhatsApp(d.telepon, teks);
    } else {
      hasil.pesanWhatsApp = "";
      hasil.tautanWhatsApp = null;
    }
    return hasil;
  };

  const ambilDaftarDonasi = async () => {
    const lembaga = await namaLembaga();
    const perlu = (
      await tanya(`${KOLOM_DONASI} where d.status = 'menunggu' order by d.dibuat desc, d.id desc limit 60`)
    ).rows.map((d) => barisDonasi(d, lembaga));
    const diverifikasi = (
      await tanya(`${KOLOM_DONASI} where d.status = 'dikonfirmasi' order by d.diperbarui desc, d.id desc limit 60`)
    ).rows.map((d) => barisDonasi(d, lembaga));
    const ditolak = (await tanya("select count(*)::int as n from donasi where status = 'ditolak'")).rows[0]?.n ?? 0;

    return {
      perlu,
      diverifikasi,
      ditolak: angka(ditolak),
      lembaga,
    };
  };

  const ambilSatu = async (id) =>
    (await tanya(`${KOLOM_DONASI} where d.id = $1`, [id])).rows[0] ?? null;

  /* ------------------------------- rute ZIS -------------------------------- */

  app.get("/api/unit/zis/statistik", async (req, res) => {
    if (!wajibZis(req, res)) return;
    try {
      res.json({ ok: true, statistik: await ambilStatistik() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.get("/api/unit/zis/donasi", async (req, res) => {
    if (!wajibZis(req, res)) return;
    try {
      const daftar = await ambilDaftarDonasi();
      res.json({ ok: true, ...daftar });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /**
   * Verifikasi donasi: statusnya menjadi 'dikonfirmasi', dana masuk ke program
   * terkait (terkumpul dan jumlah donatur bertambah), donaturnya tercatat pada
   * daftar donatur program, lalu teks verifikasi WhatsApp disiapkan.
   */
  app.post("/api/unit/zis/donasi/:id/verifikasi", async (req, res) => {
    if (!wajibZis(req, res)) return;
    const id = Number(String(req.params.id ?? "").replace(/\D/g, ""));
    if (!id) return res.status(400).json({ pesan: "Donasi tidak dikenali." });

    try {
      const { rows } = await tanya(
        `with diubah as (
           update donasi
              set status = 'dikonfirmasi', diperbarui = now()
            where id = $1 and status = 'menunggu'
            returning id, program_id, nama, telepon, anonim, jumlah, metode
         ), program as (
           update donasi_program p
              set terkumpul = p.terkumpul + s.jumlah,
                  jumlah_donatur = p.jumlah_donatur + 1,
                  diperbarui = now()
             from diubah s
            where p.id = s.program_id
            returning p.id
         ), catatan_donatur as (
           /* Donatur yang tampil di halaman program (tabel donasi_donatur). */
           insert into donasi_donatur (id, program_id, nama, jumlah, metode, waktu, tampil)
           select 'dnr-d' || s.id, s.program_id,
                  case when s.anonim then 'Hamba Allah'
                       else coalesce(nullif(trim(s.nama), ''), 'Hamba Allah') end,
                  s.jumlah, s.metode, to_char(now(), 'YYYY-MM-DD'), true
             from diubah s
            where s.program_id is not null
           on conflict (id) do nothing
           returning id
         ), nama_donatur as (
           /* Nama dan nomor yang dipakai untuk daftar donatur ZIS.
              Donasi anonim tetap dicatat sebagai "Hamba Allah". */
           select s.program_id, s.jumlah,
                  case when s.anonim then 'Hamba Allah'
                       else coalesce(nullif(trim(s.nama), ''), 'Hamba Allah') end as nama_donatur,
                  regexp_replace(coalesce(s.telepon, ''), '[^0-9]', '', 'g') as telepon_digit
             from diubah s
         ), pilih_donatur as (
           /* Donatur yang sudah tercatat dicari lebih dahulu supaya tidak ada nama kembar:
              nomor WhatsApp yang sama, atau nama yang sama ketika nomornya belum tersimpan. */
           select d.id
             from donatur d, nama_donatur n
            where (n.telepon_digit <> '' and d.telepon = n.telepon_digit)
               or (coalesce(d.telepon, '') = '' and lower(trim(d.nama)) = lower(trim(n.nama_donatur)))
            order by (case when n.telepon_digit <> '' and d.telepon = n.telepon_digit then 0 else 1 end)
            limit 1
         ), perbarui_donatur as (
           /* Donatur lama: catatannya ditambah, bukan dibuat baris baru. */
           update donatur d
              set nama = case when n.nama_donatur = 'Hamba Allah' then d.nama else n.nama_donatur end,
                  telepon = case when n.telepon_digit <> '' then n.telepon_digit else d.telepon end,
                  jumlah_donasi = d.jumlah_donasi + 1,
                  jumlah_total = d.jumlah_total + n.jumlah,
                  program_terakhir = coalesce(n.program_id, d.program_terakhir),
                  diperbarui = now()
             from nama_donatur n, pilih_donatur p
            where d.id = p.id
           returning d.id
         ), donatur_baru as (
           /* Donatur yang belum pernah tercatat: satu baris baru untuk satu orang. */
           insert into donatur (id, nama, telepon, jumlah_donasi, jumlah_total, program_terakhir)
           select $2 || md5(case when n.telepon_digit <> '' then n.telepon_digit else lower(trim(n.nama_donatur)) end),
                  n.nama_donatur, nullif(n.telepon_digit, ''), 1, n.jumlah, n.program_id
             from nama_donatur n
            where not exists (select 1 from perbarui_donatur)
           on conflict (id) do nothing
           returning id
         )
         select id from diubah`,
        [id, "dntr-"],
      );

      if (rows.length === 0)
        return res.status(400).json({ pesan: "Donasi ini sudah diperiksa atau tidak ditemukan." });

      const lembaga = await namaLembaga();
      res.json({ ok: true, donasi: barisDonasi(await ambilSatu(id), lembaga), statistik: await ambilStatistik() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Donasi yang tidak memenuhi syarat ditandai ditolak supaya tidak menumpuk di daftar. */
  app.post("/api/unit/zis/donasi/:id/tolak", async (req, res) => {
    if (!wajibZis(req, res)) return;
    const id = Number(String(req.params.id ?? "").replace(/\D/g, ""));
    if (!id) return res.status(400).json({ pesan: "Donasi tidak dikenali." });

    try {
      const { rowCount } = await tanya(
        "update donasi set status = 'ditolak', diperbarui = now() where id = $1 and status = 'menunggu'",
        [id],
      );
      if (!rowCount) return res.status(400).json({ pesan: "Donasi ini sudah diperiksa atau tidak ditemukan." });
      res.json({ ok: true, statistik: await ambilStatistik() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* --------------------------- kategori program --------------------------- */

  const kolomKategori = `
    select k.id, k.nama, k.keterangan, k.aktif, k.urutan,
           (select count(*)::int from donasi_program p
             where lower(trim(coalesce(p.kategori, ''))) = lower(trim(k.nama))) as program
      from donasi_kategori k
     order by k.urutan, k.nama`;

  const daftarKategori = async () =>
    (await tanya(kolomKategori)).rows.map((k) => ({
      id: k.id,
      nama: k.nama,
      keterangan: k.keterangan ?? "",
      aktif: k.aktif === true,
      program: angka(k.program),
    }));

  /** Kategori baru harus punya nama sendiri; dipakai pada formulir program. */
  const namaKategoriTerpakai = async (nama, kecuali) =>
    (
      await tanya(
        "select id from donasi_kategori where lower(trim(nama)) = lower(trim($1)) and id <> $2",
        [nama, kecuali ?? ""],
      )
    ).rows.length > 0;

  /* --- Metode pembayaran resmi lembaga (tabel donasi_metode) -------------------------
     Metode tidak ditambah atau dihapus dari sini karena setiap program donasi menautkan
     id-nya; yang bisa diubah adalah nama, keterangan, langkah, gambar (mis. kode QRIS),
     dan keaktifannya. */
  app.get("/api/unit/zis/metode", async (req, res) => {
    if (!wajibZis(req, res)) return;
    try {
      res.json({ ok: true, metode: await daftarMetode() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/unit/zis/metode/:id", async (req, res) => {
    if (!wajibZis(req, res)) return;
    const b = req.body || {};
    const id = rapikan(req.params.id, 60);
    const nama = rapikan(b.nama, 80);
    if (nama.length < 2) return res.status(400).json({ pesan: "Nama metode minimal 2 huruf." });
    try {
      const ada = (await tanya("select id from donasi_metode where id = $1", [id])).rows[0];
      if (!ada) return res.status(404).json({ pesan: "Metode pembayaran tidak ditemukan." });

      /* Langkah pembayaran: baris kosong dibuang supaya tidak tampil sebagai nomor kosong. */
      const langkah = (Array.isArray(b.langkah) ? b.langkah : [])
        .map((l) => rapikan(l, 400))
        .filter((l) => l.length > 0);
      if (langkah.length === 0)
        return res.status(400).json({ pesan: "Isi minimal satu langkah pembayaran." });

      const gambarUrl = rapikan(b.gambarUrl, 600);
      const mediaId = rapikan(b.mediaId, 60) || null;
      if (/qris/i.test(nama) && !gambarUrl)
        return res.status(400).json({ pesan: "Metode QRIS wajib memakai gambar kode QR agar bisa dipindai donatur." });

      await tanya(
        `update donasi_metode set nama = $2, keterangan = $3, langkah = $4::jsonb, gambar_url = $5,
                media_id = $6, aktif = $7, diperbarui = now()
          where id = $1`,
        [id, nama, rapikan(b.keterangan, 300), JSON.stringify(langkah), gambarUrl || null, mediaId, b.aktif !== false],
      );
      res.json({ ok: true, metode: await daftarMetode() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.get("/api/unit/zis/kategori", async (req, res) => {
    if (!wajibZis(req, res)) return;
    try {
      res.json({ ok: true, kategori: await daftarKategori() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/unit/zis/kategori", async (req, res) => {
    if (!wajibZis(req, res)) return;
    const b = req.body || {};
    const nama = rapikan(b.nama, 80);
    if (nama.length < 2) return res.status(400).json({ pesan: "Nama kategori minimal 2 huruf." });
    try {
      if (await namaKategoriTerpakai(nama))
        return res.status(409).json({ pesan: `Kategori “${nama}” sudah ada.` });
      const urut = (await tanya("select coalesce(max(urutan), 0) + 1 as n from donasi_kategori")).rows[0].n;
      await tanya(
        `insert into donasi_kategori (id, urutan, nama, keterangan, aktif) values ($1, $2, $3, $4, $5)`,
        [idBaru("dk"), urut, nama, rapikan(b.keterangan, 300), b.aktif !== false],
      );
      res.json({ ok: true, kategori: await daftarKategori() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/unit/zis/kategori/:id", async (req, res) => {
    if (!wajibZis(req, res)) return;
    const b = req.body || {};
    const id = rapikan(req.params.id, 60);
    const nama = rapikan(b.nama, 80);
    if (nama.length < 2) return res.status(400).json({ pesan: "Nama kategori minimal 2 huruf." });
    try {
      const lama = (await tanya("select nama from donasi_kategori where id = $1", [id])).rows[0];
      if (!lama) return res.status(404).json({ pesan: "Kategori tidak ditemukan." });
      if (await namaKategoriTerpakai(nama, id))
        return res.status(409).json({ pesan: `Kategori “${nama}” sudah ada.` });

      await tanya(
        "update donasi_kategori set nama = $2, keterangan = $3, aktif = $4, diperbarui = now() where id = $1",
        [id, nama, rapikan(b.keterangan, 300), b.aktif !== false],
      );
      /* Nama kategori pada program ikut disesuaikan supaya tidak ada program yang kehilangan kategori. */
      if (lama.nama !== nama) {
        await tanya("update donasi_program set kategori = $2, diperbarui = now() where lower(trim(coalesce(kategori, ''))) = lower(trim($1))", [
          lama.nama,
          nama,
        ]);
      }
      res.json({ ok: true, kategori: await daftarKategori() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.delete("/api/unit/zis/kategori/:id", async (req, res) => {
    if (!wajibZis(req, res)) return;
    const id = rapikan(req.params.id, 60);
    try {
      const dipakai = (
        await tanya(
          `select count(*)::int as n from donasi_program p
            where lower(trim(coalesce(p.kategori, ''))) = lower(trim((select nama from donasi_kategori where id = $1)))`,
          [id],
        )
      ).rows[0]?.n ?? 0;
      if (dipakai > 0)
        return res.status(400).json({ pesan: `Kategori ini masih dipakai ${dipakai} program. Pindahkan dulu programnya.` });
      const { rowCount } = await tanya("delete from donasi_kategori where id = $1", [id]);
      if (!rowCount) return res.status(404).json({ pesan: "Kategori tidak ditemukan." });
      res.json({ ok: true, kategori: await daftarKategori() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ----------------------------- program donasi ---------------------------- */

  const kolomProgram = `
    select p.id, p.slug, p.judul, p.kategori, p.gambar_url, p.media_id, p.target, p.terkumpul,
           p.jumlah_donatur, p.batas, p.ringkasan, p.pengelola, p.isi, p.rincian, p.metode, p.aktif,
           p.dibuat, p.diperbarui,
           (select count(*)::int from donasi_riwayat r where r.program_id = p.id) as riwayat,
           (select count(*)::int from donasi d where d.program_id = p.id) as donasi
      from donasi_program p`;

  const barisProgram = (p) => ({
    id: p.id,
    slug: p.slug,
    judul: p.judul,
    kategori: p.kategori ?? "",
    gambarUrl: p.gambar_url ?? "",
    mediaId: p.media_id ?? null,
    target: angka(p.target),
    terkumpul: angka(p.terkumpul),
    donatur: angka(p.jumlah_donatur),
    batas: p.batas ? new Date(p.batas).toISOString().slice(0, 10) : null,
    ringkasan: p.ringkasan ?? "",
    pengelola: p.pengelola ?? "",
    isi: Array.isArray(p.isi) ? p.isi : [],
    rincian: Array.isArray(p.rincian) ? p.rincian : [],
    metode: Array.isArray(p.metode) ? p.metode : [],
    aktif: p.aktif === true,
    riwayat: angka(p.riwayat),
    donasi: angka(p.donasi),
    dibuat: p.dibuat,
    diperbarui: p.diperbarui,
  });

  /** Metode pembayaran resmi lembaga (tabel donasi_metode) untuk dipilih per program. */
  const daftarMetode = async () =>
    (
      await tanya(
        "select id, nama, keterangan, langkah, gambar_url, media_id, aktif, urutan from donasi_metode order by urutan, nama",
      )
    ).rows.map((m) => ({
      id: m.id,
      nama: m.nama,
      keterangan: m.keterangan ?? "",
      langkah: Array.isArray(m.langkah) ? m.langkah : [],
      gambarUrl: m.gambar_url ?? "",
      mediaId: m.media_id ?? null,
      aktif: m.aktif === true,
      urutan: angka(m.urutan),
    }));

  const daftarProgram = async () =>
    (await tanya(`${kolomProgram} order by p.dibuat desc, p.judul`)).rows.map(barisProgram);

  /** Alamat halaman program dibuat dari namanya dan dijaga tetap unik. */
  const slugUnik = async (judul, kecuali) => {
    const dasar = slugDari(judul);
    for (let i = 1; i <= 40; i += 1) {
      const calon = i === 1 ? dasar : `${dasar}-${i}`;
      const ada = (await tanya("select id from donasi_program where slug = $1 and id <> $2", [calon, kecuali ?? ""])).rows
        .length;
      if (!ada) return calon;
    }
    return `${dasar}-${Date.now().toString(36)}`;
  };

  const siapkanBorangProgram = async (b, { idLama } = {}) => {
    const judul = rapikan(b.judul, 160);
    if (judul.length < 3) return { galat: "Nama program minimal 3 huruf." };

    const kategori = rapikan(b.kategori, 80);
    if (!kategori) return { galat: "Kategori program belum dipilih." };
    if (!(await daftarKategori()).some((k) => k.nama.toLowerCase() === kategori.toLowerCase()))
      return { galat: "Kategori tidak dikenali. Pilih kategori yang ada pada menu Kategori Program." };

    const gambarUrl = rapikan(b.gambarUrl, 500);
    if (!gambarUrl) return { galat: "Gambar program belum diunggah." };

    const pengelola = rapikan(b.pengelola, 120);
    if (pengelola.length < 3) return { galat: "Pembuat program minimal 3 huruf." };

    const target = Math.round(angka(b.target));
    if (target <= 0) return { galat: "Target dana harus lebih besar dari nol." };
    if (target > 100000000000) return { galat: "Target dana terlalu besar." };

    const batas = rapikan(b.batas, 10);
    if (batas && !/^\d{4}-\d{2}-\d{2}$/.test(batas)) return { galat: "Batas waktu tidak dikenali." };

    /* Metode pembayaran dipilih dari daftar resmi lembaga; tiap program boleh berbeda. */
    const semuaMetode = await daftarMetode();
    const dipilih = (Array.isArray(b.metode) ? b.metode : []).map((m) => rapikan(m, 40));
    const metode = semuaMetode.filter((m) => m.aktif && dipilih.includes(m.id)).map((m) => m.id);
    if (metode.length === 0) return { galat: "Pilih minimal satu metode pembayaran untuk program ini." };

    return {
      nilai: {
        judul,
        slug: idLama ? null : await slugUnik(judul),
        kategori,
        gambarUrl,
        mediaId: rapikan(b.mediaId, 60) || null,
        pengelola,
        target,
        batas: batas || null,
        ringkasan: rapikan(b.ringkasan, 700),
        isi: rapikanIsi(b.isi),
        rincian: rapikanRincian(b.rincian),
        metode,
        aktif: b.aktif !== false,
      },
    };
  };

  app.get("/api/unit/zis/program", async (req, res) => {
    if (!wajibZis(req, res)) return;
    try {
      res.json({ ok: true, program: await daftarProgram(), kategori: await daftarKategori(), metode: await daftarMetode() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/unit/zis/program", async (req, res) => {
    if (!wajibZis(req, res)) return;
    try {
      const { nilai, galat } = await siapkanBorangProgram(req.body || {});
      if (galat) return res.status(400).json({ pesan: galat });
      const id = idBaru("dn");
      await tanya(
        `insert into donasi_program (id, slug, judul, kategori, gambar_url, media_id, target, terkumpul,
                                     jumlah_donatur, batas, ringkasan, pengelola, isi, rincian, metode, aktif)
         values ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14)`,
        [
          id,
          nilai.slug,
          nilai.judul,
          nilai.kategori,
          nilai.gambarUrl,
          nilai.mediaId,
          nilai.target,
          nilai.batas,
          nilai.ringkasan,
          nilai.pengelola,
          JSON.stringify(nilai.isi),
          JSON.stringify(nilai.rincian),
          JSON.stringify(nilai.metode),
          nilai.aktif,
        ],
      );
      res.json({ ok: true, program: await daftarProgram(), metode: await daftarMetode() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/unit/zis/program/:id", async (req, res) => {
    if (!wajibZis(req, res)) return;
    const id = rapikan(req.params.id, 60);
    try {
      const ada = (await tanya("select 1 from donasi_program where id = $1", [id])).rows.length > 0;
      if (!ada) return res.status(404).json({ pesan: "Program tidak ditemukan." });
      const { nilai, galat } = await siapkanBorangProgram(req.body || {}, { idLama: id });
      if (galat) return res.status(400).json({ pesan: galat });
      await tanya(
        `update donasi_program set judul = $2, kategori = $3, gambar_url = $4, media_id = $5, target = $6,
                batas = $7, ringkasan = $8, pengelola = $9, isi = $10::jsonb, rincian = $11::jsonb,
                metode = $12::jsonb, aktif = $13, diperbarui = now()
          where id = $1`,
        [
          id,
          nilai.judul,
          nilai.kategori,
          nilai.gambarUrl,
          nilai.mediaId,
          nilai.target,
          nilai.batas,
          nilai.ringkasan,
          nilai.pengelola,
          JSON.stringify(nilai.isi),
          JSON.stringify(nilai.rincian),
          JSON.stringify(nilai.metode),
          nilai.aktif,
        ],
      );
      res.json({ ok: true, program: await daftarProgram(), metode: await daftarMetode() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.delete("/api/unit/zis/program/:id", async (req, res) => {
    if (!wajibZis(req, res)) return;
    const id = rapikan(req.params.id, 60);
    try {
      const { rowCount } = await tanya("delete from donasi_program where id = $1", [id]);
      if (!rowCount) return res.status(404).json({ pesan: "Program tidak ditemukan." });
      res.json({ ok: true, program: await daftarProgram() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* --------------------------- laporan penyaluran -------------------------- */

  const JENIS_LAPORAN = new Set(["laporan", "penyaluran"]);

  const kolomLaporan = `
    select r.id, r.program_id, r.tanggal, r.judul, r.keterangan, r.jenis, r.nominal, r.urutan,
           p.judul as program_judul
      from donasi_riwayat r
      left join donasi_program p on p.id = r.program_id`;

  const barisLaporan = (r) => ({
    id: r.id,
    programId: r.program_id,
    program: r.program_judul ?? "",
    tanggal: r.tanggal ?? "",
    judul: r.judul,
    keterangan: r.keterangan ?? "",
    jenis: r.jenis === "penyaluran" ? "penyaluran" : "laporan",
    nominal: angka(r.nominal),
  });

  const daftarLaporan = async (programId) =>
    (
      await tanya(
        `${kolomLaporan} ${programId ? "where r.program_id = $1" : ""} order by r.tanggal desc nulls last, r.urutan`,
        programId ? [programId] : [],
      )
    ).rows.map(barisLaporan);

  const pilihanProgram = async () =>
    (await tanya("select id, judul from donasi_program order by judul")).rows.map((p) => ({
      id: p.id,
      judul: p.judul,
    }));

  /** Laporan yang diubah petugas langsung tampil pada tab Riwayat di situs. */
  const siapkanBorangLaporan = async (b) => {
    const programId = rapikan(b.programId, 60);
    if (!programId) return { galat: "Program donasi belum dipilih." };
    const program = (await tanya("select id from donasi_program where id = $1", [programId])).rows[0];
    if (!program) return { galat: "Program donasi tidak ditemukan." };

    const jenis = rapikan(b.jenis, 20).toLowerCase();
    if (!JENIS_LAPORAN.has(jenis)) return { galat: "Jenis laporan harus Laporan atau Penyaluran." };

    const judul = rapikan(b.judul, 200);
    if (judul.length < 3) return { galat: "Nama laporan minimal 3 huruf." };

    let nominal = 0;
    if (jenis === "penyaluran") {
      nominal = Math.round(angka(b.nominal));
      if (nominal <= 0) return { galat: "Jumlah penyaluran harus lebih besar dari nol." };
    }

    const tanggal = rapikan(b.tanggal, 10);
    if (tanggal && !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return { galat: "Tanggal laporan tidak dikenali." };

    return {
      nilai: {
        programId,
        jenis,
        judul,
        nominal,
        tanggal: sekarangKe(tanggal),
        keterangan: rapikan(b.keterangan, 1200),
      },
    };
  };

  app.get("/api/unit/zis/laporan", async (req, res) => {
    if (!wajibZis(req, res)) return;
    try {
      const programId = rapikan(req.query?.program, 60);
      res.json({
        ok: true,
        laporan: await daftarLaporan(programId || null),
        program: await pilihanProgram(),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/unit/zis/laporan", async (req, res) => {
    if (!wajibZis(req, res)) return;
    try {
      const { nilai, galat } = await siapkanBorangLaporan(req.body || {});
      if (galat) return res.status(400).json({ pesan: galat });
      await tanya(
        `insert into donasi_riwayat (id, program_id, urutan, tanggal, judul, keterangan, jenis, nominal)
         values ($1, $2, 0, $3, $4, $5, $6, $7)`,
        [idBaru("rw"), nilai.programId, nilai.tanggal, nilai.judul, nilai.keterangan, nilai.jenis, nilai.nominal],
      );
      res.json({ ok: true, laporan: await daftarLaporan(null), program: await pilihanProgram() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/unit/zis/laporan/:id", async (req, res) => {
    if (!wajibZis(req, res)) return;
    const id = rapikan(req.params.id, 60);
    try {
      const ada = (await tanya("select 1 from donasi_riwayat where id = $1", [id])).rows.length > 0;
      if (!ada) return res.status(404).json({ pesan: "Laporan tidak ditemukan." });
      const { nilai, galat } = await siapkanBorangLaporan(req.body || {});
      if (galat) return res.status(400).json({ pesan: galat });
      await tanya(
        `update donasi_riwayat set program_id = $2, tanggal = $3, judul = $4, keterangan = $5, jenis = $6, nominal = $7
          where id = $1`,
        [id, nilai.programId, nilai.tanggal, nilai.judul, nilai.keterangan, nilai.jenis, nilai.nominal],
      );
      res.json({ ok: true, laporan: await daftarLaporan(null), program: await pilihanProgram() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.delete("/api/unit/zis/laporan/:id", async (req, res) => {
    if (!wajibZis(req, res)) return;
    const id = rapikan(req.params.id, 60);
    try {
      const { rowCount } = await tanya("delete from donasi_riwayat where id = $1", [id]);
      if (!rowCount) return res.status(404).json({ pesan: "Laporan tidak ditemukan." });
      res.json({ ok: true, laporan: await daftarLaporan(null), program: await pilihanProgram() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* -------------------------- daftar donatur ZIS --------------------------- */

  const kolomDonatur = `
    select d.id, d.nama, d.telepon, d.jumlah_donasi, d.jumlah_total, d.aktif, d.catatan, d.dibuat, d.diperbarui,
           p.judul as program_judul
      from donatur d
      left join donasi_program p on p.id = d.program_terakhir`;

  const barisDonatur = (d) => ({
    id: d.id,
    nama: d.nama,
    telepon: d.telepon ?? "",
    jumlahDonasi: angka(d.jumlah_donasi),
    jumlahTotal: angka(d.jumlah_total),
    program: d.program_judul ?? "",
    aktif: d.aktif === true,
    catatan: d.catatan ?? "",
    dibuat: d.dibuat,
    diperbarui: d.diperbarui,
  });

  const daftarDonatur = async (cari) => {
    const kata = rapikan(cari, 60);
    return (
      await tanya(
        `${kolomDonatur} ${
          kata ? "where d.nama ilike $1 or coalesce(d.telepon, '') ilike $1" : ""
        } order by d.jumlah_total desc, d.nama`,
        kata ? [`%${kata}%`] : [],
      )
    ).rows.map(barisDonatur);
  };

  const ringkasDonatur = async () => {
    const r = (
      await tanya(
        `select count(*)::int as jumlah,
                coalesce(sum(jumlah_total), 0) as total,
                count(*) filter (where coalesce(telepon, '') <> '')::int as bertelepon
           from donatur`,
      )
    ).rows[0];
    /* Kolom numeric dikirim sebagai angka supaya format rupiah di halaman benar. */
    return { jumlah: angka(r.jumlah), total: angka(r.total), bertelepon: angka(r.bertelepon) };
  };

  const siapkanBorangDonatur = (b) => {
    const nama = rapikan(b.nama, 120);
    if (nama.length < 3) return { galat: "Nama donatur minimal 3 huruf." };
    const telepon = teleponRapi(b.telepon);
    const digit = telepon.replace(/\D/g, "");
    if (telepon && (digit.length < 9 || digit.length > 15))
      return { galat: "Nomor WhatsApp minimal 9 angka, contoh 081234567890." };
    return { nilai: { nama, telepon: telepon || null, catatan: rapikan(b.catatan, 300), aktif: b.aktif !== false } };
  };

  app.get("/api/unit/zis/donatur", async (req, res) => {
    if (!wajibZis(req, res)) return;
    try {
      const cari = rapikan(req.query?.cari, 60);
      res.json({ ok: true, donatur: await daftarDonatur(cari), ringkas: await ringkasDonatur() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/unit/zis/donatur", async (req, res) => {
    if (!wajibZis(req, res)) return;
    try {
      const { nilai, galat } = siapkanBorangDonatur(req.body || {});
      if (galat) return res.status(400).json({ pesan: galat });
      await tanya(
        `insert into donatur (id, nama, telepon, catatan, aktif, jumlah_donasi, jumlah_total)
         values ($1, $2, $3, $4, $5, 0, 0)`,
        [idBaru("dntr"), nilai.nama, nilai.telepon, nilai.catatan, nilai.aktif],
      );
      res.json({ ok: true, donatur: await daftarDonatur(null), ringkas: await ringkasDonatur() });
    } catch (e) {
      if (e.code === "23505") return res.status(409).json({ pesan: "Nomor WhatsApp ini sudah terdaftar." });
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/unit/zis/donatur/:id", async (req, res) => {
    if (!wajibZis(req, res)) return;
    const id = rapikan(req.params.id, 60);
    try {
      const ada = (await tanya("select 1 from donatur where id = $1", [id])).rows.length > 0;
      if (!ada) return res.status(404).json({ pesan: "Donatur tidak ditemukan." });
      const { nilai, galat } = siapkanBorangDonatur(req.body || {});
      if (galat) return res.status(400).json({ pesan: galat });
      await tanya(
        "update donatur set nama = $2, telepon = $3, catatan = $4, aktif = $5, diperbarui = now() where id = $1",
        [id, nilai.nama, nilai.telepon, nilai.catatan, nilai.aktif],
      );
      res.json({ ok: true, donatur: await daftarDonatur(null), ringkas: await ringkasDonatur() });
    } catch (e) {
      if (e.code === "23505") return res.status(409).json({ pesan: "Nomor WhatsApp ini sudah terdaftar." });
      res.status(500).json({ pesan: e.message });
    }
  });

  app.delete("/api/unit/zis/donatur/:id", async (req, res) => {
    if (!wajibZis(req, res)) return;
    const id = rapikan(req.params.id, 60);
    try {
      const { rowCount } = await tanya("delete from donatur where id = $1", [id]);
      if (!rowCount) return res.status(404).json({ pesan: "Donatur tidak ditemukan." });
      res.json({ ok: true, donatur: await daftarDonatur(null), ringkas: await ringkasDonatur() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ---------------------------- riwayat donasi ----------------------------- */

  const STATUS_DONASI = new Set(["menunggu", "dikonfirmasi", "ditolak"]);

  app.get("/api/unit/zis/riwayat-donasi", async (req, res) => {
    if (!wajibZis(req, res)) return;
    try {
      const status = rapikan(req.query?.status, 20);
      const pakai = STATUS_DONASI.has(status) ? status : null;
      const donasi = (
        await tanya(
          `select d.id, d.nama, d.anonim, d.jumlah, d.metode, d.status, d.dibuat, d.diperbarui,
                  p.judul as program_judul
             from donasi d
             left join donasi_program p on p.id = d.program_id
            ${pakai ? "where d.status = $1" : ""}
            order by d.dibuat desc, d.id desc
            limit 200`,
          pakai ? [pakai] : [],
        )
      ).rows.map((d) => ({
        id: Number(d.id),
        nomor: nomorDonasi(d.id),
        nama: d.anonim === true ? "Hamba Allah" : d.nama ?? "Hamba Allah",
        anonim: d.anonim === true,
        program: d.program_judul ?? "",
        jumlah: angka(d.jumlah),
        metode: d.metode ?? "",
        status: d.status,
        dibuat: d.dibuat,
        diperbarui: d.diperbarui,
      }));

      const ringkas = (
        await tanya(
          `select count(*)::int as transaksi,
                  count(*) filter (where status = 'dikonfirmasi')::int as dikonfirmasi,
                  count(*) filter (where status = 'menunggu')::int as menunggu,
                  count(*) filter (where status = 'ditolak')::int as ditolak,
                  coalesce(sum(jumlah) filter (where status = 'dikonfirmasi'), 0) as total
             from donasi`,
        )
      ).rows[0];

      res.json({
        ok: true,
        donasi,
        ringkas: {
          transaksi: angka(ringkas.transaksi),
          dikonfirmasi: angka(ringkas.dikonfirmasi),
          menunggu: angka(ringkas.menunggu),
          ditolak: angka(ringkas.ditolak),
          total: angka(ringkas.total),
        },
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });
}

module.exports = pasangRuteZis;
module.exports.nomorWhatsApp = nomorWhatsApp;
