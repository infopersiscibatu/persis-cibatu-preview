import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import { tanggalPendek } from "../../lib/format";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import { daftarPendaftar, ubahStatusPendaftar, type Pendaftar, type StatusPendaftar } from "../../lib/unitSpmb";
import PopupPendaftar from "./PopupPendaftar";
import { useIstilah } from "../../lib/istilah";

/**
 * Antrean verifikasi di Dashboard: pendaftar berstatus baru, bisa langsung
 * diverifikasi atau ditolak tanpa berpindah menu.
 */
export default function AntreanVerifikasi({
  versi = 0,
  onBerubah,
}: {
  versi?: number;
  onBerubah?: () => void;
}) {
  const istilah = useIstilah();
  const [baris, setBaris] = useState<Pendaftar[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [bukaId, setBukaId] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await daftarPendaftar("baru", "", 50);
      setBaris(jawab.pendaftar);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Antrean verifikasi belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat, versi]);

  const ubah = async (p: Pendaftar, status: StatusPendaftar) => {
    if (status === "ditolak") {
      const lanjut = await mintaKonfirmasi(`Tandai pendaftaran ${p.nama} sebagai ditolak?`, {
        judul: "Konfirmasi tolak",
        nada: "tanya",
        labelYa: "Ya, tolak",
      });
      if (!lanjut) return;
    }
    setSibuk(p.id);
    try {
      const jawab = await ubahStatusPendaftar(p.id, status);
      beritahu(
        "sukses",
        status === "diverifikasi"
          ? `${p.nama} sudah diverifikasi${jawab.santri?.ditambah ? ` dan datanya masuk ke daftar ${istilah.sebutanKecil}` : ""}.`
          : `${p.nama} ditandai ditolak.`,
      );
      await muat();
      onBerubah?.();
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Status gagal diubah.");
    } finally {
      setSibuk(null);
    }
  };

  return (
    <section
      data-testid="spmb-verifikasi"
      className="mt-3.5 rounded-2xl border border-gold-400/40 bg-white p-3.5"
    >
      <KepalaKartu
        judul="Perlu diverifikasi"
        keterangan="Pendaftar baru yang belum diperiksa. Verifikasi kalau berkasnya sudah lengkap — datanya langsung masuk ke daftar siswa/mahasiswa sekolah — atau tolak kalau tidak memenuhi syarat."
        angka={baris.length}
        labelAngka="antrean"
        testidAngka="spmb-verifikasi-jumlah"
      />

      {memuat ? (
        <p className="mt-3 text-[11px] text-ink-400">Memuat antrean…</p>
      ) : galat ? (
        <p className="mt-3 text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
      ) : baris.length === 0 ? (
        <p
          data-testid="spmb-verifikasi-kosong"
          className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400"
        >
          Tidak ada pendaftar yang menunggu verifikasi. Semua pendaftar sudah diperiksa.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {baris.map((p) => (
            <li
              key={p.id}
              data-testid={`spmb-verifikasi-baris-${p.id}`}
              className="rounded-2xl border border-black/[0.08] bg-cream-50/60 p-3"
            >
              <button
                type="button"
                data-testid={`spmb-verifikasi-buka-${p.id}`}
                onClick={() => setBukaId(p.id)}
                className="flex w-full items-start justify-between gap-2 text-left"
              >
                <span className="min-w-0">
                  <span className="block text-[11.5px] leading-snug font-semibold text-ink-900">{p.nama}</span>
                  <span className="mt-0.5 block text-[9.5px] text-ink-400">
                    {[p.nomor, p.gelombang, p.asalSekolah].filter(Boolean).join(" · ")}
                  </span>
                  <span className="mt-0.5 block text-[9.5px] text-ink-400">
                    Masuk {p.dibuat ? tanggalPendek(p.dibuat) : "—"}
                    {p.telepon ? ` · ${p.telepon}` : ""}
                  </span>
                </span>
                <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-[9.5px] font-semibold text-persis-900">
                  Rincian
                  <Icon name="chevron-right" className="h-[13px] w-[13px]" />
                </span>
              </button>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid={`spmb-verifikasi-setujui-${p.id}`}
                  disabled={sibuk === p.id}
                  onClick={() => void ubah(p, "diverifikasi")}
                  className="rounded-full bg-persis-900 py-2 text-[10.5px] font-semibold text-white disabled:opacity-50"
                >
                  Verifikasi
                </button>
                <button
                  type="button"
                  data-testid={`spmb-verifikasi-tolak-${p.id}`}
                  disabled={sibuk === p.id}
                  onClick={() => void ubah(p, "ditolak")}
                  className="rounded-full border border-rose-200 bg-rose-50 py-2 text-[10.5px] font-semibold text-rose-700 disabled:opacity-50"
                >
                  Tolak
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {bukaId ? (
        <PopupPendaftar
          id={bukaId}
          onTutup={() => setBukaId(null)}
          onBerubah={() => {
            void muat();
            onBerubah?.();
          }}
        />
      ) : null}
    </section>
  );
}
