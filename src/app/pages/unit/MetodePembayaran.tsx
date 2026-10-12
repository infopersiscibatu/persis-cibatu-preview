import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/Icons";
import { DaftarTeks, Kolom, Pesan, Sakelar, TombolSimpan } from "../../components/admin/Form";
import PilihGambar from "../../components/admin/PilihGambar";
import { beritahu, mintaKonfirmasi } from "../../lib/notifikasiAdmin";
import {
  daftarMetodeTU,
  hapusMetodeTU,
  tambahMetodeTU,
  ubahMetodeTU,
  type IsianMetode,
  type MetodeUnit,
} from "../../lib/unitTataUsaha";
import { KepalaKartu } from "../../components/admin/KepalaKartu";
import Lembar from "./Lembar";
import { useIstilah } from "../../lib/istilah";

/**
 * Menu Metode Pembayaran: bendahara tata usaha merapikan daftar cara pembayaran yang
 * ditawarkan — rekening transfer, QRIS, tunai, dan sebagainya. Satu daftar dipakai
 * bersama semua unit: tampil di portal wali dan di borang Catat pembayaran pada tagihan.
 */

const kosong: IsianMetode = {
  nama: "",
  keterangan: "",
  bank: "",
  nomor: "",
  atasNama: "",
  langkah: [""],
  gambarUrl: "",
  mediaId: null,
  urutan: "",
  aktif: true,
};

