import { useCallback, useState } from "react";
import { AreaTeks, KepalaBorang, Kolom, Pesan, Sakelar, TombolIkon, TombolSimpan } from "../../../components/admin/Form";
import { beritahu, mintaKonfirmasi } from "../../../lib/notifikasiAdmin";
import { ambilKategoriZis, hapusKategoriZis, simpanKategoriZis, useZisData, type KategoriProgram } from "../../../lib/zis";
import { Bagian, Kosong } from "./Bagian";

/**
 * Kategori Program — daftar kategori yang dipakai pada formulir Program Donasi.
 * Nama kategori juga tampil pada kartu program di situs, jadi mengubah namanya
 * sekaligus memperbarui program yang memakainya.
 */

type Borang = { id?: string; nama: string; keterangan: string; aktif: boolean };

const KOSONG: Borang = { nama: "", keterangan: "", aktif: true };

export default function KategoriProgramZis() {
  const muat = useCallback(() => ambilKategoriZis(), []);
  const { data, setData, memuat, galat, muat: segarkan } = useZisData(muat);
  const [borang, setBorang] = useState<Borang | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  const daftar: KategoriProgram[] = data ?? [];

  const simpan = async () => {
    if (!borang) return;
    setSibuk(true);
    setPesan(null);
    try {
      setData(await simpanKategoriZis({ nama: borang.nama, keterangan: borang.keterangan, aktif: borang.aktif }, borang.id));
      beritahu("sukses", borang.id ? "Kategori diperbarui." : "Kategori ditambahkan.");
      setBorang(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Kategori tidak bisa disimpan." });
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async (k: KategoriProgram) => {
    const lanjut = await mintaKonfirmasi(
      `Hapus kategori “${k.nama}”? Kategori yang masih dipakai program tidak bisa dihapus.`,
      { judul: "Hapus kategori", labelYa: "Ya, hapus" },
    );
    if (!lanjut) return;
    try {
      setData(await hapusKategoriZis(k.id));
      beritahu("sukses", `Kategori “${k.nama}” dihapus.`);
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Kategori tidak bisa dihapus.");
    }
  };

  return (
    <div data-testid="zis-kategori">
      <KepalaBorang
        judul="Kategori Program"
        keterangan="Kategori dipakai pada formulir Program Donasi dan tampil pada kartu program di situs. Satu program memakai satu kategori."
      />

      {borang ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">
            {borang.id ? "Ubah kategori" : "Tambah kategori"}
          </h2>
          <Kolom
            testid="kategori-nama"
            label="Nama kategori"
            nilai={borang.nama}
            onUbah={(v) => setBorang({ ...borang, nama: v })}
            placeholder="Mis. Pendidikan"
            petunjuk="Pendek dan jelas, misalnya Pembangunan, Pendidikan, Sosial, Sarana Ibadah."
          />
          <AreaTeks
            testid="kategori-keterangan"
            label="Keterangan"
            nilai={borang.keterangan}
            onUbah={(v) => setBorang({ ...borang, keterangan: v })}
            baris={2}
            petunjuk="Boleh dikosongkan. Hanya terlihat di panel ini."
          />
          <Sakelar
            testid="kategori-aktif"
            label="Kategori aktif"
            petunjuk="Kategori yang dimatikan tidak bisa dipilih pada program baru."
            nilai={borang.aktif}
            onUbah={(v) => setBorang({ ...borang, aktif: v })}
          />
          {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
          <div className="flex flex-wrap items-center gap-2">
            <TombolSimpan sibuk={sibuk} testid="simpan-kategori" label="Simpan kategori" onClick={() => void simpan()} />
            <button
              type="button"
              data-testid="batal-kategori"
              onClick={() => {
                setBorang(null);
                setPesan(null);
              }}
              className="rounded-full border border-black/[0.12] px-3.5 py-2 text-[11.5px] font-semibold text-ink-600"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-3.5">
        <Bagian
          testid="zis-kategori-daftar"
          judul="Daftar Kategori"
          keterangan="Tekan tombol pensil untuk mengubah nama atau keterangannya. Kategori yang sedang dipakai program diberi tanda jumlah program."
          jumlah={daftar.length}
          nada={daftar.length > 0 ? "hijau" : "redup"}
          aksi={
            <button
              type="button"
              data-testid="tambah-kategori"
              onClick={() => {
                setBorang({ ...KOSONG });
                setPesan(null);
              }}
              className="rounded-full bg-persis-900 px-3 py-1.5 text-[11px] font-bold text-white"
            >
              Tambah
            </button>
          }
        >
          {memuat && !data ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-[62px] animate-pulse rounded-2xl border border-black/[0.06] bg-white" />
              ))}
            </div>
          ) : galat && !data ? (
            <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
              <p className="text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
              <button
                type="button"
                onClick={() => void segarkan()}
                className="mt-2.5 rounded-full bg-persis-900 px-3.5 py-1.5 text-[11px] font-semibold text-white"
              >
                Muat ulang
              </button>
            </div>
          ) : daftar.length === 0 ? (
            <Kosong
              testid="kategori-kosong"
              teks="Belum ada kategori. Tambahkan minimal satu kategori sebelum membuat program donasi."
            />
          ) : (
            <ul className="space-y-2">
              {daftar.map((k) => (
                <li
                  key={k.id}
                  data-testid={`kategori-baris-${k.id}`}
                  className="flex items-start gap-2.5 rounded-2xl border border-black/[0.08] bg-white p-3.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-bold text-ink-900">{k.nama}</span>
                    {k.keterangan ? (
                      <span className="mt-0.5 block text-justify text-[10.5px] leading-relaxed text-ink-500">
                        {k.keterangan}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-[10px] text-ink-400">
                      {k.program} program
                      {k.aktif ? "" : " · kategori dimatikan"}
                    </span>
                  </span>
                  <TombolIkon
                    nama="pencil"
                    label={`Ubah kategori ${k.nama}`}
                    testid={`kategori-ubah-${k.id}`}
                    onClick={() => {
                      setBorang({ id: k.id, nama: k.nama, keterangan: k.keterangan, aktif: k.aktif });
                      setPesan(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                  <TombolIkon
                    nama="trash"
                    label={`Hapus kategori ${k.nama}`}
                    bahaya
                    testid={`kategori-hapus-${k.id}`}
                    nonaktif={k.program > 0}
                    onClick={() => void hapus(k)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Bagian>
      </div>
    </div>
  );
}
