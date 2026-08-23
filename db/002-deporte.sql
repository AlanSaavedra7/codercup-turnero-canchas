-- Migracion 002: que disponibilidad() distinga futbol 5 de futbol 7.
--
-- Correr en Supabase -> SQL Editor -> New query -> Run.
-- Solo si ya corriste schema.sql antes. En una instalacion nueva, schema.sql
-- ya viene con esto incluido.
--
-- Cambios:
--   1. Agrega la columna "deporte" al resultado, para que el agente sepa que
--      tipo de cancha esta ofreciendo.
--   2. Agrega el parametro opcional p_deporte, para filtrar directo por tipo.

-- Hay que dropear: agregar columnas al RETURNS TABLE cambia el tipo de retorno
-- y CREATE OR REPLACE no lo permite.
drop function if exists disponibilidad(date, bigint);

create or replace function disponibilidad(
  p_fecha     date,
  p_cancha_id bigint default null,
  p_deporte   text   default null
)
returns table (
  cancha_id   bigint,
  cancha      text,
  deporte     text,
  inicio      timestamptz,
  fin         timestamptz,
  hora        text,
  precio_hora numeric
)
language sql
stable
as $$
  with slots as (
    select
      c.id                                          as cancha_id,
      c.nombre                                      as cancha,
      c.deporte                                     as deporte,
      c.precio_hora,
      (p_fecha + c.hora_apertura) at time zone 'America/Argentina/Buenos_Aires'
        + (n * make_interval(mins => c.duracion_min)) as inicio,
      (p_fecha + c.hora_apertura) at time zone 'America/Argentina/Buenos_Aires'
        + ((n + 1) * make_interval(mins => c.duracion_min)) as fin
    from canchas c
    cross join lateral generate_series(
      0,
      (extract(epoch from (c.hora_cierre - c.hora_apertura)) / 60 / c.duracion_min)::int - 1
    ) as n
    where c.activa
      and (p_cancha_id is null or c.id = p_cancha_id)
      -- Matching tolerante: el modelo puede mandar "futbol 5", "f5", "5",
      -- "futbol-5". Cualquier cosa que contenga un 5 cae en futbol 5.
      and (
        p_deporte is null
        or c.deporte ilike '%' || p_deporte || '%'
        or (p_deporte like '%5%' and c.deporte like '%5%')
        or (p_deporte like '%7%' and c.deporte like '%7%')
      )
  )
  select
    s.cancha_id,
    s.cancha,
    s.deporte,
    s.inicio,
    s.fin,
    to_char(s.inicio at time zone 'America/Argentina/Buenos_Aires', 'HH24:MI') as hora,
    s.precio_hora
  from slots s
  where s.inicio > now()
    and not exists (
      select 1
      from reservas r
      where r.cancha_id = s.cancha_id
        and r.estado = 'confirmada'
        and tstzrange(r.inicio, r.fin) && tstzrange(s.inicio, s.fin)
    )
  order by s.inicio, s.cancha_id;
$$;

-- Verificacion:
--   select * from disponibilidad(current_date + 1);
--     -> ahora cada fila trae la columna "deporte"
--   select distinct cancha, deporte from disponibilidad(current_date + 1, null, 'futbol 7');
--     -> solo Cancha 3
--   select distinct cancha, deporte from disponibilidad(current_date + 1, null, '5');
--     -> Cancha 1 y Cancha 2
