"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crosshair, Heart, Shield, Target, Trophy } from "lucide-react";
import "./war.css";

type Soldier = { x:number; y:number; hp:number; speed:number; phase:number };
type Shot = { x:number; y:number; vx:number; vy:number; life:number; enemy:boolean };
type Game = { x:number; y:number; aimX:number; aimY:number; enemies:Soldier[]; shots:Shot[]; hp:number; score:number; kills:number; wave:number; spawn:number; fire:number; over:boolean };
const fresh = ():Game => ({x:0,y:0,aimX:1,aimY:0,enemies:[],shots:[],hp:100,score:0,kills:0,wave:1,spawn:0,fire:0,over:false});
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

export default function WarGame(){
  const canvas=useRef<HTMLCanvasElement>(null), game=useRef<Game>(fresh()), keys=useRef<Record<string,boolean>>({});
  const [running,setRunning]=useState(false),[paused,setPaused]=useState(false),[hp,setHp]=useState(100),[score,setScore]=useState(0),[kills,setKills]=useState(0),[wave,setWave]=useState(1);
  const start=useCallback(()=>{const c=canvas.current;if(!c)return;const g=fresh();g.x=c.clientWidth/2;g.y=c.clientHeight/2;game.current=g;setHp(100);setScore(0);setKills(0);setWave(1);setPaused(false);setRunning(true);},[]);
  const aim=(e:{clientX:number;clientY:number;currentTarget:HTMLCanvasElement})=>{const r=e.currentTarget.getBoundingClientRect();const g=game.current;const dx=e.clientX-r.left-g.x,dy=e.clientY-r.top-g.y;const d=Math.hypot(dx,dy)||1;g.aimX=dx/d;g.aimY=dy/d;};
  const fire=(e:{clientX:number;clientY:number;currentTarget:HTMLCanvasElement})=>{aim(e);const r=e.currentTarget.getBoundingClientRect(),g=game.current;const dx=e.clientX-r.left-g.x,dy=e.clientY-r.top-g.y,d=Math.hypot(dx,dy)||1;g.shots.push({x:g.x,y:g.y,vx:dx/d*9,vy:dy/d*9,life:55,enemy:false});};
  useEffect(()=>{const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();keys.current[k]=true;};const up=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=false;};window.addEventListener("keydown",down);window.addEventListener("keyup",up);return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up)};},[]);
  useEffect(()=>{const c=canvas.current;if(!c)return;const ctx=c.getContext("2d");if(!ctx)return;let raf=0,last=0,frame=0,w=0,h=0;
    const resize=()=>{const r=c.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);w=r.width;h=r.height;c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);if(!game.current.x){game.current.x=w/2;game.current.y=h/2;}};resize();window.addEventListener("resize",resize);
    const soldier=(s:Soldier)=>{ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.sin(s.phase)*.07);ctx.fillStyle="#b94f3f";ctx.fillRect(-7,-8,14,17);ctx.fillStyle="#d6ad82";ctx.beginPath();ctx.arc(0,-11,6,0,Math.PI*2);ctx.fill();ctx.fillStyle="#343b36";ctx.fillRect(-9,3,6,10);ctx.fillRect(3,3,6,10);ctx.fillStyle="#222c29";ctx.fillRect(4,-3,14,4);ctx.restore();};
    const loop=(t:number)=>{const dt=Math.min((t-last)/16.67||1,2);last=t;frame++;ctx.clearRect(0,0,w,h);
      // layered battlefield ground
      const ground=ctx.createLinearGradient(0,0,w,h);ground.addColorStop(0,"#788365");ground.addColorStop(.48,"#59694d");ground.addColorStop(1,"#394b3b");ctx.fillStyle=ground;ctx.fillRect(0,0,w,h);
      for(let i=0;i<210;i++){const x=(i*137+37)%w,y=(i*83+19)%h;ctx.fillStyle=i%4===0?"#c2b78320":i%3===0?"#202f2528":"#e0d5a012";ctx.beginPath();ctx.ellipse(x,y,(i%5)+2,(i%3)+1,(i%7)*.3,0,Math.PI*2);ctx.fill();}
      // winding dirt road
      ctx.beginPath();ctx.moveTo(w*.05,h*.92);ctx.bezierCurveTo(w*.28,h*.72,w*.38,h*.52,w*.58,h*.47);ctx.bezierCurveTo(w*.78,h*.42,w*.76,h*.18,w*.98,h*.05);ctx.strokeStyle="#b7a47a55";ctx.lineWidth=43;ctx.stroke();ctx.strokeStyle="#d5c49a35";ctx.lineWidth=2;ctx.setLineDash([13,16]);ctx.stroke();ctx.setLineDash([]);
      // subtle tactical grid
      ctx.strokeStyle="#e3dfb20d";ctx.lineWidth=1;for(let x=0;x<w;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
      // forest clusters
      for(let i=0;i<22;i++){const x=(i*173+61)%w,y=(i*109+31)%h;if(Math.hypot(x-w*.5,y-h*.5)<70)continue;ctx.fillStyle="#17291f55";ctx.beginPath();ctx.ellipse(x+4,y+7,15,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=i%2?"#263f2c":"#345239";ctx.beginPath();ctx.arc(x,y,12+(i%4)*2,0,Math.PI*2);ctx.fill();ctx.fillStyle="#71815a88";ctx.beginPath();ctx.arc(x-4,y-5,5,0,Math.PI*2);ctx.fill();}
      // ruined outpost buildings
      for(const [x,y,bw,bh] of [[w*.08,h*.18,64,42],[w*.82,h*.12,74,48],[w*.82,h*.78,58,40]] as number[][]){ctx.fillStyle="#1b2922aa";ctx.fillRect(x+5,y+7,bw,bh);ctx.fillStyle="#817c66";ctx.fillRect(x,y,bw,bh);ctx.fillStyle="#a59b7c";ctx.fillRect(x-3,y-5,bw+6,8);ctx.fillStyle="#414b40";ctx.fillRect(x+10,y+12,15,17);ctx.fillRect(x+bw-25,y+12,15,17);ctx.fillStyle="#303a32";ctx.fillRect(x+bw/2-5,y+bh-16,12,16);ctx.strokeStyle="#c5b99566";ctx.strokeRect(x,y,bw,bh);}
      // shell craters
      for(let i=0;i<9;i++){const x=(i*211+93)%w,y=(i*127+73)%h;ctx.fillStyle="#26352d55";ctx.beginPath();ctx.ellipse(x,y,11,6,.3,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#b0a17a55";ctx.stroke();}
      // sandbag defensive positions
      for(const [x,y] of [[w*.2,h*.25],[w*.78,h*.68],[w*.68,h*.2],[w*.25,h*.76]] as number[][]){ctx.fillStyle="#26352d88";ctx.fillRect(x-30,y-5,62,22);for(let j=0;j<4;j++){ctx.fillStyle=j%2?"#a09168":"#c0ad7e";ctx.beginPath();ctx.roundRect(x-27+j*14,y-10,14,12,4);ctx.fill();ctx.strokeStyle="#675e43";ctx.stroke();}ctx.fillStyle="#716747";ctx.fillRect(x-28,y+5,56,5);}
      const g=game.current;
      if(running&&!paused&&!g.over){const k=keys.current;let dx=0,dy=0;if(k.w||k.arrowup)dy--;if(k.s||k.arrowdown)dy++;if(k.a||k.arrowleft)dx--;if(k.d||k.arrowright)dx++;const n=Math.hypot(dx,dy)||1;g.x=clamp(g.x+dx/n*3.7*dt,15,w-15);g.y=clamp(g.y+dy/n*3.7*dt,15,h-15);
        g.spawn-=dt;g.fire-=dt;if(g.spawn<=0){const edge=Math.floor(Math.random()*4);g.enemies.push({x:edge===0?-15:edge===1?w+15:Math.random()*w,y:edge===2?-15:edge===3?h+15:Math.random()*h,hp:2,speed:.48+Math.random()*.25+g.wave*.025,phase:Math.random()*8});g.spawn=Math.max(17,62-g.wave*3);}
        // automatic rifle fire toward the closest enemy
        if(g.fire<=0&&g.enemies.length){const target=g.enemies.reduce((a,b)=>Math.hypot(a.x-g.x,a.y-g.y)<Math.hypot(b.x-g.x,b.y-g.y)?a:b);const a=Math.atan2(target.y-g.y,target.x-g.x);g.aimX=Math.cos(a);g.aimY=Math.sin(a);g.shots.push({x:g.x+g.aimX*13,y:g.y+g.aimY*13,vx:g.aimX*10,vy:g.aimY*10,life:48,enemy:false});g.fire=10;}
        g.enemies.forEach(s=>{const a=Math.atan2(g.y-s.y,g.x-s.x);s.x+=Math.cos(a)*s.speed*dt;s.y+=Math.sin(a)*s.speed*dt;s.phase+=.04*dt;if(Math.hypot(s.x-g.x,s.y-g.y)<24)g.hp-=.28*dt;});
        g.shots.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;const idx=b.enemy?-1:g.enemies.findIndex(s=>Math.hypot(s.x-b.x,s.y-b.y)<15);if(idx>=0){const s=g.enemies[idx];s.hp--;b.life=0;if(s.hp<=0){g.enemies.splice(idx,1);g.kills++;g.score+=100;}}});
        g.shots=g.shots.filter(b=>b.life>0&&b.x>-30&&b.x<w+30&&b.y>-30&&b.y<h+30);g.wave=1+Math.floor(g.kills/8);if(g.hp<=0){g.hp=0;g.over=true;setRunning(false);}
        if(frame%6===0){setHp(Math.ceil(g.hp));setScore(g.score);setKills(g.kills);setWave(g.wave);}
      }
      g.enemies.forEach(soldier);
      g.shots.forEach(b=>{ctx.fillStyle="#fff0b1";ctx.shadowBlur=14;ctx.shadowColor="#ffb84d";ctx.beginPath();ctx.arc(b.x,b.y,3,0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle="#ffdb8a99";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(b.x-b.vx*1.5,b.y-b.vy*1.5);ctx.lineTo(b.x,b.y);ctx.stroke();});
      // player soldier
      ctx.save();ctx.translate(g.x,g.y);ctx.rotate(Math.atan2(g.aimY,g.aimX));ctx.fillStyle="#26372d";ctx.beginPath();ctx.ellipse(0,4,14,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#769b72";ctx.fillRect(-9,-9,18,20);ctx.fillStyle="#d8b58f";ctx.beginPath();ctx.arc(0,-11,7,0,7);ctx.fill();ctx.fillStyle="#3c4b36";ctx.beginPath();ctx.arc(0,-14,8,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#263b35";ctx.fillRect(3,-3,22,5);ctx.fillStyle="#d4e9d8";ctx.beginPath();ctx.arc(0,0,2,0,7);ctx.fill();ctx.restore();
      if(!running||paused||g.over){ctx.fillStyle="#101711c9";ctx.fillRect(0,0,w,h);ctx.textAlign="center";ctx.fillStyle="#f3ead0";ctx.font="900 27px system-ui";ctx.fillText(g.over?"GÖREV BAŞARISIZ":paused?"DURAKLATILDI":"CEPHE HATTI",w/2,h/2-12);ctx.fillStyle="#e0dfc5";ctx.font="13px system-ui";ctx.fillText(g.over?"Skor: "+g.score+" · Etkisiz hale getirilen: "+g.kills:"Birliğini yönet. Düşman dalgalarını püskürt!",w/2,h/2+18);}
      raf=requestAnimationFrame(loop);
    };raf=requestAnimationFrame(loop);return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize)};
  },[running,paused]);
  return <main className="war-page"><header className="war-nav"><Link href="/" className="war-brand">✦ AY ZEK <b>ARENA</b></Link><Link href="/" className="war-back"><ArrowLeft size={15}/> Ana sayfa</Link></header>
    <section className="war-hero"><div className="war-kicker"><Shield size={14}/> TAKTİK SAVAŞ · GÖREV 01</div><h1>CEPHE <em>HATTI</em></h1><p>Birliğini yönet, düşman birliklerini durdur ve cepheyi savun.</p></section>
    <section className="war-layout"><div className="war-board"><div className="war-hud"><div><small><Heart size={12}/> SAĞLIK</small><b className={hp<35?"low":""}>{hp}%</b></div><div><small>SKOR</small><b>{score.toLocaleString("tr-TR")}</b></div><div><small>DALGA</small><b>{wave}</b></div><div><small><Target size={12}/> ETKİSİZ</small><b>{kills}</b></div></div>
      <canvas ref={canvas} className="war-canvas" onPointerMove={aim} onPointerDown={fire} aria-label="Taktik savaş oyun alanı"/>
      {!running&&<div className="war-start"><button onClick={start}><Crosshair size={17}/>{game.current.over?"YENİDEN BAŞLA":"GÖREVE BAŞLA"}</button></div>}
      <div className="war-controls"><span>WASD / OKLAR: HAREKET</span><span>OTOMATİK ATEŞ</span><span>FARE / DOKUN: NİŞAN AL</span><button onClick={()=>setPaused(p=>!p)} disabled={!running}>{paused?"DEVAM ET":"DURAKLAT"}</button></div>
    </div><aside className="war-info"><div className="war-card"><h2><Trophy size={17}/> GÖREV BRİFİNGİ</h2><p>Karşı birlikler bölgeye ilerliyor. Hareket halinde kal ve yaklaşmalarına izin verme.</p><div className="war-stat"><span>Görev</span><b>Bölge savunması</b></div><div className="war-stat"><span>Silah</span><b>Otomatik tüfek</b></div><div className="war-stat"><span>Tehdit</span><b>Artan düşman dalgaları</b></div></div><div className="war-card"><h2>TAKTİK ÖNERİLER</h2><p>• Sürekli hareket et, çevreni kontrol et.</p><p>• Her 8 düşmanda yeni dalga başlar.</p><p>• Düşmanlara çok yaklaşırsan sağlık kaybedersin.</p></div></aside></section>
    <footer className="war-footer">Kurgusal, şiddetsiz grafiklere sahip arcade savaş oyunu · Ay Zek</footer>
  </main>;
}
