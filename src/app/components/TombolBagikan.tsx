import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Copy, Facebook, Instagram, Share2, X, MessageCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { susunBagikan, type KontenBagikan } from "../lib/bagikan";

export default function TombolBagikan({ konten }: { konten: KontenBagikan }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const data = susunBagikan(konten, typeof window === "undefined" ? "https://localhost/" : window.location.origin + "/");

  useEffect(() => {
    setFile(null);
    if (!open || !data.gambar) return;
    const abort = new AbortController();
    void fetch(data.gambar, { signal: abort.signal }).then(async (res) => {
      if (!res.ok) return;
      const blob = await res.blob();
      if (!blob.type.startsWith("image/") || blob.size > 10 * 1024 * 1024 || abort.signal.aborted) return;
      const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
      setFile(new File([blob], `persis-cibatu.${ext}`, { type: blob.type }));
    }).catch(() => {});
    return () => abort.abort();
  }, [open, data.gambar]);

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(data.teks);
      setStatus("Pesan lengkap dan tautan berhasil disalin.");
      return true;
    } catch {
      setStatus("Belum bisa menyalin otomatis. Pilih dan salin pesan di bawah.");
      return false;
    }
  };

  const bagikanPerangkat = async () => {
    if (!navigator.share) {
      await salin();
      setStatus("Tempel pesan di Instagram. Gambar dapat diunduh melalui tombol gambar.");
      return;
    }
    setSibuk(true);
    try {
      const files = file && navigator.canShare?.({ files: [file] }) ? [file] : undefined;
      await navigator.share({ title: data.judul, text: data.teks, ...(files ? { files } : {}) });
      setStatus("Pilihan berbagi perangkat telah dibuka.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setStatus("Berbagi perangkat belum tersedia. Gunakan WhatsApp atau salin pesan.");
    } finally {
      setSibuk(false);
    }
  };

  const unduh = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { setOpen(v); setStatus(""); }}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" className="border-persis-900/20 bg-card text-persis-900" aria-label={`Bagikan: ${konten.judul}`}>
          <Share2 /> Bagikan
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-foreground/60" />
        <Dialog.Content className="fixed inset-x-3 bottom-3 z-[91] mx-auto flex max-h-[85dvh] max-w-[520px] flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xl outline-none sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="text-base font-bold">Bagikan</Dialog.Title>
            <Dialog.Close asChild><Button size="icon" variant="ghost" aria-label="Tutup pilihan berbagi"><X /></Button></Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Bagikan {data.judul}</Dialog.Description>
          {data.gambar ? <img src={data.gambar} alt={data.judul} className="aspect-video w-full rounded-md object-cover" /> : null}
          <div className="space-y-1">
            <h3 className="break-words text-sm font-bold">{data.judul}</h3>
            {data.penulis ? <p className="text-xs text-muted-foreground">Penulis: {data.penulis}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild><a href={`https://wa.me/?text=${encodeURIComponent(data.teks)}`} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp</a></Button>
            <Button variant="outline" disabled={sibuk} onClick={bagikanPerangkat}><Instagram /> Instagram</Button>
            <Button variant="outline" asChild><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`} target="_blank" rel="noopener noreferrer" onClick={() => { void salin(); }}><Facebook /> Facebook</a></Button>
            <Button variant="outline" onClick={() => { void salin(); }}><Copy /> Salin</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" disabled={sibuk} onClick={bagikanPerangkat}><Share2 /> Aplikasi lainnya</Button>
            {file ? <Button variant="ghost" size="sm" onClick={unduh}><Download /> Unduh gambar</Button> : null}
          </div>
          <textarea aria-label="Pesan yang dibagikan" readOnly value={data.teks} className="min-h-32 w-full resize-y rounded-md border border-input bg-background p-3 text-xs leading-relaxed text-foreground" />
          {status ? <p role="status" className="text-xs text-persis-900">{status}</p> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}