import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { AreaTeks, Kolom, Pesan, TombolSimpan } from "../../components/admin/Form";
import { rupiah } from "../../lib/format";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import {
  daftarKategori,
  hapusKategori,
  tambahKategori,
  ubahKategori,
  type KategoriTagihan as Kategori,
  type TipeKategori,
} from "../../lib/unitTataUsaha";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import Lembar from "./Lembar";
import TagihanKategori from "./TagihanKategori";
import { useIstilah } from "../../lib/istilah";

/**
 * Menu Kategori: membuat jenis tagihan sekolah — SPP Bulanan, Seragam, dan lain-lain.
 * Kategori bulanan punya besaran nominal standar per bulan (mis. Rp450.000) dan
 * tagihannya bisa dibuka per bulan; kategori sekali bayar dibuka sebagai daftar biasa.
 * Kategori hanya membantu pengisian, jadi tagihan yang sudah dibuat tetap utuh
 * walau kategorinya dihapus.
 */

const TIPE: { id: TipeKategori; label: string; keterangan: string }[] = [
  { id: "bulanan", label: "Bulanan", keterangan: "ditagih tiap bulan" },
  { id: "sekali", label: "Sekali bayar", keterangan: "ditagih sekali saja" },
];

function FormKategori({
  kategori,
  onTutup,
  onBerubah,
}: {
  kategori: Kategori | null;
  onTutup: () => void;
  onBerubah: (daftar: Kategori[]) => void;
}) {
  const istilah = useIstilah();
  const baru = kategori === null;
  const [nama, setNama] = useState(kategori?.nama ?? "");
  const [keterangan, setKeterangan] = useState(kategori?.keterangan ?? "");
  const [tipe, setTipe] = useState<TipeKategori>(kategori?.tipe ?? "bulanan");
  const [nominal, setNominal] = useState(kategori && kategori.nominal > 0 ? String(Math.round(kategori.nominal)) : "");
  const [jatuhTempoHari, setJatuhTempoHari] = useState(kategori?.jatuhTempoHari ? String(kategori.jatuhTempoHari) : "");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  const simpan = async () => {
    if (nama.trim().length < 2) {
      setPesan({ tipe: "galat", teks: "Nama kategori minimal 2 huruf." });
      return;
    }
    setSibuk(true);
    setPesan(null);
    try {
      const isian = { nama, keterangan, tipe, nominal, jatuhTempoHari: tipe === "bulanan" ? jatuhTempoHari : "" };
      const jawab = baru ? await tambahKategori(isian) : await ubahKategori(kategori.id, { ...isian, aktif: kategori.aktif });
      onBerubah(jawab.kategori);
      beritahu("sukses", baru ? `Kategori ${nama.trim()} ditambahkan.` : `Kategori ${nama.trim()} disimpan.`);
      onTutup();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Kategori gagal disimpan." });
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async () => {
    if (!kategori) return;
    if (
      !(await mintaKonfirmasi(
        `Hapus kategori ${kategori.nama}? Tagihan yang sudah dibuat dengan jenis ini tetap tersimpan.`,
        { judul: "Konfirmasi hapus", labelYa: "Ya, hapus kategori" },
      ))
    )
      return;
    setSibuk(true);
    try {
      const jawab = await hapusKategori(kategori.id);
      onBerubah(jawab.kategori);
      beritahu("sukses", `Kategori ${kategori.nama} dihapus.`);
      onTutup();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Kategori gagal dihapus." });
    } finally {
      setSibuk(false);
    }
  };

  return (
    <Lembar
      testid="form-kategori"
      judul={baru ? "Tambah kategori tagihan" : `Ubah kategori: ${kategori.nama}`}
      keterangan={
        baru
          ? `Beri nama jenis tagihan seperti ${istilah.iuran} Bulanan, Seragam, atau Daftar Ulang, lalu tentukan apakah ditagih tiap bulan atau sekali saja.`
          : kategori.jumlah > 0
            ? `${kategori.jumlah} tagihan memakai kategori ini. Mengubah namanya tidak mengubah tagihan yang sudah ada.`
            : "Kategori ini belum dipakai pada tagihan mana pun."
      }
      onTutup={onTutup}
    >
      <div className="space-y-3">
        <Kolom
          testid="kategori-nama"
          label="Nama kategori"
          nilai={nama}
          onUbah={setNama}
          placeholder={`Misalnya ${istilah.iuran} Bulanan`}
        />

        <div>
          <span className="field-label">Jenis penagihan</span>
          <div className="grid grid-cols-2 gap-2">
            {TIPE.map((t) => (
              <button
                key={t.id}
                type="button"
                data-testid={`kategori-tipe-${t.id}`}
                onClick={() => setTipe(t.id)}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  tipe === t.id ? "border-persis-900 bg-persis-900 text-white" : "border-black/[0.1] bg-white"
                }`}
              >
                <span className={`block text-[11px] font-semibold ${tipe === t.id ? "text-white" : "text-ink-900"}`}>
                  {t.label}
                </span>
                <span className={`mt-0.5 block text-[9.5px] ${tipe === t.id ? "text-white/70" : "text-ink-400"}`}>
                  {t.keterangan}
                </span>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="field-label">
            {tipe === "bulanan" ? "Besaran nominal per bulan (rupiah)" : "Besaran nominal (rupiah)"}
          </span>
          <input
            inputMode="numeric"
            data-testid="kategori-nominal"
            className="field-input"
            value={nominal}
            onChange={(e) => setNominal(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={tipe === "bulanan" ? "Misalnya 450000" : "Misalnya 250000"}
          />
          <span className="mt-1 block text-[10px] text-ink-400">
            {Number(nominal) > 0
              ? `${rupiah(Number(nominal))}${tipe === "bulanan" ? " setiap bulan" : " sekali bayar"}`
              : "Boleh dikosongkan bila nominalnya berbeda-beda."}
          </span>
        </label>

        {tipe === "bulanan" ? (
          <label className="block">
            <span className="field-label">Setiap tanggal berapa harus dibayar?</span>
            <input
              inputMode="numeric"
              data-testid="kategori-tanggal"
              className="field-input"
              value={jatuhTempoHari}
              onChange={(e) => setJatuhTempoHari(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
              placeholder="Misalnya 10"
            />
            <span className="mt-1 block text-[10px] text-ink-400">
              {Number(jatuhTempoHari) >= 1 && Number(jatuhTempoHari) <= 31
                ? `Tiap bulan sistem membuat tagihan ${tipe === "bulanan" ? rupiah(Number(nominal) || 0) : ""} untuk seluruh ${istilah.sebutanKecil} aktif, jatuh tempo tanggal ${jatuhTempoHari}.`
                : "Isi tanggal 1–28 agar selalu ada di setiap bulan. Bila kosong, tagihan bulanan tidak dibuat otomatis."}
            </span>
          </label>
        ) : null}

        <AreaTeks
          testid="kategori-keterangan"
          label="Keterangan (boleh dikosongkan)"
          nilai={keterangan}
          onUbah={setKeterangan}
          baris={2}
          placeholder="Misalnya dibayar paling lambat tanggal 10 setiap bulan"
        />
      </div>

      {pesan ? (
        <div className="mt-3">
          <Pesan tipe={pesan.tipe} teks={pesan.teks} />
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        <TombolSimpan
          testid="kategori-simpan"
          label={baru ? "Simpan kategori" : "Simpan perubahan"}
          sibuk={sibuk}
          onClick={() => void simpan()}
        />
        {!baru ? (
          <button
            type="button"
            data-testid="kategori-hapus"
            disabled={sibuk}
            onClick={() => void hapus()}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 py-2.5 text-[11.5px] font-semibold text-rose-700 disabled:opacity-50"
          >
            <Icon name="trash" className="h-[15px] w-[15px]" />
            Hapus kategori
          </button>
        ) : null}
      </div>
    </Lembar>
  );
}

export default function KategoriTagihan() {
  const istilah = useIstilah();
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [terbuka, setTerbuka] = useState<{ mode: "tambah" } | { mode: "ubah"; kategori: Kategori } | null>(null);
  const [tagihan, setTagihan] = useState<Kategori | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await daftarKategori();
      setKategori(jawab.kategori);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Kategori tagihan belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const bulanan = kategori.filter((k) => k.tipe === "bulanan").length;

  return (
    <section data-testid="tu-kategori" className="mt-4">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <KepalaKartu
          judul="Kategori tagihan"
          keterangan={`Jenis tagihan yang bisa dipilih petugas tata usaha saat membuat tagihan ${istilah.sebutanKecil}, misalnya ${istilah.iuran} Bulanan, Seragam, dan Daftar Ulang. Kategori bulanan bisa dibuka untuk melihat tagihannya per bulan.`}
          angka={kategori.length}
          labelAngka="kategori"
          testidAngka="tu-kategori-jumlah"
        />

        {kategori.length > 0 ? (
          <p data-testid="kategori-ringkas" className="mt-2 text-[10px] text-ink-400">
            {bulanan} kategori bulanan · {kategori.length - bulanan} sekali bayar
          </p>
        ) : null}

        <button
          type="button"
          data-testid="kategori-tambah"
          onClick={() => setTerbuka({ mode: "tambah" })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 py-2.5 text-[11.5px] font-semibold text-white"
        >
          <Icon name="plus" className="h-[15px] w-[15px]" />
          Tambah kategori
        </button>

        {memuat && kategori.length === 0 ? (
          <p className="mt-3 text-[11px] text-ink-400">Memuat kategori…</p>
        ) : galat ? (
          <p className="mt-3 text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
        ) : kategori.length === 0 ? (
          <p data-testid="kategori-kosong" className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400">
            Belum ada kategori tagihan pada {istilah.unit} ini. Tekan “Tambah kategori” untuk membuat yang pertama,
            misalnya {istilah.iuran} Bulanan dengan nominal Rp450.000 per bulan.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {kategori.map((k) => (
              <li key={k.id} data-testid={`kategori-baris-${k.id}`}>
                <div className="flex items-stretch gap-1.5 rounded-xl border border-black/[0.08] bg-white">
                  <button
                    type="button"
                    data-testid={`kategori-tagihan-${k.id}`}
                    onClick={() => setTagihan(k)}
                    className="min-w-0 flex-1 px-3.5 py-2.5 text-left transition hover:bg-cream-50/70"
                  >
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11.5px] leading-snug font-semibold text-ink-900">{k.nama}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          k.tipe === "bulanan" ? "bg-gold-100 text-gold-800" : "bg-cream-100 text-ink-500"
                        }`}
                      >
                        {k.tipe === "bulanan" ? "Bulanan" : "Sekali bayar"}
                      </span>
                    </span>
                    {k.nominal > 0 ? (
                      <span className="mt-1 block text-[10.5px] font-semibold text-persis-900">
                        {rupiah(k.nominal)}
                        {k.tipe === "bulanan" ? " per bulan" : " sekali bayar"}
                      </span>
                    ) : (
                      <span className="mt-1 block text-[10.5px] text-ink-400">nominal belum ditentukan</span>
                    )}
                    {k.keterangan ? (
                      <span className="mt-0.5 block text-justify text-[10px] leading-snug text-ink-400">{k.keterangan}</span>
                    ) : null}
                    {k.tipe === "bulanan" && k.jatuhTempoHari ? (
                      <span className="mt-0.5 block text-[10px] text-ink-500">
                        Jatuh tempo tiap tanggal {k.jatuhTempoHari}
                        {k.nominal > 0 ? ` · tagihan otomatis tiap bulan` : " · isi nominal agar dibuat otomatis"}
                      </span>
                    ) : k.tipe === "bulanan" ? (
                      <span className="mt-0.5 block text-[10px] text-gold-700">
                        Tanggal jatuh tempo belum diisi — tagihan bulanan belum dibuat otomatis
                      </span>
                    ) : null}
                    <span className="mt-1 block text-[9.5px] text-ink-400">
                      {k.jumlah > 0
                        ? `${k.jumlah} tagihan · ${rupiah(k.nilai)} · belum lunas ${rupiah(k.belum)}`
                        : "belum dipakai pada tagihan"}
                    </span>
                    <span className="mt-1 block text-[9.5px] font-semibold text-persis-900 underline">
                      {k.tipe === "bulanan" ? "Lihat tagihan bulanan" : "Lihat tagihan"}
                    </span>
                  </button>
                  <button
                    type="button"
                    data-testid={`kategori-ubah-${k.id}`}
                    aria-label={`Ubah kategori ${k.nama}`}
                    onClick={() => setTerbuka({ mode: "ubah", kategori: k })}
                    className="grid w-10 shrink-0 place-items-center rounded-r-xl border-l border-black/[0.07] text-persis-900"
                  >
                    <Icon name="pencil" className="h-[14px] w-[14px]" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {terbuka ? (
        <FormKategori
          kategori={terbuka.mode === "ubah" ? terbuka.kategori : null}
          onTutup={() => setTerbuka(null)}
          onBerubah={setKategori}
        />
      ) : null}

      {tagihan ? (
        <TagihanKategori
          kategori={tagihan}
          onTutup={() => setTagihan(null)}
          onUbahKategori={() => {
            const k = tagihan;
            setTagihan(null);
            setTerbuka({ mode: "ubah", kategori: k });
          }}
        />
      ) : null}
    </section>
  );
}
