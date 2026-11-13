"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ArrowLeft, Copy, KeyRound, Plus, ShieldCheck, Trash2, Check, Sparkles, LogIn, LogOut } from "lucide-react";
import "./api-keys.css";

type SavedKey = { id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null; revoked_at: string | null };
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function makeKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
  return "ayz_live_" + token;
}
async function hashKey(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function ApiKeysPage() {
  const [name, setName] = useState("Yeni API anahtarı");
  const [keys, setKeys] = useState<SavedKey[]>([]);
  const [newSecret, setNewSecret] = useState("");
  const [notice, setNotice] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStage, setOtpStage] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("setup") ?? "";
    setSetupToken(token);
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) setNotice("Oturum kontrol edilemedi. Sayfayı yenileyip tekrar dene.");
      const current = data.session?.user;
      setUser(current ? { id: current.id } : null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = session?.user;
      setUser(current ? { id: current.id } : null);
      if (!current) setKeys([]);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) { setKeys([]); return; }
    let active = true;
    void supabase.from("api_keys")
      .select("id,name,key_prefix,created_at,last_used_at,revoked_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setNotice("Anahtarlar yüklenemedi: " + error.message);
        else setKeys((data ?? []) as SavedKey[]);
      });
    return () => { active = false; };
  }, [user?.id]);

  const authenticate = async (mode: "login" | "setup") => {
    if (!supabase) return;
    if (password.length < 12 || password.length > 128) {
      setNotice("Şifre en az 12, en fazla 128 karakter olmalı."); return;
    }
    if (mode === "setup" && password !== confirmPassword) {
      setNotice("Şifreler eşleşmiyor."); return;
    }
    if (mode === "setup" && !setupToken) {
      setNotice("Tek seferlik kurulum bağlantısı eksik. Kurulum bağlantısını kullan."); return;
    }
    setBusy(true); setNotice("");
    try {
      const { data, error } = await supabase.functions.invoke("username-auth", {
        body: { action: mode, password, ...(mode === "setup" ? { setupToken } : {}) },
      });
      if (error || !data?.otpSent || !data?.challengeToken) {
        setNotice(data?.error || error?.message || "Doğrulama kodu gönderilemedi. Tekrar dene.");
        return;
      }
      setChallengeToken(data.challengeToken);
      setOtpStage(true);
      setOtp("");
      setPassword("");
      setNotice("Güvenlik kodu yönetici e-posta adresine gönderildi.");
      if (mode === "setup") {
        setSetupToken("");
        setConfirmPassword("");
        window.history.replaceState({}, "", "/api-anahtarlari");
      }
    } catch {
      setNotice("Sunucuya bağlanılamadı. İnternetini kontrol edip tekrar dene.");
    } finally { setBusy(false); }
  };

  const verifyEmailCode = async () => {
    if (!supabase || !challengeToken || !/^\d{6}$/.test(otp)) {
      setNotice("E-postana gelen 6 haneli kodu gir."); return;
    }
    setBusy(true); setNotice("");
    try {
      const { data, error } = await supabase.functions.invoke("username-auth", {
        body: { action: "verify", challengeToken, otp },
      });
      if (error || !data?.session?.access_token || !data?.session?.refresh_token) {
        setNotice(data?.error || error?.message || "Kod doğrulanamadı. Yeniden giriş yap.");
        return;
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (sessionError) { setNotice("Oturum açılamadı. Tekrar giriş yap."); return; }
      setOtpStage(false);
      setChallengeToken("");
      setOtp("");
      setNotice("E-posta doğrulandı. Yönetici girişi başarılı.");
    } catch {
      setNotice("Doğrulama sırasında bağlantı hatası oluştu.");
    } finally { setBusy(false); }
  };

  const createKey = async () => {
    if (!supabase || !user) return;
    setBusy(true); setNotice("");
    const secret = makeKey();
    const hash = await hashKey(secret);
    const { error } = await supabase.from("api_keys").insert({
      user_id: user.id, name: name.trim() || "İsimsiz anahtar",
      key_prefix: secret.slice(0, 18), key_hash: hash
    });
    setBusy(false);
    if (error) { setNotice("Anahtar oluşturulamadı: " + error.message); return; }
    setNewSecret(secret);
    const { data } = await supabase.from("api_keys")
      .select("id,name,key_prefix,created_at,last_used_at,revoked_at")
      .order("created_at", { ascending: false });
    setKeys((data ?? []) as SavedKey[]);
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setNotice("Panoya kopyalandı."); }
    catch { setNotice("Kopyalama başarısız. Tarayıcı izinlerini kontrol et."); }
  };

  const revokeKey = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) setNotice("Anahtar iptal edilemedi: " + error.message);
    else {
      setNotice("API anahtarı iptal edildi.");
      setKeys(current => current.map(item => item.id === id ? { ...item, revoked_at: new Date().toISOString() } : item));
    }
  };

  return (
    <main className="keyPage">
      <header className="keyNav">
        <Link href="/" className="keyBrand"><span><Sparkles size={19}/></span>Ay Zek <em>API</em></Link>
        <div className="keyNavRight">
          {user && <small>Yönetici oturumu</small>}
          <Link href="/" className="keyBack"><ArrowLeft size={16}/> Ay Zek'e dön</Link>
        </div>
      </header>
      <section className="keyHero">
        <div className="keyEyebrow"><span/> GÜVENLİ YÖNETİCİ ALANI</div>
        <h1>API anahtarlarını <em>yönet.</em></h1>
        <p>Tek yönetici şifrenle giriş yap, API anahtarlarını güvenli şekilde oluştur ve iptal et.</p>
      </section>
      {!supabase ? <div className="keyPanel keyAuthPanel"><b>Kurulum eksik</b><p>Supabase bağlantısı için Vercel ortam değişkenleri ayarlanmamış.</p></div> :
      !user ? <section className="keyAuthPanel keyPanel">
        <div className="keyPanelTitle"><div className="keyIcon"><LogIn size={19}/></div><div><b>{otpStage ? "E-posta doğrulaması" : setupToken ? "Yönetici şifreni oluştur" : "Yönetici girişi"}</b><small>{otpStage ? "İkinci güvenlik adımı" : setupToken ? "Bu işlem yalnızca bir kez yapılır" : "Tek yönetici hesabı · Şifre + e-posta kodu"}</small></div></div>
        {!otpStage ? <>
          <label className="keyLabel" htmlFor="adminPassword">{setupToken ? "YÖNETİCİ ŞİFRESİ" : "YÖNETİCİ ŞİFREN"}</label>
          <input id="adminPassword" className="keyInput" type="password" autoComplete={setupToken ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 12 karakter" />
          {setupToken && <>
            <label className="keyLabel" htmlFor="confirmAdminPassword" style={{marginTop:16}}>ŞİFREYİ TEKRAR YAZ</label>
            <input id="confirmAdminPassword" className="keyInput" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Şifreni tekrar gir" />
          </>}
          <button className="keyCreate" disabled={busy || password.length < 12 || (!!setupToken && confirmPassword.length < 12)} onClick={() => void authenticate(setupToken ? "setup" : "login")}>
            <LogIn size={17}/>{busy ? "Kontrol ediliyor..." : setupToken ? "Şifreyi oluştur ve kod gönder" : "Şifre Al"}
          </button>
          <p className="keyFootnote">Şifren doğruysa yönetici e-posta adresine tek kullanımlık kod gönderilir. E-posta adresi gizli tutulur.</p>
        </> : <>
          <p className="keyInfo"><ShieldCheck size={17}/><span>6 haneli kod, yönetici e-posta adresine gönderildi. Kod 10 dakika içinde kullanılmalıdır.</span></p>
          <label className="keyLabel" htmlFor="adminOtp">E-POSTA DOĞRULAMA KODU</label>
          <input id="adminOtp" className="keyInput" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0,6))} placeholder="000000" />
          <button className="keyCreate" disabled={busy || otp.length !== 6} onClick={() => void verifyEmailCode()}>
            <ShieldCheck size={17}/>{busy ? "Doğrulanıyor..." : "Kodu doğrula ve giriş yap"}
          </button>
          <button className="keyClose" disabled={busy} onClick={() => { setOtpStage(false); setChallengeToken(""); setOtp(""); setNotice("Tekrar giriş yapmak için yönetici şifreni yaz."); }}>Geri dön</button>
          <p className="keyFootnote">Kod gelmediyse gereksiz/spam klasörünü de kontrol et.</p>
        </>}
      </section> :
      <section className="keyLayout">
        <div className="keyPanel">
          <div className="keyPanelTitle"><div className="keyIcon"><KeyRound size={19}/></div><div><b>Yeni anahtar oluştur</b><small>256 bit rastgele, gizli API anahtarı</small></div></div>
          <label className="keyLabel" htmlFor="keyName">ANAHTAR ADI</label>
          <input id="keyName" className="keyInput" value={name} onChange={e => setName(e.target.value)} maxLength={48} placeholder="Örn. Web sitem"/>
          <div className="keyInfo"><ShieldCheck size={17}/><span>Anahtarın kendisi veritabanına kaydedilmez; yalnızca SHA-256 özeti saklanır.</span></div>
          <button className="keyCreate" disabled={busy} onClick={() => void createKey()}><Plus size={18}/> API anahtarı oluştur</button>
          <p className="keyFootnote">Gizli anahtar yalnızca oluşturulduğunda gösterilir. Güvenli bir yere kaydet.</p>
        </div>
        <div className="keyPanel keyListPanel">
          <div className="keyPanelTitle"><div className="keyIcon"><ShieldCheck size={19}/></div><div><b>API anahtarların</b><small>{keys.length} kayıtlı anahtar</small></div><button className="keyLogout" onClick={async () => { await supabase.auth.signOut(); setKeys([]); setUser(null); }}><LogOut size={15}/> Çıkış</button></div>
          {keys.length === 0 ? <div className="keyEmpty"><KeyRound size={28}/><b>Henüz anahtar yok</b><span>İlk API anahtarını oluşturduğunda burada görünecek.</span></div> :
            <div className="keyList">{keys.map(key => <div className="keyRow" key={key.id}><div className="keyRowIcon"><KeyRound size={16}/></div><div className="keyRowText"><b>{key.name}</b><code>{key.key_prefix}••••••••••</code><small>{new Date(key.created_at).toLocaleString("tr-TR")} {key.last_used_at ? " · Son kullanım: " + new Date(key.last_used_at).toLocaleString("tr-TR") : ""}</small><small className={key.revoked_at ? "keyRevoked" : "keyActive"}>{key.revoked_at ? "İptal edildi" : "Aktif"}</small></div>{!key.revoked_at && <button className="keyDelete" onClick={() => void revokeKey(key.id)} aria-label="Anahtarı iptal et"><Trash2 size={16}/></button>}</div>)}</div>}
        </div>
      </section>}
      {notice && <div className="keyNotice keyGlobalNotice">{notice}</div>}
      {newSecret && <div className="keyModalBackdrop" role="dialog" aria-modal="true" aria-labelledby="secretTitle"><div className="keySecretModal"><div className="keySuccess"><Check size={22}/></div><h2 id="secretTitle">Anahtarın hazır!</h2><p>Bu gizli anahtar daha sonra tekrar gösterilmeyecek. Şimdi kopyalayıp güvenli bir yere kaydet.</p><code className="keySecret">{newSecret}</code><button className="keyCreate" onClick={() => void copy(newSecret)}><Copy size={17}/> Anahtarı kopyala</button><button className="keyClose" onClick={() => setNewSecret("")}>Kaydettim, kapat</button></div></div>}
      <footer className="keyFooter">Ay Zek API · Tek yönetici hesabı · Şifre ve e-posta doğrulaması.</footer>
    </main>
  );
}
