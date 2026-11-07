"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Entry = { kind: "input" | "output" | "success" | "error" | "muted"; text: string };

const help = [
  "help       Kullanılabilir komutları gösterir",
  "whoami     Simülasyon kullanıcısını gösterir",
  "pwd        Sanal çalışma dizinini gösterir",
  "ls         Örnek dosyaları listeler",
  "date       Simülasyon tarihini gösterir",
  "neofetch   Sistem özetini gösterir",
  "ping demo  Eğitim amaçlı örnek ping çıktısı üretir",
  "scan demo  Yerel demo hedefinde güvenlik kontrolü simüle eder",
  "clear      Terminal ekranını temizler",
];

function runCommand(raw: string): Entry[] {
  const cmd = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!cmd) return [];
  if (cmd === "help") return [{kind:"muted",text:"KULLANILABİLİR KOMUTLAR"}, ...help.map(text=>({kind:"output" as const,text}))];
  if (cmd === "whoami") return [{kind:"success",text:"ayzek-guest  (eğitim simülasyonu)"}];
  if (cmd === "pwd") return [{kind:"output",text:"/home/ayzek-guest/lab"}];
  if (cmd === "ls") return [{kind:"output",text:"Belgeler/   ornek-log.txt   guvenlik-notlari.md   demo/"}];
  if (cmd === "date") return [{kind:"output",text:new Date().toLocaleString("tr-TR")}];
  if (cmd === "neofetch") return [
    {kind:"success",text:"       .--.       AY ZEK LAB"},
    {kind:"output",text:"      |o_o |      Sistem : Ay Zek Terminal Simülatörü"},
    {kind:"output",text:"      |:_/ |      Kullanıcı : ayzek-guest"},
    {kind:"output",text:"     //   \\      Kabuk : zek-shell 1.0"},
    {kind:"output",text:"    (|     |)     Mod : Güvenli eğitim ortamı"},
    {kind:"output",text:"   /'\\_   _/\u0060\\     Ağ : Gerçek bağlantı yok"},
  ];
  if (cmd === "ping demo" || cmd === "ping 127.0.0.1") return [
    {kind:"muted",text:"DEMO PING — paketler ağa gönderilmez"},
    {kind:"output",text:"64 bytes from demo.local: icmp_seq=1 ttl=64 time=0.42 ms"},
    {kind:"output",text:"64 bytes from demo.local: icmp_seq=2 ttl=64 time=0.38 ms"},
    {kind:"success",text:"2 paket simüle edildi · %0 kayıp"},
  ];
  if (cmd === "scan demo") return [
    {kind:"muted",text:"DEMO TARAMA — yalnızca örnek veri kullanılır"},
    {kind:"output",text:"[1/3] Demo hedefi hazırlanıyor..."},
    {kind:"output",text:"[2/3] Örnek servisler kontrol ediliyor..."},
    {kind:"success",text:"[3/3] Tamamlandı: 22/tcp (örnek SSH), 80/tcp (örnek HTTP)"},
    {kind:"muted",text:"Bu sonuçlar gerçek bir cihaza veya ağa ait değildir."},
  ];
  if (cmd === "clear") return [{kind:"muted",text:"__CLEAR__"}];
  return [{kind:"error",text:`Komut bulunamadı: ${raw}. Yardım için help yaz.`}];
}

