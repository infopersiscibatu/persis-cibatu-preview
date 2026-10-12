import { useCallback, useState } from "react";
import PilihGambar from "../../../components/admin/PilihGambar";
import {
  DaftarTeks,
  KepalaBorang,
  Kolom,
  Pesan,
  Sakelar,
  TombolIkon,
  TombolSimpan,
} from "../../../components/admin/Form";
import { beritahu } from "../../../lib/notifikasiAdmin";
import {
  ambilMetodeZis,
  simpanMetodeZis,
  useZisData,
  type BorangMetodeZis,
  type MetodeBayarZis,
} from "../../../lib/zis";
import { Bagian, Lencana } from "./Bagian";

/**
 * Metode Pembayaran — kanal pembayaran resmi lembaga yang muncul pada formulir donasi
 * di situs. Yang diatur di sini adalah nama, keterangan, langkah pembayaran, gambar
 * (khusus QRIS: gambar kode QR resmi supaya donatur bisa langsung memindainya di popup),
 * dan keaktifannya.
 *
 * Metode tidak ditambah atau dihapus dari halaman ini karena setiap program donasi
 * menautkan id-nya; mematikan metode sudah cukup untuk menyembunyikannya dari situs.
 */
export default function MetodePembayaranZis() {
  const muat = useCallback(() => ambilMetodeZis(), []);
  const { data, setData, memuat, galat, muat: segarkan } = useZisData(muat);

  const [borang, setBorang] = useState<(BorangMetodeZis & { id: string }) | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  const daftar: MetodeBayarZis[] = data ?? [];
  const aktif = daftar.filter((m) => m.aktif);
  const perluGambar = borang ? /qris/i.test(borang.nama) : false;

  const bukaBorang = (m: MetodeBayarZis) => {
    setPesan(null);
    setBorang({
      id: m.id,
      nama: m.nama,
      keterangan: m.keterangan,
      langkah: m.langkah.length > 0 ? m.langkah : [""],
      gambarUrl: m.gambarUrl,
      mediaId: m.mediaId,
      aktif: m.aktif,
    });
  };

  const simpan = async () => {
    if (!borang) return;
    setSibuk(true);
    setPesan(null);
    try {
      const hasil = await simpanMetodeZis(borang.id, {
        nama: borang.nama,
        keterangan: borang.keterangan,
        langkah: borang.langkah.filter((l) => l.trim().length > 0),
        gambarUrl: borang.gambarUrl,
        mediaId: borang.mediaId,
        aktif: borang.aktif,
      });
      setData(hasil);
      beritahu("sukses", `Metode ${borang.nama} diperbarui.`);
      setBorang(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Metode tidak bisa disimpan." });
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div data-testid="zis-metode">
      <KepalaBorang
        judul="Metode Pembayaran"
        keterangan="Kanal pembayaran resmi yang bisa dipilih donatur di situs. Untuk QRIS, unggah gambar kode QR resmi lembaga supaya donatur dapat langsung memindainya pada popup donasi."
      />

      {borang ? (
        <>
          <PilihGambar
            testid="metode-gambar"
            folder="program-donasi"
            label={perluGambar ? "Gambar kode QRIS" : "Gambar metode (opsional)"}
            petunjuk={
              perluGambar
                ? "Gambar ini tampil pada popup donasi di situs, jadi gunakan kode QR resmi yang benar. Format PNG atau JPG, maksimal 25 MB."
                : "Tidak wajib. Bila diunggah, gambar ini tampil pada popup donasi di situs."
            }
            nilai={borang.gambarUrl}
            rasio="h-[210px]"
            bentuk={perluGambar ? "persegi" : "landscape"}
            onUbah={({ url, mediaId }) => setBorang({ ...borang, gambarUrl: url, mediaId })}
          />

          <div className="mt-3.5 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Ubah metode pembayaran</h2>
            <Kolom
              testid="metode-nama"
              label="Nama metode"
              nilai={borang.nama}
              onUbah={(v) => setBorang({ ...borang, nama: v })}
              placeholder="Mis. QRIS"
              petunjuk="Nama ini yang dibaca donatur pada formulir donasi dan popup konfirmasi."
            />
            <Kolom
              testid="metode-keterangan"
              label="Keterangan singkat"
              nilai={borang.keterangan}
              onUbah={(v) => setBorang({ ...borang, keterangan: v })}
              placeholder="Mis. Pindai kode di sekretariat"
            />
            <DaftarTeks
              testid="metode-langkah"
              label="Langkah pembayaran"
              nilai={borang.langkah}
              onUbah={(v) => setBorang({ ...borang, langkah: v })}
              petunjuk="Ditampilkan berurutan pada popup setelah donatur mengirim donasi."
            />
            <Sakelar
              testid="metode-aktif"
              label="Metode aktif"
              nilai={borang.aktif}
              onUbah={(v) => setBorang({ ...borang, aktif: v })}
              petunjuk="Bila dimatikan, metode ini tidak muncul di formulir donasi mana pun."
            />
            {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
            <div className="flex flex-wrap items-center gap-2">
              <TombolSimpan
                sibuk={sibuk}
                testid="simpan-metode"
                label="Simpan perubahan"
                onClick={() => void simpan()}
              />
              <button
                type="button"
                data-testid="batal-metode"
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
        </>
      ) : null}

      <div className="mt-3.5 space-y-3.5">
        <Bagian
          testid="zis-metode-daftar"
          judul="Kanal Pembayaran"
          keterangan="Dipakai bersama oleh semua program donasi. Setiap program tinggal memilih kanal mana yang berlaku lewat kolom Metode pembayaran di Daftar Program."
          jumlah={daftar.length}
          nada={aktif.length > 0 ? "hijau" : "redup"}
        >
          {memuat && !data ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-[92px] animate-pulse rounded-2xl border border-black/[0.06] bg-white" />
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
          ) : (
            <ul className="space-y-2.5">
              {daftar.map((m) => (
                <li
                  key={m.id}
                  data-testid={`metode-baris-${m.id}`}
                  className="rounded-2xl border border-black/[0.08] bg-white p-3.5"
                >
                  <div className="flex items-start gap-2.5">
                    {m.gambarUrl ? (
                      <img
                        src={m.gambarUrl}
                        alt={`Gambar metode ${m.nama}`}
                        className="h-14 w-14 shrink-0 rounded-xl border border-black/[0.08] object-contain"
                      />
                    ) : (
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-dashed border-black/[0.14] text-ink-400">
                        <span className="text-[9px] leading-tight">tanpa gambar</span>
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Lencana teks={m.nama} warna="hijau" />
                        <Lencana teks={m.aktif ? "Aktif" : "Dimatikan"} warna={m.aktif ? "emas" : "redup"} />
                      </div>
                      {m.keterangan ? (
                        <p className="mt-1.5 text-justify text-[10.5px] leading-relaxed text-ink-600">
                          {m.keterangan}
                        </p>
                      ) : null}
                      <p
                        data-testid={`metode-gambar-${m.id}`}
                        className="mt-1 text-[10px] text-ink-500"
                      >
                        {m.gambarUrl ? "Gambar sudah diunggah dan tampil di popup donasi." : "Belum ada gambar."}
                      </p>
                    </div>
                    <TombolIkon
                      nama="pencil"
                      label={`Ubah metode ${m.nama}`}
                      testid={`metode-ubah-${m.id}`}
                      onClick={() => {
                        bukaBorang(m);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Bagian>
      </div>
    </div>
  );
}
