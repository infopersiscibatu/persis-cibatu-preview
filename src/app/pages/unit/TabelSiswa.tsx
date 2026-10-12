import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import { daftarSiswa, type RingkasanSiswa, type SekolahSiswa, type SiswaUnit } from "../../lib/unitSekolah";
import FormSiswa from "./FormSiswa";
import { useIstilah } from "../../lib/istilah";

/**
 * Tabel siswa satu sekolah. Isinya ringkas — nama lengkap, jenjang pendidikan, nama
 * sekolah, jurusan bila ada, nama orang tua, dan nomor WhatsApp. Siswa yang mendaftar
 * lewat formulir SPMB dan sudah diverifikasi masuk sendiri ke sini dan terisi otomatis.
 */

const SARINGAN = [
  { id: "aktif", label: "Aktif" },
  { id: "lulus", label: "Lulus" },
  { id: "semua", label: "Semua" },
];

/** Ubah nomor menjadi tautan WhatsApp: 0812… → 62812… */
const tautanWa = (nomor: string) => {
  const digit = nomor.replace(/[^0-9]/g, "");
  if (digit.length < 8) return "";
  return `https://wa.me/${digit.startsWith("0") ? `62${digit.slice(1)}` : digit}`;
};

export default function TabelSiswa({ onBerubah }: { onBerubah?: () => void }) {
  const istilah = useIstilah();
  const [siswa, setSiswa] = useState<SiswaUnit[]>([]);
  const [sekolah, setSekolah] = useState<SekolahSiswa>({ nama: "", jenjang: "", jurusan: [], program: [] });
  const [ringkasan, setRingkasan] = useState<RingkasanSiswa | null>(null);
  const [status, setStatus] = useState("aktif");
  const [cari, setCari] = useState("");
  const [kataKunci, setKataKunci] = useState("");
  const [penuh, setPenuh] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [terbuka, setTerbuka] = useState<{ mode: "tambah" } | { mode: "ubah"; siswa: SiswaUnit } | null>(null);

  const muat = useCallback(
    async (lewat = 0) => {
      setMemuat(true);
      try {
        const jawab = await daftarSiswa({ status, cari: kataKunci, batas: 60, lewat });
        setSiswa((lama) => (lewat > 0 ? [...lama, ...jawab.siswa] : jawab.siswa));
        setSekolah(jawab.sekolah);
        setRingkasan(jawab.ringkasan);
        setPenuh(jawab.penuh);
        setGalat(null);
      } catch (e) {
        setGalat(e instanceof Error ? e.message : `Daftar ${istilah.sebutanKecil} belum bisa dimuat.`);
      } finally {
        setMemuat(false);
      }
    },
    [status, kataKunci],
  );

  useEffect(() => {
    void muat();
  }, [muat]);

  /* Pencarian ditahan sesaat supaya tidak meminta data setiap ketukan. */
  useEffect(() => {
    const jeda = setTimeout(() => setKataKunci(cari), 350);
    return () => clearTimeout(jeda);
  }, [cari]);

  const jumlahSaring = status === "semua" ? (ringkasan?.semua ?? 0) : status === "lulus" ? (ringkasan?.lulus ?? 0) : (ringkasan?.aktif ?? 0);

  return (
    <section data-testid="sekolah-siswa" className="mt-4">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <KepalaKartu
          judul={`Daftar ${istilah.sebutanKecil}`}
          keterangan={`${sekolah.jenjang ? `${sekolah.jenjang} · ` : ""}${sekolah.nama || `${istilah.statUnit} ini`}. ${istilah.sebutan} hasil verifikasi pendaftaran ${istilah.penerimaan} masuk sendiri ke daftar ini.`}
          angka={jumlahSaring}
          labelAngka="ditampilkan"
          testidAngka="siswa-jumlah"
          tombol={
            <button
              type="button"
              data-testid="siswa-tambah"
              onClick={() => setTerbuka({ mode: "tambah" })}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 py-2.5 text-[11.5px] font-semibold text-white"
            >
              <Icon name="plus" className="h-[15px] w-[15px]" />
              Tambah {istilah.sebutanKecil}
            </button>
          }
        />

        <div className="mt-2.5 space-y-2">
          <input
            type="search"
            data-testid="siswa-cari"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={`Cari nama ${istilah.sebutanKecil}, orang tua, atau WhatsApp…`}
            className="w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {SARINGAN.map((s) => (
              <button
                key={s.id}
                type="button"
                data-testid={`siswa-saring-${s.id}`}
                onClick={() => setStatus(s.id)}
                className={`rounded-full px-3 py-1.5 text-[10.5px] font-semibold transition ${
                  status === s.id ? "bg-persis-900 text-white" : "border border-black/[0.1] text-persis-900"
                }`}
              >
                {s.label}
                {s.id === "aktif" && ringkasan ? ` (${ringkasan.aktif})` : s.id === "lulus" && ringkasan ? ` (${ringkasan.lulus})` : ""}
              </button>
            ))}
          </div>
        </div>

        {memuat && siswa.length === 0 ? (
          <p className="mt-3 text-[11px] text-ink-400">Memuat daftar {istilah.sebutanKecil}…</p>
        ) : galat ? (
          <p className="mt-3 text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
        ) : siswa.length === 0 ? (
          <p data-testid="siswa-kosong" className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400">
            {kataKunci
              ? `Tidak ada ${istilah.sebutanKecil} yang cocok dengan pencarian.`
              : status === "lulus"
                ? `Belum ada ${istilah.sebutanKecil} yang dinyatakan lulus pada ${istilah.unit} ini.`
                : `Belum ada ${istilah.sebutanKecil} tercatat. Tekan “Tambah ${istilah.sebutanKecil}” untuk mengisi data, atau tunggu pendaftaran ${istilah.penerimaan} yang sudah diverifikasi masuk sendiri ke sini.`}
          </p>
        ) : (
          <>
            <div className="mt-3 overflow-hidden rounded-xl border border-black/[0.07]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-cream-50 text-[9.5px] tracking-[0.08em] text-ink-400 uppercase">
                    <th scope="col" className="px-3 py-2 text-left font-bold">Nama</th>
                    <th scope="col" className="px-2 py-2 text-left font-bold">Orang tua</th>
                    <th scope="col" className="px-2 py-2 text-right font-bold">
                      <span className="sr-only">Buka data {istilah.sebutanKecil}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {siswa.map((s) => {
                    const wa = tautanWa(s.waliTelepon);
                    return (
                      <tr
                        key={s.id}
                        data-testid={`siswa-baris-${s.id}`}
                        onClick={() => setTerbuka({ mode: "ubah", siswa: s })}
                        className="cursor-pointer border-t border-black/[0.05] align-top transition hover:bg-cream-50/70"
                      >
                        <td className="px-3 py-2.5">
                          <span className="block text-[11.5px] leading-snug font-semibold text-ink-900">{s.nama}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9.5px] text-ink-400">
                            <span>
                              {s.jenjang || sekolah.jenjang || "—"} · {s.sekolah || sekolah.nama || "—"}
                            </span>
                            {s.programNama || s.program ? (
                              <span className="rounded-full bg-gold-100 px-2 py-0.5 font-bold text-gold-800">
                                {s.programNama || s.program}
                              </span>
                            ) : null}
                            {s.dariSpmb ? (
                              <span className="rounded-full bg-persis-100 px-2 py-0.5 font-bold text-persis-900">dari SPMB</span>
                            ) : null}
                            {s.status !== "aktif" ? (
                              <span className="rounded-full bg-persis-900 px-2 py-0.5 font-bold text-gold-300">Lulus</span>
                            ) : null}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="block text-[10.5px] leading-snug font-semibold text-ink-700">
                            {s.waliNama || "—"}
                          </span>
                          {wa ? (
                            <a
                              data-testid={`siswa-wa-${s.id}`}
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 inline-flex items-center gap-1 rounded-full bg-persis-50 px-2 py-0.5 text-[9.5px] font-bold text-persis-900"
                            >
                              <Icon name="whatsapp" className="h-[10px] w-[10px]" />
                              {s.waliTelepon}
                            </a>
                          ) : (
                            <span className="text-[9.5px] text-ink-400">Belum ada nomor</span>
                          )}
                          {s.pinWali ? (
                            <span data-testid={`siswa-pin-${s.id}`} className="mt-1 block text-[9.5px] text-ink-500">
                              PIN wali <b className="font-bold text-persis-900">{s.pinWali}</b>
                              {wa ? (
                                <>
                                  {" · "}
                                  <a
                                    href={`${wa}?text=${encodeURIComponent(
                                      `Assalamu'alaikum, berikut PIN ${istilah.portal.toLowerCase()} untuk ${s.nama}: ${s.pinWali}. Masuk di halaman ${istilah.waliKecil} pada situs PC Persis Cibatu.`,
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-semibold text-persis-900 underline"
                                  >
                                    kirim ke wali
                                  </a>
                                </>
                              ) : null}
                            </span>
                          ) : (
                            <span className="mt-1 block text-[9.5px] text-ink-400">PIN wali belum dibuat</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <button
                            type="button"
                            data-testid={`siswa-buka-${s.id}`}
                            aria-label={`Buka data ${s.nama}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTerbuka({ mode: "ubah", siswa: s });
                            }}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-black/[0.09] text-persis-900"
                          >
                            <Icon name="chevron-right" className="h-[15px] w-[15px]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {penuh ? (
              <button
                type="button"
                data-testid="siswa-muat-lagi"
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
        <FormSiswa
          siswa={terbuka.mode === "ubah" ? terbuka.siswa : null}
          sekolah={sekolah}
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
