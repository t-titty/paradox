/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        bone: "#FFFFFF",
        blood: "#FF2D20",
        gold: "#FFD700",
        ash: "#1A1A1A",
        smoke: "#2A2A2A",
        muted: "#999999",
      },
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.6" }],
        sm: ["1rem", { lineHeight: "1.7" }],
        base: ["1.125rem", { lineHeight: "1.7" }],
      },
      fontFamily: {
        mono: [
          "IBM Plex Mono",
          "JetBrains Mono",
          "Courier New",
          "ui-monospace",
          "monospace",
        ],
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      letterSpacing: {
        brutal: "-0.03em",
      },
    },
  },
  plugins: [],
};
