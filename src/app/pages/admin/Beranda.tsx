import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaTeks,
  KepalaBorang,
  Kolom,
  Pesan,
  Pilih,
  Sakelar,
  TombolIkon,
  TombolSimpan,
} from "../../components/admin/Form";
import { Icon } from "../../components/Icons";
import { LayananJamaah } from "./Identitas";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { pakaiSimpan } from "../../lib/panelSimpan";
import {
  segarkanBeranda,
  sosialTampil,
  useBeranda,
  type Carousel as TipeCarousel,
  type MenuGrid,
  type NavBawah,
  type TautanSosial,
} from "../../lib/beranda";
import {
  hapusCarousel,
  hapusGridMenu,
  hapusSosial,
  simpanNavigasi,
  tambahCarousel,
  tambahGridMenu,
  tambahSosial,
  ubahCarousel,
  ubahGridMenu,
  ubahSosial,
  unggahBerkas,
  urutCarousel,
  urutGridMenu,
  urutSosial,
} from "../../lib/admin";

/** Ikon yang bisa dipakai pada menu beranda. */
const IKON_MENU: [string, string][] = [
  ["home", "Beranda"],
  ["newspaper", "Berita"],
  ["megaphone", "Pengumuman"],
  ["calendar", "Agenda"],
  ["book", "Kajian"],
  ["clipboard", "SPMB"],
  ["graduation-cap", "Jenjang"],
  ["school", "Sekolah"],
  ["users", "Wali Santri"],
  ["user", "Profil"],
  ["image", "Galeri"],
  ["wallet", "Pembayaran"],
  ["heart", "Donasi"],
  ["phone", "Telepon"],
  ["mail", "Surel"],
  ["map-pin", "Lokasi"],
  ["clock", "Jam"],
  ["info", "Informasi"],
  ["award", "Prestasi"],
  ["shield", "Akademik"],
  ["flame", "Unggulan"],
  ["sparkle", "Program"],
  ["eye", "Visi"],
  ["check", "Verifikasi"],
  ["menu", "Lainnya"],
];