export default function MetodePembayaran() {
  const istilah = useIstilah();
  const [data, setData] = useState<Awaited<ReturnType<typeof daftarMetodeTU>> | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState("");
  const [form, setForm] = useState<{ id: string | null; isian: IsianMetode } | null>(null);
  const [pesanForm, setPesanForm] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await daftarMetodeTU();
      setData(jawab);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Daftar metode pembayaran belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const bukaTambah = () => {
    const berikutnya = String((data?.metode.length ?? 0) + 1);
    setForm({ id: null, isian: { ...kosong, urutan: berikutnya } });
    setPesanForm(null);
  };

  const bukaUbah = (m: MetodeUnit) => {
    setForm({
      id: m.id,
      isian: {
        nama: m.nama,
        keterangan: m.keterangan,
        bank: m.bank,
        nomor: m.nomor,
        atasNama: m.atasNama,
        langkah: m.langkah.length > 0 ? m.langkah : [""],
        gambarUrl: m.gambarUrl,
        mediaId: m.mediaId,
        urutan: String(m.urutan),
        aktif: m.aktif,
      },
    });
    setPesanForm(null);
  };

  const simpan = async () => {
    if (!form) return;
    setSibuk(form.id ?? "baru");
    setPesanForm(null);
    try {
      const jawab = form.id ? await ubahMetodeTU(form.id, form.isian) : await tambahMetodeTU(form.isian);
      beritahu("sukses", jawab.pesan);
      setForm(null);
      await muat();
    } catch (e) {
      setPesanForm({ tipe: "galat", teks: e instanceof Error ? e.message : "Metode pembayaran gagal disimpan." });
    } finally {
      setSibuk("");
    }
  };

  const hapus = async (m: MetodeUnit) => {
    const setuju = await mintaKonfirmasi(
      `Metode “${m.nama}” dihapus dari daftar. Riwayat pembayaran yang sudah tercatat tetap utuh, hanya tidak lagi ditawarkan pada pembayaran baru.`,
      { judul: "Hapus metode pembayaran", labelYa: "Ya, hapus" },
    );
    if (!setuju) return;
    setSibuk(m.id);
    try {
      const jawab = await hapusMetodeTU(m.id);
      beritahu("sukses", jawab.pesan);
      await muat();
    } catch (e) {
      beritahu("galat", e instanceof Error ? e.message : "Metode pembayaran gagal dihapus.");
    } finally {
      setSibuk("");
    }
  };

  const daftar = data?.metode ?? [];

  return (
    <section data-testid="tu-metode" className="mt-4">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-3.5">
        <KepalaKartu
          judul="Metode Pembayaran"
          keterangan={`Atur cara pembayaran yang ditawarkan ke ${istilah.waliKecil}: rekening transfer, QRIS, tunai di bendahara, dan sebagainya. Untuk QRIS, unggah gambar kode QR resmi supaya ${istilah.waliKecil} dapat langsung memindainya pada halaman pembayaran. Daftar ini dipakai bersama seluruh unit — tampil di portal wali dan di borang Catat pembayaran pada menu Tagihan.`}
          tombol={
            <button
              type="button"
              data-testid="tu-metode-tambah"
              onClick={bukaTambah}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-persis-900 py-2.5 text-[11.5px] font-semibold text-white"
            >
              <Icon name="plus" className="h-[15px] w-[15px]" />
              Tambah metode pembayaran
            </button>
          }
        />

        {memuat && !data ? (
          <p className="mt-3 text-[11px] text-ink-400">Memuat metode pembayaran…</p>
        ) : galat && !data ? (
          <p className="mt-3 text-justify text-[11px] leading-relaxed text-ink-600">{galat}</p>
        ) : daftar.length === 0 ? (
          <p data-testid="tu-metode-kosong" className="mt-3 text-justify text-[11px] leading-relaxed text-ink-400">
            Belum ada metode pembayaran. Tambahkan paling sedikit satu, misalnya rekening transfer, agar{" "}
            {istilah.waliKecil} tahu ke mana pembayarannya dikirim.
          </p>
        ) : (
          <ul className="mt-3 space-y-2" data-testid="tu-metode-daftar">
            {daftar.map((m) => (
              <li key={m.id} data-testid={`tu-metode-baris-${m.id}`}>
                <div className="flex items-stretch gap-1.5 rounded-xl border border-black/[0.08]">
                  {m.gambarUrl ? (
                    <img
                      src={m.gambarUrl}
                      alt={`Gambar metode ${m.nama}`}
                      data-testid={`tu-metode-gambar-${m.id}`}
                      className="my-2.5 ml-2.5 h-14 w-14 shrink-0 rounded-lg border border-black/[0.08] bg-white object-contain p-1"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[11.5px] font-semibold text-ink-900">{m.nama}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          m.aktif ? "bg-persis-100 text-persis-900" : "bg-cream-100 text-ink-500"
                        }`}
                      >
                        {m.aktif ? `aktif · urutan ${m.urutan}` : "dimatikan"}
                      </span>
                    </div>
                    {m.bank || m.nomor || m.atasNama ? (
                      <p className="mt-0.5 truncate text-[10px] text-ink-500">
                        {[m.bank, m.nomor, m.atasNama].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                    {m.keterangan ? (
                      <p className="mt-0.5 text-justify text-[10px] leading-relaxed text-ink-400">{m.keterangan}</p>
                    ) : null}
                    <p className="mt-0.5 text-[9.5px] text-ink-400">
                      {m.dipakai > 0 ? `${m.dipakai} pembayaran memakai metode ini` : "belum pernah dipakai"}
                      {m.gambarUrl ? " · bergambar" : ""}
                      {m.langkah.length > 0 ? ` · ${m.langkah.length} langkah` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col border-l border-black/[0.07]">
                    <button
                      type="button"
                      data-testid={`tu-metode-ubah-${m.id}`}
                      aria-label={`Ubah metode ${m.nama}`}
                      onClick={() => bukaUbah(m)}
                      className="grid flex-1 w-10 place-items-center text-persis-900"
                    >
                      <Icon name="pencil" className="h-[14px] w-[14px]" />
                    </button>
                    <button
                      type="button"
                      data-testid={`tu-metode-hapus-${m.id}`}
                      aria-label={`Hapus metode ${m.nama}`}
                      disabled={sibuk === m.id}
                      onClick={() => void hapus(m)}
                      className="grid flex-1 w-10 place-items-center border-t border-black/[0.07] text-rose-700 disabled:opacity-50"
                    >
                      <Icon name="trash" className="h-[14px] w-[14px]" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-justify text-[10px] leading-relaxed text-ink-400">
          Mengganti nama metode berlaku untuk pembayaran berikutnya dan tampilan di portal wali; riwayat pembayaran
          yang sudah tercatat tetap menyimpan nama metode saat pembayarannya diterima. Metode yang dimatikan tidak
          dihapus, hanya tidak lagi ditawarkan.
        </p>
      </div>

      {form ? (
        <Lembar
          testid="form-metode"
          judul={form.id ? `Ubah metode: ${form.isian.nama || "—"}` : "Tambah metode pembayaran"}
          keterangan="Isi keterangan yang cukup agar wali tidak salah mengirim pembayaran."
          onTutup={() => {
            setForm(null);
            setPesanForm(null);
          }}
        >
          <PilihGambar
            testid="metode-gambar"
            label={/qris/i.test(form.isian.nama) ? "Gambar kode QRIS" : "Gambar metode (opsional)"}
            petunjuk={
              /qris/i.test(form.isian.nama)
                ? `Gambar ini tampil pada instruksi pembayaran di portal ${istilah.waliKecil}, jadi gunakan kode QR resmi. Format PNG atau JPG persegi, maksimal 25 MB.`
                : `Tidak wajib. Bila diunggah, gambar ini tampil pada instruksi pembayaran di portal ${istilah.waliKecil}.`
            }
            bentuk={/qris/i.test(form.isian.nama) ? "persegi" : "landscape"}
            rasio="h-[210px]"
            folder="metode-pembayaran"
            nilai={form.isian.gambarUrl}
            onUbah={({ url, mediaId }) => setForm({ ...form, isian: { ...form.isian, gambarUrl: url, mediaId } })}
          />
          <div className="mt-3 space-y-3">
            <Kolom
              testid="metode-nama"
              label="Nama metode"
              nilai={form.isian.nama}
              onUbah={(v) => setForm({ ...form, isian: { ...form.isian, nama: v } })}
              placeholder="Misalnya Transfer Bank"
            />
            <Kolom
              testid="metode-keterangan"
              label="Keterangan singkat"
              nilai={form.isian.keterangan}
              onUbah={(v) => setForm({ ...form, isian: { ...form.isian, keterangan: v } })}
              placeholder="Misalnya rekening resmi lembaga"
            />
            <Kolom
              testid="metode-bank"
              label="Bank / penyedia (boleh dikosongkan)"
              nilai={form.isian.bank}
              onUbah={(v) => setForm({ ...form, isian: { ...form.isian, bank: v } })}
              placeholder="Misalnya Bank BRI"
            />
            <Kolom
              testid="metode-nomor"
              label="Nomor rekening / kode (boleh dikosongkan)"
              nilai={form.isian.nomor}
              onUbah={(v) => setForm({ ...form, isian: { ...form.isian, nomor: v } })}
              placeholder="Misalnya 0123-4567-8901-234"
            />
            <Kolom
              testid="metode-atas-nama"
              label="Atas nama (boleh dikosongkan)"
              nilai={form.isian.atasNama}
              onUbah={(v) => setForm({ ...form, isian: { ...form.isian, atasNama: v } })}
              placeholder="Misalnya PC PERSIS Cibatu"
            />
            <DaftarTeks
              testid="metode-langkah"
              label="Langkah pembayaran (boleh dikosongkan)"
              nilai={form.isian.langkah}
              onUbah={(v) => setForm({ ...form, isian: { ...form.isian, langkah: v } })}
              petunjuk={`Bila diisi, langkah ini menggantikan instruksi bawaan pada halaman pembayaran di portal ${istilah.waliKecil}.`}
            />
            <Kolom
              testid="metode-urutan"
              label="Urutan tampil"
              nilai={form.isian.urutan}
              onUbah={(v) => setForm({ ...form, isian: { ...form.isian, urutan: v.replace(/[^0-9]/g, "").slice(0, 3) } })}
              placeholder="1"
            />
            <Sakelar
              testid="metode-aktif"
              label="Ditawarkan ke wali"
              petunjuk="Matikan bila metode ini untuk sementara tidak dipakai. Selain tidak ditawarkan, datanya tetap tersimpan."
              nilai={form.isian.aktif}
              onUbah={(v) => setForm({ ...form, isian: { ...form.isian, aktif: v } })}
            />
          </div>
          {pesanForm ? (
            <div className="mt-3">
              <Pesan tipe={pesanForm.tipe} teks={pesanForm.teks} />
            </div>
          ) : null}
          <div className="mt-4">
            <TombolSimpan
              testid="metode-simpan"
              label={form.id ? "Simpan perubahan" : "Tambah metode"}
              sibuk={Boolean(sibuk)}
              onClick={() => void simpan()}
            />
          </div>
        </Lembar>
      ) : null}
    </section>
  );
}
