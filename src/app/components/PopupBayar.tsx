import { Icon } from "./Icons";
import { rupiah } from "../lib/format";
import type { Tagihan } from "../data/wali";

/** Jendela pilih tagihan yang akan dibayar — sama seperti rujukan. */
export default function PopupBayar({
  open,
  tagihan,
  pilihan,
  total,
  onToggle,
  onSemua,
  onLanjut,
  onClose,
}: {
  open: boolean;
  tagihan: Tagihan[];
  pilihan: string[];
  total: number;
  onToggle: (id: string) => void;
  onSemua: () => void;
  onLanjut: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const semuaTerpilih = tagihan.length > 0 && pilihan.length === tagihan.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Pilih tagihan yang dibayar"
      data-testid="popup-bayar"
    >
      <button
        type="button"
        aria-label="Tutup pilihan tagihan"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-persis-950/60"
      />
      <div className="popup-panel relative flex max-h-[88vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[24px] bg-cream-50 shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.55)]">
        <div className="flex shrink-0 justify-center pt-2.5">
          <span className="h-1 w-10 rounded-full bg-black/15" />
        </div>

        <div className="flex shrink-0 items-start gap-3 px-5 pt-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="font-header text-[15.5px] leading-snug font-bold text-ink-900">Bayar Tagihan</h2>
            <p className="mt-1 text-[10.5px] leading-relaxed text-persis-900">
              Pilih satu tagihan atau langsung lunasi semuanya
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            data-testid="popup-bayar-tutup-x"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/[0.08] bg-white text-ink-600 transition active:scale-95"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3.5 pb-4">
          <button
            type="button"
            onClick={onSemua}
            data-testid="popup-bayar-semua"
            className="flex w-full items-center gap-3 rounded-2xl border border-black/[0.08] bg-white px-3.5 py-3 text-left transition active:bg-cream-100"
          >
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                semuaTerpilih ? "border-persis-900 bg-persis-900 text-white" : "border-black/20 bg-white"
              }`}
            >
              {semuaTerpilih ? <Icon name="check" className="h-3.5 w-3.5" /> : null}
            </span>
            <span className="min-w-0 flex-1 text-[12px] font-bold text-ink-900">Pilih semua tagihan</span>
            <span className="shrink-0 text-[10.5px] text-persis-900">{tagihan.length} tagihan</span>
          </button>

          <ul className="mt-2.5 space-y-2.5">
            {tagihan.map((t) => {
              const dipilih = pilihan.includes(t.id);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(t.id)}
                    aria-pressed={dipilih}
                    data-testid={`popup-pilih-${t.id}`}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.99] ${
                      dipilih
                        ? "border-persis-900/35 bg-white ring-1 ring-persis-900/20"
                        : "border-black/[0.08] bg-white"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                        dipilih ? "border-persis-900 bg-persis-900 text-white" : "border-black/20 bg-white"
                      }`}
                    >
                      {dipilih ? <Icon name="check" className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-semibold text-ink-900">{t.label}</span>
                      <span className="mt-0.5 block text-[10.5px] text-persis-900">
                        {t.keterangan} · {t.jatuhTempo}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="font-header block text-[12px] font-bold text-ink-900">{rupiah(t.jumlah)}</span>
                      <span className="mt-0.5 block text-[9.5px] font-semibold tracking-[0.08em] text-gold-700 uppercase">
                        {t.status}
                      </span>
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
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold tracking-[0.12em] text-persis-900 uppercase">Total dipilih</span>
            <span className="font-header text-[15px] font-extrabold text-ink-900">{rupiah(total)}</span>
          </div>
          <button
            type="button"
            onClick={onLanjut}
            disabled={pilihan.length === 0}
            data-testid="popup-bayar-lanjut"
            className="w-full rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98] disabled:bg-black/15 disabled:text-white/70"
          >
            Lanjut Bayar
          </button>
        </div>
      </div>
    </div>
  );
}
