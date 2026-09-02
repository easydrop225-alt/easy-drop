/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        // beige/terracotta/ink et surface sont définies via des variables
        // CSS (voir app/globals.css) plutôt qu'en valeurs fixes, pour que
        // le mode sombre puisse changer ces couleurs d'un coup en basculant
        // la classe `.dark` sur <html> — sans toucher un seul composant.
        // Le format `rgb(var(--x) / <alpha-value>)` est requis par
        // Tailwind pour que les modificateurs d'opacité (ex: text-ink-900/60)
        // continuent de fonctionner avec des couleurs basées sur des variables.
        beige: {
          50: "rgb(var(--color-beige-50) / <alpha-value>)",
          100: "rgb(var(--color-beige-100) / <alpha-value>)",
          200: "#E9DECB",
          300: "#DBC9AC",
          400: "#C9AE85",
          500: "#B89566",
          600: "#9C7A4F",
          700: "#7D6140",
          800: "#5F4A32",
          900: "#453626",
        },
        terracotta: {
          50: "rgb(var(--color-terracotta-50) / <alpha-value>)",
          100: "#FBE0D4",
          200: "#F6BEA5",
          300: "#EE9C76",
          400: "rgb(var(--color-terracotta-400) / <alpha-value>)",
          500: "rgb(var(--color-terracotta-500) / <alpha-value>)",
          600: "rgb(var(--color-terracotta-600) / <alpha-value>)",
          700: "#803A26",
          800: "#5E2B1D",
          900: "#3F1D13",
        },
        ink: {
          50: "#F5F5F4",
          100: "#E7E5E4",
          200: "#D6D3D1",
          300: "#A8A29E",
          400: "#78716C",
          500: "#57534E",
          600: "#44403C",
          700: "#292524",
          800: "#1F1B19",
          900: "rgb(var(--color-ink-900) / <alpha-value>)",
        },
        surface: "rgb(var(--color-surface) / <alpha-value>)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
      boxShadow: {
        // Relief des cartes ("Option A" validée avec Yann) : un contact net
        // + une lueur chaude très diffuse teintée terracotta, pour que le
        // relief vienne de l'ombre plutôt que d'une bordure visible.
        card: "0 1px 2px rgb(0 0 0 / 0.06), 0 12px 28px -12px rgb(var(--color-terracotta-500) / 0.3)",
      },
    },
  },
  plugins: [],
};
