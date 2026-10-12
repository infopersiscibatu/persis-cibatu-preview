import { useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { rupiah, tanggalPendek } from "../../lib/format";
import {
  riwayatPesertaTU,
  type JawabanRiwayatPeserta,
  type PesertaTunggakan,
} from "../../lib/unitTataUsaha";
import { useIstilah } from "../../lib/istilah";
import Lembar from "./Lembar";

/**
 * Lembar riwayat pembayaran satu peserta lulus — dibuka dari tabel Lunas.
 * Sifatnya hanya untuk dilihat: tidak ada tombol menagih atau membayar di sini,
 * karena tagihannya sudah lunas dan pembayaran yang menunggu diperiksa di menu Pembayaran.
 */

const WARNA_STATUS: Record<string, string> = {
  menunggu: "bg-gold-100 text-gold-800",
  terverifikasi: "bg-persis-100 text-persis-900",
  ditolak: "bg-rose-100 text-rose-700",
};

const LABEL_STATUS: Record<string, string> = {
  menunggu: "Menunggu verifikasi",
  terverifikasi: "Terverifikasi · lunas",
  ditolak: "Ditolak",
};

export default function RiwayatLulusan({
  peserta,
  onTutup,
}: {
  peserta: PesertaTunggakan;
  onTutup: () => void;
}) {
  const istilah = useIstilah();
  const [data, setData] = useState<JawabanRiwayatPeserta | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    setMemuat(true);
    riwayatPesertaTU(peserta.id)
      .then((jawab) => {
        if (batal) return;
        setData(jawab);
        setGalat(null);
      })
      .catch((e: unknown) => {
        if (batal) return;
        setGalat(e instanceof Error ? e.message : "Riwayat pembayaran belum bisa dimuat.");
      })
      .finally(() => {
        if (!batal) setMemuat(false);
      });
    return () => {
      batal = true;
    };
  }, [peserta.id]);

  const riwayat = data?.riwayat ?? null;
  const bayar = riwayat?.pembayaran ?? [];
  const tunggakan = data?.santri.tunggakan ?? peserta.nominal;
  const terverifikasi = riwayat?.terverifikasi ?? { jumlah: 0, nominal: 0 };

  const keterangan = [
    peserta.kelas || data?.santri.programNama || "",
    `${data?.santri.jumlahTagihan ?? peserta.jumlahTagihan} tagihan tercatat`,
    tunggakan > 0 ? `sisa tunggakan ${rupiah(tunggakan)}` : "tidak ada tunggakan",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Lembar
      testid="tu-lunas-lembar"
      judul={`Riwayat pembayaran — ${peserta.nama}`}
      keterangan={keterangan}
      onTutup={onTutup}
    >
      {memuat && !data ? (
        <p data-testid="tu-lunas-lembar-memuat" className="text-[11px] text-ink-400">
          Memuat riwayat pembayaran…
        </p>
      ) : galat && !data ? (
        <p data-testid="tu-lunas-lembar-galat" className="text-justify text-[11px] leading-relaxed text-ink-600">
          {galat}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-black/[0.08] p-2">
              <p className="text-[9px] font-bold tracking-[0.08em] text-ink-400 uppercase">Tagihan</p>
              <p data-testid="tu-lunas-lembar-tagihan" className="mt-0.5 text-[12px] font-extrabold text-persis-900">
                {data?.santri.jumlahTagihan ?? peserta.jumlahTagihan}
              </p>
              <p className="text-[9px] text-ink-400">tercatat</p>
            </div>
            <div className="rounded-xl border border-black/[0.08] p-2">
              <p className="text-[9px] font-bold tracking-[0.08em] text-ink-400 uppercase">Terverifikasi</p>
              <p className="mt-0.5 text-[12px] font-extrabold text-persis-900">{rupiah(terverifikasi.nominal)}</p>
              <p className="text-[9px] text-ink-400">{terverifikasi.jumlah} pembayaran</p>
            </div>
            <div className="rounded-xl border border-black/[0.08] p-2">
              <p className="text-[9px] font-bold tracking-[0.08em] text-ink-400 uppercase">Tunggakan</p>
              <p
                data-testid="tu-lunas-lembar-tunggakan"
                className={`mt-0.5 text-[12px] font-extrabold ${tunggakan > 0 ? "text-rose-700" : "text-persis-900"}`}
              >
                {rupiah(tunggakan)}
              </p>
              <p className="text-[9px] text-ink-400">{tunggakan > 0 ? "belum lunas" : "sudah lunas"}</p>
            </div>
          </div>

          {bayar.length === 0 ? (
            <p
              data-testid="tu-lunas-lembar-kosong"
              className="mt-3 text-justify text-[11px] leading-relaxed text-ink-500"
            >
              Belum ada pembayaran yang tercatat atas nama ini. Tagihannya sudah tidak menyisakan tunggakan, jadi
              namanya masuk tabel Lunas.
            </p>
          ) : (
            <table data-testid="tu-lunas-lembar-riwayat" className="mt-3 w-full border-collapse">
              <thead>
                <tr className="border-b border-black/[0.08] text-left text-[9px] font-bold tracking-[0.1em] text-ink-400 uppercase">
                  <th className="py-1.5 pr-2">Tanggal</th>
                  <th className="py-1.5 pr-2">Pembayaran</th>
                  <th className="py-1.5 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {bayar.map((p) => (
                  <tr key={p.id} data-testid={`tu-lunas-lembar-baris-${p.id}`} className="align-top">
                    <td className="py-2 pr-2 text-[10.5px] whitespace-nowrap text-ink-500">
                      {tanggalPendek(p.dibayarPada ?? p.dibuat ?? "")}
                    </td>
                    <td className="py-2 pr-2">
                      <span className="block text-[11px] leading-snug font-semibold text-ink-900">
                        {p.label || p.perLabel || p.jenis || "Pembayaran"}
                      </span>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          WARNA_STATUS[p.status] ?? WARNA_STATUS.menunggu
                        }`}
                      >
                        {LABEL_STATUS[p.status] ?? p.status}
                      </span>
                      <span className="mt-1 block text-[9.5px] text-ink-400">
                        {p.metode || "Metode belum dicatat"}
                        {p.diverifikasiPada ? ` · diverifikasi ${tanggalPendek(p.diverifikasiPada)}` : ""}
                      </span>
                      {p.catatan ? (
                        <span className="mt-0.5 block text-justify text-[9.5px] leading-snug text-ink-500">
                          {p.catatan}
                        </span>
                      ) : null}
                      {p.buktiUrl ? (
                        <a
                          href={p.buktiUrl}
                          target="_blank"
                          rel="noreferrer"
                          data-testid={`tu-lunas-lembar-bukti-${p.id}`}
                          className="mt-1 inline-block text-[10px] font-semibold text-persis-900 underline"
                        >
                          Lihat bukti pembayaran
                        </a>
                      ) : null}
                    </td>
                    <td className="py-2 text-right text-[11px] font-bold whitespace-nowrap text-persis-900">
                      {rupiah(p.jumlah)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-persis-900/15 bg-persis-50 px-3 py-2 text-justify text-[10px] leading-relaxed text-persis-900">
            <Icon name="info" className="mt-[1px] h-[13px] w-[13px] shrink-0" />
            <span>
              Riwayat ini hanya untuk dilihat. Tagihan {istilah.sebutanKecil} ini sudah lunas; pembayaran wali yang
              masih menunggu pemeriksaan diperiksa di menu Pembayaran.
            </span>
          </p>
        </>
      )}
    </Lembar>
  );
}
