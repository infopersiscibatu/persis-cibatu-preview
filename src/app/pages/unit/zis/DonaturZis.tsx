import { useCallback, useState } from "react";
import { AreaTeks, KepalaBorang, Kolom, Pesan, Sakelar, TombolIkon, TombolSimpan } from "../../../components/admin/Form";
import { Icon } from "../../../components/Icons";
import { tanggalPendek } from "../../../lib/format";
import { beritahu, mintaKonfirmasi } from "../../../lib/notifikasiAdmin";
import {
  ambilDonaturZis,
  hapusDonaturZis,
  simpanDonaturZis,
  useZisData,
  type DonaturZis,
} from "../../../lib/zis";
import { Bagian, Kosong, TabelKartu } from "./Bagian";

/**
 * Donatur — daftar orang yang pernah menyalurkan donasi, lengkap dengan nomor
 * WhatsApp-nya supaya petugas bisa menghubungi kembali.
 *
 * Daftar ini terisi sendiri setiap kali petugas memverifikasi donasi yang masuk
 * (nomor WhatsApp dan namanya dicatat di sini). Petugas juga bisa menambah atau
 * memperbaiki data secara manual.
 */

type Borang = { id?: string; nama: string; telepon: string; catatan: string; aktif: boolean };

const KOSONG: Borang = { nama: "", telepon: "", catatan: "", aktif: true };

/** 081234567890 → 6281234567890 untuk tautan WhatsApp. */
const tautanWa = (telepon: string) => {
  const digit = String(telepon ?? "").replace(/\D/g, "");
  if (digit.length < 9) return null;
  return `https://wa.me/${digit.startsWith("62") ? digit : `62${digit.replace(/^0/, "")}`}`;
};

