import { useEffect, useState } from "react";
import { Icon } from "../components/Icons";
import WadahNotifikasi from "../components/admin/NotifikasiAdmin";
import { useProfil } from "../lib/profil";
import { gantiPinAdmin, hapusToken, keluar, useSesiAdmin } from "../lib/sesi";
import Dashboard from "./admin/Dashboard";
import {
  LayananJamaah,
  LogoLembaga,
  Misi,
  NamaLembaga,
  Pengurus,
  ProfilSingkat,
  Semboyan,
  Visi,
} from "./admin/Identitas";
import { GambarHalamanJenjang, NamaJenjang, TeksHalamanJenjang } from "./admin/JenjangPendidikan";
import { NamaSekolah, ProgramJurusan } from "./admin/Sekolah";
import DaftarTahunAjaran from "./admin/TahunAjaran";
import {
  DaftarArtikel,
  GambarHalamanArtikel,
  KategoriArtikel,
  TeksHalamanArtikel,
} from "./admin/Artikel";
import { DaftarPengumuman, KategoriPengumuman } from "./admin/Pengumuman";
import { DaftarAgenda, KategoriAgenda } from "./admin/Agenda";
import { Carousel, FooterBeranda, SusunanGridMenu, SusunanNavigasi } from "./admin/Beranda";
import { AdminUnit, AdminZis } from "./admin/Unit";
import MasukAdmin from "./admin/Masuk";
import {
  AlamatKontak,
  FormulirKontak,
  GambarHalamanKontak,
  LayananInformasiKontak,
  TeksHalamanKontak,
} from "./admin/Kontak";
import {
  GambarHalamanKajian,
  JadwalKajianTerdekat,
  KajianRutinPekanan,
  TeksHalamanKajian,
} from "./admin/Kajian";
import {
  DaftarBerita,
  GambarHalamanBerita,
  KategoriBerita,
  TeksHalamanBerita,
} from "./admin/Berita";
import { DaftarGaleri, GambarHalamanGaleri, KategoriGaleri, TeksHalamanGaleri } from "./admin/Galeri";
import { IklanBerita } from "./admin/Iklan";
import {
  BiayaSpmb,
  FormulirSpmb,
  GambarHalamanSpmb,
  GelombangSpmb,
  LayananSpmb,
  TeksHalamanSpmb,
} from "./admin/Spmb";

