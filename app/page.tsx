"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BrainCircuit, Download, FileText, ImagePlus, MessageCircle,
  Music2, Search, Sparkles, Gamepad2, ShieldCheck
} from "lucide-react";
import "./home.css";

const tools = [
  { title: "Akıllı sohbet", desc: "Sorular sor, fikir al, konuları öğren.", icon: MessageCircle, href: "/chat", tag: "En popüler", tone: "violet" },
  { title: "Yazı ve belge", desc: "Metin, özet, e-posta ve sunum hazırla.", icon: FileText, href: "/chat?prompt=Benim%20i%C3%A7in%20profesyonel%20bir%20belge%20haz%C4%B1rla.", tag: "Üretkenlik", tone: "orange" },
  { title: "Kodlama yardımcısı", desc: "Kod yaz, açıkla ve hataları çöz.", icon: BrainCircuit, href: "/chat?prompt=Bir%20yaz%C4%B1l%C4%B1m%20uzman%C4%B1%20gibi%20bana%20yard%C4%B1m%20et.", tag: "Geliştirici", tone: "green" },
  { title: "Yaratıcı fikirler", desc: "Şarkı, hikâye, slogan ve içerik üret.", icon: Music2, href: "/chat?prompt=Bana%20yarat%C4%B1c%C4%B1%20bir%20fikir%20%C3%BCret.", tag: "Yaratıcılık", tone: "pink" },
  { title: "Araştırma asistanı", desc: "Bir konuyu adım adım incele ve açıkla.", icon: Search, href: "/chat?prompt=Bir%20ara%C5%9Ft%C4%B1rma%20asistan%C4%B1%20gibi%20%C3%A7al%C4%B1%C5%9F.", tag: "Keşfet", tone: "cyan" },
  { title: "Uygulama mağazası", desc: "Android ve Windows için resmî indirme bağlantılarını keşfet.", icon: Download, href: "/indir", tag: "Mağaza", tone: "blue" },\n  { title: "Uzay Savaşı", desc: "Gemini yönet, düşmanları vur ve rekorunu kır.", icon: Gamepad2, href: "/uzay", tag: "Oyun", tone: "cyan" }
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (prompt.trim()) window.location.href = "/chat?prompt=" + encodeURIComponent(prompt.trim());
  };

  return (
    <main className="homeShell">
      <header className="homeNav">
        <Link href="/" className="brandMark"><span className="brandIcon"><Sparkles size={21}/></span><span>Ay Zek<span className="brandAI"> AI</span></span></Link>
        <nav><Link href="/chat">Sohbet</Link><Link href="/uzay">Uzay Oyunu</Link><Link href="/indir">Uygulamalar</Link><a href="#araclar">Araçlar</a><Link href="/api-anahtarlari">API Anahtarları</Link></nav>
        <Link className="navCta" href="/chat">Başla <ArrowRight size={16}/></Link>
      </header>

      <section className="hero">
        <div className="heroGlow"/>
        <div className="eyebrow"><span className="pulseDot"/> AY ZEK 2.0 · YENİ NESİL YAPAY ZEKÂ ASİSTANI</div>
        <h1>Hayal et. Sor. <span>Birlikte yapalım.</span></h1>
        <p className="heroLead">Fikirlerini projelere dönüştür. Öğren, üret, kodla ve keşfet. İhtiyacın olan yapay zekâ araçları tek yerde.</p>
        <form className="heroPrompt" onSubmit={submit}>
          <Sparkles size={20}/>
          <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ay Zek'e ne yapmak istediğini anlat..." aria-label="Ay Zek'e mesaj yaz"/>
          <button type="submit" aria-label="Gönder" disabled={!prompt.trim()}><ArrowRight size={19}/></button>
        </form>
        <div className="promptExamples"><span>Şunları deneyebilirsin:</span><button onClick={()=>setPrompt("Bana bir mobil uygulama fikri ver")}>Uygulama fikri üret</button><button onClick={()=>setPrompt("Kuantum bilgisayarı basitçe açıkla")}>Bir konuyu öğren</button><button onClick={()=>setPrompt("Kişisel portfolyo sitesi oluştur")}>Web sitesi tasarla</button></div>
        <div className="heroStats"><div><b>2.0</b><span>Yeni sürüm</span></div><i/><div><b>Tek yer</b><span>Birçok farklı iş</span></div><i/><div><b>7/24</b><span>Her zaman yanında</span></div></div>
      </section>

      <section className="toolsSection" id="araclar">
        <div className="sectionTop"><div><div className="sectionEyebrow">AY ZEK ARAÇLARI</div><h2>Her iş için bir yardımcın var.</h2><p>Bir araç seç veya doğrudan neye ihtiyacın olduğunu yaz.</p></div><Link href="/chat" className="allTools">Tümünü keşfet <ArrowRight size={16}/></Link></div>
        <div className="toolGrid">
          {tools.map((tool) => { const Icon = tool.icon; return <Link href={tool.href} className="toolCard" key={tool.title}><div className={"toolIcon "+tool.tone}><Icon size={22}/></div><span className="toolTag">{tool.tag}</span><h3>{tool.title}</h3><p>{tool.desc}</p><span className="toolArrow"><ArrowRight size={17}/></span></Link>; })}
        </div>
      </section>

      <section className="moreSection">
        <div className="moreItem"><ImagePlus size={19}/><span>Görsel fikirleri</span><small>Görsel üretim için sohbetten destek al</small></div>
        <div className="moreItem"><ShieldCheck size={19}/><span>Güvenli kullanım</span><small>Önemli bilgileri daima doğrula</small></div>
        <div className="moreItem"><Gamepad2 size={19}/><span>Oyun ve eğlence</span><small>Projeler ve oyunlar tek platformda</small></div>
      </section>
      <footer className="homeFooter"><Link href="/" className="brandMark"><span className="brandIcon"><Sparkles size={17}/></span>Ay Zek AI</Link><span>Fikirlerin için akıllı bir başlangıç.</span><Link href="/chat">Sohbete geç <ArrowRight size={14}/></Link></footer>
    </main>
  );
}
