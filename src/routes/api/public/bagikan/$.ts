import { createFileRoute } from "@tanstack/react-router";
import { tujuanBagikan } from "@/app/lib/tautanBagikan";
import { dariBawaan, dariJawaban, endpointBagikan, halamanPratinjau } from "@/lib/pratinjauBagikan";

/** HTML is readable without JavaScript; readers continue to the original hash page. */
export const Route = createFileRoute("/api/public/bagikan/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const jalur = params._splat ?? "";
        const endpoint = endpointBagikan(jalur);
        const tujuan = tujuanBagikan(jalur);
        if (!endpoint || !tujuan) return Response.redirect(new URL("/", request.url).href, 302);
        // Readers must always reach the content, even when the preview lookup fails.
        const lanjut = () => new Response(null, { status: 302, headers: { location: new URL(tujuan.hash, request.url).href, "cache-control": "no-store" } });
        let data;
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            // Reuse existing public read handlers; never query private records here.
            const { tangani } = await import("@/legacy-api/index.js");
            const response = await tangani(new Request(new URL(endpoint, request.url)));
            if (!response.ok) throw new Error(`Layanan konten menjawab ${response.status}`);
            data = dariJawaban(jalur, await response.json());
          } catch (error) {
            console.error("Pratinjau bagikan gagal:", error);
            return lanjut();
          }
        } else {
          data = dariBawaan(jalur);
        }
        if (!data) return lanjut();
        const url = new URL(request.url);
        url.search = "";
        url.hash = "";
        // Only the sandbox proxy supplies a sanitized public host here.
        const host = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
        if (host && /^[a-z0-9.-]+(?::\d+)?$/i.test(host)) { url.host = host; url.protocol = "https:"; }
        return new Response(halamanPratinjau(data, url.href), {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60", "x-content-type-options": "nosniff" },
        });
      },
    },
  },
});