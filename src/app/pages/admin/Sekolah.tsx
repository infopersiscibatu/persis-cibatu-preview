import { useEffect, useRef, useState } from "react";
import {
  Angka,
  AreaTeks,
  DaftarTeks,
  KepalaBorang,
  Kolom,
  Pesan,
  Pilih,
  PilihBanyak,
  Sakelar,
  TombolSimpan,
} from "../../components/admin/Form";
import { Icon } from "../../components/Icons";
import { istilahDariJenjang } from "../../lib/istilah";
import {
  hapusJurusan,
  hapusSekolah,
  tambahJurusan,
  tambahSekolah,
  ubahJurusan,
  ubahSekolah,
  unggahBerkas,
} from "../../lib/admin";
import { fotoBawaanJenjang, segarkanJenjang, useJenjang, type UnitTampil } from "../../lib/jenjang";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";

type Status = { tipe: "sukses" | "galat"; teks: string } | null;

/** Menyimpan lalu menyegarkan data jenjang/unit dari database. */
function pakaiSimpan() {
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<Status>(null);

  const jalankan = async (kerja: () => Promise<unknown>, sukses: string) => {
    setSibuk(true);
    setPesan(null);
    try {
      await kerja();
      await segarkanJenjang();
      /* Pemberitahuan singkat di atas layar, sedangkan kesalahan tetap tampil di borang. */
      beritahu("sukses", sukses);
      return true;
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menyimpan." });
      return false;
    } finally {
      setSibuk(false);
    }
  };

  return { sibuk, pesan, jalankan, setPesan };
}

/* ---------------------------- nama sekolah ---------------------------- */

type Borang = {
  id?: string;
  nama: string;
  jenjangSlug: string;
  status: string;
  akreditasi: string;
  npsn: string;
  berdiri: string;
  pimpinan: string;
  rombel: string;
  guru: string;
  staf: string;
  gambar: string;
  punyaJurusan: boolean;
  jurusan: string[];
  fasilitas: string[];
  ekstra: string[];
  alamat: string;
  daerah: string;
  kontak: string;
  email: string;
  jam: string;
  aktif: boolean;
};

function borangKosong(jenjangSlug: string): Borang {
  return {
    nama: "",
    jenjangSlug,
    status: "Swasta",
    akreditasi: "",
    npsn: "",
    berdiri: "",
    pimpinan: "",
    rombel: "",
    guru: "",
    gambar: "",
    staf: "",
    punyaJurusan: false,
    jurusan: [],
    fasilitas: [],
    ekstra: [],
    alamat: "",
    daerah: "",
    kontak: "",
    email: "",
    jam: "",
    aktif: true,
  };
}

function borangDari(u: UnitTampil): Borang {
  return {
    id: u.id,
    nama: u.nama,
    jenjangSlug: u.jenjangSlug,
    status: u.status || "Swasta",
    akreditasi: u.akreditasi,
    npsn: u.npsn,
    berdiri: u.berdiri,
    pimpinan: u.pimpinan,
    rombel: u.rombel ? String(u.rombel) : "",
    guru: u.guru ? String(u.guru) : "",
    gambar: u.gambarKhusus,
    staf: u.staf ? String(u.staf) : "",
    punyaJurusan: u.jurusan.length > 0,
    jurusan: u.jurusan,
    fasilitas: u.fasilitas.length > 0 ? u.fasilitas : [""],
    ekstra: u.ekstra.length > 0 ? u.ekstra : [""],
    alamat: u.alamat,
    daerah: u.daerah,
    kontak: u.kontak,
    email: u.email,
    jam: u.jam,
    aktif: u.aktif,
  };
}

const OPSI_STATUS = [
  { nilai: "Swasta", label: "Swasta" },
  { nilai: "Negeri", label: "Negeri" },
];

const OPSI_AKREDITASI = [
  { nilai: "", label: "Belum diisi" },
  { nilai: "A", label: "A (Unggul)" },
  { nilai: "B", label: "B (Baik)" },
  { nilai: "C", label: "C (Cukup)" },
  { nilai: "Baik Sekali", label: "Baik Sekali" },
  { nilai: "Terdaftar", label: "Terdaftar" },
];