export default function HackerTerminal() {
  const [history,setHistory] = useState<Entry[]>([
    {kind:"success",text:"AY ZEK HACKER TERMINAL v1.0"},
    {kind:"muted",text:"Güvenli eğitim simülatörü başlatıldı. Gerçek komut çalıştırılmaz."},
    {kind:"output",text:"Başlamak için help yaz."},
  ]);
  const [value,setValue] = useState("");
  const [busy,setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[history]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const raw=value.trim();
    if(!raw || busy) return;
    setValue("");
    if(raw.toLowerCase()==="clear") { setHistory([]); return; }
    setHistory(old=>[...old,{kind:"input",text:raw},...runCommand(raw)]);
  }

  return <main className="hackerPage">
    <header className="hackerHeader">
      <Link href="/indir" className="hackerBrand"><span>⌘</span> AY ZEK <i>HACKER LAB</i></Link>
      <div className="hackerHeaderRight"><span className="liveDot"/> SİMÜLASYON AKTİF <Link href="/indir">← Mağaza</Link></div>
    </header>
    <section className="hackerIntro">
      <label>✦ SİBER GÜVENLİK ÖĞRENME ALANI</label>
      <h1>Hacker <em>Terminali</em></h1>
      <p>Komut satırını keşfet, örnek komutları dene ve siber güvenliğin temellerini öğren.</p>
    </section>
    <section className="terminalWrap">
      <div className="terminalBar"><div className="windowDots"><i/><i/><i/></div><span>ayzek@lab: ~/terminal</span><button onClick={()=>setHistory([])}>Temizle</button></div>
      <div className="terminalBody" onClick={()=>inputRef.current?.focus()}>
        <div className="terminalWelcome"><pre>{`    /\\_/\\
   ( o.o )   AY ZEK LAB
    > ^ <    SAFE TERMINAL`}</pre></div>
        {history.map((entry,i)=><div className={`terminalLine ${entry.kind}`} key={i}>{entry.kind==="input"&&<b>ayzek@lab:~$ </b>}{entry.text}</div>)}
        <form className="terminalPrompt" onSubmit={submit}>
          <label>ayzek@lab:~$</label>
          <input ref={inputRef} value={value} onChange={e=>setValue(e.target.value)} autoComplete="off" spellCheck={false} placeholder="Komut yaz... (help)" aria-label="Terminal komutu"/>
          <button type="submit" disabled={!value.trim()}>ÇALIŞTIR ↵</button>
        </form>
        <div ref={endRef}/>
      </div>
      <div className="terminalStatus"><span><i/> READY</span><span>UTF-8</span><span>SAFE MODE</span></div>
    </section>
    <section className="commandCards">
      <div><label>HIZLI KOMUTLAR</label><div className="quickButtons">{["help","whoami","ls","neofetch","ping demo","scan demo","clear"].map(c=><button key={c} onClick={()=>{setValue(c);inputRef.current?.focus();}}>{c}</button>)}</div></div>
      <aside><b>ⓘ Güvenli kullanım</b><p>Bu terminal yalnızca eğitim amaçlı örnek çıktılar üretir. Bilgisayarında komut çalıştırmaz, ağ taraması yapmaz ve başka sistemlere bağlanmaz.</p></aside>
    </section>
    <footer className="hackerFooter">AY ZEK · HACKER LAB <span>Öğren • Keşfet • Güvende kal</span></footer>
    <style jsx global>{`
      .hackerPage{min-height:100vh;background:radial-gradient(ellipse at 50% 0%,#064e3b38,transparent 45%),#070c0d;color:#e5f7ef;font-family:Arial,sans-serif;padding-bottom:30px}
      .hackerHeader{height:68px;border-bottom:1px solid #ffffff15;display:flex;align-items:center;justify-content:space-between;padding:0 max(5%,calc((100% - 1050px)/2))}
      .hackerBrand{display:flex;align-items:center;gap:9px;text-decoration:none;color:#eafff5;font-size:15px;font-weight:900;letter-spacing:1px}.hackerBrand>span{width:34px;height:34px;display:grid;place-items:center;background:#10b98120;border:1px solid #34d39955;color:#6ee7b7;border-radius:10px;font-size:20px}.hackerBrand i{font-style:normal;color:#34d399;font-size:9px;letter-spacing:2px;margin-left:5px}
      .hackerHeaderRight{display:flex;align-items:center;gap:8px;color:#7dd3b0;font-size:9px;letter-spacing:1px}.hackerHeaderRight a{margin-left:18px;color:#c1d8cd;text-decoration:none;font-size:11px;letter-spacing:0}.liveDot,.terminalStatus i{width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 9px #34d399}
      .hackerIntro{width:min(920px,90%);margin:54px auto 27px}.hackerIntro label,.commandCards label{font-size:9px;font-weight:800;letter-spacing:1.8px;color:#6ee7b7}.hackerIntro h1{font-size:clamp(36px,5vw,54px);letter-spacing:-2px;margin:14px 0 8px}.hackerIntro h1 em{font-style:normal;color:#34d399}.hackerIntro p{font-size:13px;color:#8da69a;line-height:1.7;margin:0}
      .terminalWrap{width:min(920px,90%);margin:auto;border:1px solid #1e4a3a;border-radius:15px;overflow:hidden;background:#050908;box-shadow:0 22px 70px #0008}
      .terminalBar{height:46px;background:#101a17;border-bottom:1px solid #1d382e;display:flex;align-items:center;justify-content:space-between;padding:0 15px;color:#86a99a;font-size:10px}.windowDots{display:flex;gap:6px}.windowDots i{width:8px;height:8px;border-radius:50%;background:#ef4444}.windowDots i:nth-child(2){background:#f59e0b}.windowDots i:nth-child(3){background:#22c55e}.terminalBar button{background:transparent;border:1px solid #315445;color:#9cc8b2;border-radius:6px;padding:5px 9px;font-size:9px;cursor:pointer}
      .terminalBody{height:420px;overflow:auto;padding:20px 22px;color:#c8e5d6;font:12px/1.8 ui-monospace,SFMono-Regular,Consolas,monospace;cursor:text}.terminalWelcome{color:#34d399;margin-bottom:18px}.terminalWelcome pre{font:inherit;line-height:1.35;color:#6ee7b7}.terminalLine{white-space:pre-wrap;overflow-wrap:anywhere;margin:3px 0}.terminalLine.input{color:#f0fff6;margin-top:10px}.terminalLine.input b,.terminalPrompt label{color:#34d399}.terminalLine.success{color:#6ee7b7}.terminalLine.error{color:#fb7185}.terminalLine.muted{color:#698579}.terminalPrompt{display:flex;align-items:center;gap:9px;margin-top:13px}.terminalPrompt input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#eafff2;font:inherit}.terminalPrompt input::placeholder{color:#50675d}.terminalPrompt button{border:1px solid #247354;background:#0b241a;color:#6ee7b7;padding:7px 10px;border-radius:6px;font-size:9px;cursor:pointer}.terminalPrompt button:disabled{opacity:.4;cursor:default}.terminalStatus{height:29px;background:#0c1712;border-top:1px solid #1b352b;display:flex;align-items:center;gap:18px;padding:0 14px;color:#658777;font-size:8px;letter-spacing:1px}.terminalStatus span:first-child{display:flex;align-items:center;gap:6px;color:#6ee7b7}
      .commandCards{width:min(920px,90%);margin:20px auto;display:grid;grid-template-columns:1.2fr 1fr;gap:14px}.commandCards>div,.commandCards aside{border:1px solid #ffffff16;background:#101a17;border-radius:12px;padding:16px}.quickButtons{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.quickButtons button{background:#10251b;border:1px solid #24533d;color:#9be5be;border-radius:7px;padding:7px 10px;font:10px ui-monospace,monospace;cursor:pointer}.quickButtons button:hover{background:#16452f}.commandCards aside b{font-size:11px;color:#fcd34d}.commandCards aside p{font-size:10px;color:#91a69b;line-height:1.7;margin:8px 0 0}.hackerFooter{width:min(920px,90%);margin:28px auto 0;border-top:1px solid #ffffff12;padding-top:17px;display:flex;justify-content:space-between;color:#4e7563;font-size:9px;letter-spacing:1px}.hackerFooter span{letter-spacing:0}
      @media(max-width:600px){.hackerHeader{padding:0 5%;height:60px}.hackerBrand{font-size:12px}.hackerBrand i{font-size:7px}.hackerHeaderRight{font-size:0}.hackerHeaderRight a{font-size:10px;margin-left:5px}.hackerIntro{margin-top:38px}.terminalBody{height:390px;padding:16px 13px;font-size:11px}.terminalPrompt{gap:6px}.terminalPrompt button{padding:7px}.commandCards{grid-template-columns:1fr}.hackerFooter{font-size:8px}}
    `}</style>
  </main>;
}
