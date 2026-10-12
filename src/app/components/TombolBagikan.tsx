import { useEffect, useState } from "react";
import { Copy, Facebook, Share2, X, MessageCircle, Check } from "lucide-react";
import { susunBagikan, type KontenBagikan } from "../lib/bagikan";

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

  const aksi = [
    { label: "WhatsApp", ikon: MessageCircle, onClick: keWhatsApp },
    { label: "Facebook", ikon: Facebook, onClick: keFacebook },
    { label: "Salin pesan", ikon: status === "Pesan disalin" ? Check : Copy, onClick: salin },
    { label: "Aplikasi lain", ikon: Share2, onClick: lainnya },
  ];

  return (
    <div className="fixed bottom-[88px] right-4 z-[95] flex flex-col items-end gap-2">
      {status ? <p role="status" className="rounded-full bg-foreground px-3 py-1 text-xs text-background shadow">{status}</p> : null}
      {buka ? aksi.map(({ label, ikon: Ikon, onClick }) => (
        <button key={label} type="button" onClick={() => { void onClick(); }} aria-label={label} title={label}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-persis-900 shadow-md transition active:scale-95">
          <Ikon className="h-5 w-5" />
        </button>
      )) : null}
      <button type="button" onClick={() => setBuka((v) => !v)} aria-label={buka ? "Tutup bagikan" : `Bagikan: ${konten.judul}`} aria-expanded={buka}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-persis-900 text-primary-foreground shadow-lg transition active:scale-95">
        {buka ? <X className="h-6 w-6" /> : <Share2 className="h-6 w-6" />}
      </button>
    </div>
  );
}
