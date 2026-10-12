import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaTeks,
  KepalaBorang,
  Kolom,
  Pesan,
  Sakelar,
  Tanggal,
  TombolIkon,
  TombolSimpan,
} from "../../components/admin/Form";
import { Icon } from "../../components/Icons";
import { gambar } from "../../data/content";
import { hariDariTanggal, segarkanKajian, useKajian, type KajianTampil } from "../../lib/kajian";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { pakaiSimpan } from "../../lib/panelSimpan";
import { tanggalPendek } from "../../lib/format";
import {
  hapusKajian,
  hapusKajianRutin,
  simpanGambarKajian,
  simpanHalamanKajian,
  tambahKajian,
  tambahKajianRutin,
  ubahKajian,
  ubahKajianRutin,
  unggahBerkas,
  urutKajianRutin,
} from "../../lib/admin";

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

const BELUM = "-";

/* ------------------------------ teks halaman ------------------------------ */

export function TeksHalamanKajian() {
  const data = useKajian();
  const { sibuk, pesan, jalankan } = pakaiSimpan(segarkanKajian);
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
    <div data-testid="admin-kajian-teks">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <Kolom
          testid="kajian-judul-halaman"
          label="Judul halaman"
          nilai={nilai.judul}
          onUbah={(v) => ubah("judul", v)}
          placeholder="Kajian"
        />
        <AreaTeks
          testid="kajian-pengantar"
          label="Kalimat pengantar"
          nilai={nilai.pengantar}
          onUbah={(v) => ubah("pengantar", v)}
          baris={6}
        />
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-kajian-teks"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanHalamanKajian(nilai);
              setKotor(false);
            }, "Teks halaman kajian tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ----------------------------- gambar halaman ----------------------------- */

