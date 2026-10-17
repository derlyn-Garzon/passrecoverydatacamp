import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zero-Knowledge Vault 🛡️ | Modo Centinela',
  description: 'Gestor de contraseñas ultra seguro Zero-Knowledge con cifrado en cliente.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-nordic-bg text-nordic-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
