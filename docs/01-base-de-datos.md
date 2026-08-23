# 01 — Base de datos en Supabase (Bloque 1, ~20 min)

Meta del bloque: tener un Postgres en la nube con tus canchas, la tabla de
reservas, y una función que te diga qué turnos están libres.

---

## Paso 1 — Crear la cuenta (3 min)

1. Entrá a https://supabase.com y **Start your project**.
2. Registrate con GitHub o con mail. **No pide tarjeta.**

## Paso 2 — Crear el proyecto (5 min)

**New project** y completá:

| Campo | Qué poner |
|---|---|
| Name | `CoderCup-Champions` |
| Database Password | Generá una y **guardala en un archivo aparte ahora mismo** |
| Region | `South America (São Paulo)` |
| Plan | Free |

> La contraseña de la base no la vas a poder volver a ver. No es la misma que la
> de tu cuenta de Supabase. Si la perdés hay que resetearla.

Tarda 1-2 minutos en aprovisionar. Mientras espera, seguí leyendo.

## Paso 3 — Correr el esquema (3 min)

1. Menú izquierdo → **SQL Editor** → **New query**.
2. Abrí [`../db/schema.sql`](../db/schema.sql), copiá **todo** el contenido y
   pegalo.
3. **Run** (o `Ctrl+Enter`).

Tenés que ver `Success. No rows returned`. Si tira error, no sigas: copiame el
mensaje.

> Si ya corriste `schema.sql` **antes** del 22/08, corré también
> [`../db/002-deporte.sql`](../db/002-deporte.sql) en otra query. Agrega el tipo
> de fútbol al resultado de `disponibilidad()`, que el agente necesita para no
> mezclar canchas de f5 con las de f7.

### Qué acabás de crear

| Objeto | Para qué |
|---|---|
| `canchas` | Tus canchas, con horario de apertura/cierre y duración de turno |
| `reservas` | Los turnos tomados |
| `disponibilidad(fecha, cancha_id)` | Devuelve los turnos **libres** de un día |

Dos detalles que importan y que después vas a poder contar en la demo:

**No se puede sobrevender un turno.** La tabla `reservas` tiene una *exclusion
constraint* de Postgres: si alguien intenta reservar una cancha en un horario
que se pisa con otro turno confirmado, la base rechaza el insert. Si el agente
de IA alucina, el error salta en la base, no en el prompt.

**Las tablas están cerradas.** El script activa Row Level Security sin
políticas, así que la `anon key` (que es pública) no puede leer ni escribir
nada. Solo la `service_role key`, que vive en el servidor de n8n, tiene acceso.

## Paso 4 — Verificar que funciona (5 min)

Corré esto en el SQL Editor, una consulta por vez.

**A. ¿Están las canchas?**

```sql
select * from canchas;
```

Esperás 3 filas: Cancha 1, Cancha 2 y Cancha 3.

**B. ¿Hay turnos libres mañana?**

```sql
select * from disponibilidad(current_date + 1);
```

Esperás 42 filas: 14 turnos por cancha (de 09:00 a 23:00) × 3 canchas. Mirá la
columna `hora`: van de `09:00` a `22:00`.

**C. ¿Reservar hace desaparecer el turno?**

```sql
insert into reservas (cancha_id, inicio, fin, cliente_nombre, cliente_telefono)
values (
  1,
  (current_date + 1 + time '20:00') at time zone 'America/Argentina/Buenos_Aires',
  (current_date + 1 + time '21:00') at time zone 'America/Argentina/Buenos_Aires',
  'Prueba', '5491100000000'
);
```

Ahora repetí la consulta B filtrando la Cancha 1:

```sql
select hora from disponibilidad(current_date + 1, 1);
```

Las `20:00` ya **no** tienen que aparecer.

**D. ¿Se bloquea la doble reserva?**

Corré el mismo `insert` del punto C otra vez. Tiene que fallar con:

```
conflicting key value violates exclusion constraint "sin_solapamiento"
```

**Ese error es el resultado correcto.** Significa que la protección funciona.

**E. Limpiar la prueba**

```sql
delete from reservas where cliente_telefono = '5491100000000';
```

## Paso 5 — Guardar las credenciales (2 min)

**Project Settings** (el engranaje) → **API Keys**. Copiá a un archivo local
—no a este repo— estos tres valores:

| Dato | Dónde se usa | Cuidado |
|---|---|---|
| **Project URL** (`https://xxxx.supabase.co`) | n8n y panel | Pública, sin drama |
| **anon / public key** | por ahora, en ningún lado | Pública |
| **service_role / secret key** | n8n y el panel (del lado servidor) | **Secreta.** Da acceso total y saltea RLS. Nunca en el frontend ni en git. |

> Si Supabase te muestra las keys nuevas (`sb_publishable_...` /
> `sb_secret_...`), la `secret` cumple el rol de `service_role`. Es la que vas a
> usar en n8n.

---

## Verificación del bloque

- [ ] `select * from canchas` devuelve 3 filas
- [ ] `select * from disponibilidad(current_date + 1)` devuelve 42 filas
- [ ] Insertar una reserva saca ese turno de la disponibilidad
- [ ] Repetir el insert falla con `sin_solapamiento`
- [ ] Borraste la reserva de prueba
- [ ] Tenés guardadas la Project URL y la service_role key

Con esto cerrado, seguí con [`00-setup-n8n.md`](00-setup-n8n.md) (Bloque 2, 10
minutos) y después el agente.

## Si algo falla

| Error | Causa |
|---|---|
| `extension "btree_gist" is not available` | Corré `create extension btree_gist;` solo, en una query aparte, y después el resto del script |
| `disponibilidad` devuelve 0 filas | La función solo muestra turnos futuros. Fijate que estés consultando `current_date + 1` y no una fecha pasada |
| Devuelve menos de 42 filas | Ya hay reservas cargadas, o alguna cancha tiene `activa = false` |
