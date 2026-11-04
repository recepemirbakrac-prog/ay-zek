"use client";

import { useRef, useState } from "react";
import { AudioLines, Music2, Sparkles, WandSparkles, Play, Pause, Download, Upload, Mic2, Disc3 } from "lucide-react";

const genres = ["Pop", "Rap", "Rock", "Arabesk", "Elektronik", "Lo-fi", "R&B", "Türk Halk Müziği"];
const moods = ["Neşeli", "Romantik", "Hüzünlü", "Enerjik", "Sakin", "Epik"];
export default function Home() {
  const [idea,setIdea] = useState("");
  const [genre,setGenre] = useState("Pop");
  const [mood,setMood] = useState("Romantik");
  const [language,setLanguage] = useState("Türkçe");
  const [voice,setVoice] = useState("Kadın vokal");
  const [lyrics,setLyrics] = useState("");
  const [title,setTitle] = useState("Yeni şarkım");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [audioUrl,setAudioUrl] = useState("");
  const [playing,setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  async function createSong(e:React.FormEvent) {
    e.preventDefault(); if(!idea.trim() || busy) return;
    setBusy(true); setError(""); setLyrics("");
    try {
      const res = await fetch("/api/song",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idea,genre,mood,language,voice})});
      if(!res.ok) throw new Error("Şarkı sözleri oluşturulamadı. Gateway ayarlarını kontrol et.");
      const data = await res.json(); setTitle(data.title || "Yeni şarkım"); setLyrics(data.lyrics || "");
    } catch(err) { setError(err instanceof Error ? err.message : "Bir hata oluştu."); }
    finally { setBusy(false); }
  }
  function uploadAudio(e:React.ChangeEvent<HTMLInputElement>) { const f=e.target.files?.[0]; if(f){if(audioUrl)URL.revokeObjectURL(audioUrl);setAudioUrl(URL.createObjectURL(f));setPlaying(false);} }
  function togglePlay(){if(!audioRef.current)return;if(playing){audioRef.current.pause();setPlaying(false);}else{void audioRef.current.play();setPlaying(true);}}
  return <main className="studio">
    <aside className="sidebar"><a className="brand" href="#"><span><AudioLines size={21}/></span> ses<span className="brandLight">lab</span></a><div className="sideLabel">STÜDYO</div><a className="sideActive"><WandSparkles size={17}/> Şarkı oluştur</a><a className="sideLink" href="/chat"><Sparkles size={17}/> Ay Zek ile sohbet</a><a className="sideLink"><Disc3 size={17}/> Kütüphanem</a><div className="sideTip"><Sparkles size={17}/><b>Hayal et, üret.</b><p>Fikrini şarkıya dönüştürmeye başla.</p></div><div className="sideBottom"><div className="avatar">S</div><div><b>Seslab Studio</b><small>Yaratıcı alanın</small></div></div></aside>
    <section className="workspace"><header><div><span className="eyebrow">YARATICI MÜZİK STÜDYOSU</span><h1>Hayalindeki şarkıyı <em>oluştur.</em></h1><p>Bir fikir yaz, tarzını seç ve şarkı sözlerini yapay zekâyla hazırla.</p></div><div className="headerIcon"><Music2 size={22}/></div></header>
      <div className="columns"><form className="panel creator" onSubmit={createSong}><div className="panelTitle"><span className="step">01</span><div><b>Şarkını tasarla</b><small>Nasıl bir şarkı hayal ediyorsun?</small></div></div>
        <label className="fieldLabel" htmlFor="idea">ŞARKI FİKRİN</label><textarea id="idea" value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Örn: Yaz gecesinde eski aşkını özleyen birinin hikâyesi..." rows={4}/>
        <div className="fieldRow"><div><label className="fieldLabel">MÜZİK TÜRÜ</label><select value={genre} onChange={e=>setGenre(e.target.value)}>{genres.map(g=><option key={g}>{g}</option>)}</select></div><div><label className="fieldLabel">DUYGU</label><select value={mood} onChange={e=>setMood(e.target.value)}>{moods.map(m=><option key={m}>{m}</option>)}</select></div></div>
        <div className="fieldRow"><div><label className="fieldLabel">DİL</label><select value={language} onChange={e=>setLanguage(e.target.value)}><option>Türkçe</option><option>İngilizce</option><option>İspanyolca</option><option>Fransızca</option></select></div><div><label className="fieldLabel">VOKAL TARZI</label><select value={voice} onChange={e=>setVoice(e.target.value)}><option>Kadın vokal</option><option>Erkek vokal</option><option>Düet</option><option>Enstrümantal (sözsüz)</option></select></div></div>
        <button className="generate" disabled={busy||!idea.trim()}>{busy?<><span className="spinner"/> Sözler yazılıyor...</>:<><Sparkles size={17}/> Şarkı sözlerini oluştur</>}</button><p className="disclaimer">Şarkı sözleri yapay zekâ ile hazırlanır. Ses üretimi için bir müzik üretim servisi bağlantısı gerekir.</p>
      </form>
      <section className="panel result"><div className="panelTitle"><span className="step">02</span><div><b>Şarkı çalışma alanı</b><small>Şarkının sözleri ve ses dosyası</small></div></div>
        {error&&<div className="errorBox">{error}</div>}
        {lyrics?<><input className="songTitle" value={title} onChange={e=>setTitle(e.target.value)} aria-label="Şarkı başlığı"/><div className="lyricsMeta"><span>{genre}</span><span>{mood}</span><span>{language}</span></div><textarea className="lyrics" value={lyrics} onChange={e=>setLyrics(e.target.value)} aria-label="Şarkı sözleri" rows={15}/><button className="downloadText" type="button" onClick={()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([title+"\n\n"+lyrics],{type:"text/plain"}));a.download=(title||"sarki").replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ-]/gi,"-")+".txt";a.click();}}> <Download size={16}/> Sözleri indir</button></>:<div className="empty"><div className="emptyDisc"><Music2 size={27}/></div><b>Şarkın burada hayat bulacak</b><p>Soldaki alana fikrini yaz ve ilk şarkı sözlerini oluştur.</p></div>}
        <div className="audioBox"><div className="audioHead"><div><b><AudioLines size={16}/> Ses dosyan</b><small>Oluşturduğun veya yüklediğin kaydı dinle</small></div><label className="upload"><Upload size={15}/> Ses yükle<input type="file" accept="audio/*" onChange={uploadAudio}/></label></div>{audioUrl?<><audio ref={audioRef} src={audioUrl} onEnded={()=>setPlaying(false)} /><div className="audioPlayer"><button type="button" onClick={togglePlay}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><div className="wave"><AudioLines size={20}/><span>Yüklenen ses dosyası hazır</span></div></div></>:<div className="audioEmpty"><Mic2 size={17}/> Henüz ses dosyası eklenmedi</div>}</div>
      </section></div><footer>Seslab · Müzik hayal gücüyle başlar.</footer>
    </section>
  </main>;
}