export function NamaSekolah() {
  const data = useJenjang();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan();
  const [borang, setBorang] = useState<Borang | null>(null);

  const berkasRef = useRef<HTMLInputElement>(null);

  const jenjangDari = (slug: string) => data.jenjang.find((j) => j.slug === slug);
  const jurusanJenjang = data.jurusan.filter((p) => p.jenjangSlug === borang?.jenjangSlug);

  /* Data sekolah yang sedang dibuka, dibaca dari data terakhir. */
  const unitSaatIni = borang?.id ? data.unit.find((u) => u.id === borang.id) : undefined;
  const jenjangBorang = borang ? jenjangDari(borang.jenjangSlug) : undefined;
  const peserta = unitSaatIni?.siswa ?? 0;
  const alumni = unitSaatIni?.alumni ?? 0;
  const satuan = jenjangBorang?.satuan ?? "siswa";
  /* Penyebutan mengikuti jenjang unit: sekolah/madrasah atau kampus. */
  const kosa = istilahDariJenjang({ slug: jenjangBorang?.slug, nama: jenjangBorang?.nama });
  /* Foto yang ditampilkan: foto terpilih, foto tersimpan, atau foto bawaan jenjang. */
  const fotoTampil = (borang?.gambar ?? "").trim()
    ? borang!.gambar
    : unitSaatIni?.gambar || fotoBawaanJenjang(borang?.jenjangSlug ?? "");

  const pilihFoto = async (berkas: File | undefined) => {
    if (!berkas) return;
    if (berkas.size > 25 * 1024 * 1024) {
      setPesan({ tipe: "galat", teks: "Berkas terlalu besar. Batas maksimal 25 MB." });
      return;
    }
    await jalankan(async () => {
      const hasil = await unggahBerkas(berkas, "sekolah");
      setBorang((b) => (b ? { ...b, gambar: hasil.url } : b));
      if (borang?.id) await ubahSekolah(borang.id, { gambar_url: hasil.url });
    }, `Foto ${kosa.unit} tersimpan dan langsung dipakai.`);
  };

  const buka = (u: UnitTampil) => {
    setPesan(null);
    setBorang(borangDari(u));
  };

  const bukaBaru = () => {
    setPesan(null);
    setBorang(borangKosong(data.jenjang[0]?.slug ?? ""));
  };

  const tutup = () => setBorang(null);

  const ubah = (sebagian: Partial<Borang>) => setBorang((b) => (b ? { ...b, ...sebagian } : b));

  const simpan = async () => {
    if (!borang) return;
    const nama = borang.nama.trim();
    if (!nama) {
      setPesan({ tipe: "galat", teks: `Nama ${kosa.unit} tidak boleh kosong.` });
      return;
    }
    if (!borang.jenjangSlug) {
      setPesan({ tipe: "galat", teks: "Jenjang pendidikan belum dipilih." });
      return;
    }

    const muatan = {
      nama,
      jenjangSlug: borang.jenjangSlug,
      status: borang.status || "Swasta",
      akreditasi: borang.akreditasi,
      npsn: borang.npsn,
      berdiri: borang.berdiri,
      pimpinan: borang.pimpinan,
      rombel: borang.rombel,
      gambar_url: borang.gambar,
      guru: borang.guru,
      staf: borang.staf,
      jurusan: borang.punyaJurusan ? borang.jurusan : [],
      fasilitas: borang.fasilitas.filter((t) => t.trim() !== ""),
      ekstrakurikuler: borang.ekstra.filter((t) => t.trim() !== ""),
      alamat: borang.alamat,
      daerah: borang.daerah,
      kontak: borang.kontak,
      email: borang.email,
      jam: borang.jam,
      aktif: borang.aktif,
    };

    const idLama = borang.id;
    const sebelum = new Set(data.unit.map((u) => u.id));

    await jalankan(
      async () => {
        const jawab = (await (idLama ? ubahSekolah(idLama, muatan) : tambahSekolah(muatan))) as {
          unit?: { id: string }[];
        };
        if (!idLama) {
          /* Sekolah baru: lanjut menyunting yang baru agar tidak terbuat dua kali. */
          const baru = (jawab.unit ?? []).find((u) => !sebelum.has(u.id));
          if (baru) setBorang((b) => (b ? { ...b, id: baru.id } : b));
        }
        setBorang((b) =>
          b
            ? {
                ...b,
                nama,
                fasilitas: muatan.fasilitas.length > 0 ? muatan.fasilitas : [""],
                ekstra: muatan.ekstrakurikuler.length > 0 ? muatan.ekstrakurikuler : [""],
              }
            : b,
        );
      },
      idLama || borang.id ? `Data ${kosa.unit} tersimpan.` : `Unit ${kosa.statUnit} baru tersimpan.`,
    );
  };

  const hapus = async (u: UnitTampil) => {
    const setuju = await mintaKonfirmasi(
      `Hapus ${istilahDariJenjang({ slug: u.jenjangSlug }).unit} ${u.nama} dari daftar? Data peserta didik yang tertaut akan dilepas dari ${istilahDariJenjang({ slug: u.jenjangSlug }).unit} ini.`,
      { labelYa: `Ya, hapus ${kosa.unit}` },
    );
    if (!setuju) return;
    try {
      await hapusSekolah(u.id);
      await segarkanJenjang();
      beritahu("sukses", `${u.nama} dihapus.`);
      setPesan(null);
      tutup();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  /* ------------------------------ daftar sekolah ------------------------------ */

  if (!borang) {
    return (
      <div data-testid="admin-sekolah-daftar">
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <button
            type="button"
            data-testid="tambah-sekolah"
            onClick={bukaBaru}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 px-4 py-2.5 text-[11.5px] font-semibold text-white transition active:scale-[0.98]"
          >
            <Icon name="plus" className="h-[14px] w-[14px]" />
            Tambah
          </button>
        </div>
        {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

        <div className="mt-4 space-y-2.5">
          {data.unit.map((u) => {
            const j = jenjangDari(u.jenjangSlug);
            return (
              <div
                key={u.id}
                data-testid={`sekolah-baris-${u.id}`}
                className="rounded-2xl border border-black/[0.08] bg-white p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint-100 text-[11px] font-extrabold text-persis-800">
                    {j?.short ?? "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-header text-[12.5px] leading-snug font-extrabold text-ink-900">{u.nama}</p>
                    <p className="mt-0.5 text-[10.5px] leading-snug text-ink-600">
                      {j?.nama ?? u.jenjangSlug} · {istilahDariJenjang({ slug: u.jenjangSlug }).kode}{" "}
                      {u.npsn || "—"} · {u.siswa.toLocaleString("id-ID")}{" "}
                      {j?.satuan ?? istilahDariJenjang({ slug: u.jenjangSlug }).sebutanKecil}
                    </p>
                    <p className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[9.5px] font-semibold text-persis-900">
                        {u.status || "Swasta"}
                      </span>
                      <span className="rounded-full border border-black/[0.07] px-2 py-0.5 text-[9.5px] font-medium text-ink-600">
                        Akreditasi {u.akreditasi || "—"}
                      </span>
                      {u.jurusan.length > 0 ? (
                        <span className="rounded-full border border-black/[0.07] px-2 py-0.5 text-[9.5px] font-medium text-ink-600">
                          {u.jurusan.length} jurusan
                        </span>
                      ) : null}
                      {!u.aktif ? (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9.5px] font-semibold text-rose-700">
                          Tidak tampil
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-2 border-t border-black/[0.06] pt-2.5">
                  <button
                    type="button"
                    data-testid={`sekolah-ubah-${u.id}`}
                    onClick={() => buka(u)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-persis-900 px-3 py-1.5 text-[11px] font-semibold text-white transition active:scale-[0.98]"
                  >
                    <Icon name="pencil" className="h-3.5 w-3.5" />
                    Ubah
                  </button>
                  <button
                    type="button"
                    data-testid={`sekolah-hapus-${u.id}`}
                    onClick={() => void hapus(u)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 transition active:scale-[0.98]"
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
          Jenjang sekolah diambil dari menu Jenjang Pendidikan, dan pilihan program jurusan diambil dari menu Program
          Jurusan pada jenjang yang sama. Data yang diisi di sini langsung dipakai halaman Jenjang dan halaman detail
          sekolah di situs.
        </p>
      </div>
    );
  }

  /* ------------------------------ borang sekolah ------------------------------ */

  return (
    <div data-testid="admin-sekolah-borang">
      <button
        type="button"
        data-testid="sekolah-kembali"
        onClick={tutup}
        className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-persis-900 transition active:scale-[0.98]"
      >
        <Icon name="chevron" className="h-3.5 w-3.5" style={{ transform: "rotate(180deg)" }} />
        Kembali ke daftar sekolah
      </button>

      <KepalaBorang
        judul={borang.nama || `Unit ${kosa.statUnit} baru`}
        keterangan={
          borang.id
            ? `Ubah data ${kosa.unit} ini, lalu tekan Simpan. Perubahan langsung dipakai halaman situs.`
            : `Isi data ${kosa.unit} baru, lalu tekan Simpan. Nama dan jenjang wajib diisi.`
        }
        aksi={<TombolSimpan testid="simpan-sekolah" sibuk={sibuk} onClick={() => void simpan()} />}
      />
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-3.5">
        <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Identitas {kosa.statUnit}</h2>
          <Kolom
            testid="sekolah-nama"
            label={`Nama ${kosa.unit}`}
            nilai={borang.nama}
            onUbah={(v) => ubah({ nama: v })}
            placeholder="MI PERSIS 01 Cibatu"
          />
          <Pilih
            testid="sekolah-jenjang"
            label="Jenjang pendidikan"
            nilai={borang.jenjangSlug}
            onUbah={(v) => ubah({ jenjangSlug: v, jurusan: [] })}
            opsi={data.jenjang.map((j) => ({ nilai: j.slug, label: j.nama }))}
            placeholder="Pilih jenjang"
            petunjuk="Daftar jenjang berasal dari menu Jenjang Pendidikan."
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Pilih
              testid="sekolah-status"
              label="Status"
              nilai={borang.status}
              onUbah={(v) => ubah({ status: v })}
              opsi={OPSI_STATUS}
            />
            <Pilih
              testid="sekolah-akreditasi"
              label="Akreditasi"
              nilai={borang.akreditasi}
              onUbah={(v) => ubah({ akreditasi: v })}
              opsi={OPSI_AKREDITASI}
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Kolom
              testid="sekolah-npsn"
              label={kosa.kode}
              nilai={borang.npsn}
              onUbah={(v) => ubah({ npsn: v })}
              placeholder="20205011"
            />
            <Angka
              testid="sekolah-berdiri"
              label="Tahun berdiri"
              nilai={borang.berdiri}
              onUbah={(v) => ubah({ berdiri: v })}
              placeholder="1965"
            />
          </div>
          <Sakelar
            testid="sekolah-aktif"
            label="Tampilkan di situs"
            nilai={borang.aktif}
            onUbah={(v) => ubah({ aktif: v })}
            petunjuk="Bila dimatikan, sekolah ini tidak muncul di halaman Jenjang maupun daftar sekolah."
          />
        </section>

        <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Foto {kosa.statUnit}</h2>
          <div className="overflow-hidden rounded-2xl border border-black/[0.08]">
            {fotoTampil ? (
              <img
                src={fotoTampil}
                alt={`Foto ${borang.nama || kosa.unit}`}
                className="h-[168px] w-full object-cover"
              />
            ) : (
              <div className="grid h-[168px] w-full place-items-center bg-cream-100 text-[11px] text-ink-600">
                Belum ada foto
              </div>
            )}
          </div>
          <p className="text-[10px] break-all text-ink-400">
            {borang.gambar ? "Foto yang diunggah dari panel admin." : "Masih memakai foto bawaan jenjang ini."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="pilih-foto-sekolah"
              disabled={sibuk}
              onClick={() => berkasRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-persis-900 px-3.5 py-2 text-[11.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              <Icon name="image" className="h-[15px] w-[15px]" />
              {sibuk ? "Mengunggah…" : "Ganti foto"}
            </button>
            <button
              type="button"
              data-testid="foto-sekolah-bawaan"
              disabled={sibuk}
              onClick={() => {
                ubah({ gambar: "" });
                setPesan(null);
                beritahu("sukses", "Foto bawaan dipakai. Tekan Simpan agar berlaku.");
              }}
              className="rounded-full border border-black/[0.12] px-3.5 py-2 text-[11.5px] font-semibold text-persis-900 transition active:scale-[0.98] disabled:opacity-50"
            >
              Pakai foto bawaan
            </button>
          </div>
          <input
            ref={berkasRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            data-testid="berkas-foto-sekolah"
            onChange={(e) => {
              void pilihFoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <p className="text-justify text-[10px] leading-relaxed text-ink-400">
            Foto mendatar (lebar) paling nyaman. Ukuran paling besar 25 MB. Foto ini tampil sebagai gambar utama halaman
            detail sekolah.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Pimpinan & jumlah</h2>
          <Kolom
            testid="sekolah-pimpinan"
            label={kosa.pimpinanUnit}
            nilai={borang.pimpinan}
            onUbah={(v) => ubah({ pimpinan: v })}
            placeholder="Drs. H. Endang Suryana, M.Pd."
            petunjuk={`Nama pimpinan yang tampil pada kartu ${kosa.unit} dan halaman detailnya.`}
          />
          {/* Jumlah peserta didik dihitung dari data siswa/mahasiswa, bukan diisi manual. */}
          <div
            data-testid="sekolah-peserta"
            className="rounded-xl border border-persis-700/10 bg-cream-50/80 px-3.5 py-3"
          >
            <span className="text-[10px] font-semibold tracking-[0.1em] text-ink-400 uppercase">
              Jumlah peserta didik
            </span>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span
                data-testid="sekolah-peserta-angka"
                className="text-[22px] leading-none font-extrabold text-persis-800"
              >
                {peserta.toLocaleString("id-ID")}
              </span>
              <span className="text-[10.5px] font-semibold tracking-[0.08em] text-persis-800/60 uppercase">
                {satuan}
              </span>
            </p>
            <p className="mt-1.5 text-justify text-[10px] leading-relaxed text-ink-600">
              Terhitung otomatis dari data siswa/mahasiswa: angkanya bertambah saat ada yang mendaftar dan berkurang
              saat siswa/mahasiswa lulus menjadi alumni. Karena itu tidak bisa diisi manual.
              {alumni > 0 ? ` Tercatat ${alumni.toLocaleString("id-ID")} alumni dari ${kosa.unit} ini.` : ""}
            </p>
          </div>
          <Angka
            testid="sekolah-rombel"
            label={kosa.rombel}
            nilai={borang.rombel}
            onUbah={(v) => ubah({ rombel: v })}
            placeholder="7"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Angka
              testid="sekolah-guru"
              label={kosa.pengajarTunggal}
              nilai={borang.guru}
              onUbah={(v) => ubah({ guru: v })}
              placeholder="16"
              petunjuk="Jumlah tenaga pendidik."
            />
            <Angka
              testid="sekolah-staf"
              label="Staf"
              nilai={borang.staf}
              onUbah={(v) => ubah({ staf: v })}
              placeholder="4"
              petunjuk="Tenaga kependidikan."
            />
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Program jurusan</h2>
          <Sakelar
            testid="sekolah-punya-jurusan"
            label={`${kosa.statUnit} ini memiliki ${kosa.jurusan.toLowerCase()}`}
            nilai={borang.punyaJurusan}
            onUbah={(v) => ubah({ punyaJurusan: v, jurusan: v ? borang.jurusan : [] })}
            petunjuk="Misalnya jurusan IPA dan IIS di MA, atau program studi di perguruan tinggi."
          />
          {borang.punyaJurusan ? (
            <PilihBanyak
              testid="sekolah-jurusan"
              label={`${kosa.jurusan} yang tersedia`}
              nilai={borang.jurusan}
              onUbah={(v) => ubah({ jurusan: v })}
              opsi={jurusanJenjang.map((p) => ({ nilai: p.slug, label: `${p.short} — ${p.nama}` }))}
              kosong={`Jenjang ini belum punya ${kosa.jurusan.toLowerCase()}. Tambahkan dulu pada menu Program Jurusan, lalu kembali ke sini.`}
              petunjuk="Daftar pilihan berasal dari menu Program Jurusan pada jenjang yang dipilih."
            />
          ) : (
            <p className="text-justify text-[10.5px] leading-relaxed text-ink-400">
              Bila dimatikan, sekolah ini tampil tanpa daftar jurusan.
            </p>
          )}
        </section>

        <section className="space-y-3.5 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Fasilitas & ekstrakurikuler</h2>
          <DaftarTeks
            testid="sekolah-fasilitas"
            label="Fasilitas"
            nilai={borang.fasilitas}
            onUbah={(v) => ubah({ fasilitas: v })}
            placeholder="Laboratorium komputer"
            labelTambah="Tambah fasilitas"
            petunjuk="Satu baris satu fasilitas. Daftar ini tampil pada bagian Fasilitas di halaman sekolah."
          />
          <DaftarTeks
            testid="sekolah-ekstra"
            label={kosa.kegiatan}
            nilai={borang.ekstra}
            onUbah={(v) => ubah({ ekstra: v })}
            placeholder={kosa.kegiatan === "Unit Kegiatan Mahasiswa" ? "Halaqah tahfizh mahasiswa" : "Pramuka"}
            labelTambah="Tambah ekstrakurikuler"
          />
        </section>

        <section className="space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">Lokasi & kontak</h2>
          <AreaTeks
            testid="sekolah-alamat"
            label="Alamat"
            nilai={borang.alamat}
            onUbah={(v) => ubah({ alamat: v })}
            baris={3}
            placeholder="Jl. Raya Cibatu No. 14, Komplek Pendidikan PERSIS, Desa Cibatu, Kec. Cibatu, Kab. Garut"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Kolom
              testid="sekolah-daerah"
              label="Desa / daerah"
              nilai={borang.daerah}
              onUbah={(v) => ubah({ daerah: v })}
              placeholder="Cibatu"
            />
            <Kolom
              testid="sekolah-kontak"
              label="Telepon / WhatsApp"
              nilai={borang.kontak}
              onUbah={(v) => ubah({ kontak: v })}
              placeholder="0812-3456-7811"
            />
          </div>
          <Kolom
            testid="sekolah-email"
            label="Surel"
            nilai={borang.email}
            onUbah={(v) => ubah({ email: v })}
            placeholder="mi01@persiscibatu.or.id"
          />
          <Kolom
            testid="sekolah-jam"
            label="Jam layanan"
            nilai={borang.jam}
            onUbah={(v) => ubah({ jam: v })}
            placeholder="Senin – Sabtu, 07.00 – 13.30 WIB"
          />
          {borang.alamat.trim() ? (
            <a
              data-testid="sekolah-peta"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(borang.alamat)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-persis-700/15 px-3 py-1.5 text-[10.5px] font-semibold text-persis-900"
            >
              <Icon name="map-pin" className="h-3.5 w-3.5 text-gold-600" />
              Lihat alamat di peta
            </a>
          ) : null}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <TombolSimpan penuh={false} testid="simpan-sekolah-bawah" sibuk={sibuk} onClick={() => void simpan()} />
          {borang.id ? (
            <button
              type="button"
              data-testid="sekolah-hapus"
              onClick={() => {
                const u = data.unit.find((x) => x.id === borang.id);
                if (u) void hapus(u);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-[11px] font-semibold text-rose-700 transition active:scale-[0.98]"
            >
              <Icon name="trash" className="h-3.5 w-3.5" />
              Hapus sekolah ini
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- program jurusan --------------------------- */

type IsianJurusan = { nama: string; sing: string; intro: string; ukt: string; fokus: string[] };

const kosongJurusan: IsianJurusan = { nama: "", sing: "", intro: "", ukt: "", fokus: [""] };

export function ProgramJurusan() {
  const data = useJenjang();
  const { sibuk, pesan, jalankan, setPesan } = pakaiSimpan();
  const [isian, setIsian] = useState<Record<string, IsianJurusan>>({});
  const [baru, setBaru] = useState<Record<string, IsianJurusan>>({});
  const [terisi, setTerisi] = useState(false);

  useEffect(() => {
    if (!terisi && data.dariDatabase) {
      const awal: Record<string, IsianJurusan> = {};
      for (const p of data.jurusan) {
        awal[p.id] = {
          nama: p.nama,
          sing: p.short,
          intro: p.intro,
          ukt: p.ukt,
          fokus: p.fokus.length > 0 ? p.fokus : [""],
        };
      }
      setIsian(awal);
      setTerisi(true);
    }
  }, [terisi, data.dariDatabase, data.jurusan]);

  const isiSatu = (id: string, sebagian: Partial<IsianJurusan>) =>
    setIsian((s) => ({ ...s, [id]: { ...(s[id] ?? kosongJurusan), ...sebagian } }));

  const simpanJurusan = async (id: string) => {
    const b = isian[id];
    if (!b) return;
    if (!b.nama.trim()) {
      setPesan({ tipe: "galat", teks: "Nama program jurusan tidak boleh kosong." });
      return;
    }
    const muatan = {
      nama: b.nama.trim(),
      singkatan: b.sing.trim(),
      intro: b.intro,
      ukt: b.ukt,
      fokus: b.fokus.filter((t) => t.trim() !== ""),
    };
    await jalankan(async () => {
      await ubahJurusan(id, muatan);
      /* Isian yang diketik tetap seperti semula supaya tidak tertimpa data lama. */
      isiSatu(id, {
        nama: muatan.nama,
        sing: muatan.singkatan,
        fokus: muatan.fokus.length > 0 ? muatan.fokus : [""],
      });
    }, "Program jurusan tersimpan.");
  };

  const tambah = async (jenjangSlug: string) => {
    const b = baru[jenjangSlug] ?? kosongJurusan;
    if (!b.nama.trim()) {
      setPesan({ tipe: "galat", teks: "Nama program jurusan baru belum diisi." });
      return;
    }
    await jalankan(async () => {
      const jawab = (await tambahJurusan({
        jenjangSlug,
        nama: b.nama.trim(),
        singkatan: b.sing.trim(),
        intro: b.intro,
        ukt: b.ukt,
        fokus: b.fokus.filter((t) => t.trim() !== ""),
      })) as { jurusan?: { id: string; slug: string; jenjangSlug?: string | null }[] };

      const sebelum = new Set(data.jurusan.map((p) => p.id));
      const baruSaja = (jawab.jurusan ?? []).find((p) => !sebelum.has(p.id));
      if (baruSaja) {
        isiSatu(baruSaja.id, {
          nama: b.nama.trim(),
          sing: b.sing.trim(),
          intro: b.intro,
          ukt: b.ukt,
          fokus: b.fokus.filter((t) => t.trim() !== "").length > 0 ? b.fokus.filter((t) => t.trim() !== "") : [""],
        });
      }
      setBaru((s) => ({ ...s, [jenjangSlug]: kosongJurusan }));
    }, "Program jurusan baru tersimpan.");
  };

  const hapus = async (id: string, nama: string) => {
    const setuju = await mintaKonfirmasi(
      `Hapus program jurusan ${nama}? Pilihan ini akan hilang dari unit yang memakainya.`,
      {
        labelYa: "Ya, hapus jurusan",
      },
    );
    if (!setuju) return;
    try {
      await hapusJurusan(id);
      await segarkanJenjang();
      setIsian((s) => {
        const salinan = { ...s };
        delete salinan[id];
        return salinan;
      });
      beritahu("sukses", `${nama} dihapus.`);
      setPesan(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menghapus." });
    }
  };

  return (
    <div data-testid="admin-jurusan">
      {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}

      <div className="mt-4 space-y-4">
        {data.jenjang.map((j) => {
          const daftar = data.jurusan.filter((p) => p.jenjangSlug === j.slug);
          const b = baru[j.slug] ?? kosongJurusan;
          return (
            <section
              key={j.id}
              data-testid={`jurusan-jenjang-${j.slug}`}
              className="rounded-2xl border border-black/[0.08] bg-white p-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint-100 text-[11px] font-extrabold text-persis-800">
                  {j.short}
                </span>
                <div className="min-w-0">
                  <h2 className="font-header text-[12.5px] font-bold text-ink-900">{j.nama}</h2>
                  <p className="text-[10px] text-ink-600">
                    {daftar.length > 0 ? `${daftar.length} program jurusan` : "Belum ada program jurusan"}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {daftar.map((p) => {
                  const nilai = isian[p.id] ?? {
                    nama: p.nama,
                    sing: p.short,
                    intro: p.intro,
                    ukt: p.ukt,
                    fokus: p.fokus.length > 0 ? p.fokus : [""],
                  };
                  return (
                    <div key={p.id} data-testid={`jurusan-baris-${p.slug}`} className="rounded-xl bg-cream-50/70 p-3">
                      <div className="grid grid-cols-[92px_1fr] gap-2.5">
                        <Kolom
                          testid={`jurusan-singkatan-${p.slug}`}
                          label="Singkatan"
                          nilai={nilai.sing}
                          onUbah={(v) => isiSatu(p.id, { sing: v })}
                          placeholder="IPA"
                        />
                        <Kolom
                          testid={`jurusan-nama-${p.slug}`}
                          label="Nama program jurusan"
                          nilai={nilai.nama}
                          onUbah={(v) => isiSatu(p.id, { nama: v })}
                          placeholder="Ilmu Pengetahuan Alam (IPA)"
                        />
                      </div>
                      <div className="mt-2.5">
                        <AreaTeks
                          testid={`jurusan-intro-${p.slug}`}
                          label="Deskripsi singkat"
                          nilai={nilai.intro}
                          onUbah={(v) => isiSatu(p.id, { intro: v })}
                          baris={4}
                          petunjuk="Tampil sebagai paragraf pembuka pada kartu program jurusan di halaman sekolah."
                        />
                      </div>
                      <div className="mt-2.5">
                        <DaftarTeks
                          testid={`jurusan-fokus-${p.slug}`}
                          label="Materi / fokus pembelajaran"
                          nilai={nilai.fokus}
                          onUbah={(v) => isiSatu(p.id, { fokus: v })}
                          placeholder="Biologi & praktikum laboratorium"
                          labelTambah="Tambah materi"
                        />
                      </div>
                      <div className="mt-2.5">
                        <Kolom
                          testid={`jurusan-ukt-${p.slug}`}
                          label="Biaya kuliah / UKT (opsional)"
                          nilai={nilai.ukt}
                          onUbah={(v) => isiSatu(p.id, { ukt: v })}
                          placeholder="Rp 850.000 / semester"
                          petunjuk="Kosongkan bila tidak dipakai; kotak biaya tidak akan tampil."
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <TombolSimpan
                          penuh={false}
                          testid={`simpan-jurusan-${p.slug}`}
                          sibuk={sibuk}
                          onClick={() => void simpanJurusan(p.id)}
                        />
                        <button
                          type="button"
                          data-testid={`hapus-jurusan-${p.slug}`}
                          onClick={() => void hapus(p.id, p.nama)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700 transition active:scale-[0.98]"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="rounded-xl border border-dashed border-persis-900/20 p-3">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                    Program jurusan baru
                  </p>
                  <div className="mt-2 grid grid-cols-[92px_1fr] gap-2.5">
                    <Kolom
                      testid={`jurusan-baru-singkatan-${j.slug}`}
                      label="Singkatan"
                      nilai={b.sing}
                      onUbah={(v) => setBaru((s) => ({ ...s, [j.slug]: { ...b, sing: v } }))}
                      placeholder="IPA"
                    />
                    <Kolom
                      testid={`jurusan-baru-nama-${j.slug}`}
                      label="Nama program jurusan"
                      nilai={b.nama}
                      onUbah={(v) => setBaru((s) => ({ ...s, [j.slug]: { ...b, nama: v } }))}
                      placeholder="Ilmu Pengetahuan Alam (IPA)"
                    />
                  </div>
                  <div className="mt-2.5">
                    <AreaTeks
                      testid={`jurusan-baru-intro-${j.slug}`}
                      label="Deskripsi singkat"
                      nilai={b.intro}
                      onUbah={(v) => setBaru((s) => ({ ...s, [j.slug]: { ...b, intro: v } }))}
                      baris={3}
                    />
                  </div>
                  <button
                    type="button"
                    data-testid={`tambah-jurusan-${j.slug}`}
                    onClick={() => void tambah(j.slug)}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-persis-900 px-3.5 py-2 text-[11px] font-semibold text-white transition active:scale-[0.98]"
                  >
                    <Icon name="plus" className="h-3.5 w-3.5" />
                    Tambah program jurusan
                  </button>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-4 pb-2 text-justify text-[10.5px] leading-relaxed text-ink-400">
        Program jurusan yang masih dipilih oleh sebuah sekolah tidak bisa dihapus — pesannya akan muncul beserta jumlah
        sekolah yang memakainya. Singkatan dipakai sebagai lencana pada kartu jurusan di halaman sekolah.
      </p>
    </div>
  );
}
