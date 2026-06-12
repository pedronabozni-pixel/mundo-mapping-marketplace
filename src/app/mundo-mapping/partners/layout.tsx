import type { Metadata } from "next";
import { Inter, DM_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mapping Partners: a melhor rede de creators do Brasil",
  description:
    "Plataforma de afiliados que conecta empresas a +16.000 creators validados. Performance, curadoria humana e wallet financeira automática.",
  keywords: [
    "afiliados", "creators", "influenciadores", "marketing de performance",
    "mapping partners", "mundo mapping", "marketplace de afiliados",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://mundo-mapping-marketplace-production.up.railway.app/mundo-mapping/partners",
    title: "Mapping Partners: a melhor rede de creators do Brasil",
    description:
      "+16.000 creators validados. 80+ nichos. 1.950 cidades. A plataforma de afiliados de performance da Mundo Mapping.",
    siteName: "Mapping Partners",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mapping Partners: a melhor rede de creators do Brasil",
    description:
      "+16.000 creators validados. Performance, curadoria humana e wallet financeira automática.",
  },
  robots: { index: true, follow: true },
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${dmMono.variable}`}>
      {children}
    </div>
  );
}
