'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const INTERVALO_MS = 10000;

/**
 * Mantiene el panel al día sin recargar la página.
 *
 * `router.refresh()` le pide a Next que vuelva a renderizar los server
 * components y mande el resultado; React reconcilia solo lo que cambió. No hay
 * parpadeo, no se pierde el scroll, y —lo importante— la service_role key
 * nunca sale del servidor: acá no se toca Supabase.
 */
/** "recién", "hace 8s", "hace 3 min" — evita el absurdo "hace 305s". */
function etiqueta(seg) {
  if (seg < 2) return 'Actualizado recién';
  if (seg < 60) return `Actualizado hace ${seg}s`;
  const min = Math.floor(seg / 60);
  return `Actualizado hace ${min} min`;
}

export default function EnVivo() {
  const router = useRouter();
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const refrescar = () => {
      // Sin esto seguiría pidiendo datos con la pestaña en segundo plano.
      if (document.visibilityState !== 'visible') return;
      router.refresh();
      setSegundos(0);
    };

    const poll = setInterval(refrescar, INTERVALO_MS);
    const reloj = setInterval(() => setSegundos((s) => s + 1), 1000);

    // Volver a la pestaña después de reservar por WhatsApp actualiza al instante.
    document.addEventListener('visibilitychange', refrescar);
    window.addEventListener('focus', refrescar);

    return () => {
      clearInterval(poll);
      clearInterval(reloj);
      document.removeEventListener('visibilitychange', refrescar);
      window.removeEventListener('focus', refrescar);
    };
  }, [router]);

  // aria-live NO va acá: el texto cambia cada segundo y un lector de pantalla
  // lo anunciaría sin parar. El dato es ambiental, no una notificación.
  return (
    <span className="vivo" role="status" aria-label="El panel se actualiza solo">
      <span className="punto punto-vivo" aria-hidden="true" />
      <span aria-hidden="true">{etiqueta(segundos)}</span>
    </span>
  );
}
