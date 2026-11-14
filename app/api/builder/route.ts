import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const maxDuration = 60;

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": "https://ay-zek.vercel.app",
    "X-Title": "Ay Zek App Builder"
  }
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json({ error: "Yapay zekâ servisi yapılandırılmamış. Vercel ortam değişkenlerine OPENROUTER_API_KEY eklenmeli." }, { status: 503 });
    }
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt || prompt.length > 5000) {
      return Response.json({ error: "Lütfen 1–5000 karakter arasında bir uygulama açıklaması yaz." }, { status: 400 });
    }

    const result = await generateText({
      model: openrouter("openrouter/free"),
      temperature: 0.4,
      maxOutputTokens: 7000,
      system: [
        "You are Ay Zek, an expert web application builder.",
        "Create a complete, polished, responsive single-file HTML application from the user's description.",
        "Return ONLY valid HTML, starting with <!doctype html>. Include all CSS and JavaScript inline. Do not use external libraries, external scripts, remote assets, markdown fences, or explanations outside the HTML.",
        "Make the interface Turkish unless the user requests another language. Use accessible semantic HTML, responsive layouts, and working interactions.",
        "The output will run inside a sandboxed iframe. Do not attempt to access the parent window, cookies, local files, or external network services.",
        "Never claim that server-side features, payments, authentication, or databases work unless implemented locally as a front-end demo. Clearly label demo-only behavior in the UI."
      ].join("\n"),
      prompt
    });

    let code = result.text.trim().replace(/^\`\`\`(?:html)?\s*/i, "").replace(/\s*\`\`\`$/, "");
    if (!/^<!doctype html|^<html[\s>]/i.test(code)) {
      return Response.json({ error: "Model geçerli HTML üretemedi. İsteğini biraz daha açık yazarak tekrar dene." }, { status: 502 });
    }
    return Response.json({ code, explanation: "İlk sürüm oluşturuldu. İsteğini düzenleyip yeniden oluşturabilirsin." });
  } catch (error) {
    console.error("Ay Zek Builder error:", error);
    const message = error instanceof Error ? error.message : "";
    if (/401|403|api.?key|unauthorized/i.test(message)) return Response.json({ error: "OpenRouter anahtarı geçersiz veya yetkisiz. Vercel'deki OPENROUTER_API_KEY ayarını kontrol et." }, { status: 502 });
    if (/429|rate.?limit/i.test(message)) return Response.json({ error: "Ücretsiz modelin istek sınırına ulaşıldı. Biraz sonra tekrar dene." }, { status: 429 });
    return Response.json({ error: "Uygulama oluşturulurken bir hata oluştu. Lütfen tekrar dene." }, { status: 500 });
  }
}
