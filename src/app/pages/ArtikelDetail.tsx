import { Fragment, useEffect } from "react";
import TombolBagikan from "../components/TombolBagikan";
import KartuBerita, { KartuBacaJuga, type ItemKartu } from "../components/KartuBerita";
import SlotIklan from "../components/SlotIklan";
import JudulSeksi from "../components/JudulSeksi";
import { Icon } from "../components/Icons";
import type { Artikel } from "../data/content";
import { artikelLainnya, cariArtikel, hitungDibaca, jumlahBacaJuga, useArtikel } from "../lib/artikel";
import { tanggalPendek, tanggalRelatif } from "../lib/format";

const ikon = "h-[18px] w-[18px]";

function keKartu(a: Artikel): ItemKartu {
  return {
    slug: a.slug,
    tujuan: "artikel",
    kategori: a.kategori,
    judul: a.judul,
    ringkasan: a.ringkasan,
    tanggalTeks: tanggalRelatif(a.tanggal),
    metaIkon: "jam",
    metaTeks: `${a.menitBaca} menit baca`,
    gambar: a.gambar,
  };
}

export function HalamanArtikelDetail({
  slug,
  onBuka,
  onKembali,
}: {
  slug: string;
  onBuka: (slug: string) => void;
  onKembali: () => void;
}) {
  const data = useArtikel();
  const artikel = cariArtikel(data, slug);

  /* Setiap kali artikel dibuka, penghitung dibaca bertambah. */
  useEffect(() => {
    if (slug) void hitungDibaca(slug);
  }, [slug]);

  if (!artikel) {
    return (
      <main data-testid="artikel-detail" className="mx-auto w-full max-w-[620px] px-5 pt-8 pb-8">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-5 text-center">
          <h1 className="font-header text-[15px] font-bold text-ink-900">Artikel tidak ditemukan</h1>
          <p className="mt-1.5 text-justify text-[12px] leading-relaxed text-ink-600">
            Artikel yang Anda cari mungkin sudah dipindahkan. Silakan kembali ke daftar artikel untuk membaca tulisan
            terbaru.
          </p>
          <button
            type="button"
            onClick={onKembali}
            className="mt-4 w-full rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
          >
            Kembali ke daftar artikel
          </button>
        </div>
      </main>
    );
  }

  /* "Baca juga" diselipkan di tengah isi, seperti situs rujukan. */
  const jumlahParagraf = artikel.isi.length;
  const jumlahBagian = jumlahBacaJuga(artikel);
  const bacaJuga = artikelLainnya(data, artikel.slug, jumlahBagian);
  const posisi = bacaJuga.map((_, i) => Math.round(((i + 1) * jumlahParagraf) / (bacaJuga.length + 1)) - 1);
  const lainnya = artikelLainnya(data, artikel.slug, 3);

  /* Satu slot iklan kecil disisipkan di antara paragraf. Posisinya dipilih yang belum
     dipakai kartu "baca juga" supaya tidak menumpuk. */
  const kandidatIklan = [1, 2, 3, artikel.isi.length - 1].filter(
    (i) => i >= 0 && i < artikel.isi.length,
  );
  const posisiIklan = kandidatIklan.find((i) => !posisi.includes(i)) ?? kandidatIklan[0];

  return (
    <main data-testid="artikel-detail">
      <section aria-label="Gambar artikel" className="relative">
        <img src={artikel.gambar} alt="" className="h-[244px] w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-persis-950/70 via-persis-950/50 to-persis-950/95" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          <div className="flex flex-nowrap items-center gap-x-3">
            <span className="inline-block shrink-0 rounded-full bg-gold-500 px-2.5 py-1 text-[9.5px] font-bold tracking-wide text-persis-950 uppercase">
              {artikel.kategori}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-white/90">
              <Icon name="calendar" className="h-3.5 w-3.5 shrink-0 text-gold-300" />
              {tanggalPendek(artikel.tanggal)}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-white/90">
              <Icon name="clock" className="h-3.5 w-3.5 shrink-0 text-gold-300" />
              {artikel.menitBaca} menit baca
            </span>
          </div>
          <h1 className="font-header mt-2.5 line-clamp-3 text-[16.5px] leading-snug font-extrabold text-white">
            {artikel.judul}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[10.5px] font-medium text-white/90">
            <Icon name="user" className="h-3.5 w-3.5 shrink-0 text-gold-300" />
            <span className="truncate">{artikel.penulis}</span>
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label="Ringkasan artikel" className="px-5 pt-5">
          <TombolBagikan konten={{ judul: artikel.judul, penulis: artikel.penulis, ringkasan: artikel.ringkasan, gambar: artikel.gambar, jalur: `/#/artikel/${artikel.slug}` }} />
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
            {artikel.ringkasan}
            <span
              aria-hidden="true"
              className="font-header align-[-4px] text-[20px] leading-none font-extrabold text-gold-500 not-italic"
            >
              ”
            </span>
          </p>
        </section>

        <section aria-label="Isi artikel" className="px-5 pt-5">
          <div className="space-y-4">
            {artikel.isi.map((paragraf, i) => {
              const kartu = posisi.indexOf(i);
              return (
                <Fragment key={i}>
                  <p className="text-justify text-[12.5px] leading-relaxed text-ink-700">{paragraf}</p>
                  {kartu >= 0 ? (
                    <KartuBacaJuga item={keKartu(bacaJuga[kartu])} onOpen={() => onBuka(bacaJuga[kartu].slug)} />
                  ) : null}
                  {i === posisiIklan ? <SlotIklan kunci={artikel.slug} /> : null}
                </Fragment>
              );
            })}
          </div>
        </section>

        {lainnya.length > 0 ? (
          <section aria-label="Artikel lainnya" className="px-5 pt-8">
            <JudulSeksi
              icon={<Icon name="book-open" className={ikon} />}
              eyebrow="Baca juga"
              title="Artikel Lainnya"
              actionLabel={null}
            />
            <ul className="space-y-3">
              {lainnya.map((a) => (
                <li key={a.id}>
                  <KartuBerita item={keKartu(a)} onOpen={() => onBuka(a.slug)} />
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
            Kembali ke daftar artikel
          </button>
        </div>
      </div>
    </main>
  );
}

export default HalamanArtikelDetail;
