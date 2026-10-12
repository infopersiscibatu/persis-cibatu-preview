import { useState } from "react";
import JudulSeksi from "../components/JudulSeksi";
import { Icon } from "../components/Icons";
import { gambar } from "../data/content";
import { cariProgram, progresProgram, sisaHari, type ProgramDonasi } from "../data/donasi";
import { kategoriDipakai, urutMendesak, useKatalogDonasi } from "../lib/programDonasi";
import { rupiah, rupiahSingkat } from "../lib/format";

const ikon = "h-[18px] w-[18px]";
const AWAL_TAMPIL = 4;
const TAMBAH_TAMPIL = 4;

/** Kartu program donasi: gambar kecil di kanan, kemajuan di bawah. */
export function KartuProgram({ program, onOpen }: { program: ProgramDonasi; onOpen: (slug: string) => void }) {
  const { persen } = progresProgram(program);
  const hari = sisaHari(program);

  return (
    <a
      href={`#/info/${program.slug}`}
      onClick={(e) => {
        e.preventDefault();
        onOpen(program.slug);
      }}
      data-testid={`donasi-kartu-${program.slug}`}
      className="flex items-stretch gap-3 rounded-2xl border border-black/[0.08] bg-white p-3 transition active:bg-cream-50"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-[9.5px] font-bold tracking-[0.14em] text-gold-600 uppercase">{program.kategori}</p>
        <h3 className="mt-1 line-clamp-2 text-[12.5px] leading-snug font-bold text-ink-900">{program.judul}</h3>
        <p className="mt-1 line-clamp-2 text-justify text-[11px] leading-relaxed text-ink-600">{program.ringkasan}</p>
        <span className="mt-auto block pt-2">
          <span className="block h-1.5 w-full overflow-hidden rounded-full bg-cream-100">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-persis-800 to-gold-500"
              style={{ width: `${persen}%` }}
            />
          </span>
          <span className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-persis-900">
            <span className="truncate">
              {rupiahSingkat(progresProgram(program).terkumpul)} dari {rupiahSingkat(program.target)}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">{persen}%</span>
          </span>
          <span className="mt-0.5 block text-[10px] text-persis-900">
            {hari > 0 ? `${hari} hari lagi` : "Batas waktu terlewat"} · {program.donatur} donatur
          </span>
        </span>
      </div>
      <img
        src={program.gambar}
        alt=""
        loading="lazy"
        className="w-[92px] shrink-0 self-stretch rounded-xl object-cover"
      />
    </a>
  );
}

