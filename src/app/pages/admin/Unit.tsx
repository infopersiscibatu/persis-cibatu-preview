import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/Icons";
import { Kolom, Kotak, Pesan, Sakelar, TombolSimpan } from "../../components/admin/Form";
import { beritahu } from "../../lib/notifikasiAdmin";
import {
  ambilAdminZis,
  ambilAdminUnitSekolah,
  acakPinZis,
  acakPinSekolah,
  simpanAdminUnitSekolah,
  simpanAdminZis,
  type SekolahUnit,
  type Zis,
} from "../../lib/admin";
import { bukaHalaman } from "../../lib/navigasi";

/**
 * Admin unit per sekolah. Satu sekolah memakai satu PIN untuk masuk ke halaman
 * SPMB, Sekolah, dan Tata Usaha sekolah itu. Nama pengurus tiap unit dicatat
 * agar jelas siapa yang bertanggung jawab.
 */

const KARTU = {
  spmb: { label: "Admin SPMB", ikon: "clipboard" },
  sekolah: { label: "Admin Sekolah", ikon: "school" },
  tu: { label: "Admin Tata Usaha", ikon: "wallet" },
} as const;

type Baris = SekolahUnit & { kotor?: boolean };

export function AdminUnit() {
  const [sekolah, setSekolah] = useState<Baris[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [cari, setCari] = useState("");
  const [buka, setBuka] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);
  const [terlihat, setTerlihat] = useState<Record<string, boolean>>({});

  const terapkan = (daftar: SekolahUnit[]) => setSekolah(daftar.map((s) => ({ ...s })));

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await ambilAdminUnitSekolah();
      terapkan(jawab.sekolah ?? []);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Tabel admin unit belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const tampil = useMemo(() => {
    const kunci = cari.trim().toLowerCase();
    if (!kunci) return sekolah;
    return sekolah.filter((s) => s.nama.toLowerCase().includes(kunci) || s.jenjang.toLowerCase().includes(kunci));
  }, [sekolah, cari]);

  const isi = (unitId: string, sebagian: Partial<Baris>) => {
    setSekolah((s) => s.map((b) => (b.unitId === unitId ? { ...b, ...sebagian, kotor: true } : b)));
  };

  const simpan = async (b: Baris) => {
    setSibuk(b.unitId);
    setPesan(null);
    try {
      const jawab = await simpanAdminUnitSekolah(b.unitId, {
        adminSpmb: b.adminSpmb,
        adminSekolah: b.adminSekolah,
        adminTu: b.adminTu,
        aktif: b.aktif,
      });
      terapkan(jawab.sekolah ?? []);
      beritahu("sukses", `Data admin ${b.nama} disimpan.`);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menyimpan data sekolah." });
    } finally {
      setSibuk(null);
    }
  };

  const acakPin = async (b: Baris) => {
    setSibuk(b.unitId);
    setPesan(null);
    try {
      const jawab = await acakPinSekolah(b.unitId);
      terapkan(jawab.sekolah ?? []);
      setTerlihat((v) => ({ ...v, [b.unitId]: true }));
      beritahu("sukses", `PIN baru ${b.nama}: ${jawab.pin ?? "-"}`);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal membuat PIN baru." });
    } finally {
      setSibuk(null);
    }
  };

  const aktif = sekolah.filter((s) => s.aktif).length;

  return (
    <div data-testid="admin-unit">
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3">
          <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-persis-800 uppercase">
            <Icon name="school" className="h-[14px] w-[14px] shrink-0" />
            Sekolah terdaftar
          </span>
          <span className="font-header mt-1.5 block text-[17px] leading-tight font-extrabold text-persis-900">
            {sekolah.length}
          </span>
        </div>
        <div className="rounded-2xl border border-black/[0.08] bg-white p-3">
          <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-persis-800 uppercase">
            <Icon name="shield" className="h-[14px] w-[14px] shrink-0" />
            PIN aktif
          </span>
          <span className="font-header mt-1.5 block text-[17px] leading-tight font-extrabold text-persis-900">
            {aktif}
          </span>
        </div>
      </div>

      <section className="mt-3.5 rounded-2xl border border-black/[0.08] bg-white p-3" data-testid="tabel-admin-unit">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-header text-[12.5px] font-bold text-ink-900">Tabel admin unit pendidikan</h2>
          <span className="text-[10px] text-ink-400">
            {tampil.length} dari {sekolah.length} sekolah
          </span>
        </div>

        <label className="mt-2.5 block">
          <span className="sr-only">Cari unit pendidikan</span>
          <input
            type="search"
            data-testid="cari-sekolah"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama unit pendidikan…"
            className="w-full rounded-xl border border-black/[0.10] bg-white px-3.5 py-2 text-[12px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-persis-800/40"
          />
        </label>

        <div
          className="mt-2.5 grid gap-x-2 border-b border-black/[0.06] pb-1.5 text-[9px] font-bold tracking-[0.08em] text-ink-400 uppercase"
          style={{ gridTemplateColumns: "1.5fr 0.9fr 0.5fr" }}
        >
          <span>Unit</span>
          <span>PIN</span>
          <span className="text-right">Atur</span>
        </div>

        {memuat ? (
          <p className="mt-2 text-[11px] text-ink-400">Memuat tabel admin unit…</p>
        ) : galat ? (
          <div className="mt-2">
            <p className="text-justify text-[11px] leading-relaxed text-ink-400">{galat}</p>
            <button
              type="button"
              data-testid="muat-ulang-unit"
              onClick={() => void muat()}
              className="mt-2 rounded-full bg-persis-900 px-3.5 py-1.5 text-[11px] font-semibold text-white"
            >
              Muat ulang
            </button>
          </div>
        ) : tampil.length === 0 ? (
          <p className="mt-2 text-justify text-[11px] leading-relaxed text-ink-400">
            Tidak ada sekolah yang cocok dengan pencarian.
          </p>
        ) : (
          <ul className="divide-y divide-black/[0.05]">
            {tampil.map((b) => {
              const terbuka = buka === b.unitId;
              return (
                <li key={b.unitId} data-testid={`unit-sekolah-${b.unitId}`} className="py-2">
                  <div className="grid items-center gap-x-2" style={{ gridTemplateColumns: "1.5fr 0.9fr 0.5fr" }}>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[11.5px] leading-snug font-semibold text-ink-900">{b.nama}</p>
                      <p className="text-[9.5px] text-ink-400">
                        {b.jenjang}
                        {b.aktif ? "" : " · PIN nonaktif"}
                      </p>
                    </div>
                    <div className="flex min-w-0 items-center gap-1">
                      <span
                        data-testid={`pin-sekolah-${b.unitId}`}
                        className="font-header text-[13px] font-extrabold tracking-[0.14em] text-persis-900"
                      >
                        {terlihat[b.unitId] ? b.pin : "••••"}
                      </span>
                      <button
                        type="button"
                        data-testid={`lihat-pin-${b.unitId}`}
                        aria-label={terlihat[b.unitId] ? `Sembunyikan PIN ${b.nama}` : `Lihat PIN ${b.nama}`}
                        onClick={() => setTerlihat((v) => ({ ...v, [b.unitId]: !v[b.unitId] }))}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-black/[0.09] text-persis-900"
                      >
                        <Icon name="eye" className="h-[14px] w-[14px]" />
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        data-testid={`buka-sekolah-${b.unitId}`}
                        aria-expanded={terbuka}
                        aria-label={`Atur admin ${b.nama}`}
                        onClick={() => {
                          setBuka(terbuka ? null : b.unitId);
                          setPesan(null);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-black/[0.09] bg-white text-persis-900"
                      >
                        <Icon
                          name="chevron-right"
                          className="h-[15px] w-[15px] transition-transform"
                          style={{ transform: terbuka ? "rotate(90deg)" : undefined }}
                        />
                      </button>
                    </div>
                  </div>

                  {terbuka ? (
                    <div
                      data-testid={`atur-sekolah-${b.unitId}`}
                      className="mt-2.5 space-y-2.5 rounded-xl bg-cream-50/70 p-3"
                    >
                      <Kolom
                        label={KARTU.spmb.label}
                        testid={`admin-spmb-${b.unitId}`}
                        nilai={b.adminSpmb}
                        onUbah={(v) => isi(b.unitId, { adminSpmb: v })}
                        placeholder="Nama petugas pendaftaran"
                      />
                      <Kolom
                        label={KARTU.sekolah.label}
                        testid={`admin-sekolah-${b.unitId}`}
                        nilai={b.adminSekolah}
                        onUbah={(v) => isi(b.unitId, { adminSekolah: v })}
                        placeholder="Nama petugas data peserta didik"
                      />
                      <Kolom
                        label={KARTU.tu.label}
                        testid={`admin-tu-${b.unitId}`}
                        nilai={b.adminTu}
                        onUbah={(v) => isi(b.unitId, { adminTu: v })}
                        placeholder="Nama petugas tagihan & pembayaran"
                      />
                      <Sakelar
                        label="PIN unit aktif"
                        petunjuk="Bila dimatikan, PIN unit ini tidak bisa dipakai masuk sampai diaktifkan lagi."
                        testid={`aktif-pin-${b.unitId}`}
                        nilai={b.aktif}
                        onUbah={(v) => isi(b.unitId, { aktif: v })}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <TombolSimpan
                          penuh={false}
                          sibuk={sibuk === b.unitId}
                          testid={`simpan-sekolah-${b.unitId}`}
                          label="Simpan"
                          onClick={() => void simpan(b)}
                        />
                        <button
                          type="button"
                          data-testid={`acak-pin-${b.unitId}`}
                          onClick={() => void acakPin(b)}
                          className="inline-flex items-center gap-2 rounded-full border border-black/[0.12] px-3.5 py-2 text-[11px] font-semibold text-persis-900"
                        >
                          <Icon name="sparkle" className="h-[14px] w-[14px]" />
                          Buat PIN baru
                        </button>
                      </div>
                      {pesan && buka === b.unitId ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        PIN ditampilkan agar mudah dibagikan ke sekolah, jadi simpan halaman ini hanya untuk pengurus. Bila satu PIN
        diduga bocor, tekan "Buat PIN baru" pada unit itu — sesi yang sedang berjalan dari PIN lama langsung
        dihentikan.
      </p>
    </div>
  );
}

export function AdminZis() {
  const [zis, setZis] = useState<Zis | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [aktif, setAktif] = useState(true);
  const [terlihat, setTerlihat] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "galat"; teks: string } | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const jawab = await ambilAdminZis();
      const nilai = jawab.zis ?? { pin: "", nama: "", aktif: true };
      setZis(nilai);
      setNama(nilai.nama);
      setAktif(nilai.aktif);
      setGalat(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Pengaturan Admin ZIS belum bisa dimuat.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const simpan = async () => {
    setSibuk(true);
    setPesan(null);
    try {
      const jawab = await simpanAdminZis({ nama, aktif });
      setZis(jawab.zis ?? null);
      beritahu("sukses", "Pengaturan Admin ZIS disimpan.");
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal menyimpan pengaturan." });
    } finally {
      setSibuk(false);
    }
  };

  const acak = async () => {
    setSibuk(true);
    setPesan(null);
    try {
      const jawab = await acakPinZis();
      setZis(jawab.zis ?? null);
      setTerlihat(true);
      beritahu("sukses", `PIN baru Admin ZIS: ${jawab.zis?.pin ?? "-"}`);
    } catch (e) {
      setPesan({ tipe: "galat", teks: e instanceof Error ? e.message : "Gagal membuat PIN baru." });
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div data-testid="admin-zis">
      {memuat ? (
        <p className="mt-4 text-[11px] text-ink-400">Memuat pengaturan…</p>
      ) : galat ? (
        <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4">
          <p className="text-justify text-[11px] leading-relaxed text-ink-400">{galat}</p>
          <button
            type="button"
            data-testid="muat-ulang-zis"
            onClick={() => void muat()}
            className="mt-2 rounded-full bg-persis-900 px-3.5 py-1.5 text-[11px] font-semibold text-white"
          >
            Muat ulang
          </button>
        </div>
      ) : (
        <>
          <section className="mt-4 rounded-2xl border border-black/[0.08] bg-white p-4" data-testid="pin-admin-zis">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-header text-[13px] font-bold text-ink-900">PIN Admin ZIS</h2>
                <p className="mt-0.5 text-justify text-[11px] leading-relaxed text-ink-600">
                  PIN ini dipakai petugas ZIS untuk masuk ke halaman Admin ZIS.
                </p>
              </div>
              <button
                type="button"
                data-testid="lihat-pin-zis"
                aria-label={terlihat ? "Sembunyikan PIN Admin ZIS" : "Lihat PIN Admin ZIS"}
                onClick={() => setTerlihat((v) => !v)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-black/[0.09] text-persis-900"
              >
                <Icon name="eye" className="h-[15px] w-[15px]" />
              </button>
            </div>
            <p
              data-testid="nilai-pin-zis"
              className="font-header mt-3 text-[24px] leading-none font-extrabold tracking-[0.18em] text-persis-900"
            >
              {terlihat ? (zis?.pin ?? "—") : "••••"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="acak-pin-zis"
                onClick={() => void acak()}
                className="inline-flex items-center gap-2 rounded-full border border-black/[0.12] px-3.5 py-2 text-[11px] font-semibold text-persis-900"
              >
                <Icon name="sparkle" className="h-[14px] w-[14px]" />
                Buat PIN baru
              </button>
              <button
                type="button"
                data-testid="buka-zis"
                onClick={() => bukaHalaman("#/admin/zis")}
                className="inline-flex items-center gap-2 rounded-full bg-persis-900 px-3.5 py-2 text-[11px] font-semibold text-white transition active:scale-[0.98]"
              >
                <Icon name="heart" className="h-[14px] w-[14px]" />
                Buka Halaman Admin ZIS
              </button>
            </div>
          </section>

          <div className="mt-3.5">
            <Kotak
              judul="Pengaturan"
              keterangan="Nama petugas ZIS dipakai sebagai penanggung jawab pada halaman Admin ZIS nanti."
              testid="pengaturan-zis"
            >
              <div className="space-y-3">
                <Kolom
                  label="Nama penanggung jawab ZIS"
                  testid="zis-nama"
                  nilai={nama}
                  onUbah={setNama}
                  placeholder="Mis. Ustadz Abdul Hakim"
                />
                <Sakelar
                  label="PIN Admin ZIS aktif"
                  petunjuk="Bila dimatikan, PIN ini tidak bisa dipakai masuk sampai diaktifkan lagi."
                  testid="zis-aktif"
                  nilai={aktif}
                  onUbah={setAktif}
                />
                {pesan ? <Pesan tipe={pesan.tipe} teks={pesan.teks} /> : null}
                <TombolSimpan
                  sibuk={sibuk}
                  testid="simpan-zis"
                  label="Simpan pengaturan"
                  onClick={() => void simpan()}
                />
              </div>
            </Kotak>
          </div>
        </>
      )}

      <p className="mt-4 text-justify text-[10.5px] leading-relaxed text-ink-400">
        PIN di halaman ini dipakai petugas ZIS untuk masuk ke halaman Admin ZIS (juga bisa dibuka lewat tombol di
        atas). Halaman Admin ZIS berisi statistik donasi, program, donatur, dan penyaluran. Halaman Admin SPMB, Admin
        Sekolah, dan Admin Tata Usaha memakai PIN tiap sekolah pada menu Sekolah.
      </p>
    </div>
  );
}
