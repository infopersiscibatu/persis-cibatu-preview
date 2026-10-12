import JudulSeksi from "./JudulSeksi";
import { Icon } from "./Icons";
import type { Berita } from "../data/content";
import { angkaRingkas, tanggalRelatif } from "../lib/format";

export type ItemKartu = {
  slug: string;
  tujuan: string;
  kategori: string;
  judul: string;
  ringkasan: string;
  tanggalTeks: string;
  metaIkon: "jam" | "mata";
  metaTeks: string;
  gambar: string;
};

/** Kartu berita/artikel pada daftar — sama seperti situs rujukan. */
export default function KartuBerita({ item, onOpen }: { item: ItemKartu; onOpen: () => void }) {
  return (
    <a
      href={`#${item.tujuan}/${item.slug}`}
      onClick={(e) => {
        e.preventDefault();
        onOpen();
      }}
      className="flex items-stretch gap-3 rounded-2xl border border-black/[0.08] bg-white p-3 transition active:bg-cream-50"
    >
      <div className="flex h-[118px] min-w-0 flex-1 flex-col">
        <p className="text-[9.5px] font-bold tracking-[0.14em] text-gold-600 uppercase">{item.kategori}</p>
        <h3 className="mt-1 line-clamp-2 text-[12.5px] leading-snug font-bold text-ink-900">{item.judul}</h3>
        <p className="mt-1 line-clamp-2 text-justify text-[11px] leading-relaxed text-ink-600">{item.ringkasan}</p>
        <p className="mt-auto flex items-center gap-1.5 pt-1.5 text-[10px] text-persis-900">
          <span>{item.tanggalTeks}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Icon name={item.metaIkon === "jam" ? "clock" : "eye"} className="h-3 w-3 text-gold-600" />
            {item.metaTeks}
          </span>
        </p>
      </div>
      <img src={item.gambar} alt="" loading="lazy" className="h-[118px] w-[92px] shrink-0 rounded-xl object-cover" />
    </a>
  );
}

/** Kartu "Baca juga" yang diselipkan di antara paragraf isi berita. */
export function KartuBacaJuga({ item, onOpen }: { item: ItemKartu; onOpen: () => void }) {
  return (
    <a
      href={`#${item.tujuan}/${item.slug}`}
      onClick={(e) => {
        e.preventDefault();
        onOpen();
      }}
      className="block rounded-r-xl border-l-[3px] border-l-gold-500 bg-cream-100/70 px-3.5 py-2.5 transition active:bg-cream-50"
    >
      <p className="text-[9.5px] font-bold tracking-[0.16em] text-persis-900 uppercase">Baca juga</p>
      <p className="mt-1 text-[12px] leading-snug font-semibold text-persis-800">{item.judul}</p>
    </a>
  );
}

/** Daftar berita paling banyak dibaca (dipakai di beranda dan halaman berita). */
export function BagianTrending({
  title = "Berita Trending",
  subtitle = "Disusun dari jumlah pembaca terbanyak",
  items,
  total,
  onOpen,
}: {
  title?: string;
  subtitle?: string;
  items: Berita[];
  total?: number;
  onOpen: (b: Berita) => void;
}) {
  return (
    <section aria-label={title}>
      <JudulSeksi
        icon={<Icon name="flame" className="h-[18px] w-[18px]" />}
        title={title}
        subtitle={subtitle}
        actionLabel={null}
      />
      <ol className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
        {items.map((n, i) => (
          <li key={n.id}>
            <a
              href={`#berita/${n.slug}`}
              onClick={(e) => {
                e.preventDefault();
                onOpen(n);
              }}
              className="flex items-start gap-3 px-4 py-3 transition active:bg-cream-50"
            >
              <span className="font-header w-4 shrink-0 pt-0.5 text-[12px] font-bold text-persis-900">{i + 1}</span>
              <img src={n.image} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-[12.5px] leading-snug font-medium text-ink-900">{n.title}</h3>
                <p className="mt-1 flex items-center gap-2 text-[10.5px] text-persis-900">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="eye" className="h-3.5 w-3.5" />
                    {angkaRingkas(n.views)} dibaca
                  </span>
                  <span>·</span>
                  <span>{tanggalRelatif(n.date)}</span>
                </p>
              </div>
            </a>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[10.5px] text-persis-900">
        {items.length} teratas dari {total ?? items.length} berita
      </p>
    </section>
  );
}
