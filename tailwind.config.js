/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F8FAFC",
        ink: {
          DEFAULT: "#0F172A",
          soft: "#1E293B",
          mid: "#334155",
          muted: "#64748B",
        },
        line: "rgba(226,232,240,0.6)",
        primary: {
          DEFAULT: "#6C63D9",
          dark: "#5A51C4",
          soft: "#EEF0FF",
          text: "#3F3B8F",
        },
        success: "#159A8C",
        warning: "#C98918",
        error: "#D94C50",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
      maxWidth: {
        form: "42rem",
      },
    },
  },
  plugins: [],
};
