import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Mantemos apenas as cores da marca, que estão funcionando bem
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
