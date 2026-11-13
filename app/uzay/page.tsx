"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Shot={x:number;y:number}; type Enemy={x:number;y:number;speed:number};
export default function SpaceGame(){
 const canvas=useRef<HTMLCanvasElement>(null);
 const keys=useRef({left:false,right:false,fire:false});
 const [score,setScore]=useState(0),[lives,setLives]=useState(3),[level,setLevel]=useState(1),[playing,setPlaying]=useState(false),[over,setOver]=useState(false),[best,setBest]=useState(0);
 const reset=useRef<()=>void>(()=>{});
 useEffect(()=>{
  const el=canvas.current,ctx=el?.getContext("2d");if(!el||!ctx)return;
  let w=900,h=560,ship=450,shots:Shot[]=[],enemies:Enemy[]=[],stars=Array.from({length:100},()=>({x:Math.random()*w,y:Math.random()*h,s:20+Math.random()*70})),points=0,hp=3,lvl=1,active=false,last=0,spawn=0,cool=0,raf=0;
  const size=()=>{const r=el.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=Math.max(320,r.width);h=Math.max(420,r.height);el.width=w*d;el.height=h*d;ctx.setTransform(d,0,0,d,0,0);};size();window.addEventListener("resize",size);
  reset.current=()=>{ship=w/2;shots=[];enemies=[];points=0;hp=3;lvl=1;spawn=0;cool=0;active=true;};
  const down=(e:KeyboardEvent)=>{if(["ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if(["ArrowLeft","a","A"].includes(e.key))keys.current.left=true;if(["ArrowRight","d","D"].includes(e.key))keys.current.right=true;if(e.key===" ")keys.current.fire=true;};
  const up=(e:KeyboardEvent)=>{if(["ArrowLeft","a","A"].includes(e.key))keys.current.left=false;if(["ArrowRight","d","D"].includes(e.key))keys.current.right=false;if(e.key===" ")keys.current.fire=false;};
  window.addEventListener("keydown",down);window.addEventListener("keyup",up);
  try{setBest(Number(localStorage.getItem("ayzek-space-record")||0));}catch{}
  const loop=(t:number)=>{const dt=Math.min((t-last)/1000||0,.04);last=t;
   const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,"#080d27");bg.addColorStop(1,"#17234b");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
   for(const s of stars){s.y+=s.s*dt;if(s.y>h){s.y=0;s.x=Math.random()*w;}ctx.fillStyle="rgba(220,238,255,.65)";ctx.fillRect(s.x,s.y,2,2);}
   if(active){if(keys.current.left)ship-=340*dt;if(keys.current.right)ship+=340*dt;ship=Math.max(25,Math.min(w-25,ship));cool-=dt;if(keys.current.fire&&cool<=0){shots.push({x:ship,y:h-65});cool=.19;}
    spawn-=dt;if(spawn<=0){enemies.push({x:30+Math.random()*(w-60),y:-20,speed:75+lvl*10});spawn=Math.max(.35,1-lvl*.045);}
    shots.forEach(s=>s.y-=580*dt);shots=shots.filter(s=>s.y>-15);
    enemies.forEach(e=>e.y+=e.speed*dt);
    for(const e of enemies){for(const s of shots){if(Math.hypot(e.x-s.x,e.y-s.y)<22){e.y=h+50;s.y=-30;points+=10;setScore(points);if(points>best){setBest(points);try{localStorage.setItem("ayzek-space-record",String(points));}catch{}}}}}
    shots=shots.filter(s=>s.y>-15);enemies=enemies.filter(e=>e.y<h+30);
    for(const e of enemies){if(Math.hypot(e.x-ship,e.y-(h-48))<27){e.y=h+80;hp--;setLives(hp);}}
    if(enemies.some(e=>e.y>h-5)){hp--;setLives(hp);enemies=enemies.filter(e=>e.y<=h-5);}
    const newLevel=1+Math.floor(points/100);if(newLevel!==lvl){lvl=newLevel;setLevel(lvl);}
    if(hp<=0){active=false;setPlaying(false);setOver(true);}
   }
   // Planet and stars
   const px=w-82,py=88;ctx.fillStyle="#6659ad";ctx.beginPath();ctx.arc(px,py,24,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#b7a8ff";ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(px,py,38,10,-.3,0,Math.PI*2);ctx.stroke();
   shots.forEach(s=>{ctx.shadowBlur=12;ctx.shadowColor="#69f5ff";ctx.fillStyle="#d5ffff";ctx.fillRect(s.x-2,s.y-12,4,15);});ctx.shadowBlur=0;
   enemies.forEach(e=>{ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle="#ff557f";ctx.shadowColor="#ff557f";ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(0,19);ctx.lineTo(19,-8);ctx.lineTo(6,-4);ctx.lineTo(0,-17);ctx.lineTo(-6,-4);ctx.lineTo(-19,-8);ctx.closePath();ctx.fill();ctx.restore();});
   ctx.save();ctx.translate(ship,h-48);ctx.shadowColor="#54eaff";ctx.shadowBlur=20;ctx.fillStyle="#62e6ff";ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(19,18);ctx.lineTo(0,10);ctx.lineTo(-19,18);ctx.closePath();ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(0,-5,5,9,0,0,Math.PI*2);ctx.fill();ctx.restore();
   raf=requestAnimationFrame(loop);
  };raf=requestAnimationFrame(loop);
  return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",size);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);};
 },[best]);
 const hold=(key:"left"|"right"|"fire",v:boolean)=>(e:React.PointerEvent<HTMLButtonElement>)=>{e.preventDefault();keys.current[key]=v;};
 const btn:React.CSSProperties={padding:"13px 23px",borderRadius:13,border:"1px solid #657bb8",background:"#294e87",color:"white",fontWeight:800,touchAction:"none"};
 return <main style={{minHeight:"100vh",padding:"22px 16px 40px",background:"radial-gradient(ellipse at top,#202b5b,#080b1b 70%)",color:"white",fontFamily:"Arial,sans-serif"}}><div style={{maxWidth:1000,margin:"auto"}}>
 <header style={{display:"flex",justifyContent:"space-between"}}><Link href="/" style={{color:"#b8c5ff",textDecoration:"none"}}>← Ay Zek'e dön</Link><span style={{color:"#93a5dc",letterSpacing:3,fontSize:12}}>AY ZEK ARCADE</span></header>
 <div style={{textAlign:"center",margin:"26px 0 20px"}}><div style={{color:"#74eaff",letterSpacing:4,fontSize:12}}>GALAKSİ SENİ BEKLİYOR</div><h1 style={{fontSize:"clamp(34px,6vw,56px)",margin:"8px 0"}}>UZAY <span style={{color:"#74eaff"}}>SAVAŞI</span></h1><p style={{color:"#aab6d8"}}>Düşman gemilerini yok et, galaksiyi kurtar!</p></div>
 <section style={{padding:12,borderRadius:20,background:"#131d3be8",border:"1px solid #3a4b7b",boxShadow:"0 25px 80px #0008"}}>
 <div style={{display:"flex",justifyContent:"space-around",textAlign:"center",padding:"5px 0 14px"}}><div><small>PUAN</small><div style={{fontSize:25,color:"#79edff"}}>{score}</div></div><div><small>CAN</small><div style={{fontSize:23,color:"#ff7597"}}>{"♥".repeat(Math.max(0,lives))}{"♡".repeat(Math.max(0,3-lives))}</div></div><div><small>SEVİYE</small><div style={{fontSize:25}}>{level}</div></div><div><small>REKOR</small><div style={{fontSize:25,color:"#ffd47b"}}>{best}</div></div></div>
 <div style={{height:"min(62vw,560px)",minHeight:420,position:"relative",overflow:"hidden",borderRadius:14,border:"1px solid #42527c"}}><canvas ref={canvas} style={{width:"100%",height:"100%",display:"block"}}/>
 {(!playing)&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:20,background:"#080d27b8"}}><div style={{fontSize:48}}>{over?"💥":"🛸"}</div><h2>{over?"OYUN BİTTİ":"SAVAŞA HAZIR MISIN?"}</h2><p style={{color:"#bdc8e4"}}>{over?"Toplam "+score+" puan kazandın. Bir tur daha dene!":"Düşmanları vur, çarpışmalardan kaç ve hayatta kal."}</p><button onClick={()=>{setScore(0);setLives(3);setLevel(1);setOver(false);setPlaying(true);reset.current();}} style={{...btn,background:"linear-gradient(90deg,#40d9ed,#7776ff)",color:"#071024",padding:"14px 30px"}}>{over?"TEKRAR OYNA":"OYUNA BAŞLA"} ▶</button></div>}</div>
 <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap",paddingTop:14}}><button style={btn} onPointerDown={hold("left",true)} onPointerUp={hold("left",false)} onPointerLeave={hold("left",false)}>◀ SOL</button><button style={{...btn,background:"#783b91"}} onPointerDown={hold("fire",true)} onPointerUp={hold("fire",false)} onPointerLeave={hold("fire",false)}>✦ ATEŞ</button><button style={btn} onPointerDown={hold("right",true)} onPointerUp={hold("right",false)} onPointerLeave={hold("right",false)}>SAĞ ▶</button></div></section>
 <p style={{textAlign:"center",color:"#9eaccd",fontSize:13,lineHeight:1.8}}>Bilgisayar: ← → veya A / D ile hareket et, BOŞLUK ile ateş et.<br/>Telefon: SOL, SAĞ ve ATEŞ tuşlarına basılı tut. Her 100 puanda seviye atlarsın.</p>
 </div></main>;
}
