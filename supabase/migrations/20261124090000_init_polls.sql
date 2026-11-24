-- Applied to Supabase project "meat-space-meet-up" (suyfpuxypzdfjqpjiqcg).
-- Tables are not reachable by anon/authenticated; all access goes through the
-- SECURITY DEFINER functions below, which never return tokens.

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 120),
  note text check (note is null or char_length(note) <= 500),
  organizer_name text not null check (char_length(organizer_name) between 1 and 60),
  admin_token text not null unique,
  created_at timestamptz not null default now()
);

create table public.poll_dates (
  poll_id uuid not null references public.polls(id) on delete cascade,
  day date not null,
  primary key (poll_id, day)
);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  edit_token text not null unique,
  is_organizer boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index responses_poll_id_idx on public.responses(poll_id);

create table public.answers (
  response_id uuid not null references public.responses(id) on delete cascade,
  day date not null,
  value char(1) not null check (value in ('y','m','n')),
  primary key (response_id, day)
);

alter table public.polls enable row level security;
alter table public.poll_dates enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;
revoke all on public.polls, public.poll_dates, public.responses, public.answers from anon, authenticated;

create or replace function public._token(n int) returns text
language sql volatile set search_path = '' as $$
  select encode(extensions.gen_random_bytes(n), 'hex')
$$;
revoke all on function public._token(int) from public, anon, authenticated;

-- answers: jsonb object {"YYYY-MM-DD": "y"|"m"|"n"} covering exactly the poll's dates
create or replace function public._write_answers(p_poll uuid, p_response uuid, p_answers jsonb)
returns void language plpgsql set search_path = '' as $$
declare
  n_days int;
  n_ok int;
begin
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'invalid answers';
  end if;
  select count(*) into n_days from public.poll_dates where poll_id = p_poll;
  select count(*) into n_ok
    from jsonb_each_text(p_answers) a
    join public.poll_dates d on d.poll_id = p_poll and d.day::text = a.key
    where a.value in ('y','m','n');
  if n_ok <> n_days or (select count(*) from jsonb_object_keys(p_answers)) <> n_days then
    raise exception 'answers must cover every date with y, m or n';
  end if;
  delete from public.answers where response_id = p_response;
  insert into public.answers(response_id, day, value)
    select p_response, a.key::date, a.value from jsonb_each_text(p_answers) a;
end $$;
revoke all on function public._write_answers(uuid, uuid, jsonb) from public, anon, authenticated;

create or replace function public.create_poll(p_title text, p_note text, p_organizer text, p_days date[])
returns table (slug text, admin_token text)
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_slug text;
  v_admin text := public._token(24);
  v_days date[];
begin
  select array_agg(distinct d order by d) into v_days from unnest(p_days) d where d is not null;
  if v_days is null or array_length(v_days, 1) < 1 or array_length(v_days, 1) > 60 then
    raise exception 'pick between 1 and 60 dates';
  end if;
  loop
    v_slug := substr(public._token(8), 1, 10);
    exit when not exists (select 1 from public.polls p where p.slug = v_slug);
  end loop;
  insert into public.polls(slug, title, note, organizer_name, admin_token)
    values (v_slug, btrim(p_title), nullif(btrim(coalesce(p_note, '')), ''), btrim(p_organizer), v_admin)
    returning id into v_id;
  insert into public.poll_dates(poll_id, day) select v_id, unnest(v_days);
  return query select v_slug, v_admin;
end $$;

-- Public view of a poll. Never returns tokens. me_id identifies the caller's own response if p_edit_token matches.
create or replace function public.get_poll(p_slug text, p_edit_token text default null, p_admin_token text default null)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'slug', p.slug,
    'title', p.title,
    'note', p.note,
    'organizer_name', p.organizer_name,
    'created_at', p.created_at,
    'is_admin', p_admin_token is not null and p.admin_token = p_admin_token,
    'days', coalesce((select jsonb_agg(d.day::text order by d.day) from public.poll_dates d where d.poll_id = p.id), '[]'::jsonb),
    'me_id', (select r.id from public.responses r where r.poll_id = p.id and p_edit_token is not null and r.edit_token = p_edit_token),
    'responses', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'name', r.name, 'is_organizer', r.is_organizer, 'updated_at', r.updated_at,
        'answers', coalesce((select jsonb_object_agg(a.day::text, a.value) from public.answers a where a.response_id = r.id), '{}'::jsonb)
      ) order by r.is_organizer desc, r.created_at)
      from public.responses r where r.poll_id = p.id), '[]'::jsonb)
  )
  from public.polls p where p.slug = p_slug
$$;

create or replace function public.submit_response(p_slug text, p_name text, p_answers jsonb, p_admin_token text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_poll public.polls;
  v_id uuid;
  v_token text := public._token(24);
begin
  select * into v_poll from public.polls where slug = p_slug;
  if not found then raise exception 'poll not found'; end if;
  insert into public.responses(poll_id, name, edit_token, is_organizer)
    values (v_poll.id, btrim(p_name), v_token, p_admin_token is not null and p_admin_token = v_poll.admin_token)
    returning id into v_id;
  perform public._write_answers(v_poll.id, v_id, p_answers);
  return v_token;
end $$;

create or replace function public.update_response(p_edit_token text, p_name text, p_answers jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_r public.responses;
begin
  select * into v_r from public.responses where edit_token = p_edit_token;
  if not found then return false; end if;
  update public.responses set name = btrim(p_name), updated_at = now() where id = v_r.id;
  perform public._write_answers(v_r.poll_id, v_r.id, p_answers);
  return true;
end $$;

create or replace function public.delete_response(p_edit_token text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  delete from public.responses where edit_token = p_edit_token;
  return found;
end $$;

revoke all on function public.create_poll(text, text, text, date[]) from public;
revoke all on function public.get_poll(text, text, text) from public;
revoke all on function public.submit_response(text, text, jsonb, text) from public;
revoke all on function public.update_response(text, text, jsonb) from public;
revoke all on function public.delete_response(text) from public;
grant execute on function public.create_poll(text, text, text, date[]) to anon;
grant execute on function public.get_poll(text, text, text) to anon;
grant execute on function public.submit_response(text, text, jsonb, text) to anon;
grant execute on function public.update_response(text, text, jsonb) to anon;
grant execute on function public.delete_response(text) to anon;
