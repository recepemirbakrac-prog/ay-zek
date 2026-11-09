import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createGroq } from "@ai-sdk/groq";

export const maxDuration = 60;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

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
    return "Groq API anahtarı eksik veya geçersiz. Vercel projesinde GROQ_API_KEY ayarını kontrol et.";
  }
  if (/429|rate.?limit|too many requests/i.test(detail)) {
    return "Groq ücretsiz kullanım sınırına ulaşıldı. Biraz bekleyip tekrar dene.";
  }
  if (/model.*(not found|decommissioned)|model_not_found/i.test(detail)) {
    return "Seçilen Groq modeli şu anda kullanılamıyor. GROQ_MODEL ayarını kontrol et.";
  }
  return "Yanıt oluşturulurken bir hata oluştu. Lütfen tekrar dene.";
}

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        { error: "Ücretsiz Groq bağlantısı henüz etkinleştirilmedi. Groq API anahtarını Vercel'e eklemek gerekiyor." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const messages = body?.messages as UIMessage[] | undefined;
    if (!Array.isArray(messages)) {
      return Response.json({ error: "Mesaj geçmişi eksik veya hatalı." }, { status: 400 });
    }

    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const result = streamText({
      model: groq(model),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      onError({ error }) {
        console.error("Ay Zek Groq stream error:", error);
      }
    });

    return result.toUIMessageStreamResponse({
      onError(error) {
        console.error("Ay Zek Groq response stream error:", error);
        return readableAiError(error);
      }
    });
  } catch (error) {
    console.error("Ay Zek chat API error:", error);
    return Response.json({ error: readableAiError(error) }, { status: 500 });
  }
}