/** Halaman donasi — sama seperti situs rujukan. */
export function HalamanDonasi({ onOpen }: { onOpen: (slug: string) => void }) {
  const [kategori, setKategori] = useState("Semua");
  const [tampil, setTampil] = useState(AWAL_TAMPIL);
  /* Program donasi dibaca dari server supaya perubahan di panel ZIS langsung tampil di sini. */
  const { daftar } = useKatalogDonasi();

  const pilihan = kategoriDipakai(daftar);
  const mendesak = urutMendesak(daftar);
  const utama = mendesak[0];
  const lain = daftar.filter((p) => p.id !== utama?.id);
  const tersaring = kategori === "Semua" ? lain : lain.filter((p) => p.kategori === kategori);
  const ditampilkan = tersaring.slice(0, tampil);
  const progresUtama = utama ? progresProgram(utama) : null;
  const hariUtama = utama ? sisaHari(utama) : 0;

  return (
    <main data-testid="donasi-page">
      <section aria-label="Gambar halaman donasi" className="relative h-[208px] w-full">
        <img
          src={gambar.masjidJabar}
          alt="Masjid dan gedung pendidikan PC PERSIS Cibatu"
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-persis-950/95 via-persis-950/55 to-persis-950/15" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-5 text-center">
          <p className="text-[9px] font-bold tracking-[0.2em] text-gold-300 uppercase">PC PERSIS Cibatu</p>
          <h1 className="mt-1.5 text-[20px] leading-tight font-extrabold text-white">Donasi &amp; Infaq</h1>
          <p className="mt-1.5 text-[10px] font-semibold tracking-[0.16em] text-white/70 uppercase">
            {daftar.length} Program · {pilihan.length - 1} Kategori
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label="Pengantar donasi" className="px-5 pt-6">
          <p className="text-justify text-[12.5px] leading-relaxed text-ink-600">
            Donasi dan infaq yang disalurkan melalui PC PERSIS Cibatu dikelola sebagai amanah: dicatat oleh bendahara,
            dipakai sesuai program, dan dilaporkan penggunaannya kepada donatur. Setiap program memiliki target, batas
            waktu, dan rincian kebutuhan yang dapat dibuka selengkapnya.
          </p>
        </section>

        {utama ? (
          <section aria-label="Program utama" className="px-5 pt-7">
            <JudulSeksi
              icon={<Icon name="sparkle" className={ikon} />}
              eyebrow="Paling mendesak"
              title="Program Utama"
            />
            <a
              href={`#/info/${utama.slug}`}
              onClick={(e) => {
                e.preventDefault();
                onOpen(utama.slug);
              }}
              data-testid="donasi-program-utama"
              className="block overflow-hidden rounded-2xl border border-black/[0.08] bg-white transition active:bg-cream-50"
            >
              <div className="relative h-[176px]">
                <img src={utama.gambar} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute top-3 left-3 rounded-full bg-gold-500 px-2.5 py-1 text-[9.5px] font-bold tracking-wide text-persis-950 uppercase">
                  {utama.kategori}
                </span>
                <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-persis-950/75 px-2.5 py-1 text-[9.5px] font-bold text-white">
                  <Icon name="clock" className="h-3 w-3 text-gold-300" />
                  {hariUtama} hari lagi
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-header text-[14.5px] leading-snug font-bold text-ink-900">{utama.judul}</h3>
                <p className="mt-1.5 line-clamp-3 text-justify text-[12px] leading-relaxed text-ink-600">
                  {utama.ringkasan}
                </p>
                <p className="mt-3 flex items-center justify-between gap-3 text-[10.5px]">
                  <span className="font-extrabold tracking-[0.1em] text-gold-700 uppercase">
                    <span className="tabular-nums">{progresUtama?.persen}% tercapai</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-persis-900">
                    <Icon name="users" className="h-3.5 w-3.5 text-gold-600" />
                    {progresUtama?.donatur} donatur
                  </span>
                </p>
                <span className="mt-1.5 block h-2 w-full overflow-hidden rounded-full bg-cream-100">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-persis-800 to-gold-500"
                    style={{ width: `${progresUtama?.persen ?? 0}%` }}
                  />
                </span>
                <p className="mt-2 text-[10.5px] text-persis-900">
                  <span className="font-header text-[12.5px] font-extrabold text-ink-900">
                    {rupiah(progresUtama?.terkumpul ?? utama.terkumpul)}
                  </span>{" "}
                  dari target {rupiah(utama.target)}
                </p>
              </div>
            </a>
          </section>
        ) : null}

        <section aria-label="Filter kategori donasi" className="pt-7">
          <div className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {pilihan.map((k) => {
              const aktif = k === kategori;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => {
                    setKategori(k);
                    setTampil(AWAL_TAMPIL);
                  }}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11.5px] font-semibold transition active:scale-95 ${
                    aktif ? "border-persis-900 bg-persis-900 text-white" : "border-black/[0.08] bg-white text-ink-700"
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label="Daftar program donasi" className="px-5 pt-5">
          <JudulSeksi
            icon={<Icon name="heart" className={ikon} />}
            title={kategori === "Semua" ? "Program Donasi" : `Kategori ${kategori}`}
            subtitle={`${tersaring.length} program`}
          />
          {ditampilkan.length === 0 ? (
            <p className="rounded-2xl border border-black/[0.08] bg-white p-4 text-justify text-[12px] leading-relaxed text-ink-600">
              Belum ada program lain pada kategori ini. Silakan pilih kategori lain atau buka program utama di atas.
            </p>
          ) : (
            <ul className="space-y-3">
              {ditampilkan.map((p) => (
                <li key={p.id}>
                  <KartuProgram program={p} onOpen={onOpen} />
                </li>
              ))}
            </ul>
          )}
          {tersaring.length > tampil ? (
            <div className="mt-3.5">
              <p className="mb-2 text-center text-[10.5px] text-persis-900">
                Menampilkan {ditampilkan.length} dari {tersaring.length} program
              </p>
              <button
                type="button"
                onClick={() => setTampil((n) => n + TAMBAH_TAMPIL)}
                data-testid="donasi-tampil-lainnya"
                className="w-full rounded-full border border-persis-900/20 bg-white py-3 text-[12.5px] font-bold text-persis-900 transition active:scale-[0.98]"
              >
                Tampilkan program lainnya
              </button>
            </div>
          ) : null}
        </section>

        <section aria-label="Program paling mendesak" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="newspaper" className={ikon} />}
            title="Paling Mendesak"
            subtitle="5 program dengan batas waktu terdekat"
          />
          <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
            {mendesak.slice(0, 5).map((p, i) => {
              const { persen, terkumpul } = progresProgram(p);
              const hari = sisaHari(p);
              return (
                <li key={p.id}>
                  <a
                    href={`#/info/${p.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onOpen(p.slug);
                    }}
                    className="flex items-start gap-3 px-3.5 py-3 transition active:bg-cream-50"
                  >
                    <span className="font-header mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-persis-900 text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] leading-snug font-semibold text-ink-900">{p.judul}</span>
                      <span className="mt-0.5 block text-[10.5px] text-persis-900">
                        {p.kategori} · {hari} hari lagi ·{" "}
                        <span className="tabular-nums">{persen}% tercapai</span>
                      </span>
                    </span>
                    <span className="font-header shrink-0 text-right text-[11.5px] font-bold text-ink-900">
                      <span className="tabular-nums">{rupiahSingkat(terkumpul)}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default HalamanDonasi;

/** Dipakai nanti oleh halaman detail program. */
export { cariProgram };
