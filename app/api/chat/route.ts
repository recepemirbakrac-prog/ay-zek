import { gateway } from "@ai-sdk/gateway";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

export const maxDuration = 60;

const systemPrompt =
  "Sen Ay Zek adında Türkçe konuşan, yardımsever ve güvenilir bir yapay zekâ asistanısın. Kullanıcının dilinde cevap ver. Açık, anlaşılır ve faydalı yanıtlar ver. Bilmediğin bilgileri uydurma; emin değilsen bunu belirt. Zararlı veya yasa dışı eylemlere yönelik talimat verme.";

function readableAiError(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  if (/customer_verification_required|valid credit card|credit card on file/i.test(detail)) {
    return "Vercel AI Gateway kullanımı için Vercel hesabına geçerli bir ödeme yöntemi eklemelisin. AI Gateway > Billing ayarlarını kontrol et.";
  }
  return "Yanıt oluşturulurken bir hata oluştu. Lütfen tekrar dene.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body?.messages as UIMessage[] | undefined;

    if (!Array.isArray(messages)) {
      return Response.json({ error: "Mesaj geçmişi eksik veya hatalı." }, { status: 400 });
    }

    const result = streamText({
      model: gateway("openai/gpt-4.1-mini"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      onError({ error }) {
        console.error("Ay Zek stream error:", error);
      },
    });

    return result.toUIMessageStreamResponse({
      onError(error) {
        console.error("Ay Zek response stream error:", error);
        return readableAiError(error);
      },
    });
  } catch (error) {
    console.error("Ay Zek chat API error:", error);
    return Response.json(
      { error: readableAiError(error) },
      { status: 500 },
    );
  }
}
