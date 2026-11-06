"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Tile = "grass" | "tree" | "rock" | "berry" | "water" | "wood" | "camp" | "shelter";
type Cell = { type: Tile; id: number };
const W = 15, H = 9;
const initialMap: Cell[] = Array.from({ length: W * H }, (_, i) => {
  const x = i % W, y = Math.floor(i / W);
  if (x === 0 || y === 0 || x === W - 1 || y === H - 1) return { type: "tree", id: i };
  if ((x * 7 + y * 11) % 17 === 0) return { type: "rock", id: i };
  if ((x * 5 + y * 3) % 19 === 0) return { type: "berry", id: i };
  if ((x * 13 + y * 7) % 29 === 0) return { type: "water", id: i };
  if ((x * 3 + y * 5) % 13 === 0) return { type: "tree", id: i };
  return { type: "grass", id: i };
});
const icons: Record<Tile, string> = { grass: "🌿", tree: "🌲", rock: "🪨", berry: "🫐", water: "💧", wood: "🪵", camp: "🔥", shelter: "🏕️" };

export default function SurvivalGame() {
  const [map, setMap] = useState(initialMap);
  const [player, setPlayer] = useState({ x: 7, y: 4 });
  const [stats, setStats] = useState({ hp: 100, food: 90, water: 90, wood: 0, stone: 0, berries: 0 });
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(8);
  const [message, setMessage] = useState("Ormanda uyandın. İlk işin yiyecek ve odun bulmak!");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shelter, setShelter] = useState(false);
  const [campfire, setCampfire] = useState(false);
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const night = hour >= 20 || hour < 6;
  const tileIndex = (x: number, y: number) => y * W + x;
  const nearby = useMemo(() => map.filter(c => {
    const x = c.id % W, y = Math.floor(c.id / W);
    return Math.abs(x - player.x) + Math.abs(y - player.y) <= 1 && c.type !== "grass";
  }), [map, player]);

  const move = useCallback((dx: number, dy: number) => {
    if (gameOver || won) return;
    const nx = Math.max(1, Math.min(W - 2, player.x + dx));
    const ny = Math.max(1, Math.min(H - 2, player.y + dy));
    const cell = map[tileIndex(nx, ny)];
    if (cell.type === "tree" || cell.type === "rock" || cell.type === "water") {
      setMessage(cell.type === "water" ? "Su kenarındasın. Yaklaşmak için başka yönden dene." : "Yolun kapalı! Etrafından dolaş.");
      return;
    }
    setPlayer({ x: nx, y: ny });
    setStarted(true);
  }, [gameOver, won, player, map]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const dirs: Record<string, [number, number]> = { w: [0,-1], arrowup: [0,-1], s: [0,1], arrowdown: [0,1], a: [-1,0], arrowleft: [-1,0], d: [1,0], arrowright: [1,0] };
      if (dirs[k]) { e.preventDefault(); move(...dirs[k]); }
      if (k === "e") gather();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!started || gameOver || won) return;
    const timer = window.setInterval(() => {
      setHour(h => {
        const next = (h + 1) % 24;
        if (next === 0) setDay(d => d + 1);
        return next;
      });
      setStats(s => {
        const food = Math.max(0, s.food - 2);
        const water = Math.max(0, s.water - 3);
        const hp = Math.max(0, s.hp - (food === 0 || water === 0 ? 8 : night ? 1 : 0));
        if (hp <= 0) setGameOver(true);
        return { ...s, food, water, hp };
      });
    }, 9000);
    return () => window.clearInterval(timer);
  }, [started, gameOver, won, night]);

  const gather = () => {
    if (gameOver || won) return;
    const target = nearby.find(c => ["tree", "rock", "berry", "water"].includes(c.type));
    if (!target) { setMessage("Yakınında toplanacak kaynak yok. 🌲 Ağaç, 🪨 taş veya 🫐 yemiş ara."); return; }
    if (target.type === "tree") {
      setStats(s => ({ ...s, wood: s.wood + 3 }));
      setMap(m => m.map(c => c.id === target.id ? { ...c, type: "wood" } : c));
      setMessage("Ağaçtan 3 odun topladın. 🪵");
    } else if (target.type === "rock") {
      setStats(s => ({ ...s, stone: s.stone + 2 }));
      setMap(m => m.map(c => c.id === target.id ? { ...c, type: "grass" } : c));
      setMessage("Kayadan 2 taş çıkardın. 🪨");
    } else if (target.type === "berry") {
      setStats(s => ({ ...s, berries: s.berries + 2 }));
      setMap(m => m.map(c => c.id === target.id ? { ...c, type: "grass" } : c));
      setMessage("2 avuç yabani yemiş topladın. 🫐");
    } else {
      setStats(s => ({ ...s, water: Math.min(100, s.water + 35) }));
      setMessage("Temiz su içtin. Susuzluğun azaldı. 💧");
    }
  };

  const eat = () => {
    if (stats.berries <= 0) { setMessage("Yiyeceğin yok. Önce yemiş topla!"); return; }
    setStats(s => ({ ...s, berries: s.berries - 1, food: Math.min(100, s.food + 28) }));
    setMessage("Yabani yemiş yedin. Açlığın azaldı.");
  };
  const craft = (kind: "fire" | "shelter") => {
    if (kind === "fire") {
      if (campfire) return setMessage("Zaten bir kamp ateşin var.");
      if (stats.wood < 4 || stats.stone < 2) return setMessage("Kamp ateşi için 4 odun ve 2 taş gerekli.");
      setStats(s => ({ ...s, wood: s.wood - 4, stone: s.stone - 2 }));
      setCampfire(true); setMessage("Kamp ateşini kurdun! Gece daha güvendesin. 🔥");
    } else {
      if (shelter) return setMessage("Barınağın hazır.");
      if (stats.wood < 8) return setMessage("Barınak için 8 odun gerekli.");
      setStats(s => ({ ...s, wood: s.wood - 8 }));
      setShelter(true); setMessage("Barınağını kurdun. Fırtınadan korunabilirsin. 🏕️");
      setWon(true);
    }
  };
  const restart = () => {
    setMap(initialMap); setPlayer({ x: 7, y: 4 }); setStats({ hp: 100, food: 90, water: 90, wood: 0, stone: 0, berries: 0 });
    setDay(1); setHour(8); setMessage("Ormanda uyandın. İlk işin yiyecek ve odun bulmak!");
    setGameOver(false); setWon(false); setShelter(false); setCampfire(false); setStarted(false);
  };

  return (
    <main className="survival">
      <style jsx>{`
        .survival{min-height:100vh;background:radial-gradient(ellipse at 50% -10%,#244b3b 0%,#101c19 48%,#0b1210 100%);color:#f4f4e9;padding:28px 18px 44px;font-family:Arial,sans-serif}
        .shell{max-width:1120px;margin:auto}.top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:20px}
        .brand{font-size:12px;letter-spacing:3px;color:#a8c7a9;font-weight:800}.brand span{color:#e8bd73}.top h1{font-size:clamp(27px,4vw,42px);margin:7px 0 5px;letter-spacing:-1.5px}.sub{color:#a4b6a5;font-size:13px;margin:0}
        .daybox{border:1px solid #ffffff20;background:#ffffff0a;border-radius:14px;padding:12px 16px;text-align:right;min-width:110px}.daybox b{font-size:20px}.daybox small{display:block;color:#a8bba8;margin-top:4px}
        .stats{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;margin:18px 0}.stat{background:#ffffff0b;border:1px solid #ffffff14;border-radius:12px;padding:11px 12px}.stat label{display:block;color:#a7b8a5;font-size:10px;text-transform:uppercase;letter-spacing:1px}.stat b{font-size:17px;display:block;margin-top:6px}.bar{height:5px;background:#ffffff17;border-radius:9px;margin-top:8px;overflow:hidden}.bar i{display:block;height:100%;border-radius:9px;background:#83c58a}
        .layout{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:15px}.panel{border:1px solid #ffffff1a;background:#111c18d9;border-radius:17px;padding:14px;box-shadow:0 18px 55px #0003}.maphead{display:flex;justify-content:space-between;align-items:center;padding:3px 3px 12px}.maphead b{font-size:13px}.maphead small{color:#9eaf9e;font-size:11px}
        .map{display:grid;grid-template-columns:repeat(15,minmax(0,1fr));gap:3px;padding:8px;background:#14281c;border-radius:12px;border:1px solid #41604455;overflow:hidden}
        .cell{aspect-ratio:1;display:grid;place-items:center;border-radius:5px;background:linear-gradient(145deg,#31583a,#27482f);font-size:clamp(12px,2.2vw,23px);position:relative;user-select:none}
        .cell:nth-child(odd){background:linear-gradient(145deg,#355f3e,#294d33)}.cell.player{outline:2px solid #ffe18c;background:#9c793b;z-index:1;box-shadow:0 0 18px #ffda6b88}.cell.player:after{content:"🧍";font-size:clamp(15px,2.6vw,27px)}
        .cell.tree{background:#1b3828}.cell.water{background:#23546a}.cell.rock{background:#47534a}.cell.berry{background:#345239}.cell.wood{background:#4a5438}
        .controls{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:12px}.dpad{display:grid;grid-template-columns:repeat(3,42px);grid-template-rows:repeat(2,38px);gap:4px}.dpad button,.action{border:1px solid #ffffff20;background:#263c30;color:#f7f4df;border-radius:9px;cursor:pointer;font-weight:700}.dpad button{font-size:16px}.dpad button:active,.action:active{transform:scale(.96)}.up{grid-column:2}.left{grid-column:1;grid-row:2}.down{grid-column:2;grid-row:2}.right{grid-column:3;grid-row:2}
        .actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.action{padding:11px 13px;font-size:12px}.primary{background:#d6a75d;color:#1d241b;border:0}.side h3{font-size:14px;margin:2px 0 12px}.side section+section{border-top:1px solid #ffffff16;margin-top:15px;padding-top:14px}.craft{width:100%;display:flex;justify-content:space-between;gap:8px;text-align:left;margin:7px 0;padding:10px;border:1px solid #ffffff17;border-radius:10px;background:#ffffff08;color:#f3f0df;cursor:pointer}.craft small{color:#9db19d}.craft:disabled{opacity:.45;cursor:not-allowed}.note{margin-top:12px;padding:12px;border-radius:11px;background:#d4a75b16;border:1px solid #d4a75b33;color:#e9d7b4;font-size:12px;line-height:1.55;min-height:58px}.objective{font-size:12px;color:#b8c8b5;line-height:1.7}.objective b{color:#f3e6c8}.legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:11px;color:#9fb19f;font-size:10px}.legend span{white-space:nowrap}.overlay{position:fixed;inset:0;background:#06100edb;display:grid;place-items:center;padding:20px;z-index:5}.modal{max-width:420px;text-align:center;padding:28px;border:1px solid #ffffff25;background:#14251d;border-radius:20px}.modal h2{font-size:28px;margin:5px 0 10px}.modal p{color:#bac9b9;line-height:1.7;font-size:13px}.modal button{padding:12px 22px;border:0;border-radius:10px;background:#d6a75d;font-weight:800;cursor:pointer}.help{color:#9eb29e;border:0;background:none;cursor:pointer;font-size:12px}@media(max-width:800px){.layout{grid-template-columns:1fr}.stats{grid-template-columns:repeat(3,1fr)}.side{display:grid;grid-template-columns:1fr 1fr;gap:12px}.side section+section{border:0;margin:0;padding:0}.controls{align-items:flex-end}.actions{max-width:55%}}@media(max-width:480px){.survival{padding:18px 9px}.stats{gap:6px}.stat{padding:9px}.map{gap:2px;padding:5px}.cell{font-size:clamp(10px,3vw,17px)}.controls{flex-direction:column;align-items:center}.actions{max-width:none;justify-content:center}.side{display:block}.side section+section{border-top:1px solid #ffffff16;margin-top:15px;padding-top:14px}}
      `}</style>
      <div className="shell">
        <header className="top"><div><div className="brand">AY ZEK <span>GAMES</span></div><h1>Vahşi Doğa <span style={{color:"#d8ad68"}}>Survival</span></h1><p className="sub">Doğaya karşı tek başınasın. Hayatta kalabilecek misin?</p></div><div className="daybox"><b>{night ? "🌙 Gece" : "☀️ Gündüz"}</b><small>Gün {day} · {String(hour).padStart(2,"0")}:00</small></div></header>
        <div className="stats">
          {([["❤️ Sağlık",stats.hp],["🍗 Açlık",stats.food],["💧 Susuzluk",stats.water]] as [string,number][]).map(([name,value])=><div className="stat" key={name}><label>{name}</label><b>{value}%</b><div className="bar"><i style={{width:value+"%",background:value<30?"#d66b5e":"#83c58a"}}/></div></div>)}
          <div className="stat"><label>🪵 Odun</label><b>{stats.wood}</b></div><div className="stat"><label>🪨 Taş</label><b>{stats.stone}</b></div><div className="stat"><label>🫐 Yemiş</label><b>{stats.berries}</b></div>
        </div>
        <div className="layout">
          <div className="panel">
            <div className="maphead"><b>🌳 ORMAN HARİTASI</b><small>WASD / ok tuşları ile hareket et</small></div>
            <div className="map" aria-label="Hayatta kalma oyun haritası">
              {map.map(c=>{const x=c.id%W,y=Math.floor(c.id/W),isPlayer=player.x===x&&player.y===y;return <div key={c.id} className={`cell ${c.type} ${isPlayer?"player":""}`} title={c.type}>{isPlayer?"":icons[c.type]}</div>;})}
            </div>
            <div className="legend"><span>🌲 Ağaç</span><span>🪨 Taş</span><span>🫐 Yemiş</span><span>💧 Su</span><span>🧍 Sen</span></div>
            <div className="controls">
              <div className="dpad"><button className="up" onClick={()=>move(0,-1)}>▲</button><button className="left" onClick={()=>move(-1,0)}>◀</button><button className="down" onClick={()=>move(0,1)}>▼</button><button className="right" onClick={()=>move(1,0)}>▶</button></div>
              <div className="actions"><button className="action primary" onClick={gather}>✋ Topla (E)</button><button className="action" onClick={eat}>🍇 Ye</button><button className="action" onClick={()=>setShowHelp(true)}>❔ Yardım</button></div>
            </div>
            <div className="note">📜 {message}</div>
          </div>
          <aside className="panel side">
            <section><h3>🎯 Görev</h3><p className="objective">İlk gece gelmeden kaynaklarını topla, <b>kamp ateşi</b> kur ve kendine bir <b>barınak</b> inşa et. Barınak kurarsan kazanırsın!</p></section>
            <section><h3>🛠️ Üretim</h3>
              <button className="craft" onClick={()=>craft("fire")} disabled={campfire}><span>🔥 Kamp ateşi<small style={{display:"block"}}>4 odun + 2 taş</small></span><b>{campfire?"✓":"Üret"}</b></button>
              <button className="craft" onClick={()=>craft("shelter")} disabled={shelter}><span>🏕️ Barınak<small style={{display:"block"}}>8 odun</small></span><b>{shelter?"✓":"Üret"}</b></button>
            </section>
            <section><h3>💡 Hayatta kalma ipuçları</h3><p className="objective">• Her adımda zaman ilerler.<br/>• Açlık ve susuzluk düzenli azalır.<br/>• Su kaynağına yaklaş ve topla.<br/>• Yemiş yiyerek açlığını gider.<br/>• Kaynakları toplamak için yanlarına git.</p></section>
            <section><button className="craft" onClick={restart}><span>↻ Oyunu sıfırla</span><b>Yeniden başla</b></button></section>
          </aside>
        </div>
      </div>
      {showHelp&&<div className="overlay" onClick={()=>setShowHelp(false)}><div className="modal" onClick={e=>e.stopPropagation()}><h2>Nasıl oynanır?</h2><p>WASD veya yön tuşlarıyla ormanda dolaş. Kaynakların yanına gelince Topla düğmesine bas. Yemiş yiyerek açlığını, su kaynağından içerek susuzluğunu azalt. 4 odun ve 2 taşla ateş, 8 odunla barınak yap.</p><button onClick={()=>setShowHelp(false)}>Oyuna dön</button></div></div>}
      {(gameOver||won)&&<div className="overlay"><div className="modal"><div style={{fontSize:44}}>{won?"🏆":"💀"}</div><h2>{won?"Hayatta kaldın!":"Oyun bitti"}</h2><p>{won?"Harika! Barınağını kurdun ve vahşi doğada güvenli bir yer edindin.":"Doğa kazandı... Daha iyi hazırlanıp yeniden dene."} {day}. güne ulaştın.</p><button onClick={restart}>Yeniden oyna</button></div></div>}
    </main>
  );
}
