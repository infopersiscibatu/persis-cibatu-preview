import { useEffect } from "react";
import JudulSeksi from "../components/JudulSeksi";
import { Icon } from "../components/Icons";
import type { Kajian } from "../data/content";
import { kajianRutinAktif, kajianTerdekat, useKajian } from "../lib/kajian";

const ikon = "h-[18px] w-[18px]";

/** Jadwal kajian terdekat — sama seperti situs rujukan. */
function DaftarJadwal({
  items,
  title = "Kajian",
  subtitle = "Majelis ilmu bersama PC PERSIS Cibatu",
  judulId = "kajian-judul",
  sasaran,
}: {
  items: Kajian[];
  title?: string;
  subtitle?: string;
  judulId?: string;
  /** Jadwal yang dibuka dari notifikasi. */
  sasaran?: string | null;
}) {
  return (
    <section aria-label={title} aria-labelledby={judulId}>
      <JudulSeksi
        icon={<Icon name="book-open" className={ikon} />}
        title={title}
        subtitle={subtitle}
        actionLabel={null}
        judulId={judulId}
      />
      <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
        {items.map((n) => (
          <li key={n.id} data-testid={`kajian-${n.id}`} className={sasaran === n.id ? "bg-cream-50" : undefined}>
            <article className="flex items-start gap-3 px-4 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-persis-700/10 bg-mint-100 text-persis-800">
                <Icon name="book-open" className={ikon} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 text-[12.5px] leading-snug font-medium text-ink-900">{n.title}</h3>
                  {n.live ? (
                    <span className="shrink-0 text-[9.5px] font-semibold tracking-wide text-persis-900 uppercase">
                      Pekan ini
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[11px] text-ink-600">{n.ustadz}</p>
                <p className="mt-0.5 line-clamp-1 text-[10.5px] text-persis-900">
                  {n.day} · {n.time} · {n.place}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HalamanKajian({ sasaran }: { sasaran?: string | null } = {}) {
  const data = useKajian();
  const jadwal = kajianTerdekat(data);
  const rutin = kajianRutinAktif(data);

  /* Notifikasi kajian membuka jadwalnya langsung. */
  useEffect(() => {
    if (!sasaran) return;
    window.setTimeout(() => {
      document.querySelector(`[data-testid="kajian-${sasaran}"]`)?.scrollIntoView({ block: "center" });
    }, 300);
  }, [sasaran]);

  return (
    <main data-testid="kajian-page">
      <section aria-label="Gambar kajian" className="relative h-[208px] w-full">
        <img
          src={data.gambar.url}
          alt={data.gambar.alt}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-persis-950/95 via-persis-950/55 to-persis-950/15" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-5 text-center">
          <p className="text-[9px] font-bold tracking-[0.2em] text-gold-300 uppercase">PC PERSIS Cibatu</p>
          <h1 className="mt-1.5 text-[20px] leading-tight font-extrabold text-white">{data.halaman.judul}</h1>
          <p className="mt-1.5 text-[10px] font-semibold tracking-[0.16em] text-white/70 uppercase">
            {jadwal.length} Jadwal · {rutin.length} Kajian Rutin Pekanan
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label="Pengantar kajian" className="px-5 pt-6">
          <p className="text-justify text-[12.5px] leading-relaxed text-ink-600">{data.halaman.pengantar}</p>
        </section>

        <div className="px-5 pt-8">
          <DaftarJadwal
            items={jadwal}
            title="Jadwal Kajian Terdekat"
            subtitle="Disusun dari jadwal paling dekat"
            sasaran={sasaran}
          />
        </div>

        <section aria-label="Kajian rutin pekanan" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="calendar" className={ikon} />}
            eyebrow="Pekanan"
            title="Kajian Rutin"
            actionLabel={null}
          />
          <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
            {rutin.map((k) => (
              <li key={k.id}>
                <article className="flex items-start gap-3 px-4 py-3.5">
                  <span className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-persis-700/10 bg-mint-100">
                    <span className="text-[10px] font-extrabold tracking-wide text-persis-800 uppercase">
                      {k.hari}
                    </span>
                    <span className="mt-0.5 text-[8.5px] font-semibold text-persis-900/75">{k.waktu}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[12.5px] leading-snug font-bold text-ink-900">{k.judul}</h3>
                    <p className="mt-0.5 text-[11px] text-ink-600">{k.ustadz}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[10.5px] text-persis-900">
                      <Icon name="map-pin" className="h-3 w-3 shrink-0 text-gold-600" />
                      <span className="line-clamp-1">{k.peserta ? `${k.tempat} · ${k.peserta}` : k.tempat}</span>
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </main>
  );
}

export default HalamanKajian;
