import { useEffect, useState } from "react";
import { Kolom, Kotak, Pilih, Sakelar, Tanggal, TombolIkon, TombolSimpan } from "../../components/admin/Form";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import {
  aktifkanTahunAjaran,
  ambilTahunAjaran,
  hapusTahunAjaran,
  tambahTahunAjaran,
  ubahTahunAjaran,
  type TahunAjaran,
} from "../../lib/admin";

type Borang = { id?: string; nama: string; semester: string; mulai: string; selesai: string; aktif: boolean };
const kosong: Borang = { nama: "", semester: "Ganjil", mulai: "", selesai: "", aktif: false };

const tgl = (v: string | null) =>
  v ? new Date(`${v}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "";

/**
 * Daftar tahun ajaran. Tahun yang ditandai aktif otomatis dipakai seluruh halaman
 * admin lain: Admin Sekolah, Tata Usaha (tagihan), nilai, dan rapor.
 */
export default function DaftarTahunAjaran() {
  const [data, setData] = useState<TahunAjaran[] | null>(null);
  const [borang, setBorang] = useState<Borang | null>(null);
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    ambilTahunAjaran()
      .then((j) => setData(j.tahunAjaran))
      .catch((e) => beritahu("galat", e.message));
  }, []);

  const jalankan = async (kerja: () => Promise<{ tahunAjaran: TahunAjaran[] }>, sukses: string) => {
    setSibuk(true);
    try {
      const j = await kerja();
      setData(j.tahunAjaran);
      beritahu("sukses", sukses);
      return true;
    } catch (e) {
      beritahu("galat", (e as Error).message);
      return false;
    } finally {
      setSibuk(false);
    }
  };

  const simpan = async () => {
    if (!borang) return;
    const isi = { nama: borang.nama, semester: borang.semester, mulai: borang.mulai, selesai: borang.selesai };
    const ok = borang.id
      ? await jalankan(async () => {
          const j = await ubahTahunAjaran(borang.id as string, isi);
          return borang.aktif ? aktifkanTahunAjaran(borang.id as string) : j;
        }, "Tahun ajaran disimpan.")
      : await jalankan(() => tambahTahunAjaran({ ...isi, aktif: borang.aktif }), "Tahun ajaran ditambahkan.");
    if (ok) setBorang(null);
  };

  const aktif = data?.find((t) => t.aktif);

  return (
    <div data-testid="admin-tahun-ajaran" className="space-y-4">
      <div className="rounded-2xl bg-persis-900 px-4 py-3.5 text-white">
        <p className="text-[9px] font-semibold tracking-[0.16em] text-gold-300 uppercase">Sedang aktif</p>
        <p data-testid="ta-aktif" className="mt-0.5 text-[15px] font-bold">
          {aktif ? `${aktif.nama}${aktif.semester ? ` · Semester ${aktif.semester}` : ""}` : "Belum ada"}
        </p>
        <p className="mt-1 text-[10.5px] leading-relaxed text-white/70">
          Otomatis dipakai di semua halaman admin: Admin Sekolah, Tata Usaha, nilai, dan tagihan baru.
        </p>
      </div>

      {borang ? (
        <Kotak judul={borang.id ? "Ubah tahun ajaran" : "Tambah tahun ajaran"}>
          <div className="space-y-3">
            <Kolom
              label="Nama tahun ajaran"
              nilai={borang.nama}
              onUbah={(v) => setBorang({ ...borang, nama: v })}
              placeholder="Mis. 2026/2027"
              testid="ta-nama"
            />
            <Pilih
              label="Semester"
              nilai={borang.semester}
              onUbah={(v) => setBorang({ ...borang, semester: v })}
              opsi={[
                { nilai: "Ganjil", label: "Ganjil" },
                { nilai: "Genap", label: "Genap" },
              ]}
            />
            <div className="grid grid-cols-2 gap-3">
              <Tanggal label="Mulai" nilai={borang.mulai} onUbah={(v) => setBorang({ ...borang, mulai: v })} />
              <Tanggal label="Selesai" nilai={borang.selesai} onUbah={(v) => setBorang({ ...borang, selesai: v })} />
            </div>
            <Sakelar
              label="Jadikan tahun ajaran aktif"
              nilai={borang.aktif}
              onUbah={(v) => setBorang({ ...borang, aktif: v })}
              petunjuk="Tahun ajaran aktif sebelumnya otomatis dinonaktifkan."
            />
            <div className="flex gap-2">
              <TombolSimpan onClick={simpan} sibuk={sibuk} nonaktif={!borang.nama.trim()} testid="ta-simpan" />
              <button
                type="button"
                onClick={() => setBorang(null)}
                className="rounded-full border border-black/[0.12] px-4 text-[11.5px] font-semibold text-persis-900"
              >
                Batal
              </button>
            </div>
          </div>
        </Kotak>
      ) : (
        <button
          type="button"
          data-testid="ta-tambah"
          onClick={() => setBorang({ ...kosong })}
          className="w-full rounded-full bg-persis-900 py-2.5 text-[12px] font-semibold text-white"
        >
          + Tambah tahun ajaran
        </button>
      )}

      <div className="space-y-2">
        {data === null ? <p className="text-[11px] text-ink-400">Memuat…</p> : null}
        {data?.length === 0 ? <p className="text-[11px] text-ink-400">Belum ada tahun ajaran.</p> : null}
        {data?.map((t) => (
          <div
            key={t.id}
            data-testid={`ta-baris-${t.id}`}
            className={`flex items-center gap-3 rounded-2xl border bg-white p-3 ${
              t.aktif ? "border-persis-900" : "border-black/[0.08]"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold text-persis-900">
                {t.nama}
                {t.semester ? <span className="font-medium text-ink-400"> · {t.semester}</span> : null}
              </p>
              <p className="text-[10px] text-ink-400">
                {t.mulai || t.selesai ? `${tgl(t.mulai)} – ${tgl(t.selesai)}` : "Tanggal belum diisi"}
              </p>
            </div>
            {t.aktif ? (
              <span className="rounded-full bg-mint-deep px-2.5 py-1 text-[9.5px] font-bold text-persis-800">Aktif</span>
            ) : (
              <button
                type="button"
                data-testid={`ta-aktifkan-${t.id}`}
                disabled={sibuk}
                onClick={() => void jalankan(() => aktifkanTahunAjaran(t.id), `${t.nama} sekarang aktif.`)}
                className="rounded-full border border-black/[0.12] px-2.5 py-1 text-[9.5px] font-semibold text-persis-900"
              >
                Aktifkan
              </button>
            )}
            <TombolIkon
              nama="edit"
              label="Ubah"
              onClick={() =>
                setBorang({
                  id: t.id,
                  nama: t.nama,
                  semester: t.semester ?? "Ganjil",
                  mulai: t.mulai ?? "",
                  selesai: t.selesai ?? "",
                  aktif: t.aktif,
                })
              }
            />
            <TombolIkon
              nama="trash"
              label="Hapus"
              bahaya
              nonaktif={t.aktif || sibuk}
              onClick={async () => {
                if (await mintaKonfirmasi(`Hapus tahun ajaran ${t.nama}?`))
                  void jalankan(() => hapusTahunAjaran(t.id), "Tahun ajaran dihapus.");
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
