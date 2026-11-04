import { gateway } from "@ai-sdk/gateway";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
export const maxDuration = 30;
export async function POST(req: Request) {
  const { messages } = await req.json() as { messages: UIMessage[] };
  if (!Array.isArray(messages)) return Response.json({ error: "Mesajlar eksik." }, { status: 400 });
  const model = process.env.AI_GATEWAY_MODEL || "deepseek/deepseek-v4.1-flash";
  const result = streamText({
    model: gateway(model),
    system: "Sen Ay Zek adında Türkçe konuşan, yardımsever ve güvenilir bir yapay zekâ asistanısın. Kullanıcının dilinde cevap ver. Bilmediğin bilgileri uydurma.",
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
