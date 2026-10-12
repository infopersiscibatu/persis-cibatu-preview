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

function Index() {
  return (
    <ClientOnly fallback={<div className="min-h-screen" />}>
      <Suspense fallback={<div className="min-h-screen" />}>
        <AppPersis />
      </Suspense>
    </ClientOnly>
  );
}
