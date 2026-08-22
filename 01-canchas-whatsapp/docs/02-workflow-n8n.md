# 02 — El agente de IA en n8n (Bloque 3, ~60 min)

Meta del bloque: un agente que entiende un mensaje en castellano, consulta la
disponibilidad **real** en Supabase y reserva el turno.

Todavía sin WhatsApp. Vas a probarlo con un botón dentro de n8n, que es mucho
más rápido para iterar. WhatsApp se enchufa en el Bloque 4 y no te obliga a
rehacer nada de esto.

Esta guía es para que **armes vos los nodos**. No hay JSON para importar.

Forma del workflow al terminar:

```
Manual Trigger ──> Normalizar ──> AI Agent ──> (respuesta)
                                     │
                     ┌───────────────┼───────────────┐
                Chat Model        Memory          Tools
                 (Gemini)     (Simple Memory)   ├── ver_disponibilidad
                                                └── crear_reserva
```

---

## Paso 0 — Workflow nuevo

En n8n: **Create Workflow**. Arriba a la izquierda renombralo a
`CoderCup Champions-Turnos`. Guardá con `Ctrl+S` cada tanto.

---

## Paso 1 — Manual Trigger

Click en **Add first step** → buscá **Trigger manually** → agregalo.

No tiene nada que configurar. Es el botón de "Execute Workflow".

---

## Paso 2 — Nodo `Normalizar`

Click en el `+` a la derecha del trigger → buscá **Edit Fields (Set)**.

**Renombralo a `Normalizar`** (doble click en el título del nodo). El nombre
importa: las tools lo van a referenciar por ese nombre exacto.

Agregá tres campos, los tres tipo `String`, con estos valores fijos:

| Name | Value |
|---|---|
| `telefono` | `5491100000000` |
| `nombre` | `Alan` |
| `texto` | `hola, tenes cancha manana a las 8 de la noche?` |

Abajo, dejá **Include Other Input Fields** en `Off`.

> ⚠️ **Fixed vs Expression.** Cualquier valor que contenga `{{ }}` tiene que
> estar en modo **Expression** (el botoncito `fx` que aparece al pasar el mouse
> por el campo). Si queda en **Fixed**, n8n pasa el texto literal `{{ ... }}` sin
> evaluarlo y el agente recibe eso como mensaje del cliente.
>
> Cómo verificarlo: debajo de un campo en modo expresión, n8n muestra el
> **preview con el valor ya evaluado**. Si ahí seguís viendo llaves, está mal.
>
> Este error es especialmente traicionero porque no da error: el workflow corre
> verde y el agente contesta cosas raras, así que parece un problema del modelo.

> En el Bloque 4 este mismo nodo pasa a leer los datos reales de WhatsApp. Como
> el nombre del nodo y los campos no cambian, todo lo que armes ahora sigue
> funcionando sin tocar nada.

---

## Paso 3 — El nodo `AI Agent`

`+` a la derecha de Normalizar → buscá **AI Agent** → agregalo.

> **No busques "Tools Agent".** En las versiones nuevas de n8n ese selector ya no
> está: el AI Agent *es* el Tools Agent. Los otros tipos (Conversational, ReAct,
> Plan & Execute) quedaron deprecados y los sacaron.

Abajo de todo en el panel del nodo vas a ver tres conectores vacíos con un `+`:
*Chat Model*, *Memory* y *Tool*. Los llenamos en los pasos que siguen, sin
cerrar el nodo.

En el nodo:

- **Source for Prompt (User Message)**: viene en `Connected Chat Trigger Node`.
  Cambialo a **`Define below`**
- **Prompt (User Message)**: viene con `{{ $json.chatInput }}`. Borralo y, en
  modo expresión (el botoncito `fx` a la izquierda del campo), poné:
  ```
  {{ $json.texto }}
  ```
- **Options** → **Add Option** → **System Message**. Pegá el texto de abajo,
  también en modo expresión (tiene `{{ }}` adentro):

