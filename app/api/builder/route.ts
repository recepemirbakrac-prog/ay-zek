import { NextResponse } from "next/server";
import { generateText } from "ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const systemPrompt = [
  "You are Ay Zek Studio, an expert product designer and frontend engineer.",
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

    const model = process.env.AI_GATEWAY_MODEL || "deepseek/deepseek-v4.1-flash";
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt,
      temperature: 0.25
    });

    let html = result.text.trim().replace(/^\x60{3}(?:html)?\s*/i, "").replace(/\s*\x60{3}$/, "");
    if (!html) return NextResponse.json({ error: "Yapay zekâ boş yanıt döndürdü. Tekrar dene." }, { status: 502 });
    if (!/^<!doctype html|^<html[\s>]/i.test(html)) return NextResponse.json({ error: "Oluşturulan çıktı HTML belgesi değil. İsteğini biraz daha açık yazarak tekrar dene." }, { status: 502 });
    if (html.length > 40000) html = html.slice(0, 40000);
    return NextResponse.json({ html });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Ay Zek Studio AI Gateway error:", detail);
    if (/429|rate.?limit/i.test(detail)) return NextResponse.json({ error: "Yapay zekâ kullanım sınırına ulaşıldı. Biraz bekleyip tekrar dene." }, { status: 429 });
    if (/credit|budget|payment|billing/i.test(detail)) return NextResponse.json({ error: "AI Gateway kullanım bakiyesi veya bütçesi yetersiz." }, { status: 402 });
    return NextResponse.json({ error: "Uygulama oluşturulamadı. AI Gateway ayarlarını kontrol edip tekrar dene." }, { status: 502 });
  }
}
