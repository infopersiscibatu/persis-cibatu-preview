import { useState } from "react";
import JudulSeksi from "../components/JudulSeksi";
import PopupKirim from "../components/PopupKirim";
import { Icon } from "../components/Icons";
import { nomorTerbaca, tautanWhatsapp, useSpmb } from "../lib/spmb";
import { topikAktif, useKontak } from "../lib/kontak";

const ikon = "h-[18px] w-[18px]";

/** Kontak & formulir pesan — sama seperti situs rujukan. */
export function HalamanKontak() {
  /* Daftar layanan dipakai bersama dengan menu Layanan Informasi pada panel SPMB. */
  const spmb = useSpmb();
  const kontak = useKontak();
  const kontakUnit = spmb.layanan.filter((l) => l.aktif);
  const waAdminLink = tautanWhatsapp(kontak.formulir.waAdmin);
  const waAdminTeks = nomorTerbaca(kontak.formulir.waAdmin);
  const petaSekretariat = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    kontak.alamat.peta,
  )}`;
  const [isian, setIsian] = useState({ nama: "", wa: "", topik: "", pesan: "" });
  const [galat, setGalat] = useState<Record<string, string | undefined>>({});
  const [terkirim, setTerkirim] = useState(false);

  const ubah = (kolom: string, nilai: string) => {
    setIsian((b) => ({ ...b, [kolom]: nilai }));
    setGalat((b) => ({ ...b, [kolom]: undefined }));
    setTerkirim(false);
  };

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    const salah: Record<string, string> = {};
    if (!isian.nama.trim()) salah.nama = "Nama wajib diisi.";
    if (isian.wa.trim()) {
      if (isian.wa.replace(/\D/g, "").length < 9) salah.wa = "Nomor WhatsApp belum lengkap.";
    } else {
      salah.wa = "Nomor WhatsApp aktif wajib diisi.";
    }
    if (!isian.topik) salah.topik = "Pilih topik pesan.";
    if (isian.pesan.trim()) {
      if (isian.pesan.trim().length < 10) salah.pesan = "Pesan terlalu singkat, mohon dijelaskan.";
    } else {
      salah.pesan = "Tuliskan pesan yang ingin disampaikan.";
    }
    setGalat(salah);
    if (Object.keys(salah).length > 0) return;
    setTerkirim(true);
  };

  const pesanWa = [
    "*Pesan dari situs PC PERSIS Cibatu*",
    "",
    `Nama: ${isian.nama}`,
    `WhatsApp: ${isian.wa}`,
    `Topik: ${isian.topik}`,
    "",
    isian.pesan,
  ].join("\n");

  return (
    <main data-testid="kontak-page">
      <section aria-label="Gambar kontak" className="relative h-[208px] w-full">
        <img
          src={kontak.halaman.gambarUrl}
          alt={kontak.halaman.gambarAlt}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-persis-950/95 via-persis-950/55 to-persis-950/15" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-5 text-center">
          <p className="text-[9px] font-bold tracking-[0.2em] text-gold-300 uppercase">PC PERSIS Cibatu</p>
          <h1 className="mt-1.5 text-[20px] leading-tight font-extrabold text-white">{kontak.halaman.judul}</h1>
          <p className="mt-1.5 text-[10px] font-semibold tracking-[0.16em] text-white/70 uppercase">
            {kontak.halaman.subjudul}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label="Pengantar kontak" className="px-5 pt-6">
          <p className="text-justify text-[12.5px] leading-relaxed text-ink-600">{kontak.halaman.pengantar}</p>
        </section>

        <section aria-label="Alamat sekretariat" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="map-pin" className={ikon} />}
            eyebrow="Lokasi"
            title="Alamat Sekretariat"
            actionLabel={null}
          />
          <div className="rounded-2xl border border-l-[3px] border-black/[0.08] border-l-gold-500 bg-white p-4">
            <div className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-persis-700/10 bg-mint-100 text-persis-800">
                <Icon name="map-pin" className="h-[17px] w-[17px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                  {kontak.alamat.nama}
                </p>
                <p className="mt-1 text-justify text-[11.5px] leading-relaxed text-ink-600">{kontak.alamat.alamat}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-3 border-t border-black/[0.06] pt-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-persis-700/10 bg-mint-100 text-persis-800">
                <Icon name="clock" className="h-[17px] w-[17px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">Jam Layanan</p>
                <p className="mt-1 text-[11.5px] text-ink-600">{kontak.alamat.jam}</p>
                <p className="mt-1 text-[10.5px] text-persis-900">{kontak.alamat.catatanJam}</p>
              </div>
            </div>
            <a
              href={petaSekretariat}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="kontak-peta"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-persis-900/20 bg-white py-3 text-[12.5px] font-bold text-persis-900 transition active:scale-[0.98]"
            >
              <Icon name="map-pin" className="h-4 w-4" />
              Buka di Google Maps
            </a>
          </div>
        </section>

        <section aria-label="Kontak unit dan jenjang" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="user" className={ikon} />}
            eyebrow="Layanan"
            title="Kontak Layanan"
            actionLabel={null}
          />
          <ul className="space-y-3">
            {kontakUnit.map((u) => {
              const wa = u.whatsapp.replace(/\D/g, "").replace(/^0/, "62");
              return (
                <li key={u.id}>
                  <article className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-persis-700/10 bg-mint-100 text-persis-800">
                        <Icon name="phone" className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[12.5px] leading-snug font-bold text-ink-900">{u.nama}</h3>
                        <p className="mt-0.5 text-justify text-[11px] leading-relaxed text-ink-600">{u.keterangan}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-persis-900">
                          <span className="inline-flex items-center gap-1">
                            <Icon name="phone" className="h-3 w-3 text-gold-600" />
                            {u.telepon}
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Icon name="whatsapp" className="h-3 w-3 text-gold-600" />
                            {u.whatsapp}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-persis-900">{u.jam}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex gap-2 border-t border-black/[0.06] pt-2.5">
                      <a
                        href={`https://wa.me/${wa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-persis-900 py-2.5 text-[11.5px] font-bold text-white transition active:scale-[0.98]"
                      >
                        <Icon name="whatsapp" className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                      <a
                        href={`tel:${u.telepon.replace(/[^\d+]/g, "")}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-persis-900/20 bg-white py-2.5 text-[11.5px] font-bold text-persis-900 transition active:scale-[0.98]"
                      >
                        <Icon name="phone" className="h-3.5 w-3.5" />
                        Telepon
                      </a>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-label="Formulir pesan" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="whatsapp" className={ikon} />}
            eyebrow="Kirim Pesan"
            title={kontak.formulir.judul}
            tone="gold"
            actionLabel={null}
          />
          {kontak.formulir.pengantar ? (
            <p className="mb-3 text-justify text-[12px] leading-relaxed text-ink-600">{kontak.formulir.pengantar}</p>
          ) : null}
          <form onSubmit={kirim} noValidate data-testid="kontak-form" className="card-elev rounded-2xl p-4">
            <div className="space-y-3.5">
              <div>
                <label className="field-label" htmlFor="kontak-nama">
                  Nama lengkap <span className="text-gold-600">*</span>
                </label>
                <input
                  id="kontak-nama"
                  className="field-input"
                  value={isian.nama}
                  onChange={(e) => ubah("nama", e.target.value)}
                  placeholder="Nama Anda"
                  aria-invalid={galat.nama ? "true" : undefined}
                />
                {galat.nama ? <p className="field-error">{galat.nama}</p> : null}
              </div>

              <div>
                <label className="field-label" htmlFor="kontak-wa">
                  Nomor WhatsApp <span className="text-gold-600">*</span>
                </label>
                <input
                  id="kontak-wa"
                  className="field-input"
                  value={isian.wa}
                  onChange={(e) => ubah("wa", e.target.value)}
                  placeholder="08xx-xxxx-xxxx"
                  inputMode="tel"
                  aria-invalid={galat.wa ? "true" : undefined}
                />
                {galat.wa ? (
                  <p className="field-error">{galat.wa}</p>
                ) : (
                  <p className="field-hint">Dipakai petugas untuk membalas pesan Anda melalui WhatsApp.</p>
                )}
              </div>

              <div>
                <label className="field-label" htmlFor="kontak-topik">
                  Topik pesan <span className="text-gold-600">*</span>
                </label>
                <select
                  id="kontak-topik"
                  className="field-input"
                  value={isian.topik}
                  onChange={(e) => ubah("topik", e.target.value)}
                  aria-invalid={galat.topik ? "true" : undefined}
                >
                  <option value="">Pilih topik</option>
                  {topikAktif(kontak).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {galat.topik ? (
                  <p className="field-error">{galat.topik}</p>
                ) : (
                  <p className="field-hint">Pilih topik agar pesan langsung diarahkan ke bidang yang menangani.</p>
                )}
              </div>

              <div>
                <label className="field-label" htmlFor="kontak-pesan">
                  Pesan <span className="text-gold-600">*</span>
                </label>
                <textarea
                  id="kontak-pesan"
                  className="field-input"
                  rows={5}
                  value={isian.pesan}
                  onChange={(e) => ubah("pesan", e.target.value)}
                  placeholder="Tuliskan pertanyaan atau kebutuhan Anda"
                  aria-invalid={galat.pesan ? "true" : undefined}
                />
                {galat.pesan ? <p className="field-error">{galat.pesan}</p> : null}
              </div>
            </div>

            <button
              type="submit"
              data-testid="kontak-kirim"
              className="mt-4 w-full rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
            >
              Kirim Pesan
            </button>
          </form>

          <PopupKirim
            open={terkirim}
            onClose={() => setTerkirim(false)}
            testId="kontak-sukses"
            judul={kontak.formulir.judulSukses}
            ikon={<Icon name="whatsapp" className={ikon} />}
            status={kontak.formulir.statusSukses}
            catatan={kontak.formulir.catatanSukses}
            ringkas={[
              { label: "Nama", nilai: isian.nama },
              { label: "Nomor WhatsApp", nilai: isian.wa },
              { label: "Topik", nilai: isian.topik },
              { label: "Pesan", nilai: isian.pesan },
            ]}
            pesanWa={pesanWa}
            tautanWa={waAdminLink}
            nomorTeks={waAdminTeks}
          />
        </section>
      </div>
    </main>
  );
}

export default HalamanKontak;
