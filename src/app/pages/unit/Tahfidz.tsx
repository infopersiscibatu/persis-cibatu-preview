import { useState } from "react";
import { Icon } from "../../components/Icons";
import { Angka, Kolom, Pesan, Pilih, Tanggal } from "../../components/admin/Form";
import PemilihPeserta, { KartuPeserta } from "../../components/unit/PemilihPeserta";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { useIstilah } from "../../lib/istilah";
import { labelSetoran, opsiSurah, surah } from "../../data/quran";
import type { SiswaUnit } from "../../lib/unitSekolah";
import {
  ambilNilaiSiswa,
  hapusSetoranTahfidz,
  tambahSetoranTahfidz,
  terbitkanTahfidzUnit,
  type MuatanNilai,
} from "../../lib/unitNilai";

/**
 * Menu Tahfidz di Admin Sekolah.
 *
 * Berisi catatan setoran hafalan peserta didik: surat Al-Qur'an, rentang ayat, jenis
 * setoran, penilai, dan nilainya. Sama seperti menu Nilai, isian disimpan sebagai
 * rancangan lebih dulu dan baru tampil di portal wali — beserta notifikasi ke HP wali —
 * setelah ditekan Terbitkan.
 */

const JENIS_SETORAN = ["Setoran Baru", "Murojaah", "Ujian Juz", "Tasmi'"];
const NILAI_SETORAN = ["Mumtaz", "Jayyid Jiddan", "Jayyid", "Perlu Diulang"];