const LABEL_SOSIAL: [string, string][] = [
  ["whatsapp", "WhatsApp"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["youtube", "YouTube"],
  ["mail", "Surel"],
  ["phone", "Telepon"],
  ["info", "Lainnya"],
];

/** Pilih satu ikon dari daftar ikon situs. */
function PemilihIkon({
  testidDasar,
  nilai,
  onPilih,
  daftar = IKON_MENU,
  jumlahKolom = 5,
}: {
  testidDasar: string;
  nilai: string;
  onPilih: (ikon: string) => void;
  daftar?: [string, string][];
  jumlahKolom?: number;
}) {
  return (
    <div data-testid={`${testidDasar}-ikon`}>
      <p className="mb-1.5 text-[11px] font-semibold text-ink-600">Ikon</p>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${jumlahKolom}, minmax(0, 1fr))` }}>
        {daftar.map(([ikon, label]) => {
          const ini = nilai === ikon;
          return (
            <button
              key={ikon}
              type="button"
              title={label}
              aria-label={`Ikon ${label}`}
              aria-pressed={ini}
              data-testid={`${testidDasar}-ikon-${ikon}`}
              onClick={() => onPilih(ikon)}
              className={`flex flex-col items-center gap-1 rounded-xl border py-2 transition active:scale-95 ${
                ini ? "border-persis-900 bg-mint-100 text-persis-900" : "border-black/[0.08] bg-white text-ink-400"
              }`}
            >
              <Icon name={ikon} className="h-[18px] w-[18px]" />
              <span className="w-full truncate px-0.5 text-center text-[8.5px] leading-tight font-semibold">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Pindahkan satu baris pada daftar. */
function geserBaris<T>(daftar: T[], i: number, arah: -1 | 1): T[] {
  const j = i + arah;
  if (j < 0 || j >= daftar.length) return daftar;
  const salinan = [...daftar];
  [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
  return salinan;
}

/* --------------------------------- Carousel --------------------------------- */

type BorangSlide = {
  id?: string;
  gambarUrl: string;
  tag: string;
  judul: string;
  aktif: boolean;
};

export function Carousel() {
  const data = useBeranda();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanBeranda);
  const [borang, setBorang] = useState<BorangSlide | null>(null);
  const berkasRef = useRef<HTMLInputElement>(null);

  const daftar = useMemo(() => [...data.carousel].sort((a, b) => a.urutan - b.urutan), [data.carousel]);

  const keBorang = (s?: TipeCarousel) => {
    setPesan(null);
    setBorang(
      s
        ? { id: s.id, gambarUrl: s.gambarUrl, tag: s.tag ?? "", judul: s.judul, aktif: s.aktif }
        : { gambarUrl: "", tag: "", judul: "", aktif: true },
    );
  };

  const pilihBerkas = async (berkas: File | undefined) => {
    if (!berkas || !borang) return;
    if (berkas.size > 25 * 1024 * 1024) {
      setPesan({ tipe: "galat", teks: "Ukuran gambar melebihi 25 MB. Pilih gambar yang lebih kecil." });
      return;
    }
    try {
      const hasil = await unggahBerkas(berkas, "carousel");
      setBorang({ ...borang, gambarUrl: hasil.url });
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal mengunggah gambar." });
    }
  };

  const simpan = async () => {
    if (!borang) return;
    const muatan = {
      gambarUrl: borang.gambarUrl,
      tag: borang.tag,
      judul: borang.judul,
      aktif: borang.aktif,
    };
    const berhasil = await jalankan(
      async () => {
        if (borang.id) await ubahCarousel(borang.id, muatan);
        else await tambahCarousel(muatan);
      },
      borang.id ? "Carousel diperbarui." : "Gambar carousel ditambahkan.",
    );
    if (berhasil) setBorang(null);
  };

  const geser = async (i: number, arah: -1 | 1) => {
    const baru = geserBaris(daftar, i, arah);
    if (baru === daftar) return;
    await jalankan(() => urutCarousel(baru.map((s) => s.id)), "Susunan carousel tersimpan.");
  };

  const aktifkan = async (s: TipeCarousel, nilai: boolean) => {
    await jalankan(
      () => ubahCarousel(s.id, { aktif: nilai }),
      nilai ? "Gambar carousel ditampilkan." : "Gambar carousel disembunyikan.",
    );
  };

  const hapus = async (s: TipeCarousel) => {
    if (daftar.length <= 1) {
      setPesan({ tipe: "galat", teks: "Carousel harus menyisakan minimal satu gambar." });
      return;
    }
    const setuju = await mintaKonfirmasi(`Hapus gambar carousel "${s.judul}"? Tindakan ini tidak bisa dibatalkan.`, {
      labelYa: "Ya, hapus gambar",
    });
    if (!setuju) return;
    try {
      await hapusCarousel(s.id);
      await segarkanBeranda();
      beritahu("sukses", "Gambar carousel dihapus.");
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  if (borang) {
    return (
      <div data-testid="admin-carousel-borang">
        <KepalaBorang
          judul={borang.id ? "Ubah Gambar Carousel" : "Tambah Gambar Carousel"}
          keterangan="Gambar sorotan paling atas beranda beserta label kecil dan caption di atasnya. Urutan gambar mengikuti susunan pada daftar."
          aksi={
            <button
              type="button"
              data-testid="carousel-batal"
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
            <h2 className="font-header text-[13px] font-bold text-ink-900">Gambar</h2>
            <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-cream-50">
              {borang.gambarUrl ? (
                <img
                  src={borang.gambarUrl}
                  alt="Pratinjau gambar carousel"
                  data-testid="carousel-pratinjau"
                  className="h-[150px] w-full object-cover"
                />
              ) : (
                <p className="grid h-[120px] place-items-center text-[11px] text-ink-400">Belum ada gambar dipilih</p>
              )}
            </div>
            <button
              type="button"
              data-testid="carousel-pilih-gambar"
              disabled={sibuk}
              onClick={() => berkasRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-persis-900/20 bg-cream-50 px-3.5 py-2 text-[11.5px] font-semibold text-persis-900 transition active:scale-[0.98] disabled:opacity-50"
            >
              <Icon name="image" className="h-[15px] w-[15px]" />
              {borang.gambarUrl ? "Ganti gambar" : "Pilih gambar"}
            </button>
            <input
              ref={berkasRef}
              type="file"
              accept="image/*"
              data-testid="berkas-carousel"
              className="hidden"
              onChange={(e) => void pilihBerkas(e.target.files?.[0])}
            />
            <p className="text-[10.5px] leading-relaxed text-ink-400">
              Ukuran gambar paling nyaman antara 800 × 500 sampai 1600 × 1000 piksel, berkas maksimal 25 MB.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Label & caption</h2>
            <Kolom
              testid="carousel-label"
              label="Label"
              nilai={borang.tag}
              onUbah={(v) => setBorang({ ...borang, tag: v })}
              placeholder="Selamat Datang"
              petunjuk="Teks kecil huruf besar di atas caption. Boleh dikosongkan."
            />
            <AreaTeks
              testid="carousel-caption"
              label="Caption"
              nilai={borang.judul}
              onUbah={(v) => setBorang({ ...borang, judul: v })}
              baris={2}
              petunjuk="Kalimat utama yang tampil besar di atas gambar."
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Penayangan</h2>
            <Sakelar
              testid="carousel-aktif"
              label="Tampilkan di beranda"
              nilai={borang.aktif}
              onUbah={(v) => setBorang({ ...borang, aktif: v })}
              petunjuk="Bila dimatikan, gambar ini tidak ikut bergulir di beranda."
            />
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <TombolSimpan
              penuh={false}
              testid="simpan-carousel"
              sibuk={sibuk}
              nonaktif={!borang.judul.trim() || !borang.gambarUrl}
              onClick={() => void simpan()}
            />
            {borang.id ? (
              <button
                type="button"
                data-testid="hapus-carousel-borang"
                disabled={sibuk}
                onClick={() => {
                  const asal = daftar.find((s) => s.id === borang.id);
                  if (asal) void hapus(asal);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-[11.5px] font-semibold text-rose-700 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="trash" className="h-[15px] w-[15px]" />
                Hapus gambar
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-carousel">
      <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
        <button
          type="button"
          data-testid="tambah-carousel"
          onClick={() => keBorang()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 px-4 py-2.5 text-[11.5px] font-semibold text-white transition active:scale-[0.98]"
        >
          <Icon name="plus" className="h-[15px] w-[15px]" />
          Tambah gambar
        </button>
      </div>
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {daftar.map((s, i) => (
          <div
            key={s.id}
            data-testid={`carousel-baris-${i}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="flex items-start gap-3">
              <img
                src={s.gambarUrl}
                alt=""
                className="h-[54px] w-[78px] shrink-0 rounded-xl border border-black/[0.06] object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-semibold tracking-[0.12em] text-gold-700 uppercase">
                  {s.tag || "Tanpa label"}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug font-semibold text-ink-900">
                  {s.judul}
                </span>
                {!s.aktif ? (
                  <span className="mt-1 inline-block rounded-full bg-pastelgold px-2 py-[2px] text-[9px] font-bold tracking-[0.08em] text-gold-700 uppercase">
                    Disembunyikan
                  </span>
                ) : null}
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <TombolIkon
                  nama="chevron"
                  label="Geser ke kiri"
                  testid={`carousel-naik-${i}`}
                  putar={-90}
                  nonaktif={i === 0}
                  onClick={() => void geser(i, -1)}
                />
                <TombolIkon
                  nama="chevron"
                  label="Geser ke kanan"
                  testid={`carousel-turun-${i}`}
                  putar={90}
                  nonaktif={i === daftar.length - 1}
                  onClick={() => void geser(i, 1)}
                />
                <TombolIkon
                  nama="pencil"
                  label={`Ubah gambar: ${s.judul}`}
                  testid={`carousel-ubah-${i}`}
                  onClick={() => keBorang(s)}
                />
                <TombolIkon
                  nama="trash"
                  label={`Hapus gambar: ${s.judul}`}
                  testid={`carousel-hapus-${i}`}
                  bahaya
                  onClick={() => void hapus(s)}
                />
              </span>
              <button
                type="button"
                data-testid={`carousel-aktif-${i}`}
                onClick={() => void aktifkan(s, !s.aktif)}
                className={`rounded-full px-3 py-1.5 text-[10.5px] font-semibold transition active:scale-[0.98] ${
                  s.aktif ? "bg-mint-100 text-persis-900" : "border border-black/[0.12] text-ink-600"
                }`}
              >
                {s.aktif ? "Tampil" : "Disembunyikan"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Carousel harus menyisakan minimal satu gambar. Gambar dengan urutan paling atas tampil lebih dahulu saat beranda
        dibuka.
      </p>
    </div>
  );
}

/* ------------------------------ susunan grid menu ------------------------------ */

type BarisMenu = { id?: string; label: string; halaman: string; ikon: string; aktif: boolean };

export function SusunanGridMenu() {
  const data = useBeranda();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanBeranda);
  const [baris, setBaris] = useState<BarisMenu[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setBaris(
        [...data.gridMenu]
          .sort((a, b) => a.urutan - b.urutan)
          .map((m) => ({ id: m.id, label: m.label, halaman: m.halaman, ikon: m.ikon, aktif: m.aktif })),
      );
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.gridMenu]);

  const opsiHalaman = data.halaman.map((h) => ({ nilai: h.nilai, label: h.label }));
  const isi = (i: number, sebagian: Partial<BarisMenu>) => {
    setKotor(true);
    setBaris((s) => s.map((r, k) => (k === i ? { ...r, ...sebagian } : r)));
  };

  const simpanSemua = async () => {
    const dikenal = new Set(baris.filter((b) => b.id).map((b) => b.id as string));
    const urut: string[] = [];
    const hasil: BarisMenu[] = [];

    for (const b of baris) {
      if (!b.label.trim() || !b.halaman) {
        hasil.push(b);
        continue;
      }
      const muatan = { label: b.label.trim(), halaman: b.halaman, ikon: b.ikon, aktif: b.aktif };
      if (b.id) {
        await ubahGridMenu(b.id, muatan);
        urut.push(b.id);
        hasil.push({ ...b, ...muatan });
      } else {
        const jawab = (await tambahGridMenu(muatan)) as { gridMenu?: MenuGrid[] };
        const baru = (jawab.gridMenu ?? []).find((m) => !dikenal.has(m.id));
        if (baru) {
          dikenal.add(baru.id);
          urut.push(baru.id);
          hasil.push({ ...b, ...muatan, id: baru.id });
        } else {
          hasil.push({ ...b, ...muatan });
        }
      }
    }

    if (urut.length > 0) await urutGridMenu(urut);
    setBaris(hasil);
  };

  const hapus = async (i: number) => {
    const b = baris[i];
    if (!b.id) {
      setBaris((s) => s.filter((_, k) => k !== i));
      setKotor(true);
      return;
    }
    if (baris.length <= 1) {
      setPesan({ tipe: "galat", teks: "Grid menu harus menyisakan minimal satu menu." });
      return;
    }
    const setuju = await mintaKonfirmasi(`Hapus menu ${b.label || "ini"} dari grid beranda?`, {
      labelYa: "Ya, hapus menu",
    });
    if (!setuju) return;
    try {
      await hapusGridMenu(b.id);
      await segarkanBeranda();
      setBaris((s) => s.filter((_, k) => k !== i));
      beritahu("sukses", `Menu ${b.label || ""} dihapus.`);
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  return (
    <div data-testid="admin-grid-menu">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {baris.map((b, i) => (
          <div
            key={b.id ?? `baru-${i}`}
            data-testid={`grid-menu-baris-${i}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                Menu {i + 1}
                {b.id ? "" : " · baru"}
              </span>
              <span className="flex items-center gap-1.5">
                <TombolIkon
                  nama="chevron"
                  label="Geser ke atas"
                  testid={`grid-menu-naik-${i}`}
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
                  testid={`grid-menu-turun-${i}`}
                  putar={90}
                  nonaktif={i === baris.length - 1}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => geserBaris(s, i, 1));
                  }}
                />
                <TombolIkon
                  nama="trash"
                  label={`Hapus menu ${b.label || ""}`}
                  testid={`grid-menu-hapus-${i}`}
                  bahaya
                  onClick={() => void hapus(i)}
                />
              </span>
            </div>
            <div className="space-y-2.5">
              <Kolom
                testid={`grid-menu-label-${i}`}
                label="Nama menu"
                nilai={b.label}
                onUbah={(v) => isi(i, { label: v })}
                placeholder="Profil"
              />
              <Pilih
                testid={`grid-menu-halaman-${i}`}
                label="Halaman tujuan"
                nilai={b.halaman}
                onUbah={(v) => isi(i, { halaman: v })}
                opsi={opsiHalaman}
                placeholder="Pilih halaman"
              />
              <PemilihIkon testidDasar={`grid-menu-${i}`} nilai={b.ikon} onPilih={(ikon) => isi(i, { ikon })} />
              <Sakelar
                testid={`grid-menu-aktif-${i}`}
                label="Tampilkan di beranda"
                nilai={b.aktif}
                onUbah={(v) => isi(i, { aktif: v })}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-testid="tambah-grid-menu"
        onClick={() => {
          setBaris((s) => [...s, { label: "", halaman: "", ikon: "info", aktif: true }]);
          setKotor(true);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="plus" className="h-3.5 w-3.5 text-gold-600" />
        Tambah menu
      </button>

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Susunan tampil sebagai empat kolom. Jumlah menu yang bukan kelipatan empat tetap tersusun rapi — baris terakhir
        terisi dari kiri.
      </p>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-grid-menu"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanSemua();
              setKotor(false);
            }, "Susunan grid menu tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ---------------------------- susunan navigasi bawah ---------------------------- */

export function SusunanNavigasi() {
  const data = useBeranda();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanBeranda);
  const [baris, setBaris] = useState<NavBawah[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setBaris(data.navigasi.map((n) => ({ ...n })));
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.navigasi]);

  const isi = (i: number, sebagian: Partial<NavBawah>) => {
    setKotor(true);
    setBaris((s) => s.map((r, k) => (k === i ? { ...r, ...sebagian } : r)));
  };

  /** Pilihan halaman untuk satu baris: halaman yang belum dipakai baris lain. */
  const opsiUntuk = (i: number) => {
    const dipakai = new Set(baris.filter((_, k) => k !== i).map((b) => b.halaman));
    return data.halaman.filter((h) => !dipakai.has(h.nilai)).map((h) => ({ nilai: h.nilai, label: h.label }));
  };

  const simpan = async () => {
    if (baris.some((b) => !b.label.trim() || !b.halaman)) {
      setPesan({ tipe: "galat", teks: "Setiap menu navigasi harus punya nama dan halaman tujuan." });
      return;
    }
    if (baris.filter((b) => b.aktif).length < 2) {
      setPesan({ tipe: "galat", teks: "Minimal dua menu navigasi harus dalam keadaan tampil." });
      return;
    }
    await jalankan(async () => {
      await simpanNavigasi(baris.map((b) => ({ ...b, label: b.label.trim() })));
      setKotor(false);
    }, "Susunan navigasi bawah tersimpan.");
  };

  return (
    <div data-testid="admin-navigasi">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {baris.map((b, i) => (
          <div
            key={`${b.halaman}-${i}`}
            data-testid={`navigasi-baris-${i}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                <Icon name={b.ikon} className="h-[14px] w-[14px] text-persis-800" />
                Menu {i + 1}
              </span>
              <span className="flex items-center gap-1.5">
                <TombolIkon
                  nama="chevron"
                  label="Geser ke kiri"
                  testid={`navigasi-naik-${i}`}
                  putar={-90}
                  nonaktif={i === 0}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => geserBaris(s, i, -1));
                  }}
                />
                <TombolIkon
                  nama="chevron"
                  label="Geser ke kanan"
                  testid={`navigasi-turun-${i}`}
                  putar={90}
                  nonaktif={i === baris.length - 1}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => geserBaris(s, i, 1));
                  }}
                />
                <TombolIkon
                  nama="trash"
                  label={`Hapus menu ${b.label || ""}`}
                  testid={`navigasi-hapus-${i}`}
                  bahaya
                  nonaktif={baris.length <= 2}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => s.filter((_, k) => k !== i));
                  }}
                />
              </span>
            </div>
            <div className="space-y-2.5">
              <Kolom
                testid={`navigasi-label-${i}`}
                label="Nama menu"
                nilai={b.label}
                onUbah={(v) => isi(i, { label: v })}
                placeholder="Beranda"
              />
              <Pilih
                testid={`navigasi-halaman-${i}`}
                label="Halaman tujuan"
                nilai={b.halaman}
                onUbah={(v) => isi(i, { halaman: v })}
                opsi={opsiUntuk(i)}
                placeholder="Pilih halaman"
              />
              <PemilihIkon
                testidDasar={`navigasi-${i}`}
                nilai={b.ikon}
                onPilih={(ikon) => isi(i, { ikon })}
                jumlahKolom={5}
              />
              <Sakelar
                testid={`navigasi-aktif-${i}`}
                label="Tampilkan di navigasi bawah"
                nilai={b.aktif}
                onUbah={(v) => isi(i, { aktif: v })}
                petunjuk="Menu yang disembunyikan tidak tampil di navigasi bawah, tetapi susunannya tetap tersimpan."
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-testid="tambah-navigasi"
        disabled={baris.length >= 6}
        onClick={() => {
          const dipakai = new Set(baris.map((b) => b.halaman));
          const bebas = data.halaman.find((h) => !dipakai.has(h.nilai));
          setBaris((s) => [
            ...s,
            { halaman: bebas?.nilai ?? "", label: bebas?.label ?? "", ikon: "info", aktif: true },
          ]);
          setKotor(true);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="plus" className="h-3.5 w-3.5 text-gold-600" />
        Tambah menu
      </button>

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Navigasi bawah menampung dua sampai enam menu, dan jumlahnya menyesuaikan lebar layar HP secara otomatis. Menu
        yang disembunyikan tidak dihapus, jadi bisa ditampilkan kembali kapan saja.
      </p>
      <div className="mt-3.5">
        <TombolSimpan testid="simpan-navigasi" sibuk={sibuk} nonaktif={!kotor} onClick={() => void simpan()} />
      </div>
    </div>
  );
}

