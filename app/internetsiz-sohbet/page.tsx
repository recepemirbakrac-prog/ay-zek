"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle, Send, WifiOff, Trash2, Plus, Search, Smartphone,
  Phone, Video, Settings, MoreHorizontal, Paperclip, Mic, Bell,
  Users, Info, LogOut, Sun, Moon, Grid2X2, X, CheckCheck, PencilLine,
  Image as ImageIcon, Smile, ChevronDown, PanelRightClose
} from "lucide-react";

type Message = { id: number; text: string; time: string; mine: boolean };
type Chat = { id: string; name: string; color: string; messages: Message[]; avatar?: string; group?: boolean };

const initialChats: Chat[] = [
  { id: "emilia", name: "Emilia 💗", color: "#b86b54", messages: [{id:1,text:"Yeni tasarımları gönderdim.",time:"16:14",mine:false}] },
  { id: "anastasia", name: "Anastasia", color: "#c78a56", messages: [{id:2,text:"You: Good Luck! 💗",time:"15:20",mine:true}] },
  { id: "nick", name: "Nick", color: "#9a7959", messages: [{id:3,text:"Sesli mesaj",time:"13:54",mine:false}] },
  { id: "designers", name: "Designers", color: "#c4c7c7", group:true, messages: [
    {id:4,text:"What's up guys! How about today project?",time:"11:01",mine:false},
    {id:5,text:"Today the progress of the project is smooth! 🚀",time:"11:03",mine:false},
    {id:6,text:"I saw 2 creative UI design and I want to share with you guys!",time:"11:05",mine:true},
    {id:7,text:"Sesli mesaj · 0:30",time:"11:08",mine:false},
    {id:8,text:"I cannot wait to see 😍",time:"11:15",mine:false},
  ]},
  { id: "maria", name: "Maria", color: "#92715f", messages: [{id:9,text:"Maria is typing...",time:"16:05",mine:false}] },
  { id: "ithan", name: "Ithan Peele", color: "#647d71", messages: [{id:10,text:"Thank you!",time:"15:45",mine:false}] },
  { id: "saman", name: "Saman Shafaei", color: "#687c8c", messages: [{id:11,text:"Awesome!",time:"15:02",mine:false}] },
  { id: "katie", name: "Katie", color: "#a47b75", messages: [{id:12,text:"You: See you later",time:"13:33",mine:true}] },
  { id: "isaac", name: "Isaac", color: "#8d8171", messages: [{id:13,text:"Sent images",time:"12:00",mine:false}] },
  { id: "mom", name: "Mom", color: "#b08a67", messages: [{id:14,text:"Missed call",time:"11:07",mine:false}] },
];

const people = ["Austin", "Arthur", "Sabrina", "Vanessa"];

