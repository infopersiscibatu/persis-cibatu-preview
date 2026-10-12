import { useEffect, useState } from "react";
import { AreaTeks, Pesan, TombolSimpan } from "../../components/admin/Form";
import { Icon } from "../../components/Icons";
import { tanggalJam, tanggalLengkap } from "../../lib/format";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import {
  detailPendaftar,
  LABEL_STATUS,
  simpanDataPendaftar,
  ubahStatusPendaftar,
  type PendaftarLengkap,
  type StatusPendaftar,
} from "../../lib/unitSpmb";
import { useIstilah } from "../../lib/istilah";

/**
 * Rincian satu pendaftar dalam jendela melayang. Dari sini petugas bisa
 * memeriksa isian, menghubungi wali, mencatat keterangan, dan mengubah status.
 */

const WARNA_STATUS: Record<StatusPendaftar, string> = {
  baru: "bg-gold-100 text-gold-800",
  diverifikasi: "bg-persis-100 text-persis-900",
  diterima: "bg-persis-900 text-gold-300",
  ditolak: "bg-rose-100 text-rose-800",
  batal: "bg-cream-100 text-ink-600",
};

function Baris({ label, nilai }: { label: string; nilai: string }) {
  if (!nilai) return null;
  return (
    <div className="flex gap-3 border-b border-black/[0.05] py-2 last:border-b-0">
      <span className="w-[104px] shrink-0 text-[10.5px] font-semibold tracking-[0.04em] text-ink-400 uppercase">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-[11.5px] leading-relaxed break-words text-ink-900">{nilai}</span>
    </div>
  );
}

