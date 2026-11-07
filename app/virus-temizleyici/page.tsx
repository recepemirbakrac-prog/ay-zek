"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, ShieldAlert, ScanLine, FileUp, File, AlertTriangle,
  CheckCircle2, LockKeyhole, Trash2, RefreshCw, Download, Info,
  FolderShield, Activity, X, ArrowLeft
} from "lucide-react";

type Result = {
  id: string;
  name: string;
  size: number;
  hash: string;
  status: "suspicious" | "review" | "no-match";
  reasons: string[];
};
type Quarantined = { id: string; name: string; date: string };

const riskyExtensions = new Set(["exe", "scr", "bat", "cmd", "ps1", "vbs", "js", "jse", "hta", "jar", "msi", "sh", "apk"]);
const textExtensions = new Set(["txt", "log", "csv", "json", "xml", "html", "htm", "js", "jsx", "ts", "tsx", "ps1", "bat", "cmd", "vbs", "py", "sh"]);

function extension(name: string) {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}
function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}
async function sha256(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, "0")).join("");
}
async function inspect(file: File): Promise<Result> {
  const ext = extension(file.name);
  const reasons: string[] = [];
  if (riskyExtensions.has(ext)) reasons.push("Çalıştırılabilir veya betik dosyası türü: ." + ext);
  if (file.size === 0) reasons.push("Dosya boyutu sıfır bayt.");
  if (file.size > 100 * 1024 * 1024) reasons.push("Dosya 100 MB sınırından büyük; içerik analizi yapılmadı.");

  if (textExtensions.has(ext) && file.size > 0 && file.size <= 1024 * 1024) {
    const text = await file.text();
    const rules: Array<[RegExp, string]> = [
      [/powershell\s+-enc|encodedcommand/i, "Kodlanmış PowerShell komutu ifadesi"],
      [/document\.cookie|localStorage\s*\.\s*getItem/i, "Tarayıcı verilerine erişim ifadesi"],
      [/eval\s*\(|new\s+Function\s*\(/i, "Dinamik kod çalıştırma ifadesi"],
      [/https?:\/\/[^\s"'<>]+/i, "Metin içinde uzak bağlantı adresi"],
      [/ransomware|keylogger|credential\s*steal/i, "Zararlı yazılım terimi"],
    ];
    for (const [pattern, label] of rules) if (pattern.test(text)) reasons.push(label);
  }
  const hash = await sha256(file);
  const status = reasons.some(x => x.includes("Kodlanmış") || x.includes("Dinamik") || x.includes("Zararlı")) ? "suspicious" : reasons.length ? "review" : "no-match";
  return { id: hash.slice(0, 16) + file.name, name: file.name, size: file.size, hash, status, reasons };
}

export default function VirusCleanerPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [quarantine, setQuarantine] = useState<Quarantined[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"scan" | "quarantine" | "history">("scan");
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState("");

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    setFiles(prev => [...prev, ...incoming.filter(f => !prev.some(p => p.name === f.name && p.size === f.size && p.lastModified === f.lastModified))]);
    setResults([]);
    setError("");
  }
  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }
  async function startScan() {
    if (!files.length || scanning) return;
    setScanning(true); setProgress(0); setResults([]); setError("");
    const found: Result[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const result = await inspect(files[i]);
        found.push(result);
        setResults([...found]);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setHistory(prev => [new Date().toLocaleString("tr-TR") + " · " + files.length + " dosya", ...prev].slice(0, 20));
    } catch {
      setError("Dosyalardan biri okunamadı. Dosya izinlerini kontrol edip tekrar dene.");
    } finally {
      setScanning(false);
    }
  }
  function quarantineFile(result: Result) {
    setQuarantine(prev => prev.some(x => x.id === result.id) ? prev : [...prev, { id: result.id, name: result.name, date: new Date().toLocaleString("tr-TR") }]);
  }
  function downloadReport() {
    const report = {
      app: "Ay Zek Virüs Temizleyici",
      createdAt: new Date().toISOString(),
      notice: "Bu rapor yerel sezgisel kontrolleri gösterir; profesyonel antivirüs tespiti değildir.",
      files: results.map(({ name, size, hash, status, reasons }) => ({ name, size, sha256: hash, status, reasons }))
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "ay-zek-tarama-raporu.json"; a.click(); URL.revokeObjectURL(url);
  }
  const suspicious = results.filter(x => x.status === "suspicious").length;
  const review = results.filter(x => x.status === "review").length;
  const noMatch = results.filter(x => x.status === "no-match").length;

  return <main className="vc">
    <header className="vcTop">
      <Link href="/" className="vcBrand"><span className="vcLogo"><ShieldCheck size={21}/></span><span>Ay Zek <i>Guard</i></span></Link>
      <div className="vcTopRight"><span className="vcLive"/> Yerel tarama modu <Link href="/" className="vcBack"><ArrowLeft size={15}/> Ana sayfa</Link></div>
    </header>

    <section className="vcHero">
      <div className="vcEyebrow"><LockKeyhole size={14}/> KİŞİSEL DOSYA GÜVENLİĞİ</div>
      <h1>Tehditleri bul.<br/><em>Güvende kal.</em></h1>
      <p>Seçtiğin dosyaları tarayıcında incele, şüpheli dosyaları ayır ve tarama raporunu indir. Dosyaların sunucuya yüklenmez.</p>
      <div className="vcPills"><span><CheckCircle2 size={14}/> Dosyalar cihazında kalır</span><span><CheckCircle2 size={14}/> SHA-256 özeti</span><span><CheckCircle2 size={14}/> Açık ve güvenli analiz</span></div>
    </section>

    <nav className="vcTabs">
      <button className={activeTab === "scan" ? "active" : ""} onClick={() => setActiveTab("scan")}><ScanLine size={15}/> Tarama</button>
      <button className={activeTab === "quarantine" ? "active" : ""} onClick={() => setActiveTab("quarantine")}><FolderShield size={15}/> Karantina <b>{quarantine.length}</b></button>
      <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}><Activity size={15}/> Geçmiş</button>
    </nav>

    {activeTab === "scan" && <section className="vcGrid">
      <div className="vcPanel">
        <div className="vcPanelTitle"><div className="vcIcon"><FileUp size={19}/></div><div><b>Dosyaları seç</b><small>İncelemek istediğin dosyaları ekle</small></div></div>
        <div className="vcNotice"><Info size={16}/> Dosyalar yalnızca bu tarayıcı sekmesinde okunur. Hiçbir dosya sunucuya gönderilmez veya otomatik çalıştırılmaz.</div>
        <input ref={inputRef} type="file" multiple className="vcHidden" onChange={e => addFiles(e.target.files)}/>
        <button className="vcDrop" onClick={() => inputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); addFiles(e.dataTransfer.files);}}>
          <span><FileUp size={25}/></span><b>Dosyaları buraya bırak veya seç</b><small>Birden fazla dosya seçebilirsin · En fazla 100 MB içerik analizi sınırı</small>
        </button>
        {files.length > 0 && <div className="vcFileList"><div className="vcListHead"><b>Seçilen dosyalar</b><button onClick={() => {setFiles([]);setResults([]);}}>Tümünü kaldır</button></div>
          {files.map((f, i) => <div className="vcFile" key={f.name + f.lastModified + i}><File size={17}/><div><b>{f.name}</b><small>{formatSize(f.size)}</small></div><button aria-label="Dosyayı kaldır" onClick={() => removeFile(i)}><X size={15}/></button></div>)}
        </div>}
        {error && <p className="vcError">{error}</p>}
        <button className="vcScan" disabled={!files.length || scanning} onClick={startScan}>{scanning ? <><RefreshCw className="vcSpin" size={17}/> Taranıyor %{progress}</> : <><ScanLine size={17}/> Taramayı başlat</>}</button>
        {scanning && <div className="vcProgress"><i style={{width: progress + "%"}}/></div>}
        <p className="vcFoot">Tarayıcı güvenlik kısıtlamaları nedeniyle sistemin tamamı veya diğer uygulamalar taranamaz. Bu araç seçtiğin dosyalarla sınırlıdır.</p>
      </div>

      <div className="vcPanel">
        <div className="vcPanelTitle"><div className="vcIcon"><Activity size={19}/></div><div><b>Tarama sonuçları</b><small>Dosya bazında analiz raporu</small></div></div>
        {!results.length ? <div className="vcEmpty"><div className="vcRadar"><ShieldCheck size={30}/></div><b>{scanning ? "Dosyalar inceleniyor..." : "Henüz tarama yapılmadı"}</b><p>Dosyalarını ekle ve taramayı başlat. Sonuçlar burada görünecek.</p></div> :
          <>
            <div className="vcStats"><div><strong>{results.length}</strong><small>İncelenen</small></div><div className="bad"><strong>{suspicious}</strong><small>Şüpheli</small></div><div className="warn"><strong>{review}</strong><small>İncelenmeli</small></div><div className="good"><strong>{noMatch}</strong><small>Eşleşme yok</small></div></div>
            <div className="vcResults">{results.map(r => <article className="vcResult" key={r.id}>
              <div className={"vcResultIcon " + r.status}>{r.status === "suspicious" ? <ShieldAlert size={18}/> : r.status === "review" ? <AlertTriangle size={18}/> : <CheckCircle2 size={18}/>}</div>
              <div className="vcResultBody"><b>{r.name}</b><small>{formatSize(r.size)} · SHA-256: {r.hash.slice(0, 18)}…</small>
                <span className={"vcStatus " + r.status}>{r.status === "suspicious" ? "Şüpheli göstergeler" : r.status === "review" ? "Manuel inceleme önerilir" : "Bilinen kural eşleşmesi yok"}</span>
                {r.reasons.map(reason => <p key={reason}>• {reason}</p>)}
                {r.status !== "no-match" && <button className="vcQuarantine" onClick={() => quarantineFile(r)}><FolderShield size={14}/> Karantina listesine ekle</button>}
              </div>
            </article>)}</div>
            <button className="vcReport" onClick={downloadReport}><Download size={15}/> Tarama raporunu indir</button>
          </>}
      </div>
    </section>}

    {activeTab === "quarantine" && <section className="vcPanel vcWide">
      <div className="vcPanelTitle"><div className="vcIcon"><FolderShield size={19}/></div><div><b>Karantina listesi</b><small>Bu uygulamada işaretlediğin dosyalar</small></div></div>
      <div className="vcNotice"><Info size={16}/> Karantina burada yalnızca uygulama içi listedir. Orijinal dosyayı cihazından taşımaz, kilitlemez veya silmez.</div>
      {!quarantine.length ? <div className="vcEmpty"><div className="vcRadar"><FolderShield size={28}/></div><b>Karantinada dosya yok</b><p>Tarama sonuçlarından şüpheli bir dosyayı bu listeye ekleyebilirsin.</p></div> :
        quarantine.map(q => <div className="vcFile" key={q.id}><FolderShield size={17}/><div><b>{q.name}</b><small>Listeye eklendi: {q.date}</small></div><button onClick={() => setQuarantine(prev => prev.filter(x => x.id !== q.id))} aria-label="Listeden kaldır"><Trash2 size={15}/></button></div>)}
    </section>}

    {activeTab === "history" && <section className="vcPanel vcWide">
      <div className="vcPanelTitle"><div className="vcIcon"><Activity size={19}/></div><div><b>Tarama geçmişi</b><small>Bu oturumdaki taramalar</small></div></div>
      {!history.length ? <div className="vcEmpty"><div className="vcRadar"><Activity size={28}/></div><b>Henüz geçmiş yok</b><p>İlk taramandan sonra kayıtlar burada listelenir.</p></div> : history.map((item, i) => <div className="vcHistory" key={i}><CheckCircle2 size={17}/><span>{item}</span></div>)}
    </section>}

    <section className="vcSafety"><ShieldCheck size={21}/><div><b>Önemli güvenlik notu</b><p>Bu araç tam teşekküllü antivirüs değildir. Dosya adı, dosya türü ve desteklenen küçük metin dosyalarındaki bazı şüpheli örüntüleri kontrol eder. “Eşleşme yok” sonucu dosyanın kesinlikle temiz olduğunu kanıtlamaz. Gerçek karantina ve silme işlemleri için işletim sisteminin güvenlik yazılımını kullan.</p></div></section>
    <footer className="vcFooter">Ay Zek Guard · Dosyaların cihazında kalır.</footer>

    <style jsx global>{`
      .vc{min-height:100vh;background:radial-gradient(ellipse at 50% 0%,#153d3b55,transparent 42%),#080d12;color:#eef8f5;font-family:Arial,sans-serif;padding-bottom:32px}
      .vcTop{height:70px;border-bottom:1px solid #ffffff14;display:flex;align-items:center;justify-content:space-between;padding:0 max(5%,calc((100% - 1120px)/2))}
      .vcBrand{display:flex;align-items:center;gap:9px;color:#f4fffb;text-decoration:none;font-weight:800;font-size:20px}.vcBrand i{font-style:normal;color:#6ee7b7}
      .vcLogo{width:35px;height:35px;border-radius:11px;background:linear-gradient(135deg,#34d399,#0f766e);display:grid;place-items:center}
      .vcTopRight{display:flex;align-items:center;gap:9px;color:#9fb6af;font-size:11px}.vcLive{width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 10px #34d399}
      .vcBack{display:flex;align-items:center;gap:6px;color:#c2d8d0;text-decoration:none;margin-left:18px}
      .vcHero{width:min(1120px,90%);margin:55px auto 28px}.vcEyebrow{display:flex;align-items:center;gap:8px;color:#6ee7b7;font-size:10px;letter-spacing:1.5px;font-weight:800}
      .vcHero h1{font-size:clamp(36px,5vw,58px);letter-spacing:-2px;line-height:1.08;margin:17px 0;font-weight:800}.vcHero h1 em{font-style:normal;color:#6ee7b7}
      .vcHero>p{max-width:650px;color:#9baea9;font-size:14px;line-height:1.8}.vcPills{display:flex;gap:9px;flex-wrap:wrap;margin-top:20px}.vcPills span{display:flex;align-items:center;gap:6px;border:1px solid #34d39930;background:#34d3990d;border-radius:20px;padding:7px 11px;color:#9de5c8;font-size:10px}
      .vcTabs{width:min(1120px,90%);margin:0 auto 16px;display:flex;gap:7px;border-bottom:1px solid #ffffff18}.vcTabs button{display:flex;align-items:center;gap:7px;background:transparent;border:0;border-bottom:2px solid transparent;color:#8fa49b;padding:12px 14px;cursor:pointer;font-size:12px}.vcTabs button.active{color:#6ee7b7;border-color:#34d399}.vcTabs button b{background:#ffffff13;border-radius:12px;padding:2px 6px}
      .vcGrid{width:min(1120px,90%);margin:auto;display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}.vcPanel{border:1px solid #ffffff17;background:linear-gradient(150deg,#131f22,#10171c);border-radius:17px;padding:23px;min-width:0;box-shadow:0 12px 40px #0003}.vcWide{width:min(1120px,90%);margin:auto}
      .vcPanelTitle{display:flex;align-items:center;gap:12px;margin-bottom:20px}.vcIcon{width:37px;height:37px;border-radius:11px;background:#34d39917;color:#6ee7b7;display:grid;place-items:center}.vcPanelTitle b{font-size:14px}.vcPanelTitle small{display:block;font-size:11px;color:#8ba19a;margin-top:4px}
      .vcNotice{display:flex;gap:9px;align-items:flex-start;padding:11px;border:1px solid #60a5fa2b;background:#60a5fa0b;color:#a9c9e8;border-radius:10px;font-size:10px;line-height:1.6;margin-bottom:17px}.vcNotice :global(svg){flex-shrink:0}
      .vcHidden{display:none}.vcDrop{width:100%;min-height:160px;border:1px dashed #34d39965;border-radius:12px;background:#34d39908;color:#dffaf0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;cursor:pointer}.vcDrop>span{color:#6ee7b7}.vcDrop b{font-size:12px}.vcDrop small{font-size:10px;color:#829b91;text-align:center;padding:0 10px}
      .vcFileList{margin-top:17px}.vcListHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.vcListHead b{font-size:11px}.vcListHead button{border:0;background:transparent;color:#fca5a5;font-size:10px;cursor:pointer}
      .vcFile{display:flex;align-items:center;gap:10px;padding:12px 2px;border-bottom:1px solid #ffffff12;color:#9de5c8}.vcFile>div{flex:1;min-width:0}.vcFile b{display:block;color:#e5f5ef;font-size:11px;overflow-wrap:anywhere}.vcFile small{display:block;color:#81968e;font-size:10px;margin-top:4px}.vcFile button{border:0;background:#ffffff0b;color:#aabbb4;border-radius:7px;padding:7px;cursor:pointer}
      .vcScan,.vcReport{width:100%;margin-top:17px;border:0;border-radius:10px;background:linear-gradient(110deg,#34d399,#2dd4bf);color:#06251d;padding:13px;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}.vcScan:disabled{opacity:.5;cursor:not-allowed}.vcFoot{font-size:10px;line-height:1.6;color:#789087;margin:12px 2px 0}.vcError{color:#fca5a5;font-size:11px}
      .vcProgress{height:5px;background:#ffffff16;border-radius:9px;overflow:hidden;margin-top:10px}.vcProgress i{display:block;height:100%;background:#34d399;transition:width .2s}
      .vcEmpty{min-height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.vcRadar{width:74px;height:74px;border:1px solid #34d39944;border-radius:50%;display:grid;place-items:center;color:#6ee7b7;background:radial-gradient(circle,#34d3991c,transparent 70%);margin-bottom:17px}.vcEmpty b{font-size:13px}.vcEmpty p{max-width:260px;color:#83978f;font-size:11px;line-height:1.7}
      .vcStats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0 16px}.vcStats>div{padding:11px 7px;border:1px solid #ffffff12;border-radius:10px;background:#ffffff06;text-align:center}.vcStats strong{display:block;font-size:22px}.vcStats small{font-size:9px;color:#91a39b}.vcStats .bad strong{color:#f87171}.vcStats .warn strong{color:#fbbf24}.vcStats .good strong{color:#6ee7b7}
      .vcResult{display:flex;gap:10px;padding:13px 0;border-bottom:1px solid #ffffff10}.vcResultIcon{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}.vcResultIcon.suspicious{background:#ef44441b;color:#f87171}.vcResultIcon.review{background:#f59e0b1b;color:#fbbf24}.vcResultIcon.no-match{background:#34d3991b;color:#6ee7b7}.vcResultBody{min-width:0;flex:1}.vcResultBody>b{display:block;font-size:11px;overflow-wrap:anywhere}.vcResultBody>small{display:block;color:#81968e;font-size:9px;margin-top:5px;overflow-wrap:anywhere}.vcStatus{display:inline-block;font-size:9px;padding:4px 7px;border-radius:6px;margin-top:8px}.vcStatus.suspicious{background:#ef44441b;color:#fca5a5}.vcStatus.review{background:#f59e0b1b;color:#fcd34d}.vcStatus.no-match{background:#34d3991b;color:#86efac}.vcResultBody p{font-size:10px;color:#9aada5;margin:6px 0;line-height:1.5}.vcQuarantine{display:flex;align-items:center;gap:6px;margin-top:7px;border:1px solid #ffffff1c;background:#ffffff08;color:#d5e7df;border-radius:7px;padding:7px 9px;font-size:10px;cursor:pointer}
      .vcReport{background:#ffffff0c;color:#b8e9d5;border:1px solid #34d39935}.vcSafety{width:min(1120px,90%);margin:18px auto 0;display:flex;gap:13px;padding:17px;border:1px solid #34d39928;background:#34d39909;border-radius:13px;color:#6ee7b7}.vcSafety :global(svg){flex-shrink:0}.vcSafety b{font-size:12px}.vcSafety p{font-size:10px;line-height:1.7;color:#91aaa0;margin:5px 0 0}
      .vcHistory{display:flex;align-items:center;gap:10px;padding:13px 2px;border-bottom:1px solid #ffffff12;color:#6ee7b7;font-size:11px}.vcHistory span{color:#d5e7df}.vcFooter{text-align:center;color:#5f766d;font-size:10px;margin-top:25px}.vcSpin{animation:vcspin .8s linear infinite}@keyframes vcspin{to{transform:rotate(360deg)}}
      @media(max-width:800px){.vcGrid{grid-template-columns:1fr}.vcHero{margin-top:38px}.vcEmpty{min-height:220px}}
      @media(max-width:540px){.vcTop{padding:0 4%;height:62px}.vcTopRight{font-size:0}.vcBack{font-size:11px;margin-left:8px}.vcHero,.vcTabs,.vcGrid,.vcWide,.vcSafety{width:92%}.vcPanel{padding:17px}.vcHero h1{font-size:40px}.vcStats{gap:5px}.vcStats>div{padding:9px 3px}.vcStats strong{font-size:19px}}
    `}</style>
  </main>;
}
