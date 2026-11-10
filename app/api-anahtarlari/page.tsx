"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) setNotice("Oturum kontrol edilemedi. Sayfayı yenileyip tekrar dene.");
      const current = data.session?.user;
      setUser(current ? { id: current.id, email: current.email } : null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      const current = session?.user;
      setUser(current ? { id: current.id, email: current.email } : null);
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

  const auth = async (mode: "login" | "signup") => {
    if (!supabase) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(normalizedEmail)) {
      setNotice("Geçerli bir e-posta adresi yaz. Örnek: ad@gmail.com"); return;
    }
    if (password.length < 6) { setNotice("Şifren en az 6 karakter olmalı."); return; }
    setBusy(true); setNotice("");
    try {
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
        : await supabase.auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: window.location.origin + "/api-anahtarlari" } });
      if (result.error) {
        const message = result.error.message.toLowerCase();
        if (message.includes("invalid login credentials")) setNotice("E-posta veya şifre yanlış. Hesabın yoksa önce “Yeni hesap oluştur” seçeneğini kullan.");
        else if (message.includes("email") && (message.includes("invalid") || message.includes("format"))) setNotice("E-posta adresi geçersiz. Örnek: ad@gmail.com");
        else if (message.includes("email not confirmed")) setNotice("E-posta adresin henüz doğrulanmamış. Gelen kutundaki doğrulama bağlantısını aç.");
        else if (message.includes("already") || message.includes("registered") || message.includes("exists")) setNotice("Bu e-posta zaten kayıtlı. Giriş yapmayı dene.");
        else if (message.includes("rate") || (message.includes("email") && message.includes("send"))) setNotice("Doğrulama e-postası gönderilemedi. Biraz bekleyip tekrar dene.");
        else setNotice("İşlem başarısız: " + result.error.message);
      } else if (mode === "signup" && !result.data.session) {
        setNotice("Hesabın oluşturuldu! E-postana gelen doğrulama bağlantısını aç.");
      } else {
        setNotice("Giriş başarılı.");
        const current = result.data.user;
        if (current) setUser({ id: current.id, email: current.email });
      }
    } catch {
      setNotice("Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.");
    } finally { setBusy(false); }
  };

  const resetPassword = async () => {
    if (!supabase) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(normalizedEmail)) {
      setNotice("Şifre sıfırlamak için geçerli e-posta adresini yaz."); return;
    }
    setBusy(true); setNotice("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: window.location.origin + "/api-anahtarlari" });
      setNotice(error ? "Şifre sıfırlama gönderilemedi: " + error.message : "Şifre sıfırlama bağlantısı gönderildiyse gelen kutunu kontrol et.");
    } catch { setNotice("Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene."); }
    finally { setBusy(false); }
  };

  const updatePassword = async () => {\n    if (!supabase || newPassword.length < 6) return;\n    setBusy(true); setNotice("");\n    try {\n      const { error } = await supabase.auth.updateUser({ password: newPassword });\n      if (error) setNotice("Şifre güncellenemedi: " + error.message);\n      else { setNotice("Şifren başarıyla değiştirildi. Yeni şifrenle giriş yapabilirsin."); setRecovery(false); setNewPassword(""); await supabase.auth.signOut(); }\n    } catch { setNotice("Bağlantı kurulamadı. Tekrar dene."); }\n    finally { setBusy(false); }\n  };\n\n  const createKey = async () => {
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

  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setNotice("Panoya kopyalandı."); }
    catch { setNotice("Kopyalama başarısız. Tarayıcı izinlerini kontrol et."); }
  };

  const revokeKey = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) setNotice("Anahtar iptal edilemedi: " + error.message);
    else { setNotice("API anahtarı iptal edildi."); setKeys(current => current.map(item => item.id === id ? { ...item, revoked_at: new Date().toISOString() } : item)); }
  };

  return (
    <main className="keyPage">
      <header className="keyNav">
        <Link href="/" className="keyBrand"><span><Sparkles size={19}/></span>Ay Zek <em>API</em></Link>
        <div className="keyNavRight">{user && <small>{user.email}</small>}<Link href="/" className="keyBack"><ArrowLeft size={16}/> Ay Zek'e dön</Link></div>
      </header>
      <section className="keyHero">
        <div className="keyEyebrow"><span/> GELİŞTİRİCİ ARAÇLARI</div>
        <h1>API anahtarlarını <em>yönet.</em></h1>
        <p>Hesabınla giriş yap, gerçek API anahtarları oluştur, iptal et ve isteklerde doğrula.</p>
      </section>
      {recovery ? <section className="keyAuthPanel keyPanel"><div className="keyPanelTitle"><div className="keyIcon"><KeyRound size={19}/></div><div><b>Yeni şifre belirle</b><small>Hesabın için yeni bir şifre oluştur</small></div></div><label className="keyLabel" htmlFor="newPassword">YENİ ŞİFRE</label><input id="newPassword" className="keyInput" type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="En az 6 karakter"/><button className="keyCreate" disabled={busy || newPassword.length < 6} onClick={() => void updatePassword()}>Şifremi değiştir</button></section> : !supabase ? <div className="keyPanel keyAuthPanel"><b>Kurulum eksik</b><p>Supabase bağlantısı için Vercel ortam değişkenleri henüz ayarlanmamış.</p></div> :
      !user ? <section className="keyAuthPanel keyPanel">
        <div className="keyPanelTitle"><div className="keyIcon"><LogIn size={19}/></div><div><b>Hesabına giriş yap</b><small>API anahtarların hesabına özel ve güvenli saklanır</small></div></div>
        <label className="keyLabel" htmlFor="keyEmail">E-POSTA</label>
        <input id="keyEmail" className="keyInput" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com"/>
        <label className="keyLabel" htmlFor="keyPassword" style={{marginTop:16}}>ŞİFRE</label>
        <input id="keyPassword" className="keyInput" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 6 karakter"/>
        <div className="keyAuthButtons"><button className="keyCreate" disabled={busy || !email || password.length < 6} onClick={() => void auth("login")}><LogIn size={17}/> Giriş yap</button><button className="keySecondary" disabled={busy || !email || password.length < 6} onClick={() => void auth("signup")}>Yeni hesap oluştur</button><button className="keySecondary" disabled={busy || !email} onClick={() => void resetPassword()}>Şifremi unuttum</button></div>
        <p className="keyFootnote">Hesabın yoksa yeni hesap oluştur. E-posta doğrulaması istenebilir.</p>
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
          <div className="keyPanelTitle"><div className="keyIcon"><ShieldCheck size={19}/></div><div><b>API anahtarların</b><small>{keys.length} kayıtlı anahtar</small></div><button className="keyLogout" onClick={async () => { await supabase.auth.signOut(); setKeys([]); setUser(null); }}> <LogOut size={15}/> Çıkış</button></div>
          {keys.length === 0 ? <div className="keyEmpty"><KeyRound size={28}/><b>Henüz anahtar yok</b><span>İlk API anahtarını oluşturduğunda burada görünecek.</span></div> :
            <div className="keyList">{keys.map(key => <div className="keyRow" key={key.id}><div className="keyRowIcon"><KeyRound size={16}/></div><div className="keyRowText"><b>{key.name}</b><code>{key.key_prefix}••••••••••</code><small>{new Date(key.created_at).toLocaleString("tr-TR")} {key.last_used_at ? " · Son kullanım: " + new Date(key.last_used_at).toLocaleString("tr-TR") : ""}</small><small className={key.revoked_at ? "keyRevoked" : "keyActive"}>{key.revoked_at ? "İptal edildi" : "Aktif"}</small></div>{!key.revoked_at && <button className="keyDelete" onClick={() => void revokeKey(key.id)} aria-label="Anahtarı iptal et"><Trash2 size={16}/></button>}</div>)}</div>}
        </div>
      </section>}
      {notice && <div className="keyNotice keyGlobalNotice">{notice}</div>}
      {newSecret && <div className="keyModalBackdrop" role="dialog" aria-modal="true" aria-labelledby="secretTitle"><div className="keySecretModal"><div className="keySuccess"><Check size={22}/></div><h2 id="secretTitle">Anahtarın hazır!</h2><p>Bu gizli anahtar daha sonra tekrar gösterilmeyecek. Şimdi kopyalayıp güvenli bir yere kaydet.</p><code className="keySecret">{newSecret}</code><button className="keyCreate" onClick={() => void copy(newSecret)}><Copy size={17}/> Anahtarı kopyala</button><button className="keyClose" onClick={() => setNewSecret("")}>Kaydettim, kapat</button></div></div>}
      <footer className="keyFooter">Ay Zek API · Hesap koruması ve anahtar doğrulama Supabase ile sağlanır.</footer>
    </main>
  );
}
