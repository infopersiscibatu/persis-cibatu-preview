import { useEffect, useRef, useState } from "react";
import BottomNav, { BottomNavWali, type TabId, type TabWali, type TabWaliIsi } from "./components/BottomNav";
import DialogIzinNotifikasi from "./components/DialogIzinNotifikasi";
import BannerPush from "./components/BannerPush";
import PopupInstall from "./components/PopupInstall";
import Header from "./components/Header";
import Beranda from "./pages/Beranda";
import HalamanArtikel from "./pages/Artikel";
import { HalamanArtikelDetail } from "./pages/ArtikelDetail";
import HalamanBerita from "./pages/Berita";
import Profil from "./pages/Profil";
import { HalamanJenjang, HalamanJenjangDetail } from "./pages/Jenjang";
import { HalamanGaleri } from "./pages/Galeri";
import { HalamanBeritaDetail } from "./pages/BeritaDetail";
import { HalamanSekolah } from "./pages/Sekolah";
import { HalamanSpmb } from "./pages/Spmb";
import { HalamanKajian } from "./pages/Kajian";
import { HalamanKontak } from "./pages/Kontak";
import { HalamanDonasi } from "./pages/Donasi";
import { HalamanDonasiDetail } from "./pages/DonasiDetail";
import HalamanWali, { type WaliTab } from "./pages/Wali";
import HalamanWaliBayar from "./pages/WaliBayar";
import HalamanAdmin from "./pages/Admin";
import HalamanUnitSpmb from "./pages/UnitSpmb";
import HalamanUnitSekolah from "./pages/UnitSekolah";
import HalamanUnitTataUsaha from "./pages/UnitTataUsaha";
import HalamanUnitZis from "./pages/UnitZis";
import { jenjangDariUnit, unitSaatIni } from "./lib/jenjang";
import { type Berita , type Notifikasi } from "./data/content";
import { useNotifikasi } from "./lib/useNotifikasi";
import { navTampil, useBeranda } from "./lib/beranda";
import { useProfil } from "./lib/profil";
import LayarMuat from "./components/LayarMuat";
import { aktifkanPush, daftarkanServiceWorker, laporPostinganTerbaru } from "./lib/push";

type HalamanId =
  | TabId
  | "profil"
  | "jenjang"
  | "jenjang-detail"
  | "sekolah"
  | "kajian"
  | "artikel-detail"
  | "donasi-detail"
  | "wali"
  | "wali-bayar"
  | "admin"
  | "admin-spmb"
  | "admin-sekolah"
  | "admin-tata-usaha"
  | "admin-zis"
  | "galeri"
  | "kontak"
  | "berita-detail";

/** Nama halaman pada alamat (#/...) agar tombol kembali di HP bekerja. */
const ALIAS_HASH: Record<string, HalamanId> = { spmb: "ppdb", beranda: "beranda" };

type RuteApp = { halaman: HalamanId; slug: string | null };

/** Alamat untuk sebuah halaman: #/jenjang/mi atau #/jenjang/mi/mi-01-cibatu. */
function hashHalaman(halaman: string, slug: string | null): string {
  if (halaman === "jenjang-detail" && slug) return `#/jenjang/${slug}`;
  if (halaman === "berita-detail" && slug) return `#/berita/${slug}`;
  if (halaman === "artikel-detail" && slug) return `#/artikel/${slug}`;
  if (halaman === "donasi-detail" && slug) return `#/info/${slug}`;
  if (halaman === "galeri" && slug) return `#/galeri/${slug}`;
  if (halaman === "beranda") {
    if (slug && slug.startsWith("pengumuman:")) return `#/beranda/pengumuman/${slug.slice("pengumuman:".length)}`;
    if (slug && slug.startsWith("agenda:")) return `#/beranda/agenda/${slug.slice("agenda:".length)}`;
    return "#/beranda";
  }
  if (halaman === "kajian") return slug ? `#/kajian/${slug}` : "#/kajian";
  if (halaman.startsWith("admin-")) return `#/admin/${halaman.slice("admin-".length)}`;
  if (halaman === "wali-bayar") return "#/wali/bayar";
  if (halaman === "wali") return !slug || slug === "profil" ? "#/wali" : `#/wali/${slug}`;
  if (halaman === "sekolah" && slug) {
    const j = jenjangDariUnit(slug)?.slug;
    return j ? `#/jenjang/${j}/${slug}` : `#/sekolah/${slug}`;
  }
  return `#/${halaman}`;
}

