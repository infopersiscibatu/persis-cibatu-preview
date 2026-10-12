import type { ReactNode } from "react";
import { Icon } from "./Icons";

export default function JudulSeksi({
  title,
  subtitle,
  eyebrow,
  icon,
  tone = "green",
  actionLabel = "Lihat semua",
  judulId,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: ReactNode;
  tone?: "green" | "gold";
  actionLabel?: string | null;
  judulId?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? (
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
              tone === "gold"
                ? "border-gold-400/30 bg-cream-100 text-gold-600"
                : "border-persis-700/10 bg-mint-100 text-persis-800"
            }`}
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[9.5px] font-bold tracking-[0.2em] text-persis-900 uppercase">{eyebrow}</p>
          ) : null}
          <h2
            id={judulId}
            className={`font-header truncate text-[15px] font-bold tracking-[-0.01em] text-ink-900 ${eyebrow ? "mt-1" : ""}`}
          >
            {title}
          </h2>
          {subtitle ? <p className="truncate text-[11.5px] text-persis-900">{subtitle}</p> : null}
        </div>
      </div>

      {actionLabel ? (
        <span className="inline-flex shrink-0 items-center gap-0.5 px-1 py-1 text-[11.5px] font-semibold text-persis-900">
          {actionLabel}
          <Icon name="chevron-right" className="h-3.5 w-3.5 text-gold-600" />
        </span>
      ) : null}
    </div>
  );
}
