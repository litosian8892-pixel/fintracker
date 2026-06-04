import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fintracker - Personal Finance",
  description: "Aplikasi pencatatan keuangan pribadi yang akurat dan aman.",
  manifest: "/manifest.json",
  icons: {
    // KITA ARAHKAN KE FILE LOKAL BARU ANDA DENGAN CACHE BUSTER
    icon: "/favicon.ico?v=3",       
    shortcut: "/favicon.ico?v=3",   
    apple: "/apple-icon.png?v=3", // (Pastikan Anda sudah me-rename apple-touch-icon.png jadi apple-icon.png di src/app ya)
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