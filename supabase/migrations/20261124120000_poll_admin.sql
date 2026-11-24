-- Organizer can edit a poll and close/reopen it (optionally with a final date).
-- While closed, responses cannot be added, edited or removed.

alter table public.polls
  add column closed_at timestamptz,
  add column final_day date;

create or replace function public.get_poll(p_slug text, p_edit_token text default null, p_admin_token text default null)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'slug', p.slug,
    'title', p.title,
    'note', p.note,
    'organizer_name', p.organizer_name,
    'created_at', p.created_at,
    'closed', p.closed_at is not null,
    'final_day', p.final_day::text,
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

-- Edit poll details and dates. Removing a date deletes everyone's answers for it;
-- added dates start unanswered.
create or replace function public.update_poll(
  p_slug text, p_admin_token text, p_title text, p_note text, p_organizer text, p_days date[]
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_poll public.polls;
  v_days date[];
begin
  select * into v_poll from public.polls where slug = p_slug and admin_token = p_admin_token;
  if not found then return false; end if;
  select array_agg(distinct d order by d) into v_days from unnest(p_days) d where d is not null;
  if v_days is null or array_length(v_days, 1) < 1 or array_length(v_days, 1) > 60 then
    raise exception 'pick between 1 and 60 dates';
  end if;
  update public.polls
    set title = btrim(p_title),
        note = nullif(btrim(coalesce(p_note, '')), ''),
        organizer_name = btrim(p_organizer),
        final_day = case when final_day = any(v_days) then final_day else null end
    where id = v_poll.id;
  delete from public.answers a using public.responses r
    where a.response_id = r.id and r.poll_id = v_poll.id and not (a.day = any(v_days));
  delete from public.poll_dates where poll_id = v_poll.id and not (day = any(v_days));
  insert into public.poll_dates(poll_id, day) select v_poll.id, unnest(v_days) on conflict do nothing;
  return true;
end $$;

-- Close (p_closed = true, optional p_final_day among the poll's dates) or reopen.
create or replace function public.set_poll_closed(p_slug text, p_admin_token text, p_closed boolean, p_final_day date default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_poll public.polls;
begin
  select * into v_poll from public.polls where slug = p_slug and admin_token = p_admin_token;
  if not found then return false; end if;
  if p_closed and p_final_day is not null
     and not exists (select 1 from public.poll_dates where poll_id = v_poll.id and day = p_final_day) then
    raise exception 'final date must be one of the poll dates';
  end if;
  update public.polls
    set closed_at = case when p_closed then coalesce(closed_at, now()) else null end,
        final_day = case when p_closed then p_final_day else null end
    where id = v_poll.id;
  return true;
end $$;

create or replace function public.submit_response(p_slug text, p_name text, p_answers jsonb, p_admin_token text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_poll public.polls;
  v_id uuid;
  v_token text := public._token(24);
begin
  select * into v_poll from public.polls where slug = p_slug;
  if not found then raise exception 'poll not found'; end if;
  if v_poll.closed_at is not null then raise exception 'this poll is closed'; end if;
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
  if exists (select 1 from public.polls where id = v_r.poll_id and closed_at is not null) then
    raise exception 'this poll is closed';
  end if;
  update public.responses set name = btrim(p_name), updated_at = now() where id = v_r.id;
  perform public._write_answers(v_r.poll_id, v_r.id, p_answers);
  return true;
end $$;

create or replace function public.delete_response(p_edit_token text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.responses r join public.polls p on p.id = r.poll_id
             where r.edit_token = p_edit_token and p.closed_at is not null) then
    raise exception 'this poll is closed';
  end if;
  delete from public.responses where edit_token = p_edit_token;
  return found;
end $$;

revoke all on function public.update_poll(text, text, text, text, text, date[]) from public;
revoke all on function public.set_poll_closed(text, text, boolean, date) from public;
grant execute on function public.update_poll(text, text, text, text, text, date[]) to anon;
grant execute on function public.set_poll_closed(text, text, boolean, date) to anon;
