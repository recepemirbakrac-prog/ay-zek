import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) return NextResponse.json({ error: "Nasıl bir uygulama istediğini yaz." }, { status: 400 });
    if (prompt.length > 6000) return NextResponse.json({ error: "İstek en fazla 6.000 karakter olabilir." }, { status: 413 });

    const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    const model = process.env.AI_GATEWAY_MODEL || "deepseek/deepseek-v4.1-flash";
    if (!token) return NextResponse.json({ error: "AI bağlantısı yapılandırılmamış. Vercel AI Gateway ayarlarını kontrol et." }, { status: 503 });

    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_tokens: 7000,
        messages: [
          {
            role: "system",
            content: [
              "You are Ay zek Studio, an expert product designer and frontend engineer.",
              "Generate a complete, polished, responsive, single-file web application from the user's request.",
              "Return ONLY a complete HTML document. No markdown fences, no explanation.",
              "Put all CSS in a style tag and all JavaScript in a script tag. Use semantic HTML and accessible labels.",
              "Use a refined visual design, realistic Turkish sample content when appropriate, responsive layouts, and working interactions.",
              "Do not load external scripts, fonts, images, or libraries. Do not make network requests. Use CSS shapes, gradients, and inline SVG for visuals.",
              "The app will be rendered in a sandboxed iframe. Do not attempt to access the parent window, cookies, storage, or browser APIs outside the iframe.",
              "Keep the code self-contained and under 35,000 characters."
            ].join("\n")
          },
          { role: "user", content: prompt }
        ]
      })
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Builder AI Gateway error", response.status, detail.slice(0, 400));
      if (response.status === 403) {
        return NextResponse.json({ error: "Vercel AI Gateway kullanımı için hesabına geçerli bir ödeme yöntemi eklemen gerekiyor. Vercel Dashboard > AI Gateway > Billing bölümünü kontrol et." }, { status: 503 });
      }
      return NextResponse.json({ error: "Uygulama oluşturulamadı. AI Gateway bağlantısını kontrol edip tekrar dene." }, { status: 502 });
    }
    const data = await response.json();
    let html = data.choices?.[0]?.message?.content;
    if (typeof html !== "string") return NextResponse.json({ error: "AI geçerli bir uygulama yanıtı döndürmedi." }, { status: 502 });
    html = html.trim().replace(/^\`\`\`(?:html)?\s*/i, "").replace(/\s*\`\`\`$/, "");
    if (!/^<!doctype html|^<html[\s>]/i.test(html)) {
      return NextResponse.json({ error: "Oluşturulan çıktı HTML belgesi değil. İsteğini biraz daha açık yazarak tekrar dene." }, { status: 502 });
    }
    if (html.length > 40000) html = html.slice(0, 40000);
    return NextResponse.json({ html });
  } catch (error) {
    console.error("Builder route error", error);
    return NextResponse.json({ error: "İstek işlenirken bir hata oluştu." }, { status: 500 });
  }
}