```
Sos el asistente de reservas del complejo de canchas "CoderCup Champions". Atendes clientes por WhatsApp.

CONTEXTO
- Ahora es {{ $now.setZone('America/Argentina/Buenos_Aires').toFormat("cccc dd/MM/yyyy HH:mm") }}. Usalo para resolver "hoy", "manana", "el sabado", "el finde".
- El telefono del cliente es {{ $json.telefono }}. Ya lo tenes, no lo preguntes.
- El canal lo identifica como "{{ $json.nombre }}". Si eso no parece un nombre real de persona, ignoralo y preguntale el nombre. Aunque lo parezca, puede estar reservando para otro: confirmalo igual.
- El complejo abre de 09:00 a 23:00 y todos los turnos duran 1 hora.

QUE OFRECES
- Hay canchas de futbol 5 y de futbol 7, con precios distintos.
- ver_disponibilidad te devuelve, para una fecha, cada turno libre con su cancha, deporte, hora y precio.
- Podes filtrar por tipo pasandole p_deporte con "futbol 5" o "futbol 7".

COMO HABLAS
- Espanol rioplatense, cordial y breve. Es WhatsApp: mensajes cortos, sin parrafos largos.
- Maximo 5 horarios por mensaje. Si hay mas, decilo y ofrece mostrar el resto.
- Cuando listes horarios, aclara de que tipo de futbol es cada cancha.

QUE NECESITAS PARA RESERVAR
Antes de llamar a crear_reserva tenes que tener los cuatro datos:
1. Tipo de futbol (5 o 7)
2. Fecha
3. Hora
4. Nombre de quien reserva

Si falta alguno, preguntalo. Preguntá de a una cosa por vez, no tires una lista de preguntas.

Excepciones, para no hacerlo pesado:
- Si el cliente ya dijo el tipo, no lo vuelvas a preguntar. Deducilo si es obvio: 10 jugadores es futbol 5, 14 es futbol 7.
- Si para ese horario queda una sola cancha libre, ofrecesela directamente en vez de preguntar el tipo.

REGLAS QUE NO SE ROMPEN
- NUNCA inventes disponibilidad, precios ni tipos de cancha. Todo sale de ver_disponibilidad.
- Volve a consultar ver_disponibilidad cada vez que el cliente cambie de fecha, de horario o de tipo de futbol. No contestes de memoria.
- Antes de llamar a crear_reserva repetile cancha, tipo de futbol, dia, hora y precio, y espera que confirme.
- crear_reserva necesita el cancha_id exacto que devolvio ver_disponibilidad. No lo adivines.
- NUNCA inventes el nombre del cliente. Si no te lo dijo con todas las letras en esta conversacion, preguntaselo antes de reservar.
- Si el horario que pide esta ocupado, decilo y ofrece los dos o tres mas cercanos del mismo tipo de futbol.
- Si crear_reserva devuelve error, ese turno se acaba de ocupar: avisale, volve a consultar disponibilidad y ofrecele otro. No reintentes lo mismo.
- Si te preguntan algo que no sea sobre turnos, responde amablemente que solo manejas reservas de canchas.
```

Tres cosas de este prompt que valen la pena y no son obvias:

**Le prohíbe inventar.** Sin la línea de "NUNCA inventes disponibilidad", los
modelos tienden a "ayudar" ofreciendo turnos que no existen.

**Le prohíbe adivinar el `cancha_id`.** Es el error más común: el modelo ve
"Cancha 3" y manda `cancha_id: 3`. Casualmente acá coincide, pero si mañana
borrás una cancha deja de coincidir y empieza a reservar la equivocada.

**Le dice qué hacer cuando falla.** Si dos personas piden el mismo turno a la
vez, la base rechaza el segundo. Sin esa regla el modelo reintenta el mismo
insert en loop.

---

## Paso 4 — Chat Model: Gemini (gratis)

1. Si todavía no la tenés: API key en https://aistudio.google.com/apikey →
   **Create API key**.
2. En n8n, click en el conector **Chat Model** del agente →
   **Google Gemini Chat Model**.
3. **Credential to connect with** → *Create new credential* → pegá la API key →
   **Save**.
4. **Model**: elegí un Flash de la lista.

