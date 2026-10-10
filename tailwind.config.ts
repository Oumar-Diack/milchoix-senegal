import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mil: {
          50: "#fdf8ec",
          100: "#f9edc9",
          200: "#f2d98e",
          300: "#eac254",
          400: "#e4ac2e",
          500: "#d4911f",
          600: "#b76e18",
          700: "#924f17",
          800: "#793f19",
          900: "#663518",
          950: "#3b1b0a",
        },
        leaf: {
          50: "#f0f9f0",
          100: "#dcf0dc",
          200: "#bbe1bb",
          300: "#8ccb8d",
          400: "#5aac5b",
          500: "#389139",
          600: "#287529",
          700: "#215c23",
          800: "#1d4a1f",
          900: "#183d1a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