export default function OfflineChatPage() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [active, setActive] = useState("designers");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [details, setDetails] = useState(true);
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("messages");
  const [showMenu, setShowMenu] = useState(false);

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
    const time = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    setChats(prev => prev.map(c => c.id === current.id ? { ...c, messages: [...c.messages, { id: Date.now(), text, time, mine: true }] } : c));
    setDraft("");
  }

  function addChat() {
    const name = window.prompt("Sohbet veya grup adı:");
    if (!name?.trim()) return;
    const chat = { id: "chat-" + Date.now(), name: name.trim(), color: "#8b5cf6", messages: [] as Message[] };
    setChats(prev => [...prev, chat]);
    setActive(chat.id);
  }

  function clearChat() {
    if (!current || !window.confirm("Bu cihazdaki sohbet geçmişi silinsin mi?")) return;
    setChats(prev => prev.map(c => c.id === current.id ? { ...c, messages: [] } : c));
    setShowMenu(false);
  }

  return (
    <main className={"messenger-page " + (dark ? "is-dark" : "is-light")}>
      <style jsx global>{`
        *{box-sizing:border-box}body{margin:0;background:#272631;color:#f6f3ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .messenger-page{min-height:100dvh;padding:clamp(12px,4vw,54px);display:grid;place-items:center;background:radial-gradient(ellipse at 18% 8%,#55515e 0%,#302e39 44%,#24232d 100%);color:#f6f3ff}
        .messenger-page.is-light{background:radial-gradient(ellipse at 18% 8%,#d9d4e7,#aaa5b7 55%,#858191);color:#272333}
        .messenger{width:min(1420px,100%);height:min(850px,calc(100dvh - 56px));min-height:610px;display:grid;grid-template-columns:68px 260px minmax(0,1fr) 245px;overflow:hidden;border-radius:30px;background:#171622;box-shadow:0 30px 90px #08071080;border:1px solid #ffffff10}
        .rail{background:#171622;border-right:1px solid #ffffff0d;display:flex;flex-direction:column;align-items:center;padding:24px 0 18px;gap:17px}.rail-avatar{width:37px;height:37px;border-radius:50%;background:linear-gradient(135deg,#e0a36c,#8d4a78);display:grid;place-items:center;font-weight:800;color:white;margin-bottom:12px}.rail-line{width:28px;height:1px;background:#ffffff30;margin:0 0 6px}.rail-btn{width:38px;height:38px;border:0;background:transparent;color:#9c98ad;border-radius:12px;display:grid;place-items:center;cursor:pointer}.rail-btn.active{background:#8b5cf633;color:#c8a8ff}.rail-spacer{flex:1}
        .list-panel{min-width:0;background:#1b1927;border-right:1px solid #ffffff0c;display:flex;flex-direction:column}.list-head{display:flex;justify-content:space-between;align-items:center;padding:29px 19px 16px}.list-head h1{font-size:15px;margin:0;font-weight:750}.list-head h1 span{color:#b58aff}.new-icon{border:0;background:transparent;color:#ddd5f1;cursor:pointer;padding:5px}.searchbox{margin:0 16px 13px;background:#12111b;border:1px solid #ffffff0b;border-radius:10px;padding:10px;display:flex;gap:8px;align-items:center;color:#777487}.searchbox input{min-width:0;width:100%;background:none;border:0;outline:0;color:#fff;font-size:12px}.pinned{padding:0 19px 13px;color:#bdb8ca;font-size:11px;display:flex;align-items:center;gap:8px}.pinned span{margin-left:auto;color:#7e798d}.chat-list{overflow:auto;flex:1;padding:0 9px 12px}.chat-item{width:100%;display:flex;align-items:center;gap:11px;padding:10px 9px;border:0;border-radius:13px;background:transparent;color:inherit;text-align:left;cursor:pointer;margin-bottom:3px}.chat-item.active{background:#373344}.chat-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:13px;font-weight:800;flex:none;background:linear-gradient(135deg,#7c6b9b,#b47e8d);position:relative}.chat-avatar.group{background:linear-gradient(135deg,#d5d8d4,#737b7c);color:#25252c}.chat-avatar:after{content:"";position:absolute;width:8px;height:8px;border-radius:50%;background:#52d68a;border:2px solid #1b1927;right:0;bottom:0}.chat-item.active .chat-avatar:after{border-color:#373344}.chat-copy{min-width:0;flex:1}.chat-copy b{display:block;font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chat-copy small{display:block;color:#9691a5;font-size:10px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chat-time{font-size:9px;color:#a49caf;align-self:flex-start;padding-top:3px}.list-bottom{padding:12px 17px 17px;border-top:1px solid #ffffff0c;display:flex;align-items:center;gap:9px;color:#8e899d;font-size:10px}.status-dot{width:7px;height:7px;border-radius:50%;background:#54d58b}
        .conversation{min-width:0;display:flex;flex-direction:column;background:linear-gradient(145deg,#28204c 0%,#5425a2 35%,#a12fa9 68%,#331d61 100%);position:relative}.conversation:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 70% 55%,#e65bc844,transparent 48%),linear-gradient(180deg,#100d1b38,#120d2540);pointer-events:none}.topbar,.messages,.composer-wrap{position:relative;z-index:1}.topbar{height:91px;flex:none;padding:0 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff1b;background:#19152640;backdrop-filter:blur(15px)}.current-person{display:flex;align-items:center;gap:12px;min-width:0}.current-person h2{font-size:14px;margin:0;font-weight:750}.current-person p{font-size:10px;color:#d3c5ec;margin:4px 0 0}.top-actions{display:flex;align-items:center;gap:5px}.top-actions button{width:34px;height:34px;border:0;background:transparent;color:#eee6ff;border-radius:10px;display:grid;place-items:center;cursor:pointer}.messages{flex:1;overflow:auto;padding:22px 22px 18px;display:flex;flex-direction:column;gap:18px}.day-line{display:flex;align-items:center;gap:14px;color:#e0d6f1;font-size:10px;justify-content:center;margin:0 0 2px}.day-line:before,.day-line:after{content:"";height:1px;background:#ffffff42;flex:1}.message{display:flex;align-items:flex-end;gap:9px;max-width:84%}.message.mine{align-self:flex-end;flex-direction:row-reverse}.mini-avatar{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#b3a3a1;color:#25202b;font-size:10px;font-weight:800;flex:none}.message-content{min-width:0}.message-meta{display:flex;gap:8px;align-items:center;margin:0 0 5px 2px;font-size:10px;color:#fff}.message-meta time{font-size:9px;color:#e5d7f5a8}.bubble{padding:11px 14px;border-radius:15px 15px 15px 5px;background:#ffffff30;backdrop-filter:blur(8px);font-size:12px;line-height:1.55;color:#fff;overflow-wrap:anywhere;box-shadow:0 7px 20px #170a3b20}.message.mine .bubble{background:linear-gradient(130deg,#db6ce0,#b64cc8);border-radius:15px 15px 5px 15px}.message.mine .message-meta{justify-content:flex-end}.offline-note{margin:auto auto 3px;text-align:center;color:#f3eaffb5;font-size:10px;line-height:1.6;max-width:360px}.composer-wrap{padding:0 19px 18px}.typing{font-size:9px;color:#e8b8ef;margin:0 0 10px 33px}.composer{display:flex;align-items:center;gap:9px;padding:8px 10px;background:#160e2bba;border:1px solid #ffffff20;border-radius:14px;backdrop-filter:blur(15px)}.composer button{border:0;background:transparent;color:#f1e8ff;display:grid;place-items:center;cursor:pointer;padding:7px}.composer input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:white;font-size:12px;padding:9px 2px}.composer input::placeholder{color:#c5b5d5}.send-btn{width:37px;height:37px;border-radius:11px!important;background:linear-gradient(135deg,#a78bfa,#e879f9)!important;color:#24102e!important}.composer button:disabled{opacity:.35;cursor:not-allowed}.right-panel{background:#1b1927;border-left:1px solid #ffffff0d;display:flex;flex-direction:column;min-width:0;overflow:auto}.detail-head{padding:30px 20px 20px;display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:750}.detail-head button{border:0;background:none;color:#aaa5b7;cursor:pointer}.group-profile{text-align:center;padding:4px 15px 18px}.big-avatar{width:88px;height:88px;border-radius:50%;margin:0 auto 10px;background:linear-gradient(135deg,#e3e5e0,#777e83);color:#292832;display:grid;place-items:center;font-size:28px;font-weight:800;border:4px solid #ffffff18}.group-profile b{font-size:14px}.detail-section{padding:0 19px 17px}.detail-title{display:flex;align-items:center;gap:7px;color:#ddd6e8;font-size:10px;font-weight:700;margin-bottom:10px}.detail-section p{font-size:10px;line-height:1.6;color:#a49eaf;margin:0}.member-count{display:flex;align-items:center;justify-content:space-between;color:#e7e0f1;font-size:10px;margin-bottom:10px}.member-count button{border:0;background:none;color:#b89bff;font-size:9px;cursor:pointer}.member{display:flex;align-items:center;gap:9px;padding:6px 0;font-size:10px;color:#e5dfed}.member .mini-avatar{width:23px;height:23px}.member-icons{margin-left:auto;color:#9d96ad;display:flex;gap:9px}.shared-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.shared-tile{height:65px;border-radius:9px;background:linear-gradient(135deg,#d3c8bd,#827b83);display:grid;place-items:center;color:#45394a}.shared-tile:nth-child(2){background:linear-gradient(135deg,#e3d1bc,#8b685a)}.shared-tile:nth-child(3){background:linear-gradient(135deg,#e3b77d,#8f4b4b)}.shared-tile:nth-child(4){background:linear-gradient(135deg,#a7b1b4,#514e5c)}.detail-tools{display:flex;gap:8px;padding:0 18px 18px;margin-top:auto}.detail-tools button{flex:1;height:36px;border:1px solid #ffffff12;background:#282537;color:#b9b0ca;border-radius:10px;display:grid;place-items:center;cursor:pointer}.menu-pop{position:absolute;z-index:5;right:20px;top:66px;background:#211d30;border:1px solid #ffffff20;border-radius:12px;padding:7px;box-shadow:0 12px 30px #0008}.menu-pop button{display:flex;gap:8px;align-items:center;width:100%;border:0;background:none;color:#e9e1f5;padding:9px 12px;font-size:11px;cursor:pointer;text-align:left}.mobile-detail{display:none}
        .is-light .messenger{background:#f7f4fc;color:#302a3a}.is-light .rail,.is-light .list-panel,.is-light .right-panel{background:#f4f0fa;color:#302a3a;border-color:#ded7e9}.is-light .list-head h1,.is-light .chat-copy b,.is-light .detail-head,.is-light .member{color:#302a3a}.is-light .searchbox{background:#e9e3f1}.is-light .searchbox input{color:#302a3a}.is-light .chat-item.active{background:#e4d9f4}.is-light .list-bottom{border-color:#ddd5e8}.is-light .pinned,.is-light .detail-title{color:#5d536c}.is-light .detail-section p{color:#766d81}
        @media(max-width:1100px){.messenger{grid-template-columns:58px 230px minmax(0,1fr)}.right-panel{display:none}.mobile-detail{display:grid!important}.messages{padding:20px 16px}.topbar{padding:0 16px}}
        @media(max-width:700px){.messenger-page{padding:0}.messenger{height:100dvh;min-height:0;border-radius:0;border:0;grid-template-columns:62px minmax(0,1fr)}.rail{padding-top:17px}.list-panel{display:none}.topbar{height:75px}.messages{padding:17px 12px}.message{max-width:94%}.composer-wrap{padding:0 10px 12px}.top-actions button:nth-child(1),.top-actions button:nth-child(2){display:none}.offline-note{font-size:9px}}
        @media(max-width:390px){.messenger{grid-template-columns:50px minmax(0,1fr)}.rail-btn{width:34px;height:34px}.topbar{padding:0 10px}.current-person h2{font-size:12px}.messages{padding:14px 8px}.bubble{font-size:11px;padding:10px 11px}}
      `}</style>
      <section className="messenger">
        <nav className="rail">
          <div className="rail-avatar">A</div><div className="rail-line"/>
          <button className={"rail-btn "+(tab==="apps"?"active":"")} onClick={()=>setTab("apps")} title="Uygulamalar"><Grid2X2 size={17}/></button>
          <button className={"rail-btn "+(tab==="messages"?"active":"")} onClick={()=>setTab("messages")} title="Mesajlar"><MessageCircle size={17}/></button>
          <button className="rail-btn" title="Aramalar"><Phone size={17}/></button>
          <button className="rail-btn" title="Kişiler"><Users size={17}/></button>
          <button className="rail-btn" title="Bildirimler"><Bell size={17}/></button>
          <button className="rail-btn" title="Ayarlar"><Settings size={17}/></button>
          <div className="rail-spacer"/>
          <button className="rail-btn" onClick={()=>setDark(!dark)} title="Tema"><Sun size={17}/></button>
          <button className="rail-btn" onClick={()=>setDark(!dark)} title="Tema değiştir"><Moon size={17}/></button>
        </nav>
        <aside className="list-panel">
          <div className="list-head"><h1>Messages <span>({chats.length})</span></h1><button className="new-icon" onClick={addChat} title="Yeni sohbet"><PencilLine size={17}/></button></div>
          <label className="searchbox"><Search size={15}/><input placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)}/></label>
          <div className="pinned"><span>⌖</span> Pinned Message <span>•••</span></div>
          <div className="chat-list">{visibleChats.map(chat=><button key={chat.id} className={"chat-item "+(active===chat.id?"active":"")} onClick={()=>setActive(chat.id)}><span className={"chat-avatar "+(chat.group?"group":"")}>{chat.name.slice(0,1).toLocaleUpperCase("tr")}</span><span className="chat-copy"><b>{chat.name}</b><small>{chat.messages.at(-1)?.text || "Henüz mesaj yok"}</small></span><span className="chat-time">{chat.messages.at(-1)?.time || ""}</span></button>)}</div>
          <div className="list-bottom"><span className="status-dot"/>{online?"İnternet bağlı · Yerel mod":"Çevrimdışısın · Hazır"}<WifiOff size={13} style={{marginLeft:"auto"}}/></div>
        </aside>
        <section className="conversation">
          <header className="topbar">
            <div className="current-person"><span className={"chat-avatar "+(current.group?"group":"")}>{current.name.slice(0,1).toLocaleUpperCase("tr")}</span><div><h2>{current.name}</h2><p>{current.group?"48 Üye · Yerel grup":"Bu cihazda saklanır"}</p></div></div>
            <div className="top-actions">
              <button title="Sesli arama"><Phone size={17}/></button><button title="Görüntülü arama"><Video size={17}/></button><button title="Ara"><Search size={17}/></button>
              <button className="mobile-detail" title="Grup bilgisi" onClick={()=>setDetails(!details)}><Info size={17}/></button>
              <button title="Ayarlar" onClick={()=>setShowMenu(!showMenu)}><Settings size={17}/></button>
            </div>
            {showMenu&&<div className="menu-pop"><button onClick={clearChat}><Trash2 size={14}/> Sohbeti temizle</button><button onClick={()=>setDetails(!details)}><PanelRightClose size={14}/> Grup bilgisi</button><button onClick={()=>setShowMenu(false)}><X size={14}/> Kapat</button></div>}
          </header>
          <div className="messages">
            <div className="day-line">Today</div>
            {current.messages.map((m,i)=><div key={m.id} className={"message "+(m.mine?"mine":"")}><span className="mini-avatar">{m.mine?"A":current.name.slice(0,1)}</span><div className="message-content"><div className="message-meta"><b>{m.mine?"You":(i%2===0?"Sasha":"Anastasia")}</b><time>{m.time}</time></div><div className="bubble">{m.text}</div></div></div>)}
            <div className="offline-note"><Smartphone size={14} style={{display:"inline",verticalAlign:"middle",marginRight:5}}/>Bu sohbet tasarımı çevrimdışı çalışır. Mesajlar bu cihazda saklanır; diğer kişilere internet veya yerel bağlantı olmadan iletilmez.</div>
          </div>
          <div className="composer-wrap"><form className="composer" onSubmit={e=>{e.preventDefault();sendMessage()}}><button type="button" title="Dosya ekle"><Paperclip size={18}/></button><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Your Message" aria-label="Mesaj yaz"/><button type="button" title="Emoji"><Smile size={18}/></button><button type="button" title="Ses kaydı"><Mic size={18}/></button><button className="send-btn" type="submit" disabled={!draft.trim()} aria-label="Gönder"><Send size={17}/></button></form></div>
        </section>
        <aside className="right-panel">
          <div className="detail-head"><span>••• &nbsp; Grup Info</span><button onClick={()=>setDetails(false)} title="Kapat"><X size={16}/></button></div>
          <div className="group-profile"><div className="big-avatar">{current.name.slice(0,1).toLocaleUpperCase("tr")}</div><b>{current.name}</b></div>
          <div className="detail-section"><div className="detail-title"><Info size={13}/> Description</div><p>Birlikte fikirlerimizi paylaşmak ve güzel projeler üretmek için buradayız.</p></div>
          <div className="detail-section"><div className="member-count"><b>Members {current.group?"48":"1"}</b><button>Show All</button></div>{people.map((p,i)=><div className="member" key={p}><span className="mini-avatar">{p.slice(0,1)}</span>{p}<span className="member-icons"><Video size={13}/><MessageCircle size={13}/></span></div>)}</div>
          <div className="detail-section"><div className="member-count"><b>Shared Photos 126</b><button>Show All</button></div><div className="shared-grid"><div className="shared-tile"><ImageIcon size={21}/></div><div className="shared-tile"><Smile size={21}/></div><div className="shared-tile"><ImageIcon size={21}/></div><div className="shared-tile"><ImageIcon size={21}/></div></div></div>
          <div className="detail-tools"><button title="Bildirimler"><Bell size={15}/></button><button title="Üyeler"><Users size={15}/></button><button title="Bilgi"><Info size={15}/></button><button title="Çıkış"><LogOut size={15}/></button></div>
        </aside>
      </section>
    </main>
  );
}
