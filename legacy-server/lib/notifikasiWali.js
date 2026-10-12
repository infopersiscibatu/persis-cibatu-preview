/**
 * Isi notifikasi push untuk wali santri.
 *
 * Semua kalimat notifikasi disusun di satu tempat ini supaya isinya selalu sesuai dengan
 * peristiwa yang benar-benar terjadi (tagihan aktif, setoran diverifikasi, nilai terbit,
 * tahfidz terbit) dan selalu menyebut nama lengkap peserta didik beserta kelas serta unit
 * pendidikannya — jadi wali langsung tahu notifikasi itu untuk siapa.
 */
const { istilahUntukJenjang } = require("./istilah");

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const rupiah = (nilai) => `Rp${Math.round(Number(nilai) || 0).toLocaleString("id-ID")}`;

const duaAngka = (n) => String(n).padStart(2, "0");

/**
 * Tanggal dari database (kolom date dikirim sebagai objek Date) atau teks "2026-11-30"
 * diubah menjadi tulisan "30 November 2026".
 */
function tanggalTeks(nilai) {
  if (!nilai) return "";
  let teks;
  if (nilai instanceof Date) {
    teks = `${nilai.getFullYear()}-${duaAngka(nilai.getMonth() + 1)}-${duaAngka(nilai.getDate())}`;
  } else {
    teks = String(nilai).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(teks)) {
      const d = new Date(nilai);
      if (!Number.isNaN(d.getTime())) {
        teks = `${d.getFullYear()}-${duaAngka(d.getMonth() + 1)}-${duaAngka(d.getDate())}`;
      }
    }
  }
  const [tahun, bulan, hari] = teks.split("-").map(Number);
  if (!tahun || !bulan || !hari || bulan < 1 || bulan > 12) return String(nilai);
  return `${hari} ${BULAN[bulan - 1]} ${tahun}`;
}

/** "2026-11" → "November 2026". */
function periodeTeks(periode) {
  const cocok = /^(\d{4})-(\d{2})$/.exec(String(periode ?? ""));
  if (!cocok) return "";
  const bulan = Number(cocok[2]);
  if (bulan < 1 || bulan > 12) return "";
  return `${BULAN[bulan - 1]} ${cocok[1]}`;
}

/** Nama lengkap peserta didik beserta kelas dan unit pendidikannya. */
function namaLengkapPeserta(s) {
  const nama = String(s?.nama ?? "").trim();
  const tambahan = [String(s?.kelas ?? "").trim(), String(s?.unit_nama ?? "").trim()].filter(Boolean).join(" · ");
  if (!nama) return tambahan || "peserta didik";
  return tambahan ? `${nama} (${tambahan})` : nama;
}

const istilahPeserta = (s) => istilahUntukJenjang({ slug: s?.jenjang_slug, nama: s?.jenjang_nama });

/** Keterangan tambahan tentang pengiriman, dipakai pada balasan panel admin. */
function catatanPengiriman(hasil) {
  if (!hasil) return "";
  if ((hasil.perangkat ?? 0) === 0) {
    return " Belum ada HP wali yang terdaftar untuk notifikasi — mintalah wali membuka portal wali lalu mengaktifkan notifikasinya.";
  }
  if ((hasil.terkirim ?? 0) === 0) {
    return ` Notifikasi belum sampai ke ${hasil.perangkat} HP wali yang terdaftar — kemungkinan langganannya sudah tidak berlaku, mintalah wali mengaktifkan ulang.`;
  }
  return ` Notifikasi terkirim ke ${hasil.terkirim} dari ${hasil.perangkat} HP wali.`;
}

/* ------------------------------- isi notifikasi ------------------------------- */

/** Tagihan baru dibuka bendahara: wali diberi tahu nominal dan jatuh temponya. */
function tagihanBaru({ santri, tagihan }) {
  const periode = periodeTeks(tagihan?.periode);
  const jatuhTempo = tanggalTeks(tagihan?.jatuh_tempo);
  return {
    jenis: "tagihan",
    judul: "Tagihan Baru · PC PERSIS Cibatu",
    isi:
      `Tagihan ${tagihan?.label || "sekolah"}${periode ? ` ${periode}` : ""} sebesar ${rupiah(tagihan?.jumlah)} ` +
      `sudah aktif untuk ${namaLengkapPeserta(santri)}.${jatuhTempo ? ` Jatuh tempo ${jatuhTempo}.` : ""} ` +
      "Ketuk untuk melihat rinciannya di portal wali.",
    tautan: "/#/wali/tagihan",
    kunci: `tagihan-baru-${tagihan?.id ?? ""}`,
  };
}

