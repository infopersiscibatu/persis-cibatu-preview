import { useProfil } from "../lib/profil";

/**
 * Layar pembuka situs: logo lembaga dan teks "Memuat Data" selama data pertama
 * (identitas, profil, pengurus) masih diambil dari layanan. Dipasang di App supaya
 * pengunjung tidak melihat halaman kosong atau setengah jadi saat membuka situs,
 * termasuk ketika alamatnya langsung menuju halaman panel.
 */
export default function LayarMuat() {
  const { identitas } = useProfil();

  return (
    <div
      data-testid="layar-muat"
      role="status"
      aria-live="polite"
      aria-label="Memuat data situs"
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-3.5 bg-persis-900 px-8 text-center text-white"
    >
      {/* Logo tampil langsung tanpa latar: berkas logonya sudah berlatarbelakang transparan. */}
      <img
        data-testid="layar-muat-logo"
        src={identitas.logo}
        alt={identitas.logoAlt}
        className="h-[118px] w-[118px] object-contain drop-shadow-[0_10px_26px_rgba(0,0,0,0.45)]"
        draggable={false}
      />

      <p className="font-header mt-1 text-[15px] leading-tight font-extrabold tracking-[0.01em]">Memuat Data</p>
      <p className="max-w-[280px] text-[11px] leading-relaxed text-white/70">{identitas.namaLengkap}</p>

      <span className="mt-1.5 flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 0.16}s` }}
            className="muat-titik block h-1.5 w-1.5 rounded-full bg-gold-300"
          />
        ))}
      </span>
    </div>
  );
}
