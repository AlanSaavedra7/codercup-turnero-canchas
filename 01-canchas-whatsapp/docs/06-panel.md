# 06 — El panel (Bloque 5, ~30 min)

El código ya está escrito en [`../panel/`](../panel/). Esta guía es para
correrlo y publicarlo.

Estructura definida en [`05-panel-ia.md`](05-panel-ia.md); acá va el "cómo se
ve" y el "cómo se corre".

---

## Paso 1 — Configurar (3 min)

```bash
cd panel
cp .env.local.example .env.local
```

Abrí `.env.local` y completá con los datos del Bloque 1:

```
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_KEY=tu_service_role_key
```

> Va la **service_role**, no la anon. Las tablas tienen RLS activo y la anon no
> puede leer nada. Fijate que las variables **no** llevan el prefijo
> `NEXT_PUBLIC_`: eso es a propósito. Sin ese prefijo, Next se niega a mandar la
> key al navegador. Si algún día alguien intenta usarla en un componente
> cliente, el build falla en vez de filtrar la credencial en silencio.
>
> `.env.local` está en el `.gitignore`. No lo subas.

## Paso 2 — Correr (2 min)

```bash
npm run dev
```

Abrí http://localhost:3000. Tenés que ver los turnos que ya cargaste.

Si aparece una tarjeta de error, el mensaje de Supabase está ahí abajo: casi
siempre es la key equivocada.

## Paso 3 — Enchufar la burbuja de chat (10 min)

El panel puede mostrar el **mismo agente** en una burbuja flotante, así el
jurado reserva y ve la grilla cambiar en la misma pantalla.

### Por qué burbuja y no pestaña

El momento fuerte de la demo es reservar por el chat y ver la celda darse
vuelta. Una pestaña taparía el panel justo cuando pasa eso. La burbuja flota
encima: el panel queda visible atrás.

### Por qué no un iframe

n8n Cloud manda `x-frame-options: SAMEORIGIN`, así que la página del chat no se
puede meter en un `<iframe>`. Hay que usar el widget oficial `@n8n/chat`, que ya
está instalado y cableado.

### Los tres pasos

1. **Sacá la Chat URL** del nodo *When chat message received* en n8n. Es la que
   dice `https://TU-NOMBRE.app.n8n.cloud/webhook/xxxxxxxx/chat`.

2. **Habilitá el origen en n8n.** En ese mismo nodo → **Options** → **Add
   Option** → **Allowed Origins (CORS)**. Poné:
   ```
   http://localhost:3000,https://TU-PANEL.vercel.app
   ```
   Sin esto el navegador bloquea el pedido y la burbuja se abre pero no
   contesta. Para probar rápido podés poner `*`, pero acordate de acotarlo
   después.

3. **Cargá la URL** en `.env.local`:
   ```
   NEXT_PUBLIC_N8N_CHAT_URL=https://TU-NOMBRE.app.n8n.cloud/webhook/xxxxxxxx/chat
   ```
   Esta sí lleva `NEXT_PUBLIC_` porque es pública por diseño: la ve cualquiera
   que use el chat. Es lo contrario de la key de Supabase.

Si dejás la variable vacía, el panel funciona igual pero sin burbuja. No rompe
nada.

> **Si la burbuja abre pero no responde**, mirá la consola del navegador. Un
> error de CORS significa que falta el paso 2. Si el problema persiste, el
> Chat Trigger puede necesitar **Mode: Embedded Chat** en vez de *Hosted Chat*
> — pero ojo, eso deja de servir la página pública del chat. Antes de cambiarlo,
> decidí si querés las dos cosas o solo la burbuja.

## Paso 4 — Publicar en Vercel (20 min)

```bash
cd ..
git init
git add .
git commit -m "Turnero de canchas con agente de IA"
```

Creá un repo en GitHub y subilo. Después:

1. [vercel.com](https://vercel.com) → entrá con GitHub → **Add New** → **Project**
2. Importá el repo
3. **Root Directory**: `01-canchas-whatsapp/panel` ← importante, no la raíz
4. **Environment Variables**: cargá `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` y
   `NEXT_PUBLIC_N8N_CHAT_URL`
5. **Deploy**

En un par de minutos tenés `https://algo.vercel.app` público.

> Si te olvidás de las variables de entorno, el deploy sale bien pero la página
> muestra la tarjeta de error. Se arregla cargándolas en
> *Settings → Environment Variables* y redeployando.

---

## Decisiones de diseño

Vienen de correr `information-architecture` y `ui-ux-pro-max`, más lo que ya
sabíamos del proyecto.

### Una grilla, no dos listas

Querías ver los turnos dados **y** los disponibles. Son el mismo objeto: cada
franja está ocupada o libre. Una grilla de canchas × horas contesta las dos
preguntas de un vistazo, y además muestra dónde están los huecos — que es lo
que un dueño realmente mira.

### La fecha vive en la URL

`/?fecha=2026-08-23`. Eso hace que el botón "atrás" funcione solo, que la página
se pueda compartir, y que **todo se renderice en el servidor**: cero JavaScript
de cliente, cero spinners, cero estado que sincronizar. El bundle son 123 B.

### Se actualiza solo, sin websockets

El panel se refresca cada 10 segundos, y además al instante cuando volvés a la
pestaña. El indicador de la esquina muestra hace cuánto.

La opción "correcta" sería Supabase Realtime, pero necesita un componente
cliente conectado a Supabase con la anon key — y las tablas tienen RLS sin
políticas, así que habría que abrirlas. Más superficie de ataque para resolver
algo que no lo necesita.

En vez de eso, un componente cliente de 40 líneas llama a `router.refresh()`.
Next vuelve a renderizar los server components y manda el resultado; React
reconcilia solo el DOM que cambió. **Sin recarga, sin parpadeo, sin perder el
scroll, y la service_role key nunca sale del servidor.**

Dos detalles que importan: no hace polling con la pestaña en segundo plano, y
respeta `prefers-reduced-motion` en el pulso del indicador.

> Costo: el bundle pasó de 123 B a unos pocos kB de JS. Es lo único de cliente
> que tiene el panel.

### Tipografía

**Fira Sans** para texto, **Fira Code** para todo lo que sea número. Los
números van con `font-variant-numeric: tabular-nums`, así todos los dígitos
ocupan lo mismo y las columnas de horarios y precios no bailan al cambiar de
día.

### Paleta

Slate neutro con verde para "libre". Un panel operativo tiene que ser aburrido:
el color se reserva para el único dato que importa de un vistazo.

### Movimiento: solo el que significa algo

El panel tiene cuatro animaciones y ninguna es decorativa. Cada una comunica
una relación causa-efecto:

| Qué | Cuándo | Por qué |
|---|---|---|
| Celda que se funde de verde a slate | Un turno se vende | Ves *qué* cambió sin buscarlo |
| Destello verde en filas nuevas | Entra una reserva | La señal de que el agente acaba de trabajar |
| Pulso del indicador | Siempre | El panel está vivo |
| Botón que se hunde al tocarlo | Al presionar | Feedback táctil |

El destello aprovecha cómo reconcilia React: las filas llevan `key={id}`, así
que al refrescar **el DOM de las filas que ya existían se conserva** y la
animación no se vuelve a disparar. Solo corre en los elementos recién creados.
Cero JavaScript para detectar "qué es nuevo".

Todo respeta `prefers-reduced-motion`, que apaga transiciones y animaciones de
una.

### Accesibilidad

- Contraste ≥ 4.5:1 en ambos modos
- Targets táctiles de 44px en el selector de día
- **El estado nunca se comunica solo por color**: cada celda dice "Libre", el
  nombre del cliente, o un guion
- Iconos SVG inline, no emoji: los emoji cambian de forma según el sistema y no
  se pueden pintar con los tokens
- `prefers-reduced-motion` y `prefers-color-scheme` respetados
- **El contador "Actualizado hace Xs" no lleva `aria-live`.** Cambia cada
  segundo: un lector de pantalla lo estaría anunciando sin parar. Es información
  ambiental, no una notificación. El badge tiene un `aria-label` fijo y el
  número queda `aria-hidden`
- En celular la grilla avisa "Deslizá para ver el resto de los horarios": con
  350px visibles de 720px, más de la mitad queda afuera sin ninguna pista
- La columna fija de canchas lleva sombra propia, así al scrollear se lee como
  una capa por encima y no se confunde con el contenido

### Seguridad

Revisado antes de publicar. Lo que se resolvió y por qué:

**Los teléfonos se muestran enmascarados** (`•••• 0000`). El panel es público y
sin login: mostrar el número completo de cada cliente lo convierte en una lista
de contactos para cualquiera que abra la URL. Los últimos 4 dígitos alcanzan
para identificar el turno. En un despliegue real esto va detrás de
autenticación y se muestra entero.

**El mensaje de error es genérico en producción.** El cuerpo de un error de
PostgREST trae nombres de tablas, columnas y constraints — un mapa gratis del
esquema para quien fuerce un fallo. Ahora el detalle va a `console.error` del
servidor y en pantalla solo aparece en desarrollo.

**Cabeceras**: `X-Frame-Options: DENY` (nadie puede iframear el panel),
`nosniff`, `Referrer-Policy` para no filtrar la URL con `?fecha=` a sitios
externos, y `Permissions-Policy` cerrando cámara, micrófono y ubicación.
`poweredByHeader: false` para no anunciar que corre Next.

> **No hay CSP a propósito.** La burbuja de chat carga desde `*.app.n8n.cloud` y
> una política mal calibrada la rompe en silencio. Para un panel de solo lectura
> sin formularios, las cuatro cabeceras de arriba cubren lo que importa.

**Pendiente, en n8n y no acá:** el Chat Trigger quedó con
`Allowed Origins (CORS)` en `*`, lo que permite que cualquier sitio web maneje
tu agente y cree reservas. Después del concurso acotalo al dominio de Vercel.

### Lo que se verificó y estaba bien

- **Sin XSS**: React escapa todo y no hay ningún `dangerouslySetInnerHTML`.
  Aunque el agente escriba `<script>` en `cliente_nombre`, sale como texto.
- **Sin SQL injection**: la fecha pasa por regex más round-trip y va con
  `encodeURIComponent`; los parámetros del RPC los parametriza PostgREST.
- **La service_role key no sale del servidor**: sin prefijo `NEXT_PUBLIC_`,
  Next se niega a mandarla al cliente.
- **RLS activo** en `canchas` y `reservas`, sin políticas.

### El scroll horizontal está adentro de la grilla

Con 14 columnas de horarios, en un celular no entra. La regla es que el **body
nunca** scrollea horizontal: el scroll vive dentro del contenedor de la grilla,
y la columna con el nombre de la cancha queda fija con `position: sticky` para
no perder la referencia.

---

## Verificación

- [ ] `npm run dev` levanta y muestra tus turnos reales
- [ ] Los botones Hoy / Mañana cambian los datos y la URL
- [ ] El botón "atrás" del navegador vuelve al día anterior
- [ ] En celular (o DevTools a 375px) la grilla scrollea sola y el nombre de la
      cancha queda fijo
- [ ] La página no scrollea horizontal
- [ ] Probaste el modo oscuro del sistema
- [ ] El indicador dice "Actualizado hace Xs" y el contador sube
- [ ] Reservás algo por el chat y aparece solo, sin tocar F5
- [ ] Está publicado en Vercel y abre desde el celular

## Si algo falla

| Síntoma | Causa |
|---|---|
| Tarjeta de error de Supabase | Falta `.env.local` o tiene la anon key |
| Todo aparece como "Ya pasó" | Estás mirando una fecha pasada. `disponibilidad()` solo devuelve franjas futuras |
| Ocupación 0% con turnos cargados | Los turnos son de otro día. Cambiá la fecha |
| Vercel deploya pero da error | Faltan las variables de entorno en el proyecto de Vercel |
| `Module not found` | Te olvidaste de `npm install` dentro de `panel/` |
| `__webpack_modules__[moduleId] is not a function` | Corriste `next build` o un `npm install` con `next dev` levantado y se invalidó la caché. Se arregla parando el server, `rm -rf .next` y volver a levantar |
| La burbuja no aparece | `NEXT_PUBLIC_N8N_CHAT_URL` está vacía |
| La burbuja abre pero no contesta | Falta cargar el origen en **Allowed Origins (CORS)** del Chat Trigger |
