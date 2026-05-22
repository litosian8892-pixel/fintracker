import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fintracker - Kelola Keuangan Pribadi",
  description: "Aplikasi pencatat keuangan MVP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}