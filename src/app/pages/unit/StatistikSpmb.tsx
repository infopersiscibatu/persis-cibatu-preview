import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Icon } from "../../components/Icons";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import { ambilStatistikSpmb, type StatistikSpmb } from "../../lib/unitSpmb";
import { useIstilah } from "../../lib/istilah";

/**
 * Statistik Admin SPMB sebuah sekolah: ringkasan pendaftar, sebaran status,
 * tujuh hari terakhir, keterisian tiap gelombang, dan data pokok sekolah.
 * Semua angka datang dari database, bukan angka tetap.
 */

const angka = (n: number) => n.toLocaleString("id-ID");

const WARNA = {
  baru: "#B58A2B",
  diverifikasi: "#2C7A5B",
  diterima: "#0F5132",
  tolak: "#A6483C",
} as const;

function Kartu({
  testid,
  label,
  nilai,
  ikon,
  petunjuk,
  utama,
}: {
  testid: string;
  label: string;
  nilai: number;
  ikon: string;
  petunjuk: string;
  utama?: boolean;
}) {
  return (
    <div
      data-testid={testid}
      className={`rounded-2xl border p-3.5 ${
        utama ? "border-persis-900/20 bg-persis-900 text-white" : "border-black/[0.08] bg-white"
      }`}
    >
      <span
        className={`flex items-center gap-2 text-[9.5px] font-bold tracking-[0.1em] uppercase ${
          utama ? "text-gold-300" : "text-persis-800"
        }`}
      >
        <Icon name={ikon} className="h-[14px] w-[14px] shrink-0" />
        {label}
      </span>
      <span
        data-testid={`${testid}-nilai`}
        className={`font-header mt-2 block text-[22px] leading-none font-extrabold ${
          utama ? "text-white" : "text-persis-900"
        }`}
      >
        {angka(nilai)}
      </span>
      <span className={`mt-1 block text-[10px] leading-tight ${utama ? "text-white/70" : "text-ink-400"}`}>
        {petunjuk}
      </span>
    </div>
  );
}

