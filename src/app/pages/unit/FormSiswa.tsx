import { useState } from "react";
import { Icon } from "../../components/Icons";
import { Kolom, Pesan, TombolSimpan } from "../../components/admin/Form";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { hapusSiswa, luluskanSiswa, tambahSiswa, ubahSiswa, type IsianSiswa, type SekolahSiswa, type SiswaUnit, type ProgramUnit } from "../../lib/unitSekolah";
import Lembar from "./Lembar";
import { useIstilah } from "../../lib/istilah";

/**
 * Borang siswa yang ringkas — hanya nama lengkap, jurusan (bila sekolah punya jurusan),
 * nama orang tua, dan nomor WhatsApp. Jenjang pendidikan dan nama sekolah mengikuti
 * sekolah yang sedang dibuka, sedangkan siswa hasil verifikasi SPMB sudah terisi sendiri.
 */
export default function FormSiswa({
  siswa,
  sekolah,
  onTutup,
  onBerubah,
}: {
  siswa: SiswaUnit | null;
  sekolah: SekolahSiswa;
  onTutup: () => void;
  onBerubah: () => void;
}) {
  const istilah = useIstilah();
  /* Pilihan jurusan: nama program bila terdaftar, cadangan dari daftar slug unit. */
  const pilihanProgram: ProgramUnit[] =
    sekolah.program.length > 0
      ? sekolah.program
      : sekolah.jurusan.map((slug) => ({ slug, nama: slug }));
  const baru = siswa === null;
  const [isian, setIsian] = useState<IsianSiswa>({
    nama: siswa?.nama ?? "",
    program: siswa?.program ?? "",
    waliNama: siswa?.waliNama ?? "",
    waliTelepon: siswa?.waliTelepon ?? "",
    pinWali: siswa?.pinWali ?? "",
  });
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  const isi = (kunci: keyof IsianSiswa) => (nilai: string) => setIsian((s) => ({ ...s, [kunci]: nilai }));

  const simpan = async () => {
    if (isian.nama.trim().length < 3) {
      setPesan({ tipe: "galat", teks: `Nama ${istilah.sebutanKecil} minimal 3 huruf.` });
      return;
    }
    setSibuk(true);
    setPesan(null);
    try {
      if (baru) {
        await tambahSiswa(isian);
        beritahu("sukses", `${isian.nama.trim()} ditambahkan ke daftar ${istilah.sebutanKecil}.`);
      } else {
        await ubahSiswa(siswa.id, isian);
        beritahu("sukses", `Data ${isian.nama.trim()} disimpan.`);
      }
      onBerubah();
      onTutup();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : `Data ${istilah.sebutanKecil} gagal disimpan.` });
    } finally {
      setSibuk(false);
    }
  };

  const jadikanAlumni = async () => {
    if (!siswa) return;
    if (
      !(await mintaKonfirmasi(
        `${siswa.nama} dinyatakan lulus. Bila tidak ada tunggakan, datanya sekaligus masuk daftar alumni; bila masih ada tunggakan, namanya muncul di tabel Tunggakan menu Tata Usaha sampai lunas. Lanjutkan?`,
        {
          judul: "Konfirmasi kelulusan",
          nada: "tanya",
          labelYa: "Ya, nyatakan lulus",
        },
      ))
    )
      return;
    setSibuk(true);
    try {
      const jawab = await luluskanSiswa(siswa.id);
      beritahu(jawab.masukAlumni === false ? "galat" : "sukses", jawab.pesan ?? `${jawab.siswa.nama} dipindahkan ke daftar alumni.`);
      onBerubah();
      onTutup();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal memindahkan ke alumni." });
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async () => {
    if (!siswa) return;
    if (!(await mintaKonfirmasi(`Hapus ${siswa.nama} dari daftar ${istilah.sebutanKecil}? Data yang dihapus tidak bisa dikembalikan.`))) return;
    setSibuk(true);
    try {
      await hapusSiswa(siswa.id);
      beritahu("sukses", `${siswa.nama} dihapus dari daftar ${istilah.sebutanKecil}.`);
      onBerubah();
      onTutup();
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : `${istilah.sebutan} gagal dihapus.` });
    } finally {
      setSibuk(false);
    }
  };

  const jurusan = siswa?.program || isian.program;

  return (
    <Lembar
      testid="form-siswa"
      judul={baru ? `Tambah ${istilah.sebutanKecil}` : siswa.nama}
      keterangan={
        baru
          ? `Cukup isi nama lengkap, orang tua, dan nomor WhatsApp. Jenjang dan ${istilah.unit} mengikuti halaman ini.`
          : siswa.dariSpmb
            ? `Data ${istilah.sebutanKecil} ini terisi otomatis dari pendaftaran ${istilah.penerimaan} yang sudah diverifikasi. Ubah bila ada yang perlu diperbaiki.`
            : `Ubah data ${istilah.sebutanKecil} pada ${istilah.unit} ini.`
      }
      onTutup={onTutup}
    >
      <div className="space-y-3">
        {!baru && siswa.foto ? (
          <div className="flex items-center gap-3 rounded-xl bg-cream-50 px-3.5 py-2.5">
            <img
              data-testid="form-siswa-foto"
              src={siswa.foto}
              alt={`Foto ${siswa.nama}`}
              className="h-11 w-11 rounded-xl border border-persis-700/10 object-cover"
            />
            <p className="text-[11px] leading-snug text-ink-600">
              Foto profil ini diunggah sendiri oleh wali dari portal wali {istilah.sebutan}.
            </p>
          </div>
        ) : null}
        <Kolom
          testid="siswa-nama"
          label="Nama lengkap"
          nilai={isian.nama}
          onUbah={isi("nama")}
          placeholder={`Nama lengkap ${istilah.sebutanKecil}`}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-cream-50 px-3.5 py-2.5">
            <span className="field-label">Jenjang pendidikan</span>
            <p data-testid="siswa-jenjang" className="text-[12.5px] font-semibold text-persis-900">
              {sekolah.jenjang || "—"}
            </p>
          </div>
          <div className="rounded-xl bg-cream-50 px-3.5 py-2.5">
            <span className="field-label">{`Nama ${istilah.unit}`}</span>
            <p data-testid="siswa-sekolah" className="text-[12.5px] leading-snug font-semibold text-persis-900">
              {sekolah.nama || "—"}
            </p>
          </div>
        </div>

        {pilihanProgram.length > 0 ? (
          <label className="block">
            <span className="field-label">{`Nama ${istilah.jurusan.toLowerCase()}`}</span>
            <select
              data-testid="siswa-jurusan"
              className="field-input"
              value={isian.program}
              onChange={(e) => isi("program")(e.target.value)}
            >
              <option value="">Belum diisi</option>
              {pilihanProgram.map((j) => (
                <option key={j.slug} value={j.slug}>
                  {j.nama}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <Kolom
          testid="siswa-wali"
          label="Nama orang tua / wali"
          nilai={isian.waliNama}
          onUbah={isi("waliNama")}
          placeholder="Nama ayah, ibu, atau wali"
        />
        <Kolom
          testid="siswa-wa"
          label="Nomor WhatsApp"
          nilai={isian.waliTelepon}
          onUbah={isi("waliTelepon")}
          placeholder="08xx xxxx xxxx"
        />

        <div>
          <Kolom
            testid="siswa-pin"
            label={`PIN ${istilah.portal.toLowerCase()} (4–8 angka)`}
            nilai={isian.pinWali}
            onUbah={(v) => isi("pinWali")(v.replace(/[^0-9]/g, "").slice(0, 8))}
            placeholder="Misalnya 246810"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-justify text-[10px] leading-relaxed text-ink-400">
              PIN ini yang dipakai orang tua untuk masuk ke portal wali santri. Berikan hanya kepada wali siswa ini.
            </span>
            <button
              type="button"
              data-testid="siswa-pin-acak"
              onClick={() => isi("pinWali")(String(Math.floor(100000 + Math.random() * 900000)))}
              className="shrink-0 rounded-full border border-black/[0.12] px-2.5 py-1 text-[10px] font-semibold text-persis-900"
            >
              Buat PIN
            </button>
          </div>
        </div>
      </div>

      {pesan ? (
        <div className="mt-3">
          <Pesan tipe={pesan.tipe} teks={pesan.teks} />
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        <TombolSimpan
          testid="siswa-simpan"
          label={baru ? `Simpan ${istilah.sebutanKecil}` : "Simpan perubahan"}
          sibuk={sibuk}
          onClick={() => void simpan()}
        />
        {!baru ? (
          <>
            {siswa.status === "lulus" && siswa.alumni ? (
              <p className="rounded-xl bg-cream-50 px-3.5 py-2 text-justify text-[10.5px] leading-relaxed text-ink-500">
                {siswa.nama} sudah tercatat sebagai alumni {istilah.unit} ini{jurusan ? ` (${istilah.jurusan.toLowerCase()} ${jurusan})` : ""}.
              </p>
            ) : siswa.status === "lulus" ? (
              <>
                <p className="rounded-xl border border-gold-400/40 bg-cream-50 px-3.5 py-2.5 text-justify text-[10.5px] leading-relaxed text-ink-600">
                  {siswa.nama} sudah berstatus lulus, tetapi namanya belum masuk daftar alumni.
                  {siswa.tagihanTerbuka > 0
                    ? ` Masih ada ${siswa.tagihanTerbuka} tagihan yang belum lunas; selesaikan dulu di menu Tunggakan & Lunas (Admin Tata Usaha), lalu tekan tombol di bawah.`
                    : " Tidak ada tunggakan, jadi namanya bisa langsung dimasukkan ke daftar alumni."}
                </p>
                <button
                  type="button"
                  data-testid="siswa-luluskan"
                  disabled={sibuk}
                  onClick={() => void jadikanAlumni()}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-persis-900/25 py-2.5 text-[11.5px] font-semibold text-persis-900 disabled:opacity-50"
                >
                  <Icon name="graduation-cap" className="h-[15px] w-[15px] text-gold-600" />
                  Masukkan ke daftar alumni
                </button>
              </>
            ) : (
              <button
                type="button"
                data-testid="siswa-luluskan"
                disabled={sibuk}
                onClick={() => void jadikanAlumni()}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-persis-900/25 py-2.5 text-[11.5px] font-semibold text-persis-900 disabled:opacity-50"
              >
                <Icon name="graduation-cap" className="h-[15px] w-[15px] text-gold-600" />
                Jadikan alumni
              </button>
            )}
            <button
              type="button"
              data-testid="siswa-hapus"
              disabled={sibuk}
              onClick={() => void hapus()}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 py-2.5 text-[11.5px] font-semibold text-rose-700 disabled:opacity-50"
            >
              <Icon name="trash" className="h-[15px] w-[15px]" />
              Hapus siswa
            </button>
          </>
        ) : null}
      </div>
    </Lembar>
  );
}
