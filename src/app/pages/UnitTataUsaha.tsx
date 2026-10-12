import { useEffect, useState } from "react";
import MasukPin from "../components/admin/MasukPin";
import WadahNotifikasi from "../components/admin/NotifikasiAdmin";
import { useProfil } from "../lib/profil";
import { useIstilah, type Istilah } from "../lib/istilah";
import { masukUnit, periksaSesiUnit, useSesiUnit } from "../lib/sesiUnit";
import KepalaUnit, { type MenuUnit } from "./unit/KepalaUnit";
import StatistikTataUsaha from "./unit/StatistikTataUsaha";
import TabelTagihan from "./unit/TabelTagihan";
import KategoriTagihan from "./unit/KategoriTagihan";
import PembayaranTagihan from "./unit/PembayaranTagihan";
import MetodePembayaran from "./unit/MetodePembayaran";
import TunggakanLunas from "./unit/TunggakanLunas";

/**
 * Halaman Admin Tata Usaha — halaman tersendiri untuk petugas tata usaha sekolah.
 * Masuk memakai PIN sekolah yang sama dengan Admin SPMB dan Admin Sekolah, lalu
 * menampilkan statistik tagihan sekolah yang sedang masuk.
 */

/** Tagihan bulanan disebut SPP pada sekolah dan UKT pada kampus. */
const menuUnit = (t: Istilah): MenuUnit[] => [
  { id: "dashboard", label: "Dashboard", ikon: "home" },
  { id: "tagihan", label: `Tagihan ${t.iuran}`, ikon: "wallet" },
  { id: "kategori", label: "Kategori", ikon: "clipboard" },
  { id: "pembayaran", label: "Pembayaran", ikon: "wallet" },
  { id: "metode", label: "Metode Pembayaran", ikon: "wallet" },
  /* Menggantikan tabel alumni: laporan tagihan per nama. */
  { id: "tunggakan", label: "Tunggakan & Lunas", ikon: "clipboard" },
];

export default function HalamanUnitTataUsaha({
  onKeluar,
  onLihatSitus,
}: {
  /** Keluar dari panel: sesi dibersihkan dan panel kembali ke layar masuk PIN. */
  onKeluar?: () => void;
  /** Membuka situs publik dari panel. */
  onLihatSitus?: () => void;
}) {
  const { identitas } = useProfil();
  const { token, sesi } = useSesiUnit();
  const t = useIstilah();
  const [memeriksa, setMemeriksa] = useState(false);
  const [menu, setMenu] = useState("dashboard");
  const [versi, setVersi] = useState(0);

  useEffect(() => {
    if (!token) return;
    let batal = false;
    setMemeriksa(true);
    periksaSesiUnit().finally(() => {
      if (!batal) setMemeriksa(false);
    });
    return () => {
      batal = true;
    };
  }, [token]);

  const pilihMenu = (id: string) => {
    setMenu(id);
    setVersi((v) => v + 1);
    window.scrollTo({ top: 0 });
  };

  if (!token) {
    return (
      <MasukPin
        testid="tu-masuk"
        testidKolom="pin-unit"
        label="Admin Tata Usaha"
        judul="Masuk Admin Tata Usaha"
        keterangan="Masukkan PIN unit pendidikan Anda. Satu PIN dipakai bersama untuk halaman Admin Tata Usaha, Admin Sekolah, dan Admin SPMB unit tersebut."
        catatan="PIN diberikan pengurus PC PERSIS Cibatu. Bila PIN belum diterima atau lupa, hubungi pengurus pusat untuk membuat PIN baru."
        onMasuk={async (pin) => {
          await masukUnit(pin);
        }}
      />
    );
  }

  if (memeriksa && !sesi) {
    return (
      <main data-testid="tu-memeriksa" className="grid min-h-dvh place-items-center bg-persis-900 text-white">
        <p className="text-[12px] font-semibold text-white/80">Memeriksa sesi…</p>
      </main>
    );
  }

  const namaSekolah = sesi?.unit?.nama ?? identitas.namaLengkap ?? "PC PERSIS Cibatu";

  return (
    <main data-testid="tu-page" className="min-h-dvh bg-cream-50 pb-10">
      <WadahNotifikasi />
      <KepalaUnit
        label={`Admin Tata Usaha ${t.statUnit}`}
        namaSekolah={namaSekolah}
        jenjang={sesi?.unit?.jenjang}
        menuAktif={menu}
        menu={menuUnit(t)}
        onPilihMenu={pilihMenu}
        onKeluar={onKeluar}
        onLihatSitus={onLihatSitus}
      />
      <div className="mx-auto w-full max-w-[620px] px-4 pt-1 pb-4">
        {menu === "dashboard" ? <StatistikTataUsaha versi={versi} /> : null}
        {menu === "tagihan" ? <TabelTagihan onBerubah={() => setVersi((v) => v + 1)} /> : null}
        {menu === "kategori" ? <KategoriTagihan /> : null}
        {menu === "pembayaran" ? <PembayaranTagihan onBerubah={() => setVersi((v) => v + 1)} /> : null}
        {menu === "metode" ? <MetodePembayaran /> : null}
        {menu === "tunggakan" ? <TunggakanLunas onBerubah={() => setVersi((v) => v + 1)} /> : null}
      </div>
    </main>
  );
}
