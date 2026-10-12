import { useState } from "react";
import { Icon } from "../../components/Icons";
import { rupiah, tanggalJam, tanggalPendek } from "../../lib/format";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import {
  tolakDonasiZis,
  useDonasiZis,
  verifikasiDonasiZis,
  type DonasiZis,
} from "../../lib/zis";

/**
 * Verifikasi donasi di halaman Admin ZIS.
 *
 * Dua daftar: donasi yang baru masuk lewat formulir situs (Perlu Verifikasi) dan
 * donasi yang sudah diperiksa (Sudah Diverifikasi). Begitu diverifikasi, dana
 * otomatis masuk ke program terkait, dan teks verifikasi bisa dikirim ke WhatsApp
 * donatur lewat tombol yang tersedia.
 */

const angka = (n: number) => Number(n ?? 0).toLocaleString("id-ID");

function Badge({ jumlah, nada }: { jumlah: number; nada: "emas" | "hijau" | "redup" }) {
  const warna =
    nada === "emas"
      ? "bg-gold-500 text-persis-950"
      : nada === "hijau"
        ? "bg-persis-900 text-white"
        : "bg-cream-100 text-ink-500";
  return (
    <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-bold ${warna}`}>
      {jumlah}
    </span>
  );
}

function Tombol({
  children,
  ikon,
  onClick,
  nada = "utama",
  sibuk,
  testid,
}: {
  children: React.ReactNode;
  ikon?: string;
  onClick: () => void;
  nada?: "utama" | "hijau" | "halus";
  sibuk?: boolean;
  testid: string;
}) {
  const gaya =
    nada === "utama"
      ? "bg-persis-900 text-white"
      : nada === "hijau"
        ? "bg-[#1f7a4d] text-white"
        : "border border-black/[0.12] bg-white text-persis-900";
  return (
    <button
      type="button"
      data-testid={testid}
      disabled={sibuk}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold transition active:scale-[0.97] disabled:opacity-60 ${gaya}`}
    >
      {ikon ? <Icon name={ikon} className="h-[13px] w-[13px]" /> : null}
      {sibuk ? "Memproses…" : children}
    </button>
  );
}

