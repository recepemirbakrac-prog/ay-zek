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
function readSavedRooms(): Record<string, ChatMessage[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => Array.isArray(value))) as Record<string, ChatMessage[]>;
  } catch { return {}; }
}
function saveSavedRooms(rooms: Record<string, ChatMessage[]>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms)); } catch (error) { console.warn("Sohbet geçmişi kaydedilemedi:", error); }
}
const makeId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
const clock = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

function ChatRoom({ initialName }: { initialName: string }) {
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
  const [currentUserId, setCurrentUserId] = useState("");
  const [users, setUsers] = useState<{user_id:string;username:string}[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<{user_id:string;username:string}|null>(null);
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([]);

  const channelRef = useRef<any>(null);
  const [callStatus,setCallStatus] = useState<"idle"|"calling"|"incoming"|"active">("idle");
  const [callKind,setCallKind] = useState(false);
  const [incomingOffer,setIncomingOffer] = useState<any>(null);
  const [caller,setCaller] = useState("");
  const [callError,setCallError] = useState("");
  const callRef = useRef<any>(null);
  const peerRef = useRef<RTCPeerConnection|null>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const notify = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2800);
  }, []);

  useEffect(() => {
    try {
      setName(initialName || localStorage.getItem(NAME_KEY) || "Misafir");
      const inviteRoom = new URLSearchParams(window.location.search).get("oda");
      setRoom(inviteRoom?.trim() || "genel"); // Davet bağlantısı olmadan herkes otomatik ortak lobiye katılır.
      const data = readSavedRooms();
      setMessages(Array.isArray(data["genel"]) ? data["genel"] : []);
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
    const all = readSavedRooms();
    if (loadedRoom !== room) return;
    all[room] = messages.slice(-250);
    saveSavedRooms(all);
  }, [messages, room, ready, loadedRoom]);

  useEffect(() => {
    if (!ready) return;
    const all = readSavedRooms();
    setMessages(Array.isArray(all[room]) ? all[room] : []);
    setLoadedRoom(room);
  }, [room, ready]);


  useEffect(() => {
    if (!ready) return;
    const db = getRealtimeClient();
    if (!db) return;
    let alive = true;
    const load = async () => {
      const {data:{user}} = await db.auth.getUser();
      if (!alive || !user) return;
      setCurrentUserId(user.id);
      const {data,error} = await db.from("profiles").select("user_id,username").neq("user_id",user.id).order("username").limit(100);
      if (!alive) return;
      if (error) { notify("Kullanıcılar yüklenemedi: "+error.message); return; }
      setUsers(data || []);
    };
    void load();
    return () => { alive = false; };
  }, [ready, notify]);

  useEffect(() => {
    if (!ready || !selectedUser || !currentUserId) { setDirectMessages([]); return; }
    const db = getRealtimeClient();
    if (!db) return;
    let alive = true;
    const pair = (query:any) => query.or("and(sender_id.eq."+currentUserId+",recipient_id.eq."+selectedUser.user_id+"),and(sender_id.eq."+selectedUser.user_id+",recipient_id.eq."+currentUserId+")");
    const load = async () => {
      const {data,error} = await pair(db.from("direct_messages").select("id,sender_id,recipient_id,body,created_at")).order("created_at",{ascending:true}).limit(250);
      if (!alive) return;
      if (error) { notify("Özel mesajlar yüklenemedi: "+error.message); return; }
      setDirectMessages((data||[]).map((row:any)=>({id:row.id,sender:row.sender_id===currentUserId?"Sen":selectedUser.username,text:row.body,time:new Date(row.created_at).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}),mine:row.sender_id===currentUserId})));
    };
    void load();
    const channel=db.channel("ayzek-dm-"+[currentUserId,selectedUser.user_id].sort().join("-"));
    channel.on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages"},({new:row}:any)=>{
      if(!alive || !row?.id || ![currentUserId,selectedUser.user_id].includes(row.sender_id) || ![currentUserId,selectedUser.user_id].includes(row.recipient_id)) return;
      setDirectMessages(prev=>prev.some(m=>m.id===row.id)?prev:[...prev,{id:row.id,sender:row.sender_id===currentUserId?"Sen":selectedUser.username,text:row.body,time:new Date(row.created_at).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}),mine:row.sender_id===currentUserId}]);
    }).subscribe();
    return ()=>{alive=false;void db.removeChannel(channel);};
  },[ready,selectedUser,currentUserId,notify]);

  useEffect(() => {
    if (!ready) return;
    const supabase = getRealtimeClient();
    if (!supabase) { setConnected(false); return; }
    let alive = true;
    const channel = supabase.channel("ayzek-room-" + room, {
      config: { broadcast: { self: false }, presence: { key: makeId() } },
    });
    const loadHistory = async () => {
      const { data, error } = await supabase.from("chat_messages")
        .select("id, sender, body, file_name, image_data, created_at")
        .eq("room_code", room).order("created_at", { ascending: true }).limit(250);
      if (!alive) return;
      if (error) { notify("Mesaj geçmişi yüklenemedi: " + error.message); return; }
      setMessages((data || []).map((row: any) => ({
        id: row.id, sender: row.sender, text: row.body || "",
        time: new Date(row.created_at).toLocaleTimeString("tr-TR", {hour:"2-digit",minute:"2-digit"}),
        mine: row.sender === name, fileName: row.file_name || undefined, image: row.image_data || undefined,
      })));
    };
    void loadHistory();
    channel.on("postgres_changes", {
      event: "INSERT", schema: "public", table: "chat_messages", filter: "room_code=eq." + room,
    }, ({ new: row }: { new: any }) => {
      if (!alive || !row?.id) return;
      const message: ChatMessage = {
        id: row.id, sender: row.sender, text: row.body || "",
        time: new Date(row.created_at).toLocaleTimeString("tr-TR", {hour:"2-digit",minute:"2-digit"}),
        mine: row.sender === name, fileName: row.file_name || undefined, image: row.image_data || undefined,
      };
      setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message].slice(-250));
    });
    channel.on("presence", { event: "sync" }, () => {
      if (alive) setOnlineCount(Object.keys(channel.presenceState()).length);
    }).subscribe(async (status: string) => {
      if (!alive) return;
      setConnected(status === "SUBSCRIBED");
      if (status === "SUBSCRIBED") await channel.track({ name, online_at: new Date().toISOString() });
    });
    channelRef.current = channel;
    return () => {
      alive = false; setConnected(false); channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [room, name, ready, notify]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const endCall = async (signal=true) => {
    if(signal) await callRef.current?.send({type:"broadcast",event:"hangup",payload:{user:(await getRealtimeClient()?.auth.getUser())?.data.user?.id}});
    peerRef.current?.close();peerRef.current=null;
    streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;
    setCallStatus("idle");setIncomingOffer(null);
  };
  const createPeer = async (video:boolean) => {
    const stream=await navigator.mediaDevices.getUserMedia({audio:true,video});
    streamRef.current=stream;if(localRef.current)localRef.current.srcObject=stream;
    const pc=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});
    peerRef.current=pc;stream.getTracks().forEach(t=>pc.addTrack(t,stream));
    pc.ontrack=e=>{if(remoteRef.current)remoteRef.current.srcObject=e.streams[0];};
    pc.onicecandidate=e=>{if(e.candidate)void callRef.current?.send({type:"broadcast",event:"ice",payload:{candidate:e.candidate}});};
    pc.onconnectionstatechange=()=>{if(pc.connectionState==="connected")setCallStatus("active");if(pc.connectionState==="failed")setCallError("Arama bağlantısı kurulamadı.");};
    return pc;
  };
  const beginCall = async (video:boolean) => {
    if(!connected){notify("Arama için önce odaya bağlan.");return;}
    try{
      setCallKind(video);setCallStatus("calling");setCallError("");
      const pc=await createPeer(video);const offer=await pc.createOffer();await pc.setLocalDescription(offer);
      await callRef.current?.send({type:"broadcast",event:"offer",payload:{offer,video,caller:name}});
    }catch(e:any){setCallError(e.message||"Mikrofon/kamera izni gerekli.");setCallStatus("idle");}
  };
  const answerCall = async () => {
    try{
      if(!incomingOffer)return;
      const pc=await createPeer(callKind);await pc.setRemoteDescription(incomingOffer);
      const answer=await pc.createAnswer();await pc.setLocalDescription(answer);
      await callRef.current?.send({type:"broadcast",event:"answer",payload:{answer}});
      setCallStatus("active");
    }catch(e:any){setCallError(e.message||"Aramaya katılınamadı.");}
  };
  useEffect(()=>{
    const handler=(event:any)=>void beginCall(!!event.detail?.video);
    window.addEventListener("ayzek-call",handler);
    return ()=>window.removeEventListener("ayzek-call",handler);
  },[connected,room]);
  useEffect(()=>{
    if(!ready)return;
    const supabase=getRealtimeClient();if(!supabase)return;
    const channel=supabase.channel("ayzek-call-"+room,{config:{broadcast:{self:false}}});
    channel.on("broadcast",{event:"offer"},({payload}:any)=>{
      setIncomingOffer(payload.offer);setCallKind(!!payload.video);setCaller(payload.caller||"Kullanıcı");setCallStatus("incoming");
    }).on("broadcast",{event:"answer"},async({payload}:any)=>{
      if(peerRef.current&&payload.answer){await peerRef.current.setRemoteDescription(payload.answer);setCallStatus("active");}
    }).on("broadcast",{event:"ice"},async({payload}:any)=>{
      if(peerRef.current&&payload.candidate){try{await peerRef.current.addIceCandidate(payload.candidate);}catch{}}
    }).on("broadcast",{event:"hangup"},()=>void endCall(false)).subscribe();
    callRef.current=channel;
    return ()=>{void supabase.removeChannel(channel);void endCall(false);};
  },[room,ready]);
  const send = async () => {
    const text = draft.trim();
    if (!text && !fileData) return;
    const supabase = getRealtimeClient();
    if (!supabase) { notify("Mesaj servisine bağlanılamadı."); return; }
    if (selectedUser) {
      if (!currentUserId) { notify("Kullanıcı oturumu bulunamadı."); return; }
      const {error} = await supabase.from("direct_messages").insert({sender_id:currentUserId,recipient_id:selectedUser.user_id,body:text});
      if (error) { notify("Özel mesaj gönderilemedi: "+error.message); return; }
      setDraft("");
      return;
    }
    if (!connected) { notify("Canlı sohbet bağlantısı yok. Biraz sonra tekrar dene."); return; }
    const id = makeId();
    const optimistic: ChatMessage = {
      id, sender: name, text, time: clock(), mine: true,
      ...(fileData?.image ? { image: fileData.image } : {}),
      ...(fileData?.name ? { fileName: fileData.name } : {}),
    };
    setMessages(prev => [...prev, optimistic].slice(-250));
    setDraft(""); setFileData(null);
    const { error } = await supabase.from("chat_messages").insert({
      id, room_code: room, sender: name, sender_id: (await supabase.auth.getUser()).data.user?.id, body: text,
      file_name: optimistic.fileName || null, image_data: optimistic.image || null,
    });
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== id));
      notify("Mesaj gönderilemedi: " + error.message);
    }
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

  const activeMessages = selectedUser ? directMessages : messages;
  const filtered = activeMessages.filter(m => !search || (m.text + " " + m.sender).toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")));
  const visibleUsers = users.filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase()));

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
        .messenger-page{background:radial-gradient(ellipse at 52% 40%,#8137c855 0,transparent 38%),radial-gradient(ellipse at 12% 90%,#9c36dc66 0,transparent 30%),linear-gradient(135deg,#090810,#171321 55%,#08070d);padding:clamp(12px,4vw,56px)}
        .messenger{width:min(1450px,100%);height:min(900px,calc(100dvh - 64px));min-height:600px;grid-template-columns:290px minmax(0,1fr) 285px;border-radius:26px;background:linear-gradient(135deg,#ffffff19,#ffffff08);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);border:1px solid #ffffff35;box-shadow:0 35px 110px #000b,inset 0 1px #ffffff30;position:relative}
        .rail{display:none}.list-panel{background:linear-gradient(180deg,#ffffff12,#ffffff06);border-right:1px solid #ffffff22;padding-top:12px}
        .list-head{padding:25px 22px 20px}.list-head h1{font-size:23px;font-weight:750;letter-spacing:-.7px}.list-head h1 span{display:block;font-size:11px;font-weight:500;letter-spacing:1px;margin-top:5px;color:#c7a5ff}
        .searchbox{margin:0 18px 20px;padding:13px 14px;background:#0d0b1499;border:1px solid #ffffff28;border-radius:13px;color:#c5b6dc}.searchbox input{font-size:13px}
        .room-card{margin:0 18px 18px;padding:14px 15px;border-radius:14px;background:linear-gradient(120deg,#8b5cf62c,#d946ef18);border:1px solid #d8b4fe45;font-size:11px;line-height:1.6}
        .chat-list{padding:0 10px 15px}.chat-item{padding:14px 12px;border-radius:13px;gap:12px}.chat-item.active,.chat-item:hover{background:#ffffff17;box-shadow:inset 0 0 0 1px #ffffff12}.chat-avatar{width:43px;height:43px;border-radius:50%;background:linear-gradient(140deg,#f0a4c7,#8156c9);box-shadow:0 4px 18px #0003}.chat-copy b{font-size:13px}.chat-copy small{font-size:11px}
        .list-bottom{padding:17px 20px;font-size:11px;background:#09081133}
        .conversation{background:linear-gradient(145deg,#191523a8,#3020449c 45%,#281638a8);backdrop-filter:blur(20px)}
        .topbar{height:78px;padding:0 24px;background:#ffffff0b;border-bottom:1px solid #ffffff22}.current-person h2{font-size:16px}.current-person p{font-size:11px}
        .top-actions{gap:9px}.top-actions button{width:39px;height:39px;color:#d946ef;background:#ffffff0b;border:1px solid #ffffff0d;border-radius:12px}.top-actions button:hover{background:#b832d833;color:#fff}
        .messages{padding:25px 26px;gap:19px;background:radial-gradient(ellipse at 50% 45%,#a855f71b,transparent 65%)}
        .day-line{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#d7c6ed}.message{max-width:78%;gap:11px}.mini-avatar{width:34px;height:34px;border:1px solid #ffffff40;background:linear-gradient(140deg,#f0a4c7,#8052b5);color:#26152e}
        .bubble{padding:13px 16px;border-radius:16px 16px 16px 5px;background:#ffffff18;border:1px solid #ffffff13;backdrop-filter:blur(12px);font-size:13px;line-height:1.6;box-shadow:0 8px 24px #0002}
        .message.mine .bubble{background:linear-gradient(120deg,#9d18d8,#c026d3);border:1px solid #e879f988;border-radius:16px 16px 5px 16px;box-shadow:0 8px 25px #a21caf44}
        .message-meta{font-size:11px}.message-meta time{font-size:10px;color:#eadcf5b8}
        .composer-wrap{padding:0 24px 22px}.composer{padding:9px 12px;background:#0c0a14a8;border:1px solid #ffffff35;border-radius:17px;box-shadow:0 12px 35px #0003}.composer input{font-size:13px}.composer button{color:#d879f5}.send-btn{background:linear-gradient(135deg,#a855f7,#d946ef)!important;color:white!important;border-radius:50%!important;width:42px;height:42px}
        .right-panel{background:linear-gradient(180deg,#ffffff10,#ffffff05);border-left:1px solid #ffffff22}.detail-head{padding:26px 22px;font-size:14px}
        .group-profile{padding:12px 15px 25px}.big-avatar{width:104px;height:104px;border:3px solid #ffffff30;box-shadow:0 10px 35px #0004;background:linear-gradient(140deg,#f0a4c7,#8156c9);font-size:35px}
        .group-profile b{font-size:17px}.detail-section{margin:0 17px 18px;padding:15px;border-radius:14px;background:#ffffff0b;border:1px solid #ffffff15}.detail-title{font-size:12px;color:#e9d5ff}.detail-section p{font-size:11px;line-height:1.7;color:#c5bad3}
        .detail-action{padding:11px 9px;font-size:11px;border-radius:10px}.detail-action:hover{background:#ffffff12}.detail-tools{padding:17px;border-top:1px solid #ffffff1a}.detail-tools button{background:#ffffff12;border:1px solid #ffffff12;border-radius:11px}
        .menu-pop{background:#21182c;border:1px solid #ffffff2b;backdrop-filter:blur(18px)}.toast{background:#21182c;border:1px solid #d8b4fe66}
        @media(max-width:1080px){.messenger{grid-template-columns:260px minmax(0,1fr)}.right-panel{display:none}}
        @media(max-width:700px){.messenger-page{padding:0}.messenger{height:100dvh;min-height:0;border-radius:0;grid-template-columns:minmax(0,1fr)}.list-panel{display:none}.conversation{grid-column:1}.topbar{padding:0 13px}.messages{padding:15px 12px}.composer-wrap{padding:0 10px 12px}.right-panel.mobile-open{display:flex;position:absolute;z-index:10;right:0;top:0;bottom:0;width:min(300px,88vw);box-shadow:-15px 0 40px #0008}}
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
          <div className="room-card"><b>🌍 Herkese açık sohbet</b>Davet gerekmez. Hesabıyla giriş yapan herkes otomatik olarak <strong>genel</strong> odasına katılır.</div>
          <div style={{padding:"2px 14px 8px",fontSize:11,color:"#c9b6e8",fontWeight:700}}>KULLANICILAR · {users.length}</div>
          <label className="searchbox"><Search size={15}/><input placeholder="Kullanıcı ara..." value={userSearch} onChange={e=>setUserSearch(e.target.value)}/></label>
          <div className="chat-list">
            <button className={"chat-item "+(!selectedUser?"active":"")} onClick={()=>setSelectedUser(null)}><span className="chat-avatar">#</span><span className="chat-copy"><b>Genel sohbet</b><small>{onlineCount} kişi çevrimiçi</small></span></button>
            {visibleUsers.map(u=><button key={u.user_id} className={"chat-item "+(selectedUser?.user_id===u.user_id?"active":"")} onClick={()=>{setSelectedUser(u);setSearch("");setDetails(false);}}><span className="chat-avatar">{u.username.slice(0,1).toUpperCase()}</span><span className="chat-copy"><b>@{u.username}</b><small>Özel mesaj gönder</small></span></button>)}
            {visibleUsers.length===0&&<div style={{padding:12,color:"#aaa",fontSize:11}}>Kullanıcı bulunamadı.</div>}
          </div>
          <div className="list-bottom"><span className={"status-dot "+(connected?"on":"")}/>{connected?"Canlı bağlantı kuruldu":"Bağlantı bekleniyor"} <WifiOff size={13} style={{marginLeft:"auto"}}/></div>
        </aside>
        <section className="conversation">
          <header className="topbar">
            <div className="current-person"><span className="chat-avatar">#</span><div><h2>{selectedUser?"@"+selectedUser.username:room}</h2><p>{selectedUser?"Özel sohbet":connected?onlineCount+" kişi çevrimiçi":"Canlı bağlantı yok"}</p></div></div>
            <div className="top-actions">
              <button title="Sesli arama" onClick={()=>window.dispatchEvent(new CustomEvent("ayzek-call",{detail:{video:false}}))}><Phone size={17}/></button>
              <button title="Görüntülü arama" onClick={()=>window.dispatchEvent(new CustomEvent("ayzek-call",{detail:{video:true}}))}><Video size={17}/></button>
              <button title="Mesajlarda ara" onClick={()=>setShowSearch(v=>!v)}><Search size={17}/></button>
              <button title="Oda bilgisi" onClick={()=>setDetails(v=>!v)}><Info size={17}/></button>
              <button title="Diğer işlemler" onClick={()=>setMenu(v=>!v)}><Settings size={17}/></button>
            </div>
            {menu&&<div className="menu-pop"><button onClick={changeName}><UserRound size={14}/> Görünen adını değiştir</button><button onClick={invite}><Copy size={14}/> Davet bağlantısını kopyala</button><button onClick={clearRoom}><Trash2 size={14}/> Bu cihazdaki mesajları sil</button><button onClick={()=>{setMenu(false);setDetails(true);}}><Info size={14}/> Oda bilgisi</button></div>}
          </header>
          {showSearch&&<label className="searchbox" style={{margin:"8px 14px 0"}}><Search size={15}/><input autoFocus placeholder="Bu odada mesaj ara..." value={search} onChange={e=>setSearch(e.target.value)}/><button className="icon-btn" onClick={()=>{setShowSearch(false);setSearch("");}}><X size={14}/></button></label>}
          {callStatus!=="idle"&&<div style={{padding:12,background:"#171326",color:"white",display:"grid",gap:8}}>
            <b>{callStatus==="incoming"?caller+" arıyor":callStatus==="calling"?"Aranıyor…":"Görüşme devam ediyor"}</b>
            {callError&&<span>{callError}</span>}
            <div style={{display:"flex",gap:8}}><video ref={remoteRef} autoPlay playsInline style={{width:180,maxWidth:"48%",background:"#090811"}}/><video ref={localRef} autoPlay muted playsInline style={{width:120,maxWidth:"35%",background:"#090811"}}/></div>
            {callStatus==="incoming"&&<button onClick={()=>void answerCall()}>Aramayı kabul et</button>}
            <button onClick={()=>void endCall()}>Aramayı bitir</button>
          </div>}
          <div className="messages">
            <div className="day-line">{selectedUser?"Özel sohbet":"Genel sohbet geçmişi"}</div>
            {filtered.length===0?<div className="empty-state">{connected?"Henüz mesaj yok. İlk mesajı sen gönder!":"Gerçek zamanlı sohbet için bağlantı ayarı gerekli. Sağdaki oda bilgisine bak."}</div>:filtered.map(m=><div key={m.id} className={"message "+(m.mine?"mine":"")}><span className="mini-avatar">{m.sender.slice(0,1).toLocaleUpperCase("tr")}</span><div className="message-content"><div className="message-meta"><b>{m.mine?"Sen":m.sender}</b><time>{m.time}</time></div><div className="bubble">{m.text}{m.fileName&&<div>📎 {m.fileName}</div>}{m.image&&<img src={m.image} alt={m.fileName||"Paylaşılan görsel"}/>}</div></div></div>)}
            <div ref={bottomRef}/>
          </div>
          <div className="composer-wrap">
            {fileData&&<div className="attachment-chip">📎 {fileData.name} <button className="icon-btn" onClick={()=>setFileData(null)}><X size={12}/></button></div>}
            <form className="composer" onSubmit={e=>{e.preventDefault();void send();}}>
              <button type="button" title="Dosya ekle" onClick={()=>fileRef.current?.click()}><Paperclip size={18}/></button>
              <input ref={fileRef} className="file-input" type="file" accept="image/*,.txt,.pdf" onChange={e=>pickFile(e.target.files?.[0])}/>
              <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={selectedUser?"@"+selectedUser.username+" kişisine özel mesaj yaz...":"Mesajını yaz..."} aria-label="Mesaj yaz"/>
              <button type="button" title="Emoji ekle" onClick={()=>setDraft(v=>v+" 😊")}><Smile size={18}/></button>
              <button type="button" title="Sesle yaz" onClick={startVoiceInput}><Mic size={18}/></button>
              <button className="send-btn" type="submit" disabled={!draft.trim()&&!fileData} aria-label="Gönder"><Send size={17}/></button>
            </form>
          </div>
        </section>
        <aside className={"right-panel "+(details?"mobile-open":"")}>
          <div className="detail-head"><span>Oda bilgisi</span><button className="icon-btn" onClick={()=>setDetails(false)} title="Kapat"><X size={16}/></button></div>
          <div className="group-profile"><div className="big-avatar">#</div><b>{room}</b></div>
          <div className="detail-section"><div className="detail-title"><Info size={13}/> Gerçek zamanlı sohbet</div><p>Genel sohbet odasına giriş yapan herkes birbirinin mesajlarını anında görür. Davetiye veya oda kodu göndermene gerek yok.</p></div>
          <div className="detail-section"><div className="detail-title"><Users size={13}/> Bağlantı durumu</div><p>{connected?"Canlı sunucuya bağlandın.":"Sunucu bağlantısı kurulamadı."} {onlineCount} kişi çevrimiçi görünüyor.</p></div>
          <div className="detail-section"><button className="detail-action" onClick={invite}><Link2 size={15}/> Davet bağlantısını kopyala</button><button className="detail-action" onClick={joinRoom}><Plus size={15}/> Başka odaya katıl / oda oluştur</button><button className="detail-action" onClick={changeName}><UserRound size={15}/> Görünen adını değiştir</button></div>
          <div className="detail-tools"><button title="Bildirimleri aç/kapat" onClick={()=>setNotifications(v=>!v)}>{notifications?<Bell size={15}/>:<Bell size={15}/>}</button><button title="Davet et" onClick={invite}><Users size={15}/></button><button title="Tema değiştir" onClick={()=>setDark(v=>!v)}>{dark?<Sun size={15}/>:<Moon size={15}/>}</button><button title="Kapat" onClick={()=>setDetails(false)}><LogOut size={15}/></button></div>
        </aside>
      </section>
      {toast&&<div className="toast" role="status">{toast}</div>}
    </main>
  );
}


export default function OfflineChatPage() {
  const [supabase] = useState(()=>{ try { return getRealtimeClient(); } catch (error) { console.error("Ay Zek Supabase başlatılamadı:", error); return null; } });
  const [session,setSession] = useState<any>(null);
  const [loading,setLoading] = useState(true);
  const [mode,setMode] = useState<"login"|"signup">("login");
  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);

  useEffect(()=>{
    if(!supabase){setLoading(false);setError("Supabase bağlantısı bulunamadı.");return;}
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false);}).catch((error)=>{console.error("Oturum yüklenemedi:",error);setError("Oturum yüklenemedi. Sayfayı yenileyip tekrar dene.");setLoading(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[supabase]);

  const submit=async()=>{
    if(!supabase||busy)return;
    const clean=username.trim().toLowerCase();
    if(!/^[a-z0-9_]{3,20}$/.test(clean)){setError("Kullanıcı adı 3-20 karakter olmalı; harf, rakam ve _ kullan.");return;}
    if(password.length<8){setError("Şifre en az 8 karakter olmalı.");return;}
    setBusy(true);setError("");
    try {
      if(mode==="signup"){
        const response=await fetch("https://rogjptnkmauzywdhaxtu.supabase.co/functions/v1/username-auth",{
          method:"POST",
          headers:{"Content-Type":"application/json","apikey":process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""},
          body:JSON.stringify({username:clean,password})
        });
        const payload=await response.json();
        if(!response.ok)throw new Error(payload.error||"Hesap oluşturulamadı.");
      }
      const {data,error:loginError}=await supabase.auth.signInWithPassword({
        email:clean+"@username.ayzek.invalid",password
      });
      if(loginError)throw new Error(mode==="login"?"Kullanıcı adı veya şifre hatalı.":loginError.message);
      setSession(data.session);
      localStorage.setItem(NAME_KEY,clean);
    } catch(e:any) {
      setError(e?.message||"Bir hata oluştu.");
    } finally {setBusy(false);}
  };

  const logout=async()=>{await supabase?.auth.signOut();setSession(null);};

  if(loading)return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#24232d",color:"white"}}>Ay Zek yükleniyor…</main>;
  if(!session)return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"32px 18px",background:"radial-gradient(circle at 12% 15%,#563b87 0,transparent 34%),radial-gradient(circle at 88% 82%,#8d347f 0,transparent 30%),linear-gradient(135deg,#100e1b,#211833 55%,#171322)",fontFamily:"Inter,system-ui,sans-serif",color:"#fff",overflow:"hidden"}}>
    <section style={{width:"min(980px,100%)",minHeight:570,display:"grid",gridTemplateColumns:"1.05fr .95fr",borderRadius:30,overflow:"hidden",background:"#1b1728eF",border:"1px solid #ffffff20",boxShadow:"0 35px 100px #08051199",backdropFilter:"blur(18px)"}}>
      <div style={{padding:"clamp(28px,5vw,58px)",display:"flex",flexDirection:"column",justifyContent:"space-between",background:"linear-gradient(150deg,#7044b5 0%,#44276f 48%,#271c45 100%)",position:"relative",isolation:"isolate"}}>
        <div style={{position:"absolute",width:270,height:270,borderRadius:"50%",border:"1px solid #ffffff20",right:-110,top:100,zIndex:-1}}/>
        <div style={{position:"absolute",width:190,height:190,borderRadius:"50%",background:"#e879f933",filter:"blur(35px)",left:-80,bottom:20,zIndex:-1}}/>
        <div>
          <div style={{width:54,height:54,borderRadius:17,display:"grid",placeItems:"center",background:"linear-gradient(135deg,#fff,#e7caff)",color:"#61358c",fontSize:25,fontWeight:900,boxShadow:"0 8px 30px #170b3355"}}>A</div>
          <div style={{marginTop:52,fontSize:12,fontWeight:800,letterSpacing:3,color:"#e7d7ff"}}>AY ZEK • MESAJLAŞMA</div>
          <h1 style={{fontSize:"clamp(34px,5vw,54px)",lineHeight:1.04,letterSpacing:-2,margin:"15px 0 16px",fontWeight:850}}>Sohbetin<br/>yeni <span style={{color:"#f5b7f2"}}>hali.</span></h1>
          <p style={{maxWidth:350,color:"#e4d8f5",fontSize:15,lineHeight:1.8,margin:0}}>Arkadaşlarınla aynı odada buluş, mesajlarını paylaş ve bağlantıda kal.</p>
        </div>
        <div style={{display:"grid",gap:13,marginTop:45}}>
          {[[ "✦","Canlı sohbet odaları" ],[ "⌁","Sesli ve görüntülü görüşme" ],[ "◈","Kullanıcı adıyla kolay giriş" ]].map(([symbol,label])=><div key={label} style={{display:"flex",alignItems:"center",gap:12,color:"#f3eaff",fontSize:13}}><span style={{width:30,height:30,borderRadius:10,display:"grid",placeItems:"center",background:"#ffffff20",fontSize:16}}>{symbol}</span>{label}</div>)}
        </div>
        <div style={{fontSize:11,color:"#d4c1eb",marginTop:35}}>Ay Zek ile sohbet etmek çok kolay.</div>
      </div>
      <div style={{padding:"clamp(26px,4vw,48px)",display:"flex",flexDirection:"column",justifyContent:"center",background:"linear-gradient(160deg,#211b30,#171421)"}}>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:"#c39aff",marginBottom:12}}>HOŞ GELDİN</div>
        <h2 style={{fontSize:29,letterSpacing:-.8,margin:"0 0 9px"}}>{mode==="login"?"Hesabına giriş yap":"Aramıza katıl"}</h2>
        <p style={{color:"#aaa1ba",fontSize:13,lineHeight:1.6,margin:"0 0 25px"}}>{mode==="login"?"Sohbetlerine kaldığın yerden devam et.":"Ücretsiz hesabını oluştur, sohbete hemen başla."}</p>
        <div style={{display:"flex",gap:7,padding:5,borderRadius:13,background:"#100e18",marginBottom:23}}>
          <button onClick={()=>{setMode("login");setError("");}} style={{flex:1,padding:11,border:0,borderRadius:9,background:mode==="login"?"linear-gradient(110deg,#8b5cf6,#a855f7)":"transparent",color:"white",fontWeight:700,cursor:"pointer"}}>Giriş yap</button>
          <button onClick={()=>{setMode("signup");setError("");}} style={{flex:1,padding:11,border:0,borderRadius:9,background:mode==="signup"?"linear-gradient(110deg,#8b5cf6,#a855f7)":"transparent",color:"white",fontWeight:700,cursor:"pointer"}}>Kayıt ol</button>
        </div>
        <label style={{display:"block",fontSize:12,fontWeight:650,color:"#e5def0",marginBottom:8}}>Kullanıcı adı</label>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 13px",marginBottom:17,borderRadius:12,border:"1px solid #ffffff20",background:"#100e18"}}>
          <span style={{color:"#9d83c4",fontSize:17}}>@</span><input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="ör. emir_123" style={{width:"100%",padding:"15px 0",border:0,outline:0,background:"transparent",color:"white",fontSize:14}}/>
        </div>
        <label style={{display:"block",fontSize:12,fontWeight:650,color:"#e5def0",marginBottom:8}}>Şifre</label>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 13px",marginBottom:17,borderRadius:12,border:"1px solid #ffffff20",background:"#100e18"}}>
          <span style={{color:"#9d83c4",fontSize:17}}>✳</span><input type="password" autoComplete={mode==="signup"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void submit();}} placeholder="En az 8 karakter" style={{width:"100%",padding:"15px 0",border:0,outline:0,background:"transparent",color:"white",fontSize:14}}/>
        </div>
        <button disabled={busy} onClick={()=>void submit()} style={{width:"100%",padding:15,border:0,borderRadius:12,background:"linear-gradient(110deg,#9563ed,#d45acb)",color:"white",fontWeight:800,fontSize:14,boxShadow:"0 10px 25px #8b5cf633",cursor:"pointer",opacity:busy ? 0.7 : 1}}>{busy?"Lütfen bekle…":mode==="login"?"Sohbete giriş yap":"Hesabımı oluştur"} <span style={{marginLeft:5}}>→</span></button>
        {error&&<p role="alert" style={{color:"#ffb8ca",fontSize:12,lineHeight:1.5,margin:"14px 0 0"}}>{error}</p>}
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:22,color:"#8f879f",fontSize:11}}><span style={{color:"#7ee0ad"}}>●</span> E-posta gerekmez · Kullanıcı adıyla giriş</div>
        <p style={{fontSize:11,color:"#81798f",lineHeight:1.6,margin:"14px 0 0"}}>Kullanıcı adı 3-20 karakter olmalı. Şifre en az 8 karakter olmalı.</p>
      </div>
    </section>
    <style jsx>{`@media(max-width:720px){section{grid-template-columns:1fr!important;min-height:0!important}section>div:first-child{padding:26px!important}section>div:first-child>div:nth-last-child(1){display:none}section>div:first-child h1{font-size:38px!important;margin-top:10px!important}section>div:first-child>div:nth-child(2){margin-top:22px!important}section>div:last-child{padding:27px!important}}`}</style>
  </main>;
  return <><ChatRoom initialName={session.user?.user_metadata?.username || session.user?.email?.split("@")[0] || "Kullanıcı"}/><button onClick={()=>void logout()} style={{position:"fixed",right:16,bottom:16,zIndex:50,padding:"10px 14px",borderRadius:10,border:0,background:"#382a52",color:"white"}}>Çıkış yap</button></>;
}
