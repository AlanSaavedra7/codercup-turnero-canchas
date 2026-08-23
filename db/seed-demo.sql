-- Turnos de ejemplo para la demo: del 22 al 27 de agosto de 2026.
--
-- Correr en Supabase -> SQL Editor -> Run.
--
-- Los horarios van con offset -03:00 explicito (Argentina no tiene horario de
-- verano, asi que el offset es fijo todo el anio).
--
-- Todos entran como origen 'chat' con identificador chat-xxxxxxxx, que es la
-- verdad: no hay canal de WhatsApp en esta version.

-- ---------------------------------------------------------------------------
-- 1. Sincerar los turnos de prueba que quedaron con formato de telefono real
-- ---------------------------------------------------------------------------
update reservas
set cliente_telefono = 'chat-' || substr(md5(id::text), 1, 8),
    origen = 'chat'
where cliente_telefono not like 'chat-%';

-- ---------------------------------------------------------------------------
-- 2. Turnos de la semana
--
-- Criterio: mas carga los fines de semana y en la franja de 19 a 22, que es
-- cuando se juega de verdad. Nada antes de las 18 entre semana.
--
-- El jueves 27 (dia del resultado) queda casi vacio a proposito: sirve para
-- mostrar la grilla con lugar y para reservar en vivo sin pisar nada.
-- ---------------------------------------------------------------------------
insert into reservas (cancha_id, inicio, fin, cliente_nombre, cliente_telefono, origen)
select
  v.cancha_id,
  (v.dia || ' ' || v.hora || ':00-03:00')::timestamptz,
  (v.dia || ' ' || v.hora || ':00-03:00')::timestamptz + interval '1 hour',
  v.nombre,
  'chat-' || substr(md5(v.dia || v.hora || v.cancha_id::text), 1, 8),
  'chat'
from (values
  -- Sabado 22 (hoy, solo lo que queda de la noche)
  ('2026-08-22', '21:00', 2, 'Los Pibes del Barrio'),
  ('2026-08-22', '22:00', 1, 'Marcos Ferreyra'),

  -- Domingo 23
  ('2026-08-23', '18:00', 1, 'Nicolas Ferrari'),
  ('2026-08-23', '19:00', 2, 'Team Malvinas'),
  ('2026-08-23', '22:00', 3, 'Los Compadres'),

  -- Lunes 24
  ('2026-08-24', '19:00', 1, 'Fernando Aguirre'),
  ('2026-08-24', '20:00', 2, 'Sofia Ledesma'),
  ('2026-08-24', '21:00', 3, 'Los Pibes del Barrio'),

  -- Martes 25
  ('2026-08-25', '20:00', 1, 'Julian Ocampo'),
  ('2026-08-25', '21:00', 1, 'Deportivo Oeste'),
  ('2026-08-25', '21:00', 3, 'Los Cuervos'),

  -- Miercoles 26
  ('2026-08-26', '19:00', 2, 'Camila Rojas'),
  ('2026-08-26', '20:00', 1, 'Team Malvinas'),
  ('2026-08-26', '21:00', 2, 'Matias Sosa'),
  ('2026-08-26', '22:00', 3, 'Los Compadres'),

  -- Jueves 27 (dia del resultado): casi libre, para reservar en vivo
  ('2026-08-27', '19:00', 1, 'Bruno Vega')
) as v(dia, hora, cancha_id, nombre)
-- No pisar lo que ya exista: la exclusion constraint lo rechazaria y cortaria
-- el insert entero.
where not exists (
  select 1 from reservas r
  where r.cancha_id = v.cancha_id
    and r.estado = 'confirmada'
    and tstzrange(r.inicio, r.fin) && tstzrange(
      (v.dia || ' ' || v.hora || ':00-03:00')::timestamptz,
      (v.dia || ' ' || v.hora || ':00-03:00')::timestamptz + interval '1 hour'
    )
);

-- ---------------------------------------------------------------------------
-- 3. Verificar
-- ---------------------------------------------------------------------------
select
  to_char(r.inicio at time zone 'America/Argentina/Buenos_Aires', 'DD/MM') as dia,
  count(*)           as turnos,
  sum(c.precio_hora) as ingresos
from reservas r
join canchas c on c.id = r.cancha_id
where r.estado = 'confirmada'
group by 1
order by min(r.inicio);