export default function DonaturZis() {
  const muat = useCallback(() => ambilDonaturZis(), []);
  const { data, setData, memuat, galat, muat: segarkan } = useZisData(muat);
  const [cari, setCari] = useState("");
  const [borang, setBorang] = useState<Borang | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  const semua: DonaturZis[] = data?.donatur ?? [];
  const ringkas = data?.ringkas ?? { jumlah: 0, total: 0, bertelepon: 0 };
  const kata = cari.trim().toLowerCase();
  const daftar = kata
    ? semua.filter((d) => d.nama.toLowerCase().includes(kata) || d.telepon.includes(kata))
    : semua;

  const simpan = async () => {
    if (!borang) return;
    setSibuk(true);
    setPesan(null);
    try {
      const hasil = await simpanDonaturZis(
        { nama: borang.nama, telepon: borang.telepon, catatan: borang.catatan, aktif: borang.aktif },
        borang.id,
      );
      setData(hasil);
      beritahu("sukses", borang.id ? "Data donatur diperbarui." : "Donatur ditambahkan.");
      setBorang(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Donatur tidak bisa disimpan." });
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async (d: DonaturZis) => {
    const lanjut = await mintaKonfirmasi(`Hapus donatur “${d.nama}” dari daftar? Riwayat donasinya tetap tersimpan.`, {
      judul: "Hapus donatur",
      labelYa: "Ya, hapus",
    });
    if (!lanjut) return;
    try {
      setData(await hapusDonaturZis(d.id));
      beritahu("sukses", `Donatur “${d.nama}” dihapus.`);
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Donatur tidak bisa dihapus.");
    }
  };

  return (
    <div data-testid="zis-donatur">
      <KepalaBorang
        judul="Donatur"
        keterangan="Daftar donatur berisi nama dan nomor WhatsApp saja. Terisi sendiri dari formulir donasi di situs: donatur yang sama tidak ditambah lagi menjadi baris baru."
      />

      {borang ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">
            {borang.id ? "Ubah data donatur" : "Tambah donatur"}
          </h2>
          <Kolom
            testid="donatur-nama"
            label="Nama donatur"
            nilai={borang.nama}
            onUbah={(v) => setBorang({ ...borang, nama: v })}
            placeholder="Mis. H. Asep Saepudin"
          />
          <Kolom
            testid="donatur-telepon"
            label="Nomor WhatsApp"
            nilai={borang.telepon}
            onUbah={(v) => setBorang({ ...borang, telepon: v })}
            placeholder="08xxxxxxxxxx"
            petunjuk="Boleh dikosongkan bila nomornya belum diketahui. Nomor yang sama tidak bisa didaftarkan dua kali."
          />
          <AreaTeks
            testid="donatur-catatan"
            label="Catatan"
            nilai={borang.catatan}
            onUbah={(v) => setBorang({ ...borang, catatan: v })}
            baris={2}
            petunjuk="Boleh dikosongkan. Hanya terlihat di panel ini."
          />
          <Sakelar
            testid="donatur-aktif"
            label="Donatur aktif"
            nilai={borang.aktif}
            onUbah={(v) => setBorang({ ...borang, aktif: v })}
          />
          {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
          <div className="flex flex-wrap items-center gap-2">
            <TombolSimpan sibuk={sibuk} testid="simpan-donatur" label="Simpan donatur" onClick={() => void simpan()} />
            <button
              type="button"
              data-testid="batal-donatur"
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
          testid="zis-donatur-daftar"
          judul="Daftar Donatur"
          keterangan="Hanya nama dan nomor WhatsApp. Donasi masuk dari donatur yang sama tidak menambah baris baru — catatannya yang diperbarui. Tekan nomornya untuk membuka WhatsApp."
          jumlah={ringkas.jumlah}
          nada={ringkas.jumlah > 0 ? "hijau" : "redup"}
          aksi={
            <button
              type="button"
              data-testid="tambah-donatur"
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
          <div className="space-y-2.5">
            <label className="block">
              <span className="field-label">Cari donatur</span>
              <input
                data-testid="donatur-cari"
                className="w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2.5 text-[12.5px] text-ink-900 outline-none"
                value={cari}
                placeholder="Ketik nama atau nomor WhatsApp"
                onChange={(e) => setCari(e.target.value)}
              />
            </label>
            <p className="text-[10.5px] leading-relaxed text-ink-500">
              {ringkas.jumlah} donatur tercatat · {ringkas.bertelepon} sudah punya nomor WhatsApp.
            </p>
          </div>

          <div className="mt-3">
            {memuat && !data ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-[54px] animate-pulse rounded-2xl border border-black/[0.06] bg-white" />
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
                testid="donatur-kosong"
                teks={
                  kata
                    ? "Tidak ada donatur yang cocok dengan pencarian itu."
                    : "Belum ada donatur. Daftar ini terisi sendiri setiap kali donasi yang masuk diverifikasi."
                }
              />
            ) : (
              <TabelKartu testid="donatur-tabel" lebar="min-w-[320px]">
                <thead>
                  <tr className="border-b border-black/[0.08] bg-cream-50 text-[10px] tracking-wide text-ink-500 uppercase">
                    <th className="px-3 py-2.5 font-bold">Nama</th>
                    <th className="px-3 py-2.5 font-bold">No. WhatsApp</th>
                    <th className="px-3 py-2.5 text-right font-bold">
                      <span className="sr-only">Tindakan</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {daftar.map((d) => {
                    const wa = tautanWa(d.telepon);
                    return (
                      <tr
                        key={d.id}
                        data-testid={`donatur-baris-${d.id}`}
                        className="border-b border-black/[0.05] last:border-0"
                      >
                        <td data-testid={`donatur-nama-${d.id}`} className="px-3 py-2.5 font-semibold text-ink-900">
                          {d.nama}
                        </td>
                        <td data-testid={`donatur-telepon-${d.id}`} className="px-3 py-2.5">
                          {wa ? (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid={`donatur-wa-${d.id}`}
                              className="inline-flex items-center gap-1.5 font-semibold text-[#1f7a4d] underline"
                            >
                              <Icon name="whatsapp" className="h-[13px] w-[13px]" />
                              {d.telepon}
                            </a>
                          ) : (
                            <span className="text-ink-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="flex justify-end gap-1.5">
                            <TombolIkon
                              nama="pencil"
                              label={`Ubah donatur ${d.nama}`}
                              testid={`donatur-ubah-${d.id}`}
                              onClick={() => {
                                setBorang({
                                  id: d.id,
                                  nama: d.nama,
                                  telepon: d.telepon,
                                  catatan: d.catatan,
                                  aktif: d.aktif,
                                });
                                setPesan(null);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            />
                            <TombolIkon
                              nama="trash"
                              label={`Hapus donatur ${d.nama}`}
                              bahaya
                              testid={`donatur-hapus-${d.id}`}
                              onClick={() => void hapus(d)}
                            />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </TabelKartu>
            )}
          </div>

          {semua.some((d) => d.dibuat) ? (
            <p className="mt-2 text-[10px] text-ink-400">
              Data terbaru diperbarui {tanggalPendek(semua[0]?.diperbarui ?? semua[0]?.dibuat ?? "")}.
            </p>
          ) : null}
        </Bagian>
      </div>
    </div>
  );
}