> ⚠️ **El free tier de Gemini tiene cuota diaria y se agota rápido.** Si te
> aparece error de cuota, pasate a **Groq**: key gratis en console.groq.com,
> sub-nodo **Groq Chat Model**. Es más rápido (1-2 segundos contra 5-10) y
> tiene límites por minuto más holgados. Se cambia solo ese sub-nodo, el resto
> del workflow queda igual.
>
> **Groq quedó descartado** (probado el 22/08/2026): su catálogo actual no tiene
> ningún modelo de chat bueno con herramientas. `openai/gpt-oss-120b` repite la
> misma pregunta en loop y los `gemma` inventan datos. El orden que funciona es:
>
> | Orden | Modelo | Nota |
> |---|---|---|
> | 1 | **Gemini Flash** | Es el que anduvo bien. Cuota diaria: se resetea a medianoche del Pacífico (~4-5 AM en Argentina) |
> | 2 | **Mistral Cloud Chat Model**, `mistral-small-latest` | Capa gratuita. Entrenado para function calling |
> | 3 | **OpenRouter Chat Model** | Varios modelos gratis con una sola key |
>
> **Qué NO elegir**, porque la lista mezcla modelos de propósitos distintos:
>
> | Modelo | Qué es en realidad |
> |---|---|
> | `whisper-*` | Voz a texto |
> | `canopylabs/orpheus-*` | Texto a voz |
> | `llama-prompt-guard-*` | Clasificador de seguridad |
> | `*-safeguard-*` | Moderación de contenido |
> | `allam-2-7b` | Chico, orientado al árabe |
> | `groq/compound*` | Sistemas agénticos con tools propias: pueden chocar con las de n8n |
>
> **Y no uses modelos chicos** (Gemma, 8B, mini, instant) aunque sean de chat.
> Son malos llamando herramientas: en vez de preguntar los datos que faltan,
> rellenan los parámetros con lo que les parece. El síntoma típico es que
> inventan el nombre del cliente.

### Modelo de respaldo (2 min, muy recomendado para la demo)

En el **AI Agent**, activá el toggle **`Enable Fallback Model`** y conectale un
segundo Chat Model (por ejemplo Gemini si tu principal es Groq).

Si el proveedor principal se cae o te limita justo durante la presentación, n8n
cambia solo al de respaldo sin que se note.

---

## Paso 5 — Memory

Click en el conector **Memory** → **Simple Memory**.

- **Session ID**: `Define below`
- **Key**: modo expresión, y poné:
  ```
  {{ $('Normalizar').item.json.telefono }}
  ```

Así cada cliente tiene su propio hilo y el agente recuerda lo que venían
hablando. Sin esto cada mensaje arranca de cero y nunca vas a poder decir
"dale, reservame esa".

---

## Paso 6 — Tool `ver_disponibilidad`

Mirá el canvas: abajo del nodo **AI Agent** cuelgan tres conectores —
*Chat Model*, *Memory* y *Tool*. Los dos primeros ya los llenaste.

**Hacé click en el `+` que cuelga de `Tool`** (el de la derecha) → buscá
**HTTP Request** → lo vas a ver listado como "HTTP Request Tool".

**Renombralo a `ver_disponibilidad`** (doble click en el título). El nombre del
nodo es lo que ve el modelo cuando decide qué herramienta usar.

### 6a. Crear la credencial de Supabase

Esto se hace **una sola vez**, acá adentro. La segunda tool la reusa de una
lista, no hay que volver a cargarla.

- **Authentication**: `Predefined Credential Type`
- **Credential Type**: `Supabase API`
- **Credential** → *Create new credential*:
  - **Host**: `https://TU-PROYECTO.supabase.co`
  - **Service Role Secret**: tu `service_role` key (la secreta del Bloque 1)
  - **Save**

n8n se encarga solo de mandar los headers `apikey` y `Authorization` que pide
Supabase. Además la key queda guardada cifrada, en vez de escrita a la vista
dentro del nodo.

### 6b. El resto del nodo

- **Description**:
  ```
  Devuelve los turnos LIBRES de una fecha, con cancha, deporte (futbol 5 o futbol 7), hora y precio. Usala siempre antes de ofrecer horarios al cliente. p_fecha va en formato YYYY-MM-DD. p_deporte es opcional y sirve para filtrar por tipo: mandale "futbol 5" o "futbol 7", o dejalo vacio para ver todo.
  ```
- **Method**: `POST`
- **URL**: `https://TU-PROYECTO.supabase.co/rest/v1/rpc/disponibilidad`
- **Send Body**: ON
  - **Body Content Type**: `JSON`
  - **Specify Body**: `Using Fields Below`
  - **Body Parameters** → **Add Parameter**, dos veces.

Cada parámetro tiene **dos campos**: `Name` y `Value`.

| **Name** (a mano) | **Value** (modo expresión) |
|---|---|
| `p_fecha` | `{{ $fromAI('p_fecha', 'Fecha a consultar en formato YYYY-MM-DD', 'string') }}` |
| `p_deporte` | `{{ $fromAI('p_deporte', 'Tipo de cancha: "futbol 5" o "futbol 7". Vacio para ver todas', 'string') }}` |

### Por qué escribir `$fromAI` a mano y no usar la estrellita

Vas a ver un ícono de **estrellita** ("Let the model fill this parameter") al
pasar el mouse por el campo *Value*. Hace lo mismo, **pero genera esto**:

```
{{ $fromAI('parameters0_Value', '', 'string') }}
```

