import { useEffect, useMemo, useRef, useState } from "react";
import Paginasi from "../components/Paginasi";
import { Icon } from "../components/Icons";
import { identitas } from "../data/content";
import { rupiah } from "../lib/format";
import { setIstilahUnit, useIstilah } from "../lib/istilah";
import {
  unggahFotoWali,
  hapusFotoWali,
  bacaBase64,
  SesiWaliHabis,
  ambilTagihanWali,
  keluarWali,
  masukWali,
  tokenWali,
  type DataWali,
} from "../lib/waliPortal";
import { togolPilihan, usePilihan } from "../lib/waliPilihan";
import { didukungPush, daftarkanPushWali, lepasPushWali, ujiPushWali, statusPushWali } from "../lib/push";

/**
 * Portal wali santri.
 *
 * Wali masuk memakai PIN yang dibuat Admin Sekolah pada tabel siswa, lalu portal ini
 * menampilkan data asli dari sekolah: profil santri, tagihan aktif, pembayaran yang
 * menunggu verifikasi bendahara, dan riwayat pembayaran yang sudah diverifikasi.
 */
export type WaliTab = "profil" | "nilai" | "tagihan" | "tahfidz";

const tanggalPendek = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

const LABEL_STATUS: Record<string, string> = {
  belum: "Belum bayar",
  menunggu: "Menunggu verifikasi",
  lunas: "Lunas",
  batal: "Dibatalkan",
};

function AlamatSekolah({ santri }: { santri: DataWali["santri"] }) {
  return (
    <p className="text-[10.5px] text-persis-900">
      {santri.sekolah}
      {santri.jenjang ? ` · ${santri.jenjang}` : ""}
    </p>
  );
}

/** Kartu masuk dengan PIN wali santri. */
function MasukWali({ onMasuk }: { onMasuk: (pin: string) => Promise<void> }) {
  const [pin, setPin] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const kirim = async () => {
    if (pin.length < 4) {
      setGalat("PIN wali minimal 4 angka.");
      return;
    }
    setSibuk(true);
    setGalat(null);
    try {
      await onMasuk(pin);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "PIN belum bisa diperiksa.");
    } finally {
      setSibuk(false);
    }
  };

  return (
    <main data-testid="wali-masuk" className="pb-[calc(5.625rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-[620px] px-5 pt-8">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-gold-400/35 bg-cream-100 text-persis-900">
            <Icon name="shield" className="h-6 w-6" />
          </span>
          <p className="mt-3 text-center text-[10px] font-bold tracking-[0.16em] text-persis-900 uppercase">
            Portal Wali
          </p>
          <h1 className="font-header mt-1.5 text-center text-[16px] leading-snug font-extrabold text-persis-900">
            Masuk dengan PIN Wali
          </h1>
          <p className="mt-2 text-justify text-[11.5px] leading-relaxed text-ink-600">
            PIN dibuat oleh petugas tata usaha unit pendidikan pada data siswa maupun mahasiswa. Setelah masuk, Anda
            dapat melihat tagihan bulanan, mengirim setoran pembayaran, serta melihat riwayat pembayaran ananda.
          </p>

          <label className="mt-4 block">
            <input
              inputMode="numeric"
              aria-label="PIN wali"
              autoComplete="off"
              data-testid="wali-pin"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
              onKeyDown={(e) => {
                if (e.key === "Enter") void kirim();
              }}
              placeholder="••••••"
              className="mt-1.5 w-full rounded-xl border border-black/[0.12] bg-white px-4 py-3 text-center text-[18px] font-bold tracking-[0.4em] text-ink-900 outline-none placeholder:tracking-[0.3em] placeholder:text-ink-300 focus:border-persis-800/40"
            />
          </label>

          {galat ? (
            <p data-testid="wali-masuk-galat" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-justify text-[11px] leading-relaxed text-rose-700">
              {galat}
            </p>
          ) : null}

          <button
            type="button"
            data-testid="wali-masuk-kirim"
            disabled={sibuk}
            onClick={() => void kirim()}
            className="mt-4 w-full rounded-full bg-persis-900 py-3.5 text-[13px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {sibuk ? "Memeriksa PIN…" : "Masuk"}
          </button>

          <p className="mt-3 text-justify text-[10.5px] leading-relaxed text-ink-600">
            Belum punya PIN? Hubungi petugas tata usaha unit pendidikan ananda — PIN dibuatkan pada data siswa/mahasiswa di Admin Sekolah.
          </p>
        </div>
      </div>
    </main>
  );
}

