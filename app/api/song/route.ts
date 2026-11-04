import { gateway } from "@ai-sdk/gateway";
import { generateText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { idea, genre, mood, language, voice } = await req.json();
    if (typeof idea !== "string" || !idea.trim()) return Response.json({ error: "Şarkı fikri gerekli." }, { status: 400 });
    const result = await generateText({
      model: gateway("openai/gpt-4.1-mini"),
      system: "Sen profesyonel bir şarkı yazarı ve söz yazarısın. Kullanıcı için özgün, akılda kalıcı, doğal ve şarkı formuna uygun sözler üret. Var olan şarkı sözlerini taklit etme veya telifli şarkılardan alıntı yapma. Yanıtını sadece şu formatta ver: İlk satırda kısa şarkı başlığı, sonraki satırlarda [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Final Chorus] bölümleri. Enstrümantal istenirse söz yazma; atmosfer ve aranjman taslağı ver.",
      prompt: `Fikir: ${idea}\nTür: ${genre}\nDuygu: ${mood}\nDil: ${language}\nVokal: ${voice}\nYaklaşık 2-3 dakikalık bir şarkı için özgün sözler yaz.`,
    });
    const lines = result.text.trim().split("\n");
    const title = (lines.shift() || "Yeni şarkım").replace(/^#+\s*/, "").replace(/^["']|["']$/g, "");
    return Response.json({ title, lyrics: lines.join("\n").trim() });
  } catch (error) {
    console.error("Song generation error:", error);
    return Response.json({ error: "Şarkı sözleri oluşturulamadı." }, { status: 500 });
  }
}