Nombre genérico, descripción vacía, tipo string. El modelo entonces ve
parámetros llamados `parameters0_Value`, `parameters1_Value`... sin ninguna
pista de qué va en cada uno, y los llena a ciegas. Con dos parámetros suele
acertar; con cuatro, los baraja hasta que Postgres rechaza todo.

Los tres argumentos de `$fromAI` son **nombre, descripción y tipo**. Es lo único
que ve el modelo. El campo `Name` de al lado le sirve a n8n para armar el body,
pero el modelo nunca lo ve.

> **La estrellita va en `Value`, nunca en `Name`.** Si la ponés en `Name`,
> Supabase te tira `Could not find the function public.disponibilidad(2026-08-23,
> futbol 7)`: ese mensaje lista los *nombres* de argumento que recibió.

---

## Paso 7 — Tool `crear_reserva`

Otra vez el `+` de **Tool** → **HTTP Request**. Renombralo a `crear_reserva`.

El agente queda con dos tools colgando, y eso está bien: el modelo elige cuál
usar según lo que le pida el cliente.

- **Description**:
  ```
  Crea una reserva confirmada. Llamala SOLO despues de que el cliente confirmo cancha, dia y hora. inicio y fin van en formato ISO con zona horaria -03:00, por ejemplo 2026-08-25T20:00:00-03:00. El fin es una hora despues del inicio.
  ```
- **Method**: `POST`
- **URL**: `https://TU-PROYECTO.supabase.co/rest/v1/reservas`
- **Authentication**: `Predefined Credential Type` → `Supabase API` → elegí de
  la lista la credencial que creaste en el paso 6a. No la crees de nuevo
- **Send Headers**: ON → **Add Parameter**:
  - **Name**: `Prefer` · **Value**: `return=representation`

  (así Supabase devuelve la fila creada y el agente puede confirmar con datos
  reales en vez de suponer que salió bien)
- **Send Body**: ON → `JSON` → `Using Fields Below`. Cinco parámetros. El `Name`
  siempre a mano; el `Value` en modo expresión.

| **Name** | **Value** |
|---|---|
| `cancha_id` | `{{ $fromAI('cancha_id', 'El id numerico de la cancha, exactamente como lo devolvio ver_disponibilidad', 'number') }}` |
| `inicio` | `{{ $fromAI('inicio', 'Inicio del turno en ISO 8601 con zona -03:00, por ejemplo 2026-08-23T20:00:00-03:00', 'string') }}` |
| `fin` | `{{ $fromAI('fin', 'Fin del turno, una hora despues del inicio, mismo formato', 'string') }}` |
| `cliente_nombre` | `{{ $fromAI('cliente_nombre', 'Nombre de la persona a nombre de quien va la reserva', 'string') }}` |
| `cliente_telefono` | `{{ $('Normalizar').item.json.telefono }}` ← **sin** `$fromAI` |

Fijate que `cancha_id` va con tipo `'number'`, no `'string'`. La columna en
Postgres es `bigint` y si le llega texto, rechaza el insert.

> El teléfono no se lo dejamos a la IA a propósito. Es un dato que ya tenemos
> con certeza: no queremos que lo alucine ni que el cliente pueda falsearlo.

---

## Paso 8 — Probarlo

> ⚠️ **Tenés 50 ejecuciones en la prueba de n8n Cloud.** Mirá el contador arriba
> a la izquierda. Cada **Execute Workflow** puede gastar una, y con WhatsApp cada
> mensaje que entre gasta otra. No las quemes probando a lo loco:
>
> - Después de tu primera ejecución, fijate si el contador pasó a `1/50`. Si no
>   se movió, las manuales no cuentan y podés probar tranquilo.
> - Si sí cuentan: pensá bien qué vas a probar antes de tocar el botón. Reservá
>   unas 10 para el Bloque 4 y otras 10 para grabar la demo.
> - Los errores de expresión o de credenciales los ves sin ejecutar, mirando el
>   preview de los campos. Revisá eso primero.

Guardá (`Ctrl+S`) y tocá **Execute Workflow** abajo.

Click en el nodo **AI Agent** → pestaña **OUTPUT** → campo `output`. Ahí está la
respuesta del agente.

### Qué probar, en orden

Cambiá el campo `texto` del nodo Normalizar y volvé a ejecutar cada vez.

