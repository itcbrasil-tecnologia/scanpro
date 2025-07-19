import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores da marca baseadas na logo
        "scanpro-teal": {
          DEFAULT: "#04787D",
          light: "#2DD4BF",
        },
        "scanpro-maroon": {
          DEFAULT: "#4C0519",
        },
        // Novas cores de fundo personalizadas
        "navbar-gray": "#808080",
        "background-light": "#E0E0E0",
      },
    },
  },
  plugins: [],
};
export default config;
