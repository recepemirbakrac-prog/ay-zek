import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Ay Zek — Yapay Zekâ Asistanı",description:"Türkçe yapay zekâ sohbet uygulaması"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body>{children}</body></html>}
