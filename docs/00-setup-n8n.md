# 00 — n8n Cloud

No instalás nada. n8n corre en la nube y te da una URL HTTPS pública y fija, que
es justo lo que Meta necesita para el webhook de WhatsApp.

## Setup (3 minutos)

1. Entrá a https://n8n.io y hacé click en **Get started free**.
2. Creá la cuenta con tu mail. **No pide tarjeta.**
3. Elegí la región que te ofrezca, da igual para este proyecto.
4. En un par de minutos tenés tu instancia en `https://TU-NOMBRE.app.n8n.cloud`.

Las URLs de webhook de tus nodos van a ser
`https://TU-NOMBRE.app.n8n.cloud/webhook/loquesea`, y son fijas: no cambian entre
reinicios.

## Lo único que hay que tener en cuenta

La prueba gratuita dura **14 días** y trae **50 ejecuciones**. Los 14 días
cubren el concurso de sobra; las 50 ejecuciones son más justas de lo que parece,
porque cada corrida manual y cada mensaje de WhatsApp que entre gasta una.

Mirá el contador arriba a la izquierda de n8n. Presupuesto sugerido:

| Para qué | Ejecuciones |
|---|---|
| Armar y probar el agente (Bloque 3) | ~20 |
| Conectar WhatsApp (Bloque 4) | ~10 |
| Grabar la demo (Bloque 6) | ~10 |
| Colchón | ~10 |

Después vence y n8n Cloud pasa a ser pago.

Por las dudas, cada vez que avances algo importante exportá el workflow
(**...** arriba a la derecha → *Download*) y guardá el JSON en `n8n/backup/`.
Con eso podés reimportarlo donde quieras. Si más adelante querés que el proyecto
siga vivo gratis, n8n se puede autohospedar en Render usando Supabase como base
de datos, sin costo — pero eso es tema de después del concurso.

## Verificación

- [ ] Podés entrar a `https://TU-NOMBRE.app.n8n.cloud`
- [ ] Creaste un workflow de prueba y lo guardaste
