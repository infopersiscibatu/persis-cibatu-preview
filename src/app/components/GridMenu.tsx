import { gridTampil, useBeranda } from "../lib/beranda";
import { Icon } from "./Icons";

const nada = ["bg-mint-deep text-persis-800", "bg-pastelgold text-gold-700"];

export default function GridMenu({ onSelect }: { onSelect: (halaman: string) => void }) {
  const menu = gridTampil(useBeranda());

  return (
    <section aria-label="Menu utama" id="menu" className="w-full">
      <div className="grid grid-cols-4 gap-x-1 gap-y-4">
        {menu.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.halaman)}
            aria-label={m.label}
            data-testid={`menu-${m.halaman}`}
            data-menu-id={m.id}
            className="flex w-full flex-col items-center gap-1.5 rounded-2xl py-0.5 transition active:scale-95"
          >
            <span className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full ${nada[i % nada.length]}`}>
              <Icon name={m.ikon} className="h-[22px] w-[22px]" />
            </span>
            <span className="w-full truncate text-center text-[10px] leading-3 font-semibold text-persis-950/70">
              {m.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
