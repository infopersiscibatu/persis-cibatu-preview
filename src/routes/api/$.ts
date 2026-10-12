import { createFileRoute } from "@tanstack/react-router";

/**
 * Semua alamat /api/* dari aplikasi asli dilayani oleh kode server lama
 * (src/legacy-api) yang kini memakai database & penyimpanan Lovable Cloud.
 */
async function teruskan({ request }: { request: Request }) {
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