/** Menu laci panel admin: Dashboard, lalu kelompok menu yang bisa dibuka-tutup. */
const KELOMPOK = [
  {
    id: "identitas",
    label: "Identitas Lembaga",
    ikon: "school",
    item: [
      { id: "identitas-nama", label: "Nama Lembaga", ikon: "info" },
      { id: "identitas-logo", label: "Logo", ikon: "image" },
      { id: "identitas-profil", label: "Profil Singkat", ikon: "book-open" },
      { id: "identitas-semboyan", label: "Semboyan", ikon: "sparkle" },
      { id: "identitas-visi", label: "Visi", ikon: "eye" },
      { id: "identitas-misi", label: "Misi", ikon: "check" },
      { id: "identitas-pengurus", label: "Susunan Pengurus", ikon: "users" },
      { id: "identitas-layanan", label: "Layanan Jama'ah", ikon: "phone" },
    ],
  },
  {
    id: "jenjang",
    label: "Jenjang Pendidikan",
    ikon: "graduation-cap",
    item: [
      { id: "jenjang-teks", label: "Teks Deskripsi Halaman", ikon: "book-open" },
      { id: "jenjang-gambar", label: "Gambar Halaman", ikon: "image" },
      { id: "jenjang-nama", label: "Nama Jenjang", ikon: "school" },
    ],
  },
  {
    id: "artikel",
    label: "Artikel",
    ikon: "book-open",
    item: [
      { id: "artikel-teks", label: "Teks Halaman", ikon: "book-open" },
      { id: "artikel-gambar", label: "Gambar Halaman", ikon: "image" },
      { id: "artikel-daftar", label: "Daftar Artikel", ikon: "newspaper" },
      { id: "artikel-kategori", label: "Kategori", ikon: "clipboard" },
    ],
  },
  {
    id: "kajian",
    label: "Kajian",
    ikon: "book-open",
    item: [
      { id: "kajian-teks", label: "Teks Halaman", ikon: "book-open" },
      { id: "kajian-gambar", label: "Gambar Halaman", ikon: "image" },
      { id: "kajian-terdekat", label: "Kajian Terdekat", ikon: "calendar" },
      { id: "kajian-rutin", label: "Kajian Rutin", ikon: "clipboard" },
    ],
  },
  {
    id: "berita",
    label: "Berita",
    ikon: "newspaper",
    item: [
      { id: "berita-teks", label: "Teks Halaman", ikon: "book-open" },
      { id: "berita-gambar", label: "Gambar Halaman", ikon: "image" },
      { id: "berita-daftar", label: "Daftar Berita", ikon: "newspaper" },
      { id: "berita-kategori", label: "Kategori", ikon: "clipboard" },
      { id: "berita-iklan", label: "Iklan", ikon: "image" },
    ],
  },
  {
    id: "galeri",
    label: "Galeri",
    ikon: "image",
    item: [
      { id: "galeri-teks", label: "Teks Halaman", ikon: "book-open" },
      { id: "galeri-gambar", label: "Gambar Halaman", ikon: "image" },
      { id: "galeri-daftar", label: "Daftar Galeri", ikon: "eye" },
      { id: "galeri-kategori", label: "Kategori", ikon: "clipboard" },
    ],
  },
  {
    id: "beranda",
    label: "Beranda",
    ikon: "home",
    item: [
      { id: "beranda-carousel", label: "Carousel", ikon: "image" },
      { id: "beranda-grid", label: "Susunan Grid Menu", ikon: "menu" },
      { id: "beranda-nav", label: "Susunan Navigasi", ikon: "pin" },
      { id: "beranda-footer", label: "Footer", ikon: "mail" },
    ],
  },
  {
    id: "pengumuman",
    label: "Pengumuman",
    ikon: "megaphone",
    item: [
      { id: "pengumuman-daftar", label: "Daftar Pengumuman", ikon: "megaphone" },
      { id: "pengumuman-kategori", label: "Kategori", ikon: "clipboard" },
    ],
  },
  {
    id: "agenda",
    label: "Agenda",
    ikon: "calendar",
    item: [
      { id: "agenda-daftar", label: "Daftar Agenda", ikon: "calendar" },
      { id: "agenda-kategori", label: "Kategori", ikon: "clipboard" },
    ],
  },
  {
    id: "kontak",
    label: "Kontak",
    ikon: "phone",
    item: [
      { id: "kontak-teks", label: "Teks Halaman", ikon: "phone" },
      { id: "kontak-gambar", label: "Gambar Halaman", ikon: "image" },
      { id: "kontak-alamat", label: "Alamat", ikon: "map-pin" },
      { id: "kontak-layanan", label: "Layanan Informasi", ikon: "user" },
      { id: "kontak-formulir", label: "Formulir", ikon: "clipboard" },
    ],
  },
  {
    id: "spmb",
    label: "SPMB",
    ikon: "clipboard",
    item: [
      { id: "spmb-teks", label: "Teks Halaman", ikon: "book-open" },
      { id: "spmb-gambar", label: "Gambar Halaman", ikon: "image" },
      { id: "spmb-gelombang", label: "Gelombang Pendaftaran", ikon: "calendar" },
      { id: "spmb-biaya", label: "Biaya Pendaftaran", ikon: "wallet" },
      { id: "spmb-formulir", label: "Formulir Pendaftaran", ikon: "clipboard" },
      { id: "spmb-layanan", label: "Layanan Informasi", ikon: "phone" },
    ],
  },
  {
    id: "sekolah",
    label: "Sekolah",
    ikon: "school",
    item: [
      { id: "sekolah-nama", label: "Nama Sekolah", ikon: "school" },
      { id: "sekolah-jurusan", label: "Program Jurusan", ikon: "award" },
    ],
  },
  {
    id: "tahun",
    label: "Tahun Ajaran",
    ikon: "calendar",
    item: [{ id: "tahun-ajaran", label: "Daftar Tahun Ajaran", ikon: "calendar" }],
  },
] as const;

