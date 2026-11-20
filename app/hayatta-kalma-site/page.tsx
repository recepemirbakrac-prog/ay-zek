"use client";
import Link from "next/link";
import { useState } from "react";

const features = [
  { icon: "🌲", title: "Keşfedilecek bir orman", desc: "Ağaçların, kayaların ve gizli kaynakların arasında kendi yolunu bul." },
  { icon: "🧟", title: "Gece tehlikesi", desc: "Güneş battığında zombiler ortaya çıkar. Hazırlıksız yakalanma." },
  { icon: "🪓", title: "Üret ve güçlen", desc: "Odun ve taş topla; balta, kamp ateşi ve barınak üret." },
];
export default function SurvivalLanding() {
  const [menu, setMenu] = useState(false);
  return <main className="survivalSite">
    <style jsx global>{`
      *{box-sizing:border-box}.survivalSite{min-height:100vh;background:#09120f;color:#f3f4e9;font-family:Arial,sans-serif;overflow:hidden}
      .ss-nav{height:76px;max-width:1160px;margin:auto;padding:0 26px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff16;position:relative;z-index:5}
      .ss-brand{display:flex;align-items:center;gap:10px;color:#f5f4e9;text-decoration:none;font-weight:900;letter-spacing:1px}.ss-brand b{color:#c6a66c}.ss-mark{width:36px;height:36px;border-radius:11px;background:linear-gradient(140deg,#a1a96b,#465c3b);display:grid;place-items:center;font-size:19px}
      .ss-links{display:flex;align-items:center;gap:26px}.ss-links a{color:#c2cabb;text-decoration:none;font-size:12px}.ss-play{background:#d4b77b;color:#172016!important;padding:12px 18px;border-radius:8px;font-weight:900}
      .ss-hero{min-height:650px;position:relative;display:flex;align-items:center;max-width:1160px;margin:auto;padding:70px 28px 90px}
      .ss-scene{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:radial-gradient(ellipse at 75% 42%,#b9a76a27,transparent 34%),linear-gradient(180deg,#15231f 0%,#263c30 52%,#101c16 100%)}
      .ss-moon{position:absolute;right:19%;top:13%;width:95px;height:95px;border-radius:50%;background:#e4d7a6;box-shadow:0 0 80px #dfd39a66}
      .ss-ridge{position:absolute;bottom:20%;width:120%;height:47%;left:-10%;background:#1a3025;clip-path:polygon(0 68%,12% 38%,21% 61%,34% 19%,45% 62%,57% 31%,69% 59%,83% 22%,100% 62%,100% 100%,0 100%)}
      .ss-ridge.two{bottom:8%;height:48%;background:#102219;opacity:.9;transform:scaleX(-1)}
      .ss-tree{position:absolute;bottom:0;width:0;height:0;border-left:75px solid transparent;border-right:75px solid transparent;border-bottom:310px solid #0a1a12;filter:drop-shadow(0 10px 8px #0006)}
      .ss-tree:after{content:"";position:absolute;left:-53px;top:92px;border-left:53px solid transparent;border-right:53px solid transparent;border-bottom:220px solid #11271a}
      .ss-tree.t1{left:2%;transform:scale(.8)}.ss-tree.t2{left:18%;transform:scale(1.15)}.ss-tree.t3{right:5%;transform:scale(1.35)}.ss-tree.t4{right:24%;transform:scale(.85)}
      .ss-ground{position:absolute;bottom:-2px;left:-5%;width:110%;height:27%;background:linear-gradient(180deg,#233a24,#0b1710);clip-path:polygon(0 48%,20% 18%,40% 42%,63% 8%,80% 37%,100% 12%,100% 100%,0 100%)}
      .ss-copy{position:relative;z-index:2;max-width:650px}.ss-kicker{display:inline-flex;gap:9px;align-items:center;border:1px solid #d6c28a55;background:#0b1710a8;color:#e5d39f;padding:9px 13px;border-radius:30px;font-size:10px;font-weight:800;letter-spacing:2px}
      .ss-copy h1{font-size:clamp(48px,7vw,86px);line-height:.98;letter-spacing:-4px;margin:24px 0 20px;font-weight:1000;text-shadow:0 5px 24px #0009}.ss-copy h1 span{color:#d5bb7d}
      .ss-copy p{font-size:16px;line-height:1.8;color:#d0d8c9;max-width:510px;text-shadow:0 2px 9px #000}
      .ss-actions{display:flex;align-items:center;gap:13px;margin-top:30px;flex-wrap:wrap}.ss-primary{display:inline-flex;align-items:center;gap:12px;padding:16px 23px;background:#d7bd80;color:#172016;text-decoration:none;border-radius:8px;font-size:13px;font-weight:900;box-shadow:0 10px 35px #0005}.ss-secondary{color:#e4e8d9;text-decoration:none;font-size:12px;padding:14px}
      .ss-meta{display:flex;gap:24px;margin-top:40px;color:#c1cbbd;font-size:11px}.ss-meta b{display:block;color:#fff;font-size:17px;margin-bottom:4px}
      .ss-section{max-width:1160px;margin:auto;padding:65px 28px}.ss-heading{text-align:center;margin-bottom:30px}.ss-heading small{color:#d3b779;font-size:10px;letter-spacing:2px;font-weight:900}.ss-heading h2{font-size:32px;letter-spacing:-1px;margin:10px 0}.ss-heading p{color:#9fac9c;font-size:13px}
      .ss-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.ss-card{padding:24px;border:1px solid #ffffff17;border-radius:14px;background:linear-gradient(145deg,#18271e,#101a14)}.ss-card i{font-style:normal;font-size:28px}.ss-card h3{font-size:16px;margin:18px 0 8px}.ss-card p{color:#a9b5a8;font-size:12px;line-height:1.7;margin:0}
      .ss-bottom{max-width:1104px;margin:0 auto 60px;padding:32px;border:1px solid #d6bd7a4a;border-radius:16px;background:radial-gradient(ellipse at 0 50%,#c8a85c22,transparent 55%),#142219;display:flex;align-items:center;justify-content:space-between;gap:20px}.ss-bottom h2{margin:0 0 8px;font-size:24px}.ss-bottom p{margin:0;color:#aab6a8;font-size:12px}
      .ss-footer{border-top:1px solid #ffffff15;padding:25px;text-align:center;color:#819080;font-size:11px}
      @media(max-width:700px){.ss-nav{height:65px;padding:0 16px}.ss-links{display:none}.ss-hero{min-height:620px;padding:55px 20px 75px}.ss-copy h1{font-size:53px;letter-spacing:-2.8px}.ss-copy p{font-size:14px}.ss-moon{right:13%;width:65px;height:65px}.ss-cards{grid-template-columns:1fr}.ss-section{padding:48px 18px}.ss-heading h2{font-size:25px}.ss-bottom{margin:0 17px 40px;padding:23px;align-items:flex-start;flex-direction:column}.ss-bottom h2{font-size:21px}.ss-meta{gap:18px}.ss-tree.t2{left:8%}.ss-tree.t4{right:5%}}
    `}</style>
    <nav className="ss-nav">
      <Link href="/hayatta-kalma-site" className="ss-brand"><span className="ss-mark">🌲</span><span>WILD<span style={{color:"#d5bb7d"}}>LAND</span></span></Link>
      <div className="ss-links"><a href="#ozellikler">ÖZELLİKLER</a><a href="#hayatta-kal">NASIL OYNANIR?</a><Link className="ss-play" href="/hayatta-kalma">OYUNA GİR →</Link></div>
      <button onClick={()=>setMenu(v=>!v)} aria-label="Menüyü aç" style={{display:"none"}}>☰</button>
    </nav>
    <section className="ss-hero">
      <div className="ss-scene"><div className="ss-moon"/><div className="ss-ridge"/><div className="ss-ridge two"/><div className="ss-tree t1"/><div className="ss-tree t2"/><div className="ss-tree t3"/><div className="ss-tree t4"/><div className="ss-ground"/></div>
      <div className="ss-copy">
        <div className="ss-kicker">✦ AY ZEK SUNAR · HAYATTA KALMA</div>
        <h1>ORMANIN<br/><span>ÇAĞRISI.</span></h1>
        <p>Issız bir ormanda uyandın. Kaynakları topla, kendine bir sığınak kur ve karanlık çökmeden hayatta kal. Bu ormanda her gece yeni bir sınav.</p>
        <div className="ss-actions"><Link href="/hayatta-kalma" className="ss-primary">▶ &nbsp; HEMEN OYNA <span>→</span></Link><a href="#ozellikler" className="ss-secondary">OYUNU KEŞFET ↓</a></div>
        <div className="ss-meta"><div><b>3 GECE</b>Hayatta kalma hedefi</div><div><b>1 ORMAN</b>Keşfedilecek dünya</div><div><b>∞</b>Yeni denemeler</div></div>
      </div>
    </section>
    <section className="ss-section" id="ozellikler"><div className="ss-heading"><small>ORMANDA SENİ NE BEKLİYOR?</small><h2>Her kararın önemli.</h2><p>Hayatta kalmak için keşfet, üret ve tehlikeye karşı hazırlan.</p></div>
      <div className="ss-cards">{features.map(f=><article className="ss-card" key={f.title}><i>{f.icon}</i><h3>{f.title}</h3><p>{f.desc}</p></article>)}</div>
    </section>
    <section className="ss-section" id="hayatta-kal" style={{paddingTop:0}}><div className="ss-bottom"><div><h2>Gece yaklaşırken hazır mısın?</h2><p>Kontrolleri öğren, ilk kaynaklarını topla ve macerana başla.</p></div><Link href="/hayatta-kalma" className="ss-primary">ORMANA GİR →</Link></div></section>
    <footer className="ss-footer">WILDLAND · AY ZEK · Kendi hikâyeni hayatta kalarak yaz.</footer>
  </main>;
}