/* ----------------------------------- footer ----------------------------------- */

type BarisSosial = { id?: string; nama: string; url: string; ikon: string; aktif: boolean };

export function FooterBeranda() {
  const data = useBeranda();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanBeranda);
  const [baris, setBaris] = useState<BarisSosial[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setBaris(
        [...data.sosial]
          .sort((a, b) => a.urutan - b.urutan)
          .map((s) => ({ id: s.id, nama: s.nama, url: s.url, ikon: s.ikon, aktif: s.aktif })),
      );
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.sosial]);

  const isi = (i: number, sebagian: Partial<BarisSosial>) => {
    setKotor(true);
    setBaris((s) => s.map((r, k) => (k === i ? { ...r, ...sebagian } : r)));
  };

  const simpanSemua = async () => {
    const dikenal = new Set(baris.filter((b) => b.id).map((b) => b.id as string));
    const urut: string[] = [];
    const hasil: BarisSosial[] = [];

    for (const b of baris) {
      if (!b.nama.trim() || !b.url.trim()) {
        hasil.push(b);
        continue;
      }
      const muatan = { nama: b.nama.trim(), url: b.url.trim(), ikon: b.ikon, aktif: b.aktif };
      if (b.id) {
        await ubahSosial(b.id, muatan);
        urut.push(b.id);
        hasil.push({ ...b, ...muatan });
      } else {
        const jawab = (await tambahSosial(muatan)) as { sosial?: TautanSosial[] };
        const baru = (jawab.sosial ?? []).find((s) => !dikenal.has(s.id));
        if (baru) {
          dikenal.add(baru.id);
          urut.push(baru.id);
          hasil.push({ ...b, ...muatan, id: baru.id });
        } else {
          hasil.push({ ...b, ...muatan });
        }
      }
    }

    if (urut.length > 0) await urutSosial(urut);
    setBaris(hasil);
  };

  const hapus = async (i: number) => {
    const b = baris[i];
    if (!b.id) {
      setBaris((s) => s.filter((_, k) => k !== i));
      setKotor(true);
      return;
    }
    const setuju = await mintaKonfirmasi(`Hapus tautan ${b.nama || "ini"} dari footer?`, {
      labelYa: "Ya, hapus tautan",
    });
    if (!setuju) return;
    try {
      await hapusSosial(b.id);
      await segarkanBeranda();
      setBaris((s) => s.filter((_, k) => k !== i));
      beritahu("sukses", `Tautan ${b.nama || ""} dihapus.`);
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  const daftar = sosialTampil(data);

  return (
    <div data-testid="admin-footer">
      <div className="mt-4 space-y-6">
        <LayananJamaah />

        <section className="space-y-2.5" data-testid="admin-footer-sosial">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-header text-[13px] font-bold text-ink-900">Media sosial</h2>
              <p className="mt-1 text-justify text-[11px] leading-relaxed text-ink-600">
                Tautan yang tampil sebagai deretan ikon di footer. {daftar.length} tautan sedang tampil dari{" "}
                {baris.length} tautan tersimpan.
              </p>
            </div>
            <TombolSimpan
              testid="simpan-sosial"
              sibuk={sibuk}
              nonaktif={!kotor}
              onClick={() =>
                void jalankan(async () => {
                  await simpanSemua();
                  setKotor(false);
                }, "Tautan media sosial tersimpan.")
              }
            />
          </div>
          {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

          {baris.map((b, i) => (
            <div
              key={b.id ?? `baru-${i}`}
              data-testid={`sosial-baris-${i}`}
              className="rounded-2xl border border-black/[0.08] bg-white p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                  <Icon name={b.ikon} className="h-[14px] w-[14px] text-persis-800" />
                  Tautan {i + 1}
                </span>
                <span className="flex items-center gap-1.5">
                  <TombolIkon
                    nama="chevron"
                    label="Geser ke atas"
                    testid={`sosial-naik-${i}`}
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
                    testid={`sosial-turun-${i}`}
                    putar={90}
                    nonaktif={i === baris.length - 1}
                    onClick={() => {
                      setKotor(true);
                      setBaris((s) => geserBaris(s, i, 1));
                    }}
                  />
                  <TombolIkon
                    nama="trash"
                    label={`Hapus tautan ${b.nama || ""}`}
                    testid={`sosial-hapus-${i}`}
                    bahaya
                    onClick={() => void hapus(i)}
                  />
                </span>
              </div>
              <div className="space-y-2.5">
                <Kolom
                  testid={`sosial-nama-${i}`}
                  label="Nama"
                  nilai={b.nama}
                  onUbah={(v) => isi(i, { nama: v })}
                  placeholder="Instagram"
                />
                <Kolom
                  testid={`sosial-url-${i}`}
                  label="Alamat tautan"
                  nilai={b.url}
                  onUbah={(v) => isi(i, { url: v })}
                  placeholder="https://instagram.com/persiscibatu"
                  petunjuk="Tulis lengkap dengan https:// agar tautan bisa dibuka."
                />
                <PemilihIkon
                  testidDasar={`sosial-${i}`}
                  nilai={b.ikon}
                  onPilih={(ikon) => isi(i, { ikon })}
                  daftar={LABEL_SOSIAL}
                  jumlahKolom={4}
                />
                <Sakelar
                  testid={`sosial-aktif-${i}`}
                  label="Tampilkan di footer"
                  nilai={b.aktif}
                  onUbah={(v) => isi(i, { aktif: v })}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            data-testid="tambah-sosial"
            onClick={() => {
              setBaris((s) => [...s, { nama: "", url: "", ikon: "instagram", aktif: true }]);
              setKotor(true);
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
          >
            <Icon name="plus" className="h-3.5 w-3.5 text-gold-600" />
            Tambah tautan
          </button>
        </section>
      </div>
    </div>
  );
}
