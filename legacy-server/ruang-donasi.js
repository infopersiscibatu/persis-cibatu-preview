/**
 * Donasi yang dikirim pengunjung lewat formulir di halaman program donasi.
 *
 * Data disimpan ke tabel `donasi` dengan status 'menunggu', lalu diperiksa petugas
 * di halaman Admin ZIS (Perlu Verifikasi → Sudah Diverifikasi). Nomor telepon
 * dipakai hanya untuk mengirim pesan verifikasi lewat WhatsApp, tidak pernah
 * ditampilkan di situs publik.
 */

function pasangRuteDonasi(app, { tanya }) {
  /**
   * Program donasi untuk situs: daftar program yang aktif beserta riwayat laporan
   * (diurus dari menu Laporan Penyaluran) dan donatur yang tampil di halaman program.
   * Semuanya dibaca dari database sehingga perubahan di halaman Admin ZIS langsung
   * tampil di situs.
   */
  app.get("/api/program-donasi", async (_req, res) => {
    try {
      const program = (
        await tanya(
          `select id, slug, judul, kategori, gambar_url, target, terkumpul, jumlah_donatur,
                  batas, ringkasan, pengelola, isi, rincian, metode
             from donasi_program
            where aktif
            order by dibuat, judul`,
        )
      ).rows;

      const riwayat = (
        await tanya(
          `select id, program_id, tanggal, judul, keterangan, jenis, nominal
             from donasi_riwayat
            order by tanggal desc nulls last, urutan`,
        )
      ).rows;

      const donatur = (
        await tanya(
          `select id, program_id, nama, jumlah, metode, waktu
             from donasi_donatur
            where tampil
            order by program_id, waktu desc nulls last`,
        )
      ).rows;

      /* Metode pembayaran dan rekening resmi lembaga: dipakai halaman program
         untuk menampilkan pilihan dan langkah pembayaran yang sesuai. */
      const metode = (
        await tanya(
          `select id, nama, keterangan, langkah, gambar_url, urutan
             from donasi_metode where aktif order by urutan, nama`,
        )
      ).rows.map((m) => ({
        id: m.id,
        nama: m.nama,
        keterangan: m.keterangan ?? "",
        langkah: Array.isArray(m.langkah) ? m.langkah : [],
        /* Gambar kode QRIS resmi lembaga, tampil pada popup donasi di situs. */
        gambar: m.gambar_url ?? "",
      }));

      const rekening = (
        await tanya(`select id, bank, nomor, atas_nama from donasi_rekening where aktif order by urutan, bank`)
      ).rows.map((r) => ({ id: r.id, bank: r.bank, nomor: r.nomor, atasNama: r.atas_nama ?? "" }));

      const json = (nilai, cadangan) => (Array.isArray(nilai) ? nilai : cadangan);
      const tanggal = (t) => (t ? new Date(t).toISOString().slice(0, 10) : "");

      const idAktif = new Set(metode.map((m) => m.id));

      res.json({
        ok: true,
        metode,
        rekening,
        program: program.map((p) => ({
          id: p.id,
          slug: p.slug,
          judul: p.judul,
          kategori: p.kategori ?? "",
          gambar: p.gambar_url ?? "",
          target: Number(p.target ?? 0),
          terkumpul: Number(p.terkumpul ?? 0),
          donatur: Number(p.jumlah_donatur ?? 0),
          batas: tanggal(p.batas),
          ringkasan: p.ringkasan ?? "",
          pengelola: p.pengelola ?? "",
          body: json(p.isi, []),
          rincian: json(p.rincian, []),
          /* Pilihan metode pembayaran program; bila kosong, situs memakai semua metode. */
          metode: json(p.metode, []).filter((m) => idAktif.has(m)),
          riwayat: riwayat
            .filter((r) => r.program_id === p.id)
            .map((r) => ({
              id: r.id,
              tanggal: r.tanggal ?? "",
              judul: r.judul,
              keterangan: r.keterangan ?? "",
              jenis: r.jenis === "penyaluran" ? "Penyaluran" : "Laporan",
              nominal: Number(r.nominal ?? 0),
            })),
          donaturTampil: donatur
            .filter((d) => d.program_id === p.id)
            .map((d) => ({
              id: d.id,
              nama: d.nama,
              jumlah: Number(d.jumlah ?? 0),
              metode: d.metode ?? "",
              waktu: d.waktu ?? "",
            })),
        })),
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  const rapikan = (nilai, batas) =>
    typeof nilai === "string" ? nilai.trim().slice(0, batas) : nilai === undefined || nilai === null ? "" : String(nilai).slice(0, batas);

  const angka = (nilai) => {
    const n = Number(String(nilai ?? "").replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  app.post("/api/donasi", async (req, res) => {
    try {
      const b = req.body || {};
      const anonim = b.anonim === true;
      const nama = anonim ? "Hamba Allah" : rapikan(b.nama, 120);
      const telepon = rapikan(b.telepon ?? b.whatsapp, 30);
      const pesan = rapikan(b.pesan, 600);
      const metode = rapikan(b.metode, 60);
      const slug = rapikan(b.program ?? b.slug, 120);
      const jumlah = angka(b.jumlah);

      if (!slug) return res.status(400).json({ pesan: "Program donasi tidak dikenali." });
      if (!anonim && nama.length < 3) return res.status(400).json({ pesan: "Nama lengkap minimal 3 huruf." });
      const digit = telepon.replace(/\D/g, "");
      if (digit.length < 9 || digit.length > 15)
        return res.status(400).json({ pesan: "Nomor WhatsApp minimal 9 angka, contoh 081234567890." });
      if (jumlah < 10000) return res.status(400).json({ pesan: "Nominal donasi minimal Rp10.000." });
      if (jumlah > 5000000000) return res.status(400).json({ pesan: "Nominal donasi terlalu besar." });

      const program = (
        await tanya("select id, slug, judul from donasi_program where (slug = $1 or id = $1) and aktif", [slug])
      ).rows[0];
      if (!program) return res.status(404).json({ pesan: "Program donasi tidak ditemukan atau sudah ditutup." });

      /* Metode dikirim sebagai nama; disimpan juga id-nya bila cocok dengan daftar metode. */
      const metodeBaris = metode
        ? (await tanya("select id, nama from donasi_metode where nama = $1 or id = $1 limit 1", [metode])).rows[0]
        : null;

      const { rows } = await tanya(
        `insert into donasi (program_id, nama, telepon, jumlah, metode_id, metode, pesan, anonim, status)
         values ($1, $2, $3, $4, $5, $6, $7, $8, 'menunggu')
         returning id, dibuat`,
        [program.id, nama, telepon, jumlah, metodeBaris?.id ?? null, metodeBaris?.nama ?? metode ?? null, pesan, anonim],
      );

      res.json({
        ok: true,
        donasi: {
          id: rows[0].id,
          nomor: `DN-${String(rows[0].id).padStart(4, "0")}`,
          dibuat: rows[0].dibuat,
          status: "menunggu",
        },
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });
}

module.exports = pasangRuteDonasi;
