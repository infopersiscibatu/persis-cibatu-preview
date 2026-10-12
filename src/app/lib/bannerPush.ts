export type PesanBannerPush = { judul: string; isi: string; url: string };

export function bacaBannerPush(data: unknown, asal: string): PesanBannerPush | null {
  if (!data || typeof data !== "object" || !("type" in data) || data.type !== "PERSIS_PUSH" || !("payload" in data)) return null;
  const p = data.payload;
  if (!p || typeof p !== "object") return null;
  let url = asal + "/";
  try {
    const tujuan = new URL("url" in p && typeof p.url === "string" ? p.url : "/", asal);
    if (tujuan.origin === asal) url = tujuan.href;
  } catch { /* Tujuan yang rusak kembali ke beranda. */ }
  return {
    judul: "title" in p && typeof p.title === "string" ? p.title : "PC PERSIS Cibatu",
    isi: "body" in p && typeof p.body === "string" ? p.body : "",
    url,
  };
}