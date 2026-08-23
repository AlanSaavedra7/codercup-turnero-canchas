# 07 — Guión de la demo

Para leer antes de presentar. La parte de arriba es lo que hay que hacer sí o
sí; el guión viene después.

---

## Antes de salir de casa

Cinco cosas que ya se rompieron una vez cada una en el armado. Chequealas en
este orden, son 5 minutos.

- [ ] **El workflow está publicado.** En n8n tiene que decir *Published*, no
      *Publish*. Si está despublicado, la URL del chat da 404 y no hay demo.
      Verificalo abriendo el panel y mandando un mensaje por la burbuja.

- [ ] **Está respondiendo Gemini y NO el fallback.** Esto es lo más importante
      de la lista. Mandá un mensaje de prueba, abrí n8n → **Executions** y mirá
      cuál de los dos modelos quedó en verde.

      El fallback (Mistral) responde bastante peor: probado el 22/08, dijo que
      no había canchas libres cuando sí las había, y le erró a la fecha de hoy
      teniéndola escrita en el system message. Sirve para que el bot no muera
      del todo si Gemini se cae en vivo, pero **no presentes corriendo sobre
      él**.

      La cuota diaria de Gemini se resetea a medianoche del Pacífico, o sea a
      las **4 AM en Argentina**. Si probaste mucho el día anterior, esperá a que
      pase esa hora.

- [ ] **El agente sabe qué día es hoy.** Preguntale "¿qué fecha es hoy?" y
      verificá que acierte. Todo el guión depende de que entienda "mañana".

      > La zona horaria del workflow tiene que estar en
      > `America/Argentina/Buenos_Aires` (n8n → `...` → Settings → Timezone).
      > Con UTC, después de las 21:00 el agente cree que ya es el día
      > siguiente.

- [ ] **Mirá el contador de ejecuciones** arriba a la izquierda en n8n. Cada
      mensaje del chat gasta una de las 50.

- [ ] **Reservas de ejemplo cargadas** (ver abajo). Un panel vacío no muestra
      nada.

- [ ] **Pestañas abiertas y listas**, en este orden:
      1. El panel: https://codercup-turnero-canchas.vercel.app/
      2. n8n con el workflow a la vista
      3. Supabase en el SQL Editor
      4. El repo en GitHub

> Reseteá la sesión del chat antes de empezar (el ↺ al lado de *Session*). Si
> arrastrás una conversación previa, el agente puede responder cosas que no
> tienen sentido para el jurado.

## Cargar los datos de ejemplo

Pegá [`../db/seed-demo.sql`](../db/seed-demo.sql) en el SQL Editor de Supabase y
corrilo. Hace tres cosas:

1. Sincera los turnos de prueba que quedaron con formato de teléfono real y el
   panel mostraba como "WhatsApp"
2. Carga 16 turnos repartidos del 22 al 27 de agosto, con más carga los fines de
   semana y en la franja de 19 a 22
3. Te muestra el resumen por día para verificar

No pisa nada de lo que ya exista: cada fila chequea solapamiento antes de
entrar. Podés correrlo dos veces sin romper nada.

**El jueves 27 queda casi vacío a propósito.** Es el día del resultado, así que
sirve para mostrar la grilla con lugar y para reservar en vivo sin pisar ningún
turno.

> Además de esto, hacé **una reserva de prueba por el chat** antes de presentar.
> Cuesta unas 5 ejecuciones y confirma que todo el circuito funciona.

---

## El guión (3 minutos)

### 1. El gancho — 15 segundos

Abrí el panel proyectado.

> "Esto es el panel de un complejo de canchas. Los turnos que ven acá no los
> cargó nadie: los tomó un agente de IA conversando con los clientes."

No expliques la arquitectura todavía. Que vean el resultado primero.

### 2. El problema — 20 segundos

> "El dueño de un complejo atiende el teléfono todo el día para contestar
> siempre lo mismo: qué hay libre el sábado. Y si se equivoca, vende dos veces
> la misma cancha."

Dos frases. El jurado ya entiende el dolor.

### 3. La demo en vivo — 90 segundos ⭐

**Este es el momento que decide la presentación.** No cierres el panel.

Abrí la burbuja de chat **encima del panel**, sin cambiar de pestaña.

Escribí:

```
hola, tenés cancha mañana a las 8 de la noche?
```

Mientras responde, señalá que **está consultando la base de verdad**.

El agente va a preguntar el tipo de fútbol. Respondé algo que lo obligue a
deducir:

```
somos 14
```

