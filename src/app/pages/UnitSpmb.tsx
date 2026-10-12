import { useEffect, useState } from "react";
import MasukPin from "../components/admin/MasukPin";
import WadahNotifikasi from "../components/admin/NotifikasiAdmin";
import { useProfil } from "../lib/profil";
import { useIstilah, type Istilah } from "../lib/istilah";
import { masukUnit, periksaSesiUnit, useSesiUnit } from "../lib/sesiUnit";
import KepalaUnit, { type MenuUnit } from "./unit/KepalaUnit";
import DashboardSpmb from "./unit/DashboardSpmb";
import TabelPendaftar, { KOSONG } from "./unit/TabelPendaftar";

/**
 * Halaman Admin SPMB — halaman tersendiri untuk petugas SPMB tiap sekolah.
 * Masuk memakai PIN sekolah (satu PIN sekolah berlaku untuk SPMB, Sekolah, dan
 * Tata Usaha), lalu menunya: Dashboard, Pendaftar, dan Tertolak.
 */

const menuUnit = (t: Istilah): MenuUnit[] => [
  { id: "dashboard", label: "Dashboard", ikon: "home" },
  { id: "pendaftar", label: `${t.calon}`, ikon: "users" },
  { id: "tertolak", label: "Tertolak", ikon: "x" },
];

export default function HalamanUnitSpmb({
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

  /* Token lama diperiksa sekali supaya nama sekolah langsung tampil dan sesi
     yang sudah berakhir tidak dipakai lagi. */
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

  /* Berpindah menu selalu kembali ke atas halaman. */
  const pilihMenu = (id: string) => {
    setMenu(id);
    window.scrollTo({ top: 0 });
  };

  if (!token) {
    return (
      <MasukPin
        testid="unit-masuk"
        testidKolom="pin-unit"
        label={`Admin ${t.penerimaan}`}
        judul={`Masuk Admin ${t.penerimaan}`}
        keterangan="Masukkan PIN unit pendidikan Anda. Satu PIN dipakai bersama untuk halaman Admin SPMB, Admin Sekolah, dan Admin Tata Usaha unit tersebut."
        catatan="PIN diberikan pengurus PC PERSIS Cibatu. Bila PIN belum diterima atau lupa, hubungi pengurus pusat untuk membuat PIN baru."
        onMasuk={async (pin) => {
          await masukUnit(pin);
        }}
      />
    );
  }

  if (memeriksa && !sesi) {
    return (
      <main data-testid="unit-memeriksa" className="grid min-h-dvh place-items-center bg-persis-900 text-white">
        <p className="text-[12px] font-semibold text-white/80">Memeriksa sesi…</p>
      </main>
    );
  }

  const namaSekolah = sesi?.unit?.nama ?? identitas.namaLengkap ?? "PC PERSIS Cibatu";

  return (
    <main data-testid="unit-spmb-page" className="min-h-dvh bg-cream-50 pb-10">
      <WadahNotifikasi />
      <KepalaUnit
        label={`Admin ${t.penerimaan}`}
        namaSekolah={namaSekolah}
        jenjang={sesi?.unit?.jenjang}
        menuAktif={menu}
        menu={menuUnit(t)}
        onPilihMenu={pilihMenu}
        onKeluar={onKeluar}
        onLihatSitus={onLihatSitus}
      />
      <div className="mx-auto w-full max-w-[620px] px-4 pt-1 pb-4">
        {menu === "dashboard" ? <DashboardSpmb /> : null}
        {menu === "pendaftar" ? (
          <TabelPendaftar
            testid="spmb-pendaftar"
            status="diverifikasi"
            judul={`${t.calon} terverifikasi`}
            keterangan={`${t.calon} yang berkasnya sudah diperiksa dan dinyatakan lengkap. Tekan satu baris untuk melihat rincian atau mengubah statusnya.`}
            kosong={KOSONG.diverifikasi}
            versi={versi}
            onBerubah={() => setVersi((v) => v + 1)}
          />
        ) : null}
        {menu === "tertolak" ? (
          <TabelPendaftar
            testid="spmb-tertolak"
            status="tidak-lanjut"
            judul={`${t.calon} ditolak`}
            keterangan={`${t.calon} yang tidak memenuhi syarat atau membatalkan pendaftaran. Tekan satu baris untuk melihat rincian, termasuk catatan alasannya.`}
            kosong={KOSONG["tidak-lanjut"]}
            versi={versi}
            onBerubah={() => setVersi((v) => v + 1)}
          />
        ) : null}
      </div>
    </main>
  );
}
