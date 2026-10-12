import { useState } from "react";
import TombolBagikan from "../components/TombolBagikan";
import FormDonasi, { type IsianDonasi } from "../components/FormDonasi";
import JudulSeksi from "../components/JudulSeksi";
import { Icon } from "../components/Icons";
import { KartuProgram } from "./Donasi";
import { identitas } from "../data/content";
import {
  cariProgram,
  donaturProgram,
  progresProgram,
  riwayatProgram,
  sisaHari,
  tabDonasi,
} from "../data/donasi";
import { kirimDonasiKeServer, menungguProgram, simpanMenunggu, type DonasiMenunggu } from "../lib/donasiMenunggu";
import { useKatalogDonasi, type ProgramLengkap } from "../lib/programDonasi";
import { hariKe, rupiah, tanggalKotak, tanggalPanjang, tanggalPendek, tanggalRelatif } from "../lib/format";

const ikon = "h-[18px] w-[18px]";

/** Halaman detail program donasi — sama seperti situs rujukan. */
export function HalamanDonasiDetail({
  slug,
  onBuka,
  onKembali,
}: {
  slug: string;
  onBuka: (slug: string) => void;
  onKembali: () => void;
}) {
  /* Program, donatur, dan riwayat dibaca dari server (diurus di halaman Admin ZIS). */
  const { daftar, rekening, metodeProgram } = useKatalogDonasi();
  const program: ProgramLengkap | undefined = daftar.find((p) => p.slug === slug) ?? cariProgram(slug);
  const [tab, setTab] = useState("keterangan");
  const [formBuka, setFormBuka] = useState(false);
  const [galat, setGalat] = useState("");
  const [baru, setBaru] = useState<IsianDonasi | null>(null);
  const [menunggu, setMenunggu] = useState<DonasiMenunggu[]>(() => (program ? menungguProgram(program.slug) : []));

  if (!program) {
    return (
      <main data-testid="donasi-detail" className="mx-auto w-full max-w-[620px] px-5 pt-8 pb-8">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-5 text-center">
          <h1 className="font-header text-[15px] font-bold text-ink-900">Program donasi tidak ditemukan</h1>
          <p className="mt-1.5 text-justify text-[12px] leading-relaxed text-ink-600">
            Program yang Anda cari mungkin sudah ditutup atau dipindahkan. Silakan kembali ke daftar donasi untuk melihat
            program yang sedang berjalan.
          </p>
          <button
            type="button"
            onClick={onKembali}
            className="mt-4 w-full rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
          >
            Kembali ke daftar donasi
          </button>
        </div>
      </main>
    );
  }

  const { terkumpul, donatur, persen } = progresProgram(program);
  const hari = sisaHari(program);
  const sisa = Math.max(0, program.target - terkumpul);
  const donaturTercatat =
    program.donaturTampil && program.donaturTampil.length > 0
      ? program.donaturTampil.slice(0, 8)
      : donaturProgram(program.slug).slice(0, 8);
  const totalRincian = program.rincian.reduce((t, r) => t + r.jumlah, 0);
  const lainnya = daftar.filter((p) => p.slug !== program.slug).slice(0, 3);
  const riwayat =
    program.riwayat && program.riwayat.length > 0 ? program.riwayat : riwayatProgram(program);
  const totalMenunggu = menunggu.reduce((t, d) => t + d.nominal, 0);
  /* Metode pembayaran khusus program ini; diatur petugas di halaman Admin ZIS. */
  const metodeBerlaku = metodeProgram(program);
  const panduanMetode = (nama: string) =>
    metodeBerlaku.find((m) => m.nama === nama) ?? metodeBerlaku[0];

  const pesanWa = [
    "*Konfirmasi donasi — PC PERSIS Cibatu*",
    "",
    `Program: ${program.judul}`,
    `Kategori: ${program.kategori}`,
    "",
    "Assalamu'alaikum, saya ingin menyalurkan donasi untuk program tersebut. Mohon dibantu pencatatannya. Terima kasih.",
  ].join("\n");
  const tautanWa = `https://wa.me/${identitas.whatsapp.replace(/\D/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(pesanWa)}`;

  const kirim = async (isian: IsianDonasi) => {
    /* Donasi dikirim ke server supaya petugas ZIS dapat memverifikasinya,
       lalu salinannya dicatat di peramban agar langsung tampil sebagai menunggu. */
    try {
      const donasi = await kirimDonasiKeServer({
        program: program.slug,
        nama: isian.nama,
        anonim: isian.anonim,
        telepon: isian.whatsapp,
        jumlah: isian.nominal,
        pesan: isian.pesan,
        metode: isian.metode,
      });
      const catatan: DonasiMenunggu = {
        id: String(donasi.id),
        slug: program.slug,
        nama: isian.nama,
        anonim: isian.anonim,
        nominal: isian.nominal,
        whatsapp: isian.whatsapp,
        pesan: isian.pesan,
        metode: isian.metode,
        waktu: hariKe(0),
      };
      simpanMenunggu(catatan);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Donasi belum bisa dikirim. Coba lagi.");
      return;
    }
    setMenunggu(menungguProgram(program.slug));
    setFormBuka(false);
    setGalat("");
    setBaru(isian);
  };

  return (
    <main data-testid="donasi-detail">
      <section aria-label="Gambar program donasi" className="relative">
        <img src={program.gambar} alt="" className="h-[244px] w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-persis-950/70 via-persis-950/50 to-persis-950/95" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          <div className="flex flex-nowrap items-center gap-x-3">
            <span className="inline-block shrink-0 rounded-full bg-gold-500 px-2.5 py-1 text-[9.5px] font-bold tracking-wide text-persis-950 uppercase">
              {program.kategori}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-white/90">
              {hari > 0 ? `${hari} hari lagi` : "Batas waktu terlewat"}
            </span>
          </div>
          <h1 className="font-header mt-2.5 line-clamp-3 text-[16.5px] leading-snug font-extrabold text-white">
            {program.judul}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[10.5px] font-medium text-white/90">
            <Icon name="user" className="h-3.5 w-3.5 shrink-0 text-gold-300" />
            <span className="truncate">{program.pengelola}</span>
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label="Dana terkumpul" className="px-5 pt-5">
          <TombolBagikan konten={{ judul: program.judul, penulis: program.pengelola, ringkasan: program.ringkasan, gambar: program.gambar, jalur: `/#/info/${program.slug}` }} />
          <article data-testid="donasi-dana-terkumpul" className="rounded-2xl border border-black/[0.08] bg-white p-4">
            <p className="text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">Dana Terkumpul</p>
            <p className="font-header mt-2 text-[26px] leading-none font-extrabold tracking-[-0.01em] tabular-nums text-ink-900">
              {rupiah(terkumpul)}
            </p>
            <p className="mt-1.5 text-[11px] text-persis-900">dari target {rupiah(program.target)}</p>
            <p className="mt-3.5 flex items-center justify-between gap-3 text-[10.5px]">
              <span className="font-extrabold tracking-[0.1em] tabular-nums text-gold-700 uppercase">
                {persen}% tercapai
              </span>
              <span className="inline-flex items-center gap-1.5 text-persis-900">
                <Icon name="users" className="h-3.5 w-3.5 text-gold-600" />
                <span className="tabular-nums">{donatur} donatur</span>
              </span>
            </p>
            <span className="mt-1.5 block h-2 w-full overflow-hidden rounded-full bg-cream-100">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-persis-800 to-gold-500"
                style={{ width: `${persen}%` }}
              />
            </span>
            <dl className="mt-3.5 divide-y divide-black/[0.06] border-t border-black/[0.06]">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-[10.5px] font-bold tracking-[0.12em] text-persis-900 uppercase">Sisa kebutuhan</dt>
                <dd className="font-header text-[12.5px] font-bold tabular-nums text-ink-900">{rupiah(sisa)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-[10.5px] font-bold tracking-[0.12em] text-persis-900 uppercase">Batas waktu</dt>
                <dd className="text-[12px] font-medium text-ink-900">{tanggalPanjang(program.batas)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setFormBuka(true)}
              data-testid="donasi-salurkan"
              className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 py-3.5 text-[13px] font-bold text-white shadow-[0_12px_26px_-16px_rgba(7,51,39,0.9)] transition active:scale-[0.98]"
            >
              <Icon name="heart" className="h-4 w-4" />
              Salurkan Donasi
            </button>
          </article>
        </section>

        <section aria-label="Informasi program" className="px-5 pt-5">
          <div
            role="tablist"
            aria-label="Informasi program donasi"
            className="flex gap-1 rounded-full border border-black/[0.08] bg-white p-1"
          >
            {tabDonasi.map((t) => {
              const aktif = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={aktif}
                  onClick={() => setTab(t.id)}
                  data-testid={`donasi-tab-${t.id}`}
                  className={`flex-1 rounded-full py-2 text-[11.5px] font-bold transition active:scale-[0.98] ${
                    aktif ? "bg-persis-900 text-white" : "text-persis-900"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            data-testid={`donasi-panel-${tab}`}
            className="fade-in mt-3 rounded-2xl border border-black/[0.08] bg-white p-4"
          >
            {tab === "keterangan" ? (
              <>
                <p className="font-header text-justify text-[13px] leading-relaxed font-medium text-ink-700 italic">
                  <span
                    aria-hidden="true"
                    className="font-header align-[-4px] text-[19px] leading-none font-extrabold text-gold-500 not-italic"
                  >
                    “
                  </span>
                  {program.ringkasan}
                  <span
                    aria-hidden="true"
                    className="font-header align-[-4px] text-[19px] leading-none font-extrabold text-gold-500 not-italic"
                  >
                    ”
                  </span>
                </p>
                <div className="mt-3.5 space-y-3.5 border-t border-black/[0.06] pt-3.5">
                  {program.body.map((p, i) => (
                    <p
                      key={i}
                      className={`text-justify text-[12px] leading-relaxed ${
                        i === 0 ? "font-medium text-ink-900" : "text-ink-700"
                      }`}
                    >
                      {p}
                    </p>
                  ))}
                </div>
                <p className="mt-4 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3.5">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                    <Icon name="wallet" className="h-[15px] w-[15px] text-gold-600" />
                    Rincian Penggunaan Dana
                  </span>
                  <span className="shrink-0 text-[10.5px] tabular-nums text-persis-900">{rupiah(totalRincian)}</span>
                </p>
                <ul className="mt-2 divide-y divide-black/[0.06]">
                  {program.rincian.map((r) => (
                    <li key={r.item} className="flex items-start justify-between gap-3 py-2.5">
                      <span className="min-w-0 flex-1 text-[11.5px] leading-snug font-medium text-ink-900">{r.item}</span>
                      <span className="font-header shrink-0 text-[11.5px] font-bold tabular-nums text-ink-900">
                        {rupiah(r.jumlah)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-justify text-[10.5px] leading-relaxed text-ink-600">
                  Rincian di atas adalah rencana kebutuhan. Bila dana terkumpul melebihi target, kelebihannya dialihkan ke
                  program serupa dengan persetujuan pengurus dan dilaporkan kepada donatur.
                </p>
              </>
            ) : null}

            {tab === "donatur" ? (
              <>
                <p className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                    <Icon name="users" className="h-[15px] w-[15px] text-gold-600" />
                    Donatur Terbaru
                  </span>
                  <span className="shrink-0 text-[10.5px] tabular-nums text-persis-900">
                    {donaturTercatat.length} dari {donatur} donatur
                  </span>
                </p>

                {menunggu.length > 0 ? (
                  <div
                    data-testid="donasi-menunggu"
                    className="mt-2.5 rounded-xl border border-black/[0.08] bg-cream-50 p-3"
                  >
                    <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                      <Icon name="clock" className="h-[15px] w-[15px] text-gold-600" />
                      Menunggu Verifikasi
                    </p>
                    <p className="mt-1.5 text-justify text-[11px] leading-relaxed text-ink-600">
                      Ada <b>{menunggu.length} donasi</b> sejumlah <b>{rupiah(totalMenunggu)}</b> yang sedang diperiksa
                      bendahara. Setelah dinyatakan sah, jumlahnya menambah dana terkumpul dan donaturnya tampil pada
                      daftar di bawah.
                    </p>
                  </div>
                ) : null}

                <ul className="mt-2 divide-y divide-black/[0.06]">
                  {donaturTercatat.map((d) => (
                    <li key={d.id} className="flex items-start justify-between gap-3 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] font-semibold text-ink-900">{d.nama}</span>
                        <span className="mt-0.5 block text-[10.5px] text-persis-900">
                          {d.metode} · {tanggalRelatif(d.waktu)}
                        </span>
                      </span>
                      <span className="font-header shrink-0 text-[12px] font-bold tabular-nums text-ink-900">
                        {rupiah(d.jumlah)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-justify text-[10.5px] leading-relaxed text-ink-600">
                  Nama donatur ditampilkan dengan izin yang bersangkutan. Donatur yang memilih tidak disebut namanya
                  dicatat sebagai Hamba Allah pada daftar ini.
                </p>
              </>
            ) : null}

            {tab === "riwayat" ? (
              <>
                <p className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                    <Icon name="sparkle" className="h-[15px] w-[15px] text-gold-500" />
                    Riwayat Program
                  </span>
                  <span className="shrink-0 text-[10.5px] text-persis-900">{riwayat.length} catatan</span>
                </p>
                <ul className="mt-2.5 space-y-3">
                  {riwayat.map((c) => {
                    const kotak = tanggalKotak(c.tanggal);
                    return (
                      <li key={c.id} className="flex gap-3">
                        <span className="flex w-[42px] shrink-0 flex-col items-center rounded-xl bg-cream-50 py-1.5">
                          <span className="font-header text-[13px] leading-none font-extrabold text-ink-900">
                            {kotak.day}
                          </span>
                          <span className="mt-0.5 text-[9.5px] font-semibold tracking-[0.06em] text-persis-900 uppercase">
                            {kotak.month}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span className="text-[12px] leading-snug font-semibold text-ink-900">{c.judul}</span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-[3px] text-[9px] font-bold tracking-[0.08em] uppercase ${
                                c.jenis === "Penyaluran" ? "bg-mint-deep text-persis-800" : "bg-cream-100 text-persis-900"
                              }`}
                            >
                              {c.jenis}
                            </span>
                          </span>
                          <span className="mt-1 block text-justify text-[11px] leading-relaxed text-ink-600">
                            {c.keterangan}
                          </span>
                          {c.nominal && c.nominal > 0 ? (
                            <span
                              data-testid="riwayat-nominal"
                              className="font-header mt-1 block text-[11.5px] font-bold tabular-nums text-ink-900"
                            >
                              {rupiah(c.nominal)}
                            </span>
                          ) : c.porsi ? (
                            <span className="font-header mt-1 block text-[11.5px] font-bold tabular-nums text-ink-900">
                              {rupiah(Math.round(terkumpul * c.porsi))}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3.5 text-justify text-[10.5px] leading-relaxed text-ink-600">
                  Catatan terakhir diperbarui {tanggalPendek(riwayat[0]?.tanggal ?? program.batas)}. Riwayat ditambah
                  setiap ada pencairan, laporan penggunaan dana, atau pemeriksaan bendahara.
                </p>
              </>
            ) : null}
          </div>
        </section>

        {lainnya.length > 0 ? (
          <section aria-label="Program lainnya" className="px-5 pt-8">
            <JudulSeksi
              icon={<Icon name="heart" className={ikon} />}
              eyebrow="Salurkan juga"
              title="Program Lainnya"
            />
            <ul className="space-y-3">
              {lainnya.map((p) => (
                <li key={p.id}>
                  <KartuProgram program={p} onOpen={onBuka} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="px-5 pt-7">
          <button
            type="button"
            onClick={onKembali}
            data-testid="donasi-kembali"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-persis-900/20 bg-white py-3 text-[12.5px] font-bold text-persis-900 transition active:scale-[0.98]"
          >
            <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
            Kembali ke daftar donasi
          </button>
        </div>
      </div>

      <FormDonasi
        metodeTersedia={metodeBerlaku}
        open={formBuka}
        galat={galat}
        program={program}
        onClose={() => setFormBuka(false)}
        onSubmit={kirim}
      />

      {baru ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          role="dialog"
          aria-modal="true"
          aria-label="Donasi sedang ditinjau"
          data-testid="donasi-notifikasi"
        >
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={() => setBaru(null)}
            className="absolute inset-0 cursor-default bg-persis-950/60"
          />
          <div className="popup-panel relative flex max-h-[90vh] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl bg-cream-50 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.6)]">
            <div className="min-h-0 flex-1 overflow-y-auto p-5 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-gold-400/35 bg-cream-100 text-gold-600">
                <Icon name="clock" className="h-7 w-7" />
              </span>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[9.5px] font-bold tracking-[0.2em] text-persis-900 uppercase">
                <Icon name="sparkle" className="h-3.5 w-3.5 text-gold-500" />
                Donasi Diterima
              </p>
              <h2 className="font-header mt-1.5 text-[15.5px] leading-snug font-bold text-ink-900">
                Donasi Sedang Ditinjau
              </h2>
              <p className="mt-2 text-justify text-[11.5px] leading-relaxed text-ink-600">
                Terima kasih, {baru.anonim ? "Hamba Allah" : baru.nama}. Donasi <b>{rupiah(baru.nominal)}</b> untuk
                program <b>{program.judul}</b> sudah kami catat dan sedang diperiksa bendahara. Jumlah donasi pada halaman
                ini akan bertambah, dan nama Anda masuk daftar donatur, setelah pembayaran dinyatakan sah.
              </p>

              <div className="mt-3.5 rounded-2xl border border-black/[0.08] bg-white p-3.5 text-left">
                <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                  <Icon name="info" className="h-[15px] w-[15px] text-gold-600" />
                  Metode {baru.metode}
                </p>
                {panduanMetode(baru.metode)?.gambar ? (
                  <figure
                    data-testid="donasi-gambar-metode"
                    className="mt-2.5 rounded-2xl border border-gold-400/35 bg-cream-50 p-3 text-center"
                  >
                    <img
                      src={panduanMetode(baru.metode)?.gambar}
                      alt={`Kode ${baru.metode} resmi PC PERSIS Cibatu`}
                      className="mx-auto h-auto w-full max-w-[200px] rounded-xl bg-white object-contain"
                    />
                    <figcaption className="mt-2 text-[10px] leading-relaxed text-ink-600">
                      Pindai kode di atas dengan aplikasi pembayaran Anda, lalu simpan bukti pembayarannya.
                    </figcaption>
                  </figure>
                ) : null}
                <ol className="mt-2 space-y-2">
                  {(panduanMetode(baru.metode)?.langkah ?? []).map((l, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="font-header mt-[2px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-cream-100 text-[9.5px] font-bold tabular-nums text-persis-900">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-justify text-[10.5px] leading-relaxed text-ink-600">{l}</span>
                    </li>
                  ))}
                </ol>
                {baru.metode === "Transfer Bank" ? (
                  <ul className="mt-2.5 divide-y divide-black/[0.06] border-t border-black/[0.06]">
                    {rekening.map((r) => (
                      <li key={r.id} className="py-2.5">
                        <span className="block text-[11.5px] font-bold tabular-nums text-ink-900">
                          {r.bank} · {r.nomor}
                        </span>
                        <span className="mt-0.5 block text-[10.5px] text-persis-900">a.n. {r.atasNama}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <p className="mt-2.5 flex items-start gap-2 text-justify text-[10.5px] leading-relaxed text-ink-600">
                <Icon name="shield" className="mt-[1px] h-4 w-4 shrink-0 text-gold-600" />
                Donasi hanya diterima melalui rekening resmi dan kanal QRIS di sekretariat. Lembaga tidak pernah meminta
                transfer ke rekening pribadi.
              </p>

              <a
                href={tautanWa}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="donasi-konfirmasi-wa"
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-full border border-persis-900/20 bg-white py-3 text-[11.5px] font-bold text-persis-900 transition active:scale-[0.98]"
              >
                <Icon name="whatsapp" className="h-4 w-4" />
                Kirim Bukti Transfer via WhatsApp
              </a>
            </div>
            <div className="shrink-0 border-t border-black/[0.06] bg-white px-5 pt-3 pb-3">
              <button
                type="button"
                onClick={() => setBaru(null)}
                data-testid="donasi-notifikasi-tutup"
                className="w-full rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default HalamanDonasiDetail;
