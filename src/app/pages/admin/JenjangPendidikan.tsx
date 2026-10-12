import { useEffect, useRef, useState } from "react";
import { AreaTeks, Kolom, Pesan, TombolIkon, TombolSimpan } from "../../components/admin/Form";
import { Icon } from "../../components/Icons";
import { gambar } from "../../data/content";
import { segarkanJenjang, useJenjang } from "../../lib/jenjang";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import {
  hapusJenjang,
  simpanHalamanJenjang,
  tambahJenjang,
  ubahJenjang,
  unggahBerkas,
  urutJenjang,
} from "../../lib/admin";

type Status = { tipe: "sukses" | "galat"; teks: string } | null;

function pakaiSimpan(jenjang = false) {
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<Status>(null);

  const jalankan = async (kerja: () => Promise<unknown>, sukses: string) => {
    setSibuk(true);
    setPesan(null);
    try {
      await kerja();
      await (jenjang ? segarkanJenjang() : segarkanJenjang());
      /* Berhasil: cukup pemberitahuan singkat di atas layar. */
      beritahu("sukses", sukses);
      return true;
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menyimpan." });
      return false;
    } finally {
      setSibuk(false);
    }
  };

  return { sibuk, pesan, jalankan, setPesan };
}

/* ------------------------ Teks deskripsi halaman ------------------------ */

export function TeksHalamanJenjang() {
  const data = useJenjang();
  const { sibuk, pesan, jalankan } = pakaiSimpan();
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
    <div data-testid="admin-jenjang-teks">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
      <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <Kolom
          testid="isian-jenjang-judul"
          label="Judul halaman"
          nilai={nilai.judul}
          onUbah={(v) => ubah("judul", v)}
          placeholder="Jenjang Pendidikan"
        />
        <AreaTeks
          testid="isian-jenjang-pengantar"
          label="Teks deskripsi halaman"
          nilai={nilai.pengantar}
          onUbah={(v) => ubah("pengantar", v)}
          baris={6}
          petunjuk="Tampil sebagai paragraf pengantar tepat di bawah gambar halaman."
        />
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-jenjang-teks"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanHalamanJenjang(nilai);
              setKotor(false);
            }, "Teks halaman jenjang tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* --------------------------- Gambar halaman --------------------------- */

