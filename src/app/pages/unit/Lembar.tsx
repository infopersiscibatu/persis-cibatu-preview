import { useEffect, type ReactNode } from "react";
import { Icon } from "../../components/Icons";

/**
 * Lembar melayang dari bawah untuk borang dan rincian di halaman unit.
 * Sama bentuknya dengan jendela rincian pendaftar di Admin SPMB.
 */
export default function Lembar({
  testid,
  judul,
  keterangan,
  onTutup,
  children,
  aksi,
}: {
  testid: string;
  judul: string;
  keterangan?: string;
  onTutup: () => void;
  children: ReactNode;
  aksi?: ReactNode;
}) {
  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
    };
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [onTutup]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" data-testid={testid}>
      <button
        type="button"
        data-testid={`${testid}-latar`}
        aria-label="Tutup"
        onClick={onTutup}
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className="relative z-10 max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-t-3xl bg-white px-4 pt-4 pb-6 shadow-[0_-18px_50px_-18px_rgba(7,51,39,0.55)]"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-black/[0.12]" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 data-testid={`${testid}-judul`} className="font-header text-[14px] leading-tight font-extrabold text-persis-900">
              {judul}
            </h2>
            {keterangan ? (
              <p className="mt-0.5 text-justify text-[10.5px] leading-relaxed text-ink-400">{keterangan}</p>
            ) : null}
          </div>
          <button
            type="button"
            data-testid={`${testid}-tutup`}
            aria-label="Tutup"
            onClick={onTutup}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/[0.1] text-ink-600"
          >
            <Icon name="x" className="h-[16px] w-[16px]" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {aksi ? <div className="mt-4">{aksi}</div> : null}
      </div>
    </div>
  );
}
