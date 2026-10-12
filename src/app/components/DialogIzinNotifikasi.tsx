import { useEffect, useState } from "react";
import { Icon } from "./Icons";
import { aktifkanPush, ujiPush } from "../lib/push";

const KUNCI_SESI = "persis-cibatu-izin-notif-sesi";

const daftarManfaat = [
  { id: "berita", ikon: "newspaper", judul: "Berita & prestasi terbaru" },
  { id: "pengumuman", ikon: "megaphone", judul: "Pengumuman resmi lembaga" },
  { id: "agenda", ikon: "calendar", judul: "Agenda kegiatan mendatang" },
  { id: "kajian", ikon: "book-open", judul: "Jadwal kajian terdekat" },
];

type Keadaan = "tanya" | "aktif" | "ditolak" | "tidak-didukung";

function didukung(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function sudahTampilSesiIni(): boolean {
  try {
    return window.sessionStorage.getItem(KUNCI_SESI) === "1";
  } catch {
    return false;
  }
}

function tandaiSesi() {
  try {
    window.sessionStorage.setItem(KUNCI_SESI, "1");
  } catch {
    /* abaikan */
  }
}

export default function DialogIzinNotifikasi() {
  const [terbuka, setTerbuka] = useState(false);
  const [keadaan, setKeadaan] = useState<Keadaan>("tanya");
  const [pesan, setPesan] = useState("");
  const [memuat, setMemuat] = useState(false);

  useEffect(() => {
    if (sudahTampilSesiIni()) return;
    if (!didukung()) {
      setKeadaan("tidak-didukung");
    } else if (window.Notification.permission === "granted") {
      return;
    } else if (window.Notification.permission === "denied") {
      setKeadaan("ditolak");
    }
    const t = window.setTimeout(() => setTerbuka(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  const tutup = () => {
    tandaiSesi();
    setTerbuka(false);
  };

  const minta = async () => {
    if (!didukung()) {
      setKeadaan("tidak-didukung");
      return;
    }
    setMemuat(true);
    setPesan("");
    try {
      const hasil = await window.Notification.requestPermission();
      if (hasil === "granted") {
        setKeadaan("aktif");
        setMemuat(true);
        const push = await aktifkanPush();
        setPesan(
          push.ok
            ? `${push.pesan}${push.jumlah ? ` (${push.jumlah} perangkat sudah aktif)` : ""}`
            : push.pesan,
        );
      } else if (hasil === "denied") {
        setKeadaan("ditolak");
      } else {
        setPesan("Izin belum diberikan. Anda bisa mencoba lagi kapan saja lewat ikon lonceng di atas.");
      }
    } catch {
      setKeadaan("tidak-didukung");
    } finally {
      setMemuat(false);
    }
  };

  const contoh = async () => {
    if (!didukung() || window.Notification.permission !== "granted") {
      setPesan("Izin notifikasi belum aktif. Ketuk Izinkan Notifikasi untuk mengaktifkannya.");
      return;
    }
    setMemuat(true);
    const hasil = await ujiPush();
    setPesan(hasil.pesan);
    setMemuat(false);
  };

  if (!terbuka) return null;

  const selesai = keadaan === "aktif" || keadaan === "ditolak" || keadaan === "tidak-didukung";
  const judul =
    keadaan === "tidak-didukung"
      ? "Notifikasi layar HP belum didukung"
      : keadaan === "ditolak"
        ? "Notifikasi diblokir peramban"
        : keadaan === "aktif"
          ? "Terima kasih, notifikasi sudah aktif"
          : "Aktifkan Notifikasi";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-persis-950/65 px-5"
      role="dialog"
      aria-modal="true"
      aria-label="Konfirmasi notifikasi"
      data-testid="popup-izin-notifikasi"
    >
      <div className="popup-panel relative flex max-h-[90vh] w-full max-w-[400px] flex-col overflow-hidden rounded-3xl bg-cream-50 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.6)]">
        <div className="min-h-0 flex-1 overflow-y-auto p-5 text-center">
          {!selesai ? (
            <>
              <button
                type="button"
                onClick={tutup}
                aria-label="Tutup konfirmasi notifikasi"
                data-testid="izin-notifikasi-tutup"
                className="absolute top-3.5 right-3.5 grid h-8 w-8 place-items-center rounded-full border border-black/[0.08] bg-white text-ink-600 transition active:scale-95"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-gold-400/40 bg-cream-100 text-gold-600">
                <Icon name="bell" className="h-7 w-7" />
              </span>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[9.5px] font-bold tracking-[0.2em] text-persis-900 uppercase">
                <Icon name="sparkle" className="h-3.5 w-3.5 text-gold-500" />
                PC PERSIS Cibatu
              </p>
              <h2 className="font-header mt-1.5 text-[15.5px] leading-snug font-bold text-ink-900">{judul}</h2>
              <p className="mt-2 text-justify text-[11.5px] leading-relaxed text-ink-600">
                Izinkan situs ini mengirim notifikasi push supaya kabar terbaru lembaga langsung muncul di layar HP
                Anda — termasuk saat situs sedang tidak dibuka.
              </p>
              <ul className="mt-3.5 space-y-2 text-left">
                {daftarManfaat.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-white px-3.5 py-2.5"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cream-50 text-gold-600">
                      <Icon name={m.ikon} className="h-[17px] w-[17px]" />
                    </span>
                    <span className="text-[11.5px] font-medium text-ink-900">{m.judul}</span>
                  </li>
                ))}
              </ul>
              {pesan ? (
                <p
                  data-testid="izin-notifikasi-pesan"
                  className="mt-3 rounded-2xl border border-gold-400/40 bg-cream-100 px-3.5 py-2.5 text-justify text-[10.5px] leading-relaxed text-persis-900"
                >
                  {pesan}
                </p>
              ) : null}
              <p className="mt-3 text-justify text-[10.5px] leading-relaxed text-ink-600">
                Notifikasi berisi judul dan ringkasan postingan terbaru (berita, artikel, dan pengumuman) saja. Anda
                dapat menghentikannya kapan saja melalui pengaturan peramban.
              </p>
            </>
          ) : (
            <>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-gold-400/40 bg-cream-100 text-persis-800">
                <Icon name="bell" className="h-7 w-7" />
              </span>
              <p className="mt-3 text-[9.5px] font-bold tracking-[0.2em] text-persis-900 uppercase">
                {keadaan === "aktif" ? "Notifikasi Aktif" : "PC PERSIS Cibatu"}
              </p>
              <h2 className="font-header mt-1.5 text-[15.5px] leading-snug font-bold text-ink-900">{judul}</h2>
              <p className="mt-2 text-justify text-[11.5px] leading-relaxed text-ink-600">
                {keadaan === "aktif"
                  ? "Berita, artikel, dan pengumuman terbaru PC PERSIS Cibatu akan dikirim sebagai notifikasi ke layar HP Anda — walau situs sedang ditutup. Ketuk notifikasi untuk langsung membuka postingannya."
                  : keadaan === "ditolak"
                    ? "Izin notifikasi untuk situs ini sedang diblokir. Buka pengaturan situs pada peramban (ketuk ikon gembok pada bilah alamat) lalu pilih Izinkan pada bagian Notifikasi. Selama diblokir, kabar terbaru tetap muncul pada ikon lonceng di atas."
                    : "Peramban di perangkat ini belum mendukung notifikasi ke layar HP. Semua info terbaru tetap bisa dibaca lewat ikon lonceng di bagian atas situs."}
              </p>
              {keadaan === "aktif" ? (
                <button
                  type="button"
                  onClick={contoh}
                  data-testid="izin-notifikasi-coba"
                  className="mt-3.5 w-full rounded-full border border-persis-900/20 bg-white py-3 text-[12px] font-bold text-persis-900 transition active:scale-[0.98]"
                >
                  {memuat ? "Mengirim notifikasi..." : "Kirim notifikasi uji coba"}
                </button>
              ) : null}
              {pesan ? (
                <p className="mt-2 text-justify text-[10.5px] leading-relaxed text-persis-900">{pesan}</p>
              ) : null}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-black/[0.06] bg-white px-5 pt-3 pb-4">
          {selesai ? (
            <button
              type="button"
              onClick={tutup}
              data-testid="izin-notifikasi-selesai"
              className="w-full rounded-full bg-persis-900 py-3.5 text-[13px] font-bold text-white transition active:scale-[0.98]"
            >
              Mengerti
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => void minta()}
                disabled={memuat}
                data-testid="izin-notifikasi-izinkan"
                className="w-full rounded-full bg-persis-900 py-3.5 text-[13px] font-bold text-white transition active:scale-[0.98] disabled:opacity-70"
              >
                {memuat ? "Menyiapkan notifikasi..." : "Izinkan Notifikasi"}
              </button>
              <button
                type="button"
                onClick={tutup}
                data-testid="izin-notifikasi-nanti"
                className="w-full rounded-full py-2.5 text-[12px] font-bold text-persis-900 transition active:scale-[0.98]"
              >
                Nanti saja
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
