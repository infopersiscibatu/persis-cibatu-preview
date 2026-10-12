import { createElement, type SVGProps } from "react";
import { bentukIkon } from "./bentukIkon";

/** Nama ikon yang dipakai di seluruh aplikasi. */
export type IconName =
  | "bell"
  | "x"
  | "chevron-right"
  | "arrow-right"
  | "home"
  | "newspaper"
  | "clipboard"
  | "book-open"
  | "info"
  | "graduation-cap"
  | "users"
  | "user"
  | "megaphone"
  | "calendar"
  | "eye"
  | "flame"
  | "map-pin"
  | "phone"
  | "mail"
  | "clock"
  | "check"
  | "sparkle"
  | "image"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "youtube"
  | "wallet"
  | "shield"
  | "log-out"
  | "menu"
  | "school"
  | "award"
  | "plus"
  | "trash"
  | "pencil";

const padanan: Record<string, string> = {
  "chevron-right": "chevron",
  "arrow-right": "arrowRight",
  "book-open": "book",
  "graduation-cap": "grad",
  "map-pin": "pin",
  "log-out": "logout",
};

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.8,
  style,
}: {
  name: IconName | string;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  const bentuk = bentukIkon[padanan[name] ?? name] ?? bentukIkon.info;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      {bentuk.map((el, i) =>
        createElement(el.tag, {
          key: i,
          ...(Object.fromEntries(Object.entries(el).filter(([k]) => k !== "tag")) as SVGProps<SVGElement>),
        }),
      )}
    </svg>
  );
}
