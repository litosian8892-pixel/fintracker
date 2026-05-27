import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fintracker - Personal Finance",
  description: "Aplikasi pencatatan keuangan pribadi yang akurat dan aman.",
  manifest: "/manifest.json",
  icons: {
    apple: "https://img.icons8.com/color/192/wallet--v1.png", // <--- KHUSUS AGAR LOGO MUNCUL DI IPHONE (iOS)
  }
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}