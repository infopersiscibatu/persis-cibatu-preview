import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { rupiah, rupiahSingkat } from "../../lib/format";
import { LABEL_TAGIHAN, ambilStatistikTataUsaha, type StatistikTataUsaha, type TagihanTataUsaha } from "../../lib/unitTataUsaha";
import { useIstilah } from "../../lib/istilah";

/**
 * Dashboard Admin Tata Usaha: statistik tagihan sekolah yang sedang masuk —
 * total tagihan, sudah lunas, tunggakan per jenis, dan pembayaran wali yang
 * menunggu verifikasi. Semua angka dihitung dari database.
 */

const angka = (n: number | undefined) => (n ?? 0).toLocaleString("id-ID");

const jamWib = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
};

const tanggalPendek = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const WARNA_STATUS: Record<string, string> = {
  belum: "bg-rose-100 text-rose-700",
  menunggu: "bg-gold-100 text-gold-800",
  lunas: "bg-persis-100 text-persis-900",
  batal: "bg-cream-100 text-ink-500",
};

function Kartu({
  label,
  nilai,
  ikon,
  petunjuk,
  utama,
  testid,
}: {
  label: string;
  nilai: string;
  ikon: string;
  petunjuk: string;
  utama?: boolean;
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      className={`rounded-2xl border p-3.5 ${utama ? "border-persis-900/25 bg-persis-900 text-white" : "border-black/[0.08] bg-white"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[9.5px] font-bold tracking-[0.1em] uppercase ${utama ? "text-gold-300" : "text-ink-400"}`}>
          {label}
        </p>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${utama ? "bg-white/[0.14]" : "bg-cream-100"}`}>
          <Icon name={ikon} className={`h-[15px] w-[15px] ${utama ? "text-gold-300" : "text-persis-900"}`} />
        </span>
      </div>
      <p
        data-testid={`${testid}-nilai`}
        className={`font-header mt-2 text-[20px] leading-none font-extrabold ${utama ? "text-white" : "text-persis-900"}`}
      >
        {nilai}
      </p>
      <p className={`mt-1.5 text-[10px] leading-snug ${utama ? "text-white/70" : "text-ink-400"}`}>{petunjuk}</p>
    </div>
  );
}

function BarisTagihan({ t, testid }: { t: TagihanTataUsaha; testid: string }) {
  return (
    <li data-testid={testid} className="border-b border-black/[0.05] py-2.5 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11.5px] leading-snug font-semibold text-ink-900">{t.santri}</p>
          <p className="mt-0.5 truncate text-[10px] text-ink-400">
            {t.label}
            {t.jenis ? ` · ${t.jenis}` : ""}
            {t.kelas ? ` · ${t.kelas}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11.5px] font-bold text-persis-900">{rupiah(t.jumlah)}</p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${WARNA_STATUS[t.status] ?? WARNA_STATUS.belum}`}
          >
            {LABEL_TAGIHAN[t.status] ?? t.status}
          </span>
        </div>
      </div>
      {t.jatuhTempo ? (
        <p className="mt-1 text-[9.5px] text-ink-400">Jatuh tempo {tanggalPendek(t.jatuhTempo)}</p>
      ) : null}
    </li>
  );
}

