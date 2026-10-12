/** Hash fragments never reach social crawlers; use a server-visible URL. */
export function jalurBagikan(jalur: string): string {
  const cocok = /^\/#\/(artikel\/[^/?#]+|berita\/[^/?#]+|beranda\/(?:pengumuman|agenda)\/[^/?#]+|galeri\/[^/?#]+|info\/[^/?#]+)$/.exec(jalur);
  return cocok ? `/api/public/bagikan/${cocok[1]}` : jalur;
}

export function tujuanBagikan(jalur: string): { jenis: string; id: string; hash: string } | null {
  if (jalur.length > 400) return null;
  const cocok = /^(artikel|berita|beranda\/pengumuman|beranda\/agenda|galeri|info)\/([^/?#]+)$/.exec(jalur);
  if (!cocok) return null;
  let id: string;
  try { id = decodeURIComponent(cocok[2]); } catch { return null; }
  if (!/^[\p{L}\p{N}_-]{1,200}$/u.test(id)) return null;
  return { jenis: cocok[1], id, hash: `/#/${cocok[1]}/${encodeURIComponent(id)}` };
}