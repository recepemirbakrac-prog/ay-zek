"use client";

import { useMemo, useState } from "react";

const items = [
  // Android
  { name:"Firefox", platform:"Android", category:"Tarayıcı", desc:"Gizlilik odaklı web tarayıcısı.", icon:"🦊", url:"https://www.mozilla.org/firefox/browsers/mobile/android/" },
  { name:"Chrome", platform:"Android", category:"Tarayıcı", desc:"Google'ın hızlı web tarayıcısı.", icon:"🌐", url:"https://play.google.com/store/apps/details?id=com.android.chrome" },
  { name:"Brave", platform:"Android", category:"Tarayıcı", desc:"Reklam ve izleyici engelleme özellikli tarayıcı.", icon:"🦁", url:"https://brave.com/download/" },
  { name:"VLC", platform:"Android", category:"Medya", desc:"Video ve ses dosyalarını oynatır.", icon:"▶", url:"https://www.videolan.org/vlc/download-android.html" },
  { name:"Spotify", platform:"Android", category:"Müzik", desc:"Müzik ve podcast dinleme uygulaması.", icon:"♫", url:"https://www.spotify.com/download/android/" },
  { name:"Signal", platform:"Android", category:"İletişim", desc:"Uçtan uca şifreli mesajlaşma.", icon:"✳", url:"https://signal.org/android/apk/" },
  { name:"Telegram", platform:"Android", category:"İletişim", desc:"Bulut tabanlı mesajlaşma uygulaması.", icon:"➤", url:"https://telegram.org/android" },
  { name:"WhatsApp", platform:"Android", category:"İletişim", desc:"Mesajlaşma ve sesli/görüntülü arama.", icon:"◉", url:"https://www.whatsapp.com/android" },
  { name:"F-Droid", platform:"Android", category:"Mağaza", desc:"Özgür ve açık kaynak uygulama kataloğu.", icon:"FD", url:"https://f-droid.org/" },
  { name:"Bitwarden", platform:"Android", category:"Güvenlik", desc:"Açık kaynak parola yöneticisi.", icon:"🔐", url:"https://bitwarden.com/download/" },
  { name:"Proton Mail", platform:"Android", category:"İletişim", desc:"Gizlilik odaklı e-posta uygulaması.", icon:"✉", url:"https://proton.me/mail/download" },
  { name:"Google Maps", platform:"Android", category:"Harita", desc:"Navigasyon ve yer keşfi.", icon:"📍", url:"https://play.google.com/store/apps/details?id=com.google.android.apps.maps" },
  { name:"Google Drive", platform:"Android", category:"Üretkenlik", desc:"Dosyalarını bulutta sakla ve paylaş.", icon:"☁", url:"https://www.google.com/drive/download/" },
  { name:"Notion", platform:"Android", category:"Üretkenlik", desc:"Not, belge ve görev çalışma alanı.", icon:"▤", url:"https://www.notion.com/mobile" },
  { name:"Canva", platform:"Android", category:"Tasarım", desc:"Grafik ve sosyal medya tasarımları.", icon:"✦", url:"https://www.canva.com/download/android/" },
  { name:"Snapseed", platform:"Android", category:"Tasarım", desc:"Fotoğraf düzenleme araçları.", icon:"📷", url:"https://play.google.com/store/apps/details?id=com.niksoftware.snapseed" },
  { name:"Termux", platform:"Android", category:"Geliştirici", desc:"Android üzerinde terminal ortamı.", icon:">_", url:"https://termux.dev/" },
  { name:"Proton VPN", platform:"Android", category:"Güvenlik", desc:"Gizlilik odaklı VPN hizmeti.", icon:"🛡", url:"https://protonvpn.com/download-android" },
  { name:"TickTick", platform:"Android", category:"Üretkenlik", desc:"Görev, takvim ve hatırlatıcıları tek yerde yönet.", icon:"✓", url:"https://play.google.com/store/apps/details?id=com.ticktick.task" },
  { name:"Google Keep", platform:"Android", category:"Notlar", desc:"Not, kontrol listesi ve hatırlatıcı oluştur.", icon:"📝", url:"https://play.google.com/store/apps/details?id=com.google.android.keep" },
  { name:"LocalSend", platform:"Android", category:"Araçlar", desc:"Aynı ağdaki cihazlar arasında güvenli dosya aktarımı.", icon:"⇄", url:"https://play.google.com/store/apps/details?id=org.localsend.localsend_app" },
  { name:"Duolingo", platform:"Android", category:"Eğitim", desc:"Kısa ve eğlenceli derslerle dil öğren.", icon:"🦉", url:"https://play.google.com/store/apps/details?id=com.duolingo" },
  // Windows
  { name:"Firefox", platform:"Windows", category:"Tarayıcı", desc:"Gizlilik araçlarına sahip web tarayıcısı.", icon:"🦊", url:"https://www.mozilla.org/firefox/new/" },
  { name:"Google Chrome", platform:"Windows", category:"Tarayıcı", desc:"Hızlı ve yaygın web tarayıcısı.", icon:"🌐", url:"https://www.google.com/chrome/" },
  { name:"Brave", platform:"Windows", category:"Tarayıcı", desc:"Reklam engelleme özellikli tarayıcı.", icon:"🦁", url:"https://brave.com/download/" },
  { name:"VLC Media Player", platform:"Windows", category:"Medya", desc:"Ücretsiz video ve müzik oynatıcı.", icon:"▶", url:"https://www.videolan.org/vlc/" },
  { name:"Spotify", platform:"Windows", category:"Müzik", desc:"Müzik ve podcast uygulaması.", icon:"♫", url:"https://www.spotify.com/download/windows/" },
  { name:"Audacity", platform:"Windows", category:"Medya", desc:"Ses kaydı ve düzenleme yazılımı.", icon:"🎙", url:"https://www.audacityteam.org/download/" },
  { name:"OBS Studio", platform:"Windows", category:"Medya", desc:"Ekran kaydı ve canlı yayın yazılımı.", icon:"◉", url:"https://obsproject.com/download" },
  { name:"LibreOffice", platform:"Windows", category:"Ofis", desc:"Belge, tablo ve sunum hazırlama paketi.", icon:"▤", url:"https://www.libreoffice.org/download/download-libreoffice/" },
  { name:"7-Zip", platform:"Windows", category:"Araçlar", desc:"Dosyaları sıkıştırın ve arşivleri açın.", icon:"7z", url:"https://www.7-zip.org/download.html" },
  { name:"GIMP", platform:"Windows", category:"Tasarım", desc:"Ücretsiz ve açık kaynak görsel düzenleyici.", icon:"🎨", url:"https://www.gimp.org/downloads/" },
  { name:"Blender", platform:"Windows", category:"Tasarım", desc:"3B modelleme, animasyon ve render.", icon:"🧊", url:"https://www.blender.org/download/" },
  { name:"ShareX", platform:"Windows", category:"Araçlar", desc:"Ekran görüntüsü ve ekran kaydı aracı.", icon:"✂", url:"https://getsharex.com/" },
  { name:"Everything", platform:"Windows", category:"Araçlar", desc:"Windows için hızlı dosya arama.", icon:"⌕", url:"https://www.voidtools.com/downloads/" },
  { name:"Bitwarden", platform:"Windows", category:"Güvenlik", desc:"Açık kaynak parola yöneticisi.", icon:"🔐", url:"https://bitwarden.com/download/" },
  { name:"Proton VPN", platform:"Windows", category:"Güvenlik", desc:"Gizlilik odaklı VPN uygulaması.", icon:"🛡", url:"https://protonvpn.com/download-windows" },
  { name:"Telegram Desktop", platform:"Windows", category:"İletişim", desc:"Masaüstü mesajlaşma uygulaması.", icon:"➤", url:"https://desktop.telegram.org/" },
  { name:"WhatsApp", platform:"Windows", category:"İletişim", desc:"Masaüstü mesajlaşma ve arama.", icon:"◉", url:"https://www.whatsapp.com/download" },
  { name:"Discord", platform:"Windows", category:"İletişim", desc:"Topluluklar için sesli ve yazılı sohbet.", icon:"☏", url:"https://discord.com/download" },
  { name:"Visual Studio Code", platform:"Windows", category:"Geliştirici", desc:"Eklentili kod düzenleyici.", icon:"</>", url:"https://code.visualstudio.com/Download" },
  { name:"GitHub Desktop", platform:"Windows", category:"Geliştirici", desc:"Git depolarını masaüstünden yönet.", icon:"⌘", url:"https://desktop.github.com/" },
  { name:"Python", platform:"Windows", category:"Geliştirici", desc:"Programlama dili ve çalışma ortamı.", icon:"🐍", url:"https://www.python.org/downloads/windows/" },
  { name:"Steam", platform:"Windows", category:"Oyun", desc:"PC oyunları mağazası ve kütüphanesi.", icon:"🎮", url:"https://store.steampowered.com/about/" },
  { name:"Epic Games Launcher", platform:"Windows", category:"Oyun", desc:"Oyun mağazası ve başlatıcısı.", icon:"🎮", url:"https://store.epicgames.com/download" },
  { name:"SumatraPDF", platform:"Windows", category:"Ofis", desc:"Hafif PDF ve e-kitap okuyucu.", icon:"📄", url:"https://www.sumatrapdfreader.org/download-free-pdf-viewer" },
  { name:"KeePass", platform:"Windows", category:"Güvenlik", desc:"Yerel ve açık kaynak parola kasası.", icon:"🔑", url:"https://keepass.info/download.html" },
  { name:"Microsoft PowerToys", platform:"Windows", category:"Araçlar", desc:"Windows için pencere, arama ve üretkenlik yardımcıları.", icon:"⚙", url:"https://learn.microsoft.com/windows/powertoys/install" },
  { name:"qBittorrent", platform:"Windows", category:"Araçlar", desc:"Ücretsiz ve açık kaynak BitTorrent istemcisi.", icon:"⇩", url:"https://www.qbittorrent.org/download" },
  { name:"Obsidian", platform:"Windows", category:"Notlar", desc:"Bağlantılı notlar ve kişisel bilgi tabanı oluştur.", icon:"◈", url:"https://obsidian.md/download" },
  { name:"Docker Desktop", platform:"Windows", category:"Geliştirici", desc:"Konteyner tabanlı uygulama geliştirme ortamı.", icon:"🐳", url:"https://docs.docker.com/desktop/setup/install/windows-install/" },
];

