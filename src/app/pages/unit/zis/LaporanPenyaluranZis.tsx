import { useCallback, useState } from "react";
import {
  Angka,
  AreaTeks,
  KepalaBorang,
  Kolom,
  Pesan,
  Pilih,
  Tanggal,
  TombolIkon,
  TombolSimpan,
} from "../../../components/admin/Form";
import { rupiah, tanggalPendek } from "../../../lib/format";
import { beritahu, mintaKonfirmasi } from "../../../lib/notifikasiAdmin";
import {
  ambilLaporanZis,
  hapusLaporanZis,
  simpanLaporanZis,
  useZisData,
  type BorangLaporanZis,
  type LaporanZis,
} from "../../../lib/zis";
import { Bagian, Kosong, Lencana } from "./Bagian";

/**
 * Laporan Penyaluran — riwayat laporan yang tampil pada tab "Riwayat" di halaman
 * program donasi. Satu catatan bisa berjenis Laporan (catatan kegiatan) atau
 * Penyaluran (pencairan dana, wajib menyertakan jumlah penyaluran).
 *
 * Total penyaluran pada kartu statistik Dashboard dihitung dari catatan berjenis
 * Penyaluran, jadi angka di halaman ini dan di Dashboard selalu sama.
 */

const angkaDari = (teks: string) => Math.round(Number(String(teks).replace(/[^\d]/g, "")) || 0);
const hariIni = () => new Date().toISOString().slice(0, 10);

