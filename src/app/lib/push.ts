import { daftarNotifikasiPostingan, type Notifikasi } from "../data/content";
import { daftarkanNotifikasiWali, lepasNotifikasiWali, statusNotifikasiWali, ujiNotifikasiWali } from "./waliPortal";

/** Notifikasi push (muncul di layar HP, termasuk saat situs sudah ditutup). */

const KUNCI_ENDPOINT = "persis-cibatu-push-endpoint";
const JEDA_MENIT = 20000;

export function didukungPush(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function endpointTersimpan(): string | null {
  try {
    return window.localStorage.getItem(KUNCI_ENDPOINT);
  } catch {
    return null;
  }
}

function simpanEndpoint(endpoint: string | null) {
  try {
    if (endpoint) window.localStorage.setItem(KUNCI_ENDPOINT, endpoint);
    else window.localStorage.removeItem(KUNCI_ENDPOINT);
  } catch {
    /* penyimpanan peramban tidak tersedia */
  }
}

/** Alamat yang dibuka saat notifikasi diketuk. */
export function tautanNotifikasi(n: Notifikasi): string {
  if (n.tautan) return n.tautan;
  if (n.halaman === "berita-detail" && n.slug) return `/#/berita/${n.slug}`;
  if (n.halaman === "artikel-detail" && n.slug) return `/#/artikel/${n.slug}`;
  return "/#/beranda";
}

/** Daftarkan service worker agar notifikasi bisa diterima di layar HP. */
export async function daftarkanServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const daftar = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((r) => window.setTimeout(r, 8000)),
    ]);
    return daftar;
  } catch {
    return null;
  }
}

function kunciDariBase64(isi: string): Uint8Array {
  const pad = "=".repeat((4 - (isi.length % 4)) % 4);
  const dasar = (isi + pad).replace(/-/g, "+").replace(/_/g, "/");
  const mentah = window.atob(dasar);
  const hasil = new Uint8Array(mentah.length);
  for (let i = 0; i < mentah.length; i += 1) hasil[i] = mentah.charCodeAt(i);
  return hasil;
}

async function ambilKunci(): Promise<string> {
  const jawab = await fetch("/api/push/kunci", { headers: { Accept: "application/json" } });
  if (!jawab.ok) throw new Error(`Kunci notifikasi tidak tersedia (${jawab.status}).`);
  const data = await jawab.json();
  if (!data.kunci) throw new Error("Kunci notifikasi kosong.");
  return data.kunci as string;
}

async function kirimLangganan(langganan: PushSubscription): Promise<number> {
  const data = langganan.toJSON();
  const jawab = await fetch("/api/push/daftar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: data.endpoint,
      kunci: data.keys?.p256dh,
      auth: data.keys?.auth,
      perangkat: navigator.userAgent.slice(0, 150),
    }),
  });
  if (!jawab.ok) throw new Error(`Pendaftaran perangkat gagal (${jawab.status}).`);
  const hasil = await jawab.json();
  return Number(hasil.jumlah ?? 0);
}

export type HasilPush = { ok: boolean; pesan: string; endpoint?: string; jumlah?: number };

/**
 * Aktifkan notifikasi push untuk perangkat ini: izin → langganan peramban →
 * didaftarkan ke layanan. Setelah aktif, notifikasi sampai ke layar HP walau
 * situs sudah ditutup.
 */
