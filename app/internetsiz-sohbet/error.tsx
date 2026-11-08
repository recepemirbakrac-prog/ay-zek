"use client";

import { useEffect } from "react";

export default function ChatError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Ay Zek sohbet sayfası yakalanan hata:", error);
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#171522", color: "#fff", fontFamily: "system-ui" }}>
      <section style={{ width: "min(480px, 100%)", padding: 28, borderRadius: 20, background: "#242033", border: "1px solid #ffffff22" }}>
        <h1 style={{ marginTop: 0 }}>Ay Zek sohbet açılamadı</h1>
        <p style={{ color: "#c9c2d8", lineHeight: 1.6 }}>Sayfa beklenmeyen bir hatayla karşılaştı. Tekrar deneyebilir veya sohbet verilerini silmeden sayfayı yenileyebilirsin.</p>
        <button onClick={() => reset()} style={{ padding: "12px 18px", border: 0, borderRadius: 10, background: "#9865e9", color: "white", fontWeight: 700, cursor: "pointer" }}>Yeniden dene</button>
        <button onClick={() => window.location.reload()} style={{ marginLeft: 10, padding: "12px 18px", border: "1px solid #ffffff33", borderRadius: 10, background: "transparent", color: "white", cursor: "pointer" }}>Sayfayı yenile</button>
        {error?.digest && <p style={{ color: "#a9a1b8", fontSize: 12 }}>Hata kodu: {error.digest}</p>}
      </section>
    </main>
  );
}
