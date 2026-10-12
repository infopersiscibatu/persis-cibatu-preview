// @ts-nocheck
/**
 * Pengganti kecil untuk Express: menerima rute yang sama (app.get/post/put/patch/delete/use)
 * lalu menjalankannya dari satu rute server TanStack. Kode rute lama tidak perlu diubah.
 */

function polaJalur(jalur) {
  const nama = [];
  const re = jalur
    .replace(/\/+$/, "")
    .replace(/[.*+?^${}()|[\]\\]/g, (m) => (m === "$" ? "\\$" : "\\" + m))
    .replace(/:(\w+)(\\\?)?/g, (_m, n, opsional) => {
      nama.push(n);
      return opsional ? "?([^/]*)" : "([^/]+)";
    });
  return { re: new RegExp("^" + re + "/?$"), nama };
}

function express() {
  const lapisan = [];
  const app = {
    disable() {},
    set() {},
    listen() {},
    use(...args) {
      let awalan = "/";
      if (typeof args[0] === "string") awalan = args.shift();
      for (const fn of args.flat()) lapisan.push({ jenis: "use", awalan: awalan.replace(/\/+$/, "") || "/", fn });
      return app;
    },
    lapisan,
  };
  for (const metode of ["get", "post", "put", "patch", "delete", "all"]) {
    app[metode] = (jalur, ...fns) => {
      const pola = polaJalur(jalur);
      for (const fn of fns.flat()) lapisan.push({ jenis: "rute", metode: metode.toUpperCase(), pola, fn });
      return app;
    };
  }
  return app;
}
express.json = () => (_req, _res, next) => next();

export default express;

/** Jalankan permintaan Web (Request) melalui aplikasi tiruan, hasilkan Response. */
export async function layani(app, request) {
  const url = new URL(request.url);
  const metode = request.method.toUpperCase();
  let body = {};
  if (!["GET", "HEAD"].includes(metode)) {
    const teks = await request.text();
    if (teks) {
      try {
        body = JSON.parse(teks);
      } catch {
        return Response.json({ pesan: "Format permintaan tidak dikenali." }, { status: 400 });
      }
    }
  }
  const query = {};
  url.searchParams.forEach((v, k) => {
    if (k in query) query[k] = [].concat(query[k], v);
    else query[k] = v;
  });

  const req = {
    method: metode,
    url: url.pathname + url.search,
    originalUrl: url.pathname + url.search,
    path: url.pathname,
    query,
    body,
    params: {},
    headers: Object.fromEntries(request.headers),
    ip: request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "",
    get(nama) {
      return request.headers.get(nama) ?? undefined;
    },
    header(nama) {
      return request.headers.get(nama) ?? undefined;
    },
  };

  return await new Promise((selesai) => {
    let status = 200;
    const kepala = new Headers();
    let sudah = false;
    const akhiri = (isi, tipe) => {
      if (sudah) return;
      sudah = true;
      if (tipe && !kepala.has("content-type")) kepala.set("content-type", tipe);
      selesai(new Response(isi, { status, headers: kepala }));
    };
    const res = {
      get headersSent() {
        return sudah;
      },
      status(s) {
        status = s;
        return res;
      },
      set(k, v) {
        if (typeof k === "object") for (const [a, b] of Object.entries(k)) kepala.set(a, String(b));
        else kepala.set(k, String(v));
        return res;
      },
      setHeader(k, v) {
        kepala.set(k, String(v));
        return res;
      },
      header(k, v) {
        return res.set(k, v);
      },
      type(t) {
        kepala.set("content-type", t);
        return res;
      },
      json(data) {
        akhiri(JSON.stringify(data ?? null), "application/json; charset=utf-8");
        return res;
      },
      send(data) {
        if (data !== null && typeof data === "object" && !(data instanceof Uint8Array)) return res.json(data);
        akhiri(data ?? "", "text/html; charset=utf-8");
        return res;
      },
      sendStatus(s) {
        status = s;
        akhiri(String(s), "text/plain");
        return res;
      },
      end(data) {
        akhiri(data ?? null);
        return res;
      },
      redirect(a, b) {
        const tujuan = typeof a === "number" ? b : a;
        status = typeof a === "number" ? a : 302;
        kepala.set("location", tujuan);
        akhiri(null);
      },
    };

    const jalur = url.pathname.replace(/\/+$/, "") || "/";
    let i = 0;
    const lanjut = (galat) => {
      if (sudah) return;
      while (i < app.lapisan.length) {
        const l = app.lapisan[i++];
        if (l.jenis === "use") {
          if (!(l.awalan === "/" || jalur === l.awalan || jalur.startsWith(l.awalan + "/"))) continue;
          const tanganiGalat = l.fn.length === 4;
          if (galat && !tanganiGalat) continue;
          if (!galat && tanganiGalat) continue;
          return jalankan(() => (galat ? l.fn(galat, req, res, lanjut) : l.fn(req, res, lanjut)));
        }
        if (galat) continue;
        if (l.metode !== "ALL" && l.metode !== metode) continue;
        const cocok = jalur.match(l.pola.re);
        if (!cocok) continue;
        req.params = {};
        l.pola.nama.forEach((n, k) => {
          req.params[n] = cocok[k + 1] !== undefined ? decodeURIComponent(cocok[k + 1]) : undefined;
        });
        return jalankan(() => l.fn(req, res, lanjut));
      }
      if (galat) {
        console.error("Kesalahan permintaan:", galat);
        status = 500;
        return res.json({ pesan: "Terjadi kesalahan pada layanan." });
      }
      status = 404;
      res.json({ pesan: "Alamat tidak ditemukan." });
    };
    const jalankan = (f) => {
      try {
        const h = f();
        if (h && typeof h.then === "function") h.catch((e) => lanjut(e || new Error("galat")));
      } catch (e) {
        lanjut(e);
      }
    };
    lanjut();
  });
}
