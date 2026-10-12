import { navTampil, useBeranda } from "../lib/beranda";
import { Icon } from "./Icons";

export type TabId = "beranda" | "berita" | "ppdb" | "artikel" | "info";

export default function BottomNav({ active, onChange }: { active: string | null; onChange: (t: string) => void }) {
  const tab = navTampil(useBeranda());

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed bottom-0 left-0 z-40 w-full border-t border-black/5 bg-white/95 backdrop-blur"
    >
      <ul
        className="mx-auto grid w-full max-w-[620px] px-2 pt-1.5"
        style={{
          paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))",
          gridTemplateColumns: `repeat(${Math.max(tab.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {tab.map((t) => {
          const ini = active === t.halaman;
          return (
            <li key={t.halaman}>
              <button
                type="button"
                onClick={() => onChange(t.halaman)}
                aria-current={ini ? "page" : undefined}
                data-testid={`nav-${t.halaman}`}
                className={`flex w-full flex-col items-center gap-1 rounded-xl py-1.5 transition active:scale-95 ${
                  ini ? "text-persis-900" : "text-ink-400"
                }`}
              >
                <Icon name={t.ikon} className="h-[21px] w-[21px]" />
                <span className={`text-[10px] ${ini ? "font-bold" : "font-medium"}`}>{t.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Menu bawah khusus portal wali santri. */
export const tabWali = [
  { id: "beranda", label: "Beranda", icon: "home" },
  { id: "nilai", label: "Nilai", icon: "clipboard" },
  { id: "tagihan", label: "Tagihan", icon: "wallet" },
  { id: "tahfidz", label: "Tahfidz", icon: "book-open" },
  { id: "profil", label: "Profil", icon: "user" },
] as const;

export type TabWali = (typeof tabWali)[number]["id"];
export type TabWaliIsi = Exclude<TabWali, "beranda">;

/**
 * Portal wali santri punya menunya sendiri: Beranda kembali ke situs utama,
 * sedangkan Nilai, Tagihan, Tahfidz, dan Profil pindah bagian di portal.
 */
export function BottomNavWali({
  active,
  onPilih,
  onBeranda,
}: {
  active: TabWali;
  onPilih: (t: TabWaliIsi) => void;
  onBeranda: () => void;
}) {
  return (
    <nav
      aria-label="Navigasi portal wali"
      className="fixed bottom-0 left-0 z-40 w-full border-t border-black/5 bg-white/95 backdrop-blur"
    >
      <ul
        className="mx-auto grid w-full max-w-[620px] grid-cols-5 px-2 pt-1.5"
        style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
      >
        {tabWali.map((t) => {
          const ini = active === t.id;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => (t.id === "beranda" ? onBeranda() : onPilih(t.id))}
                aria-current={ini ? "page" : undefined}
                data-testid={`nav-wali-${t.id}`}
                className={`flex w-full flex-col items-center gap-1 rounded-xl py-1.5 transition active:scale-95 ${
                  ini ? "text-persis-900" : "text-ink-400"
                }`}
              >
                <Icon name={t.icon} className="h-[21px] w-[21px]" />
                <span className={`text-[10px] ${ini ? "font-bold" : "font-medium"}`}>{t.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
