# 04 — Conectar WhatsApp con Meta (Bloque 4, ~45 min)

> **DESCARTADO.** El número de prueba de Meta nunca se pudo aprovisionar. Se
> siguió con el chat público ([`04c`](04c-chat-publico.md)). Este documento
> queda como registro de lo evaluado.


Meta del bloque: que el agente que ya funciona atienda por WhatsApp de verdad.

> **22/08/2026: este camino quedó trabado.** El botón "Solicitar número de
> prueba" no provisiona nada. Se siguió por
> [`04b-whatsapp-twilio.md`](04b-whatsapp-twilio.md), que también es WhatsApp
> real y no depende de la burocracia de Meta.
>
> Esta guía queda por si el problema se destraba o para retomarlo después del
> concurso.

> **Antes de empezar, exportá el workflow** a `n8n/backup/` (`...` arriba a la
> derecha → *Download*). Vas a tocar el trigger y querés poder volver atrás.

> **Timebox: 45 minutos.** Si a los 45 no está andando, no sigas peleando: pasá
> al Plan B del final, que te deja una demo funcionando igual, y usá el tiempo
> que queda en el panel. Es la decisión correcta, no una rendición.

---

## Parte A — La app en Meta

### A1. Crear la app

1. https://developers.facebook.com → **My Apps** → **Create App**
2. **Use case**: elegí **Other** → **Next**
3. **Type**: **Business** → **Next**
4. Nombre: `CoderCup Champions` · tu mail · **Create app**

### A2. Agregar WhatsApp

En el panel de la app, buscá **WhatsApp** en la lista de productos → **Set up**.

Te va a pedir asociar un portfolio/cuenta de Meta Business. Si no tenés,
te deja crear una ahí mismo.

### A3. Pedir el número de prueba

> La interfaz de Meta cambia seguido. Al 22/08/2026, lo que antes era
> "API Setup" ahora se llama **Paso 1. Probar**, en el menú izquierdo bajo
> **WhatsApp**.

Entrá a **WhatsApp** → **Paso 1. Probar**.

Si ves el cartel *"No hay ningún número de teléfono disponible para esta
aplicación"*, apretá **Solicitar número de prueba**. Tarda ~1 minuto. Sin esto
no existe ni el número, ni el Phone Number ID, ni el token.

### A4. Los tres datos que necesitás

Una vez que tenés el número, en esa misma pantalla mirá el bloque de **`curl`
de la derecha**: se autocompleta con tus valores reales. Es la forma más
confiable de sacarlos, porque Meta cambia de lugar los campos sueltos.

```
curl -i -X POST https://graph.facebook.com/v25.0/123456789012345/messages
                                                 ^^^^^^^^^^^^^^^
                                                 Phone Number ID

  -H 'Authorization: Bearer EAAxxxxxxxxxxxxx...'
                            ^^^^^^^^^^^^^^^^^
                            Access Token (temporal)
```

| Dato | Dónde |
|---|---|
| **Phone Number ID** | En la URL del curl, entre la versión y `/messages` |
| **Access token** | Después de `Bearer ` en el curl |
| **WhatsApp Business Account ID** | Menú izquierdo → **WhatsApp** → **Información general** |

Copiá los tres a tu archivo de credenciales.

> ⚠️ **El token temporal dura 24 horas.** Para armar esto hoy está perfecto,
> pero si vence justo durante la demo quedás pagando. Ver la sección "Token
> permanente" al final.

### A4b. Registrar tu número como destinatario

El número de prueba de Meta solo habla con números verificados a mano.

En la misma pantalla **Paso 1. Probar**, campo **Destinatario**: poné tu número
con código de país (`+54 9 11 ...`). Te llega un código por WhatsApp y lo
confirmás.

**Agregá también el número del jurado si sabés cuál es.** Entran hasta 5.

### A5. Probar que la ida funciona

En **Paso 1. Probar** hay un botón para enviar el mensaje de ejemplo
(`hello_world`) a tu número. Si te llega, la mitad del camino está hecha.

Si no llega, no sigas: revisá que el número esté verificado en la lista.

---

## Parte B — Los webhooks en n8n

Meta hace dos cosas distintas contra tu URL:

- Un **GET** una sola vez, para verificar que la URL es tuya. Espera que le
  devuelvas un valor que te manda.
- Un **POST** cada vez que llega un mensaje.

Son dos nodos Webhook distintos, con el mismo path. n8n los distingue por método.

### B1. Webhook de verificación (GET)

Agregá un nodo **Webhook** suelto en el canvas:

- **HTTP Method**: `GET`
- **Path**: `whatsapp`
- **Respond**: `Using 'Respond to Webhook' Node`

Conectale un nodo **Respond to Webhook**:

- **Respond With**: `Text`
- **Response Body**: modo expresión →
  ```
  {{ $json.query['hub.challenge'] }}
  ```

### B2. Webhook de mensajes (POST)

Otro nodo **Webhook**:

- **HTTP Method**: `POST`
- **Path**: `whatsapp` (el mismo, no es error)
- **Respond**: `Immediately`

> Que responda al toque es importante. Meta reintenta si tardás más de unos
> segundos, y el agente tarda. Si no respondés rápido te llegan mensajes
> duplicados y gastás ejecuciones al pedo.

### B3. Filtrar lo que no son mensajes

Meta también manda notificaciones de estado (`sent`, `delivered`, `read`). Si no
las filtrás, el agente contesta a cada una y te quedás sin ejecuciones.

Conectá un nodo **If** al Webhook POST:

- Condición: **Object** → **is not empty**
- Valor izquierdo, modo expresión:
  ```
  {{ $json.body.entry[0].changes[0].value.messages }}
  ```

Solo la rama **true** sigue.