export function GambarHalamanJenjang() {
  const data = useJenjang();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan();
  const [alt, setAlt] = useState(data.halaman.gambarAlt);
  const [terisi, setTerisi] = useState(false);
  const berkasRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setAlt(data.halaman.gambarAlt);
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.halaman.gambarAlt]);

  const pilihBerkas = async (berkas: File | undefined) => {
    if (!berkas) return;
    if (berkas.size > 25 * 1024 * 1024) {
      setPesan({ tipe: "galat", teks: "Berkas terlalu besar. Batas maksimal 25 MB." });
      return;
    }
    await jalankan(async () => {
      const hasil = await unggahBerkas(berkas, "jenjang");
      await simpanHalamanJenjang({ gambar_url: hasil.url, gambar_alt: alt });
    }, "Gambar halaman tersimpan dan langsung dipakai.");
  };

  return (
    <div data-testid="admin-jenjang-gambar">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <div className="overflow-hidden rounded-2xl border border-black/[0.08]">
          <img src={data.halaman.gambar || gambar.kelas1} alt="" className="h-[168px] w-full object-cover" />
        </div>
        <p className="mt-2.5 text-[10px] break-all text-ink-400">{data.halaman.gambar || gambar.kelas1}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="pilih-gambar-jenjang"
            disabled={sibuk}
            onClick={() => berkasRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-persis-900 px-3.5 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            <Icon name="image" className="h-[15px] w-[15px]" />
            {sibuk ? "Mengunggah…" : "Ganti gambar"}
          </button>
          <button
            type="button"
            data-testid="gambar-jenjang-bawaan"
            disabled={sibuk}
            onClick={() =>
              void jalankan(
                () => simpanHalamanJenjang({ gambar_url: gambar.kelas1, gambar_alt: alt }),
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
          data-testid="berkas-gambar-jenjang"
          onChange={(e) => {
            void pilihBerkas(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="mt-4 space-y-3">
          <Kolom
            testid="isian-gambar-alt"
            label="Keterangan gambar (alt)"
            nilai={alt}
            onUbah={setAlt}
            petunjuk="Dipakai pembaca layar dan saat gambar gagal dimuat."
          />
          <TombolSimpan
            testid="simpan-gambar-alt"
            sibuk={sibuk}
            label="Simpan keterangan"
            onClick={() =>
              void jalankan(() => simpanHalamanJenjang({ gambar_alt: alt }), "Keterangan gambar tersimpan.")
            }
          />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Nama jenjang ----------------------------- */

type BarisJenjang = {
  id?: string;
  slug?: string;
  short: string;
  nama: string;
  tagline: string;
  jumlahUnit: number;
};

export function NamaJenjang() {
  const data = useJenjang();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(true);
  const [baris, setBaris] = useState<BarisJenjang[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setBaris(
        data.jenjang.map((j) => ({
          id: j.id,
          slug: j.slug,
          short: j.short,
          nama: j.nama,
          tagline: j.tagline,
          jumlahUnit: j.jumlahUnit,
        })),
      );
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.jenjang]);

  const geser = (i: number, arah: -1 | 1) => {
    const j = i + arah;
    if (j < 0 || j >= baris.length) return;
    const baru = [...baris];
    [baru[i], baru[j]] = [baru[j], baru[i]];
    setBaris(baru);
    setKotor(true);
  };

  const simpanSemua = async () => {
    const idDiketahui = new Set(baris.filter((b) => b.id).map((b) => b.id as string));
    const urut: string[] = [];
    const hasil: BarisJenjang[] = [];

    for (const b of baris) {
      const nama = b.nama.trim();
      const short = b.short.trim();
      const tagline = b.tagline.trim();
      if (!nama) {
        hasil.push(b);
        continue;
      }
      if (b.id) {
        await ubahJenjang(b.id, { nama, singkatan: short, tagline });
        urut.push(b.id);
        hasil.push({ ...b, nama, short, tagline });
      } else {
        const jawab = (await tambahJenjang({ nama, singkatan: short, tagline })) as {
          jenjang?: { id: string }[];
        };
        const baru = (jawab.jenjang ?? []).find((p) => !idDiketahui.has(p.id));
        if (baru) {
          idDiketahui.add(baru.id);
          urut.push(baru.id);
          hasil.push({ ...b, id: baru.id, slug: baru.id, nama, short, tagline, jumlahUnit: 0 });
        } else {
          hasil.push({ ...b, nama, short, tagline });
        }
      }
    }

    if (urut.length > 0) await urutJenjang(urut);
    /* Baris baru sudah punya id; borang tidak perlu diisi ulang. */
    setBaris(hasil);
  };

  return (
    <div data-testid="admin-jenjang-nama">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {baris.map((b, i) => (
          <div
            key={b.id ?? `baru-${i}`}
            data-testid={`jenjang-baris-${i}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                Urutan {i + 1}
                {b.id ? ` · ${b.jumlahUnit} unit` : " · baru"}
              </span>
              <span className="flex items-center gap-1.5">
                <TombolIkon
                  nama="chevron"
                  label="Geser ke atas"
                  testid={`jenjang-naik-${i}`}
                  putar={-90}
                  onClick={() => geser(i, -1)}
                  nonaktif={i === 0}
                />
                <TombolIkon
                  nama="chevron"
                  label="Geser ke bawah"
                  testid={`jenjang-turun-${i}`}
                  putar={90}
                  onClick={() => geser(i, 1)}
                  nonaktif={i === baris.length - 1}
                />
                <TombolIkon
                  nama="x"
                  label={`Hapus ${b.nama || "jenjang"}`}
                  testid={`jenjang-hapus-${i}`}
                  bahaya
                  onClick={async () => {
                    if (b.id) {
                      const setuju = await mintaKonfirmasi(
                        `Hapus jenjang ${b.nama || "ini"} dari daftar? Jenjang yang masih dipakai tidak akan terhapus, pesannya akan muncul.`,
                        { labelYa: "Ya, hapus jenjang" },
                      );
                      if (!setuju) return;
                      try {
                        await hapusJenjang(b.id);
                        await segarkanJenjang();
                        setBaris((s) => s.filter((_, k) => k !== i));
                        beritahu("sukses", `${b.nama || "Jenjang"} dihapus.`);
                        setPesan(null);
                      } catch (e) {
                        setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
                      }
                    } else {
                      setBaris((s) => s.filter((_, k) => k !== i));
                    }
                  }}
                />
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="grid grid-cols-[88px_1fr] gap-2.5">
                <Kolom
                  testid={`jenjang-singkatan-${i}`}
                  label="Singkatan"
                  nilai={b.short}
                  onUbah={(v) => {
                    setKotor(true);
                    setBaris((s) => s.map((r, k) => (k === i ? { ...r, short: v } : r)));
                  }}
                  placeholder="MI"
                />
                <Kolom
                  testid={`jenjang-nama-${i}`}
                  label="Nama jenjang"
                  nilai={b.nama}
                  onUbah={(v) => {
                    setKotor(true);
                    setBaris((s) => s.map((r, k) => (k === i ? { ...r, nama: v } : r)));
                  }}
                  placeholder="Madrasah Ibtidaiyah (MI)"
                />
              </div>
              {/* Teks kecil di bawah nama jenjang pada kartu. */}
              <label className="block rounded-xl bg-cream-50/70 px-3 py-2.5">
                <span className="text-[10px] font-semibold tracking-[0.1em] text-ink-400 uppercase">
                  Teks kecil di bawah nama
                </span>
                <input
                  type="text"
                  data-testid={`jenjang-tagline-${i}`}
                  className="mt-1.5 w-full rounded-lg border border-black/[0.10] bg-white px-3 py-2 text-[11.5px] leading-relaxed text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40 focus:ring-2 focus:ring-persis-800/10"
                  value={b.tagline}
                  placeholder="Kelas 1 – 6 · Kurikulum Kemenag & tahfizh juz 30"
                  onChange={(e) => {
                    setKotor(true);
                    setBaris((s) => s.map((r, k) => (k === i ? { ...r, tagline: e.target.value } : r)));
                  }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-testid="tambah-jenjang"
        onClick={() => {
          setBaris((s) => [...s, { short: "", nama: "", tagline: "", jumlahUnit: 0 }]);
          setKotor(true);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="school" className="h-[14px] w-[14px] text-gold-600" />
        Tambah jenjang
      </button>

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Jenjang yang masih memiliki unit, jurusan, mata pelajaran, atau santri tidak bisa dihapus — pesannya akan muncul
        dan sebutkan jumlah datanya. Jenjang baru akan tampil di halaman sesuai urutannya setelah nama dan singkatannya
        diisi lalu disimpan. Rincian lain tiap jenjang (jumlah siswa, gambar, pengantar, dan fasilitas) menyusul pada
        menu berikutnya.
      </p>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-jenjang-nama"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanSemua();
              setKotor(false);
            }, "Nama jenjang tersimpan.")
          }
        />
      </div>
    </div>
  );
}
