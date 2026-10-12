import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icons";
import TombolBagikan from "./TombolBagikan";
import type { KontenBagikan } from "../lib/bagikan";

export default function Popup({
  open,
  onClose,
  title,
  icon,
  keterangan,
  detail,
  testId,
  bagikan,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  keterangan?: string;
  detail: string[];
  testId?: string;
  bagikan?: KontenBagikan;
}) {
  useEffect(() => {
    if (!open) return;
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", tekan);
    const sebelum = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tekan);
      document.body.style.overflow = sebelum;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title} data-testid={testId}>
      <button type="button" aria-label="Tutup detail" onClick={onClose} className="absolute inset-0 cursor-default bg-persis-950/60" />
      <div className="popup-panel relative flex max-h-[88vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[24px] bg-cream-50 shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.55)]">
        <div className="flex shrink-0 justify-center pt-2.5">
          <span className="h-1 w-10 rounded-full bg-black/15" />
        </div>

        <div className="flex shrink-0 items-start gap-3 px-5 pt-3.5">
          {icon ? (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-persis-700/10 bg-mint-100 text-persis-800">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="font-header text-[15.5px] leading-snug font-bold text-ink-900">{title}</h2>
            {keterangan ? <p className="mt-1 text-[10.5px] leading-relaxed text-persis-900">{keterangan}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            data-testid="popup-tutup-x"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/[0.08] bg-white text-ink-600 transition active:scale-95"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3.5 pb-5">
          {bagikan ? <TombolBagikan konten={bagikan} /> : null}
          <div className="border-t border-black/[0.08] pt-3.5">
            <div className="space-y-3">
              {detail.map((par, i) => (
                <p
                  key={par}
                  className={`text-justify leading-relaxed ${
                    i === 0 ? "text-[13px] font-medium text-ink-900" : "text-[12.5px] text-ink-600"
                  }`}
                >
                  {par}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div
          className="shrink-0 border-t border-black/[0.06] bg-white px-5 pt-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={onClose}
            data-testid="popup-tutup"
            className="w-full rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
