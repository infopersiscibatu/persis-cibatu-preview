import { useEffect, useRef, useState } from "react";
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
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { segarkanGaleri, useGaleri, type FotoGaleri } from "../../lib/galeri";
import { pakaiSimpan } from "../../lib/panelSimpan";
import {
  hapusFotoGaleri,
  hapusKategoriGaleri,
  simpanGambarGaleri,
  simpanHalamanGaleri,
  tambahFotoGaleri,
  tambahKategoriGaleri,
  ubahFotoGaleri,
  ubahKategoriGaleri,
  unggahBerkas,
  urutKategoriGaleri,
} from "../../lib/admin";

/** Pindahkan satu baris pada daftar. */
function geserBaris<T>(daftar: T[], i: number, arah: -1 | 1): T[] {
  const j = i + arah;
  if (j < 0 || j >= daftar.length) return daftar;
  const salinan = [...daftar];
  [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
  return salinan;
}

/** Tanggal hari ini dalam bentuk YYYY-MM-DD. */
function hariIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ------------------------------ teks halaman ------------------------------ */

export function TeksHalamanGaleri() {
  const data = useGaleri();
  const { sibuk, pesan, jalankan } = pakaiSimpan(segarkanGaleri);
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
    <div data-testid="admin-galeri-teks">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <Kolom
          testid="galeri-judul"
          label="Judul halaman"
          nilai={nilai.judul}
          onUbah={(v) => ubah("judul", v)}
          placeholder="Galeri"
        />
        <AreaTeks
          testid="galeri-pengantar"
          label="Kalimat pengantar"
          nilai={nilai.pengantar}
          onUbah={(v) => ubah("pengantar", v)}
          baris={5}
          petunjuk="Boleh dikosongkan. Bila diisi, tampil sebagai paragraf rata kiri-kanan di bawah gambar halaman."
        />
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-galeri-teks"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanHalamanGaleri(nilai);
              setKotor(false);
            }, "Teks halaman galeri tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ----------------------------- gambar halaman ----------------------------- */

export function GambarHalamanGaleri() {
  const data = useGaleri();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanGaleri);
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
      const hasil = await unggahBerkas(berkas, "galeri");
      await simpanGambarGaleri({ gambar_url: hasil.url, gambar_alt: alt });
    }, "Gambar halaman galeri tersimpan dan langsung dipakai.");
  };

  return (
    <div data-testid="admin-galeri-gambar">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <div className="overflow-hidden rounded-2xl border border-black/[0.08]">
          <img src={data.gambar.url || gambar.kelas1} alt="" className="h-[168px] w-full object-cover" />
        </div>
        <p className="mt-2.5 text-[10px] break-all text-ink-400">{data.gambar.url || gambar.kelas1}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="pilih-gambar-galeri"
            disabled={sibuk}
            onClick={() => berkasRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-persis-900 px-3.5 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            <Icon name="image" className="h-[15px] w-[15px]" />
            {sibuk ? "Mengunggah…" : "Ganti gambar"}
          </button>
          <button
            type="button"
            data-testid="gambar-galeri-bawaan"
            disabled={sibuk}
            onClick={() =>
              void jalankan(
                () => simpanGambarGaleri({ gambar_url: gambar.kelas1, gambar_alt: alt }),
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
          data-testid="berkas-gambar-galeri"
          onChange={(e) => {
            void pilihBerkas(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="mt-4 space-y-3">
          <Kolom
            testid="isian-galeri-gambar-alt"
            label="Keterangan gambar (alt)"
            nilai={alt}
            onUbah={setAlt}
            petunjuk="Dipakai pembaca layar dan saat gambar gagal dimuat."
          />
          <TombolSimpan
            testid="simpan-galeri-gambar-alt"
            sibuk={sibuk}
            label="Simpan keterangan"
            onClick={() => void jalankan(() => simpanGambarGaleri({ gambar_alt: alt }), "Keterangan gambar tersimpan.")}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- kategori -------------------------------- */

type BarisKategori = { id?: string; nama: string; keterangan: string; jumlah?: number };

export function KategoriGaleri() {
  const data = useGaleri();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanGaleri);
  const [baris, setBaris] = useState<BarisKategori[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setBaris(data.kategori.map((k) => ({ id: k.id, nama: k.nama, keterangan: k.keterangan, jumlah: k.jumlah })));
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
      const muatan = { nama: b.nama.trim(), keterangan: b.keterangan };
      if (b.id) {
        await ubahKategoriGaleri(b.id, muatan);
        urut.push(b.id);
        hasil.push({ ...b, ...muatan });
      } else {
        const jawab = (await tambahKategoriGaleri(muatan)) as { kategori?: { id: string }[] };
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

    if (urut.length > 0) await urutKategoriGaleri(urut);
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
      `Hapus kategori ${b.nama || "ini"} dari daftar galeri? Kategori yang masih dipakai foto tidak akan terhapus.`,
      { labelYa: "Ya, hapus kategori" },
    );
    if (!setuju) return;
    try {
      await hapusKategoriGaleri(b.id);
      await segarkanGaleri();
      setBaris((s) => s.filter((_, k) => k !== i));
      beritahu("sukses", `${b.nama || "Kategori"} dihapus.`);
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  return (
    <div data-testid="admin-galeri-kategori">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {baris.map((b, i) => (
          <div
            key={b.id ?? `baru-${i}`}
            data-testid={`kategori-baris-${i}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                Urutan {i + 1}
                {b.jumlah !== undefined ? ` · ${b.jumlah} foto` : " · baru"}
              </span>
              <span className="flex items-center gap-1.5">
                <TombolIkon
                  nama="chevron"
                  label="Geser ke atas"
                  testid={`kategori-naik-${i}`}
                  putar={-90}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => geserBaris(s, i, -1));
                  }}
                  nonaktif={i === 0}
                />
                <TombolIkon
                  nama="chevron"
                  label="Geser ke bawah"
                  testid={`kategori-turun-${i}`}
                  putar={90}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => geserBaris(s, i, 1));
                  }}
                  nonaktif={i === baris.length - 1}
                />
                <TombolIkon
                  nama="x"
                  label={`Hapus ${b.nama || "kategori"}`}
                  testid={`kategori-hapus-${i}`}
                  bahaya
                  onClick={() => void hapus(i)}
                />
              </span>
            </div>
            <div className="space-y-2.5">
              <Kolom
                testid={`kategori-nama-${i}`}
                label="Nama kategori"
                nilai={b.nama}
                onUbah={(v) => isi(i, { nama: v })}
                placeholder="Kegiatan Belajar"
              />
              <AreaTeks
                testid={`kategori-keterangan-${i}`}
                label="Keterangan"
                nilai={b.keterangan}
                onUbah={(v) => isi(i, { keterangan: v })}
                baris={3}
                petunjuk="Opsional, mis. penjelasan singkat isi kategori ini."
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-testid="tambah-kategori-galeri"
        onClick={() => {
          setBaris((s) => [...s, { nama: "", keterangan: "" }]);
          setKotor(true);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="plus" className="h-3.5 w-3.5 text-gold-600" />
        Tambah kategori
      </button>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-galeri-kategori"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanSemua();
              setKotor(false);
            }, "Kategori galeri tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ------------------------------ daftar galeri ------------------------------ */

type BorangFoto = {
  id?: string;
  judul: string;
  gambar: string;
  tanggal: string;
  kategoriId: string;
  aktif: boolean;
};

export function DaftarGaleri() {
  const data = useGaleri();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanGaleri);
  const [borang, setBorang] = useState<BorangFoto | null>(null);
  const berkasRef = useRef<HTMLInputElement>(null);

  const opsiKategori = data.kategori.map((k) => ({ nilai: k.id, label: k.nama }));

  const buka = (f?: FotoGaleri) => {
    setPesan(null);
    setBorang(
      f
        ? { id: f.id, judul: f.judul, gambar: f.gambar, tanggal: f.tanggal, kategoriId: f.kategoriId, aktif: f.aktif }
        : {
            judul: "",
            gambar: "",
            tanggal: hariIni(),
            kategoriId: data.kategori[0]?.id ?? "",
            aktif: true,
          },
    );
  };

  const ubah = (sebagian: Partial<BorangFoto>) => setBorang((b) => (b ? { ...b, ...sebagian } : b));

  const pilihBerkas = async (berkas: File | undefined) => {
    if (!berkas || !borang) return;
    if (berkas.size > 25 * 1024 * 1024) {
      setPesan({ tipe: "galat", teks: "Berkas terlalu besar. Batas maksimal 25 MB." });
      return;
    }
    const selesai = await jalankan(async () => {
      const hasil = await unggahBerkas(berkas, "galeri");
      ubah({ gambar: hasil.url });
    }, "Gambar terunggah. Tekan Simpan agar foto tersimpan.");
    if (selesai) setPesan(null);
  };

  const simpan = async () => {
    if (!borang) return;
    const muatan = {
      judul: borang.judul,
      gambar_url: borang.gambar,
      tanggal: borang.tanggal,
      album_id: borang.kategoriId,
      aktif: borang.aktif,
    };
    const berhasil = await jalankan(
      async () => {
        if (borang.id) await ubahFotoGaleri(borang.id, muatan);
        else await tambahFotoGaleri(muatan);
      },
      borang.id ? "Foto galeri diperbarui." : "Foto baru tersimpan.",
    );
    if (berhasil) setBorang(null);
  };

  const hapus = async (f: FotoGaleri) => {
    const setuju = await mintaKonfirmasi(`Hapus foto "${f.judul}" dari galeri?`, { labelYa: "Ya, hapus foto" });
    if (!setuju) return;
    try {
      await hapusFotoGaleri(f.id);
      await segarkanGaleri();
      beritahu("sukses", "Foto dihapus dari galeri.");
      setPesan(null);
      if (borang?.id === f.id) setBorang(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  if (borang) {
    return (
      <div data-testid="admin-galeri-foto-borang">
        <KepalaBorang
          judul={borang.id ? "Ubah Foto" : "Tambah Foto"}
          keterangan="Ganti gambar, tulis caption, tentukan tanggal, dan pilih kategorinya. Tanggal terbaru tampil paling atas di halaman Galeri."
          aksi={
            <button
              type="button"
              data-testid="galeri-foto-kembali"
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
            <h2 className="font-header text-[13px] font-bold text-ink-900">Gambar foto</h2>
            <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-cream-50">
              {borang.gambar ? (
                <img src={borang.gambar} alt="" className="h-[200px] w-full object-cover" />
              ) : (
                <div className="grid h-[200px] w-full place-items-center text-[11px] text-ink-600">
                  Belum ada gambar
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="pilih-gambar-foto"
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
                  data-testid="hapus-gambar-foto"
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
              data-testid="berkas-gambar-foto"
              onChange={(e) => {
                void pilihBerkas(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <p className="text-justify text-[10px] leading-relaxed text-ink-400">
              Ukuran paling besar 25 MB. Foto mendatar (lebar) paling nyaman karena tampil sebagai kisi berukuran 4:3.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Keterangan foto</h2>
            <Kolom
              testid="foto-caption"
              label="Caption foto"
              nilai={borang.judul}
              onUbah={(v) => ubah({ judul: v })}
              placeholder="Suasana belajar di kelas MI PERSIS 01 Cibatu"
              petunjuk="Tampil pada kartu foto dan pada penampil foto besar."
            />
            <Tanggal
              testid="foto-tanggal"
              label="Tanggal foto"
              nilai={borang.tanggal}
              onUbah={(v) => ubah({ tanggal: v })}
              petunjuk="Dipakai untuk mengurutkan foto: yang terbaru tampil paling atas."
            />
            <Pilih
              testid="foto-kategori"
              label="Kategori"
              nilai={borang.kategoriId}
              onUbah={(v) => ubah({ kategoriId: v })}
              opsi={opsiKategori}
              placeholder={opsiKategori.length === 0 ? "Belum ada kategori" : "Pilih kategori"}
            />
            <Sakelar
              testid="foto-aktif"
              label="Tampilkan di situs"
              nilai={borang.aktif}
              onUbah={(v) => ubah({ aktif: v })}
              petunjuk="Bila dimatikan, foto tetap tersimpan tetapi tidak muncul di halaman Galeri."
            />
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <TombolSimpan
              penuh={false}
              testid="simpan-foto-galeri"
              sibuk={sibuk}
              nonaktif={!borang.judul.trim()}
              onClick={() => void simpan()}
            />
            {borang.id ? (
              <button
                type="button"
                data-testid="hapus-foto-borang"
                disabled={sibuk}
                onClick={() => {
                  const asal = data.foto.find((f) => f.id === borang.id);
                  if (asal) void hapus(asal);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-[11.5px] font-semibold text-rose-700 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="trash" className="h-[15px] w-[15px]" />
                Hapus foto
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-galeri-foto">
      <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
        <button
          type="button"
          data-testid="tambah-foto-galeri"
          onClick={() => buka()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 px-4 py-2.5 text-[11.5px] font-semibold text-white transition active:scale-[0.98]"
        >
          <Icon name="plus" className="h-[15px] w-[15px]" />
          Tambah foto
        </button>
      </div>
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {data.foto.map((f) => (
          <div
            key={f.id}
            data-testid={`galeri-foto-${f.id}`}
            className="flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-white p-2.5"
          >
            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-cream-100">
              {f.gambar ? (
                <img src={f.gambar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-ink-400">
                  <Icon name="image" className="h-5 w-5" />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block text-[11.5px] leading-snug font-semibold text-ink-900">
                {f.judul}
              </span>
              <span className="mt-1 block text-[10px] font-semibold tracking-[0.06em] text-persis-800 uppercase">
                {f.kategori || "Tanpa kategori"} · {f.tanggalTeks || "—"}
              </span>
              {!f.aktif ? (
                <span className="mt-1 inline-block rounded-full bg-pastelgold px-2 py-[2px] text-[9px] font-bold tracking-[0.08em] text-gold-700 uppercase">
                  Tidak tampil
                </span>
              ) : null}
            </span>
            <span className="flex shrink-0 flex-col items-stretch gap-1.5">
              <button
                type="button"
                data-testid={`galeri-foto-ubah-${f.id}`}
                onClick={() => buka(f)}
                className="rounded-full border border-black/[0.12] px-2.5 py-1.5 text-[10.5px] font-semibold text-persis-900 transition active:scale-[0.98]"
              >
                Ubah
              </button>
              <button
                type="button"
                data-testid={`galeri-foto-hapus-${f.id}`}
                onClick={() => void hapus(f)}
                className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10.5px] font-semibold text-rose-700 transition active:scale-[0.98]"
              >
                Hapus
              </button>
            </span>
          </div>
        ))}
      </div>

      {data.foto.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-persis-900/20 p-5 text-center text-[11.5px] text-ink-600">
          Belum ada foto. Tekan "Tambah foto" untuk mengunggah foto pertama.
        </p>
      ) : null}
    </div>
  );
}
