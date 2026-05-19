import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { AuthSessionProvider } from "./session-provider";
import "./globals.css";

const outfit = Outfit({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Hoteles Boutique",
  description: "Experiencias exclusivas y personalizadas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} scroll-smooth`}>
      <body className="min-h-screen bg-[#fafafa] font-sans text-gray-900 antialiased selection:bg-gray-900 selection:text-white">
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}