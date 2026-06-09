import type { MetadataRoute } from "next";

// PWA manifest — servido em /manifest.webmanifest. Ícones reais do Mapping Partners.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mapping Partners",
    short_name: "Mapping Partners",
    description: "Marketplace de afiliados da Mundo Mapping para empresas e influenciadores.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/brand/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
