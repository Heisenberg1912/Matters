import { fontFamily } from "tailwindcss/defaultTheme";

/******************************
 * Tailwind Config (shadcn)
 ******************************/
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#010101",
        foreground: "#f4f4f4",
        card: "#101010",
        border: "#1c1c1c",
        muted: "#a2a2a2",
        pill: "#cfe0ad"
      },
      borderRadius: {
        xl: "1.5rem"
      },
      fontFamily: {
        sans: ["Montserrat", ...fontFamily.sans]
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
