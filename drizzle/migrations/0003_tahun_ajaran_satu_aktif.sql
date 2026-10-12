ALTER TABLE public.tahun_ajaran ADD COLUMN IF NOT EXISTS dibuat timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.tahun_ajaran ADD COLUMN IF NOT EXISTS diperbarui timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS idx_tahun_ajaran_satu_aktif ON public.tahun_ajaran ((true)) WHERE aktif;
DROP TRIGGER IF EXISTS trg_tahun_ajaran_diperbarui ON public.tahun_ajaran;
CREATE TRIGGER trg_tahun_ajaran_diperbarui BEFORE UPDATE ON public.tahun_ajaran FOR EACH ROW EXECUTE FUNCTION public.set_diperbarui();