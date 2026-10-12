import { useState } from "react";
import JudulSeksi from "../components/JudulSeksi";
import PopupKirim from "../components/PopupKirim";
import { Icon } from "../components/Icons";
import { unitJenjangDari, useJenjang } from "../lib/jenjang";
import { ISIAN_TAMBAHAN, KETERANGAN_ISIAN, kirimPendaftaran, nomorTerbaca, tautanWhatsapp, useSpmb } from "../lib/spmb";

const ikon = "h-[18px] w-[18px]";

type Isian = {
  nama: string;
  jenjang: string;
  unit: string;
  jurusan: string;
  wali: string;
  wa: string;
  alamat: string;
  asal_sekolah: string;
  tempat_lahir: string;
  email: string;
};
type Galat = Partial<Record<keyof Isian, string>>;

export function HalamanSpmb() {
  const data = useJenjang();
  const spmb = useSpmb();
  const halaman = spmb.halaman;
  const formulir = spmb.formulir;
  const waLink = tautanWhatsapp(formulir.waAdmin);
  const waTeks = nomorTerbaca(formulir.waAdmin);
  const [isian, setIsian] = useState<Isian>({
    nama: "",
    jenjang: "",
    unit: "",
    jurusan: "",
    wali: "",
    wa: "",
    alamat: "",
    asal_sekolah: "",
    tempat_lahir: "",
    email: "",
  });
  const [galat, setGalat] = useState<Galat>({});
  const [terkirim, setTerkirim] = useState(false);
  const [pesanWa, setPesanWa] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [pesanGalat, setPesanGalat] = useState("");
  const [nomorDaftar, setNomorDaftar] = useState("");

  const jenjangPilih = data.jenjang.find((j) => j.slug === isian.jenjang);
  const istilah = jenjangPilih?.istilah;
  const labelPeserta = `Nama calon ${(istilah?.peserta ?? "Peserta didik").toLowerCase()}`;
  const sebutanUnit = istilah?.unit ?? "sekolah";
  const labelUnit = `${sebutanUnit.charAt(0).toUpperCase()}${sebutanUnit.slice(1)} yang dituju`;
  const labelJurusan = istilah?.jurusan ?? "Jurusan";
  const daftarUnit = jenjangPilih ? unitJenjangDari(data.unit, jenjangPilih.slug) : [];
  const daftarJurusan = jenjangPilih ? data.jurusan.filter((p) => p.jenjangSlug === jenjangPilih.slug) : [];
  /* isian.jurusan menyimpan slug program; namanya dipakai untuk ditampilkan. */
  const namaJurusan = daftarJurusan.find((p) => p.slug === isian.jurusan)?.nama ?? isian.jurusan;
  /* Narahubung layanan berasal dari tabel kontak_unit (menu SPMB → Layanan Informasi). */
  const narahubung = spmb.layanan.filter((l) => l.aktif);

  const ubah = (kunci: keyof Isian, nilai: string) => {
    setIsian((s) => ({ ...s, [kunci]: nilai }));
    setGalat((s) => ({ ...s, [kunci]: undefined }));
    setTerkirim(false);
  };

  const pilihJenjang = (nilai: string) => {
    setIsian((s) => ({ ...s, jenjang: nilai, unit: "", jurusan: "" }));
    setGalat((s) => ({ ...s, jenjang: undefined, unit: undefined, jurusan: undefined }));
    setTerkirim(false);
  };

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mengirim) return;
    const baru: Galat = {};
    if (!isian.nama.trim()) baru.nama = `${labelPeserta} wajib diisi.`;
    if (!isian.jenjang) baru.jenjang = "Jenjang yang dituju wajib dipilih.";
    if (!isian.unit) baru.unit = `${labelUnit} wajib dipilih.`;
    if (daftarJurusan.length > 0 && !isian.jurusan) baru.jurusan = `${labelJurusan} wajib dipilih.`;
    if (!isian.wali.trim()) baru.wali = "Nama orang tua / wali wajib diisi.";
    if (isian.wa.trim()) {
      if (isian.wa.replace(/\D/g, "").length < 9) baru.wa = "Nomor WhatsApp belum lengkap.";
    for (const pilihan of ISIAN_TAMBAHAN) {
      const sifat = formulir.isian[pilihan.kunci];
      if (sifat?.tampil && sifat.wajib && !isian[pilihan.kunci].trim()) {
        baru[pilihan.kunci] = `${pilihan.label} wajib diisi.`;
      }
    }
    } else {
      baru.wa = "Nomor WhatsApp aktif wajib diisi.";
    }
    setGalat(baru);
    if (Object.keys(baru).length > 0) return;

    /* Pendaftaran dikirim ke server, supaya petugas sekolah bisa memverifikasinya. */
    setPesanGalat("");
    setMengirim(true);
    try {
      const jawab = await kirimPendaftaran({
        nama: isian.nama.trim(),
        jenjangSlug: jenjangPilih?.slug ?? isian.jenjang,
        unitId: data.unit.find((u) => u.nama === isian.unit && u.jenjangSlug === jenjangPilih?.slug)?.id ?? "",
        wali: isian.wali.trim(),
        wa: isian.wa.trim(),
        alamat: isian.alamat.trim(),
        asalSekolah: isian.asal_sekolah.trim(),
        tempatLahir: isian.tempat_lahir.trim(),
        email: isian.email.trim(),
        /* Jurusan yang dipilih ikut dikirim, supaya terisi pada data siswa/mahasiswa. */
        program: isian.jurusan,
      });
      setNomorDaftar(jawab.nomor);
    } catch (galatKirim) {
      setMengirim(false);
      setPesanGalat(galatKirim instanceof Error ? galatKirim.message : "Pendaftaran belum bisa dikirim.");
      return;
    }
    setMengirim(false);

    setPesanWa(
      [
        formulir.pesanPembuka,
        "",
        nomorDaftar ? `Nomor pendaftaran: ${nomorDaftar}` : "",
        `${labelPeserta}: ${isian.nama}`,
        `Jenjang yang dituju: ${jenjangPilih?.nama ?? isian.jenjang}`,
        `${labelUnit}: ${isian.unit}`,
        ...(namaJurusan ? [`${labelJurusan}: ${namaJurusan}`] : []),
        `Nama orang tua/wali: ${isian.wali}`,
        `Nomor WhatsApp: ${isian.wa}`,
        ...ISIAN_TAMBAHAN.filter((p) => formulir.isian[p.kunci]?.tampil && isian[p.kunci].trim()).map(
          (p) => `${p.label}: ${isian[p.kunci]}`,
        ),
      ].join("\n"),
    );
    setTerkirim(true);
  };

  return (
    <main data-testid="ppdb-page">
      <section aria-label="Gambar SPMB" className="relative h-[208px] w-full">
        <img
          src={spmb.gambar.url}
          alt={spmb.gambar.alt}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-persis-950/95 via-persis-950/55 to-persis-950/15" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-5 text-center">
          <p className="text-[9px] font-bold tracking-[0.2em] text-gold-300 uppercase">PC PERSIS Cibatu</p>
          <h1 className="mt-1.5 text-[20px] leading-tight font-extrabold text-white">{halaman.judul || "SPMB"}</h1>
          <p className="mt-1.5 text-[10px] font-semibold tracking-[0.16em] text-white/70 uppercase">
            Sistem Penerimaan Murid &amp; Mahasiswa Baru
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label="Pengantar SPMB" className="px-5 pt-6">
          <p className="text-justify text-[12.5px] leading-relaxed text-ink-600">{halaman.pengantar}</p>
        </section>

        <section aria-label="Gelombang pendaftaran" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="calendar" className={ikon} />}
            eyebrow="Jadwal Pendaftaran"
            title="Gelombang & Kuota"
            actionLabel={null}
          />
          <ul className="space-y-3">
            {spmb.gelombang.map((g) => (
              <li key={g.id}>
                <article className="card-elev w-full rounded-2xl p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-[13px] leading-snug font-extrabold text-ink-900">{g.nama}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-[10.5px] font-medium text-ink-600">
                        <Icon name="calendar" className="h-3 w-3 text-gold-600" />
                        {g.periode}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-[3px] text-[8.5px] font-extrabold tracking-[0.1em] uppercase ${
                        g.status === "Dibuka" ? "bg-mint-deep text-persis-800" : "bg-pastelgold text-gold-700"
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>
                  <p className="mt-2.5 flex items-center justify-between border-t border-black/[0.06] pt-2.5 text-[11px] text-ink-600">
                    <span>Kuota {g.kuota}</span>
                    <span className="font-semibold text-persis-800">{g.sisa}</span>
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Biaya pendaftaran" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="clipboard" className={ikon} />}
            eyebrow="Administrasi"
            title="Biaya Pendaftaran"
            tone="gold"
            actionLabel={null}
          />
          <ul className="card-elev divide-y divide-black/[0.06] overflow-hidden rounded-2xl">
            {spmb.biaya.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
                <span className="text-[11.5px] text-ink-600">{b.label}</span>
                <span className="shrink-0 text-[12px] font-bold text-persis-800">{b.nilai}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Formulir pendaftaran" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="whatsapp" className={ikon} />}
            eyebrow="Daftar Daring"
            title={formulir.judul}
            actionLabel={null}
          />
          {!formulir.aktif ? (
            <p
              data-testid="ppdb-form-tutup"
              className="flex gap-2.5 rounded-2xl border border-gold-400/40 border-l-[3px] border-l-gold-500 bg-cream-100 p-4 text-justify text-[11.5px] leading-relaxed text-ink-600"
            >
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
              <span>{formulir.pesanTutup}</span>
            </p>
          ) : null}

          {formulir.aktif ? (
          <form onSubmit={kirim} noValidate className="card-elev space-y-4 rounded-2xl p-4">
            <div>
              <label className="field-label" htmlFor="ppdb-nama">
                {labelPeserta} <span className="text-gold-600">*</span>
              </label>
              <input
                id="ppdb-nama"
                className="field-input"
                value={isian.nama}
                onChange={(e) => ubah("nama", e.target.value)}
                placeholder="Nama lengkap"
                aria-invalid={galat.nama ? "true" : undefined}
              />
              {galat.nama ? <p className="field-error">{galat.nama}</p> : null}
            </div>

            <div>
              <label className="field-label" htmlFor="ppdb-jenjang">
                Jenjang yang dituju <span className="text-gold-600">*</span>
              </label>
              <select
                id="ppdb-jenjang"
                className="field-input"
                value={isian.jenjang}
                onChange={(e) => pilihJenjang(e.target.value)}
                aria-invalid={galat.jenjang ? "true" : undefined}
              >
                <option value="">Pilih jenjang</option>
                {data.jenjang.map((j) => (
                  <option key={j.id} value={j.slug}>
                    {j.short} — {j.nama}
                  </option>
                ))}
              </select>
              {galat.jenjang ? (
                <p className="field-error">{galat.jenjang}</p>
              ) : (
                <p className="field-hint">
                  {data.jenjang.length} jenjang tersedia, termasuk MDT. Setelah jenjang dipilih, muncul daftar sekolah,
                  madrasah, atau kampus yang bisa dituju.
                </p>
              )}
            </div>

            {daftarUnit.length > 0 ? (
              <div data-testid="ppdb-unit-field">
                <label className="field-label" htmlFor="ppdb-unit">
                  {labelUnit} <span className="text-gold-600">*</span>
                </label>
                <select
                  id="ppdb-unit"
                  className="field-input"
                  value={isian.unit}
                  onChange={(e) => ubah("unit", e.target.value)}
                  aria-invalid={galat.unit ? "true" : undefined}
                >
                  <option value="">Pilih {sebutanUnit}</option>
                  {daftarUnit.map((u) => (
                    <option key={u.id} value={u.nama}>
                      {u.nama}
                    </option>
                  ))}
                </select>
                {galat.unit ? (
                  <p className="field-error">{galat.unit}</p>
                ) : (
                  <p className="field-hint">
                    {daftarUnit.length} {sebutanUnit} di {jenjangPilih?.short}.
                  </p>
                )}
              </div>
            ) : null}

            {daftarJurusan.length > 0 ? (
              <div data-testid="ppdb-jurusan-field">
                <label className="field-label" htmlFor="ppdb-jurusan">
                  {labelJurusan} yang dipilih <span className="text-gold-600">*</span>
                </label>
                <select
                  id="ppdb-jurusan"
                  className="field-input"
                  value={isian.jurusan}
                  onChange={(e) => ubah("jurusan", e.target.value)}
                  aria-invalid={galat.jurusan ? "true" : undefined}
                >
                  <option value="">Pilih {labelJurusan.toLowerCase()}</option>
                  {daftarJurusan.map((j) => (
                    <option key={j.id} value={j.slug}>
                      {j.nama}
                    </option>
                  ))}
                </select>
                {galat.jurusan ? (
                  <p className="field-error">{galat.jurusan}</p>
                ) : (
                  <p className="field-hint">
                    {jenjangPilih?.short} membuka {daftarJurusan.map((p) => p.short).join(" dan ")}.
                  </p>
                )}
              </div>
            ) : null}

            <div>
              <label className="field-label" htmlFor="ppdb-wali">
                Nama orang tua / wali <span className="text-gold-600">*</span>
              </label>
              <input
                id="ppdb-wali"
                className="field-input"
                value={isian.wali}
                onChange={(e) => ubah("wali", e.target.value)}
                placeholder="Nama orang tua atau wali"
                aria-invalid={galat.wali ? "true" : undefined}
              />
              {galat.wali ? <p className="field-error">{galat.wali}</p> : null}
            </div>

            <div>
              <label className="field-label" htmlFor="ppdb-wa">
                Nomor WhatsApp aktif <span className="text-gold-600">*</span>
              </label>
              <input
                id="ppdb-wa"
                type="tel"
                inputMode="tel"
                className="field-input"
                value={isian.wa}
                onChange={(e) => ubah("wa", e.target.value)}
                placeholder="08xx xxxx xxxx"
                aria-invalid={galat.wa ? "true" : undefined}
              />
              {galat.wa ? <p className="field-error">{galat.wa}</p> : null}
            </div>

            {ISIAN_TAMBAHAN.filter((p) => formulir.isian[p.kunci]?.tampil).map((p) => (
              <div key={p.kunci}>
                <label className="field-label" htmlFor={`ppdb-${p.kunci}`}>
                  {p.label}
                  {formulir.isian[p.kunci]?.wajib ? " " : null}
                  {formulir.isian[p.kunci]?.wajib ? <span className="text-gold-600">*</span> : null}
                </label>
                <input
                  id={`ppdb-${p.kunci}`}
                  className="field-input"
                  value={isian[p.kunci]}
                  onChange={(e) => ubah(p.kunci, e.target.value)}
                  placeholder={KETERANGAN_ISIAN[p.kunci] ?? p.label}
                  aria-invalid={galat[p.kunci] ? "true" : undefined}
                />
                {galat[p.kunci] ? (
                  <p className="field-error">{galat[p.kunci]}</p>
                ) : (
                  <p className="field-hint">{KETERANGAN_ISIAN[p.kunci] ?? ""}</p>
                )}
              </div>
            ))}

            {pesanGalat ? (
              <p
                data-testid="ppdb-galat"
                role="alert"
                className="rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-justify text-[11.5px] leading-relaxed text-rose-800"
              >
                {pesanGalat}
              </p>
            ) : null}

            <button
              type="submit"
              data-testid="ppdb-kirim"
              disabled={mengirim}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {mengirim ? "Mengirim pendaftaran…" : formulir.tombol}
              <Icon name="arrow-right" className="h-4 w-4" />
            </button>
            <p className="field-hint">{halaman.catatan}</p>
          </form>
          ) : null}

          <PopupKirim
            open={terkirim}
            onClose={() => setTerkirim(false)}
            testId="ppdb-terkirim"
            judul={formulir.judulSukses}
            ikon={<Icon name="clipboard" className="h-[18px] w-[18px]" />}
            status={formulir.statusSukses}
            ringkas={[
              ...(nomorDaftar ? [{ label: "Nomor pendaftaran", nilai: nomorDaftar }] : []),
              { label: labelPeserta, nilai: isian.nama },
              { label: "Jenjang", nilai: jenjangPilih?.nama ?? isian.jenjang },
              { label: labelUnit, nilai: isian.unit },
              ...(namaJurusan ? [{ label: labelJurusan, nilai: namaJurusan }] : []),
              { label: "Orang tua / wali", nilai: isian.wali },
              { label: "Nomor WhatsApp", nilai: isian.wa },
              ...ISIAN_TAMBAHAN.filter((p) => formulir.isian[p.kunci]?.tampil && isian[p.kunci].trim()).map((p) => ({
                label: p.label,
                nilai: isian[p.kunci],
              })),
            ]}
            pesanWa={pesanWa}
            tautanWa={waLink}
            nomorTeks={waTeks}
          />
        </section>

        <section aria-label="Layanan dan informasi" className="px-5 pt-7">
          <JudulSeksi
            icon={<Icon name="info" className={ikon} />}
            eyebrow="Hubungi Kami"
            title="Layanan & Informasi"
            actionLabel={null}
          />
          {narahubung.length > 0 ? (
            <ul data-testid="ppdb-narahubung" className="space-y-3">
              {narahubung.map((l) => {
                    const waLayanan = tautanWhatsapp(l.whatsapp);
                    return (
                      <li key={l.id}>
                        <article
                          data-testid={`ppdb-layanan-${l.id}`}
                          className="rounded-2xl border border-black/[0.08] border-l-[3px] border-l-persis-800 bg-white p-3.5"
                        >
                          <div className="flex items-start gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-persis-700/10 bg-mint-100 text-persis-800">
                              <Icon name={l.whatsapp ? "whatsapp" : "phone"} className="h-[18px] w-[18px]" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-[12.5px] leading-snug font-bold text-ink-900">{l.nama}</h3>
                              {l.keterangan ? (
                                <p className="mt-0.5 text-justify text-[11px] leading-relaxed text-ink-600">
                                  {l.keterangan}
                                </p>
                              ) : null}
                              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-persis-900">
                                {l.telepon ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Icon name="phone" className="h-3 w-3 text-gold-600" />
                                    {l.telepon}
                                  </span>
                                ) : null}
                                {l.telepon && l.whatsapp ? <span className="text-black/20">·</span> : null}
                                {l.whatsapp ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Icon name="whatsapp" className="h-3 w-3 text-gold-600" />
                                    {l.whatsapp}
                                  </span>
                                ) : null}
                              </p>
                              {l.jam ? <p className="mt-0.5 text-[10.5px] text-persis-900">{l.jam}</p> : null}
                            </div>
                          </div>
                          {l.whatsapp || l.telepon ? (
                            <div className="mt-2.5 flex gap-2 border-t border-black/[0.06] pt-2.5">
                              {l.whatsapp ? (
                                <a
                                  href={`https://wa.me/${waLayanan}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-testid={`ppdb-wa-${l.id}`}
                                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-persis-900 py-2.5 text-[11.5px] font-bold text-white transition active:scale-[0.98]"
                                >
                                  <Icon name="whatsapp" className="h-3.5 w-3.5" />
                                  WhatsApp
                                </a>
                              ) : null}
                              {l.telepon ? (
                                <a
                                  href={`tel:${l.telepon.replace(/[^\d+]/g, "")}`}
                                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-persis-900/20 bg-white py-2.5 text-[11.5px] font-bold text-persis-900 transition active:scale-[0.98]"
                                >
                                  <Icon name="phone" className="h-3.5 w-3.5" />
                                  Telepon
                                </a>
                              ) : null}
                            </div>
                          ) : null}
                        </article>
                      </li>
                    );
                  })}
            </ul>
          ) : (
            <p
              data-testid="ppdb-narahubung-kosong"
              className="rounded-2xl border border-dashed border-persis-900/20 p-4 text-center text-[11.5px] leading-relaxed text-ink-600"
            >
              Narahubung layanan belum tersedia. Silakan atur pada menu SPMB → Layanan Informasi di panel admin.
            </p>
          )}
        </section>

      </div>
    </main>
  );
}

export default HalamanSpmb;
