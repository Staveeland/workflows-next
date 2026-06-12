-- Review-funn #7: /me-backstoppen flipper stale rader til 'feilet' med
-- kundens token -- ogsaa rader som aldri kom forbi 'innsendt'. Tillat
-- innsendt->feilet for kunde (med assessment/mockup frosset). Ellers
-- identisk med 20260612120000. Kjoert mot prod 2026-06-12.

create or replace function public.kartlegging_vakt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claims jsonb := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  jwt_role text;
  er_admin boolean;
begin
  -- Direkte SQL (postgres) og service role går fri — vedlikehold/bakrom.
  if claims is null then return new; end if;
  jwt_role := coalesce(claims->>'role', '');
  if jwt_role = 'service_role' then return new; end if;

  er_admin := public.is_portal_admin();

  if tg_op = 'DELETE' then
    if old.godkjent_at is not null then
      raise exception 'kartlegging: godkjente løp kan ikke hard-slettes (bruk slettet_at)';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if er_admin then return new; end if;
    if new.status not in ('innsendt','genererer') then
      raise exception 'kartlegging: ugyldig startstatus %', new.status;
    end if;
    if new.tilbud is not null or new.tilbud_sendt_at is not null
       or new.godkjent_at is not null or new.godkjent_vilkar is not null
       or new.liked_at is not null or new.uke is not null
       or new.admin_sett_at is not null or new.levert_at is not null
       or new.sluttrapport is not null or new.slettet_at is not null
       or new.assessment is not null or new.mockup_path is not null
       or new.kunde_sett_at is not null then
      raise exception 'kartlegging: felt utenfor kartleggingen kan ikke settes ved innsending';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at then
    raise exception 'kartlegging: identitetsfelt kan ikke endres';
  end if;

  if er_admin then
    if old.status in ('videre','levert') then
      if new.tilbud is distinct from old.tilbud
         or new.godkjent_at is distinct from old.godkjent_at
         or new.godkjent_vilkar is distinct from old.godkjent_vilkar then
        raise exception 'kartlegging: tilbud og godkjenning er låst etter godkjenning';
      end if;
    end if;
    if new.status is distinct from old.status then
      if not (
        (old.status in ('forslag_klart','likt') and new.status = 'tilbud_sendt')
        or (old.status = 'videre' and new.status = 'levert')
        or (old.status = 'levert' and new.status = 'videre')
        or (old.status = 'feilet' and new.status = 'genererer')
      ) then
        raise exception 'kartlegging: ugyldig statusovergang % -> %', old.status, new.status;
      end if;
    end if;
    return new;
  end if;

  -- KUNDE. Felt som ALLTID er frosset for kunder ved update:
  if new.answers is distinct from old.answers
     or new.lang is distinct from old.lang
     or new.uke is distinct from old.uke
     or new.admin_sett_at is distinct from old.admin_sett_at
     or new.tilbud_sendt_at is distinct from old.tilbud_sendt_at
     or new.slettet_at is distinct from old.slettet_at
     or new.sluttrapport is distinct from old.sluttrapport
     or new.levert_at is distinct from old.levert_at
     or new.tilbud is distinct from old.tilbud then
    raise exception 'kartlegging: feltet kan ikke endres av kunde';
  end if;

  if new.status is not distinct from old.status then
    if new.assessment is distinct from old.assessment
       or new.mockup_path is distinct from old.mockup_path
       or new.liked_at is distinct from old.liked_at
       or new.godkjent_at is distinct from old.godkjent_at
       or new.godkjent_vilkar is distinct from old.godkjent_vilkar then
      raise exception 'kartlegging: kun lest-markøren kan oppdateres uten statusovergang';
    end if;
    return new;
  end if;

  if (old.status = 'genererer' and new.status in ('forslag_klart','feilet'))
     or (old.status = 'innsendt' and new.status = 'feilet') then
    if new.liked_at is distinct from old.liked_at
       or new.godkjent_at is distinct from old.godkjent_at
       or new.godkjent_vilkar is distinct from old.godkjent_vilkar then
      raise exception 'kartlegging: ugyldig feltendring under generering';
    end if;
    -- innsendt->feilet er en ren backstop -- resultatfeltene skal staa uroert
    if old.status = 'innsendt'
       and (new.assessment is distinct from old.assessment
            or new.mockup_path is distinct from old.mockup_path) then
      raise exception 'kartlegging: ugyldig feltendring ved feilet innsending';
    end if;
    return new;
  end if;

  if old.status = 'forslag_klart' and new.status = 'likt' then
    if new.liked_at is null then
      raise exception 'kartlegging: likt krever liked_at';
    end if;
    if new.assessment is distinct from old.assessment
       or new.mockup_path is distinct from old.mockup_path
       or new.godkjent_at is distinct from old.godkjent_at
       or new.godkjent_vilkar is distinct from old.godkjent_vilkar then
      raise exception 'kartlegging: ugyldig feltendring ved likt';
    end if;
    return new;
  end if;

  if old.status = 'tilbud_sendt' and new.status = 'videre' then
    if new.godkjent_at is null or new.godkjent_vilkar is null then
      raise exception 'kartlegging: godkjenning krever godkjent_at og godkjent_vilkar';
    end if;
    if new.assessment is distinct from old.assessment
       or new.mockup_path is distinct from old.mockup_path
       or new.liked_at is distinct from old.liked_at then
      raise exception 'kartlegging: ugyldig feltendring ved godkjenning';
    end if;
    return new;
  end if;

  raise exception 'kartlegging: ugyldig statusovergang % -> %', old.status, new.status;
end;
$$;