/**
 * Keadaan notifikasi HP milik wali.
 *  - memeriksa  : sedang dipastikan sebelum ditampilkan
 *  - aktif      : HP ini sudah terhubung ke portal wali yang sedang masuk
 *  - belum      : izin belum diberikan, tombol aktifkan masih tersedia
 *  - ditolak    : izin diblokir pengaturan peramban
 *  - takDidukung: peramban tidak mendukung notifikasi push
 */
type KeadaanNotif = "memeriksa" | "aktif" | "belum" | "ditolak" | "takDidukung";

export default function HalamanWali({ tab, onBayar }: { tab: WaliTab; onBayar: () => void }) {
  const istilah = useIstilah();
  const [data, setData] = useState<DataWali | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [perluPin, setPerluPin] = useState(false);
  const [halamanRiwayat, setHalamanRiwayat] = useState(1);
  const pilihan = usePilihan();
  /* Foto profil: unggahan wali sendiri, disimpan pada data siswa/mahasiswa. */
  const inputFoto = useRef<HTMLInputElement>(null);
  const [mengunggahFoto, setMengunggahFoto] = useState(false);
  const [galatFoto, setGalatFoto] = useState<string | null>(null);
  /* Notifikasi HP: satu HP hanya terikat pada satu akun wali yang sedang masuk. */
  const [notif, setNotif] = useState<KeadaanNotif>("memeriksa");
  const [notifPesan, setNotifPesan] = useState<string | null>(null);
  const [sibukNotif, setSibukNotif] = useState(false);
  const [notifPerangkat, setNotifPerangkat] = useState(0);

  /* Seluruh ayat yang sudah disetor — ditampilkan pada kartu catatan setoran. */
  const totalAyatSetoran = (data?.tahfidz.setoran ?? []).reduce((n, t) => n + (t.jumlahAyat ?? 0), 0);

  const muat = async () => {
    setMemuat(true);
    try {
      const jawab = await ambilTagihanWali();
      setData(jawab);
      setIstilahUnit(jawab.istilah ?? null);
      setGalat(null);
      setPerluPin(false);
      void pasangNotifikasi();
    } catch (e) {
      if (e instanceof SesiWaliHabis) {
        setPerluPin(true);
        setData(null);
      } else {
        setGalat(e instanceof Error ? e.message : "Data portal wali belum bisa dimuat.");
      }
    } finally {
      setMemuat(false);
    }
  };

  /**
   * Setelah wali terbaca, HP ini dihubungkan ke akun itu. Bila izin notifikasi sudah
   * pernah diberikan, pendaftaran berjalan sendiri tanpa menekan tombol apa pun.
   */
  const pasangNotifikasi = async () => {
    if (!didukungPush()) {
      setNotif("takDidukung");
      return;
    }
    const izin = window.Notification?.permission ?? "default";
    if (izin === "denied") {
      setNotif("ditolak");
      return;
    }
    if (izin !== "granted") {
      setNotif("belum");
      return;
    }
    const hasil = await daftarkanPushWali();
    const status = await statusPushWali();
    setNotifPerangkat(status?.perangkat ?? hasil.jumlah ?? 0);
    setNotif(hasil.ok ? "aktif" : "belum");
    if (!hasil.ok) setNotifPesan(hasil.pesan);
  };

  useEffect(() => {
    /* Belum pernah masuk — langsung tawarkan PIN tanpa memanggil server. */
    if (!tokenWali()) {
      setPerluPin(true);
      setMemuat(false);
      return;
    }
    void muat();
  }, []);

  const santri = data?.santri;
  const inisial = useMemo(
    () =>
      (santri?.nama ?? "")
        .split(" ")
        .slice(0, 2)
        .map((k) => k[0] ?? "")
        .join(""),
    [santri?.nama],
  );

  if (memuat && !data) {
    return (
      <main data-testid="wali-memuat" className="pb-[calc(5.625rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-[620px] px-5 pt-8">
          <p className="text-[12px] text-ink-600">Memuat data portal wali…</p>
        </div>
      </main>
    );
  }

  if (perluPin || !data || !santri) {
    return (
      <MasukWali
        onMasuk={async (pin) => {
          await masukWali(pin);
          await muat();
        }}
      />
    );
  }

  /* Profil memuat data yang sama dengan kolom tabel siswa/mahasiswa di Admin Sekolah:
     nama, nama sekolah/kampus, jenjang, jurusan, nama orang tua, dan nomor WhatsApp.
     Baris jurusan hanya muncul untuk jenjang yang memang punya jurusan — RA dan MI
     umumnya tidak, sedangkan MA dan kampus punya program. */
  const adaJurusan = santri.adaJurusan || Boolean(santri.programNama || santri.program);
  const barisProfil: { label: string; nilai: string }[] = [
    { label: istilah.statUnit, nilai: santri.sekolah || "—" },
    { label: "Jenjang pendidikan", nilai: santri.jenjang || "—" },
    ...(adaJurusan
      ? [{ label: istilah.jurusan, nilai: santri.programNama || santri.program || "—" }]
      : []),
    { label: `Nama ${istilah.wali.toLowerCase()}`, nilai: santri.waliNama || "—" },
    { label: "WhatsApp", nilai: santri.waliTelepon || "—" },
  ];

  async function pilihFoto(berkas: File) {
    setGalatFoto(null);
    if (!berkas.type.startsWith("image/")) {
      setGalatFoto("Pilih berkas gambar (JPG, PNG, atau WEBP).");
      return;
    }
    if (berkas.size > 10 * 1024 * 1024) {
      setGalatFoto("Ukuran foto lebih dari 10 MB. Perkecil dulu fotonya.");
      return;
    }
    setMengunggahFoto(true);
    try {
      const data = await bacaBase64(berkas);
      await unggahFotoWali({ nama: berkas.name, tipe: berkas.type, data });
      await muat();
    } catch (e) {
      setGalatFoto(e instanceof Error ? e.message : "Foto belum bisa diunggah. Coba lagi.");
    }
    setMengunggahFoto(false);
    if (inputFoto.current) inputFoto.current.value = "";
  }

  /** Minta izin notifikasi lalu hubungkan HP ini dengan akun wali yang sedang masuk. */
  const aktifkanNotifikasi = async () => {
    setSibukNotif(true);
    setNotifPesan(null);
    try {
      const izin = await window.Notification.requestPermission();
      if (izin === "denied") {
        setNotif("ditolak");
        return;
      }
      if (izin !== "granted") {
        setNotifPesan("Izin belum diberikan. Anda bisa mencoba lagi kapan saja.");
        return;
      }
      const hasil = await daftarkanPushWali();
      const status = await statusPushWali();
      setNotifPerangkat(status?.perangkat ?? hasil.jumlah ?? 0);
      setNotif(hasil.ok ? "aktif" : "belum");
      setNotifPesan(hasil.pesan);
    } catch {
      setNotifPesan("Notifikasi belum bisa diaktifkan di HP ini.");
    } finally {
      setSibukNotif(false);
    }
  };

  const cobaNotifikasi = async () => {
    setSibukNotif(true);
    const hasil = await ujiPushWali();
    setNotifPesan(hasil.pesan);
    setSibukNotif(false);
  };

  /* Tulisan pada kartu notifikasi mengikuti keadaan HP ini. */
  const labelNotif: Record<KeadaanNotif, string> = {
    memeriksa: "Memeriksa",
    aktif: "Aktif",
    belum: "Belum aktif",
    ditolak: "Diblokir",
    takDidukung: "Tidak didukung",
  };
  const warnaNotif: Record<KeadaanNotif, string> = {
    memeriksa: "bg-cream-100 text-persis-900",
    aktif: "bg-mint-deep text-persis-800",
    belum: "bg-pastelgold text-gold-700",
    ditolak: "bg-rose-50 text-rose-700",
    takDidukung: "bg-cream-100 text-ink-600",
  };
  const keteranganNotif =
    notif === "aktif"
      ? `Tagihan yang diverifikasi bendahara, nilai, dan nilai tahfidz ananda dikirim ke HP ini — termasuk saat situs sedang ditutup. Ketuk notifikasinya untuk langsung membuka portal wali.${
          notifPerangkat > 0 ? ` Saat ini ${notifPerangkat} HP wali sudah terhubung dengan akun ini.` : ""
        }`
      : notif === "ditolak"
        ? "Izin notifikasi untuk situs ini sedang diblokir peramban. Buka pengaturan situs (ketuk ikon gembok pada bilah alamat) lalu pilih Izinkan pada bagian Notifikasi."
        : notif === "takDidukung"
          ? "Peramban di perangkat ini belum mendukung notifikasi ke layar HP. Tagihan dan nilai tetap bisa dibuka di portal ini kapan saja."
          : notif === "memeriksa"
            ? "Sedang memeriksa keadaan notifikasi di HP ini."
            : "Aktifkan notifikasi agar kabar tagihan terverifikasi, nilai, dan nilai tahfidz ananda langsung sampai ke layar HP ini, walau situs sedang tidak dibuka.";

  const belum = data.tagihan.filter((t) => t.status === "belum");
  const menunggu = data.menunggu;
  const riwayatUrut = data.riwayat;
  const totalBelum = data.ringkasan.belum.nominal;
  const tautanWa = `https://wa.me/${identitas.whatsapp.replace(/\D/g, "").replace(/^0/, "62")}`;

  const belumAdaPilihan = pilihan.length === 0;
  const belumDibayar = belum.filter((t) => t.bulanan).length;

  return (
    <main data-testid="wali-page" className="pb-[calc(5.625rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-[620px] space-y-5 px-5 pt-5">
        {galat ? (
          <article className="rounded-2xl border border-black/[0.08] bg-white p-4">
            <p className="text-justify text-[11.5px] leading-relaxed text-rose-700">{galat}</p>
            <button
              type="button"
              onClick={() => void muat()}
              className="mt-3 w-full rounded-full bg-persis-900 py-2.5 text-[11.5px] font-bold text-white"
            >
              Coba lagi
            </button>
          </article>
        ) : null}

        {tab === "profil" ? (
          <>
            <article
              data-testid="wali-kartu-santri"
              className="rounded-2xl border border-black/[0.08] bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <span className="relative shrink-0">
                  {santri.foto ? (
                    <img
                      data-testid="wali-foto"
                      src={santri.foto}
                      alt={`Foto ${santri.nama}`}
                      className="h-11 w-11 rounded-xl border border-persis-700/10 object-cover"
                    />
                  ) : (
                    <span className="font-header grid h-11 w-11 place-items-center rounded-xl border border-persis-700/10 bg-mint-100 text-[14px] font-bold text-persis-800">
                      {inisial}
                    </span>
                  )}
                  <button
                    type="button"
                    data-testid="wali-foto-pilih"
                    aria-label="Unggah foto profil"
                    disabled={mengunggahFoto}
                    onClick={() => inputFoto.current?.click()}
                    className="absolute -right-1.5 -bottom-1.5 grid h-5 w-5 place-items-center rounded-full border border-white bg-persis-900 text-white shadow-sm disabled:opacity-60"
                  >
                    <Icon name="image" className="h-3 w-3" />
                  </button>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                    Nama {istilah.sebutan}
                  </p>
                  <p className="font-header mt-0.5 text-[13.5px] leading-snug font-bold text-ink-900">{santri.nama}</p>
                </div>
                <span className="shrink-0 rounded-full bg-mint-deep px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.1em] text-persis-800 uppercase">
                  {santri.status === "aktif" ? "Aktif" : santri.status === "lulus" ? "Lulus" : santri.status}
                </span>
              </div>
              <dl className="mt-3.5 divide-y divide-black/[0.06] border-t border-black/[0.06]">
                {barisProfil.map((b) => (
                  <div key={b.label} className="flex items-start gap-3 py-2.5">
                    <dt className="w-[104px] shrink-0 text-[10px] font-bold tracking-[0.12em] text-persis-900 uppercase">
                      {b.label}
                    </dt>
                    <dd className="min-w-0 flex-1 text-justify text-[12px] leading-snug font-medium text-ink-900">
                      {b.nilai}
                    </dd>
                  </div>
                ))}
              </dl>
              <input
                ref={inputFoto}
                data-testid="wali-foto-berkas"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const berkas = e.target.files?.[0];
                  if (berkas) void pilihFoto(berkas);
                }}
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  data-testid="wali-foto-unggah"
                  disabled={mengunggahFoto}
                  onClick={() => inputFoto.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-persis-800/25 bg-mint-deep py-2.5 text-[11.5px] font-semibold text-persis-900 disabled:opacity-60"
                >
                  <Icon name="image" className="h-[15px] w-[15px]" />
                  {mengunggahFoto ? "Mengunggah…" : santri.foto ? "Ganti foto profil" : "Unggah foto profil"}
                </button>
                {santri.foto ? (
                  <button
                    type="button"
                    data-testid="wali-foto-hapus"
                    disabled={mengunggahFoto}
                    onClick={() => {
                      setGalatFoto(null);
                      setMengunggahFoto(true);
                      void hapusFotoWali()
                        .then(() => muat())
                        .catch((e: unknown) => setGalatFoto(e instanceof Error ? e.message : "Foto belum bisa dihapus."))
                        .finally(() => setMengunggahFoto(false));
                    }}
                    className="rounded-full border border-black/[0.12] px-3.5 py-2.5 text-[11.5px] font-semibold text-ink-600 disabled:opacity-60"
                  >
                    Hapus
                  </button>
                ) : null}
              </div>
              {galatFoto ? (
                <p data-testid="wali-foto-galat" className="mt-2 text-[11px] text-red-700">
                  {galatFoto}
                </p>
              ) : null}
              <button
                type="button"
                data-testid="wali-keluar"
                onClick={() => {
                  /* Ikatannya dilepas lebih dulu supaya HP ini tidak lagi menerima
                     notifikasi wali sebelumnya bila wali lain masuk di HP yang sama. */
                  void lepasPushWali()
                    .then(() => keluarWali())
                    .then(() => {
                      setData(null);
                      setPerluPin(true);
                      setNotif("belum");
                      setNotifPesan(null);
                    });
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-black/[0.12] py-2.5 text-[11.5px] font-semibold text-ink-600"
              >
                <Icon name="log-out" className="h-[15px] w-[15px]" />
                Keluar dari portal
              </button>
            </article>
          </>
        ) : null}

        {tab === "profil" ? (
          <article
            data-testid="wali-kartu-notifikasi"
            className="rounded-2xl border border-black/[0.08] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                <Icon name="bell" className="h-[15px] w-[15px] text-gold-600" />
                Notifikasi HP
              </p>
              <span
                data-testid="wali-notif-keadaan"
                className={`shrink-0 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.1em] uppercase ${warnaNotif[notif]}`}
              >
                {labelNotif[notif]}
              </span>
            </div>
            <p data-testid="wali-notif-keterangan" className="mt-2 text-justify text-[11px] leading-relaxed text-ink-600">
              {keteranganNotif}
            </p>
            {notif === "aktif" ? (
              <button
                type="button"
                data-testid="wali-notif-uji"
                disabled={sibukNotif}
                onClick={() => void cobaNotifikasi()}
                className="mt-3 w-full rounded-full border border-persis-800/25 bg-mint-deep py-2.5 text-[11.5px] font-semibold text-persis-900 disabled:opacity-60"
              >
                {sibukNotif ? "Mengirim…" : "Kirim contoh notifikasi"}
              </button>
            ) : null}
            {notif === "belum" ? (
              <button
                type="button"
                data-testid="wali-notif-aktifkan"
                disabled={sibukNotif}
                onClick={() => void aktifkanNotifikasi()}
                className="mt-3 w-full rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {sibukNotif ? "Menyiapkan notifikasi…" : "Aktifkan notifikasi"}
              </button>
            ) : null}
            {notifPesan ? (
              <p
                data-testid="wali-notif-pesan"
                className="mt-3 rounded-2xl border border-gold-400/40 bg-cream-100 px-3.5 py-2.5 text-justify text-[10.5px] leading-relaxed text-persis-900"
              >
                {notifPesan}
              </p>
            ) : null}
            <p className="mt-3 border-t border-black/[0.06] pt-3 text-justify text-[10.5px] leading-relaxed text-ink-600">
              Notifikasi ini terkunci pada akun {santri.nama} di HP ini. Bila wali lain masuk melalui HP yang sama,
              notifikasinya berpindah ke akun wali tersebut sehingga tidak tertukar dengan wali lain.
            </p>
          </article>
        ) : null}

        {tab === "tagihan" ? (
          <article
            data-testid="wali-kartu-tagihan"
            className="rounded-2xl border border-black/[0.08] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">Total Belum Dibayar</p>
                <p className="font-header mt-1.5 text-[22px] leading-none font-extrabold text-ink-900">
                  {rupiah(totalBelum)}
                </p>
                <p className="mt-1.5 text-[10.5px] text-persis-900">
                  {belum.length > 0
                    ? `${belum.length} tagihan aktif${belumDibayar > 0 ? ` · ${belumDibayar} tagihan bulanan` : ""}`
                    : "Semua tagihan sudah dibayar"}
                </p>
                <div className="mt-1">
                  <AlamatSekolah santri={santri} />
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.1em] uppercase ${
                  belum.length > 0 ? "bg-pastelgold text-gold-700" : "bg-mint-deep text-persis-800"
                }`}
              >
                {belum.length > 0 ? "Belum lunas" : "Lunas"}
              </span>
            </div>

            {belum.length > 0 ? (
              <>
                <ul className="mt-3.5 divide-y divide-black/[0.06] border-t border-black/[0.06]">
                  {belum.map((t) => {
                    const dipilih = pilihan.includes(t.id);
                    return (
                      <li key={t.id} data-testid={`wali-tagihan-${t.id}`} className="py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            aria-pressed={dipilih}
                            onClick={() => togolPilihan(t.id)}
                            className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                          >
                            <span
                              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                                dipilih ? "border-persis-900 bg-persis-900 text-white" : "border-black/20 bg-white"
                              }`}
                            >
                              {dipilih ? <Icon name="check" className="h-3 w-3" /> : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[12px] font-semibold text-ink-900">
                                {t.label}
                                {t.periode ? ` · ${t.periode.slice(5)}/${t.periode.slice(0, 4)}` : ""}
                              </span>
                              <span className="mt-0.5 block text-[10.5px] text-persis-900">
                                {t.jatuhTempo ? `Jatuh tempo ${tanggalPendek(t.jatuhTempo)}` : "Tanpa jatuh tempo"}
                                {t.lewatTempo ? " · sudah lewat" : ""}
                              </span>
                              {t.keterangan ? (
                                <span className="mt-0.5 block text-justify text-[10px] leading-snug text-ink-600">
                                  {t.keterangan}
                                </span>
                              ) : null}
                            </span>
                          </button>
                          <span className="shrink-0 text-right">
                            <span className="font-header block text-[12px] font-bold text-ink-900">{rupiah(t.jumlah)}</span>
                            <span className="mt-0.5 block text-[9.5px] font-semibold tracking-[0.08em] text-gold-700 uppercase">
                              {LABEL_STATUS[t.status] ?? t.status}
                            </span>
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 border-t border-black/[0.06] pt-3 text-justify text-[11px] leading-relaxed text-ink-600">
                  Tandai tagihan yang mau dibayar (boleh beberapa sekaligus), lalu tekan Bayar Sekarang. Tagihan berpindah
                  ke riwayat setelah bendahara memverifikasi pembayaran.
                </p>
                <button
                  type="button"
                  onClick={onBayar}
                  data-testid="wali-bayar-sekarang"
                  disabled={belumAdaPilihan}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  <Icon name="wallet" className="h-4 w-4" />
                  {belumAdaPilihan ? "Pilih tagihan dulu" : `Bayar ${pilihan.length} tagihan`}
                </button>
              </>
            ) : (
              <p
                data-testid="wali-tagihan-kosong"
                className="mt-3 border-t border-black/[0.06] pt-3 text-justify text-[11px] leading-relaxed text-ink-600"
              >
                Tidak ada tagihan yang menunggu pembayaran. Terima kasih atas ketertiban pembayarannya. Riwayat lengkap
                dapat dilihat pada bagian riwayat pembayaran di bawah.
              </p>
            )}
          </article>
        ) : null}

        {tab === "tagihan" && menunggu.length > 0 ? (
          <article
            data-testid="wali-kartu-menunggu"
            className="rounded-2xl border border-black/[0.08] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                  <Icon name="clock" className="h-[15px] w-[15px] text-gold-600" />
                  Menunggu Verifikasi
                </p>
                <p className="mt-1.5 text-justify text-[11px] leading-relaxed text-ink-600">
                  Setoran berikut sudah kami catat dan sedang diperiksa bendahara. Tagihan akan berpindah ke riwayat
                  begitu dinyatakan sah.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-cream-100 px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.1em] text-persis-900 uppercase">
                {menunggu.length} ditinjau
              </span>
            </div>
            <ul className="mt-3 divide-y divide-black/[0.06] border-t border-black/[0.06]">
              {menunggu.map((t) => (
                <li key={t.id} className="py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold text-ink-900">{t.label}</span>
                      <span className="mt-0.5 block text-[10.5px] text-persis-900">
                        {t.metode || "Transfer Bank"} · dikirim {t.dibayarPada ? tanggalPendek(t.dibayarPada) : "hari ini"}
                      </span>
                    </span>
                    <span className="font-header shrink-0 text-[12px] font-bold text-ink-900">{rupiah(t.jumlah)}</span>
                  </div>
                  <p
                    data-testid={`wali-status-${t.id}`}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1.5 text-[10.5px] font-semibold text-persis-900"
                  >
                    <Icon name="clock" className="h-3 w-3" />
                    Menunggu pemeriksaan bendahara
                  </p>
                </li>
              ))}
            </ul>
            <a
              href={tautanWa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-persis-900/20 bg-white py-2.5 text-[11.5px] font-bold text-persis-900 transition active:scale-[0.98]"
            >
              <Icon name="whatsapp" className="h-3.5 w-3.5" />
              Tanya Bendahara
            </a>
          </article>
        ) : null}

        {tab === "tagihan" ? (
          <article
            data-testid="wali-kartu-riwayat"
            className="rounded-2xl border border-black/[0.08] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                <Icon name="info" className="h-[15px] w-[15px] text-gold-600" />
                Riwayat Pembayaran
              </p>
              <span className="shrink-0 text-[10.5px] text-persis-900">{riwayatUrut.length} pembayaran</span>
            </div>
            {riwayatUrut.length > 0 ? (
              <ul className="mt-3 divide-y divide-black/[0.06] border-t border-black/[0.06]">
                {riwayatUrut.map((t) => (
                  <li key={t.id} data-testid={`wali-riwayat-${t.id}`} className="flex items-start justify-between gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold text-ink-900">{t.label}</span>
                      <span className="mt-0.5 block text-[10.5px] text-persis-900">
                        {t.metode || "Pembayaran"} ·{" "}
                        {tanggalPendek(t.diverifikasiPada ?? t.dibayarPada) || "tanggal tidak tercatat"}
                      </span>
                      {t.catatan ? (
                        <span className="mt-0.5 block text-justify text-[10px] leading-snug text-ink-600">
                          {t.catatan}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="font-header block text-[12px] font-bold text-ink-900">{rupiah(t.jumlah)}</span>
                      <span
                        className={`mt-0.5 inline-flex items-center gap-1 text-[9.5px] font-semibold tracking-[0.08em] uppercase ${
                          t.status === "terverifikasi" ? "text-persis-800" : "text-rose-700"
                        }`}
                      >
                        <Icon name={t.status === "terverifikasi" ? "check" : "x"} className="h-3 w-3 text-gold-600" />
                        {t.status === "terverifikasi" ? "Terverifikasi" : "Ditolak"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                data-testid="wali-riwayat-kosong"
                className="mt-3 border-t border-black/[0.06] pt-3 text-justify text-[11px] leading-relaxed text-ink-600"
              >
                Belum ada pembayaran yang terverifikasi. Setiap pembayaran yang sah akan tercatat di bagian ini.
              </p>
            )}
            {riwayatUrut.length > 6 ? (
              <Paginasi
                halaman={halamanRiwayat}
                totalHalaman={Math.max(1, Math.ceil(riwayatUrut.length / 6))}
                dari={Math.min((halamanRiwayat - 1) * 6 + 1, riwayatUrut.length)}
                sampai={Math.min(halamanRiwayat * 6, riwayatUrut.length)}
                total={riwayatUrut.length}
                satuan="pembayaran"
                testId="wali-riwayat-pagination"
                onChange={setHalamanRiwayat}
              />
            ) : null}
          </article>
        ) : null}

        {tab === "nilai" ? (
          <article
            data-testid="wali-kartu-nilai"
            className="rounded-2xl border border-black/[0.08] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">{istilah.materi}</p>
                <p className="mt-1.5 text-[10.5px] text-persis-900">
                  {data.nilai.length > 0
                    ? `${data.nilai.length} nilai sudah terbit${
                        data.nilai[0]?.semester ? ` · ${data.nilai[0].semester}` : ""
                      }`
                    : "Belum ada nilai yang terbit"}
                </p>
              </div>
              {data.nilai.length > 0 ? (
                <span
                  data-testid="wali-nilai-rata"
                  className="shrink-0 rounded-full bg-mint-deep px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.1em] text-persis-800 uppercase"
                >
                  Rata-rata {data.rataNilai.toLocaleString("id-ID")}
                </span>
              ) : null}
            </div>

            {data.nilai.length > 0 ? (
              <ul className="mt-3 divide-y divide-black/[0.06] border-t border-black/[0.06]">
                {data.nilai.map((n) => (
                  <li
                    key={n.id}
                    data-testid={`wali-nilai-${n.id}`}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold text-ink-900">{n.mapel}</span>
                      <span className="mt-0.5 block text-[10.5px] text-persis-900">
                        {n.predikat ? `Predikat ${n.predikat} · ` : ""}
                        {n.terbitPada ? `diterbitkan ${tanggalPendek(n.terbitPada)}` : "sudah terbit"}
                      </span>
                    </span>
                    <span className="font-header shrink-0 text-[15px] font-extrabold text-ink-900">
                      {n.nilai.toLocaleString("id-ID")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                data-testid="wali-nilai-kosong"
                className="mt-3 border-t border-black/[0.06] pt-3 text-justify text-[11.5px] leading-relaxed text-ink-600"
              >
                Belum ada nilai yang diterbitkan {istilah.unit} untuk ananda. Nilai akan muncul di sini — beserta
                notifikasi ke HP wali — setelah {istilah.pengajarTunggalKecil} {istilah.materiKecil} menilai dan
                petugas {istilah.unit} menerbitkannya.
              </p>
            )}

            <p className="mt-3 text-justify text-[10.5px] leading-relaxed text-ink-600">
              Nilai yang masih dalam penyusunan belum ditampilkan di portal ini. Bila ada nilai yang dirasa belum
              sesuai, hubungi petugas {istilah.unit} ananda.
            </p>
          </article>
        ) : null}

        {tab === "tahfidz" ? (
          <article
            data-testid="wali-kartu-tahfidz"
            className="rounded-2xl border border-black/[0.08] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                <Icon name="book-open" className="h-[15px] w-[15px] text-gold-600" />
                Setoran Tahfidz
              </p>
              <span className="shrink-0 text-[10.5px] text-persis-900">
                {data.tahfidz.setoran.length} setoran
                {totalAyatSetoran > 0 ? ` · ${totalAyatSetoran} ayat` : ""}
              </span>
            </div>

            {data.tahfidz.setoran.length > 0 ? (
              <ul className="mt-3 divide-y divide-black/[0.06] border-t border-black/[0.06]">
                {data.tahfidz.setoran.map((t) => (
                  <li
                    key={t.id}
                    data-testid={`wali-setoran-${t.id}`}
                    className="flex items-start justify-between gap-3 py-2.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold text-ink-900">{t.materi}</span>
                      <span className="mt-0.5 block text-[10.5px] text-persis-900">
                        {[t.jenis, t.jumlahAyat ? `${t.jumlahAyat} ayat` : "", t.tanggal ? tanggalPendek(t.tanggal) : "", t.penilai]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {t.catatan ? (
                        <span className="mt-0.5 block text-justify text-[10px] leading-snug text-ink-600">
                          {t.catatan}
                        </span>
                      ) : null}
                    </span>
                    {t.nilai ? (
                      <span className="shrink-0 rounded-full bg-mint-deep px-2.5 py-1 text-[9.5px] font-bold text-persis-800">
                        {t.nilai}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p
                data-testid="wali-tahfidz-kosong"
                className="mt-3 border-t border-black/[0.06] pt-3 text-justify text-[11.5px] leading-relaxed text-ink-600"
              >
                Belum ada catatan setoran hafalan yang diterbitkan pembimbing untuk ananda. Catatan akan muncul di
                sini — beserta notifikasi ke HP wali — setelah pembimbing menilai hafalan dan petugas menerbitkannya.
              </p>
            )}
          </article>
        ) : null}

        <p className="text-justify text-[10.5px] leading-relaxed text-ink-600">
          Seluruh data pada halaman ini diambil langsung dari data {istilah.unit}. Bila ada yang belum sesuai, hubungi
          petugas tata usaha {istilah.unit} ananda melalui{" "}
          <a href={tautanWa} target="_blank" rel="noopener noreferrer" className="font-semibold text-persis-900 underline">
            WhatsApp
          </a>
          .
        </p>
      </div>
    </main>
  );
}