export default function LaporanPenyaluranZis() {
  const [programSaring, setProgramSaring] = useState("");
  const muat = useCallback(() => ambilLaporanZis(programSaring || undefined), [programSaring]);
  const { data, setData, memuat, galat, muat: segarkan } = useZisData(muat);

  const [borang, setBorang] = useState<(BorangLaporanZis & { id?: string }) | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  const daftar: LaporanZis[] = data?.laporan ?? [];
  const program = data?.program ?? [];
  const totalPenyaluran = daftar.filter((l) => l.jenis === "penyaluran").reduce((t, l) => t + l.nominal, 0);

  const jumlahPenyaluranSemua = daftar.filter((l) => l.jenis === "penyaluran").length;

  const bukaBorang = (l?: LaporanZis) => {
    setPesan(null);
    setBorang(
      l
        ? {
            id: l.id,
            programId: l.programId,
            tanggal: l.tanggal || hariIni(),
            jenis: l.jenis,
            judul: l.judul,
            keterangan: l.keterangan,
            nominal: l.nominal,
          }
        : {
            programId: programSaring || program[0]?.id || "",
            tanggal: hariIni(),
            jenis: "laporan",
            judul: "",
            keterangan: "",
            nominal: 0,
          },
    );
  };

  const simpan = async () => {
    if (!borang) return;
    setSibuk(true);
    setPesan(null);
    try {
      const hasil = await simpanLaporanZis(
        {
          programId: borang.programId,
          tanggal: borang.tanggal,
          jenis: borang.jenis,
          judul: borang.judul,
          keterangan: borang.keterangan,
          nominal: borang.jenis === "penyaluran" ? borang.nominal : 0,
        },
        borang.id,
      );
      setData(hasil);
      beritahu("sukses", borang.id ? "Laporan diperbarui." : "Laporan ditambahkan.");
      setBorang(null);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Laporan tidak bisa disimpan." });
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async (l: LaporanZis) => {
    const lanjut = await mintaKonfirmasi(
      `Hapus laporan “${l.judul}” pada program ${l.program}? Catatan ini akan hilang dari halaman program di situs.`,
      { judul: "Hapus laporan", labelYa: "Ya, hapus" },
    );
    if (!lanjut) return;
    try {
      setData(await hapusLaporanZis(l.id));
      beritahu("sukses", "Laporan dihapus.");
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Laporan tidak bisa dihapus.");
    }
  };

  return (
    <div data-testid="zis-laporan">
      <KepalaBorang
        judul="Laporan Penyaluran"
        keterangan="Riwayat laporan tiap program donasi di situs. Pilih jenis Penyaluran bila catatan itu pencairan dana, lalu isi jumlah penyalurannya."
      />

      {borang ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.08] bg-white p-4">
          <h2 className="font-header text-[13px] font-bold text-ink-900">
            {borang.id ? "Ubah laporan" : "Laporan baru"}
          </h2>
          <Pilih
            testid="laporan-program"
            label="Program donasi"
            nilai={borang.programId}
            onUbah={(v) => setBorang({ ...borang, programId: v })}
            opsi={program.map((p) => ({ nilai: p.id, label: p.judul }))}
            placeholder="Pilih program"
          />
          <Tanggal
            testid="laporan-tanggal"
            label="Tanggal"
            nilai={borang.tanggal}
            onUbah={(v) => setBorang({ ...borang, tanggal: v })}
          />
          <Pilih
            testid="laporan-jenis"
            label="Jenis laporan"
            nilai={borang.jenis}
            onUbah={(v) => setBorang({ ...borang, jenis: v === "penyaluran" ? "penyaluran" : "laporan" })}
            opsi={[
              { nilai: "laporan", label: "Laporan" },
              { nilai: "penyaluran", label: "Penyaluran" },
            ]}
            petunjuk="Penyaluran dipakai untuk pencairan dana dan ikut dihitung pada total penyaluran."
          />
          <Kolom
            testid="laporan-judul"
            label="Nama laporan"
            nilai={borang.judul}
            onUbah={(v) => setBorang({ ...borang, judul: v })}
            placeholder="Mis. Pencairan dana tahap 2"
          />
          <AreaTeks
            testid="laporan-keterangan"
            label="Isi laporan"
            nilai={borang.keterangan}
            onUbah={(v) => setBorang({ ...borang, keterangan: v })}
            baris={4}
            petunjuk="Keterangan yang dibaca donatur pada halaman program di situs."
          />
          {borang.jenis === "penyaluran" ? (
            <Angka
              testid="laporan-nominal"
              label="Jumlah penyaluran (Rp)"
              nilai={borang.nominal ? String(borang.nominal) : ""}
              onUbah={(v) => setBorang({ ...borang, nominal: angkaDari(v) })}
              placeholder="Mis. 25000000"
              petunjuk="Angka rupiah tanpa titik. Ikut dihitung pada kartu Jumlah Penyaluran di Dashboard."
            />
          ) : null}
          {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
          <div className="flex flex-wrap items-center gap-2">
            <TombolSimpan
              sibuk={sibuk}
              testid="simpan-laporan"
              label={borang.id ? "Simpan perubahan" : "Tambah laporan"}
              onClick={() => void simpan()}
            />
            <button
              type="button"
              data-testid="batal-laporan"
              onClick={() => {
                setBorang(null);
                setPesan(null);
              }}
              className="rounded-full border border-black/[0.12] px-3.5 py-2 text-[11.5px] font-semibold text-ink-600"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-3.5 space-y-3.5">
        <Bagian
          testid="zis-laporan-daftar"
          judul="Riwayat Laporan"
          keterangan="Semua catatan yang tampil di tab Riwayat pada halaman program. Urutannya menurut tanggal terbaru."
          jumlah={daftar.length}
          nada={daftar.length > 0 ? "hijau" : "redup"}
          aksi={
            <button
              type="button"
              data-testid="tambah-laporan"
              onClick={() => bukaBorang()}
              className="rounded-full bg-persis-900 px-3 py-1.5 text-[11px] font-bold text-white"
            >
              Tambah
            </button>
          }
        >
          <div className="space-y-2.5">
            <Pilih
              testid="laporan-saring"
              label="Tampilkan program"
              nilai={programSaring}
              onUbah={(v) => setProgramSaring(v)}
              opsi={program.map((p) => ({ nilai: p.id, label: p.judul }))}
              placeholder="Semua program"
            />
            {jumlahPenyaluranSemua > 0 ? (
              <p className="text-[10.5px] text-ink-500">
                Total penyaluran yang ditampilkan: <b className="text-persis-900">{rupiah(totalPenyaluran)}</b> dari{" "}
                {jumlahPenyaluranSemua} pencairan.
              </p>
            ) : null}
          </div>

          <div className="mt-3">
            {memuat && !data ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-[86px] animate-pulse rounded-2xl border border-black/[0.06] bg-white" />
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
                testid="laporan-kosong"
                teks="Belum ada laporan untuk pilihan ini. Tekan Tambah untuk membuat catatan pertama."
              />
            ) : (
              <ul className="space-y-2.5">
                {daftar.map((l) => (
                  <li
                    key={l.id}
                    data-testid={`laporan-baris-${l.id}`}
                    className="rounded-2xl border border-black/[0.08] bg-white p-3.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Lencana
                            teks={l.jenis === "penyaluran" ? "Penyaluran" : "Laporan"}
                            warna={l.jenis === "penyaluran" ? "emas" : "hijau"}
                          />
                          <span className="text-[10px] text-ink-500">{tanggalPendek(l.tanggal) || "Tanpa tanggal"}</span>
                        </div>
                        <p className="mt-1.5 text-[12.5px] leading-snug font-bold text-ink-900">{l.judul}</p>
                        <p className="mt-0.5 text-[10px] text-ink-500">{l.program || "Program tidak ditemukan"}</p>
                        {l.jenis === "penyaluran" ? (
                          <p
                            data-testid={`laporan-nominal-${l.id}`}
                            className="font-header mt-1 text-[12px] font-extrabold text-persis-900"
                          >
                            {rupiah(l.nominal)}
                          </p>
                        ) : null}
                        {l.keterangan ? (
                          <p className="mt-1.5 line-clamp-3 text-justify text-[10.5px] leading-relaxed text-ink-600">
                            {l.keterangan}
                          </p>
                        ) : null}
                      </div>
                      <TombolIkon
                        nama="pencil"
                        label={`Ubah laporan ${l.judul}`}
                        testid={`laporan-ubah-${l.id}`}
                        onClick={() => {
                          bukaBorang(l);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      />
                      <TombolIkon
                        nama="trash"
                        label={`Hapus laporan ${l.judul}`}
                        bahaya
                        testid={`laporan-hapus-${l.id}`}
                        onClick={() => void hapus(l)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Bagian>
      </div>
    </div>
  );
}
