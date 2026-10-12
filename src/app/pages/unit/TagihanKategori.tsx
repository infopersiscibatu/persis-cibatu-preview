import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { rupiah } from "../../lib/format";
import { tagihanKategori, type BulanTagihan, type KategoriTagihan as Kategori, type TagihanTataUsaha } from "../../lib/unitTataUsaha";
import Lembar from "./Lembar";
import { useIstilah } from "../../lib/istilah";

/**
 * Jendela tagihan satu kategori. Kategori bulanan ditampilkan per bulan — besaran
 * nominalnya, berapa tagihan yang masuk, dan berapa yang belum lunas — dan tiap bulan
 * bisa dibuka untuk melihat siswa yang ditagih. Kategori sekali bayar tampil sebagai
 * daftar tagihan biasa.
 */

const WARNA_STATUS: Record<string, string> = {
  belum: "bg-rose-100 text-rose-700",
  menunggu: "bg-gold-100 text-gold-800",
  lunas: "bg-persis-100 text-persis-900",
  batal: "bg-cream-100 text-ink-500",
};

const LABEL_STATUS: Record<string, string> = {
  belum: "Belum bayar",
  menunggu: "Menunggu verifikasi",
  lunas: "Lunas",
  batal: "Batal",
};

const labelBulan = (bulan: string) => {
  if (!/^\d{4}-\d{2}$/.test(bulan)) return "Tanpa jatuh tempo";
  const d = new Date(`${bulan}-01T00:00:00`);
  if (Number.isNaN(d.getTime())) return bulan;
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

const tanggalPendek = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

function BarisSiswa({ t }: { t: TagihanTataUsaha }) {
  return (
    <li data-testid={`bulan-tagihan-${t.id}`} className="flex items-start justify-between gap-2 border-t border-black/[0.05] py-2">
      <div className="min-w-0">
        <p className="truncate text-[11px] leading-snug font-semibold text-ink-900">{t.santri}</p>
        <p className="mt-0.5 truncate text-[9.5px] text-ink-400">
          {t.kelas ? `${t.kelas} · ` : ""}
          {t.jatuhTempo ? `Jatuh tempo ${tanggalPendek(t.jatuhTempo)}` : "tanpa jatuh tempo"}
        </p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${WARNA_STATUS[t.status] ?? WARNA_STATUS.belum}`}
        >
          {LABEL_STATUS[t.status] ?? t.status}
        </span>
      </div>
      <p className="shrink-0 text-[11.5px] font-bold text-persis-900">{rupiah(t.jumlah)}</p>
    </li>
  );
}

function BarisBulan({ b, terbuka, onBuka }: { b: BulanTagihan; terbuka: boolean; onBuka: () => void }) {
  const istilah = useIstilah();
  const persen = b.jumlah > 0 ? Math.round((b.lunas / Math.max(b.nominal, 1)) * 100) : 0;
  return (
    <li data-testid={`bulan-${b.bulan}`} className="rounded-xl border border-black/[0.08] bg-white">
      <button type="button" onClick={onBuka} className="w-full px-3.5 py-2.5 text-left transition hover:bg-cream-50/70">
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span
              className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border ${
                b.belum === 0 && b.jumlah > 0
                  ? "border-persis-900 bg-persis-900 text-white"
                  : "border-black/25 bg-white"
              }`}
            >
              {b.belum === 0 && b.jumlah > 0 ? <Icon name="check" className="h-2.5 w-2.5" /> : null}
            </span>
            <span className="text-[11.5px] font-semibold text-ink-900">{labelBulan(b.bulan)}</span>
          </span>
          <span className="text-[11.5px] font-bold text-persis-900">{rupiah(b.nominal)}</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream-100">
          <span className="block h-full rounded-full bg-persis-800" style={{ width: `${persen}%` }} />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[9.5px] text-ink-400">
            {b.jumlah} tagihan · {rupiah(b.lunas)} sudah lunas
          </span>
          <span className="flex items-center gap-1 text-[9.5px] font-semibold text-persis-900">
            {terbuka ? "Tutup" : `Lihat ${istilah.sebutanKecil}`}
            <Icon name={terbuka ? "chevron-up" : "chevron-down"} className="h-3 w-3" />
          </span>
        </div>
        {b.belum > 0 ? (
          <p className="mt-1 text-[9.5px] text-rose-700">belum lunas {rupiah(b.belum)}</p>
        ) : (
          <p className="mt-1 text-[9.5px] text-persis-900">semua tagihan bulan ini sudah lunas</p>
        )}
      </button>
      {terbuka ? (
        <ul className="px-3.5">
          {b.tagihan.map((t) => (
            <BarisSiswa key={t.id} t={t} />
          ))}
          {b.jumlah > b.tagihan.length ? (
            <li className="border-t border-black/[0.05] py-2 text-[9.5px] text-ink-400">
              {b.jumlah - b.tagihan.length} tagihan lainnya tidak ditampilkan.
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

export default function TagihanKategori({
  kategori,
  onTutup,
  onUbahKategori,
}: {
  kategori: Kategori;
  onTutup: () => void;
  onUbahKategori?: () => void;
}) {
  const istilah = useIstilah();
  const [data, setData] = useState<Awaited<ReturnType<typeof tagihanKategori>> | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [bulanTerbuka, setBulanTerbuka] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await tagihanKategori(kategori.id);
      setData(jawab);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Tagihan kategori belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, [kategori.id]);

  useEffect(() => {
    void muat();
  }, [muat]);

  const bulanan = (data?.kategori ?? kategori).tipe === "bulanan";
  const nominal = data?.kategori?.nominal ?? kategori.nominal;
  const ringkas = data?.ringkasan;

  return (
    <Lembar
      testid="tagihan-kategori"
      judul={`Tagihan ${kategori.nama}`}
      keterangan={
        nominal > 0
          ? `${rupiah(nominal)}${bulanan ? " per bulan" : " sekali bayar"}${ringkas && ringkas.jumlah > 0 ? ` · ${ringkas.jumlah} tagihan pada ${ringkas.jumlah === 1 ? `1 ${istilah.sebutanKecil}` : `${istilah.sebutanKecil} ${istilah.unit} ini`}` : ""}`
          : bulanan
            ? "Kategori bulanan: tagihannya dikelompokkan per bulan."
            : "Kategori sekali bayar: seluruh tagihannya ditampilkan di satu daftar."
      }
      onTutup={onTutup}
    >
      {memuat && !data ? (
        <p data-testid="kategori-tagihan-memuat" className="text-[11px] text-ink-400">
          Memuat tagihan kategori…
        </p>
      ) : galat && !data ? (
        <p className="text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
      ) : (
        <>
          <div data-testid="kategori-tagihan-ringkas" className="rounded-xl border border-gold-400/30 bg-cream-50 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-bold tracking-[0.1em] text-ink-400 uppercase">Total ditagihkan</span>
              <span className="text-[13px] font-extrabold text-persis-900">{rupiah(ringkas?.nominal ?? 0)}</span>
            </div>
            <p className="mt-1 text-justify text-[10px] leading-relaxed text-ink-500">
              {ringkas?.jumlah ?? 0} tagihan · {rupiah(ringkas?.lunas ?? 0)} sudah lunas ·{" "}
              {rupiah(ringkas?.belum ?? 0)} belum lunas
              {nominal > 0
                ? ` · nominal standar ${rupiah(nominal)}${bulanan ? " per bulan" : ""}`
                : ""}
            </p>
          </div>

          {bulanan ? (
            <div data-testid="kategori-tagihan-bulan" className="mt-3.5">
              <p className="text-[9.5px] font-bold tracking-[0.12em] text-ink-400 uppercase">Tagihan bulanan</p>
              {(data?.bulan ?? []).length === 0 ? (
                <p data-testid="kategori-tagihan-kosong" className="mt-2 text-justify text-[11px] leading-relaxed text-ink-400">
                  Belum ada tagihan {kategori.nama} pada {istilah.unit} ini. Tagihan dibuat dari menu Tagihan — tekan nama
                  siswa, pilih {kategori.nama}, lalu isi jumlah dan jatuh temponya.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {(data?.bulan ?? []).map((b) => (
                    <BarisBulan
                      key={b.bulan}
                      b={b}
                      terbuka={bulanTerbuka === b.bulan}
                      onBuka={() => setBulanTerbuka((lama) => (lama === b.bulan ? null : b.bulan))}
                    />
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div data-testid="kategori-tagihan-daftar" className="mt-3.5">
              <p className="text-[9.5px] font-bold tracking-[0.12em] text-ink-400 uppercase">Daftar tagihan</p>
              {(data?.tagihan ?? []).length === 0 ? (
                <p data-testid="kategori-tagihan-kosong" className="mt-2 text-justify text-[11px] leading-relaxed text-ink-400">
                  Belum ada tagihan {kategori.nama} pada {istilah.unit} ini. Tagihan dibuat dari menu Tagihan — tekan nama
                  siswa, pilih {kategori.nama}, lalu isi jumlahnya.
                </p>
              ) : (
                <ul className="mt-1">
                  {(data?.tagihan ?? []).map((t) => (
                    <BarisSiswa key={t.id} t={t} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {onUbahKategori ? (
            <button
              type="button"
              data-testid="kategori-tagihan-ubah"
              onClick={onUbahKategori}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-black/[0.12] py-2.5 text-[11.5px] font-semibold text-ink-600"
            >
              <Icon name="pencil" className="h-[14px] w-[14px]" />
              Ubah nama, jenis, atau nominal kategori
            </button>
          ) : null}
        </>
      )}
    </Lembar>
  );
}
