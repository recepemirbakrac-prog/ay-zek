"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Bug, CheckCircle2, CirclePause, CirclePlay, Monitor, Phone, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import "./simulator.css";

type Kind = "computer" | "phone";
type Status = "safe" | "infected" | "protected";
type Device = { id: number; name: string; kind: Kind; status: Status };

const initialDevices: Device[] = [
  { id: 1, name: "Masaüstü PC", kind: "computer", status: "infected" },
  { id: 2, name: "Dizüstü PC", kind: "computer", status: "safe" },
  { id: 3, name: "Ofis bilgisayarı", kind: "computer", status: "safe" },
  { id: 4, name: "Oyun bilgisayarı", kind: "computer", status: "safe" },
  { id: 5, name: "Android telefon", kind: "phone", status: "safe" },
  { id: 6, name: "iPhone", kind: "phone", status: "safe" },
  { id: 7, name: "Yedek telefon", kind: "phone", status: "safe" },
  { id: 8, name: "Tablet", kind: "phone", status: "safe" },
  { id: 9, name: "Ev bilgisayarı", kind: "computer", status: "safe" },
  { id: 10, name: "İş telefonu", kind: "phone", status: "safe" },
  { id: 11, name: "Mini PC", kind: "computer", status: "safe" },
  { id: 12, name: "Test telefonu", kind: "phone", status: "safe" },
];

