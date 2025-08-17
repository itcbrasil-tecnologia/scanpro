import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    importScripts: ["/sw-sync.js"],
    // ADICIONADO AQUI: Desativa uma funcionalidade que pode causar problemas de compilação.
    navigationPreload: false,
  },
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
