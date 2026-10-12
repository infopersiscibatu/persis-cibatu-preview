import { describe, expect, it } from "vitest";
import { bacaBannerPush } from "@/app/lib/bannerPush";

describe("foreground push messages", () => {
  it("preserves the received title, body and direct content destination", () => {
    expect(bacaBannerPush({ type: "PERSIS_PUSH", payload: { title: "Berita baru", body: "Kajian hari ini", url: "/#/berita/kajian" } }, "https://persis.example")).toEqual({ judul: "Berita baru", isi: "Kajian hari ini", url: "https://persis.example/#/berita/kajian" });
  });
  it("does not open an external or executable push destination", () => {
    for (const url of ["https://other.example/", "javascript:alert(1)"]) {
      expect(bacaBannerPush({ type: "PERSIS_PUSH", payload: { url } }, "https://persis.example")?.url).toBe("https://persis.example/");
    }
  });
  it("ignores unrelated service worker messages", () => {
    expect(bacaBannerPush({ type: "OTHER", payload: {} }, "https://persis.example")).toBeNull();
  });
});