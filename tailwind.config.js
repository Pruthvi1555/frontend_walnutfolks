/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "Avenir", "Helvetica", "Arial", "sans-serif"],
      },
      colors: {
        sky: {
          50: "#E6F4FA",
          100: "#CCE9F6",
          200: "#99D4ED",
          300: "#66BFE4",
          400: "#33A9DA",
          500: "#0094D1",
          600: "#0077A7",
          700: "#005A7D",
          800: "#003D54",
          900: "#001F2A"
        }
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0,0,0,0.06)",
        md: "0 4px 12px rgba(0,0,0,0.1)"
      }
    }
  },
  plugins: []
};