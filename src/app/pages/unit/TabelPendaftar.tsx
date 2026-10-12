import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import { tanggalPendek } from "../../lib/format";
import { LABEL_STATUS, daftarPendaftar, type Pendaftar, type StatusPendaftar } from "../../lib/unitSpmb";
import PopupPendaftar from "./PopupPendaftar";
import { useIstilah } from "../../lib/istilah";

/**
 * Tabel pendaftar untuk satu kelompok status. Menekan satu baris membuka
 * rincian pendaftar, dan setiap perubahan status langsung menyegarkan tabel.
 */

const WARNA: Record<StatusPendaftar, string> = {
  baru: "bg-gold-100 text-gold-800",
  diverifikasi: "bg-persis-100 text-persis-900",
  diterima: "bg-persis-900 text-gold-300",
  ditolak: "bg-rose-100 text-rose-800",
  batal: "bg-cream-100 text-ink-600",
};

export default function TabelPendaftar({
  status,
  testid,
  judul,
  keterangan,
  kosong,
  versi = 0,
  onBerubah,
}: {
  status: string;
  testid: string;
  judul: string;
  keterangan: string;
  kosong: string;
  versi?: number;
  onBerubah?: () => void;
}) {
  const istilah = useIstilah();
  const [baris, setBaris] = useState<Pendaftar[]>([]);
  const [jumlah, setJumlah] = useState(0);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [cari, setCari] = useState("");
  const [kataKunci, setKataKunci] = useState("");
  const [bukaId, setBukaId] = useState<string | null>(null);
  const [penuh, setPenuh] = useState(false);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await daftarPendaftar(status, kataKunci);
      setBaris(jawab.pendaftar);
      setJumlah(
        status === "tidak-lanjut"
          ? jawab.ringkasan.ditolak + jawab.ringkasan.batal
          : status === "semua"
            ? jawab.ringkasan.total
            : (jawab.ringkasan[status as keyof typeof jawab.ringkasan] ?? 0),
      );
      setPenuh(jawab.penuh);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Daftar pendaftar belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, [status, kataKunci]);

  useEffect(() => {
    void muat();
  }, [muat, versi]);

  /* Pencarian ditahan sesaat supaya tidak meminta data setiap ketukan. */
  useEffect(() => {
    const jeda = setTimeout(() => setKataKunci(cari), 350);
    return () => clearTimeout(jeda);
  }, [cari]);

  return (
    <section data-testid={testid} className="mt-4">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <KepalaKartu
          judul={judul}
          keterangan={keterangan}
          angka={jumlah}
          labelAngka="pendaftar"
          testidAngka={`${testid}-jumlah`}
        />

        <label className="mt-2.5 block">
          <span className="sr-only">Cari pendaftar</span>
          <input
            type="search"
            data-testid={`${testid}-cari`}
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={`Cari nama, nomor, atau asal ${istilah.unit}…`}
            className="w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40"
          />
        </label>

        {memuat ? (
          <p className="mt-3 text-[11px] text-ink-400">Memuat daftar pendaftar…</p>
        ) : galat ? (
          <p className="mt-3 text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
        ) : baris.length === 0 ? (
          <p className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400">
            {kataKunci ? "Tidak ada pendaftar yang cocok dengan pencarian." : kosong}
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-black/[0.07]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-cream-50 text-[9.5px] tracking-[0.08em] text-ink-400 uppercase">
                  <th scope="col" className="px-3 py-2 text-left font-bold">Nama</th>
                  <th scope="col" className="px-2 py-2 text-left font-bold">Masuk</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">
                    <span className="sr-only">Buka rincian</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {baris.map((p) => (
                  <tr
                    key={p.id}
                    data-testid={`${testid}-baris-${p.id}`}
                    onClick={() => setBukaId(p.id)}
                    className="cursor-pointer border-t border-black/[0.05] align-top transition hover:bg-cream-50/70"
                  >
                    <td className="px-3 py-2.5">
                      <span className="block text-[11.5px] leading-snug font-semibold text-ink-900">{p.nama}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9.5px] text-ink-400">
                        {p.nomor ? <span>{p.nomor}</span> : null}
                        {p.gelombang ? <span>· {p.gelombang}</span> : null}
                        <span className={`rounded-full px-2 py-0.5 font-bold ${WARNA[p.status]}`}>
                          {LABEL_STATUS[p.status]}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-[10.5px] whitespace-nowrap text-ink-600">
                      {p.dibuat ? tanggalPendek(p.dibuat) : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <button
                        type="button"
                        data-testid={`${testid}-buka-${p.id}`}
                        aria-label={`Buka rincian ${p.nama}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setBukaId(p.id);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-black/[0.09] text-persis-900"
                      >
                        <Icon name="chevron-right" className="h-[15px] w-[15px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {penuh ? (
          <p className="mt-2 text-justify text-[10px] leading-relaxed text-ink-400">
            Menampilkan 60 pendaftar terbaru. Pakai pencarian untuk menemukan pendaftar lain.
          </p>
        ) : null}
      </div>

      {bukaId ? (
        <PopupPendaftar
          id={bukaId}
          onTutup={() => setBukaId(null)}
          onBerubah={() => {
            void muat();
            onBerubah?.();
          }}
        />
      ) : null}
    </section>
  );
}

/** Keterangan kosong yang dipakai halaman Pendaftar dan Tertolak. */
export const KOSONG: Record<string, string> = {
  diverifikasi:
    "Belum ada pendaftar yang sudah diverifikasi. Pendaftar yang selesai diperiksa dari Dashboard akan muncul di sini.",
  "tidak-lanjut":
    "Belum ada pendaftar yang ditolak atau dibatalkan. Pendaftar yang tidak memenuhi syarat akan tercatat di sini.",
};
