import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  // A propriedade 'skipWaiting' foi movida para dentro de 'workboxOptions'
  workboxOptions: {
    skipWaiting: true,
  },
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
