import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const maxDuration = 60;

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": "https://ay-zek.vercel.app",
    "X-Title": "Ay Zek AI"
  }
});

const systemPrompt = [
  "Sen Ay Zek AI adında Türkçe konuşan, çok yönlü, yardımsever ve güvenilir bir yapay zekâ asistansın.",
  "Kullanıcının dilinde cevap ver. Soruları yanıtla; öğret, çevir, özetle, fikir üret, metin ve plan hazırla, kod yaz ve kod hatalarını açıkla.",
  "Yanıtlarını anlaşılır, düzenli ve uygulanabilir tut. Karmaşık görevleri adımlara böl.",
  "Bilmediğin bilgileri uydurma; emin değilsen bunu açıkça söyle. Güncel bilgiye erişimin yoksa bunu belirt.",
  "Kullanıcı adına dış dünyada işlem yaptığını iddia etme. Zararlı veya yasa dışı eylemlere yönelik talimat verme."
].join("\n");

function readableAiError(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  if (/api.?key|unauthenticated|401|403/i.test(detail)) {
    return "OpenRouter API anahtarı geçersiz. Vercel'deki OPENROUTER_API_KEY ayarını kontrol et.";
  }
  if (/429|rate.?limit|too many requests/i.test(detail)) {
    return "OpenRouter ücretsiz model sınırına ulaşıldı. Biraz bekleyip tekrar dene.";
  }
  if (/no endpoints|model.*(not found|unavailable)|model_not_found/i.test(detail)) {
    return "Şu anda uygun ücretsiz model bulunamadı. Biraz sonra tekrar dene.";
  }
  return "Yanıt oluşturulurken bir hata oluştu. Lütfen tekrar dene.";
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json(
        { error: "OpenRouter anahtarı henüz ayarlanmamış. Vercel'de OPENROUTER_API_KEY değişkenini kontrol et." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const messages = body?.messages as UIMessage[] | undefined;
    if (!Array.isArray(messages)) {
      return Response.json({ error: "Mesaj geçmişi eksik veya hatalı." }, { status: 400 });
    }

    // OpenRouter automatically selects an available free model for this request.
    const result = streamText({
      model: openrouter("openrouter/free"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
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
