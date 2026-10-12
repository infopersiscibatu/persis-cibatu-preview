import { useEffect, useRef, useState } from "react";
import { AreaTeks, Kolom, Pesan, Sakelar, TombolIkon, TombolSimpan } from "../../components/admin/Form";
import { Icon } from "../../components/Icons";
import { gambar } from "../../data/content";
import { segarkanKontak, useKontak } from "../../lib/kontak";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { pakaiSimpan } from "../../lib/panelSimpan";
import {
  hapusTopikKontak,
  simpanAlamatKontak,
  simpanFormulirKontak,
  simpanGambarKontak,
  simpanHalamanKontak,
  tambahTopikKontak,
  ubahTopikKontak,
  unggahBerkas,
  urutTopikKontak,
} from "../../lib/admin";
import { LayananSpmb } from "./Spmb";

/** Pindahkan satu baris pada daftar. */
function geserBaris<T>(daftar: T[], i: number, arah: -1 | 1): T[] {
  const j = i + arah;
  if (j < 0 || j >= daftar.length) return daftar;
  const salinan = [...daftar];
  [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
  return salinan;
}

const tautanPeta = (tujuan: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tujuan)}`;

/* ------------------------------ teks halaman ------------------------------ */

export function TeksHalamanKontak() {
  const data = useKontak();
  const { sibuk, pesan, jalankan } = pakaiSimpan(segarkanKontak);
  const [nilai, setNilai] = useState({
    judul: data.halaman.judul,
    subjudul: data.halaman.subjudul,
    pengantar: data.halaman.pengantar,
  });
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setNilai({
        judul: data.halaman.judul,
        subjudul: data.halaman.subjudul,
        pengantar: data.halaman.pengantar,
      });
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.halaman]);

  const ubah = (kunci: "judul" | "subjudul" | "pengantar", isi: string) => {
    setKotor(true);
    setNilai((v) => ({ ...v, [kunci]: isi }));
  };

  return (
    <div data-testid="admin-kontak-teks">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <Kolom
          testid="kontak-judul-halaman"
          label="Judul halaman"
          nilai={nilai.judul}
          onUbah={(v) => ubah("judul", v)}
          placeholder="Kontak"
        />
        <Kolom
          testid="kontak-subjudul"
          label="Tulisan kecil di bawah judul"
          nilai={nilai.subjudul}
          onUbah={(v) => ubah("subjudul", v)}
          placeholder="Sekretariat & Layanan"
        />
        <AreaTeks
          testid="kontak-pengantar"
          label="Kalimat pengantar"
          nilai={nilai.pengantar}
          onUbah={(v) => ubah("pengantar", v)}
          baris={6}
        />
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-kontak-teks"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanHalamanKontak(nilai);
              setKotor(false);
            }, "Teks halaman kontak tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ----------------------------- gambar halaman ----------------------------- */

export function GambarHalamanKontak() {
  const data = useKontak();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanKontak);
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
      const hasil = await unggahBerkas(berkas, "kontak");
      await simpanGambarKontak({ gambar_url: hasil.url, gambar_alt: alt });
    }, "Gambar halaman kontak tersimpan dan langsung dipakai.");
  };

  return (
    <div data-testid="admin-kontak-gambar">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <div className="overflow-hidden rounded-2xl border border-black/[0.08]">
          <img src={data.halaman.gambarUrl || gambar.masjidJabar} alt="" className="h-[168px] w-full object-cover" />
        </div>
        <p className="mt-2.5 text-[10px] break-all text-ink-400">{data.halaman.gambarUrl || gambar.masjidJabar}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="pilih-gambar-kontak"
            disabled={sibuk}
            onClick={() => berkasRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-persis-900 px-3.5 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            <Icon name="image" className="h-[15px] w-[15px]" />
            {sibuk ? "Mengunggah…" : "Ganti gambar"}
          </button>
          <button
            type="button"
            data-testid="gambar-kontak-bawaan"
            disabled={sibuk}
            onClick={() =>
              void jalankan(
                () => simpanGambarKontak({ gambar_url: gambar.masjidJabar, gambar_alt: alt }),
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
          data-testid="berkas-gambar-kontak"
          onChange={(e) => {
            void pilihBerkas(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="mt-4 space-y-3">
          <Kolom
            testid="kontak-gambar-alt"
            label="Keterangan gambar (alt)"
            nilai={alt}
            onUbah={setAlt}
            petunjuk="Dipakai pembaca layar dan saat gambar gagal dimuat."
          />
          <TombolSimpan
            testid="simpan-kontak-gambar-alt"
            sibuk={sibuk}
            label="Simpan keterangan"
            onClick={() => void jalankan(() => simpanGambarKontak({ gambar_alt: alt }), "Keterangan gambar tersimpan.")}
          />
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- alamat --------------------------------- */

export function AlamatKontak() {
  const data = useKontak();
  const { sibuk, pesan, jalankan } = pakaiSimpan(segarkanKontak);
  const [nilai, setNilai] = useState({
    nama: data.alamat.nama,
    alamat: data.alamat.alamat,
    jam: data.alamat.jam,
    catatanJam: data.alamat.catatanJam,
    peta: data.alamat.peta,
  });
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setNilai({
        nama: data.alamat.nama,
        alamat: data.alamat.alamat,
        jam: data.alamat.jam,
        catatanJam: data.alamat.catatanJam,
        peta: data.alamat.peta,
      });
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.alamat]);

  const ubah = (kunci: keyof typeof nilai, isi: string) => {
    setKotor(true);
    setNilai((v) => ({ ...v, [kunci]: isi }));
  };

  return (
    <div data-testid="admin-kontak-alamat">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <Kolom
          testid="kontak-alamat-nama"
          label="Nama lembaga pada kartu"
          nilai={nilai.nama}
          onUbah={(v) => ubah("nama", v)}
          petunjuk="Nama ini juga dipakai pada halaman Profil dan bagian lain situs."
        />
        <AreaTeks
          testid="kontak-alamat-lengkap"
          label="Alamat lengkap"
          nilai={nilai.alamat}
          onUbah={(v) => ubah("alamat", v)}
          baris={4}
          petunjuk="Alamat ini dipakai bersama halaman Profil, jadi perubahan berlaku di seluruh situs."
        />
        <Kolom
          testid="kontak-alamat-jam"
          label="Jam layanan"
          nilai={nilai.jam}
          onUbah={(v) => ubah("jam", v)}
          placeholder="Senin – Sabtu, 08.00 – 15.00 WIB"
          petunjuk="Juga tampil pada halaman Profil (Layanan Jamaah)."
        />
        <AreaTeks
          testid="kontak-alamat-catatan"
          label="Catatan di bawah jam layanan"
          nilai={nilai.catatanJam}
          onUbah={(v) => ubah("catatanJam", v)}
          baris={3}
        />
        <Kolom
          testid="kontak-alamat-peta"
          label="Tujuan tombol Google Maps"
          nilai={nilai.peta}
          onUbah={(v) => ubah("peta", v)}
          placeholder="Jl. Raya Cibatu No. 12, Kec. Cibatu, Kab. Garut"
          petunjuk="Tuliskan alamat atau nama tempat yang dicari di Google Maps."
        />
        <a
          href={tautanPeta(nilai.peta)}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="pratinjau-peta-kontak"
          className="inline-flex items-center gap-2 rounded-full border border-persis-900/20 px-3.5 py-2 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
        >
          <Icon name="map-pin" className="h-3.5 w-3.5 text-gold-600" />
          Coba buka di Google Maps
        </a>
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-kontak-alamat"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanAlamatKontak(nilai);
              setKotor(false);
            }, "Alamat sekretariat tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ---------------------------- layanan informasi ---------------------------- */

export function LayananInformasiKontak() {
  return (
    <div data-testid="admin-kontak-layanan">
      <LayananSpmb />
    </div>
  );
}

/* -------------------------------- formulir -------------------------------- */

type BarisTopik = { id?: string; nama: string; aktif: boolean };

export function FormulirKontak() {
  const data = useKontak();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanKontak);
  const [nilai, setNilai] = useState({
    judul: data.formulir.judul,
    pengantar: data.formulir.pengantar,
    waAdmin: data.formulir.waAdmin,
    judul_sukses: data.formulir.judulSukses,
    status_sukses: data.formulir.statusSukses,
    catatan_sukses: data.formulir.catatanSukses,
  });
  const [baris, setBaris] = useState<BarisTopik[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);
  const [kotorTopik, setKotorTopik] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setNilai({
        judul: data.formulir.judul,
        pengantar: data.formulir.pengantar,
        waAdmin: data.formulir.waAdmin,
        judul_sukses: data.formulir.judulSukses,
        status_sukses: data.formulir.statusSukses,
        catatan_sukses: data.formulir.catatanSukses,
      });
      setBaris(data.topik.map((t) => ({ id: t.id, nama: t.nama, aktif: t.aktif })));
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.formulir, data.topik]);

  const ubah = (kunci: keyof typeof nilai, isi: string) => {
    setKotor(true);
    setNilai((v) => ({ ...v, [kunci]: isi }));
  };

  const isiTopik = (i: number, sebagian: Partial<BarisTopik>) => {
    setKotorTopik(true);
    setBaris((s) => s.map((r, k) => (k === i ? { ...r, ...sebagian } : r)));
  };

  const simpanTopik = async () => {
    const dikenal = new Set(baris.filter((b) => b.id).map((b) => b.id as string));
    const urut: string[] = [];
    const hasil: BarisTopik[] = [];

    for (const b of baris) {
      if (!b.nama.trim()) {
        hasil.push(b);
        continue;
      }
      const muatan = { nama: b.nama.trim() };
      if (b.id) {
        await ubahTopikKontak(b.id, { ...muatan, aktif: b.aktif });
        urut.push(b.id);
        hasil.push({ ...b, ...muatan });
      } else {
        const jawab = (await tambahTopikKontak(muatan)) as { topik?: { id: string; nama: string }[] };
        const baru = (jawab.topik ?? []).find((t) => !dikenal.has(t.id));
        if (baru) {
          dikenal.add(baru.id);
          urut.push(baru.id);
          hasil.push({ ...b, ...muatan, id: baru.id });
        } else {
          hasil.push({ ...b, ...muatan });
        }
      }
    }

    if (urut.length > 0) await urutTopikKontak(urut);
    setBaris(hasil);
  };

  const hapusTopik = async (i: number) => {
    const b = baris[i];
    if (!b.id) {
      setBaris((s) => s.filter((_, k) => k !== i));
      setKotorTopik(true);
      return;
    }
    const setuju = await mintaKonfirmasi(`Hapus topik ${b.nama || "ini"} dari pilihan formulir?`, {
      labelYa: "Ya, hapus topik",
    });
    if (!setuju) return;
    try {
      await hapusTopikKontak(b.id);
      await segarkanKontak();
      setBaris((s) => s.filter((_, k) => k !== i));
      beritahu("sukses", `${b.nama || "Topik"} dihapus.`);
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  return (
    <div data-testid="admin-kontak-formulir">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <h2 className="font-header text-[13px] font-bold text-ink-900">Judul & pengantar</h2>
        <Kolom
          testid="kontak-form-judul"
          label="Judul formulir"
          nilai={nilai.judul}
          onUbah={(v) => ubah("judul", v)}
          placeholder="Formulir Pertanyaan"
        />
        <AreaTeks
          testid="kontak-form-pengantar"
          label="Kalimat pengantar formulir"
          nilai={nilai.pengantar}
          onUbah={(v) => ubah("pengantar", v)}
          baris={3}
          petunjuk="Boleh dikosongkan bila tidak diperlukan."
        />
      </div>

      <div className="mt-3 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <h2 className="font-header text-[13px] font-bold text-ink-900">Tujuan pesan</h2>
        <Kolom
          testid="kontak-form-wa"
          label="Nomor WhatsApp admin"
          nilai={nilai.waAdmin}
          onUbah={(v) => ubah("waAdmin", v)}
          placeholder="0812-3456-7890"
          petunjuk="Nomor ini juga dipakai pada bagian formulir halaman SPMB."
        />
      </div>

      <div className="mt-3 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <h2 className="font-header text-[13px] font-bold text-ink-900">Tulisan kotak pesan terkirim</h2>
        <Kolom
          testid="kontak-form-judul-sukses"
          label="Judul kotak"
          nilai={nilai.judul_sukses}
          onUbah={(v) => ubah("judul_sukses", v)}
          placeholder="Pesan Terkirim"
        />
        <AreaTeks
          testid="kontak-form-status"
          label="Kalimat status"
          nilai={nilai.status_sukses}
          onUbah={(v) => ubah("status_sukses", v)}
          baris={3}
        />
        <AreaTeks
          testid="kontak-form-catatan"
          label="Catatan di bawahnya"
          nilai={nilai.catatan_sukses}
          onUbah={(v) => ubah("catatan_sukses", v)}
          baris={3}
        />
      </div>

      <div className="mt-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Topik pesan</h2>
          <TombolSimpan
            testid="simpan-kontak-topik"
            label="Simpan topik"
            sibuk={sibuk}
            nonaktif={!kotorTopik}
            onClick={() =>
              void jalankan(async () => {
                await simpanTopik();
                setKotorTopik(false);
              }, "Daftar topik pesan tersimpan.")
            }
          />
        </div>
        <p className="mt-1 text-justify text-[10.5px] leading-relaxed text-ink-400">
          Topik ini menjadi pilihan pada daftar "Topik pesan" di formulir halaman Kontak.
        </p>

        <div className="mt-3 space-y-2.5">
          {baris.map((b, i) => (
            <div
              key={b.id ?? `topik-baru-${i}`}
              data-testid={`topik-baris-${i}`}
              className="rounded-2xl border border-black/[0.08] bg-cream-50/60 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                  Pilihan {i + 1}
                </span>
                <span className="flex items-center gap-1.5">
                  <TombolIkon
                    nama="chevron"
                    label="Geser ke atas"
                    testid={`topik-naik-${i}`}
                    putar={-90}
                    nonaktif={i === 0}
                    onClick={() => {
                      setKotorTopik(true);
                      setBaris((s) => geserBaris(s, i, -1));
                    }}
                  />
                  <TombolIkon
                    nama="chevron"
                    label="Geser ke bawah"
                    testid={`topik-turun-${i}`}
                    putar={90}
                    nonaktif={i === baris.length - 1}
                    onClick={() => {
                      setKotorTopik(true);
                      setBaris((s) => geserBaris(s, i, 1));
                    }}
                  />
                  <TombolIkon
                    nama="x"
                    label={`Hapus ${b.nama || "topik"}`}
                    testid={`topik-hapus-${i}`}
                    bahaya
                    onClick={() => void hapusTopik(i)}
                  />
                </span>
              </div>
              <Kolom
                testid={`topik-nama-${i}`}
                label="Nama topik"
                nilai={b.nama}
                onUbah={(v) => isiTopik(i, { nama: v })}
                placeholder="Layanan wali santri"
              />
              <div className="mt-2">
                <Sakelar
                  testid={`topik-aktif-${i}`}
                  label="Tampilkan di formulir"
                  nilai={b.aktif}
                  onUbah={(v) => isiTopik(i, { aktif: v })}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          data-testid="tambah-topik"
          onClick={() => {
            setBaris((s) => [...s, { nama: "", aktif: true }]);
            setKotorTopik(true);
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
        >
          <Icon name="plus" className="h-3.5 w-3.5 text-gold-600" />
          Tambah topik
        </button>
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-kontak-formulir"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanFormulirKontak(nilai);
              setKotor(false);
            }, "Pengaturan formulir tersimpan.")
          }
        />
      </div>
    </div>
  );
}
