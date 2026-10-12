import { useState } from "react";
import { Icon } from "./Icons";
import { metodeDonasi, nominalCepat, type ProgramDonasi } from "../data/donasi";
import type { MetodeBayar } from "../lib/programDonasi";
import { rupiah } from "../lib/format";

export type IsianDonasi = {
  nama: string;
  anonim: boolean;
  whatsapp: string;
  nominal: number;
  pesan: string;
  metode: string;
};

/** Formulir donasi — sama seperti situs rujukan. */
export default function FormDonasi({
  open,
  program,
  metodeTersedia,
  onClose,
  onSubmit,
  galat = "",
}: {
  open: boolean;
  program: ProgramDonasi;
  /** Metode pembayaran yang berlaku untuk program ini (diatur di panel ZIS). */
  metodeTersedia?: MetodeBayar[];
  onClose: () => void;
  onSubmit: (isian: IsianDonasi) => void | Promise<void>;
  galat?: string;
}) {
  const pilihanMetode = metodeTersedia && metodeTersedia.length > 0 ? metodeTersedia : metodeDonasi;
  const [nominalTeks, setNominalTeks] = useState("");
  const [nama, setNama] = useState("");
  const [anonim, setAnonim] = useState(false);
  const [wa, setWa] = useState("");
  const [pesan, setPesan] = useState("");
  const [metode, setMetode] = useState(pilihanMetode[0].id);
  const [galatIsian, setGalatIsian] = useState<Record<string, string>>({});
  const [mengirim, setMengirim] = useState(false);

  if (!open) return null;

  const nominal = Number(nominalTeks.replace(/\D/g, "")) || 0;

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    const salah: Record<string, string> = {};
    if (nominal < 10000) salah.nominal = "Nominal minimal Rp10.000.";
    if (!anonim && nama.trim().length < 3) salah.nama = "Nama lengkap minimal 3 huruf.";
    if (wa.replace(/\D/g, "").length < 9) salah.whatsapp = "Nomor WhatsApp minimal 9 angka, contoh 081234567890.";
    setGalatIsian(salah);
    if (Object.keys(salah).length > 0) return;
    setMengirim(true);
    try {
      await onSubmit({
        nama: anonim ? "Hamba Allah" : nama.trim(),
        anonim,
        whatsapp: wa.trim(),
        nominal,
        pesan: pesan.trim(),
        metode: (pilihanMetode.find((m) => m.id === metode) ?? pilihanMetode[0]).nama,
      });
    } finally {
      setMengirim(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Formulir donasi"
      data-testid="donasi-form"
    >
      <button
        type="button"
        aria-label="Tutup formulir donasi"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-persis-950/60"
      />
      <form
        onSubmit={kirim}
        className="popup-panel relative flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[24px] bg-cream-50 shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.55)]"
      >
        <div className="flex shrink-0 justify-center pt-2.5">
          <span className="h-1 w-10 rounded-full bg-black/15" />
        </div>

        <div className="flex shrink-0 items-start gap-3 px-5 pt-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="font-header text-[15.5px] leading-snug font-bold text-ink-900">Formulir Donasi</h2>
            <p className="mt-1 text-[10.5px] leading-relaxed text-persis-900">
              {program.kategori} · {program.judul}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            data-testid="donasi-form-tutup"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/[0.08] bg-white text-ink-600 transition active:scale-95"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-5">
          <label className="field-label" htmlFor="donasi-nominal">
            Nominal Donasi
          </label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {nominalCepat.map((n) => {
              const aktif = nominal === n;
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => {
                    setNominalTeks(String(n));
                    setGalatIsian((g) => ({ ...g, nominal: "" }));
                  }}
                  data-testid={`donasi-nominal-${n}`}
                  className={`font-header flex h-[38px] items-center justify-center rounded-xl border text-center text-[11.5px] font-bold tabular-nums transition active:scale-95 ${
                    aktif ? "border-persis-900 bg-persis-900 text-white" : "border-black/[0.08] bg-white text-ink-700"
                  }`}
                >
                  {rupiah(n)}
                </button>
              );
            })}
          </div>

          <div className="relative mt-2.5">
            <span className="font-header pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[12.5px] font-extrabold text-persis-900">
              Rp
            </span>
            <input
              id="donasi-nominal"
              data-testid="donasi-input-nominal"
              className="field-input text-left font-bold tabular-nums"
              style={{ paddingLeft: "2.5rem" }}
              inputMode="numeric"
              autoComplete="off"
              value={nominalTeks ? nominal.toLocaleString("id-ID") : ""}
              onChange={(e) => {
                setNominalTeks(e.target.value);
                setGalatIsian((g) => ({ ...g, nominal: "" }));
              }}
              aria-invalid={!!galatIsian.nominal}
              placeholder="100.000"
            />
          </div>
          {galatIsian.nominal ? (
            <p className="field-error">{galatIsian.nominal}</p>
          ) : (
            <p className="field-hint">Nominal minimal Rp10.000, bisa diisi berapa pun.</p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <label className="field-label" style={{ marginBottom: 0 }} htmlFor="donasi-nama">
              Nama Lengkap
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={anonim}
              onClick={() => {
                setAnonim((a) => !a);
                setGalatIsian((g) => ({ ...g, nama: "" }));
              }}
              data-testid="donasi-anonim"
              className="inline-flex shrink-0 items-center gap-2 text-[10.5px] font-semibold text-persis-900"
            >
              Sembunyikan nama
              <span className={`relative h-5 w-9 rounded-full transition ${anonim ? "bg-persis-900" : "bg-black/20"}`}>
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                    anonim ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </span>
            </button>
          </div>

          {anonim ? (
            <p
              data-testid="donasi-nama-samar"
              className="mt-1.5 rounded-xl bg-cream-100 px-3.5 py-2.5 text-justify text-[11px] leading-relaxed text-persis-900"
            >
              Nama Anda akan tampil sebagai <b>Hamba Allah</b> pada daftar donatur. Bendahara tetap mencatat identitas
              Anda untuk keperluan laporan.
            </p>
          ) : (
            <>
              <input
                id="donasi-nama"
                data-testid="donasi-input-nama"
                className="field-input"
                style={{ marginTop: "0.375rem" }}
                autoComplete="name"
                value={nama}
                onChange={(e) => {
                  setNama(e.target.value);
                  setGalatIsian((g) => ({ ...g, nama: "" }));
                }}
                aria-invalid={!!galatIsian.nama}
                placeholder="Nama sesuai identitas"
              />
              {galatIsian.nama ? <p className="field-error">{galatIsian.nama}</p> : null}
            </>
          )}

          <label className="field-label" style={{ marginTop: "1rem" }} htmlFor="donasi-wa">
            No. WhatsApp
          </label>
          <input
            id="donasi-wa"
            data-testid="donasi-input-wa"
            className="field-input"
            style={{ marginTop: "0.375rem" }}
            inputMode="tel"
            autoComplete="tel"
            value={wa}
            onChange={(e) => {
              setWa(e.target.value);
              setGalatIsian((g) => ({ ...g, whatsapp: "" }));
            }}
            aria-invalid={!!galatIsian.whatsapp}
            placeholder="08xxxxxxxxxx"
          />
          {galatIsian.whatsapp ? (
            <p className="field-error">{galatIsian.whatsapp}</p>
          ) : (
            <p className="field-hint">Dipakai bendahara untuk konfirmasi dan pengiriman bukti.</p>
          )}

          <label className="field-label" style={{ marginTop: "1rem" }} htmlFor="donasi-pesan">
            Doa / Ucapan
          </label>
          <textarea
            id="donasi-pesan"
            data-testid="donasi-input-pesan"
            className="field-input min-h-[84px] resize-none"
            style={{ marginTop: "0.375rem" }}
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            maxLength={240}
            placeholder="Tulis doa atau ucapan, boleh dikosongkan."
          />
          <p className="field-hint">{pesan.length}/240 karakter</p>

          {galat ? (
            <p
              data-testid="donasi-galat"
              className="mt-3 rounded-xl border border-[#b03a1a]/25 bg-[#b03a1a]/5 px-3.5 py-2.5 text-justify text-[10.5px] leading-relaxed text-[#8f2f14]"
            >
              {galat}
            </p>
          ) : null}

          <label className="field-label" style={{ marginTop: "1rem" }}>
            Metode Pembayaran
          </label>
          <ul className="space-y-2">
            {pilihanMetode.map((m) => {
              const aktif = m.id === metode;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setMetode(m.id)}
                    aria-pressed={aktif}
                    data-testid={`donasi-metode-${m.id}`}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                      aktif ? "border-persis-900/35 bg-white ring-1 ring-persis-900/20" : "border-black/[0.08] bg-white"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        aktif ? "border-persis-900 bg-persis-900 text-white" : "border-black/20 bg-white"
                      }`}
                    >
                      {aktif ? <Icon name="check" className="h-3 w-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-bold text-ink-900">{m.nama}</span>
                      <span className="mt-0.5 block text-[10.5px] text-persis-900">{m.keterangan}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className="shrink-0 border-t border-black/[0.06] bg-white px-5 pt-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button
            type="submit"
            data-testid="donasi-kirim"
            disabled={mengirim}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 py-3.5 text-[13px] font-bold tabular-nums text-white transition active:scale-[0.98] disabled:opacity-70"
          >
            {mengirim ? (
              "Mengirim…"
            ) : nominal >= 10000 ? (
              <>
                <Icon name="check" className="h-4 w-4" />
                Salurkan {rupiah(nominal)}
              </>
            ) : (
              <>
                <Icon name="heart" className="h-4 w-4" />
                Salurkan Donasi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