export default function DownloadCenter() {
  const [platform,setPlatform] = useState("Tümü");
  const [category,setCategory] = useState("Tümü");
  const [query,setQuery] = useState("");
  const visible = useMemo(() => items.filter(x =>
    (platform === "Tümü" || x.platform === platform) &&
    (category === "Tümü" || x.category === category) &&
    (x.name + " " + x.desc).toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))
  ),[platform,category,query]);

  return <main className="hub">
    <nav><a className="logo" href="/"> <b>A</b> ay<span>zek</span></a><div><a className="navactive" href="#apps">Uygulamalar</a><a href="#games">Oyunlar</a><a href="#safety">Güvenlik</a></div><small>✦ Ay Zek Mağaza</small></nav>
    <header><div className="hero-copy"><label>AY ZEK UYGULAMA MAĞAZASI</label><h1>Keşfet. İndir.<br/><em>Keyfini çıkar.</em></h1><p>Android ve Windows uygulamalarını tek yerde keşfet. İndirmeler seni resmî geliştirici sayfalarına götürür.</p><a className="cta" href="#apps">Mağazaya göz at ↓</a></div><div className="hero-art"><span>✦</span><b>Uygulamalar<br/>senin dünyan.</b><small>ANDROID · WINDOWS</small></div></header>
    <section id="apps"><div className="heading"><div><label>MAĞAZA</label><h2>Senin için keşfet</h2><p>Popüler uygulamalar ve kullanışlı araçlar.</p></div><small>{visible.length} uygulama</small></div>
      <div className="storebar"><div className="tabs">{["Tümü","Android","Windows"].map(x=><button key={x} className={platform===x?"selected":""} onClick={()=>setPlatform(x)}>{x==="Android"?"◈ ":x==="Windows"?"⊞ ":"✦ "}{x}</button>)}</div><span>Ücretsiz keşif kataloğu</span></div>
      <div className="filters"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="⌕  Uygulama ara..."/><select value={category} onChange={e=>setCategory(e.target.value)}>{["Tümü",...Array.from(new Set(items.map(x=>x.category)))].map(x=><option key={x}>{x}</option>)}</select></div>
      <div className="grid">{visible.map((x,i)=><article key={x.platform+x.name}><div className="cardtop"><b>{x.icon}</b><small>{x.platform==="Android"?"◈ Android":"⊞ Windows"}</small></div><label>{x.category}</label><h3>{x.name}</h3><p>{x.desc}</p><a href={x.url} target="_blank" rel="noopener noreferrer">Resmi indirme sayfası ↗</a></article>)}</div>
      {!visible.length&&<div className="empty">Sonuç bulunamadı. Aramanı veya filtrelerini değiştir.</div>}
    </section>
    <section className="safety" id="safety"><b>✓</b><div><label>GÜVENLİ İNDİRME</label><h2>Resmî kaynak, bilinçli tercih.</h2><p>Ay Zek'i kullanmak için yaş doğrulaması veya yaş sınırı ekranı yoktur. Ancak listelenen uygulamaların kendi mağaza yaş derecelendirmeleri ve kullanım koşulları geçerlidir. İndirmeden önce yayıncıyı ve uygulama izinlerini kontrol et.</p></div></section>
    <footer><a className="logo" href="/"><b>A</b> ay<span>zek</span></a><small>© {new Date().getFullYear()} Ay Zek · Uygulama keşif merkezi</small></footer>
    <style jsx global>{`
      *{box-sizing:border-box}html{scroll-behavior:smooth}.hub{min-height:100vh;background:#090b12;color:#f5f4fa;font-family:Arial,sans-serif}.hub nav{height:72px;max-width:1120px;margin:auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff15}.logo{display:flex;align-items:center;gap:7px;color:#fff;text-decoration:none;font-size:21px;font-weight:800}.logo b{display:grid;place-items:center;width:31px;height:31px;border-radius:10px;background:linear-gradient(135deg,#a78bfa,#ec4899);color:#171020}.logo span{color:#b9a0ff}.hub nav div{display:flex;gap:25px}.hub nav div a{color:#aaa5b8;text-decoration:none;font-size:12px}.hub nav>small{font-size:10px;color:#cbb8ff;border:1px solid #a78bfa44;background:#a78bfa12;border-radius:20px;padding:8px 11px}
      .hub header{max-width:1120px;margin:auto;min-height:340px;padding:62px 24px;display:flex;align-items:center;justify-content:space-between;gap:30px;background:radial-gradient(ellipse at 75% 40%,#8656dc30,transparent 48%),#0d0d16}.hero-copy{max-width:600px}.hero-copy p{max-width:520px}.hero-art{width:290px;height:220px;border:1px solid #a78bfa44;border-radius:28px;background:linear-gradient(140deg,#a78bfa30,#ec489922);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:13px;box-shadow:0 25px 70px #0005}.hero-art span{font-size:48px;color:#d8b4fe}.hero-art b{font-size:23px;text-align:center;line-height:1.2}.hero-art small{font-size:9px;letter-spacing:2px;color:#c4b5fd}.hub header label,.hub section label{font-size:10px;letter-spacing:1.6px;color:#b9a0ff;font-weight:800}.hub h1{font-size:clamp(38px,6vw,64px);line-height:1.1;letter-spacing:-2.5px;margin:22px 0 15px}.hub h1 em{font-style:normal;color:#c4b5fd}.hub header p{color:#a19caf;font-size:13px;line-height:1.8}.hub header aside{display:none}.cta{display:inline-block;margin-top:18px;padding:13px 18px;border-radius:10px;background:linear-gradient(110deg,#a78bfa,#e879f9);color:#171020;text-decoration:none;font-size:12px;font-weight:800}.hub aside{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:42px;color:#888397;font-size:10px}.hub aside b{font-size:16px;color:#fff}.hub aside i{height:24px;width:1px;background:#ffffff25}
      .hub section#apps{max-width:1120px;margin:auto;padding:48px 24px 72px}.heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:23px}.heading h2,.safety h2{font-size:28px;margin:8px 0}.heading p{font-size:12px;color:#918da0;margin:0}.heading>small{font-size:10px;color:#b9b0c8;border:1px solid #ffffff22;border-radius:20px;padding:7px 10px}.storebar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.storebar>span{font-size:10px;color:#888397}.tabs{display:flex;gap:8px;margin-bottom:0}.tabs button{border:1px solid #ffffff22;background:#ffffff08;color:#aaa5b7;padding:10px 15px;border-radius:9px;font-size:11px;cursor:pointer}.tabs button.selected{border-color:#a78bfa80;background:#a78bfa20;color:#ddceff}.filters{display:flex;gap:10px;margin-bottom:20px}.filters input,.filters select{height:43px;border:1px solid #ffffff22;background:#11131c;color:#eee;border-radius:9px;padding:0 13px;font-size:12px;outline:none}.filters input{flex:1}.filters select{min-width:145px}.filters input::placeholder{color:#777286}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.grid article{background:#151722;border:1px solid #ffffff16;border-radius:18px;padding:17px;transition:.2s}.grid article:hover{transform:translateY(-3px);border-color:#a78bfa66;background:#1b1d2b}.cardtop{display:flex;justify-content:space-between;align-items:center;margin-bottom:17px}.cardtop b{width:42px;height:42px;display:grid;place-items:center;background:#a78bfa20;border-radius:12px;color:#d4c3ff;font-size:19px}.cardtop small{font-size:9px;color:#c5b5ed;background:#a78bfa14;padding:6px 8px;border-radius:20px}.grid article label{font-size:9px;color:#b9a0ff}.grid h3{font-size:16px;margin:6px 0}.grid p{font-size:11px;color:#9995a7;line-height:1.6;min-height:38px}.grid article>a{display:block;margin-top:14px;padding:10px;border:1px solid #a78bfa44;background:#a78bfa12;color:#d7c7ff;border-radius:8px;text-align:center;text-decoration:none;font-size:10px;font-weight:700}.empty{text-align:center;padding:35px;color:#aaa;font-size:12px}
      .safety{max-width:1072px;margin:0 auto 60px;padding:22px;display:flex;gap:17px;border:1px solid #34d39935;background:#34d3990c;border-radius:14px}.safety>b{width:37px;height:37px;display:grid;place-items:center;background:#34d39920;color:#6ee7b7;border-radius:10px;flex-shrink:0}.safety h2{font-size:20px;margin:6px 0}.safety p{font-size:11px;color:#9ca99f;line-height:1.8;margin:0;max-width:780px}.hub footer{max-width:1120px;margin:auto;border-top:1px solid #ffffff15;padding:22px 24px 28px;display:flex;justify-content:space-between;align-items:center}.hub footer .logo{font-size:17px}.hub footer .logo b{width:26px;height:26px;font-size:14px}.hub footer small{font-size:10px;color:#777487}
      @media(max-width:850px){.hero-art{width:230px;height:190px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.safety{margin:0 24px 45px}}@media(max-width:560px){.hub header{min-height:auto;display:block;padding:55px 18px 45px}.hero-art{display:none}.storebar{display:block}.storebar>span{display:block;margin:10px 2px}.hub nav{padding:0 16px}.hub nav div{display:none}.hub header{padding:65px 18px 48px}.hub h1{letter-spacing:-1.6px}.hub aside{gap:7px;font-size:9px}.hub aside b{font-size:14px}.hub section#apps{padding:42px 15px 52px}.grid{gap:8px}.grid article{padding:12px}.grid h3{font-size:14px}.grid p{font-size:10px;min-height:50px}.cardtop b{width:36px;height:36px}.cardtop small{font-size:8px;padding:5px}.filters{flex-direction:column}.filters select{height:42px}.safety{margin:0 15px 40px;padding:16px}.hub footer{padding:20px 15px}.hub footer small{font-size:9px}}
    `}</style>
  </main>;
}
