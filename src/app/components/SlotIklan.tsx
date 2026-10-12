import { Icon } from "./Icons";
import { bukaTautanIklan, iklanUntuk, useIklan } from "../lib/iklan";

/**
 * Slot iklan di dalam isi Berita dan Artikel: satu kolom penuh yang berisi gambar iklan
 * saja, tanpa tulisan di atasnya.
 *
 * Bila belum ada iklan yang tampil, kolomnya tetap ada dan berisi tulisan
 * "Space Iklan Disini Silahkan Hubungi Admin" supaya pemasang iklan tahu tempatnya.
 */
export default function SlotIklan({ kunci, dataUji = "slot-iklan" }: { kunci: string; dataUji?: string }) {
  const daftar = useIklan();
  const iklan = iklanUntuk(daftar, kunci);
  const tertaut = iklan && iklan.tautan ? iklan.tautan : null;

  /* Belum ada gambar iklan: tampilkan kolom kosong bertuliskan ajakan hubungi admin. */
  if (!iklan || !iklan.gambarUrl) {
    return (
      <aside aria-label="Space iklan" data-testid={dataUji} className="overflow-hidden">
        <button
          type="button"
          data-testid="space-iklan"
          onClick={() => bukaTautanIklan("#/kontak")}
          className="flex h-[132px] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-gold-500/50 bg-cream-100/70 px-4 text-center transition active:scale-[0.995]"
        >
          <span className="text-[11.5px] font-bold tracking-wide text-persis-900/75 uppercase">
            Space Iklan Disini
          </span>
          <span className="text-[11px] font-medium text-persis-900/60">Silahkan Hubungi Admin</span>
        </button>
      </aside>
    );
  }

  const gambar = (
    <img
      src={iklan.gambarUrl}
      alt={iklan.judul}
      draggable={false}
      loading="lazy"
      className="h-[132px] w-full object-cover"
    />
  );

  return (
    <aside aria-label="Iklan" data-testid={dataUji} className="overflow-hidden">
      {tertaut ? (
        <button
          type="button"
          data-testid="iklan-gambar"
          aria-label={`Iklan: ${iklan.judul}`}
          onClick={() => bukaTautanIklan(tertaut)}
          className="block w-full overflow-hidden rounded-2xl border border-black/[0.08] transition active:scale-[0.995]"
        >
          {gambar}
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.08]" data-testid="iklan-gambar">
          {gambar}
        </div>
      )}
      <span className="mt-1.5 flex items-center justify-center gap-1 text-[8.5px] font-semibold tracking-[0.18em] text-ink-400 uppercase">
        <Icon name="image" className="h-2.5 w-2.5" />
        Iklan
      </span>
    </aside>
  );
}
