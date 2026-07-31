/** @type {import('tailwindcss').Config} */
module.exports = {
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
        beige: {
          50: "#FAF7F2",
          100: "#F3ECE1",
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
          50: "#FDF1EC",
          100: "#FBE0D4",
          200: "#F6BEA5",
          300: "#EE9C76",
          400: "#DD7A50",
          500: "#C25E3F",
          600: "#A24A30",
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
          900: "#1A1816",
        },
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};
