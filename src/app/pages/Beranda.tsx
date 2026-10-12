import { useEffect, useState } from "react";
import GridMenu from "../components/GridMenu";
import { BagianTrending } from "../components/KartuBerita";
import Hero from "../components/Hero";
import KartuStatistik from "../components/KartuStatistik";
import JudulSeksi from "../components/JudulSeksi";
import Popup from "../components/Popup";
import { Icon } from "../components/Icons";
import type { Berita, Pengumuman } from "../data/content";
import {
  angkaRingkas,
  tanggalKotak,
  tanggalPanjang,
  tanggalPendek,
  tanggalRelatif,
} from "../lib/format";
import { beritaTrending, terbitSaja, useBerita } from "../lib/berita";
import { cariPengumuman, hitungDibaca as hitungDibacaPengumuman, pengumumanTerbaru, pengumumanUtama, usePengumuman } from "../lib/pengumuman";
import {
  agendaTerdekat,
  cariAgenda,
  hitungDibaca as hitungDibacaAgenda,
  useAgenda,
  type AgendaTampil,
} from "../lib/agenda";

const ikon = "h-[18px] w-[18px]";

/* -------------------------------- Pengumuman Terbaru -------------------------------- */

function BagianPengumumanTerbaru({ sasaran }: { sasaran?: string | null }) {
  const data = usePengumuman();
  const [pilih, setPilih] = useState<Pengumuman | null>(null);
  const terbaru = pengumumanTerbaru(data, 5);
  const utama = pengumumanUtama(data);
  const lain = utama ? terbaru.filter((p) => p.id !== utama.id).slice(0, 2) : terbaru.slice(0, 2);

  /* Notifikasi pengumuman membuka detailnya langsung. */
  useEffect(() => {
    if (!sasaran) return;
    const cocok = cariPengumuman(data, sasaran);
    if (!cocok) return;
    setPilih(cocok);
    document.querySelector('section[aria-label="Pengumuman terbaru"]')?.scrollIntoView({ block: "start" });
  }, [sasaran, data]);

  return (
    <section aria-label="Pengumuman terbaru">
      <JudulSeksi
        icon={<Icon name="megaphone" className={ikon} />}
        title="Pengumuman Terbaru"
        subtitle={`${terbaru.length} pengumuman terbaru`}
        tone="gold"
      />

      {utama ? (
      <article className="rounded-2xl border border-black/[0.08] border-l-[3px] border-l-gold-500 bg-white p-4">
        <p className="text-[9.5px] font-semibold tracking-[0.14em] text-persis-900 uppercase">
          {utama.pinned ? "Disematkan" : "Terbaru"} · {tanggalPanjang(utama.date)}
        </p>
        <h3 className="font-header mt-1.5 text-[14.5px] leading-snug font-bold text-ink-900">{utama.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-justify text-[12px] leading-relaxed text-ink-600">{utama.summary}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10.5px] font-medium text-persis-900">
            {utama.category}
          </span>
          <button
            type="button"
            onClick={() => setPilih(utama)}
            data-testid="pengumuman-baca"
            className="inline-flex items-center gap-1.5 rounded-full bg-persis-900 px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-persis-800 active:scale-[0.98]"
          >
            Baca
            <Icon name="arrow-right" className="h-3.5 w-3.5" />
          </button>
        </div>
      </article>
      ) : null}

      <ul className="mt-2.5 divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
        {lain.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setPilih(p)}
              aria-label={`Baca pengumuman: ${p.title}`}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-cream-50"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-persis-700/10 bg-mint-100 text-persis-800">
                <Icon name="megaphone" className={ikon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block line-clamp-2 text-[12.5px] leading-snug font-medium text-ink-900">{p.title}</span>
                <span className="mt-0.5 block text-[10.5px] text-persis-900">{p.category}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[10.5px] text-persis-900">
                {tanggalPendek(p.date)}
                <Icon name="chevron-right" className="h-3.5 w-3.5" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Popup
        open={pilih !== null}
        onClose={() => setPilih(null)}
        testId="popup-pengumuman"
        bagikan={pilih ? { judul: pilih.title, ringkasan: pilih.summary, jalur: `/#/beranda/pengumuman/${pilih.id}` } : undefined}
        title={pilih?.title ?? ""}
        icon={<Icon name="megaphone" className={ikon} />}
        keterangan={
          pilih ? `${pilih.category} · ${tanggalPanjang(pilih.date)} · ${angkaRingkas(pilih.views)} dibaca` : ""
        }
        detail={pilih?.detail ?? []}
      />
    </section>
  );
}

/* ------------------------------------ Pengumuman ------------------------------------ */

function BagianPengumuman() {
  const data = usePengumuman();
  const [pilih, setPilih] = useState<Pengumuman | null>(null);
  const items = pengumumanTerbaru(data, 5);

  /* Jumlah dibaca bertambah setiap pengumuman dibuka, lalu angkanya diperbarui. */
  const buka = (p: Pengumuman) => {
    setPilih(p);
    void hitungDibacaPengumuman(p.id).then((n) => {
      if (n === null) return;
      setPilih((kini) => (kini && kini.id === p.id ? { ...kini, views: n } : kini));
    });
  };

  return (
    <section aria-label="Daftar pengumuman">
      <JudulSeksi
        icon={<Icon name="newspaper" className={ikon} />}
        title="Pengumuman"
        subtitle="Lima pengumuman terbaru"
      />

      <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
        {items.map((p) => {
          const { day, month } = tanggalKotak(p.date);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => buka(p)}
                aria-label={`Baca pengumuman: ${p.title}`}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-cream-50"
              >
                <span className="w-10 shrink-0 border-r border-black/[0.06] pr-2 text-center">
                  <span className="font-header block text-[15px] leading-none font-bold text-persis-800">{day}</span>
                  <span className="mt-0.5 block text-[9.5px] font-semibold text-persis-900 uppercase">{month}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block line-clamp-2 text-[12.5px] leading-snug font-medium text-ink-900">
                    {p.title}
                  </span>
                  <span className="mt-0.5 inline-flex items-center gap-1.5 text-[10.5px] text-persis-900">
                    <Icon name="megaphone" className="h-3.5 w-3.5 text-gold-600" />
                    {p.category} · {tanggalRelatif(p.date)}
                  </span>
                </span>
                <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-persis-900" />
              </button>
            </li>
          );
        })}
      </ul>

      <Popup
        open={pilih !== null}
        onClose={() => setPilih(null)}
        testId="popup-pengumuman-lengkap"
        bagikan={pilih ? { judul: pilih.title, ringkasan: pilih.summary, jalur: `/#/beranda/pengumuman/${pilih.id}` } : undefined}
        title={pilih?.title ?? ""}
        icon={<Icon name="megaphone" className={ikon} />}
        keterangan={
          pilih ? `${pilih.category} · ${tanggalPanjang(pilih.date)} · ${angkaRingkas(pilih.views)} dibaca` : ""
        }
        detail={pilih?.detail ?? []}
      />
    </section>
  );
}

