export type BentukIkon = { tag: string; [k: string]: string };

/** Bentuk ikon PC PERSIS Cibatu — sama persis dengan ikon pada situs rujukan. */
export const bentukIkon: Record<string, BentukIkon[]> = {
  logout: [
    { tag: "path", d: "M14.5 4.8h2.7A1.8 1.8 0 0 1 19 6.6v10.8a1.8 1.8 0 0 1-1.8 1.8h-2.7" },
    { tag: "path", d: "M9.5 8.2 13.3 12l-3.8 3.8" },
    { tag: "path", d: "M4.5 12h8.8" },
  ],
  menu: [
    { tag: "path", d: "M4 7h16" },
    { tag: "path", d: "M4 12h16" },
    { tag: "path", d: "M4 17h16" },
  ],
  school: [
    { tag: "path", d: "M3.5 9.6 12 4.6l8.5 5" },
    { tag: "path", d: "M5.6 10.6V20h12.8v-9.4" },
    { tag: "path", d: "M9.6 20v-5.2h4.8V20" },
  ],
  award: [
    { tag: "circle", cx: "12", cy: "9", r: "5" },
    { tag: "path", d: "m8.9 13.2-1.4 6.8L12 17.6l4.5 2.4-1.4-6.8" },
  ],
  bell: [
    { tag: "path", d: "M6 9a6 6 0 1 1 12 0c0 5 2.5 6.5 2.5 6.5h-17S6 14 6 9Z" },
    { tag: "path", d: "M10.3 19.5a1.9 1.9 0 0 0 3.4 0" },
  ],
  x: [
    { tag: "path", d: "M6 6l12 12M18 6 6 18" },
  ],
  plus: [
    { tag: "path", d: "M12 5.5v13" },
    { tag: "path", d: "M5.5 12h13" },
  ],
  trash: [
    { tag: "path", d: "M4.5 7h15" },
    { tag: "path", d: "M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" },
    { tag: "path", d: "M6.5 7l.9 12a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12" },
  ],
  pencil: [
    { tag: "path", d: "M4.5 19.5h4l10-10a1.8 1.8 0 0 0 0-2.5l-1.5-1.5a1.8 1.8 0 0 0-2.5 0l-10 10Z" },
    { tag: "path", d: "m14.5 6.5 3 3" },
  ],
  chevron: [
    { tag: "path", d: "m9 5.5 6.5 6.5L9 18.5" },
  ],
  home: [
    { tag: "path", d: "m3 10.5 9-7 9 7V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20Z" },
    { tag: "path", d: "M9.5 21.5v-7h5v7" },
  ],
  newspaper: [
    { tag: "path", d: "M4 6.5A2.5 2.5 0 0 1 6.5 4h9A2.5 2.5 0 0 1 18 6.5V19a1 1 0 0 0 2 0v-7" },
    { tag: "path", d: "M18 8h1.5A1.5 1.5 0 0 1 21 9.5V13" },
    { tag: "rect", x: "4", y: "4", width: "14", height: "16", rx: "2.5" },
    { tag: "path", d: "M7.5 8.5h7M7.5 12h7M7.5 15.5h4" },
  ],
  clipboard: [
    { tag: "rect", x: "4.5", y: "4", width: "15", height: "17", rx: "2.5" },
    { tag: "path", d: "M9 3.2h6v3H9zM8.5 11h7M8.5 15h4.5" },
  ],
  book: [
    { tag: "path", d: "M12 6.8C10.6 5.4 8.7 4.8 4.5 4.8v12.7c4.2 0 6.1.6 7.5 2 1.4-1.4 3.3-2 7.5-2V4.8c-4.2 0-6.1.6-7.5 2Z" },
    { tag: "path", d: "M12 6.8v12.7" },
  ],
  info: [
    { tag: "circle", cx: "12", cy: "12", r: "8.5" },
    { tag: "path", d: "M12 16.5V11" },
    { tag: "circle", cx: "12", cy: "8.2", r: "0.9", fill: "currentColor", stroke: "none" },
  ],
  wallet: [
    { tag: "path", d: "M3 7.5A2.5 2.5 0 0 1 5.5 5h11A2.5 2.5 0 0 1 19 7.5v.5" },
    { tag: "path", d: "M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5Z" },
    { tag: "path", d: "M16.5 13.5h.01" },
  ],
  shield: [
    { tag: "path", d: "M12 3.2l7 2.6v5.4c0 4.4-2.9 7.9-7 9.6-4.1-1.7-7-5.2-7-9.6V5.8Z" },
    { tag: "path", d: "m9 12 2.2 2.2L15.3 10" },
  ],
  heart: [
    { tag: "path", d: "M12 20.3 4.8 13a4.6 4.6 0 0 1 6.5-6.5l.7.7.7-.7A4.6 4.6 0 0 1 19.2 13Z" },
  ],
  grad: [
    { tag: "path", d: "M22 9.5 12 4.5 2 9.5l10 5 10-5Z" },
    { tag: "path", d: "M6 11.8v5.2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.2" },
    { tag: "path", d: "M22 9.5v5" },
  ],
  users: [
    { tag: "circle", cx: "9", cy: "8", r: "3.4" },
    { tag: "path", d: "M2.5 20.5c0-3.5 2.9-5.6 6.5-5.6s6.5 2.1 6.5 5.6" },
    { tag: "path", d: "M16.5 5.4a3.4 3.4 0 0 1 0 6.6M17.6 15.4c2.4.6 3.9 2.2 3.9 4.6" },
  ],
  megaphone: [
    { tag: "path", d: "M3 10.5 17 5.2v13.6L3 13.5z" },
    { tag: "path", d: "M3 10.5H2.2A1.2 1.2 0 0 0 1 11.7v1.6a1.2 1.2 0 0 0 1.2 1.2H3z" },
    { tag: "path", d: "M7.5 14.2v4.1a1.6 1.6 0 0 0 1.6 1.6h.9a1.2 1.2 0 0 0 1.2-1.4l-.5-3.2" },
    { tag: "path", d: "M20 10.2a3.4 3.4 0 0 1 0 3.6" },
  ],
  calendar: [
    { tag: "rect", x: "3.5", y: "5.5", width: "17", height: "15", rx: "2.5" },
    { tag: "path", d: "M3.5 10h17M8 3.5v3.6M16 3.5v3.6" },
  ],
  eye: [
    { tag: "path", d: "M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" },
    { tag: "circle", cx: "12", cy: "12", r: "3" },
  ],
  pin: [
    { tag: "path", d: "M12 21.5s7-6.4 7-11.6a7 7 0 1 0-14 0c0 5.2 7 11.6 7 11.6Z" },
    { tag: "circle", cx: "12", cy: "9.6", r: "2.6" },
  ],
  phone: [
    { tag: "path", d: "M6.6 3.5h3l1.4 3.6-2 1.4a11 11 0 0 0 5 4.9l1.4-2 3.6 1.4v3A1.7 1.7 0 0 1 17.2 19C10.4 18.6 5 13.2 4.6 6.4a1.7 1.7 0 0 1 2-2.9Z" },
  ],
  mail: [
    { tag: "rect", x: "3", y: "5.5", width: "18", height: "13", rx: "2.5" },
    { tag: "path", d: "m3.8 7.4 8.2 5.4 8.2-5.4" },
  ],
  clock: [
    { tag: "circle", cx: "12", cy: "12", r: "8.5" },
    { tag: "path", d: "M12 7.5V12l3 1.8" },
  ],
  user: [
    { tag: "circle", cx: "12", cy: "8", r: "4" },
    { tag: "path", d: "M4 21c0-4 3.6-6.2 8-6.2s8 2.2 8 6.2" },
  ],
  check: [
    { tag: "path", d: "m5 12.8 4.3 4.2L19 6.5" },
  ],
  sparkle: [
    { tag: "path", d: "m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" },
    { tag: "path", d: "M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" },
  ],
  image: [
    { tag: "rect", x: "3", y: "4.5", width: "18", height: "15", rx: "2.5" },
    { tag: "circle", cx: "8.6", cy: "10", r: "1.5" },
    { tag: "path", d: "m4 17.5 4.6-4.3a1.6 1.6 0 0 1 2.2 0L15 17l1.6-1.5a1.6 1.6 0 0 1 2.2 0L21 17.2" },
  ],
  instagram: [
    { tag: "rect", x: "3.5", y: "3.5", width: "17", height: "17", rx: "5" },
    { tag: "circle", cx: "12", cy: "12", r: "3.8" },
    { tag: "circle", cx: "16.9", cy: "7.1", r: "1", fill: "currentColor", stroke: "none" },
  ],
  facebook: [
    { tag: "path", d: "M13.4 21v-7.3h2.5l.4-3h-2.9V9c0-.9.3-1.5 1.6-1.5h1.5V4.8c-.7-.1-1.6-.2-2.5-.2-2.5 0-4.1 1.5-4.1 4.1v2h-2.4v3h2.4V21z", fill: "currentColor", stroke: "none" },
  ],
  youtube: [
    { tag: "rect", x: "2.5", y: "5.5", width: "19", height: "13", rx: "4" },
    { tag: "path", d: "m10.5 9.5 5 2.5-5 2.5z" },
  ],
  whatsapp: [
    { tag: "path", d: "M20.5 11.6a8.4 8.4 0 0 1-12.2 7.5L3.5 20.5l1.4-4.7A8.4 8.4 0 1 1 20.5 11.6Z" },
    { tag: "path", d: "M9 11.8h6M9 14.8h3.5" },
  ],
  arrowRight: [
    { tag: "path", d: "M4.5 12h15M13.5 6l6 6-6 6" },
  ],
  flame: [
    { tag: "path", d: "M12 3c.8 3.4 4.5 4.6 4.5 8.6a4.5 4.5 0 0 1-9 0c0-1.7.8-2.7 1.6-3.4.4.9 1 1.3 1.7 1.4-.2-2 .3-4.2 1.2-6.6Z" },
    { tag: "path", d: "M10.4 20.8h3.2" },
  ],
};
