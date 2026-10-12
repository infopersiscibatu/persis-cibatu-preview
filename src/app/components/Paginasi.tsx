import { Icon } from "./Icons";

/** Penomoran halaman daftar di portal wali santri — sama seperti rujukan. */
export default function Paginasi({
  halaman,
  totalHalaman,
  dari,
  sampai,
  total,
  satuan,
  testId,
  onChange,
}: {
  halaman: number;
  totalHalaman: number;
  dari: number;
  sampai: number;
  total: number;
  satuan: string;
  testId: string;
  onChange: (halaman: number) => void;
}) {
  if (totalHalaman <= 1) return null;

  return (
    <div data-testid={testId} className="mt-3 border-t border-black/[0.06] pt-3">
      <p className="text-center text-[10.5px] text-persis-900">
        Menampilkan {dari}–{sampai} dari {total} {satuan}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChange(halaman - 1)}
          disabled={halaman === 1}
          data-testid={`${testId}-sebelumnya`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-persis-900/20 bg-white py-2.5 text-[11.5px] font-bold text-persis-900 transition active:scale-[0.98] disabled:opacity-40"
        >
          <Icon name="chevron" className="h-3.5 w-3.5 rotate-180" />
          Sebelumnya
        </button>
        <span
          data-testid={`${testId}-halaman`}
          className="shrink-0 rounded-full bg-cream-100 px-3 py-1.5 text-[10.5px] font-bold text-persis-900"
        >
          {halaman} / {totalHalaman}
        </span>
        <button
          type="button"
          onClick={() => onChange(halaman + 1)}
          disabled={halaman === totalHalaman}
          data-testid={`${testId}-berikutnya`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-persis-900/20 bg-white py-2.5 text-[11.5px] font-bold text-persis-900 transition active:scale-[0.98] disabled:opacity-40"
        >
          Berikutnya
          <Icon name="chevron" className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
