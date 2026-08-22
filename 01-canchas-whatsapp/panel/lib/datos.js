// Acceso a Supabase desde el servidor.
//
// Se usa la service_role key, que saltea RLS. Por eso este archivo solo puede
// correr en el servidor: si lo importara un componente cliente, la key
// terminaria en el navegador. Las variables no llevan el prefijo
// NEXT_PUBLIC_ justamente para que Next tire error si eso llegara a pasar.

const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

export const TZ = 'America/Argentina/Buenos_Aires';

async function sb(path, init = {}) {
  if (!URL_BASE || !KEY) {
    throw new Error(
      'Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY. Copiá .env.local.example a .env.local y completalo.'
    );
  }

  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// --- Fechas -----------------------------------------------------------------

/** Fecha de hoy en Argentina, como YYYY-MM-DD. */
export function hoyAR() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/** Suma días a un YYYY-MM-DD sin que la zona horaria lo corra un día. */
export function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function horaAR(iso) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

export function fechaLarga(fecha) {
  const texto = new Date(`${fecha}T12:00:00Z`).toLocaleDateString('es-AR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Hoy", "Mañana", "mié 26" — la etiqueta de un día en la tira del selector. */
export function etiquetaDia(fecha, hoy) {
  if (fecha === hoy) return 'Hoy';
  if (fecha === sumarDias(hoy, 1)) return 'Mañana';
  const d = new Date(`${fecha}T12:00:00Z`);
  const dia = d
    .toLocaleDateString('es-AR', { timeZone: 'UTC', weekday: 'short' })
    .replace('.', '');
  return `${dia} ${d.getUTCDate()}`;
}

export function diaCorto(iso) {
  return new Date(iso).toLocaleDateString('es-AR', {
    timeZone: TZ,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

/** La fecha (YYYY-MM-DD) argentina de un timestamp ISO. */
export function fechaDe(iso) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
}

// --- Consultas --------------------------------------------------------------

export function getCanchas() {
  // activa=eq.true a propósito: la función disponibilidad() de Postgres también
  // filtra por `activa`. Si acá no filtráramos, una cancha dada de baja saldría
  // como fila fantasma con todas las franjas en "Ya pasó".
  return sb('canchas?select=*&activa=eq.true&order=id.asc');
}

const CAMPOS =
  'id,cancha_id,inicio,fin,cliente_nombre,cliente_telefono,estado,creado_en,' +
  'canchas(nombre,deporte,precio_hora)';

/**
 * Turnos confirmados que empiezan dentro del día indicado (hora argentina).
 *
 * Antes esto traía el historial completo en cada refresco. Además de pesado,
 * era incorrecto: al superar el tope de filas de PostgREST y con orden
 * ascendente, las que se cortaban eran las más nuevas.
 */
export function getReservasDelDia(fecha, siguiente) {
  const desde = encodeURIComponent(`${fecha}T00:00:00-03:00`);
  const hasta = encodeURIComponent(`${siguiente}T00:00:00-03:00`);
  return sb(
    `reservas?select=${CAMPOS}&estado=eq.confirmada` +
      `&inicio=gte.${desde}&inicio=lt.${hasta}&order=inicio.asc`
  );
}

/** Últimas reservas cargadas, para la sección de actividad del agente. */
export function getActividad(limite = 8) {
  // Se normaliza aunque hoy solo se llame con un literal: el valor se
  // interpola en la query string, y basta con que mañana alguien lo conecte a
  // un query param para que sea manipulable.
  const n = Math.min(Math.max(Number.parseInt(limite, 10) || 8, 1), 50);
  return sb(
    `reservas?select=${CAMPOS}&estado=eq.confirmada` +
      `&order=creado_en.desc&limit=${n}`
  );
}

export function getDisponibilidad(fecha) {
  return sb('rpc/disponibilidad', {
    method: 'POST',
    body: JSON.stringify({ p_fecha: fecha }),
  });
}

/** Valida que la fecha exista de verdad, no solo que tenga la forma correcta. */
export function fechaValida(f) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f ?? '')) return false;
  const d = new Date(`${f}T12:00:00Z`);
  // El round-trip descarta cosas como 2026-02-31, que JS convierte en marzo.
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === f;
}

/** "hace 5 min", "hace 2 h", "ayer". Para la actividad del agente. */
export function hace(iso) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

/**
 * Teléfono para mostrar en pantalla.
 *
 * El panel es público y sin login: mostrar el número completo de cada cliente
 * lo convierte en una lista de contactos para cualquiera que abra la URL. Se
 * muestran solo los últimos 4 dígitos, que alcanzan para identificar el turno.
 * En un despliegue real esto va detrás de autenticación y se muestra entero.
 */
export function telefonoVisible(tel) {
  const t = String(tel ?? '').trim();
  if (!t) return '—';
  if (t.startsWith('chat-')) return t; // id de sesión web, no es un teléfono
  const ultimos = t.slice(-4);
  return ultimos.length === 4 ? `•••• ${ultimos}` : '••••';
}

export function formatearPrecio(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}
