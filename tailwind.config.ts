import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette Easy Drop — voir 04_DESIGN_SYSTEM.md
        beige: {
          50: "#FAF7F2",
          100: "#F3ECE1",
          200: "#E8DCC8",
        },
        terracotta: {
          400: "#D97757",
          500: "#C25E3F",
          600: "#A64B31",
        },
        ink: {
          900: "#1A1816",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
