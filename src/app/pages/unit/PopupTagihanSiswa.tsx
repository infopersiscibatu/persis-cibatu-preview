import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { AreaTeks, Kolom, Pesan, TombolSimpan } from "../../components/admin/Form";
import { rupiah } from "../../lib/format";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import {
  buatTagihan,
  buatTagihanBulanan,
  catatPembayaran,
  detailSiswaTagihan,
  hapusTagihan,
  ubahTagihan,
  type DetailSiswaTagihan,
  type KategoriTagihan,
  type SiswaTagihan,
  type TagihanTataUsaha,
} from "../../lib/unitTataUsaha";
import Lembar from "./Lembar";
import { useIstilah } from "../../lib/istilah";

/**
 * Popup tagihan satu siswa. Alurnya dua langkah: pilih jenis tagihan lebih dahulu,
 * baru data tagihannya terbuka — daftar tagihan yang sudah ada pada jenis tersebut,
 * beserta borang untuk menambah atau mengubahnya.
 */

const WARNA_STATUS: Record<string, string> = {
  belum: "bg-rose-100 text-rose-700",
  menunggu: "bg-gold-100 text-gold-800",
  lunas: "bg-persis-100 text-persis-900",
  batal: "bg-cream-100 text-ink-500",
};

const LABEL_SISWA: Record<string, string> = {
  lulus: "Sudah lulus",
  pindah: "Pindah",
  nonaktif: "Tidak aktif",
  aktif: "Aktif",
};

const LABEL_STATUS: Record<string, string> = {
  belum: "Belum bayar",
  menunggu: "Menunggu verifikasi",
  lunas: "Lunas",
  batal: "Batal",
};

const namaBulan = (bulan: string) => {
  if (!/^\d{4}-\d{2}$/.test(bulan)) return bulan;
  const d = new Date(`${bulan}-01T00:00:00`);
  if (Number.isNaN(d.getTime())) return bulan;
  return d.toLocaleDateString("id-ID", { month: "long" });
};

const tanggalPendek = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

export default function PopupTagihanSiswa({
  siswa,
  onTutup,
  onBerubah,
}: {
  siswa: SiswaTagihan;
  onTutup: () => void;
  onBerubah: () => void;
}) {
  const istilah = useIstilah();
  const [data, setData] = useState<DetailSiswaTagihan | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [jenis, setJenis] = useState<KategoriTagihan | null>(null);
  const [tahun, setTahun] = useState<number | null>(null);
  const [jumlah, setJumlah] = useState("");
  const [jatuhTempo, setJatuhTempo] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [diubah, setDiubah] = useState<TagihanTataUsaha | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);
  const [bayar, setBayar] = useState<TagihanTataUsaha | null>(null);
  const [metode, setMetode] = useState("");
  const [metodeId, setMetodeId] = useState("");
  const [catatanBayar, setCatatanBayar] = useState("");

  const buatBulan = async (bulan: string, label: string, nominal: number) => {
    if (!jenis) return;
    if (
      !(await mintaKonfirmasi(
        `Buat tagihan ${jenis.nama} bulan ${label} sebesar ${rupiah(nominal)} untuk ${siswa.nama}?`,
        { judul: "Buat tagihan bulan", labelYa: "Ya, buat tagihan" },
      ))
    )
      return;
    setSibuk(true);
    setPesan(null);
    try {
      const jawab = await buatTagihanBulanan({ santriId: siswa.id, kategoriId: jenis.id, bulan });
      beritahu("sukses", jawab.pesan);
      await muat();
      onBerubah();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Tagihan bulan gagal dibuat." });
    } finally {
      setSibuk(false);
    }
  };

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await detailSiswaTagihan(siswa.id, tahun ?? undefined);
      setData(jawab);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : `Data tagihan ${istilah.sebutanKecil} belum bisa dimuat.`);
    } finally {
      setMemuat(false);
    }
  }, [siswa.id, tahun]);

  useEffect(() => {
    void muat();
  }, [muat]);

  const tautanWa = (nomor: string) => {
  const angka = nomor.replace(/[^0-9]/g, "");
  if (!angka) return null;
  return `https://wa.me/${angka.startsWith("0") ? "62" + angka.slice(1) : angka}`;
};

