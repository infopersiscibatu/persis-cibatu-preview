import { useCallback, useEffect, useState } from "react";
import { Icon } from "../Icons";
import { useIstilah } from "../../lib/istilah";
import { daftarSiswa, labelStatusSiswa, type SiswaUnit } from "../../lib/unitSekolah";

/**
 * Pemilih peserta didik untuk halaman unit (Nilai dan Tahfidz).
 *
 * Petugas mencari nama siswa/mahasiswa — atau nama walinya — lalu memilih satu untuk
 * diisi nilainya. Daftarnya diambil dari data unit yang sedang masuk.
 */
export default function PemilihPeserta({
  pilih,
  onPilih,
  judul = "Pilih peserta didik",
  keterangan,
  testid = "pemilih-peserta",
}: {
  pilih: SiswaUnit | null;
  onPilih: (s: SiswaUnit) => void;
  judul?: string;
  keterangan?: string;
  testid?: string;
}) {
  const t = useIstilah();
  const [cari, setCari] = useState("");
  const [siswa, setSiswa] = useState<SiswaUnit[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const muat = useCallback(async (kata: string) => {
    setMemuat(true);
    setGalat(null);
    try {
      const jawab = await daftarSiswa({ status: "semua", cari: kata, batas: 120 });
      setSiswa(jawab.siswa);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : `Daftar ${t.sebutanKecil} belum bisa dimuat.`);
    } finally {
      setMemuat(false);
    }
  }, [t.sebutanKecil]);

  useEffect(() => {
    const jeda = window.setTimeout(() => void muat(cari), cari ? 350 : 0);
    return () => window.clearTimeout(jeda);
  }, [cari, muat]);

  return (
    <section data-testid={testid} className="rounded-2xl border border-black/[0.08] bg-white p-4">
      <h2 className="font-header text-[13.5px] font-bold text-ink-900">{judul}</h2>
      <p className="mt-0.5 text-justify text-[11px] leading-relaxed text-ink-600">
        {keterangan ?? `Cari nama ${t.sebutanKecil} atau nama walinya, lalu pilih satu untuk diisi datanya.`}
      </p>

      <label className="mt-3 block">
        <span className="field-label">Cari {t.sebutanKecil}</span>
        <input
          type="text"
          data-testid={`${testid}-cari`}
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder={`Nama ${t.sebutanKecil} atau wali`}
          className="w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2.5 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40"
        />
      </label>

      {galat ? (
        <p data-testid={`${testid}-galat`} className="mt-3 text-justify text-[11px] leading-relaxed text-rose-700">
          {galat}
        </p>
      ) : null}

      {memuat ? (
        <p className="mt-3 text-[11.5px] text-ink-600">Memuat daftar {t.sebutanKecil}…</p>
      ) : siswa.length === 0 ? (
        <p data-testid={`${testid}-kosong`} className="mt-3 text-[11.5px] text-ink-600">
          Tidak ada {t.sebutanKecil} yang cocok dengan pencarian.
        </p>
      ) : (
        <ul className="mt-3 max-h-[280px] divide-y divide-black/[0.06] overflow-y-auto border-t border-black/[0.06]">
          {siswa.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                data-testid={`${testid}-siswa-${s.id}`}
                aria-pressed={pilih?.id === s.id}
                onClick={() => onPilih(s)}
                className={`flex w-full items-center justify-between gap-3 py-2.5 text-left transition ${
                  pilih?.id === s.id ? "bg-cream-100" : ""
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-ink-900">{s.nama}</span>
                  <span className="mt-0.5 block text-[10.5px] text-persis-900">
                    {[s.kelas, s.programNama || "", labelStatusSiswa(s.status)].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-ink-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Ringkasan peserta didik yang sedang dipilih, dipakai di atas borang nilai/tahfidz. */
export function KartuPeserta({ siswa, kanan }: { siswa: SiswaUnit | null; kanan?: string }) {
  const t = useIstilah();
  if (!siswa) {
    return (
      <section className="rounded-2xl border border-black/[0.08] bg-white p-4">
        <p data-testid="peserta-belum-pilih" className="text-justify text-[11.5px] leading-relaxed text-ink-600">
          Pilih {t.sebutanKecil} terlebih dahulu untuk mengisi datanya.
        </p>
      </section>
    );
  }
  return (
    <section data-testid="peserta-terpilih" className="rounded-2xl border border-black/[0.08] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
            {siswa.jenjang || t.statUnit}
          </p>
          <p className="font-header mt-1 text-[13.5px] font-bold text-ink-900">{siswa.nama}</p>
          <p className="mt-0.5 text-[10.5px] text-persis-900">
            {[siswa.kelas, siswa.programNama || "", labelStatusSiswa(siswa.status)].filter(Boolean).join(" · ")}
          </p>
        </div>
        {kanan ? (
          <span className="shrink-0 rounded-full bg-cream-100 px-2.5 py-1 text-[9.5px] font-bold text-persis-900">
            {kanan}
          </span>
        ) : null}
      </div>
    </section>
  );
}
