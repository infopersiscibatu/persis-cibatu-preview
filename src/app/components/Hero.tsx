import { useEffect, useRef, useState } from "react";
import { carouselTampil, useBeranda } from "../lib/beranda";

export default function Hero() {
  const data = useBeranda();
  const [aktif, setAktif] = useState(0);
  const [berhenti, setBerhenti] = useState(false);
  const sentuh = useRef<number | null>(null);

  const slide = carouselTampil(data);
  const jumlah = slide.length;
  const kini = slide[Math.min(aktif, Math.max(jumlah - 1, 0))];

  useEffect(() => {
    if (berhenti || jumlah < 2) return;
    const t = window.setTimeout(() => setAktif((i) => (i + 1) % jumlah), 5000);
    return () => window.clearTimeout(t);
  }, [aktif, berhenti, jumlah]);

  // Belum ada slide di database: jangan tampilkan apa pun (hindari crash).
  if (!kini) return null;

  return (
    <section
      aria-label="Galeri sorotan"
      className="relative w-full overflow-hidden bg-persis-900"
      onMouseEnter={() => setBerhenti(true)}
      onMouseLeave={() => setBerhenti(false)}
      onTouchStart={(e) => {
        setBerhenti(true);
        sentuh.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (sentuh.current !== null) {
          const geser = e.changedTouches[0].clientX - sentuh.current;
          if (Math.abs(geser) > 40) setAktif((i) => (i + (geser < 0 ? 1 : -1) + jumlah) % jumlah);
          sentuh.current = null;
        }
        setBerhenti(false);
      }}
    >
      <div className="relative h-[230px] w-full sm:h-[320px] lg:h-[360px]">
        {slide.map((s, i) => (
          <img
            key={s.id}
            src={s.gambarUrl}
            alt={s.judul || s.tag || `Gambar ${i + 1}`}
            loading={i === 0 ? "eager" : "lazy"}
            aria-hidden={i !== aktif}
            data-testid={`hero-gambar-${i}`}
            draggable={false}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              i === aktif ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-persis-950/90 via-persis-950/45 to-transparent px-5 pt-12 pb-11"
        >
          {/* Hanya label slide yang diberi highlight (lencana emas). */}
          {kini.tag ? (
            <span className="inline-flex max-w-full rounded-full bg-gold-400 px-2.5 py-0.5 text-[9px] font-bold tracking-[0.16em] text-persis-950 uppercase">
              <span className="truncate">{kini.tag}</span>
            </span>
          ) : null}
          {kini.judul ? (
            <h2 className="font-header mt-1.5 max-w-[36ch] text-[15px] leading-snug font-extrabold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] sm:text-[18px]">
              {kini.judul}
            </h2>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-9 z-20 flex justify-center gap-1.5">
          {slide.map((s, i) => (
            <button
              key={s.id}
              type="button"
              data-testid={`hero-titik-${i}`}
              onClick={() => setAktif(i)}
              aria-label={`Tampilkan gambar ${i + 1} dari ${jumlah}`}
              aria-current={i === aktif}
              className={`h-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-all ${
                i === aktif ? "w-6 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
