import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Esto silencia el error de Turbopack y permite que la PWA y Webpack convivan sin problemas
  turbopack: {},
};

export default withPWA(nextConfig);