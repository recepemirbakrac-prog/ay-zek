export const metadata = { title: "Reklam Merkezi", robots: { index: false, follow: false } };

export default function RootLayout({ children }) {
  return <html lang="tr"><body>{children}</body></html>;
}
