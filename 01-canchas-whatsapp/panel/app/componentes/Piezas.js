import { formatearPrecio, telefonoVisible } from '../../lib/datos';

/* --------------------------------------------------------------------------
   Iconos. SVG inline, no emoji: los emoji cambian de forma según el sistema
   operativo y no se pueden pintar con los tokens de color.
-------------------------------------------------------------------------- */

function IconoWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.12c-.25.69-1.44 1.32-1.99 1.36-.53.04-1.02.23-3.44-.72-2.9-1.14-4.73-4.1-4.87-4.29-.14-.19-1.16-1.55-1.16-2.95 0-1.4.73-2.09.99-2.37.26-.29.57-.36.76-.36h.54c.18 0 .41-.03.64.49.24.57.81 1.97.88 2.11.07.14.12.31.02.5-.09.19-.14.31-.28.47l-.42.49c-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.69-.81.88-1.08.19-.28.37-.23.63-.14.25.09 1.65.78 1.93.92.28.14.47.21.54.33.07.11.07.66-.18 1.35z" />
    </svg>
  );
}

function IconoChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

/** El canal por el que entró el turno. Icono + texto, nunca solo color. */
export function ChipCanal({ telefono }) {
  const esChat = String(telefono ?? '').startsWith('chat-');
  return (
    <span className={esChat ? 'chip chip-web' : 'chip chip-wsp'}>
      {esChat ? <IconoChat /> : <IconoWhatsApp />}
      {esChat ? 'Chat web' : 'WhatsApp'}
    </span>
  );
}

export function ChipDeporte({ deporte }) {
  const esSiete = String(deporte ?? '').includes('7');
  return (
    <span className={esSiete ? 'chip chip-f7' : 'chip chip-f5'}>
      {esSiete ? 'Fútbol 7' : 'Fútbol 5'}
    </span>
  );
}

/* --------------------------------------------------------------------------
   Resumen del día
-------------------------------------------------------------------------- */

