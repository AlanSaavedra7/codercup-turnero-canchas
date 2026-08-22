import {
  getCanchas,
  getReservasDelDia,
  getActividad,
  getDisponibilidad,
  fechaValida,
  telefonoVisible,
  hoyAR,
  sumarDias,
  horaAR,
  diaCorto,
  fechaLarga,
  hace,
} from '../lib/datos';

import {
  ResumenDia,
  SelectorDia,
  GrillaOcupacion,
  ListaTurnos,
  ActividadAgente,
} from './componentes/Piezas';
import EnVivo from './componentes/EnVivo';
import ChatWidget from './componentes/ChatWidget';

// Los datos cambian con cada reserva que toma el agente: nunca cachear.
export const dynamic = 'force-dynamic';

// Argentina no tiene horario de verano, así que el offset es fijo todo el año.
const OFFSET = '-03:00';
const MS_POR_MIN = 60000;

/**
 * Las franjas de la grilla, deducidas de la config de las canchas.
 *
 * Devuelve también `desde` y `pasoMin` para poder reconstruir el instante exacto
 * de cada columna, que es lo que permite saber si una franja ya pasó.
 */
function construirGrilla(canchas) {
  if (!canchas.length) return { horas: [], pasoMin: 60, desde: 0 };

  const aMinutos = (t) => {
    const [h, m] = String(t).split(':').map(Number);
    return h * 60 + m;
  };

  const desde = Math.min(...canchas.map((c) => aMinutos(c.hora_apertura)));
  let hasta = Math.max(...canchas.map((c) => aMinutos(c.hora_cierre)));

  // Un cierre a las 00:00 (o 01:00) pertenece al día siguiente. Sin esto,
  // `hasta` quedaba por debajo de `desde` y la grilla salía sin columnas.
  if (hasta <= desde) hasta += 1440;

  const pasoMin = Math.min(...canchas.map((c) => c.duracion_min || 60));

  const horas = [];
  for (let m = desde; m + pasoMin <= hasta; m += pasoMin) {
    const mm = m % 1440;
    horas.push(
      `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`
    );
  }
  return { horas, pasoMin, desde };
}

export default async function Panel({ searchParams }) {
  const params = await searchParams;
  const hoy = hoyAR();

  // Se valida que la fecha exista, no solo que tenga forma de fecha. Antes,
  // ?fecha=2026-99-99 pasaba el filtro y terminaba mostrando el error de
  // credenciales de Supabase, que no tenía nada que ver.
  const fecha = fechaValida(params?.fecha) ? params.fecha : hoy;
  const siguiente = sumarDias(fecha, 1);

  let canchas, turnosDelDia, disponibilidad, actividad;
  try {
    [canchas, turnosDelDia, disponibilidad, actividad] = await Promise.all([
      getCanchas(),
      getReservasDelDia(fecha, siguiente),
      getDisponibilidad(fecha),
      getActividad(8),
    ]);
  } catch (e) {
    // El detalle va al log del servidor, no a la pantalla: el cuerpo de un
    // error de PostgREST expone nombres de tablas, columnas y constraints, y
    // esta página es pública.
    console.error('[panel] fallo al leer Supabase:', e);

    const enDesarrollo = process.env.NODE_ENV !== 'production';

    return (
      <main className="layout">
        <div className="error">
          <strong>No se pudieron cargar los turnos.</strong>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
            Probá de nuevo en unos segundos. Si sigue igual, el detalle está en
            el log del servidor.
          </p>
          {enDesarrollo && <code>{e.message}</code>}
        </div>
      </main>
    );
  }

  const { horas, pasoMin, desde } = construirGrilla(canchas);

  const baseMs = new Date(`${fecha}T00:00:00${OFFSET}`).getTime();
  const inicioDeSlot = (i) => baseMs + (desde + i * pasoMin) * MS_POR_MIN;
  const ahora = Date.now();

  // Timestamps precalculados: la grilla consulta esto una vez por celda.
  const turnos = turnosDelDia.map((t) => ({
    ...t,
    iniMs: new Date(t.inicio).getTime(),
    finMs: new Date(t.fin).getTime(),
  }));

  const libres = new Set(disponibilidad.map((d) => `${d.cancha_id}|${d.hora}`));

  /**
   * El estado de una celda.
   *
   * Se busca por SOLAPAMIENTO y no por hora exacta: un turno de 20:30 a 21:30
   * bloquea las franjas de 20:00 y de 21:00, y antes desaparecía de la grilla
   * porque "20:30" no coincidía con ninguna columna.
   */
  const celda = (canchaId, hora, i) => {
    const ini = inicioDeSlot(i);
    const fin = ini + pasoMin * MS_POR_MIN;

    const turno = turnos.find(
      (t) => t.cancha_id === canchaId && t.iniMs < fin && t.finMs > ini
    );
    if (turno) {
      return {
        estado: 'ocupado',
        texto: turno.cliente_nombre,
        titulo: `${turno.cliente_nombre} · ${telefonoVisible(turno.cliente_telefono)} · ${horaAR(turno.inicio)}–${horaAR(turno.fin)}`,
      };
    }

    if (libres.has(`${canchaId}|${hora}`)) {
      return { estado: 'libre', texto: 'Libre', titulo: `Libre a las ${hora}` };
    }

    // Mismo criterio que disponibilidad(), que solo devuelve franjas con
    // inicio > now(): una vez empezada, la franja ya no se puede vender.
    if (ini <= ahora) {
      return { estado: 'pasado', texto: '—', titulo: 'Ya pasó' };
    }

    // Ni ocupada, ni libre, ni pasada: esta cancha no abre a esta hora. Pasa
    // cuando las canchas tienen horarios distintos entre sí.
    return {
      estado: 'nodisp',
      texto: '·',
      titulo: 'Fuera del horario de esta cancha',
    };
  };

  const ingresos = turnos.reduce(
    (acc, t) => acc + Number(t.canchas?.precio_hora ?? 0),
    0
  );
  const total = canchas.length * horas.length;
  const ocupacion = total ? Math.round((turnos.length / total) * 100) : 0;

  return (
    <main className="layout">
      <header className="cabecera">
        <div>
          <h1>CoderCup Champions</h1>
          <p>Panel del complejo · turnos tomados por el agente</p>
        </div>
        <EnVivo />
      </header>

      <ResumenDia
        turnos={turnos.length}
        ingresos={ingresos}
        libres={disponibilidad.length}
        ocupacion={ocupacion}
      />

      <SelectorDia
        fecha={fecha}
        hoy={hoy}
        manana={sumarDias(hoy, 1)}
        anterior={sumarDias(fecha, -1)}
        siguiente={siguiente}
        etiqueta={fechaLarga(fecha)}
      />

      <GrillaOcupacion canchas={canchas} horas={horas} celda={celda} />

      <ListaTurnos turnos={turnos} horaAR={horaAR} />

      <ActividadAgente
        items={actividad}
        diaCorto={diaCorto}
        horaAR={horaAR}
        hace={hace}
      />

      <p className="pie">
        Los turnos los toma un agente de IA por chat. Este panel es de solo
        lectura. Probalo con el botón de abajo a la derecha.
      </p>

      <ChatWidget />
    </main>
  );
}
