import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { KitchenProvider } from "@/components/kitchen/kitchen-provider";

export const metadata: Metadata = {
  title: "Geladeira Viva",
  description: "Assistente culinário inteligente para descobrir o que cozinhar com os ingredientes que você já tem em casa."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider>
          <KitchenProvider>{children}</KitchenProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
