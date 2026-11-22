"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, ShieldCheck, LockKeyhole, Eye, FolderOpen, Terminal, Wifi, CircleCheck, Clock3, Plus, Laptop } from "lucide-react";
import "./remote.css";

const permissions = [
  { key: "screen", title: "Ekran paylaşımı", detail: "Karşı tarafın ekranını yalnızca oturum boyunca görüntüle.", icon: Eye },
  { key: "files", title: "Dosya aktarımı", detail: "Yalnızca seçilen dosyaları karşılıklı aktar.", icon: FolderOpen },
  { key: "commands", title: "Komut çalıştırma", detail: "Her komut, uzak bilgisayarda ayrıca onaylanır.", icon: Terminal },
];

export default function RemoteAdmin() {
  const [selected, setSelected] = useState<string[]>(["screen"]);
  const [requested, setRequested] = useState(false);
  const [pairCode, setPairCode] = useState("");
  return <main className="remoteShell">
    <header className="remoteNav"><Link href="/" className="remoteBack"><ArrowLeft size={17}/> Ay Zek'e dön</Link><span className="remoteBrand"><ShieldCheck size={20}/> AY ZEK <b>UZAK DESTEK</b></span><span className="safePill"><LockKeyhole size={14}/> İzin tabanlı</span></header>
    <section className="remoteHero"><div className="remoteEyebrow"><span/> GÜVENLİ UZAK YÖNETİM</div><h1>Bilgisayarlarına <em>güvenle</em> bağlan.</h1><p>Yalnızca sahibi davet kodunu onayladığında bağlantı kurulabilir. Her oturum görünürdür ve istenildiği an sonlandırılabilir.</p></section>
    <section className="remoteGrid">
      <article className="remotePanel"><div className="panelHeading"><div className="panelIcon"><Laptop size={21}/></div><div><h2>Cihaz ekle</h2><p>Bağlanmak istediğin bilgisayarın sahibi davet kodunu paylaşmalı.</p></div></div>
        <label className="remoteLabel" htmlFor="pairCode">Davet kodu</label><input id="pairCode" className="remoteInput" value={pairCode} onChange={e=>setPairCode(e.target.value.toUpperCase().slice(0,8))} placeholder="ÖR. A7K9P2" />
        <button className="remotePrimary" disabled={pairCode.trim().length < 6 || requested} onClick={()=>setRequested(true)}>{requested ? <><Clock3 size={17}/> İzin isteği hazırlandı (demo)</> : <><Plus size={17}/> İzin iste</>}</button>
        <p className="remoteHint">Bu önizlemede gerçek bağlantı kurulmaz; kod yalnızca arayüz akışını gösterir.</p>
      </article>
      <article className="remotePanel"><div className="panelHeading"><div className="panelIcon green"><Monitor size={21}/></div><div><h2>Cihaz durumu</h2><p>Henüz eşleştirilmiş cihaz yok.</p></div></div><div className="emptyDevice"><div className="emptyMonitor"><Monitor size={31}/></div><b>Bağlı cihaz bulunamadı</b><span>Onaylanmış cihazlar burada listelenir.</span></div></article>
    </section>
    <section className="remotePanel permissionPanel"><div className="panelHeading"><div className="panelIcon purple"><ShieldCheck size={21}/></div><div><h2>Oturum izinleri</h2><p>Yalnızca ihtiyacın olan izinleri seç. Cihaz sahibi her birini ayrı ayrı onaylar.</p></div></div>
      <div className="permissionList">{permissions.map(item=>{const Icon=item.icon;const checked=selected.includes(item.key);return <button key={item.key} className={"permissionRow "+(checked?"chosen":"")} onClick={()=>setSelected(old=>checked?old.filter(x=>x!==item.key):[...old,item.key])}><span className="permissionIcon"><Icon size={19}/></span><span className="permissionText"><b>{item.title}</b><small>{item.detail}</small></span><span className={"permissionCheck "+(checked?"on":"")}>{checked&&<CircleCheck size={17}/>}</span></button>})}</div>
      <div className="permissionFoot"><span><LockKeyhole size={15}/> İzinler oturum bitince iptal edilir.</span><span>{selected.length} izin seçildi</span></div>
    </section>
    <section className="remoteNotice"><ShieldCheck size={20}/><div><b>Güvenlik ilkeleri</b><p>Gizli erişim yok · Açık onay · Görünür oturum · İstediğin an bağlantıyı kes · Tüm işlemler kayıt altına alınır.</p></div></section>
    <footer className="remoteFooter"><Wifi size={15}/> Ay Zek Uzak Destek <span>· Arayüz önizlemesi</span></footer>
  </main>;
}
