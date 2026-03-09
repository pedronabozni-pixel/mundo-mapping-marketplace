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
        serif: ["Cormorant Garamond", "Georgia", "Times New Roman", "serif"],
        sans: ["Montserrat", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
