"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, ShieldAlert, ScanSearch, LockKeyhole, Activity, FileSearch, RefreshCw, CheckCircle2, AlertTriangle, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

type Finding = { label: string; level: "high" | "medium" | "info"; detail: string };
const demoSamples = [
  { label: "Temiz örnek", value: "Merhaba dünya! Bu yalnızca güvenli bir test metnidir.\nKullanıcı adı: demo\nDurum: normal" },
  { label: "Şüpheli metin örneği", value: "DEMO ONLY - powershell -enc [örnek kod]\nBu metin eğitim amacıyla eklenmiştir; çalıştırılmamalıdır.\nNot: şüpheli komut ifadesi içeriyor." },
];

function inspectText(value: string): Finding[] {
  const rules: Array<[RegExp, Finding]> = [
    [/powershell\s+-enc|encodedcommand/i, { label: "Kodlanmış komut ifadesi", level: "high", detail: "Metinde kodlanmış PowerShell komutlarına benzeyen bir ifade bulundu. Bu demo yalnızca metni işaretler; hiçbir komut çalıştırılmaz." }],
    [/document\.cookie|localstorage\s*\.\s*getitem/i, { label: "Tarayıcı verisine erişim ifadesi", level: "medium", detail: "Metin, tarayıcıda saklanan verilere erişim örüntüsü içeriyor. Tek başına zararlı olduğu anlamına gelmez." }],
    [/eval\s*\(|new\s+function\s*\(/i, { label: "Dinamik kod çalıştırma ifadesi", level: "medium", detail: "Dinamik kod çalıştırma ile ilişkili bir ifade bulundu. Bu örnek gerçek kod olarak değerlendirilmez." }],
    [/ransomware|fidye\s+yazılımı|dosyaları\s+şifrele/i, { label: "Fidye yazılımı terimi", level: "info", detail: "Metinde fidye yazılımı ile ilgili bir kelime bulundu. Bu yalnızca kelime eşleşmesidir." }],
  ];
  return rules.filter(([pattern]) => pattern.test(value)).map(([, finding]) => finding);
}

export default function SafeSecurityLab() {
  const [sample, setSample] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [scanned, setScanned] = useState("");
  const findings = useMemo(() => inspectText(scanned), [scanned]);
  const score = findings.some(x => x.level === "high") ? 42 : findings.some(x => x.level === "medium") ? 76 : 98;

  function startScan() {
    if (!sample.trim() || running) return;
    setRunning(true); setComplete(false); setProgress(0); setScanned("");
    let step = 0;
    const timer = window.setInterval(() => {
      step += 10; setProgress(step);
      if (step >= 100) {
        window.clearInterval(timer);
        setScanned(sample); setComplete(true); setRunning(false);
      }
    }, 110);
  }

  function reset() { setSample(""); setScanned(""); setProgress(0); setComplete(false); setRunning(false); }
  const riskLabel = findings.some(x => x.level === "high") ? "Yüksek riskli ifade" : findings.some(x => x.level === "medium") ? "İncelenmeli" : "Belirgin eşleşme yok";

  return <main className="cyberPage">
    <header className="cyberTop">
      <Link href="/" className="cyberBrand"><span><ShieldCheck size={21}/></span> Güvenli<span>Lab</span></Link>
      <div className="cyberTopRight"><span className="onlineDot"/> Güvenli demo modu <Link href="/" className="cyberBack"><ArrowLeft size={15}/> Ana sayfa</Link></div>
    </header>
    <section className="cyberHero">
      <div className="cyberEyebrow"><LockKeyhole size={14}/> SİBER GÜVENLİK EĞİTİM LABORATUVARI</div>
      <h1>Tehditleri tanı.<br/><em>Güvende kal.</em></h1>
      <p>Zararlı yazılım çalıştırmadan, yalnızca metin örnekleri üzerinde çalışan güvenli bir tehdit simülasyonu.</p>
      <div className="cyberPills"><span><CheckCircle2 size={14}/> Dosya erişimi yok</span><span><CheckCircle2 size={14}/> Kod çalıştırma yok</span><span><CheckCircle2 size={14}/> Veriler sunucuya gönderilmez</span></div>
    </section>
    <section className="cyberGrid">
      <div className="cyberPanel cyberInput">
        <div className="cyberPanelTitle"><div className="cyberIcon"><FileSearch size={19}/></div><div><b>Metin analizi</b><small>İncelemek istediğin metni buraya yapıştır</small></div></div>
        <div className="cyberNotice"><Info size={16}/> Bu araç gerçek antivirüs değildir. Yalnızca aşağıdaki örüntüleri metin içinde arayan eğitim amaçlı bir demodur.</div>
        <label className="cyberLabel" htmlFor="sample">TEST METNİ</label>
        <textarea id="sample" value={sample} onChange={e=>setSample(e.target.value)} placeholder="Analiz edilecek zararsız metni buraya yaz veya örneklerden birini seç..." rows={9}/>
        <div className="cyberExamples"><span>ÖRNEKLER</span>{demoSamples.map(x=><button key={x.label} type="button" onClick={()=>{setSample(x.value);setComplete(false);setScanned("");}}>{x.label}</button>)}</div>
        <button className="cyberScanBtn" type="button" onClick={startScan} disabled={!sample.trim()||running}>{running?<><RefreshCw className="cyberSpin" size={17}/> Simülasyon çalışıyor %{progress}</>:<><ScanSearch size={17}/> Güvenli analizi başlat</>}</button>
        <p className="cyberFootnote">Analiz yalnızca bu kutuya yazdığın metin üzerinde yapılır. Bilgisayarındaki dosyalara, ağa veya sistem ayarlarına erişmez.</p>
      </div>
      <div className="cyberPanel cyberResults">
        <div className="cyberPanelTitle"><div className="cyberIcon"><Activity size={19}/></div><div><b>Analiz raporu</b><small>Simülasyon sonuçları</small></div></div>
        {!complete ? <div className="cyberWaiting"><div className="cyberRadar"><ScanSearch size={30}/></div><b>{running ? "Örnek metin inceleniyor..." : "Henüz analiz yapılmadı"}</b><p>{running ? "Metin örüntüleri güvenli şekilde kontrol ediliyor." : "Bir metin gir ve güvenli analiz düğmesine bas."}</p>{running&&<div className="cyberProgress"><i style={{width:progress+"%"}}/></div>}</div> :
          <><div className="cyberScore"><div className={score < 60 ? "scoreRing scoreWarn" : "scoreRing"}><strong>{score}</strong><small>/100</small></div><div><b>{riskLabel}</b><p>{findings.length ? findings.length+" adet metin eşleşmesi bulundu." : "Kontrol edilen örüntülerde eşleşme bulunmadı."}</p></div></div>
          <div className="cyberSummary"><span>İNCELENEN METİN</span><b>{scanned.length.toLocaleString("tr-TR")} karakter</b><span>EŞLEŞME SAYISI</span><b>{findings.length}</b></div>
          <div className="cyberFindingList">{findings.length ? findings.map((f,i)=><div className="cyberFinding" key={i}><div className={"findingIcon "+f.level}>{f.level==="high"?<ShieldAlert size={17}/>:f.level==="medium"?<AlertTriangle size={17}/>:<Info size={17}/>}</div><div><b>{f.label}</b><p>{f.detail}</p></div></div>) : <div className="cyberClean"><CheckCircle2 size={20}/><div><b>Belirgin eşleşme yok</b><p>Bu, metnin kesinlikle güvenli olduğunu kanıtlamaz; yalnızca demo kurallarında eşleşme bulunmadı.</p></div></div>}</div>
          <button type="button" className="cyberReset" onClick={reset}><RefreshCw size={15}/> Yeni analiz</button></>}
      </div>
    </section>
    <section className="cyberSafety"><ShieldCheck size={20}/><div><b>Güvenlik sınırları</b><p>Bu simülatör dosya taramaz, dosya indirmez veya yüklemez, komut çalıştırmaz, ağ isteği göndermez ve sistemde değişiklik yapmaz. Sonuçlar gerçek antivirüs tespiti olarak yorumlanmamalıdır.</p></div></section>
    <footer className="cyberFooter">GüvenliLab · Öğrenmek için simüle et, gerçek sistemine dokunma.</footer>
  </main>;
}
