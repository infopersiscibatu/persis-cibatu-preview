import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import { AreaTeks, Kolom, Pesan, TombolSimpan } from "../../components/admin/Form";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import {
  daftarAlumni,
  hapusAlumni,
  selaraskanAlumni,
  tambahAlumni,
  ubahAlumni,
  type AlumniUnit,
  type IsianAlumni,
} from "../../lib/unitSekolah";
import Lembar from "./Lembar";
import { useIstilah } from "../../lib/istilah";

/**
 * Menu Alumni: menampung siswa yang sudah lulus. Siswa yang dinyatakan alumni dari
 * menu Siswa masuk ke daftar ini otomatis; datanya bisa dilengkapi dari sini.
 */

const kosong: IsianAlumni = {
  nama: "",
  nis: "",
  tahunLulus: String(new Date().getFullYear()),
  pekerjaan: "",
  instansi: "",
  kota: "",
  telepon: "",
  catatan: "",
};

function FormAlumni({
  alumni,
  onTutup,
  onBerubah,
}: {
  alumni: AlumniUnit | null;
  onTutup: () => void;
  onBerubah: () => void;
}) {
  const istilah = useIstilah();
  const baru = alumni === null;
  const [isian, setIsian] = useState<IsianAlumni>(
    alumni
      ? {
          nama: alumni.nama,
          nis: alumni.nis,
          tahunLulus: alumni.tahunLulus ? String(alumni.tahunLulus) : "",
          pekerjaan: alumni.pekerjaan,
          instansi: alumni.instansi,
          kota: alumni.kota,
          telepon: alumni.telepon,
          catatan: alumni.catatan,
        }
      : kosong,
  );
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  const isi = (kunci: keyof IsianAlumni) => (nilai: string) => setIsian((s) => ({ ...s, [kunci]: nilai }));

  const simpan = async () => {
    if (isian.nama.trim().length < 3) {
      setPesan({ tipe: "galat", teks: "Nama alumni minimal 3 huruf." });
      return;
    }
    setSibuk(true);
    setPesan(null);
    try {
      if (baru) {
        await tambahAlumni(isian);
        beritahu("sukses", `${isian.nama.trim()} ditambahkan ke daftar alumni.`);
      } else {
        await ubahAlumni(alumni.id, isian);
        beritahu("sukses", `Data alumni ${isian.nama.trim()} disimpan.`);
      }
      onBerubah();
      onTutup();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Data alumni gagal disimpan." });
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async () => {
    if (!alumni) return;
    if (!(await mintaKonfirmasi(`Hapus ${alumni.nama} dari daftar alumni?`))) return;
    setSibuk(true);
    try {
      await hapusAlumni(alumni.id);
      beritahu("sukses", `${alumni.nama} dihapus dari daftar alumni.`);
      onBerubah();
      onTutup();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Alumni gagal dihapus." });
    } finally {
      setSibuk(false);
    }
  };

  return (
    <Lembar
      testid="form-alumni"
      judul={baru ? "Tambah alumni" : alumni.nama}
      keterangan={
        baru
          ? `Untuk alumnus lama yang belum tercatat di daftar alumni ${istilah.unit}.`
          : alumni.dariSiswa
            ? `Alumnus ini berasal dari data ${istilah.sebutanKecil} ${istilah.unit}. Lengkapi pekerjaan atau instansinya bila sudah ada.`
            : `Data alumnus ${istilah.unit} ini.`
      }
      onTutup={onTutup}
    >
      <div className="space-y-3">
        <Kolom testid="alumni-nama" label="Nama alumni" nilai={isian.nama} onUbah={isi("nama")} placeholder="Nama lengkap" />
        <div className="grid grid-cols-2 gap-3">
          <Kolom testid="alumni-nis" label={istilah.nomorInduk} nilai={isian.nis} onUbah={isi("nis")} placeholder="Nomor induk" />
          <label className="block">
            <span className="field-label">Tahun lulus</span>
            <input
              type="number"
              inputMode="numeric"
              data-testid="alumni-tahun"
              className="field-input"
              value={isian.tahunLulus}
              onChange={(e) => isi("tahunLulus")(e.target.value)}
            />
          </label>
        </div>
        <Kolom testid="alumni-pekerjaan" label="Pekerjaan" nilai={isian.pekerjaan} onUbah={isi("pekerjaan")} placeholder={`Misalnya ${istilah.sebutan}, ${istilah.pengajarTunggal}, Wiraswasta`} />
        <Kolom testid="alumni-instansi" label="Instansi / kampus" nilai={isian.instansi} onUbah={isi("instansi")} placeholder="Tempat bekerja atau kuliah" />
        <div className="grid grid-cols-2 gap-3">
          <Kolom testid="alumni-kota" label="Kota tinggal" nilai={isian.kota} onUbah={isi("kota")} placeholder="Misalnya Garut" />
          <Kolom testid="alumni-telepon" label="Telepon" nilai={isian.telepon} onUbah={isi("telepon")} placeholder="08xx xxxx xxxx" />
        </div>
        <AreaTeks
          testid="alumni-catatan"
          label="Catatan"
          nilai={isian.catatan}
          onUbah={isi("catatan")}
          baris={2}
          placeholder={`Catatan ${istilah.unit} tentang alumnus ini`}
        />
      </div>

      {pesan ? (
        <div className="mt-3">
          <Pesan tipe={pesan.tipe} teks={pesan.teks} />
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        <TombolSimpan testid="alumni-simpan" label={baru ? "Simpan alumni" : "Simpan perubahan"} sibuk={sibuk} onClick={() => void simpan()} />
        {!baru ? (
          <button
            type="button"
            data-testid="alumni-hapus"
            disabled={sibuk}
            onClick={() => void hapus()}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 py-2.5 text-[11.5px] font-semibold text-rose-700 disabled:opacity-50"
          >
            <Icon name="trash" className="h-[15px] w-[15px]" />
            Hapus alumni
          </button>
        ) : null}
      </div>
    </Lembar>
  );
}

export default function TabelAlumni() {
  const istilah = useIstilah();
  const [alumni, setAlumni] = useState<AlumniUnit[]>([]);
  const [total, setTotal] = useState(0);
  const [cari, setCari] = useState("");
  const [kataKunci, setKataKunci] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [terbuka, setTerbuka] = useState<{ mode: "tambah" } | { mode: "ubah"; alumni: AlumniUnit } | null>(null);
  const [menyelaraskan, setMenyelaraskan] = useState(false);

  /** Masukkan siswa yang sudah lulus tetapi belum tercatat sebagai alumni. */
  const selaraskan = async () => {
    setMenyelaraskan(true);
    try {
      const jawab = await selaraskanAlumni();
      beritahu("sukses", jawab.pesan);
      await muat();
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Daftar alumni gagal diselaraskan.");
    } finally {
      setMenyelaraskan(false);
    }
  };

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await daftarAlumni(kataKunci);
      setAlumni(jawab.alumni);
      setTotal(jawab.total);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Daftar alumni belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, [kataKunci]);

  useEffect(() => {
    void muat();
  }, [muat]);

  useEffect(() => {
    const jeda = setTimeout(() => setKataKunci(cari), 350);
    return () => clearTimeout(jeda);
  }, [cari]);

  return (
    <section data-testid="sekolah-alumni-tabel" className="mt-4">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <KepalaKartu
          judul="Daftar alumni"
          keterangan={`${istilah.sebutan} yang dinyatakan lulus langsung masuk ke daftar ini bila tidak ada tunggakan. Bila tunggakannya kemudian lunas, tekan “Masukkan ${istilah.sebutanKecil} yang sudah lulus”. Data alumnus lama juga bisa ditambahkan di sini.`}
          angka={total}
          labelAngka="alumni"
          testidAngka="alumni-jumlah"
          tombol={
            <div className="space-y-2">
              <button
                type="button"
                data-testid="alumni-tambah"
                onClick={() => setTerbuka({ mode: "tambah" })}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 py-2.5 text-[11.5px] font-semibold text-white"
              >
                <Icon name="plus" className="h-[15px] w-[15px]" />
                Tambah alumni
              </button>
              <button
                type="button"
                data-testid="alumni-selaraskan"
                disabled={menyelaraskan}
                onClick={() => void selaraskan()}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-persis-900/25 py-2.5 text-[11.5px] font-semibold text-persis-900 disabled:opacity-50"
              >
                <Icon name="graduation-cap" className="h-[15px] w-[15px] text-gold-600" />
                {menyelaraskan ? "Menyelaraskan…" : `Masukkan ${istilah.sebutanKecil} yang sudah lulus`}
              </button>
            </div>
          }
        />

        <input
          type="search"
          data-testid="alumni-cari"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder={`Cari nama, ${istilah.nomorInduk}, atau instansi…`}
          className="mt-2.5 w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40"
        />

        {memuat && alumni.length === 0 ? (
          <p className="mt-3 text-[11px] text-ink-400">Memuat daftar alumni…</p>
        ) : galat ? (
          <p className="mt-3 text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
        ) : alumni.length === 0 ? (
          <p data-testid="alumni-kosong" className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400">
            {kataKunci
              ? "Tidak ada alumni yang cocok dengan pencarian."
              : `Belum ada alumni tercatat. Buka menu ${istilah.sebutan}, pilih ${istilah.sebutanKecil} yang sudah lulus, lalu tekan “Jadikan alumni”.`}
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-black/[0.07]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-cream-50 text-[9.5px] tracking-[0.08em] text-ink-400 uppercase">
                  <th scope="col" className="px-3 py-2 text-left font-bold">Nama</th>
                  <th scope="col" className="px-2 py-2 text-left font-bold">Lulus</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">
                    <span className="sr-only">Buka data alumni</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {alumni.map((a) => (
                  <tr
                    key={a.id}
                    data-testid={`alumni-baris-${a.id}`}
                    onClick={() => setTerbuka({ mode: "ubah", alumni: a })}
                    className="cursor-pointer border-t border-black/[0.05] align-top transition hover:bg-cream-50/70"
                  >
                    <td className="px-3 py-2.5">
                      <span className="block text-[11.5px] leading-snug font-semibold text-ink-900">{a.nama}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9.5px] text-ink-400">
                        {a.pekerjaan ? <span>{a.pekerjaan}</span> : null}
                        {a.instansi ? <span>· {a.instansi}</span> : null}
                        {a.dariSiswa ? (
                          <span className="rounded-full bg-persis-100 px-2 py-0.5 font-bold text-persis-900">
                            dari data siswa
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-[10.5px] whitespace-nowrap text-ink-600">
                      {a.tahunLulus ? String(a.tahunLulus) : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <button
                        type="button"
                        data-testid={`alumni-buka-${a.id}`}
                        aria-label={`Buka data ${a.nama}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTerbuka({ mode: "ubah", alumni: a });
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-black/[0.09] text-persis-900"
                      >
                        <Icon name="chevron-right" className="h-[15px] w-[15px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {terbuka ? (
        <FormAlumni
          alumni={terbuka.mode === "ubah" ? terbuka.alumni : null}
          onTutup={() => setTerbuka(null)}
          onBerubah={() => void muat()}
        />
      ) : null}
    </section>
  );
}
