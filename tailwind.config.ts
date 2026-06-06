import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#101014",
        panel: "#18181b",
        panelSoft: "#1f1f23",
        border: "#2a2a30",
        text: "#f1f1f2",
        muted: "#a6a6ab",
        brand: "#c8a35a",
        danger: "#f87171"
      },
      fontFamily: {
        // serif aponta para Inter (sans) — a identidade voltou a ser 100% Inter
        serif: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
