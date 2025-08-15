import type { NextConfig } from "next";
import withPWA from "next-pwa";

// A configuração base do Next.js. Atualmente, não temos opções customizadas.
const nextConfig: NextConfig = {};

// Envolve a configuração do Next.js com as configurações do PWA
// utilizando a sintaxe de função de ordem superior (higher-order function)
export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
