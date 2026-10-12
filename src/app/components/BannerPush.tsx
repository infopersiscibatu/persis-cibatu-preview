import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bacaBannerPush, type PesanBannerPush } from "../lib/bannerPush";

export default function BannerPush() {
  const [pesan, setPesan] = useState<(PesanBannerPush & { id: number }) | null>(null);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const terima = (event: MessageEvent) => {
      const baru = bacaBannerPush(event.data, window.location.origin);
      if (baru && document.visibilityState === "visible") setPesan({ ...baru, id: Date.now() });
    };
    navigator.serviceWorker.addEventListener("message", terima);
    return () => navigator.serviceWorker.removeEventListener("message", terima);
  }, []);
  useEffect(() => {
    if (!pesan) return;
    const timer = setTimeout(() => setPesan(null), 7000);
    return () => clearTimeout(timer);
  }, [pesan]);
  if (!pesan) return null;
  return (
    <aside key={pesan.id} aria-label="Notifikasi masuk" className="banner-push fixed inset-x-3 top-[max(12px,env(safe-area-inset-top))] z-[300] mx-auto flex max-w-md items-start gap-3 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-lg">
      <Bell aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-persis-900" />
      <div className="min-w-0 flex-1">
        <div role="status" aria-live="polite">
          <p className="text-[10px] font-semibold text-ink-600">PC PERSIS CIBATU</p>
          <p className="break-words text-sm font-bold">{pesan.judul}</p>
          <p className="line-clamp-3 break-words text-xs text-ink-600">{pesan.isi}</p>
        </div>
        <Button asChild variant="link" size="sm" className="h-7 px-0 text-persis-900">
          <a href={pesan.url} onClick={() => setPesan(null)}>Buka</a>
        </Button>
      </div>
      <Button variant="ghost" size="icon" aria-label="Tutup notifikasi masuk" title="Tutup notifikasi" onClick={() => setPesan(null)} className="h-7 w-7 shrink-0"><X /></Button>
    </aside>
  );
}