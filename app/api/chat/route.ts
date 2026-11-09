import { streamText, convertToModelMessages, type UIMessage } from "ai";

export const maxDuration = 60;

const systemPrompt = [
  "Sen Ay Zek AI adında Türkçe konuşan, çok yönlü, yardımsever ve güvenilir bir yapay zekâ asistansın.",
  "Kullanıcının dilinde cevap ver. Soruları yanıtla; öğret, çevir, özetle, fikir üret, metin ve plan hazırla, kod yaz ve kod hatalarını açıkla.",
  "Yanıtlarını anlaşılır, düzenli ve uygulanabilir tut. Karmaşık görevleri adımlara böl.",
  "Bilmediğin bilgileri uydurma; emin değilsen bunu açıkça söyle. Güncel bilgiye erişimin yoksa bunu belirt.",
  "Kullanıcı adına dış dünyada işlem yaptığını iddia etme. Zararlı veya yasa dışı eylemlere yönelik talimat verme."
].join("\n");

function readableAiError(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  if (/customer_verification_required|valid credit card on file/i.test(detail)) {
    return "Vercel AI Gateway, ücretsiz kullanım kredilerini açmak için hesapta geçerli bir ödeme kartı doğrulaması istiyor. Kart eklemeden bu sağlayıcı üzerinden yapay zekâ yanıtı verilemiyor. Vercel AI Gateway ayarlarını aç: https://vercel.com/d?to=%2F%5Bteam%5D%2F~%2Fai%3Fmodal%3Dadd-credit-card";
  }
  if (/429|rate.?limit|too many requests/i.test(detail)) return "Yapay zekâ kullanım sınırına ulaşıldı. Biraz bekleyip tekrar dene.";
  if (/credit|budget|payment|billing/i.test(detail)) return "AI Gateway kullanım bakiyesi veya bütçesi yetersiz. Vercel AI Gateway kullanım ve bütçe ayarlarını kontrol et.";
  if (/api.?key|unauthenticated|permission|401|403/i.test(detail)) return "AI Gateway kimlik doğrulaması başarısız. Vercel projesinin AI Gateway bağlantısını kontrol et.";
  return "Yanıt oluşturulurken bir hata oluştu. Lütfen tekrar dene.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body?.messages as UIMessage[] | undefined;
    if (!Array.isArray(messages)) return Response.json({ error: "Mesaj geçmişi eksik veya hatalı." }, { status: 400 });

    const model = process.env.AI_GATEWAY_MODEL || "deepseek/deepseek-v4.1-flash";
    const result = streamText({
      model,
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      onError({ error }) { console.error("Ay Zek AI Gateway stream error:", error); }
    });

    return result.toUIMessageStreamResponse({
      onError(error) {
        console.error("Ay Zek AI Gateway response stream error:", error);
        return readableAiError(error);
      }
    });
  } catch (error) {
    console.error("Ay Zek chat API error:", error);
    return Response.json({ error: readableAiError(error) }, { status: 500 });
  }
}
