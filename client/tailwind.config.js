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
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
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
        xl: "1.5rem",
        '2xl': "1.75rem",
        '3xl': "2rem",
        '4xl': "2.5rem"
      },
      fontFamily: {
        sans: ["Montserrat", ...fontFamily.sans]
      },
      fontSize: {
        'xs-mobile': ['0.6875rem', { lineHeight: '1rem' }],
        'sm-mobile': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base-mobile': ['0.9375rem', { lineHeight: '1.5rem' }],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
