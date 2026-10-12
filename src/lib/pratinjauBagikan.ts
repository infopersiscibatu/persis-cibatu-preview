import { artikel, berita, pengumuman, agenda } from "@/app/data/content";
import { galeri } from "@/app/data/galeri";
import { programDonasi } from "@/app/data/donasi";
import { tujuanBagikan } from "@/app/lib/tautanBagikan";

export type Pratinjau = { judul: string; ringkasan: string; gambar: string; hash: string };
type Baris = Record<string, unknown>;
const teks = (v: unknown) => typeof v === "string" ? v.replace(/<[^>]*>/g, "").trim() : "";
const konfigurasi: Record<string, { endpoint: string; daftar: string; kunci: string }> = {
  artikel: { endpoint: "artikel", daftar: "artikel", kunci: "slug" },
  berita: { endpoint: "berita", daftar: "berita", kunci: "slug" },
  "beranda/pengumuman": { endpoint: "pengumuman", daftar: "pengumuman", kunci: "id" },
  "beranda/agenda": { endpoint: "agenda", daftar: "agenda", kunci: "id" },
  galeri: { endpoint: "galeri", daftar: "foto", kunci: "id" },
  info: { endpoint: "program-donasi", daftar: "program", kunci: "slug" },
};

export function dariJawaban(jalur: string, jawaban: Record<string, unknown>): Pratinjau | null {
  const tujuan = tujuanBagikan(jalur);
  if (!tujuan) return null;
  const config = konfigurasi[tujuan.jenis];
  const daftar = jawaban[config.daftar];
  if (!Array.isArray(daftar)) return null;
  const item = daftar.find((a: Baris) => a && a[config.kunci] === tujuan.id && a.terbit !== false && a.aktif !== false) as Baris | undefined;
  if (!item) return null;
  return {
    judul: teks(item.judul),
    ringkasan: teks(item.ringkasan) || teks(item.kategori) || [item.tanggal, item.waktu, item.tempat, Array.isArray(item.isi) ? item.isi[0] : ""].map(teks).filter(Boolean).join(" · "),
    gambar: teks(item.gambarUrl ?? item.gambar),
    hash: tujuan.hash,
  };
}

export function dariBawaan(jalur: string): Pratinjau | null {
  const tujuan = tujuanBagikan(jalur);
  if (!tujuan) return null;
  const config = konfigurasi[tujuan.jenis];
  const bawaan: Record<string, unknown[]> = {
    artikel,
    berita: berita.map((b) => ({ ...b, judul: b.title, ringkasan: b.excerpt, gambar: b.image })),
    pengumuman: pengumuman.map((p) => ({ ...p, judul: p.title, ringkasan: p.summary })),
    agenda: agenda.map((a) => ({ ...a, judul: a.title, ringkasan: a.detail[0] })),
    foto: galeri.map((f) => ({ ...f, ringkasan: f.album })),
    program: programDonasi,
  };
  return dariJawaban(jalur, { [config.daftar]: bawaan[config.daftar] });
}

export function endpointBagikan(jalur: string): string | null {
  const tujuan = tujuanBagikan(jalur);
  return tujuan ? `/api/${konfigurasi[tujuan.jenis].endpoint}` : null;
}

/** Public HTTPS image; known image providers supply a small rendition of the same photo. */
export function gambarPratinjau(gambar: string, asal: string): string {
  if (!gambar) return "";
  try {
    const url = new URL(gambar, asal);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost")) return "";
    if (url.hostname === "images.unsplash.com" || url.hostname === "images.pexels.com") {
      url.searchParams.set("w", "1200");
      url.searchParams.set("h", "630");
      url.searchParams.set("fit", "crop");
      url.searchParams.set("q", "75");
    }
    return url.href;
  } catch { return ""; }
}

const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

export function halamanPratinjau(data: Pratinjau, url: string): string {
  const gambar = gambarPratinjau(data.gambar, new URL(url).origin);
  const meta = (nama: string, nilai: string, atribut = "property") => `<meta ${atribut}="${nama}" content="${escapeHtml(nilai)}">`;
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(data.judul)} — PC PERSIS Cibatu</title>
${meta("description", data.ringkasan, "name")}${meta("og:title", data.judul)}${meta("og:description", data.ringkasan)}${meta("og:type", "article")}${meta("og:site_name", "PC PERSIS Cibatu")}${meta("og:url", url)}${meta("twitter:card", "summary_large_image", "name")}${meta("twitter:title", data.judul, "name")}${meta("twitter:description", data.ringkasan, "name")}
${gambar ? meta("og:image", gambar) + meta("og:image:alt", data.judul) + meta("twitter:image", gambar, "name") : ""}
<link rel="canonical" href="${escapeHtml(url)}"></head><body><h1>${escapeHtml(data.judul)}</h1>${gambar ? `<img src="${escapeHtml(gambar)}" alt="${escapeHtml(data.judul)}" width="600">` : ""}<p>${escapeHtml(data.ringkasan)}</p><a href="${escapeHtml(data.hash)}">Baca selengkapnya</a><script>window.location.replace(new URL(${JSON.stringify(data.hash).replace(/</g, "\\u003c")}, location.origin).href);</script></body></html>`;
}