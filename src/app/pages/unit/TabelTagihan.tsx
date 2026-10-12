import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { rupiah } from "../../lib/format";
import { daftarSiswaTagihan, type SiswaTagihan } from "../../lib/unitTataUsaha";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import PopupTagihanSiswa from "./PopupTagihanSiswa";
import { useIstilah } from "../../lib/istilah";

/**
 * Menu Tagihan: tabel siswa sekolah ini dengan kolom nama dan jenis tagihan.
 * Menekan satu siswa membuka popup untuk memilih jenis tagihannya lebih dahulu,
 * baru mengisi data tagihannya.
 */

const SARINGAN = [
  { id: "semua", label: "Semua" },
  { id: "punya", label: "Sudah ditagih" },
];

/** Status siswa yang bukan aktif tetap ditandai, karena seluruh data ikut ditarik. */
const LABEL_SISWA: Record<string, string> = {
  aktif: "Aktif",
  lulus: "Sudah lulus",
  pindah: "Pindah",
  nonaktif: "Tidak aktif",
};

export default function TabelTagihan({ onBerubah }: { onBerubah?: () => void }) {
  const istilah = useIstilah();
  const [siswa, setSiswa] = useState<SiswaTagihan[]>([]);
  const [ringkasan, setRingkasan] = useState({ semua: 0, sudahDitagih: 0 });
  const [saring, setSaring] = useState("semua");
  const [cari, setCari] = useState("");
  const [kataKunci, setKataKunci] = useState("");
  const [penuh, setPenuh] = useState(false);
  const [sebutan, setSebutan] = useState(istilah.sebutanKecil);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [terbuka, setTerbuka] = useState<SiswaTagihan | null>(null);

  const muat = useCallback(
    async (lewat = 0) => {
      setMemuat(true);
      try {
        const jawab = await daftarSiswaTagihan({ cari: kataKunci, saring, batas: 60, lewat });
        setSiswa((lama) => (lewat > 0 ? [...lama, ...jawab.siswa] : jawab.siswa));
        setRingkasan(jawab.ringkasan);
        setPenuh(jawab.penuh);
        setSebutan(jawab.sebutan || istilah.sebutanKecil);
        setGalat(null);
      } catch (e) {
        setGalat(e instanceof Error ? e.message : `Daftar ${istilah.sebutanKecil} belum bisa dimuat.`);
      } finally {
        setMemuat(false);
      }
    },
    [kataKunci, saring],
  );

  useEffect(() => {
    void muat();
  }, [muat]);

  /* Pencarian ditahan sesaat supaya tidak meminta data setiap ketukan. */
  useEffect(() => {
    const jeda = setTimeout(() => setKataKunci(cari), 350);
    return () => clearTimeout(jeda);
  }, [cari]);

  return (
    <section data-testid="tu-tagihan" className="mt-4">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <KepalaKartu
          judul={`Tagihan ${sebutan}`}
          keterangan={`Tagihan untuk ${sebutan} yang masih berstatus aktif di Admin Sekolah. Tekan namanya untuk memilih jenis tagihan lebih dahulu, lalu isi jumlah dan jatuh temponya. Nama yang sudah dinyatakan lulus tidak lagi di sini — tagihannya ditangani di menu Tunggakan & Lunas.`}
          angka={ringkasan.sudahDitagih}
          labelAngka="sudah ditagih"
          testidAngka="tu-tagihan-jumlah"
        />

        <div className="mt-3 space-y-2">
          <input
            type="search"
            data-testid="tu-tagihan-cari"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={`Cari nama ${istilah.sebutanKecil} atau orang tua…`}
            className="w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {SARINGAN.map((s) => (
              <button
                key={s.id}
                type="button"
                data-testid={`tu-tagihan-saring-${s.id}`}
                onClick={() => setSaring(s.id)}
                className={`rounded-full px-3 py-1.5 text-[10.5px] font-semibold transition ${
                  saring === s.id ? "bg-persis-900 text-white" : "border border-black/[0.1] text-persis-900"
                }`}
              >
                {s.id === "semua" ? `Semua ${sebutan}` : s.label}{" "}
                {s.id === "semua" ? `(${ringkasan.semua})` : `(${ringkasan.sudahDitagih})`}
              </button>
            ))}
          </div>
        </div>

        {memuat && siswa.length === 0 ? (
          <p className="mt-3 text-[11px] text-ink-400">Memuat daftar {istilah.sebutanKecil}…</p>
        ) : galat ? (
          <p className="mt-3 text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
        ) : siswa.length === 0 ? (
          <p data-testid="tu-tagihan-kosong" className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400">
            {kataKunci
              ? `Tidak ada ${sebutan} yang cocok dengan pencarian.`
              : saring === "punya"
                ? `Belum ada ${sebutan} yang punya tagihan pada ${istilah.unit} ini. Pilih saringan “Semua ${sebutan}” untuk mulai membuat tagihan.`
                : `Belum ada ${sebutan} yang tercatat pada ${istilah.unit} ini.`}
          </p>
        ) : (
          <>
            <div className="mt-3 overflow-hidden rounded-xl border border-black/[0.07]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-cream-50 text-[9.5px] tracking-[0.08em] text-ink-400 uppercase">
                    <th scope="col" className="px-3 py-2 text-left font-bold">Nama</th>
                    <th scope="col" className="px-2 py-2 text-left font-bold">Jenis tagihan</th>
                    <th scope="col" className="px-2 py-2 text-right font-bold">
                      <span className="sr-only">Buka tagihan {istilah.sebutanKecil}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {siswa.map((s) => (
                    <tr
                      key={s.id}
                      data-testid={`tu-siswa-baris-${s.id}`}
                      onClick={() => setTerbuka(s)}
                      className="cursor-pointer border-t border-black/[0.05] align-top transition hover:bg-cream-50/70"
                    >
                      <td className="px-3 py-2.5">
                        <span className="block text-[11.5px] leading-snug font-semibold text-ink-900">{s.nama}</span>
                        <span className="mt-0.5 block text-[9.5px] text-ink-400">
                          {s.kelas ? `${s.kelas} · ` : ""}
                          {s.jumlahTagihan > 0 ? `${s.jumlahTagihan} tagihan` : "belum ada tagihan"}
                        </span>
                        {s.status && s.status !== "aktif" ? (
                          <span className="mt-1 inline-block rounded-full bg-cream-100 px-2 py-0.5 text-[9px] font-bold text-ink-500">
                            {LABEL_SISWA[s.status] ?? s.status}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-2 py-2.5">
                        {s.jenis.length === 0 ? (
                          <span className="text-[10px] text-ink-400">—</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {s.jenis.slice(0, 3).map((j) => (
                              <span key={j} className="rounded-full bg-gold-100 px-2 py-0.5 text-[9.5px] font-bold text-gold-800">
                                {j}
                              </span>
                            ))}
                            {s.jenis.length > 3 ? (
                              <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[9.5px] font-bold text-ink-500">
                                +{s.jenis.length - 3}
                              </span>
                            ) : null}
                          </span>
                        )}
                        {s.tunggakan > 0 ? (
                          <span className="mt-1 block text-[9.5px] text-ink-400">belum lunas {rupiah(s.tunggakan)}</span>
                        ) : null}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <button
                          type="button"
                          data-testid={`tu-siswa-buka-${s.id}`}
                          aria-label={`Buka tagihan ${s.nama}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTerbuka(s);
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

            {penuh ? (
              <button
                type="button"
                data-testid="tu-tagihan-muat-lagi"
                onClick={() => void muat(siswa.length)}
                className="mt-2.5 w-full rounded-full border border-dashed border-persis-900/25 py-2 text-[11px] font-semibold text-persis-900"
              >
                Muat 60 siswa berikutnya
              </button>
            ) : null}
          </>
        )}
      </div>

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
