import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // PWA hanya aktif di Production (Vercel)
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SOLUSI ERROR VERCEL: Memberitahu Next.js 16 agar tidak bentrok dengan Webpack dari PWA
  turbopack: {},
};

export default withPWA(nextConfig);