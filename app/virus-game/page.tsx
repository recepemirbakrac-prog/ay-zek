"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bug, HeartPulse, Play, RotateCcw, Shield, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import "./game.css";

type Point = { x: number; y: number };
const W = 10;
const H = 7;
const startPlayer: Point = { x: 1, y: 3 };
const startVirus: Point[] = [{ x: 8, y: 2 }, { x: 7, y: 5 }, { x: 5, y: 1 }];
const startSerum: Point = { x: 4, y: 3 };
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const randomPoint = (avoid: Point[]): Point => {
  for (let i = 0; i < 80; i++) {
    const p = { x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) };
    if (!avoid.some((v) => same(v, p))) return p;
  }
  return { x: 0, y: 0 };
};

export default function VirusGamePage() {
  const [player, setPlayer] = useState<Point>(startPlayer);
  const [viruses, setViruses] = useState<Point[]>(startVirus);
  const [serum, setSerum] = useState<Point>(startSerum);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [active, setActive] = useState(false);
  const [over, setOver] = useState(false);
  const [level, setLevel] = useState(1);

  const reset = useCallback(() => {
    setPlayer(startPlayer); setViruses(startVirus); setSerum(startSerum);
    setScore(0); setLives(3); setLevel(1); setOver(false); setActive(true);
  }, []);

  const move = useCallback((dx: number, dy: number) => {
    if (!active || over) return;
    const next = { x: Math.max(0, Math.min(W - 1, player.x + dx)), y: Math.max(0, Math.min(H - 1, player.y + dy)) };
    if (viruses.some((v) => same(v, next))) {
      const remaining = lives - 1;
      setLives(remaining);
      if (remaining <= 0) { setOver(true); setActive(false); }
      setPlayer(startPlayer);
      return;
    }
    if (same(serum, next)) {
      setScore((n) => n + 10);
      setSerum(randomPoint([...viruses, next]));
    }
    setPlayer(next);
  }, [active, over, player, serum, viruses, lives]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const keys: Record<string, [number, number]> = { ArrowUp: [0,-1], w: [0,-1], ArrowDown: [0,1], s: [0,1], ArrowLeft: [-1,0], a: [-1,0], ArrowRight: [1,0], d: [1,0] };
      const dir = keys[e.key];
      if (dir) { e.preventDefault(); move(dir[0], dir[1]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  useEffect(() => {
    if (!active || over) return;
    const timer = window.setInterval(() => {
      const moved = viruses.map((v) => {
        const dx = player.x === v.x ? 0 : player.x > v.x ? 1 : -1;
        const dy = player.y === v.y ? 0 : player.y > v.y ? 1 : -1;
        const choices = Math.random() > .45 ? [{x:v.x+dx,y:v.y},{x:v.x,y:v.y+dy}] : [{x:v.x,y:v.y+dy},{x:v.x+dx,y:v.y}];
        return choices.find((p) => p.x >= 0 && p.x < W && p.y >= 0 && p.y < H) || v;
      });
      if (moved.some((v) => same(v, player))) {
        const remaining = lives - 1;
        setLives(remaining);
        if (remaining <= 0) { setOver(true); setActive(false); }
        setViruses(startVirus);
      } else {
        setViruses(moved);
      }
      setLevel((n) => Math.min(5, 1 + Math.floor(score / 50)));
    }, Math.max(350, 950 - level * 100));
    return () => window.clearInterval(timer);
  }, [active, over, player, viruses, lives, level, score]);

  const cells = Array.from({ length: W * H }, (_, i) => ({ x: i % W, y: Math.floor(i / W) }));
  return (
    <main className="virus-game">
      <header className="game-nav">
        <Link href="/" className="game-brand"><span><ShieldCheck size={20}/></span> AY ZEK <b>ARCADE</b></Link>
        <Link href="/virus-simulator" className="back-link"><ArrowLeft size={15}/> Simülatör</Link>
      </header>
      <section className="game-hero">
        <div className="game-kicker"><Sparkles size={14}/> ARCADE · GÜVENLİ OYUN</div>
        <h1>VİRÜS <span>AVCISI</span></h1>
        <p>Kırmızı virüslerden kaç, mavi panzehirleri topla ve sanal ağı kurtar!</p>
      </section>
      <section className="game-layout">
        <div className="board-wrap">
          <div className="board-top"><span><i/> SANAL LABORATUVAR</span><span>BÖLÜM {level}</span></div>
          <div className="game-board" role="grid" aria-label="Virüs Avcısı oyun alanı">
            {cells.map((cell) => {
              const isPlayer = same(player, cell);
              const isVirus = viruses.some((v) => same(v, cell));
              const isSerum = same(serum, cell);
              return <div className={`game-cell ${isPlayer ? "player-cell" : ""} ${isVirus ? "virus-cell" : ""} ${isSerum ? "serum-cell" : ""}`} key={cell.y * W + cell.x}>
                {isPlayer && <Shield size={21}/>}
                {isVirus && <Bug size={20}/>}
                {isSerum && <span className="serum-orb">✚</span>}
              </div>;
            })}
            {!active && !over && <div className="board-overlay"><div><ShieldCheck size={35}/><b>Laboratuvara hazır mısın?</b><span>Başlat ve virüslerden kaç!</span><button onClick={reset}><Play size={16}/> Oyuna başla</button></div></div>}
            {over && <div className="board-overlay"><div><Bug size={35}/><b>Oyun bitti!</b><span>Toplam puanın: {score}</span><button onClick={reset}><RotateCcw size={16}/> Yeniden oyna</button></div></div>}
          </div>
          <div className="board-help">Hareket: <b>W A S D</b> veya <b>← ↑ ↓ →</b></div>
        </div>
        <aside className="game-side">
          <div className="score-card"><span><Trophy size={17}/> PUAN</span><strong>{score}</strong><small>Her panzehir +10 puan</small></div>
          <div className="lives-card"><span><HeartPulse size={17}/> CAN HAKKI</span><div>{[1,2,3].map((n)=><i className={n <= lives ? "life-on" : ""} key={n}/>)}</div></div>
          <div className="legend-card"><b>OYUN REHBERİ</b><div><span className="legend-player"><Shield size={15}/></span> Sen – Koruyucu</div><div><span className="legend-virus"><Bug size={15}/></span> Virüs – Yakalanma!</div><div><span className="legend-serum">✚</span> Panzehir – Topla</div></div>
          <div className="mobile-pad"><span>HAREKET KONTROLLERİ</span><button onClick={()=>move(0,-1)} aria-label="Yukarı">↑</button><div><button onClick={()=>move(-1,0)} aria-label="Sol">←</button><button onClick={()=>move(0,1)} aria-label="Aşağı">↓</button><button onClick={()=>move(1,0)} aria-label="Sağ">→</button></div></div>
          <button className="restart-game" onClick={reset}><RotateCcw size={16}/> {active ? "Oyunu sıfırla" : "Oyunu başlat"}</button>
        </aside>
      </section>
      <footer className="game-footer"><ShieldCheck size={15}/> Bu oyundaki virüsler tamamen kurgusaldır; cihazına, dosyalarına veya ağına erişmez.</footer>
    </main>
  );
}
