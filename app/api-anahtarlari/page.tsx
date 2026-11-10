"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, KeyRound, Plus, ShieldCheck, Trash2, Check, Sparkles } from "lucide-react";
import "./api-keys.css";

type SavedKey = { id: string; name: string; preview: string; createdAt: string };

function makeKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return "ayz_live_" + token;
}

export default function ApiKeysPage() {
  const [name, setName] = useState("Yeni API anahtarı");
  const [keys, setKeys] = useState<SavedKey[]>([]);
  const [newSecret, setNewSecret] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ayzek-api-key-metadata");
      if (saved) setKeys(JSON.parse(saved));
    } catch { /* Ignore invalid local browser data. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("ayzek-api-key-metadata", JSON.stringify(keys));
  }, [keys, ready]);

  const createKey = () => {
    const secret = makeKey();
    const entry: SavedKey = {
      id: crypto.randomUUID(),
      name: name.trim() || "İsimsiz anahtar",
      preview: secret.slice(0, 16) + "••••••••••••",
      createdAt: new Date().toISOString()
    };
    setKeys(current => [entry, ...current]);
    setNewSecret(secret);
    setNotice("");
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Panoya kopyalandı.");
    } catch {
      setNotice("Kopyalama başarısız. Tarayıcı izinlerini kontrol et.");
    }
  };

  const removeKey = (id: string) => {
    setKeys(current => current.filter(key => key.id !== id));
    setNotice("Anahtar listeden kaldırıldı.");
  };

  return (
    <main className="keyPage">
      <header className="keyNav">
        <Link href="/" className="keyBrand"><span><Sparkles size={19}/></span>Ay Zek <em>API</em></Link>
        <Link href="/" className="keyBack"><ArrowLeft size={16}/> Ay Zek'e dön</Link>
      </header>

      <section className="keyHero">
        <div className="keyEyebrow"><span/> GELİŞTİRİCİ ARAÇLARI</div>
        <h1>API anahtarlarını <em>oluştur.</em></h1>
        <p>Kendi projelerin için güçlü, rastgele API anahtarları üret ve anahtarlarını bu tarayıcıdan yönet.</p>
      </section>

      <section className="keyLayout">
        <div className="keyPanel">
          <div className="keyPanelTitle"><div className="keyIcon"><KeyRound size={19}/></div><div><b>Yeni anahtar oluştur</b><small>256 bit rastgele anahtar</small></div></div>
          <label className="keyLabel" htmlFor="keyName">ANAHTAR ADI</label>
          <input id="keyName" className="keyInput" value={name} onChange={event => setName(event.target.value)} maxLength={48} placeholder="Örn. Web sitem"/>
          <div className="keyInfo"><ShieldCheck size={17}/><span>Anahtar, tarayıcının güvenli kripto rastgele sayı üreteciyle oluşturulur.</span></div>
          <button className="keyCreate" onClick={createKey}><Plus size={18}/> API anahtarı oluştur</button>
          <p className="keyFootnote">Gizli anahtar yalnızca oluşturulduğunda gösterilir. Sayfayı kapatmadan önce güvenli bir yere kaydet.</p>
        </div>

        <div className="keyPanel keyListPanel">
          <div className="keyPanelTitle"><div className="keyIcon"><ShieldCheck size={19}/></div><div><b>Oluşturduğun anahtarlar</b><small>{keys.length} kayıtlı anahtar</small></div></div>
          {keys.length === 0 ? <div className="keyEmpty"><KeyRound size={28}/><b>Henüz anahtar yok</b><span>İlk API anahtarını oluşturduğunda burada görünecek.</span></div> :
            <div className="keyList">{keys.map(key => <div className="keyRow" key={key.id}><div className="keyRowIcon"><KeyRound size={16}/></div><div className="keyRowText"><b>{key.name}</b><code>{key.preview}</code><small>{new Date(key.createdAt).toLocaleString("tr-TR")}</small></div><button className="keyDelete" onClick={() => removeKey(key.id)} aria-label="Anahtarı listeden sil"><Trash2 size={16}/></button></div>)}</div>}
          {notice && <div className="keyNotice">{notice}</div>}
        </div>
      </section>

      {newSecret && <div className="keyModalBackdrop" role="dialog" aria-modal="true" aria-labelledby="secretTitle"><div className="keySecretModal"><div className="keySuccess"><Check size={22}/></div><h2 id="secretTitle">Anahtarın hazır!</h2><p>Bu gizli anahtar daha sonra tekrar gösterilmeyecek. Şimdi kopyalayıp güvenli bir yere kaydet.</p><code className="keySecret">{newSecret}</code><button className="keyCreate" onClick={() => copy(newSecret)}><Copy size={17}/> Anahtarı kopyala</button><button className="keyClose" onClick={() => setNewSecret("")}>Kaydettim, kapat</button></div></div>}

      <footer className="keyFooter">Ay Zek API Araçları · Anahtar geçmişi yalnızca bu tarayıcıda tutulur.</footer>
    </main>
  );
}
