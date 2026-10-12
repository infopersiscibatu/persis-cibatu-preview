create extension if not exists http with schema extensions;

do $$
declare isi text;
begin
  select content into isi from extensions.http_get('https://raw.githubusercontent.com/infopersiscibatu/Website-Utama/main/server/db/skema.sql');
  if isi is null or length(isi) < 1000 then raise exception 'skema.sql tidak terbaca'; end if;
  execute isi;
  select content into isi from extensions.http_get('https://raw.githubusercontent.com/infopersiscibatu/Website-Utama/main/server/db/perubahan.sql');
  if isi is null or length(isi) < 1000 then raise exception 'perubahan.sql tidak terbaca'; end if;
  execute isi;
end $$;

do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('revoke all on public.%I from anon, authenticated', t.tablename);
    execute format('grant all on public.%I to service_role', t.tablename);
  end loop;
end $$;
revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.jalankan_sql(q text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare hasil jsonb; n bigint; awal text;
begin
  awal := lower(ltrim(regexp_replace(q, '^\s*(--[^\n]*\n\s*)*', '')));
  if awal like 'select%' or awal like 'with%' or awal like 'values%' or awal like '(%' or q ~* '\mreturning\M' then
    execute format('with t as (%s) select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from t', q) into hasil;
    return jsonb_build_object('rows', hasil, 'rowCount', jsonb_array_length(hasil));
  end if;
  execute q;
  get diagnostics n = row_count;
  return jsonb_build_object('rows', '[]'::jsonb, 'rowCount', n);
end $fn$;
revoke all on function public.jalankan_sql(text) from public, anon, authenticated;
grant execute on function public.jalankan_sql(text) to service_role;