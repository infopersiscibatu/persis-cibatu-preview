import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import { Kolom, Pesan } from "../../components/admin/Form";
import Lembar from "./Lembar";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { useIstilah } from "../../lib/istilah";
import {
  daftarMapelUnit,
  hapusMapelUnit,
  tambahMapelUnit,
  ubahMapelUnit,
  type MapelUnit,
} from "../../lib/unitNilai";

/**
 * Menu Mata Pelajaran / Mata Kuliah di Admin Sekolah.
 *
 * Di sinilah daftar mata pelajaran pada jenjang unit ini didata: nama, kode, dan
 * kelompoknya (mis. kelompok agama atau umum). Menu Nilai mengambil pilihan dari daftar
 * ini, sehingga nama mata pelajaran selalu seragam. Mata pelajaran yang sudah dipakai
 * pada sebuah nilai tidak dapat dihapus sebelum nilainya dibersihkan.
 */
export default function MataPelajaran() {
  const t = useIstilah();
  const judulMenu = t.materiKecil === "mata kuliah" ? "Mata Kuliah" : "Mata Pelajaran";
  const [daftar, setDaftar] = useState<MapelUnit[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [cari, setCari] = useState("");
  const [borang, setBorang] = useState<{ buka: boolean; sunting: MapelUnit | null }>({
    buka: false,
    sunting: null,
  });
  const [isian, setIsian] = useState({ nama: "", kode: "", kelompok: "" });
  const [sibuk, setSibuk] = useState(false);

  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat(null);
    try {
      const jawab = await daftarMapelUnit();
      setDaftar(jawab.mapel);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : `Daftar ${judulMenu.toLowerCase()} belum bisa dimuat.`);
    } finally {
      setMemuat(false);
    }
  }, [judulMenu]);

  useEffect(() => {
    void muat();
  }, [muat]);

  const bukaBorang = (sunting: MapelUnit | null) => {
    setBorang({ buka: true, sunting });
    setIsian({
      nama: sunting?.nama ?? "",
      kode: sunting?.kode ?? "",
      kelompok: sunting?.kelompok ?? "",
    });
  };

  const simpan = async () => {
    if (isian.nama.trim().length < 2) {
      setGalat("Nama mata pelajaran minimal 2 huruf.");
      return;
    }
    setSibuk(true);
    setGalat(null);
    try {
      const jawab = borang.sunting
        ? await ubahMapelUnit(borang.sunting.id, { ...isian, aktif: borang.sunting.aktif })
        : await tambahMapelUnit(isian);
      setDaftar(jawab.mapel);
      setPesan(jawab.pesan ?? "Data tersimpan.");
      beritahu("sukses", jawab.pesan ?? "Data tersimpan.");
      setBorang({ buka: false, sunting: null });
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Data belum bisa disimpan.");
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async (m: MapelUnit) => {
    const ya = await mintaKonfirmasi(`Hapus ${m.nama} dari daftar ${judulMenu.toLowerCase()}?`, {
      judul: `Hapus ${judulMenu}`,
      labelYa: "Ya, hapus",
    });
    if (!ya) return;
    setSibuk(true);
    setGalat(null);
    try {
      const jawab = await hapusMapelUnit(m.id);
      setDaftar(jawab.mapel);
      setPesan(jawab.pesan ?? "Data dihapus.");
      beritahu("sukses", jawab.pesan ?? "Data dihapus.");
    } catch (e) {
      const teks = e instanceof Error ? e.message : "Data belum bisa dihapus.";
      setGalat(teks);
      beritahu("galat", teks);
    } finally {
      setSibuk(false);
    }
  };

  const disaring = daftar.filter((m) => {
    const kata = cari.trim().toLowerCase();
    if (!kata) return true;
    return m.nama.toLowerCase().includes(kata) || (m.kode ?? "").toLowerCase().includes(kata) || (m.kelompok ?? "").toLowerCase().includes(kata);
  });

  return (
    <div className="space-y-4" data-testid="mapel-page">
      <section className="rounded-2xl border border-black/[0.08] bg-white p-4">
        <KepalaKartu
          judul={judulMenu}
          keterangan={`Daftar ${t.materiKecil} pada jenjang ${t.unit} ini. Isian di menu Nilai mengambil pilihan dari daftar ini, jadi sebaiknya ${t.materiKecil}nya didata lebih dahulu.`}
          tombol={
            <button
              type="button"
              data-testid="mapel-tambah"
              onClick={() => bukaBorang(null)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 py-2.5 text-[11.5px] font-semibold text-white"
            >
              <Icon name="plus" className="h-[15px] w-[15px]" />
              Tambah {t.materiKecil}
            </button>
          }
        />

        {galat ? <Pesan tipe="galat" teks={galat} /> : null}
        {pesan ? <Pesan tipe="sukses" teks={pesan} /> : null}

        <label className="mt-3 block">
          <span className="field-label">Cari {t.materiKecil}</span>
          <input
            type="text"
            data-testid="mapel-cari"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={`Nama, kode, atau kelompok ${t.materiKecil}`}
            className="w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2.5 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40"
          />
        </label>

        {memuat ? (
          <p className="mt-3 text-[11.5px] text-ink-600">Memuat daftar {judulMenu.toLowerCase()}…</p>
        ) : disaring.length === 0 ? (
          <p data-testid="mapel-kosong" className="mt-3 border-t border-black/[0.06] pt-3 text-justify text-[11px] leading-relaxed text-ink-600">
            {daftar.length === 0
              ? `Belum ada ${t.materiKecil} yang terdaftar. Tekan Tambah untuk mendata ${t.materiKecil} pertama.`
              : `Tidak ada ${t.materiKecil} yang cocok dengan pencarian.`}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-black/[0.06] border-t border-black/[0.06]">
            {disaring.map((m) => (
              <li key={m.id} data-testid={`mapel-baris-${m.id}`} className="flex items-start justify-between gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-ink-900">{m.nama}</span>
                  <span className="mt-0.5 block text-[10.5px] text-persis-900">
                    {[m.kode ? `Kode ${m.kode}` : "", m.kelompok || "", m.aktif ? "" : "nonaktif"]
                      .filter(Boolean)
                      .join(" · ") || "tanpa kode"}
                  </span>
                  <span className="mt-1 inline-block rounded-full bg-cream-100 px-2 py-0.5 text-[9.5px] font-bold text-persis-900">
                    {m.jumlahNilai > 0
                      ? `dipakai ${m.jumlahNilai} nilai (${m.jumlahTerbit} terbit)`
                      : "belum dipakai pada nilai"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    data-testid={`mapel-ubah-${m.id}`}
                    onClick={() => bukaBorang(m)}
                    aria-label={`Ubah ${m.nama}`}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-black/[0.10] text-ink-600"
                  >
                    <Icon name="pencil" className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    data-testid={`mapel-hapus-${m.id}`}
                    onClick={() => void hapus(m)}
                    aria-label={`Hapus ${m.nama}`}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 text-rose-600"
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 border-t border-black/[0.06] pt-3 text-justify text-[10.5px] leading-relaxed text-ink-600">
          {daftar.length} {t.materiKecil} terdaftar pada jenjang ini. Mata pelajaran yang sudah dipakai pada sebuah
          nilai tidak dapat dihapus — hapus nilai itu lebih dahulu pada menu Nilai.
        </p>
      </section>

      {borang.buka ? (
        <Lembar
          testid="mapel-borang"
          judul={borang.sunting ? `Ubah ${borang.sunting.nama}` : `Tambah ${judulMenu}`}
          keterangan={`${judulMenu} ini langsung tersedia sebagai pilihan pada menu Nilai untuk jenjang ${t.unit} ini.`}
          onTutup={() => setBorang({ buka: false, sunting: null })}
          aksi={
            <button
              type="button"
              data-testid="mapel-simpan"
              disabled={sibuk}
              onClick={() => void simpan()}
              className="rounded-full bg-persis-900 px-4 py-2.5 text-[11.5px] font-bold text-white disabled:opacity-50"
            >
              {sibuk ? "Menyimpan…" : "Simpan"}
            </button>
          }
        >
          <div className="space-y-3">
            <Kolom
              label={`Nama ${t.materiKecil}`}
              nilai={isian.nama}
              testid="mapel-nama"
              placeholder="mis. Fikih"
              onUbah={(v) => setIsian((b) => ({ ...b, nama: v }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Kolom
                label="Kode (opsional)"
                nilai={isian.kode}
                testid="mapel-kode"
                placeholder="mis. FQ-01"
                onUbah={(v) => setIsian((b) => ({ ...b, kode: v }))}
              />
              <Kolom
                label="Kelompok (opsional)"
                nilai={isian.kelompok}
                testid="mapel-kelompok"
                placeholder="mis. Agama"
                onUbah={(v) => setIsian((b) => ({ ...b, kelompok: v }))}
              />
            </div>
            <p className="text-justify text-[10px] leading-relaxed text-ink-600">
              Kelompok dipakai untuk mengurutkan daftar, misalnya Agama, Bahasa, atau Umum.
            </p>
          </div>
        </Lembar>
      ) : null}
    </div>
  );
}
