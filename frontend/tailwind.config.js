/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#050811", // deepest background
          900: "#0A0F1C", // main bg
          800: "#0F1626", // card bg
          700: "#1A2332", // elevated card
          600: "#242F3F", // borders
          500: "#3A4759", // muted border
          400: "#8B9CB3", // muted text
          300: "#CBD5E1", // secondary text
          200: "#E2E8F0", // primary text
          100: "#F8FAFC", // bright text
        },
        emergency: {
          500: "#EF4444", // primary red
          600: "#DC2626",
          700: "#991B1B",
          400: "#F87171",
          300: "#FCA5A5",
        },
        cyan: {
          400: "#22D3EE", // tech accents
          500: "#06B6D4",
          600: "#0891B2",
        },
        success: {
          500: "#10B981",
          400: "#34D399",
        },
        warning: {
          500: "#F59E0B",
          400: "#FBBF24",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
