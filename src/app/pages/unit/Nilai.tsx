import { useState } from "react";
import { Icon } from "../../components/Icons";
import { Angka, Kolom, Pesan, Pilih } from "../../components/admin/Form";
import PemilihPeserta, { KartuPeserta } from "../../components/unit/PemilihPeserta";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { useIstilah } from "../../lib/istilah";
import type { SiswaUnit } from "../../lib/unitSekolah";
import {
  ambilNilaiSiswa,
  hapusNilaiUnit,
  simpanNilaiUnit,
  terbitkanNilaiUnit,
  ubahNilaiUnit,
  type MuatanNilai,
  type NilaiUnit,
} from "../../lib/unitNilai";

/**
 * Menu Nilai di Admin Sekolah.
 *
 * Petugas memilih siswa/mahasiswa, mengisi nilainya per mata pelajaran yang sudah
 * terdaftar pada menu Mata Pelajaran, lalu menekan Terbitkan. Selama belum diterbitkan,
 * isian itu hanya terlihat di halaman ini; setelah diterbitkan barisnya tampil di portal
 * wali dan notifikasi push dikirim ke HP wali yang terikat pada peserta tersebut.
 */
export default function Nilai({ onBukaMenu }: { onBukaMenu?: (id: string) => void }) {
  const t = useIstilah();
  const [pilih, setPilih] = useState<SiswaUnit | null>(null);
  const [muatan, setMuatan] = useState<MuatanNilai | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [sunting, setSunting] = useState<NilaiUnit | null>(null);
  const [baris, setBaris] = useState({ mapelId: "", nilai: "", predikat: "", semester: "" });

  const pakaiMuatan = (jawab: MuatanNilai) => setMuatan(jawab);

  const bukaSiswa = async (s: SiswaUnit) => {
    setPilih(s);
    setMuatan(null);
    setPesan(null);
    setGalat(null);
    setSunting(null);
    setMemuat(true);
    try {
      const jawab = await ambilNilaiSiswa(s.id);
      pakaiMuatan(jawab);
      setBaris({
        mapelId: jawab.mapel[0]?.id ?? "",
        nilai: "",
        predikat: "",
        semester: jawab.semesterBerjalan ?? "",
      });
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Data nilai belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  };

  const jalankan = async (kerja: () => Promise<MuatanNilai>, sesudah?: () => void) => {
    setSibuk(true);
    setGalat(null);
    setPesan(null);
    try {
      const jawab = await kerja();
      pakaiMuatan(jawab);
      setPesan(jawab.pesan ?? null);
      sesudah?.();
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Perubahan belum bisa disimpan.");
    } finally {
      setSibuk(false);
    }
  };

  const simpan = async () => {
    if (!pilih) return;
    if (!baris.nilai.trim()) {
      setGalat("Nilai belum diisi.");
      return;
    }
    if (!sunting && !baris.mapelId) {
      setGalat(`Pilih dulu ${t.materiKecil}nya.`);
      return;
    }
    await jalankan(
      () =>
        sunting
          ? ubahNilaiUnit(sunting.id, { nilai: baris.nilai, predikat: baris.predikat, semester: baris.semester })
          : simpanNilaiUnit({
              santriId: pilih.id,
              mapelId: baris.mapelId,
              nilai: baris.nilai,
              predikat: baris.predikat,
              semester: baris.semester,
            }),
      () => {
        setSunting(null);
        setBaris((b) => ({ mapelId: b.mapelId, nilai: "", predikat: "", semester: b.semester }));
      },
    );
  };

  const mulaiSunting = (n: NilaiUnit) => {
    setSunting(n);
    setBaris({ mapelId: n.mapelId, nilai: String(n.nilai), predikat: n.predikat, semester: n.semester });
  };

  const hapus = async (n: NilaiUnit) => {
    const ya = await mintaKonfirmasi(`Hapus nilai ${n.mapel}?`, { judul: "Hapus nilai", labelYa: "Ya, hapus" });
    if (!ya) return;
    await jalankan(() => hapusNilaiUnit(n.id), () => setSunting(null));
  };

  const terbitkan = async () => {
    if (!pilih) return;
    const ya = await mintaKonfirmasi(
      `Terbitkan nilai ${pilih.nama}? Nilainya langsung tampil di portal wali dan notifikasi dikirim ke HP wali yang terdaftar.`,
      { judul: "Terbitkan nilai ke portal wali", nada: "tanya", labelYa: "Ya, terbitkan" },
    );
    if (!ya) return;
    setSibuk(true);
    setGalat(null);
    setPesan(null);
    try {
      const jawab = await terbitkanNilaiUnit(pilih.id);
      pakaiMuatan(jawab);
      setPesan(jawab.pesan ?? null);
      if ((jawab.jumlah ?? 0) > 0) beritahu("sukses", jawab.pesan ?? "Nilai sudah diterbitkan.");
      else beritahu("galat", "Tidak ada nilai baru untuk diterbitkan.");
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Penerbitan gagal.");
    } finally {
      setSibuk(false);
    }
  };

  const opsiMapel = (muatan?.mapel ?? []).map((m) => ({ nilai: m.id, label: m.nama }));
  const adaMapel = opsiMapel.length > 0;

  return (
    <div className="space-y-4" data-testid="nilai-page">
      <PemilihPeserta
        pilih={pilih}
        onPilih={(s) => void bukaSiswa(s)}
        testid="nilai-pemilih"
        keterangan={`Cari nama ${t.sebutanKecil} atau nama walinya, lalu pilih satu untuk mengisi nilai ${t.materiKecil}nya.`}
      />

      {!pilih ? <KartuPeserta siswa={null} /> : null}

      {pilih && memuat ? (
        <section className="rounded-2xl border border-black/[0.08] bg-white p-4">
          <p className="text-[11.5px] text-ink-600">Memuat nilai {pilih.nama}…</p>
        </section>
      ) : null}

      {pilih && !memuat && muatan ? (
        <>
          <KartuPeserta siswa={pilih} kanan={`${muatan.ringkas.nilai.terbit} nilai terbit`} />

          {galat ? <Pesan tipe="galat" teks={galat} /> : null}
          {pesan ? <Pesan tipe="sukses" teks={pesan} /> : null}

          <section className="rounded-2xl border border-black/[0.08] bg-white p-4" data-testid="nilai-kartu">
            <h2 className="font-header text-[13.5px] font-bold text-ink-900">Nilai {t.materi.toLowerCase()}</h2>
            <p className="mt-0.5 text-justify text-[11px] leading-relaxed text-ink-600">
              {muatan.ringkas.nilai.menunggu > 0
                ? `${muatan.ringkas.nilai.menunggu} nilai belum diterbitkan — belum terlihat wali.`
                : muatan.nilai.length > 0
                  ? "Semua nilai yang tersimpan sudah diterbitkan."
                  : `Belum ada nilai tersimpan untuk ${t.sebutanKecil} ini.`}
            </p>

            {muatan.nilai.length > 0 ? (
              <ul className="mt-3 divide-y divide-black/[0.06] border-t border-black/[0.06]">
                {muatan.nilai.map((n) => (
                  <li
                    key={n.id}
                    data-testid={`nilai-baris-${n.id}`}
                    className="flex items-start justify-between gap-3 py-2.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold text-ink-900">{n.mapel}</span>
                      <span className="mt-0.5 block text-[10.5px] text-persis-900">
                        {[n.predikat ? `Predikat ${n.predikat}` : "", n.semester || "tanpa semester"]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                          n.terbit ? "bg-mint-deep text-persis-800" : "bg-pastelgold text-gold-700"
                        }`}
                      >
                        {n.terbit ? "Sudah terbit" : "Belum terbit"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="font-header block text-[14px] font-extrabold text-ink-900">
                        {n.nilai.toLocaleString("id-ID")}
                      </span>
                      <span className="mt-1 flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          data-testid={`nilai-ubah-${n.id}`}
                          onClick={() => mulaiSunting(n)}
                          aria-label={`Ubah nilai ${n.mapel}`}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-black/[0.10] text-ink-600"
                        >
                          <Icon name="pencil" className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          data-testid={`nilai-hapus-${n.id}`}
                          onClick={() => void hapus(n)}
                          aria-label={`Hapus nilai ${n.mapel}`}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-rose-200 text-rose-600"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                data-testid="nilai-baris-kosong"
                className="mt-3 border-t border-black/[0.06] pt-3 text-justify text-[11px] leading-relaxed text-ink-600"
              >
                Belum ada nilai tersimpan untuk {t.sebutanKecil} ini.
              </p>
            )}

            {!adaMapel ? (
              <div data-testid="nilai-tanpa-mapel" className="mt-4 border-t border-black/[0.06] pt-3.5">
                <p className="text-justify text-[11px] leading-relaxed text-persis-900">
                  Belum ada {t.materiKecil} yang terdaftar pada jenjang ini. Data {t.materiKecil}nya diisi lebih
                  dahulu pada menu {t.materiKecil === "mata kuliah" ? "Mata Kuliah" : "Mata Pelajaran"}, lalu di sini
                  tinggal dipilih.
                </p>
                {onBukaMenu ? (
                  <button
                    type="button"
                    data-testid="nilai-buka-mapel"
                    onClick={() => onBukaMenu("mapel")}
                    className="mt-3 w-full rounded-full bg-persis-900 py-2.5 text-[11.5px] font-bold text-white"
                  >
                    Buka menu {t.materiKecil === "mata kuliah" ? "Mata Kuliah" : "Mata Pelajaran"}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 space-y-3 border-t border-black/[0.06] pt-3.5">
                <p className="text-[10px] font-bold tracking-[0.12em] text-persis-900 uppercase">
                  {sunting ? `Ubah nilai ${sunting.mapel}` : `Tambah nilai ${t.materiKecil}`}
                </p>

                {!sunting ? (
                  <Pilih
                    label={t.materi}
                    nilai={baris.mapelId}
                    testid="nilai-pilih-mapel"
                    placeholder={`— pilih ${t.materiKecil} —`}
                    opsi={opsiMapel}
                    petunjuk={`Daftar ini berasal dari menu ${t.materiKecil === "mata kuliah" ? "Mata Kuliah" : "Mata Pelajaran"}.`}
                    onUbah={(v) => setBaris((b) => ({ ...b, mapelId: v }))}
                  />
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <Angka
                    label="Nilai (0–100)"
                    nilai={baris.nilai}
                    testid="nilai-angka"
                    placeholder="88"
                    onUbah={(v) => setBaris((b) => ({ ...b, nilai: v }))}
                  />
                  <Kolom
                    label="Predikat (opsional)"
                    nilai={baris.predikat}
                    testid="nilai-predikat"
                    placeholder="otomatis"
                    onUbah={(v) => setBaris((b) => ({ ...b, predikat: v }))}
                  />
                </div>
                <Kolom
                  label={`${t.tahunAkademik} / semester`}
                  nilai={baris.semester}
                  testid="nilai-semester"
                  placeholder="Ganjil 1447 H"
                  onUbah={(v) => setBaris((b) => ({ ...b, semester: v }))}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    data-testid="nilai-simpan"
                    disabled={sibuk}
                    onClick={() => void simpan()}
                    className="flex-1 rounded-full bg-persis-900 py-2.5 text-[11.5px] font-bold text-white disabled:opacity-50"
                  >
                    {sibuk ? "Menyimpan…" : sunting ? "Simpan perubahan" : "Simpan nilai"}
                  </button>
                  {sunting ? (
                    <button
                      type="button"
                      data-testid="nilai-batal"
                      onClick={() => {
                        setSunting(null);
                        setBaris((b) => ({ ...b, nilai: "", predikat: "" }));
                      }}
                      className="rounded-full border border-black/[0.12] px-4 py-2.5 text-[11.5px] font-semibold text-ink-600"
                    >
                      Batal
                    </button>
                  ) : null}
                </div>
              </div>
            )}

            <div className="mt-4 border-t border-black/[0.06] pt-3.5">
              <button
                type="button"
                data-testid="nilai-terbit"
                disabled={sibuk || muatan.ringkas.nilai.menunggu === 0}
                onClick={() => void terbitkan()}
                className="w-full rounded-full border border-persis-800/25 bg-mint-deep py-2.5 text-[11.5px] font-bold text-persis-900 disabled:opacity-50"
              >
                Terbitkan {muatan.ringkas.nilai.menunggu > 0 ? `${muatan.ringkas.nilai.menunggu} nilai` : "nilai"}
              </button>
              <p className="mt-2 text-justify text-[10px] leading-relaxed text-ink-600">
                Notifikasi nilai dikirim ke HP wali yang terdaftar beserta nama lengkap {t.sebutanKecil}nya begitu
                nilainya diterbitkan.
              </p>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
