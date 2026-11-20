"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, ChevronRight, Download, Gamepad2, Grid2X2, Laptop, LogIn, LogOut, Search, ShieldCheck, Sparkles, Star, UserRound, X } from "lucide-react";
import "./store.css";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const apps = [
  { id:"chat", name:"Ay Zek AI", subtitle:"Kişisel yapay zekâ asistanın", category:"Üretkenlik", icon:"✦", color:"violet", rating:"4.9", route:"/chat", description:"Sorularını yanıtla, fikirlerini geliştir ve üretkenliğini artır." },
  { id:"builder", name:"Ay Zek Studio", subtitle:"Fikirlerinden uygulama oluştur", category:"Üretkenlik", icon:"⌘", color:"blue", rating:"4.8", route:"/builder", description:"Yalnızca ne istediğini anlat; web uygulaması fikrini projeye dönüştür." },
  { id:"virus-game", name:"Virüs Avcısı", subtitle:"Sanal dünyayı kurtar", category:"Oyunlar", icon:"☣", color:"green", rating:"4.7", route:"/virus-game", description:"Sanal virüslerden kaç, panzehirleri topla ve ağı kurtar." },
  { id:"yildiz", name:"Yıldız Koşusu", subtitle:"Uzayda rekorunu kır", category:"Oyunlar", icon:"🚀", color:"pink", rating:"4.8", route:"/yildiz-kosusu", description:"Yıldızları topla, göktaşlarından kaç ve en yüksek skora ulaş." },
  { id:"chess", name:"Ay Zek Satranç", subtitle:"Hamlelerini planla", category:"Oyunlar", icon:"♟", color:"orange", rating:"4.6", route:"/satranc", description:"Satranç oyna ve strateji becerilerini geliştir." },
  { id:"city", name:"Şehir Kur", subtitle:"Kendi şehrini tasarla", category:"Oyunlar", icon:"🏙", color:"cyan", rating:"4.6", route:"/sehir", description:"Şehrini kur, büyüt ve yeni bölgeler keşfet." },
  { id:"simulator", name:"Virüs Simülatörü", subtitle:"Güvenli bilim simülasyonu", category:"Eğitim", icon:"🧬", color:"teal", rating:"4.5", route:"/virus-simulator", description:"Tamamen sanal ortamda yayılma modellerini keşfet." },
  { id:"survival", name:"Hayatta Kalma", subtitle:"Zorlu koşullara hazırlan", category:"Oyunlar", icon:"🏕", color:"green", rating:"4.5", route:"/hayatta-kalma", description:"Kaynaklarını yönet ve zorlu senaryolarda hayatta kal." },
];
const categories = ["Tümü", "Üretkenlik", "Oyunlar", "Eğitim"];

