import { useState } from "react";
import { Icon } from "../../components/Icons";
import { useProfil } from "../../lib/profil";

/**
 * Layar masuk memakai PIN, dipakai bersama panel admin dan halaman unit sekolah
 * supaya desainnya sama. Tombol papan angka, kolom PIN, dan pesan galatnya
 * memakai testid yang sama di kedua halaman.
 */

export default function MasukPin({
  testid,
  testidKolom,
  label,
  judul,
  keterangan,
  catatan,
  onMasuk,
}: {
  testid: string;
  testidKolom: string;
  label: string;
  judul: string;
  keterangan: string;
  catatan: string;
  onMasuk: (pin: string) => Promise<void>;
}) {
  const { identitas } = useProfil();
  const [pin, setPin] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const kirim = async (nilai = pin) => {
    if (sibuk) return;
    setSibuk(true);
    setGalat(null);
    try {
      await onMasuk(nilai);
      setPin("");
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Tidak bisa masuk. Coba lagi.");
      setPin("");
    } finally {
      setSibuk(false);
    }
  };

  const tekan = (angka: string) => {
    setGalat(null);
    setPin((v) => (v.length >= 8 ? v : v + angka));
  };

  return (
    <main
      data-testid={testid}
      className="flex min-h-dvh flex-col items-center justify-center bg-persis-900 px-5 py-10 text-white"
    >
      <img src={identitas.logo} alt="" className="h-16 w-16 object-contain" draggable={false} />
      <p className="mt-3 text-[9.5px] font-semibold tracking-[0.2em] text-gold-300 uppercase">{label}</p>
      <h1 className="font-header mt-1 text-center text-[17px] leading-tight font-extrabold">
        {judul || identitas.namaLengkap || "PC PERSIS Cibatu"}
      </h1>
      <p className="mt-1.5 max-w-[290px] text-center text-[11px] leading-relaxed text-white/70">{keterangan}</p>

      <form
        className="mt-6 w-full max-w-[300px]"
        onSubmit={(e) => {
          e.preventDefault();
          void kirim();
        }}
      >
        <label className="block text-center">
          <span className="sr-only">PIN</span>
          <input
            type="password"
            data-testid={testidKolom}
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={pin}
            onChange={(e) => {
              setGalat(null);
              setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 8));
            }}
            placeholder="••••"
            aria-label="PIN"
            className="w-full rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-3 text-center text-[22px] font-bold tracking-[0.5em] text-white outline-none placeholder:text-white/30 focus:border-gold-300/60"
          />
        </label>

        <div className="mt-4 grid grid-cols-3 gap-2.5" data-testid="papan-pin">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((angka) => (
            <button
              key={angka}
              type="button"
              data-testid={`pin-${angka}`}
              onClick={() => tekan(angka)}
              className="rounded-2xl bg-white/[0.10] py-3 text-[16px] font-bold transition hover:bg-white/[0.16] active:scale-95"
            >
              {angka}
            </button>
          ))}
          <button
            type="button"
            data-testid="pin-hapus"
            aria-label="Hapus satu angka"
            onClick={() => {
              setGalat(null);
              setPin((v) => v.slice(0, -1));
            }}
            className="flex items-center justify-center rounded-2xl bg-white/[0.10] py-3 transition hover:bg-white/[0.16] active:scale-95"
          >
            <Icon name="x" className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            data-testid="pin-0"
            onClick={() => tekan("0")}
            className="rounded-2xl bg-white/[0.10] py-3 text-[16px] font-bold transition hover:bg-white/[0.16] active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            data-testid="pin-bersihkan"
            aria-label="Bersihkan PIN"
            onClick={() => {
              setGalat(null);
              setPin("");
            }}
            className="rounded-2xl bg-white/[0.10] py-3 text-[11px] font-bold transition hover:bg-white/[0.16] active:scale-95"
          >
            Hapus
          </button>
        </div>

        {galat ? (
          <p
            data-testid="pin-galat"
            className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/15 px-3.5 py-2.5 text-center text-[11px] font-semibold text-rose-100"
          >
            {galat}
          </p>
        ) : null}

        <button
          type="submit"
          data-testid="pin-masuk"
          disabled={sibuk || pin.length < 4}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-400 py-3 text-[12.5px] font-bold text-persis-900 transition active:scale-[0.98] disabled:opacity-40"
        >
          <Icon name="shield" className="h-[16px] w-[16px]" />
          {sibuk ? "Memeriksa PIN…" : "Masuk"}
        </button>
      </form>

      <p className="mt-5 max-w-[300px] text-center text-[10px] leading-relaxed text-white/45">{catatan}</p>
    </main>
  );
}
