import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaTeks,
  KepalaBorang,
  Kolom,
  Pesan,
  Pilih,
  Sakelar,
  Tanggal,
  TombolIkon,
  TombolSimpan,
} from "../../components/admin/Form";
import { Icon } from "../../components/Icons";
import { gambar } from "../../data/content";
import { segarkanArtikel, useArtikel, type ArtikelTampil } from "../../lib/artikel";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { pakaiSimpan } from "../../lib/panelSimpan";
import { tanggalPendek } from "../../lib/format";
import {
  hapusArtikel,
  hapusKategoriArtikel,
  simpanGambarArtikel,
  simpanHalamanArtikel,
  tambahArtikel,
  tambahKategoriArtikel,
  ubahArtikel,
  ubahKategoriArtikel,
  unggahBerkas,
  urutKategoriArtikel,
} from "../../lib/admin";

/** Pindahkan satu baris pada daftar. */
function geserBaris<T>(daftar: T[], i: number, arah: -1 | 1): T[] {
  const j = i + arah;
  if (j < 0 || j >= daftar.length) return daftar;
  const salinan = [...daftar];
  [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
  return salinan;
}

function hariIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ------------------------------ teks halaman ------------------------------ */

export function TeksHalamanArtikel() {
  const data = useArtikel();
  const { sibuk, pesan, jalankan } = pakaiSimpan(segarkanArtikel);
  const [nilai, setNilai] = useState({ judul: data.halaman.judul, pengantar: data.halaman.pengantar });
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setNilai({ judul: data.halaman.judul, pengantar: data.halaman.pengantar });
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.halaman.judul, data.halaman.pengantar]);

  const ubah = (kunci: "judul" | "pengantar", isi: string) => {
    setKotor(true);
    setNilai((v) => ({ ...v, [kunci]: isi }));
  };

  return (
    <div data-testid="admin-artikel-teks">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <Kolom
          testid="artikel-judul-halaman"
          label="Judul halaman"
          nilai={nilai.judul}
          onUbah={(v) => ubah("judul", v)}
          placeholder="Artikel"
        />
        <AreaTeks
          testid="artikel-pengantar"
          label="Kalimat pengantar"
          nilai={nilai.pengantar}
          onUbah={(v) => ubah("pengantar", v)}
          baris={6}
        />
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-artikel-teks"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanHalamanArtikel(nilai);
              setKotor(false);
            }, "Teks halaman artikel tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ----------------------------- gambar halaman ----------------------------- */

