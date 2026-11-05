import { gateway } from "@ai-sdk/gateway";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

export const maxDuration = 60;

const systemPrompt =
  "Sen Ay Zek adında Türkçe konuşan, yardımsever ve güvenilir bir yapay zekâ asistanısın. Kullanıcının dilinde cevap ver. Açık, anlaşılır ve faydalı yanıtlar ver. Bilmediğin bilgileri uydurma; emin değilsen bunu belirt. Zararlı veya yasa dışı eylemlere yönelik talimat verme.";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body?.messages as UIMessage[] | undefined;

    if (!Array.isArray(messages)) {
      return Response.json({ error: "Mesaj geçmişi eksik veya hatalı." }, { status: 400 });
    }

    // The same model is already used by the working song-generation endpoint.
    // This avoids failures caused by a model slug that may not be enabled on the project.
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
        return "Yanıt oluşturulurken bir hata oluştu. Lütfen tekrar dene.";
      },
    });
  } catch (error) {
    console.error("Ay Zek chat API error:", error);
    return Response.json(
      { error: "Ay Zek şu anda yanıt veremiyor. Lütfen biraz sonra tekrar dene." },
      { status: 500 },
    );
  }
}