export function GambarHalamanKajian() {
  const data = useKajian();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanKajian);
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
      const hasil = await unggahBerkas(berkas, "kajian");
      await simpanGambarKajian({ gambar_url: hasil.url, gambar_alt: alt });
    }, "Gambar halaman kajian tersimpan dan langsung dipakai.");
  };

  return (
    <div data-testid="admin-kajian-gambar">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <div className="overflow-hidden rounded-2xl border border-black/[0.08]">
          <img src={data.gambar.url || gambar.masjid} alt="" className="h-[168px] w-full object-cover" />
        </div>
        <p className="mt-2.5 text-[10px] break-all text-ink-400">{data.gambar.url || gambar.masjid}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="pilih-gambar-kajian"
            disabled={sibuk}
            onClick={() => berkasRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-persis-900 px-3.5 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            <Icon name="image" className="h-[15px] w-[15px]" />
            {sibuk ? "Mengunggah…" : "Ganti gambar"}
          </button>
          <button
            type="button"
            data-testid="gambar-kajian-bawaan"
            disabled={sibuk}
            onClick={() =>
              void jalankan(
                () => simpanGambarKajian({ gambar_url: gambar.masjid, gambar_alt: alt }),
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
          data-testid="berkas-gambar-kajian"
          onChange={(e) => {
            void pilihBerkas(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="mt-4 space-y-3">
          <Kolom
            testid="isian-kajian-gambar-alt"
            label="Keterangan gambar (alt)"
            nilai={alt}
            onUbah={setAlt}
            petunjuk="Dipakai pembaca layar dan saat gambar gagal dimuat."
          />
          <TombolSimpan
            testid="simpan-kajian-gambar-alt"
            sibuk={sibuk}
            label="Simpan keterangan"
            onClick={() => void jalankan(() => simpanGambarKajian({ gambar_alt: alt }), "Keterangan gambar tersimpan.")}
          />
        </div>
      </div>
    </div>
  );
}

/* --------------------------- jadwal kajian terdekat --------------------------- */

type BorangKajian = {
  id?: string;
  judul: string;
  ustadz: string;
  tanggal: string;
  hari: string;
  waktu: string;
  tempat: string;
  langsung: boolean;
  terbit: boolean;
  /** Penanda: teks hari diisi sendiri oleh pengelola. */
  hariManual: boolean;
};

export function JadwalKajianTerdekat() {
  const data = useKajian();
  const { sibuk, pesan, jalankan } = pakaiSimpan(segarkanKajian);
  const [borang, setBorang] = useState<BorangKajian | null>(null);

  /* Di panel, draf ikut tampil supaya bisa disunting lagi. */
  const daftar = useMemo(
    () => [...data.kajian].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999")),
    [data],
  );
  const [saring, setSaring] = useState<"semua" | "terbit" | "draf">("semua");
  const tampil = daftar.filter((k) => (saring === "semua" ? true : saring === "terbit" ? k.terbit : !k.terbit));

  const keBorang = (k?: KajianTampil) => {
    setBorang(
      k
        ? {
            id: k.id,
            judul: k.title,
            ustadz: k.ustadz,
            tanggal: k.date,
            hari: k.day,
            waktu: k.time,
            tempat: k.place,
            langsung: k.live === true,
            terbit: k.terbit,
            hariManual: true,
          }
        : {
            judul: "",
            ustadz: "",
            tanggal: hariIni(),
            hari: hariDariTanggal(hariIni()),
            waktu: "05.30 WIB",
            tempat: "",
            langsung: false,
            terbit: true,
            hariManual: false,
          },
    );
  };

  const ubah = (sebagian: Partial<BorangKajian>) => setBorang((b) => (b ? { ...b, ...sebagian } : b));

  const gantiTanggal = (iso: string) => {
    setBorang((b) => {
      if (!b) return b;
      /* Teks hari mengikuti tanggal, kecuali sudah diubah sendiri. */
      return { ...b, tanggal: iso, hari: b.hariManual && b.hari.trim() ? b.hari : hariDariTanggal(iso) };
    });
  };

  const simpan = async () => {
    if (!borang) return;
    const muatan = {
      judul: borang.judul,
      ustadz: borang.ustadz,
      hari: borang.hari.trim() || hariDariTanggal(borang.tanggal),
      tanggal: borang.tanggal,
      waktu: borang.waktu,
      tempat: borang.tempat,
      langsung: borang.langsung,
      terbit: borang.terbit,
    };
    const berhasil = await jalankan(
      async () => {
        if (borang.id) await ubahKajian(borang.id, muatan);
        else await tambahKajian(muatan);
      },
      borang.id ? "Jadwal kajian diperbarui." : "Jadwal kajian baru tersimpan.",
    );
    if (berhasil) setBorang(null);
  };

  const hapus = async (k: KajianTampil) => {
    const setuju = await mintaKonfirmasi(`Hapus jadwal "${k.title}"? Tindakan ini tidak bisa dibatalkan.`, {
      labelYa: "Ya, hapus jadwal",
    });
    if (!setuju) return;
    try {
      await hapusKajian(k.id);
      await segarkanKajian();
      beritahu("sukses", "Jadwal kajian dihapus.");
      setBorang(null);
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Gagal menghapus.");
    }
  };

  if (borang) {
    return (
      <div data-testid="admin-kajian-borang">
        <KepalaBorang
          judul={borang.id ? "Ubah Jadwal Kajian" : "Tambah Jadwal Kajian"}
          keterangan="Jadwal yang tersimpan langsung tampil di halaman Kajian, diurutkan dari tanggal paling dekat."
          aksi={
            <button
              type="button"
              data-testid="kajian-kembali"
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
            <h2 className="font-header text-[13px] font-bold text-ink-900">Kajian</h2>
            <Kolom
              testid="kajian-item-judul"
              label="Judul kajian"
              nilai={borang.judul}
              onUbah={(v) => ubah({ judul: v })}
              placeholder="Kajian Ahad Subuh: Tafsir Surah Al-Fatihah"
            />
            <Kolom
              testid="kajian-item-ustadz"
              label="Ustadz / ustadzah"
              nilai={borang.ustadz}
              onUbah={(v) => ubah({ ustadz: v })}
              placeholder="Ust. H. Ahmad Fauzan, Lc., M.A."
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Waktu & tempat</h2>
            <Tanggal
              testid="kajian-item-tanggal"
              label="Tanggal"
              nilai={borang.tanggal}
              onUbah={gantiTanggal}
              petunjuk="Jadwal paling dekat tampil paling atas di situs."
            />
            <Kolom
              testid="kajian-item-hari"
              label="Teks hari"
              nilai={borang.hari}
              onUbah={(v) => ubah({ hari: v, hariManual: true })}
              placeholder="Selasa, 6 Okt 2026"
              petunjuk="Terisi otomatis dari tanggal. Boleh diubah bila ingin format lain."
            />
            <Kolom
              testid="kajian-item-waktu"
              label="Waktu"
              nilai={borang.waktu}
              onUbah={(v) => ubah({ waktu: v })}
              placeholder="05.30 WIB"
            />
            <Kolom
              testid="kajian-item-tempat"
              label="Tempat"
              nilai={borang.tempat}
              onUbah={(v) => ubah({ tempat: v })}
              placeholder="Masjid Al-Furqan Cibatu"
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Penayangan</h2>
            <Sakelar
              testid="kajian-item-langsung"
              label="Tandai “Pekan ini”"
              nilai={borang.langsung}
              onUbah={(v) => ubah({ langsung: v })}
              petunjuk="Memunculkan label kecil Pekan ini pada jadwal di situs."
            />
            <Sakelar
              testid="kajian-item-terbit"
              label="Terbitkan di situs"
              nilai={borang.terbit}
              onUbah={(v) => ubah({ terbit: v })}
              petunjuk="Bila dimatikan, jadwal tersimpan sebagai draf dan tidak tampil di situs."
            />
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <TombolSimpan
              penuh={false}
              testid="simpan-kajian-item"
              sibuk={sibuk}
              nonaktif={!borang.judul.trim()}
              onClick={() => void simpan()}
            />
            {borang.id ? (
              <button
                type="button"
                data-testid="hapus-kajian-borang"
                disabled={sibuk}
                onClick={() => {
                  const asal = data.kajian.find((k) => k.id === borang.id);
                  if (asal) void hapus(asal);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-[11.5px] font-semibold text-rose-700 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="trash" className="h-[15px] w-[15px]" />
                Hapus jadwal
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-kajian-daftar">
      <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
        <button
          type="button"
          data-testid="tambah-kajian"
          onClick={() => keBorang()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 px-4 py-2.5 text-[11.5px] font-semibold text-white transition active:scale-[0.98]"
        >
          <Icon name="plus" className="h-[15px] w-[15px]" />
          Tambah jadwal
        </button>
      </div>
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["semua", `Semua (${daftar.length})`],
            ["terbit", `Terbit (${daftar.filter((k) => k.terbit).length})`],
            ["draf", `Draf (${daftar.filter((k) => !k.terbit).length})`],
          ] as const
        ).map(([nilai, label]) => (
          <button
            key={nilai}
            type="button"
            data-testid={`kajian-saring-${nilai}`}
            aria-pressed={saring === nilai}
            onClick={() => setSaring(nilai)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition active:scale-95 ${
              saring === nilai
                ? "border-persis-900 bg-persis-900 text-white"
                : "border-black/[0.08] bg-white text-ink-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2.5">
        {tampil.map((k) => (
          <div
            key={k.id}
            data-testid={`kajian-baris-${k.id}`}
            className="flex items-start gap-3 rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-persis-700/10 bg-mint-100">
              <span className="text-[9px] font-bold tracking-[0.06em] text-persis-800 uppercase">
                {k.date ? k.date.slice(8, 10) : "—"}
              </span>
              <span className="text-[9px] font-semibold text-persis-900/70">
                {k.date ? tanggalPendek(k.date).split(" ").slice(1, 3).join(" ") : ""}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block text-[11.5px] leading-snug font-semibold text-ink-900">
                {k.title}
              </span>
              <span className="mt-0.5 block text-[10.5px] text-ink-600">{k.ustadz}</span>
              <span className="mt-0.5 block text-[10px] font-semibold text-persis-900">
                {k.day} · {k.time} · {k.place}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                {!k.terbit ? (
                  <span className="inline-block rounded-full bg-pastelgold px-2 py-[2px] text-[9px] font-bold tracking-[0.08em] text-gold-700 uppercase">
                    Draf
                  </span>
                ) : null}
                {k.live ? (
                  <span className="inline-block rounded-full bg-mint-deep px-2 py-[2px] text-[9px] font-bold tracking-[0.08em] text-persis-800 uppercase">
                    Pekan ini
                  </span>
                ) : null}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-stretch gap-1.5">
              <button
                type="button"
                data-testid={`kajian-ubah-${k.id}`}
                onClick={() => keBorang(k)}
                className="rounded-full border border-black/[0.12] px-2.5 py-1.5 text-[10.5px] font-semibold text-persis-900 transition active:scale-[0.98]"
              >
                Ubah
              </button>
              <button
                type="button"
                data-testid={`kajian-hapus-${k.id}`}
                onClick={() => void hapus(k)}
                className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10.5px] font-semibold text-rose-700 transition active:scale-[0.98]"
              >
                Hapus
              </button>
            </span>
          </div>
        ))}
      </div>

      {tampil.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-persis-900/20 p-5 text-center text-[11.5px] text-ink-600">
          {daftar.length === 0
            ? 'Belum ada jadwal kajian. Tekan "Tambah jadwal" untuk menulis jadwal pertama.'
            : "Tidak ada jadwal pada penyaring ini."}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------ kajian rutin ------------------------------ */

type BarisRutin = {
  id?: string;
  hari: string;
  waktu: string;
  judul: string;
  ustadz: string;
  tempat: string;
  aktif: boolean;
};

export function KajianRutinPekanan() {
  const data = useKajian();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanKajian);
  const [baris, setBaris] = useState<BarisRutin[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setBaris(
        data.rutin.map((r) => ({
          id: r.id,
          hari: r.hari,
          waktu: r.waktu,
          judul: r.judul,
          ustadz: r.ustadz,
          tempat: r.tempat,
          aktif: r.aktif,
        })),
      );
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.rutin]);

  const isi = (i: number, sebagian: Partial<BarisRutin>) => {
    setKotor(true);
    setBaris((s) => s.map((r, k) => (k === i ? { ...r, ...sebagian } : r)));
  };

  const simpanSemua = async () => {
    const dikenal = new Set(baris.filter((b) => b.id).map((b) => b.id as string));
    const urut: string[] = [];
    const hasil: BarisRutin[] = [];

    for (const b of baris) {
      if (!b.judul.trim()) {
        hasil.push(b);
        continue;
      }
      const muatan = {
        hari: b.hari.trim() || BELUM,
        waktu: b.waktu,
        judul: b.judul.trim(),
        ustadz: b.ustadz,
        tempat: b.tempat,
        aktif: b.aktif,
      };
      if (b.id) {
        await ubahKajianRutin(b.id, muatan);
        urut.push(b.id);
        hasil.push({ ...b, ...muatan });
      } else {
        const jawab = (await tambahKajianRutin(muatan)) as { rutin?: { id: string }[] };
        const baru = (jawab.rutin ?? []).find((k) => !dikenal.has(k.id));
        if (baru) {
          dikenal.add(baru.id);
          urut.push(baru.id);
          hasil.push({ ...b, ...muatan, id: baru.id });
        } else {
          hasil.push({ ...b, ...muatan });
        }
      }
    }

    if (urut.length > 0) await urutKajianRutin(urut);
    setBaris(hasil);
  };

  const hapus = async (i: number) => {
    const b = baris[i];
    if (!b.id) {
      setBaris((s) => s.filter((_, k) => k !== i));
      setKotor(true);
      return;
    }
    const setuju = await mintaKonfirmasi(`Hapus kajian rutin "${b.judul || "ini"}" dari daftar pekanan?`, {
      labelYa: "Ya, hapus",
    });
    if (!setuju) return;
    try {
      await hapusKajianRutin(b.id);
      await segarkanKajian();
      setBaris((s) => s.filter((_, k) => k !== i));
      beritahu("sukses", "Kajian rutin dihapus.");
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  return (
    <div data-testid="admin-kajian-rutin">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-3">
        {baris.map((b, i) => (
          <div
            key={b.id ?? `baru-${i}`}
            data-testid={`kajian-rutin-baris-${i}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                Urutan {i + 1}
                {b.id ? "" : " · baru"}
              </span>
              <span className="flex items-center gap-1.5">
                <TombolIkon
                  nama="chevron"
                  label="Geser ke atas"
                  testid={`kajian-rutin-naik-${i}`}
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
                  testid={`kajian-rutin-turun-${i}`}
                  putar={90}
                  nonaktif={i === baris.length - 1}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => geserBaris(s, i, 1));
                  }}
                />
                <TombolIkon
                  nama="x"
                  label={`Hapus ${b.judul || "kajian rutin"}`}
                  testid={`kajian-rutin-hapus-${i}`}
                  bahaya
                  onClick={() => void hapus(i)}
                />
              </span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Kolom
                  testid={`kajian-rutin-hari-${i}`}
                  label="Hari"
                  nilai={b.hari}
                  onUbah={(v) => isi(i, { hari: v })}
                  placeholder="Ahad"
                />
                <Kolom
                  testid={`kajian-rutin-waktu-${i}`}
                  label="Waktu"
                  nilai={b.waktu}
                  onUbah={(v) => isi(i, { waktu: v })}
                  placeholder="05.30 WIB"
                />
              </div>
              <Kolom
                testid={`kajian-rutin-judul-${i}`}
                label="Judul kajian"
                nilai={b.judul}
                onUbah={(v) => isi(i, { judul: v })}
                placeholder="Tafsir Al-Qur'an (Ahad Subuh)"
              />
              <Kolom
                testid={`kajian-rutin-ustadz-${i}`}
                label="Ustadz / ustadzah"
                nilai={b.ustadz}
                onUbah={(v) => isi(i, { ustadz: v })}
                placeholder="Ust. H. Ahmad Fauzan, Lc., M.A."
              />
              <Kolom
                testid={`kajian-rutin-tempat-${i}`}
                label="Tempat"
                nilai={b.tempat}
                onUbah={(v) => isi(i, { tempat: v })}
                placeholder="Masjid Al-Furqan Cibatu"
              />
              <Sakelar
                testid={`kajian-rutin-aktif-${i}`}
                label="Tampilkan di situs"
                nilai={b.aktif}
                onUbah={(v) => isi(i, { aktif: v })}
                petunjuk="Bila dimatikan, kajian rutin ini disembunyikan dari halaman Kajian."
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-testid="tambah-kajian-rutin"
        onClick={() => {
          setBaris((s) => [...s, { hari: "", waktu: "", judul: "", ustadz: "", tempat: "", aktif: true }]);
          setKotor(true);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="plus" className="h-3.5 w-3.5 text-gold-600" />
        Tambah kajian rutin
      </button>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-kajian-rutin"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanSemua();
              setKotor(false);
            }, "Kajian rutin tersimpan.")
          }
        />
      </div>
    </div>
  );
}
