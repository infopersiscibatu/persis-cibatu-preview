import { useState } from "react";
import KartuBerita, { type ItemKartu } from "../components/KartuBerita";
import JudulSeksi from "../components/JudulSeksi";
import { Icon } from "../components/Icons";
import { angkaRingkas, tanggalRelatif } from "../lib/format";
import type { Artikel } from "../data/content";
import {
  artikelTerbaru,
  artikelTerpopuler,
  kategoriArtikel,
  terbitSajaArtikel,
  useArtikel,
} from "../lib/artikel";

const ikon = "h-[18px] w-[18px]";
const AWAL = 6;
const TAMBAH = 4;

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

export default function HalamanArtikel({ onBuka }: { onBuka: (slug: string) => void }) {
  const data = useArtikel();
  const [kategori, setKategori] = useState("Semua");
  const [tampil, setTampil] = useState(AWAL);

  const semuaKategori = ["Semua", ...kategoriArtikel(data)];
  const semua = artikelTerbaru(data);
  const utama = semua[0];
  const lain = semua.slice(1);
  const jumlahArtikel = terbitSajaArtikel(data).length;
  const tersaring = kategori === "Semua" ? lain : lain.filter((a) => a.kategori === kategori);
  const daftar = tersaring.slice(0, tampil);
  const terpopuler = artikelTerpopuler(data, 5);

  return (
    <main data-testid="artikel-page">
      <section aria-label="Gambar artikel" className="relative h-[208px] w-full">
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
            {jumlahArtikel} Artikel · {semuaKategori.length - 1} Kategori
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label="Pengantar artikel" className="px-5 pt-6">
          <p className="text-justify text-[12.5px] leading-relaxed text-ink-600">{data.halaman.pengantar}</p>
        </section>

        {utama ? (
          <section aria-label="Artikel utama" className="px-5 pt-7">
            <JudulSeksi
              icon={<Icon name="sparkle" className={ikon} />}
              eyebrow="Terbaru"
              title="Artikel Utama"
              actionLabel={null}
            />
            <a
              href={`#artikel/${utama.slug}`}
              onClick={(e) => {
                e.preventDefault();
                onBuka(utama.slug);
              }}
              className="block overflow-hidden rounded-2xl border border-black/[0.08] bg-white transition active:bg-cream-50"
            >
              <div className="relative h-[176px]">
                <img src={utama.gambar} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute top-3 left-3 rounded-full bg-gold-500 px-2.5 py-1 text-[9.5px] font-bold tracking-wide text-persis-950 uppercase">
                  {utama.kategori}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-header text-[14.5px] leading-snug font-bold text-ink-900">{utama.judul}</h3>
                <p className="mt-1.5 line-clamp-3 text-justify text-[12px] leading-relaxed text-ink-600">
                  {utama.ringkasan}
                </p>
                <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-persis-900">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="user" className="h-3.5 w-3.5 text-gold-600" />
                    {utama.penulis}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" className="h-3.5 w-3.5 text-gold-600" />
                    {utama.menitBaca} menit baca
                  </span>
                </p>
              </div>
            </a>
          </section>
        ) : null}

        <section aria-label="Filter kategori artikel" className="pt-7">
          <div className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {semuaKategori.map((k) => {
              const ini = k === kategori;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={ini}
                  onClick={() => {
                    setKategori(k);
                    setTampil(AWAL);
                  }}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11.5px] font-semibold transition active:scale-95 ${
                    ini ? "border-persis-900 bg-persis-900 text-white" : "border-black/[0.08] bg-white text-ink-700"
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label="Daftar artikel" className="px-5 pt-5">
          <JudulSeksi
            icon={<Icon name="book-open" className={ikon} />}
            title={kategori === "Semua" ? "Artikel Terbaru" : `Kategori ${kategori}`}
            subtitle={`${tersaring.length} artikel`}
            actionLabel={null}
          />
          {daftar.length === 0 ? (
            <p className="rounded-2xl border border-black/[0.08] bg-white p-4 text-justify text-[12px] leading-relaxed text-ink-600">
              Belum ada artikel lain pada kategori ini. Silakan pilih kategori lain atau buka artikel utama di atas.
            </p>
          ) : (
            <ul className="space-y-3">
              {daftar.map((a) => (
                <li key={a.id}>
                  <KartuBerita item={keKartu(a)} onOpen={() => onBuka(a.slug)} />
                </li>
              ))}
            </ul>
          )}

          {tersaring.length > tampil ? (
            <div className="mt-3.5">
              <p className="mb-2 text-center text-[10.5px] text-persis-900">
                Menampilkan {daftar.length} dari {tersaring.length} artikel
              </p>
              <button
                type="button"
                onClick={() => setTampil((n) => n + TAMBAH)}
                className="w-full rounded-full border border-persis-900/20 bg-white py-3 text-[12.5px] font-bold text-persis-900 transition active:scale-[0.98]"
              >
                Tampilkan artikel lainnya
              </button>
            </div>
          ) : null}
        </section>

        <div className="px-5 pt-8">
          <section aria-label="Artikel paling banyak dibaca">
            <JudulSeksi
              icon={<Icon name="flame" className={ikon} />}
              title="Paling Banyak Dibaca"
              subtitle="5 artikel dengan pembaca terbanyak"
              actionLabel={null}
            />
            <ol className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
              {terpopuler.map((a, i) => (
                <li key={a.id}>
                  <a
                    href={`#artikel/${a.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onBuka(a.slug);
                    }}
                    className="flex items-start gap-3 px-4 py-3 transition active:bg-cream-50"
                  >
                    <span className="font-header w-4 shrink-0 pt-0.5 text-[12px] font-bold text-persis-900">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-[12.5px] leading-snug font-medium text-ink-900">{a.judul}</h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-persis-900">
                        <span className="inline-flex items-center gap-1">
                          <Icon name="user" className="h-3 w-3 text-gold-600" />
                          {a.penulis}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="clock" className="h-3 w-3 text-gold-600" />
                          {a.menitBaca} menit baca
                        </span>
                        <span>·</span>
                        <span>{angkaRingkas(a.dibaca)} dibaca</span>
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[10.5px] text-persis-900">
              {terpopuler.length} teratas dari {jumlahArtikel} artikel
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
