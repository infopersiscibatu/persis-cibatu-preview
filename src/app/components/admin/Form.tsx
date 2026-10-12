import type { ReactNode } from "react";
import { Icon } from "../Icons";

/** Perangkat borang sederhana untuk panel admin. */

const isian =
  "w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-persis-800/40 focus:ring-2 focus:ring-persis-800/10";

export function Kotak({
  judul,
  keterangan,
  children,
  aksi,
  testid,
}: {
  judul: string;
  keterangan?: string;
  children: ReactNode;
  aksi?: ReactNode;
  testid?: string;
}) {
  return (
    <section data-testid={testid} className="rounded-2xl border border-black/[0.08] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-header text-[13.5px] font-bold text-ink-900">{judul}</h2>
          {keterangan ? (
            <p className="mt-0.5 text-justify text-[11px] leading-relaxed text-ink-600">{keterangan}</p>
          ) : null}
        </div>
        {aksi}
      </div>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

export function Kolom({
  label,
  nilai,
  onUbah,
  placeholder,
  petunjuk,
  testid,
}: {
  label: string;
  nilai: string;
  onUbah: (v: string) => void;
  placeholder?: string;
  petunjuk?: string;
  testid?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type="text"
        data-testid={testid}
        className={isian}
        value={nilai}
        placeholder={placeholder}
        onChange={(e) => onUbah(e.target.value)}
      />
      {petunjuk ? <span className="mt-1.5 block text-[10px] leading-relaxed text-ink-400">{petunjuk}</span> : null}
    </label>
  );
}

export function AreaTeks({
  label,
  nilai,
  onUbah,
  placeholder,
  petunjuk,
  baris = 4,
  testid,
}: {
  label: string;
  nilai: string;
  onUbah: (v: string) => void;
  placeholder?: string;
  petunjuk?: string;
  baris?: number;
  testid?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <textarea
        data-testid={testid}
        className={`${isian} text-justify`}
        rows={baris}
        value={nilai}
        placeholder={placeholder}
        onChange={(e) => onUbah(e.target.value)}
      />
      {petunjuk ? <span className="mt-1.5 block text-[10px] leading-relaxed text-ink-400">{petunjuk}</span> : null}
    </label>
  );
}

export function TombolSimpan({
  onClick,
  sibuk,
  nonaktif,
  testid,
  label = "Simpan",
  penuh = true,
}: {
  onClick: () => void;
  sibuk?: boolean;
  nonaktif?: boolean;
  testid?: string;
  label?: string;
  /** Lebar penuh (bawaan). Matikan bila tombol duduk sebaris dengan tombol lain. */
  penuh?: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      disabled={sibuk || nonaktif}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-persis-900 px-4 py-2.5 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 ${
        penuh ? "w-full" : ""
      }`}
    >
      {sibuk ? "Menyimpan…" : label}
    </button>
  );
}

export function TombolIkon({
  nama,
  label,
  onClick,
  nonaktif,
  bahaya,
  testid,
  putar,
}: {
  nama: string;
  label: string;
  onClick: () => void;
  nonaktif?: boolean;
  bahaya?: boolean;
  testid?: string;
  putar?: number;
}) {
  return (
    <button
      type="button"
      data-testid={testid}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={nonaktif}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition active:scale-95 disabled:opacity-40 ${
        bahaya
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-black/[0.09] bg-white text-persis-900"
      }`}
    >
      <Icon name={nama} className="h-[15px] w-[15px]" style={putar ? { transform: `rotate(${putar}deg)` } : undefined} />
    </button>
  );
}

export function Pesan({ tipe, teks }: { tipe: "sukses" | "galat"; teks: string }) {
  return (
    <p
      data-testid={`admin-pesan-${tipe}`}
      className={`mt-3 rounded-xl border px-3.5 py-2.5 text-justify text-[10.5px] leading-relaxed ${
        tipe === "sukses"
          ? "border-mint-100 bg-mint-100/60 text-persis-900"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {teks}
    </p>
  );
}

/** Header borang dengan tombol simpan. */
export function KepalaBorang({ judul, keterangan, aksi }: { judul: string; keterangan: string; aksi?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 pt-5">
      <div className="min-w-0">
        <h1 className="font-header text-[15px] font-extrabold text-ink-900">{judul}</h1>
        <p className="mt-0.5 text-justify text-[11px] leading-relaxed text-ink-600">{keterangan}</p>
      </div>
      {aksi}
    </div>
  );
}

/** Pilihan tunggal dari daftar (select). */
export function Pilih({
  label,
  nilai,
  onUbah,
  opsi,
  placeholder,
  petunjuk,
  testid,
  nonaktif,
}: {
  label: string;
  nilai: string;
  onUbah: (v: string) => void;
  opsi: { nilai: string; label: string }[];
  placeholder?: string;
  petunjuk?: string;
  testid?: string;
  nonaktif?: boolean;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select
        data-testid={testid}
        className={`${isian} appearance-none`}
        value={nilai}
        disabled={nonaktif}
        onChange={(e) => onUbah(e.target.value)}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {opsi.map((o) => (
          <option key={o.nilai} value={o.nilai}>
            {o.label}
          </option>
        ))}
      </select>
      {petunjuk ? <span className="mt-1.5 block text-[10px] leading-relaxed text-ink-400">{petunjuk}</span> : null}
    </label>
  );
}

/** Isian angka (dipakai untuk jumlah, rombel, tahun). */
export function Angka({
  label,
  nilai,
  onUbah,
  placeholder,
  petunjuk,
  testid,
}: {
  label: string;
  nilai: string;
  onUbah: (v: string) => void;
  placeholder?: string;
  petunjuk?: string;
  testid?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        data-testid={testid}
        className={isian}
        value={nilai}
        placeholder={placeholder}
        onChange={(e) => onUbah(e.target.value)}
      />
      {petunjuk ? <span className="mt-1.5 block text-[10px] leading-relaxed text-ink-400">{petunjuk}</span> : null}
    </label>
  );
}

/** Isian tanggal (YYYY-MM-DD), mis. tanggal foto galeri atau agenda. */
export function Tanggal({
  label,
  nilai,
  onUbah,
  petunjuk,
  testid,
}: {
  label: string;
  nilai: string;
  onUbah: (v: string) => void;
  petunjuk?: string;
  testid?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type="date"
        data-testid={testid}
        className={isian}
        value={nilai}
        onChange={(e) => onUbah(e.target.value)}
      />
      {petunjuk ? <span className="mt-1.5 block text-[10px] leading-relaxed text-ink-400">{petunjuk}</span> : null}
    </label>
  );
}

/** Daftar teks pendek yang bisa ditambah dan dikurangi (fasilitas, ekstrakurikuler). */
export function DaftarTeks({
  label,
  nilai,
  onUbah,
  placeholder,
  petunjuk,
  testid,
  labelTambah = "Tambah satu baris",
}: {
  label: string;
  nilai: string[];
  onUbah: (v: string[]) => void;
  placeholder?: string;
  petunjuk?: string;
  testid?: string;
  labelTambah?: string;
}) {
  return (
    <div data-testid={testid}>
      <span className="field-label">{label}</span>
      <ul className="space-y-2">
        {nilai.map((t, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              type="text"
              data-testid={`${testid}-${i}`}
              className={isian}
              value={t}
              placeholder={placeholder}
              onChange={(e) => onUbah(nilai.map((x, k) => (k === i ? e.target.value : x)))}
            />
            <TombolIkon
              nama="x"
              label="Hapus baris"
              bahaya
              testid={`${testid}-hapus-${i}`}
              onClick={() => onUbah(nilai.filter((_, k) => k !== i))}
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        data-testid={`${testid}-tambah`}
        onClick={() => onUbah([...nilai, ""])}
        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-dashed border-persis-900/25 px-3 py-1.5 text-[10.5px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="plus" className="h-3.5 w-3.5 text-gold-600" />
        {labelTambah}
      </button>
      {petunjuk ? <span className="mt-1.5 block text-[10px] leading-relaxed text-ink-400">{petunjuk}</span> : null}
    </div>
  );
}

/** Sakelar sederhana (aktif / tidak). */
export function Sakelar({
  label,
  nilai,
  onUbah,
  petunjuk,
  testid,
}: {
  label: string;
  nilai: boolean;
  onUbah: (v: boolean) => void;
  petunjuk?: string;
  testid?: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl bg-cream-50/70 px-3 py-2.5">
      <input
        type="checkbox"
        data-testid={testid}
        className="mt-0.5 h-4 w-4 shrink-0 accent-persis-900"
        checked={nilai}
        onChange={(e) => onUbah(e.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-[11.5px] font-semibold text-ink-900">{label}</span>
        {petunjuk ? <span className="mt-0.5 block text-[10px] leading-relaxed text-ink-400">{petunjuk}</span> : null}
      </span>
    </label>
  );
}

/** Sekotak pilihan berganda dengan kotak centang. */
export function PilihBanyak({
  label,
  nilai,
  onUbah,
  opsi,
  petunjuk,
  testid,
  kosong = "Belum ada pilihan yang tersedia.",
}: {
  label: string;
  nilai: string[];
  onUbah: (v: string[]) => void;
  opsi: { nilai: string; label: string }[];
  petunjuk?: string;
  testid?: string;
  kosong?: string;
}) {
  if (opsi.length === 0) {
    return (
      <div data-testid={testid}>
        <span className="field-label">{label}</span>
        <p className="rounded-xl border border-dashed border-black/[0.14] px-3.5 py-3 text-justify text-[10.5px] leading-relaxed text-ink-600">
          {kosong}
        </p>
      </div>
    );
  }
  return (
    <div data-testid={testid}>
      <span className="field-label">{label}</span>
      <ul className="space-y-1.5">
        {opsi.map((o) => {
          const dipilih = nilai.includes(o.nilai);
          return (
            <li key={o.nilai}>
              <label className="flex items-center gap-2.5 rounded-xl border border-black/[0.08] px-3 py-2">
                <input
                  type="checkbox"
                  data-testid={`${testid}-${o.nilai}`}
                  className="h-4 w-4 shrink-0 accent-persis-900"
                  checked={dipilih}
                  onChange={(e) =>
                    onUbah(e.target.checked ? [...nilai, o.nilai] : nilai.filter((x) => x !== o.nilai))
                  }
                />
                <span className="text-[11.5px] text-ink-900">{o.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {petunjuk ? <span className="mt-1.5 block text-[10px] leading-relaxed text-ink-400">{petunjuk}</span> : null}
    </div>
  );
}
