import { useEffect, useRef, useState } from "react";
import { AreaTeks, Kolom, Pesan, Pilih, Sakelar, TombolIkon, TombolSimpan } from "../../components/admin/Form";
import { Icon } from "../../components/Icons";
import { gambar } from "../../data/content";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { ISIAN_TAMBAHAN, KETERANGAN_ISIAN, segarkanSpmb, useSpmb, type SifatIsian } from "../../lib/spmb";
import {
  hapusBiaya,
  hapusGelombang,
  hapusLayanan,
  simpanFormulirSpmb,
  simpanGambarSpmb,
  simpanHalamanSpmb,
  tambahBiaya,
  tambahGelombang,
  tambahLayanan,
  ubahBiaya,
  ubahGelombang,
  ubahLayanan,
  unggahBerkas,
  urutBiaya,
  urutGelombang,
  urutLayanan,
} from "../../lib/admin";

type Status = { tipe: "sukses" | "galat"; teks: string } | null;

/** Menyimpan lalu menyegarkan data SPMB dari database. */
function pakaiSimpan() {
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<Status>(null);

  const jalankan = async (kerja: () => Promise<unknown>, sukses: string) => {
    setSibuk(true);
    setPesan(null);
    try {
      await kerja();
      await segarkanSpmb();
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

/** Pindahkan satu baris pada daftar. */
function geserBaris<T>(daftar: T[], i: number, arah: -1 | 1): T[] {
  const j = i + arah;
  if (j < 0 || j >= daftar.length) return daftar;
  const salinan = [...daftar];
  [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
  return salinan;
}

/* ------------------------------ teks halaman ------------------------------ */

export function TeksHalamanSpmb() {
  const data = useSpmb();
  const { sibuk, pesan, jalankan } = pakaiSimpan();
  const [nilai, setNilai] = useState({
    judul: data.halaman.judul,
    pengantar: data.halaman.pengantar,
    catatan: data.halaman.catatan,
  });
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setNilai({ judul: data.halaman.judul, pengantar: data.halaman.pengantar, catatan: data.halaman.catatan });
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.halaman.judul, data.halaman.pengantar, data.halaman.catatan]);

  const ubah = (kunci: "judul" | "pengantar" | "catatan", isi: string) => {
    setKotor(true);
    setNilai((v) => ({ ...v, [kunci]: isi }));
  };

  return (
    <div data-testid="admin-spmb-teks">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
        <Kolom
          testid="spmb-judul"
          label="Judul halaman"
          nilai={nilai.judul}
          onUbah={(v) => ubah("judul", v)}
          placeholder="SPMB"
        />
        <AreaTeks
          testid="spmb-pengantar"
          label="Teks pengantar"
          nilai={nilai.pengantar}
          onUbah={(v) => ubah("pengantar", v)}
          baris={6}
          petunjuk="Paragraf pembuka di bawah gambar halaman SPMB."
        />
        <AreaTeks
          testid="spmb-catatan"
          label="Catatan bawah formulir"
          nilai={nilai.catatan}
          onUbah={(v) => ubah("catatan", v)}
          baris={4}
          petunjuk="Tampil sebagai keterangan kecil di bawah tombol kirim."
        />
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-spmb-teks"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanHalamanSpmb(nilai);
              setKotor(false);
            }, "Teks halaman SPMB tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ----------------------------- gambar halaman ----------------------------- */

export function GambarHalamanSpmb() {
  const data = useSpmb();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan();
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
      const hasil = await unggahBerkas(berkas, "spmb");
      await simpanGambarSpmb({ gambar_url: hasil.url, gambar_alt: alt });
    }, "Gambar halaman SPMB tersimpan dan langsung dipakai.");
  };

  return (
    <div data-testid="admin-spmb-gambar">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
        <div className="overflow-hidden rounded-2xl border border-black/[0.08]">
          <img src={data.gambar.url || gambar.ujian} alt="" className="h-[168px] w-full object-cover" />
        </div>
        <p className="mt-2.5 text-[10px] break-all text-ink-400">{data.gambar.url || gambar.ujian}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="pilih-gambar-spmb"
            disabled={sibuk}
            onClick={() => berkasRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-persis-900 px-3.5 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            <Icon name="image" className="h-[15px] w-[15px]" />
            {sibuk ? "Mengunggah…" : "Ganti gambar"}
          </button>
          <button
            type="button"
            data-testid="gambar-spmb-bawaan"
            disabled={sibuk}
            onClick={() =>
              void jalankan(
                () => simpanGambarSpmb({ gambar_url: gambar.ujian, gambar_alt: alt }),
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
          data-testid="berkas-gambar-spmb"
          onChange={(e) => {
            void pilihBerkas(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="mt-4 space-y-3">
          <Kolom
            testid="isian-spmb-gambar-alt"
            label="Keterangan gambar (alt)"
            nilai={alt}
            onUbah={setAlt}
            petunjuk="Dipakai pembaca layar dan saat gambar gagal dimuat."
          />
          <TombolSimpan
            testid="simpan-spmb-gambar-alt"
            sibuk={sibuk}
            label="Simpan keterangan"
            onClick={() => void jalankan(() => simpanGambarSpmb({ gambar_alt: alt }), "Keterangan gambar tersimpan.")}
          />
        </div>
      </div>
    </div>
  );
}

/* --------------------------- gelombang pendaftaran --------------------------- */

type BarisGelombang = {
  id?: string;
  nama: string;
  periode: string;
  kuota: string;
  sisa: string;
  status: string;
};

const OPSI_STATUS_GELOMBANG = [
  { nilai: "Dibuka", label: "Dibuka" },
  { nilai: "Segera", label: "Segera dibuka" },
  { nilai: "Ditutup", label: "Ditutup" },
];

export function GelombangSpmb() {
  const data = useSpmb();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan();
  const [baris, setBaris] = useState<BarisGelombang[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setBaris(
        data.gelombang.map((g) => ({
          id: g.id,
          nama: g.nama,
          periode: g.periode,
          kuota: g.kuota,
          sisa: g.sisa,
          status: g.status,
        })),
      );
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.gelombang]);

  const isi = (i: number, sebagian: Partial<BarisGelombang>) => {
    setKotor(true);
    setBaris((s) => s.map((r, k) => (k === i ? { ...r, ...sebagian } : r)));
  };

  const simpanSemua = async () => {
    const dikenal = new Set(baris.filter((b) => b.id).map((b) => b.id as string));
    const urut: string[] = [];
    const hasil: BarisGelombang[] = [];

    for (const b of baris) {
      if (!b.nama.trim()) {
        hasil.push(b);
        continue;
      }
      const muatan = {
        nama: b.nama.trim(),
        periode: b.periode,
        kuota: b.kuota,
        sisa: b.sisa,
        status: b.status,
      };
      if (b.id) {
        await ubahGelombang(b.id, muatan);
        urut.push(b.id);
        hasil.push({ ...b, ...muatan });
      } else {
        const jawab = (await tambahGelombang(muatan)) as { gelombang?: { id: string }[] };
        const baru = (jawab.gelombang ?? []).find((g) => !dikenal.has(g.id));
        if (baru) {
          dikenal.add(baru.id);
          urut.push(baru.id);
          hasil.push({ ...b, ...muatan, id: baru.id });
        } else {
          hasil.push({ ...b, ...muatan });
        }
      }
    }

    if (urut.length > 0) await urutGelombang(urut);
    setBaris(hasil);
  };

  const hapus = async (i: number) => {
    const b = baris[i];
    if (b.id) {
      const setuju = await mintaKonfirmasi(`Hapus ${b.nama || "gelombang ini"} dari daftar gelombang pendaftaran?`, {
        labelYa: "Ya, hapus gelombang",
      });
      if (!setuju) return;
      try {
        await hapusGelombang(b.id);
        await segarkanSpmb();
        setBaris((s) => s.filter((_, k) => k !== i));
        beritahu("sukses", `${b.nama || "Gelombang"} dihapus.`);
        setPesan(null);
      } catch (e) {
        setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
      }
    } else {
      setBaris((s) => s.filter((_, k) => k !== i));
      setKotor(true);
    }
  };

  return (
    <div data-testid="admin-spmb-gelombang">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {baris.map((b, i) => (
          <div
            key={b.id ?? `baru-${i}`}
            data-testid={`gelombang-baris-${i}`}
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
                  testid={`gelombang-naik-${i}`}
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
                  testid={`gelombang-turun-${i}`}
                  putar={90}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => geserBaris(s, i, 1));
                  }}
                  nonaktif={i === baris.length - 1}
                />
                <TombolIkon
                  nama="x"
                  label={`Hapus ${b.nama || "gelombang"}`}
                  testid={`gelombang-hapus-${i}`}
                  bahaya
                  onClick={() => void hapus(i)}
                />
              </span>
            </div>
            <div className="space-y-2.5">
              <Kolom
                testid={`gelombang-nama-${i}`}
                label="Nama gelombang"
                nilai={b.nama}
                onUbah={(v) => isi(i, { nama: v })}
                placeholder="Gelombang I"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <Kolom
                  testid={`gelombang-periode-${i}`}
                  label="Periode"
                  nilai={b.periode}
                  onUbah={(v) => isi(i, { periode: v })}
                  placeholder="1 Okt – 31 Okt"
                  petunjuk="Ditulis apa adanya, mis. 1 Okt – 31 Okt."
                />
                <Pilih
                  testid={`gelombang-status-${i}`}
                  label="Status"
                  nilai={b.status}
                  onUbah={(v) => isi(i, { status: v })}
                  opsi={OPSI_STATUS_GELOMBANG}
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Kolom
                  testid={`gelombang-kuota-${i}`}
                  label="Kuota"
                  nilai={b.kuota}
                  onUbah={(v) => isi(i, { kuota: v })}
                  placeholder="120 kursi"
                />
                <Kolom
                  testid={`gelombang-sisa-${i}`}
                  label="Keterangan sisa"
                  nilai={b.sisa}
                  onUbah={(v) => isi(i, { sisa: v })}
                  placeholder="38 kursi tersisa"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-testid="tambah-gelombang"
        onClick={() => {
          setBaris((s) => [...s, { nama: "", periode: "", kuota: "", sisa: "", status: "Dibuka" }]);
          setKotor(true);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="plus" className="h-3.5 w-3.5 text-gold-600" />
        Tambah gelombang
      </button>

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Gelombang dengan status "Dibuka" tampil dengan lencana hijau, sedangkan "Segera" dan "Ditutup" memakai lencana
        keemasan. Isi nama gelombang lalu tekan Simpan; gelombang baru akan tersimpan.
      </p>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-spmb-gelombang"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanSemua();
              setKotor(false);
            }, "Gelombang pendaftaran tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ---------------------------- biaya pendaftaran ---------------------------- */

type BarisBiaya = { id?: string; label: string; nilai: string };

export function BiayaSpmb() {
  const data = useSpmb();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan();
  const [baris, setBaris] = useState<BarisBiaya[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setBaris(data.biaya.map((b) => ({ id: b.id, label: b.label, nilai: b.nilai })));
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.biaya]);

  const isi = (i: number, sebagian: Partial<BarisBiaya>) => {
    setKotor(true);
    setBaris((s) => s.map((r, k) => (k === i ? { ...r, ...sebagian } : r)));
  };

  const simpanSemua = async () => {
    const dikenal = new Set(baris.filter((b) => b.id).map((b) => b.id as string));
    const urut: string[] = [];
    const hasil: BarisBiaya[] = [];

    for (const b of baris) {
      if (!b.label.trim()) {
        hasil.push(b);
        continue;
      }
      const muatan = { label: b.label.trim(), nilai: b.nilai };
      if (b.id) {
        await ubahBiaya(b.id, muatan);
        urut.push(b.id);
        hasil.push({ ...b, ...muatan });
      } else {
        const jawab = (await tambahBiaya(muatan)) as { biaya?: { id: string }[] };
        const baru = (jawab.biaya ?? []).find((x) => !dikenal.has(x.id));
        if (baru) {
          dikenal.add(baru.id);
          urut.push(baru.id);
          hasil.push({ ...b, ...muatan, id: baru.id });
        } else {
          hasil.push({ ...b, ...muatan });
        }
      }
    }

    if (urut.length > 0) await urutBiaya(urut);
    setBaris(hasil);
  };

  const hapus = async (i: number) => {
    const b = baris[i];
    if (b.id) {
      const setuju = await mintaKonfirmasi(`Hapus baris biaya ${b.label || "ini"} dari daftar?`, {
        labelYa: "Ya, hapus biaya",
      });
      if (!setuju) return;
      try {
        await hapusBiaya(b.id);
        await segarkanSpmb();
        setBaris((s) => s.filter((_, k) => k !== i));
        beritahu("sukses", `${b.label || "Biaya"} dihapus.`);
        setPesan(null);
      } catch (e) {
        setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
      }
    } else {
      setBaris((s) => s.filter((_, k) => k !== i));
      setKotor(true);
    }
  };

  return (
    <div data-testid="admin-spmb-biaya">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {baris.map((b, i) => (
          <div
            key={b.id ?? `baru-${i}`}
            data-testid={`biaya-baris-${i}`}
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
                  testid={`biaya-naik-${i}`}
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
                  testid={`biaya-turun-${i}`}
                  putar={90}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => geserBaris(s, i, 1));
                  }}
                  nonaktif={i === baris.length - 1}
                />
                <TombolIkon
                  nama="x"
                  label={`Hapus ${b.label || "biaya"}`}
                  testid={`biaya-hapus-${i}`}
                  bahaya
                  onClick={() => void hapus(i)}
                />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Kolom
                testid={`biaya-label-${i}`}
                label="Nama biaya"
                nilai={b.label}
                onUbah={(v) => isi(i, { label: v })}
                placeholder="Formulir pendaftaran"
              />
              <Kolom
                testid={`biaya-nilai-${i}`}
                label="Nilai"
                nilai={b.nilai}
                onUbah={(v) => isi(i, { nilai: v })}
                placeholder="Rp 100.000"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-testid="tambah-biaya"
        onClick={() => {
          setBaris((s) => [...s, { label: "", nilai: "" }]);
          setKotor(true);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="plus" className="h-3.5 w-3.5 text-gold-600" />
        Tambah biaya
      </button>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-spmb-biaya"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanSemua();
              setKotor(false);
            }, "Biaya pendaftaran tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* --------------------------- formulir pendaftaran --------------------------- */

export function FormulirSpmb() {
  const data = useSpmb();
  const { sibuk, pesan, jalankan } = pakaiSimpan();
  const [nilai, setNilai] = useState({
    aktif: data.formulir.aktif,
    judul: data.formulir.judul,
    tombol: data.formulir.tombol,
    waAdmin: data.formulir.waAdmin,
    waNama: data.formulir.waNama,
    pesanPembuka: data.formulir.pesanPembuka,
    judulSukses: data.formulir.judulSukses,
    statusSukses: data.formulir.statusSukses,
    pesanTutup: data.formulir.pesanTutup,
  });
  const [isian, setIsian] = useState<Record<string, SifatIsian>>(data.formulir.isian);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setNilai({
        aktif: data.formulir.aktif,
        judul: data.formulir.judul,
        tombol: data.formulir.tombol,
        waAdmin: data.formulir.waAdmin,
        waNama: data.formulir.waNama,
        pesanPembuka: data.formulir.pesanPembuka,
        judulSukses: data.formulir.judulSukses,
        statusSukses: data.formulir.statusSukses,
        pesanTutup: data.formulir.pesanTutup,
      });
      setIsian(data.formulir.isian);
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.formulir]);

  const ubah = (kunci: keyof typeof nilai, isi: string | boolean) => {
    setKotor(true);
    setNilai((v) => ({ ...v, [kunci]: isi }));
  };

  const ubahIsian = (kunci: string, sebagian: Partial<SifatIsian>) => {
    setKotor(true);
    setIsian((s) => {
      const dasar: SifatIsian = s[kunci] ?? { tampil: true, wajib: false };
      return { ...s, [kunci]: { ...dasar, ...sebagian } };
    });
  };

  return (
    <div data-testid="admin-spmb-formulir">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-3.5">
        <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Status formulir</h2>
          <Sakelar
            testid="spmb-form-aktif"
            label="Formulir pendaftaran dibuka"
            nilai={nilai.aktif}
            onUbah={(v) => ubah("aktif", v)}
            petunjuk="Bila dimatikan, formulir diganti keterangan penutup dan pendaftaran diarahkan ke sekretariat."
          />
          {!nilai.aktif ? (
            <AreaTeks
              testid="spmb-form-pesan-tutup"
              label="Keterangan saat formulir ditutup"
              nilai={nilai.pesanTutup}
              onUbah={(v) => ubah("pesanTutup", v)}
              baris={3}
            />
          ) : null}
        </section>

        <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Tampilan formulir</h2>
          <Kolom
            testid="spmb-form-judul"
            label="Judul formulir"
            nilai={nilai.judul}
            onUbah={(v) => ubah("judul", v)}
            placeholder="Formulir Pendaftaran"
          />
          <Kolom
            testid="spmb-form-tombol"
            label="Tulisan pada tombol kirim"
            nilai={nilai.tombol}
            onUbah={(v) => ubah("tombol", v)}
            placeholder="Kirim Pendaftaran"
          />
        </section>

        <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Tujuan pengiriman</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <Kolom
              testid="spmb-form-wa"
              label="Nomor WhatsApp admin"
              nilai={nilai.waAdmin}
              onUbah={(v) => ubah("waAdmin", v)}
              placeholder="088224597479"
            />
            <Kolom
              testid="spmb-form-wa-nama"
              label="Nama admin / panitia"
              nilai={nilai.waNama}
              onUbah={(v) => ubah("waNama", v)}
              placeholder="Panitia SPMB"
            />
          </div>
          <AreaTeks
            testid="spmb-form-pesan-pembuka"
            label="Pesan WhatsApp otomatis"
            nilai={nilai.pesanPembuka}
            onUbah={(v) => ubah("pesanPembuka", v)}
            baris={3}
            petunjuk="Kalimat pembuka pada pesan WhatsApp yang disiapkan untuk pendaftar."
          />
        </section>

        <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Pesan setelah terkirim</h2>
          <Kolom
            testid="spmb-form-judul-sukses"
            label="Judul pemberitahuan"
            nilai={nilai.judulSukses}
            onUbah={(v) => ubah("judulSukses", v)}
            placeholder="Pendaftaran Terkirim"
          />
          <AreaTeks
            testid="spmb-form-status-sukses"
            label="Keterangan pemberitahuan"
            nilai={nilai.statusSukses}
            onUbah={(v) => ubah("statusSukses", v)}
            baris={4}
          />
        </section>

        <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Isian tambahan</h2>
          <p className="text-justify text-[10.5px] leading-relaxed text-ink-600">
            Isian utama (nama calon, jenjang yang dituju, sekolah, jurusan bila ada, orang tua/wali, dan nomor WhatsApp)
            selalu ditanyakan. Isian berikut bisa dinyalakan dan ditandai wajib.
          </p>
          <ul className="space-y-2.5">
            {ISIAN_TAMBAHAN.map((pilihan) => {
              const sifat = isian[pilihan.kunci] ?? { tampil: false, wajib: false };
              return (
                <li
                  key={pilihan.kunci}
                  data-testid={`spmb-isian-${pilihan.kunci}`}
                  className="rounded-xl bg-cream-50/70 px-3 py-2.5"
                >
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      data-testid={`spmb-isian-tampil-${pilihan.kunci}`}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-persis-900"
                      checked={sifat.tampil}
                      onChange={(e) =>
                        ubahIsian(pilihan.kunci, {
                          tampil: e.target.checked,
                          wajib: e.target.checked ? sifat.wajib : false,
                        })
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-[11.5px] font-semibold text-ink-900">{pilihan.label}</span>
                      <span className="mt-0.5 block text-[10px] leading-relaxed text-ink-400">
                        {KETERANGAN_ISIAN[pilihan.kunci] ?? ""}
                      </span>
                    </span>
                  </label>
                  {sifat.tampil ? (
                    <label className="mt-2 flex items-center gap-2.5 border-t border-black/[0.06] pt-2">
                      <input
                        type="checkbox"
                        data-testid={`spmb-isian-wajib-${pilihan.kunci}`}
                        className="h-4 w-4 shrink-0 accent-persis-900"
                        checked={sifat.wajib}
                        onChange={(e) => ubahIsian(pilihan.kunci, { wajib: e.target.checked })}
                      />
                      <span className="text-[11px] text-ink-600">Wajib diisi</span>
                    </label>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-spmb-formulir"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanFormulirSpmb({ ...nilai, isian });
              setKotor(false);
            }, "Pengaturan formulir tersimpan.")
          }
        />
      </div>
    </div>
  );
}

/* ---------------------------- layanan informasi ---------------------------- */

type BarisLayanan = {
  id?: string;
  nama: string;
  keterangan: string;
  telepon: string;
  whatsapp: string;
  jam: string;
};

export function LayananSpmb() {
  const data = useSpmb();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan();
  const [baris, setBaris] = useState<BarisLayanan[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setBaris(
        data.layanan.map((l) => ({
          id: l.id,
          nama: l.nama,
          keterangan: l.keterangan,
          telepon: l.telepon,
          whatsapp: l.whatsapp,
          jam: l.jam,
        })),
      );
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.layanan]);

  const isi = (i: number, sebagian: Partial<BarisLayanan>) => {
    setKotor(true);
    setBaris((s) => s.map((r, k) => (k === i ? { ...r, ...sebagian } : r)));
  };

  const simpanSemua = async () => {
    const dikenal = new Set(baris.filter((b) => b.id).map((b) => b.id as string));
    const urut: string[] = [];
    const hasil: BarisLayanan[] = [];

    for (const b of baris) {
      if (!b.nama.trim()) {
        hasil.push(b);
        continue;
      }
      const muatan = {
        nama: b.nama.trim(),
        keterangan: b.keterangan,
        telepon: b.telepon,
        whatsapp: b.whatsapp,
        jam: b.jam,
      };
      if (b.id) {
        await ubahLayanan(b.id, muatan);
        urut.push(b.id);
        hasil.push({ ...b, ...muatan });
      } else {
        const jawab = (await tambahLayanan(muatan)) as { layanan?: { id: string }[] };
        const baru = (jawab.layanan ?? []).find((x) => !dikenal.has(x.id));
        if (baru) {
          dikenal.add(baru.id);
          urut.push(baru.id);
          hasil.push({ ...b, ...muatan, id: baru.id });
        } else {
          hasil.push({ ...b, ...muatan });
        }
      }
    }

    if (urut.length > 0) await urutLayanan(urut);
    setBaris(hasil);
  };

  const hapus = async (i: number) => {
    const b = baris[i];
    if (b.id) {
      const setuju = await mintaKonfirmasi(`Hapus layanan ${b.nama || "ini"} dari daftar informasi SPMB?`, {
        labelYa: "Ya, hapus layanan",
      });
      if (!setuju) return;
      try {
        await hapusLayanan(b.id);
        await segarkanSpmb();
        setBaris((s) => s.filter((_, k) => k !== i));
        beritahu("sukses", `${b.nama || "Layanan"} dihapus.`);
        setPesan(null);
      } catch (e) {
        setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
      }
    } else {
      setBaris((s) => s.filter((_, k) => k !== i));
      setKotor(true);
    }
  };

  return (
    <div data-testid="admin-spmb-layanan">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {baris.map((b, i) => (
          <div
            key={b.id ?? `baru-${i}`}
            data-testid={`layanan-baris-${i}`}
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
                  testid={`layanan-naik-${i}`}
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
                  testid={`layanan-turun-${i}`}
                  putar={90}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => geserBaris(s, i, 1));
                  }}
                  nonaktif={i === baris.length - 1}
                />
                <TombolIkon
                  nama="x"
                  label={`Hapus ${b.nama || "layanan"}`}
                  testid={`layanan-hapus-${i}`}
                  bahaya
                  onClick={() => void hapus(i)}
                />
              </span>
            </div>
            <div className="space-y-2.5">
              <Kolom
                testid={`layanan-nama-${i}`}
                label="Nama layanan / bagian"
                nilai={b.nama}
                onUbah={(v) => isi(i, { nama: v })}
                placeholder="Panitia SPMB"
              />
              <AreaTeks
                testid={`layanan-keterangan-${i}`}
                label="Keterangan"
                nilai={b.keterangan}
                onUbah={(v) => isi(i, { keterangan: v })}
                baris={3}
                placeholder="Pendaftaran, berkas, dan jadwal tes masuk"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <Kolom
                  testid={`layanan-telepon-${i}`}
                  label="Telepon"
                  nilai={b.telepon}
                  onUbah={(v) => isi(i, { telepon: v })}
                  placeholder="(0262) 555-1235"
                />
                <Kolom
                  testid={`layanan-wa-${i}`}
                  label="WhatsApp"
                  nilai={b.whatsapp}
                  onUbah={(v) => isi(i, { whatsapp: v })}
                  placeholder="0812-3456-7891"
                />
              </div>
              <Kolom
                testid={`layanan-jam-${i}`}
                label="Jam layanan"
                nilai={b.jam}
                onUbah={(v) => isi(i, { jam: v })}
                placeholder="Senin – Sabtu, 08.00 – 15.00 WIB"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-testid="tambah-layanan"
        onClick={() => {
          setBaris((s) => [...s, { nama: "", keterangan: "", telepon: "", whatsapp: "", jam: "" }]);
          setKotor(true);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="plus" className="h-3.5 w-3.5 text-gold-600" />
        Tambah layanan
      </button>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-spmb-layanan"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanSemua();
              setKotor(false);
            }, "Layanan informasi tersimpan.")
          }
        />
      </div>
    </div>
  );
}
