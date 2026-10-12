import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { rupiah } from "../../lib/format";
import {
  daftarTunggakanTU,
  type PesertaTunggakan,
  type SiswaTagihan,
} from "../../lib/unitTataUsaha";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import PopupTagihanSiswa from "./PopupTagihanSiswa";
import RiwayatLulusan from "./RiwayatLulusan";
import { useIstilah } from "../../lib/istilah";

/**
 * Menu Tunggakan & Lunas: laporan tagihan untuk peserta didik yang sudah dinyatakan
 * lulus di Admin Sekolah, dua tabel saja.
 *  - Tunggakan: lulus tetapi masih punya tagihan belum lunas.
 *  - Lunas    : lulus dan tidak ada tagihan belum lunas lagi.
 * Menekan satu nama pada tabel Tunggakan membuka tagihannya untuk dibayar; pada tabel Lunas
 * membuka riwayat pembayarannya — hanya untuk dilihat, karena tagihannya sudah lunas.
 */

const tanggalPendek = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const LABEL_STATUS: Record<string, string> = {
  lulus: "Lulus",
  pindah: "Pindah",
  nonaktif: "Tidak aktif",
  calon: "Calon",
  aktif: "Aktif",
};

export default function TunggakanLunas({ onBerubah }: { onBerubah?: () => void }) {
  const istilah = useIstilah();
  const [data, setData] = useState<Awaited<ReturnType<typeof daftarTunggakanTU>> | null>(null);
  const [cari, setCari] = useState("");
  const [kataKunci, setKataKunci] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [terbuka, setTerbuka] = useState<SiswaTagihan | null>(null);
  const [riwayat, setRiwayat] = useState<PesertaTunggakan | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await daftarTunggakanTU(kataKunci);
      setData(jawab);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Laporan tunggakan belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, [kataKunci]);

  useEffect(() => {
    void muat();
  }, [muat]);

  useEffect(() => {
    const jeda = setTimeout(() => setKataKunci(cari), 350);
    return () => clearTimeout(jeda);
  }, [cari]);

  const bukaTagihan = (p: PesertaTunggakan) =>
    setTerbuka({
      id: p.id,
      nama: p.nama,
      kelas: p.kelas,
      program: p.program,
      programNama: p.programNama,
      status: p.status,
      jumlahTagihan: p.jumlahTagihan,
      tunggakan: p.nominal,
      jenis: [],
    });

  const ringkas = data?.ringkasan;
  const tunggakan = data?.tunggakan ?? [];
  const lunas = data?.lunas ?? [];

  const baris = (p: PesertaTunggakan, jenis: "tunggakan" | "lunas") => (
    <li key={`${jenis}-${p.id}`}>
      <button
        type="button"
        data-testid={`tu-${jenis}-${p.id}`}
        onClick={() => (jenis === "tunggakan" ? bukaTagihan(p) : setRiwayat(p))}
        aria-label={
          jenis === "tunggakan"
            ? `Buka tagihan ${p.nama}`
            : `Lihat riwayat pembayaran ${p.nama}`
        }
        className="flex w-full items-stretch gap-1.5 rounded-xl border border-black/[0.08] text-left transition active:scale-[0.99]"
      >
        <span className="min-w-0 flex-1 px-3.5 py-2.5">
          <span className="flex items-center gap-2">
            <span className="truncate text-[11.5px] font-semibold text-ink-900">{p.nama}</span>
            {p.status !== "aktif" ? (
              <span className="shrink-0 rounded-full bg-cream-100 px-2 py-0.5 text-[9px] font-bold text-ink-500">
                {LABEL_STATUS[p.status] ?? p.status}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-[9.5px] text-ink-400">
            {[p.kelas, p.programNama, `${p.jumlahTagihan} tagihan`].filter(Boolean).join(" · ")}
          </span>
          <span className="mt-0.5 block truncate text-[9.5px] text-ink-500">
            {jenis === "tunggakan"
              ? p.jatuhTempo
                ? `Jatuh tempo terdekat ${tanggalPendek(p.jatuhTempo)}`
                : "Belum ada tanggal jatuh tempo"
              : p.terakhir
                ? `Lunas terakhir ${tanggalPendek(p.terakhir)}`
                : "Tanpa tagihan tercatat"}
          </span>
          <span className="mt-0.5 block text-[9px] font-semibold text-persis-900">
            {jenis === "tunggakan" ? "Ketuk untuk menagih ›" : "Ketuk untuk lihat riwayat ›"}
          </span>
        </span>
        <span className="flex w-[104px] shrink-0 flex-col items-end justify-center border-l border-black/[0.07] px-2.5 py-2 text-right">
          <span
            className={`text-[11.5px] font-bold ${jenis === "tunggakan" ? "text-rose-700" : "text-persis-900"}`}
          >
            {rupiah(p.nominal)}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold text-persis-900">
            {jenis === "tunggakan" ? "belum lunas" : "lunas"}
          </span>
        </span>
      </button>
    </li>
  );

  return (
    <section data-testid="tu-tunggakan" className="mt-4">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <KepalaKartu
          judul="Tunggakan &amp; Lunas"
          keterangan={`Laporan untuk ${istilah.sebutanKecil} yang sudah dinyatakan lulus di Admin Sekolah. Yang masih punya tagihan masuk tabel Tunggakan; begitu lunas, namanya pindah ke tabel Lunas. Menekan nama di tabel Tunggakan membuka tagihannya untuk dibayar, sedang di tabel Lunas membuka riwayat pembayarannya.`}
          angka={ringkas?.menunggak ?? 0}
          labelAngka="menunggak"
          testidAngka="tu-tunggakan-jumlah-menunggak"
        />

        <div className="mt-2.5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-black/[0.08] p-2.5">
            <p className="text-[9px] font-bold tracking-[0.08em] text-ink-400 uppercase">Menunggak</p>
            <p data-testid="tu-tunggakan-orang" className="mt-1 text-[15px] font-extrabold text-rose-700">
              {ringkas?.menunggak ?? 0}
            </p>
            <p className="text-[9px] text-ink-400">{istilah.sebutanKecil} lulus</p>
          </div>
          <div className="rounded-xl border border-black/[0.08] p-2.5">
            <p className="text-[9px] font-bold tracking-[0.08em] text-ink-400 uppercase">Tunggakan</p>
            <p data-testid="tu-tunggakan-nominal" className="mt-1 text-[13px] font-extrabold text-persis-900">
              {rupiah(ringkas?.nominalTunggakan ?? 0)}
            </p>
            <p className="text-[9px] text-ink-400">nilai belum lunas</p>
          </div>
          <div className="rounded-xl border border-black/[0.08] p-2.5">
            <p className="text-[9px] font-bold tracking-[0.08em] text-ink-400 uppercase">Lunas</p>
            <p data-testid="tu-lunas-orang" className="mt-1 text-[15px] font-extrabold text-persis-900">
              {ringkas?.lunas ?? 0}
            </p>
            <p className="text-[9px] text-ink-400">{istilah.sebutanKecil} lulus</p>
          </div>
        </div>

        <input
          type="search"
          data-testid="tu-tunggakan-cari"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder={`Cari nama ${istilah.sebutanKecil} atau kelas…`}
          className="mt-2.5 w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40"
        />

        {memuat && !data ? (
          <p className="mt-3 text-[11px] text-ink-400">Memuat laporan tagihan…</p>
        ) : galat && !data ? (
          <p className="mt-3 text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
        ) : (
          <>
            <div data-testid="tu-tunggakan-daftar" className="mt-3.5">
              <div className="flex items-center gap-2">
                <Icon name="clock" className="h-[14px] w-[14px] text-rose-700" />
                <p className="text-[9.5px] font-bold tracking-[0.12em] text-ink-400 uppercase">
                  Tunggakan ({tunggakan.length})
                </p>
              </div>
              {tunggakan.length === 0 ? (
                <p
                  data-testid="tu-tunggakan-kosong"
                  className="mt-2 text-justify text-[10.5px] leading-relaxed text-ink-400"
                >
                  {kataKunci
                    ? `Tidak ada tunggakan atas nama yang cocok dengan “${kataKunci}”.`
                    : `Belum ada lulusan yang menunggak pada ${istilah.unit} ini.`}
                </p>
              ) : (
                <ul className="mt-2 space-y-2">{tunggakan.map((p) => baris(p, "tunggakan"))}</ul>
              )}
            </div>

            <div data-testid="tu-lunas-daftar" className="mt-3.5">
              <div className="flex items-center gap-2">
                <Icon name="check" className="h-[14px] w-[14px] text-persis-900" />
                <p className="text-[9.5px] font-bold tracking-[0.12em] text-ink-400 uppercase">
                  Lunas ({lunas.length})
                </p>
              </div>
              {lunas.length === 0 ? (
                <p data-testid="tu-lunas-kosong" className="mt-2 text-justify text-[10.5px] leading-relaxed text-ink-400">
                  {kataKunci
                    ? `Tidak ada nama yang lunas dan cocok dengan “${kataKunci}”.`
                    : `Belum ada lulusan yang lunas. ${istilah.sebutan} yang masih berstatus aktif tidak masuk laporan ini — tagihannya dilihat di menu Tagihan.`}
                </p>
              ) : (
                <ul className="mt-2 space-y-2">{lunas.map((p) => baris(p, "lunas"))}</ul>
              )}
            </div>

            <p className="mt-3 text-justify text-[10px] leading-relaxed text-ink-400">
              Pindahnya satu nama dari tabel Tunggakan ke tabel Lunas mengikuti keadaan tagihannya: begitu seluruh
              tagihan diverifikasi lunas, namanya masuk tabel Lunas. Status lulus ditetapkan dari menu{" "}
              {istilah.sebutan} di Admin Sekolah. Karena itu pula nama yang sudah lulus tidak lagi muncul di menu
              Tagihan — tagihannya ditangani dari laporan ini.
            </p>
          </>
        )}
      </div>

      {riwayat ? <RiwayatLulusan peserta={riwayat} onTutup={() => setRiwayat(null)} /> : null}

      {terbuka ? (
        <PopupTagihanSiswa
          siswa={terbuka}
          onTutup={() => setTerbuka(null)}
          onBerubah={() => {
            void muat();
            onBerubah?.();
          }}
        />
      ) : null}
    </section>
  );
}
