'use client';

import { useEffect } from 'react';
import '@n8n/chat/style.css';

/**
 * Burbuja de chat flotante, conectada al mismo agente de n8n.
 *
 * Va flotando y no en una pestaña a propósito: el momento fuerte de la demo es
 * reservar por el chat y ver la celda de la grilla darse vuelta **sin cerrar
 * nada**. Una pestaña taparía el panel justo cuando pasa lo interesante.
 *
 * La URL del webhook es pública por diseño (cualquiera que use el chat la ve),
 * por eso sí lleva el prefijo NEXT_PUBLIC_. Es lo contrario de la key de
 * Supabase, que nunca sale del servidor.
 */
export default function ChatWidget() {
  const url = process.env.NEXT_PUBLIC_N8N_CHAT_URL;

  useEffect(() => {
    if (!url) return;

    let cancelado = false;

    // Import dinámico: el paquete toca window al cargarse, así que no puede
    // evaluarse durante el render del servidor.
    import('@n8n/chat').then(({ createChat }) => {
      // El flag no alcanza: con Strict Mode el efecto corre dos veces y, si el
      // módulo ya está en caché, este .then() puede resolver antes del cleanup
      // de la primera pasada. Chequear el DOM es lo único determinista.
      if (cancelado || document.querySelector('#n8n-chat')) return;
      createChat({
        webhookUrl: url,
        mode: 'window',
        showWelcomeScreen: false,
        initialMessages: [
          '¡Hola! Soy el asistente de CoderCup Champions ⚽',
          'Decime qué día y a qué hora buscás cancha y te digo qué tenemos libre.',
        ],
        i18n: {
          en: {
            title: 'CoderCup Champions',
            subtitle: 'Reservá tu cancha por chat',
            inputPlaceholder: 'Escribí tu mensaje…',
            getStarted: 'Nueva conversación',
            footer: '',
            closeButtonTooltip: 'Cerrar',
          },
        },
      });
    });

    return () => {
      cancelado = true;
    };
  }, [url]);

  // El widget se monta solo en el <body>; este componente no renderiza nada.
  return null;
}
