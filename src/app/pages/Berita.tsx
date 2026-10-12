import { useState } from "react";
import KartuBerita, { BagianTrending, type ItemKartu } from "../components/KartuBerita";
import JudulSeksi from "../components/JudulSeksi";
import { Icon } from "../components/Icons";
import type { Berita } from "../data/content";
import {
  beritaTerbaru,
  beritaTrending,
  beritaUtama,
  kategoriBerita,
  terbitSaja,
  useBerita,
} from "../lib/berita";
import { angkaRingkas, tanggalPanjang, tanggalRelatif } from "../lib/format";

const ikon = "h-[18px] w-[18px]";
const AWAL = 6;
const TAMBAH = 4;

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

export default function HalamanBerita({
  onBuka,
}: {
  onBuka: (slug: string) => void;
}) {
  const data = useBerita();
  const [kategori, setKategori] = useState("Semua");
  const [tampil, setTampil] = useState(AWAL);

  const semuaKategori = ["Semua", ...kategoriBerita(data)];
  const semua = beritaTerbaru(data);
  const utama = beritaUtama(data);
  const lain = semua.filter((b) => b.id !== utama?.id);
  const jumlahBerita = terbitSaja(data).length;
  const tersaring = kategori === "Semua" ? lain : lain.filter((b) => b.category === kategori);
  const daftar = tersaring.slice(0, tampil);

  return (
    <main data-testid="berita-page">
      <section aria-label="Gambar berita" className="relative h-[208px] w-full">
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
            {jumlahBerita} Berita · {semuaKategori.length - 1} Kategori
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label="Pengantar berita" className="px-5 pt-6">
          <p className="text-justify text-[12.5px] leading-relaxed text-ink-600">{data.halaman.pengantar}</p>
        </section>

        {utama ? (
          <section aria-label="Berita utama" className="px-5 pt-7">
            <JudulSeksi
              icon={<Icon name="sparkle" className={ikon} />}
              eyebrow="Terkini"
              title="Berita Utama"
              actionLabel={null}
            />
            <a
              href={`#berita/${utama.slug}`}
              onClick={(e) => {
                e.preventDefault();
                onBuka(utama.slug);
              }}
              className="block overflow-hidden rounded-2xl border border-black/[0.08] bg-white transition active:bg-cream-50"
            >
              <div className="relative h-[176px]">
                <img src={utama.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute top-3 left-3 rounded-full bg-gold-500 px-2.5 py-1 text-[9.5px] font-bold tracking-wide text-persis-950 uppercase">
                  {utama.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-header text-[14.5px] leading-snug font-bold text-ink-900">{utama.title}</h3>
                <p className="mt-1.5 line-clamp-3 text-justify text-[12px] leading-relaxed text-ink-600">
                  {utama.excerpt}
                </p>
                <p className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-persis-900">
                  <span>{tanggalPanjang(utama.date)}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="eye" className="h-3.5 w-3.5 text-gold-600" />
                    {angkaRingkas(utama.views)} dibaca
                  </span>
                </p>
              </div>
            </a>
          </section>
        ) : null}

        <section aria-label="Filter kategori berita" className="pt-7">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
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
                    ini ? "border-persis-900 bg-persis-900 text-white" : "border-black/[0.08] bg-white text-ink-600"
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label="Daftar berita" className="px-5 pt-5">
          <JudulSeksi
            icon={<Icon name="newspaper" className={ikon} />}
            title={kategori === "Semua" ? "Berita Terbaru" : `Kategori ${kategori}`}
            subtitle={`${tersaring.length} berita`}
            actionLabel={null}
          />
          {daftar.length === 0 ? (
            <p className="rounded-2xl border border-black/[0.08] bg-white p-4 text-justify text-[12px] leading-relaxed text-ink-600">
              Belum ada berita lain pada kategori ini. Silakan pilih kategori lain atau buka berita utama di atas.
            </p>
          ) : (
            <ul className="space-y-3">
              {daftar.map((b) => (
                <li key={b.id}>
                  <KartuBerita item={keKartu(b)} onOpen={() => onBuka(b.slug)} />
                </li>
              ))}
            </ul>
          )}

          {tersaring.length > tampil ? (
            <div className="mt-3.5">
              <p className="mb-2 text-center text-[10.5px] text-persis-900">
                Menampilkan {daftar.length} dari {tersaring.length} berita
              </p>
              <button
                type="button"
                onClick={() => setTampil((n) => n + TAMBAH)}
                className="w-full rounded-full border border-persis-900/20 bg-white py-3 text-[12.5px] font-bold text-persis-900 transition active:scale-[0.98]"
              >
                Tampilkan berita lainnya
              </button>
            </div>
          ) : null}
        </section>

        <div className="px-5 pt-8">
          <BagianTrending
            title="Paling Banyak Dibaca"
            subtitle="5 berita dengan pembaca terbanyak"
            items={beritaTrending(data, 5)}
            total={jumlahBerita}
            onOpen={(b: Berita) => onBuka(b.slug)}
          />
        </div>
      </div>
    </main>
  );
}
