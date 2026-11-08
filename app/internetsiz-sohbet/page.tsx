"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Send, WifiOff, Trash2, Plus, Search, Download, Smartphone } from "lucide-react";

type Message = { id: number; text: string; time: string; mine: boolean };
type Chat = { id: string; name: string; color: string; messages: Message[] };

const initialChats: Chat[] = [
  { id: "notlar", name: "Kendime Notlar", color: "#8b5cf6", messages: [
    { id: 1, text: "İnternet olmasa bile buraya not bırakabilirsin. Mesajların bu cihazda saklanır.", time: "09:30", mine: false },
    { id: 2, text: "Harika! Çevrimdışı mesajlarım burada kalacak.", time: "09:31", mine: true },
  ]},
  { id: "deneme", name: "Sohbet Taslağı", color: "#0ea5e9", messages: [
    { id: 3, text: "Bu alan çevrimdışı sohbet taslaklarını denemek için.", time: "Dün", mine: false },
  ]},
];

export default function OfflineChatPage() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [active, setActive] = useState("notlar");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ayzek-offline-chats-v1");
      if (saved) setChats(JSON.parse(saved));
    } catch {}
    setReady(true);
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/offline-sw.js").catch(() => {});
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("ayzek-offline-chats-v1", JSON.stringify(chats));
  }, [chats, ready]);

  const current = chats.find(c => c.id === active) || chats[0];
  const visibleChats = useMemo(() => chats.filter(c => c.name.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"))), [chats, search]);

  function sendMessage() {
    const text = draft.trim();
    if (!text || !current) return;
    const now = new Date();
    const time = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    setChats(prev => prev.map(c => c.id === current.id ? { ...c, messages: [...c.messages, { id: Date.now(), text, time, mine: true }] } : c));
    setDraft("");
  }

  function addChat() {
    const name = window.prompt("Sohbet başlığı:");
    if (!name?.trim()) return;
    const chat = { id: "chat-" + Date.now(), name: name.trim(), color: "#10b981", messages: [] as Message[] };
    setChats(prev => [...prev, chat]);
    setActive(chat.id);
  }

  function clearChat() {
    if (!current || !window.confirm("Bu cihazdaki sohbet geçmişi silinsin mi?")) return;
    setChats(prev => prev.map(c => c.id === current.id ? { ...c, messages: [] } : c));
  }

  return (
    <main className="offline-shell">
      <style jsx global>{`
        *{box-sizing:border-box} body{margin:0;background:#080d18;color:#edf3ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .offline-shell{min-height:100dvh;padding:26px;display:grid;place-items:center;background:radial-gradient(ellipse at 18% 0%,#15294a 0%,#080d18 48%);color:#edf3ff}
        .offline-app{width:min(1100px,100%);height:min(760px,calc(100dvh - 52px));min-height:560px;display:grid;grid-template-columns:320px 1fr;background:#0e1728;border:1px solid #263650;border-radius:24px;overflow:hidden;box-shadow:0 28px 90px #0008}
        .side{background:#101c30;border-right:1px solid #263650;display:flex;flex-direction:column;min-width:0}.brand{padding:24px 22px 18px;display:flex;align-items:center;gap:12px}.brand-icon{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#2563eb);display:grid;place-items:center}.brand h1{font-size:19px;margin:0;letter-spacing:-.5px}.brand p{margin:3px 0 0;color:#8fa4c2;font-size:12px}
        .offline-pill{margin:0 18px 18px;padding:10px 12px;border-radius:12px;background:#17263b;color:#a9c0df;font-size:12px;display:flex;align-items:center;gap:8px}.dot{width:8px;height:8px;border-radius:50%;background:#f59e0b}.search{margin:0 16px 14px;display:flex;align-items:center;gap:8px;background:#0b1424;border:1px solid #263650;padding:10px 12px;border-radius:11px;color:#8196b5}.search input{background:none;border:0;outline:0;color:white;width:100%;font-size:13px}
        .chat-list{overflow:auto;padding:0 10px;flex:1}.chat-row{width:100%;border:0;background:transparent;color:inherit;display:flex;gap:12px;align-items:center;text-align:left;padding:13px 11px;border-radius:13px;cursor:pointer}.chat-row.active{background:#1b2a43}.avatar{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:700;color:white;flex:none}.chat-meta{min-width:0;flex:1}.chat-meta strong{display:block;font-size:13px}.chat-meta small{display:block;color:#8499b7;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px}.new-chat{margin:12px 16px 18px;border:1px solid #354966;background:#1b2c46;color:#dce9ff;padding:12px;border-radius:12px;display:flex;justify-content:center;gap:8px;align-items:center;cursor:pointer;font-weight:600}
        .conversation{display:flex;flex-direction:column;min-width:0;background:linear-gradient(160deg,#101b2e,#0c1423)}.topbar{padding:20px 26px;border-bottom:1px solid #263650;display:flex;align-items:center;justify-content:space-between;gap:12px}.person{display:flex;align-items:center;gap:12px}.person h2{font-size:15px;margin:0}.person p{font-size:11px;color:#8da2bf;margin:4px 0 0}.icon-btn{border:0;background:transparent;color:#8da2bf;cursor:pointer;padding:8px;border-radius:9px}.messages{flex:1;overflow:auto;padding:26px;display:flex;flex-direction:column;gap:14px}.bubble{max-width:min(78%,520px);padding:13px 15px;border-radius:17px;background:#1a2940;color:#dce8f9;font-size:14px;line-height:1.5;align-self:flex-start;overflow-wrap:anywhere}.bubble.mine{align-self:flex-end;background:linear-gradient(135deg,#6543d8,#365fcb);color:white;border-bottom-right-radius:5px}.bubble:not(.mine){border-bottom-left-radius:5px}.bubble time{display:block;text-align:right;font-size:10px;opacity:.65;margin-top:6px}.notice{margin:auto auto 8px;text-align:center;color:#7186a4;font-size:11px;line-height:1.6;max-width:350px}.composer{padding:18px 24px 22px;border-top:1px solid #263650;display:flex;gap:10px}.composer input{flex:1;min-width:0;background:#111e32;border:1px solid #30435f;border-radius:13px;padding:14px 16px;color:white;outline:none;font-size:14px}.composer input:focus{border-color:#7561e8}.send{width:48px;border:0;border-radius:13px;background:linear-gradient(135deg,#7c3aed,#3568d4);color:white;display:grid;place-items:center;cursor:pointer}.send:disabled{opacity:.4;cursor:not-allowed}.foot{padding:0 24px 14px;color:#617693;font-size:10px;text-align:center}
        @media(max-width:700px){.offline-shell{padding:0}.offline-app{height:100dvh;min-height:0;border:0;border-radius:0;grid-template-columns:104px 1fr}.brand{padding:18px 10px;justify-content:center}.brand-copy,.offline-pill,.search,.chat-meta,.new-label{display:none!important}.chat-list{padding:0 7px}.chat-row{justify-content:center;padding:10px 4px}.avatar{width:46px;height:46px}.new-chat{margin:10px auto;width:48px;height:48px;padding:0;border-radius:14px}.topbar{padding:16px}.messages{padding:18px 13px}.bubble{max-width:90%;font-size:13px}.composer{padding:12px}.foot{padding-bottom:10px}}
        @media(max-width:390px){.offline-app{grid-template-columns:76px 1fr}.avatar{width:40px;height:40px}.topbar{padding:12px}.messages{padding:14px 9px}}
      `}</style>
      <section className="offline-app">
        <aside className="side">
          <div className="brand"><div className="brand-icon"><MessageCircle size={22}/></div><div className="brand-copy"><h1>Ay Zek Sohbet</h1><p>Çevrimdışı mesaj defteri</p></div></div>
          <div className="offline-pill"><span className="dot"/><span>{online ? "İnternet var · Yerel mod" : "Çevrimdışısın · Hazır"}</span><WifiOff size={14} style={{marginLeft:"auto"}}/></div>
          <label className="search"><Search size={15}/><input placeholder="Sohbet ara..." value={search} onChange={e=>setSearch(e.target.value)}/></label>
          <div className="chat-list">{visibleChats.map(chat=><button key={chat.id} className={"chat-row "+(active===chat.id?"active":"")} onClick={()=>setActive(chat.id)}><span className="avatar" style={{background:chat.color}}>{chat.name.slice(0,1).toLocaleUpperCase("tr")}</span><span className="chat-meta"><strong>{chat.name}</strong><small>{chat.messages.at(-1)?.text || "Henüz mesaj yok"}</small></span></button>)}</div>
          <button className="new-chat" onClick={addChat}><Plus size={17}/><span className="new-label">Yeni sohbet</span></button>
        </aside>
        <section className="conversation">
          <header className="topbar"><div className="person"><span className="avatar" style={{background:current.color}}>{current.name.slice(0,1).toLocaleUpperCase("tr")}</span><div><h2>{current.name}</h2><p>Bu cihazda saklanır</p></div></div><button className="icon-btn" title="Sohbeti temizle" onClick={clearChat}><Trash2 size={18}/></button></header>
          <div className="messages">{current.messages.map(m=><div key={m.id} className={"bubble "+(m.mine?"mine":"")}>{m.text}<time>{m.time}</time></div>)}<div className="notice"><Smartphone size={16} style={{display:"inline",verticalAlign:"middle",marginRight:5}}/>Mesajların internet olmadan bu cihazda saklanır. Başka kişilere otomatik olarak gönderilmez.</div></div>
          <form className="composer" onSubmit={e=>{e.preventDefault();sendMessage()}}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Çevrimdışı notunu yaz..." aria-label="Mesaj yaz"/><button className="send" type="submit" disabled={!draft.trim()} aria-label="Gönder"><Send size={18}/></button></form>
          <div className="foot">Ay Zek · Yerel sohbet · İnternet gerekmez (ilk açılıştan sonra)</div>
        </section>
      </section>
    </main>
  );
}