/** Pecah alamat (#/berita/x, /#/beranda/pengumuman/an-1, atau tautan penuh). */
function bagianAlamat(alamat: string): string[] {
  const isi = alamat.includes("#") ? alamat.slice(alamat.indexOf("#") + 1) : alamat;
  return isi.replace(/^\/+/, "").split("/").filter(Boolean);
}

/** Baca halaman dari sebuah alamat (#/...). */
function ruteDariAlamat(alamat: string): RuteApp {
  const bagian = bagianAlamat(alamat);
  const nama = ALIAS_HASH[bagian[0] ?? ""] ?? bagian[0];
  if (!nama) return { halaman: "beranda", slug: null };
  if (nama === "berita" && bagian[1]) return { halaman: "berita-detail", slug: bagian[1] };
  if (nama === "artikel" && bagian[1]) return { halaman: "artikel-detail", slug: bagian[1] };
  if (nama === "info" && bagian[1]) return { halaman: "donasi-detail", slug: bagian[1] };
  if (nama === "galeri" && bagian[1]) return { halaman: "galeri", slug: bagian[1] };
  if (nama === "wali") {
    if (bagian[1] === "bayar") return { halaman: "wali-bayar", slug: null };
    const menu: WaliTab = bagian[1] === "nilai" || bagian[1] === "tagihan" || bagian[1] === "tahfidz" ? bagian[1] : "profil";
    return { halaman: "wali", slug: menu };
  }
  /* Halaman unit sekolah: #/admin/spmb, #/admin/sekolah, #/admin/tata-usaha. */
  if (nama === "admin" && bagian[1]) return { halaman: `admin-${bagian[1]}` as HalamanId, slug: null };
  if (nama === "jenjang" && bagian[2]) return { halaman: "sekolah", slug: bagian[2] };
  if (nama === "sekolah" && bagian[1]) return { halaman: "sekolah", slug: bagian[1] };
  if (nama === "jenjang" && bagian[1]) return { halaman: "jenjang-detail", slug: bagian[1] };
  /* Kajian dengan sasaran tertentu: jadwal yang dibuka. */
  if (nama === "kajian" && bagian[1]) return { halaman: "kajian", slug: bagian[1] };
  /* Beranda dengan sasaran tertentu: pengumuman atau agenda yang dibuka. */
  if (nama === "beranda" && (bagian[1] === "pengumuman" || bagian[1] === "agenda") && bagian[2]) {
    return { halaman: "beranda", slug: `${bagian[1]}:${bagian[2]}` };
  }
  return { halaman: nama as HalamanId, slug: null };
}

/** Baca halaman dari alamat yang sedang dibuka. */
function ruteDariHash(): RuteApp {
  return ruteDariAlamat(window.location.hash);
}

