import { useRef, useState } from "react";
import { Icon } from "../Icons";
import { unggahGambar } from "../../lib/unggah";

/**
 * Pemilih gambar untuk panel ZIS: pratinjau, unggah berkas, dan hapus gambar.
 * Berkas disimpan di penyimpanan objek platform, jadi gambarnya tetap ada
 * meski aplikasi dipasang ulang.
 */
export default function PilihGambar({
  label,
  petunjuk,
  nilai,
  onUbah,
  testid,
  rasio = "h-[150px]",
  bentuk = "landscape",
  folder = "umum",
}: {
  label: string;
  petunjuk?: string;
  /** Alamat gambar yang sedang dipakai. */
  nilai: string;
  onUbah: (gambar: { url: string; mediaId: string | null }) => void;
  testid: string;
  /** Kelas tinggi pratinjau supaya sesuai dengan tampilan di situs. */
  rasio?: string;
  /** "persegi" untuk gambar berisi kode QR agar tidak terpotong pratinjaunya. */
  bentuk?: "landscape" | "persegi";
  /** Folder penyimpanan di penyimpanan objek, mis. "program-donasi" atau "metode-pembayaran". */
  folder?: string;
}) {
  const berkasRef = useRef<HTMLInputElement | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const pilih = async (berkas: File | undefined) => {
    if (!berkas) return;
    setGalat(null);
    if (berkas.size > 25 * 1024 * 1024) {
      setGalat("Berkas lebih dari 25 MB. Kecilkan dulu gambarnya.");
      return;
    }
    setSibuk(true);
    try {
      const media = await unggahGambar(berkas, folder);
      onUbah({ url: media.url, mediaId: media.id });
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gambar tidak bisa diunggah.");
    } finally {
      setSibuk(false);
      if (berkasRef.current) berkasRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2.5 rounded-2xl border border-black/[0.08] bg-white p-4">
      <div>
        <h2 className="font-header text-[13px] font-bold text-ink-900">{label}</h2>
        {petunjuk ? <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-500">{petunjuk}</p> : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-cream-50">
        {nilai ? (
          <img
            src={nilai}
            alt={`Pratinjau ${label}`}
            data-testid={`${testid}-pratinjau`}
            className={`${rasio} w-full ${bentuk === "persegi" ? "bg-white object-contain p-2" : "object-cover"}`}
          />
        ) : (
          <p className={`${rasio} grid place-items-center text-[11px] text-ink-400`}>Belum ada gambar dipilih</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid={`${testid}-pilih`}
          disabled={sibuk}
          onClick={() => berkasRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-persis-900/20 bg-cream-50 px-3.5 py-2 text-[11.5px] font-semibold text-persis-900 transition active:scale-[0.98] disabled:opacity-50"
        >
          <Icon name="image" className="h-[15px] w-[15px]" />
          {sibuk ? "Mengunggah…" : nilai ? "Ganti gambar" : "Unggah gambar"}
        </button>
        {nilai ? (
          <button
            type="button"
            data-testid={`${testid}-hapus`}
            disabled={sibuk}
            onClick={() => onUbah({ url: "", mediaId: null })}
            className="text-[11px] font-semibold text-rose-700 transition active:scale-[0.98] disabled:opacity-50"
          >
            Hapus gambar
          </button>
        ) : null}
      </div>

      <input
        ref={berkasRef}
        type="file"
        accept="image/*"
        data-testid={`${testid}-berkas`}
        className="hidden"
        onChange={(e) => void pilih(e.target.files?.[0])}
      />

      <p className="text-[10.5px] leading-relaxed text-ink-400">
        {bentuk === "persegi"
          ? "Gunakan gambar persegi berisi kode QR, misalnya 800 × 800 piksel. Berkas maksimal 25 MB."
          : "Gambar mendatar (landscape) paling pas, misalnya 1200 × 800 piksel. Berkas maksimal 25 MB."}
      </p>
      {galat ? (
        <p data-testid={`${testid}-galat`} className="text-[10.5px] font-semibold text-rose-700">
          {galat}
        </p>
      ) : null}
    </div>
  );
}
