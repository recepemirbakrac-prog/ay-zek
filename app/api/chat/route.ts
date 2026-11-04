import {gateway} from "@ai-sdk/gateway";
import {streamText,convertToModelMessages,type UIMessage} from "ai";
export const maxDuration=30;
export async function POST(req:Request){const {messages}:{messages:UIMessage[]}=await req.json();const result=streamText({model:gateway("openai/gpt-4.1-mini"),system:"Sen Ay Zek adında, Türkçe konuşan, yardımsever ve güvenilir bir yapay zekâ asistanısın. Kullanıcının dilinde yanıt ver; bilmediğin bilgileri uydurma.",messages:await convertToModelMessages(messages)});return result.toUIMessageStreamResponse()}
