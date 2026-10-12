import { mintaUnit } from "./unitSpmb";

/**
 * Unggah satu berkas gambar dari panel mana pun (admin, unit, ZIS, tata usaha).
 * Berkas dikirim sebagai data URL ke /api/unggah dan disimpan di penyimpanan objek
 * platform, jadi gambarnya tetap ada meski aplikasi dipasang ulang.
 */
export async function unggahGambar(berkas: File, folder = "umum"): Promise<{ id: string; url: string }> {
  const data = await new Promise<string>((selesai, gagal) => {
    const pembaca = new FileReader();
    pembaca.onload = () => selesai(String(pembaca.result).split(",")[1] ?? "");
    pembaca.onerror = () => gagal(new Error("Berkas tidak bisa dibaca."));
    pembaca.readAsDataURL(berkas);
  });
  if (!data) throw new Error("Berkas kosong atau tidak bisa dibaca.");
  const jawab = await mintaUnit<{ media: { id: string; url: string } }>("/api/unggah", {
    method: "POST",
    body: JSON.stringify({ nama: berkas.name, tipe: berkas.type, data, folder, alt: berkas.name }),
  });
  return jawab.media;
}