/** Setoran wali selesai diverifikasi bendahara. */
function pembayaranDiverifikasi({ santri, pembayaran, lunas }) {
  return {
    jenis: "tagihan",
    judul: "Pembayaran Diverifikasi · PC PERSIS Cibatu",
    isi:
      `Setoran ${rupiah(pembayaran?.jumlah)} untuk ${pembayaran?.label || "tagihan"} dari ` +
      `${namaLengkapPeserta(santri)} sudah diverifikasi bendahara${lunas ? " dan tagihannya lunas" : ""}. ` +
      "Riwayat pembayarannya dapat dibuka di portal wali.",
    tautan: "/#/wali/tagihan",
    kunci: `pembayaran-terverifikasi-${pembayaran?.id ?? ""}`,
  };
}

/** Setoran belum dapat diverifikasi bendahara (mis. bukti kurang jelas). */
function pembayaranDitolak({ santri, pembayaran, alasan }) {
  return {
    jenis: "tagihan",
    judul: "Setoran Belum Dapat Diverifikasi · PC PERSIS Cibatu",
    isi:
      `Setoran ${rupiah(pembayaran?.jumlah)} untuk ${pembayaran?.label || "tagihan"} dari ` +
      `${namaLengkapPeserta(santri)} belum dapat diverifikasi.` +
      `${alasan ? ` Catatan bendahara: ${alasan}.` : ""} Mohon diperiksa kembali melalui portal wali.`,
    tautan: "/#/wali/tagihan",
    kunci: `pembayaran-ditolak-${pembayaran?.id ?? ""}`,
  };
}

/** Nilai rapor diterbitkan petugas. */
function nilaiTerbit({ santri, jumlah, semester, kunci }) {
  const istilah = istilahPeserta(santri);
  const jumlahTeks = jumlah > 0 ? `Nilai ${jumlah} ${istilah.materiKecil}` : `Nilai ${istilah.materiKecil}`;
  return {
    jenis: "nilai",
    judul: "Nilai Sudah Terbit · PC PERSIS Cibatu",
    isi:
      `${jumlahTeks}${semester ? ` ${semester}` : ""} untuk ${namaLengkapPeserta(santri)} sudah terbit ` +
      "dan dapat dibuka di portal wali.",
    tautan: "/#/wali/nilai",
    kunci: kunci ?? `nilai-terbit-${santri?.id ?? ""}-${Date.now()}`,
  };
}

/** Target dan catatan setoran tahfidz diterbitkan pembimbing. */
function tahfidzTerbit({ santri, jumlahSetoran, adaTarget, kunci }) {
  const bagian = [];
  if (jumlahSetoran > 0) bagian.push(`${jumlahSetoran} setoran hafalan`);
  if (adaTarget) bagian.push("capaian hafalannya");
  return {
    jenis: "tahfidz",
    judul: "Nilai Tahfidz Sudah Terbit · PC PERSIS Cibatu",
    isi:
      `Catatan tahfidz untuk ${namaLengkapPeserta(santri)} sudah terbit: ${bagian.join(" dan ") || "catatan terbaru"}. ` +
      "Ketuk untuk melihatnya di portal wali.",
    tautan: "/#/wali/tahfidz",
    kunci: kunci ?? `tahfidz-terbit-${santri?.id ?? ""}-${Date.now()}`,
  };
}

/** Notifikasi uji coba dari tombol "Kirim contoh notifikasi" di portal wali. */
function ujiWali({ santri, kunci }) {
  return {
    jenis: "uji",
    judul: "Notifikasi Wali Siap · PC PERSIS Cibatu",
    isi:
      `HP ini sudah terhubung dengan akun ${namaLengkapPeserta(santri)}. ` +
      "Notifikasi tagihan baru, pembayaran yang diverifikasi, nilai, dan nilai tahfidznya akan muncul di layar HP ini.",
    tautan: "/#/wali/tagihan",
    kunci: kunci ?? `uji-wali-${santri?.id ?? ""}-${Date.now()}`,
  };
}

module.exports = {
  rupiah,
  tanggalTeks,
  periodeTeks,
  namaLengkapPeserta,
  catatanPengiriman,
  tagihanBaru,
  pembayaranDiverifikasi,
  pembayaranDitolak,
  nilaiTerbit,
  tahfidzTerbit,
  ujiWali,
};