export async function aktifkanPush(): Promise<HasilPush> {
  if (!didukungPush()) {
    return { ok: false, pesan: "Peramban ini belum mendukung notifikasi push. Kabar terbaru tetap muncul di ikon lonceng." };
  }
  if (window.Notification.permission !== "granted") {
    return { ok: false, pesan: "Izin notifikasi belum diberikan untuk situs ini." };
  }
  const daftar = await daftarkanServiceWorker();
  if (!daftar) {
    return { ok: false, pesan: "Layanan notifikasi latar belakang belum siap di peramban ini." };
  }
  try {
    const kunci = await ambilKunci();
    let langganan = await daftar.pushManager.getSubscription();
    if (!langganan) {
      langganan = await Promise.race([
        daftar.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: kunciDariBase64(kunci) as BufferSource,
        }),
        new Promise<never>((_, tolak) =>
          window.setTimeout(() => tolak(new Error("Waktu penyiapan langganan habis.")), JEDA_MENIT),
        ),
      ]);
    }
    const jumlah = await kirimLangganan(langganan);
    simpanEndpoint(langganan.endpoint);
    return {
      ok: true,
      pesan: "Notifikasi layar HP aktif. Kabar terbaru akan muncul walau situs sedang ditutup.",
      endpoint: langganan.endpoint,
      jumlah,
    };
  } catch (e) {
    const pesan = e instanceof Error ? e.message : "Notifikasi push belum bisa diaktifkan.";
    return { ok: false, pesan: `${pesan} Kabar terbaru tetap muncul di ikon lonceng dan kartu di dalam situs.` };
  }
}

/**
 * Siapkan langganan peramban untuk perangkat ini (tanpa mengirimnya ke layanan).
 * Dipakai bersama oleh notifikasi siaran maupun notifikasi pribadi wali.
 */
async function langgananPerangkat(): Promise<PushSubscription> {
  if (!didukungPush()) throw new Error("Peramban ini belum mendukung notifikasi push.");
  if (window.Notification.permission !== "granted") {
    throw new Error("Izin notifikasi belum diberikan untuk situs ini.");
  }
  const daftar = await daftarkanServiceWorker();
  if (!daftar) throw new Error("Layanan notifikasi latar belakang belum siap di peramban ini.");

  const kunci = await ambilKunci();
  const ada = await daftar.pushManager.getSubscription();
  if (ada) return ada;
  return Promise.race([
    daftar.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: kunciDariBase64(kunci) as BufferSource,
    }),
    new Promise<never>((_, tolak) =>
      window.setTimeout(() => tolak(new Error("Waktu penyiapan langganan habis.")), JEDA_MENIT),
    ),
  ]);
}

/* ------------------- notifikasi pribadi wali (terkunci di HP ini) ------------------- */

/**
 * Hubungkan HP yang sedang login sebagai wali dengan akun siswa/mahasiswa itu.
 *
 * Satu HP hanya terikat pada satu akun: begitu wali lain masuk di HP yang sama,
 * ikatannya berpindah sehingga notifikasi tagihan, nilai, dan tahfidz tidak tertukar.
 * Bila izin notifikasi sudah pernah diberikan, pendaftaran ini berjalan sendiri
 * tanpa perlu menekan tombol apa pun.
 */
export async function daftarkanPushWali(): Promise<HasilPush> {
  if (!didukungPush()) {
    return { ok: false, pesan: "Peramban ini belum mendukung notifikasi push. Tagihan dan nilai tetap bisa dibuka di portal wali." };
  }
  if (window.Notification.permission !== "granted") {
    return { ok: false, pesan: "Izin notifikasi belum diberikan. Ketuk Aktifkan notifikasi untuk mengizinkannya." };
  }
  try {
    const langganan = await langgananPerangkat();
    const data = langganan.toJSON();
    const jawab = await daftarkanNotifikasiWali({
      endpoint: data.endpoint ?? "",
      kunci: data.keys?.p256dh ?? "",
      auth: data.keys?.auth ?? "",
      perangkat: navigator.userAgent.slice(0, 150),
    });
    simpanEndpoint(data.endpoint ?? "");
    return {
      ok: true,
      pesan: "Notifikasi aktif. Tagihan terverifikasi, nilai, dan nilai tahfidz ananda akan dikirim ke HP ini.",
      endpoint: data.endpoint,
      jumlah: Number(jawab.perangkat ?? 0),
    };
  } catch (e) {
    return { ok: false, pesan: e instanceof Error ? e.message : "Notifikasi belum bisa diaktifkan di HP ini." };
  }
}