export default function VirusSimulatorPage() {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [mode, setMode] = useState<"all" | Kind>("all");
  const [log, setLog] = useState<string[]>(["Simülasyon hazır. İlk sanal cihaz örnek olarak işaretlendi."]);
  const infected = devices.filter((d) => d.status === "infected").length;
  const protectedCount = devices.filter((d) => d.status === "protected").length;
  const safe = devices.length - infected - protectedCount;
  const visibleDevices = useMemo(() => devices.filter((d) => mode === "all" || d.kind === mode), [devices, mode]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      const candidates = devices.filter((d) => d.status === "safe");
      if (!candidates.length) {
        setRunning(false);
        return;
      }
      const infectedNow = devices.filter((d) => d.status === "infected").length;
      const spreadCount = Math.min(candidates.length, Math.max(1, Math.ceil(infectedNow / 3)));
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      const newlyInfected = new Set(shuffled.slice(0, spreadCount).map((d) => d.id));
      setDevices(devices.map((d) => newlyInfected.has(d.id) ? { ...d, status: "infected" } : d));
      setLog((old) => [`Tur ${tick + 1}: ${newlyInfected.size} sanal cihaz etkilendi.`, ...old].slice(0, 5));
      setTick(tick + 1);
    }, 1300);
    return () => window.clearTimeout(timer);
  }, [running, devices, tick]);

  const reset = () => {
    setRunning(false);
    setDevices(initialDevices);
    setTick(0);
    setLog(["Simülasyon sıfırlandı. Sanal ağ yeniden hazır."]);
  };

  const clean = () => {
    setRunning(false);
    setDevices((current) => current.map((d) => d.status === "infected" ? { ...d, status: "protected" } : d));
    setLog((old) => ["Güvenli temizleme tamamlandı. Etkilenen sanal cihazlar korumaya alındı.", ...old].slice(0, 5));
  };

  const start = () => {
    if (infected === 0) {
      setDevices(initialDevices);
      setTick(0);
    }
    setRunning(true);
    setLog((old) => ["Sanal yayılma deneyi başlatıldı.", ...old].slice(0, 5));
  };

  return (
    <main className="sim-shell">
      <header className="sim-topbar">
        <a className="sim-brand" href="/"><span className="brand-mark"><ShieldCheck size={20} /></span><span>AY ZEK <b>LAB</b></span></a>
        <div className="sim-top-label"><span className="live-dot" /> GÜVENLİ SANDBOX</div><a href="/virus-game" style={{color:"#69dcbc",fontSize:12,textDecoration:"none"}}>Virüs Avcısı oyununa geç →</a>
      </header>

      <section className="sim-hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> SİBER GÜVENLİK EĞİTİMİ</div>
          <h1>Virüs Yayılım<br /><span>Simülatörü</span></h1>
          <p>Bilgisayar ve telefonlardan oluşan sanal bir ağda zararlı yazılımın nasıl yayılabileceğini gözlemle. Gerçek dosyalara, cihazlara veya ağa dokunulmaz.</p>
          <div className="hero-tags"><span><Monitor size={14}/> Bilgisayar</span><span><Phone size={14}/> Telefon</span><span><ShieldCheck size={14}/> Zararsız deney</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
          <div className="core"><Bug size={52}/><span>SIM</span></div>
          <div className="orbit-node node-a"><Monitor size={19}/></div><div className="orbit-node node-b"><Phone size={18}/></div><div className="orbit-node node-c"><Monitor size={18}/></div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Simülasyon istatistikleri">
        <div className="stat-card"><span className="stat-icon"><Activity size={18}/></span><small>TOPLAM SANAL CİHAZ</small><strong>{devices.length}</strong></div>
        <div className="stat-card infected-stat"><span className="stat-icon"><Bug size={18}/></span><small>ETKİLENEN</small><strong>{infected}</strong></div>
        <div className="stat-card"><span className="stat-icon"><CheckCircle2 size={18}/></span><small>GÜVENLİ</small><strong>{safe}</strong></div>
        <div className="stat-card protected-stat"><span className="stat-icon"><ShieldCheck size={18}/></span><small>KORUMAYA ALINAN</small><strong>{protectedCount}</strong></div>
      </section>

      <section className="sim-panel">
        <div className="panel-heading"><div><div className="eyebrow">KONTROL MERKEZİ</div><h2>Deneyi yönet</h2></div><span className={`run-state ${running ? "is-running" : ""}`}><i/>{running ? "ÇALIŞIYOR" : "DURAKLATILDI"}</span></div>
        <div className="control-row">
          <button className="primary-action" onClick={() => running ? setRunning(false) : start()}>{running ? <><CirclePause size={17}/> Duraklat</> : <><CirclePlay size={17}/> Simülasyonu başlat</>}</button>
          <button className="secondary-action" onClick={clean}><ShieldCheck size={17}/> Sanal cihazları temizle</button>
          <button className="icon-action" onClick={reset} aria-label="Simülasyonu sıfırla" title="Sıfırla"><RotateCcw size={17}/></button>
        </div>
        <div className="progress-wrap"><div className="progress-label"><span>Yayılım seviyesi</span><b>{Math.round((infected / devices.length) * 100)}%</b></div><div className="progress-track"><div className="progress-fill" style={{ width: `${(infected / devices.length) * 100}%` }}/></div></div>
      </section>

      <section className="devices-section">
        <div className="section-heading"><div><div className="eyebrow">SANAL AĞ</div><h2>Cihaz haritası</h2></div><div className="filter-tabs"><button className={mode === "all" ? "active" : ""} onClick={() => setMode("all")}>Tümü</button><button className={mode === "computer" ? "active" : ""} onClick={() => setMode("computer")}><Monitor size={14}/> PC</button><button className={mode === "phone" ? "active" : ""} onClick={() => setMode("phone")}><Phone size={14}/> Telefon</button></div></div>
        <div className="device-grid">{visibleDevices.map((device) => <article className={`device-card ${device.status}`} key={device.id}><div className="device-symbol">{device.kind === "computer" ? <Monitor size={22}/> : <Phone size={22}/>}</div><div className="device-info"><b>{device.name}</b><small>{device.kind === "computer" ? "Bilgisayar" : "Mobil cihaz"}</small></div><span className={`device-status ${device.status}`}>{device.status === "infected" ? "Etkilendi" : device.status === "protected" ? "Korunuyor" : "Güvenli"}</span></article>)}</div>
      </section>

      <section className="log-panel"><div className="section-heading"><div><div className="eyebrow">ETKİNLİK KAYDI</div><h2>Simülasyon günlüğü</h2></div><span className="turn-counter">TUR {tick}</span></div><div className="log-list">{log.map((entry, i) => <div className="log-entry" key={`${entry}-${i}`}><span className="log-bullet"/><span>{entry}</span></div>)}</div></section>
      <footer className="sim-footer"><AlertTriangle size={15}/><span>Bu araç yalnızca eğitim amaçlı matematiksel bir simülasyondur. Gerçek virüs, dosya bulaştırma veya ağ taraması içermez.</span></footer>
    </main>
  );
}
