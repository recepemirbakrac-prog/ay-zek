import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ay zek — İşletmen için akıllı asistan",
  description: "İşletmeni tek bir akıllı çalışma alanından yönet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
