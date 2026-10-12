import { useEffect, useMemo, useState } from "react";
import {
  AreaTeks,
  KepalaBorang,
  Kolom,
  Pesan,
  Pilih,
  Sakelar,
  Tanggal,
  TombolIkon,
  TombolSimpan,
} from "../../components/admin/Form";
import { Icon } from "../../components/Icons";
import { segarkanPengumuman, usePengumuman, type PengumumanTampil } from "../../lib/pengumuman";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { pakaiSimpan } from "../../lib/panelSimpan";
import { tanggalPendek } from "../../lib/format";
import {
  hapusKategoriPengumuman,
  hapusPengumuman,
  tambahKategoriPengumuman,
  tambahPengumuman,
  ubahKategoriPengumuman,
  ubahPengumuman,
  urutKategoriPengumuman,
} from "../../lib/admin";

/** Pindahkan satu baris pada daftar. */
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

/* ------------------------------ daftar pengumuman ------------------------------ */

type BorangPengumuman = {
  id?: string;
  judul: string;
  kategori: string;
  tanggal: string;
  ringkasan: string;
  isiTeks: string;
  disematkan: boolean;
  terbit: boolean;
};

export function DaftarPengumuman() {
  const data = usePengumuman();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanPengumuman);
  const [borang, setBorang] = useState<BorangPengumuman | null>(null);

  const daftar = useMemo(
    () => [...data.pengumuman].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date)),
    [data.pengumuman],
  );
  const opsiKategori = data.kategori.map((k) => ({ nilai: k.nama, label: k.nama }));

  const keBorang = (p?: PengumumanTampil) => {
    setPesan(null);
    setBorang(
      p
        ? {
            id: p.id,
            judul: p.title,
            kategori: p.category,
            tanggal: p.date,
            ringkasan: p.summary,
            isiTeks: p.detail.join("\n\n"),
            disematkan: p.pinned === true,
            terbit: p.terbit,
          }
        : {
            judul: "",
            kategori: opsiKategori[0]?.nilai ?? "",
            tanggal: hariIni(),
            ringkasan: "",
            isiTeks: "",
            disematkan: false,
            terbit: true,
          },
    );
  };

  const ubah = (sebagian: Partial<BorangPengumuman>) => setBorang((b) => (b ? { ...b, ...sebagian } : b));

  const simpan = async () => {
    if (!borang) return;
    const isi = borang.isiTeks
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const muatan = {
      judul: borang.judul,
      kategori: borang.kategori,
      tanggal: borang.tanggal,
      ringkasan: borang.ringkasan,
      isi,
      disematkan: borang.disematkan,
      terbit: borang.terbit,
    };
    const berhasil = await jalankan(
      async () => {
        if (borang.id) await ubahPengumuman(borang.id, muatan);
        else await tambahPengumuman(muatan);
      },
      borang.id ? "Pengumuman diperbarui." : "Pengumuman baru tersimpan.",
    );
    if (berhasil) setBorang(null);
  };

  const hapus = async (p: PengumumanTampil) => {
    const setuju = await mintaKonfirmasi(`Hapus pengumuman "${p.title}"? Tindakan ini tidak bisa dibatalkan.`, {
      labelYa: "Ya, hapus pengumuman",
    });
    if (!setuju) return;
    try {
      await hapusPengumuman(p.id);
      await segarkanPengumuman();
      beritahu("sukses", "Pengumuman dihapus.");
      setPesan(null);
      if (borang?.id === p.id) setBorang(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  const jadikanUtama = async (p: PengumumanTampil) => {
    try {
      await ubahPengumuman(p.id, { disematkan: !p.pinned });
      await segarkanPengumuman();
      beritahu("sukses", p.pinned ? "Sematan pengumuman dilepas." : "Pengumuman ditandai sebagai pengumuman utama.");
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menyematkan." });
    }
  };

  if (borang) {
    const bagian = borang.isiTeks
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0).length;

    return (
      <div data-testid="admin-pengumuman-borang">
        <KepalaBorang
          judul={borang.id ? "Ubah Pengumuman" : "Tambah Pengumuman"}
          keterangan="Isi judul, kategori, tanggal, ringkasan, lalu isi lengkap pengumuman. Simpan akan langsung mengubah bagian Pengumuman di beranda."
          aksi={
            <button
              type="button"
              data-testid="pengumuman-kembali"
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
            <h2 className="font-header text-[13px] font-bold text-ink-900">Judul & keterangan</h2>
            <Kolom
              testid="pengumuman-item-judul"
              label="Judul pengumuman"
              nilai={borang.judul}
              onUbah={(v) => ubah({ judul: v })}
              placeholder="Jadwal Ujian Akhir Semester Ganjil 1447 H"
            />
            <Pilih
              testid="pengumuman-item-kategori"
              label="Kategori"
              nilai={borang.kategori}
              onUbah={(v) => ubah({ kategori: v })}
              opsi={opsiKategori}
              placeholder={opsiKategori.length === 0 ? "Belum ada kategori" : "Pilih kategori"}
            />
            <Tanggal
              testid="pengumuman-item-tanggal"
              label="Tanggal pengumuman"
              nilai={borang.tanggal}
              onUbah={(v) => ubah({ tanggal: v })}
              petunjuk="Pengumuman terbaru tampil lebih dahulu."
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Isi pengumuman</h2>
            <AreaTeks
              testid="pengumuman-item-ringkasan"
              label="Ringkasan"
              nilai={borang.ringkasan}
              onUbah={(v) => ubah({ ringkasan: v })}
              baris={3}
              petunjuk="Tampil pada kartu pengumuman di beranda."
            />
            <AreaTeks
              testid="pengumuman-item-isi"
              label="Isi lengkap"
              nilai={borang.isiTeks}
              onUbah={(v) => ubah({ isiTeks: v })}
              baris={10}
              petunjuk={`Pisahkan antarparagraf dengan satu baris kosong. Saat ini terbaca ${bagian} paragraf.`}
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Penayangan</h2>
            <Sakelar
              testid="pengumuman-item-sematkan"
              label="Jadikan pengumuman utama"
              nilai={borang.disematkan}
              onUbah={(v) => ubah({ disematkan: v })}
              petunjuk="Tampil paling atas dengan pita Disematkan di beranda. Hanya satu pengumuman yang bisa disematkan."
            />
            <Sakelar
              testid="pengumuman-item-terbit"
              label="Terbitkan di situs"
              nilai={borang.terbit}
              onUbah={(v) => ubah({ terbit: v })}
              petunjuk="Bila dimatikan, pengumuman tersimpan sebagai draf dan tidak tampil di situs."
            />
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <TombolSimpan
              penuh={false}
              testid="simpan-pengumuman-item"
              sibuk={sibuk}
              nonaktif={!borang.judul.trim()}
              onClick={() => void simpan()}
            />
            {borang.id ? (
              <button
                type="button"
                data-testid="hapus-pengumuman-borang"
                disabled={sibuk}
                onClick={() => {
                  const asal = data.pengumuman.find((p) => p.id === borang.id);
                  if (asal) void hapus(asal);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-[11.5px] font-semibold text-rose-700 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="trash" className="h-[15px] w-[15px]" />
                Hapus pengumuman
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-pengumuman-daftar">
      <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
        <button
          type="button"
          data-testid="tambah-pengumuman"
          onClick={() => keBorang()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 px-4 py-2.5 text-[11.5px] font-semibold text-white transition active:scale-[0.98]"
        >
          <Icon name="plus" className="h-[15px] w-[15px]" />
          Tambah pengumuman
        </button>
      </div>
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {daftar.map((p) => (
          <div
            key={p.id}
            data-testid={`pengumuman-baris-${p.id}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-[12px] leading-snug font-semibold text-ink-900">
                  {p.title}
                </span>
                <span className="mt-1 block text-[10px] font-semibold tracking-[0.06em] text-persis-800 uppercase">
                  {p.category} · {p.date ? tanggalPendek(p.date) : "—"} · {p.views} dibaca
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  {p.pinned ? (
                    <span className="rounded-full bg-gold-500 px-2 py-[2px] text-[9px] font-bold tracking-[0.08em] text-persis-950 uppercase">
                      Disematkan
                    </span>
                  ) : null}
                  {!p.terbit ? (
                    <span className="rounded-full bg-pastelgold px-2 py-[2px] text-[9px] font-bold tracking-[0.08em] text-gold-700 uppercase">
                      Draf
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-stretch gap-1.5">
                <button
                  type="button"
                  data-testid={`pengumuman-ubah-${p.id}`}
                  onClick={() => keBorang(p)}
                  className="rounded-full border border-black/[0.12] px-2.5 py-1.5 text-[10.5px] font-semibold text-persis-900 transition active:scale-[0.98]"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  data-testid={`pengumuman-sematkan-${p.id}`}
                  onClick={() => void jadikanUtama(p)}
                  className="rounded-full border border-gold-500/40 bg-cream-50 px-2.5 py-1.5 text-[10.5px] font-semibold text-gold-700 transition active:scale-[0.98]"
                >
                  {p.pinned ? "Lepas" : "Utamakan"}
                </button>
                <button
                  type="button"
                  data-testid={`pengumuman-hapus-${p.id}`}
                  onClick={() => void hapus(p)}
                  className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10.5px] font-semibold text-rose-700 transition active:scale-[0.98]"
                >
                  Hapus
                </button>
              </span>
            </div>
          </div>
        ))}
      </div>

      {daftar.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-persis-900/20 p-5 text-center text-[11.5px] text-ink-600">
          Belum ada pengumuman. Tekan "Tambah pengumuman" untuk menulis yang pertama.
        </p>
      ) : null}

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Bagian "Pengumuman Terbaru" di beranda menampilkan pengumuman yang disematkan paling atas, lalu diikuti empat
        pengumuman terbaru lainnya.
      </p>
    </div>
  );
}

/* --------------------------------- kategori --------------------------------- */

type BarisKategori = { id?: string; nama: string; aktif: boolean; jumlah?: number };

export function KategoriPengumuman() {
  const data = usePengumuman();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanPengumuman);
  const [baris, setBaris] = useState<BarisKategori[]>([]);
  const [terisi, setTerisi] = useState(false);
  const [kotor, setKotor] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      setBaris(data.kategori.map((k) => ({ id: k.id, nama: k.nama, aktif: k.aktif, jumlah: k.jumlah })));
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.kategori]);

  const isi = (i: number, sebagian: Partial<BarisKategori>) => {
    setKotor(true);
    setBaris((s) => s.map((r, k) => (k === i ? { ...r, ...sebagian } : r)));
  };

  const simpanSemua = async () => {
    const dikenal = new Set(baris.filter((b) => b.id).map((b) => b.id as string));
    const urut: string[] = [];
    const hasil: BarisKategori[] = [];

    for (const b of baris) {
      if (!b.nama.trim()) {
        hasil.push(b);
        continue;
      }
      const muatan = { nama: b.nama.trim(), aktif: b.aktif };
      if (b.id) {
        await ubahKategoriPengumuman(b.id, muatan);
        urut.push(b.id);
        hasil.push({ ...b, ...muatan });
      } else {
        const jawab = (await tambahKategoriPengumuman({ nama: muatan.nama })) as { kategori?: { id: string }[] };
        const baru = (jawab.kategori ?? []).find((k) => !dikenal.has(k.id));
        if (baru) {
          dikenal.add(baru.id);
          urut.push(baru.id);
          hasil.push({ ...b, ...muatan, id: baru.id, jumlah: 0 });
        } else {
          hasil.push({ ...b, ...muatan });
        }
      }
    }

    if (urut.length > 0) await urutKategoriPengumuman(urut);
    setBaris(hasil);
  };

  const hapus = async (i: number) => {
    const b = baris[i];
    if (!b.id) {
      setBaris((s) => s.filter((_, k) => k !== i));
      setKotor(true);
      return;
    }
    const setuju = await mintaKonfirmasi(
      `Hapus kategori ${b.nama || "ini"} dari daftar pengumuman? Kategori yang masih dipakai pengumuman tidak akan terhapus.`,
      { labelYa: "Ya, hapus kategori" },
    );
    if (!setuju) return;
    try {
      await hapusKategoriPengumuman(b.id);
      await segarkanPengumuman();
      setBaris((s) => s.filter((_, k) => k !== i));
      beritahu("sukses", `${b.nama || "Kategori"} dihapus.`);
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  return (
    <div data-testid="admin-pengumuman-kategori">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {baris.map((b, i) => (
          <div
            key={b.id ?? `baru-${i}`}
            data-testid={`kategori-pengumuman-baris-${i}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                Urutan {i + 1}
                {b.jumlah !== undefined ? ` · ${b.jumlah} pengumuman` : " · baru"}
              </span>
              <span className="flex items-center gap-1.5">
                <TombolIkon
                  nama="chevron"
                  label="Geser ke atas"
                  testid={`kategori-pengumuman-naik-${i}`}
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
                  testid={`kategori-pengumuman-turun-${i}`}
                  putar={90}
                  nonaktif={i === baris.length - 1}
                  onClick={() => {
                    setKotor(true);
                    setBaris((s) => geserBaris(s, i, 1));
                  }}
                />
                <TombolIkon
                  nama="x"
                  label={`Hapus ${b.nama || "kategori"}`}
                  testid={`kategori-pengumuman-hapus-${i}`}
                  bahaya
                  onClick={() => void hapus(i)}
                />
              </span>
            </div>
            <Kolom
              testid={`kategori-pengumuman-nama-${i}`}
              label="Nama kategori"
              nilai={b.nama}
              onUbah={(v) => isi(i, { nama: v })}
              placeholder="Akademik"
            />
            <div className="mt-2">
              <Sakelar
                testid={`kategori-pengumuman-aktif-${i}`}
                label="Tampilkan sebagai pilihan kategori"
                nilai={b.aktif}
                onUbah={(v) => isi(i, { aktif: v })}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-testid="tambah-kategori-pengumuman"
        onClick={() => {
          setBaris((s) => [...s, { nama: "", aktif: true }]);
          setKotor(true);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-persis-900/25 px-4 py-2.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="plus" className="h-3.5 w-3.5 text-gold-600" />
        Tambah kategori
      </button>
      <div className="mt-3.5">
        <TombolSimpan
          testid="simpan-pengumuman-kategori"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanSemua();
              setKotor(false);
            }, "Kategori pengumuman tersimpan.")
          }
        />
      </div>
    </div>
  );
}
