# Turnero de canchas — detalle técnico

La presentación del proyecto está en el [README de la raíz](../README.md).
Este documento es el detalle de implementación.

**En vivo:** [codercup-turnero-canchas.vercel.app](https://codercup-turnero-canchas.vercel.app/)

## Arquitectura

```
Cliente (chat web público)
      |
      v
[ Chat Trigger ] ──> [ Normalizar ] ──> [ AI Agent ] ──> respuesta al chat
                                             │
                          ┌──────────────────┼──────────────────┐
                     Chat Model           Memory              Tools
                      (Gemini)        (Simple Memory,      ├── ver_disponibilidad
                                       por sesión)         └── crear_reserva
                                                                    │
                                                                    v
                                                        [ Supabase / Postgres ]
                                                                    ^
                                                                    │
                                                        [ Panel Next.js (Vercel) ]
```

El agente tiene **dos** herramientas, no más: consultar disponibilidad y crear
la reserva. Cancelar y reprogramar quedaron fuera de alcance a propósito.

## Stack (todo con capa gratuita)

| Pieza | Herramienta | Por qué / costo |
|---|---|---|
| Automatización | **n8n Cloud** | Sin instalar nada, con URL HTTPS pública incluida. Prueba de 14 días sin tarjeta, alcanza de sobra para el concurso. |
| IA | **Google Gemini** (`gemini-2.5-flash`) via AI Studio | API key gratis, free tier con límite diario generoso. n8n tiene nodo nativo. Backup: Groq. |
| WhatsApp | **Twilio WhatsApp Sandbox** | Proveedor oficial de WhatsApp Business. Te dan un número de sandbox y cada persona se suma mandando un código. Cuenta de prueba gratis, sin riesgo para tu WhatsApp personal. |
| Base de datos | **Supabase** (Postgres) | Free tier. Da Postgres + API REST + auth, y n8n tiene nodo nativo. |
| Panel (vibe coding) | **Next.js 15** (server components, CSS propio) | Deploy gratis en Vercel. Lee de Supabase del lado servidor con la service_role key. 123 B de JS. |

## Entrega

**23 de agosto de 2026.** El orden de trabajo y los recortes de alcance están en
[`docs/03-plan-de-entrega.md`](03-plan-de-entrega.md). Empezá por ahí.

## Estado

- [x] Estructura del proyecto
- [x] Base de datos creada en Supabase — verificada
- [x] n8n Cloud andando
- [x] Agente de IA armado a mano — consulta disponibilidad real y reserva
- [x] Chat público andando — agente reservando de punta a punta
- [ ] WhatsApp conectado (Twilio)
- [ ] Panel web

## Guías

Las guías están en `docs/` y son **paso a paso para que armes vos los nodos**,
no JSON para pegar.

1. [`docs/00-setup-n8n.md`](00-setup-n8n.md) — levantar n8n
2. [`docs/01-base-de-datos.md`](01-base-de-datos.md) — Supabase y el esquema
3. [`docs/02-workflow-n8n.md`](02-workflow-n8n.md) — el agente, nodo por nodo
4. [`docs/03-plan-de-entrega.md`](03-plan-de-entrega.md) — el cronograma de hoy
5. [`docs/04c-chat-publico.md`](04c-chat-publico.md) — chat público (para que lo pruebe el jurado)
6. [`docs/04b-whatsapp-twilio.md`](04b-whatsapp-twilio.md) — conectar WhatsApp (Twilio)
7. [`docs/07-demo.md`](07-demo.md) — guión de la presentación
8. [`docs/05-panel-ia.md`](05-panel-ia.md) — arquitectura de información del panel
9. [`docs/06-panel.md`](06-panel.md) — correr y publicar el panel
10. [`docs/04-whatsapp.md`](04-whatsapp.md) — conectar WhatsApp con Meta (trabado)