/** Lepaskan ikatan HP ini dari akun wali yang sedang masuk (dipakai saat keluar portal). */
export async function lepasPushWali(): Promise<void> {
  const endpoint = endpointTersimpan();
  if (!endpoint) return;
  try {
    await lepasNotifikasiWali(endpoint);
  } catch {
    /* diabaikan — sesi tetap bisa keluar walau layanan notifikasi tidak terjangkau */
  }
}

/** Kirim satu notifikasi uji coba ke HP wali yang sedang masuk. */
export async function ujiPushWali(): Promise<HasilPush> {
  if (window.Notification.permission !== "granted") {
    return { ok: false, pesan: "Izin notifikasi belum aktif. Ketuk Aktifkan notifikasi terlebih dahulu." };
  }
  try {
    const jawab = await ujiNotifikasiWali();
    return { ok: true, pesan: jawab.pesan ?? "Notifikasi uji sudah dikirim ke HP ini." };
  } catch (e) {
    return { ok: false, pesan: e instanceof Error ? e.message : "Notifikasi uji belum bisa dikirim." };
  }
}

/** Apakah HP ini sudah terdaftar sebagai penerima notifikasi wali yang sedang masuk. */
export async function statusPushWali(): Promise<{ terdaftar: boolean; perangkat: number } | null> {
  const endpoint = endpointTersimpan();
  if (!endpoint) return null;
  try {
    const jawab = await statusNotifikasiWali(endpoint);
    return { terdaftar: Boolean(jawab.terdaftar), perangkat: Number(jawab.perangkat ?? 0) };
  } catch {
    return null;
  }
}

/** Kirim satu notifikasi uji coba ke perangkat ini. */
export async function ujiPush(): Promise<HasilPush> {
  const endpoint = endpointTersimpan();
  if (!endpoint) {
    return { ok: false, pesan: "Perangkat ini belum terdaftar. Aktifkan notifikasi terlebih dahulu." };
  }
  try {
    const jawab = await fetch("/api/push/uji", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    const data = await jawab.json().catch(() => ({}));
    if (!jawab.ok) return { ok: false, pesan: data.pesan ?? `Gagal mengirim notifikasi uji (${jawab.status}).` };
    return { ok: true, pesan: "Notifikasi uji sudah dikirim. Cek layar HP Anda (bisa juga saat aplikasi sedang ditutup)." };
  } catch {
    return { ok: false, pesan: "Tidak bisa menghubungi layanan notifikasi. Periksa sambungan lalu coba lagi." };
  }
}

/**
 * Beri tahu layanan postingan terbaru. Bila berbeda dari yang terakhir
 * dikirim, layanan mengirim notifikasi push ke semua perangkat.
 */
export async function laporPostinganTerbaru(): Promise<{ baru: boolean; kirim?: number } & Partial<HasilPush>> {
  const terbaru = daftarNotifikasiPostingan(1)[0];
  if (!terbaru) return { baru: false };
  try {
    const jawab = await fetch("/api/push/cek", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...terbaru, tautan: tautanNotifikasi(terbaru) }),
    });
    if (!jawab.ok) return { baru: false };
    const data = await jawab.json();
    return { baru: Boolean(data.baru), kirim: Number(data.terkirim ?? 0) };
  } catch {
    return { baru: false };
  }
}

/** Ringkasan layanan notifikasi (jumlah perangkat terdaftar & kiriman terakhir). */
export async function statusPush(): Promise<{ perangkat: number; terakhir: { judul?: string; dikirim?: string } | null } | null> {
  try {
    const jawab = await fetch("/api/push/status", { headers: { Accept: "application/json" } });
    if (!jawab.ok) return null;
    return await jawab.json();
  } catch {
    return null;
  }
}

/** Matikan langganan perangkat ini. */
export async function matikanPush(): Promise<void> {
  const endpoint = endpointTersimpan();
  if (!endpoint) return;
  try {
    await fetch("/api/push/hapus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    /* diabaikan */
  }
  simpanEndpoint(null);
}
