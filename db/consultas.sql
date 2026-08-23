-- Consultas utiles para revisar el estado del turnero.
-- Pegar en Supabase -> SQL Editor. Correr de a una.

-- ---------------------------------------------------------------------------
-- 1. Todas las reservas, legibles
-- ---------------------------------------------------------------------------
select
  r.id,
  c.nombre  as cancha,
  c.deporte,
  to_char(r.inicio at time zone 'America/Argentina/Buenos_Aires', 'DD/MM HH24:MI') as desde,
  to_char(r.fin    at time zone 'America/Argentina/Buenos_Aires', 'HH24:MI')       as hasta,
  r.cliente_nombre,
  r.cliente_telefono,
  c.precio_hora,
  r.estado,
  to_char(r.creado_en at time zone 'America/Argentina/Buenos_Aires', 'DD/MM HH24:MI') as creada
from reservas r
join canchas c on c.id = r.cancha_id
order by r.inicio;

-- ---------------------------------------------------------------------------
-- 2. Solo las que vienen (lo que le importa al duenio)
-- ---------------------------------------------------------------------------
select
  c.nombre as cancha,
  c.deporte,
  to_char(r.inicio at time zone 'America/Argentina/Buenos_Aires', 'DD/MM HH24:MI') as desde,
  r.cliente_nombre,
  r.cliente_telefono
from reservas r
join canchas c on c.id = r.cancha_id
where r.estado = 'confirmada'
  and r.inicio > now()
order by r.inicio;

-- ---------------------------------------------------------------------------
-- 3. Ocupacion por dia
-- ---------------------------------------------------------------------------
select
  to_char(r.inicio at time zone 'America/Argentina/Buenos_Aires', 'DD/MM') as dia,
  count(*)                as turnos,
  sum(c.precio_hora)      as facturacion
from reservas r
join canchas c on c.id = r.cancha_id
where r.estado = 'confirmada'
group by 1
order by 1;

-- ---------------------------------------------------------------------------
-- 4. Buscar duplicados o basura de las pruebas
-- ---------------------------------------------------------------------------
select cliente_nombre, cliente_telefono, count(*)
from reservas
group by 1, 2
order by 3 desc;

-- ---------------------------------------------------------------------------
-- 5. Limpiar. CUIDADO: revisa antes con la consulta 1 que los ids sean
--    los que queres borrar.
-- ---------------------------------------------------------------------------
-- delete from reservas where id in (6, 7);

-- Borrar todo lo que vino del chat de pruebas:
-- delete from reservas where cliente_telefono like 'chat-%';

-- Empezar de cero (borra TODAS las reservas):
-- truncate reservas restart identity;

-- ---------------------------------------------------------------------------
-- 6. Sincerar el canal de los turnos de prueba
--
-- Las reservas cargadas con el Manual Trigger quedaron con el telefono fijo
-- 5491100000000, y el panel las muestra con el chip "WhatsApp" porque tiene
-- formato de numero real. Nunca vinieron de WhatsApp: se crearon probando el
-- agente. Esto las pasa al formato del chat web, que es lo que realmente son.
-- ---------------------------------------------------------------------------
update reservas
set cliente_telefono = 'chat-' || substr(md5(id::text), 1, 8),
    origen = 'chat'
where cliente_telefono not like 'chat-%';

-- Verificar:
select id, cliente_nombre, cliente_telefono, origen from reservas order by id;
