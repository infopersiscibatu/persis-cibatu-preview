import { statistikTampil, useBeranda } from "../lib/beranda";
import { Icon } from "./Icons";

export default function KartuStatistik() {
  const statistik = statistikTampil(useBeranda());

  return (
    <dl
      data-testid="hero-stats"
      className="relative z-10 -mt-6 grid grid-cols-3 rounded-2xl bg-white px-2 py-3 shadow-[0_1px_2px_rgba(7,51,39,0.06),0_10px_20px_-16px_rgba(7,51,39,0.4)]"
      style={{ gridTemplateColumns: `repeat(${Math.max(statistik.length, 1)}, minmax(0, 1fr))` }}
    >
      {statistik.map((s) => (
        <div key={s.id} className="flex flex-col items-center text-center">
          <dt className="sr-only">{s.label}</dt>
          <dd className="flex flex-col items-center">
            <Icon name={s.ikon} className="h-[15px] w-[15px] text-persis-800" />
            <span
              data-testid={`stat-${s.id}`}
              aria-label={`${s.label}: ${s.nilai}${s.satuan ? ` ${s.satuan}` : ""}`}
              className="mt-1 text-[16px] leading-none font-extrabold text-persis-800"
            >
              {s.nilai}
            </span>
            <span className="mt-1 text-[8px] font-bold tracking-[0.1em] text-persis-800 uppercase">
              {s.labelPendek}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
