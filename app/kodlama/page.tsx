"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ArrowLeft, Code2, Download, Eye, FilePlus2, FolderOpen, Play, Save, Sparkles, Trash2, UserRound, LogOut } from "lucide-react";
import "./code.css";

type Project = { id: string; name: string; language: string; code: string; updated_at: string };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
const starter = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>İlk Projem</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f0ff; display: grid; place-items: center; min-height: 100vh; }
    .card { background: white; padding: 36px; border-radius: 20px; text-align: center; box-shadow: 0 12px 40px #34205b22; }
    h1 { color: #7046c7; }
    button { background: #7046c7; color: white; border: 0; padding: 12px 18px; border-radius: 10px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Merhaba Ay Zek! ✨</h1>
    <p>İlk web projen hazır. Şimdi düzenlemeye başlayabilirsin.</p>
    <button onclick="alert('Harika! Kodun çalışıyor 🎉')">Bana tıkla</button>
  </div>
</body>
</html>`;

export default function CodeStudioPage() {
  const [user, setUser] = useState<{id:string;email?:string}|null>(null);
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [mode,setMode]=useState<"login"|"signup">("signup");
  const [notice,setNotice]=useState(""); const [busy,setBusy]=useState(false);
  const [projects,setProjects]=useState<Project[]>([]);
  const [projectId,setProjectId]=useState(""); const [name,setName]=useState("İlk projem");
  const [language,setLanguage]=useState("html"); const [code,setCode]=useState(starter);
  const [preview,setPreview]=useState(false); const [refresh,setRefresh]=useState(0);

  useEffect(()=>{ if(!supabase)return;
    void supabase.auth.getSession().then(({data})=>{const u=data.session?.user;setUser(u?{id:u.id,email:u.email}:null)});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{const u=s?.user;setUser(u?{id:u.id,email:u.email}:null)});
    return ()=>subscription.unsubscribe();
  },[]);
  const load=async()=>{if(!supabase||!user)return;const {data,error}=await supabase.from("code_projects").select("id,name,language,code,updated_at").order("updated_at",{ascending:false});if(error)setNotice("Projeler yüklenemedi: "+error.message);else setProjects((data??[]) as Project[])};
  useEffect(()=>{void load()},[user?.id]);
  const openProject=(p:Project)=>{setProjectId(p.id);setName(p.name);setLanguage(p.language);setCode(p.code);setNotice("Proje açıldı.")};
  const fresh=()=>{setProjectId("");setName("Yeni projem");setLanguage("html");setCode(starter);setNotice("Yeni proje hazır.")};
  const authenticate=async()=>{if(!supabase)return;setBusy(true);setNotice("");const r=mode==="login"?await supabase.auth.signInWithPassword({email:email.trim(),password}):await supabase.auth.signUp({email:email.trim(),password});setBusy(false);if(r.error)setNotice(r.error.message);else if(mode==="signup"&&!r.data.session)setNotice("Hesabın oluşturuldu. E-postana gelen doğrulama bağlantısını aç.");else setNotice("Giriş başarılı.")};
  const save=async()=>{if(!supabase||!user)return;setBusy(true);setNotice("");const payload={user_id:user.id,name:name.trim()||"İsimsiz proje",language,code,updated_at:new Date().toISOString()};const result=projectId?await supabase.from("code_projects").update(payload).eq("id",projectId).select("id").single():await supabase.from("code_projects").insert(payload).select("id").single();setBusy(false);if(result.error){setNotice("Kaydedilemedi: "+result.error.message);return}if(result.data?.id)setProjectId(result.data.id);setNotice("Projen güvenle kaydedildi.");await load()};
  const remove=async()=>{if(!supabase||!projectId||!confirm("Bu projeyi silmek istiyor musun?"))return;const {error}=await supabase.from("code_projects").delete().eq("id",projectId);if(error)setNotice(error.message);else{fresh();setNotice("Proje silindi.");await load()}};
  const srcDoc=useMemo(()=>{if(language==="html")return code;if(language==="css")return `<!doctype html><html><head><style>${code}</style></head><body><h1>CSS önizlemesi</h1><p>Stilini burada görebilirsin.</p></body></html>`;const safe=JSON.stringify(code);return `<!doctype html><html><body><h2>JavaScript önizlemesi</h2><pre id="out"></pre><script>const log=(...a)=>document.getElementById("out").textContent+=a.join(" ")+String.fromCharCode(10);try{(new Function(${safe}))()}catch(e){log(e.message)}</script></body></html>`},[code,language,refresh]);
  const download=()=>{const blob=new Blob([code],{type:"text/plain;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=(name||"proje").replace(/[^a-z0-9-_]/gi,"-")+"."+({html:"html",css:"css",javascript:"js"} as Record<string,string>)[language];a.click();URL.revokeObjectURL(a.href)};
  return <main className="codePage">
    <header className="codeNav"><Link href="/" className="codeBrand"><span><Code2 size={20}/></span>Ay Zek <em>Kodlama</em></Link><div className="codeNavRight"><span className="codeOnline"/> Çalışma alanı <Link href="/" className="codeBack"><ArrowLeft size={15}/> Ay Zek'e dön</Link></div></header>
    {!supabase?<section className="codeAuth"><h2>Supabase bağlantısı gerekli</h2><p>Vercel ortam değişkenlerini ayarlayın.</p></section>:!user?<section className="codeAuth"><div className="codeAuthIcon"><UserRound size={24}/></div><h1>{mode==="signup"?"Kodlama dünyana hoş geldin":"Tekrar hoş geldin"}</h1><p>Projelerini kaydetmek için e-posta adresinle giriş yap.</p><input type="email" placeholder="E-posta adresin" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" placeholder="Şifre (en az 6 karakter)" value={password} onChange={e=>setPassword(e.target.value)}/><button className="codePrimary" disabled={busy||!email||password.length<6} onClick={()=>void authenticate()}>{busy?"Bekle...":mode==="signup"?"Ücretsiz hesap oluştur":"Giriş yap"}</button><button className="codeSwitch" onClick={()=>setMode(mode==="signup"?"login":"signup")}>{mode==="signup"?"Zaten hesabın var mı? Giriş yap":"Hesabın yok mu? Kayıt ol"}</button>{notice&&<p className="codeNotice">{notice}</p>}</section>:<>
      <section className="codeHeading"><div><div className="codeEyebrow"><Sparkles size={13}/> ONLINE GELİŞTİRME ORTAMI</div><h1>Fikrini <em>koda dönüştür.</em></h1><p>Kodunu yaz, önizle ve projelerini hesabında sakla.</p></div><div className="codeUser"><UserRound size={15}/>{user.email}<button title="Çıkış yap" onClick={()=>void supabase?.auth.signOut()}><LogOut size={15}/></button></div></section>
      <section className="codeLayout"><aside className="codeProjects"><div className="codeAsideHead"><b><FolderOpen size={16}/> Projelerim</b><button onClick={fresh} title="Yeni proje"><FilePlus2 size={17}/></button></div><button className="codeNew" onClick={fresh}><FilePlus2 size={15}/> Yeni proje oluştur</button>{projects.length===0?<p className="codeNoProjects">Henüz kayıtlı projen yok.</p>:projects.map(p=><button key={p.id} className={"codeProject "+(p.id===projectId?"selected":"")} onClick={()=>openProject(p)}><Code2 size={15}/><span>{p.name}<small>{p.language.toUpperCase()}</small></span></button>)}</aside>
      <div className="codeMain"><div className="codeEditorTop"><input value={name} onChange={e=>setName(e.target.value)} aria-label="Proje adı"/><select value={language} onChange={e=>setLanguage(e.target.value)}><option value="html">HTML</option><option value="css">CSS</option><option value="javascript">JavaScript</option></select><button onClick={download}><Download size={15}/> İndir</button><button className="codeSave" onClick={()=>void save()} disabled={busy}><Save size={15}/> {busy?"Kaydediliyor":"Kaydet"}</button></div>
      <div className="codeEditor"><div className="codeGutter">{code.split("\n").map((_,i)=><span key={i}>{i+1}</span>)}</div><textarea spellCheck={false} value={code} onChange={e=>setCode(e.target.value)} aria-label="Kod editörü" autoCapitalize="off" autoCorrect="off"/></div>
      <div className="codePreviewHead"><b><Eye size={16}/> Canlı önizleme</b><div><button onClick={()=>setPreview(!preview)}>{preview?"Önizlemeyi gizle":"Önizlemeyi göster"}</button><button className="codeRun" onClick={()=>{setPreview(true);setRefresh(x=>x+1)}}><Play size={14}/> Çalıştır</button></div></div>
      {preview&&<iframe key={refresh} className="codeFrame" title="Kod önizlemesi" sandbox="allow-scripts" srcDoc={srcDoc}/>}
      {notice&&<div className="codeNotice">{notice}</div>}<p className="codeHint">İpucu: HTML, CSS ve JavaScript kodlarını güvenli bir önizleme alanında çalıştırabilirsin.</p>
      </div></section></>}
    <footer className="codeFooter">Ay Zek Kodlama · Projelerin yalnızca hesabına özeldir.</footer>
  </main>
}