export default function StatistikTataUsaha({ versi = 0 }: { versi?: number }) {
  const istilah = useIstilah();
  const [data, setData] = useState<StatistikTataUsaha | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const muat = useCallback(async (tenang = false) => {
    if (!tenang) setMemuat(true);
    try {
      const jawab = await ambilStatistikTataUsaha();
      setData(jawab);
      setGalat(null);
    } catch (e) {
      const pesan = e instanceof Error ? e.message : "Statistik tagihan belum bisa dimuat.";
      if (!tenang || !data) setGalat(pesan);
    } finally {
      if (!tenang) setMemuat(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void muat();
  }, [muat, versi]);

  /* Angka disegarkan sendiri saat halaman kembali dilihat, tanpa tombol apa pun. */
  useEffect(() => {
    const segarkan = () => {
      if (document.visibilityState !== "hidden") void muat(true);
    };
    document.addEventListener("visibilitychange", segarkan);
    window.addEventListener("focus", segarkan);
    return () => {
      document.removeEventListener("visibilitychange", segarkan);
      window.removeEventListener("focus", segarkan);
    };
  }, [muat]);

  if (memuat && !data) {
    return (
      <p data-testid="tu-memuat" className="mt-4 text-center text-[11.5px] text-ink-400">
        Memuat statistik tagihan…
      </p>
    );
  }

  if (!data) {
    return (
      <section data-testid="tu-galat" className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <p className="text-justify text-[11.5px] leading-relaxed text-ink-600">
          {galat ?? "Statistik tagihan belum bisa dimuat."}
        </p>
        <button
          type="button"
          data-testid="tu-coba-lagi"
          onClick={() => void muat()}
          className="mt-3 w-full rounded-full bg-persis-900 py-2.5 text-[11.5px] font-semibold text-white"
        >
          Coba lagi
        </button>
      </section>
    );
  }

  const t = data.tagihan;
  const p = data.pembayaran;
  const maksJenis = Math.max(1, ...t.perJenis.map((j) => j.tunggakan));

  return (
    <div data-testid="tu-dashboard">
      {/* Catatan bila tagihan bulanan baru saja dibuat otomatis */}
      {data.dibuatOtomatis > 0 ? (
        <p
          data-testid="tu-otomatis"
          className="mt-3 rounded-xl border border-persis-900/20 bg-persis-100/60 px-3 py-2 text-justify text-[10.5px] leading-relaxed text-persis-900"
        >
          {data.dibuatOtomatis} tagihan bulanan bulan ini baru dibuat otomatis untuk {istilah.sebutanKecil} aktif,
          mengikuti kategori
          bulanan beserta tanggal jatuh tempo yang sudah diatur
          {data.notifikasiOtomatis > 0
            ? data.perangkatOtomatis > 0
              ? ` — notifikasi tagihannya diantre untuk ${data.notifikasiOtomatis} wali, ${data.perangkatOtomatis} HP wali terdaftar menerimanya`
              : ` — notifikasi tagihannya diantre untuk ${data.notifikasiOtomatis} wali, namun belum ada HP wali yang terdaftar untuk menerimanya`
            : ""}
          .
        </p>
      ) : null}

      {/* Sapaan petugas tata usaha */}
      <section data-testid="tu-sapaan" className="mt-4 rounded-2xl border border-gold-400/30 bg-white p-4">
        <p className="text-[9.5px] font-bold tracking-[0.16em] text-gold-600 uppercase">Admin Tata Usaha</p>
        <h1 className="font-header mt-1 text-[15px] leading-tight font-extrabold text-persis-900">{data.unit.nama}</h1>
        <p className="mt-1 text-justify text-[11px] leading-relaxed text-ink-600">
          {data.pengurusTu ? `Assalamu'alaikum, ${data.pengurusTu}. ` : "Assalamu'alaikum. "}
          Berikut ringkasan tagihan dan pembayaran {data.unit.nama} — jumlah tagihan, tunggakan, serta pembayaran wali
          yang menunggu verifikasi.
        </p>
        <p data-testid="tu-diperbarui" className="mt-2 text-[10px] text-ink-400">
          Diperbarui {jamWib(data.diperbarui)} WIB · {data.unit.jenjang || "—"}
          {data.tahunAjaran ? ` · ${istilah.tahunAkademik.toLowerCase()} ${data.tahunAjaran.nama}` : ""}
        </p>
      </section>

      {/* Angka pokok tagihan */}
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <Kartu
          testid="tu-kartu-total"
          label="Total tagihan"
          nilai={rupiahSingkat(t.total)}
          ikon="wallet"
          petunjuk={`${rupiah(t.total)} · ${angka(t.jumlah)} tagihan`}
          utama
        />
        <Kartu
          testid="tu-kartu-lunas"
          label="Sudah lunas"
          nilai={rupiahSingkat(t.lunas.nominal)}
          ikon="check"
          petunjuk={
            t.lunas.jumlah > 0
              ? `${rupiah(t.lunas.nominal)} · ${angka(t.lunas.jumlah)} tagihan`
              : "belum ada tagihan yang lunas"
          }
        />
        <Kartu
          testid="tu-kartu-belum"
          label="Belum lunas"
          nilai={rupiahSingkat(t.belumLunas.nominal)}
          ikon="clock"
          petunjuk={`${rupiah(t.belumLunas.nominal)} · ${angka(t.belumLunas.jumlah)} tagihan, ${angka(t.siswaMenunggak)} ${istilah.sebutanKecil}`}
        />
        <Kartu
          testid="tu-kartu-menunggu"
          label="Menunggu verifikasi"
          nilai={rupiahSingkat(p.menunggu.nominal)}
          ikon="shield"
          petunjuk={
            p.menunggu.jumlah > 0
              ? `${rupiah(p.menunggu.nominal)} · ${angka(p.menunggu.jumlah)} pembayaran wali`
              : "tidak ada pembayaran menunggu"
          }
        />
      </div>

      {/* Tunggakan per jenis tagihan */}
      <section data-testid="tu-per-jenis" className="mt-3.5 rounded-2xl border border-black/[0.08] bg-white p-4">
        <h2 className="font-header text-[12.5px] font-bold text-ink-900">Tunggakan per jenis tagihan</h2>
        <p className="mt-0.5 text-justify text-[10.5px] leading-relaxed text-ink-400">
          Tagihan yang belum lunas pada {istilah.unit} ini, dikelompokkan menurut jenisnya.
        </p>
        {t.perJenis.length === 0 ? (
          <p data-testid="tu-jenis-kosong" className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400">
            Belum ada tagihan yang tercatat untuk {istilah.unit} ini, jadi rincian per jenis belum bisa ditampilkan.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {t.perJenis.map((j) => (
              <li key={j.jenis} data-testid={`tu-jenis-${j.jenis}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-[11.5px] font-semibold text-ink-900">{j.jenis}</span>
                  <span className="shrink-0 text-[11px] font-bold text-persis-900">
                    {rupiah(j.tunggakan)} <span className="font-normal text-ink-400">belum lunas</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream-100">
                  <span
                    className={`block h-full rounded-full ${j.tunggakan > 0 ? "bg-gold-500" : "bg-persis-800"}`}
                    style={{ width: `${(j.tunggakan / maksJenis) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-[9.5px] text-ink-400">
                  {angka(j.jumlah)} tagihan · {rupiah(j.total)} total, {rupiah(j.lunas)} sudah dibayar
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ringkasan pembayaran */}
      <section data-testid="tu-pembayaran" className="mt-3.5 rounded-2xl border border-black/[0.08] bg-white p-4">
        <h2 className="font-header text-[12.5px] font-bold text-ink-900">Ringkasan pembayaran</h2>
        <p className="mt-0.5 text-justify text-[10.5px] leading-relaxed text-ink-400">
          Pembayaran wali yang sudah diverifikasi bendahara, yang masih menunggu, dan yang masuk bulan ini.
        </p>
        <div className="mt-2">
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] py-2">
            <span className="text-[11px] font-semibold text-ink-600">Sudah diverifikasi</span>
            <span className="text-right text-[11.5px] font-bold text-persis-900">
              {rupiah(p.terverifikasi.nominal)}
              <span className="ml-1 font-normal text-ink-400">({angka(p.terverifikasi.jumlah)})</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] py-2">
            <span className="text-[11px] font-semibold text-ink-600">Terbayar bulan ini</span>
            <span className="text-right text-[11.5px] font-bold text-persis-900">
              {rupiah(p.bulanIni.nominal)}
              <span className="ml-1 font-normal text-ink-400">({angka(p.bulanIni.jumlah)})</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] py-2">
            <span className="text-[11px] font-semibold text-ink-600">Menunggu verifikasi</span>
            <span className="text-right text-[11.5px] font-bold text-gold-700">
              {rupiah(p.menunggu.nominal)}
              <span className="ml-1 font-normal text-ink-400">({angka(p.menunggu.jumlah)})</span>
            </span>
          </div>
          {t.lewatJatuhTempo.jumlah > 0 ? (
            <div data-testid="tu-lewat-tempo" className="flex items-center justify-between gap-3 border-b border-black/[0.05] py-2">
              <span className="text-[11px] font-semibold text-ink-600">Lewat jatuh tempo</span>
              <span className="text-right text-[11.5px] font-bold text-rose-700">
                {rupiah(t.lewatJatuhTempo.nominal)}
                <span className="ml-1 font-normal text-ink-400">({angka(t.lewatJatuhTempo.jumlah)})</span>
              </span>
            </div>
          ) : null}
          {p.ditolak.jumlah > 0 ? (
            <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] py-2">
              <span className="text-[11px] font-semibold text-ink-600">Pembayaran ditolak</span>
              <span className="text-right text-[11.5px] font-bold text-ink-600">
                {angka(p.ditolak.jumlah)} <span className="font-normal text-ink-400">pembayaran</span>
              </span>
            </div>
          ) : null}
          {t.batal.jumlah > 0 ? (
            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-[11px] font-semibold text-ink-600">Tagihan dibatalkan</span>
              <span className="text-right text-[11.5px] font-bold text-ink-600">
                {angka(t.batal.jumlah)} <span className="font-normal text-ink-400">tagihan</span>
              </span>
            </div>
          ) : null}
        </div>
      </section>

      {/* Tagihan yang belum dibayar */}
      <section data-testid="tu-belum-dibayar" className="mt-3.5 rounded-2xl border border-black/[0.08] bg-white p-4">
        <h2 className="font-header text-[12.5px] font-bold text-ink-900">Tagihan belum dibayar</h2>
        <p className="mt-0.5 text-justify text-[10.5px] leading-relaxed text-ink-400">
          Lima tagihan yang masih perlu ditagih atau diverifikasi, diurutkan dari jatuh tempo terdekat.
        </p>
        {t.belumDibayar.length === 0 ? (
          <p data-testid="tu-belum-kosong" className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400">
            Tidak ada tagihan yang menunggu pembayaran pada {istilah.unit} ini.
          </p>
        ) : (
          <ul className="mt-1">
            {t.belumDibayar.map((b) => (
              <BarisTagihan key={b.id} t={b} testid={`tu-tagihan-${b.id}`} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
