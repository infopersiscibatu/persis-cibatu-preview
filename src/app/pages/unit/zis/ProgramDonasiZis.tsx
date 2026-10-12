import { useCallback, useState } from "react";
import PilihGambar from "../../../components/admin/PilihGambar";
import {
  Angka,
  AreaTeks,
  DaftarTeks,
  KepalaBorang,
  Kolom,
  Pesan,
  Pilih,
  PilihBanyak,
  Sakelar,
  Tanggal,
  TombolIkon,
  TombolSimpan,
} from "../../../components/admin/Form";
import { Icon } from "../../../components/Icons";
import { rupiah, tanggalPendek } from "../../../lib/format";
import { beritahu, mintaKonfirmasi } from "../../../lib/notifikasiAdmin";
import {
  ambilProgramZis,
  hapusProgramZis,
  simpanProgramZis,
  useZisData,
  type BorangProgramZis,
  type KategoriProgram,
  type MetodeBayarZis,
  type ProgramZis,
} from "../../../lib/zis";
import { Bagian, Kosong } from "./Bagian";

/**
 * Daftar Program Donasi — membuat, mengubah, dan menghapus program.
 * Isiannya: nama program, gambar, kategori (dari menu Kategori Program), pembuat
 * program, target dana, keterangan, dan rincian penggunaan dana.
 *
 * Dana terkumpul tidak diisi manual: angkanya bertambah sendiri dari donasi yang
 * sudah diverifikasi petugas pada kartu Perlu Verifikasi di Dashboard.
 */

const isian =
  "w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-persis-800/40 focus:ring-2 focus:ring-persis-800/10";

const angkaDari = (teks: string) => Math.round(Number(String(teks).replace(/[^\d]/g, "")) || 0);

const hariIni = () => new Date().toISOString().slice(0, 10);

/** Kategori bawaan pada formulir program. */
type Borang = BorangProgramZis & { id?: string };

const kosongkan = (kategori: string, pengelola: string, metode: string[]): Borang => ({
  judul: "",
  kategori,
  gambarUrl: "",
  mediaId: null,
  pengelola,
  target: 0,
  batas: "",
  ringkasan: "",
  isi: [],
  rincian: [{ item: "", jumlah: 0 }],
  metode,
  aktif: true,
});

