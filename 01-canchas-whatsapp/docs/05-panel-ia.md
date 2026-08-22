# 05 — Arquitectura de información del panel

Documento de estructura: **qué existe, dónde vive, en qué orden y cómo se
llama**. El "cómo se ve" va después, en la guía 06.

---

## La decisión estructural que ordena todo

Pediste dos cosas: ver **los turnos que la IA dio** y ver **cuáles están
disponibles**.

Parecen dos vistas, pero son el mismo objeto mirado desde dos lados: cada franja
horaria de cada cancha está ocupada o libre. No hay un tercer estado.

**Entonces no son dos secciones: es una sola grilla.** Canchas en las filas,
horas en las columnas, cada celda ocupada o libre. Un vistazo responde las dos
preguntas a la vez, y además una tercera que no pediste pero es la que más
importa a un dueño: *dónde tengo los huecos*.

Si fueran dos listas separadas, para saber si el sábado a las 20 tenés lugar
habría que leer una lista y descartar mentalmente contra la otra.

---

## Site map

Una sola pantalla. No hay navegación entre secciones porque no hay secciones.

```
Panel  /
  └── ?fecha=YYYY-MM-DD    (mismo panel, otro día)
```

**Por qué el día va en la URL y no en un estado del cliente:** hace que la
página se pueda compartir y marcar, el botón "atrás" del navegador funciona
solo, y permite que todo se renderice en el servidor. Sin JavaScript de cliente,
sin spinners, sin estado que sincronizar.

Con una pantalla y sin login, no hay navegación primaria, secundaria ni de
utilidad. El **selector de día es la única navegación que existe**.

---

## Jerarquía de contenido

Un solo rol —el dueño del complejo— pero **dos momentos de uso distintos**, y
mandan cosas diferentes:

| Momento | Qué necesita | Frecuencia |
|---|---|---|
| **Vistazo rápido** ("¿cómo viene hoy?") | Cuántos turnos, cuánto entra, cuánto queda libre | Muchas veces al día |
| **Consulta puntual** ("¿quién reservó el sábado a las 20?") | Nombre y teléfono de un turno concreto | Ocasional |

El vistazo rápido es el 80% del uso, así que va arriba y sin interacción.

### Orden de la pantalla

1. **Resumen del día** — turnos ocupados, ingresos, canchas libres.
   Números grandes, cero clicks. Responde "¿cómo viene?" desde la puerta.

2. **Selector de día** — hoy / mañana / fecha puntual.
   Va acá, entre el resumen y la grilla, porque **cambia el significado de las
   dos**. Si estuviera abajo de todo, verías números sin saber de qué día son.

3. **Grilla de ocupación** — el corazón del panel.
   Canchas × horas. Cada celda: libre u ocupada, y si está ocupada, quién.

4. **Detalle de turnos del día** — lista con nombre, teléfono, origen y precio.
   Es el "zoom" de la grilla. Va después porque responde una pregunta que solo
   te hacés cuando ya viste la grilla.

5. **Actividad del agente** — últimos turnos que tomó la IA, con hora de carga.
   Abajo de todo. No sirve para operar el complejo, pero **es la prueba visible
   de que la automatización está trabajando** — y en una demo de concurso, eso
   vale.

> El error a evitar es poner la lista de turnos arriba de la grilla. La lista
> tiene más texto y parece más importante, pero contesta la pregunta menos
> frecuente.

---

## Flujo de uso

### "¿Cómo viene el finde?"
1. Abre el panel → ve el resumen de hoy
2. Toca **Mañana** → la URL pasa a `?fecha=2026-08-23`
3. Mira la grilla: ve tres huecos seguidos a la tarde en Cancha 2
4. Baja al detalle si quiere el teléfono de alguno

### "¿Está funcionando el bot?"
1. Abre el panel → baja a **Actividad del agente**
2. Ve los últimos turnos con su hora de carga y el canal de origen
3. Si hay movimiento reciente, el bot está vivo

---

## Nomenclatura

Una palabra por concepto, la misma en todos lados. Y **la misma que usa el
agente en el chat**: si el bot dice "turno" y el panel dice "reserva", son dos
productos distintos para el usuario.

| Concepto | En la UI | Por qué |
|---|---|---|
| Franja horaria vendida | **Turno** | Es como se dice en Argentina. El bot ya lo usa |
| Espacio físico | **Cancha** | — |
| Tipo | **Fútbol 5** / **Fútbol 7** | Con el número, no "F5". Se lee de un vistazo |
| Celda sin vender | **Libre** | Corto y positivo. No "disponible", que es más largo |
| Celda vendida | **Ocupado** | — |
| Quién reservó | **Cliente** | — |
| Canal | **WhatsApp** / **Chat web** | El canal concreto, no "origen" |
| Plata del día | **Ingresos** | No "facturación": no se está facturando nada |

> **Etiqueta visible ≠ identificador guardado.** En la base la columna se llama
> `reservas` y el canal `origen`; en pantalla decimos "Turno" y "WhatsApp".
> Cambiar la etiqueta es gratis; cambiar la columna obliga a migrar datos y a
> tocar el workflow de n8n. Se renombra solo la etiqueta.

---

## Qué crece con el tiempo

Lo único que se acumula son **turnos**.

La grilla no crece: siempre son 3 canchas × 14 horas de **un** día. Ese es el
motivo real por el que el panel se organiza por día y no como una lista
infinita — el día acota el conjunto por diseño.

La sección de actividad sí crecería, así que va limitada a los **últimos 8**.
No hace falta paginación ni filtros: el día ya es el filtro.

---

## Componentes

| Componente | Dónde | Notas |
|---|---|---|
| `ResumenDia` | Arriba | 3 o 4 números. Sin interacción |
| `SelectorDia` | Entre resumen y grilla | Links `<a>`, no botones con JS |
| `GrillaOcupacion` | Centro | Se adapta: en celular scrollea horizontal |
| `ListaTurnos` | Abajo de la grilla | Mismo dato, más detalle |
| `ActividadAgente` | Pie | Últimos 8, ordenados por carga |

---

## Fuera de alcance (a propósito)

Anotado acá para que no se cuele por las dudas, y para ponerlo como "próximos
pasos" en el README:

- Login y multi-complejo
- Cancelar o editar turnos desde el panel
- Vista semanal o mensual
- Exportar a Excel
- Gráficos de tendencia

Todo eso es alcance de producto, no de demo. Un panel chico y terminado se ve
mejor que cinco secciones a medio hacer.
