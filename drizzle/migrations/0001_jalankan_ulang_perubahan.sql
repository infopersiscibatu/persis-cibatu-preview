do $$
declare isi text;
begin
  select content into isi from extensions.http_get('https://raw.githubusercontent.com/infopersiscibatu/Website-Utama/main/server/db/perubahan.sql');
  if isi is null or length(isi) < 1000 then raise exception 'perubahan.sql tidak terbaca'; end if;
  execute isi;
end $$;
revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;