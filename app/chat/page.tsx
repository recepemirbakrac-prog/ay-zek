"use client";
import {useChat} from "@ai-sdk/react";
import {DefaultChatTransport} from "ai";
import {useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowUp,Sparkles,User} from "lucide-react";
export default function ChatPage(){
 const [input,setInput]=useState("");
 const {messages,sendMessage,status,error}=useChat({transport:new DefaultChatTransport({api:"/api/chat"})});
 const busy=status==="submitted"||status==="streaming";
 const send=(s:string)=>{if(!s.trim()||busy)return;sendMessage({text:s.trim()});setInput("");};
 return <main className="chatShell"><header className="chatHeader"><Link href="/" className="back"><ArrowLeft size={17}/> Stüdyoya dön</Link><div><Sparkles size={20}/><b>Ay Zek</b><small>AI Asistanı</small></div></header><section className="chatContent">{messages.length===0?<div className="chatWelcome"><Sparkles size={35}/><h1>Merhaba, ben <em>Ay Zek.</em></h1><p>Sorularını cevaplayabilir, fikirlerini geliştirebilir ve sana yardımcı olabilirim.</p><div className="chatHints">{["Bana yeni bir iş fikri ver","Bir konuyu basitçe açıkla","Şarkı sözü yazmama yardım et"].map(s=><button key={s} onClick={()=>send(s)}>{s}</button>)}</div></div>:<div className="chatMessages">{messages.map(m=><div className="chatMessage" key={m.id}><span>{m.role==="user"?<User size={16}/>:<Sparkles size={16}/>}</span><div><b>{m.role==="user"?"Sen":"Ay Zek"}</b>{m.parts?.map((p,i)=>p.type==="text"?<p key={i}>{p.text}</p>:null)}</div></div>)}{busy&&<p>Ay Zek düşünüyor…</p>}{error&&<p>Yanıt alınamadı. Vercel AI Gateway ayarlarını kontrol et.</p>}</div>}</section><form className="chatComposer" onSubmit={e=>{e.preventDefault();send(input)}}><textarea rows={1} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input)}}} placeholder="Ay Zek'e bir şey sor..."/><button disabled={!input.trim()||busy}><ArrowUp/></button></form><footer className="chatFooter">Ay Zek bazen hata yapabilir; önemli bilgileri kontrol et.</footer></main>
}
