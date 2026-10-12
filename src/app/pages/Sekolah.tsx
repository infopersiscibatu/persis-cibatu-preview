import JudulSeksi from "../components/JudulSeksi";
import { Icon } from "../components/Icons";
import { useJenjang } from "../lib/jenjang";

const ikon = "h-[18px] w-[18px]";

/** Halaman detail unit pendidikan (sekolah/madrasah/kampus). */
export function HalamanSekolah({
  jenjangSlug,
  slug,
  onBukaUnit,
}: {
  jenjangSlug: string;
  slug: string;
  onBukaUnit: (slug: string) => void;
}) {
  const data = useJenjang();
  const j = data.jenjang.find((o) => o.slug === jenjangSlug);
  const u = data.unit.find((o) => o.slug === slug);
  if (!j || !u) return null;

  const programs = data.jurusan.filter((p) => p.jenjangSlug === jenjangSlug && u.jurusan.includes(p.slug));
  const lainnya = data.unit.filter((o) => o.jenjangSlug === jenjangSlug && o.slug !== slug);
  const fasilitas = u.fasilitas.length > 0 ? u.fasilitas : j.fasilitas;
  const sekilas =
    j.slug === "pt"
      ? `${u.nama} adalah unit perguruan tinggi di bawah pembinaan PC PERSIS Cibatu yang berkedudukan di ${u.daerah}, Kecamatan Cibatu. Mahasiswa menempuh perkuliahan dengan bimbingan para dosen, dilengkapi praktik lapangan, kajian ilmiah, dan pembinaan tahfizh di asrama mahasiswa.`
      : j.slug === "mdt"
        ? `${u.nama} adalah pendidikan diniyyah sore hari di bawah pembinaan PC PERSIS Cibatu, berkedudukan di ${u.daerah}, Kecamatan Cibatu. Santri mempelajari dasar Al-Qur'an, fikih, akidah, akhlak, dan bahasa Arab dengan metode bandungan serta sorogan sebagai pelengkap pendidikan formal.`
        : `${u.nama} merupakan unit pendidikan ${j.nama} di bawah pembinaan PC PERSIS Cibatu. Berdiri sejak tahun ${u.berdiri}, sekolah ini melayani keluarga di ${u.daerah} dan sekitarnya dengan pembinaan akhlak, ibadah, dan akademik bersama pengurus cabang serta komite sekolah.`;

  const labelAkreditasi =
    String(u.akreditasi) === "Program Khusus" ? String(u.akreditasi) : `Akreditasi ${u.akreditasi}`;

  const identitas: [string, string][] = [
    [j.pimpinan, u.pimpinan],
    [j.istilah.kode, u.npsn],
    ["Status", u.status || j.istilah.status],
    ["Akreditasi", labelAkreditasi],
    ["Tahun berdiri", String(u.berdiri)],
    [j.istilah.rombel, String(u.rombel)],
    [j.istilah.peserta, `${u.siswa} ${j.satuan}`],
    [j.istilah.pengajar, u.staf > 0 ? `${u.guru} ${j.istilah.pengajarTunggalKecil} · ${u.staf} staf` : `${u.guru} orang`],
  ];

  const peta = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(u.alamat)}`;

  return (
    <main data-testid="sekolah-page">
      <section aria-label={`Gambar ${u.nama}`} className="relative h-[200px] w-full">
        <img src={u.gambar} alt={`Suasana ${u.nama}`} className="h-full w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-persis-950/95 via-persis-950/55 to-persis-950/15" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-5 text-center">
          <h1 className="text-[18px] leading-tight font-extrabold text-white">{u.nama}</h1>
          <p className="mt-1.5 text-[10.5px] font-medium text-white/80">
            {j.nama} · {u.daerah}, Cibatu
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[620px] pb-7">
        <section aria-label={`Sekilas ${u.nama}`} className="px-5 pt-6">
          <p className="text-justify text-[12.5px] leading-relaxed text-ink-600">{sekilas}</p>
        </section>

        <section aria-label={`Identitas ${j.istilah.unit}`} className="px-5 pt-7">
          <JudulSeksi
            icon={<Icon name="info" className={ikon} />}
            eyebrow="Data Pokok"
            title={j.istilah.identitas}
            actionLabel={null}
          />
          <dl className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
            {identitas.map(([label, nilai]) => (
              <div key={label} className="flex items-start justify-between gap-4 px-4 py-2.5">
                <dt className="text-[11px] leading-snug text-persis-900">{label}</dt>
                <dd className="text-right text-[11.5px] leading-snug font-semibold text-ink-900">{nilai}</dd>
              </div>
            ))}
          </dl>
        </section>

        {programs.length > 0 ? (
          <section aria-label={`${j.istilah.jurusan} di ${j.istilah.unit} ini`} className="px-5 pt-7">
            <JudulSeksi
              icon={<Icon name="book-open" className={ikon} />}
              eyebrow="Pilihan Belajar"
              title={j.istilah.jurusan}
              actionLabel={null}
            />
            <div className="space-y-3">
              {programs.map((p) => (
                <article
                  key={p.id}
                  data-testid={`sekolah-jurusan-${p.slug}`}
                  className="rounded-2xl border border-black/[0.08] border-l-[3px] border-l-gold-500 bg-white p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-persis-700/10 bg-mint-100 text-[10.5px] font-extrabold text-persis-800">
                      {p.short}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] leading-snug font-extrabold text-ink-900">{p.nama}</h3>
                      <p className="mt-0.5 text-[10.5px] text-persis-900">
                        {j.istilah.jurusan} · {u.nama}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2.5 text-justify text-[11.5px] leading-relaxed text-ink-600">{p.intro}</p>
                  {p.ukt ? (
                    <p className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-gold-400/30 bg-cream-100 px-3 py-2">
                      <span className="text-[10px] font-bold tracking-[0.12em] text-persis-900 uppercase">UKT</span>
                      <span className="text-[11.5px] font-bold text-persis-800">{p.ukt}</span>
                    </p>
                  ) : null}
                  <p className="mt-2.5 text-[10px] font-bold tracking-[0.14em] text-persis-900 uppercase">
                    {j.istilah.materi}
                  </p>
                  <ul className="mt-1 divide-y divide-black/[0.06]">
                    {p.fokus.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 py-2">
                        <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-gold-600" />
                        <span className="text-[11px] text-ink-900">{f}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-label={`Fasilitas ${j.istilah.unit}`} className="px-5 pt-7">
          <JudulSeksi
            icon={<Icon name="graduation-cap" className={ikon} />}
            eyebrow="Sarana"
            title="Fasilitas"
            actionLabel={null}
          />
          <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
            {fasilitas.map((f) => (
              <li key={f} className="flex items-center gap-3 px-4 py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-persis-700/10 bg-mint-100 text-persis-800">
                  <Icon name="check" className="h-[15px] w-[15px]" />
                </span>
                <span className="text-[11.5px] text-ink-900">{f}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label={j.istilah.kegiatan} className="px-5 pt-7">
          <JudulSeksi
            icon={<Icon name="sparkle" className={ikon} />}
            eyebrow="Pembinaan"
            title={j.istilah.kegiatan}
            actionLabel={null}
          />
          <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
            {u.ekstra.map((e) => (
              <li key={e} className="flex items-center gap-3 px-4 py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gold-400/30 bg-cream-100 text-gold-600">
                  <Icon name="sparkle" className="h-[15px] w-[15px]" />
                </span>
                <span className="text-[11.5px] text-ink-900">{e}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Lokasi dan kontak" className="px-5 pt-7">
          <JudulSeksi
            icon={<Icon name="map-pin" className={ikon} />}
            eyebrow="Kunjungi"
            title="Lokasi & Kontak"
            actionLabel={null}
          />
          <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
            <li className="flex items-start gap-3 px-4 py-3">
              <Icon name="map-pin" className="mt-0.5 h-[15px] w-[15px] shrink-0 text-gold-600" />
              <span className="text-justify text-[11.5px] leading-relaxed text-ink-600">{u.alamat}</span>
            </li>
            <li className="flex items-start gap-3 px-4 py-3">
              <Icon name="phone" className="mt-0.5 h-[15px] w-[15px] shrink-0 text-gold-600" />
              <span className="text-[11.5px] leading-relaxed text-ink-600">
                <a href={`tel:${u.kontak.replace(/-/g, "")}`} className="font-semibold text-persis-900">
                  {u.kontak}
                </a>{" "}
                (telepon &amp; WhatsApp)
              </span>
            </li>
            <li className="flex items-start gap-3 px-4 py-3">
              <Icon name="mail" className="mt-0.5 h-[15px] w-[15px] shrink-0 text-gold-600" />
              <a href={`mailto:${u.email}`} className="text-[11.5px] font-semibold text-persis-900">
                {u.email}
              </a>
            </li>
            <li className="flex items-start gap-3 px-4 py-3">
              <Icon name="clock" className="mt-0.5 h-[15px] w-[15px] shrink-0 text-gold-600" />
              <span className="text-[11.5px] leading-relaxed text-ink-600">{u.jam}</span>
            </li>
          </ul>
          <a
            href={peta}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-persis-900/20 bg-white py-3 text-[12.5px] font-bold text-persis-900 transition active:scale-[0.98]"
          >
            <Icon name="map-pin" className="h-4 w-4" />
            Buka di Google Maps
          </a>
        </section>

        {lainnya.length > 0 ? (
          <section aria-label="Unit lain di jenjang ini" className="px-5 pt-7">
            <JudulSeksi
              icon={<Icon name="book-open" className={ikon} />}
              eyebrow="Satu Jenjang"
              title={`${j.istilah.unitLain} di ${j.short}`}
              actionLabel={null}
            />
            <ul className="space-y-2.5">
              {lainnya.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => onBukaUnit(b.slug)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-black/[0.08] bg-white p-3 text-left transition active:scale-[0.99]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-persis-700/10 bg-mint-100 text-persis-800">
                      <Icon name="graduation-cap" className="h-[17px] w-[17px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] leading-snug font-bold text-ink-900">{b.nama}</span>
                      <span className="mt-0.5 block text-[10.5px] text-ink-600">{b.daerah}, Cibatu</span>
                    </span>
                    <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-ink-400" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

      </div>
    </main>
  );
}
