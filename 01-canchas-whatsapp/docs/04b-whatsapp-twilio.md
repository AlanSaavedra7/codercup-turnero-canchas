# 04b — WhatsApp con Twilio Sandbox (Bloque 4, ~20 min)

> **DESCARTADO.** El trial de Twilio permite un solo destinatario activo por
> vez, así que el jurado no podía probarlo. Se siguió con el chat público
> ([`04c`](04c-chat-publico.md)). Queda como registro de lo evaluado.


Camino alternativo al de Meta ([`04-whatsapp.md`](04-whatsapp.md)), para cuando
el número de prueba de Meta no se destraba.

**Es WhatsApp real**, no una simulación. Twilio es un proveedor oficial de
WhatsApp Business aprobado por Meta.

## Sobre el riesgo de baneo: no hay

Hay dos formas de conectar WhatsApp y conviene no confundirlas:

| | Cómo funciona | Riesgo |
|---|---|---|
| Evolution API / Baileys | Escaneás un QR y **tu cuenta** pasa a ser el bot | Real: son clientes no oficiales |
| **Twilio** (esto) | Te dan **su** número; vos le escribís como cliente | Ninguno |

Con Twilio tu WhatsApp personal nunca se automatiza. Le mandás un mensaje al
número de ellos igual que a cualquier empresa. Para desconectarte, mandás
`stop`. Además la sesión caduca sola a las 72 horas sin uso.

## Límites del trial (leer antes de planear la demo)

| Límite | Qué implica |
|---|---|
| **Un solo destinatario activo por vez** | El jurado no puede sumarse en paralelo. La demo la manejás vos desde tu celular y ellos miran |
| **100 mensajes gratis** | Una conversación completa son ~8. Alcanza, pero no la desperdicies |
| **Hay que reconectar cada sesión** | Reconectá justo antes de presentar |

Con la entrega encima esto no te frena, pero mejor saberlo ahora que
descubrirlo delante del jurado.

---

## Parte A — Twilio (10 min)

### A1. Crear la cuenta

1. https://www.twilio.com/try-twilio → registrate
2. Verificá mail y teléfono
3. Te dan crédito de prueba, suficiente de sobra para esto

> Si te pide tarjeta, es para pasar a cuenta paga. El sandbox anda con la cuenta
> de prueba.

### A2. Activar el Sandbox de WhatsApp

En la consola: **Home** → **Send a WhatsApp message** (o *Messaging* →
*Try it out*). Se abre el modal **Try out WhatsApp**.

Fijate bien qué es cada cosa, porque confunde:

| Campo | Qué es |
|---|---|
| **Recipient** | **Tu celular.** El cliente que le va a escribir al bot. Va tu número, está bien |
| **To** (`1 (737) 250-8034`) | **El número de Twilio.** Ese es el bot |
| **Send** (`join twilio-trial`) | Tu código de unión |

Anotá el número de Twilio y el código.

### A3. Sumar tu celular

Desde tu WhatsApp, mandale al número de Twilio exactamente tu código:

```
join twilio-trial
```

También podés escanear el QR del modal, que hace lo mismo.

Te responde confirmando. Listo, tu número quedó habilitado.

### A4. Las credenciales

En el **Dashboard** de la consola, arriba:

| Dato | Dónde |
|---|---|
| **Account SID** | Empieza con `AC...` |
| **Auth Token** | Al lado, hay que hacer click en *Show* |

Copialos a tu archivo de credenciales.

---

## Parte B — n8n (10 min)

Esto es bastante más simple que con Meta: **no hay webhook de verificación**.
Twilio no hace el baile del `hub.challenge`, así que te ahorrás dos nodos.

### B1. El webhook

Agregá un nodo **Webhook**:

- **HTTP Method**: `POST`
- **Path**: `twilio`
- **Respond**: `Immediately`

> Tampoco hace falta el nodo `If` que necesitaba Meta. Twilio manda a esta URL
> solo los mensajes entrantes, no notificaciones de estado.

### B2. Reconectar el Normalizar

1. Borrá la conexión entre **Manual Trigger** y **Normalizar** (click en la
   línea → `Delete`). Dejá el Manual Trigger en el canvas para debuggear.
