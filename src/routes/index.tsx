import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AppPersis = lazy(() => import("@/app/App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PC PERSIS Cibatu — Pimpinan Cabang Persatuan Islam Cibatu, Garut" },
      {
        name: "description",
        content:
          "Website resmi Pimpinan Cabang Persatuan Islam (PERSIS) Cibatu, Garut. Informasi jenjang pendidikan, PPDB, kajian, agenda, dan berita.",
      },
      { property: "og:title", content: "PC PERSIS Cibatu" },
      {
        property: "og:description",
        content: "Website resmi PC PERSIS Cibatu, Garut: pendidikan, PPDB, kajian, agenda, dan berita.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/* Layar sebelum aplikasi siap: sama dengan layar Memuat Data situs, sehingga
   layar pembuka sistem HP menyatu mulus ke layar memuat tanpa kedipan putih. */
function LayarKosong() {
  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-3.5 bg-persis-900 px-8 text-center text-white">
      <img
        src="/logo-persis.png"
        alt="Logo Persatuan Islam (PERSIS)"
        className="h-24 w-24 rounded-full object-contain"
        draggable={false}
      />
      <p className="font-header mt-1 text-[15px] leading-tight font-extrabold tracking-[0.01em]">Memuat Data</p>
      <span className="mt-1.5 flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 0.16}s` }}
            className="muat-titik block h-1.5 w-1.5 rounded-full bg-gold-300"
          />
        ))}
      </span>
    </div>
  );
}

function Index() {
  return (
    <ClientOnly fallback={<LayarKosong />}>
      <Suspense fallback={<LayarKosong />}>
        <AppPersis />
      </Suspense>
    </ClientOnly>
  );
}
