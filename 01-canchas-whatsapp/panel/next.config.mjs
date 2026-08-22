/**
 * Cabeceras de seguridad.
 *
 * No hay CSP a propósito: la burbuja de chat carga desde *.app.n8n.cloud y una
 * política mal calibrada la rompe en silencio. Estas tres son seguras para un
 * panel de solo lectura y no tienen efectos secundarios.
 */
const cabeceras = [
  // El panel no se embebe en ningún lado: nadie deberia poder iframearlo.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Evita que el navegador adivine el tipo de contenido.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // No filtrar la URL completa (que lleva ?fecha=) a sitios externos.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // El panel no usa camara, microfono ni ubicacion.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  poweredByHeader: false, // no anunciar que corre Next
  async headers() {
    return [{ source: '/:path*', headers: cabeceras }];
  },
};

export default nextConfig;
