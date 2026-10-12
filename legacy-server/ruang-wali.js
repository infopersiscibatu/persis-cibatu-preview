/**
 * Portal wali santri.
 *
 * Wali masuk memakai PIN yang dibuat Admin Sekolah pada tabel siswa. Satu PIN hanya
 * dipakai satu siswa, dan setelah masuk wali mendapat token sesi (header x-sesi-wali)
 * yang berlaku 30 hari. Semua data yang dikirim selalu data milik siswa dari PIN itu:
 * tagihan aktif, riwayat pembayaran, cara pembayaran, dan setoran yang dikirim wali.
 *
 * Setoran wali masuk sebagai pembayaran berstatus "menunggu" beserta bukti transfer
 * (opsional) yang disimpan pada penyimpanan berkas. Bendahara di Admin Tata Usaha yang
 * memverifikasinya, dan setelah diverifikasi tagihannya menjadi lunas.
 */
const crypto = require("node:crypto");
const { istilahUntukJenjang } = require("./lib/istilah");
const pesanWali = require("./lib/notifikasiWali");

const MASA_SESI_HARI = 30;

/** Ukuran foto profil yang diterima (byte). */
const BATAS_FOTO = 10 * 1024 * 1024;

module.exports = function pasangRuteWali(app, { tanya, storage, push, tagihanBulanan }) {
  const daftar = async (sql, nilai = []) => (await tanya(sql, nilai)).rows;
  const satu = async (sql, nilai = []) => (await tanya(sql, nilai)).rows[0] ?? null;
  const acakToken = () => crypto.randomBytes(32).toString("hex");

  const keTanggalIso = (nilai) => {
    if (!nilai) return null;
    if (typeof nilai === "string") return nilai.slice(0, 10);
    const d = new Date(nilai);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  /** Setiap permintaan di bawah /api/wali (kecuali masuk) wajib membawa token wali. */
  const penjagaWali = (req, res, next) => {
    const token = String(req.get("x-sesi-wali") ?? "").trim();
    if (!token) return res.status(401).json({ pesan: "Silakan masuk dengan PIN wali santri." });

    tanya(
      `select w.token, w.santri_id, w.kedaluwarsa,
              s.nama, s.nis, s.nisn, s.kelas, s.status, s.wali_nama, s.wali_telepon, s.unit_id,
              s.program, s.asal_sekolah, s.alamat, s.tempat_lahir, s.tanggal_lahir, s.email, s.tahun_masuk,
              (select m.url from media m where m.id = s.foto_media_id) as foto_url,
              u.nama as unit_nama, coalesce(jsonb_array_length(u.jurusan), 0) as ada_jurusan,
              coalesce(j.singkatan, j.nama, '') as jenjang,
              j.slug as jenjang_slug, j.nama as jenjang_nama,
              (select p.nama from jurusan p where p.jenjang_id = s.jenjang_id and p.slug = s.program) as program_nama,
              (j.slug = 'pt' or j.nama ilike '%tinggi%') as tinggi
         from sesi_wali w
         join santri s on s.id = w.santri_id
         left join unit_pendidikan u on u.id = s.unit_id
         left join jenjang j on j.id = u.jenjang_id
        where w.token = $1 and w.kedaluwarsa > now()`,
      [token],
    )
      .then(({ rows }) => {
        if (rows.length === 0) return res.status(401).json({ pesan: "Sesi sudah berakhir. Silakan masuk lagi dengan PIN." });
        req.wali = rows[0];
        next();
      })
      .catch((e) => res.status(500).json({ pesan: e.message }));
  };

  /**
   * Profil peserta didik untuk portal wali. Isinya sama dengan data yang dilihat
   * petugas pada tabel siswa/mahasiswa di halaman Admin Sekolah.
   */
  const profilWali = (w) => ({
    id: w.santri_id ?? w.id,
    nama: w.nama,
    nis: w.nis ?? "",
    nisn: w.nisn ?? "",
    kelas: w.kelas ?? "",
    status: w.status ?? "aktif",
    sebutan: w.tinggi ? "mahasiswa" : "siswa",
    /* Jurusan yang dipilih: slugnya dan namanya untuk ditampilkan. */
    program: w.program ?? "",
    programNama: w.program_nama ?? "",
    /** Apakah jenjang unit ini punya jurusan/program studi (RA & MI umumnya tidak). */
    adaJurusan: (w.ada_jurusan ?? 0) > 0,
    /** Foto profil yang diunggah wali (kosong bila belum ada). */
    foto: w.foto_url ?? "",
    waliNama: w.wali_nama ?? "",
    waliTelepon: w.wali_telepon ?? "",
    sekolah: w.unit_nama ?? "",
    jenjang: w.jenjang ?? "",
    asalSekolah: w.asal_sekolah ?? "",
    alamat: w.alamat ?? "",
    tempatLahir: w.tempat_lahir ?? "",
    tanggalLahir: w.tanggal_lahir ? new Date(w.tanggal_lahir).toISOString().slice(0, 10) : "",
    email: w.email ?? "",
    tahunMasuk: w.tahun_masuk ?? null,
    diperbarui: null,
  });

  /* --------------------------------- masuk --------------------------------- */

  app.post("/api/wali/masuk", async (req, res) => {
    try {
      const pin = String(req.body?.pin ?? "").trim();
      if (!/^[0-9]{4,8}$/.test(pin)) {
        return res.status(400).json({ pesan: "PIN wali santri terdiri dari 4 sampai 8 angka." });
      }

      const siswa = await satu(
        `select s.id, s.nama, s.nis, s.nisn, s.kelas, s.status, s.wali_nama, s.wali_telepon, s.unit_id,
                s.program, s.asal_sekolah, s.alamat, s.tempat_lahir, s.tanggal_lahir, s.email, s.tahun_masuk,
                (select m.url from media m where m.id = s.foto_media_id) as foto_url,
                u.nama as unit_nama, coalesce(jsonb_array_length(u.jurusan), 0) as ada_jurusan,
                coalesce(j.singkatan, j.nama, '') as jenjang,
                j.slug as jenjang_slug, j.nama as jenjang_nama,
                (select p.nama from jurusan p where p.jenjang_id = s.jenjang_id and p.slug = s.program) as program_nama,
                (j.slug = 'pt' or j.nama ilike '%tinggi%') as tinggi
           from santri s
           left join unit_pendidikan u on u.id = s.unit_id
           left join jenjang j on j.id = s.jenjang_id
          where s.pin_wali = $1`,
        [pin],
      );
      if (!siswa) {
        return res.status(401).json({ pesan: "PIN tidak dikenali. Mintalah PIN kepada petugas tata usaha sekolah." });
      }

      const token = acakToken();
      await tanya(
        `insert into sesi_wali (token, santri_id, kedaluwarsa)
         values ($1, $2, now() + ($3 || ' days')::interval)`,
        [token, siswa.id, String(MASA_SESI_HARI)],
      );

      res.json({
        ok: true,
        token,
        /* Penyebutan mengikuti jenjang: sekolah/madrasah atau kampus. */
        istilah: istilahUntukJenjang({ slug: siswa.jenjang_slug, nama: siswa.jenjang_nama }),
        santri: profilWali(siswa),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/wali/keluar", penjagaWali, async (req, res) => {
    try {
      await tanya("delete from sesi_wali where token = $1", [String(req.get("x-sesi-wali") ?? "").trim()]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.get("/api/wali/saya", penjagaWali, async (req, res) => {
    try {
      res.json({ ok: true, santri: profilWali(req.wali) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ----------------------------- foto profil wali ----------------------------- */

  /**
   * Foto profil peserta didik yang diunggah wali sendiri dari portal. Berkas masuk ke
   * penyimpanan objek, dan alamatnya dicatat pada data siswa/mahasiswa sehingga tampil
   * juga bagi petugas.
   */
  app.post("/api/wali/foto", penjagaWali, async (req, res) => {
    try {
      const w = req.wali;
      const data = String(req.body?.data ?? "");
      const tipe = String(req.body?.tipe ?? "").trim().toLowerCase();
      const nama = String(req.body?.nama ?? "foto");

      if (!data) return res.status(400).json({ pesan: "Foto belum dipilih." });
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(tipe)) {
        return res.status(400).json({ pesan: "Foto harus berformat JPG, PNG, WEBP, atau GIF." });
      }
      if (Math.ceil(data.length * 0.75) > BATAS_FOTO) {
        return res.status(413).json({ pesan: "Ukuran foto lebih dari 10 MB. Perkecil dulu fotonya." });
      }

      const berkas = await storage.unggah({
        nama,
        tipe,
        data,
        folder: `foto-wali/${w.santri_id}`,
        alt: `Foto ${w.nama}`,
        keterangan: `Foto profil ${w.nama}`,
      });

      const id = `md-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
      await tanya(
        `insert into media (id, kunci, url, nama_asli, tipe, ukuran, folder, keterangan)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, berkas.kunci, berkas.url, berkas.nama, berkas.tipe, berkas.ukuran, `foto-wali/${w.santri_id}`, `Foto profil ${w.nama}`],
      );

      /* Foto lama dibuang supaya berkas di penyimpanan tidak menumpuk. */
      const lama = await satu(
        `select m.id, m.kunci from media m join santri s on s.foto_media_id = m.id where s.id = $1`,
        [w.santri_id],
      );
      await tanya("update santri set foto_media_id = $1, diperbarui = now() where id = $2", [id, w.santri_id]);
      if (lama) {
        await tanya("delete from media where id = $1", [lama.id]);
        await storage.hapus(lama.kunci).catch(() => {});
      }

      res.json({ ok: true, foto: berkas.url, santri: profilWali({ ...w, foto_url: berkas.url }) });
    } catch (e) {
      res.status(e.status ?? 500).json({ pesan: e.message });
    }
  });

  /** Hapus foto profil sehingga kembali memakai inisial nama. */
  app.delete("/api/wali/foto", penjagaWali, async (req, res) => {
    try {
      const w = req.wali;
      const lama = await satu(
        `select m.id, m.kunci from media m join santri s on s.foto_media_id = m.id where s.id = $1`,
        [w.santri_id],
      );
      await tanya("update santri set foto_media_id = null, diperbarui = now() where id = $1", [w.santri_id]);
      if (lama) {
        await tanya("delete from media where id = $1", [lama.id]);
        await storage.hapus(lama.kunci).catch(() => {});
      }
      res.json({ ok: true, foto: "", santri: profilWali({ ...w, foto_url: null }) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* ------------------------- notifikasi HP (terkunci per wali) ------------------------- */

  /**
   * Daftarkan HP yang sedang login sebagai penerima notifikasi wali santri ini.
   *
   * Inilah pengunciannya: satu HP (endpoint) hanya terikat pada satu siswa/mahasiswa.
   * Bila wali lain masuk lewat HP yang sama, ikatannya berpindah ke siswa yang baru,
   * sehingga notifikasi tagihan, nilai, dan tahfidz tidak pernah tertukar antar wali.
   * HP yang belum pernah masuk sebagai wali tetap menerima siaran kabar lembaga.
   */
  app.post("/api/wali/push/daftar", penjagaWali, async (req, res) => {
    try {
      const w = req.wali;
      const { endpoint, kunci, auth, perangkat } = req.body || {};
      if (!endpoint || !kunci || !auth) {
        return res.status(400).json({ pesan: "Data langganan notifikasi tidak lengkap." });
      }

      await push.siapkanKunci();
      await tanya(
        `insert into push_langganan (endpoint, p256dh, auth, perangkat, santri_id, diubah)
         values ($1, $2, $3, $4, $5, now())
         on conflict (endpoint) do update
           set p256dh = excluded.p256dh, auth = excluded.auth, perangkat = excluded.perangkat,
               santri_id = excluded.santri_id, diubah = now()`,
        [
          String(endpoint),
          String(kunci),
          String(auth),
          perangkat ? String(perangkat).slice(0, 160) : null,
          w.santri_id,
        ],
      );

      const jumlah = await satu(
        "select count(*)::int as jumlah from push_langganan where santri_id = $1",
        [w.santri_id],
      );
      res.json({ ok: true, santriId: w.santri_id, perangkat: jumlah?.jumlah ?? 1 });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /**
   * Lepaskan HP ini dari akun wali yang sedang masuk (dipakai saat keluar dari portal).
   * HP-nya tidak dihapus, hanya ikatannya dilepas, supaya siaran kabar lembaga tetap sampai
   * dan wali berikutnya yang masuk di HP ini tidak menerima notifikasi milik wali sebelumnya.
   */
  app.post("/api/wali/push/lepas", penjagaWali, async (req, res) => {
    try {
      const w = req.wali;
      const endpoint = String(req.body?.endpoint ?? "");
      if (!endpoint) return res.status(400).json({ pesan: "Endpoint perangkat tidak ada." });
      await tanya(
        `update push_langganan set santri_id = null, diubah = now()
          where endpoint = $1 and santri_id = $2`,
        [endpoint, w.santri_id],
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Keadaan notifikasi HP ini: apakah sudah terikat pada wali yang sedang masuk. */
  app.get("/api/wali/push", penjagaWali, async (req, res) => {
    try {
      const w = req.wali;
      const endpoint = String(req.query.endpoint ?? "");
      const baris = endpoint
        ? await satu("select santri_id from push_langganan where endpoint = $1", [endpoint])
        : null;
      const jumlah = await satu(
        "select count(*)::int as jumlah from push_langganan where santri_id = $1",
        [w.santri_id],
      );
      res.json({
        ok: true,
        terdaftar: baris?.santri_id === w.santri_id,
        perangkat: jumlah?.jumlah ?? 0,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /** Kirim satu notifikasi uji coba ke HP wali ini sendiri. */
  app.post("/api/wali/push/uji", penjagaWali, async (req, res) => {
    try {
      const w = req.wali;
      const hasil = await push.kirimKeSantri(
        w.santri_id,
        pesanWali.ujiWali({ santri: { ...w, id: w.santri_id, unit_nama: w.unit_nama } }),
      );
      if ((hasil.perangkat ?? 0) === 0) {
        return res.status(400).json({ pesan: "Belum ada HP yang terdaftar untuk wali ini. Aktifkan notifikasi lebih dulu." });
      }
      res.json({
        ok: true,
        pesan:
          hasil.terkirim > 0
            ? `Notifikasi uji dikirim ke ${hasil.terkirim} dari ${hasil.perangkat} HP wali. Periksa layar HP Anda.`
            : "HP ini terdaftar, tetapi notifikasi ujinya belum sampai — kemungkinan langganannya sudah tidak berlaku. Aktifkan ulang notifikasi di HP ini.",
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* -------------------------------- tagihan -------------------------------- */

  app.get("/api/wali/tagihan", penjagaWali, async (req, res) => {
    try {
      const w = req.wali;
      /*
       * Tagihan bulan berjalan dibuat saat portal dibuka (layanan ini tidak punya penjadwal).
       * Wali yang sedang membuka portal diberi notifikasi langsung, sedangkan wali lain
       * masuk antrean push supaya permintaan ini tidak menunggu lama.
       */
      const otomatis = await tagihanBulanan.pastikan(w.unit_id, { jedaMs: 0 });
      if (otomatis.dibuat > 0) {
        await tagihanBulanan.antreNotifikasi(otomatis.baris, { segeraSantriId: w.santri_id });
      }

      const { rows } = await tanya(
        `select t.id, t.label, t.jenis, t.jumlah, t.status, t.keterangan, t.jatuh_tempo, t.periode,
                t.kategori_id,
                (t.jatuh_tempo is not null and t.jatuh_tempo < current_date and t.status in ('belum')) as lewat,
                k.tipe as kategori_tipe, k.jatuh_tempo_hari
           from tagihan t
           left join kategori_tagihan k on k.id = t.kategori_id
          where t.santri_id = $1
          order by case t.status when 'belum' then 0 when 'menunggu' then 1 when 'lunas' then 2 else 3 end,
                   t.jatuh_tempo nulls last, t.dibuat desc`,
        [w.santri_id],
      );

      const tagihan = rows.map((r) => ({
        id: r.id,
        label: r.label ?? r.jenis ?? "Tagihan",
        jenis: r.jenis ?? "",
        jumlah: Number(r.jumlah) || 0,
        status: r.status ?? "belum",
        keterangan: r.keterangan ?? "",
        jatuhTempo: keTanggalIso(r.jatuh_tempo),
        periode: r.periode ?? null,
        lewatTempo: r.lewat === true,
        bulanan: r.kategori_tipe === "bulanan",
      }));

      const pembayaran = await daftar(
        `select p.id, p.label, p.jumlah, p.metode, p.status, p.catatan, p.dibayar_pada,
                p.diverifikasi_pada, p.tagihan_id, m.url as bukti_url
           from pembayaran p
           left join media m on m.id = p.bukti_media_id
          where p.santri_id = $1
          order by coalesce(p.diverifikasi_pada, p.dibuat) desc
          limit 100`,
        [w.santri_id],
      );

      const metode = await daftar(
        `select id, nama, keterangan, bank, nomor, atas_nama, langkah, gambar_url
           from metode_pembayaran where aktif order by urutan, nama`,
      );

      /* Nilai dan catatan tahfidz hanya tampil setelah diterbitkan petugas Admin Sekolah. */
      const daftarNilai = await daftar(
        `select n.id, n.nilai, n.predikat, n.semester, n.terbit_pada, m.nama as mapel
           from nilai n
           join mata_pelajaran m on m.id = n.mapel_id
          where n.santri_id = $1 and n.terbit
          order by m.nama`,
        [w.santri_id],
      );
      const daftarSetoran = await daftar(
        `select id, tanggal, juz, surah, ayat_mulai, ayat_selesai, materi, jenis, penilai, nilai, catatan, terbit_pada
           from setoran_tahfidz
          where santri_id = $1 and terbit
          order by tanggal desc nulls last, diperbarui desc
          limit 60`,
        [w.santri_id],
      );
      const jumlahPerangkat = await satu(
        "select count(*)::int as jumlah from push_langganan where santri_id = $1",
        [w.santri_id],
      );
      const terbitNilai = daftarNilai.reduce((t, n) => t + (Number(n.nilai) || 0), 0);

      const ringkas = (status) => ({
        jumlah: tagihan.filter((t) => t.status === status).length,
        nominal: tagihan.filter((t) => t.status === status).reduce((n, t) => n + t.jumlah, 0),
      });

      const belum = tagihan.filter((t) => t.status === "belum");
      const menunggu = pembayaran.filter((p) => p.status === "menunggu");
      const riwayat = pembayaran.filter((p) => p.status !== "menunggu");

      res.json({
        ok: true,
        istilah: istilahUntukJenjang({ slug: w.jenjang_slug, nama: w.jenjang_nama }),
        santri: profilWali(w),
        ringkasan: {
          belum: { jumlah: belum.length, nominal: belum.reduce((n, t) => n + t.jumlah, 0) },
          menunggu: {
            jumlah: menunggu.length,
            nominal: menunggu.reduce((n, p) => n + (Number(p.jumlah) || 0), 0),
          },
          lunas: ringkas("lunas"),
          bulanBelum: belum.filter((t) => t.bulanan).length,
        },
        tagihan,
        pembayaran: pembayaran.map((p) => ({
          id: String(p.id),
          label: p.label ?? "",
          jumlah: Number(p.jumlah) || 0,
          metode: p.metode ?? "",
          status: p.status,
          catatan: p.catatan ?? "",
          buktiUrl: p.bukti_url ?? "",
          tagihanId: p.tagihan_id ?? "",
          dibayarPada: keTanggalIso(p.dibayar_pada),
          diverifikasiPada: p.diverifikasi_pada ? new Date(p.diverifikasi_pada).toISOString() : null,
        })),
        menunggu: menunggu.map((p) => ({
          id: String(p.id),
          label: p.label ?? "",
          jumlah: Number(p.jumlah) || 0,
          metode: p.metode ?? "",
          status: p.status,
          tagihanId: p.tagihan_id ?? "",
          dibayarPada: keTanggalIso(p.dibayar_pada),
        })),
        riwayat: riwayat.map((p) => ({
          id: String(p.id),
          label: p.label ?? "",
          jumlah: Number(p.jumlah) || 0,
          metode: p.metode ?? "",
          status: p.status,
          catatan: p.catatan ?? "",
          buktiUrl: p.bukti_url ?? "",
          tagihanId: p.tagihan_id ?? "",
          dibayarPada: keTanggalIso(p.dibayar_pada),
          diverifikasiPada: p.diverifikasi_pada ? new Date(p.diverifikasi_pada).toISOString() : null,
        })),
        metode: metode.map((m) => ({
          id: m.id,
          nama: m.nama,
          keterangan: m.keterangan ?? "",
          bank: m.bank ?? "",
          nomor: m.nomor ?? "",
          atasNama: m.atas_nama ?? "",
          langkah: Array.isArray(m.langkah) ? m.langkah : [],
          /* Gambar kanal pembayaran (kode QRIS) dari bendahara. */
          gambar: m.gambar_url ?? "",
        })),
        /* Nilai rapor dan catatan tahfidz yang sudah diterbitkan. */
        nilai: daftarNilai.map((n) => ({
          id: n.id,
          mapel: n.mapel ?? "",
          nilai: Number(n.nilai) || 0,
          predikat: n.predikat ?? "",
          semester: n.semester ?? "",
          terbitPada: n.terbit_pada ? new Date(n.terbit_pada).toISOString() : null,
        })),
        rataNilai: daftarNilai.length > 0 ? Math.round((terbitNilai / daftarNilai.length) * 10) / 10 : 0,
        /* Tahfidz hanya berisi catatan setoran; capaian/target tidak dipakai lagi. */
        tahfidz: {
          setoran: daftarSetoran.map((t) => ({
            id: t.id,
            tanggal: keTanggalIso(t.tanggal),
            juz: t.juz ?? null,
            surah: t.surah ?? null,
            ayatMulai: t.ayat_mulai ?? null,
            ayatSelesai: t.ayat_selesai ?? null,
            /* Berapa ayat yang disetor pada rentang surat itu. */
            jumlahAyat:
              t.ayat_mulai && t.ayat_selesai && t.ayat_selesai >= t.ayat_mulai
                ? t.ayat_selesai - t.ayat_mulai + 1
                : null,
            materi: t.materi ?? "",
            jenis: t.jenis ?? "",
            penilai: t.penilai ?? "",
            nilai: t.nilai ?? "",
            catatan: t.catatan ?? "",
          })),
        },
        /* Berapa HP wali ini yang sudah menerima notifikasi. */
        notifikasi: { perangkat: jumlahPerangkat?.jumlah ?? 0, tagihanOtomatisBaru: otomatis.dibuat },
      });

      /* Sisa antrean notifikasi wali lain dikerjakan setelah balasan ini terkirim. */
      if (otomatis.dibuat > 0) tagihanBulanan.kerjakanAntrean(w.unit_id).catch(() => {});
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /* -------------------------- setoran pembayaran wali -------------------------- */

  app.post("/api/wali/bayar", penjagaWali, async (req, res) => {
    try {
      const w = req.wali;
      const ids = Array.isArray(req.body?.tagihanIds) ? req.body.tagihanIds.map((x) => String(x)).slice(0, 40) : [];
      if (ids.length === 0) return res.status(400).json({ pesan: "Pilih dulu tagihan yang mau dibayar." });

      const metode = String(req.body?.metode ?? "").trim().slice(0, 60) || "Transfer Bank";
      const catatan = String(req.body?.catatan ?? "").trim().slice(0, 200) || null;

      const tagihan = await daftar(
        `select id, label, jenis, jumlah, status from tagihan
          where santri_id = $1 and id = any($2::text[]) and status = 'belum'`,
        [w.santri_id, ids],
      );
      if (tagihan.length === 0) {
        return res.status(400).json({ pesan: "Tagihan yang dipilih sudah tidak menunggu pembayaran." });
      }

      /* Bukti transfer (opsional) disimpan ke penyimpanan berkas. */
      let buktiId = null;
      const bukti = req.body?.bukti;
      if (bukti && bukti.data) {
        const berkas = await storage.unggah({
          nama: bukti.nama,
          tipe: bukti.tipe,
          data: bukti.data,
          folder: `bukti-wali/${w.santri_id}`,
          keterangan: `Bukti transfer ${w.nama}`,
        });
        buktiId = `md-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
        await tanya(
          `insert into media (id, kunci, url, nama_asli, tipe, ukuran, folder, keterangan)
           values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            buktiId,
            berkas.kunci,
            berkas.url,
            berkas.nama,
            berkas.tipe,
            berkas.ukuran,
            `bukti-wali/${w.santri_id}`,
            `Bukti transfer ${w.nama}`,
          ],
        );
      }

      for (const t of tagihan) {
        await tanya(
          `insert into pembayaran (santri_id, tagihan_id, label, jumlah, metode, status, catatan, bukti_media_id, dibayar_pada)
           values ($1,$2,$3,$4,$5,'menunggu',$6,$7,current_date)`,
          [w.santri_id, t.id, t.label ?? t.jenis, t.jumlah, metode, catatan, buktiId],
        );
        await tanya("update tagihan set status = 'menunggu', diperbarui = now() where id = $1", [t.id]);
      }

      const nominal = tagihan.reduce((n, t) => n + (Number(t.jumlah) || 0), 0);
      res.json({
        ok: true,
        jumlah: tagihan.length,
        nominal,
        pesan: `${tagihan.length} pembayaran senilai Rp${nominal.toLocaleString("id-ID")} sudah dikirim dan menunggu verifikasi bendahara.`,
      });
    } catch (e) {
      res.status(e && e.status ? e.status : 500).json({ pesan: e.message });
    }
  });
};
