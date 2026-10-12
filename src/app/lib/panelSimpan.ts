import { useState } from "react";
import { beritahu } from "./notifikasiAdmin";

export type Status = { tipe: "sukses" | "galat"; teks: string } | null;

/**
 * Menyimpan perubahan ke layanan, menyegarkan data dari database, lalu
 * menampilkan pemberitahuan singkat. Kesalahan tetap tampil di borang.
 */
export function pakaiSimpan(segarkan?: () => Promise<unknown>) {
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<Status>(null);

  const jalankan = async (kerja: () => Promise<unknown>, sukses: string) => {
    setSibuk(true);
    setPesan(null);
    try {
      await kerja();
      if (segarkan) await segarkan();
      beritahu("sukses", sukses);
      return true;
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menyimpan." });
      return false;
    } finally {
      setSibuk(false);
    }
  };

  return { sibuk, pesan, jalankan, setPesan };
}
