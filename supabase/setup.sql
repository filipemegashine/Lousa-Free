-- Lousa Livre: salas ao vivo no Supabase
-- Cole tudo no SQL Editor do projeto e clique em Run (pode rodar de novo sem problema).

create table if not exists public.lousa_rooms (
  code text primary key,
  board_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.lousa_items (
  room text not null references public.lousa_rooms(code) on delete cascade,
  id text not null,
  ts double precision not null default 0,
  by text not null default '',
  data jsonb not null,
  primary key (room, id)
);
alter table public.lousa_rooms enable row level security;
alter table public.lousa_items enable row level security;
-- sem políticas nas tabelas: o acesso é só pelas funções abaixo,
-- e só quem sabe o código da sala consegue ler ou escrever nela

create or replace function public.lousa_create_room(p_code text, p_board text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_code !~ '^[A-Z0-9]{8}$' or length(p_board) > 80 then return false; end if;
  insert into lousa_rooms(code, board_id) values (p_code, p_board) on conflict (code) do nothing;
  return found;
end $$;

create or replace function public.lousa_room(p_code text)
returns text language sql stable security definer set search_path = public as $$
  select board_id from lousa_rooms where code = upper(p_code);
$$;

create or replace function public.lousa_get(p_code text)
returns setof jsonb language sql stable security definer set search_path = public as $$
  select data from lousa_items where room = upper(p_code);
$$;

create or replace function public.lousa_upsert(p_code text, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from lousa_rooms where code = upper(p_code)) then
    raise exception 'sala inexistente';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 2000 then
    raise exception 'lote invalido';
  end if;
  insert into lousa_items(room, id, ts, by, data)
  select distinct on (e->>'id') upper(p_code), e->>'id',
         coalesce((e->>'ts')::float8, 0), coalesce(e->>'by', ''), e
  from jsonb_array_elements(p_items) e
  where e ? 'id' and length(e->>'id') <= 80 and pg_column_size(e) < 1500000
  order by e->>'id', coalesce((e->>'ts')::float8, 0) desc
  on conflict (room, id) do update
    set ts = excluded.ts, by = excluded.by, data = excluded.data
    where excluded.ts > lousa_items.ts
       or (excluded.ts = lousa_items.ts and excluded.by > lousa_items.by);
  update lousa_rooms set updated_at = now() where code = upper(p_code);
end $$;

revoke all on function public.lousa_create_room(text, text), public.lousa_room(text),
  public.lousa_get(text), public.lousa_upsert(text, jsonb) from public;
grant execute on function public.lousa_create_room(text, text), public.lousa_room(text),
  public.lousa_get(text), public.lousa_upsert(text, jsonb) to anon, authenticated;

-- Arquivos colados nos quadros (imagens, PDFs, vídeos) — até 25 MB cada
insert into storage.buckets (id, name, public, file_size_limit)
values ('lousa-media', 'lousa-media', true, 26214400)
on conflict (id) do nothing;

drop policy if exists "lousa: enviar arquivos" on storage.objects;
create policy "lousa: enviar arquivos" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'lousa-media');