export default function App() {
  const [tab, setTab] = useState<HalamanId>("beranda");
  const [slug, setSlug] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { belumDibaca, tandai, munculkanLagi } = useNotifikasi();
  const profil = useProfil();
  /* Susunan menu bawah disusun dari panel admin (lihat menu Beranda → Navigasi). */
  const beranda = useBeranda();
  /* Layar logo + "Memuat Data" tampil sampai profil DAN data beranda (statistik,
     carousel, grid menu) benar-benar tiba dari database, agar kartu statistik
     tidak sempat menampilkan angka contoh. */
  const dataSiap = profil.dariDatabase && beranda.dariDatabase;
  const [memuat, setMemuat] = useState(!dataSiap);
  const mulaiMuat = useRef(Date.now());
  const pindahRef = useRef<(t: string, s?: string) => void>(() => {});

  /* Keadaan terbaru untuk pendengar tombol kembali. */
  const keadaan = useRef({ tab: "beranda" as HalamanId, slug: null as string | null, popup: false });
  keadaan.current = { tab, slug, popup: false };

  /* Data sudah tiba: layar pembuka ditutup, tetapi tidak sekejap mata. */
  useEffect(() => {
    if (!dataSiap) return;
    const sisa = Math.max(0, 450 - (Date.now() - mulaiMuat.current));
    const tutup = setTimeout(() => setMemuat(false), sisa);
    return () => clearTimeout(tutup);
  }, [dataSiap]);

  /* Jaringan lambat atau layanan tidak menjawab: layar pembuka tidak menahan pengunjung. */
  useEffect(() => {
    const jaga = setTimeout(() => setMemuat(false), 3200);
    return () => clearTimeout(jaga);
  }, []);

  useEffect(() => {
    const pantau = () => setScrolled(window.scrollY > 4);
    pantau();
    window.addEventListener("scroll", pantau, { passive: true });
    return () => window.removeEventListener("scroll", pantau);
  }, []);

  /* Bagian pertama riwayat disamakan dengan alamat awal, lalu setiap
     perpindahan halaman menambah satu riwayat agar tombol kembali di HP
     mengembalikan ke halaman sebelumnya. */
  useEffect(() => {
    const awal = ruteDariHash();
    setTab(awal.halaman);
    setSlug(awal.slug);
    window.history.replaceState(awal, "", hashHalaman(awal.halaman, awal.slug));

    const saatKembali = (e: PopStateEvent) => {
      const tersimpan = e.state as RuteApp | null;
      /* Lapisan jendela (riwayat tanpa halaman) ditangani komponennya sendiri. */
      if (tersimpan && !tersimpan.halaman) return;
      const rute = tersimpan ?? ruteDariHash();
      setTab(rute.halaman);
      setSlug(rute.slug ?? null);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", saatKembali);
    return () => window.removeEventListener("popstate", saatKembali);
  }, []);

  const pindah = (t: string, s?: string) => {
    const halaman = t as HalamanId;
    const tujuanSlug = s ?? null;
    if (halaman === tab && tujuanSlug === slug) return;
    const rute: RuteApp = { halaman, slug: tujuanSlug };
    window.history.pushState(rute, "", hashHalaman(halaman, tujuanSlug));
    setTab(halaman);
    setSlug(tujuanSlug);
    window.scrollTo({ top: 0 });
  };

  /* Ketukan pada notifikasi (layar HP atau ikon lonceng) langsung menuju
     postingannya. */
  const bukaTautan = (tautan?: string) => {
    const rute = ruteDariAlamat(tautan ?? "/#/beranda");
    pindahRef.current(rute.halaman, rute.slug ?? undefined);
  };

  /* Ketukan pada notifikasi layar HP memakai fungsi pindah versi terbaru. */
  pindahRef.current = pindah;

  /* Notifikasi push: siapkan service worker, daftarkan perangkat ini bila izin
     sudah ada, lalu laporkan postingan terbaru supaya notifikasi otomatis
     terkirim ketika ada berita/artikel/pengumuman baru. */
  useEffect(() => {
    void (async () => {
      await daftarkanServiceWorker();
      if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
        await aktifkanPush();
      }
      /* Laporan postingan terbaru: begitu ada berita/artikel/pengumuman baru,
         layanan push mengirimkannya ke semua perangkat yang sudah mendaftar. */
      void laporPostinganTerbaru();
    })();
  }, []);

  /* Halaman berita detail tetap menyalakan menu "Berita" di bawah, seperti rujukan.
     Daftar menu bawah sendiri disusun dari panel admin. */
  const tabBawah = navTampil(beranda);
  /* Panel admin dan halaman unit tampil tanpa kepala, footer, dan menu bawah situs. */
  const panel = tab === "admin" || tab.startsWith("admin-");
  const tabAktif: string | null =
    tab === "berita-detail"
      ? "berita"
      : tab === "artikel-detail"
        ? "artikel"
        : tab === "donasi-detail"
          ? "info"
          : tabBawah.some((t) => t.halaman === tab)
            ? tab
            : null;

  return (
    <div className={`min-h-dvh bg-page ${panel ? "" : "pb-[64px]"}`}>
      <DialogIzinNotifikasi />
      <BannerPush />
      <PopupInstall />

      {/* Panel admin tampil tanpa kepala situs pengunjung. */}
      {panel ? null : (
        <Header
          scrolled={scrolled}
          onBeranda={() => pindah("beranda")}
          onBukaPost={(n: Notifikasi) => bukaTautan(n.tautan)}
          notifikasiBelumDibaca={belumDibaca}
          jumlahBelumDibaca={belumDibaca.length}
          onTandai={tandai}
          onMunculkanLagi={() => munculkanLagi()}
        />
      )}

      {tab === "beranda" ? (
        <Beranda
          onPilihMenu={pindah}
          onBukaBerita={(b: Berita) => pindah("berita-detail", b.slug)}
          pengumumanBuka={slug?.startsWith("pengumuman:") ? slug.slice("pengumuman:".length) : null}
          agendaBuka={slug?.startsWith("agenda:") ? slug.slice("agenda:".length) : null}
        />
      ) : null}
      {tab === "berita-detail" && slug ? (
        <HalamanBeritaDetail
          slug={slug}
          onBuka={(s) => pindah("berita-detail", s)}
          onKembali={() => pindah("berita")}
        />
      ) : null}
      {tab === "berita" ? <HalamanBerita onBuka={(s) => pindah("berita-detail", s)} /> : null}
      {tab === "artikel" ? <HalamanArtikel onBuka={(s) => pindah("artikel-detail", s)} /> : null}
      {tab === "artikel-detail" && slug ? (
        <HalamanArtikelDetail slug={slug} onBuka={(s) => pindah("artikel-detail", s)} onKembali={() => pindah("artikel")} />
      ) : null}
      {tab === "profil" ? <Profil /> : null}
      {tab === "jenjang" ? <HalamanJenjang onBuka={(s) => pindah("jenjang-detail", s)} /> : null}
      {tab === "jenjang-detail" && slug ? (
        <HalamanJenjangDetail
          slug={slug}
          onBukaJenjang={(s) => pindah("jenjang-detail", s)}
          onBukaUnit={(s) => pindah("sekolah", s)}
        />
      ) : null}
      {tab === "sekolah" && slug ? (
        <HalamanSekolah
          jenjangSlug={unitSaatIni(slug)?.jenjangSlug ?? ""}
          slug={slug}
          onBukaUnit={(s) => pindah("sekolah", s)}
        />
      ) : null}
      {tab === "ppdb" ? <HalamanSpmb /> : null}
      {tab === "galeri" ? <HalamanGaleri sasaran={slug} /> : null}
      {tab === "kontak" ? <HalamanKontak /> : null}
      {tab === "kajian" ? <HalamanKajian sasaran={slug} /> : null}
      {tab === "info" ? <HalamanDonasi onOpen={(s) => pindah("donasi-detail", s)} /> : null}
      {tab === "wali" ? (
        <HalamanWali tab={(slug as WaliTab) ?? "profil"} onBayar={() => pindah("wali-bayar")} />
      ) : null}
      {tab === "wali-bayar" ? <HalamanWaliBayar onKembali={() => pindah("wali")} /> : null}
      {/*
        Keluar dari panel tidak memindahkan halaman: alamatnya tetap dan panel itu sendiri
        kembali menampilkan layar masuk (PIN unit atau surel pengurus). Yang menuju situs
        publik hanya tombol "Lihat situs".
      */}
      {tab === "admin" ? <HalamanAdmin onLihatSitus={() => pindah("beranda")} /> : null}
      {tab === "admin-spmb" ? <HalamanUnitSpmb onLihatSitus={() => pindah("beranda")} /> : null}
      {tab === "admin-sekolah" ? <HalamanUnitSekolah onLihatSitus={() => pindah("beranda")} /> : null}
      {tab === "admin-tata-usaha" ? <HalamanUnitTataUsaha onLihatSitus={() => pindah("beranda")} /> : null}
      {tab === "admin-zis" ? <HalamanUnitZis onLihatSitus={() => pindah("beranda")} /> : null}
      {tab === "donasi-detail" && slug ? (
        <HalamanDonasiDetail
          slug={slug}
          onBuka={(s) => pindah("donasi-detail", s)}
          onKembali={() => pindah("info")}
        />
      ) : null}

      {panel ? null : tab === "wali" || tab === "wali-bayar" ? (
        <BottomNavWali
          active={tab === "wali-bayar" ? "tagihan" : ((slug as TabWali) ?? "profil")}
          onPilih={(t: TabWaliIsi) => pindah("wali", t)}
          onBeranda={() => pindah("beranda")}
        />
      ) : (
        <BottomNav active={tabAktif} onChange={pindah} />
      )}

      {memuat ? <LayarMuat /> : null}
    </div>
  );
}