/** Penyunting rincian penggunaan dana: satu baris = satu keperluan dan jumlahnya. */
function Rincian({ nilai, onUbah }: { nilai: { item: string; jumlah: number }[]; onUbah: (v: { item: string; jumlah: number }[]) => void }) {
  const ubah = (i: number, bagian: Partial<{ item: string; jumlah: number }>) =>
    onUbah(nilai.map((r, j) => (j === i ? { ...r, ...bagian } : r)));

  return (
    <div className="space-y-2">
      <span className="field-label">Rincian penggunaan dana</span>
      {nilai.length === 0 ? (
        <p className="text-[10.5px] leading-relaxed text-ink-400">Belum ada rincian.</p>
      ) : null}
      {nilai.map((r, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            className={isian}
            data-testid={`program-rincian-item-${i}`}
            value={r.item}
            placeholder="Mis. Pembelian 20 set meja belajar"
            aria-label={`Keperluan rincian ${i + 1}`}
            onChange={(e) => ubah(i, { item: e.target.value })}
          />
          <input
            className={`${isian} w-[130px] shrink-0`}
            data-testid={`program-rincian-jumlah-${i}`}
            value={r.jumlah ? String(r.jumlah) : ""}
            inputMode="numeric"
            placeholder="0"
            aria-label={`Jumlah rincian ${i + 1}`}
            onChange={(e) => ubah(i, { jumlah: angkaDari(e.target.value) })}
          />
          <TombolIkon
            nama="trash"
            label={`Hapus rincian ${i + 1}`}
            bahaya
            testid={`program-rincian-hapus-${i}`}
            onClick={() => onUbah(nilai.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <button
        type="button"
        data-testid="program-rincian-tambah"
        onClick={() => onUbah([...nilai, { item: "", jumlah: 0 }])}
        className="text-[11px] font-semibold text-persis-900 underline"
      >
        Tambah baris rincian
      </button>
      <p className="text-[10px] leading-relaxed text-ink-400">
        Jumlah diisi angka rupiah tanpa titik, mis. 15000000. Rincian ini tampil pada halaman program di situs.
      </p>
    </div>
  );
}

export default function ProgramDonasiZis({ namaPetugas }: { namaPetugas?: string }) {
  const muat = useCallback(() => ambilProgramZis(), []);
  const { data, setData, memuat, galat, muat: segarkan } = useZisData(muat);
  const [borang, setBorang] = useState<Borang | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  const daftar: ProgramZis[] = data?.program ?? [];
  const kategori: KategoriProgram[] = (data?.kategori ?? []).filter((k) => k.aktif);
  const semuaMetode: MetodeBayarZis[] = data?.metode ?? [];
  const metodeAktif = semuaMetode.filter((m) => m.aktif).map((m) => m.id);

  const bukaBorang = (p?: ProgramZis) => {
    setPesan(null);
    const bawaan = namaPetugas ?? "";
    if (!p) {
      setBorang({ ...kosongkan(kategori[0]?.nama ?? "", bawaan, metodeAktif), batas: "" });
      return;
    }
    setBorang({
      id: p.id,
      judul: p.judul,
      kategori: p.kategori,
      gambarUrl: p.gambarUrl,
      mediaId: p.mediaId,
      pengelola: p.pengelola,
      target: p.target,
      batas: p.batas ?? "",
      ringkasan: p.ringkasan,
      isi: p.isi,
      rincian: p.rincian.length > 0 ? p.rincian : [{ item: "", jumlah: 0 }],
      metode: p.metode && p.metode.length > 0 ? p.metode : metodeAktif,
      aktif: p.aktif,
    });
  };

  const simpan = async () => {
    if (!borang) return;
    setSibuk(true);
    setPesan(null);
    try {
      const daftarBaru = await simpanProgramZis(
        {
          judul: borang.judul,
          kategori: borang.kategori,
          gambarUrl: borang.gambarUrl,
          mediaId: borang.mediaId,
          pengelola: borang.pengelola,
          target: borang.target,
          batas: borang.batas || hariIni(),
          ringkasan: borang.ringkasan,
          isi: borang.isi,
          rincian: borang.rincian.filter((r) => r.item.trim() || r.jumlah > 0),
          metode: borang.metode,
          aktif: borang.aktif,
        },
        borang.id,
      );
      setData({ program: daftarBaru, kategori: data?.kategori ?? [], metode: semuaMetode });
      beritahu("sukses", borang.id ? "Program donasi diperbarui." : "Program donasi dibuat.");
      setBorang(null);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Program tidak bisa disimpan." });
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async (p: ProgramZis) => {
    const lanjut = await mintaKonfirmasi(
      `Hapus program “${p.judul}”? Riwayat laporan dan daftar donaturnya ikut terhapus, dan program ini hilang dari situs.`,
      { judul: "Hapus program donasi", labelYa: "Ya, hapus" },
    );
    if (!lanjut) return;
    try {
      setData({ program: await hapusProgramZis(p.id), kategori: data?.kategori ?? [], metode: semuaMetode });
      beritahu("sukses", `Program “${p.judul}” dihapus.`);
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Program tidak bisa dihapus.");
    }
  };

  return (
    <div data-testid="zis-program">
      <KepalaBorang
        judul="Daftar Program"
        keterangan="Program donasi yang tampil di situs. Dana terkumpul bertambah sendiri dari donasi yang diverifikasi, jadi tidak perlu diisi manual."
      />

      {borang ? (
        <>
          <PilihGambar
            testid="program-gambar"
            folder="program-donasi"
            label="Gambar program"
            petunjuk="Gambar utama yang tampil pada kartu program dan halaman detailnya."
            nilai={borang.gambarUrl}
            onUbah={({ url, mediaId }) => setBorang({ ...borang, gambarUrl: url, mediaId })}
          />

          <div className="mt-3.5 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <h2 className="font-header text-[13px] font-bold text-ink-900">
              {borang.id ? "Ubah program" : "Program baru"}
            </h2>
            <Kolom
              testid="program-judul"
              label="Nama program"
              nilai={borang.judul}
              onUbah={(v) => setBorang({ ...borang, judul: v })}
              placeholder="Mis. Pembangunan Ruang Kelas Baru"
              petunjuk="Nama ini juga dipakai sebagai alamat halaman program di situs saat program dibuat."
            />
            <Pilih
              testid="program-kategori"
              label="Kategori program"
              nilai={borang.kategori}
              onUbah={(v) => setBorang({ ...borang, kategori: v })}
              opsi={kategori.map((k) => ({ nilai: k.nama, label: k.nama }))}
              placeholder="Pilih kategori"
              petunjuk="Kategori diurus pada menu Program Donasi → Kategori Program."
            />
            <PilihBanyak
              testid="program-metode"
              label="Metode pembayaran"
              nilai={borang.metode}
              onUbah={(v) => setBorang({ ...borang, metode: v })}
              opsi={semuaMetode
                .filter((m) => m.aktif)
                .map((m) => ({ nilai: m.id, label: m.keterangan ? `${m.nama} — ${m.keterangan}` : m.nama }))}
              petunjuk="Pilih metode pembayaran yang berlaku untuk program ini. Setiap program boleh berbeda; formulir donasi di situs hanya menawarkan metode yang dicentang di sini."
              kosong="Belum ada metode pembayaran aktif. Hubungi pengurus untuk mengaktifkannya lebih dahulu."
            />
            <Kolom
              testid="program-pengelola"
              label="Pembuat program"
              nilai={borang.pengelola}
              onUbah={(v) => setBorang({ ...borang, pengelola: v })}
              placeholder="Mis. Ustadz Abdul Hakim"
              petunjuk="Nama yang mengusulkan dan mengurus program ini."
            />
            <Angka
              testid="program-target"
              label="Target dana (Rp)"
              nilai={borang.target ? String(borang.target) : ""}
              onUbah={(v) => setBorang({ ...borang, target: angkaDari(v) })}
              placeholder="Mis. 150000000"
              petunjuk="Angka rupiah tanpa titik."
            />
            <Tanggal
              testid="program-batas"
              label="Batas waktu"
              nilai={borang.batas}
              onUbah={(v) => setBorang({ ...borang, batas: v })}
              petunjuk="Tanggal program ditutup. Bila dikosongkan, situs memakai tanggal hari ini."
            />
            <AreaTeks
              testid="program-ringkasan"
              label="Keterangan program"
              nilai={borang.ringkasan}
              onUbah={(v) => setBorang({ ...borang, ringkasan: v })}
              baris={4}
              petunjuk="Ringkasan singkat yang tampil pada kartu program di situs."
            />
            <DaftarTeks
              testid="program-isi"
              label="Penjelasan lengkap"
              nilai={borang.isi}
              onUbah={(v) => setBorang({ ...borang, isi: v })}
              placeholder="Satu paragraf tiap baris"
              labelTambah="Tambah paragraf"
              petunjuk="Satu baris menjadi satu paragraf pada halaman program di situs."
            />
            <Rincian
              nilai={borang.rincian}
              onUbah={(v) => setBorang({ ...borang, rincian: v })}
            />
            <Sakelar
              testid="program-aktif"
              label="Program aktif"
              petunjuk="Program yang dimatikan tidak tampil di situs dan tidak bisa menerima donasi."
              nilai={borang.aktif}
              onUbah={(v) => setBorang({ ...borang, aktif: v })}
            />
            {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
            <div className="flex flex-wrap items-center gap-2">
              <TombolSimpan
                sibuk={sibuk}
                testid="simpan-program"
                label={borang.id ? "Simpan perubahan" : "Buat program"}
                onClick={() => void simpan()}
              />
              <button
                type="button"
                data-testid="batal-program"
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

      <div className="mt-3.5">
        <Bagian
          testid="zis-program-daftar"
          judul="Program Donasi"
          keterangan="Tekan satu program untuk mengubah isinya. Jumlah donatur dan dana terkumpul dihitung dari data yang tersimpan."
          jumlah={daftar.length}
          nada={daftar.length > 0 ? "hijau" : "redup"}
          aksi={
            <button
              type="button"
              data-testid="tambah-program"
              onClick={() => bukaBorang()}
              className="rounded-full bg-persis-900 px-3 py-1.5 text-[11px] font-bold text-white"
            >
              Tambah
            </button>
          }
        >
          {memuat && !data ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-[96px] animate-pulse rounded-2xl border border-black/[0.06] bg-white" />
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
              testid="program-kosong"
              teks="Belum ada program donasi. Tekan Tambah untuk membuat program pertama."
            />
          ) : (
            <ul className="space-y-2.5">
              {daftar.map((p) => (
                <li
                  key={p.id}
                  data-testid={`program-baris-${p.id}`}
                  className="flex items-start gap-2.5 rounded-2xl border border-black/[0.08] bg-white p-3"
                >
                  {p.gambarUrl ? (
                    <img
                      src={p.gambarUrl}
                      alt=""
                      className="h-[58px] w-[76px] shrink-0 rounded-xl border border-black/[0.06] object-cover"
                    />
                  ) : (
                    <span className="grid h-[58px] w-[76px] shrink-0 place-items-center rounded-xl border border-black/[0.06] bg-cream-50 text-ink-400">
                      <Icon name="image" className="h-[18px] w-[18px]" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-[12.5px] leading-snug font-bold text-ink-900">
                      {p.judul}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-ink-500">
                      {p.kategori || "Tanpa kategori"} · {p.donatur} donatur · {p.riwayat} laporan
                      {p.aktif ? "" : " · program dimatikan"}
                    </span>
                    <span data-testid={`program-metode-${p.id}`} className="mt-0.5 block text-[10px] text-persis-900">
                      {p.metode.length > 0
                        ? p.metode.map((m) => semuaMetode.find((x) => x.id === m)?.nama ?? m).join(" · ")
                        : "Metode pembayaran belum dipilih"}
                    </span>
                    <span className="font-header mt-1 block text-[11.5px] font-bold text-persis-900">
                      {rupiah(p.terkumpul)}{" "}
                      <span className="font-sans text-[10px] font-medium text-ink-400">
                        dari {rupiah(p.target)}
                      </span>
                    </span>
                    {p.batas ? (
                      <span className="mt-0.5 block text-[10px] text-ink-400">
                        Batas waktu {tanggalPendek(p.batas)}
                      </span>
                    ) : null}
                  </span>
                  <TombolIkon
                    nama="pencil"
                    label={`Ubah program ${p.judul}`}
                    testid={`program-ubah-${p.id}`}
                    onClick={() => {
                      bukaBorang(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                  <TombolIkon
                    nama="trash"
                    label={`Hapus program ${p.judul}`}
                    bahaya
                    testid={`program-hapus-${p.id}`}
                    onClick={() => void hapus(p)}
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
