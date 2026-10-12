import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { ambilStatistikAdmin } from "../../lib/admin";

/** Statistik panel admin — seluruh angka dihitung dari database. */

type Statistik = {
  diperbarui: string;
  konten: {
    berita: number;
    artikel: number;
    pengumuman: number;
    agenda: number;
    kajian: number;
    galeri: number;
    kategori: number;
  };
  lembaga: {
    sekolah: number;
    jenjang: number;
    siswa: number;
    mahasiswa: number;
    alumni: number;
    santri_aktif: number;
    angkatan_alumni: number;
  };
};

const ikon = "h-[18px] w-[18px]";

const angka = (n: number | undefined) => new Intl.NumberFormat("id-ID").format(Number(n ?? 0));

const waktu = (iso: string | undefined) => {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "-";
  }
};

type Kartu = {
  id: string;
  label: string;
  nilai: number;
  catatan: string;
  ikon: string;
  chip: string;
};

function KartuAngka({ kartu, memuat }: { kartu: Kartu; memuat: boolean }) {
  return (
    <article data-testid={`admin-kartu-${kartu.id}`} className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-black/[0.06] ${kartu.chip}`}
        >
          <Icon name={kartu.ikon} className={ikon} />
        </span>
        <span className="text-[9px] font-semibold tracking-[0.12em] text-ink-400 uppercase">Jumlah</span>
      </div>
      <p className="mt-2.5 text-[10.5px] leading-tight font-semibold text-ink-600">{kartu.label}</p>
      {memuat ? (
        <span className="mt-1.5 block h-[26px] w-16 animate-pulse rounded-lg bg-black/[0.07]" />
      ) : (
        <p
          data-testid={`admin-nilai-${kartu.id}`}
          className="font-header mt-1 text-[23px] leading-none font-extrabold text-persis-900"
        >
          {angka(kartu.nilai)}
        </p>
      )}
      <p className="mt-1.5 text-[10px] leading-relaxed text-ink-600">{kartu.catatan}</p>
    </article>
  );
}

function JudulKelompok({ judul, keterangan }: { judul: string; keterangan: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-header text-[13.5px] font-bold text-ink-900">{judul}</h2>
      <p className="mt-0.5 text-justify text-[11px] leading-relaxed text-ink-600">{keterangan}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<Statistik | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      setData((await ambilStatistikAdmin()) as Statistik);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Data statistik belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const kartuKonten: Kartu[] = [
    {
      id: "berita",
      label: "Berita",
      nilai: data?.konten.berita ?? 0,
      catatan: "tulisan terbit di halaman berita",
      ikon: "newspaper",
      chip: "bg-mint-100 text-persis-800",
    },
    {
      id: "artikel",
      label: "Artikel",
      nilai: data?.konten.artikel ?? 0,
      catatan: "artikel kajian & keislaman",
      ikon: "book-open",
      chip: "bg-cream-100 text-gold-600",
    },
    {
      id: "pengumuman",
      label: "Pengumuman",
      nilai: data?.konten.pengumuman ?? 0,
      catatan: "pengumuman resmi lembaga",
      ikon: "megaphone",
      chip: "bg-gold-500/12 text-gold-600",
    },
    {
      id: "agenda",
      label: "Agenda",
      nilai: data?.konten.agenda ?? 0,
      catatan: "kegiatan yang dijadwalkan",
      ikon: "calendar",
      chip: "bg-persis-900/[0.07] text-persis-900",
    },
  ];

  const kartuLembaga: Kartu[] = [
    {
      id: "sekolah",
      label: "Sekolah",
      nilai: data?.lembaga.sekolah ?? 0,
      catatan: `unit dari ${angka(data?.lembaga.jenjang)} jenjang`,
      ikon: "school",
      chip: "bg-mint-100 text-persis-800",
    },
    {
      id: "siswa",
      label: "Siswa",
      nilai: data?.lembaga.siswa ?? 0,
      catatan: "RA · MI · MDT · MTs · MA",
      ikon: "users",
      chip: "bg-gold-500/12 text-gold-600",
    },
    {
      id: "mahasiswa",
      label: "Mahasiswa",
      nilai: data?.lembaga.mahasiswa ?? 0,
      catatan: "Perguruan Tinggi PERSIS Cibatu",
      ikon: "graduation-cap",
      chip: "bg-cream-100 text-gold-600",
    },
    {
      id: "alumni",
      label: "Alumni",
      nilai: data?.lembaga.alumni ?? 0,
      catatan: `${angka(data?.lembaga.angkatan_alumni)} angkatan tercatat`,
      ikon: "award",
      chip: "bg-persis-900/[0.07] text-persis-900",
    },
  ];

  return (
    <div data-testid="admin-dashboard">
      {galat ? (
        <div
          data-testid="admin-galat"
          className="mt-4 rounded-2xl border border-rose-300/60 border-l-[3px] border-l-rose-400 bg-white p-3.5"
        >
          <p className="text-[11.5px] font-semibold text-ink-900">Data statistik belum bisa dimuat</p>
          <p className="mt-1 text-justify text-[10.5px] leading-relaxed text-ink-600">{galat}</p>
        </div>
      ) : null}

      <section aria-label="Statistik konten" className="pt-5">
        <JudulKelompok
          judul="Statistik Konten"
          keterangan="Jumlah berita, artikel, pengumuman, dan agenda yang sudah dimuat di situs."
        />
        <div className="grid grid-cols-2 gap-3">
          {kartuKonten.map((k) => (
            <KartuAngka key={k.id} kartu={k} memuat={memuat && !data} />
          ))}
        </div>
      </section>

      <section aria-label="Statistik lembaga" className="pt-7">
        <JudulKelompok
          judul="Statistik Lembaga"
          keterangan="Jumlah sekolah, siswa, mahasiswa, dan alumni yang tercatat pada lembaga."
        />
        <div className="grid grid-cols-2 gap-3">
          {kartuLembaga.map((k) => (
            <KartuAngka key={k.id} kartu={k} memuat={memuat && !data} />
          ))}
        </div>
      </section>

      <p className="mt-6 text-center text-[10px] leading-relaxed text-ink-400">
        Angka diambil langsung dari database. Terakhir diperbarui {waktu(data?.diperbarui)}.
      </p>
    </div>
  );
}
