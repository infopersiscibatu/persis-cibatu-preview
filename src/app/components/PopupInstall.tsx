import { useEffect, useState } from "react";
import { useProfil } from "../lib/profil";

/**
 * Popup ajakan memasang aplikasi PERSIS Cibatu ke layar utama HP.
 *
 * Muncul sekali saat pengunjung baru membuka situs, hanya bila browser
 * mendukung pemasangan PWA (event beforeinstallprompt) dan aplikasi belum
 * terpasang. Pilihan pengunjung diingat: bila ditutup, popup tidak muncul
 * lagi selama 7 hari; bila sudah terpasang, tidak pernah muncul lagi.
 *
 * Tidak ada layar loading tambahan: popup ini tampil di atas halaman yang
 * sudah selesai dimuat, bukan sebelumnya.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const KUNCI_SIMPAN = "persis-popup-install";
const TUNGGU_HARI = 7;

function bacaTanda(): { tutup: number } | null {
  try {
    const mentah = localStorage.getItem(KUNCI_SIMPAN);
    return mentah ? JSON.parse(mentah) : null;
  } catch {
    return null;
  }
}

function tulisTanda() {
  try {
    localStorage.setItem(KUNCI_SIMPAN, JSON.stringify({ tutup: Date.now() }));
  } catch {
    /* penyimpanan penuh/ditolak: popup cukup tampil sekali per sesi */
  }
}

export default function PopupInstall() {
  const { identitas } = useProfil();
  const [ajakan, setAjakan] = useState<BeforeInstallPromptEvent | null>(null);
  const [tampil, setTampil] = useState(false);

  useEffect(() => {
    /* Sudah terpasang sebagai aplikasi: tidak perlu menawarkan lagi. */
    const cocok = window.matchMedia("(display-mode: standalone)").matches;
    const iosSudahPasang = (navigator as { standalone?: boolean }).standalone === true;
    if (cocok || iosSudahPasang) return;

    /* Pengunjung menutup popup belum lama ini: beri jeda beberapa hari. */
    const tanda = bacaTanda();
    if (tanda && Date.now() - tanda.tutup < TUNGGU_HARI * 24 * 60 * 60 * 1000) return;

    const saatSiap = (e: Event) => {
      e.preventDefault();
      setAjakan(e as BeforeInstallPromptEvent);
      setTampil(true);
    };
    window.addEventListener("beforeinstallprompt", saatSiap);
    return () => window.removeEventListener("beforeinstallprompt", saatSiap);
  }, []);

  if (!tampil || !ajakan) return null;

  const tutup = () => {
    tulisTanda();
    setTampil(false);
  };

  const pasang = async () => {
    try {
      await ajakan.prompt();
      const hasil = await ajakan.userChoice;
      if (hasil.outcome === "accepted") {
        setTampil(false);
        return;
      }
    } catch {
      /* pengunjung mengabaikan dialog browser */
    }
    tutup();
  };

  return (
    <div
      data-testid="popup-install"
      role="dialog"
      aria-modal="true"
      aria-label="Pasang aplikasi PERSIS Cibatu"
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-4 backdrop-blur-[2px] sm:items-center"
      onClick={tutup}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3.5">
          <img
            src={identitas.logo}
            alt={identitas.logoAlt}
            className="h-14 w-14 shrink-0 rounded-2xl bg-persis-900 object-contain p-1.5"
            draggable={false}
          />
          <div className="min-w-0">
            <p className="font-header text-[15px] leading-tight font-extrabold text-persis-900">
              Pasang Aplikasi PERSIS Cibatu
            </p>
            <p className="mt-1 text-justify text-[11px] leading-relaxed text-ink-600">
              Akses berita, agenda, SPMB, dan portal wali lebih cepat langsung dari layar utama HP Anda — tanpa
              membuka browser.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            data-testid="popup-install-nanti"
            onClick={tutup}
            className="flex-1 rounded-full border border-black/[0.1] py-2.5 text-[12px] font-semibold text-ink-600 transition active:scale-[0.98]"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            data-testid="popup-install-pasang"
            onClick={() => void pasang()}
            className="flex-1 rounded-full bg-persis-900 py-2.5 text-[12px] font-bold text-white transition active:scale-[0.98]"
          >
            Pasang Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
