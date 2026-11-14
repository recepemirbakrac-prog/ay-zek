"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, Code2, Eye, LoaderCircle, Sparkles } from "lucide-react";

type BuildResult = { code: string; explanation?: string };

const examples = ["Modern bir kişisel portfolyo sitesi", "Görev takip uygulaması", "Karanlık temalı kahve dükkanı sitesi"];

export default function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function build(event?: FormEvent) {
    event?.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true); setError(""); setExplanation("");
    try {
      const response = await fetch("/api/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Uygulama oluşturulamadı.");
      setCode(data.code);
      setExplanation(data.explanation || "İlk sürüm hazır. İsteğini değiştirerek yeniden oluşturabilirsin.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally { setLoading(false); }
  }

  return <main style={{minHeight:"100vh",background:"#0b0b12",color:"#f5f3ff",fontFamily:"Inter,Arial,sans-serif"}}>
    <header style={{height:68,borderBottom:"1px solid #252333",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 clamp(16px,4vw,48px)"}}>
      <Link href="/" style={{color:"#c8c3dc",textDecoration:"none",display:"flex",gap:9,alignItems:"center"}}><ArrowLeft size={18}/> Ay Zek</Link>
      <div style={{display:"flex",alignItems:"center",gap:9,fontWeight:700}}><Sparkles color="#a78bfa"/> Ay Zek Uygulama Oluşturucu</div>
      <span style={{fontSize:12,color:"#9d97b2"}}>AI Builder</span>
    </header>
    <section style={{maxWidth:1280,margin:"0 auto",padding:"44px 20px"}}>
      <div style={{textAlign:"center",maxWidth:760,margin:"0 auto 30px"}}>
        <div style={{fontSize:12,letterSpacing:2,color:"#a78bfa",fontWeight:700}}>HAYALİNİ GERÇEĞE DÖNÜŞTÜR</div>
        <h1 style={{fontSize:"clamp(30px,5vw,52px)",margin:"12px 0",lineHeight:1.08}}>Ne oluşturmak istiyorsun?</h1>
        <p style={{color:"#aaa5bd",lineHeight:1.7}}>Fikrini Türkçe anlat. Ay Zek senin için çalışan bir web uygulaması taslağı ve canlı önizlemesini oluştursun.</p>
      </div>
      <form onSubmit={build} style={{maxWidth:850,margin:"0 auto 18px",background:"#171522",border:"1px solid #39334d",borderRadius:18,padding:14,boxShadow:"0 18px 60px #0005"}}>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Örneğin: Ürünlerimi sergileyebileceğim, sepeti ve iletişim formu olan modern bir e-ticaret sitesi oluştur..." rows={4} style={{width:"100%",resize:"vertical",background:"transparent",border:0,outline:0,color:"white",fontSize:16,lineHeight:1.6,padding:8,boxSizing:"border-box"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",paddingTop:8,borderTop:"1px solid #302b40"}}>
          <span style={{fontSize:12,color:"#918ba5"}}>Açık ve ayrıntılı tarifler daha iyi sonuç verir.</span>
          <button disabled={!prompt.trim()||loading} style={{border:0,borderRadius:12,background:loading?"#51486b":"#8b5cf6",color:"white",padding:"12px 18px",fontWeight:700,display:"flex",alignItems:"center",gap:8,cursor:"pointer",opacity:!prompt.trim()?0.5:1}}>{loading?<LoaderCircle size={17} className="animate-spin"/>:<Sparkles size={17}/>} {loading?"Oluşturuluyor...":"Uygulamayı oluştur"} <ArrowUp size={16}/></button>
        </div>
      </form>
      <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap",marginBottom:34}}>{examples.map(x=><button key={x} onClick={()=>setPrompt(x)} style={{background:"#171522",border:"1px solid #302b40",borderRadius:999,color:"#bdb6d1",padding:"8px 12px",cursor:"pointer",fontSize:12}}>{x}</button>)}</div>
      {error&&<div role="alert" style={{maxWidth:850,margin:"0 auto 20px",padding:14,borderRadius:12,background:"#3b1720",color:"#fecdd3"}}>{error}</div>}
      {code&&<section style={{border:"1px solid #302b40",borderRadius:18,overflow:"hidden",background:"#14121e"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",borderBottom:"1px solid #302b40",gap:10,flexWrap:"wrap"}}><div style={{display:"flex",alignItems:"center",gap:9,fontWeight:700}}><Eye size={18} color="#a78bfa"/> Canlı önizleme</div><span style={{fontSize:12,color:"#aaa5bd"}}>{explanation}</span></div>
        <iframe title="Oluşturulan uygulama önizlemesi" sandbox="allow-forms allow-scripts" srcDoc={code} style={{width:"100%",height:620,border:0,background:"white"}}/>
        <details style={{padding:16,color:"#c4bdd5"}}><summary style={{cursor:"pointer"}}><Code2 size={15} style={{verticalAlign:"middle",marginRight:7}}/> Oluşturulan HTML kodunu göster</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:12,color:"#d6d1e2",background:"#0b0b12",padding:14,borderRadius:10,maxHeight:360,overflow:"auto"}}>{code}</pre></details>
      </section>}
      {!code&&!loading&&<div style={{textAlign:"center",color:"#777188",fontSize:13,padding:30}}>Oluşturduğun uygulamanın önizlemesi burada görünecek.</div>}
    </section>
  </main>;
}
