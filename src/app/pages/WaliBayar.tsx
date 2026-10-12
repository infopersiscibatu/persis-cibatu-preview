import { useEffect, useState } from "react";
import { Icon } from "../components/Icons";
import { rupiah } from "../lib/format";
import { setIstilahUnit, useIstilah } from "../lib/istilah";
import { SesiWaliHabis, ambilTagihanWali, kirimSetoran, type DataWali, type MetodeWali } from "../lib/waliPortal";
import { bersihkanPilihan, pilihSemua, togolPilihan, usePilihan } from "../lib/waliPilihan";

/**
 * Pengiriman setoran pembayaran oleh wali santri.
 *
 * Wali menandai tagihan yang dibayar, memilih cara pembayaran (transfer bank, QRIS,
 * atau tunai di bendahara), boleh melampirkan foto bukti transfer, lalu mengirimkannya.
 * Setoran masuk ke Admin Tata Usaha sebagai pembayaran yang menunggu verifikasi;
 * setelah bendahara memverifikasi, tagihannya menjadi lunas dan masuk riwayat.
 */

const BATAS_BUKTI = 10 * 1024 * 1024;

const bacaBerkas = (berkas: File) =>
  new Promise<string>((selesai, gagal) => {
    const pembaca = new FileReader();
    pembaca.onload = () => {
      const isi = String(pembaca.result ?? "");
      selesai(isi.includes(",") ? isi.slice(isi.indexOf(",") + 1) : isi);
    };
    pembaca.onerror = () => gagal(new Error("Bukti pembayaran tidak bisa dibaca."));
    pembaca.readAsDataURL(berkas);
  });

