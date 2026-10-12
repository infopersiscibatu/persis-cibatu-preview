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
import { segarkanAgenda, useAgenda, type AgendaTampil } from "../../lib/agenda";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { pakaiSimpan } from "../../lib/panelSimpan";
import { tanggalPendek } from "../../lib/format";
import {
  hapusAgenda,
  hapusKategoriAgenda,
  tambahAgenda,
  tambahKategoriAgenda,
  ubahAgenda,
  ubahKategoriAgenda,
  urutKategoriAgenda,
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

/* --------------------------------- daftar agenda --------------------------------- */

type BorangAgenda = {
  id?: string;
  judul: string;
  tanggal: string;
  waktu: string;
  tempat: string;
  tag: string;
  isiTeks: string;
  terbit: boolean;
};

export function DaftarAgenda() {
  const data = useAgenda();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanAgenda);
  const [borang, setBorang] = useState<BorangAgenda | null>(null);

  const daftar = useMemo(() => [...data.agenda].sort((a, b) => a.date.localeCompare(b.date)), [data.agenda]);
  const opsiKategori = data.kategori.map((k) => ({ nilai: k.nama, label: k.nama }));

  const keBorang = (a?: AgendaTampil) => {
    setPesan(null);
    setBorang(
      a
        ? {
            id: a.id,
            judul: a.title,
            tanggal: a.date,
            waktu: a.time === "—" ? "" : a.time,
            tempat: a.place === "—" ? "" : a.place,
            tag: a.tag,
            isiTeks: a.detail.join("\n\n"),
            terbit: a.terbit,
          }
        : {
            judul: "",
            tanggal: hariIni(),
            waktu: "",
            tempat: "",
            tag: opsiKategori[0]?.nilai ?? "",
            isiTeks: "",
            terbit: true,
          },
    );
  };

  const ubah = (sebagian: Partial<BorangAgenda>) => setBorang((b) => (b ? { ...b, ...sebagian } : b));

  const simpan = async () => {
    if (!borang) return;
    const isi = borang.isiTeks
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const muatan = {
      judul: borang.judul,
      tanggal: borang.tanggal,
      waktu: borang.waktu,
      tempat: borang.tempat,
      tag: borang.tag,
      isi,
      terbit: borang.terbit,
    };
    const berhasil = await jalankan(
      async () => {
        if (borang.id) await ubahAgenda(borang.id, muatan);
        else await tambahAgenda(muatan);
      },
      borang.id ? "Agenda diperbarui." : "Agenda baru tersimpan.",
    );
    if (berhasil) setBorang(null);
  };

  const hapus = async (a: AgendaTampil) => {
    const setuju = await mintaKonfirmasi(`Hapus agenda "${a.title}"? Tindakan ini tidak bisa dibatalkan.`, {
      labelYa: "Ya, hapus agenda",
    });
    if (!setuju) return;
    try {
      await hapusAgenda(a.id);
      await segarkanAgenda();
      beritahu("sukses", "Agenda dihapus.");
      setPesan(null);
      if (borang?.id === a.id) setBorang(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  if (borang) {
    const bagian = borang.isiTeks
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0).length;

    return (
      <div data-testid="admin-agenda-borang">
        <KepalaBorang
          judul={borang.id ? "Ubah Agenda" : "Tambah Agenda"}
          keterangan="Isi judul, tanggal, waktu, tempat, dan kategori agenda, lalu keterangan lengkapnya. Simpan akan langsung mengubah bagian Agenda di beranda."
          aksi={
            <button
              type="button"
              data-testid="agenda-kembali"
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
            <h2 className="font-header text-[13px] font-bold text-ink-900">Judul & kategori</h2>
            <Kolom
              testid="agenda-item-judul"
              label="Judul agenda"
              nilai={borang.judul}
              onUbah={(v) => ubah({ judul: v })}
              placeholder="Peringatan Isra Mi'raj 1447 H"
            />
            <Pilih
              testid="agenda-item-tag"
              label="Kategori"
              nilai={borang.tag}
              onUbah={(v) => ubah({ tag: v })}
              opsi={opsiKategori}
              placeholder={opsiKategori.length === 0 ? "Belum ada kategori" : "Pilih kategori"}
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Waktu & tempat</h2>
            <Tanggal
              testid="agenda-item-tanggal"
              label="Tanggal agenda"
              nilai={borang.tanggal}
              onUbah={(v) => ubah({ tanggal: v })}
              petunjuk="Agenda terdekat tampil lebih dahulu di beranda."
            />
            <Kolom
              testid="agenda-item-waktu"
              label="Waktu"
              nilai={borang.waktu}
              onUbah={(v) => ubah({ waktu: v })}
              placeholder="07.30 – 11.00 WIB"
            />
            <Kolom
              testid="agenda-item-tempat"
              label="Tempat"
              nilai={borang.tempat}
              onUbah={(v) => ubah({ tempat: v })}
              placeholder="Aula PC PERSIS Cibatu"
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Keterangan lengkap</h2>
            <AreaTeks
              testid="agenda-item-isi"
              label="Keterangan"
              nilai={borang.isiTeks}
              onUbah={(v) => ubah({ isiTeks: v })}
              baris={10}
              petunjuk={`Pisahkan antarparagraf dengan satu baris kosong. Saat ini terbaca ${bagian} paragraf.`}
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">Penayangan</h2>
            <Sakelar
              testid="agenda-item-terbit"
              label="Terbitkan di situs"
              nilai={borang.terbit}
              onUbah={(v) => ubah({ terbit: v })}
              petunjuk="Bila dimatikan, agenda tersimpan sebagai draf dan tidak tampil di situs."
            />
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <TombolSimpan
              penuh={false}
              testid="simpan-agenda-item"
              sibuk={sibuk}
              nonaktif={!borang.judul.trim()}
              onClick={() => void simpan()}
            />
            {borang.id ? (
              <button
                type="button"
                data-testid="hapus-agenda-borang"
                disabled={sibuk}
                onClick={() => {
                  const asal = data.agenda.find((a) => a.id === borang.id);
                  if (asal) void hapus(asal);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-[11.5px] font-semibold text-rose-700 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="trash" className="h-[15px] w-[15px]" />
                Hapus agenda
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-agenda-daftar">
      <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
        <button
          type="button"
          data-testid="tambah-agenda"
          onClick={() => keBorang()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 px-4 py-2.5 text-[11.5px] font-semibold text-white transition active:scale-[0.98]"
        >
          <Icon name="plus" className="h-[15px] w-[15px]" />
          Tambah agenda
        </button>
      </div>
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {daftar.map((a) => (
          <div
            key={a.id}
            data-testid={`agenda-baris-${a.id}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-[12px] leading-snug font-semibold text-ink-900">
                  {a.title}
                </span>
                <span className="mt-1 block text-[10px] font-semibold tracking-[0.06em] text-persis-800 uppercase">
                  {a.tag} · {a.date ? tanggalPendek(a.date) : "—"} · {a.time} · {a.views} dibaca
                </span>
                <span className="mt-0.5 block text-[10px] text-ink-400">{a.place}</span>
                {!a.terbit ? (
                  <span className="mt-1 inline-block rounded-full bg-pastelgold px-2 py-[2px] text-[9px] font-bold tracking-[0.08em] text-gold-700 uppercase">
                    Draf
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 flex-col items-stretch gap-1.5">
                <button
                  type="button"
                  data-testid={`agenda-ubah-${a.id}`}
                  onClick={() => keBorang(a)}
                  className="rounded-full border border-black/[0.12] px-2.5 py-1.5 text-[10.5px] font-semibold text-persis-900 transition active:scale-[0.98]"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  data-testid={`agenda-hapus-${a.id}`}
                  onClick={() => void hapus(a)}
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
          Belum ada agenda. Tekan "Tambah agenda" untuk menulis kegiatan pertama.
        </p>
      ) : null}

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Bagian "Agenda" di beranda menampilkan lima kegiatan dengan tanggal paling dekat. Kategori agenda tampil pada
        rincian agenda.
      </p>
    </div>
  );
}

/* --------------------------------- kategori --------------------------------- */

type BarisKategori = { id?: string; nama: string; aktif: boolean; jumlah?: number };

export function KategoriAgenda() {
  const data = useAgenda();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan(segarkanAgenda);
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
        await ubahKategoriAgenda(b.id, muatan);
        urut.push(b.id);
        hasil.push({ ...b, ...muatan });
      } else {
        const jawab = (await tambahKategoriAgenda({ nama: muatan.nama })) as { kategori?: { id: string }[] };
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

    if (urut.length > 0) await urutKategoriAgenda(urut);
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
      `Hapus kategori ${b.nama || "ini"} dari daftar agenda? Kategori yang masih dipakai agenda tidak akan terhapus.`,
      { labelYa: "Ya, hapus kategori" },
    );
    if (!setuju) return;
    try {
      await hapusKategoriAgenda(b.id);
      await segarkanAgenda();
      setBaris((s) => s.filter((_, k) => k !== i));
      beritahu("sukses", `${b.nama || "Kategori"} dihapus.`);
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  return (
    <div data-testid="admin-agenda-kategori">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-2.5">
        {baris.map((b, i) => (
          <div
            key={b.id ?? `baru-${i}`}
            data-testid={`kategori-agenda-baris-${i}`}
            className="rounded-2xl border border-black/[0.08] bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                Urutan {i + 1}
                {b.jumlah !== undefined ? ` · ${b.jumlah} agenda` : " · baru"}
              </span>
              <span className="flex items-center gap-1.5">
                <TombolIkon
                  nama="chevron"
                  label="Geser ke atas"
                  testid={`kategori-agenda-naik-${i}`}
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
                  testid={`kategori-agenda-turun-${i}`}
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
                  testid={`kategori-agenda-hapus-${i}`}
                  bahaya
                  onClick={() => void hapus(i)}
                />
              </span>
            </div>
            <Kolom
              testid={`kategori-agenda-nama-${i}`}
              label="Nama kategori"
              nilai={b.nama}
              onUbah={(v) => isi(i, { nama: v })}
              placeholder="Kesiswaan"
            />
            <div className="mt-2">
              <Sakelar
                testid={`kategori-agenda-aktif-${i}`}
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
        data-testid="tambah-kategori-agenda"
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
          testid="simpan-agenda-kategori"
          sibuk={sibuk}
          nonaktif={!kotor}
          onClick={() =>
            void jalankan(async () => {
              await simpanSemua();
              setKotor(false);
            }, "Kategori agenda tersimpan.")
          }
        />
      </div>
    </div>
  );
}
