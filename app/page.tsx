"use client";

import { useMemo, useState } from "react";
import { businessPlugins } from "@/lib/plugins";

type Message = { role: "user" | "assistant"; content: string };

const suggestions = ["Bu haftanın önceliklerini planla", "Satışları artırmak için 3 fikir ver", "Müşteri takip süreci oluştur"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"overview" | "plugins">("overview");
  const [enabled, setEnabled] = useState<string[]>(["reports"]);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Merhaba! Ben Ay zek. İşletmen için planlama, analiz ve müşteri süreçlerinde yardımcı olmaya hazırım. Bugün neyi birlikte çözelim?" }]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const enabledCount = useMemo(() => enabled.length, [enabled]);

  async function sendMessage(value = prompt) {
    const text = value.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setPrompt("");
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, enabledPlugins: enabled }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Bir hata oluştu.");
      setMessages([...next, { role: "assistant", content: data.content }]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Bağlantı kurulamadı.");
    } finally {
      setBusy(false);
    }
  }

  function togglePlugin(id: string) {
    const plugin = businessPlugins.find((item) => item.id === id);
    if (!plugin || plugin.status !== "available") {
      setNotice("Bu eklentiyi kullanmak için ilgili servis bağlantısının kurulması gerekiyor. Entegrasyon bilgileri sunucu tarafında güvenli biçimde tanımlanmalı.");
      return;
    }
    setEnabled((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#"><span className="brand-mark">a.</span><span>ay zek<small>BUSINESS ASSISTANT</small></span></a>
        <div className="workspace-label">ÇALIŞMA ALANI</div>
        <button className={activeTab === "overview" ? "nav-item selected" : "nav-item"} onClick={() => setActiveTab("overview")}><span>⌂</span> Genel bakış</button>
        <button className={activeTab === "plugins" ? "nav-item selected" : "nav-item"} onClick={() => setActiveTab("plugins")}><span>⌘</span> Eklentiler <b>{enabledCount}</b></button>
        <div className="sidebar-bottom"><div className="status-dot" /> Sistem hazır <span className="version">v1.0</span></div>
      </aside>

      <section className="main-area">
        <header className="topbar"><div className="crumb">Çalışma alanı <span>/</span> {activeTab === "overview" ? "Genel bakış" : "Eklentiler"}</div><div className="profile"><div className="avatar">A</div><div><strong>Ay zek</strong><small>İşletme alanı</small></div></div></header>

        {activeTab === "overview" ? <div className="content">
          <div className="welcome-row"><div><div className="eyebrow">AKILLI İŞLETME ASİSTANIN</div><h1>İşlerin yolunda.<br/><em>Şimdi sıradaki adım ne?</em></h1><p>Fikirlerini plana, planlarını sonuca dönüştür.</p></div><div className="orb-wrap"><div className="orb"><span>✳</span></div><div className="orb-caption">AY ZEK <i>●</i> ÇEVRİM İÇİ</div></div></div>
          <div className="stats-grid"><div className="stat-card"><span>AKTİF EKLENTİLER</span><strong>{enabledCount.toString().padStart(2,"0")}</strong><small>Çalışma alanında etkin</small></div><div className="stat-card"><span>ASİSTAN DURUMU</span><strong className="ready">Hazır</strong><small>Yapılandırma bekleyen AI bağlantısı olabilir</small></div><div className="stat-card"><span>ÇALIŞMA MODU</span><strong>İşletme</strong><small>Türkçe akıllı asistan</small></div></div>
          <div className="section-heading"><div><div className="eyebrow">AY ZEK İLE ÇALIŞ</div><h2>Asistanınla konuş</h2></div><span className="secure-label">✧ Güvenli çalışma alanı</span></div>
          <div className="assistant-card"><div className="chat-top"><div className="assistant-icon">✳</div><div><strong>Ay zek</strong><small>İşletme asistanın · {enabledCount} eklenti etkin</small></div><span className="online-pill">● AKTİF</span></div><div className="messages">{messages.map((message, index) => <div key={index} className={message.role === "user" ? "message user-message" : "message assistant-message"}><div className="message-avatar">{message.role === "user" ? "S" : "✳"}</div><div className="message-bubble">{message.content}</div></div>)}{busy && <div className="typing"><span/><span/><span/> Ay zek düşünüyor…</div>}</div><div className="suggestions">{suggestions.map((item) => <button key={item} onClick={() => sendMessage(item)}>{item} <span>↗</span></button>)}</div><form className="composer" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}><input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ay zek'e bir şey sor..." aria-label="Mesajın"/><button type="submit" disabled={busy || !prompt.trim()} aria-label="Gönder">↑</button></form>{notice && <div className="notice">{notice}</div>}<div className="chat-foot">Ay zek yanıtları yapay zekâ tarafından oluşturulur. Önemli kararları doğrulayın.</div></div>
          <div className="bottom-grid"><div className="mini-panel"><div className="panel-title">Eklentilerin</div><p>İş akışını genişletmek için araçlarını yönet.</p><button className="text-link" onClick={() => setActiveTab("plugins")}>Eklentileri görüntüle <span>→</span></button></div><div className="mini-panel accent-panel"><div className="panel-title">Bir fikrin mi var?</div><p>Ay zek'i işletmene göre özelleştir.</p><button className="text-link" onClick={() => setNotice("Özelleştirme alanı sonraki sürüm için planlandı.")}>Özelleştirmeyi keşfet <span>→</span></button></div></div>
        </div> : <div className="content"><div className="eyebrow">ARAÇ MERKEZİ</div><h1 className="plugins-title">İş akışını <em>genişlet.</em></h1><p className="plugins-intro">Ay zek'e yeni yetenekler ekle. Entegrasyon gerektiren servisler, güvenli bağlantı kurulduktan sonra etkinleştirilebilir.</p><div className="plugin-grid">{businessPlugins.map((plugin) => <article className="plugin-card" key={plugin.id}><div className="plugin-card-top"><div className="plugin-icon">{plugin.icon}</div><span className={plugin.status === "available" ? "plugin-status available" : "plugin-status"}>{plugin.status === "available" ? "KULLANIMA HAZIR" : "BAĞLANTI GEREKLİ"}</span></div><h3>{plugin.name}</h3><p>{plugin.description}</p><div className="plugin-card-bottom"><span>{plugin.category}</span><button disabled={plugin.status !== "available"} className={enabled.includes(plugin.id) ? "toggle on" : "toggle"} onClick={() => togglePlugin(plugin.id)} aria-label={plugin.name + " eklentisini değiştir"}><i/></button></div></article>)}</div>{notice && <div className="notice">{notice}</div>}<div className="integration-note"><strong>Yeni entegrasyon mu istiyorsun?</strong><p>Google Workspace, Slack, CRM veya kendi API'lerin için eklenti adaptörleri eklenebilir. Erişim anahtarları yalnızca sunucu tarafında saklanır.</p></div></div>}
        <footer className="footer">© 2026 Ay zek <span>İşletmen için daha akıllı bir çalışma alanı.</span></footer>
      </section>
    </main>
  );
}
