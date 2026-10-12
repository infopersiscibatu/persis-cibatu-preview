import { useEffect, useMemo, useRef, useState } from "react";
import JudulSeksi from "../components/JudulSeksi";
import { Icon } from "../components/Icons";
import { SEMUA_KATEGORI, fotoTampil, useGaleri } from "../lib/galeri";
import TombolBagikan from "../components/TombolBagikan";

const ikon = "h-[18px] w-[18px]";

export function HalamanGaleri({ sasaran }: { sasaran?: string | null }) {
  const g = useGaleri();
  const [album, setAlbum] = useState<string>(SEMUA_KATEGORI);
  const [indeks, setIndeks] = useState<number | null>(null);
  const daftar = useMemo(() => fotoTampil(g, album), [g, album]);
  const lapisan = useRef(false);
  const sudahDibuka = useRef<string | null>(null);
  const kategori = g.kategori.filter((k) => k.aktif);
  const namaAlbum = album === SEMUA_KATEGORI ? "Semua Kegiatan" : (kategori.find((k) => k.id === album)?.nama ?? album);
  const jumlahFoto = g.foto.filter((f) => f.aktif).length;

  const buka = (i: number) => {
    if (!lapisan.current) {
      lapisan.current = true;
      window.history.pushState({ popup: true }, "", window.location.hash);
    }
    setIndeks(i);
  };

  const tutup = () => {
    setIndeks(null);
    if (lapisan.current) {
      lapisan.current = false;
      window.history.back();
    }
  };

  const geser = (arah: number) =>
    setIndeks((l) => (l === null ? l : (l + arah + daftar.length) % daftar.length));

  useEffect(() => {
    if (indeks === null) return;
    const saatTombol = (e: KeyboardEvent) => {
      if (e.key === "Escape") tutup();
      if (e.key === "ArrowRight") geser(1);
      if (e.key === "ArrowLeft") geser(-1);
    };
    const saatKembali = () => {
      lapisan.current = false;
      setIndeks(null);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", saatTombol);
    window.addEventListener("popstate", saatKembali);
    return () => {
      document.removeEventListener("keydown", saatTombol);
      window.removeEventListener("popstate", saatKembali);
      document.body.style.overflow = overflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indeks, daftar.length]);

  const fotoAktif = indeks === null ? null : daftar[indeks];

  useEffect(() => {
    if (!sasaran || sudahDibuka.current === sasaran || !g.dariDatabase) return;
    const semua = fotoTampil(g, SEMUA_KATEGORI);
    const i = semua.findIndex((f) => f.id === sasaran);
    if (i < 0) return;
    sudahDibuka.current = sasaran;
    setAlbum(SEMUA_KATEGORI);
    buka(i);
  }, [sasaran, g]);

  return (
    <main data-testid="galeri-page">
      <section aria-label="Gambar galeri" className="relative h-[208px] w-full">
        <img
          src={g.gambar.url}
          alt={g.gambar.alt}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-persis-950/95 via-persis-950/55 to-persis-950/15" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-5 text-center">
          <p className="text-[9px] font-bold tracking-[0.2em] text-gold-300 uppercase">PC PERSIS Cibatu</p>
          <h1 className="mt-1.5 text-[20px] leading-tight font-extrabold text-white">{g.halaman.judul}</h1>
          <p className="mt-1.5 text-[10px] font-semibold tracking-[0.16em] text-white/70 uppercase">
            {jumlahFoto} Foto · {kategori.length} Album
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        {g.halaman.pengantar ? (
          <section aria-label="Pengantar galeri" className="px-5 pt-5">
            <p className="text-justify text-[12.5px] leading-relaxed text-ink-600">{g.halaman.pengantar}</p>
          </section>
        ) : null}

        <section aria-label="Album galeri" className="px-5 pt-5">
          <ul className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {[SEMUA_KATEGORI, ...kategori.map((k) => k.id)].map((a) => {
              const aktif = a === album;
              const jumlah = fotoTampil(g, a).length;
              const label = a === SEMUA_KATEGORI ? SEMUA_KATEGORI : (g.kategori.find((k) => k.id === a)?.nama ?? a);
              return (
                <li key={a} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={aktif}
                    onClick={() => {
                      setAlbum(a);
                      setIndeks(null);
                    }}
                    className={`rounded-full px-3.5 py-2 text-[11px] font-bold whitespace-nowrap transition active:scale-95 ${
                      aktif ? "bg-persis-900 text-white" : "border border-black/[0.08] bg-white text-persis-900"
                    }`}
                  >
                    {label}
                    <span className={`ml-1.5 text-[10px] font-semibold ${aktif ? "text-white/70" : "text-ink-400"}`}>
                      {jumlah}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-label="Kisi foto galeri" className="px-5 pt-5">
          <JudulSeksi
            icon={<Icon name="image" className={ikon} />}
            eyebrow={album === SEMUA_KATEGORI ? "Dokumentasi" : "Album"}
            title={namaAlbum}
            actionLabel={null}
          />
          <ul className="grid grid-cols-2 gap-2.5">
            {daftar.map((f, i) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => buka(i)}
                  aria-label={`Buka foto: ${f.judul}`}
                  className="group block w-full overflow-hidden rounded-2xl border border-black/[0.08] bg-white text-left transition active:scale-[0.98]"
                >
                  <span className="relative block aspect-[4/3] w-full">
                    <img src={f.gambar} alt={f.judul} loading="lazy" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-persis-950/85 via-persis-950/20 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 block p-2.5">
                      <span className="block text-[8.5px] font-bold tracking-[0.12em] text-gold-300 uppercase">
                        {f.kategori}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[10.5px] leading-snug font-bold text-white">
                        {f.judul}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-2 px-2.5 py-2 text-[10px] font-semibold text-persis-900">
                    {f.tanggalTeks}
                    <span className="text-ink-400">Lihat foto</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {fotoAktif ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={fotoAktif.judul}
          data-testid="galeri-penampil"
          className="fade-in fixed inset-0 z-50 flex flex-col bg-persis-950/95 backdrop-blur-sm"
          onClick={tutup}
        >
          <div className="flex items-center justify-between px-4 pt-4 text-[11px] font-bold text-white/80">
            <span>
              {(indeks ?? 0) + 1} / {daftar.length} · {namaAlbum}
            </span>
            <button
              type="button"
              onClick={tutup}
              aria-label="Tutup penampil foto"
              data-testid="galeri-tutup"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition active:scale-95"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>

          <div
            className="flex flex-1 items-center justify-center px-3"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              e.currentTarget.dataset.x = String(e.changedTouches[0].clientX);
            }}
            onTouchEnd={(e) => {
              const awal = Number(e.currentTarget.dataset.x ?? 0);
              const akhir = e.changedTouches[0].clientX;
              if (Math.abs(akhir - awal) > 45) geser(akhir < awal ? 1 : -1);
            }}
          >
            <img
              src={fotoAktif.gambar}
              alt={fotoAktif.judul}
              data-testid="galeri-gambar"
              className="h-[44vh] max-h-[420px] w-full rounded-2xl bg-persis-900/50 object-cover"
            />
          </div>

          <div className="px-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl border-l-[3px] border-l-gold-500 bg-white p-3.5">
              <p className="text-[9px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                {fotoAktif.kategori} · {fotoAktif.tanggalTeks}
              </p>
              <p className="mt-1 text-[12.5px] leading-snug font-bold text-ink-900">{fotoAktif.judul}</p>
              <TombolBagikan konten={{ judul: fotoAktif.judul, ringkasan: `${fotoAktif.kategori} · ${fotoAktif.tanggalTeks}`, gambar: fotoAktif.gambar, jalur: `/#/galeri/${fotoAktif.id}` }} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => geser(-1)}
                aria-label="Foto sebelumnya"
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/25 py-2.5 text-[11.5px] font-bold text-white transition active:scale-[0.98]"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => geser(1)}
                aria-label="Foto berikutnya"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white py-2.5 text-[11.5px] font-bold text-persis-900 transition active:scale-[0.98]"
              >
                Berikutnya
              </button>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-white/60">
              <Icon name="map-pin" className="h-3 w-3" />
              Geser foto atau ketuk tombol untuk berpindah
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default HalamanGaleri;