export function ResumenDia({ turnos, ingresos, libres, ocupacion }) {
  return (
    <section aria-labelledby="t-resumen">
      <h2 id="t-resumen" className="sr-only" style={{ position: 'absolute', left: '-9999px' }}>
        Resumen del día
      </h2>
      <div className="kpis">
        <div className="kpi">
          <span className="kpi-label">Turnos</span>
          <span className="kpi-valor num">{turnos}</span>
          <span className="kpi-pie">vendidos en el día</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Ingresos</span>
          <span className="kpi-valor num">{formatearPrecio(ingresos)}</span>
          <span className="kpi-pie">turnos confirmados</span>
        </div>
        <div className="kpi kpi-verde">
          <span className="kpi-label">Libres</span>
          <span className="kpi-valor num">{libres}</span>
          <span className="kpi-pie">franjas sin vender</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Ocupación</span>
          <span className="kpi-valor num">{ocupacion}%</span>
          <span className="kpi-pie">del total del día</span>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Selector de día
   Links, no botones con JS: la fecha vive en la URL, así el back del
   navegador funciona solo y la página se puede compartir.
-------------------------------------------------------------------------- */

export function SelectorDia({ fecha, hoy, manana, anterior, siguiente, etiqueta }) {
  const es = (f) => (fecha === f ? 'page' : undefined);
  return (
    <section aria-label="Elegir día">
      <nav className="dias">
        <a className="dia-btn dia-flecha" href={`/?fecha=${anterior}`} aria-label="Día anterior">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </a>
        <a className="dia-btn" href={`/?fecha=${hoy}`} aria-current={es(hoy)}>Hoy</a>
        <a className="dia-btn" href={`/?fecha=${manana}`} aria-current={es(manana)}>Mañana</a>
        <a className="dia-btn dia-flecha" href={`/?fecha=${siguiente}`} aria-label="Día siguiente">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </a>
        <span className="dia-fecha num">{etiqueta}</span>
      </nav>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Grilla de ocupación — el corazón del panel
-------------------------------------------------------------------------- */

export function GrillaOcupacion({ canchas, horas, celda }) {
  return (
    <section aria-labelledby="t-grilla">
      <div className="titulo-seccion">
        <h2 id="t-grilla">Ocupación</h2>
        <span>Cada celda es un turno de 1 hora</span>
      </div>

      <div className="tarjeta grilla-scroll">
        <table className="grilla">
          <caption style={{ position: 'absolute', left: '-9999px' }}>
            Ocupación por cancha y horario. Cada celda indica si el turno está libre u ocupado.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="celda-cancha">Cancha</th>
              {horas.map((h) => (
                <th scope="col" key={h} className="num">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {canchas.map((c) => (
              <tr key={c.id}>
                <th scope="row" className="celda-cancha">
                  <strong>{c.nombre}</strong>
                  <span>{String(c.deporte).includes('7') ? 'Fútbol 7' : 'Fútbol 5'} · {formatearPrecio(c.precio_hora)}</span>
                </th>
                {horas.map((h, i) => {
                  const s = celda(c.id, h, i);
                  return (
                    <td key={h}>
                      <div className={`slot slot-${s.estado}`} title={s.titulo}>
                        {s.texto}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="grilla-hint" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        Deslizá para ver el resto de los horarios
      </p>

      <div className="referencias">
        <span className="ref">
          <span className="ref-muestra ref-libre" />
          Libre
        </span>
        <span className="ref">
          <span className="ref-muestra ref-ocupado" />
          Ocupado — muestra el cliente
        </span>
        <span className="ref">
          <span className="ref-muestra ref-pasado" />
          Ya pasó
        </span>
        <span className="ref">
          <span className="ref-muestra ref-nodisp" />
          Fuera de horario
        </span>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Detalle de turnos del día
-------------------------------------------------------------------------- */

export function ListaTurnos({ turnos, horaAR }) {
  return (
    <section aria-labelledby="t-turnos">
      <div className="titulo-seccion">
        <h2 id="t-turnos">Turnos del día</h2>
        <span>{turnos.length} {turnos.length === 1 ? 'turno' : 'turnos'}</span>
      </div>

      <div className="tarjeta tabla-scroll">
        {turnos.length === 0 ? (
          <p className="vacio">
            <strong>Ningún turno todavía</strong>
            Cuando el agente tome una reserva para este día, aparece acá.
          </p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Horario</th>
                <th scope="col">Cancha</th>
                <th scope="col">Cliente</th>
                <th scope="col">Canal</th>
                <th scope="col" className="der">Precio</th>
              </tr>
            </thead>
            <tbody>
              {turnos.map((t) => (
                <tr key={t.id}>
                  <td className="num">{horaAR(t.inicio)} – {horaAR(t.fin)}</td>
                  <td>
                    {t.canchas?.nombre}{' '}
                    <ChipDeporte deporte={t.canchas?.deporte} />
                  </td>
                  <td>
                    <div className="cliente">{t.cliente_nombre}</div>
                    <div className="tel num">{telefonoVisible(t.cliente_telefono)}</div>
                  </td>
                  <td><ChipCanal telefono={t.cliente_telefono} /></td>
                  <td className="der num">{formatearPrecio(t.canchas?.precio_hora)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Actividad del agente
   No sirve para operar el complejo: sirve para ver que la automatización
   está viva.
-------------------------------------------------------------------------- */

export function ActividadAgente({ items, diaCorto, horaAR, hace }) {
  return (
    <section aria-labelledby="t-actividad">
      <div className="titulo-seccion">
        <h2 id="t-actividad">Actividad del agente</h2>
        <span>Últimas reservas tomadas</span>
      </div>

      <div className="tarjeta">
        {items.length === 0 ? (
          <p className="vacio">
            <strong>Sin actividad</strong>
            El agente todavía no tomó ninguna reserva.
          </p>
        ) : (
          <ul className="actividad">
            {items.map((t) => (
              <li key={t.id}>
                <ChipCanal telefono={t.cliente_telefono} />
                <span className="actividad-texto">
                  <strong>{t.cliente_nombre}</strong> reservó {t.canchas?.nombre} el{' '}
                  <span className="num">{diaCorto(t.inicio)}</span> a las{' '}
                  <span className="num">{horaAR(t.inicio)}</span>
                </span>
                <span className="actividad-cuando">{hace(t.creado_en)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
