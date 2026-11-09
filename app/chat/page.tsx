"use client";
import {useChat} from "@ai-sdk/react";
import {DefaultChatTransport} from "ai";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowUp,Sparkles,User} from "lucide-react";
export default function ChatPage(){
 const [input,setInput]=useState("");
 const started=useRef(false);
 const {messages,sendMessage,status,error}=useChat({transport:new DefaultChatTransport({api:"/api/chat"})});
 const busy=status==="submitted"||status==="streaming";
 useEffect(()=>{const prompt=new URLSearchParams(window.location.search).get("prompt");if(prompt&&!started.current){started.current=true;sendMessage({text:prompt});}},[sendMessage]);
 const send=(s:string)=>{if(!s.trim()||busy)return;sendMessage({text:s.trim()});setInput("");};
 return <main className="chatShell"><header className="chatHeader"><Link href="/" className="back"><ArrowLeft size={17}/> Ana sayfa</Link><div><Sparkles size={20}/><b>Ay Zek AI</b><small>Akıllı Asistan</small></div></header><section className="chatContent">{messages.length===0?<div className="chatWelcome"><Sparkles size={35}/><h1>Merhaba, ben <em>Ay Zek.</em></h1><p>Sorularını cevaplayabilir, fikirlerini geliştirebilir, kod yazabilir ve birçok konuda yardımcı olabilirim.</p><div className="chatHints">{["Bana yeni bir iş fikri ver","Bir konuyu basitçe açıkla","Bir web sitesi tasarlamama yardım et","Şarkı sözü yazmama yardım et"].map(s=><button key={s} onClick={()=>send(s)}>{s}</button>)}</div></div>:<div className="chatMessages">{messages.map(m=><div className="chatMessage" key={m.id}><span>{m.role==="user"?<User size={16}/>:<Sparkles size={16}/>}</span><div><b>{m.role==="user"?"Sen":"Ay Zek"}</b>{m.parts?.map((p,i)=>p.type==="text"?<p key={i}>{p.text}</p>:null)}</div></div>)}{busy&&<p>Ay Zek düşünüyor…</p>}{error&&<p role="alert">{error.message||"Yanıt alınamadı. Lütfen tekrar dene."}</p>}</div>}</section><form className="chatComposer" onSubmit={e=>{e.preventDefault();send(input)}}><textarea rows={1} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input)}}} placeholder="Ay Zek'e ne yapmak istediğini anlat..."/><button disabled={!input.trim()||busy}><ArrowUp/></button></form><footer className="chatFooter">Ay Zek yapay zekâ tarafından desteklenir. Önemli bilgileri kontrol et.</footer></main>
}
