import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Habilita a estratégia de tema por classe
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "scanpro-teal": {
          DEFAULT: "#008F95",
          dark: "#006E71",
        },
      },
    },
  },
  plugins: [],
};
export default config;
