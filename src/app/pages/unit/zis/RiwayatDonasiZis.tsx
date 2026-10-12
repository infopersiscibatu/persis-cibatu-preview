import { useCallback, useState } from "react";
import { KepalaBorang } from "../../../components/admin/Form";
import { rupiah, tanggalPendek } from "../../../lib/format";
import { ambilRiwayatDonasiZis, useZisData, type RiwayatDonasiZis } from "../../../lib/zis";
import { Bagian, Kosong, Lencana, PilSaring, TabelKartu } from "./Bagian";

/**
 * Riwayat Donasi — semua donasi yang masuk ke situs, terbaru lebih dahulu.
 * Tabelnya memuat nama donatur, program donasi, dan nominal donasi, serta status
 * pemeriksaannya supaya petugas tahu mana yang belum diverifikasi.
 */

const warnaStatus = (status: RiwayatDonasiZis["status"]) =>
  status === "dikonfirmasi" ? "hijau" : status === "ditolak" ? "merah" : "emas";

const labelStatus = (status: RiwayatDonasiZis["status"]) =>
  status === "dikonfirmasi" ? "Diverifikasi" : status === "ditolak" ? "Ditolak" : "Menunggu";

export default function RiwayatDonasiZis() {
  const [status, setStatus] = useState("semua");
  const muat = useCallback(() => ambilRiwayatDonasiZis(status), [status]);
  const { data, memuat, galat, muat: segarkan } = useZisData(muat);

  const daftar = data?.donasi ?? [];
  const ringkas = data?.ringkas ?? { transaksi: 0, dikonfirmasi: 0, menunggu: 0, ditolak: 0, total: 0 };

  return (
    <div data-testid="zis-riwayat-donasi">
      <KepalaBorang
        judul="Riwayat Donasi"
        keterangan="Semua donasi yang masuk lewat formulir situs beserta statusnya. Donasi yang masih menunggu diperiksa pada kartu Perlu Verifikasi di Dashboard."
      />

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-persis-900/25 bg-persis-900 p-3.5 text-white">
          <p className="text-[9.5px] font-bold tracking-[0.1em] text-gold-300 uppercase">Total Diverifikasi</p>
          <p data-testid="riwayat-total" className="font-header mt-2 text-[15.5px] leading-none font-extrabold">
            {rupiah(ringkas.total)}
          </p>
          <p className="mt-1.5 text-[10px] text-white/70">{ringkas.dikonfirmasi} donasi sudah diverifikasi.</p>
        </div>
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
          <p className="text-[9.5px] font-bold tracking-[0.1em] text-ink-400 uppercase">Transaksi</p>
          <p data-testid="riwayat-transaksi" className="font-header mt-2 text-[20px] leading-none font-extrabold text-persis-900">
            {ringkas.transaksi}
          </p>
          <p className="mt-1.5 text-[10px] text-ink-400">
            {ringkas.menunggu} menunggu · {ringkas.ditolak} ditolak
          </p>
        </div>
      </div>

      <div className="mt-3.5">
        <Bagian
          testid="zis-riwayat-daftar"
          judul="Tabel Donasi Masuk"
          keterangan="Nama donatur, program donasi, dan nominal donasi. Donasi anonim ditampilkan sebagai Hamba Allah."
          jumlah={daftar.length}
          nada={daftar.length > 0 ? "emas" : "redup"}
        >
          <PilSaring
            testid="riwayat-saring"
            nilai={status}
            onUbah={setStatus}
            opsi={[
              { nilai: "semua", label: "Semua" },
              { nilai: "menunggu", label: "Menunggu" },
              { nilai: "dikonfirmasi", label: "Diverifikasi" },
              { nilai: "ditolak", label: "Ditolak" },
            ]}
          />

          <div className="mt-3">
            {memuat && !data ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-[54px] animate-pulse rounded-2xl border border-black/[0.06] bg-white" />
                ))}
              </div>
            ) : galat && !data ? (
              <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
                <p className="text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
                <button
                  type="button"
                  onClick={() => void segarkan()}
                  className="mt-2.5 rounded-full bg-persis-900 px-3.5 py-1.5 text-[11px] font-semibold text-white"
                >
                  Muat ulang
                </button>
              </div>
            ) : daftar.length === 0 ? (
              <Kosong
                testid="riwayat-kosong"
                teks="Belum ada donasi pada pilihan ini. Setiap donasi yang dikirim lewat formulir di halaman program akan tercatat di sini."
              />
            ) : (
              <TabelKartu testid="riwayat-tabel">
                <thead>
                  <tr className="border-b border-black/[0.08] bg-cream-50 text-[10px] tracking-wide text-ink-500 uppercase">
                    <th className="px-3 py-2.5 font-bold">Nama donatur</th>
                    <th className="px-3 py-2.5 font-bold">Program donasi</th>
                    <th className="px-3 py-2.5 text-right font-bold">Nominal</th>
                    <th className="px-3 py-2.5 font-bold">Waktu</th>
                    <th className="px-3 py-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {daftar.map((d) => (
                    <tr
                      key={d.id}
                      data-testid={`riwayat-baris-${d.id}`}
                      className="border-b border-black/[0.05] last:border-0"
                    >
                      <td className="px-3 py-2.5">
                        <span className="block font-semibold text-ink-900">{d.nama}</span>
                        <span className="block text-[10px] text-ink-400">{d.nomor}</span>
                      </td>
                      <td className="px-3 py-2.5 text-ink-600">{d.program || "Tanpa program"}</td>
                      <td
                        data-testid={`riwayat-nominal-${d.id}`}
                        className="px-3 py-2.5 text-right font-semibold text-persis-900"
                      >
                        {rupiah(d.jumlah)}
                      </td>
                      <td className="px-3 py-2.5 text-[10.5px] text-ink-500">
                        {tanggalPendek(d.dibuat)}
                        <span className="block text-[10px] text-ink-400">{d.metode || "Metode belum dicatat"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Lencana teks={labelStatus(d.status)} warna={warnaStatus(d.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TabelKartu>
            )}
          </div>
        </Bagian>
      </div>
    </div>
  );
}
