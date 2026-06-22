import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hoteles Boutique",
  description: "Experiencias exclusivas y personalizadas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}