"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageCircle, Send, WifiOff, Trash2, Plus, Search, Smartphone, Phone, Video,
  Settings, Paperclip, Mic, Bell, Users, Info, Sun, Moon, Grid2X2, X,
  PencilLine, Image as ImageIcon, Smile, Copy, LogOut, Check, Link2, UserRound
} from "lucide-react";
import { getRealtimeClient } from "../../lib/supabase-realtime";

type ChatMessage = {
  id: string; sender: string; text: string; time: string; mine: boolean;
  image?: string; fileName?: string;
};

const STORAGE_KEY = "ayzek-live-chat-v2";
const NAME_KEY = "ayzek-chat-name-v1";
const ROOM_KEY = "ayzek-chat-room-v1";
const makeId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
const clock = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

export default function OfflineChatPage() {
  const [name, setName] = useState("Misafir");
  const [room, setRoom] = useState("genel");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [dark, setDark] = useState(true);
  const [details, setDetails] = useState(false);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [fileData, setFileData] = useState<{name:string; image?:string} | null>(null);
  const [ready, setReady] = useState(false);
  const [loadedRoom, setLoadedRoom] = useState("");
  const channelRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const notify = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2800);
  }, []);

  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) || "Misafir");
      const inviteRoom = new URLSearchParams(window.location.search).get("oda");
      setRoom(inviteRoom?.trim() || localStorage.getItem(ROOM_KEY) || "genel");
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(NAME_KEY, name);
  }, [name, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(ROOM_KEY, room);
    const all: Record<string, ChatMessage[]> = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (loadedRoom !== room) return;
    all[room] = messages.slice(-250);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [messages, room, ready, loadedRoom]);

  useEffect(() => {
    if (!ready) return;
    const all: Record<string, ChatMessage[]> = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    setMessages(all[room] || []);
    setLoadedRoom(room);
  }, [room, ready]);

  useEffect(() => {
    if (!ready) return;
    const supabase = getRealtimeClient();
    if (!supabase) { setConnected(false); return; }
    let alive = true;
    const channel = supabase.channel("ayzek-room-" + room, {
      config: { broadcast: { self: false }, presence: { key: makeId() } },
    });
    channel
      .on("broadcast", { event: "chat-message" }, ({ payload }: { payload: ChatMessage }) => {
        if (!alive || !payload?.id) return;
        setMessages(prev => prev.some(m => m.id === payload.id) ? prev : [...prev, { ...payload, mine: false }].slice(-250));
      })
      .on("presence", { event: "sync" }, () => {
        if (alive) setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status: string) => {
        if (!alive) return;
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") await channel.track({ name, online_at: new Date().toISOString() });
      });
    channelRef.current = channel;
    return () => {
      alive = false;
      setConnected(false);
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [room, name, ready]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text && !fileData) return;
    const supabase = getRealtimeClient();
    if (!supabase || !connected || !channelRef.current) {
      notify("Canlı sohbet bağlantısı yok. Ayarlar bölümünden Supabase bilgilerini ekleyin.");
      return;
    }
    const message: ChatMessage = {
      id: makeId(), sender: name, text, time: clock(), mine: true,
      ...(fileData?.image ? { image: fileData.image } : {}),
      ...(fileData?.name ? { fileName: fileData.name } : {}),
    };
    setMessages(prev => [...prev, message].slice(-250));
    setDraft("");
    setFileData(null);
    const result = await channelRef.current.send({ type: "broadcast", event: "chat-message", payload: { ...message, mine: false } });
    if (result !== "ok") notify("Mesaj gönderilemedi. Bağlantını kontrol et.");
  };

  const joinRoom = () => {
    const value = window.prompt("Sohbet kodunu gir veya yeni bir kod oluştur:", room);
    if (!value?.trim()) return;
    const clean = value.trim().toLocaleLowerCase("tr").replace(/[^a-z0-9-_]/g, "-").slice(0, 40);
    setRoom(clean);
    setDetails(false);
    notify("Sohbet odası değiştirildi: " + clean);
  };

  const changeName = () => {
    const value = window.prompt("Sohbette görünecek adın:", name);
    if (value?.trim()) setName(value.trim().slice(0, 32));
  };

  const invite = async () => {
    const url = window.location.origin + "/internetsiz-sohbet?oda=" + encodeURIComponent(room);
    try { await navigator.clipboard.writeText("Ay Zek sohbetine katıl: " + url + " | Oda kodu: " + room); notify("Davet bağlantısı kopyalandı."); }
    catch { notify("Oda kodun: " + room); }
  };

  const clearRoom = () => {
    if (!window.confirm("Bu cihazdaki bu oda mesajları silinsin mi?")) return;
    setMessages([]);
    setMenu(false);
    notify("Bu cihazdaki mesaj geçmişi temizlendi.");
  };

  const pickFile = (file?: File) => {
    if (!file) return;
    if (file.size > 160 * 1024) { notify("Dosya 160 KB'dan küçük olmalı. Büyük dosyalar için dosya paylaşımı henüz desteklenmiyor."); return; }
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setFileData({ name: file.name, image: String(reader.result) });
      reader.readAsDataURL(file);
    } else {
      setFileData({ name: file.name });
    }
  };

  const startVoiceInput = () => {
    const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Speech) { notify("Bu tarayıcı sesle yazmayı desteklemiyor."); return; }
    const recognition = new Speech();
    recognition.lang = "tr-TR";
    recognition.onresult = (event: any) => setDraft(prev => (prev ? prev + " " : "") + event.results[0][0].transcript);
    recognition.onerror = () => notify("Mikrofon kullanılamadı. Tarayıcı iznini kontrol et.");
    recognition.start();
    notify("Dinliyorum… Konuşabilirsin.");
  };

  const filtered = messages.filter(m => !search || (m.text + " " + m.sender).toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")));

  return (
    <main className={"messenger-page " + (dark ? "is-dark" : "is-light")}>
      <style jsx global>{`
        *{box-sizing:border-box}body{margin:0;background:#272631;color:#f6f3ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
        .messenger-page{min-height:100dvh;padding:clamp(10px,3vw,42px);display:grid;place-items:center;background:radial-gradient(ellipse at 18% 8%,#55515e,#302e39 44%,#24232d);color:#f6f3ff}
        .messenger{width:min(1420px,100%);height:min(850px,calc(100dvh - 40px));min-height:560px;display:grid;grid-template-columns:64px 250px minmax(0,1fr) 240px;overflow:hidden;border-radius:28px;background:#171622;box-shadow:0 30px 90px #08071080;border:1px solid #ffffff10}
        .rail{background:#171622;border-right:1px solid #ffffff0d;display:flex;flex-direction:column;align-items:center;padding:20px 0;gap:13px}.rail-avatar{width:37px;height:37px;border-radius:50%;background:linear-gradient(135deg,#e0a36c,#8d4a78);display:grid;place-items:center;font-weight:800;margin-bottom:8px}.rail-btn{width:38px;height:38px;border:0;background:transparent;color:#9c98ad;border-radius:12px;display:grid;place-items:center;cursor:pointer}.rail-btn:hover,.rail-btn.active{background:#8b5cf633;color:#c8a8ff}.rail-spacer{flex:1}
        .list-panel{min-width:0;background:#1b1927;border-right:1px solid #ffffff0c;display:flex;flex-direction:column}.list-head{display:flex;justify-content:space-between;align-items:center;padding:27px 17px 16px}.list-head h1{font-size:15px;margin:0}.list-head h1 span{color:#b58aff}.icon-btn{border:0;background:transparent;color:#ddd5f1;cursor:pointer;padding:7px;border-radius:9px;display:grid;place-items:center}.icon-btn:hover{background:#ffffff16}.searchbox{margin:0 14px 15px;background:#12111b;border:1px solid #ffffff0b;border-radius:10px;padding:10px;display:flex;gap:8px;align-items:center;color:#777487}.searchbox input{min-width:0;width:100%;background:none;border:0;outline:0;color:#fff;font-size:12px}.room-card{margin:0 12px 12px;padding:11px;border-radius:11px;background:#8b5cf61a;border:1px solid #a78bfa30;font-size:11px;color:#d9c9ff}.room-card b{display:block;margin-bottom:4px}.chat-list{overflow:auto;flex:1;padding:0 8px 12px}.chat-item{width:100%;display:flex;align-items:center;gap:10px;padding:11px 9px;border:0;border-radius:12px;background:transparent;color:inherit;text-align:left;cursor:pointer}.chat-item:hover,.chat-item.active{background:#373344}.chat-avatar{width:37px;height:37px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:13px;font-weight:800;flex:none;background:linear-gradient(135deg,#7c6b9b,#b47e8d)}.chat-copy{min-width:0;flex:1}.chat-copy b{display:block;font-size:12px}.chat-copy small{display:block;color:#9691a5;font-size:10px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.list-bottom{padding:13px 14px;border-top:1px solid #ffffff0c;display:flex;align-items:center;gap:8px;color:#a39caf;font-size:10px}.status-dot{width:7px;height:7px;border-radius:50%;background:#f59e0b}.status-dot.on{background:#54d58b}
        .conversation{min-width:0;display:flex;flex-direction:column;background:linear-gradient(145deg,#28204c,#5425a2 35%,#a12fa9 68%,#331d61);position:relative}.topbar{height:82px;flex:none;padding:0 19px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff1b;background:#19152640}.current-person{display:flex;align-items:center;gap:11px;min-width:0}.current-person h2{font-size:14px;margin:0}.current-person p{font-size:10px;color:#d3c5ec;margin:4px 0 0}.top-actions{display:flex;align-items:center;gap:3px}.top-actions button{width:34px;height:34px;border:0;background:transparent;color:#eee6ff;border-radius:10px;display:grid;place-items:center;cursor:pointer}.top-actions button:hover{background:#ffffff20}.messages{flex:1;overflow:auto;padding:20px;display:flex;flex-direction:column;gap:16px}.day-line{display:flex;align-items:center;gap:14px;color:#e0d6f1;font-size:10px;justify-content:center}.day-line:before,.day-line:after{content:"";height:1px;background:#ffffff42;flex:1}.message{display:flex;align-items:flex-end;gap:9px;max-width:85%}.message.mine{align-self:flex-end;flex-direction:row-reverse}.mini-avatar{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#b3a3a1;color:#25202b;font-size:10px;font-weight:800;flex:none}.message-content{min-width:0}.message-meta{display:flex;gap:8px;align-items:center;margin:0 0 5px 2px;font-size:10px;color:#fff}.message-meta time{font-size:9px;color:#e5d7f5a8}.bubble{padding:11px 14px;border-radius:15px 15px 15px 5px;background:#ffffff30;font-size:12px;line-height:1.55;color:#fff;overflow-wrap:anywhere}.message.mine .bubble{background:linear-gradient(130deg,#db6ce0,#b64cc8);border-radius:15px 15px 5px 15px}.message.mine .message-meta{justify-content:flex-end}.bubble img{display:block;max-width:220px;max-height:180px;border-radius:9px;margin-top:6px}.empty-state{margin:auto;text-align:center;color:#f0e8ffb5;font-size:12px;line-height:1.7;max-width:330px}.composer-wrap{padding:0 17px 17px}.composer{display:flex;align-items:center;gap:7px;padding:8px 9px;background:#160e2bdb;border:1px solid #ffffff20;border-radius:14px}.composer button{border:0;background:transparent;color:#f1e8ff;display:grid;place-items:center;cursor:pointer;padding:8px;border-radius:9px}.composer button:hover{background:#ffffff18}.composer input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:white;font-size:12px;padding:9px 2px}.composer input::placeholder{color:#c5b5d5}.send-btn{width:38px;height:38px;border-radius:11px!important;background:linear-gradient(135deg,#a78bfa,#e879f9)!important;color:#24102e!important}.composer button:disabled{opacity:.35;cursor:not-allowed}.attachment-chip{margin:0 0 7px 4px;color:#f0dcff;font-size:10px}.right-panel{background:#1b1927;border-left:1px solid #ffffff0d;display:flex;flex-direction:column;min-width:0;overflow:auto}.detail-head{padding:27px 18px 20px;display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:750}.group-profile{text-align:center;padding:4px 15px 20px}.big-avatar{width:86px;height:86px;border-radius:50%;margin:0 auto 10px;background:linear-gradient(135deg,#e3e5e0,#777e83);color:#292832;display:grid;place-items:center;font-size:28px;font-weight:800}.detail-section{padding:0 18px 18px}.detail-title{display:flex;align-items:center;gap:7px;color:#ddd6e8;font-size:11px;font-weight:700;margin-bottom:10px}.detail-section p{font-size:10px;line-height:1.6;color:#a49eaf;margin:0}.detail-action{width:100%;display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #ffffff12;background:#ffffff08;color:#e8e0f4;border-radius:9px;margin-bottom:7px;cursor:pointer;font-size:11px}.detail-tools{display:flex;gap:8px;padding:0 16px 16px;margin-top:auto}.detail-tools button{flex:1;height:36px;border:1px solid #ffffff12;background:#282537;color:#b9b0ca;border-radius:10px;display:grid;place-items:center;cursor:pointer}.menu-pop{position:absolute;z-index:5;right:16px;top:66px;background:#211d30;border:1px solid #ffffff20;border-radius:12px;padding:7px;box-shadow:0 12px 30px #0008}.menu-pop button{display:flex;gap:8px;align-items:center;width:100%;border:0;background:none;color:#e9e1f5;padding:10px 12px;font-size:11px;cursor:pointer;text-align:left}.toast{position:fixed;z-index:20;bottom:22px;left:50%;transform:translateX(-50%);padding:11px 16px;background:#171421;border:1px solid #b68cff66;border-radius:12px;color:#f4eaff;font-size:12px;box-shadow:0 10px 35px #0008;max-width:90vw}.file-input{display:none}.light .messenger{background:#f7f4fc;color:#302a3a}.light .rail,.light .list-panel,.light .right-panel{background:#f4f0fa;color:#302a3a;border-color:#ded7e9}.light .chat-copy b,.light .detail-head{color:#302a3a}.light .searchbox{background:#e9e3f1}.light .searchbox input{color:#302a3a}.light .chat-item.active{background:#e4d9f4}.light .room-card{color:#5a4384}.light .list-bottom{border-color:#ddd5e8}.light .detail-title{color:#5d536c}.light .detail-section p{color:#766d81}
        @media(max-width:1080px){.messenger{grid-template-columns:58px 220px minmax(0,1fr)}.right-panel{display:none}}
        @media(max-width:700px){.messenger-page{padding:0}.messenger{height:100dvh;min-height:0;border-radius:0;border:0;grid-template-columns:54px minmax(0,1fr)}.rail{padding-top:15px;gap:9px}.list-panel{display:none}.topbar{height:72px;padding:0 10px}.messages{padding:15px 10px}.message{max-width:95%}.composer-wrap{padding:0 8px 10px}.top-actions button:nth-child(1),.top-actions button:nth-child(2){display:none}.mobile-list{display:grid!important}.right-panel.mobile-open{display:flex;position:absolute;z-index:10;right:0;top:0;bottom:0;width:min(290px,85vw);box-shadow:-15px 0 40px #0008}}
      `}</style>
      <section className="messenger">
        <nav className="rail">
          <div className="rail-avatar">A</div>
          <button className="rail-btn mobile-list" title="Sohbet odası" onClick={joinRoom}><Grid2X2 size={17}/></button>
          <button className="rail-btn active" title="Mesajlar"><MessageCircle size={17}/></button>
          <button className="rail-btn" title="Kişi adını değiştir" onClick={changeName}><UserRound size={17}/></button>
          <button className="rail-btn" title="Bildirimleri aç/kapat" onClick={()=>{setNotifications(v=>!v);notify(notifications?"Bildirimler kapatıldı.":"Bildirimler açıldı.");}}><Bell size={17}/></button>
          <button className="rail-btn" title="Ayarlar" onClick={()=>setMenu(v=>!v)}><Settings size={17}/></button>
          <div className="rail-spacer"/>
          <button className="rail-btn" onClick={()=>setDark(v=>!v)} title="Açık/koyu tema">{dark?<Sun size={17}/>:<Moon size={17}/>}</button>
        </nav>
        <aside className="list-panel">
          <div className="list-head"><h1>Mesajlar <span>· {room}</span></h1><button className="icon-btn" onClick={joinRoom} title="Oda oluştur veya katıl"><PencilLine size={17}/></button></div>
          <label className="searchbox"><Search size={15}/><input placeholder="Mesajlarda ara" value={search} onChange={e=>setSearch(e.target.value)}/></label>
          <div className="room-card"><b>Ortak sohbet odası</b>Bu kodu arkadaşlarınla paylaş: <strong>{room}</strong></div>
          <div className="chat-list"><button className="chat-item active" onClick={()=>setSearch("")}><span className="chat-avatar">#</span><span className="chat-copy"><b>{room}</b><small>{onlineCount} kişi çevrimiçi</small></span></button></div>
          <div className="list-bottom"><span className={"status-dot "+(connected?"on":"")}/>{connected?"Canlı bağlantı kuruldu":"Bağlantı bekleniyor"} <WifiOff size={13} style={{marginLeft:"auto"}}/></div>
        </aside>
        <section className="conversation">
          <header className="topbar">
            <div className="current-person"><span className="chat-avatar">#</span><div><h2>{room}</h2><p>{connected?onlineCount+" kişi çevrimiçi":"Canlı bağlantı yok"}</p></div></div>
            <div className="top-actions">
              <button title="Sesli arama" onClick={()=>notify("Sesli arama özelliği henüz etkin değil.")}><Phone size={17}/></button>
              <button title="Görüntülü arama" onClick={()=>notify("Görüntülü arama özelliği henüz etkin değil.")}><Video size={17}/></button>
              <button title="Mesajlarda ara" onClick={()=>setShowSearch(v=>!v)}><Search size={17}/></button>
              <button title="Oda bilgisi" onClick={()=>setDetails(v=>!v)}><Info size={17}/></button>
              <button title="Diğer işlemler" onClick={()=>setMenu(v=>!v)}><Settings size={17}/></button>
            </div>
            {menu&&<div className="menu-pop"><button onClick={changeName}><UserRound size={14}/> Görünen adını değiştir</button><button onClick={invite}><Copy size={14}/> Davet bağlantısını kopyala</button><button onClick={clearRoom}><Trash2 size={14}/> Bu cihazdaki mesajları sil</button><button onClick={()=>{setMenu(false);setDetails(true);}}><Info size={14}/> Oda bilgisi</button></div>}
          </header>
          {showSearch&&<label className="searchbox" style={{margin:"8px 14px 0"}}><Search size={15}/><input autoFocus placeholder="Bu odada mesaj ara..." value={search} onChange={e=>setSearch(e.target.value)}/><button className="icon-btn" onClick={()=>{setShowSearch(false);setSearch("");}}><X size={14}/></button></label>}
          <div className="messages">
            <div className="day-line">Sohbet geçmişi</div>
            {filtered.length===0?<div className="empty-state">{connected?"Henüz mesaj yok. İlk mesajı sen gönder!":"Gerçek zamanlı sohbet için bağlantı ayarı gerekli. Sağdaki oda bilgisine bak."}</div>:filtered.map(m=><div key={m.id} className={"message "+(m.mine?"mine":"")}><span className="mini-avatar">{m.sender.slice(0,1).toLocaleUpperCase("tr")}</span><div className="message-content"><div className="message-meta"><b>{m.mine?"Sen":m.sender}</b><time>{m.time}</time></div><div className="bubble">{m.text}{m.fileName&&<div>📎 {m.fileName}</div>}{m.image&&<img src={m.image} alt={m.fileName||"Paylaşılan görsel"}/>}</div></div></div>)}
            <div ref={bottomRef}/>
          </div>
          <div className="composer-wrap">
            {fileData&&<div className="attachment-chip">📎 {fileData.name} <button className="icon-btn" onClick={()=>setFileData(null)}><X size={12}/></button></div>}
            <form className="composer" onSubmit={e=>{e.preventDefault();void send();}}>
              <button type="button" title="Dosya ekle" onClick={()=>fileRef.current?.click()}><Paperclip size={18}/></button>
              <input ref={fileRef} className="file-input" type="file" accept="image/*,.txt,.pdf" onChange={e=>pickFile(e.target.files?.[0])}/>
              <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Mesajını yaz..." aria-label="Mesaj yaz"/>
              <button type="button" title="Emoji ekle" onClick={()=>setDraft(v=>v+" 😊")}><Smile size={18}/></button>
              <button type="button" title="Sesle yaz" onClick={startVoiceInput}><Mic size={18}/></button>
              <button className="send-btn" type="submit" disabled={!draft.trim()&&!fileData} aria-label="Gönder"><Send size={17}/></button>
            </form>
          </div>
        </section>
        <aside className={"right-panel "+(details?"mobile-open":"")}>
          <div className="detail-head"><span>Oda bilgisi</span><button className="icon-btn" onClick={()=>setDetails(false)} title="Kapat"><X size={16}/></button></div>
          <div className="group-profile"><div className="big-avatar">#</div><b>{room}</b></div>
          <div className="detail-section"><div className="detail-title"><Info size={13}/> Gerçek zamanlı sohbet</div><p>Bu odaya aynı kodla katılan kişiler, Supabase bağlantısı açıkken mesajları anında görür. Sohbet kodunu arkadaşlarınla paylaş.</p></div>
          <div className="detail-section"><div className="detail-title"><Users size={13}/> Bağlantı durumu</div><p>{connected?"Canlı sunucuya bağlandın.":"Sunucu bağlantısı kurulamadı."} {onlineCount} kişi çevrimiçi görünüyor.</p></div>
          <div className="detail-section"><button className="detail-action" onClick={invite}><Link2 size={15}/> Davet bağlantısını kopyala</button><button className="detail-action" onClick={joinRoom}><Plus size={15}/> Başka odaya katıl / oda oluştur</button><button className="detail-action" onClick={changeName}><UserRound size={15}/> Görünen adını değiştir</button></div>
          <div className="detail-tools"><button title="Bildirimleri aç/kapat" onClick={()=>setNotifications(v=>!v)}>{notifications?<Bell size={15}/>:<Bell size={15}/>}</button><button title="Davet et" onClick={invite}><Users size={15}/></button><button title="Tema değiştir" onClick={()=>setDark(v=>!v)}>{dark?<Sun size={15}/>:<Moon size={15}/>}</button><button title="Kapat" onClick={()=>setDetails(false)}><LogOut size={15}/></button></div>
        </aside>
      </section>
      {toast&&<div className="toast" role="status">{toast}</div>}
    </main>
  );
}
