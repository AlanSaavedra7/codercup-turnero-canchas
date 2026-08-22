-- Esquema del turnero de canchas.
-- Pegar tal cual en Supabase -> SQL Editor -> New query -> Run.

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Canchas
-- ---------------------------------------------------------------------------
create table if not exists canchas (
  id              bigint generated always as identity primary key,
  nombre          text    not null,
  deporte         text    not null default 'futbol 5',
  precio_hora     numeric(10,2) not null default 0,
  hora_apertura   time    not null default '09:00',
  hora_cierre     time    not null default '23:00',
  duracion_min    int     not null default 60,
  activa          boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Reservas
-- El rango [inicio, fin) evita que dos turnos pisados entren a la vez:
-- la exclusion constraint lo rechaza a nivel base de datos.
-- ---------------------------------------------------------------------------
create table if not exists reservas (
  id               bigint generated always as identity primary key,
  cancha_id        bigint not null references canchas(id) on delete cascade,
  inicio           timestamptz not null,
  fin              timestamptz not null,
  cliente_nombre   text not null,
  cliente_telefono text not null,
  estado           text not null default 'confirmada'
                     check (estado in ('confirmada','cancelada')),
  origen           text not null default 'chat',
  creado_en        timestamptz not null default now(),

  constraint fin_despues_de_inicio check (fin > inicio),

  -- sin solapamientos por cancha, ignorando las canceladas
  constraint sin_solapamiento exclude using gist (
    cancha_id with =,
    tstzrange(inicio, fin) with &&
  ) where (estado = 'confirmada')
);

create index if not exists reservas_inicio_idx on reservas (inicio);
create index if not exists reservas_telefono_idx on reservas (cliente_telefono);

-- ---------------------------------------------------------------------------
-- disponibilidad(fecha, cancha_id?, deporte?)
-- Devuelve los turnos libres de un dia. Es la funcion que va a llamar el
-- agente de IA como herramienta.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Datos de ejemplo
-- ---------------------------------------------------------------------------
insert into canchas (nombre, deporte, precio_hora)
select * from (values
  ('Cancha 1', 'futbol 5',  25000),
  ('Cancha 2', 'futbol 5',  25000),
  ('Cancha 3', 'futbol 7',  35000)
) as v(nombre, deporte, precio_hora)
where not exists (select 1 from canchas);

-- ---------------------------------------------------------------------------
-- Seguridad
-- Sin esto, cualquiera con la anon key (que es publica) podria leer y escribir
-- tus reservas. Activando RLS sin politicas, las tablas quedan cerradas para
-- todo el mundo EXCEPTO para la service_role key, que es la que usan n8n y el
-- panel desde el servidor. La anon key deja de servir para leer estas tablas.
-- ---------------------------------------------------------------------------
alter table canchas  enable row level security;
alter table reservas enable row level security;
