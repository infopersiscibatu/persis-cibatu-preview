import type { ReactNode } from "react";

/**
 * Kepala kartu menu admin: judul, teks deskripsi, dan pelengkapnya.
 *
 * Susunannya sengaja dua kolom grid:
 *  - angka diletakkan pada kolom kedua, bersanding hanya dengan judulnya, sehingga teks
 *    deskripsi tetap selebar kartu dan enak dibaca (tidak terjepit di samping angka);
 *  - tombol diletakkan pada baris paling bawah selebar kartu, bukan menghimpit judul.
 */
export function KepalaKartu({
  judul,
  keterangan,
  angka,
  labelAngka,
  testidAngka,
  tombol,
}: {
  judul: ReactNode;
  keterangan: ReactNode;
  /** Angka ringkas yang bersanding dengan judul, mis. jumlah kategori. */
  angka?: ReactNode;
  /** Keterangan singkat di bawah angka. */
  labelAngka?: string;
  testidAngka?: string;
  /** Tombol di bawah judul dan deskripsi. */
  tombol?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5">
      {/* Judul diletakkan di tengah tinggi kartu angka supaya terlihat seimbang. */}
      <h2 className="font-header text-[14px] leading-tight font-extrabold text-ink-900">{judul}</h2>

      {angka === undefined || angka === null ? null : (
        <div
          data-testid={testidAngka}
          className="shrink-0 rounded-xl border border-black/[0.08] bg-cream-50 px-2.5 py-1 text-center"
        >
          <p className="font-header text-[16px] leading-none font-extrabold text-persis-900">{angka}</p>
          {labelAngka ? (
            <p className="mt-0.5 text-[8.5px] font-bold tracking-[0.06em] text-ink-400 uppercase">{labelAngka}</p>
          ) : null}
        </div>
      )}

      <p className="col-span-2 text-justify text-[10.5px] leading-relaxed text-ink-400">{keterangan}</p>

      {tombol ? <div className="col-span-2">{tombol}</div> : null}
    </div>
  );
}

export default KepalaKartu;