/** Menu yang berdiri sendiri, tanpa sub-menu (mis. unit kerja di panel admin). */
const MENU_TUNGGAL = [
  { id: "unit", label: "Admin Unit", ikon: "school" },
  { id: "unit-zis", label: "Admin ZIS", ikon: "heart" },
] as const;

/**
 * Susunan laci panel admin: Dashboard di paling atas, lalu menu dikelompokkan
 * menurut label agar mudah dicari.
 */
const SEKSI = [
  { id: "lembaga", label: "Lembaga", isi: ["identitas", "jenjang", "sekolah", "tahun"] },
  {
    id: "konten",
    label: "Konten Website",
    isi: ["berita", "artikel", "kajian", "agenda", "pengumuman", "galeri", "kontak", "spmb"],
  },
  { id: "situs", label: "Situs", isi: ["beranda"] },
  { id: "unit", label: "Admin Unit", isi: ["unit", "unit-zis"] },
] as const;

type IdMenu =
  | "dashboard"
  | (typeof KELOMPOK)[number]["item"][number]["id"]
  | (typeof MENU_TUNGGAL)[number]["id"];

const JUDUL: Record<IdMenu, string> = {
  dashboard: "Dashboard",
  "identitas-nama": "Nama Lembaga",
  "identitas-logo": "Logo",
  "identitas-profil": "Profil Singkat",
  "identitas-semboyan": "Semboyan",
  "identitas-visi": "Visi",
  "identitas-misi": "Misi",
  "identitas-pengurus": "Susunan Pengurus",
  "identitas-layanan": "Layanan Jama'ah",
  "jenjang-teks": "Teks Deskripsi Halaman",
  "jenjang-gambar": "Gambar Halaman",
  "jenjang-nama": "Nama Jenjang",
  "sekolah-nama": "Nama Sekolah",
  "sekolah-jurusan": "Program Jurusan",
  "tahun-ajaran": "Tahun Ajaran",
  "spmb-teks": "Teks Halaman",
  "spmb-gambar": "Gambar Halaman",
  "spmb-gelombang": "Gelombang Pendaftaran",
  "spmb-biaya": "Biaya Pendaftaran",
  "spmb-formulir": "Formulir Pendaftaran",
  "spmb-layanan": "Layanan Informasi",
  "galeri-teks": "Teks Halaman",
  "galeri-gambar": "Gambar Halaman",
  "galeri-daftar": "Daftar Galeri",
  "galeri-kategori": "Kategori",
  "berita-teks": "Teks Halaman",
  "berita-gambar": "Gambar Halaman",
  "berita-daftar": "Daftar Berita",
  "berita-kategori": "Kategori",
  "berita-iklan": "Iklan",
  "kajian-teks": "Teks Halaman",
  "kajian-gambar": "Gambar Halaman",
  "kajian-terdekat": "Kajian Terdekat",
  "kajian-rutin": "Kajian Rutin",
  "artikel-teks": "Teks Halaman",
  "artikel-gambar": "Gambar Halaman",
  "artikel-daftar": "Daftar Artikel",
  "artikel-kategori": "Kategori",
  "kontak-teks": "Teks Halaman",
  "kontak-gambar": "Gambar Halaman",
  "kontak-alamat": "Alamat",
  "kontak-layanan": "Layanan Informasi",
  "kontak-formulir": "Formulir",
  "pengumuman-daftar": "Daftar Pengumuman",
  "pengumuman-kategori": "Kategori",
  "agenda-daftar": "Daftar Agenda",
  "agenda-kategori": "Kategori",
  "beranda-carousel": "Carousel",
  "beranda-grid": "Susunan Grid Menu",
  "beranda-nav": "Susunan Navigasi",
  "beranda-footer": "Footer",
  unit: "Admin Unit",
  "unit-zis": "Admin ZIS",
};

