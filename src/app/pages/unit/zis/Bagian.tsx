import type { ReactNode } from "react";

/** Bagian halaman ZIS: judul, lencana jumlah, keterangan, dan tombol tambahan. */
export function Bagian({
  judul,
  keterangan,
  jumlah,
  nada = "hijau",
  aksi,
  testid,
  children,
}: {
  judul: string;
  keterangan: string;
  /** Angka pada lencana di kanan judul. */
  jumlah?: number;
  nada?: "hijau" | "emas" | "redup";
  aksi?: ReactNode;
  testid: string;
  children: ReactNode;
}) {
  const warna =
    nada === "emas"
      ? "bg-gold-500 text-persis-950"
      : nada === "hijau"
        ? "bg-persis-900 text-white"
        : "bg-cream-100 text-ink-500";
  return (
    <section data-testid={testid} className="rounded-2xl border border-black/[0.08] bg-cream-50 p-4">
      <div className="flex items-center justify-between gap-2.5">
        <h2 className="font-header text-[13px] font-bold text-ink-900">{judul}</h2>
        <div className="flex shrink-0 items-center gap-2">
          {typeof jumlah === "number" ? (
            <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-bold ${warna}`}>
              {jumlah}
            </span>
          ) : null}
          {aksi}
        </div>
      </div>
      <p className="mt-1.5 text-justify text-[11px] leading-relaxed text-ink-600">{keterangan}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Tanda bagian yang masih kosong. */
export function Kosong({ teks, testid }: { teks: string; testid?: string }) {
  return (
    <p
      data-testid={testid}
      className="rounded-2xl border border-dashed border-black/[0.12] bg-white px-3.5 py-4 text-justify text-[11px] leading-relaxed text-ink-500"
    >
      {teks}
    </p>
  );
}

/** Pilihan saring berbentuk pil (semua, menunggu, terverifikasi, …). */
export function PilSaring({
  opsi,
  nilai,
  onUbah,
  testid,
}: {
  opsi: { nilai: string; label: string }[];
  nilai: string;
  onUbah: (v: string) => void;
  testid: string;
}) {
  return (
    <div data-testid={testid} className="flex flex-wrap gap-1.5">
      {opsi.map((o) => {
        const aktif = o.nilai === nilai;
        return (
          <button
            key={o.nilai}
            type="button"
            data-testid={`${testid}-${o.nilai}`}
            aria-pressed={aktif}
            onClick={() => onUbah(o.nilai)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
              aktif ? "bg-persis-900 text-white" : "border border-black/[0.12] bg-white text-persis-900"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Lencana kecil bertuliskan jenis atau status. */
export function Lencana({ teks, warna }: { teks: string; warna: "emas" | "hijau" | "redup" | "merah" }) {
  const gaya =
    warna === "emas"
      ? "bg-pastelgold text-gold-700"
      : warna === "hijau"
        ? "bg-mint-100 text-persis-800"
        : warna === "merah"
          ? "bg-rose-100 text-rose-700"
          : "bg-cream-100 text-ink-500";
  return <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold tracking-wide uppercase ${gaya}`}>{teks}</span>;
}

/** Kartu tabel yang bisa digeser ke samping di layar sempit. */
export function TabelKartu({
  children,
  testid,
  lebar = "min-w-[470px]",
}: {
  children: ReactNode;
  testid: string;
  /** Lebar paling kecil tabel; dipakai tabel berkolom sedikit supaya tidak perlu digeser. */
  lebar?: string;
}) {
  return (
    <div data-testid={testid} className="overflow-x-auto rounded-2xl border border-black/[0.08] bg-white">
      <table className={`w-full ${lebar} border-collapse text-left text-[11.5px]`}>{children}</table>
    </div>
  );
}
