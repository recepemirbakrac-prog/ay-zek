import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Seslab — Yapay Zekâ Şarkı Stüdyosu", description: "Fikrini yapay zekâ ile özgün şarkı sözlerine dönüştür. Müzik fikirlerini Seslab'de tasarla." };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body>{children}</body></html>}
