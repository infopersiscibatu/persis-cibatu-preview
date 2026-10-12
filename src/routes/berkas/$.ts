import { createFileRoute } from "@tanstack/react-router";

/** Menampilkan foto/dokumen yang diunggah lewat halaman admin. */
export const Route = createFileRoute("/berkas/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const kunci = String(params._splat || "");
        if (!kunci || kunci.includes("..")) return new Response("Tidak ditemukan", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("media").download(kunci);
        if (error || !data) return new Response("Tidak ditemukan", { status: 404 });
        return new Response(data, {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
