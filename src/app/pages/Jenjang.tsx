import type { ReactNode } from "react";
import JudulSeksi from "../components/JudulSeksi";
import { gambar } from "../data/content";
import { Icon } from "../components/Icons";
import { unitJenjangDari, useJenjang, type JenjangTampil } from "../lib/jenjang";

const ikon = "h-[18px] w-[18px]";

/** Warna badge jenjang: mint, gold, rose — sama seperti situs rujukan. */
const nada: Record<string, string> = {
  mint: "bg-mint-deep text-persis-800",
  gold: "bg-pastelgold text-gold-700",
  rose: "bg-pastelrose text-persis-700",
};

type Jenjang = JenjangTampil;

/** Angka ringkas statistik pada halaman jenjang (mengikuti nilai bawaan rujukan). */
const JUMLAH_SISWA = "1.248";

/* ---------------------------------- Kartu jenjang ---------------------------------- */

function KartuJenjang({ j, jumlahUnit, kanan }: { j: Jenjang; jumlahUnit: number; kanan: ReactNode }) {
  return (
    <article className="card-elev w-full rounded-2xl p-3.5">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[13px] font-extrabold ${nada[j.tone] ?? nada.mint}`}
        >
          {j.short}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] leading-snug font-extrabold text-ink-900">{j.nama}</h3>
          <p className="mt-1 text-justify text-[10px] leading-snug font-medium text-ink-600">{j.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[16px] leading-none font-extrabold text-persis-800">{j.jumlah}</p>
          <p className="mt-1 text-[8.5px] font-bold tracking-[0.1em] text-persis-800/55 uppercase">{j.satuan}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-black/[0.06] pt-2 text-[11px] font-semibold text-persis-900">
        <span>
          {jumlahUnit} {j.istilah.unit}
        </span>
        {kanan}
      </div>
    </article>
  );
}

/* ------------------------------- Halaman daftar jenjang ------------------------------ */

export function HalamanJenjang({ onBuka }: { onBuka: (slug: string) => void }) {
  const { halaman, jenjang, unit } = useJenjang();
  const formal = jenjang.filter((j) => j.hitungJenjang);

  return (
    <main data-testid="jenjang-page">
      <section aria-label="Gambar pendidikan" className="relative h-[224px] w-full">
        <img
          src={halaman.gambar || gambar.kelas1}
          alt={halaman.gambarAlt}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-persis-950/95 via-persis-950/55 to-persis-950/15" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-6 text-center">
          <p className="text-[9px] font-bold tracking-[0.2em] text-gold-300 uppercase">PC PERSIS Cibatu</p>
          <h1 className="mt-1.5 text-[20px] leading-tight font-extrabold text-white">
            {halaman.judul || "Jenjang Pendidikan"}
          </h1>
          <p className="mt-1.5 text-[10px] font-semibold tracking-[0.16em] text-white/70 uppercase">
            {formal.length} Jenjang · {JUMLAH_SISWA} Siswa &amp; Santri
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label="Pengantar pendidikan" className="px-5 pt-6">
          <p className="text-justify text-[12.5px] leading-relaxed text-ink-600">{halaman.pengantar}</p>
        </section>

        <section aria-label="Jenjang pendidikan" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="graduation-cap" className={ikon} />}
            eyebrow="Lembaga Kami"
            title="Jenjang Pendidikan"
            actionLabel={null}
          />
          <ul className="space-y-3">
            {jenjang.map((j) => (
              <li key={j.id}>
                <button
                  type="button"
                  onClick={() => onBuka(j.slug)}
                  aria-label={`Lihat detail ${j.nama}`}
                  className="block w-full text-left transition active:scale-[0.99]"
                >
                  <KartuJenjang
                    j={j}
                    jumlahUnit={unitJenjangDari(unit, j.slug).length}
                    kanan={
                      <span className="inline-flex items-center gap-0.5">
                        Lihat detail
                        <Icon name="chevron-right" className="h-3.5 w-3.5" />
                      </span>
                    }
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Catatan MDT" className="px-5 pt-5">
          <p className="flex gap-2 rounded-2xl border border-black/[0.08] bg-white p-3.5 text-justify text-[11px] leading-relaxed text-ink-600">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
            <span>
              <span className="font-bold text-persis-900">Madrasah Diniyyah Takmiliyyah (MDT)</span> adalah pendidikan
              diniyyah sore hari di bawah MI dan tidak dihitung dalam jumlah jenjang formal.
            </span>
          </p>
        </section>

      </div>
    </main>
  );
}

/* ------------------------------ Halaman detail jenjang ------------------------------ */

export function HalamanJenjangDetail({
  slug,
  onBukaJenjang,
  onBukaUnit,
}: {
  slug: string;
  onBukaJenjang: (slug: string) => void;
  onBukaUnit: (slug: string) => void;
}) {
  const { jenjang, unit } = useJenjang();
  const j = jenjang.find((o) => o.slug === slug);
  if (!j) return null;

  const daftar = unitJenjangDari(unit, slug);
  const totalSiswa = daftar.reduce((n, u) => n + u.siswa, 0);
  const akreditasi =
    ["A", "B", "C"].find((a) => daftar.some((u) => u.akreditasi === a)) ?? daftar[0]?.akreditasi ?? "—";
  const lainnya = jenjang.filter((o) => o.slug !== slug);

  return (
    <main data-testid="jenjang-detail">
      <section aria-label={`Gambar ${j.short}`} className="relative h-[224px] w-full">
        <img src={j.gambar} alt={`Kegiatan pendidikan ${j.nama}`} className="h-full w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-persis-950/95 via-persis-950/55 to-persis-950/15" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-6 text-center">
          <h1 className="text-[19px] leading-tight font-extrabold text-white">{j.nama}</h1>
          <p className="mt-1.5 text-[10.5px] font-medium text-white/75">{j.tagline}</p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label={`Sekilas ${j.short}`} className="px-5 pt-6">
          <p className="text-justify text-[12.5px] leading-relaxed text-ink-600">{j.intro}</p>
        </section>

        <section aria-label={`Ringkasan ${j.short}`} className="px-5 pt-6">
          <dl
            data-testid="detail-stats"
            className="grid grid-cols-3 divide-x divide-black/[0.06] rounded-2xl border border-black/[0.08] bg-white py-3"
          >
            <div className="flex flex-col items-center px-2 text-center">
              <dt className="sr-only">{`Jumlah ${j.istilah.unit}`}</dt>
              <dd className="flex flex-col items-center">
                <span className="text-[16px] leading-none font-extrabold text-persis-800">{daftar.length}</span>
                <span className="mt-1 text-[8px] font-bold tracking-[0.1em] text-persis-900 uppercase">
                  {j.istilah.statUnit}
                </span>
              </dd>
            </div>
            <div className="flex flex-col items-center px-2 text-center">
              <dt className="sr-only">{`Jumlah ${j.istilah.peserta.toLowerCase()}`}</dt>
              <dd className="flex flex-col items-center">
                <span className="text-[16px] leading-none font-extrabold text-persis-800">
                  {totalSiswa.toLocaleString("id-ID")}
                </span>
                <span className="mt-1 text-[8px] font-bold tracking-[0.1em] text-persis-900 uppercase">
                  {j.istilah.statPeserta}
                </span>
              </dd>
            </div>
            <div className="flex flex-col items-center px-2 text-center">
              <dt className="sr-only">Akreditasi tertinggi</dt>
              <dd className="flex flex-col items-center">
                <span className="text-[16px] leading-none font-extrabold text-persis-800">{akreditasi}</span>
                <span className="mt-1 text-[8px] font-bold tracking-[0.1em] text-persis-900 uppercase">Akreditasi</span>
              </dd>
            </div>
          </dl>
        </section>

        <section aria-label="Daftar unit pendidikan" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="graduation-cap" className={ikon} />}
            eyebrow={`Unit ${j.istilah.statUnit}`}
            title={j.istilah.unitKumpulan}
            actionLabel={null}
          />
          <ul className="space-y-3">
            {daftar.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onBukaUnit(u.slug)}
                  aria-label={`Lihat detail ${u.nama}`}
                  className="block w-full text-left transition active:scale-[0.99]"
                >
                  <article className="card-elev w-full rounded-2xl p-3.5">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-persis-700/10 bg-mint-100 text-persis-800">
                        <Icon name="graduation-cap" className="h-[19px] w-[19px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-header text-[13px] leading-snug font-extrabold text-ink-900">{u.nama}</h3>
                        <p className="mt-1 text-[10.5px] leading-snug text-ink-600">
                          {j.pimpinan}: {u.pimpinan}
                        </p>
                        <p className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-semibold text-persis-900">
                            {`Akreditasi ${u.akreditasi}`}
                          </span>
                          <span className="rounded-full border border-black/[0.07] px-2.5 py-1 text-[10px] font-medium text-ink-600">
                            {u.siswa} {j.satuan}
                          </span>
                        </p>
                      </div>
                    </div>
                    <p className="mt-2.5 flex gap-1.5 text-[11px] leading-relaxed text-ink-600">
                      <Icon name="map-pin" className="mt-0.5 h-3 w-3 shrink-0 text-gold-600" />
                      <span className="text-justify">{u.alamat}</span>
                    </p>
                    <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-2.5">
                      <a
                        href={`tel:${u.kontak.replace(/-/g, "")}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-persis-700/15 px-2.5 py-1 text-[10.5px] font-semibold text-persis-900 transition active:scale-95"
                      >
                        <Icon name="phone" className="h-3 w-3" />
                        {u.kontak}
                      </a>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-persis-900">
                        Lihat detail {j.istilah.unit}
                        <Icon name="chevron-right" className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </article>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Jenjang lainnya" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="sparkle" className={ikon} />}
            eyebrow="Jelajahi"
            title="Jenjang Lainnya"
            actionLabel={null}
          />
          <ul className="space-y-2.5">
            {lainnya.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onBukaJenjang(o.slug)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-black/[0.08] bg-white p-3 text-left transition active:scale-[0.99]"
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[11.5px] font-extrabold ${nada[o.tone]}`}
                  >
                    {o.short}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] leading-snug font-bold text-ink-900">{o.nama}</span>
                    <span className="mt-0.5 block text-[10.5px] text-ink-600">
                      {unitJenjangDari(unit, o.slug).length} {o.istilah.unit} · {o.jumlah} {o.satuan}
                    </span>
                  </span>
                  <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-ink-400" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
