import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../Icons";
import { jawabKonfirmasi, tutupNotif, useNotifikasiAdmin } from "../../lib/notifikasiAdmin";

/**
 * Wadah pemberitahuan panel admin: pesan singkat di bagian atas dan kotak
 * konfirmasi di tengah layar. Cukup dipasang sekali di halaman panel admin.
 */
export default function WadahNotifikasi() {
  const { daftar, konfirmasi } = useNotifikasiAdmin();

  /* Tombol Escape membatalkan kotak konfirmasi. */
  useEffect(() => {
    if (!konfirmasi) return;
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") jawabKonfirmasi(false);
    };
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [konfirmasi]);

  /* Ditampilkan lewat portal ke <body> supaya tidak terpengaruh tata letak di sekitarnya. */
  return createPortal(
    <>
      <div
        data-testid="notif-admin"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[70px] z-[60] flex flex-col items-center gap-2 px-4"
      >
        {daftar.map((n) => (
          <div
            key={n.id}
            data-testid={`notif-${n.tipe}`}
            className={`fade-in pointer-events-auto flex w-full max-w-[420px] items-start gap-2.5 rounded-2xl border px-3.5 py-3 shadow-[0_18px_40px_-20px_rgba(7,51,39,0.55)] ${
              n.tipe === "sukses" ? "border-mint-100 bg-white" : "border-rose-200 bg-rose-50"
            }`}
          >
            <span
              className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                n.tipe === "sukses" ? "bg-mint-100 text-persis-800" : "bg-rose-100 text-rose-700"
              }`}
            >
              <Icon name={n.tipe === "sukses" ? "check" : "info"} className="h-4 w-4" />
            </span>
            <p
              className={`min-w-0 flex-1 text-justify text-[11.5px] leading-relaxed font-medium ${
                n.tipe === "sukses" ? "text-persis-900" : "text-rose-700"
              }`}
            >
              {n.teks}
            </p>
            <button
              type="button"
              data-testid={`notif-tutup-${n.id}`}
              aria-label="Tutup pemberitahuan"
              onClick={() => tutupNotif(n.id)}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-ink-400 transition active:scale-95"
            >
              <Icon name="x" className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {konfirmasi ? (
        <div
          data-testid="notif-konfirmasi"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-konfirmasi-teks"
          className="fixed inset-0 z-[70] flex items-end justify-center bg-persis-950/45 p-4 backdrop-blur-[2px] sm:items-center"
        >
          <div className="fade-in w-full max-w-[420px] rounded-3xl border border-black/[0.06] bg-white p-5 shadow-[0_26px_60px_-24px_rgba(7,51,39,0.7)]">
            <div className="flex items-start gap-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  konfirmasi.nada === "bahaya" ? "bg-rose-50 text-rose-600" : "bg-cream-100 text-gold-600"
                }`}
              >
                <Icon name={konfirmasi.nada === "bahaya" ? "trash" : "info"} className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p
                  className={`text-[9.5px] font-semibold tracking-[0.16em] uppercase ${
                    konfirmasi.nada === "bahaya" ? "text-rose-600" : "text-gold-600"
                  }`}
                >
                  {konfirmasi.judul}
                </p>
                <p
                  id="notif-konfirmasi-teks"
                  className="mt-1 text-justify text-[12.5px] leading-relaxed font-medium text-ink-900"
                >
                  {konfirmasi.pesan}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                data-testid="konfirmasi-tidak"
                onClick={() => jawabKonfirmasi(false)}
                className="rounded-full border border-black/[0.12] px-4 py-2 text-[11.5px] font-semibold text-persis-900 transition active:scale-[0.98]"
              >
                {konfirmasi.labelTidak}
              </button>
              <button
                type="button"
                data-testid="konfirmasi-ya"
                onClick={() => jawabKonfirmasi(true)}
                className="rounded-full bg-rose-600 px-4 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98]"
              >
                {konfirmasi.labelYa}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}
