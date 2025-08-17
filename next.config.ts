import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    // ADICIONADO AQUI: Instrui o Service Worker principal a importar e executar nosso script customizado.
    importScripts: ["/sw-sync.js"],
  },
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
