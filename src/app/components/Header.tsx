import { useEffect, useState } from "react";
import { type Notifikasi } from "../data/content";
import { useProfil } from "../lib/profil";
import { labelNotifikasi } from "../lib/format";
import { Icon } from "./Icons";

const ikonJenis: Record<string, string> = {
  Berita: "newspaper",
  Pengumuman: "megaphone",
  Agenda: "calendar",
  Kajian: "book-open",
};

export default function Header({
  scrolled,
  onBeranda,
  onBukaPost,
  notifikasiBelumDibaca,
  jumlahBelumDibaca,
  onTandai,
  onMunculkanLagi,
}: {
  scrolled: boolean;
  onBeranda: () => void;
  onBukaPost: (n: Notifikasi) => void;
  notifikasiBelumDibaca: Notifikasi[];
  jumlahBelumDibaca: number;
  onTandai: (ids: string[]) => void;
  onMunculkanLagi: () => void;
}) {
  const { identitas } = useProfil();
  const [terbuka, setTerbuka] = useState(false);

  useEffect(() => {
    if (!terbuka) return;
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTerbuka(false);
    };
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [terbuka]);

  const bukaPost = (n: Notifikasi) => {
    onTandai([n.id]);
    setTerbuka(false);
    onBukaPost(n);
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-persis-900 transition-shadow ${
        scrolled ? "shadow-[0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_-16px_rgba(0,0,0,0.6)]" : ""
      }`}
    >
      <div className="mx-auto flex w-full max-w-[620px] items-center gap-3 px-5 py-3">
        <button type="button" onClick={onBeranda} aria-label="Beranda" className="shrink-0">
          <img
            src={identitas.logo}
            alt="Logo PC PERSIS Cibatu"
            className="h-10 w-10 object-contain"
            draggable={false}
          />
        </button>

        <div className="font-header min-w-0 flex-1 text-center leading-tight">
          <p className="text-[10px] font-medium tracking-[0.18em] text-gold-300 uppercase">{identitas.pimpinan}</p>
          <p className="truncate text-[15px] font-semibold text-white">{identitas.nama}</p>
          <p className="text-[11px] text-white/60">{identitas.wilayah}</p>
        </div>

        <button
          type="button"
          onClick={() => setTerbuka((v) => !v)}
          aria-label={jumlahBelumDibaca > 0 ? `Notifikasi, ${jumlahBelumDibaca} belum dibaca` : "Notifikasi"}
          aria-expanded={terbuka}
          data-testid="btn-notifikasi"
          className="relative grid h-10 w-10 shrink-0 place-items-center text-white transition active:scale-95"
        >
          <Icon name="bell" className="h-6 w-6" />
          {jumlahBelumDibaca > 0 ? (
            <span
              data-testid="notif-jumlah"
              className="font-header absolute top-[2px] right-0 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-gold-400 px-1 text-[9.5px] font-extrabold text-persis-950 tabular-nums ring-2 ring-persis-900"
            >
              {jumlahBelumDibaca}
            </span>
          ) : null}
        </button>
      </div>

      {terbuka ? (
        <>
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={() => setTerbuka(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="fade-in absolute inset-x-0 top-full z-40 max-h-[78vh] overflow-y-auto border-b border-black/5 bg-white shadow-[0_20px_40px_-24px_rgba(0,0,0,0.35)]">
            <div className="mx-auto w-full max-w-[620px] px-5 py-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-header text-[13px] font-semibold text-ink-900">
                  Notifikasi
                  {jumlahBelumDibaca > 0 ? (
                    <span className="ml-2 rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-bold text-persis-900 tabular-nums">
                      {jumlahBelumDibaca} baru
                    </span>
                  ) : null}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  {jumlahBelumDibaca > 0 ? (
                    <button
                      type="button"
                      onClick={() => onTandai(notifikasiBelumDibaca.map((n) => n.id))}
                      data-testid="notif-tandai-semua"
                      className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-bold text-persis-900 transition active:scale-95"
                    >
                      Tandai semua dibaca
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setTerbuka(false)}
                    aria-label="Tutup notifikasi"
                    data-testid="notif-tutup"
                    className="rounded-full p-1 text-ink-400 transition hover:bg-cream-100"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {notifikasiBelumDibaca.length > 0 ? (
                <ul data-testid="notif-daftar" className="divide-y divide-black/5">
                  {notifikasiBelumDibaca.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => bukaPost(n)}
                        data-testid={`notif-${n.id}`}
                        className="flex w-full items-start gap-3 py-3 text-left transition active:opacity-70"
                      >
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-black/[0.06] bg-cream-50 text-gold-600">
                          <Icon name={ikonJenis[n.jenis] ?? "info"} className="h-[18px] w-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-[9.5px] font-bold tracking-[0.12em] text-persis-900 uppercase">
                              {n.jenis}
                            </span>
                            <span className="ml-auto shrink-0 text-[10px] text-persis-900 tabular-nums">
                              {labelNotifikasi(n.tanggal)}
                            </span>
                          </span>
                          <span className="mt-1 block line-clamp-2 text-[12.5px] leading-snug font-medium text-ink-900">
                            {n.judul}
                          </span>
                          <span className="mt-1 block line-clamp-2 text-justify text-[10.5px] leading-relaxed text-ink-600">
                            {n.ringkas}
                          </span>
                        </span>
                        <Icon name="chevron-right" className="mt-2 h-4 w-4 shrink-0 text-ink-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  data-testid="notif-kosong"
                  className="rounded-2xl border border-black/[0.08] bg-cream-50 px-4 py-5 text-center"
                >
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-cream-100 text-persis-900">
                    <Icon name="bell" className="h-5 w-5" />
                  </span>
                  <p className="mt-2 text-[12px] font-semibold text-ink-900">Belum ada notifikasi baru</p>
                  <p className="mt-1 text-justify text-[10.5px] leading-relaxed text-ink-600">
                    Semua postingan terbaru sudah Anda baca. Notifikasi baru muncul di sini setiap ada berita,
                    pengumuman, agenda, atau kajian berikutnya.
                  </p>
                  <button
                    type="button"
                    onClick={onMunculkanLagi}
                    data-testid="notif-munculkan-lagi"
                    className="mt-3 rounded-full border border-persis-900/20 bg-white px-3.5 py-2 text-[10.5px] font-bold text-persis-900 transition active:scale-95"
                  >
                    Munculkan lagi notifikasi sebelumnya
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
