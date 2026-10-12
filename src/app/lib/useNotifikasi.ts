import { useEffect, useMemo, useState } from "react";
import { daftarNotifikasi } from "../data/content";

const KUNCI = "persis-cibatu-notif-dibaca";

function bacaTersimpan(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(KUNCI) ?? "[]");
  } catch {
    return [];
  }
}

/** Daftar notifikasi terbaru beserta penanda sudah dibaca (tersimpan di peramban). */
export function useNotifikasi() {
  const semua = useMemo(() => daftarNotifikasi(6), []);
  const [dibaca, setDibaca] = useState<string[]>([]);

  useEffect(() => setDibaca(bacaTersimpan()), []);

  const simpan = (ids: string[]) => {
    setDibaca(ids);
    try {
      window.localStorage.setItem(KUNCI, JSON.stringify(ids));
    } catch {
      /* penyimpanan peramban tidak tersedia */
    }
  };

  return {
    semua,
    belumDibaca: semua.filter((n) => !dibaca.includes(n.id)),
    tandai: (ids: string[]) => simpan([...new Set([...dibaca, ...ids])]),
    munculkanLagi: () => simpan([]),
  };
}
