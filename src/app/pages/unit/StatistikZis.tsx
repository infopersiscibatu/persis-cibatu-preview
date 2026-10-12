import { Icon } from "../../components/Icons";
import { rupiah, tanggalPendek } from "../../lib/format";
import { useStatistikZis } from "../../lib/zis";
import VerifikasiDonasi from "./VerifikasiDonasi";

/**
 * Dasbor Admin ZIS: angka pokok donasi, infak, dan wakaf.
 *
 * Empat angka utama dihitung dari database — jumlah donasi (total nominal), jumlah
 * program, jumlah donatur, dan jumlah penyaluran (total nominal). Tidak ada angka
 * yang diisi manual, sehingga nilainya selalu mengikuti data yang tersimpan.
 */

const angka = (n: number | undefined) => (n ?? 0).toLocaleString("id-ID");

function Kartu({
  label,
  nilai,
  ikon,
  petunjuk,
  utama,
  nominal,
  testid,
}: {
  label: string;
  nilai: string;
  ikon: string;
  petunjuk: string;
  utama?: boolean;
  /** Nilai berupa nominal rupiah: hurufnya dibuat lebih kecil agar tidak terpotong. */
  nominal?: boolean;
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      className={`rounded-2xl border p-3.5 ${
        utama ? "border-persis-900/25 bg-persis-900 text-white" : "border-black/[0.08] bg-white"
      }`}
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
        className={`font-header mt-2 leading-none font-extrabold tracking-tight break-words ${
          nominal ? "text-[15.5px] sm:text-[17px]" : "text-[20px]"
        } ${utama ? "text-white" : "text-persis-900"}`}
      >
        {nilai}
      </p>
      <p className={`mt-1.5 text-[10px] leading-snug ${utama ? "text-white/70" : "text-ink-400"}`}>{petunjuk}</p>
    </div>
  );
}

export default function StatistikZis() {
  const { data, memuat, galat, muat } = useStatistikZis();

  if (memuat && !data) {
    return (
      <div data-testid="zis-statistik" className="mt-4 grid grid-cols-2 gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-2xl border border-black/[0.06] bg-white" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div data-testid="zis-statistik" className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <p className="text-justify text-[11.5px] leading-relaxed text-ink-600">
          {galat ?? "Statistik ZIS belum bisa dimuat."}
        </p>
        <button
          type="button"
          data-testid="zis-muat-ulang"
          onClick={() => void muat()}
          className="mt-3 rounded-full bg-persis-900 px-3.5 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98]"
        >
          Muat ulang
        </button>
      </div>
    );
  }

  const { donasi, program, donatur, penyaluran } = data;

  return (
    <div data-testid="zis-statistik" className="mt-4">
      <div className="grid grid-cols-2 gap-2.5">
        <Kartu
          testid="zis-kartu-donasi"
          utama
          nominal
          label="Jumlah Donasi"
          nilai={rupiah(donasi.total)}
          ikon="wallet"
          petunjuk={`Total nominal dana terkumpul dari ${angka(program.total)} program donasi.`}
        />
        <Kartu
          testid="zis-kartu-program"
          label="Jumlah Program"
          nilai={angka(program.total)}
          ikon="heart"
          petunjuk={`${angka(program.aktif)} program masih berjalan dan menerima donasi.`}
        />
        <Kartu
          testid="zis-kartu-donatur"
          label="Jumlah Donatur"
          nilai={angka(donatur.total)}
          ikon="users"
          petunjuk={`Donatur yang tercatat pada ${angka(program.total)} program.`}
        />
        <Kartu
          testid="zis-kartu-penyaluran"
          nominal
          label="Jumlah Penyaluran"
          nilai={rupiah(penyaluran.total)}
          ikon="check"
          petunjuk={
            penyaluran.jumlah > 0
              ? `${angka(penyaluran.jumlah)} pencairan tercatat${
                  penyaluran.terakhir ? `, terakhir ${tanggalPendek(penyaluran.terakhir)}` : ""
                }.`
              : "Belum ada pencairan yang dicatat."
          }
        />
      </div>

      {/* Verifikasi donasi: dua kartu di bawah statistik utama. */}
      <VerifikasiDonasi onBerubah={() => void muat()} />

      <section
        aria-label="Keterangan statistik"
        className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4"
        data-testid="zis-keterangan"
      >
        <h2 className="font-header text-[13px] font-bold text-ink-900">Cara angka ini dihitung</h2>
        <ul className="mt-2 space-y-1.5 text-justify text-[11px] leading-relaxed text-ink-600">
          <li>
            <span className="font-semibold text-persis-900">Jumlah donasi</span> — penjumlahan dana terkumpul dari
            seluruh program donasi yang tercatat, bukan angka yang diisi manual.
          </li>
          <li>
            <span className="font-semibold text-persis-900">Jumlah program</span> — banyaknya program donasi beserta
            berapa yang masih aktif.
          </li>
          <li>
            <span className="font-semibold text-persis-900">Jumlah donatur</span> — jumlah donatur yang tercatat pada
            semua program, sama dengan yang tampil di halaman donasi situs.
          </li>
          <li>
            <span className="font-semibold text-persis-900">Jumlah penyaluran</span> — penjumlahan nominal pencairan
            dana yang dicatat petugas ZIS, sehingga dana yang sudah disalurkan selalu dapat dilihat.
          </li>
        </ul>
      </section>
    </div>
  );
}