/** Kotak isi teks verifikasi + tombol kirim ke WhatsApp. */
function LembarWhatsApp({ donasi, onTutup }: { donasi: DonasiZis; onTutup: () => void }) {
  const [tersalin, setTersalin] = useState(false);

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(donasi.pesanWhatsApp);
      setTersalin(true);
      beritahu("sukses", "Teks verifikasi disalin.");
    } catch {
      beritahu("galat", "Teks tidak bisa disalin otomatis. Salin manual dari kotak di atas.");
    }
  };

  return (
    <div
      data-testid="zis-lembar-wa"
      role="dialog"
      aria-modal="true"
      aria-label="Kirim teks verifikasi WhatsApp"
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      <button
        type="button"
        aria-label="Tutup"
        onClick={onTutup}
        className="absolute inset-0 cursor-default bg-persis-950/60"
      />
      <div className="popup-panel relative flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[24px] bg-cream-50 shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.55)]">
        <div className="flex shrink-0 justify-center pt-2.5">
          <span className="h-1 w-10 rounded-full bg-black/15" />
        </div>
        <div className="flex shrink-0 items-start gap-3 px-5 pt-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="font-header text-[15.5px] font-bold text-ink-900">Teks Verifikasi WhatsApp</h2>
            <p className="mt-1 text-[10.5px] leading-relaxed text-ink-500">
              {donasi.nomor} · {donasi.program || "Donasi umum"}
            </p>
          </div>
          <button
            type="button"
            data-testid="zis-wa-tutup"
            aria-label="Tutup"
            onClick={onTutup}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-persis-900"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-4">
          <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
            <p className="text-[11px] leading-relaxed whitespace-pre-line text-ink-800">{donasi.pesanWhatsApp}</p>
          </div>
          <p className="mt-2.5 text-justify text-[10.5px] leading-relaxed text-ink-400">
            Pesan dikirim dari WhatsApp petugas, bukan otomatis dari situs. Setelah menekan tombol di bawah, WhatsApp
            terbuka dengan nomor dan teks yang sudah terisi — tinggal tekan kirim.
          </p>
        </div>

        <div className="shrink-0 border-t border-black/[0.07] bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
          {donasi.tautanWhatsApp ? (
            <a
              href={donasi.tautanWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="zis-wa-kirim"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1f7a4d] px-4 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.99]"
            >
              <Icon name="whatsapp" className="h-4 w-4" />
              Kirim ke WhatsApp {donasi.anonim ? "donatur" : donasi.nama}
            </a>
          ) : (
            <p className="rounded-2xl bg-cream-100 px-3.5 py-3 text-justify text-[11px] leading-relaxed text-ink-600">
              Nomor WhatsApp donatur ini tidak tersimpan, jadi pesannya hanya bisa disalin lalu dikirim manual.
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              data-testid="zis-wa-salin"
              onClick={() => void salin()}
              className="flex-1 rounded-full border border-black/[0.12] bg-white px-4 py-2.5 text-[11.5px] font-semibold text-persis-900"
            >
              {tersalin ? "Teks tersalin" : "Salin teks"}
            </button>
            <button
              type="button"
              data-testid="zis-wa-selesai"
              onClick={onTutup}
              className="flex-1 rounded-full border border-black/[0.12] bg-white px-4 py-2.5 text-[11.5px] font-semibold text-ink-600"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarisPerlu({
  d,
  sibuk,
  onVerifikasi,
  onTolak,
}: {
  d: DonasiZis;
  sibuk: boolean;
  onVerifikasi: () => void;
  onTolak: () => void;
}) {
  return (
    <li data-testid={`zis-perlu-${d.id}`} className="rounded-2xl border border-gold-500/35 bg-pastelgold/70 p-3.5">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-bold text-ink-900">{d.anonim ? "Hamba Allah" : d.nama}</p>
          <p className="mt-0.5 text-[10px] text-ink-500">
            {d.nomor}
            {d.program ? ` · ${d.program}` : ""}
          </p>
        </div>
        <p className="font-header shrink-0 text-[13px] font-extrabold text-persis-900">{rupiah(d.jumlah)}</p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-ink-500">
        <span>{d.metode || "Metode belum dicatat"}</span>
        <span aria-hidden>·</span>
        <span>{tanggalJam(d.dibuat)}</span>
        {d.telepon ? (
          <>
            <span aria-hidden>·</span>
            <span data-testid={`zis-telepon-${d.id}`}>WA {d.telepon}</span>
          </>
        ) : null}
      </div>

      {d.pesan ? (
        <p className="mt-2 line-clamp-3 text-justify text-[11px] leading-relaxed text-ink-700 italic">“{d.pesan}”</p>
      ) : null}

      {d.buktiUrl ? (
        <a
          href={d.buktiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-persis-900 underline"
        >
          <Icon name="image" className="h-[13px] w-[13px]" />
          Lihat bukti pembayaran
        </a>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Tombol testid={`zis-verifikasi-${d.id}`} ikon="check" sibuk={sibuk} onClick={onVerifikasi}>
          Verifikasi
        </Tombol>
        <Tombol testid={`zis-tolak-${d.id}`} nada="halus" sibuk={sibuk} onClick={onTolak}>
          Tolak
        </Tombol>
      </div>
    </li>
  );
}

function BarisDiverifikasi({ d, onWhatsApp }: { d: DonasiZis; onWhatsApp: () => void }) {
  return (
    <li data-testid={`zis-verifikasi-baris-${d.id}`} className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-bold text-ink-900">{d.anonim ? "Hamba Allah" : d.nama}</p>
          <p className="mt-0.5 text-[10px] text-ink-500">
            {d.nomor}
            {d.program ? ` · ${d.program}` : ""}
          </p>
        </div>
        <p className="font-header shrink-0 text-[13px] font-extrabold text-persis-900">{rupiah(d.jumlah)}</p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-ink-500">
        <span className="inline-flex items-center gap-1 font-semibold text-[#1f7a4d]">
          <Icon name="check" className="h-[12px] w-[12px]" />
          Diverifikasi
        </span>
        <span aria-hidden>·</span>
        <span>{tanggalPendek(d.diperbarui)}</span>
        <span aria-hidden>·</span>
        <span>{d.metode || "Metode belum dicatat"}</span>
      </div>

      <div className="mt-3">
        <Tombol testid={`zis-wa-${d.id}`} ikon="whatsapp" nada="hijau" onClick={onWhatsApp}>
          {d.adaTelepon ? "Kirim ke WhatsApp" : "Lihat teks verifikasi"}
        </Tombol>
      </div>
    </li>
  );
}

export default function VerifikasiDonasi({ onBerubah }: { onBerubah?: () => void }) {
  const { data, memuat, galat, muat } = useDonasiZis();
  const [sibukId, setSibukId] = useState<number | null>(null);
  const [lembar, setLembar] = useState<DonasiZis | null>(null);

  const segarkan = async () => {
    await muat();
    onBerubah?.();
  };

  const verifikasi = async (d: DonasiZis) => {
    setSibukId(d.id);
    try {
      const donasi = await verifikasiDonasiZis(d.id);
      await segarkan();
      beritahu("sukses", `${d.nomor} diverifikasi. Dana tercatat pada program terkait.`);
      setLembar(donasi);
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Donasi tidak bisa diverifikasi.");
    } finally {
      setSibukId(null);
    }
  };

  const tolak = async (d: DonasiZis) => {
    const lanjut = await mintaKonfirmasi(
      `Tandai donasi ${d.nomor} dari ${d.anonim ? "Hamba Allah" : d.nama} sebesar ${rupiah(d.jumlah)} sebagai ditolak? Donasi ini tidak akan masuk ke program.`,
      { judul: "Tolak donasi", nada: "bahaya", labelYa: "Ya, tolak" },
    );
    if (!lanjut) return;
    setSibukId(d.id);
    try {
      await tolakDonasiZis(d.id);
      await segarkan();
      beritahu("sukses", `${d.nomor} ditandai ditolak.`);
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Donasi tidak bisa ditolak.");
    } finally {
      setSibukId(null);
    }
  };

  const perlu = data?.perlu ?? [];
  const diverifikasi = data?.diverifikasi ?? [];

  return (
    <div data-testid="zis-verifikasi-donasi" className="mt-3.5 space-y-3.5">
      {/* ---------------------------- perlu verifikasi ---------------------------- */}
      <section
        aria-label="Donasi perlu verifikasi"
        data-testid="zis-kartu-perlu"
        className="rounded-2xl border border-black/[0.08] bg-cream-50 p-4"
      >
        <div className="flex items-center justify-between gap-2.5">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Perlu Verifikasi</h2>
          <Badge jumlah={perlu.length} nada={perlu.length > 0 ? "emas" : "redup"} />
        </div>
        <p className="mt-1.5 text-justify text-[11px] leading-relaxed text-ink-600">
          Donasi yang masuk lewat formulir situs dan belum diperiksa. Cocokkan nominalnya dengan mutasi rekening atau
          bukti pembayaran, lalu tekan Verifikasi supaya dana tercatat pada program dan donaturnya ikut terhitung.
        </p>

        {memuat && !data ? (
          <div className="mt-3 space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-[92px] animate-pulse rounded-2xl border border-black/[0.06] bg-white" />
            ))}
          </div>
        ) : galat && !data ? (
          <div className="mt-3 rounded-2xl border border-black/[0.08] bg-white p-3.5">
            <p className="text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
            <button
              type="button"
              data-testid="zis-donasi-muat-ulang"
              onClick={() => void muat()}
              className="mt-2.5 rounded-full bg-persis-900 px-3.5 py-1.5 text-[11px] font-semibold text-white"
            >
              Muat ulang
            </button>
          </div>
        ) : perlu.length === 0 ? (
          <p
            data-testid="zis-perlu-kosong"
            className="mt-3 rounded-2xl border border-dashed border-black/[0.12] bg-white px-3.5 py-4 text-justify text-[11px] leading-relaxed text-ink-500"
          >
            Belum ada donasi yang perlu diverifikasi. Setiap donasi yang dikirim lewat formulir di halaman program akan
            muncul di sini.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {perlu.map((d) => (
              <BarisPerlu
                key={d.id}
                d={d}
                sibuk={sibukId === d.id}
                onVerifikasi={() => void verifikasi(d)}
                onTolak={() => void tolak(d)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* --------------------------- sudah diverifikasi --------------------------- */}
      <section
        aria-label="Donasi sudah diverifikasi"
        data-testid="zis-kartu-diverifikasi"
        className="rounded-2xl border border-black/[0.08] bg-cream-50 p-4"
      >
        <div className="flex items-center justify-between gap-2.5">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Sudah Diverifikasi</h2>
          <Badge jumlah={diverifikasi.length} nada={diverifikasi.length > 0 ? "hijau" : "redup"} />
        </div>
        <p className="mt-1.5 text-justify text-[11px] leading-relaxed text-ink-600">
          Donasi yang sudah diperiksa dan dananya sudah masuk ke program terkait. Tekan tombol WhatsApp pada satu baris
          untuk mengirim teks verifikasi kepada donatur — teksnya sudah disiapkan dan hanya perlu dikirim.
        </p>

        {memuat && !data ? (
          <div className="mt-3 space-y-2">
            {[0].map((i) => (
              <div key={i} className="h-[92px] animate-pulse rounded-2xl border border-black/[0.06] bg-white" />
            ))}
          </div>
        ) : diverifikasi.length === 0 ? (
          <p
            data-testid="zis-diverifikasi-kosong"
            className="mt-3 rounded-2xl border border-dashed border-black/[0.12] bg-white px-3.5 py-4 text-justify text-[11px] leading-relaxed text-ink-500"
          >
            Belum ada donasi terverifikasi. Donasi yang sudah diperiksa akan tampil di sini beserta tombol pengiriman
            teks verifikasi ke WhatsApp donatur.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {diverifikasi.map((d) => (
              <BarisDiverifikasi key={d.id} d={d} onWhatsApp={() => setLembar(d)} />
            ))}
          </ul>
        )}

        {data && data.ditolak > 0 ? (
          <p className="mt-2.5 text-[10.5px] leading-relaxed text-ink-400">
            {angka(data.ditolak)} donasi ditandai ditolak dan tidak dihitung pada dana program.
          </p>
        ) : null}
      </section>

      {lembar ? <LembarWhatsApp donasi={lembar} onTutup={() => setLembar(null)} /> : null}
    </div>
  );
}
