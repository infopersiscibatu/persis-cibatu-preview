import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { Kolom, Pesan, TombolSimpan } from "../../components/admin/Form";
import { rupiah } from "../../lib/format";
import { beritahu } from "../../lib/notifikasiAdmin";
import {
  daftarPembayaran,
  tolakPembayaran,
  verifikasiPembayaran,
  type PembayaranSantri,
  type PembayaranUnit,
} from "../../lib/unitTataUsaha";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import Lembar from "./Lembar";
import { useIstilah } from "../../lib/istilah";

/**
 * Menu Pembayaran: riwayat pembayaran seluruh peserta didik unit ini, disusun satu nama
 * satu baris agar mudah dilaporkan. Nama yang ditekan membuka seluruh riwayat
 * pembayarannya, pembayaran terbaru lebih dahulu, beserta tombol verifikasi/tolaknya.
 */

const WARNA: Record<string, string> = {
  menunggu: "bg-gold-100 text-gold-800",
  terverifikasi: "bg-persis-100 text-persis-900",
  ditolak: "bg-rose-100 text-rose-700",
};

const LABEL: Record<string, string> = {
  menunggu: "Menunggu verifikasi",
  terverifikasi: "Terverifikasi · lunas",
  ditolak: "Ditolak",
};

/** Tanggal ringkas untuk kolom tabel, mis. "5 Okt 2026". */
const tanggalPendek = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

