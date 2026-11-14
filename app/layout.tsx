import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaInstall from "./components/PwaInstall";

export const metadata: Metadata = {
  title: "Ay Zek — Yapay Zekâ Asistanı",
  description: "Ay Zek ile sohbet et, sorularına yanıt bul ve fikirlerini geliştir.",
  applicationName: "Ay Zek",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ay Zek",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d13",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        {children}
        <PwaInstall />
      </body>
    </html>
  );
}