export default function StorePage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tümü");
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installHelp, setInstallHelp] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const client = createClient(url, key);
      setSupabase(client);
      client.auth.getUser().then(({ data }) => setUser(data.user));
      const { data: listener } = client.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
      return () => listener.subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    const handler = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    const installed = () => { setInstallPrompt(null); setInstallHelp(false); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", handler); window.removeEventListener("appinstalled", installed); };
  }, []);

  const filtered = useMemo(() => apps.filter(app => (category === "Tümü" || app.category === category) && (app.name + " " + app.subtitle).toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))), [category, query]);

  async function submitAuth(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) { setAuthMessage("Hesap sistemi şu anda yapılandırılamadı. Lütfen daha sonra tekrar dene."); return; }
    setBusy(true); setAuthMessage("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
        if (error) throw error;
        if (data.session) { setUser(data.user); setAuthOpen(false); }
        else setAuthMessage("Kayıt isteğin alındı. E-posta adresine gelen doğrulama bağlantısını aç.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setUser(data.user); setAuthOpen(false);
      }
    } catch (error) { setAuthMessage(error instanceof Error ? error.message : "Bir hata oluştu."); }
    finally { setBusy(false); }
  }

  async function signOut() { if (supabase) await supabase.auth.signOut(); setUser(null); }
  async function installApp() {
    if (!installPrompt) { setInstallHelp(true); return; }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  return <main className="storePage">
    <header className="storeNav">
      <Link href="/" className="storeBrand"><span className="storeBrandIcon"><Sparkles size={21}/></span><span>Ay Zek <small>MAĞAZA</small></span></Link>
      <nav><a href="#kesfet">Keşfet</a><a href="#kategoriler">Kategoriler</a><a href="#bilgi">Hakkında</a></nav>
      <div className="storeAccount">
        {user ? <><span className="userBadge"><UserRound size={15}/>{user.user_metadata?.display_name || user.email?.split("@")[0] || "Ay Zek hesabı"}</span><button className="accountBtn" onClick={signOut} title="Çıkış yap"><LogOut size={17}/></button></> : <button className="accountBtn accountPrimary" onClick={() => {setMode("login");setAuthOpen(true)}}><UserRound size={16}/> Ay Zek hesabı</button>}
      </div>
    </header>

    <section className="storeHero">
      <div className="heroOrb orbOne"/><div className="heroOrb orbTwo"/>
      <div className="storeEyebrow"><span/> AY ZEK DİJİTAL MAĞAZA</div>
      <h1>İhtiyacın olan her şey<br/><em>tek bir mağazada.</em></h1>
      <p>Yeni uygulamaları keşfet, oyunları dene ve üretkenliğini artır. Hepsi Ay Zek hesabınla.</p>
      <div className="storeSearch"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Uygulama veya oyun ara..." aria-label="Uygulama ara"/><kbd>⌘ K</kbd></div>
      <div className="storeHeroActions"><button onClick={()=>document.getElementById("kesfet")?.scrollIntoView({behavior:"smooth"})}>Mağazayı keşfet <ArrowRight size={17}/></button><button className="installHero" onClick={installApp}><Download size={17}/> Bilgisayara yükle</button></div>
      <div className="storeHeroNote"><ShieldCheck size={15}/> Bağımsız Ay Zek mağazası · Güvenli bağlantı</div>
    </section>

    <section className="storeContent" id="kesfet">
      <div className="storeSectionHead"><div><span className="storeEyebrow">SENİN İÇİN SEÇTİKLERİMİZ</span><h2>Öne çıkan uygulamalar</h2><p>Ay Zek dünyasından seçilmiş uygulamalar.</p></div><span className="appCount">{filtered.length} uygulama</span></div>
      <div className="categoryTabs" id="kategoriler">{categories.map(item=><button key={item} className={category===item?"active":""} onClick={()=>setCategory(item)}>{item==="Tümü"?<Grid2X2 size={15}/>:item==="Oyunlar"?<Gamepad2 size={15}/>:item==="Eğitim"?<Sparkles size={15}/>:<Laptop size={15}/>} {item}</button>)}</div>
      <div className="storeGrid">{filtered.map(app=><article className="storeAppCard" key={app.id}>
        <div className={"appIcon "+app.color}>{app.icon}</div><div className="appMain"><div className="appCategory">{app.category}</div><h3>{app.name}</h3><p>{app.subtitle}</p><div className="appRating"><Star size={13} fill="currentColor"/>{app.rating}<span>· Ay Zek</span></div></div>
        <p className="appDescription">{app.description}</p><Link className="appGet" href={app.route}>Aç <ChevronRight size={15}/></Link>
      </article>)}</div>
      {filtered.length===0 && <div className="storeEmpty"><Search size={28}/><b>Uygulama bulunamadı</b><p>Başka bir isim veya kategori dene.</p></div>}
    </section>

    <section className="desktopBanner" id="bilgi"><div className="desktopIcon"><Laptop size={30}/></div><div><span>AY ZEK HER YERDE</span><h2>Bilgisayarına da yükle.</h2><p>Windows bilgisayarında Ay Zek Mağaza'yı ayrı bir uygulama penceresinde kullan. Chrome veya Edge üzerinden yükleyebilirsin.</p></div><button onClick={installApp}><Download size={17}/> {installPrompt?"Şimdi yükle":"Yükleme talimatı"} <ArrowRight size={16}/></button></section>

    <footer className="storeFooter"><Link href="/" className="storeBrand"><span className="storeBrandIcon"><Sparkles size={18}/></span><span>Ay Zek <small>MAĞAZA</small></span></Link><span>Bu, Apple App Store ile bağlantısı olmayan bağımsız bir Ay Zek projesidir.</span><span>© 2026 Ay Zek</span></footer>

    {authOpen && <div className="modalShade" onClick={()=>setAuthOpen(false)}><section className="authModal" onClick={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setAuthOpen(false)} aria-label="Kapat"><X size={19}/></button><div className="modalLogo"><Sparkles size={23}/></div><span className="storeEyebrow">AY ZEK HESABI</span><h2>{mode==="login"?"Tekrar hoş geldin.":"Ay Zek'e katıl."}</h2><p>Uygulamalarını ve mağaza deneyimini Ay Zek hesabınla yönet.</p><form onSubmit={submitAuth}>{mode==="signup"&&<label>Görünen ad<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Adın" required/></label>}<label>E-posta<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ornek@eposta.com" required/></label><label>Şifre<input type="password" autoComplete={mode==="login"?"current-password":"new-password"} minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="En az 6 karakter" required/></label><button className="authSubmit" disabled={busy}>{busy?"İşleniyor...":mode==="login"?"Giriş yap":"Hesap oluştur"} <ArrowRight size={17}/></button></form>{authMessage&&<div className="authMessage">{authMessage}</div>}<div className="authSwitch">{mode==="login"?"Henüz hesabın yok mu?":"Zaten hesabın var mı?"} <button onClick={()=>{setMode(mode==="login"?"signup":"login");setAuthMessage("")}}>{mode==="login"?"Kayıt ol":"Giriş yap"}</button></div><small className="authPrivacy">Apple hesabı istenmez. Ay Zek hesabı için e-posta ve şifren kullanılır.</small></section></div>}

    {installHelp && <div className="modalShade" onClick={()=>setInstallHelp(false)}><section className="authModal installModal" onClick={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setInstallHelp(false)} aria-label="Kapat"><X size={19}/></button><div className="modalLogo"><Laptop size={24}/></div><span className="storeEyebrow">WINDOWS BİLGİSAYAR</span><h2>Ay Zek'i bilgisayarına ekle.</h2><p>Chrome veya Microsoft Edge'de bu siteyi açtıktan sonra:</p><ol><li>Adres çubuğunun sağındaki yükleme simgesine tıkla.</li><li><b>Yükle</b> seçeneğini onayla.</li><li>Ay Zek Mağaza Başlat menüsünde ve masaüstü uygulamaları arasında görünür.</li></ol><button className="authSubmit" onClick={()=>setInstallHelp(false)}>Anladım <Check size={17}/></button></section></div>}
  </main>;
}