export default function HalamanAdmin({
  onKeluar,
  onLihatSitus,
}: {
  /** Keluar dari panel: sesi dibersihkan dan panel kembali ke layar masuk. */
  onKeluar?: () => void;
  /** Membuka situs publik dari panel. */
  onLihatSitus?: () => void;
}) {
  const { identitas } = useProfil();
  const { token, masuk: sudahMasuk } = useSesiAdmin();
  const [memeriksa, setMemeriksa] = useState(false);
  const [terbuka, setTerbuka] = useState(false);
  const [akun, setAkun] = useState(false);
  /* Borang ganti PIN panel admin. */
  const [pinBuka, setPinBuka] = useState(false);
  const [pinLama, setPinLama] = useState("");
  const [pinBaru, setPinBaru] = useState("");
  const [pinUlang, setPinUlang] = useState("");
  const [pinSibuk, setPinSibuk] = useState(false);
  const [pinPesan, setPinPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);
  const [menu, setMenu] = useState<IdMenu>("dashboard");
  const [kelompokBuka, setKelompokBuka] = useState<Record<string, boolean>>({});

  /* Token lama diperiksa sekali saat panel dibuka; bila sudah berakhir, keluar. */
  useEffect(() => {
    if (!token) return;
    let batal = false;
    setMemeriksa(true);
    fetch("/api/admin/saya", { headers: { "x-sesi-admin": token, Accept: "application/json" } })
      .then((jawab) => jawab.json().catch(() => ({})))
      .then((isi: { masuk?: boolean }) => {
        if (!batal && isi.masuk === false) hapusToken();
      })
      .catch(() => {
        /* jaringan bermasalah: sesi dibiarkan, permintaan berikutnya yang memutuskan */
      })
      .finally(() => {
        if (!batal) setMemeriksa(false);
      });
    return () => {
      batal = true;
    };
  }, [token]);

  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTerbuka(false);
        setAkun(false);
      }
    };
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, []);

  const pilihMenu = (id: IdMenu) => {
    setMenu(id);
    setTerbuka(false);
  };

  /* Saat halaman dibuka dan menunya ada di dalam kelompok, kelompoknya dibuka. */
  useEffect(() => {
    const kelompok = KELOMPOK.find((k) => k.item.some((m) => m.id === menu));
    if (kelompok) setKelompokBuka((v) => (v[kelompok.id] ? v : { ...v, [kelompok.id]: true }));
  }, [menu]);

  if (!sudahMasuk) return <MasukAdmin />;

  if (memeriksa) {
    return (
      <main data-testid="admin-memeriksa" className="grid min-h-dvh place-items-center bg-persis-900 text-white">
        <p className="text-[12px] font-semibold text-white/80">Memeriksa sesi…</p>
      </main>
    );
  }

  return (
    <main data-testid="admin-page" className="min-h-dvh bg-cream-50 pb-10">
      <WadahNotifikasi />
      {/* Kepala panel admin: tombol menu di kiri, judul panel di tengah, logo di kanan. */}
      <header data-testid="admin-header" className="sticky top-0 z-30 bg-persis-900 text-white">
        <div className="mx-auto flex w-full max-w-[620px] items-center gap-3 px-4 py-3">
          <button
            type="button"
            data-testid="admin-hamburger"
            aria-label="Buka menu admin"
            aria-expanded={terbuka}
            aria-controls="admin-drawer"
            onClick={() => {
              setAkun(false);
              setTerbuka((v) => !v);
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.12] transition active:scale-95"
          >
            <Icon name="menu" className="h-[19px] w-[19px]" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-[9px] font-semibold tracking-[0.18em] text-gold-300 uppercase">Panel Admin</p>
            <p className="mt-0.5 truncate text-[12.5px] leading-tight font-bold">{JUDUL[menu]}</p>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              data-testid="admin-akun"
              aria-label="Menu akun admin"
              aria-haspopup="menu"
              aria-expanded={akun}
              aria-controls="admin-menu-akun"
              onClick={() => {
                setTerbuka(false);
                setAkun((v) => !v);
              }}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.12] transition active:scale-95"
            >
              <img src={identitas.logo} alt="" className="h-[26px] w-[26px] object-contain" draggable={false} />
            </button>

            {akun ? (
              <div
                id="admin-menu-akun"
                data-testid="admin-menu-akun"
                role="menu"
                aria-label="Menu akun"
                className="fade-in absolute top-[calc(100%+10px)] right-0 w-[210px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white text-left shadow-[0_22px_48px_-22px_rgba(7,51,39,0.6)]"
              >
                <div className="flex items-center gap-2.5 border-b border-black/[0.07] px-3.5 py-3">
                  <img src={identitas.logo} alt="" className="h-8 w-8 shrink-0 object-contain" draggable={false} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold tracking-[0.14em] text-gold-600 uppercase">Panel Admin</p>
                    <p className="truncate text-[11px] leading-tight font-semibold text-ink-900">
                      {identitas.namaLengkap}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="admin-lihat-situs"
                  onClick={() => {
                    setAkun(false);
                    setTerbuka(false);
                    onLihatSitus?.();
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-[11.5px] font-semibold text-persis-900 transition hover:bg-cream-50 active:bg-cream-100"
                >
                  <Icon name="eye" className="h-[17px] w-[17px] text-gold-600" />
                  Lihat situs
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="admin-ubah-pin"
                  onClick={() => {
                    setAkun(false);
                    setTerbuka(false);
                    setPinPesan(null);
                    setPinBuka(true);
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-black/[0.07] px-3.5 py-3 text-left text-[11.5px] font-semibold text-persis-900 transition hover:bg-cream-50 active:bg-cream-100"
                >
                  <Icon name="shield" className="h-[17px] w-[17px] text-gold-600" />
                  Ubah PIN panel
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="admin-keluar"
                  onClick={() => {
                    setAkun(false);
                    setTerbuka(false);
                    void keluar().finally(() => onKeluar?.());
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-black/[0.07] px-3.5 py-3 text-left text-[11.5px] font-semibold text-persis-900 transition hover:bg-cream-50 active:bg-cream-100"
                >
                  <Icon name="log-out" className="h-[17px] w-[17px] text-gold-600" />
                  Keluar dari panel
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {akun ? (
        <button
          type="button"
          aria-label="Tutup menu akun"
          data-testid="admin-akun-latar"
          onClick={() => setAkun(false)}
          className="fixed inset-0 z-20 cursor-default"
        />
      ) : null}

      {/* Laci menu dari kiri. */}
      {terbuka ? (
        <button
          type="button"
          aria-label="Tutup menu admin"
          data-testid="admin-drawer-latar"
          onClick={() => setTerbuka(false)}
          className="fixed inset-0 z-40 cursor-default bg-persis-950/60"
        />
      ) : null}
      <aside
        id="admin-drawer"
        data-testid="admin-drawer"
        aria-label="Menu admin"
        aria-hidden={!terbuka}
        inert={!terbuka}
        className={`fixed inset-y-0 left-0 z-50 flex w-[80%] max-w-[310px] flex-col bg-persis-900 text-white shadow-[0_24px_60px_-20px_rgba(7,51,39,0.8)] transition-transform duration-300 ease-out ${
          terbuka ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.12] px-4 py-3.5">
          <img src={identitas.logo} alt="" className="h-9 w-9 object-contain" draggable={false} />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold tracking-[0.18em] text-gold-300 uppercase">Menu</p>
            <p className="truncate text-[12px] font-bold">Panel Admin</p>
          </div>
          <button
            type="button"
            data-testid="admin-drawer-tutup"
            aria-label="Tutup menu"
            onClick={() => setTerbuka(false)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.12] transition active:scale-95"
          >
            <Icon name="x" className="h-[17px] w-[17px]" />
          </button>
        </div>

        <nav aria-label="Menu panel admin" className="flex-1 overflow-y-auto px-3 py-3">
          <button
            type="button"
            data-testid="menu-dashboard"
            onClick={() => pilihMenu("dashboard")}
            aria-current={menu === "dashboard" ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-semibold transition ${
              menu === "dashboard" ? "bg-white text-persis-900" : "text-white/85 hover:bg-white/[0.08]"
            }`}
          >
            <Icon name="home" className="h-[17px] w-[17px] shrink-0" />
            Dashboard
          </button>

          {SEKSI.map((seksi) => (
            <div key={seksi.id} className="mt-3.5 first:mt-2">
              <p
                data-testid={`seksi-${seksi.id}`}
                className="px-3 pb-1.5 text-[9px] font-bold tracking-[0.16em] text-gold-300/80 uppercase"
              >
                {seksi.label}
              </p>

              {seksi.isi.map((id) => {
                const tunggal = MENU_TUNGGAL.find((m) => m.id === id);
                if (tunggal) {
                  return (
                    <button
                      key={id}
                      type="button"
                      data-testid={`menu-${tunggal.id}`}
                      onClick={() => pilihMenu(tunggal.id as IdMenu)}
                      aria-current={menu === tunggal.id ? "page" : undefined}
                      className={`mt-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-semibold transition ${
                        menu === tunggal.id ? "bg-white text-persis-900" : "text-white/85 hover:bg-white/[0.08]"
                      }`}
                    >
                      <Icon name={tunggal.ikon} className="h-[17px] w-[17px] shrink-0" />
                      <span className="flex-1">{tunggal.label}</span>
                    </button>
                  );
                }

                const k = KELOMPOK.find((g) => g.id === id);
                if (!k) return null;
                const buka = kelompokBuka[k.id] ?? false;
                const aktif = k.item.some((m) => m.id === menu);
                return (
                  <div key={k.id}>
                    <button
                      type="button"
                      data-testid={`menu-${k.id}`}
                      aria-expanded={buka}
                      aria-controls={`submenu-${k.id}`}
                      onClick={() => setKelompokBuka((v) => ({ ...v, [k.id]: !buka }))}
                      className={`mt-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-semibold transition ${
                        aktif || buka ? "bg-white/[0.14] text-white" : "text-white/85 hover:bg-white/[0.08]"
                      }`}
                    >
                      <Icon name={k.ikon} className="h-[17px] w-[17px] shrink-0" />
                      <span className="flex-1">{k.label}</span>
                      <Icon
                        name="chevron"
                        className="h-[15px] w-[15px] shrink-0 transition-transform"
                        style={{ transform: buka ? "rotate(90deg)" : undefined }}
                      />
                    </button>

                    {buka ? (
                      <ul id={`submenu-${k.id}`} data-testid={`submenu-${k.id}`} className="mt-1 space-y-1 pl-3">
                        {k.item.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              data-testid={`menu-${m.id}`}
                              onClick={() => pilihMenu(m.id as IdMenu)}
                              aria-current={menu === m.id ? "page" : undefined}
                              className={`flex w-full items-center gap-2.5 rounded-xl border-l-2 px-3 py-2 text-left text-[11.5px] font-medium transition ${
                                menu === m.id
                                  ? "border-l-gold-400 bg-white text-persis-900"
                                  : "border-l-white/20 text-white/75 hover:bg-white/[0.08]"
                              }`}
                            >
                              <Icon name={m.ikon} className="h-[14px] w-[14px] shrink-0" />
                              {m.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <p className="border-t border-white/[0.12] px-4 py-3 text-[9.5px] tracking-wide text-white/50 uppercase">
          {identitas.namaLengkap}
        </p>
      </aside>

      <div className="mx-auto w-full max-w-[620px] px-5 pt-2 pb-4">
        {menu === "dashboard" ? <Dashboard /> : null}
        {menu === "identitas-nama" ? <NamaLembaga /> : null}
        {menu === "identitas-logo" ? <LogoLembaga /> : null}
        {menu === "identitas-profil" ? <ProfilSingkat /> : null}
        {menu === "identitas-semboyan" ? <Semboyan /> : null}
        {menu === "identitas-visi" ? <Visi /> : null}
        {menu === "identitas-misi" ? <Misi /> : null}
        {menu === "identitas-pengurus" ? <Pengurus /> : null}
        {menu === "identitas-layanan" ? <LayananJamaah /> : null}
        {menu === "jenjang-teks" ? <TeksHalamanJenjang /> : null}
        {menu === "jenjang-gambar" ? <GambarHalamanJenjang /> : null}
        {menu === "jenjang-nama" ? <NamaJenjang /> : null}
        {menu === "sekolah-nama" ? <NamaSekolah /> : null}
        {menu === "sekolah-jurusan" ? <ProgramJurusan /> : null}
        {menu === "tahun-ajaran" ? <DaftarTahunAjaran /> : null}
        {menu === "spmb-teks" ? <TeksHalamanSpmb /> : null}
        {menu === "spmb-gambar" ? <GambarHalamanSpmb /> : null}
        {menu === "spmb-gelombang" ? <GelombangSpmb /> : null}
        {menu === "spmb-biaya" ? <BiayaSpmb /> : null}
        {menu === "spmb-formulir" ? <FormulirSpmb /> : null}
        {menu === "spmb-layanan" ? <LayananSpmb /> : null}
        {menu === "galeri-teks" ? <TeksHalamanGaleri /> : null}
        {menu === "galeri-gambar" ? <GambarHalamanGaleri /> : null}
        {menu === "galeri-daftar" ? <DaftarGaleri /> : null}
        {menu === "galeri-kategori" ? <KategoriGaleri /> : null}
        {menu === "berita-teks" ? <TeksHalamanBerita /> : null}
        {menu === "berita-gambar" ? <GambarHalamanBerita /> : null}
        {menu === "berita-daftar" ? <DaftarBerita /> : null}
        {menu === "berita-kategori" ? <KategoriBerita /> : null}
        {menu === "berita-iklan" ? <IklanBerita /> : null}
        {menu === "kajian-teks" ? <TeksHalamanKajian /> : null}
        {menu === "kajian-gambar" ? <GambarHalamanKajian /> : null}
        {menu === "kajian-terdekat" ? <JadwalKajianTerdekat /> : null}
        {menu === "kajian-rutin" ? <KajianRutinPekanan /> : null}
        {menu === "artikel-teks" ? <TeksHalamanArtikel /> : null}
        {menu === "artikel-gambar" ? <GambarHalamanArtikel /> : null}
        {menu === "artikel-daftar" ? <DaftarArtikel /> : null}
        {menu === "artikel-kategori" ? <KategoriArtikel /> : null}
        {menu === "kontak-teks" ? <TeksHalamanKontak /> : null}
        {menu === "kontak-gambar" ? <GambarHalamanKontak /> : null}
        {menu === "kontak-alamat" ? <AlamatKontak /> : null}
        {menu === "kontak-layanan" ? <LayananInformasiKontak /> : null}
        {menu === "kontak-formulir" ? <FormulirKontak /> : null}
        {menu === "pengumuman-daftar" ? <DaftarPengumuman /> : null}
        {menu === "pengumuman-kategori" ? <KategoriPengumuman /> : null}
        {menu === "agenda-daftar" ? <DaftarAgenda /> : null}
        {menu === "agenda-kategori" ? <KategoriAgenda /> : null}
        {menu === "beranda-carousel" ? <Carousel /> : null}
        {menu === "beranda-grid" ? <SusunanGridMenu /> : null}
        {menu === "beranda-nav" ? <SusunanNavigasi /> : null}
        {menu === "beranda-footer" ? <FooterBeranda /> : null}
        {menu === "unit" ? <AdminUnit /> : null}
        {menu === "unit-zis" ? <AdminZis /> : null}
      </div>

      {pinBuka ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Ubah PIN panel admin"
          data-testid="form-pin-admin"
        >
          <button
            type="button"
            aria-label="Tutup"
            data-testid="form-pin-tutup"
            onClick={() => setPinBuka(false)}
            className="absolute inset-0 cursor-default bg-ink-900/50 backdrop-blur-[2px]"
          />
          <div className="popup-panel relative w-full max-w-[420px] rounded-t-3xl bg-cream-50 p-5 shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.5)]">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-gold-400/35 bg-cream-100 text-gold-600">
                <Icon name="shield" className="h-[19px] w-[19px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold tracking-[0.18em] text-gold-600 uppercase">Keamanan Panel</p>
                <h2 className="font-header text-[14.5px] leading-snug font-bold text-ink-900">Ubah PIN panel admin</h2>
                <p className="mt-1 text-justify text-[10.5px] leading-relaxed text-ink-600">
                  PIN ini yang dipakai untuk masuk ke panel admin. Ganti PIN bawaan dengan PIN pribadi 4–8 angka, dan
                  jangan bagikan kepada siapa pun. Setelah diganti, sesi di perangkat lain otomatis ditutup.
                </p>
              </div>
            </div>

            <div className="mt-3.5 space-y-3">
              <label className="block">
                <span className="field-label">PIN lama</span>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  data-testid="pin-lama"
                  value={pinLama}
                  onChange={(e) => setPinLama(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
                  className="w-full rounded-xl border border-black/[0.12] bg-white px-3.5 py-2.5 text-[13px] tracking-[0.3em] text-ink-900"
                  placeholder="••••"
                />
              </label>
              <label className="block">
                <span className="field-label">PIN baru (4–8 angka)</span>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  data-testid="pin-baru"
                  value={pinBaru}
                  onChange={(e) => setPinBaru(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
                  className="w-full rounded-xl border border-black/[0.12] bg-white px-3.5 py-2.5 text-[13px] tracking-[0.3em] text-ink-900"
                  placeholder="••••"
                />
              </label>
              <label className="block">
                <span className="field-label">Ulangi PIN baru</span>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  data-testid="pin-ulang"
                  value={pinUlang}
                  onChange={(e) => setPinUlang(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
                  className="w-full rounded-xl border border-black/[0.12] bg-white px-3.5 py-2.5 text-[13px] tracking-[0.3em] text-ink-900"
                  placeholder="••••"
                />
              </label>
            </div>

            {pinPesan ? (
              <p
                data-testid="pin-pesan"
                className={`mt-3 rounded-xl border px-3 py-2.5 text-justify text-[10.5px] leading-relaxed ${
                  pinPesan.tipe === "sukses"
                    ? "border-persis-900/20 bg-persis-50 text-persis-900"
                    : "border-rose-300/60 bg-rose-50 text-rose-800"
                }`}
              >
                {pinPesan.teks}
              </p>
            ) : null}

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                data-testid="pin-simpan"
                disabled={pinSibuk}
                onClick={() => {
                  setPinPesan(null);
                  if (!/^\d{4,8}$/.test(pinLama)) return setPinPesan({ tipe: "galat", teks: "PIN lama 4 sampai 8 angka." });
                  if (!/^\d{4,8}$/.test(pinBaru)) return setPinPesan({ tipe: "galat", teks: "PIN baru harus 4 sampai 8 angka." });
                  if (pinBaru !== pinUlang) return setPinPesan({ tipe: "galat", teks: "Ulangi PIN baru dengan tepat." });
                  setPinSibuk(true);
                  void gantiPinAdmin(pinLama, pinBaru, pinUlang)
                    .then((teks) => {
                      setPinPesan({ tipe: "sukses", teks });
                      setPinLama("");
                      setPinBaru("");
                      setPinUlang("");
                    })
                    .catch((e) => setPinPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "PIN tidak bisa diperbarui." }))
                    .finally(() => setPinSibuk(false));
                }}
                className="w-full rounded-full bg-persis-900 py-3 text-[12.5px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {pinSibuk ? "Menyimpan…" : "Simpan PIN baru"}
              </button>
              <button
                type="button"
                data-testid="pin-batal"
                onClick={() => setPinBuka(false)}
                className="w-full rounded-full border border-black/[0.12] bg-white py-3 text-[12px] font-semibold text-ink-600"
              >
                Nanti saja
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
