// ============= Full file contents =============

import { useEffect, useState } from "react";
import { Copy, Share2, X, Check } from "lucide-react";
import { susunBagikan, type KontenBagikan } from "../lib/bagikan";

function LogoWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="#fff" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.25-8.24 8.25zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.73-.66-1.23-1.47-1.38-1.72-.14-.24-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.89 2.38 1.01 2.54.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28z" />
    </svg>
  );
}

function LogoFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="#fff" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.52l.38-2.93H13.5V8.7c0-.85.23-1.43 1.45-1.43h1.55V4.65c-.27-.04-1.19-.12-2.26-.12-2.24 0-3.77 1.37-3.77 3.88v2.16H7.94v2.93h2.53V21h3.03z" />
    </svg>
  );
}

type Aksi = {
  label: string;
  logo?: React.ReactNode;
  latar?: string;
  ikon?: React.ComponentType<{ className?: string }>;
  onClick: () => void | Promise<void>;
};

export default function TombolBagikan({ konten }: { konten: KontenBagikan }) {
  const [buka, setBuka] = useState(false);
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const data = susunBagikan(konten, typeof window === "undefined" ? "https://localhost/" : window.location.origin + "/");

  useEffect(() => {
    setFile(null);
    if (!data.gambar) return;
    const abort = new AbortController();
    void fetch(data.gambar, { signal: abort.signal }).then(async (res) => {
      if (!res.ok) return;
      const blob = await res.blob();
      if (!blob.type.startsWith("image/") || blob.size > 10 * 1024 * 1024 || abort.signal.aborted) return;
      const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
      setFile(new File([blob], `persis-cibatu.${ext}`, { type: blob.type }));
    }).catch(() => {});
    return () => abort.abort();
  }, [data.gambar]);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(""), 2500);
    return () => clearTimeout(t);
  }, [status]);

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(data.teks);
      setStatus("Pesan disalin");
    } catch {
      setStatus("Gagal menyalin");
    }
  };

  // Bagikan gambar utuh (berkas) bersama teks bila perangkat mendukung.
  const bagikanBerkas = async (): Promise<boolean> => {
    if (!navigator.share) return false;
    const files = file && navigator.canShare?.({ files: [file] }) ? [file] : undefined;
    try {
      await navigator.share({ title: data.judul, text: data.teks, ...(files ? { files } : {}) });
      return true;
    } catch (error) {
      return error instanceof Error && error.name === "AbortError";
    }
  };

  const keWhatsApp = async () => {
    if (file && navigator.canShare?.({ files: [file] }) && (await bagikanBerkas())) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(data.teks)}`, "_blank", "noopener,noreferrer");
  };

  const keFacebook = () => {
    void salin();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`, "_blank", "noopener,noreferrer");
  };

  const lainnya = async () => {
    if (!(await bagikanBerkas())) await salin();
  };

  const aksi: Aksi[] = [
    { label: "WhatsApp", logo: <LogoWhatsApp />, latar: "#25D366", onClick: () => void keWhatsApp() },
    { label: "Facebook", logo: <LogoFacebook />, latar: "#1877F2", onClick: keFacebook },
    { label: "Salin pesan", ikon: status === "Pesan disalin" ? Check : Copy, onClick: () => void salin() },
    { label: "Aplikasi lain", ikon: Share2, onClick: () => void lainnya() },
  ];

  return (
    <div className="fixed bottom-[84px] right-3 z-[95] flex flex-col items-end gap-1.5">
      {status ? <p role="status" className="rounded-full bg-foreground px-2.5 py-0.5 text-[11px] text-background shadow">{status}</p> : null}
      {buka ? aksi.map(({ label, logo, latar, ikon: Ikon, onClick }) => (
        <button key={label} type="button" onClick={onClick} aria-label={label} title={label}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-persis-900 shadow-md transition active:scale-95"
          style={latar ? { backgroundColor: latar, borderColor: latar } : undefined}>
          {logo ?? (Ikon ? <Ikon className="h-4 w-4" /> : null)}
        </button>
      )) : null}
      <button type="button" onClick={() => setBuka((v) => !v)} aria-label={buka ? "Tutup bagikan" : `Bagikan: ${konten.judul}`} aria-expanded={buka}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-persis-900 text-primary-foreground shadow-lg transition active:scale-95">
        {buka ? <X className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
      </button>
    </div>
  );
}