export default function PembayaranTagihan({ onBerubah }: { onBerubah?: () => void }) {
  const istilah = useIstilah();
  const [saring, setSaring] = useState<"menunggu" | "semua">("menunggu");
  const [cari, setCari] = useState("");
  const [kataKunci, setKataKunci] = useState("");
  const [data, setData] = useState<Awaited<ReturnType<typeof daftarPembayaran>> | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState("");
  const [buka, setBuka] = useState<PembayaranSantri | null>(null);
  const [tolakId, setTolakId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [pesanTolak, setPesanTolak] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await daftarPembayaran(saring, kataKunci);
      setData(jawab);
      setGalat(null);
      return jawab;
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Daftar pembayaran belum bisa dimuat.");
      return null;
    } finally {
      setMemuat(false);
    }
  }, [saring, kataKunci]);

  useEffect(() => {
    void muat();
  }, [muat]);

  useEffect(() => {
    const jeda = setTimeout(() => setKataKunci(cari), 350);
    return () => clearTimeout(jeda);
  }, [cari]);

  /* Mengganti saringan atau kata kunci menutup lembarnya, supaya isinya tidak tertinggal. */
  useEffect(() => {
    setBuka(null);
  }, [saring, kataKunci]);

  /**
   * Menyegarkan daftar setelah pemeriksaan. Nama yang sudah selesai diperiksa keluar dari
   * saringan "menunggu" — lembarnya tidak ditutup mendadak, melainkan diisi riwayat
   * lengkapnya supaya hasil pemeriksaannya langsung terlihat.
   */
  const segarkan = async (idSiswa: string) => {
    const jawab = await muat();
    if (jawab?.santri.some((s) => s.id === idSiswa)) return;
    if (saring !== "menunggu") return;
    const semua = await daftarPembayaran("semua", kataKunci).catch(() => null);
    setBuka((lama) => (lama && lama.id === idSiswa ? (semua?.santri.find((s) => s.id === idSiswa) ?? null) : lama));
  };

  const verifikasi = async (p: PembayaranUnit) => {
    setSibuk(p.id);
    try {
      const jawab = await verifikasiPembayaran(p.id);
      beritahu("sukses", jawab.pesan);
      await segarkan(p.santriId);
      onBerubah?.();
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Pembayaran gagal diverifikasi.");
    } finally {
      setSibuk("");
    }
  };

  const kirimTolak = async (p: PembayaranUnit) => {
    setSibuk(p.id);
    setPesanTolak(null);
    try {
      const jawab = await tolakPembayaran(p.id, catatan);
      beritahu("sukses", jawab.pesan);
      setTolakId(null);
      setCatatan("");
      await segarkan(p.santriId);
      onBerubah?.();
    } catch (e) {
      setPesanTolak({ tipe: "galat", teks: e instanceof Error ? e.message : "Pembayaran gagal ditolak." });
    } finally {
      setSibuk("");
    }
  };

  const ringkas = data?.ringkasan;
  const daftar = data?.santri ?? [];
  const totalMenungguNama = daftar.filter((s) => s.menunggu.jumlah > 0).length;

  return (
    <section data-testid="tu-pembayaran-menu" className="mt-4">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <KepalaKartu
          judul="Pembayaran"
          keterangan="Riwayat pembayaran disusun satu nama satu baris. Tekan namanya untuk membuka seluruh riwayat pembayarannya — terbaru lebih dahulu — beserta tombol pemeriksaannya."
          angka={ringkas?.menunggu.jumlah ?? 0}
          labelAngka="menunggu"
          testidAngka="tu-pembayaran-jumlah-menunggu"
        />

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-black/[0.08] p-2.5">
            <p className="text-[9.5px] font-bold tracking-[0.1em] text-ink-400 uppercase">Menunggu</p>
            <p className="mt-1 text-[13px] font-extrabold text-persis-900">{rupiah(ringkas?.menunggu.nominal ?? 0)}</p>
            <p className="text-[9.5px] text-ink-400">
              {ringkas?.menunggu.jumlah ?? 0} pembayaran · {totalMenungguNama} nama
            </p>
          </div>
          <div className="rounded-xl border border-black/[0.08] p-2.5">
            <p className="text-[9.5px] font-bold tracking-[0.1em] text-ink-400 uppercase">Bulan ini</p>
            <p className="mt-1 text-[13px] font-extrabold text-persis-900">{rupiah(ringkas?.bulanIni.nominal ?? 0)}</p>
            <p className="text-[9.5px] text-ink-400">
              {ringkas?.bulanIni.jumlah ?? 0} terverifikasi · total {rupiah(ringkas?.terverifikasi.nominal ?? 0)}
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex gap-1.5">
          {(["menunggu", "semua"] as const).map((s) => (
            <button
              key={s}
              type="button"
              data-testid={`tu-pembayaran-saring-${s}`}
              onClick={() => setSaring(s)}
              className={`rounded-full px-3 py-1.5 text-[10.5px] font-semibold transition ${
                saring === s ? "bg-persis-900 text-white" : "border border-black/[0.1] text-persis-900"
              }`}
            >
              {s === "menunggu" ? "Menunggu verifikasi" : "Semua pembayaran"}
            </button>
          ))}
        </div>

        <input
          type="search"
          data-testid="tu-pembayaran-cari"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder={`Cari nama ${istilah.sebutanKecil} atau kelas…`}
          className="mt-2.5 w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40"
        />

        {memuat && !data ? (
          <p className="mt-3 text-[11px] text-ink-400">Memuat pembayaran…</p>
        ) : galat && !data ? (
          <p className="mt-3 text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
        ) : daftar.length === 0 ? (
          <p data-testid="tu-pembayaran-kosong" className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400">
            {kataKunci
              ? `Tidak ada pembayaran atas nama yang cocok dengan “${kataKunci}”.`
              : saring === "menunggu"
                ? `Tidak ada pembayaran yang menunggu verifikasi. Setoran dari ${istilah.waliKecil} akan muncul di sini, begitu juga pembayaran tunai yang dicatat petugas dari menu Tagihan.`
                : `Belum ada pembayaran yang tercatat pada ${istilah.unit} ini.`}
          </p>
        ) : (
          <ul className="mt-3 space-y-2" data-testid="tu-pembayaran-daftar">
            {daftar.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  data-testid={`tu-pembayaran-nama-${s.id}`}
                  onClick={() => {
                    setBuka(s);
                    setTolakId(null);
                    setCatatan("");
                    setPesanTolak(null);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-black/[0.08] px-3 py-2.5 text-left transition active:scale-[0.99]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-semibold text-ink-900">{s.nama}</span>
                    <span className="mt-0.5 block truncate text-[9.5px] text-ink-400">
                      {s.kelas ? `${s.kelas} · ` : ""}
                      {s.jumlah} pembayaran · total {rupiah(s.total)}
                      {s.terakhir ? ` · terakhir ${tanggalPendek(s.terakhir)}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {s.menunggu.jumlah > 0 ? (
                      <span className="mt-0.5 inline-block rounded-full bg-gold-100 px-2 py-0.5 text-[9px] font-bold text-gold-800">
                        {s.menunggu.jumlah} menunggu
                      </span>
                    ) : (
                      <span className="mt-0.5 inline-block rounded-full bg-persis-100 px-2 py-0.5 text-[9px] font-bold text-persis-900">
                        lunas
                      </span>
                    )}
                    <span className="mt-1 block text-[9.5px] font-bold text-persis-900">Buka riwayat ›</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {buka ? (
        <Lembar
          testid="tu-pembayaran-lembar"
          judul={`Riwayat pembayaran — ${buka.nama}`}
          keterangan={`${[buka.kelas, `${buka.jumlah} pembayaran`, `total ${rupiah(buka.total)}`]
            .filter(Boolean)
            .join(" · ")}. Pembayaran terbaru ditampilkan lebih dahulu.`}
          onTutup={() => {
            setBuka(null);
            setTolakId(null);
            setCatatan("");
            setPesanTolak(null);
          }}
        >
          {buka.pembayaran.length === 0 ? (
            <p data-testid="tu-pembayaran-riwayat-kosong" className="text-justify text-[11px] leading-relaxed text-ink-500">
              Belum ada pembayaran atas nama ini.
            </p>
          ) : (
            <>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-black/[0.08] p-2">
                  <p className="text-[9px] font-bold tracking-[0.08em] text-ink-400 uppercase">Menunggu</p>
                  <p className="mt-0.5 text-[12px] font-extrabold text-gold-700">{rupiah(buka.menunggu.nominal)}</p>
                  <p className="text-[9px] text-ink-400">{buka.menunggu.jumlah} pembayaran</p>
                </div>
                <div className="rounded-xl border border-black/[0.08] p-2">
                  <p className="text-[9px] font-bold tracking-[0.08em] text-ink-400 uppercase">Terverifikasi</p>
                  <p className="mt-0.5 text-[12px] font-extrabold text-persis-900">
                    {rupiah(buka.terverifikasi.nominal)}
                  </p>
                  <p className="text-[9px] text-ink-400">{buka.terverifikasi.jumlah} pembayaran</p>
                </div>
                <div className="rounded-xl border border-black/[0.08] p-2">
                  <p className="text-[9px] font-bold tracking-[0.08em] text-ink-400 uppercase">Ditolak</p>
                  <p className="mt-0.5 text-[12px] font-extrabold text-rose-700">{buka.ditolak.jumlah}</p>
                  <p className="text-[9px] text-ink-400">pembayaran</p>
                </div>
              </div>

              <table data-testid="tu-pembayaran-riwayat" className="mt-3 w-full border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] text-left text-[9px] font-bold tracking-[0.1em] text-ink-400 uppercase">
                    <th className="py-1.5 pr-2">Tanggal</th>
                    <th className="py-1.5 pr-2">Pembayaran</th>
                    <th className="py-1.5 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {buka.pembayaran.map((p) => (
                    <tr key={p.id} data-testid={`tu-pembayaran-baris-${p.id}`} className="align-top">
                      <td className="py-2 pr-2 text-[10.5px] whitespace-nowrap text-ink-500">
                        {tanggalPendek(p.dibayarPada ?? p.dibuat)}
                      </td>
                      <td className="py-2 pr-2">
                        <span className="block text-[11px] leading-snug font-semibold text-ink-900">
                          {p.label || p.perLabel || p.jenis || "Pembayaran"}
                        </span>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${WARNA[p.status] ?? WARNA.menunggu}`}>
                          {LABEL[p.status] ?? p.status}
                        </span>
                        <span className="mt-1 block text-[9.5px] text-ink-400">
                          {p.metode || "Metode belum dicatat"}
                          {p.diverifikasiPada ? ` · diverifikasi ${tanggalPendek(p.diverifikasiPada)}` : ""}
                        </span>
                        {p.catatan ? (
                          <span className="mt-0.5 block text-justify text-[9.5px] leading-snug text-ink-500">{p.catatan}</span>
                        ) : null}
                        {p.buktiUrl ? (
                          <a
                            href={p.buktiUrl}
                            target="_blank"
                            rel="noreferrer"
                            data-testid={`tu-pembayaran-bukti-${p.id}`}
                            className="mt-1 inline-block text-[10px] font-semibold text-persis-900 underline"
                          >
                            Lihat bukti pembayaran
                          </a>
                        ) : null}

                        {p.status === "menunggu" && tolakId !== p.id ? (
                          <span className="mt-1.5 flex gap-2">
                            <button
                              type="button"
                              data-testid={`tu-pembayaran-verifikasi-${p.id}`}
                              disabled={sibuk === p.id}
                              onClick={() => void verifikasi(p)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-persis-900 px-3 py-2 text-[10.5px] font-semibold text-white disabled:opacity-50"
                            >
                              <Icon name="check" className="h-[13px] w-[13px]" />
                              Verifikasi &amp; lunaskan
                            </button>
                            <button
                              type="button"
                              data-testid={`tu-pembayaran-tolak-${p.id}`}
                              disabled={sibuk === p.id}
                              onClick={() => {
                                setTolakId(p.id);
                                setCatatan("");
                                setPesanTolak(null);
                              }}
                              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10.5px] font-semibold text-rose-700 disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </span>
                        ) : null}

                        {tolakId === p.id ? (
                          <span className="mt-2 block rounded-xl border border-rose-200 bg-rose-50/60 p-2.5">
                            <Kolom
                              testid="tolak-catatan"
                              label="Alasan penolakan (boleh dikosongkan)"
                              nilai={catatan}
                              onUbah={setCatatan}
                              placeholder="Misalnya bukti transfer tidak terbaca"
                            />
                            {pesanTolak ? (
                              <span className="mt-2 block">
                                <Pesan tipe={pesanTolak.tipe} teks={pesanTolak.teks} />
                              </span>
                            ) : null}
                            <span className="mt-2 flex gap-2">
                              <TombolSimpan
                                testid="tolak-simpan"
                                label="Tolak pembayaran"
                                sibuk={sibuk === p.id}
                                onClick={() => void kirimTolak(p)}
                              />
                              <button
                                type="button"
                                data-testid="tolak-batal"
                                onClick={() => {
                                  setTolakId(null);
                                  setCatatan("");
                                  setPesanTolak(null);
                                }}
                                className="shrink-0 rounded-full border border-black/[0.1] px-3.5 py-2 text-[11px] font-semibold text-ink-600"
                              >
                                Batal
                              </button>
                            </span>
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 text-right text-[11px] font-bold whitespace-nowrap text-persis-900">
                        {rupiah(p.jumlah)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-3 text-justify text-[10px] leading-relaxed text-ink-400">
                Setelah diverifikasi, tagihannya lunas dan pembayarannya tersimpan di riwayat {istilah.sebutanKecil} ini.
                Pembayaran yang ditolak mengembalikan tagihannya menjadi belum dibayar.
              </p>
            </>
          )}
        </Lembar>
      ) : null}

    </section>
  );
}