export default function PopupPendaftar({
  id,
  onTutup,
  onBerubah,
}: {
  id: string;
  onTutup: () => void;
  onBerubah?: () => void;
}) {
  const istilah = useIstilah();
  const [data, setData] = useState<PendaftarLengkap | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState<StatusPendaftar | "catatan" | null>(null);
  const [catatan, setCatatan] = useState("");
  const [hasil, setHasil] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  useEffect(() => {
    let batal = false;
    setMemuat(true);
    detailPendaftar(id)
      .then((jawab) => {
        if (batal) return;
        setData(jawab.pendaftar);
        setCatatan(jawab.pendaftar.catatan ?? "");
        setGalat(null);
      })
      .catch((e) => {
        if (!batal) setGalat(e instanceof Error ? e.message : "Rincian pendaftar belum bisa dimuat.");
      })
      .finally(() => {
        if (!batal) setMemuat(false);
      });
    return () => {
      batal = true;
    };
  }, [id]);

  /* Tombol Escape menutup jendela. */
  useEffect(() => {
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
    };
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [onTutup]);

  const ubahStatus = async (status: StatusPendaftar) => {
    if (!data) return;
    if (status === "ditolak" || status === "batal") {
      const pesan =
        status === "ditolak"
          ? `Tandai ${data.nama} sebagai ditolak?`
          : `Tandai pendaftaran ${data.nama} dibatalkan?`;
      const lanjut = await mintaKonfirmasi(pesan, {
        judul: status === "ditolak" ? "Konfirmasi tolak" : "Konfirmasi batal",
        nada: "tanya",
        labelYa: status === "ditolak" ? "Ya, tolak" : "Ya, batalkan",
      });
      if (!lanjut) return;
    }
    setSibuk(status);
    setHasil(null);
    try {
      const jawab = await ubahStatusPendaftar(data.id, status, catatan.trim() ? catatan.trim() : undefined);
      setData({ ...data, status });
      const tambahan =
        jawab.santri?.ditambah
          ? ` Datanya sudah masuk ke daftar ${istilah.sebutanKecil}.`
          : jawab.santri?.dicabut
            ? ` Datanya dicabut dari daftar ${istilah.sebutanKecil}.`
            : "";
      beritahu("sukses", `${data.nama} ditandai ${LABEL_STATUS[status].toLowerCase()}.${tambahan}`);
      onBerubah?.();
    } catch (e) {
      setHasil({ tipe: "galat", teks: e instanceof Error ? e.message : "Status gagal diubah." });
    } finally {
      setSibuk(null);
    }
  };

  const simpanCatatan = async () => {
    if (!data) return;
    setSibuk("catatan");
    setHasil(null);
    try {
      await simpanDataPendaftar(data.id, { catatan });
      setData({ ...data, catatan });
      setHasil({ tipe: "sukses", teks: "Catatan pendaftar disimpan." });
      onBerubah?.();
    } catch (e) {
      setHasil({ tipe: "galat", teks: e instanceof Error ? e.message : "Catatan gagal disimpan." });
    } finally {
      setSibuk(null);
    }
  };

  const wa = data?.telepon ? `https://wa.me/${data.telepon.replace(/[^0-9]/g, "").replace(/^0/, "62")}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" data-testid="popup-pendaftar">
      <button
        type="button"
        data-testid="popup-pendaftar-latar"
        aria-label="Tutup rincian pendaftar"
        onClick={onTutup}
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Rincian pendaftar"
        className="relative z-10 max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-t-3xl bg-white px-4 pt-4 pb-6 shadow-[0_-18px_50px_-18px_rgba(7,51,39,0.55)]"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-black/[0.12]" />

        {memuat ? (
          <p className="py-8 text-center text-[11.5px] text-ink-400">Memuat rincian pendaftar…</p>
        ) : galat || !data ? (
          <p className="py-8 text-center text-[11.5px] text-ink-600">{galat ?? "Pendaftar tidak ditemukan."}</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9.5px] font-semibold tracking-[0.14em] text-gold-600 uppercase">
                  {data.nomor || "Tanpa nomor"}
                </p>
                <h2 data-testid="popup-nama" className="font-header mt-0.5 text-[15px] leading-tight font-extrabold text-persis-900">
                  {data.nama}
                </h2>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[10.5px] text-ink-400">
                  <span className={`rounded-full px-2.5 py-1 text-[9.5px] font-bold ${WARNA_STATUS[data.status]}`}>
                    {LABEL_STATUS[data.status]}
                  </span>
                  {data.gelombang ? <span>{data.gelombang}</span> : null}
                </p>
              </div>
              <button
                type="button"
                data-testid="popup-tutup"
                aria-label="Tutup"
                onClick={onTutup}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/[0.1] text-ink-600"
              >
                <Icon name="x" className="h-[16px] w-[16px]" />
              </button>
            </div>

            <div className="mt-3.5 rounded-2xl border border-black/[0.08] p-3">
              <Baris label="Jenjang" nilai={data.jenjang} />
              <Baris label="Tempat lahir" nilai={data.tempatLahir} />
              <Baris
                label="Tanggal lahir"
                nilai={data.tanggalLahir ? tanggalLengkap(`${data.tanggalLahir}T00:00:00`) : ""}
              />
              {data.programNama || data.program ? (
              <Baris label={istilah.jurusan} nilai={data.programNama || data.program} />
            ) : null}
            <Baris label={`Asal ${istilah.statUnit}`} nilai={data.asalSekolah} />
              <Baris label="Nama wali" nilai={data.namaWali} />
              <Baris label="Telepon" nilai={data.telepon} />
              <Baris label="Email" nilai={data.email} />
              <Baris label="Alamat" nilai={data.alamat} />
              <Baris label="Masuk" nilai={data.dibuat ? tanggalJam(data.dibuat) : ""} />
              <Baris label="Diperbarui" nilai={data.diperbarui ? tanggalJam(data.diperbarui) : ""} />
            </div>

            {data.berkas.length > 0 ? (
              <div className="mt-3 rounded-2xl border border-black/[0.08] p-3">
                <p className="text-[10px] font-bold tracking-[0.1em] text-persis-800 uppercase">
                  Berkas ({data.berkas.length})
                </p>
                <ul className="mt-2 space-y-1.5">
                  {data.berkas.map((b, i) => (
                    <li key={`${b.url ?? "berkas"}-${i}`}>
                      {b.url ? (
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-[11.5px] font-semibold text-persis-900 underline decoration-gold-400 underline-offset-2"
                        >
                          <Icon name="image" className="h-[15px] w-[15px] text-gold-600" />
                          {b.nama || `Berkas ${i + 1}`}
                        </a>
                      ) : (
                        <span className="text-[11.5px] text-ink-400">{b.nama || `Berkas ${i + 1}`}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {wa ? (
              <a
                data-testid="popup-whatsapp"
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-persis-900/20 py-2.5 text-[11.5px] font-semibold text-persis-900"
              >
                <Icon name="phone" className="h-[15px] w-[15px] text-gold-600" />
                Hubungi wali lewat WhatsApp
              </a>
            ) : null}

            <div className="mt-4 space-y-3">
              <AreaTeks
                label="Catatan verifikasi"
                testid="popup-catatan"
                nilai={catatan}
                onUbah={setCatatan}
                baris={3}
                petunjuk="Misalnya: berkas kurang, akan diambil ulang, atau catatan wawancara."
              />
              <TombolSimpan
                testid="popup-simpan-catatan"
                label="Simpan catatan"
                sibuk={sibuk === "catatan"}
                onClick={() => void simpanCatatan()}
              />
            </div>

            {hasil ? <div className="mt-3"><Pesan tipe={hasil.tipe} teks={hasil.teks} /></div> : null}

            <div className="mt-4 rounded-2xl bg-cream-50 p-3">
              <p className="text-[10px] font-bold tracking-[0.1em] text-persis-800 uppercase">Ubah status</p>
              <p className="mt-1 text-justify text-[10.5px] leading-relaxed text-ink-600">
                Verifikasi bila berkasnya sudah lengkap — data pendaftar langsung masuk ke daftar siswa/mahasiswa
                sekolah — atau tolak bila tidak memenuhi syarat.
              </p>
              <div className="mt-3 space-y-2">
                {data.status !== "diverifikasi" ? (
                  <button
                    type="button"
                    data-testid="popup-verifikasi"
                    disabled={sibuk !== null}
                    onClick={() => void ubahStatus("diverifikasi")}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-persis-900/25 py-2.5 text-[11.5px] font-semibold text-persis-900 disabled:opacity-50"
                  >
                    <Icon name="check" className="h-[15px] w-[15px] text-gold-600" />
                    Tandai sudah diverifikasi
                  </button>
                ) : null}
                {data.status !== "ditolak" ? (
                  <button
                    type="button"
                    data-testid="popup-tolak"
                    disabled={sibuk !== null}
                    onClick={() => void ubahStatus("ditolak")}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 py-2.5 text-[11.5px] font-semibold text-rose-700 disabled:opacity-50"
                  >
                    <Icon name="x" className="h-[15px] w-[15px]" />
                    Tolak pendaftaran
                  </button>
                ) : null}
                {data.status !== "baru" ? (
                  <button
                    type="button"
                    data-testid="popup-kembalikan"
                    disabled={sibuk !== null}
                    onClick={() => void ubahStatus("baru")}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-black/[0.12] py-2.5 text-[11.5px] font-semibold text-ink-600 disabled:opacity-50"
                  >
                    <Icon name="refresh" className="h-[15px] w-[15px]" />
                    Kembalikan ke perlu verifikasi
                  </button>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