| # | `texto` | Qué tiene que pasar |
|---|---|---|
| 1 | `hola, tenes cancha manana a las 8 de la noche?` | Llama a `ver_disponibilidad` y, como no sabe el tipo, **pregunta si es fútbol 5 o 7** |
| 2 | `futbol 5` | Ofrece solo canchas de f5, con precio |
| 3 | `dale, reservame esa a nombre de Alan` | Repite los datos, pide confirmación y recién ahí llama a `crear_reserva` |
| 4 | `tenes para futbol 7 el sabado?` | Vuelve a consultar la tool filtrando por deporte, no responde de memoria |
| 5 | `somos 14, hay algo manana?` | **Deduce que es fútbol 7** sin preguntarlo |

La 1 y la 5 son las que prueban que el manejo del tipo de fútbol funciona.

Después de reservar, **no alcanza con ver que apareció la fila**. Corré esto en
Supabase:

```sql
select id, cancha_id,
       inicio at time zone 'America/Argentina/Buenos_Aires' as inicio_local,
       cliente_nombre, cliente_telefono
from reservas order by id desc limit 3;
```

`inicio_local` tiene que coincidir con la hora que pidió el cliente. Si está
corrido 3 horas, el modelo mandó el timestamp sin zona horaria y Postgres lo
tomó como UTC. La reserva existe y el panel la muestra, pero el turno quedó
guardado en el horario equivocado: es el bug más silencioso del proyecto.

Verificá también que `cliente_telefono` sea el del nodo Normalizar y no uno
inventado.

### Cómo se debuguea

En el panel de ejecución, debajo del AI Agent, n8n muestra **cada llamada a las
tools**: qué parámetros mandó el modelo y qué devolvió Supabase. Ahí se ve todo.

Si el agente inventa horarios, lo primero es mirar si realmente llamó a la tool
o se lo sacó de la galera.

---

## Verificación del bloque

- [ ] El agente responde horarios que coinciden con `select * from disponibilidad(...)`
- [ ] Si le pedís un horario ocupado, ofrece otro en vez de reservarlo igual
- [ ] Después de confirmar, la reserva aparece en la tabla de Supabase
- [ ] El teléfono guardado es el del nodo Normalizar, no uno inventado
- [ ] **Exportaste el workflow a `n8n/backup/`** (`...` arriba a la derecha → *Download*)

Ese último punto no lo saltees. Es tu red de seguridad antes de meterle mano a
WhatsApp.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| El agente inventa horarios | Falta la línea del system message que se lo prohíbe, o la tool tiró error y la ignoró. Mirá el log de la tool |
| `401` en las tools | La credencial de Supabase tiene la `anon key` en vez de la `service_role` |
| `permission denied for table` | Lo mismo: RLS está bloqueando a la anon key. Va la service_role |
| La tool no recibe `p_fecha` | No activaste la estrellita, así que el modelo no sabe que puede llenar ese campo |
| `violates exclusion constraint` | El turno se ocupó. Es el comportamiento correcto: el agente tiene que ofrecer otro |
| `invalid input syntax for type bigint` / `for type timestamp` en `crear_reserva`, con reintentos que barajan los valores | Usaste la estrellita en vez de escribir `$fromAI` a mano. El modelo ve `parameters0_Value`, `parameters1_Value`... sin descripción y adivina cuál es cuál |
| `Max iterations (5) reached` | Una tool viene fallando y el agente reintenta. No es la causa: es el freno. Mirá el error de la tool |
| Contesta en inglés | Reforzá el idioma en el system message |
| **Repite la misma pregunta una y otra vez**, o dice "no entiendo tu mensaje" | **Primero descartá esto, antes de culpar al modelo.** Abrí el sub-nodo Simple Memory en la ejecución y mirá los `HumanMessage`: si el `content` dice literalmente `{{ $json.chatInput }}` en vez de tu mensaje, el campo `texto` de Normalizar quedó en modo **Fixed** en lugar de **Expression**. El modelo nunca recibió lo que escribiste. Activá el `fx` en ese campo |
| No distingue fútbol 5 de 7 | Te falta correr `db/002-deporte.sql`: sin eso la tool no devuelve la columna `deporte` |
| `Could not find the function public.disponibilidad(2026-08-23, futbol 7)` | La estrellita quedó en `Name` en vez de `Value`. Los nombres van a mano |
| `Could not find the function public.disponibilidad(p_deporte, p_fecha)` | Los campos están bien, pero falta correr `db/002-deporte.sql` |
| La tool se llama 5 o 6 veces seguidas | Está fallando y el agente reintenta. Arreglá la tool y poné `Max Iterations` en 5 |
| Ofrece f7 cuando pidieron f5 | El parámetro `p_deporte` no tiene la estrellita activada |