/* -------------------------------------- Agenda -------------------------------------- */

function BagianAgenda({ sasaran }: { sasaran?: string | null }) {
  const data = useAgenda();
  const [pilih, setPilih] = useState<AgendaTampil | null>(null);
  const items = agendaTerdekat(data, 5);

  /* Jumlah dibaca bertambah setiap detail agenda dibuka, lalu angkanya diperbarui. */
  const buka = (a: AgendaTampil) => {
    setPilih(a);
    void hitungDibacaAgenda(a.id).then((n) => {
      if (n === null) return;
      setPilih((kini) => (kini && kini.id === a.id ? { ...kini, views: n } : kini));
    });
  };

  /* Notifikasi agenda membuka detailnya langsung. */
  useEffect(() => {
    if (!sasaran) return;
    const cocok = cariAgenda(data, sasaran);
    if (!cocok) return;
    buka(cocok);
    document.querySelector('section[aria-label="Agenda kegiatan"]')?.scrollIntoView({ block: "start" });
  }, [sasaran, data]);

  return (
    <section aria-label="Agenda kegiatan">
      <JudulSeksi
        icon={<Icon name="calendar" className={ikon} />}
        title="Agenda"
        subtitle="Jadwal terdekat lebih dahulu"
      />

      <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
        {items.map((a) => {
          const { day, month } = tanggalKotak(a.date);
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => buka(a)}
                aria-label={`Lihat detail agenda: ${a.title}`}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-cream-50"
              >
                <span className="w-10 shrink-0 border-r border-black/[0.06] pr-2 text-center">
                  <span className="font-header block text-[15px] leading-none font-bold text-persis-800">{day}</span>
                  <span className="mt-0.5 block text-[9.5px] font-semibold text-persis-900 uppercase">{month}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block line-clamp-2 text-[12.5px] leading-snug font-medium text-ink-900">
                    {a.title}
                  </span>
                  <span className="mt-0.5 block line-clamp-1 text-[10.5px] text-persis-900">
                    {a.time} · {a.place}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-[10.5px] text-persis-900">
                  {tanggalPendek(a.date)}
                  <Icon name="chevron-right" className="h-3.5 w-3.5" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Popup
        open={pilih !== null}
        onClose={() => setPilih(null)}
        testId="popup-agenda"
        bagikan={pilih ? { judul: pilih.title, ringkasan: [pilih.date, pilih.time, pilih.place, pilih.detail[0]].filter(Boolean).join(" · "), jalur: `/#/beranda/agenda/${pilih.id}` } : undefined}
        title={pilih?.title ?? ""}
        icon={<Icon name="calendar" className={ikon} />}
        keterangan={
          pilih
            ? `${pilih.tag} · ${tanggalPanjang(pilih.date)} · ${pilih.time} · ${pilih.place} · ${angkaRingkas(pilih.views)} dibaca`
            : ""
        }
        detail={pilih?.detail ?? []}
      />
    </section>
  );
}

/* -------------------------------------- Beranda ------------------------------------- */

export default function Beranda({
  onPilihMenu,
  onBukaBerita,
  pengumumanBuka,
  agendaBuka,
}: {
  onPilihMenu: (halaman: string) => void;
  onBukaBerita: (b: Berita) => void;
  /** Pengumuman/agenda yang dibuka dari notifikasi. */
  pengumumanBuka?: string | null;
  agendaBuka?: string | null;
}) {
  /* Sorotan berita di beranda memakai data dari database. */
  const dataBerita = useBerita();

  return (
    <main>
      <Hero />
      <div className="mx-auto w-full max-w-[620px] px-5">
        <KartuStatistik />
        <div className="space-y-7 pt-7 pb-7">
          <GridMenu onSelect={onPilihMenu} />
          <BagianPengumumanTerbaru sasaran={pengumumanBuka} />
          <BagianTrending items={beritaTrending(dataBerita, 5)} total={terbitSaja(dataBerita).length} onOpen={onBukaBerita} />
          <BagianPengumuman />
          <BagianAgenda sasaran={agendaBuka} />
        </div>
      </div>
    </main>
  );
}
