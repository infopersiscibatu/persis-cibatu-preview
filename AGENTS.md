<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The original PERSIS Cibatu app lives in `src/app/` and is rendered client-only from `src/routes/index.tsx` (it uses hash navigation); keeps the imported code intact while migrating.
- `legacy-server/` is the untouched original server for reference; the running copy is `src/legacy-api/` (auto-converted to ESM) served by `src/routes/api/$.ts` through a tiny Express shim, so original route code stays unchanged.
- Legacy SQL runs via service-role RPC `public.jalankan_sql` with client-side literal parameter substitution; all public tables are RLS-locked with no anon/authenticated grants because only the server touches them.
- Web Push is implemented with WebCrypto in `src/legacy-api/lib/webpush-shim.js` (drop-in for the Node-only web-push library).
- Foreground push banners receive same-origin service-worker messages in one app-level BannerPush; native notifications remain enabled because background presentation belongs to the OS.
- Uploaded files live in the private `media` bucket and are served by `src/routes/berkas/$.ts`.
- PWA manifest uses only transparent `any` icons, referenced through asset pointers, to avoid an opaque maskable tile on the OS splash. Loading logos are clipped to a circle without a drop shadow; keep the pre-hydration fallback consistent with LayarMuat because the OS splash itself cannot be disabled.
- Public sharing uses one content formatter and floating share controls across detail views; server-visible `/api/public/bagikan/*` URLs return per-item Open Graph HTML from published public content and continue readers to the original hash destination, because crawlers cannot read hash navigation. Preserve native image sharing when supported and never assume a platform accepts prefilled captions.
