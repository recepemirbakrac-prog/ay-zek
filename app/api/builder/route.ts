import { NextResponse } from "next/server";

export const runtime = "nodejs";

const systemPrompt = [
  "You are Ay zek Studio, an expert product designer and frontend engineer.",
  "Generate a complete, polished, responsive, single-file web application from the user's request.",
  "Return ONLY a complete HTML document. No markdown fences, no explanation.",
  "Put all CSS in a style tag and all JavaScript in a script tag. Use semantic HTML and accessible labels.",
  "Use a refined visual design, realistic Turkish sample content when appropriate, responsive layouts, and working interactions.",
  "Do not load external scripts, fonts, images, or libraries. Do not make network requests. Use CSS shapes, gradients, and inline SVG for visuals.",
  "The app will be rendered in a sandboxed iframe. Do not attempt to access the parent window, cookies, storage, or browser APIs outside the iframe.",
  "Keep the code self-contained and under 35,000 characters."
].join("\n");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) return NextResponse.json({ error: "Nasıl bir uygulama istediğini yaz." }, { status: 400 });
    if (prompt.length > 6000) return NextResponse.json({ error: "İstek en fazla 6.000 karakter olabilir." }, { status: 413 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "Ücretsiz yapay zekâyı etkinleştirmek için Google AI Studio'dan ücretsiz Gemini API anahtarı alıp Vercel'de GEMINI_API_KEY adıyla ekle. Kart veya ödeme bilgisi gerekmez: https://aistudio.google.com/apikey"
      }, { status: 503 });
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.25, maxOutputTokens: 8192 }
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Gemini builder error", response.status, detail.slice(0, 500));
      if (response.status === 429) return NextResponse.json({ error: "Ücretsiz Gemini kullanım sınırına ulaşıldı. Biraz bekleyip tekrar dene." }, { status: 429 });
      if (response.status === 400 || response.status === 403) return NextResponse.json({ error: "Gemini API anahtarı geçersiz veya bu model için erişim kapalı. Google AI Studio'daki ücretsiz anahtarını kontrol et." }, { status: 502 });
      return NextResponse.json({ error: "Uygulama oluşturulamadı. Lütfen tekrar dene." }, { status: 502 });
    }

    const data = await response.json();
    let html = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
    if (typeof html !== "string" || !html.trim()) return NextResponse.json({ error: "Gemini geçerli bir uygulama yanıtı döndürmedi." }, { status: 502 });
    html = html.trim().replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/, "");
    if (!/^<!doctype html|^<html[\s>]/i.test(html)) return NextResponse.json({ error: "Oluşturulan çıktı HTML belgesi değil. İsteğini biraz daha açık yazarak tekrar dene." }, { status: 502 });
    if (html.length > 40000) html = html.slice(0, 40000);
    return NextResponse.json({ html });
  } catch (error) {
    console.error("Builder route error", error);
    return NextResponse.json({ error: "İstek işlenirken bir hata oluştu." }, { status: 500 });
  }
}