const bersihkanBorang = () => {
    setJumlah("");
    setJatuhTempo("");
    setKeterangan("");
    setDiubah(null);
    setPesan(null);
  };

  const pilihJenis = (k: KategoriTagihan) => {
    setJenis(k);
    bersihkanBorang();
    /* Kategori bulanan memakai besaran nominal standarnya sebagai isian awal. */
    if (k.tipe === "bulanan" && k.nominal > 0) setJumlah(String(Math.round(k.nominal)));
  };

  const simpan = async () => {
    if (!jenis) return;
    const angkaJumlah = Number(jumlah.replace(/[^0-9]/g, ""));
    if (!angkaJumlah) {
      setPesan({ tipe: "galat", teks: "Jumlah tagihan harus lebih dari nol." });
      return;
    }
    setSibuk(true);
    setPesan(null);
    try {
      if (diubah) {
        await ubahTagihan(diubah.id, { jumlah, jatuhTempo, keterangan });
        beritahu("sukses", "Tagihan diperbarui.");
      } else {
        const jawab = await buatTagihan({
          santriId: siswa.id,
          kategoriId: jenis.hanyaJenis ? "" : jenis.id,
          jenis: jenis.nama,
          jumlah,
          jatuhTempo,
          keterangan,
        });
        beritahu("sukses", jawab.pesan ?? `Tagihan ${jenis.nama} untuk ${siswa.nama} dibuat dan aktif.`);
      }
      bersihkanBorang();
      await muat();
      onBerubah();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Tagihan gagal disimpan." });
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async (t: TagihanTataUsaha) => {
    if (!(await mintaKonfirmasi(`Hapus tagihan ${t.label} sebesar ${rupiah(t.jumlah)} milik ${siswa.nama}?`))) return;
    setSibuk(true);
    try {
      await hapusTagihan(t.id);
      beritahu("sukses", "Tagihan dihapus.");
      if (diubah?.id === t.id) bersihkanBorang();
      await muat();
      onBerubah();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Tagihan gagal dihapus." });
    } finally {
      setSibuk(false);
    }
  };

  const simpanBayar = async () => {
    if (!bayar) return;
    setSibuk(true);
    setPesan(null);
    try {
      const jawab = await catatPembayaran(bayar.id, {
        metode,
        metodeId: metodeId || undefined,
        catatan: catatanBayar,
      });
      beritahu("sukses", jawab.pesan);
      setBayar(null);
      setCatatanBayar("");
      await muat();
      onBerubah();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Pembayaran gagal dicatat." });
    } finally {
      setSibuk(false);
    }
  };

  const daftarJenis = data?.kategori ?? [];
  /* Jenis yang dipilih dibaca ulang dari data terbaru, agar daftar bulannya ikut tersegarkan. */
  const jenisTampil = (data?.kategori ?? []).find((k) => k.id === jenis?.id) ?? jenis;
  const tagihanJenis = (data?.tagihan ?? []).filter((t) => t.jenis.toLowerCase() === (jenis?.nama ?? "").toLowerCase());

  return (
    <Lembar
      testid="popup-tagihan"
      judul={siswa.nama}
      keterangan={
        data
          ? [
              data.siswa.kelas || data.siswa.programNama || "Belum diisi",
              data.siswa.status !== "aktif" ? LABEL_SISWA[data.siswa.status] ?? data.siswa.status : "",
              data.ringkasan.jumlah > 0
                ? `${data.ringkasan.jumlah} tagihan, ${rupiah(data.ringkasan.total)}`
                : "belum ada tagihan",
            ]
              .filter(Boolean)
              .join(" · ")
          : `Memuat data ${istilah.sebutanKecil}…`
      }
      onTutup={onTutup}
    >
      {memuat && !data ? (
        <p className="text-[11px] text-ink-400">Memuat data tagihan…</p>
      ) : galat && !data ? (
        <p className="text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
      ) : (
        <>
          {/* Data siswa dari Admin Sekolah: kelas, orang tua, dan nomor WhatsApp */}
          {data && (data.siswa.waliNama || data.siswa.waliTelepon) ? (
            <div data-testid="popup-tagihan-siswa" className="rounded-xl border border-black/[0.08] bg-cream-50/70 px-3 py-2.5">
              <p className="text-[9.5px] font-bold tracking-[0.12em] text-ink-400 uppercase">
                {`Data ${istilah.sebutanKecil}`}
              </p>
              {data.siswa.waliNama ? (
                <p className="mt-1 text-[11px] text-ink-700">
                  <span className="text-ink-400">Orang tua/wali: </span>
                  <b className="font-semibold text-ink-900">{data.siswa.waliNama}</b>
                </p>
              ) : null}
              {data.siswa.waliTelepon ? (
                <p className="mt-0.5 text-[11px] text-ink-700">
                  <span className="text-ink-400">WhatsApp: </span>
                  {tautanWa(data.siswa.waliTelepon) ? (
                    <a
                      data-testid="popup-tagihan-wa"
                      href={tautanWa(data.siswa.waliTelepon) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-persis-900 underline"
                    >
                      {data.siswa.waliTelepon}
                    </a>
                  ) : (
                    <b className="font-semibold text-ink-900">{data.siswa.waliTelepon}</b>
                  )}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Langkah 1 — pilih jenis tagihan */}
          <div data-testid="popup-tagihan-jenis">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9.5px] font-bold tracking-[0.12em] text-ink-400 uppercase">Pilih jenis tagihan</p>
              {jenis ? (
                <button
                  type="button"
                  data-testid="popup-tagihan-ganti"
                  onClick={() => {
                    setJenis(null);
                    bersihkanBorang();
                  }}
                  className="text-[10px] font-semibold text-persis-900 underline"
                >
                  Ganti jenis
                </button>
              ) : null}
            </div>

            {daftarJenis.length === 0 ? (
              <p data-testid="popup-tagihan-tanpa-jenis" className="mt-2 text-justify text-[11px] leading-relaxed text-ink-500">
                {istilah.statUnit} ini belum punya kategori tagihan. Buat dulu jenis tagihannya di menu <b>Kategori</b> — misalnya
                SPP Bulanan atau Seragam — baru tagihan bisa diisi.
              </p>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {daftarJenis.map((k) => {
                  const dipilih = jenis?.id === k.id;
                  const punyaSiswa = (data?.tagihan ?? []).filter(
                    (t) => t.jenis.toLowerCase() === k.nama.toLowerCase(),
                  ).length;
                  return (
                    <button
                      key={k.id}
                      type="button"
                      data-testid={`popup-jenis-${k.id}`}
                      onClick={() => pilihJenis(k)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition ${
                        dipilih ? "border-persis-900 bg-persis-900 text-white" : "border-black/[0.1] bg-white"
                      }`}
                    >
                      <span className={`block text-[11px] leading-snug font-semibold ${dipilih ? "text-white" : "text-ink-900"}`}>
                        {k.nama}
                      </span>
                      <span className={`mt-0.5 block text-[9.5px] ${dipilih ? "text-white/70" : "text-ink-400"}`}>
                        {k.nominal > 0 ? `${rupiah(k.nominal)}${k.tipe === "bulanan" ? " / bulan" : ""}` : punyaSiswa > 0 ? `${punyaSiswa} tagihan ${istilah.sebutanKecil} ini` : "nominal bebas"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Langkah 2 — data tagihan jenis yang dipilih */}
          {jenis ? (
            <div data-testid="popup-tagihan-data" className="mt-4 border-t border-black/[0.07] pt-3.5">
              <p className="text-[9.5px] font-bold tracking-[0.12em] text-ink-400 uppercase">
                {diubah ? `Ubah tagihan · ${jenis.nama}` : `Tagihan ${jenis.nama}`}
              </p>

              {/* Checklist bulan untuk kategori bulanan seperti SPP */}
              {jenisTampil?.tipe === "bulanan" && (jenisTampil.bulan?.length ?? 0) > 0 ? (
                <div data-testid="popup-bulan" className="mt-2.5 rounded-xl border border-black/[0.08] bg-cream-50/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold tracking-[0.1em] text-ink-500 uppercase">
                      Bulan tagihan
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        data-testid="popup-bulan-mundur"
                        aria-label="Tahun sebelumnya"
                        onClick={() => setTahun((data?.tahun ?? new Date().getFullYear()) - 1)}
                        className="grid h-6 w-6 place-items-center rounded-full border border-black/[0.1] text-persis-900"
                      >
                        <Icon name="chevron-right" className="h-3 w-3 rotate-180" />
                      </button>
                      <span className="min-w-[3.2rem] text-center text-[10.5px] font-bold text-persis-900">
                        {data?.tahun ?? tahun ?? ""}
                      </span>
                      <button
                        type="button"
                        data-testid="popup-bulan-maju"
                        aria-label="Tahun berikutnya"
                        onClick={() => setTahun((data?.tahun ?? new Date().getFullYear()) + 1)}
                        className="grid h-6 w-6 place-items-center rounded-full border border-black/[0.1] text-persis-900"
                      >
                        <Icon name="chevron-right" className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <p data-testid="popup-bulan-ringkas" className="mt-1.5 text-justify text-[10px] leading-relaxed text-ink-500">
                    {jenisTampil.bulanLunas ?? 0} bulan sudah lunas · {jenisTampil.bulanMenunggu ?? 0} menunggu verifikasi ·{" "}
                    {jenisTampil.bulanBelum ?? 0} belum dibayar · {jenisTampil.bulanKosong ?? 0} belum ditagihkan
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {(jenisTampil.bulan ?? []).map((b) => {
                      const lunas = b.status === "lunas";
                      const menunggu = b.status === "menunggu";
                      const belum = b.status === "belum";
                      const batal = b.status === "batal";
                      const label = namaBulan(b.bulan);
                      const gaya = lunas
                        ? "border-persis-900/30 bg-persis-100"
                        : menunggu
                          ? "border-gold-400/50 bg-gold-100"
                          : belum
                            ? "border-rose-200 bg-rose-50"
                            : "border-black/[0.08] bg-white";
                      return (
                        <button
                          key={b.bulan}
                          type="button"
                          data-testid={`popup-bulan-${b.bulan}`}
                          disabled={lunas || menunggu || belum || batal || sibuk}
                          onClick={() => void buatBulan(b.bulan, label, b.jumlah)}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition disabled:cursor-default ${gaya}`}
                        >
                          <span
                            className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border ${
                              lunas
                                ? "border-persis-900 bg-persis-900 text-white"
                                : menunggu
                                  ? "border-gold-500 bg-white text-gold-700"
                                  : "border-black/25 bg-white"
                            }`}
                          >
                            {lunas ? (
                              <Icon name="check" className="h-2.5 w-2.5" />
                            ) : menunggu ? (
                              <Icon name="clock" className="h-2.5 w-2.5" />
                            ) : belum ? (
                              <Icon name="x" className="h-2.5 w-2.5 text-rose-600" />
                            ) : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[10.5px] font-semibold text-ink-900">{label}</span>
                            <span className="block truncate text-[9px] text-ink-400">
                              {lunas
                                ? "lunas"
                                : menunggu
                                  ? "menunggu verifikasi"
                                  : belum
                                    ? `${rupiah(b.jumlah)} belum bayar`
                                    : "belum ditagihkan"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-justify text-[9.5px] leading-relaxed text-ink-400">
                    Bulan yang belum ditagihkan bisa ditekan untuk membuat tagihannya, misalnya bila SPP bulan lalu
                    terlewat.
                  </p>
                </div>
              ) : null}

              {tagihanJenis.length > 0 ? (
                <ul className="mt-2">
                  {tagihanJenis.map((t) => (
                    <li
                      key={t.id}
                      data-testid={`popup-tagihan-baris-${t.id}`}
                      className="flex items-start justify-between gap-2 border-b border-black/[0.05] py-2 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-bold text-persis-900">{rupiah(t.jumlah)}</p>
                        <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${WARNA_STATUS[t.status] ?? WARNA_STATUS.belum}`}
                          >
                            {LABEL_STATUS[t.status] ?? t.status}
                          </span>
                          {t.jatuhTempo ? (
                            <span className="text-[9.5px] text-ink-400">Jatuh tempo {tanggalPendek(t.jatuhTempo)}</span>
                          ) : null}
                        </span>
                        {t.keterangan ? (
                          <p className="mt-1 text-justify text-[10px] leading-snug text-ink-500">{t.keterangan}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          data-testid={`popup-tagihan-ubah-${t.id}`}
                          aria-label="Ubah tagihan"
                          disabled={t.status === "lunas"}
                          onClick={() => {
                            setDiubah(t);
                            setJumlah(String(Math.round(t.jumlah)));
                            setJatuhTempo(t.jatuhTempo ?? "");
                            setKeterangan(t.keterangan);
                            setPesan(null);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-black/[0.09] text-persis-900 disabled:opacity-40"
                        >
                          <Icon name="pencil" className="h-[14px] w-[14px]" />
                        </button>
                        {t.status === "belum" ? (
                          <button
                            type="button"
                            data-testid={`popup-tagihan-bayar-${t.id}`}
                            aria-label="Catat pembayaran"
                            onClick={() => {
                              setBayar(t);
                              setCatatanBayar("");
                              setPesan(null);
                              const tunai = (data?.metode ?? []).find((m) => /tunai/i.test(m.nama));
                              const dipilih = tunai ?? data?.metode?.[0] ?? null;
                              setMetode(dipilih?.nama ?? "Tunai di Bendahara");
                              setMetodeId(dipilih?.id ?? "");
                            }}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-persis-900/25 bg-persis-100 text-persis-900"
                          >
                            <Icon name="wallet" className="h-[14px] w-[14px]" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          data-testid={`popup-tagihan-hapus-${t.id}`}
                          aria-label="Hapus tagihan"
                          onClick={() => void hapus(t)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700"
                        >
                          <Icon name="trash" className="h-[14px] w-[14px]" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p data-testid="popup-tagihan-kosong" className="mt-2 text-justify text-[10.5px] leading-relaxed text-ink-400">
                  Belum ada tagihan {jenis.nama} untuk siswa ini. Isi datanya di bawah.
                </p>
              )}

              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="field-label">Jumlah tagihan (rupiah)</span>
                  <input
                    inputMode="numeric"
                    data-testid="popup-tagihan-jumlah"
                    className="field-input"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Misalnya 450000"
                  />
                  <span className="mt-1 block text-[10px] text-ink-400">
                    {Number(jumlah) > 0 ? rupiah(Number(jumlah)) : "Tulis angkanya saja, tanpa titik atau koma."}
                  </span>
                </label>
                <label className="block">
                  <span className="field-label">Jatuh tempo (boleh dikosongkan)</span>
                  <input
                    type="date"
                    data-testid="popup-tagihan-tempo"
                    className="field-input"
                    value={jatuhTempo}
                    onChange={(e) => setJatuhTempo(e.target.value)}
                  />
                </label>
                <AreaTeks
                  testid="popup-tagihan-keterangan"
                  label="Keterangan (boleh dikosongkan)"
                  nilai={keterangan}
                  onUbah={setKeterangan}
                  baris={2}
                  placeholder="Misalnya untuk bulan Oktober"
                />
              </div>

              {pesan ? (
                <div className="mt-3">
                  <Pesan tipe={pesan.tipe} teks={pesan.teks} />
                </div>
              ) : null}

              <div className="mt-4 space-y-2">
                <TombolSimpan
                  testid="popup-tagihan-simpan"
                  label={diubah ? "Simpan perubahan tagihan" : `Simpan tagihan ${jenis.nama}`}
                  sibuk={sibuk}
                  onClick={() => void simpan()}
                />
                {diubah ? (
                  <button
                    type="button"
                    data-testid="popup-tagihan-batal"
                    onClick={bersihkanBorang}
                    className="w-full rounded-full border border-black/[0.12] py-2.5 text-[11.5px] font-semibold text-ink-600"
                  >
                    Batal ubah
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          {/* Riwayat pembayaran siswa */}
          <div data-testid="popup-tagihan-riwayat" className="mt-4 border-t border-black/[0.07] pt-3.5">
            <p className="text-[9.5px] font-bold tracking-[0.12em] text-ink-400 uppercase">Riwayat pembayaran</p>
            {(data?.riwayat ?? []).length === 0 ? (
              <p data-testid="popup-riwayat-kosong" className="mt-2 text-justify text-[10.5px] leading-relaxed text-ink-400">
                Belum ada pembayaran yang tercatat untuk siswa ini.
              </p>
            ) : (
              <ul className="mt-1.5">
                {(data?.riwayat ?? []).map((r) => (
                  <li
                    key={r.id}
                    data-testid={`popup-riwayat-${r.id}`}
                    className="flex items-start justify-between gap-2 border-b border-black/[0.05] py-2 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-ink-900">{r.label || "Pembayaran"}</p>
                      <p className="mt-0.5 text-[9.5px] text-ink-400">
                        {r.metode || "Metode belum dicatat"}
                        {r.dibayarPada ? ` · ${tanggalPendek(r.dibayarPada)}` : ""}
                      </p>
                      {r.catatan ? (
                        <p className="mt-0.5 text-justify text-[9.5px] leading-snug text-ink-500">{r.catatan}</p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-bold text-persis-900">{rupiah(r.jumlah)}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          r.status === "terverifikasi"
                            ? "bg-persis-100 text-persis-900"
                            : r.status === "ditolak"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-gold-100 text-gold-800"
                        }`}
                      >
                        {r.status === "terverifikasi" ? "Lunas" : r.status === "ditolak" ? "Ditolak" : "Menunggu verifikasi"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Catat pembayaran yang diterima bendahara */}
      {bayar ? (
        <Lembar
          testid="form-bayar"
          judul="Catat pembayaran"
          keterangan={`${siswa.nama} · ${bayar.label || bayar.jenis} · ${rupiah(bayar.jumlah)}. Pembayaran akan menunggu verifikasi sebelum tagihannya lunas.`}
          onTutup={() => setBayar(null)}
        >
          <p className="field-label">Metode pembayaran</p>
          <div className="grid grid-cols-2 gap-2">
            {(data?.metode ?? []).map((m) => (
              <button
                key={m.id}
                type="button"
                data-testid={`bayar-metode-${m.id}`}
                onClick={() => {
                  setMetode(m.nama);
                  setMetodeId(m.id);
                }}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  metode === m.nama ? "border-persis-900 bg-persis-900 text-white" : "border-black/[0.1] bg-white"
                }`}
              >
                <span className={`block text-[11px] font-semibold ${metode === m.nama ? "text-white" : "text-ink-900"}`}>
                  {m.nama}
                </span>
                {m.bank || m.nomor ? (
                  <span className={`mt-0.5 block text-[9.5px] ${metode === m.nama ? "text-white/70" : "text-ink-400"}`}>
                    {[m.bank, m.nomor].filter(Boolean).join(" ")}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <Kolom
              testid="bayar-catatan"
              label="Catatan (boleh dikosongkan)"
              nilai={catatanBayar}
              onUbah={setCatatanBayar}
              placeholder="Misalnya diterima oleh bendahara"
            />
          </div>

          {pesan ? (
            <div className="mt-3">
              <Pesan tipe={pesan.tipe} teks={pesan.teks} />
            </div>
          ) : null}

          <div className="mt-4">
            <TombolSimpan
              testid="bayar-simpan"
              label="Catat & menunggu verifikasi"
              sibuk={sibuk}
              onClick={() => void simpanBayar()}
            />
          </div>
        </Lembar>
      ) : null}
    </Lembar>
  );
}
