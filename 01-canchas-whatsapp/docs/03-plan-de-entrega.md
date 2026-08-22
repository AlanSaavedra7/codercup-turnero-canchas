# 03 — Plan de entrega (22 → 23 de agosto de 2026)

Queda **un día**. Esta guía reordena el trabajo para que en cada corte tengas
algo funcionando y presentable, no un proyecto a medias.

## Regla de oro

El orden está pensado para que **después del Bloque 3 ya tengas un proyecto
entregable**. Todo lo que viene después suma, pero si algo se rompe o se te va
el tiempo, cortás donde estés y entregás igual.

---

## Bloque 1 — Base de datos (20 min)

Guía: [`01-base-de-datos.md`](01-base-de-datos.md)

- Crear proyecto en Supabase
- Pegar y correr `db/schema.sql`
- Verificar: `select * from disponibilidad(current_date + 1);` devuelve filas
- Anotar Project URL + `service_role` key

**Corte:** tenés la base. Sin esto no sigue nada.

---

## Bloque 2 — n8n Cloud (10 min)

Guía: [`00-setup-n8n.md`](00-setup-n8n.md)

- Cuenta en n8n.io → *Get started free* (14 días, sin tarjeta)
- Entrar a `https://TU-NOMBRE.app.n8n.cloud`

Nada de infraestructura. Cuenta, esperás que levante la instancia, y seguís.

---

## Bloque 3 — El agente, sin WhatsApp todavía (60 min) ⭐

Guía: [`02-workflow-n8n.md`](02-workflow-n8n.md) → **Partes C y D**, salteate la A y la B por ahora

Armá el workflow con un **Manual Trigger** en vez del Webhook:

```
Manual Trigger ──> Normalizar (valores fijos) ──> AI Agent
                                                     │
                                    ver_disponibilidad + crear_reserva
```

- API key de Gemini en https://aistudio.google.com/apikey
- Tools: **solo** `ver_disponibilidad` y `crear_reserva`.
  `mis_reservas` es opcional, dejala para el final si sobra tiempo.
- Probá con: *"hola, tenés cancha mañana a las 8 de la noche?"*

**Corte importante:** acá ya tenés **agente de IA + automatización** funcionando
contra datos reales. Esto solo ya es un proyecto de CoderCup válido. Todo lo que
sigue lo mejora, pero no lo condiciona.

---

## Bloque 4 — WhatsApp (45 min, con riesgo)

Guía: [`04-whatsapp.md`](04-whatsapp.md)

Es el bloque con más chances de trabarse: la cuenta de Meta for Developers a
veces pide verificaciones que tardan. Por eso va después del Bloque 3 y no antes.

- Reemplazás el Manual Trigger por los Webhooks (Partes A y B de la guía 02)
- Conectás el nodo WhatsApp Business Cloud al final

**Si se traba:** no pelees más de 45 minutos. Pasá al plan B de abajo y seguí
con el panel.

### Plan B si WhatsApp no sale

n8n tiene un nodo **Chat Trigger** que te da una URL de chat pública y hosteada,
sin configurar nada. Cambiás el Manual Trigger por el Chat Trigger y tenés una
interfaz de chat real para demostrar el agente en vivo.

No es WhatsApp, pero es una demo que funciona y se entiende. Vale mil veces más
que un WhatsApp a medio conectar.

---

## Bloque 5 — El panel (60 min)

Guía: [`05-panel.md`](05-panel.md)

Una sola página: turnos reservados de hoy y de los próximos días, y los libres.
Next.js + Tailwind, deploy en Vercel.

Alcance mínimo que ya se ve bien:
- Lista de reservas con nombre, teléfono, cancha y horario
- Grilla de disponibilidad del día
- Nada de login, nada de edición. Es un panel de lectura para la demo.

---

## Bloque 6 — Preparar la demo (30 min) ⭐

Esto la gente lo saltea y es lo que decide concursos.

- Cargá reservas de ejemplo para que el panel no se vea vacío
- Grabá un video corto: mandás el mensaje → el agente responde → aparece en el panel
- Exportá los workflows a `n8n/backup/`
- Actualizá el `README.md` con capturas y cómo correrlo

---

## Recorte de alcance, por si el reloj apura

Lo que **no** hay que hacer hoy, aunque tiente:

- Cancelar y reprogramar turnos desde el chat
- Recordatorios automáticos el día anterior
- Login en el panel
- Pagos o señas
- Manejo de varios complejos

Anotalos en el README como "próximos pasos". Queda mejor un alcance chico bien
terminado que cinco cosas a medias.