> "Fíjense: no le dije fútbol 7. Lo dedujo de la cantidad de jugadores."

Confirmá la reserva. Y ahora **el momento**: no toques nada.

> "Miren la grilla."

En menos de 10 segundos la celda se da vuelta sola, la fila nueva destella en
verde, y los contadores de arriba cambian.

> "Nadie tocó el panel. El agente escribió en la base y el panel se enteró
> solo."

### 4. Lo que hay abajo — 45 segundos

Pasá a n8n con el workflow a la vista.

> "Esto es n8n. El agente tiene dos herramientas: una consulta disponibilidad,
> la otra reserva. **No tiene los horarios en el prompt** — por eso no puede
> inventarlos."

Y después el remate técnico, en Supabase:

```sql
constraint sin_solapamiento exclude using gist (
  cancha_id with =, tstzrange(inicio, fin) with &&
) where (estado = 'confirmada')
```

> "Y si la IA igual se equivoca, la base la frena. Esta constraint hace
> imposible guardar dos turnos pisados en la misma cancha. **La garantía no
> depende de que el modelo se porte bien.**"

Si tenés 20 segundos más, corré el `insert` duplicado en vivo y mostrá el error.
Un error en pantalla, a propósito, es la mejor prueba de que funciona.

### 5. El cierre — 20 segundos

> "Todo esto corre en capa gratuita: n8n, Gemini, Supabase y Vercel. Costo
> total, cero pesos."

Y el link, si lo van a probar:

> "Está online. Pueden entrar y pedir un turno ustedes."

---

## Preguntas que van a hacer

**"¿Y si la IA inventa un horario que no existe?"**
> No puede: no tiene los horarios, tiene una herramienta que los consulta. Y si
> igual intentara guardar algo pisado, la constraint de Postgres lo rechaza.

**"¿Por qué chat y no WhatsApp?"**
> Porque ninguna vía gratuita de WhatsApp deja que un desconocido le escriba al
> bot. Meta te obliga a cargar hasta 5 números a mano; el sandbox de Twilio
> acepta un destinatario por vez. Con chat, ustedes lo pueden probar ahora
> mismo. Migrar a WhatsApp es cambiar el trigger y agregar un nodo de envío: el
> agente, las herramientas y la base quedan igual.

**"¿Es un chatbot con reglas?"**
> No. Decide solo qué herramienta usar y con qué parámetros. Lo de "somos 14"
> es la prueba: no hay ninguna regla que mapee 14 a fútbol 7.

**"¿Qué pasa si dos personas reservan al mismo tiempo?"**
> Postgres rechaza la segunda y el agente le ofrece otro horario. Está en el
> prompt como regla y en la base como constraint.

**"¿Cuánto costaría en producción?"**
> El cuello es WhatsApp: verificar la empresa en Meta y pasar a plan pago. El
> resto escala barato — n8n desde 20 euros al mes o autohospedado gratis, y
> Supabase y Vercel tienen tiers gratuitos generosos para este volumen.

**"¿Lo hiciste con IA?"**
> El panel sí, es la parte de vibe coding. Los nodos de n8n los armé a mano,
> uno por uno — el objetivo era aprender la herramienta.

---

## Si algo se rompe

**El agente no responde.** Mirá n8n → *Executions*. Si dice
`too many requests`, es la cuota de Gemini: esperá un minuto y volvé a probar,
o el Fallback Model debería haber entrado solo.

**No tenés internet o n8n está caído.** Por eso el video: mostralo y seguí.
Nunca dependas de que la red del lugar funcione.

**Se agotaron las 50 ejecuciones.** Mostrá el video y el panel con los datos que
ya están. El panel lee de Supabase y no gasta ejecuciones de n8n: sigue
funcionando igual.

> **Grabá el video igual, aunque pienses hacerlo en vivo.** 40 segundos:
> mensaje, respuesta, reserva, panel actualizándose. Es tu red y se graba en
> dos minutos.

---

## Lo que no hay que hacer

- **No abras el código en la presentación.** Está en el repo si lo quieren ver.
  Leer código en voz alta mata cualquier demo.
- **No pidas disculpas por lo que falta.** Los límites están escritos en el
  README; si preguntan, respondés. No los ofrezcas vos.
- **No repartas el QR a toda la sala.** Cada mensaje gasta una ejecución de las
  50. "Pasen a probarlo" de a uno.
- **No cambies de pestaña durante la reserva en vivo.** El efecto es ver el
  panel actualizarse solo. Si lo tapás, se pierde.
