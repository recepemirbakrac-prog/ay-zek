"use client";

import { useCallback, useEffect, useState } from "react";

type Point = { x: number; y: number };
const START: Point = { x: 0, y: 0 };
const TOKENS: Point[] = [{x:-4,y:-3},{x:4,y:-4},{x:5,y:3},{x:-3,y:5},{x:0,y:7}];

export default function CityGame() {
  const [player, setPlayer] = useState<Point>(START);
  const [collected, setCollected] = useState<number[]>([]);
  const [night, setNight] = useState(false);
  const [message, setMessage] = useState("Şehri keşfet ve 5 enerji kristalini topla!");
  const move = useCallback((dx:number,dy:number) => {
    setPlayer(p => {
      const next = { x: Math.max(-8, Math.min(8, p.x + dx)), y: Math.max(-8, Math.min(8, p.y + dy)) };
      const hit = TOKENS.findIndex((t,i) => !collected.includes(i) && t.x === next.x && t.y === next.y);
      if (hit >= 0) {
        setCollected(old => [...old, hit]);
        setMessage("Harika! Bir enerji kristali buldun ✨");
      } else setMessage("Keşfe devam et. Kristaller haritada parlıyor.");
      return next;
    });
  }, [collected]);
  useEffect(() => {
    const onKey = (e:KeyboardEvent) => {
      const keys:Record<string,[number,number]> = { ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0] };
      const step = keys[e.key];
      if (step) { e.preventDefault(); move(step[0],step[1]); }
    };
    window.addEventListener("keydown",onKey);
    return () => window.removeEventListener("keydown",onKey);
  },[move]);
  const reset = () => { setPlayer(START); setCollected([]); setMessage("Yeni macera başladı! Kristalleri bul."); };
  return (
    <main className={night ? "cityGame night" : "cityGame"}>
      <style jsx global>{`
        *{box-sizing:border-box}body{margin:0;background:#07131b;color:#f4f8fb;font-family:Arial,sans-serif}
        .cityGame{min-height:100vh;overflow:hidden;background:radial-gradient(ellipse at 50% 15%,#1c5261 0,#0b2532 48%,#07131b 100%);padding:24px clamp(14px,4vw,54px) 34px}
        .cityGame.night{background:radial-gradient(ellipse at 50% 15%,#27275c 0,#11152c 52%,#070b18 100%)}
        .gameTop{max-width:1200px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:14px}.gameLogo{font-size:21px;font-weight:900;letter-spacing:-.8px}.gameLogo span{color:#5eead4}.gameSub{color:#a8c1ca;font-size:12px;margin-top:5px}.gameActions{display:flex;gap:9px}.gameBtn{border:1px solid #ffffff25;background:#ffffff12;color:white;padding:10px 13px;border-radius:11px;font-weight:700;cursor:pointer}
        .gameLayout{max-width:1200px;margin:26px auto 0;display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:18px;align-items:stretch}
        .world{height:min(68vh,650px);min-height:420px;position:relative;overflow:hidden;border:1px solid #ffffff25;border-radius:22px;background:linear-gradient(#6cb9c4 0%,#9ad4c5 48%,#5eaa83 100%);box-shadow:0 25px 70px #0005;perspective:900px}
        .night .world{background:linear-gradient(#202a54 0%,#35446b 48%,#244d50 100%)}
        .sun{position:absolute;width:70px;height:70px;border-radius:50%;background:#ffe7a3;box-shadow:0 0 55px #ffe7a388;right:13%;top:10%}.night .sun{background:#e3eaff;box-shadow:0 0 35px #dbeafe88}
        .horizon{position:absolute;inset:0;background:linear-gradient(180deg,transparent 0 46%,#438c76 46% 100%);opacity:.6}
        .scene{position:absolute;left:50%;top:49%;width:620px;height:620px;transform:translate(-50%,-50%) rotateX(58deg) rotateZ(-35deg) scale(.83);transform-style:preserve-3d}
        .ground{position:absolute;inset:0;background-color:#5caa7c;background-image:linear-gradient(#ffffff14 1px,transparent 1px),linear-gradient(90deg,#ffffff14 1px,transparent 1px);background-size:50px 50px;border:2px solid #ffffff22}
        .road{position:absolute;background:#384b53;border:1px solid #ffffff20;box-shadow:inset 0 0 0 3px #293b43}
        .road:after{content:"";position:absolute;left:0;right:0;top:50%;border-top:3px dashed #e8dca1;opacity:.8}
        .roadX{left:0;top:270px;width:620px;height:80px}.roadY{left:270px;top:0;width:80px;height:620px;transform:rotate(90deg);transform-origin:center}
        .building{position:absolute;width:72px;height:72px;transform-style:preserve-3d}
        .tower{position:absolute;inset:0 0 0 0;background:var(--front);transform:translateZ(var(--height));border:2px solid #ffffff22;box-shadow:inset -9px -8px #0002}
        .tower:before{content:"";position:absolute;left:100%;top:0;width:var(--height);height:100%;background:var(--side);transform-origin:left;transform:skewY(-45deg)}
        .tower:after{content:"";position:absolute;left:0;bottom:100%;width:100%;height:var(--height);background:var(--roof);transform-origin:bottom;transform:skewX(-45deg)}
        .window{position:absolute;left:13px;top:14px;width:11px;height:15px;background:#d9f6ec;box-shadow:23px 0 #d9f6ec,0 25px #d9f6ec,23px 25px #d9f6ec;opacity:.8}
        .tree{position:absolute;width:24px;height:24px;border-radius:50%;background:#237b57;box-shadow:0 8px 0 #185b48,0 0 0 7px #4ab47a55;transform:translateZ(8px)}
        .token{position:absolute;z-index:4;width:25px;height:25px;border-radius:50%;background:#fff4a8;color:#b97709;display:grid;place-items:center;font-size:17px;box-shadow:0 0 18px #ffe56b;transform:translateZ(18px);animation:float 1.5s ease-in-out infinite}
        @keyframes float{50%{margin-top:-8px}}
        .avatar3d{position:absolute;z-index:5;width:38px;height:38px;border-radius:12px;background:linear-gradient(145deg,#f8fbff,#8bd5f1);border:3px solid white;box-shadow:0 9px 0 #287da1,0 14px 20px #0005;display:grid;place-items:center;font-size:22px;transform:translateZ(22px);transition:left .12s,top .12s}
        .cloud{position:absolute;color:#fff9;font-size:40px;filter:blur(.3px)}.cloud.one{left:15%;top:17%}.cloud.two{left:56%;top:9%;font-size:30px}
        .hud{background:#0d202bdb;border:1px solid #ffffff20;border-radius:20px;padding:20px;display:flex;flex-direction:column;gap:18px;backdrop-filter:blur(12px)}
        .hud h2{font-size:15px;margin:0}.hud p{font-size:12px;color:#a9c0c8;line-height:1.6;margin:7px 0 0}.stat{padding:13px;border-radius:13px;background:#ffffff0c;border:1px solid #ffffff14}.statLabel{font-size:10px;color:#91aeb8;text-transform:uppercase;letter-spacing:1px}.statValue{font-size:24px;font-weight:900;margin-top:5px}.progress{height:7px;background:#ffffff18;border-radius:8px;margin-top:10px;overflow:hidden}.progress i{display:block;height:100%;background:linear-gradient(90deg,#2dd4bf,#a3e635);transition:width .2s}
        .controls{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:170px;margin:0 auto}.controls button{height:43px;border:1px solid #ffffff25;background:#ffffff12;color:white;border-radius:10px;font-size:18px;cursor:pointer}.controls button:active{background:#2dd4bf55}.controls .blank{visibility:hidden}.message{border-left:3px solid #2dd4bf;padding:9px 11px;background:#2dd4bf12;color:#d5f8f2;font-size:11px;line-height:1.5;border-radius:0 8px 8px 0}
        .gameBottom{max-width:1200px;margin:14px auto 0;display:flex;justify-content:space-between;gap:12px;color:#91abb5;font-size:11px}.win{color:#a7f3d0;font-weight:800}
        @media(max-width:850px){.gameLayout{grid-template-columns:1fr}.world{height:56vh;min-height:350px}.hud{display:grid;grid-template-columns:1fr 1fr;gap:12px}.hud>div:first-child,.controls,.message{grid-column:1/-1}.controls{max-width:190px}.gameBottom{flex-direction:column}.scene{transform:translate(-50%,-50%) rotateX(58deg) rotateZ(-35deg) scale(.65)}}
        @media(max-width:480px){.cityGame{padding:16px 10px 24px}.gameLogo{font-size:17px}.gameSub{font-size:10px}.gameBtn{font-size:10px;padding:9px}.world{min-height:330px}.scene{scale:.8;transform:translate(-50%,-50%) rotateX(58deg) rotateZ(-35deg) scale(.57)}.hud{padding:14px}.statValue{font-size:20px}}
      `}</style>
      <header className="gameTop"><div><div className="gameLogo">AY ZEK <span>ŞEHİR 3D</span></div><div className="gameSub">Kendi şehrini keşfet · Mini açık dünya</div></div><div className="gameActions"><button className="gameBtn" onClick={()=>setNight(v=>!v)}>{night ? "☀️ Gündüz" : "🌙 Gece"}</button><button className="gameBtn" onClick={reset}>↻ Yeniden başla</button></div></header>
      <section className="gameLayout">
        <div className="world" aria-label="3 boyutlu şehir oyun alanı">
          <div className="sun"/><div className="horizon"/><div className="cloud one">☁</div><div className="cloud two">☁</div>
          <div className="scene"><div className="ground"/>
            <div className="road roadX"/><div className="road roadY"/>
            {[
              [-220,-205,110,"#4d92a8","#367487","#73b6c7"],[-105,-215,155,"#b87d57","#8e593f","#dca77b"],[70,-210,90,"#a7a3ca","#7977a7","#c9c7e4"],[185,-185,135,"#d2a35b","#9d713d","#edc982"],
              [-220,-95,85,"#cb806b","#98564c","#e8a18b"],[-105,-90,125,"#68a9a1","#417d79","#8bd1c5"],[80,-92,170,"#8e9db5","#596a88","#b9c7dc"],[190,-75,80,"#c28dba","#875d87","#e0b6d8"],
              [-220,90,145,"#a8a16c","#777144","#d3cc91"],[-110,105,95,"#c47f64","#8d5945","#e6a58b"],[85,100,125,"#6193a9","#426a82","#90bfd0"],[195,100,165,"#b49bce","#806a9c","#d4c3eb"],
              [-215,205,90,"#5e9e87","#3e7164","#8bc5a8"],[-100,210,150,"#c4a56d","#8e7448","#e6cf9a"],[90,210,95,"#8d9fb2","#5e7188","#b6c9dc"],[205,205,120,"#b77d75","#85554e","#dfa59b"]
            ].map(([x,y,h,front,side,roof],i)=><div key={i} className="building" style={{left:`calc(50% + ${x as number}px)`,top:`calc(50% + ${y as number}px)`,["--height" as string]:`${h as number}px`,["--front" as string]:front as string,["--side" as string]:side as string,["--roof" as string]:roof as string}}><div className="tower"><div className="window"/></div></div>)}
            {Array.from({length:18},(_,i)=><div key={i} className="tree" style={{left:`calc(50% + ${((i*73)%520)-260}px)`,top:`calc(50% + ${((i*47)%520)-260}px)`}}/>)}
            {TOKENS.map((t,i)=>!collected.includes(i)&&<div key={i} className="token" style={{left:`calc(50% + ${t.x*50-12}px)`,top:`calc(50% + ${t.y*50-12}px)`}}>✦</div>)}
            <div className="avatar3d" style={{left:`calc(50% + ${player.x*50-19}px)`,top:`calc(50% + ${player.y*50-19}px)`}}>🧑</div>
          </div>
        </div>
        <aside className="hud">
          <div><h2>🌆 Şehir görevi</h2><p>Şehrin sokaklarında dolaş, parlayan enerji kristallerini topla. Harita sınırları içinde özgürce gezebilirsin.</p></div>
          <div className="stat"><div className="statLabel">Toplanan kristal</div><div className="statValue">{collected.length} / 5</div><div className="progress"><i style={{width:`${collected.length*20}%`}}/></div></div>
          <div className="stat"><div className="statLabel">Konumun</div><div className="statValue" style={{fontSize:18}}>X: {player.x} · Y: {player.y}</div><p>Şehir merkezinden uzaklığın</p></div>
          <div><div className="statLabel" style={{textAlign:"center",marginBottom:10}}>Hareket kontrolleri</div><div className="controls"><button className="blank">·</button><button onClick={()=>move(0,-1)}>↑</button><button className="blank">·</button><button onClick={()=>move(-1,0)}>←</button><button onClick={()=>move(0,1)}>↓</button><button onClick={()=>move(1,0)}>→</button></div><p style={{textAlign:"center"}}>W A S D veya ok tuşları</p></div>
          <div className={collected.length===5?"message win":"message"}>{collected.length===5?"🏆 Tebrikler! Şehrin tüm kristallerini topladın!":message}</div>
        </aside>
      </section>
      <div className="gameBottom"><span>🎮 Kontrol: Klavye veya ekrandaki yön tuşları</span><span>3D Şehir Kaşifi · Ay Zek</span></div>
    </main>
  );
}
