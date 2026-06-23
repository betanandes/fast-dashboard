/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf2f2",
          100: "#fde8e8",
          200: "#fbd5d5",
          300: "#f8b4b4",
          400: "#f28080",
          500: "#e84444",
          600: "#C41E23",
          700: "#a01a1e",
          800: "#8B0000",
          900: "#5c0000",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
