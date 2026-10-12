import { useEffect, useState } from "react";
import MasukPin from "../components/admin/MasukPin";
import WadahNotifikasi from "../components/admin/NotifikasiAdmin";
import { useProfil } from "../lib/profil";
import { useIstilah, type Istilah } from "../lib/istilah";
import { masukUnit, periksaSesiUnit, useSesiUnit } from "../lib/sesiUnit";
import KepalaUnit, { type MenuUnit } from "./unit/KepalaUnit";
import StatistikSekolah from "./unit/StatistikSekolah";
import TabelSiswa from "./unit/TabelSiswa";
import TabelAlumni from "./unit/TabelAlumni";
import Nilai from "./unit/Nilai";
import Tahfidz from "./unit/Tahfidz";
import MataPelajaran from "./unit/MataPelajaran";

/**
 * Halaman Admin Sekolah — halaman tersendiri untuk petugas sekolah. Masuk memakai
 * PIN sekolah yang sama dengan Admin SPMB dan Admin Tata Usaha, lalu menampilkan
 * statistik sekolah yang sedang masuk.
 */

/**
 * Menu mengikuti penyebutan jenjang: Siswa pada sekolah, Mahasiswa pada kampus,
 * serta Mata Pelajaran pada sekolah/madrasah dan Mata Kuliah pada kampus.
 */
const menuUnit = (t: Istilah): MenuUnit[] => {
  const mapel = t.materiKecil
    .split(" ")
    .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
    .join(" ");
  return [
    { id: "dashboard", label: "Dashboard", ikon: "home" },
    { id: "siswa", label: t.sebutan, ikon: "users" },
    { id: "nilai", label: "Nilai", ikon: "award" },
    { id: "tahfidz", label: "Tahfidz", ikon: "book-open" },
    { id: "mapel", label: mapel, ikon: "clipboard" },
    { id: "alumni", label: "Alumni", ikon: "graduation-cap" },
  ];
};

export default function HalamanUnitSekolah({
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
    window.scrollTo({ top: 0 });
  };

  if (!token) {
    return (
      <MasukPin
        testid="sekolah-masuk"
        testidKolom="pin-unit"
        label="Admin Unit Pendidikan"
        judul="Masuk Admin Unit Pendidikan"
        keterangan="Masukkan PIN unit pendidikan Anda. Satu PIN dipakai bersama untuk halaman Admin Sekolah, Admin SPMB, dan Admin Tata Usaha unit tersebut — pada jenjang perguruan tinggi halaman yang sama tampil sebagai Admin Kampus dan Admin PMB."
        catatan="PIN diberikan pengurus PC PERSIS Cibatu. Bila PIN belum diterima atau lupa, hubungi pengurus pusat untuk membuat PIN baru."
        onMasuk={async (pin) => {
          await masukUnit(pin);
        }}
      />
    );
  }

  if (memeriksa && !sesi) {
    return (
      <main data-testid="sekolah-memeriksa" className="grid min-h-dvh place-items-center bg-persis-900 text-white">
        <p className="text-[12px] font-semibold text-white/80">Memeriksa sesi…</p>
      </main>
    );
  }

  const namaSekolah = sesi?.unit?.nama ?? identitas.namaLengkap ?? "PC PERSIS Cibatu";

  return (
    <main data-testid="sekolah-page" className="min-h-dvh bg-cream-50 pb-10">
      <WadahNotifikasi />
      <KepalaUnit
        label={`Admin ${t.statUnit}`}
        namaSekolah={namaSekolah}
        jenjang={sesi?.unit?.jenjang}
        menuAktif={menu}
        menu={menuUnit(t)}
        onPilihMenu={pilihMenu}
        onKeluar={onKeluar}
        onLihatSitus={onLihatSitus}
      />
      <div className="mx-auto w-full max-w-[620px] px-4 pt-1 pb-4">
        {menu === "dashboard" ? <StatistikSekolah versi={versi} /> : null}
        {menu === "siswa" ? <TabelSiswa onBerubah={() => setVersi((v) => v + 1)} /> : null}
        {menu === "nilai" ? <Nilai onBukaMenu={pilihMenu} /> : null}
        {menu === "tahfidz" ? <Tahfidz /> : null}
        {menu === "mapel" ? <MataPelajaran /> : null}
        {menu === "alumni" ? <TabelAlumni /> : null}
      </div>
    </main>
  );
}