### B4. Publicar y dar de alta el webhook en Meta

**Esto no funciona sin publicar el workflow.** La URL de producción solo existe
cuando el workflow está activo.

1. En n8n, botón **Publish** arriba a la derecha.
2. Abrí el nodo Webhook GET y copiá la **Production URL**:
   `https://TU-NOMBRE.app.n8n.cloud/webhook/whatsapp`
3. En Meta → menú izquierdo → **Webhooks** (o **WhatsApp** →
   **Configuración**) → **Editar**:
   - **Callback URL**: la URL de arriba
   - **Verify token**: inventate una cadena, por ejemplo `codercup2026`. No se
     valida contra nada tuyo, solo tiene que existir.
   - **Verify and save**
4. Si dice que verificó, el nodo GET hizo su trabajo.
5. En la misma pantalla → **Webhook fields** → **Manage** → tildá **`messages`**
   → Save.

> Si falla la verificación: casi siempre es que el workflow no está publicado, o
> que el path no coincide. Probá abrir la Production URL en el navegador: tiene
> que responder algo, no dar 404.

### B5. Reconectar el Normalizar

Ahora el nodo `Normalizar` tiene que leer datos reales en vez de los fijos.

1. Borrá la conexión entre **Manual Trigger** y **Normalizar** (click en la
   línea → tecla `Delete`). Dejá el Manual Trigger en el canvas: te sirve para
   debuggear después.
2. Conectá la salida **true** del **If** a **Normalizar**.
3. Abrí `Normalizar` y cambiá los tres valores a modo expresión:

| Name | Value |
|---|---|
| `telefono` | `{{ $json.body.entry[0].changes[0].value.messages[0].from }}` |
| `nombre` | `{{ $json.body.entry[0].changes[0].value.contacts[0].profile.name }}` |
| `texto` | `{{ $json.body.entry[0].changes[0].value.messages[0].text.body }}` |

Los nombres de los campos no cambian, así que el AI Agent y las tools siguen
funcionando sin tocar nada.

---

## Parte C — Contestar por WhatsApp

Conectá a la salida del **AI Agent** un nodo **WhatsApp Business Cloud**:

- **Credential** → *Create new*:
  - **Access Token**: el temporal de A4
  - **Business Account ID**: el de A4
- **Resource**: `Message`
- **Operation**: `Send`
- **Phone Number ID**: el de A4
- **Recipient Phone Number**: modo expresión →
  `{{ $('Normalizar').item.json.telefono }}`
- **Message Type**: `Text`
- **Text Body**: modo expresión → `{{ $json.output }}`

Guardá y **Publish** de nuevo.

---

## Probarlo

Desde tu celular, mandale un WhatsApp al número de prueba de Meta (el que
pediste en A3; figura en **Paso 1. Probar**).

```
hola, tenes cancha manana a las 8?
```

Tenés que recibir la respuesta del agente.

**Cada mensaje que entre gasta una ejecución de las 50.** Probá lo justo:
una conversación completa de ida y vuelta hasta reservar, y verificás en
Supabase que la fila esté.

### Si no contesta

| Síntoma | Dónde mirar |
|---|---|
| No pasa nada | n8n → pestaña **Executions**. Si no hay ninguna, Meta no está llegando: revisá el webhook y que esté suscrito a `messages` |
| Ejecución con error en `Normalizar` | La estructura del mensaje es otra (¿mandaste un audio o una imagen?). El bot solo maneja texto |
| Error `190` en el nodo WhatsApp | El token expiró. Regeneralo en **Paso 1. Probar** |
| Contesta dos veces | El Webhook POST no está en `Respond: Immediately` |
| Contesta a mensajes que no mandaste | Falta el nodo If filtrando los `statuses` |

---

## Token permanente (10 min, recomendado si la demo es en vivo)

El token temporal vence a las 24 horas. Para que no te explote en la
presentación:

1. https://business.facebook.com → **Configuración del negocio**
2. **Usuarios** → **Usuarios del sistema** → **Agregar**
   - Nombre: `n8n-bot` · Rol: **Administrador**
3. **Agregar activos** → **Apps** → tu app → permiso **Control total**
4. **Generar nuevo token** → elegí tu app → vencimiento **Nunca** → permisos
   `whatsapp_business_messaging` y `whatsapp_business_management`
5. Copiá el token (se muestra una sola vez) y actualizá la credencial en n8n

> Si vas corto de tiempo, la alternativa barata es regenerar el token temporal
> **la mañana de la demo**. Te da 24 horas frescas.

---

## Plan B — Si WhatsApp no sale

No pelees más de 45 minutos. n8n tiene un **Chat Trigger** que te da una URL de
chat pública y hosteada, sin configurar absolutamente nada.

1. Agregá un nodo **Chat Trigger**
2. Conectalo a `Normalizar`
3. En `Normalizar`, poné los valores así:

| Name | Value |
|---|---|
| `telefono` | `{{ $json.sessionId }}` |
| `nombre` | `Cliente` |
| `texto` | `{{ $json.chatInput }}` |

4. **Publish** → el nodo te da una URL de chat que podés abrir en el navegador

No es WhatsApp, pero es una demo en vivo que funciona, que el jurado puede
probar desde su celular, y que muestra exactamente lo mismo: el agente
consultando disponibilidad real y reservando.

Vale mil veces más que un WhatsApp a medio conectar.

---

## Verificación del bloque

- [ ] Meta verificó el webhook
- [ ] Está suscrito al campo `messages`
- [ ] Le mandás un WhatsApp y el agente contesta
- [ ] Podés completar una reserva de punta a punta desde el celular
- [ ] La reserva aparece en la tabla `reservas` de Supabase
- [ ] Exportaste el workflow actualizado a `n8n/backup/`
