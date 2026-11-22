"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, ShieldCheck, LockKeyhole, Eye, FolderOpen, Terminal, Wifi, CircleCheck, Clock3, Plus, Laptop, ScreenShare, Square } from "lucide-react";
import "./remote.css";

const permissions = [
  { key: "screen", title: "Ekran paylaşımı", detail: "Ekranını yalnızca tarayıcının açık paylaşım penceresiyle paylaş.", icon: Eye },
  { key: "files", title: "Dosya aktarımı", detail: "Dosya seçimini her seferinde bilgisayar sahibi yapar.", icon: FolderOpen },
  { key: "commands", title: "Komut çalıştırma", detail: "Uzaktan komutlar kapalı; güvenli tanılama adımları elle yürütülür.", icon: Terminal },
];

export default function RemoteAdmin() {
  const [selected, setSelected] = useState<string[]>(["screen"]);
  const [requested, setRequested] = useState(false);
  const [pairCode, setPairCode] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopSharing = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setSharing(false);
  };

  const startSharing = async () => {
    setShareError("");
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setShareError("Bu tarayıcı ekran paylaşımını desteklemiyor. Güncel Chrome veya Edge kullan.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      stream.getVideoTracks()[0]?.addEventListener("ended", () => stopSharing(), { once: true });
      setSharing(true);
    } catch {
      setShareError("Ekran paylaşımı başlatılmadı. Tarayıcı penceresinde paylaşımı onaylamış olmalısın.");
    }
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  return <main className="remoteShell">
    <header className="remoteNav"><Link href="/" className="remoteBack"><ArrowLeft size={17}/> Ay Zek'e dön</Link><span className="remoteBrand"><ShieldCheck size={20}/> AY ZEK <b>UZAK DESTEK</b></span><span className="safePill"><LockKeyhole size={14}/> İzin tabanlı</span></header>
    <section className="remoteHero"><div className="remoteEyebrow"><span/> GÜVENLİ UZAK YÖNETİM</div><h1>Bilgisayarlarına <em>güvenle</em> bağlan.</h1><p>Yalnızca bilgisayar sahibi açıkça izin verdiğinde işlem yapılır. Ekran paylaşımı tarayıcının kendi onay penceresiyle başlar ve tek tuşla durdurulur.</p></section>
    <section className="remoteGrid">
      <article className="remotePanel"><div className="panelHeading"><div className="panelIcon"><Laptop size={21}/></div><div><h2>Cihaz eşleştirme</h2><p>Gerçek cihaz eşleştirmesi sunucu tarafı doğrulama tamamlandığında etkinleştirilecek.</p></div></div>
        <label className="remoteLabel" htmlFor="pairCode">Davet kodu</label><input id="pairCode" className="remoteInput" value={pairCode} onChange={e=>setPairCode(e.target.value.toUpperCase().slice(0,8))} placeholder="ÖR. A7K9P2" />
        <button className="remotePrimary" disabled={pairCode.trim().length < 6 || requested} onClick={()=>setRequested(true)}>{requested ? <><Clock3 size={17}/> Demo isteği oluşturuldu</> : <><Plus size={17}/> Davet kodunu kontrol et</>}</button>
        <p className="remoteHint">Eşleştirme kodu şu an gerçek bağlantı açmaz; bu bölüm henüz demo durumundadır.</p>
      </article>
      <article className="remotePanel"><div className="panelHeading"><div className="panelIcon green"><Monitor size={21}/></div><div><h2>Yerel ekran paylaşımı</h2><p>Bu cihazın ekranını tarayıcı üzerinden önizle.</p></div></div>
        <div className={"screenPreview "+(sharing?"isSharing":"")}><video ref={videoRef} autoPlay playsInline muted/><div className="screenEmpty"><Monitor size={30}/><b>{sharing?"Ekran paylaşılıyor":"Henüz paylaşım başlamadı"}</b><span>{sharing?"Paylaşımı durdurmak için aşağıdaki düğmeyi kullan.":"Tarayıcı paylaşım penceresi açılacak."}</span></div></div>
        <button className={"remotePrimary "+(sharing?"stopButton":"")} onClick={sharing?stopSharing:startSharing}>{sharing?<><Square size={16}/> Paylaşımı durdur</>:<><ScreenShare size={17}/> Ekran paylaşımını başlat</>}</button>
        {shareError&&<p className="shareError">{shareError}</p>}
        <p className="remoteHint">Bu önizleme yalnızca bu tarayıcıda görüntü gösterir; başka bir bilgisayara aktarım yapmaz.</p>
      </article>
    </section>
    <section className="remotePanel permissionPanel"><div className="panelHeading"><div className="panelIcon purple"><ShieldCheck size={21}/></div><div><h2>Oturum izinleri</h2><p>İhtiyacın olan izinleri seç. Gerçek oturumda cihaz sahibi her birini ayrıca onaylar.</p></div></div>
      <div className="permissionList">{permissions.map(item=>{const Icon=item.icon;const checked=selected.includes(item.key);return <button key={item.key} className={"permissionRow "+(checked?"chosen":"")} onClick={()=>setSelected(old=>checked?old.filter(x=>x!==item.key):[...old,item.key])}><span className="permissionIcon"><Icon size={19}/></span><span className="permissionText"><b>{item.title}</b><small>{item.detail}</small></span><span className={"permissionCheck "+(checked?"on":"")}>{checked&&<CircleCheck size={17}/>}</span></button>})}</div>
      <div className="permissionFoot"><span><LockKeyhole size={15}/> İzinler oturum bitince iptal edilir.</span><span>{selected.length} izin seçildi</span></div>
    </section>
    <section className="remoteNotice"><ShieldCheck size={20}/><div><b>Güvenlik ilkeleri</b><p>Gizli erişim yok · Açık onay · Görünür oturum · İstediğin an bağlantıyı kes · İşlem kayıtları.</p></div></section>
    <footer className="remoteFooter"><Wifi size={15}/> Ay Zek Uzak Destek <span>· Güvenli önizleme sürümü</span></footer>
  </main>;
}
