import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hoteles Boutique",
  description: "Experiencias exclusivas y personalizadas",
};

import "../globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}