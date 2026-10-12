import { describe, expect, it } from "vitest";
import { susunBagikan, urlPublik } from "@/app/lib/bagikan";

describe("Content share destinations", () => {
  const asal = "https://persis.example/";
  it.each([
    "/#/artikel/tulisan-satu",
    "/#/berita/berita-satu",
    "/#/beranda/pengumuman/p-1",
    "/#/beranda/agenda/a-1",
    "/#/galeri/f-1",
    "/#/info/program-satu",
  ])("keeps the direct content destination %s", (jalur) => {
    expect(susunBagikan({ judul: "Kegiatan", jalur }, asal).url).toBe(`https://persis.example/api/public/bagikan/${jalur.slice(3)}`);
  });
  it("resolves uploaded images on the same deployed origin", () => {
    expect(susunBagikan({ judul: "Kegiatan", jalur: "/#/galeri/f-1", gambar: "/berkas/kegiatan.png" }, asal).gambar).toBe("https://persis.example/berkas/kegiatan.png");
  });
  it("does not invent a missing author or image", () => {
    const data = susunBagikan({ judul: "Agenda", jalur: "/#/beranda/agenda/a-1" }, asal);
    expect(data.penulis).toBe("");
    expect(data.gambar).toBe("");
  });
  it("rejects unsafe image protocols", () => {
    expect(urlPublik("javascript:alert(1)", asal)).toBe("");
  });
});