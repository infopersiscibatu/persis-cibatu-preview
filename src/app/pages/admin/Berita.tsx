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
import { beritaTerbaru, segarkanBerita, useBerita, type BeritaTampil } from "../../lib/berita";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { pakaiSimpan } from "../../lib/panelSimpan";
import { tanggalPendek } from "../../lib/format";
import {
  hapusBerita,
  hapusKategoriBerita,
  simpanGambarBerita,
  simpanHalamanBerita,
  tambahBerita,
  tambahKategoriBerita,
  ubahBerita,
  ubahKategoriBerita,
  unggahBerkas,
  urutKategoriBerita,
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

export function TeksHalamanBerita() {
  const data = useBerita();
  const { sibuk, pesan, jalankan } = pakaiSimpan(segarkanBerita);
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
    <div data-testid="admin-berita-teks">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <Kolom
          testid="berita-judul"
          label="Judul halaman"
          nilai={nilai.judul}
          onUbah={(v) => ubah("judul", v)}
          placeholder="Berita"
        />
        <AreaTeks
          testid="berita-pengantar"
          label="Kalimat pengantar"
          nilai={nilai.pengantar}
          onUbah={(v) => ubah("pengantar", v)}
          baris={6}
        />
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-berita-teks"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanHalamanBerita(nilai);
              setKotor(false);
            }, "Teks halaman berita tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ----------------------------- gambar halaman ----------------------------- */

export function GambarHalamanBerita() {
  const data = useBerita();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanBerita);
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
      const hasil = await unggahBerkas(berkas, "berita");
      await simpanGambarBerita({ gambar_url: hasil.url, gambar_alt: alt });
    }, "Gambar halaman berita tersimpan dan langsung dipakai.");
  };

  return (
    <div data-testid="admin-berita-gambar">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <div className="overflow-hidden rounded-2xl border border-black/[0.08]">
          <img src={data.gambar.url || gambar.masjidPutih} alt="" className="h-[168px] w-full object-cover" />
        </div>
        <p className="mt-2.5 text-[10px] break-all text-ink-400">{data.gambar.url || gambar.masjidPutih}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="pilih-gambar-berita"
            disabled={sibuk}
            onClick={() => berkasRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-persis-900 px-3.5 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            <Icon name="image" className="h-[15px] w-[15px]" />
            {sibuk ? "Mengunggah…" : "Ganti gambar"}
          </button>
          <button
            type="button"
            data-testid="gambar-berita-bawaan"
            disabled={sibuk}
            onClick={() =>
              void jalankan(
                () => simpanGambarBerita({ gambar_url: gambar.masjidPutih, gambar_alt: alt }),
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
          data-testid="berkas-gambar-berita"
          onChange={(e) => {
            void pilihBerkas(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="mt-4 space-y-3">
          <Kolom
            testid="isian-berita-gambar-alt"
            label="Keterangan gambar (alt)"
            nilai={alt}
            onUbah={setAlt}
            petunjuk="Dipakai pembaca layar dan saat gambar gagal dimuat."
          />
          <TombolSimpan
            testid="simpan-berita-gambar-alt"
            sibuk={sibuk}
            label="Simpan keterangan"
            onClick={() => void jalankan(() => simpanGambarBerita({ gambar_alt: alt }), "Keterangan gambar tersimpan.")}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- kategori -------------------------------- */

type BarisKategori = { id?: string; nama: string; aktif: boolean; jumlah?: number };

export function KategoriBerita() {
  const data = useBerita();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanBerita);
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
        await ubahKategoriBerita(b.id, muatan);
        urut.push(b.id);
        hasil.push({ ...b, ...muatan });
      } else {
        const jawab = (await tambahKategoriBerita({ nama: muatan.nama })) as { kategori?: { id: string }[] };
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

    if (urut.length > 0) await urutKategoriBerita(urut);
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
      `Hapus kategori ${b.nama || "ini"} dari daftar berita? Kategori yang masih dipakai berita tidak akan terhapus.`,
      { labelYa: "Ya, hapus kategori" },
    );
    if (!setuju) return;
    try {
      await hapusKategoriBerita(b.id);
      await segarkanBerita();
      setBaris((s) => s.filter((_, k) => k !== i));
      beritahu("sukses", `${b.nama || "Kategori"} dihapus.`);
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  return (
    <div data-testid="admin-berita-kategori">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {baris.map((b, i) => (
          <div
            key={b.id ?? `baru-${i}`}
            data-testid={`kategori-berita-baris-${i}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                Urutan {i + 1}
                {b.jumlah !== undefined ? ` · ${b.jumlah} berita` : " · baru"}
              </span>
              <span className="flex items-center gap-1.5">
                <TombolIkon
                  nama="chevron"
                  label="Geser ke atas"
                  testid={`kategori-berita-naik-${i}`}
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
                  testid={`kategori-berita-turun-${i}`}
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
                  testid={`kategori-berita-hapus-${i}`}
                  bahaya
                  onClick={() => void hapus(i)}
                />
              </span>
            </div>
            <Kolom
              testid={`kategori-berita-nama-${i}`}
              label="Nama kategori"
              nilai={b.nama}
              onUbah={(v) => isi(i, { nama: v })}
              placeholder="Prestasi"
            />
            <div className="mt-2">
              <Sakelar
                testid={`kategori-berita-aktif-${i}`}
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
        data-testid="tambah-kategori-berita"
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
          testid="simpan-berita-kategori"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanSemua();
              setKotor(false);
            }, "Kategori berita tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ------------------------------ daftar berita ------------------------------ */

type BorangBerita = {
  id?: string;
  judul: string;
  kategori: string;
  tanggal: string;
  penulis: string;
  gambar: string;
  ringkasan: string;
  isiTeks: string;
  sorotan: boolean;
  terbit: boolean;
};

export function DaftarBerita() {
  const data = useBerita();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanBerita);
  const [borang, setBorang] = useState<BorangBerita | null>(null);
  const berkasRef = useRef<HTMLInputElement>(null);

  const daftar = useMemo(() => [...data.berita].sort((a, b) => b.date.localeCompare(a.date)), [data.berita]);
  const opsiKategori = data.kategori.map((k) => ({ nilai: k.nama, label: k.nama }));

  const keBorang = (b?: BeritaTampil) => {
    setPesan(null);
    setBorang(
      b
        ? {
            id: b.id,
            judul: b.title,
            kategori: b.category,
            tanggal: b.date,
            penulis: b.author,
            gambar: b.image,
            ringkasan: b.excerpt,
            isiTeks: b.body.join("\n\n"),
            sorotan: b.sorotan,
            terbit: b.terbit,
          }
        : {
            judul: "",
            kategori: opsiKategori[0]?.nilai ?? "",
            tanggal: hariIni(),
            penulis: "Humas PC PERSIS Cibatu",
            gambar: "",
            ringkasan: "",
            isiTeks: "",
            sorotan: false,
            terbit: true,
          },
    );
  };

  const ubah = (sebagian: Partial<BorangBerita>) => setBorang((b) => (b ? { ...b, ...sebagian } : b));

  const pilihBerkas = async (berkas: File | undefined) => {
    if (!berkas || !borang) return;
    if (berkas.size > 25 * 1024 * 1024) {
      setPesan({ tipe: "galat", teks: "Berkas terlalu besar. Batas maksimal 25 MB." });
      return;
    }
    const selesai = await jalankan(async () => {
      const hasil = await unggahBerkas(berkas, "berita");
      ubah({ gambar: hasil.url });
    }, "Gambar terunggah. Tekan Simpan agar berita tersimpan.");
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
      gambar_url: borang.gambar,
      ringkasan: borang.ringkasan,
      isi,
      sorotan: borang.sorotan,
      terbit: borang.terbit,
    };
    const berhasil = await jalankan(
      async () => {
        if (borang.id) await ubahBerita(borang.id, muatan);
        else await tambahBerita(muatan);
      },
      borang.id ? "Berita diperbarui." : "Berita baru tersimpan.",
    );
    if (berhasil) setBorang(null);
  };

  const hapus = async (b: BeritaTampil) => {
    const setuju = await mintaKonfirmasi(`Hapus berita "${b.title}"? Tindakan ini tidak bisa dibatalkan.`, {
      labelYa: "Ya, hapus berita",
    });
    if (!setuju) return;
    try {
      await hapusBerita(b.id);
      await segarkanBerita();
      beritahu("sukses", "Berita dihapus.");
      setPesan(null);
      if (borang?.id === b.id) setBorang(null);
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
      <div data-testid="admin-berita-borang">
        <KepalaBorang
          judul={borang.id ? "Ubah Berita" : "Tambah Berita"}
          keterangan="Isi judul, pilih kategori, tentukan tanggal, lalu tulis ringkasan dan isi beritanya. Simpan akan langsung mengubah halaman Berita di situs."
          aksi={
            <button
              type="button"
              data-testid="berita-kembali"
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
            <h2 className="font-header text-[13px] font-bold text-ink-900">Gambar berita</h2>
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
                data-testid="pilih-gambar-berita-item"
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
                  data-testid="kosongkan-gambar-berita"
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
              data-testid="berkas-gambar-berita-item"
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
              testid="berita-item-judul"
              label="Judul berita"
              nilai={borang.judul}
              onUbah={(v) => ubah({ judul: v })}
              placeholder="Santri PC PERSIS Cibatu Raih Juara I MTQ"
            />
            <Pilih
              testid="berita-item-kategori"
              label="Kategori"
              nilai={borang.kategori}
              onUbah={(v) => ubah({ kategori: v })}
              opsi={opsiKategori}
              placeholder={opsiKategori.length === 0 ? "Belum ada kategori" : "Pilih kategori"}
            />
            <Tanggal
              testid="berita-item-tanggal"
              label="Tanggal berita"
              nilai={borang.tanggal}
              onUbah={(v) => ubah({ tanggal: v })}
              petunjuk="Berita terbaru tampil paling atas."
            />
            <Kolom
              testid="berita-item-penulis"
              label="Penulis / sumber"
              nilai={borang.penulis}
              onUbah={(v) => ubah({ penulis: v })}
              placeholder="Humas PC PERSIS Cibatu"
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Isi berita</h2>
            <AreaTeks
              testid="berita-item-ringkasan"
              label="Ringkasan"
              nilai={borang.ringkasan}
              onUbah={(v) => ubah({ ringkasan: v })}
              baris={3}
              petunjuk="Tampil pada kartu berita dan bagian pembuka halaman."
            />
            <AreaTeks
              testid="berita-item-isi"
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
              testid="berita-item-terbit"
              label="Terbitkan di situs"
              nilai={borang.terbit}
              onUbah={(v) => ubah({ terbit: v })}
              petunjuk="Bila dimatikan, berita tersimpan sebagai draf dan tidak tampil di situs."
            />
            <Sakelar
              testid="berita-item-sorotan"
              label="Jadikan Berita Utama"
              nilai={borang.sorotan}
              onUbah={(v) => ubah({ sorotan: v })}
              petunjuk="Berita ini tampil pada kartu besar Berita Utama di halaman Berita."
            />
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <TombolSimpan
              penuh={false}
              testid="simpan-berita-item"
              sibuk={sibuk}
              nonaktif={!borang.judul.trim()}
              onClick={() => void simpan()}
            />
            {borang.id ? (
              <button
                type="button"
                data-testid="hapus-berita-borang"
                disabled={sibuk}
                onClick={() => {
                  const asal = data.berita.find((b) => b.id === borang.id);
                  if (asal) void hapus(asal);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-[11.5px] font-semibold text-rose-700 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="trash" className="h-[15px] w-[15px]" />
                Hapus berita
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-berita-daftar">
      <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
        <button
          type="button"
          data-testid="tambah-berita"
          onClick={() => keBorang()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 px-4 py-2.5 text-[11.5px] font-semibold text-white transition active:scale-[0.98]"
        >
          <Icon name="plus" className="h-[15px] w-[15px]" />
          Tambah berita
        </button>
      </div>
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {daftar.map((b) => (
          <div
            key={b.id}
            data-testid={`berita-baris-${b.id}`}
            className="flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-white p-2.5"
          >
            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-cream-100">
              {b.image ? (
                <img src={b.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-ink-400">
                  <Icon name="image" className="h-5 w-5" />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block text-[11.5px] leading-snug font-semibold text-ink-900">
                {b.title}
              </span>
              <span className="mt-1 block text-[10px] font-semibold tracking-[0.06em] text-persis-800 uppercase">
                {b.category} · {b.date ? tanggalPendek(b.date) : "—"} · {b.views} dibaca
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                {!b.terbit ? (
                  <span className="inline-block rounded-full bg-pastelgold px-2 py-[2px] text-[9px] font-bold tracking-[0.08em] text-gold-700 uppercase">
                    Draf
                  </span>
                ) : null}
                {b.sorotan ? (
                  <span className="inline-block rounded-full bg-mint-deep px-2 py-[2px] text-[9px] font-bold tracking-[0.08em] text-persis-800 uppercase">
                    Berita utama
                  </span>
                ) : null}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-stretch gap-1.5">
              <button
                type="button"
                data-testid={`berita-ubah-${b.id}`}
                onClick={() => keBorang(b)}
                className="rounded-full border border-black/[0.12] px-2.5 py-1.5 text-[10.5px] font-semibold text-persis-900 transition active:scale-[0.98]"
              >
                Ubah
              </button>
              <button
                type="button"
                data-testid={`berita-hapus-${b.id}`}
                onClick={() => void hapus(b)}
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
          Belum ada berita. Tekan "Tambah berita" untuk menulis berita pertama.
        </p>
      ) : null}

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Berita paling baru otomatis tampil paling atas di halaman Berita. Gunakan "Jadikan Berita Utama" pada salah satu
        berita agar tampil di kartu besar bagian atas halaman.
      </p>
    </div>
  );
}

/** Jumlah berita terbit (dipakai keterangan singkat). */
export const jumlahTerbit = (data: ReturnType<typeof useBerita>) => beritaTerbaru(data).length;
