import JudulSeksi from "../components/JudulSeksi";
import { Icon } from "../components/Icons";
import { inisial } from "../data/content";
import { useProfil } from "../lib/profil";

const ikon = "h-[18px] w-[18px]";

export default function Profil() {
  const { identitas, pengurus, profil } = useProfil();
  const kontak = [
    { icon: "map-pin", teks: identitas.alamat, rata: true },
    { icon: "phone", teks: `${identitas.telepon} · WA ${identitas.whatsapp}` },
    { icon: "mail", teks: identitas.email, putus: true },
    { icon: "clock", teks: identitas.jam },
  ];

  return (
    <main data-testid="profil-page">
      <section aria-label="Gambar profil" className="relative h-[258px] w-full">
        <img src={profil.image} alt={profil.imageAlt} className="h-full w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-persis-950/95 via-persis-950/55 to-persis-950/15" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-7 text-center">
          <img src={identitas.logo} alt="" className="h-[54px] w-[54px] object-contain" draggable={false} />
          <p className="mt-2.5 text-[9px] font-bold tracking-[0.2em] text-gold-300 uppercase">{identitas.pimpinan}</p>
          <h1 className="mt-1.5 text-[18px] leading-tight font-extrabold text-white">{identitas.namaLengkap}</h1>
          <p className="mt-1 text-[9.5px] font-semibold tracking-[0.18em] text-white/65 uppercase">
            {identitas.wilayahLengkap}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label="Profil singkat" className="px-5 pt-7">
          <JudulSeksi eyebrow="Tentang Kami" title="Profil Singkat" actionLabel={null} />
          <div className="space-y-2.5">
            {profil.summary.map((p) => (
              <p key={p} className="text-justify text-[12.5px] leading-relaxed text-ink-600">
                {p}
              </p>
            ))}
          </div>
        </section>

        <section aria-label="Semboyan" className="px-5 pt-7">
          <blockquote className="card-elev card-accent relative rounded-3xl px-6 py-6">
            <span className="pointer-events-none absolute -top-10 -right-8 h-[104px] w-[104px] rounded-full bg-mint-100/80" />
            <span className="pointer-events-none absolute -bottom-12 -left-6 h-24 w-24 rounded-full bg-cream-200" />
            <span className="pointer-events-none absolute right-[-1rem] bottom-2 h-12 w-12 rounded-full bg-gold-300/50" />
            <p className="relative text-center text-[15px] leading-relaxed font-extrabold text-persis-900">
              {profil.motto}
            </p>
          </blockquote>
        </section>

        <section aria-label="Visi" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="eye" className={ikon} />}
            eyebrow="Arah Gerak"
            title="Visi"
            actionLabel={null}
          />
          <div className="card-elev rounded-2xl p-4">
            <p className="text-justify text-[12.5px] leading-relaxed font-semibold text-persis-800">{profil.visi}</p>
          </div>
        </section>

        <section aria-label="Misi" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="sparkle" className={ikon} />}
            eyebrow="Langkah Nyata"
            title="Misi"
            tone="gold"
            actionLabel={null}
          />
          <ol className="space-y-2.5">
            {profil.misi.map((m, i) => (
              <li key={m} className="card-elev flex items-center gap-3 rounded-2xl p-3.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-persis-800 text-[11px] font-extrabold text-white">
                  {i + 1}
                </span>
                <p className="text-justify text-[12px] leading-relaxed text-ink-600">{m}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Susunan pengurus" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="users" className={ikon} />}
            eyebrow={profil.periode}
            title="Susunan Pengurus"
            actionLabel={null}
          />
          <ul className="card-elev divide-y divide-black/[0.06] overflow-hidden rounded-2xl">
            {pengurus.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3.5 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint-100 text-[12px] font-extrabold text-persis-800">
                  {inisial(p.nama)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] leading-snug font-bold text-ink-900">{p.nama}</span>
                  <span className="mt-1 block text-[9.5px] font-bold tracking-[0.12em] text-persis-900 uppercase">
                    {p.jabatan}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Informasi sekretariat" className="px-5 pt-8">
          <JudulSeksi
            icon={<Icon name="map-pin" className={ikon} />}
            eyebrow="Layanan Jamaah"
            title="Informasi Sekretariat"
            tone="gold"
            actionLabel={null}
          />
          <div className="card-elev space-y-3 rounded-2xl p-4">
            {kontak.map((k) => (
              <p
                key={k.teks}
                className={`flex gap-2.5 text-[11.5px] leading-relaxed text-ink-600 ${
                  k.rata ? "text-justify" : "items-center"
                }`}
              >
                <Icon name={k.icon} className={`${k.rata ? "mt-0.5" : ""} h-[15px] w-[15px] shrink-0 text-gold-600`} />
                <span className={k.putus ? "break-all" : ""}>{k.teks}</span>
              </p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
