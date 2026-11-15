import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const maxDuration = 60;

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": "https://ay-zek-ai.vercel.app",
    "X-Title": "Ay Zek AI"
  }
});

const systemPrompt = [
  "Sen Ay Zek AI adında Türkçe konuşan, çok yönlü, yardımsever ve güvenilir bir yapay zekâ asistansın.",
  "Kullanıcının dilinde cevap ver. Soruları yanıtla; öğret, çevir, özetle, fikir üret, metin ve plan hazırla, kod yaz ve kod hatalarını açıkla.",
  "Yanıtlarını anlaşılır, düzenli ve uygulanabilir tut. Önce doğrudan cevabı ver; gereksiz uzun girişler yapma. Karmaşık görevleri adımlara böl.",
  "Bilmediğin bilgileri uydurma; emin değilsen bunu açıkça söyle. Güncel bilgiye erişimin yoksa bunu belirt.",
  "Kullanıcı adına dış dünyada işlem yaptığını iddia etme. Zararlı veya yasa dışı eylemlere yönelik talimat verme."
].join("\n");

function readableAiError(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  if (/api.?key|unauthenticated|401|403/i.test(detail)) {
    return "OpenRouter API anahtarı geçersiz. Vercel'deki OPENROUTER_API_KEY ayarını kontrol et.";
  }
  if (/429|rate.?limit|too many requests/i.test(detail)) {
    return "Ücretsiz model şu anda yoğun. Biraz bekleyip tekrar dene.";
  }
  if (/no endpoints|model.*(not found|unavailable)|model_not_found/i.test(detail)) {
    return "Hızlı ücretsiz model şu anda kullanılamıyor. Biraz sonra tekrar dene.";
  }
  return "Yanıt oluşturulurken bir hata oluştu. Lütfen tekrar dene.";
}

// Lightweight per-instance protection against rapid repeated requests.
// Vercel's paid IP-keyed WAF rate limiting is not enabled on this project plan.
const requestWindows = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = requestWindows.get(ip);
  if (!current || current.resetAt <= now) {
    requestWindows.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(req: Request) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = (forwardedFor?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();

    if (isRateLimited(clientIp)) {
      return Response.json(
        { error: "Çok fazla istek gönderdin. Lütfen bir dakika bekleyip tekrar dene." },
        { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } }
      );
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 64 * 1024) {
      return Response.json({ error: "Mesaj çok büyük. Daha kısa bir mesaj gönder." }, { status: 413 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json(
        { error: "OpenRouter anahtarı henüz ayarlanmamış. Vercel'de OPENROUTER_API_KEY değişkenini kontrol et." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const messages = body?.messages as UIMessage[] | undefined;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100) {
      return Response.json({ error: "Mesaj geçmişi eksik veya hatalı." }, { status: 400 });
    }

    const textLength = messages.reduce((total, message) => {
      if (!Array.isArray(message.parts)) return total;
      return total + message.parts.reduce((sum, part) => {
        return sum + (part.type === "text" && typeof part.text === "string" ? part.text.length : 0);
      }, 0);
    }, 0);

    if (textLength > 12_000) {
      return Response.json({ error: "Sohbet metni çok uzun. Lütfen daha kısa bir mesaj gönder." }, { status: 413 });
    }

    // Use only the latest turns to keep prompts small and response times low.
    const recentMessages = messages.slice(-12);
    const result = streamText({
      model: openrouter("baidu/ernie-5.5-flash-preview:free"),
      system: systemPrompt,
      messages: await convertToModelMessages(recentMessages),
      maxOutputTokens: 900,
      onError({ error }) {
        console.error("Ay Zek OpenRouter stream error:", error);
      }
    });

    return result.toUIMessageStreamResponse({
      onError(error) {
        console.error("Ay Zek OpenRouter response stream error:", error);
        return readableAiError(error);
      }
    });
  } catch (error) {
    console.error("Ay Zek chat API error:", error);
    return Response.json({ error: readableAiError(error) }, { status: 500 });
  }
}