export default function Tahfidz() {
  const t = useIstilah();
  const [pilih, setPilih] = useState<SiswaUnit | null>(null);
  const [muatan, setMuatan] = useState<MuatanNilai | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [setoran, setSetoran] = useState({
    tanggal: "",
    surah: "",
    ayatMulai: "",
    ayatSelesai: "",
    jenis: JENIS_SETORAN[0],
    penilai: "",
    nilai: NILAI_SETORAN[0],
    catatan: "",
  });

  const pakaiMuatan = (jawab: MuatanNilai) => setMuatan(jawab);

  const bukaSiswa = async (s: SiswaUnit) => {
    setPilih(s);
    setMuatan(null);
    setPesan(null);
    setGalat(null);
    setMemuat(true);
    try {
      pakaiMuatan(await ambilNilaiSiswa(s.id));
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Data tahfidz belum bisa dimuat.");
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

  /* Berapa ayat yang disetor pada isian yang sedang diisi, untuk ditampilkan di borang. */
  const suratDipilih = surah(Number(setoran.surah));
  const ayatMulai = Number.parseInt(setoran.ayatMulai, 10);
  const ayatSelesai = Number.parseInt(setoran.ayatSelesai || setoran.ayatMulai, 10);
  const ayatDisetor =
    suratDipilih &&
    Number.isFinite(ayatMulai) &&
    Number.isFinite(ayatSelesai) &&
    ayatMulai >= 1 &&
    ayatSelesai >= ayatMulai &&
    ayatSelesai <= suratDipilih.ayat
      ? ayatSelesai - ayatMulai + 1
      : 0;

  const simpanSetoran = async () => {
    if (!pilih) return;
    if (!suratDipilih) {
      setGalat("Surat Al-Qur'an belum dipilih.");
      return;
    }
    if (!Number.isFinite(ayatMulai) || ayatMulai < 1) {
      setGalat("Ayat awal setoran belum diisi.");
      return;
    }
    if (ayatMulai > suratDipilih.ayat) {
      setGalat(`Surat ${suratDipilih.nama} hanya ${suratDipilih.ayat} ayat.`);
      return;
    }
    if (!Number.isFinite(ayatSelesai) || ayatSelesai < ayatMulai) {
      setGalat("Ayat akhir harus sama atau setelah ayat awal.");
      return;
    }
    if (ayatSelesai > suratDipilih.ayat) {
      setGalat(`Ayat akhir melebihi jumlah ayat surat ${suratDipilih.nama} (${suratDipilih.ayat} ayat).`);
      return;
    }

    await jalankan(
      () =>
        tambahSetoranTahfidz({
          santriId: pilih.id,
          tanggal: setoran.tanggal,
          surah: suratDipilih.nomor,
          ayatMulai,
          ayatSelesai,
          materi: labelSetoran(suratDipilih.nomor, ayatMulai, ayatSelesai),
          jenis: setoran.jenis,
          penilai: setoran.penilai,
          nilai: setoran.nilai,
          catatan: setoran.catatan,
        }),
      () => setSetoran((b) => ({ ...b, ayatMulai: "", ayatSelesai: "", catatan: "", tanggal: "" })),
    );
  };

  const hapusSetoran = async (id: string, materi: string) => {
    const ya = await mintaKonfirmasi(`Hapus setoran "${materi}"?`, {
      judul: "Hapus setoran tahfidz",
      labelYa: "Ya, hapus",
    });
    if (!ya) return;
    await jalankan(() => hapusSetoranTahfidz(id));
  };

  const terbitkan = async () => {
    if (!pilih) return;
    const ya = await mintaKonfirmasi(
      `Terbitkan catatan tahfidz ${pilih.nama}? Catatannya langsung tampil di portal wali dan notifikasi dikirim ke HP wali yang terdaftar.`,
      { judul: "Terbitkan tahfidz ke portal wali", nada: "tanya", labelYa: "Ya, terbitkan" },
    );
    if (!ya) return;
    setSibuk(true);
    setGalat(null);
    setPesan(null);
    try {
      const jawab = await terbitkanTahfidzUnit(pilih.id);
      pakaiMuatan(jawab);
      setPesan(jawab.pesan ?? null);
      if ((jawab.jumlah ?? 0) > 0) beritahu("sukses", jawab.pesan ?? "Catatan tahfidz sudah diterbitkan.");
      else beritahu("galat", "Tidak ada catatan tahfidz baru untuk diterbitkan.");
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Penerbitan gagal.");
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="tahfidz-page">
      <PemilihPeserta
        pilih={pilih}
        onPilih={(s) => void bukaSiswa(s)}
        testid="tahfidz-pemilih"
        keterangan={`Cari nama ${t.sebutanKecil} atau nama walinya, lalu pilih satu untuk mencatat setoran hafalan — surat, ayat yang disetor, dan penilaiannya.`}
      />

      {!pilih ? <KartuPeserta siswa={null} /> : null}

      {pilih && memuat ? (
        <section className="rounded-2xl border border-black/[0.08] bg-white p-4">
          <p className="text-[11.5px] text-ink-600">Memuat catatan tahfidz {pilih.nama}…</p>
        </section>
      ) : null}

      {pilih && !memuat && muatan ? (
        <>
          <KartuPeserta
            siswa={pilih}
            kanan={`${muatan.ringkas.tahfidz.setoran} setoran · ${muatan.ringkas.tahfidz.menunggu} belum terbit`}
          />

          {galat ? <Pesan tipe="galat" teks={galat} /> : null}
          {pesan ? <Pesan tipe="sukses" teks={pesan} /> : null}

          <section className="rounded-2xl border border-black/[0.08] bg-white p-4" data-testid="tahfidz-setoran">
            <h2 className="font-header text-[13.5px] font-bold text-ink-900">Catatan setoran hafalan</h2>
            <p className="mt-0.5 text-justify text-[11px] leading-relaxed text-ink-600">
              Setiap setoran yang dicatat di sini muncul di portal wali sebagai riwayat setoran tahfidz.
            </p>

            {muatan.tahfidz.setoran.length > 0 ? (
              <ul className="mt-3 divide-y divide-black/[0.06] border-t border-black/[0.06]">
                {muatan.tahfidz.setoran.map((s) => (
                  <li
                    key={s.id}
                    data-testid={`tahfidz-baris-${s.id}`}
                    className="flex items-start justify-between gap-3 py-2.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold text-ink-900">{s.materi}</span>
                      <span className="mt-0.5 block text-[10.5px] text-persis-900">
                        {[s.jenis, s.jumlahAyat ? `${s.jumlahAyat} ayat` : "", s.tanggal ?? "", s.penilai]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                          s.terbit ? "bg-mint-deep text-persis-800" : "bg-pastelgold text-gold-700"
                        }`}
                      >
                        {s.terbit ? "Sudah terbit" : "Belum terbit"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      {s.nilai ? (
                        <span className="block text-[10.5px] font-semibold text-persis-900">{s.nilai}</span>
                      ) : null}
                      <button
                        type="button"
                        data-testid={`tahfidz-hapus-${s.id}`}
                        onClick={() => void hapusSetoran(s.id, s.materi)}
                        aria-label={`Hapus setoran ${s.materi}`}
                        className="mt-1 grid h-7 w-7 place-items-center rounded-lg border border-rose-200 text-rose-600"
                      >
                        <Icon name="trash" className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                data-testid="tahfidz-baris-kosong"
                className="mt-3 border-t border-black/[0.06] pt-3 text-justify text-[11px] leading-relaxed text-ink-600"
              >
                Belum ada catatan setoran hafalan untuk {t.sebutanKecil} ini.
              </p>
            )}

            <div className="mt-4 space-y-3 border-t border-black/[0.06] pt-3.5">
              <p className="text-[10px] font-bold tracking-[0.12em] text-persis-900 uppercase">Catat setoran</p>
              <Pilih
                label="Surat Al-Qur'an"
                nilai={setoran.surah}
                testid="tahfidz-surah"
                placeholder="— pilih surat —"
                opsi={opsiSurah}
                petunjuk={`Daftar 114 surat beserta jumlah ayatnya${suratDipilih ? ` — surat ${suratDipilih.nama} ${suratDipilih.ayat} ayat` : ""}.`}
                onUbah={(v) => setSetoran((b) => ({ ...b, surah: v }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Angka
                  label="Ayat mulai"
                  nilai={setoran.ayatMulai}
                  testid="tahfidz-ayat-mulai"
                  placeholder="1"
                  onUbah={(v) => setSetoran((b) => ({ ...b, ayatMulai: v }))}
                />
                <Angka
                  label="Ayat sampai"
                  nilai={setoran.ayatSelesai}
                  testid="tahfidz-ayat-selesai"
                  placeholder="kosong = satu ayat"
                  onUbah={(v) => setSetoran((b) => ({ ...b, ayatSelesai: v }))}
                />
              </div>
              <p
                data-testid="tahfidz-jumlah-ayat"
                className="rounded-xl border border-persis-900/20 bg-persis-100/60 px-3 py-2 text-[11px] leading-relaxed text-persis-900"
              >
                {ayatDisetor > 0
                  ? `Yang disetor: ${ayatDisetor} ayat — ${labelSetoran(suratDipilih?.nomor ?? null, ayatMulai, ayatSelesai)}.`
                  : "Pilih surat, lalu isi ayat mulai dan ayat sampai. Bila ayat sampai dikosongkan, yang dicatat satu ayat."}
              </p>
              <Tanggal
                label="Tanggal"
                nilai={setoran.tanggal}
                testid="tahfidz-tanggal"
                onUbah={(v) => setSetoran((b) => ({ ...b, tanggal: v }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Pilih
                  label="Jenis setoran"
                  nilai={setoran.jenis}
                  testid="tahfidz-jenis"
                  opsi={JENIS_SETORAN.map((j) => ({ nilai: j, label: j }))}
                  onUbah={(v) => setSetoran((b) => ({ ...b, jenis: v }))}
                />
                <Pilih
                  label="Penilaian"
                  nilai={setoran.nilai}
                  testid="tahfidz-nilai"
                  opsi={NILAI_SETORAN.map((j) => ({ nilai: j, label: j }))}
                  onUbah={(v) => setSetoran((b) => ({ ...b, nilai: v }))}
                />
              </div>
              <Kolom
                label="Penilai / pembimbing"
                nilai={setoran.penilai}
                testid="tahfidz-penilai"
                placeholder="Nama penilai"
                onUbah={(v) => setSetoran((b) => ({ ...b, penilai: v }))}
              />
              <Kolom
                label="Catatan (opsional)"
                nilai={setoran.catatan}
                testid="tahfidz-catatan"
                placeholder="mis. tajwid perlu diperbaiki pada ayat 150"
                onUbah={(v) => setSetoran((b) => ({ ...b, catatan: v }))}
              />
              <button
                type="button"
                data-testid="tahfidz-simpan-setoran"
                disabled={sibuk}
                onClick={() => void simpanSetoran()}
                className="w-full rounded-full bg-persis-900 py-2.5 text-[11.5px] font-bold text-white disabled:opacity-50"
              >
                {sibuk ? "Menyimpan…" : "Simpan setoran"}
              </button>
            </div>

            <div className="mt-4 border-t border-black/[0.06] pt-3.5">
              <button
                type="button"
                data-testid="tahfidz-terbit"
                disabled={sibuk || muatan.ringkas.tahfidz.menunggu === 0}
                onClick={() => void terbitkan()}
                className="w-full rounded-full border border-persis-800/25 bg-mint-deep py-2.5 text-[11.5px] font-bold text-persis-900 disabled:opacity-50"
              >
                Terbitkan catatan setoran
              </button>
              <p className="mt-2 text-justify text-[10px] leading-relaxed text-ink-600">
                Notifikasi setoran tahfidz dikirim ke HP wali yang terdaftar beserta nama lengkap {t.sebutanKecil}nya
                begitu catatannya diterbitkan.
              </p>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
