import { useEffect, useRef, useState } from "react";
import { AreaTeks, Kolom, Pesan, TombolIkon, TombolSimpan } from "../../components/admin/Form";
import { Icon } from "../../components/Icons";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { useProfil, segarkanProfil } from "../../lib/profil";
import {
  hapusPengurus,
  simpanIdentitas,
  simpanLayanan,
  simpanLogo,
  simpanProfil,
  tambahPengurus,
  ubahPengurus,
  unggahBerkas,
  urutPengurus,
} from "../../lib/admin";

type Status = { tipe: "sukses" | "galat"; teks: string } | null;

/** Isian borang yang terisi otomatis saat data profil selesai dimuat. */
function useIsian<T extends Record<string, string>>(awal: T, siap: boolean) {
  const [nilai, setNilai] = useState<T>(awal);
  const [kotor, setKotor] = useState(false);
  const [terisi, setTerisi] = useState(false);

  useEffect(() => {
    if (siap && !kotor && !terisi) {
      setNilai(awal);
      setTerisi(true);
    }
  }, [siap, kotor, terisi, awal]);

  const ubah = (kunci: keyof T, isi: string) => {
    setKotor(true);
    setNilai((v) => ({ ...v, [kunci]: isi }));
  };

  return { nilai, ubah, kotor, setKotor, tandaiBersih: () => setKotor(false) };
}

/** Daftar teks (paragraf/poin) yang bisa ditambah, digeser, dan dihapus. */
function DaftarTeks({
  label,
  nilai,
  onUbah,
  baris = 3,
  teksTambah = "Tambah poin",
}: {
  label: string;
  nilai: string[];
  onUbah: (v: string[]) => void;
  baris?: number;
  teksTambah?: string;
}) {
  const geser = (i: number, arah: -1 | 1) => {
    const baru = [...nilai];
    const j = i + arah;
    if (j < 0 || j >= baru.length) return;
    [baru[i], baru[j]] = [baru[j], baru[i]];
    onUbah(baru);
  };

  return (
    <div className="space-y-2.5">
      <span className="field-label">{label}</span>
      {nilai.map((teks, i) => (
        <div key={i} className="rounded-2xl border border-black/[0.08] bg-cream-50/60 p-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">Bagian {i + 1}</span>
            <span className="flex items-center gap-1.5">
              <TombolIkon
                nama="chevron"
                label="Geser ke atas"
                testid={`geser-naik-${i}`}
                putar={-90}
                onClick={() => geser(i, -1)}
                nonaktif={i === 0}
              />
              <TombolIkon
                nama="chevron"
                label="Geser ke bawah"
                testid={`geser-turun-${i}`}
                putar={90}
                onClick={() => geser(i, 1)}
                nonaktif={i === nilai.length - 1}
              />
              <TombolIkon
                nama="x"
                label={`Hapus bagian ${i + 1}`}
                testid={`hapus-bagian-${i}`}
                bahaya
                onClick={() => onUbah(nilai.filter((_, k) => k !== i))}
              />
            </span>
          </div>
          <textarea
            data-testid={`isi-bagian-${i}`}
            className="w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2.5 text-justify text-[12.5px] leading-relaxed text-ink-900 outline-none focus:border-persis-800/40 focus:ring-2 focus:ring-persis-800/10"
            rows={baris}
            value={teks}
            onChange={(e) => onUbah(nilai.map((t, k) => (k === i ? e.target.value : t)))}
          />
        </div>
      ))}
      <button
        type="button"
        data-testid="tambah-bagian"
        onClick={() => onUbah([...nilai, ""])}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="sparkle" className="h-[14px] w-[14px] text-gold-600" />
        {teksTambah}
      </button>
    </div>
  );
}

