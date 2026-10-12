import { Fragment, useEffect } from "react";
import TombolBagikan from "../components/TombolBagikan";
import KartuBerita, { KartuBacaJuga, type ItemKartu } from "../components/KartuBerita";
import SlotIklan from "../components/SlotIklan";
import JudulSeksi from "../components/JudulSeksi";
import { Icon } from "../components/Icons";
import type { Berita } from "../data/content";
import { beritaLain, beritaTerkait, cariBerita, hitungDibaca, useBerita } from "../lib/berita";
import { angkaRingkas, tanggalPendek, tanggalRelatif } from "../lib/format";

const ikon = "h-[18px] w-[18px]";

function keKartu(b: Berita): ItemKartu {
  return {
    slug: b.slug,
    tujuan: "berita",
    kategori: b.category,
    judul: b.title,
    ringkasan: b.excerpt,
    tanggalTeks: tanggalRelatif(b.date),
    metaIkon: "mata",
    metaTeks: `${angkaRingkas(b.views)} dibaca`,
    gambar: b.image,
  };
}

export function HalamanBeritaDetail({
  slug,
  onBuka,
  onKembali,
}: {
  slug: string;
  onBuka: (slug: string) => void;
  onKembali: () => void;
}) {
  const data = useBerita();
  const berita = cariBerita(data, slug);

  /* Setiap kali berita dibuka, penghitung dibaca bertambah. */
  useEffect(() => {
    if (slug) void hitungDibaca(slug);
  }, [slug]);

  if (!berita) {
    return (
      <main data-testid="berita-detail" className="mx-auto w-full max-w-[620px] px-5 pt-8 pb-8">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-5 text-center">
          <h1 className="font-header text-[15px] font-bold text-ink-900">Berita tidak ditemukan</h1>
          <p className="mt-1.5 text-justify text-[12px] leading-relaxed text-ink-600">
            Berita yang Anda cari mungkin sudah dipindahkan. Silakan kembali ke daftar berita untuk melihat kabar
            terbaru lembaga.
          </p>
          <button
            type="button"
            onClick={onKembali}
            className="mt-4 w-full rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
          >
            Kembali ke daftar berita
          </button>
        </div>
      </main>
    );
  }

  /* "Baca juga" diselipkan di tengah isi, seperti situs rujukan. */
  const jumlahBagian = Math.min(3, Math.max(1, Math.ceil(berita.body.length / 3)));
  const terkait = beritaTerkait(data, berita.slug, jumlahBagian);
  const posisi = terkait.map((_, i) => Math.round(((i + 1) * berita.body.length) / (terkait.length + 1)) - 1);
  const lainnya = beritaLain(data, berita.slug, 3);

  /* Satu slot iklan kecil disisipkan di antara paragraf. Posisinya dipilih yang belum
     dipakai kartu "baca juga" supaya tidak menumpuk. */
  const kandidatIklan = [1, 2, 3, berita.body.length - 1].filter(
    (i) => i >= 0 && i < berita.body.length,
  );
  const posisiIklan = kandidatIklan.find((i) => !posisi.includes(i)) ?? kandidatIklan[0];

  return (
    <main data-testid="berita-detail">
      <section aria-label="Gambar berita" className="relative">
        <img src={berita.image} alt="" className="h-[244px] w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-persis-950/70 via-persis-950/50 to-persis-950/95" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          <div className="flex flex-nowrap items-center gap-x-3">
            <span className="inline-block shrink-0 rounded-full bg-gold-500 px-2.5 py-1 text-[9.5px] font-bold tracking-wide text-persis-950 uppercase">
              {berita.category}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-white/90">
              <Icon name="calendar" className="h-3.5 w-3.5 shrink-0 text-gold-300" />
              {tanggalPendek(berita.date)}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-white/90">
              <Icon name="eye" className="h-3.5 w-3.5 shrink-0 text-gold-300" />
              {angkaRingkas(berita.views)} dibaca
            </span>
          </div>
          <h1 className="font-header mt-2.5 line-clamp-3 text-[16.5px] leading-snug font-extrabold text-white">
            {berita.title}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[10.5px] font-medium text-white/90">
            <Icon name="user" className="h-3.5 w-3.5 shrink-0 text-gold-300" />
            <span className="truncate">{berita.author}</span>
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label="Ringkasan berita" className="px-5 pt-5">
          <TombolBagikan konten={{ judul: berita.title, penulis: berita.author, ringkasan: berita.excerpt, gambar: berita.image, jalur: `/#/berita/${berita.slug}` }} />
          <p className="flex items-center gap-2 text-[9.5px] font-bold tracking-[0.16em] text-persis-900 uppercase">
            <Icon name="sparkle" className="h-3.5 w-3.5 shrink-0 text-gold-500" />
            Ringkasan
            <span aria-hidden="true" className="h-px flex-1 bg-gold-400/60" />
          </p>
          <p className="font-header mt-2.5 text-justify text-[13.5px] leading-relaxed font-medium text-ink-700 italic">
            <span
              aria-hidden="true"
              className="font-header align-[-4px] text-[20px] leading-none font-extrabold text-gold-500 not-italic"
            >
              “
            </span>
            {berita.excerpt}
            <span
              aria-hidden="true"
              className="font-header align-[-4px] text-[20px] leading-none font-extrabold text-gold-500 not-italic"
            >
              ”
            </span>
          </p>
        </section>

        <section aria-label="Isi berita" className="px-5 pt-5">
          <div className="space-y-4">
            {berita.body.map((paragraf, i) => {
              const kartu = posisi.indexOf(i);
              return (
                <Fragment key={i}>
                  <p className="text-justify text-[12.5px] leading-relaxed text-ink-700">{paragraf}</p>
                  {kartu >= 0 ? (
                    <KartuBacaJuga item={keKartu(terkait[kartu])} onOpen={() => onBuka(terkait[kartu].slug)} />
                  ) : null}
                  {i === posisiIklan ? <SlotIklan kunci={berita.slug} /> : null}
                </Fragment>
              );
            })}
          </div>
        </section>

        {lainnya.length > 0 ? (
          <section aria-label="Berita lainnya" className="px-5 pt-8">
            <JudulSeksi
              icon={<Icon name="newspaper" className={ikon} />}
              eyebrow="Baca juga"
              title="Berita Lainnya"
              actionLabel={null}
            />
            <ul className="space-y-3">
              {lainnya.map((d) => (
                <li key={d.id}>
                  <KartuBerita item={keKartu(d)} onOpen={() => onBuka(d.slug)} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="px-5 pt-7">
          <button
            type="button"
            onClick={onKembali}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-persis-900/20 bg-white py-3 text-[12.5px] font-bold text-persis-900 transition active:scale-[0.98]"
          >
            <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
            Kembali ke daftar berita
          </button>
        </div>
      </div>
    </main>
  );
}

export default HalamanBeritaDetail;
