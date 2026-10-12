import { sosialTampil, useBeranda } from "../lib/beranda";
import { Icon } from "./Icons";
import { useProfil } from "../lib/profil";

export default function Footer() {
  const { identitas } = useProfil();
  const sosial = sosialTampil(useBeranda());

  return (
    <footer id="kontak" className="bg-persis-900 text-white">
      <div
        className="mx-auto w-full max-w-[620px] px-4 pt-8"
        style={{ paddingBottom: "calc(5.625rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col items-center text-center">
          <img src={identitas.logo} alt="" className="h-[62px] w-[62px] object-contain" draggable={false} />
          <p className="mt-3 text-[9px] font-bold tracking-[0.2em] text-gold-300 uppercase">{identitas.pimpinan}</p>
          <p className="mt-1.5 text-[16px] leading-tight font-bold text-white">{identitas.namaLengkap}</p>
          <p className="mt-1.5 text-[10px] font-semibold tracking-[0.22em] text-white/55 uppercase">
            {identitas.wilayahLengkap}
          </p>
        </div>

        <div className="mt-6 space-y-2.5 text-[11.5px] leading-relaxed text-white/70">
          <p className="flex gap-2.5">
            <Icon name="map-pin" className="mt-0.5 h-[15px] w-[15px] shrink-0 text-gold-400" />
            <span className="text-justify">{identitas.alamat}</span>
          </p>
          <p className="flex items-center gap-2.5">
            <Icon name="phone" className="h-[15px] w-[15px] shrink-0 text-gold-400" />
            <span>
              {identitas.telepon} · WA {identitas.whatsapp}
            </span>
          </p>
          <p className="flex items-center gap-2.5">
            <Icon name="mail" className="h-[15px] w-[15px] shrink-0 text-gold-400" />
            <span className="break-all">{identitas.email}</span>
          </p>
          <p className="flex items-center gap-2.5">
            <Icon name="clock" className="h-[15px] w-[15px] shrink-0 text-gold-400" />
            <span>{identitas.jam}</span>
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-2.5">
          {sosial.map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={s.nama}
              data-testid={`footer-sosial-${s.id}`}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.12] bg-white/[0.08] text-white transition active:bg-white/[0.18]"
            >
              <Icon name={s.ikon} className="h-[19px] w-[19px]" />
            </a>
          ))}
        </div>

        <p className="mt-7 text-center text-[10.5px] text-white/55">
          © {new Date().getFullYear()} {identitas.namaLengkap}. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