export default function HalamanWaliBayar({ onKembali }: { onKembali: () => void }) {
  const pilihan = usePilihan();
  const istilah = useIstilah();
  const [data, setData] = useState<DataWali | null>(null);
  const [metode, setMetode] = useState("");
  const [bukti, setBukti] = useState<{ nama: string; tipe: string; data: string } | null>(null);
  const [catatan, setCatatan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [ringkasan, setRingkasan] = useState<{ total: number; metode: string; jumlah: number; item: DataWali["tagihan"] } | null>(
    null,
  );
  const [notif, setNotif] = useState(false);

  const muat = async () => {
    try {
      const jawab = await ambilTagihanWali();
      setData(jawab);
      setIstilahUnit(jawab.istilah ?? null);
      setMetode((lama) => lama || jawab.metode[0]?.nama || "Transfer Bank");
      setGalat(null);
    } catch (e) {
      if (e instanceof SesiWaliHabis) {
        setGalat("Sesi portal wali sudah berakhir. Silakan masuk lagi dengan PIN di portal wali.");
      } else {
        setGalat(e instanceof Error ? e.message : "Data tagihan belum bisa dimuat.");
      }
    }
  };

  useEffect(() => {
    void muat();
  }, []);

  const belum = (data?.tagihan ?? []).filter((t) => t.status === "belum");
  const terpilih = belum.filter((t) => pilihan.includes(t.id));
  const totalTerpilih = terpilih.reduce((t, b) => t + b.jumlah, 0);
  const metodeAktif: MetodeWali | undefined = (data?.metode ?? []).find((m) => m.nama === metode) ?? data?.metode[0];

  const pilihBerkas = async (berkas: File | null) => {
    setGalat(null);
    if (!berkas) {
      setBukti(null);
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(berkas.type)) {
      setGalat("Bukti pembayaran harus berupa foto JPG, PNG, atau WEBP.");
      return;
    }
    if (berkas.size > BATAS_BUKTI) {
      setGalat("Foto bukti lebih dari 10 MB. Perkecil dulu gambarnya.");
      return;
    }
    try {
      const isi = await bacaBerkas(berkas);
      setBukti({ nama: berkas.name, tipe: berkas.type, data: isi });
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Bukti pembayaran tidak terbaca.");
    }
  };

  const bayar = async () => {
    if (terpilih.length === 0) return;
    setSibuk(true);
    setGalat(null);
    try {
      await kirimSetoran({
        tagihanIds: terpilih.map((t) => t.id),
        metode: metodeAktif?.nama ?? "Transfer Bank",
        catatan,
        bukti,
      });
      setRingkasan({ total: totalTerpilih, metode: metodeAktif?.nama ?? "Transfer Bank", jumlah: terpilih.length, item: terpilih });
      bersihkanPilihan();
      setBukti(null);
      setCatatan("");
      setNotif(true);
      await muat();
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Setoran gagal dikirim.");
    } finally {
      setSibuk(false);
    }
  };

  const kosong = terpilih.length === 0 && !notif;
  const itemTampil = notif && ringkasan ? ringkasan.item : terpilih;
  const totalTampil = notif && ringkasan ? ringkasan.total : totalTerpilih;

  /* Langkah pembayaran dari bendahara dipakai bila diisi; bila kosong, instruksi bawaan
     tetap dipakai supaya halaman tidak pernah kehilangan petunjuk. */
  const langkahBawaan = metodeAktif?.bank
    ? [
        `Transfer sebesar ${rupiah(totalTampil)} ke ${metodeAktif.bank}${metodeAktif.nomor ? ` nomor ${metodeAktif.nomor}` : ""}${metodeAktif.atasNama ? ` a.n. ${metodeAktif.atasNama}` : ""}.`,
        "Simpan bukti transfer, lalu lampirkan fotonya di bawah bila ada.",
        "Tekan tombol Sudah Bayar. Bendahara akan memeriksa setoran Anda.",
      ]
    : /tunai/i.test(metodeAktif?.nama ?? "")
      ? [
          `Serahkan pembayaran ${rupiah(totalTampil)} langsung kepada bendahara ${istilah.unit}.`,
          "Bendahara mencatat setoran Anda pada halaman Tata Usaha.",
          "Setelah diverifikasi, tagihan berpindah ke riwayat pembayaran.",
        ]
      : [
          `Bayar ${rupiah(totalTampil)} dengan ${metodeAktif?.nama ?? "cara yang dipilih"}.`,
          "Lampirkan bukti pembayaran bila ada.",
          "Tekan tombol Sudah Bayar untuk mengirim setoran ke bendahara.",
        ];
  const langkahTampil =
    metodeAktif && metodeAktif.langkah && metodeAktif.langkah.length > 0 ? metodeAktif.langkah : langkahBawaan;

  return (
    <main data-testid="wali-bayar-page" className="pb-[calc(5.625rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-[620px] px-5 pt-5">
        <button
          type="button"
          onClick={onKembali}
          data-testid="bayar-kembali"
          className="inline-flex items-center gap-2 rounded-full border border-persis-900/15 bg-white px-3.5 py-2 text-[11.5px] font-bold text-persis-900 transition active:scale-[0.98]"
        >
          <Icon name="arrow-right" className="h-3.5 w-3.5 rotate-180" />
          Kembali ke portal
        </button>

        {galat ? (
          <p data-testid="bayar-galat" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-justify text-[11.5px] leading-relaxed text-rose-700">
            {galat}
          </p>
        ) : null}

        {kosong ? (
          <div className="mt-4 rounded-2xl border border-black/[0.08] border-l-[3px] border-l-gold-500 bg-white p-4">
            <p className="text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">Belum ada tagihan dipilih</p>
            <p className="mt-1.5 text-justify text-[12px] leading-relaxed text-ink-600">
              {belum.length > 0
                ? "Pilih dulu tagihan yang ingin dibayarkan pada daftar di bawah, lalu tekan Sudah Bayar."
                : "Tidak ada tagihan yang menunggu pembayaran saat ini."}
            </p>
            {belum.length > 0 ? (
              <>
                <label className="mt-3 flex items-center gap-2 text-[11.5px] font-semibold text-persis-900">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => pilihSemua(belum.map((b) => b.id))}
                    className="h-4 w-4 accent-[#073327]"
                  />
                  Pilih semua tagihan ({belum.length})
                </label>
                <ul className="mt-3 divide-y divide-black/[0.06] border-t border-black/[0.06]">
                  {belum.map((t) => (
                    <li key={t.id} className="py-2.5">
                      <button
                        type="button"
                        data-testid={`bayar-pilih-${t.id}`}
                        onClick={() => togolPilihan(t.id)}
                        className="flex w-full items-start justify-between gap-3 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12px] font-semibold text-ink-900">{t.label}</span>
                          <span className="mt-0.5 block text-[10.5px] text-persis-900">
                            {t.jatuhTempo
                              ? `Jatuh tempo ${new Date(`${t.jatuhTempo}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                              : "Tanpa jatuh tempo"}
                          </span>
                        </span>
                        <span className="font-header shrink-0 text-[12px] font-bold text-ink-900">{rupiah(t.jumlah)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <button
                type="button"
                onClick={onKembali}
                className="mt-3 w-full rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
              >
                Kembali ke portal
              </button>
            )}
          </div>
        ) : (
          <>
            <article
              data-testid="bayar-ringkasan"
              className="mt-4 rounded-2xl border border-black/[0.08] border-l-[3px] border-l-gold-500 bg-white p-4"
            >
              <p className="text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">Tagihan yang dibayar</p>
              <p className="mt-1 text-[10.5px] text-persis-900">
                {data?.santri.nama}
                {data?.santri.sekolah ? ` · ${data.santri.sekolah}` : ""}
              </p>
              <ul className="mt-3 divide-y divide-black/[0.06] border-t border-black/[0.06]">
                {itemTampil.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold text-ink-900">{t.label}</span>
                      <span className="mt-0.5 block text-[10.5px] text-persis-900">
                        {t.jatuhTempo ? `Jatuh tempo ${t.jatuhTempo}` : "Tanpa jatuh tempo"}
                      </span>
                    </span>
                    <span className="font-header shrink-0 text-[12px] font-bold text-ink-900">{rupiah(t.jumlah)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3">
                <span className="text-[11px] font-bold tracking-[0.12em] text-persis-900 uppercase">Total bayar</span>
                <span className="font-header text-[18px] font-extrabold text-ink-900">{rupiah(totalTampil)}</span>
              </div>
            </article>

            <section aria-label="Cara pembayaran" className="pt-6">
              <p className="font-header text-[13.5px] font-bold text-ink-900">Cara Pembayaran</p>
              <ul className="mt-3 space-y-2.5">
                {(data?.metode ?? []).map((m) => {
                  const aktif = m.nama === (metodeAktif?.nama ?? "");
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => setMetode(m.nama)}
                        aria-pressed={aktif}
                        data-testid={`bayar-metode-${m.id}`}
                        className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.99] ${
                          aktif ? "border-persis-900/35 bg-white ring-1 ring-persis-900/20" : "border-black/[0.08] bg-white"
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                            aktif ? "border-persis-900 bg-persis-900 text-white" : "border-black/20 bg-white"
                          }`}
                        >
                          {aktif ? <Icon name="check" className="h-3 w-3" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-bold text-ink-900">{m.nama}</span>
                          <span className="mt-0.5 block text-[10.5px] text-persis-900">
                            {[m.bank, m.nomor].filter(Boolean).join(" · ") || m.keterangan || `Pembayaran di ${istilah.unit}`}
                          </span>
                          {m.atasNama ? (
                            <span className="mt-0.5 block text-[10.5px] text-ink-600">a.n. {m.atasNama}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div
                data-testid="bayar-instruksi"
                className="mt-3 rounded-2xl border border-black/[0.08] border-l-[3px] border-l-gold-500 bg-white p-4"
              >
                <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                  <Icon name="info" className="h-[15px] w-[15px] text-gold-600" />
                  Langkah {metodeAktif?.nama ?? "pembayaran"}
                </p>
                {metodeAktif?.gambar ? (
                  <figure
                    data-testid="bayar-gambar-metode"
                    className="mt-2.5 rounded-2xl border border-gold-400/35 bg-cream-50 p-3 text-center"
                  >
                    <img
                      src={metodeAktif.gambar}
                      alt={`Kode ${metodeAktif.nama} resmi ${istilah.unit}`}
                      className="mx-auto h-auto w-full max-w-[200px] rounded-xl bg-white object-contain"
                    />
                    <figcaption className="mt-2 text-[10px] leading-relaxed text-ink-600">
                      Pindai kode di atas dengan aplikasi pembayaran Anda, lalu simpan bukti pembayarannya.
                    </figcaption>
                  </figure>
                ) : null}
                <ol className="mt-2.5 space-y-2">
                  {langkahTampil.map((d, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="font-header mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-cream-100 text-[9.5px] font-bold text-persis-900">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-justify text-[11.5px] leading-relaxed text-ink-600">{d}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <label className="mt-3 block rounded-2xl border border-black/[0.08] bg-white p-4">
                <span className="text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                  Bukti transfer (opsional)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  data-testid="bayar-bukti"
                  onChange={(e) => void pilihBerkas(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-[11px] text-ink-600 file:mr-3 file:rounded-full file:border-0 file:bg-cream-100 file:px-3 file:py-2 file:text-[11px] file:font-semibold file:text-persis-900"
                />
                <span className="mt-1.5 block text-justify text-[10px] leading-relaxed text-ink-600">
                  {bukti ? `Terlampir: ${bukti.nama}` : "Foto bukti transfer membantu bendahara memeriksa setoran Anda (JPG/PNG/WEBP, maksimal 10 MB)."}
                </span>
              </label>

              <label className="mt-3 block rounded-2xl border border-black/[0.08] bg-white p-4">
                <span className="text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                  Catatan (opsional)
                </span>
                <input
                  data-testid="bayar-catatan"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Misalnya transfer dari rekening ayah"
                  className="mt-2 w-full rounded-xl border border-black/[0.12] px-3.5 py-2.5 text-[12px] text-ink-900 outline-none placeholder:text-ink-300 focus:border-persis-800/40"
                />
              </label>
            </section>

            <button
              type="button"
              onClick={() => void bayar()}
              disabled={sibuk}
              data-testid="bayar-sudah-bayar"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 py-3.5 text-[13px] font-bold text-white shadow-[0_12px_26px_-16px_rgba(7,51,39,0.9)] transition active:scale-[0.98] disabled:opacity-60"
            >
              <Icon name="check" className="h-4 w-4" />
              {sibuk ? "Mengirim setoran…" : "Sudah Bayar"}
            </button>
            <p className="mt-2.5 text-justify text-[10.5px] leading-relaxed text-ink-600">
              Setoran Anda masuk ke Admin Tata Usaha sebagai pembayaran yang menunggu verifikasi. Tagihan otomatis lunas
              dan berpindah ke riwayat begitu bendahara menyatakan sah.
            </p>
          </>
        )}
      </div>

      {notif && ringkasan ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          role="dialog"
          aria-modal="true"
          aria-label="Pembayaran sedang ditinjau"
          data-testid="bayar-notifikasi"
        >
          <span className="absolute inset-0 bg-persis-950/60" />
          <div className="popup-panel relative w-full max-w-[400px] overflow-hidden rounded-3xl bg-cream-50 p-5 text-center shadow-[0_28px_60px_-24px_rgba(0,0,0,0.6)]">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-gold-400/35 bg-cream-100 text-gold-600">
              <Icon name="clock" className="h-7 w-7" />
            </span>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[9.5px] font-bold tracking-[0.2em] text-persis-900 uppercase">
              <Icon name="sparkle" className="h-3.5 w-3.5 text-gold-500" />
              Setoran Terkirim
            </p>
            <h2 className="font-header mt-1.5 text-[15.5px] leading-snug font-bold text-ink-900">
              Pembayaran Sedang Ditinjau
            </h2>
            <p className="mt-2 text-justify text-[11.5px] leading-relaxed text-ink-600">
              Terima kasih. Setoran <b>{rupiah(ringkasan.total)}</b> untuk <b>{ringkasan.jumlah} tagihan</b> melalui{" "}
              <b>{ringkasan.metode}</b> sudah kami catat dan sedang diperiksa bendahara. Statusnya dapat Anda pantau pada
              bagian Menunggu Verifikasi di portal wali santri.
            </p>
            <button
              type="button"
              onClick={onKembali}
              data-testid="bayar-notifikasi-tutup"
              className="mt-4 w-full rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
            >
              Mengerti
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
