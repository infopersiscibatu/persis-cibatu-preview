import { useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/Icons";
import { useProfil } from "../../lib/profil";
import { keluarUnit } from "../../lib/sesiUnit";

export type MenuUnit = {
  id: string;
  label: string;
  ikon: string;
  /** Bila diisi, menu ini dikelompokkan di bawah judul tersebut (mis. "Program Donasi"). */
  grup?: string;
};

/**
 * Kepala halaman unit sekolah. Desainnya sama dengan kepala panel admin:
 * tombol menu di kiri, judul bertumpuk di tengah, logo di kanan.
 */
export default function KepalaUnit({
  label,
  namaSekolah,
  jenjang,
  menuAktif,
  menu,
  onPilihMenu,
  onKeluar,
  onLihatSitus,
}: {
  label: string;
  namaSekolah: string;
  jenjang?: string;
  menuAktif: string;
  menu: MenuUnit[];
  onPilihMenu: (id: string) => void;
  /** Keluar dari panel: sesi dibersihkan dan panel kembali ke layar masuk. */
  onKeluar?: () => void;
  /** Membuka situs publik dari panel. */
  onLihatSitus?: () => void;
}) {
  const { identitas } = useProfil();
  const [terbuka, setTerbuka] = useState(false);
  const [akun, setAkun] = useState(false);
  /* Kelompok menu terbuka sejak awal; daftar ini mencatat kelompok yang ditutup petugas. */
  const [grupTutup, setGrupTutup] = useState<string[]>([]);

  /* Menu yang punya `grup` ditampilkan sebagai satu kelompok yang bisa dibuka-tutup. */
  const entri = useMemo(() => {
    const hasil: { grup: string | null; menu: MenuUnit[] }[] = [];
    for (const m of menu) {
      const nama = m.grup;
      if (!nama) {
        /* Menu tunggal selalu berdiri sendiri, tidak digabung dengan menu tunggal lain. */
        hasil.push({ grup: null, menu: [m] });
        continue;
      }
      const ada = hasil.find((e) => e.grup === nama);
      if (ada) ada.menu.push(m);
      else hasil.push({ grup: nama, menu: [m] });
    }
    return hasil;
  }, [menu]);

  const grupTerbuka = (nama: string, _isi: MenuUnit[]) => !grupTutup.includes(nama);

  const bukaTutupGrup = (nama: string) =>
    setGrupTutup((v) => (v.includes(nama) ? v.filter((x) => x !== nama) : [...v, nama]));

  /* Tombol Escape menutup laci dan menu akun, sama seperti panel admin. */
  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTerbuka(false);
        setAkun(false);
      }
    };
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, []);

  const keluarSekarang = () => {
    setAkun(false);
    setTerbuka(false);
    void keluarUnit().finally(() => onKeluar?.());
  };

  const judulMenu = menu.find((m) => m.id === menuAktif)?.label ?? menuAktif;

  return (
    <>
      <header data-testid="unit-header" className="sticky top-0 z-30 bg-persis-900 text-white">
        <div className="mx-auto flex w-full max-w-[620px] items-center gap-3 px-4 py-3">
          <button
            type="button"
            data-testid="unit-hamburger"
            aria-label="Buka menu halaman unit"
            aria-expanded={terbuka}
            aria-controls="unit-drawer"
            onClick={() => {
              setAkun(false);
              setTerbuka((v) => !v);
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.12] transition active:scale-95"
          >
            <Icon name="menu" className="h-[19px] w-[19px]" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-[9px] font-semibold tracking-[0.16em] text-gold-300 uppercase">{label}</p>
            <p className="mt-0.5 truncate text-[12.5px] leading-tight font-bold">{namaSekolah}</p>
            <p data-testid="unit-judul-menu" className="truncate text-[9px] leading-tight text-white/60">
              {judulMenu}
              {jenjang ? ` · ${jenjang}` : ""}
            </p>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              data-testid="unit-akun"
              aria-label="Menu akun unit"
              aria-haspopup="menu"
              aria-expanded={akun}
              aria-controls="unit-menu-akun"
              onClick={() => {
                setTerbuka(false);
                setAkun((v) => !v);
              }}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.12] transition active:scale-95"
            >
              <img src={identitas.logo} alt="" className="h-[26px] w-[26px] object-contain" draggable={false} />
            </button>

            {akun ? (
              <div
                id="unit-menu-akun"
                data-testid="unit-menu-akun"
                role="menu"
                aria-label="Menu akun"
                className="fade-in absolute top-[calc(100%+10px)] right-0 w-[230px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white text-left shadow-[0_22px_48px_-22px_rgba(7,51,39,0.6)]"
              >
                <div className="flex items-center gap-2.5 border-b border-black/[0.07] px-3.5 py-3">
                  <img src={identitas.logo} alt="" className="h-8 w-8 shrink-0 object-contain" draggable={false} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold tracking-[0.14em] text-gold-600 uppercase">{label}</p>
                    <p className="truncate text-[11px] leading-tight font-semibold text-ink-900">{namaSekolah}</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="unit-lihat-situs"
                  onClick={() => {
                    setAkun(false);
                    onLihatSitus?.();
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-[11.5px] font-semibold text-persis-900 transition hover:bg-cream-50 active:bg-cream-100"
                >
                  <Icon name="eye" className="h-[17px] w-[17px] text-gold-600" />
                  Lihat situs
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="unit-keluar"
                  onClick={keluarSekarang}
                  className="flex w-full items-center gap-2.5 border-t border-black/[0.07] px-3.5 py-3 text-left text-[11.5px] font-semibold text-persis-900 transition hover:bg-cream-50 active:bg-cream-100"
                >
                  <Icon name="log-out" className="h-[17px] w-[17px] text-gold-600" />
                  Keluar
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {terbuka ? (
        <>
          <button
            type="button"
            data-testid="unit-laci-latar"
            aria-label="Tutup menu"
            onClick={() => setTerbuka(false)}
            className="fixed inset-0 z-40 bg-ink-900/45 backdrop-blur-[2px]"
          />
          <aside
            id="unit-drawer"
            data-testid="unit-laci"
            className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[84%] flex-col overflow-y-auto bg-white px-4 py-5 shadow-2xl"
          >
            <div className="flex items-center gap-2.5 border-b border-black/[0.07] pb-4">
              <img src={identitas.logo} alt="" className="h-9 w-9 shrink-0 object-contain" draggable={false} />
              <div className="min-w-0">
                <p className="text-[9px] font-semibold tracking-[0.14em] text-gold-600 uppercase">{label}</p>
                <p className="truncate text-[12px] leading-tight font-bold text-persis-900">{namaSekolah}</p>
              </div>
            </div>

            <nav aria-label="Menu halaman unit" className="mt-4 space-y-1.5">
              {entri.map((e) => {
                const tombolMenu = (m: MenuUnit, dalamGrup: boolean) => {
                  const aktif = m.id === menuAktif;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      data-testid={`unit-menu-${m.id}`}
                      aria-current={aktif ? "page" : undefined}
                      onClick={() => {
                        onPilihMenu(m.id);
                        setTerbuka(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-left text-[12px] font-semibold transition ${
                        dalamGrup ? "px-3 pl-8" : "px-3"
                      } ${
                        aktif
                          ? "bg-persis-900 text-white"
                          : "border border-black/[0.08] text-persis-900 hover:bg-cream-50 active:bg-cream-100"
                      }`}
                    >
                      <Icon
                        name={m.ikon}
                        className={`h-[16px] w-[16px] shrink-0 ${aktif ? "text-gold-300" : "text-gold-600"}`}
                      />
                      <span className="min-w-0 flex-1 truncate">{m.label}</span>
                      {aktif ? <Icon name="check" className="h-[14px] w-[14px] shrink-0 text-gold-300" /> : null}
                    </button>
                  );
                };

                /* Menu tunggal: langsung ditampilkan. */
                if (!e.grup) return tombolMenu(e.menu[0], false);

                const nama = e.grup;
                const dibuka = grupTerbuka(nama, e.menu);
                const adaAktif = e.menu.some((m) => m.id === menuAktif);
                return (
                  <div key={nama} className="space-y-1.5">
                    <button
                      type="button"
                      data-testid={`unit-grup-${nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      aria-expanded={dibuka}
                      onClick={() => bukaTutupGrup(nama)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-bold transition ${
                        adaAktif && !dibuka ? "bg-cream-100 text-persis-900" : "text-persis-900 hover:bg-cream-50"
                      }`}
                    >
                      <Icon name="clipboard" className="h-[16px] w-[16px] shrink-0 text-gold-600" />
                      <span className="min-w-0 flex-1 truncate">{nama}</span>
                      <Icon
                        name="chevron"
                        className="h-[15px] w-[15px] shrink-0 text-ink-400 transition-transform"
                        style={{ transform: dibuka ? "rotate(90deg)" : undefined }}
                      />
                    </button>
                    {dibuka ? <div className="space-y-1.5">{e.menu.map((m) => tombolMenu(m, true))}</div> : null}
                  </div>
                );
              })}
            </nav>

            <div className="mt-auto space-y-2 pt-5">
              <button
                type="button"
                data-testid="unit-laci-situs"
                onClick={() => {
                  setTerbuka(false);
                  onLihatSitus?.();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-black/[0.12] py-2.5 text-[11.5px] font-semibold text-persis-900"
              >
                <Icon name="eye" className="h-[16px] w-[16px] text-gold-600" />
                Lihat situs
              </button>
              <button
                type="button"
                data-testid="unit-laci-keluar"
                onClick={keluarSekarang}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 py-2.5 text-[11.5px] font-semibold text-white"
              >
                <Icon name="log-out" className="h-[16px] w-[16px]" />
                Keluar
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