export default function StatistikSpmb({ versi = 0, sisipan }: { versi?: number; sisipan?: ReactNode }) {
  const istilah = useIstilah();
  const [data, setData] = useState<StatistikSpmb | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [jam, setJam] = useState<string>("");

  /** tenang = pembaruan diam-diam: tanpa tanda memuat dan tanpa menghapus data lama. */
  const muat = useCallback(async (tenang = false) => {
    if (!tenang) setMemuat(true);
    try {
      const isi = await ambilStatistikSpmb();
      setData(isi);
      setJam(new Date(isi.diperbarui).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      setGalat(null);
    } catch (e) {
      const teks = e instanceof Error ? e.message : "Statistik belum bisa dimuat.";
      setGalat((sebelum) => (tenang ? sebelum : teks));
    } finally {
      if (!tenang) setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat, versi]);

  /* Angka diperbarui sendiri begitu halaman kembali dilihat, jadi tidak perlu
     tombol segarkan. */
  useEffect(() => {
    const saatKembali = () => {
      if (document.visibilityState === "visible") void muat(true);
    };
    document.addEventListener("visibilitychange", saatKembali);
    window.addEventListener("focus", saatKembali);
    return () => {
      document.removeEventListener("visibilitychange", saatKembali);
      window.removeEventListener("focus", saatKembali);
    };
  }, [muat]);

  if (memuat && !data) {
    return (
      <p data-testid="spmb-memuat" className="pt-5 text-[11.5px] text-ink-400">
        Memuat statistik SPMB…
      </p>
    );
  }

  if (!data) {
    return (
      <div data-testid="spmb-galat" className="mt-5 rounded-2xl border border-black/[0.08] bg-white p-4">
        <p className="text-justify text-[11.5px] leading-relaxed text-ink-600">{galat}</p>
        <button
          type="button"
          data-testid="spmb-coba-lagi"
          onClick={() => void muat()}
          className="mt-3 w-full rounded-full bg-persis-900 py-2.5 text-[11.5px] font-semibold text-white"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const p = data.pendaftar;
  const jumlahStatus = Math.max(1, p.baru + p.diverifikasi + p.diterima + p.ditolak + p.batal);
  const maksHari = Math.max(1, ...data.tujuhHari.map((h) => h.jumlah));
  const totalSeminggu = data.tujuhHari.reduce((t, h) => t + h.jumlah, 0);

  return (
    <div data-testid="spmb-statistik">
      {/* Sapaan pemilik sekolah */}
      <section className="mt-4 rounded-2xl border border-persis-900/15 bg-cream-50 p-4">
        <p className="text-[9.5px] font-bold tracking-[0.14em] text-gold-600 uppercase">Statistik SPMB</p>
        <p className="font-header mt-1 text-[14px] leading-tight font-extrabold text-persis-900">
          {data.pengurusSpmb ? `Assalamu'alaikum, ${data.pengurusSpmb}` : "Assalamu'alaikum, Admin SPMB"}
        </p>
        <p className="mt-1 text-justify text-[11px] leading-relaxed text-ink-600">
          Ringkasan penerimaan santri baru {data.unit.nama}. Semua angka di halaman ini dihitung langsung dari data
          pendaftar {istilah.unit} ini, jadi berubah begitu pendaftar baru masuk.
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] text-ink-400">
          <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-persis-900">{data.unit.jenjang}</span>
          <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-persis-900">{data.unit.slug}</span>
          <span data-testid="spmb-diperbarui">Diperbarui {jam} WIB</span>
        </div>
        {galat ? <p className="mt-2 text-[10.5px] text-rose-700">{galat}</p> : null}
      </section>

      {/* Empat angka pokok */}
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <Kartu
          testid="spmb-kartu-pendaftar"
          label="Pendaftar"
          nilai={p.total}
          ikon="clipboard"
          petunjuk="seluruh gelombang"
          utama
        />
        <Kartu
          testid="spmb-kartu-baru"
          label="Perlu verifikasi"
          nilai={p.baru}
          ikon="clock"
          petunjuk={`${angka(p.hariIni)} masuk hari ini`}
        />
        <Kartu
          testid="spmb-kartu-diverifikasi"
          label="Diverifikasi"
          nilai={p.diverifikasi + p.diterima}
          ikon="check"
          petunjuk={`masuk daftar ${istilah.sebutanKecil}`}
        />
        <Kartu
          testid="spmb-kartu-tidaklanjut"
          label="Tidak lanjut"
          nilai={p.ditolak + p.batal}
          ikon="x"
          petunjuk={`${angka(p.ditolak)} ditolak · ${angka(p.batal)} batal`}
        />
      </div>

      {/* Antrean verifikasi — diletakkan di bawah kartu statistik */}
      {sisipan}

      {/* Sebaran status */}
      <section className="mt-3.5 rounded-2xl border border-black/[0.08] bg-white p-4" data-testid="spmb-bar-status">
        <h2 className="font-header text-[12.5px] font-bold text-ink-900">Sebaran status pendaftar</h2>
        <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-cream-100">
          {(
            [
              ["baru", p.baru, WARNA.baru],
              ["diverifikasi", p.diverifikasi + p.diterima, WARNA.diverifikasi],
              ["tolak", p.ditolak + p.batal, WARNA.tolak],
            ] as const
          ).map(([nama, nilai, warna]) =>
            nilai > 0 ? (
              <span
                key={nama}
                data-testid={`spmb-bar-${nama}`}
                style={{ width: `${(nilai / jumlahStatus) * 100}%`, backgroundColor: warna }}
                title={`${nama}: ${nilai}`}
              />
            ) : null,
          )}
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {(
            [
              ["Perlu verifikasi", p.baru, WARNA.baru],
              ["Diverifikasi", p.diverifikasi + p.diterima, WARNA.diverifikasi],
              ["Ditolak / batal", p.ditolak + p.batal, WARNA.tolak],
            ] as const
          ).map(([label, nilai, warna]) => (
            <li key={label} className="flex items-center gap-2 text-[10.5px] text-ink-600">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: warna }} />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <span className="font-semibold text-ink-900">{angka(nilai)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-justify text-[10.5px] leading-relaxed text-ink-400">
          Pastikan setiap pendaftar segera dipindahkan dari "perlu verifikasi" ke diverifikasi, supaya calon{" "}
          {istilah.waliKecil} tahu hasilnya lebih cepat dan datanya masuk ke daftar siswa/mahasiswa sekolah.
        </p>
      </section>

      {/* Tujuh hari terakhir */}
      <section className="mt-3.5 rounded-2xl border border-black/[0.08] bg-white p-4" data-testid="spmb-tujuh-hari">
        <KepalaKartu
          judul="Pendaftar 7 hari terakhir"
          keterangan="Banyaknya pendaftar yang masuk pada tiap hari selama sepekan terakhir."
          angka={angka(totalSeminggu)}
          labelAngka="pendaftar"
          testidAngka="spmb-tujuh-hari-jumlah"
        />
        <div className="mt-4 flex h-[112px] items-end justify-between gap-2">
          {data.tujuhHari.map((h) => (
            <div key={h.tanggal} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-persis-900">{h.jumlah > 0 ? angka(h.jumlah) : ""}</span>
              <span
                data-testid={`spmb-hari-${h.tanggal}`}
                className="w-full rounded-t-lg bg-persis-900/85"
                style={{ height: `${Math.max(h.jumlah > 0 ? 8 : 3, (h.jumlah / maksHari) * 76)}px` }}
                title={`${h.tanggal}: ${h.jumlah}`}
              />
              <span className="text-[9.5px] text-ink-400">{h.label}</span>
            </div>
          ))}
        </div>
        {totalSeminggu === 0 ? (
          <p className="mt-3 text-justify text-[10.5px] leading-relaxed text-ink-400">
            Belum ada pendaftar dalam tujuh hari terakhir.
          </p>
        ) : null}
      </section>

      {/* Per gelombang */}
      <section className="mt-3.5" data-testid="spmb-gelombang">
        <h2 className="font-header px-1 text-[12.5px] font-bold text-ink-900">Pendaftar per gelombang</h2>
        {data.gelombang.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-black/[0.08] bg-white p-4 text-justify text-[11px] leading-relaxed text-ink-400">
            Belum ada gelombang pendaftaran yang disusun. Gelombang diatur pengurus pusat pada panel admin.
          </p>
        ) : (
          <div className="mt-2 space-y-2.5">
            {data.gelombang.map((g) => {
              const terisi = g.kuotaAngka > 0 ? Math.min(100, Math.round((g.total / g.kuotaAngka) * 100)) : 0;
              return (
                <div
                  key={g.id}
                  data-testid={`spmb-gelombang-${g.id}`}
                  className="rounded-2xl border border-black/[0.08] bg-white p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-header text-[12.5px] leading-tight font-bold text-ink-900">{g.nama}</p>
                      <p className="mt-0.5 text-[10.5px] text-ink-400">{g.periode || "Periode belum diatur"}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[9.5px] font-bold ${
                        g.status.toLowerCase().includes("buka")
                          ? "bg-persis-900 text-gold-300"
                          : "bg-cream-100 text-ink-600"
                      }`}
                    >
                      {g.status || "—"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9.5px] tracking-[0.08em] text-ink-400 uppercase">Pendaftar</p>
                      <p className="font-header text-[15px] font-extrabold text-persis-900">{angka(g.total)}</p>
                    </div>
                    <div>
                      <p className="text-[9.5px] tracking-[0.08em] text-ink-400 uppercase">Diterima</p>
                      <p className="font-header text-[15px] font-extrabold text-persis-900">{angka(g.diterima)}</p>
                    </div>
                    <div>
                      <p className="text-[9.5px] tracking-[0.08em] text-ink-400 uppercase">Perlu verifikasi</p>
                      <p className="font-header text-[15px] font-extrabold text-persis-900">{angka(g.baru)}</p>
                    </div>
                  </div>

                  {g.kuotaAngka > 0 ? (
                    <>
                      <div className="mt-3 flex items-baseline justify-between text-[10px] text-ink-400">
                        <span>Kuota {g.kuota}</span>
                        <span className="font-semibold text-ink-900">{terisi}% terisi</span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-cream-100">
                        <span className="block h-full rounded-full bg-gold-400" style={{ width: `${terisi}%` }} />
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Data pokok sekolah + kondisi formulir */}
      <section className="mt-3.5 grid grid-cols-2 gap-2.5" data-testid="spmb-data-sekolah">
        <div className="col-span-2 rounded-2xl border border-black/[0.08] bg-white p-3.5">
          <h2 className="font-header text-[12.5px] font-bold text-ink-900">Kondisi pendaftaran</h2>
          <p className="mt-1.5 text-justify text-[11px] leading-relaxed text-ink-600">
            Formulir pendaftaran {data.formulir.judul} di situs saat ini{" "}
            <strong className="font-semibold text-persis-900">
              {data.formulir.aktif ? "dibuka" : "ditutup"}
            </strong>
            . {" "}
            {data.formulir.aktif
              ? `Calon ${istilah.waliKecil} bisa mengisi formulir dari halaman ${istilah.penerimaan}.`
              : `Pengurus pusat menutup formulir; ${istilah.calonKecil} diarahkan menghubungi ${istilah.unit}.`}
          </p>
        </div>
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
          <p className="text-[9.5px] font-bold tracking-[0.1em] text-persis-800 uppercase">{`${istilah.sebutan} aktif`}</p>
          <p className="font-header mt-1.5 text-[17px] font-extrabold text-persis-900">
            {angka(data.sekolah.santriAktif)}
          </p>
          <p className="mt-1 text-[10px] text-ink-400">
            {angka(data.sekolah.santriAktif)} tercatat pada unit ini
          </p>
        </div>
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
          <p className="text-[9.5px] font-bold tracking-[0.1em] text-persis-800 uppercase">{istilah.rombel}</p>
          <p className="font-header mt-1.5 text-[17px] font-extrabold text-persis-900">{angka(data.sekolah.rombel)}</p>
          <p className="mt-1 text-[10px] text-ink-400">{angka(data.sekolah.guru)} {istilah.pengajarTunggalKecil}</p>
        </div>
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
          <p className="text-[9.5px] font-bold tracking-[0.1em] text-persis-800 uppercase">{istilah.jurusan}</p>
          <p className="font-header mt-1.5 text-[17px] font-extrabold text-persis-900">{angka(data.sekolah.jurusan)}</p>
          <p className="mt-1 text-[10px] text-ink-400">pilihan program</p>
        </div>
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
          <p className="text-[9.5px] font-bold tracking-[0.1em] text-persis-800 uppercase">{istilah.kegiatan}</p>
          <p className="font-header mt-1.5 text-[17px] font-extrabold text-persis-900">
            {angka(data.sekolah.ekstrakurikuler)}
          </p>
          <p className="mt-1 text-[10px] text-ink-400">kegiatan</p>
        </div>
      </section>

      {p.total === 0 ? (
        <div data-testid="spmb-kosong" className="mt-3.5 rounded-2xl border border-dashed border-persis-900/25 bg-white p-4">
          <p className="text-[10px] font-bold tracking-[0.1em] text-persis-800 uppercase">Belum ada pendaftar</p>
          <p className="mt-1.5 text-justify text-[11px] leading-relaxed text-ink-600">
            Statistik di halaman ini akan terisi begitu data pendaftar {istilah.unit} ini dimasukkan. Menu {istilah.calon} untuk
            memasukkan dan memverifikasi calon santri sedang disiapkan, jadi angkanya masih nol untuk sementara.
          </p>
        </div>
      ) : null}
    </div>
  );
}