export function GambarHalamanArtikel() {
  const data = useArtikel();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanArtikel);
  const [alt, setAlt] = useState(data.gambar.alt);
  const [terisi, setTerisi] = useState(false);
  const berkasRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setAlt(data.gambar.alt);
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.gambar.alt]);

  const pilihBerkas = async (berkas: File | undefined) => {
    if (!berkas) return;
    if (berkas.size > 25 * 1024 * 1024) {
      setPesan({ tipe: "galat", teks: "Berkas terlalu besar. Batas maksimal 25 MB." });
      return;
    }
    await jalankan(async () => {
      const hasil = await unggahBerkas(berkas, "artikel");
      await simpanGambarArtikel({ gambar_url: hasil.url, gambar_alt: alt });
    }, "Gambar halaman artikel tersimpan dan langsung dipakai.");
  };

  return (
    <div data-testid="admin-artikel-gambar">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <div className="overflow-hidden rounded-2xl border border-black/[0.08]">
          <img src={data.gambar.url || gambar.berdiskusi} alt="" className="h-[168px] w-full object-cover" />
        </div>
        <p className="mt-2.5 text-[10px] break-all text-ink-400">{data.gambar.url || gambar.berdiskusi}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="pilih-gambar-artikel"
            disabled={sibuk}
            onClick={() => berkasRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-persis-900 px-3.5 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            <Icon name="image" className="h-[15px] w-[15px]" />
            {sibuk ? "Mengunggah…" : "Ganti gambar"}
          </button>
          <button
            type="button"
            data-testid="gambar-artikel-bawaan"
            disabled={sibuk}
            onClick={() =>
              void jalankan(
                () => simpanGambarArtikel({ gambar_url: gambar.berdiskusi, gambar_alt: alt }),
                "Gambar bawaan dipakai kembali.",
              )
            }
            className="rounded-full border border-black/[0.12] px-3.5 py-2 text-[11.5px] font-semibold text-persis-900 transition active:scale-[0.98] disabled:opacity-50"
          >
            Pakai gambar bawaan
          </button>
        </div>

        <input
          ref={berkasRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          data-testid="berkas-gambar-artikel"
          onChange={(e) => {
            void pilihBerkas(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="mt-4 space-y-3">
          <Kolom
            testid="isian-artikel-gambar-alt"
            label="Keterangan gambar (alt)"
            nilai={alt}
            onUbah={setAlt}
            petunjuk="Dipakai pembaca layar dan saat gambar gagal dimuat."
          />
          <TombolSimpan
            testid="simpan-artikel-gambar-alt"
            sibuk={sibuk}
            label="Simpan keterangan"
            onClick={() =>
              void jalankan(() => simpanGambarArtikel({ gambar_alt: alt }), "Keterangan gambar tersimpan.")
            }
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- kategori -------------------------------- */

type BarisKategori = { id?: string; nama: string; aktif: boolean; jumlah?: number };

export function KategoriArtikel() {
  const data = useArtikel();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanArtikel);
  const [baris, setBaris] = useState<BarisKategori[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setBaris(data.kategori.map((k) => ({ id: k.id, nama: k.nama, aktif: k.aktif, jumlah: k.jumlah })));
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.kategori]);

  const isi = (i: number, sebagian: Partial<BarisKategori>) => {
    setKotor(true);
    setBaris((s) => s.map((r, k) => (k === i ? { ...r, ...sebagian } : r)));
  };

  const simpanSemua = async () => {
    const dikenal = new Set(baris.filter((b) => b.id).map((b) => b.id as string));
    const urut: string[] = [];
    const hasil: BarisKategori[] = [];

    for (const b of baris) {
      if (!b.nama.trim()) {
        hasil.push(b);
        continue;
      }
      const muatan = { nama: b.nama.trim(), aktif: b.aktif };
      if (b.id) {
        await ubahKategoriArtikel(b.id, muatan);
        urut.push(b.id);
        hasil.push({ ...b, ...muatan });
      } else {
        const jawab = (await tambahKategoriArtikel({ nama: muatan.nama })) as { kategori?: { id: string }[] };
        const baru = (jawab.kategori ?? []).find((k) => !dikenal.has(k.id));
        if (baru) {
          dikenal.add(baru.id);
          urut.push(baru.id);
          hasil.push({ ...b, ...muatan, id: baru.id, jumlah: 0 });
        } else {
          hasil.push({ ...b, ...muatan });
        }
      }
    }

    if (urut.length > 0) await urutKategoriArtikel(urut);
    setBaris(hasil);
  };

  const hapus = async (i: number) => {
    const b = baris[i];
    if (!b.id) {
      setBaris((s) => s.filter((_, k) => k !== i));
      setKotor(true);
      return;
    }
    const setuju = await mintaKonfirmasi(
      `Hapus kategori ${b.nama || "ini"} dari daftar artikel? Kategori yang masih dipakai artikel tidak akan terhapus.`,
      { labelYa: "Ya, hapus kategori" },
    );
    if (!setuju) return;
    try {
      await hapusKategoriArtikel(b.id);
      await segarkanArtikel();
      setBaris((s) => s.filter((_, k) => k !== i));
      beritahu("sukses", `${b.nama || "Kategori"} dihapus.`);
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  return (
    <div data-testid="admin-artikel-kategori">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {baris.map((b, i) => (
          <div
            key={b.id ?? `baru-${i}`}
            data-testid={`kategori-artikel-baris-${i}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                Urutan {i + 1}
                {b.jumlah !== undefined ? ` · ${b.jumlah} artikel` : " · baru"}
              </span>
              <span className="flex items-center gap-1.5">
                <TombolIkon
                  nama="chevron"
                  label="Geser ke atas"
                  testid={`kategori-artikel-naik-${i}`}
                  putar={-90}
                  nonaktif={i === 0}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => geserBaris(s, i, -1));
                  }}
                />
                <TombolIkon
                  nama="chevron"
                  label="Geser ke bawah"
                  testid={`kategori-artikel-turun-${i}`}
                  putar={90}
                  nonaktif={i === baris.length - 1}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => geserBaris(s, i, 1));
                  }}
                />
                <TombolIkon
                  nama="x"
                  label={`Hapus ${b.nama || "kategori"}`}
                  testid={`kategori-artikel-hapus-${i}`}
                  bahaya
                  onClick={() => void hapus(i)}
                />
              </span>
            </div>
            <Kolom
              testid={`kategori-artikel-nama-${i}`}
              label="Nama kategori"
              nilai={b.nama}
              onUbah={(v) => isi(i, { nama: v })}
              placeholder="Tarbiyah"
            />
            <div className="mt-2">
              <Sakelar
                testid={`kategori-artikel-aktif-${i}`}
                label="Tampilkan sebagai penyaring di situs"
                nilai={b.aktif}
                onUbah={(v) => isi(i, { aktif: v })}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-testid="tambah-kategori-artikel"
        onClick={() => {
          setBaris((s) => [...s, { nama: "", aktif: true }]);
          setKotor(true);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="plus" className="h-3.5 w-3.5 text-gold-600" />
        Tambah kategori
      </button>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-artikel-kategori"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanSemua();
              setKotor(false);
            }, "Kategori artikel tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ------------------------------ daftar artikel ------------------------------ */

type BorangArtikel = {
  id?: string;
  judul: string;
  kategori: string;
  tanggal: string;
  penulis: string;
  menitBaca: string;
  gambar: string;
  ringkasan: string;
  isiTeks: string;
  terbit: boolean;
};

export function DaftarArtikel() {
  const data = useArtikel();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanArtikel);
  const [borang, setBorang] = useState<BorangArtikel | null>(null);
  const berkasRef = useRef<HTMLInputElement>(null);

  const daftar = useMemo(() => [...data.artikel].sort((a, b) => b.tanggal.localeCompare(a.tanggal)), [data.artikel]);
  const opsiKategori = data.kategori.map((k) => ({ nilai: k.nama, label: k.nama }));

  const keBorang = (a?: ArtikelTampil) => {
    setPesan(null);
    setBorang(
      a
        ? {
            id: a.id,
            judul: a.judul,
            kategori: a.kategori,
            tanggal: a.tanggal,
            penulis: a.penulis,
            menitBaca: String(a.menitBaca),
            gambar: a.gambar,
            ringkasan: a.ringkasan,
            isiTeks: a.isi.join("\n\n"),
            terbit: a.terbit,
          }
        : {
            judul: "",
            kategori: opsiKategori[0]?.nilai ?? "",
            tanggal: hariIni(),
            penulis: "Humas PC PERSIS Cibatu",
            menitBaca: "5",
            gambar: "",
            ringkasan: "",
            isiTeks: "",
            terbit: true,
          },
    );
  };

  const ubah = (sebagian: Partial<BorangArtikel>) => setBorang((b) => (b ? { ...b, ...sebagian } : b));

  const pilihBerkas = async (berkas: File | undefined) => {
    if (!berkas || !borang) return;
    if (berkas.size > 25 * 1024 * 1024) {
      setPesan({ tipe: "galat", teks: "Berkas terlalu besar. Batas maksimal 25 MB." });
      return;
    }
    const selesai = await jalankan(async () => {
      const hasil = await unggahBerkas(berkas, "artikel");
      ubah({ gambar: hasil.url });
    }, "Gambar terunggah. Tekan Simpan agar artikel tersimpan.");
    if (selesai) setPesan(null);
  };

  const simpan = async () => {
    if (!borang) return;
    const isi = borang.isiTeks
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const muatan = {
      judul: borang.judul,
      kategori: borang.kategori,
      tanggal: borang.tanggal,
      penulis: borang.penulis,
      menitBaca: Number.parseInt(borang.menitBaca, 10) || 3,
      gambar_url: borang.gambar,
      ringkasan: borang.ringkasan,
      isi,
      terbit: borang.terbit,
    };
    const berhasil = await jalankan(
      async () => {
        if (borang.id) await ubahArtikel(borang.id, muatan);
        else await tambahArtikel(muatan);
      },
      borang.id ? "Artikel diperbarui." : "Artikel baru tersimpan.",
    );
    if (berhasil) setBorang(null);
  };

  const hapus = async (a: ArtikelTampil) => {
    const setuju = await mintaKonfirmasi(`Hapus artikel "${a.judul}"? Tindakan ini tidak bisa dibatalkan.`, {
      labelYa: "Ya, hapus artikel",
    });
    if (!setuju) return;
    try {
      await hapusArtikel(a.id);
      await segarkanArtikel();
      beritahu("sukses", "Artikel dihapus.");
      setPesan(null);
      if (borang?.id === a.id) setBorang(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  if (borang) {
    const bagian = borang.isiTeks
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0).length;

    return (
      <div data-testid="admin-artikel-borang">
        <KepalaBorang
          judul={borang.id ? "Ubah Artikel" : "Tambah Artikel"}
          keterangan="Isi judul, pilih kategori, tentukan tanggal dan waktu baca, lalu tulis ringkasan serta isi artikelnya. Simpan akan langsung mengubah halaman Artikel di situs."
          aksi={
            <button
              type="button"
              data-testid="artikel-kembali"
              onClick={() => setBorang(null)}
              className="rounded-full border border-black/[0.12] px-3.5 py-2 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
            >
              Kembali ke daftar
            </button>
          }
        />
        {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

        <div className="mt-4 space-y-3.5">
          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Gambar artikel</h2>
            <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-cream-50">
              {borang.gambar ? (
                <img src={borang.gambar} alt="" className="h-[190px] w-full object-cover" />
              ) : (
                <div className="grid h-[190px] w-full place-items-center text-[11px] text-ink-600">
                  Belum ada gambar
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="pilih-gambar-artikel-item"
                disabled={sibuk}
                onClick={() => berkasRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-persis-900 px-3.5 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="image" className="h-[15px] w-[15px]" />
                {sibuk ? "Mengunggah…" : borang.gambar ? "Ganti gambar" : "Unggah gambar"}
              </button>
              {borang.gambar ? (
                <button
                  type="button"
                  data-testid="kosongkan-gambar-artikel"
                  onClick={() => ubah({ gambar: "" })}
                  className="rounded-full border border-black/[0.12] px-3.5 py-2 text-[11.5px] font-semibold text-ink-600 transition active:scale-[0.98]"
                >
                  Kosongkan gambar
                </button>
              ) : null}
            </div>
            <input
              ref={berkasRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              data-testid="berkas-gambar-artikel-item"
              onChange={(e) => {
                void pilihBerkas(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <p className="text-justify text-[10px] leading-relaxed text-ink-400">Ukuran paling besar 25 MB.</p>
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Judul & keterangan</h2>
            <Kolom
              testid="artikel-item-judul"
              label="Judul artikel"
              nilai={borang.judul}
              onUbah={(v) => ubah({ judul: v })}
              placeholder="Adab Menuntut Ilmu Lebih Dahulu daripada Pelajaran"
            />
            <Pilih
              testid="artikel-item-kategori"
              label="Kategori"
              nilai={borang.kategori}
              onUbah={(v) => ubah({ kategori: v })}
              opsi={opsiKategori}
              placeholder={opsiKategori.length === 0 ? "Belum ada kategori" : "Pilih kategori"}
            />
            <Tanggal
              testid="artikel-item-tanggal"
              label="Tanggal artikel"
              nilai={borang.tanggal}
              onUbah={(v) => ubah({ tanggal: v })}
              petunjuk="Artikel terbaru tampil paling atas."
            />
            <Kolom
              testid="artikel-item-penulis"
              label="Penulis / sumber"
              nilai={borang.penulis}
              onUbah={(v) => ubah({ penulis: v })}
              placeholder="Ust. H. Ahmad Fauzan, Lc., M.A."
            />
            <Kolom
              testid="artikel-item-menit"
              label="Waktu baca (menit)"
              nilai={borang.menitBaca}
              onUbah={(v) => ubah({ menitBaca: v })}
              placeholder="5"
              petunjuk="Tampil pada kartu artikel, contoh: 5 menit baca."
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Isi artikel</h2>
            <AreaTeks
              testid="artikel-item-ringkasan"
              label="Ringkasan"
              nilai={borang.ringkasan}
              onUbah={(v) => ubah({ ringkasan: v })}
              baris={3}
              petunjuk="Tampil pada kartu artikel dan bagian pembuka halaman."
            />
            <AreaTeks
              testid="artikel-item-isi"
              label="Isi lengkap"
              nilai={borang.isiTeks}
              onUbah={(v) => ubah({ isiTeks: v })}
              baris={12}
              petunjuk={`Pisahkan antarparagraf dengan satu baris kosong. Saat ini terbaca ${bagian} paragraf.`}
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Penayangan</h2>
            <Sakelar
              testid="artikel-item-terbit"
              label="Terbitkan di situs"
              nilai={borang.terbit}
              onUbah={(v) => ubah({ terbit: v })}
              petunjuk="Bila dimatikan, artikel tersimpan sebagai draf dan tidak tampil di situs."
            />
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <TombolSimpan
              penuh={false}
              testid="simpan-artikel-item"
              sibuk={sibuk}
              nonaktif={!borang.judul.trim()}
              onClick={() => void simpan()}
            />
            {borang.id ? (
              <button
                type="button"
                data-testid="hapus-artikel-borang"
                disabled={sibuk}
                onClick={() => {
                  const asal = data.artikel.find((a) => a.id === borang.id);
                  if (asal) void hapus(asal);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-[11.5px] font-semibold text-rose-700 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="trash" className="h-[15px] w-[15px]" />
                Hapus artikel
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-artikel-daftar">
      <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
        <button
          type="button"
          data-testid="tambah-artikel"
          onClick={() => keBorang()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 px-4 py-2.5 text-[11.5px] font-semibold text-white transition active:scale-[0.98]"
        >
          <Icon name="plus" className="h-[15px] w-[15px]" />
          Tambah artikel
        </button>
      </div>
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {daftar.map((a) => (
          <div
            key={a.id}
            data-testid={`artikel-baris-${a.id}`}
            className="flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-white p-2.5"
          >
            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-cream-100">
              {a.gambar ? (
                <img src={a.gambar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-ink-400">
                  <Icon name="image" className="h-5 w-5" />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block text-[11.5px] leading-snug font-semibold text-ink-900">
                {a.judul}
              </span>
              <span className="mt-1 block text-[10px] font-semibold tracking-[0.06em] text-persis-800 uppercase">
                {a.kategori} · {a.tanggal ? tanggalPendek(a.tanggal) : "—"} · {a.menitBaca} menit · {a.dibaca} dibaca
              </span>
              {!a.terbit ? (
                <span className="mt-1 inline-block rounded-full bg-pastelgold px-2 py-[2px] text-[9px] font-bold tracking-[0.08em] text-gold-700 uppercase">
                  Draf
                </span>
              ) : null}
            </span>
            <span className="flex shrink-0 flex-col items-stretch gap-1.5">
              <button
                type="button"
                data-testid={`artikel-ubah-${a.id}`}
                onClick={() => keBorang(a)}
                className="rounded-full border border-black/[0.12] px-2.5 py-1.5 text-[10.5px] font-semibold text-persis-900 transition active:scale-[0.98]"
              >
                Ubah
              </button>
              <button
                type="button"
                data-testid={`artikel-hapus-${a.id}`}
                onClick={() => void hapus(a)}
                className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10.5px] font-semibold text-rose-700 transition active:scale-[0.98]"
              >
                Hapus
              </button>
            </span>
          </div>
        ))}
      </div>

      {daftar.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-persis-900/20 p-5 text-center text-[11.5px] text-ink-600">
          Belum ada artikel. Tekan "Tambah artikel" untuk menulis tulisan pertama.
        </p>
      ) : null}

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Artikel paling baru otomatis tampil paling atas dan menjadi Artikel Utama di halaman Artikel. Bagian "Paling
        Banyak Dibaca" dihitung dari jumlah pembaca setiap artikel.
      </p>
    </div>
  );
}
