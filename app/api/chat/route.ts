import { NextResponse } from "next/server";
import { getPluginContext } from "@/lib/plugins";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const enabledPlugins = Array.isArray(body.enabledPlugins) ? body.enabledPlugins.filter((v: unknown): v is string => typeof v === "string") : [];
    const latest = messages[messages.length - 1];
    if (!latest || typeof latest.content !== "string" || !latest.content.trim()) {
      return NextResponse.json({ error: "Bir mesaj yazmalısın." }, { status: 400 });
    }

    // Vercel injects an OIDC token into deployed functions. An API key remains
    // supported for local development or deployments outside Vercel.
    const gatewayToken = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    const model = process.env.AI_GATEWAY_MODEL;
    if (!gatewayToken || !model) {
      return NextResponse.json({
        error: "AI bağlantısı henüz yapılandırılmadı. Vercel dağıtımında OIDC kimlik doğrulaması ve AI_GATEWAY_MODEL ayarını kontrol et."
      }, { status: 503 });
    }

    const pluginContext = getPluginContext(enabledPlugins);
    const system = [
      "Sen Ay zek adlı Türkçe konuşan, pratik ve güvenilir bir işletme asistanısın.",
      "Yanıtlarını açık, kısa ve uygulanabilir ver. Bilmediğin işletme verilerini uydurma.",
      "Ödeme, e-posta gönderme, kayıt silme veya dış sistemlerde işlem yapma yeteneğin yoksa bunu açıkça söyle; yapmış gibi davranma.",
      pluginContext ? "Etkin eklenti bağlamı (yalnızca mevcut özellikler):\n" + pluginContext : "Şu anda harici eklenti etkin değil."
    ].join("\n\n");

    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + gatewayToken, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: system }, ...messages.slice(-12)], temperature: 0.4 }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("AI Gateway error", response.status, detail.slice(0, 500));
      return NextResponse.json({ error: "AI servisine şu anda ulaşılamıyor. Gateway kimlik doğrulamasını ve kredi/bütçe durumunu kontrol et." }, { status: 502 });
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") return NextResponse.json({ error: "AI yanıtı okunamadı." }, { status: 502 });
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Chat route error", error);
    return NextResponse.json({ error: "İstek işlenirken bir hata oluştu." }, { status: 500 });
  }
}
