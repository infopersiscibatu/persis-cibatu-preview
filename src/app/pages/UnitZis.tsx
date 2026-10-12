import { useEffect, useState } from "react";
import MasukPin from "../components/admin/MasukPin";
import WadahNotifikasi from "../components/admin/NotifikasiAdmin";
import { Icon } from "../components/Icons";
import { useProfil } from "../lib/profil";
import { hapusSesiUnit, keluarUnit, masukUnit, periksaSesiUnit, useSesiUnit } from "../lib/sesiUnit";
import KepalaUnit, { type MenuUnit } from "./unit/KepalaUnit";
import StatistikZis from "./unit/StatistikZis";
import DonaturZis from "./unit/zis/DonaturZis";
import KategoriProgramZis from "./unit/zis/KategoriProgramZis";
import LaporanPenyaluranZis from "./unit/zis/LaporanPenyaluranZis";
import MetodePembayaranZis from "./unit/zis/MetodePembayaranZis";
import ProgramDonasiZis from "./unit/zis/ProgramDonasiZis";
import RiwayatDonasiZis from "./unit/zis/RiwayatDonasiZis";

/**
 * Halaman Admin ZIS — halaman tersendiri untuk petugas ZIS (donasi, infak, dan wakaf).
 *
 * Desain layar masuk dan kepalanya sama dengan halaman admin lain: masuk memakai PIN
 * Admin ZIS (PIN yang dibuat pengurus dari panel admin), lalu menunya:
 * Dashboard, Donatur, Program Donasi (Daftar Program dan Kategori Program),
 * Laporan Penyaluran, dan Riwayat Donasi.
 */

const menuZis: MenuUnit[] = [
  { id: "dashboard", label: "Dashboard", ikon: "home" },
  { id: "donatur", label: "Donatur", ikon: "users" },
  { id: "program-daftar", label: "Daftar Program", ikon: "heart", grup: "Program Donasi" },
  { id: "program-kategori", label: "Kategori Program", ikon: "clipboard", grup: "Program Donasi" },
  { id: "metode", label: "Metode Pembayaran", ikon: "wallet", grup: "Program Donasi" },
  { id: "laporan", label: "Laporan Penyaluran", ikon: "megaphone" },
  { id: "riwayat", label: "Riwayat Donasi", ikon: "wallet" },
];

export default function HalamanUnitZis({
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
  const [memeriksa, setMemeriksa] = useState(false);
  const [menu, setMenu] = useState("dashboard");

  /* Token lama diperiksa sekali supaya sesi yang sudah berakhir tidak dipakai lagi. */
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
    window.scrollTo({ top: 0 });
  };

  if (!token) {
    return (
      <MasukPin
        testid="zis-masuk"
        testidKolom="pin-zis"
        label="Admin ZIS"
        judul="Masuk Admin ZIS"
        keterangan="Masukkan PIN Admin ZIS untuk membuka data donasi, infak, dan wakaf."
        catatan="PIN Admin ZIS dibuat pengurus dari panel admin (menu Admin ZIS). Bila PIN belum diterima atau lupa, hubungi pengurus PC PERSIS Cibatu untuk membuat PIN baru."
        onMasuk={async (pin) => {
          const masuk = await masukUnit(pin);
          /* PIN sekolah juga diterima layanan, jadi pastikan yang masuk memang sesi ZIS. */
          if (masuk.jenis !== "zis") {
            await keluarUnit().catch(() => hapusSesiUnit());
            throw new Error("PIN itu milik unit pendidikan. Masukkan PIN Admin ZIS dari pengurus.");
          }
        }}
      />
    );
  }

  if (memeriksa && !sesi) {
    return (
      <main data-testid="zis-memeriksa" className="grid min-h-dvh place-items-center bg-persis-900 text-white">
        <p className="text-[12px] font-semibold text-white/80">Memeriksa sesi…</p>
      </main>
    );
  }

  /* Peramban ini sedang masuk sebagai petugas unit pendidikan, bukan Admin ZIS. */
  if (sesi && sesi.jenis !== "zis") {
    return (
      <main
        data-testid="zis-sesi-lain"
        className="grid min-h-dvh place-items-center bg-persis-900 px-6 text-center text-white"
      >
        <div>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.12]">
            <Icon name="heart" className="h-6 w-6 text-gold-300" />
          </span>
          <h1 className="font-header mt-3 text-[15px] font-bold">Halaman ini untuk Admin ZIS</h1>
          <p className="mt-1.5 text-justify text-[11.5px] leading-relaxed text-white/75">
            Peramban ini sedang masuk sebagai petugas {sesi.unit?.nama ?? "unit pendidikan"}. Keluar dulu dari sesi
            tersebut untuk masuk memakai PIN Admin ZIS.
          </p>
          <button
            type="button"
            data-testid="zis-keluar-sesi-lain"
            onClick={() => hapusSesiUnit()}
            className="mt-4 w-full rounded-full bg-gold-500 px-4 py-3 text-[12px] font-bold text-persis-950 transition active:scale-[0.98]"
          >
            Keluar & masuk sebagai Admin ZIS
          </button>
        </div>
      </main>
    );
  }

  return (
    <main data-testid="zis-page" className="min-h-dvh bg-cream-50 pb-10">
      <WadahNotifikasi />
      <KepalaUnit
        label="Admin ZIS"
        namaSekolah={sesi?.nama || identitas.namaLengkap || "PC PERSIS Cibatu"}
        jenjang="Donasi · Infak · Wakaf"
        menuAktif={menu}
        menu={menuZis}
        onPilihMenu={pilihMenu}
        onKeluar={onKeluar}
        onLihatSitus={onLihatSitus}
      />
      <div className="mx-auto w-full max-w-[620px] px-4 pt-1 pb-4">
        {menu === "dashboard" ? <StatistikZis /> : null}
        {menu === "donatur" ? <DonaturZis /> : null}
        {menu === "program-daftar" ? <ProgramDonasiZis namaPetugas={sesi?.nama} /> : null}
        {menu === "program-kategori" ? <KategoriProgramZis /> : null}
        {menu === "metode" ? <MetodePembayaranZis /> : null}
        {menu === "laporan" ? <LaporanPenyaluranZis /> : null}
        {menu === "riwayat" ? <RiwayatDonasiZis /> : null}
      </div>
    </main>
  );
}
