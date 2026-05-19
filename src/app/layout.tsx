import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";

export const metadata: Metadata = {
  title: "Mundo Mapping Marketplace",
  description: "Marketplace de afiliados da Mundo Mapping para empresas e influenciadores."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
