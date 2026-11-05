import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

export const maxDuration = 60;

const systemPrompt =
  "Sen Ay Zk adında Türkçe konuşan, yardımsever ve güvenilir bir yapay zekâ asistanısın. Kullanıcının dilinde cevap ver. Açık, anlaşılır ve faydalı yanıtlar ver. Bilmediğin bilgileri uydurma; emin değilsen bunu belirt. Zararlı veya yasa dışı eylemlere yönelik talimat verme.";

function readableAiError(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  if (/429|quota|rate.?limit/i.test(detail)) return "Ücretsiz Gemini kullanım sınırına ulaşıldı. Biraz bekleyip tekrar dene.";
  if (/api.?key|unauthenticated|permission/i.test(detail)) return "Gemini API anahtarı geçersiz. Vercel'deki GEMINI_API_KEY ayarını kontrol et.";
  return "Yanıt oluşturulurken bir hata oluştu. Lütfen tekrar dene.";
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({
        error: "Ücretsiz yapay zekâyı etkinleştirmek için Google AI Studio'dan ücretsiz Gemini API anahtarı alıp Vercel'de GEMINI_API_KEY adıyla ekle. Kart veya ödeme bilgisi gerekmez: https://aistudio.google.com/apikey"
      }, { status: 503 });
    }

    const body = await req.json();
    const messages = body?.messages as UIMessage[] | undefined;
    if (!Array.isArray(messages)) return Response.json({ error: "Mesaj geçmişi eksik veya hatalı." }, { status: 400 });

    const google = createGoogleGenerativeAI({ apiKey });
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      onError({ error }) { console.error("Ay Zk Gemini stream error:", error); }
    });

    return result.toUIMessageStreamResponse({
      onError(error) {
        console.error("Ay Zk Gemini response stream error:", error);
        return readableAiError(error);
      }
    });
  } catch (error) {
    console.error("Ay Zk chat API error:", error);
    return Response.json({ error: readableAiError(error) }, { status: 500 });
  }
}
