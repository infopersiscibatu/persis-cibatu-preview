import { useMemo, useRef, useState } from "react";
import { Icon } from "../../components/Icons";
import {
  KepalaBorang,
  Kolom,
  Pesan,
  Sakelar,
  TombolIkon,
  TombolSimpan,
} from "../../components/admin/Form";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { pakaiSimpan } from "../../lib/panelSimpan";
import { hapusIklan, tambahIklan, ubahIklan, unggahBerkas, urutIklan } from "../../lib/admin";
import { segarkanIklan, useIklan, type Iklan } from "../../lib/iklan";

/**
 * Pengelolaan iklan: satu iklan tampil di dalam paragraf isi Berita dan Artikel.
 *
 * Admin bisa mengunggah gambar iklan, menulis judul dan keterangan singkat, menentukan
 * tautan tujuan (halaman situs atau alamat luar), mengatur urutan, dan menyembunyikan
 * iklan yang sedang tidak dipakai.
 */

type BorangIklan = {
  id?: string;
  gambarUrl: string;
  judul: string;
  tautan: string;
  aktif: boolean;
};

/** Geser satu baris ke atas (-1) atau ke bawah (+1). */
function geserBaris<T>(daftar: T[], i: number, arah: -1 | 1): T[] {
  const j = i + arah;
  if (j < 0 || j >= daftar.length) return daftar;
  const salinan = [...daftar];
  [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
  return salinan;
}

/** Pilihan halaman situs yang bisa dipakai sebagai tautan iklan. */
const HALAMAN_SITUS: [string, string][] = [
  ["#/beranda", "Beranda"],
  ["#/profil", "Profil"],
  ["#/jenjang", "Jenjang"],
  ["#/spmb", "SPMB / PPDB"],
  ["#/kajian", "Kajian"],
  ["#/galeri", "Galeri"],
  ["#/berita", "Berita"],
  ["#/artikel", "Artikel"],
  ["#/donasi", "Donasi & ZIS"],
  ["#/kontak", "Kontak"],
  ["#/wali", "Portal Wali"],
];

export function IklanBerita() {
  const data = useIklan();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanIklan);
  const [borang, setBorang] = useState<BorangIklan | null>(null);
  const berkasRef = useRef<HTMLInputElement>(null);

  const daftar = useMemo(() => [...data], [data]);

  const keBorang = (s?: Iklan) => {
    setPesan(null);
    setBorang(
      s
        ? {
            id: s.id,
            gambarUrl: s.gambarUrl ?? "",
            judul: s.judul,
            tautan: s.tautan ?? "",
            aktif: s.aktif,
          }
        : { gambarUrl: "", judul: "", tautan: "", aktif: true },
    );
  };

  const pilihBerkas = async (berkas: File | undefined) => {
    if (!berkas || !borang) return;
    if (berkas.size > 25 * 1024 * 1024) {
      setPesan({ tipe: "galat", teks: "Ukuran gambar melebihi 25 MB. Pilih gambar yang lebih kecil." });
      return;
    }
    try {
      const hasil = await unggahBerkas(berkas, "iklan");
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
      judul: borang.judul,
      tautan: borang.tautan,
      aktif: borang.aktif,
    };
    const berhasil = await jalankan(
      async () => {
        if (borang.id) await ubahIklan(borang.id, muatan);
        else await tambahIklan(muatan);
      },
      borang.id ? "Iklan diperbarui." : "Iklan ditambahkan.",
    );
    if (berhasil) setBorang(null);
  };

  const geser = async (i: number, arah: -1 | 1) => {
    const baru = geserBaris(daftar, i, arah);
    if (baru === daftar) return;
    await jalankan(
      () => urutIklan(baru.map((s) => s.id)),
      "Susunan iklan tersimpan.",
    );
  };

  const aktifkan = async (s: Iklan, nilai: boolean) => {
    await jalankan(
      () => ubahIklan(s.id, { aktif: nilai }),
      nilai ? "Iklan ditampilkan di berita dan artikel." : "Iklan disembunyikan.",
    );
  };

  const hapus = async (s: Iklan) => {
    const setuju = await mintaKonfirmasi(`Hapus iklan "${s.judul}"? Tindakan ini tidak bisa dibatalkan.`, {
      labelYa: "Ya, hapus iklan",
    });
    if (!setuju) return;
    try {
      await hapusIklan(s.id);
      await segarkanIklan();
      beritahu("sukses", "Iklan dihapus.");
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  /* --------------------------------- borang --------------------------------- */

  if (borang) {
    return (
      <div data-testid="admin-iklan-borang">
        <KepalaBorang
          judul={borang.id ? "Ubah Iklan" : "Tambah Iklan"}
          keterangan="Iklan tampil sebagai satu gambar penuh selebar kolom di dalam isi berita dan artikel, tanpa tulisan tambahan. Bila ada beberapa iklan aktif, situs memilihnya bergantian menurut judul postingan."
          aksi={
            <button
              type="button"
              data-testid="iklan-batal"
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
            <h2 className="font-header text-[13px] font-bold text-ink-900">Gambar iklan</h2>
            <p className="text-[10.5px] leading-relaxed text-ink-500">
              Inilah satu-satunya isi iklan — tidak ada tulisan yang menemani gambarnya di situs.
            </p>
            <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-cream-50">
              {borang.gambarUrl ? (
                <img
                  src={borang.gambarUrl}
                  alt="Pratinjau gambar iklan"
                  data-testid="iklan-pratinjau"
                  className="h-[132px] w-full object-cover"
                />
              ) : (
                <p className="grid h-[132px] place-items-center text-[11px] text-ink-400">Belum ada gambar dipilih</p>
              )}
            </div>
            <button
              type="button"
              data-testid="iklan-pilih-gambar"
              disabled={sibuk}
              onClick={() => berkasRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-persis-900/20 bg-cream-50 px-3.5 py-2 text-[11.5px] font-semibold text-persis-900 transition active:scale-[0.98] disabled:opacity-50"
            >
              <Icon name="image" className="h-[15px] w-[15px]" />
              {borang.gambarUrl ? "Ganti gambar" : "Unggah gambar"}
            </button>
            <input
              ref={berkasRef}
              type="file"
              accept="image/*"
              data-testid="berkas-iklan"
              className="hidden"
              onChange={(e) => void pilihBerkas(e.target.files?.[0])}
            />
            <p className="text-[10.5px] leading-relaxed text-ink-400">
              Gambar tampil penuh selebar kolom isi berita dan artikel dengan tinggi ± 132 piksel di layar HP, jadi
              sebaiknya pakai gambar mendatar (landscape) dengan perbandingan ± 3 : 1 — misalnya 900 × 300 atau
              800 × 400 piksel. Berkas maksimal 25 MB.
            </p>
            {borang.gambarUrl ? (
              <button
                type="button"
                data-testid="iklan-hapus-gambar"
                disabled={sibuk}
                onClick={() => setBorang({ ...borang, gambarUrl: "" })}
                className="text-[11px] font-semibold text-rose-700 transition active:scale-[0.98] disabled:opacity-50"
              >
                Hapus gambar
              </button>
            ) : null}
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Nama iklan</h2>
            <Kolom
              testid="iklan-judul"
              label="Nama iklan"
              nilai={borang.judul}
              onUbah={(v) => setBorang({ ...borang, judul: v })}
              placeholder="Mis. Iklan Toko Bangunan Al-Amanah"
              petunjuk="Nama ini hanya terlihat di panel admin ini (dan dipakai sebagai keterangan gambar untuk pembaca layar), tidak tampil di situs."
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Tautan tujuan</h2>
            <Kolom
              testid="iklan-tautan"
              label="Alamat tautan"
              nilai={borang.tautan}
              onUbah={(v) => setBorang({ ...borang, tautan: v })}
              placeholder="#/spmb"
              petunjuk="Isi #/spmb untuk halaman situs, atau https://... untuk alamat luar (terbuka di tab baru). Boleh dikosongkan bila iklan tanpa tautan."
            />
            <div className="flex flex-wrap gap-1.5">
              {HALAMAN_SITUS.map(([nilai, label]) => (
                <button
                  key={nilai}
                  type="button"
                  data-testid={`iklan-halaman-${nilai.replace("#/", "")}`}
                  onClick={() => setBorang({ ...borang, tautan: nilai })}
                  className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition active:scale-[0.97] ${
                    borang.tautan === nilai
                      ? "border-persis-900 bg-persis-900 text-white"
                      : "border-black/[0.12] text-persis-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Penayangan</h2>
            <Sakelar
              testid="iklan-aktif"
              label="Tampilkan iklan di berita dan artikel"
              nilai={borang.aktif}
              onUbah={(v) => setBorang({ ...borang, aktif: v })}
              petunjuk="Bila dimatikan, iklan disimpan tetapi tidak ikut tampil."
            />
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <TombolSimpan
              penuh={false}
              testid="simpan-iklan"
              sibuk={sibuk}
              nonaktif={!borang.judul.trim() || !borang.gambarUrl}
              onClick={() => void simpan()}
            />
            {borang.id ? (
              <button
                type="button"
                data-testid="hapus-iklan-borang"
                disabled={sibuk}
                onClick={() => {
                  const asal = daftar.find((s) => s.id === borang.id);
                  if (asal) void hapus(asal);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-[11.5px] font-semibold text-rose-700 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="trash" className="h-[15px] w-[15px]" />
                Hapus iklan
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------- daftar --------------------------------- */

  return (
    <div data-testid="admin-iklan">
      <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
        <button
          type="button"
          data-testid="tambah-iklan"
          onClick={() => keBorang()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 px-4 py-2.5 text-[11.5px] font-semibold text-white transition active:scale-[0.98]"
        >
          <Icon name="plus" className="h-[15px] w-[15px]" />
          Tambah iklan
        </button>
      </div>
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <p className="mt-4 rounded-2xl border border-black/[0.08] bg-cream-50 p-3.5 text-justify text-[11px] leading-relaxed text-ink-600">
        Iklan tampil sebagai satu gambar penuh selebar kolom di dalam isi berita dan artikel — satu kolom di setiap
        postingan. Bila ada beberapa iklan aktif, situs memilihnya bergantian menurut judul postingan, sehingga satu
        halaman bisa menampilkan iklan yang berbeda dari halaman lainnya. Selama belum ada iklan yang tampil, situs
        menampilkan kolom bertuliskan &ldquo;Space Iklan Disini Silahkan Hubungi Admin&rdquo;.
      </p>

      <div className="mt-4 space-y-2.5">
        {daftar.map((s, i) => (
          <div key={s.id} data-testid={`iklan-baris-${i}`} className="rounded-2xl border border-black/[0.08] bg-white p-3">
            <div className="flex items-start gap-3">
              {s.gambarUrl ? (
                <img
                  src={s.gambarUrl}
                  alt=""
                  className="h-[48px] w-[86px] shrink-0 rounded-xl border border-black/[0.06] object-cover"
                />
              ) : (
                <span className="grid h-[48px] w-[86px] shrink-0 place-items-center rounded-xl border border-black/[0.06] bg-cream-50 text-ink-400">
                  <Icon name="image" className="h-[18px] w-[18px]" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-[12px] leading-snug font-semibold text-ink-900">
                  {s.judul}
                </span>
                <span className="mt-0.5 block truncate text-[10.5px] text-ink-400">{s.tautan || "Tanpa tautan"}</span>
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
                  label="Geser ke atas"
                  testid={`iklan-naik-${i}`}
                  putar={-90}
                  nonaktif={i === 0}
                  onClick={() => void geser(i, -1)}
                />
                <TombolIkon
                  nama="chevron"
                  label="Geser ke bawah"
                  testid={`iklan-turun-${i}`}
                  putar={90}
                  nonaktif={i === daftar.length - 1}
                  onClick={() => void geser(i, 1)}
                />
                <TombolIkon
                  nama="pencil"
                  label={`Ubah iklan: ${s.judul}`}
                  testid={`iklan-ubah-${i}`}
                  onClick={() => keBorang(s)}
                />
                <TombolIkon
                  nama="trash"
                  label={`Hapus iklan: ${s.judul}`}
                  testid={`iklan-hapus-${i}`}
                  bahaya
                  onClick={() => void hapus(s)}
                />
              </span>
              <button
                type="button"
                data-testid={`iklan-toggle-${i}`}
                disabled={sibuk}
                onClick={() => void aktifkan(s, !s.aktif)}
                className={`rounded-full px-3 py-1.5 text-[10.5px] font-bold transition active:scale-[0.98] disabled:opacity-50 ${
                  s.aktif ? "bg-mint-deep text-persis-800" : "bg-black/[0.06] text-ink-600"
                }`}
              >
                {s.aktif ? "Tampil" : "Disembunyikan"}
              </button>
            </div>
          </div>
        ))}

        {daftar.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/[0.15] p-4 text-center text-[11.5px] text-ink-600">
            Belum ada iklan. Tambahkan satu iklan untuk mulai menampilkannya di berita dan artikel.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default IklanBerita;
