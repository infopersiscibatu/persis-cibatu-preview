import { createFileRoute } from "@tanstack/react-router";

/**
 * Semua alamat /api/* dari aplikasi asli dilayani oleh kode server lama
 * (src/legacy-api) yang kini memakai database & penyimpanan Lovable Cloud.
 */
async function teruskan({ request }: { request: Request }) {
  // Mode pratinjau: tanpa database, aplikasi memakai data bawaan di src/app/data.
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ pesan: "Mode pratinjau: database belum terhubung." }, { status: 404 });
  }
  try {
    const { tangani } = await import("@/legacy-api/index.js");
    return await tangani(request);
  } catch (e) {
    console.error("Layanan /api gagal:", e);
    return Response.json({ pesan: "Layanan sedang bermasalah. Coba lagi sebentar." }, { status: 503 });
  }
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: teruskan,
      POST: teruskan,
      PUT: teruskan,
      PATCH: teruskan,
      DELETE: teruskan,
    },
  },
});
