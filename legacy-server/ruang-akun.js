/**
 * Sistem akses PC PERSIS Cibatu.
 *
 * 1. Panel admin (pengurus pusat) — masuk memakai PIN panel, mis. 8081.
 * 2. Admin unit tiap sekolah — satu PIN untuk satu sekolah, dipakai masuk ke
 *    halaman SPMB, Sekolah, dan Tata Usaha sekolah tersebut.
 * 3. Admin ZIS — satu PIN untuk lembaga (bukan per sekolah).
 *
 * Bagian rute dipasang terpisah di server/index.js:
 *   pasangRuteLogin       → rute masuk/keluar/saya panel + penjaga sesi /api/admin
 *   pasangRuteUnit        → tabel admin unit per sekolah + pengaturan ZIS (dijaga)
 *   pasangRuteLoginUnit   → masuk halaman unit memakai PIN + sesi unit
 */

const crypto = require("crypto");
const { istilahUntukJenjang } = require("./lib/istilah");

/** PIN bawaan panel admin saat pertama kali dijalankan. */
const PIN_BAWAAN = "8081";
const MASA_SESI_HARI = 7;
const MASA_SESI_UNIT_JAM = 12;

/** Unit yang tercakup dalam satu PIN sekolah. */
const AKSES_SEKOLAH = ["spmb", "sekolah", "tata-usaha"];

const ITERASI = 120000;

function acakSandi(sandi) {
  const garam = crypto.randomBytes(16).toString("hex");
  const kunci = crypto.pbkdf2Sync(String(sandi), garam, ITERASI, 32, "sha256").toString("hex");
  return `pbkdf2$${ITERASI}$${garam}$${kunci}`;
}

