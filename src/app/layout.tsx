import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mundo Mapping Marketplace",
  description: "Marketplace de afiliados da Mundo Mapping para empresas e influenciadores."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
