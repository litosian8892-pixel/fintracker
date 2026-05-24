import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Baris swcMinify sudah kita hapus karena Next.js 16 sudah otomatis melakukannya
  disable: process.env.NODE_ENV === "development", // PWA hanya aktif di Production (Vercel)
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {}, // Mencegah error Turbopack Next.js 16
};

export default withPWA(nextConfig);