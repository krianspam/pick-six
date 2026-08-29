import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101817",
        cream: "#f4f5ef",
        lime: "#d9ff57",
        forest: "#0b352d",
        coral: "#ff6f59"
      },
      fontFamily: { sans: ["Manrope", "Avenir Next", "Avenir", "sans-serif"], display: ["Syne", "Arial Black", "Avenir Next", "sans-serif"] },
      boxShadow: { card: "0 24px 80px rgba(4, 25, 21, .10)" }
    }
  },
  plugins: []
} satisfies Config;
