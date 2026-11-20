"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Heart, Skull, Trophy, Volume2, VolumeX, Zap } from "lucide-react";
import "./game.css";

const supabase = createClient(
  "https://rogjptnkmauzywdhaxtu.supabase.co",
  "sb_publishable_AOiYPqZ6qjrIxVxMSOqnKw_yrw6aE9p"
);

type Zombie = { x:number; y:number; hp:number; speed:number; phase:number };
type Bullet = { x:number; y:number; vx:number; vy:number; life:number };
type World = { px:number; py:number; zombies:Zombie[]; bullets:Bullet[]; score:number; kills:number; hp:number; wave:number; spawn:number; fire:number; time:number; over:boolean };
type ScoreRow = { player_name:string; score:number; kills:number };

const makeWorld = ():World => ({px:0,py:0,zombies:[],bullets:[],score:0,kills:0,hp:100,wave:1,spawn:0,fire:0,time:0,over:false});
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

export default function ZombieSurvival(){
  const canvas=useRef<HTMLCanvasElement>(null), world=useRef<World>(makeWorld()), keys=useRef<Record<string,boolean>>({});
  const [playing,setPlaying]=useState(false),[paused,setPaused]=useState(false),[score,setScore]=useState(0),[hp,setHp]=useState(100),[wave,setWave]=useState(1),[kills,setKills]=useState(0),[name,setName]=useState("Oyuncu"),[saved,setSaved]=useState(false),[leaderboard,setLeaderboard]=useState<ScoreRow[]>([]),[sound,setSound]=useState(true);
  const start=useCallback(()=>{const c=canvas.current;if(!c)return;const w=makeWorld();w.px=c.clientWidth/2;w.py=c.clientHeight/2;world.current=w;setScore(0);setHp(100);setWave(1);setKills(0);setSaved(false);setPaused(false);setPlaying(true);},[]);
  const movePointer=useCallback((e:{clientX:number;clientY:number;currentTarget:HTMLCanvasElement})=>{if(!playing||paused)return;const r=e.currentTarget.getBoundingClientRect();world.current.px=clamp(e.clientX-r.left,15,r.width-15);world.current.py=clamp(e.clientY-r.top,15,r.height-15);},[playing,paused]);

  useEffect(()=>{supabase.from("zombie_scores").select("player_name,score,kills").order("score",{ascending:false}).limit(10).then(({data})=>{if(data)setLeaderboard(data as ScoreRow[])});},[]);
  useEffect(()=>{const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();keys.current[k]=true;};const up=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=false;};window.addEventListener("keydown",down);window.addEventListener("keyup",up);return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up)};},[]);

  useEffect(()=>{
    const c=canvas.current;if(!c)return;const ctx=c.getContext("2d");if(!ctx)return;let raf=0,last=0,frame=0,w=0,h=0;
    const resize=()=>{const r=c.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);w=r.width;h=r.height;c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);if(!world.current.px){world.current.px=w/2;world.current.py=h/2;}};resize();window.addEventListener("resize",resize);
    const drawZombie=(z:Zombie)=>{ctx.save();ctx.translate(z.x,z.y);ctx.rotate(Math.sin(z.phase)*.12);ctx.shadowBlur=15;ctx.shadowColor="#8bff75";ctx.fillStyle="#4f9e58";ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();ctx.fillStyle="#b7ff9e";ctx.beginPath();ctx.arc(-4,-3,2,0,7);ctx.arc(5,-3,2,0,7);ctx.fill();ctx.fillStyle="#173b2b";ctx.fillRect(-6,5,12,3);ctx.restore();};
    const loop=(t:number)=>{const dt=Math.min((t-last)/16.67||1,2);last=t;frame++;ctx.clearRect(0,0,w,h);
      const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,"#18271f");bg.addColorStop(1,"#0b1514");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      ctx.strokeStyle="#b1e2a00c";ctx.lineWidth=1;for(let x=0;x<w;x+=44){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=44){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
      const v=world.current;
      if(playing&&!paused&&!v.over){
        v.time+=dt;v.spawn-=dt;v.fire-=dt;const k=keys.current;let dx=0,dy=0;if(k.a||k.arrowleft)dx--;if(k.d||k.arrowright)dx++;if(k.w||k.arrowup)dy--;if(k.s||k.arrowdown)dy++;
        const len=Math.hypot(dx,dy)||1;v.px=clamp(v.px+dx/len*3.5*dt,16,w-16);v.py=clamp(v.py+dy/len*3.5*dt,16,h-16);
        if(v.spawn<=0){const edge=Math.floor(Math.random()*4);v.zombies.push({x:edge===0?-10:edge===1?w+10:Math.random()*w,y:edge===2?-10:edge===3?h+10:Math.random()*h,hp:1,speed:.42+Math.random()*.23+v.wave*.035,phase:Math.random()*8});v.spawn=Math.max(12,65-v.wave*4);}
        if(v.fire<=0&&v.zombies.length){const z=v.zombies.reduce((a,b)=>Math.hypot(a.x-v.px,a.y-v.py)<Math.hypot(b.x-v.px,b.y-v.py)?a:b);const a=Math.atan2(z.y-v.py,z.x-v.px);v.bullets.push({x:v.px,y:v.py,vx:Math.cos(a)*8,vy:Math.sin(a)*8,life:48});v.fire=13;}
        v.zombies.forEach(z=>{const a=Math.atan2(v.py-z.y,v.px-z.x);z.x+=Math.cos(a)*z.speed*dt;z.y+=Math.sin(a)*z.speed*dt;z.phase+=.05*dt;if(Math.hypot(z.x-v.px,z.y-v.py)<23){v.hp-=.32*dt;}});
        v.bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;const idx=v.zombies.findIndex(z=>Math.hypot(z.x-b.x,z.y-b.y)<15);if(idx>=0){v.zombies.splice(idx,1);b.life=0;v.score+=25;v.kills++;}});
        v.bullets=v.bullets.filter(b=>b.life>0&&b.x>-20&&b.x<w+20&&b.y>-20&&b.y<h+20);
        v.wave=1+Math.floor(v.kills/10);if(v.hp<=0){v.hp=0;v.over=true;setPlaying(false)}
        if(frame%6===0){setScore(v.score);setHp(Math.ceil(v.hp));setWave(v.wave);setKills(v.kills);}
      }
      v.zombies.forEach(drawZombie);
      v.bullets.forEach(b=>{ctx.save();ctx.shadowBlur=13;ctx.shadowColor="#ffd56a";ctx.fillStyle="#ffe7a1";ctx.beginPath();ctx.arc(b.x,b.y,3.5,0,7);ctx.fill();ctx.restore()});
      ctx.save();ctx.translate(v.px,v.py);ctx.shadowBlur=20;ctx.shadowColor="#78d6ff";ctx.fillStyle="#c9e9ff";ctx.strokeStyle="#4d9ec1";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,11,0,7);ctx.fill();ctx.stroke();ctx.fillStyle="#19394a";ctx.fillRect(-5,-3,10,6);ctx.restore();
      if(!playing||paused||v.over){ctx.fillStyle="#030907bb";ctx.fillRect(0,0,w,h);ctx.textAlign="center";ctx.fillStyle="#d9f7ca";ctx.font="800 27px system-ui";ctx.fillText(v.over?"HAYATTA KALAMADIN":paused?"DURAKLATILDI":"ZOMBİ KIYAMETİ",w/2,h/2-10);ctx.fillStyle="#d3e2d5";ctx.font="13px system-ui";ctx.fillText(v.over?"Skor: "+v.score+" · İmha: "+v.kills:"Zombiler yaklaşıyor. Hazır ol!",w/2,h/2+18);}
      raf=requestAnimationFrame(loop);
    };raf=requestAnimationFrame(loop);return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize)};
  },[playing,paused]);

  const saveScore=async()=>{const player=name.trim().slice(0,18);if(player.length<2)return;const {error}=await supabase.from("zombie_scores").insert({player_name:player,score,kills});if(!error){setSaved(true);const {data}=await supabase.from("zombie_scores").select("player_name,score,kills").order("score",{ascending:false}).limit(10);if(data)setLeaderboard(data as ScoreRow[])}};
  const life=Math.max(0,hp);
  return <main className="zombie-page">
    <header className="zombie-nav"><Link href="/" className="zombie-brand"><span>☣</span> AY ZEK <b>ARCADE</b></Link><Link href="/" className="zombie-back"><ArrowLeft size={15}/> Ana sayfa</Link></header>
    <section className="zombie-hero"><div className="zombie-kicker"><Skull size={14}/> SURVIVAL MODE · SEZON 01</div><h1>SON <em>SAVUNMA</em></h1><p>Şehir düştü. Zombiler her yerde. Gün doğana kadar hayatta kalabilecek misin?</p></section>
    <section className="zombie-layout"><div className="zombie-main">
      <div className="zombie-hud"><div><small>SKOR</small><b>{String(score).padStart(5,"0")}</b></div><div><small><Heart size={12}/> SAĞLIK</small><b className={life<35?"danger":""}>{life}%</b></div><div><small>DALGA</small><b>{wave}</b></div><div><small>İMHA</small><b>{kills}</b></div><button onClick={()=>setSound(!sound)} aria-label="Ses"><>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</></button></div>
      <canvas ref={canvas} className="zombie-canvas" onPointerDown={movePointer} onPointerMove={movePointer} aria-label="Zombi hayatta kalma oyun alanı"/>
      {!playing&&<div className="zombie-actions"><button onClick={start}><Zap size={17}/>{world.current.over?"TEKRAR DENE":"HAYATTA KAL"}</button>{world.current.over&&<div className="zombie-submit"><input value={name} onChange={e=>setName(e.target.value)} maxLength={18} placeholder="Oyuncu adı"/><button onClick={saveScore} disabled={saved||name.trim().length<2}>{saved?"KAYDEDİLDİ":"SKORU KAYDET"}</button></div>}</div>}
      <div className="zombie-controls"><span>WASD / OK TUŞLARI: HAREKET</span><span>OTOMATİK ATEŞ</span><span>FARE / DOKUN: YÖNLENDİR</span><button onClick={()=>setPaused(p=>!p)} disabled={!playing}>{paused?"DEVAM ET":"DURAKLAT"}</button></div>
    </div><aside className="zombie-side"><div className="zombie-card"><h2><Trophy size={17}/> EN İYİ 10 OYUNCU</h2><p>Ay Zek oyuncularının en yüksek skorları</p>{leaderboard.length?leaderboard.map((r,i)=><div className="zombie-rank" key={i}><b>{String(i+1).padStart(2,"0")}</b><span>{r.player_name}<small>{r.kills} zombi</small></span><strong>{r.score.toLocaleString("tr-TR")}</strong></div>):<div className="zombie-empty">İlk rekoru sen kır!</div>}</div><div className="zombie-card tips"><h2>HAYATTA KALMA İPUÇLARI</h2><p>✦ Sürekli hareket et, köşeye sıkışma.</p><p>✦ Her 10 zombide yeni dalga başlar.</p><p>✦ Zombiler yaklaştıkça sağlık azalır.</p></div></aside></section>
    <footer className="zombie-footer">☣ Tamamen kurgusal oyun · Gerçek cihazlara veya dosyalara erişmez</footer>
  </main>;
}
