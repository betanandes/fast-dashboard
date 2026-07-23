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
        // Tons de slate — mais elegantes que gray puro
        surface: {
          DEFAULT: "#ffffff",
          2: "#f8fafc",
          3: "#f1f5f9",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      // Transições padrão mais suaves
      transitionDuration: {
        DEFAULT: "200ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease",
      },
      // Bordas arredondadas consistentes
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      // Sombras refinadas
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)",
        "card-hover": "0 4px 16px rgba(15,23,42,0.10)",
        focus: "0 0 0 3px rgba(196, 30, 35, 0.35)",
      },
      // Animações
      animation: {
        "fade-in": "fadeIn 200ms ease forwards",
        "slide-up": "slideUp 200ms ease forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