2. Conectá el **Webhook** a **Normalizar**.
3. Abrí `Normalizar` y pasá los tres campos a modo expresión:

| Name | Value |
|---|---|
| `telefono` | `{{ $json.body.From.replace('whatsapp:+', '') }}` |
| `nombre` | `{{ $json.body.ProfileName }}` |
| `texto` | `{{ $json.body.Body }}` |

Twilio manda el remitente como `whatsapp:+5491122334455`. El `.replace()` deja
solo los dígitos, que es el formato que ya tenés guardado en la tabla
`reservas`. Así las reservas viejas y las nuevas quedan consistentes.

El AI Agent y las dos tools **no se tocan**: siguen leyendo los mismos tres
campos.

### B3. Publicar y avisarle a Twilio

**La URL de producción no existe hasta que publiques el workflow.**

1. En n8n: botón **Publish** arriba a la derecha
2. Abrí el nodo Webhook y copiá la **Production URL**:
   `https://TU-NOMBRE.app.n8n.cloud/webhook/twilio`
3. En Twilio: **Messaging** → **Try it out** → **Send a WhatsApp message** →
   pestaña **Sandbox settings**
4. En **When a message comes in**: pegá la URL, método `POST`
5. **Save**

### B4. Responder

Conectá a la salida del **AI Agent** un nodo **Twilio**:

- **Credential** → *Create new*: Account SID + Auth Token de A4
- **Resource**: `SMS`
- **Operation**: `Send`
- **From**: `+17372508034` (el número de Twilio, con `+` y sin `whatsapp:`)
- **To**: modo expresión → `+{{ $('Normalizar').item.json.telefono }}`
- **To Whatsapp**: **ON** ← este toggle es el que convierte el SMS en WhatsApp.
  Si te lo olvidás, Twilio intenta mandar un SMS y falla.
- **Message**: modo expresión → `{{ $json.output }}`

Guardá y **Publish** de nuevo.

---

## Probarlo

Desde tu celular, al número del sandbox:

```
hola, tenes cancha manana a las 8?
```

**Cada mensaje que entre gasta una ejecución de las 50 de n8n.** Hacé una
conversación completa hasta reservar y verificá en Supabase:

```sql
select id, cancha_id,
       inicio at time zone 'America/Argentina/Buenos_Aires' as inicio_local,
       cliente_nombre, cliente_telefono
from reservas order by id desc limit 3;
```

### Si no contesta

| Síntoma | Dónde mirar |
|---|---|
| No pasa nada | n8n → **Executions**. Si no hay ninguna, Twilio no está llegando: revisá la URL en Sandbox settings y que el workflow esté publicado |
| Error en `Normalizar` | Mandaste un audio o una imagen. El bot solo maneja texto |
| Twilio error `63007` o similar | El toggle **To Whatsapp** está apagado, o el `From` está mal |
| `21608` | Tu número se salió del sandbox. Volvé a mandar `join twilio-trial` |
| Contesta pero no llega | Pasaron más de 24hs desde tu último mensaje. Escribile primero vos |

### Ver los logs de Twilio

Consola de Twilio → **Monitor** → **Logs** → **Messaging**. Ahí ves cada mensaje
que entró y salió, con el error exacto si falló. Es mucho más claro que el panel
de Meta.

---

## Limitaciones que conviene saber

- **Un solo destinatario activo por vez.** Para que pruebe otra persona hay que
  cambiar el Recipient en la consola.
- **100 mensajes gratis** en total.
- **Hay que reconectar cada sesión.** Mandá un mensaje antes de presentar.
- **El número es compartido** entre todos los usuarios de sandbox de Twilio. Por
  eso hace falta el código `join`.

Nada de esto te afecta para el concurso, pero mencionalo en el README como
"limitaciones de la versión de prueba" — queda mejor que si el jurado lo
descubre solo.

---

## Verificación del bloque

- [ ] Mandaste el `join ...` y Twilio te confirmó
- [ ] La URL de n8n está cargada en Sandbox settings
- [ ] El workflow está **publicado**
- [ ] Le escribís por WhatsApp y el agente contesta
- [ ] Completaste una reserva de punta a punta desde el celular
- [ ] La reserva aparece en Supabase con la hora correcta
- [ ] Exportaste el workflow actualizado a `n8n/backup/`