function cocokSandi(sandi, simpanan) {
  if (!simpanan) return false;
  const bagian = String(simpanan).split("$");
  if (bagian.length !== 4 || bagian[0] !== "pbkdf2") return false;
  const iterasi = Number(bagian[1]);
  const garam = bagian[2];
  const kunci = bagian[3];
  if (!iterasi || !garam || !kunci) return false;
  const uji = crypto.pbkdf2Sync(String(sandi), garam, iterasi, 32, "sha256").toString("hex");
  const a = Buffer.from(uji, "hex");
  const b = Buffer.from(kunci, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

const acakId = (awalan) => `${awalan}-${crypto.randomBytes(4).toString("hex")}`;
const acakToken = () => crypto.randomBytes(32).toString("hex");
const acakPin = () => String(Math.floor(Math.random() * 9000) + 1000);

const tokenDari = (req, header = "x-sesi-admin") => String(req.get(header) ?? "").trim();
const rapikanPin = (nilai) => String(nilai ?? "").trim();
const benarPin = (pin) => /^\d{4,8}$/.test(pin);

/* ------------------------------- bagians login ------------------------------ */

function pasangRuteLogin(app, { tanya }) {
  const satu = async (sql, nilai = []) => (await tanya(sql, nilai)).rows[0] ?? null;

  /** Akun admin bawaan dengan PIN 8081 bila panel belum punya akun admin. */
  const siapkanAkses = async () => {
    const ada = await satu("select id from pengguna where peran = 'admin' limit 1");
    if (ada) return { dibuat: false };
    await tanya(
      `insert into pengguna (id, nama, nama_pengguna, kata_sandi_hash, peran)
       values ($1, $2, $3, $4, 'admin') on conflict (id) do nothing`,
      [acakId("pg"), "Administrator", "admin", acakSandi(PIN_BAWAAN)],
    );
    return { dibuat: true, pin: PIN_BAWAAN };
  };

  /** Rute yang boleh dibuka tanpa sesi panel. */
  const TERBUKA = new Set(["/masuk", "/keluar", "/saya"]);

  /** Setiap permintaan lain di bawah /api/admin wajib menyertakan token sesi. */
  const penjagaSesi = (req, res, next) => {
    const jalur =
      String(req.originalUrl || req.url || "")
        .split("?")[0]
        .replace(/^\/api\/admin/, "")
        .replace(/\/+$/, "") || "/";
    if (TERBUKA.has(jalur)) return next();

    const token = tokenDari(req);
    if (!token) return res.status(401).json({ pesan: "Sesi tidak ditemukan. Silakan masuk dengan PIN." });

    tanya(
      `select s.token, p.id, p.nama, p.peran
         from sesi s join pengguna p on p.id = s.pengguna_id
        where s.token = $1 and s.kedaluwarsa > now()`,
      [token],
    )
      .then(({ rows }) => {
        if (rows.length === 0) return res.status(401).json({ pesan: "Sesi sudah berakhir. Silakan masuk kembali." });
        req.akses = rows[0];
        next();
      })
      .catch((e) => res.status(500).json({ pesan: e.message }));
  };

  app.post("/api/admin/masuk", async (req, res) => {
    try {
      const pin = rapikanPin(req.body?.pin);
      if (!pin) return res.status(400).json({ pesan: "PIN belum diisi." });

      const kandidat = (
        await tanya(
          `select id, nama, kata_sandi_hash from pengguna
            where peran = 'admin' and aktif order by dibuat limit 5`,
        )
      ).rows;
      const cocok = kandidat.find((p) => cocokSandi(pin, p.kata_sandi_hash));
      if (!cocok) return res.status(401).json({ pesan: "PIN salah. Coba periksa kembali." });

      const token = acakToken();
      await tanya(
        `insert into sesi (token, pengguna_id, kedaluwarsa, alamat_ip, agen)
         values ($1, $2, now() + ($3 || ' days')::interval, $4, $5)`,
        [
          token,
          cocok.id,
          String(MASA_SESI_HARI),
          String(req.ip ?? "").slice(0, 60),
          String(req.get("user-agent") ?? "").slice(0, 200),
        ],
      );
      await tanya("update pengguna set terakhir_masuk = now() where id = $1", [cocok.id]);
      res.json({ ok: true, token, nama: cocok.nama });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/admin/keluar", async (req, res) => {
    try {
      const token = tokenDari(req);
      if (token) await tanya("delete from sesi where token = $1", [token]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  /**
   * Ganti PIN panel admin. PIN lama wajib benar; PIN baru 4–8 angka. Setelah berhasil,
   * sesi di perangkat lain ditutup supaya PIN lama benar-benar tidak berlaku lagi.
   */
  app.post("/api/admin/pin", async (req, res) => {
    try {
      const token = tokenDari(req);
      if (!token) return res.status(401).json({ pesan: "Sesi tidak dikenali. Masuk kembali." });

      const sesi = await satu(
        `select p.id as pengguna_id, p.kata_sandi_hash
           from sesi s
           join pengguna p on p.id = s.pengguna_id
          where s.token = $1 and s.kedaluwarsa > now() and p.peran = 'admin' and p.aktif`,
        [token],
      );
      if (!sesi) return res.status(401).json({ pesan: "Sesi sudah berakhir. Masuk kembali." });

      const lama = rapikanPin(req.body?.lama);
      const baru = rapikanPin(req.body?.baru);
      const ulang = rapikanPin(req.body?.ulang);

      if (!cocokSandi(lama, sesi.kata_sandi_hash))
        return res.status(400).json({ pesan: "PIN lama tidak sesuai." });
      if (!benarPin(baru)) return res.status(400).json({ pesan: "PIN baru harus 4 sampai 8 angka." });
      if (baru !== ulang) return res.status(400).json({ pesan: "Ulangi PIN baru dengan tepat." });
      if (baru === lama) return res.status(400).json({ pesan: "PIN baru masih sama dengan PIN lama." });

      await tanya("update pengguna set kata_sandi_hash = $2 where id = $1", [sesi.pengguna_id, acakSandi(baru)]);
      await tanya("delete from sesi where pengguna_id = $1 and token <> $2", [sesi.pengguna_id, token]);

      res.json({ ok: true, pesan: "PIN panel admin sudah diperbarui. Sesi di perangkat lain ditutup." });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.get("/api/admin/saya", async (req, res) => {
    try {
      const token = tokenDari(req);
      if (!token) return res.json({ ok: true, masuk: false });
      const akun = await satu(
        `select p.nama, p.peran from sesi s join pengguna p on p.id = s.pengguna_id
          where s.token = $1 and s.kedaluwarsa > now()`,
        [token],
      );
      if (!akun) return res.json({ ok: true, masuk: false });
      res.json({ ok: true, masuk: true, nama: akun.nama, peran: akun.peran });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  return { penjagaSesi, siapkanAkses };
}

/* -------------------------- admin unit tiap sekolah ------------------------ */

function pasangRuteUnit(app, { tanya }) {
  const satu = async (sql, nilai = []) => (await tanya(sql, nilai)).rows[0] ?? null;

  const bacaPengaturanZis = async () => {
    const baris = await satu("select nilai from pengaturan where kunci = 'admin_zis'");
    const nilai = baris?.nilai ?? {};
    return {
      pin: String(nilai.pin ?? ""),
      nama: String(nilai.nama ?? ""),
      aktif: nilai.aktif !== false,
    };
  };

  const simpanPengaturanZis = async (nilai) => {
    await tanya(
      `insert into pengaturan (kunci, nilai, kelompok) values ('admin_zis', $1::jsonb, 'sistem')
       on conflict (kunci) do update set nilai = excluded.nilai`,
      [JSON.stringify(nilai)],
    );
    return bacaPengaturanZis();
  };

  const daftarSekolah = async () => {
    /* Sekolah yang belum punya baris langsung didaftarkan agar tabel tetap lengkap. */
    await tanya(
      `insert into admin_unit_sekolah (unit_id, pin)
       select u.id, lpad((floor(random() * 9000) + 1000)::int::text, 4, '0')
         from unit_pendidikan u
        where not exists (select 1 from admin_unit_sekolah a where a.unit_id = u.id)`,
    );

    const { rows } = await tanya(
      `select u.id, u.nama, u.aktif as unit_aktif, j.singkatan, j.nama as jenjang_nama,
              a.pin, a.aktif, a.admin_spmb, a.admin_sekolah, a.admin_tu
         from admin_unit_sekolah a
         join unit_pendidikan u on u.id = a.unit_id
         left join jenjang j on j.id = u.jenjang_id
        order by j.urutan nulls last, u.nama`,
    );
    return rows.map((r) => ({
      unitId: r.id,
      nama: r.nama,
      jenjang: r.singkatan ?? r.jenjang_nama ?? "-",
      pin: r.pin,
      adminSpmb: r.admin_spmb ?? "",
      adminSekolah: r.admin_sekolah ?? "",
      adminTu: r.admin_tu ?? "",
      aktif: r.aktif !== false && r.unit_aktif !== false,
    }));
  };

  const jawabSekolah = async (res) => {
    const sekolah = await daftarSekolah();
    res.json({
      ok: true,
      sekolah,
      ringkasan: { total: sekolah.length, aktif: sekolah.filter((s) => s.aktif).length },
      akses: AKSES_SEKOLAH,
    });
  };

  /** PIN dipakai bersama ZIS, jadi harus unik di seluruh sekolah dan ZIS. */
  const pinTerpakai = async (pin, kecualiUnit = null) => {
    const sekolah = await satu(
      "select unit_id from admin_unit_sekolah where pin = $1 and ($2::text is null or unit_id <> $2) limit 1",
      [pin, kecualiUnit],
    );
    if (sekolah) return true;
    const zis = await bacaPengaturanZis();
    return zis.pin === pin;
  };

  app.get("/api/admin/unit-sekolah", async (_req, res) => {
    try {
      await jawabSekolah(res);
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/admin/unit-sekolah/:unitId", async (req, res) => {
    try {
      const ada = await satu("select unit_id from admin_unit_sekolah where unit_id = $1", [req.params.unitId]);
      if (!ada) return res.status(404).json({ pesan: "Sekolah tidak ditemukan pada tabel admin unit." });

      const adminSpmb = String(req.body?.adminSpmb ?? "").trim().slice(0, 80);
      const adminSekolah = String(req.body?.adminSekolah ?? "").trim().slice(0, 80);
      const adminTu = String(req.body?.adminTu ?? "").trim().slice(0, 80);
      const aktif = req.body?.aktif !== false;

      await tanya(
        `update admin_unit_sekolah
            set admin_spmb = $2, admin_sekolah = $3, admin_tu = $4, aktif = $5, diperbarui = now()
          where unit_id = $1`,
        [ada.unit_id, adminSpmb, adminSekolah, adminTu, aktif],
      );
      await jawabSekolah(res);
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/admin/unit-sekolah/:unitId/pin", async (req, res) => {
    try {
      const ada = await satu("select unit_id from admin_unit_sekolah where unit_id = $1", [req.params.unitId]);
      if (!ada) return res.status(404).json({ pesan: "Sekolah tidak ditemukan pada tabel admin unit." });

      const diminta = rapikanPin(req.body?.pin);
      if (diminta && !benarPin(diminta)) return res.status(400).json({ pesan: "PIN harus berupa 4 sampai 8 angka." });

      let pin = diminta;
      if (pin) {
        if (await pinTerpakai(pin, ada.unit_id))
          return res.status(409).json({ pesan: `PIN ${pin} sudah dipakai sekolah atau Admin ZIS lain.` });
      } else {
        let percobaan = 0;
        do {
          pin = acakPin();
          percobaan += 1;
        } while ((await pinTerpakai(pin, ada.unit_id)) && percobaan < 40);
      }

      await tanya("update admin_unit_sekolah set pin = $2, diperbarui = now() where unit_id = $1", [ada.unit_id, pin]);
      await tanya("delete from sesi_unit where unit_id = $1", [ada.unit_id]);
      const sekolah = await daftarSekolah();
      res.json({ ok: true, pin, sekolah, ringkasan: { total: sekolah.length, aktif: sekolah.filter((s) => s.aktif).length }, akses: AKSES_SEKOLAH });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.get("/api/admin/zis", async (_req, res) => {
    try {
      res.json({ ok: true, zis: await bacaPengaturanZis() });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.put("/api/admin/zis", async (req, res) => {
    try {
      const sekarang = await bacaPengaturanZis();
      const nama = String(req.body?.nama ?? "").trim().slice(0, 80);
      const aktif = req.body?.aktif !== false;
      res.json({ ok: true, zis: await simpanPengaturanZis({ ...sekarang, nama, aktif }) });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/admin/zis/pin", async (req, res) => {
    try {
      const sekarang = await bacaPengaturanZis();
      const diminta = rapikanPin(req.body?.pin);
      if (diminta && !benarPin(diminta)) return res.status(400).json({ pesan: "PIN harus berupa 4 sampai 8 angka." });

      let pin = diminta;
      if (pin) {
        const terpakaiSekolah = await satu("select unit_id from admin_unit_sekolah where pin = $1 limit 1", [pin]);
        if (terpakaiSekolah) return res.status(409).json({ pesan: `PIN ${pin} sudah dipakai Admin Unit sekolah.` });
      } else {
        let percobaan = 0;
        do {
          pin = acakPin();
          percobaan += 1;
        } while ((await pinTerpakai(pin)) && percobaan < 40);
      }

      const zis = await simpanPengaturanZis({ ...sekarang, pin });
      await tanya("delete from sesi_unit where kode = 'zis'");
      res.json({ ok: true, zis });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });
}

/* --------------------- masuk halaman unit (hanya PIN) --------------------- */

function pasangRuteLoginUnit(app, { tanya }) {
  const satu = async (sql, nilai = []) => (await tanya(sql, nilai)).rows[0] ?? null;

  /** Rute unit yang boleh dibuka tanpa sesi. */
  const TERBUKA = new Set(["/masuk", "/keluar", "/saya"]);

  /** Setiap permintaan lain di bawah /api/unit wajib membawa sesi unit. */
  const penjagaUnit = (req, res, next) => {
    const jalur =
      String(req.originalUrl || req.url || "")
        .split("?")[0]
        .replace(/^\/api\/unit/, "")
        .replace(/\/+$/, "") || "/";
    if (TERBUKA.has(jalur)) return next();

    const token = tokenDari(req, "x-sesi-unit");
    if (!token) return res.status(401).json({ pesan: "Sesi tidak ditemukan. Silakan masuk dengan PIN sekolah." });

    tanya(
      `select s.token, s.kode, s.unit_id, s.kedaluwarsa, u.nama, j.singkatan
         from sesi_unit s
         left join unit_pendidikan u on u.id = s.unit_id
         left join jenjang j on j.id = u.jenjang_id
        where s.token = $1 and s.kedaluwarsa > now()`,
      [token],
    )
      .then(({ rows }) => {
        if (rows.length === 0) return res.status(401).json({ pesan: "Sesi sudah berakhir. Silakan masuk kembali." });
        req.unit = rows[0];
        next();
      })
      .catch((e) => res.status(500).json({ pesan: e.message }));
  };

  app.post("/api/unit/masuk", async (req, res) => {
    try {
      const pin = rapikanPin(req.body?.pin);
      if (!benarPin(pin)) return res.status(400).json({ pesan: "PIN harus berupa 4 sampai 8 angka." });

      const sekolah = await satu(
        `select u.id, u.nama, j.singkatan, j.slug as jenjang_slug, j.nama as jenjang_nama
           from admin_unit_sekolah a
           join unit_pendidikan u on u.id = a.unit_id
           left join jenjang j on j.id = u.jenjang_id
          where a.pin = $1 and a.aktif and u.aktif`,
        [pin],
      );

      if (sekolah) {
        const token = acakToken();
        await tanya(
          `insert into sesi_unit (token, unit_id, kode, kedaluwarsa)
           values ($1, $2, 'sekolah', now() + ($3 || ' hours')::interval)`,
          [token, sekolah.id, String(MASA_SESI_UNIT_JAM)],
        );
        return res.json({
          ok: true,
          token,
          jenis: "sekolah",
          unit: { id: sekolah.id, nama: sekolah.nama, jenjang: sekolah.singkatan ?? "-" },
          /* Penyebutan mengikuti jenjang sekolah ini: sekolah/madrasah atau kampus. */
          istilah: istilahUntukJenjang({ slug: sekolah.jenjang_slug, nama: sekolah.jenjang_nama }),
          akses: AKSES_SEKOLAH,
        });
      }

      const zis = await satu("select nilai from pengaturan where kunci = 'admin_zis'");
      const nilai = zis?.nilai ?? {};
      if (String(nilai.pin ?? "") === pin && nilai.aktif !== false) {
        const token = acakToken();
        await tanya(
          `insert into sesi_unit (token, kode, kedaluwarsa)
           values ($1, 'zis', now() + ($2 || ' hours')::interval)`,
          [token, String(MASA_SESI_UNIT_JAM)],
        );
        return res.json({
          ok: true,
          token,
          jenis: "zis",
          unit: null,
          /* Nama petugas ZIS dipakai sebagai judul pada kepala halaman Admin ZIS. */
          nama: String(nilai.nama ?? "").trim(),
          akses: ["zis"],
        });
      }

      res.status(401).json({ pesan: "PIN tidak dikenali. Hubungi pengurus PC PERSIS Cibatu." });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.post("/api/unit/keluar", async (req, res) => {
    try {
      const token = tokenDari(req, "x-sesi-unit");
      if (token) await tanya("delete from sesi_unit where token = $1", [token]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  app.get("/api/unit/saya", async (req, res) => {
    try {
      const token = tokenDari(req, "x-sesi-unit");
      if (!token) return res.json({ ok: true, masuk: false });
      const sesi = await satu(
        `select s.kode, s.unit_id, u.nama, j.singkatan, j.slug as jenjang_slug, j.nama as jenjang_nama
           from sesi_unit s
           left join unit_pendidikan u on u.id = s.unit_id
           left join jenjang j on j.id = u.jenjang_id
          where s.token = $1 and s.kedaluwarsa > now()`,
        [token],
      );
      if (!sesi) return res.json({ ok: true, masuk: false });
      /* Sesi ZIS tidak terikat sekolah, jadi namanya diambil dari pengaturan ZIS. */
      let namaZis = "";
      if (sesi.kode === "zis") {
        const pengaturan = await satu("select nilai from pengaturan where kunci = 'admin_zis'");
        namaZis = String(pengaturan?.nilai?.nama ?? "").trim();
      }
      res.json({
        ok: true,
        masuk: true,
        jenis: sesi.kode,
        nama: namaZis,
        unit: sesi.unit_id ? { id: sesi.unit_id, nama: sesi.nama, jenjang: sesi.singkatan ?? "-" } : null,
        istilah: istilahUntukJenjang({ slug: sesi.jenjang_slug, nama: sesi.jenjang_nama }),
        akses: sesi.kode === "zis" ? ["zis"] : AKSES_SEKOLAH,
      });
    } catch (e) {
      res.status(500).json({ pesan: e.message });
    }
  });

  return { penjagaUnit };
}

module.exports = { pasangRuteLogin, pasangRuteUnit, pasangRuteLoginUnit, AKSES_SEKOLAH };