function pakaiSimpan() {
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<Status>(null);

  const jalankan = async (kerja: () => Promise<unknown>, sukses: string) => {
    setSibuk(true);
    setPesan(null);
    try {
      await kerja();
      await segarkanProfil();
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

/* ---------------------------- Nama lembaga ---------------------------- */

export function NamaLembaga() {
  const data = useProfil();
  const { sibuk, pesan, jalankan } = pakaiSimpan();
  const { nilai, ubah, kotor, tandaiBersih } = useIsian(
    {
      pimpinan: data.identitas.pimpinan,
      nama: data.identitas.nama,
      namaLengkap: data.identitas.namaLengkap,
      wilayah: data.identitas.wilayah,
      wilayahLengkap: data.identitas.wilayahLengkap,
    },
    data.dariDatabase,
  );

  return (
    <div data-testid="admin-nama-lembaga">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
      <div className="mt-4 space-y-3">
        <Kolom
          testid="isian-namaLengkap"
          label="Nama lengkap lembaga"
          nilai={nilai.namaLengkap}
          onUbah={(v) => ubah("namaLengkap", v)}
          placeholder="Persatuan Islam (PERSIS) Cibatu"
        />
        <Kolom
          testid="isian-nama"
          label="Nama singkat"
          nilai={nilai.nama}
          onUbah={(v) => ubah("nama", v)}
          placeholder="Persatuan Islam (PERSIS)"
          petunjuk="Dipakai pada kepala situs bila ruang terbatas."
        />
        <Kolom
          testid="isian-pimpinan"
          label="Sebutan pimpinan"
          nilai={nilai.pimpinan}
          onUbah={(v) => ubah("pimpinan", v)}
          placeholder="Pimpinan Cabang"
        />
        <Kolom
          testid="isian-wilayah"
          label="Wilayah kerja"
          nilai={nilai.wilayah}
          onUbah={(v) => ubah("wilayah", v)}
          placeholder="Cibatu – Garut"
        />
        <Kolom
          testid="isian-wilayahLengkap"
          label="Wilayah lengkap"
          nilai={nilai.wilayahLengkap}
          onUbah={(v) => ubah("wilayahLengkap", v)}
          placeholder="Cibatu · Garut · Jawa Barat"
        />
      </div>
      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Perubahan langsung dipakai situs setelah disimpan: kepala situs menampilkan sebutan pimpinan, nama singkat, dan
        wilayah; halaman profil menampilkan nama lengkap dan wilayah lengkap.
      </p>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-nama"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanIdentitas(nilai);
              tandaiBersih();
            }, "Nama lembaga tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* -------------------------------- Logo -------------------------------- */

export function LogoLembaga() {
  const data = useProfil();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan();
  const [alt, setAlt] = useState(data.identitas.logoAlt ?? "Logo lembaga");
  const [terisi, setTerisi] = useState(false);
  const berkasRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setAlt(data.identitas.logoAlt ?? "Logo Persatuan Islam (PERSIS)");
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.identitas.logoAlt]);

  const pilihBerkas = async (berkas: File | undefined) => {
    if (!berkas) return;
    if (berkas.size > 25 * 1024 * 1024) {
      setPesan({ tipe: "galat", teks: "Berkas terlalu besar. Batas maksimal 25 MB." });
      return;
    }
    await jalankan(async () => {
      const hasil = await unggahBerkas(berkas, "logo");
      await simpanLogo(hasil.url, alt);
    }, "Logo tersimpan dan langsung dipakai di situs.");
  };

  return (
    <div data-testid="admin-logo">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <div className="flex items-center gap-4">
          <span className="grid h-[84px] w-[84px] shrink-0 place-items-center rounded-2xl border border-black/[0.08] bg-persis-900/[0.04]">
            <img src={data.identitas.logo} alt="" className="max-h-[70px] max-w-[70px] object-contain" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-ink-900">Logo yang dipakai sekarang</p>
            <p className="mt-1 truncate text-[10px] text-ink-400">{data.identitas.logo}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="pilih-logo"
                disabled={sibuk}
                onClick={() => berkasRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-persis-900 px-3.5 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="image" className="h-[15px] w-[15px]" />
                {sibuk ? "Mengunggah…" : "Ganti logo"}
              </button>
              <button
                type="button"
                data-testid="logo-bawaan"
                disabled={sibuk}
                onClick={() => void jalankan(() => simpanLogo("/logo-persis.png", alt), "Logo bawaan dipakai kembali.")}
                className="rounded-full border border-black/[0.12] px-3.5 py-2 text-[11.5px] font-semibold text-persis-900 transition active:scale-[0.98] disabled:opacity-50"
              >
                Pakai logo bawaan
              </button>
            </div>
          </div>
        </div>

        <input
          ref={berkasRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          data-testid="berkas-logo"
          onChange={(e) => {
            void pilihBerkas(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="mt-4">
          <Kolom
            testid="isian-logo-alt"
            label="Keterangan gambar (alt)"
            nilai={alt}
            onUbah={setAlt}
            petunjuk="Dipakai pembaca layar dan saat logo gagal dimuat. Tekan simpan setelah diubah."
          />
        </div>
        <div className="mt-3">
          <TombolSimpan
            testid="simpan-logo-alt"
            sibuk={sibuk}
            onClick={() => void jalankan(() => simpanLogo(data.identitas.logo, alt), "Keterangan logo tersimpan.")}
          />
        </div>
      </div>

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Format yang diterima: PNG, JPG, WEBP, atau SVG. Ukuran paling nyaman di bawah 500 KB dengan bentuk persegi agar
        tidak terpotong di kepala situs.
      </p>
    </div>
  );
}

/* ---------------------------- Profil singkat ---------------------------- */

export function ProfilSingkat() {
  const data = useProfil();
  const { sibuk, pesan, jalankan } = pakaiSimpan();
  const [nilai, setNilai] = useState<string[]>(data.profil.summary);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setNilai(data.profil.summary);
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.profil.summary]);

  return (
    <div data-testid="admin-profil-singkat">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <DaftarTeks
          label="Paragraf profil singkat"
          nilai={nilai}
          baris={4}
          teksTambah="Tambah paragraf"
          onUbah={(v) => {
            setKotor(true);
            setNilai(v);
          }}
        />
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-profil-singkat"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanProfil({ ringkasan: nilai });
              setKotor(false);
            }, "Profil singkat tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ------------------------------- Semboyan ------------------------------- */

export function Semboyan() {
  const data = useProfil();
  const { sibuk, pesan, jalankan } = pakaiSimpan();
  const { nilai, ubah, kotor, tandaiBersih } = useIsian({ motto: data.profil.motto }, data.dariDatabase);

  return (
    <div data-testid="admin-semboyan">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
      <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <AreaTeks
          testid="isian-motto"
          label="Semboyan"
          nilai={nilai.motto}
          onUbah={(v) => ubah("motto", v)}
          baris={2}
          placeholder="Iman, Ilmu, dan Amal"
          petunjuk="Usahakan maksimal satu baris, tanpa tanda kutip."
        />
        <div className="rounded-2xl border border-gold-400/30 bg-cream-50 p-4 text-center">
          <p className="text-[9px] font-semibold tracking-[0.16em] text-gold-600 uppercase">Pratinjau</p>
          <p className="mt-1.5 text-[14px] leading-relaxed font-extrabold text-persis-900">{nilai.motto || "—"}</p>
        </div>
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-semboyan"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanProfil({ motto: nilai.motto });
              tandaiBersih();
            }, "Semboyan tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* --------------------------------- Visi --------------------------------- */

export function Visi() {
  const data = useProfil();
  const { sibuk, pesan, jalankan } = pakaiSimpan();
  const { nilai, ubah, kotor, tandaiBersih } = useIsian({ visi: data.profil.visi }, data.dariDatabase);

  return (
    <div data-testid="admin-visi">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <AreaTeks
          testid="isian-visi"
          label="Isi visi"
          nilai={nilai.visi}
          onUbah={(v) => ubah("visi", v)}
          baris={5}
          petunjuk="Tulis dalam satu paragraf yang utuh."
        />
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-visi"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanProfil({ visi: nilai.visi });
              tandaiBersih();
            }, "Visi tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* -------------------------------- Misi -------------------------------- */

export function Misi() {
  const data = useProfil();
  const { sibuk, pesan, jalankan } = pakaiSimpan();
  const [nilai, setNilai] = useState<string[]>(data.profil.misi);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setNilai(data.profil.misi);
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.profil.misi]);

  return (
    <div data-testid="admin-misi">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <DaftarTeks
          label="Poin misi"
          nilai={nilai}
          baris={3}
          teksTambah="Tambah poin misi"
          onUbah={(v) => {
            setKotor(true);
            setNilai(v);
          }}
        />
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-misi"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanProfil({ misi: nilai });
              setKotor(false);
            }, "Misi tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* --------------------------- Susunan pengurus --------------------------- */

type BarisPengurus = { id?: string; nama: string; jabatan: string };

export function Pengurus() {
  const data = useProfil();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan();
  const [baris, setBaris] = useState<BarisPengurus[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setBaris(data.pengurus.map((p) => ({ id: p.id, nama: p.nama, jabatan: p.jabatan })));
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.pengurus]);

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
    let gagal: string | null = null;

    for (const b of baris) {
      const nama = b.nama.trim();
      const jabatan = b.jabatan.trim();
      if (b.id) {
        if (nama && jabatan) {
          try {
            await ubahPengurus(b.id, { nama, jabatan });
          } catch (e) {
            gagal = e instanceof Error ? e.message : "Gagal menyimpan pengurus.";
          }
        }
        urut.push(b.id);
      } else if (nama && jabatan) {
        const jawab = (await tambahPengurus({ nama, jabatan })) as {
          pengurus?: { id: string }[];
        };
        const baru = (jawab.pengurus ?? []).find((p) => !idDiketahui.has(p.id));
        if (baru) {
          idDiketahui.add(baru.id);
          urut.push(baru.id);
        }
      }
    }

    if (gagal) throw new Error(gagal);
    if (urut.length > 0) await urutPengurus(urut);
  };

  return (
    <div data-testid="admin-pengurus">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {baris.map((b, i) => (
          <div
            key={b.id ?? `baru-${i}`}
            data-testid={`pengurus-baris-${i}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">Urutan {i + 1}</span>
              <span className="flex items-center gap-1.5">
                <TombolIkon
                  nama="chevron"
                  label="Geser ke atas"
                  testid={`pengurus-naik-${i}`}
                  putar={-90}
                  onClick={() => geser(i, -1)}
                  nonaktif={i === 0}
                />
                <TombolIkon
                  nama="chevron"
                  label="Geser ke bawah"
                  testid={`pengurus-turun-${i}`}
                  putar={90}
                  onClick={() => geser(i, 1)}
                  nonaktif={i === baris.length - 1}
                />
                <TombolIkon
                  nama="x"
                  label={`Hapus pengurus ${b.nama || i + 1}`}
                  testid={`pengurus-hapus-${i}`}
                  bahaya
                  onClick={async () => {
                    if (b.id) {
                      const setuju = await mintaKonfirmasi(`Hapus ${b.nama || "pengurus ini"} dari susunan pengurus?`, {
                        labelYa: "Ya, hapus",
                      });
                      if (!setuju) return;
                      try {
                        await hapusPengurus(b.id);
                        await segarkanProfil();
                        setBaris((s) => s.filter((_, k) => k !== i));
                        beritahu("sukses", `${b.nama || "Pengurus"} dihapus dari susunan pengurus.`);
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
              <Kolom
                testid={`pengurus-nama-${i}`}
                label="Nama"
                nilai={b.nama}
                onUbah={(v) => {
                  setKotor(true);
                  setBaris((s) => s.map((r, k) => (k === i ? { ...r, nama: v } : r)));
                }}
                placeholder="Ust. H. Ahmad Fauzan, Lc., M.A."
              />
              <Kolom
                testid={`pengurus-jabatan-${i}`}
                label="Jabatan"
                nilai={b.jabatan}
                onUbah={(v) => {
                  setKotor(true);
                  setBaris((s) => s.map((r, k) => (k === i ? { ...r, jabatan: v } : r)));
                }}
                placeholder="Ketua Pimpinan Cabang"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-testid="tambah-pengurus"
        onClick={() => {
          setBaris((s) => [...s, { nama: "", jabatan: "" }]);
          setKotor(true);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="users" className="h-[14px] w-[14px] text-gold-600" />
        Tambah pengurus
      </button>

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Baris baru akan tersimpan setelah nama dan jabatannya diisi, lalu tekan Simpan.
      </p>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-pengurus"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanSemua();
              setKotor(false);
            }, "Susunan pengurus tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ---------------------------- Layanan jamaah ---------------------------- */

export function LayananJamaah() {
  const data = useProfil();
  const { sibuk, pesan, jalankan } = pakaiSimpan();
  const { nilai, ubah, kotor, tandaiBersih } = useIsian(
    {
      alamat: data.identitas.alamat,
      telepon: data.identitas.telepon,
      whatsapp: data.identitas.whatsapp,
      email: data.identitas.email,
      jam: data.identitas.jam,
    },
    data.dariDatabase,
  );

  return (
    <div data-testid="admin-layanan">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
      <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <AreaTeks
          testid="isian-alamat"
          label="Alamat sekretariat"
          nilai={nilai.alamat}
          onUbah={(v) => ubah("alamat", v)}
          baris={2}
          placeholder="Jl. Raya Cibatu No. 12, Kec. Cibatu, Kab. Garut"
        />
        <Kolom
          testid="isian-telepon"
          label="Telepon sekretariat"
          nilai={nilai.telepon}
          onUbah={(v) => ubah("telepon", v)}
          placeholder="(0262) 555-1234"
        />
        <Kolom
          testid="isian-whatsapp"
          label="Nomor WhatsApp"
          nilai={nilai.whatsapp}
          onUbah={(v) => ubah("whatsapp", v)}
          placeholder="0812-3456-7890"
          petunjuk="Dipakai tombol WhatsApp di footer dan halaman kontak."
        />
        <Kolom
          testid="isian-email"
          label="Surel (email)"
          nilai={nilai.email}
          onUbah={(v) => ubah("email", v)}
          placeholder="sekretariat@persiscibatu.or.id"
        />
        <Kolom
          testid="isian-jam"
          label="Jam layanan"
          nilai={nilai.jam}
          onUbah={(v) => ubah("jam", v)}
          placeholder="Senin – Jumat, 07.30 – 15.30 WIB"
        />
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-layanan"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanLayanan(nilai);
              tandaiBersih();
            }, "Layanan jamaah tersimpan.")
          }
        />
      </div>
    </div>
  );
}
