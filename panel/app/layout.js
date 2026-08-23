import './globals.css';

export const metadata = {
  title: 'Panel — CoderCup Champions',
  description: 'Turnos y disponibilidad del complejo, en tiempo real.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
