"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Item = { lane: number; y: number; kind: "rock" | "orb" };
export default function OyunPage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const g = useRef({ lane: 1, items: [] as Item[], tick: 0, score: 0, speed: 4, live: false, last: 0, raf: 0 });
  const [state, setState] = useState<"ready" | "playing" | "over">("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const shownScore = useRef(-1);
  useEffect(() => { setBest(Number(localStorage.getItem("ay-neon-best") || 0)); }, []);
  const move = useCallback((d: number) => { if (g.current.live) g.current.lane = Math.max(0, Math.min(2, g.current.lane + d)); }, []);
  const start = useCallback(() => { Object.assign(g.current, { lane: 1, items: [], tick: 0, score: 0, speed: 4, live: true, last: 0 }); setScore(0); shownScore.current = 0; setState("playing"); }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") move(-1);
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") move(1);
      if ((e.key === " " || e.key === "Enter") && state !== "playing") start();
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [move, start, state]);
  useEffect(() => {
    const el = canvas.current, ctx = el?.getContext("2d"); if (!el || !ctx) return;
    let w = 900, h = 540;
    const resize = () => { const r = el.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); w = r.width; h = r.height; el.width = w*d; el.height = h*d; ctx.setTransform(d,0,0,d,0,0); };
    resize(); window.addEventListener("resize", resize);
    const draw = (now: number) => {
      const a = g.current, dt = Math.min(2, (now-(a.last || now))/16.67); a.last = now;
      const horizon = h*.18, road = Math.min(w*.76,620), left=(w-road)/2, lane=road/3;
      const bg=ctx.createLinearGradient(0,0,0,h); bg.addColorStop(0,"#11172e"); bg.addColorStop(.6,"#1a2c4d"); bg.addColorStop(1,"#080c19"); ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
      for(let i=0;i<75;i++){ctx.fillStyle=i%4?"#9ebdff77":"#fff";ctx.fillRect((i*139)%w,(i*67)%Math.max(1,horizon),2,2);}
      ctx.fillStyle="#17233d";ctx.beginPath();ctx.moveTo(w*.34,horizon);ctx.lineTo(w*.66,horizon);ctx.lineTo(w*.99,h);ctx.lineTo(w*.01,h);ctx.fill();
      ctx.strokeStyle="#3ddcff";ctx.lineWidth=3;ctx.shadowColor="#3ddcff";ctx.shadowBlur=16;
      for(const s of [0,1]){ctx.beginPath();ctx.moveTo(s?w*.66:w*.34,horizon);ctx.lineTo(s?w*.99:w*.01,h);ctx.stroke();}ctx.shadowBlur=0;
      for(let j=0;j<12;j++){const y=horizon+((j*75+(a.tick*a.speed)%75)/(h-horizon))*(h-horizon), p=(y-horizon)/(h-horizon);ctx.strokeStyle="#9ebcff66";ctx.lineWidth=1+p*2;for(let k=1;k<3;k++){const x=left+lane*k;ctx.beginPath();ctx.moveTo(x-5-p*9,y);ctx.lineTo(x+5+p*9,y);ctx.stroke();}}
      if(a.live){
        a.tick+=dt; a.score+=dt*.17; a.speed=4+Math.min(9,a.score/100);
        if(a.tick%Math.max(21,55-a.speed*2)<dt)a.items.push({lane:Math.floor(Math.random()*3),y:horizon-35,kind:Math.random()<.27?"orb":"rock"});
        a.items.forEach(o=>o.y+=a.speed*dt*(.8+Math.max(0,o.y-horizon)/(h-horizon)*.55));
        for(const o of a.items){if(Math.abs(o.y-h*.78)<24&&o.lane===a.lane){if(o.kind==="rock"){a.live=false;setState("over");const n=Math.floor(a.score);setScore(n);setBest(b=>{const v=Math.max(b,n);localStorage.setItem("ay-neon-best",String(v));return v;});}else{o.y=h+100;a.score+=15;}}}
        a.items=a.items.filter(o=>o.y<h+60);const shown=Math.floor(a.score);if(shown!==shownScore.current){shownScore.current=shown;setScore(shown);}
      }
      for(const o of a.items){const p=Math.max(.05,(o.y-horizon)/(h-horizon)),x=left+lane*(o.lane+.5),s=18+p*36;ctx.save();ctx.translate(x,o.y);
        if(o.kind==="orb"){ctx.shadowColor="#ffd45a";ctx.shadowBlur=22;ctx.fillStyle="#ffd45a";ctx.beginPath();ctx.ellipse(0,0,s*.45,s*.62,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff2a8";ctx.lineWidth=3;ctx.stroke();}
        else{ctx.shadowColor="#ff477e";ctx.shadowBlur=18;ctx.fillStyle="#a92e62";ctx.fillRect(-s*.55,-s*.6,s*1.1,s*1.2);ctx.fillStyle="#ff8ab0";ctx.fillRect(-s*.4,-s*.45,s*.8,s*.16);ctx.strokeStyle="#ffc0d5";ctx.strokeRect(-s*.55,-s*.6,s*1.1,s*1.2);}ctx.restore();}
      const x=left+lane*(a.lane+.5), y=h*.79;ctx.save();ctx.translate(x,y);ctx.shadowColor="#40e5ff";ctx.shadowBlur=25;ctx.fillStyle="#35dfff";ctx.beginPath();ctx.moveTo(0,-37);ctx.lineTo(25,18);ctx.lineTo(0,10);ctx.lineTo(-25,18);ctx.closePath();ctx.fill();ctx.fillStyle="#eaffff";ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(8,7);ctx.lineTo(0,3);ctx.lineTo(-8,7);ctx.fill();ctx.restore();
      ctx.fillStyle="#fff";ctx.font="bold 18px system-ui";ctx.fillText("SKOR  "+Math.floor(a.score),22,34);
      a.raf=requestAnimationFrame(draw);
    };
    g.current.raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(g.current.raf);window.removeEventListener("resize",resize);};
  }, []);
  return <main className="neon"><style>{`
    *{box-sizing:border-box}.neon{min-height:100vh;background:#080b16;color:#f5f7ff;font-family:system-ui,sans-serif;padding:24px;display:flex;align-items:center;justify-content:center}.shell{width:min(1100px,100%)}.top{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:18px}.brand{color:#6ee7ff;font-size:12px;font-weight:900;letter-spacing:4px}.title{font-size:clamp(30px,5vw,48px);font-weight:950;letter-spacing:-2px;margin:4px 0}.sub,.hint{color:#91a0bf;font-size:14px}.stats{display:flex;gap:10px}.stat{background:#111a30;border:1px solid #2b3b5d;border-radius:14px;padding:10px 17px;min-width:88px}.stat small{display:block;color:#91a0bf;font-size:10px;letter-spacing:1px}.stat b{font-size:21px}.stage{position:relative;height:min(65vh,560px);min-height:410px;border:1px solid #344565;border-radius:22px;overflow:hidden;box-shadow:0 24px 80px #0009,0 0 50px #1a9dcc20}.stage canvas{width:100%;height:100%;display:block}.overlay{position:absolute;inset:0;display:grid;place-items:center;text-align:center;background:#070b1688;padding:20px}.panel{max-width:440px;background:#0a1022ed;border:1px solid #496080;border-radius:22px;padding:28px;box-shadow:0 20px 70px #0009}.panel h2{font-size:30px;margin:8px}.panel p{color:#aab7d3;line-height:1.6;margin:10px 0 20px}.btn{border:0;border-radius:12px;padding:14px 25px;background:linear-gradient(110deg,#23c9e8,#5478ff);color:#04101d;font-weight:900;font-size:15px;cursor:pointer}.bottom{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:15px;color:#9aa9c7;font-size:13px}.controls{display:flex;gap:10px}.control{background:#121c32;border:1px solid #2b3d60;color:#e3efff;border-radius:12px;padding:10px 22px;font-size:20px;cursor:pointer;touch-action:manipulation}@media(max-width:650px){.neon{padding:14px}.top{align-items:flex-start;flex-direction:column}.stage{height:62vh;min-height:390px}.bottom{flex-direction:column}.hint{display:none}}
  `}</style>
    <div className="shell"><header className="top"><div><div className="brand">AY ZEK ARCADE</div><h1 className="title">NEON KAÇIŞ</h1><div className="sub">Neon otoyolunda engellerden kaç, enerji küreleri topla, rekorunu kır.</div></div><div className="stats"><div className="stat"><small>SKOR</small><b>{score}</b></div><div className="stat"><small>REKOR</small><b>{best}</b></div></div></header>
    <section className="stage"><canvas ref={canvas}/>{state!=="playing"&&<div className="overlay"><div className="panel"><div className="brand">◆ AY ZEK OYUNU</div><h2>{state==="ready"?"Hazır mısın?":"Oyun bitti!"}</h2><p>{state==="ready"?"Hover aracını üç şeritte sür. Kırmızı engellerden kaç, altın enerji kürelerini topla.":"Güzel deneme! Tekrar oyna ve kendi rekorunu geç."}<br/>← → veya A / D ile hareket et.</p><button className="btn" onClick={start}>{state==="ready"?"OYUNA BAŞLA":"TEKRAR OYNA"} →</button></div></div>}</section>
    <footer className="bottom"><span className="hint">KLAVYE: ← → veya A / D</span><div className="controls"><button className="control" onClick={()=>move(-1)} aria-label="Sola git">←</button><button className="control" onClick={()=>move(1)} aria-label="Sağa git">→</button></div><span>⚡ Altın küre: +15 puan</span></footer></div>
  </main>;
}