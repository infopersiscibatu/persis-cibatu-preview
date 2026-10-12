import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { ambilStatistikSekolah, type StatistikSekolah } from "../../lib/unitSekolah";
import { useIstilah } from "../../lib/istilah";

/**
 * Dashboard Admin Sekolah: angka pokok sekolah — jumlah siswa, alumni, rombel, dan
 * guru — beserta sebaran siswa per kelas. Semua dihitung dari database dan hanya
 * mencakup sekolah yang sedang masuk.
 */

const angka = (n: number | undefined) => (n ?? 0).toLocaleString("id-ID");

const jamWib = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
};

function Kartu({
  label,
  nilai,
  ikon,
  petunjuk,
  utama,
  testid,
}: {
  label: string;
  nilai: string;
  ikon: string;
  petunjuk: string;
  utama?: boolean;
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      className={`rounded-2xl border p-3.5 ${utama ? "border-persis-900/25 bg-persis-900 text-white" : "border-black/[0.08] bg-white"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-[9.5px] font-bold tracking-[0.1em] uppercase ${utama ? "text-gold-300" : "text-ink-400"}`}
        >
          {label}
        </p>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${utama ? "bg-white/[0.14]" : "bg-cream-100"}`}>
          <Icon name={ikon} className={`h-[15px] w-[15px] ${utama ? "text-gold-300" : "text-persis-900"}`} />
        </span>
      </div>
      <p
        data-testid={`${testid}-nilai`}
        className={`font-header mt-2 text-[22px] leading-none font-extrabold ${utama ? "text-white" : "text-persis-900"}`}
      >
        {nilai}
      </p>
      <p className={`mt-1.5 text-[10px] leading-snug ${utama ? "text-white/70" : "text-ink-400"}`}>{petunjuk}</p>
    </div>
  );
}

export default function StatistikSekolah({ versi = 0 }: { versi?: number }) {
  const t = useIstilah();
  const [data, setData] = useState<StatistikSekolah | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const muat = useCallback(async (tenang = false) => {
    if (!tenang) setMemuat(true);
    try {
      const jawab = await ambilStatistikSekolah();
      setData(jawab);
      setGalat(null);
    } catch (e) {
      const pesan = e instanceof Error ? e.message : `Statistik ${t.unit} belum bisa dimuat.`;
      if (!tenang || !data) setGalat(pesan);
    } finally {
      if (!tenang) setMemuat(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void muat();
  }, [muat, versi]);

  /* Angka disegarkan sendiri saat halaman kembali dilihat, tanpa tombol apa pun. */
  useEffect(() => {
    const segarkan = () => {
      if (document.visibilityState !== "hidden") void muat(true);
    };
    document.addEventListener("visibilitychange", segarkan);
    window.addEventListener("focus", segarkan);
    return () => {
      document.removeEventListener("visibilitychange", segarkan);
      window.removeEventListener("focus", segarkan);
    };
  }, [muat]);

  if (memuat && !data) {
    return (
      <p data-testid="sekolah-memuat" className="mt-4 text-center text-[11.5px] text-ink-400">
        Memuat statistik sekolah…
      </p>
    );
  }

  if (!data) {
    return (
      <section data-testid="sekolah-galat" className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <p className="text-justify text-[11.5px] leading-relaxed text-ink-600">
          {galat ?? `Statistik ${t.unit} belum bisa dimuat.`}
        </p>
        <button
          type="button"
          data-testid="sekolah-coba-lagi"
          onClick={() => void muat()}
          className="mt-3 w-full rounded-full bg-persis-900 py-2.5 text-[11.5px] font-semibold text-white"
        >
          Coba lagi
        </button>
      </section>
    );
  }

  const s = data.siswa;
  const a = data.alumni;
  const maksTahun = Math.max(1, ...a.perTahun.map((t) => t.jumlah));

  return (
    <div data-testid="sekolah-dashboard">
      {/* Sapaan pemilik sekolah */}
      <section
        data-testid="sekolah-sapaan"
        className="mt-4 rounded-2xl border border-gold-400/30 bg-white p-4"
      >
        <p className="text-[9.5px] font-bold tracking-[0.16em] text-gold-600 uppercase">{`Admin ${t.statUnit}`}</p>
        <h1 className="font-header mt-1 text-[15px] leading-tight font-extrabold text-persis-900">
          {data.unit.nama}
        </h1>
        <p className="mt-1 text-justify text-[11px] leading-relaxed text-ink-600">
          {data.pengurusSekolah
            ? `Assalamu'alaikum, ${data.pengurusSekolah}. `
            : "Assalamu'alaikum. "}
          Berikut ringkasan data {data.unit.nama} — jumlah {t.sebutanKecil} dan alumni yang tercatat di sistem.
        </p>
        <p data-testid="sekolah-diperbarui" className="mt-2 text-[10px] text-ink-400">
          Diperbarui {jamWib(data.diperbarui)} WIB · {data.unit.jenjang}
          {data.unit.npsn ? ` · NPSN ${data.unit.npsn}` : ""}
        </p>
      </section>

      {/* Dua angka pokok */}
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <Kartu
          testid="sekolah-kartu-siswa"
          label={`${t.sebutan} aktif`}
          nilai={angka(s.aktif)}
          ikon="users"
          petunjuk="tercatat pada unit ini"
          utama
        />
        <Kartu
          testid="sekolah-kartu-alumni"
          label="Alumni"
          nilai={angka(a.total)}
          ikon="graduation-cap"
          petunjuk={
            a.total > 0
              ? `${angka(a.angkatan)} angkatan${a.terakhir ? ` · terakhir ${a.terakhir}` : ""}`
              : "belum ada di direktori alumni"
          }
        />
      </div>

      {/* Alumni per tahun lulus */}
      <section data-testid="sekolah-alumni" className="mt-3.5 rounded-2xl border border-black/[0.08] bg-white p-4">
        <h2 className="font-header text-[12.5px] font-bold text-ink-900">Alumni per tahun lulus</h2>
        <p className="mt-0.5 text-justify text-[10.5px] leading-relaxed text-ink-400">
          Diambil dari direktori alumni untuk {t.unit} ini. Direktori alumni dikelola pengurus pusat, jadi angkanya
          bertambah setelah data alumnus dicatat di sana.
        </p>
        {a.perTahun.length === 0 ? (
          <p data-testid="sekolah-alumni-kosong" className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400">
            Belum ada alumni {t.unit} ini yang tercatat di direktori alumni.
            {s.lulus > 0
              ? ` Namun data ${t.sebutanKecil} mencatat ${angka(s.lulus)} lulusan yang belum masuk direktori.`
              : ""}
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {a.perTahun.map((t) => (
              <li key={t.tahun} data-testid={`sekolah-alumni-${t.tahun}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11.5px] font-semibold text-ink-900">{t.tahun}</span>
                  <span className="text-[11px] font-bold text-persis-900">
                    {angka(t.jumlah)} <span className="font-normal text-ink-400">alumni</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream-100">
                  <span
                    className="block h-full rounded-full bg-gold-500"
                    style={{ width: `${(t.jumlah / maksTahun) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
