"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert, FileSearch, HardDrive, LockKeyhole, Monitor, Phone, RefreshCw, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import "./cleaner.css";

type Platform = "computer" | "phone";
type ScanState = "idle" | "scanning" | "done";

const checks = [
  { title: "Güvenlik ayarları", detail: "Temel koruma önerileri", icon: LockKeyhole },
  { title: "Depolama düzeni", detail: "Geçici dosya ve alan kontrolü (temsili)", icon: HardDrive },
  { title: "Uygulama izinleri", detail: "Riskli olabilecek izinler hakkında bilgilendirme", icon: FileSearch },
  { title: "Güncelleme durumu", detail: "Sistem güncellemeleri için kontrol listesi", icon: RefreshCw },
];

export default function CleanerPage() {
  const [platform, setPlatform] = useState<Platform>("computer");
  const [state, setState] = useState<ScanState>("idle");
  const [progress, setProgress] = useState(0);
  const [cleaned, setCleaned] = useState(false);

  useEffect(() => {
    if (state !== "scanning") return;
    const timer = window.setInterval(() => {
      setProgress((value) => {
        const next = Math.min(100, value + 5);
        if (next === 100) setState("done");
        return next;
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, [state]);

  const startScan = () => {
    setProgress(0);
    setCleaned(false);
    setState("scanning");
  };

  const reset = () => {
    setState("idle");
    setProgress(0);
    setCleaned(false);
  };

  return (
    <main className="cleaner-shell">
      <header className="cleaner-nav">
        <Link href="/" className="cleaner-brand"><span><ShieldCheck size={20}/></span> AY ZEK <b>TEMİZLEYİCİ</b></Link>
        <Link href="/virus-simulator" className="sim-link">Virüs simülatörüne git <ArrowLeft size={15}/></Link>
      </header>

      <section className="cleaner-hero">
        <div className="cleaner-kicker"><Sparkles size={14}/> GÜVENLİK MERKEZİ</div>
        <h1>Cihazını daha <span>güvenli</span> kullan.</h1>
        <p>Bilgisayar ve telefonlar için güvenli kontrol listesi. Bu web aracı gerçek cihazındaki dosyaları taramaz veya silemez; yalnızca eğitim amaçlı örnek bir tarama gösterir.</p>
      </section>

      <section className="cleaner-card">
        <div className="cleaner-card-head">
          <div><div className="cleaner-label">PLATFORM SEÇ</div><h2>Hangi cihazı kontrol edelim?</h2></div>
          <div className="platform-switch">
            <button className={platform === "computer" ? "selected" : ""} onClick={() => {setPlatform("computer"); reset();}}><Monitor size={17}/> Bilgisayar</button>
            <button className={platform === "phone" ? "selected" : ""} onClick={() => {setPlatform("phone"); reset();}}><Phone size={17}/> Telefon</button>
          </div>
        </div>

        <div className="scan-device">
          <div className="scan-ring"><div className="scan-device-icon">{platform === "computer" ? <Monitor size={35}/> : <Phone size={35}/>}</div></div>
          <div className="scan-device-copy"><b>{platform === "computer" ? "Bilgisayar güvenlik kontrolü" : "Telefon güvenlik kontrolü"}</b><span>{state === "scanning" ? "Kontrol listesi inceleniyor..." : state === "done" ? "Örnek kontrol tamamlandı" : "Hazır · Güvenli demo modu"}</span></div>
        </div>

        <div className="scan-progress"><div><span>{state === "scanning" ? "Kontrol ilerlemesi" : state === "done" ? "Kontrol tamamlandı" : "Kontrol bekliyor"}</span><b>{progress}%</b></div><div className="scan-track"><i style={{width: progress + "%"}}/></div></div>

        <div className="check-list">
          {checks.map((item, index) => {const Icon = item.icon; const complete = state === "done" || progress >= (index + 1) * 25; return <div className="check-row" key={item.title}><span className="check-icon"><Icon size={18}/></span><span className="check-copy"><b>{item.title}</b><small>{item.detail}</small></span>{complete ? <CheckCircle2 className="check-ok" size={19}/> : state === "scanning" ? <span className="check-wait"/> : <span className="check-pending">Bekliyor</span>}</div>;})}
        </div>

        {state === "done" && <div className="demo-result"><CheckCircle2 size={19}/><div><b>Örnek kontrol tamamlandı</b><span>Gerçek cihazda tarama yapılmadı. Aşağıdaki öneriler genel güvenlik tavsiyeleridir.</span></div></div>}
        {cleaned && <div className="demo-result"><ShieldCheck size={19}/><div><b>Demo temizliği tamamlandı</b><span>Yalnızca bu sayfadaki örnek durum sıfırlandı; cihazındaki dosyalara dokunulmadı.</span></div></div>}

        <div className="cleaner-actions">
          <button className="scan-button" onClick={startScan} disabled={state === "scanning"}><ScanLine size={18}/>{state === "scanning" ? "Kontrol ediliyor..." : state === "done" ? "Yeniden kontrol et" : "Güvenli kontrolü başlat"}</button>
          <button className="reset-button" onClick={() => {reset(); setCleaned(true);}}><RefreshCw size={17}/> Demo sıfırla</button>
        </div>
      </section>

      <section className="safety-note"><CircleAlert size={18}/><div><b>Önemli güvenlik notu</b><p>Ay Zek Temizleyici şu anda gerçek antivirüs değildir. Windows, Android veya iOS dosyalarına erişmez; virüs bulduğunu iddia etmez ve dosya silmez. Gerçek koruma için cihazının yerleşik güvenlik araçlarını ve resmî uygulama mağazalarını kullan.</p></div></section>
      <footer className="cleaner-footer"><Link href="/">Ay Zek ana sayfa</Link><span>Bilgisayar + Telefon · Mobil uyumlu</span><Link href="/virus-simulator">Güvenli virüs simülatörü <ArrowLeft size={13}/></Link></footer>
    </main>
  );
}
