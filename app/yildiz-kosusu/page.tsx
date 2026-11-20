"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Falling = { id: number; x: number; y: number; kind: "star" | "meteor" };

export default function StarRunner() {
  const [playing, setPlaying] = useState(false);
  const [x, setX] = useState(50);
  const [items, setItems] = useState<Falling[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [tick, setTick] = useState(0);
  const [best, setBest] = useState(0);
  const start = useCallback(() => { setX(50); setItems([]); setScore(0); setLives(3); setTick(0); setPlaying(true); }, []);
  const move = useCallback((dir: number) => setX(v => Math.max(5, Math.min(95, v + dir * 7))), []);
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowLeft","a","A"].includes(e.key)) { e.preventDefault(); move(-1); }
      if (["ArrowRight","d","D"].includes(e.key)) { e.preventDefault(); move(1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, move]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setTick(t => t + 1);
      setItems(old => {
        const moved = old.map(o => ({...o, y:o.y + 7})).filter(o => o.y < 105);
        if (Math.random() < .72) moved.push({id:Date.now()+Math.random(), x:8+Math.random()*84, y:-5, kind:Math.random() < .62 ? "star" : "meteor"});
        return moved;
      });
    }, 430);
    return () => window.clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    if (!playing) return;
    setItems(old => {
      const hit = old.filter(o => o.y > 78 && o.y < 96 && Math.abs(o.x-x) < 8);
      if (!hit.length) return old;
      const stars = hit.filter(o => o.kind === "star").length;
      const rocks = hit.filter(o => o.kind === "meteor").length;
      if (stars) setScore(s => s + stars * 10);
      if (rocks) setLives(l => Math.max(0, l-rocks));
      const ids = new Set(hit.map(o=>o.id));
      return old.filter(o=>!ids.has(o.id));
    });
  }, [tick, x, playing]);
  useEffect(() => {
    if (lives <= 0 && playing) { setPlaying(false); setBest(b => Math.max(b, score)); }
  }, [lives, playing, score]);
  return <main style={{minHeight:"100vh",background:"radial-gradient(circle at 50% 0%,#253b69,#080d1c 55%)",color:"#f7f8ff",fontFamily:"system-ui,sans-serif",padding:"22px 14px 40px"}}>
    <div style={{maxWidth:760,margin:"0 auto"}}>
      <Link href="/" style={{color:"#a9c7ff",textDecoration:"none",fontSize:14}}>← Ay Zek ana sayfa</Link>
      <header style={{textAlign:"center",padding:"18px 0 20px"}}>
        <div style={{fontSize:12,letterSpacing:4,color:"#80e7ff",fontWeight:800}}>AY ZEK ARCADE</div>
        <h1 style={{fontSize:"clamp(32px,7vw,54px)",margin:"8px 0",lineHeight:1}}>YILDIZ KOŞUSU ✨</h1>
        <p style={{color:"#b7c4e3",margin:0}}>Yıldızları topla, göktaşlarından kaç!</p>
      </header>
      <section style={{display:"flex",justifyContent:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
        {[["PUAN",score],["CAN","❤️".repeat(lives)||"—"],["REKOR",best]].map(([k,v])=><div key={String(k)} style={{background:"#ffffff12",border:"1px solid #ffffff20",borderRadius:12,padding:"9px 20px",minWidth:95,textAlign:"center"}}><small style={{display:"block",fontSize:10,color:"#9eb4df",letterSpacing:2}}>{k}</small><b style={{fontSize:20}}>{v}</b></div>)}
      </section>
      <div style={{position:"relative",height:"min(62vh,520px)",minHeight:360,overflow:"hidden",borderRadius:22,border:"1px solid #7bdcff55",background:"linear-gradient(180deg,#101d3b,#10152c 60%,#192347)",boxShadow:"0 20px 70px #0008"}}>
        <div style={{position:"absolute",inset:0,opacity:.55,backgroundImage:"radial-gradient(#b7d9ff 1px,transparent 1px)",backgroundSize:"37px 37px"}}/>
        {items.map(o=><div key={o.id} style={{position:"absolute",left:o.x+"%",top:o.y+"%",transform:"translate(-50%,-50%)",fontSize:28,filter:"drop-shadow(0 0 8px #8beaff)"}}>{o.kind==="star"?"⭐":"☄️"}</div>)}
        <div style={{position:"absolute",left:x+"%",top:"88%",transform:"translate(-50%,-50%)",fontSize:42,filter:"drop-shadow(0 0 14px #57dfff)"}}>🚀</div>
        {!playing && <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",background:"#080d1c99",textAlign:"center",padding:24}}>
          <div><div style={{fontSize:48}}>{lives===0?"💥":"🌌"}</div><h2 style={{fontSize:26,margin:"8px 0"}}>{lives===0?"Oyun bitti!":"Hazır mısın?"}</h2><p style={{color:"#c1cce5",maxWidth:330,lineHeight:1.6}}>{lives===0?"Toplam "+score+" puan topladın.":"Roketi sağa sola hareket ettir. ⭐ yıldızları yakala, ☄️ göktaşlarından uzak dur."}</p><button onClick={start} style={{border:0,borderRadius:14,padding:"14px 30px",fontWeight:900,fontSize:16,color:"#071326",background:"linear-gradient(90deg,#79f2ff,#a5ffcf)",cursor:"pointer"}}>{lives===0?"Tekrar oyna":"Oyuna başla"}</button></div>
        </div>}
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:18,marginTop:16}}>
        <button aria-label="Sola git" onClick={()=>move(-1)} style={control}>◀ SOL</button>
        <button aria-label="Sağa git" onClick={()=>move(1)} style={control}>SAĞ ▶</button>
      </div>
      <p style={{textAlign:"center",fontSize:12,color:"#9eafd2",lineHeight:1.7}}>Bilgisayar: ← → veya A / D tuşları · Telefon: SOL / SAĞ düğmeleri</p>
    </div>
  </main>;
}
const control: React.CSSProperties = {background:"#ffffff16",color:"#eff7ff",border:"1px solid #ffffff35",borderRadius:14,padding:"15px 28px",fontWeight:800,fontSize:14,cursor:"pointer",minWidth:125};
