# 04c — Chat público con n8n (~10 min)

Una URL de chat pública, hosteada por n8n, que **cualquiera abre desde cualquier
dispositivo sin configurar nada**. El jurado la usa desde su celular.

## Por qué esto y no solo WhatsApp

Ninguna vía gratuita de WhatsApp deja que un desconocido le escriba al bot:

| Opción | ¿El jurado puede probarlo solo? |
|---|---|
| Meta Cloud API | No: hay que cargar su número a mano, máximo 5 |
| Twilio sandbox (trial) | No: un destinatario activo por vez |
| **Chat Trigger** | **Sí: URL pública, cero configuración** |

No es una limitación tuya: es lo que impide que cualquiera monte un bot de spam.
Para tener un WhatsApp abierto al público hace falta verificar la empresa en
Meta, que tarda días.

**La jugada es tener las dos.** El chat para que lo prueben, y un video corto del
WhatsApp real para demostrar que la integración existe.

---

## Paso 1 — El Chat Trigger

Trabajá sobre el workflow que ya tenés (`CoderCup Champions-Turnos`). Como
todavía no armaste nada de Twilio, no hay nada que duplicar.

> Si más adelante sumás WhatsApp, **ahí sí** duplicá el workflow
> (`Overview` → `...` → **Duplicate**) y dejá uno para cada canal. Meter los dos
> triggers en el mismo workflow hace que el nodo de envío de WhatsApp se
> dispare también con los mensajes del chat, y falle.

1. Agregá el nodo **Chat** → en el panel de la derecha elegí, bajo **Triggers**,
   la opción **On new Chat event** (la del rayito ⚡).

   > Las dos opciones de arriba, bajo *Actions*, son para **mandar** mensajes
   > desde un workflow ya arrancado. Vos necesitás que el mensaje entrante
   > **inicie** el workflow: eso es el trigger.
2. Borrá la conexión entre **Manual Trigger** y **Normalizar** (click en la
   línea → `Delete`). Dejá el nodo en el canvas, no molesta.
3. Conectá el **Chat Trigger** a **Normalizar**.

En el nodo:

- **Make Chat Publicly Available**: **ON** ← sin esto no hay URL pública
- **Mode**: `Hosted Chat`
- **Response Mode**: `Last Node`

`Last Node` es lo que hace que la respuesta del AI Agent vuelva sola al chat. Por
eso no hace falta ningún nodo de envío al final.

### Darle onda (opcional, 2 min)

**Options** → **Add Option**:

- **Title**: `CoderCup Champions`
- **Subtitle**: `Reservá tu cancha`
- **Initial Messages**:
  ```
  ¡Hola! Soy el asistente de CoderCup Champions ⚽
  Decime qué día y a qué hora buscás cancha y te digo qué tenemos libre.
  ```

Son dos minutos y es lo primero que ve el jurado.

## Paso 2 — Ajustar el Normalizar

El Chat Trigger manda otros campos. Abrí `Normalizar` y poné:

| Name | Value |
|---|---|
| `telefono` | `chat-{{ $json.sessionId.slice(0, 8) }}` |
| `nombre` | `Cliente web` |
| `texto` | `{{ $json.chatInput }}` |

El chat no tiene teléfono, así que usamos el `sessionId` recortado. Queda algo
como `chat-a1b2c3d4`, que en el panel se lee claro como "vino del chat web" y no
se confunde con un número real.

> ⚠️ Los tres campos van en modo **Expression** (botoncito `fx`), no Fixed.
> Si quedan en Fixed, el agente recibe el texto literal `{{ $json.chatInput }}`
> como mensaje del cliente y te va a repetir la misma pregunta para siempre, sin
> dar ningún error. Verificá que el preview debajo de cada campo muestre el
> valor evaluado.

El AI Agent y las dos tools **no se tocan**.

## Paso 3 — Publicar

Botón **Publish**. Abrí el Chat Trigger y copiá la **Chat URL**:

```
https://TU-NOMBRE.app.n8n.cloud/webhook/xxxxx/chat
```

Abrila en el navegador. Tiene que aparecer la ventana de chat.

**Probala desde el celular** con los datos móviles, no con el wifi de casa. Es la
forma de confirmar que es realmente pública y no algo que solo anda en tu red.

---

## Para la demo

Generá un QR de esa URL (cualquier generador online) y ponelo en la
presentación. El jurado lo escanea y está chateando con tu agente en 3 segundos.

Es la diferencia entre "les cuento lo que hace" y "probalo vos".

> Cada mensaje del chat gasta una ejecución de las 50 de n8n. Si el jurado la va
> a probar en vivo, dejá al menos 15 sin usar.

## Verificación

- [ ] La Chat URL abre desde el celular con datos móviles
- [ ] El agente responde con horarios reales
- [ ] Podés reservar de punta a punta
- [ ] La reserva aparece en Supabase con `cliente_telefono` tipo `chat-xxxxxxxx`
- [ ] Exportaste el workflow a `n8n/backup/`
