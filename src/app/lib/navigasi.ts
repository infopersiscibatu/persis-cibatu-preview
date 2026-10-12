/**
 * Perpindahan halaman di dalam situs.
 *
 * Situs ini membaca perubahan alamat dari peristiwa popstate (lihat App.tsx), jadi
 * setiap kali alamat diubah dari dalam komponen, peristiwanya dikabarkan sendiri.
 */
export function bukaHalaman(hash: string): void {
  if (!hash) return;
  window.location.hash = hash;
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0 });
}
