import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icons";

/** Jendela bawah setelah isian terkirim: ringkasan + teruskan ke WhatsApp admin. */
export default function PopupKirim({
  open,
  onClose,
  testId,
  judul,
  ikon,
  status,
  catatan,
  ringkas,
  pesanWa,
  tautanWa,
  nomorTeks,
  labelTombol = "Teruskan ke WhatsApp Admin",
}: {
  open: boolean;
  onClose: () => void;
  testId: string;
  judul: string;
  ikon: ReactNode;
  status: string;
  catatan?: string;
  ringkas: { label: string; nilai: string }[];
  pesanWa: string;
  tautanWa: string;
  nomorTeks: string;
  labelTombol?: string;
}) {
  const lapisan = useRef(false);
  const tutupRef = useRef(onClose);
  tutupRef.current = onClose;

  useEffect(() => {
    if (open && !lapisan.current) {
      lapisan.current = true;
      window.history.pushState({ popup: true }, "", window.location.hash);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const saatKembali = () => {
      lapisan.current = false;
      tutupRef.current();
    };
    const saatTombol = (e: KeyboardEvent) => {
      if (e.key === "Escape") tutup();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("popstate", saatKembali);
    document.addEventListener("keydown", saatTombol);
    return () => {
      window.removeEventListener("popstate", saatKembali);
      document.removeEventListener("keydown", saatTombol);
      document.body.style.overflow = overflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const tutup = () => {
    tutupRef.current();
    if (lapisan.current) {
      lapisan.current = false;
      window.history.back();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={judul} data-testid={testId}>
      <button
        type="button"
        aria-label="Tutup pemberitahuan"
        onClick={tutup}
        className="absolute inset-0 cursor-default bg-persis-950/60"
      />
      <div className="popup-panel relative flex max-h-[88vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[24px] bg-cream-50 shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.55)]">
        <div className="flex shrink-0 justify-center pt-2.5">
          <span className="h-1 w-10 rounded-full bg-black/15" />
        </div>

        <div className="flex shrink-0 items-start gap-3 px-5 pt-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-persis-700/10 bg-mint-100 text-persis-800">
            {ikon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] font-bold tracking-[0.16em] text-gold-600 uppercase">Berhasil dikirim</p>
            <h2 className="font-header mt-0.5 text-[15.5px] leading-snug font-bold text-ink-900">{judul}</h2>
          </div>
          <button
            type="button"
            onClick={tutup}
            aria-label="Tutup"
            data-testid="popup-kirim-tutup-x"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/[0.08] bg-white text-ink-600 transition active:scale-95"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3.5 pb-4">
          <p className="text-justify text-[12.5px] leading-relaxed text-ink-900">{status}</p>
          {catatan ? (
            <p className="mt-2 rounded-xl border border-[#b03a1a]/25 bg-[#b03a1a]/5 px-3 py-2 text-justify text-[11.5px] leading-relaxed text-[#8f2f14]">
              {catatan}
            </p>
          ) : null}

          {ringkas.length > 0 ? (
            <div className="mt-3.5 rounded-2xl border border-black/[0.08] border-l-[3px] border-l-gold-500 bg-white p-3.5">
              <p className="text-[9.5px] font-bold tracking-[0.16em] text-persis-900 uppercase">Ringkasan isian</p>
              <dl className="mt-2 space-y-1.5">
                {ringkas
                  .filter((b) => b.nilai.trim() !== "")
                  .map((b) => (
                    <div key={b.label} className="flex gap-2.5">
                      <dt className="w-[38%] shrink-0 text-[11px] text-ink-600">{b.label}</dt>
                      <dd className="min-w-0 flex-1 text-[11.5px] font-semibold text-ink-900">{b.nilai}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ) : null}

          <p className="mt-3.5 text-justify text-[11.5px] leading-relaxed text-ink-600">
            Tekan tombol di bawah untuk meneruskan isian ini ke WhatsApp admin{" "}
            <b className="text-persis-900">{nomorTeks}</b>. Pesan sudah tersusun otomatis, jadi Anda tinggal mengirimnya
            dari aplikasi WhatsApp.
          </p>
        </div>

        <div
          className="shrink-0 border-t border-black/[0.06] bg-white px-5 pt-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <a
            href={`https://wa.me/${tautanWa}?text=${encodeURIComponent(pesanWa)}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="popup-kirim-wa"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
          >
            <Icon name="whatsapp" className="h-4 w-4" />
            {labelTombol}
          </a>
          <button
            type="button"
            onClick={tutup}
            data-testid="popup-kirim-tutup"
            className="mt-2 w-full rounded-full border border-persis-900/15 bg-white py-2.5 text-[12px] font-bold text-persis-900 transition active:scale-[0.98]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
