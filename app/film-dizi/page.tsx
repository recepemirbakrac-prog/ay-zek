"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Bookmark, Check, Clapperboard, Film, Heart,
  Play, Search, Sparkles, Star, Tv, X
} from "lucide-react";
import "./film-dizi.css";

type Title = {
  id: number; name: string; year: number; kind: "Film" | "Dizi"; genre: string;
  rating: string; duration: string; description: string; image: string; accent: string;
  featured?: boolean;
};

const titles: Title[] = [
  { id: 1, name: "Dune: Çöl Gezegeni", year: 2021, kind: "Film", genre: "Bilim Kurgu", rating: "8.0", duration: "2 sa 35 dk", description: "Uzak gelecekte, evrenin en değerli maddesinin bulunduğu Arrakis gezegeninde genç Paul Atreides'in destansı yolculuğu başlar.", image: "photo-1500530855697-b586d89ba3ee", accent: "#c78c50", featured: true },
  { id: 2, name: "Stranger Things", year: 2016, kind: "Dizi", genre: "Gizem", rating: "8.7", duration: "4 sezon", description: "Küçük bir kasabada yaşanan esrarengiz olaylar, arkadaş grubunu gizli deneylere ve başka bir dünyaya uzanan bir maceraya sürükler.", image: "photo-1519608487953-e999c86e7455", accent: "#9c536b" },
  { id: 3, name: "Interstellar", year: 2014, kind: "Film", genre: "Bilim Kurgu", rating: "8.7", duration: "2 sa 49 dk", description: "İnsanlığın geleceği tehlikedeyken bir ekip, yaşanabilir yeni bir yuva bulmak için yıldızlararası yolculuğa çıkar.", image: "photo-1446776811953-b23d57bd21aa", accent: "#617d9e" },
  { id: 4, name: "The Last of Us", year: 2023, kind: "Dizi", genre: "Dram", rating: "8.8", duration: "2 sezon", description: "Yıkılmış bir dünyada Joel ve Ellie, tehlikelerle dolu bir yolculukta hayatta kalmaya çalışır.", image: "photo-1470252649378-9c29740c9fa8", accent: "#82946a" },
  { id: 5, name: "Spider-Man: Into the Spider-Verse", year: 2018, kind: "Film", genre: "Animasyon", rating: "8.4", duration: "1 sa 57 dk", description: "Miles Morales, örümcek evreninin farklı kahramanlarıyla tanışır ve kendi gücünü keşfeder.", image: "photo-1519608487953-e999c86e7455", accent: "#b75b50" },
  { id: 6, name: "Wednesday", year: 2022, kind: "Dizi", genre: "Fantastik", rating: "8.0", duration: "2 sezon", description: "Wednesday Addams, Nevermore Akademisi'nde gizemli olayları çözmeye çalışırken kendi sırlarıyla yüzleşir.", image: "photo-1518709268805-4e9042af9f23", accent: "#7a6898" },
  { id: 7, name: "The Batman", year: 2022, kind: "Film", genre: "Aksiyon", rating: "7.8", duration: "2 sa 56 dk", description: "Gotham'ın karanlık sokaklarında Batman, şehrin en güçlü isimlerini hedef alan bir katilin izini sürer.", image: "photo-1519608487953-e999c86e7455", accent: "#65717d" },
  { id: 8, name: "Planet Earth", year: 2006, kind: "Dizi", genre: "Belgesel", rating: "9.4", duration: "1 sezon", description: "Dünyanın dört bir yanındaki olağanüstü yaşam alanlarını ve doğanın büyüleyici hikâyelerini keşfet.", image: "photo-1470252649378-9c29740c9fa8", accent: "#638d78" },
];

const genres = ["Tümü", "Aksiyon", "Bilim Kurgu", "Dram", "Fantastik", "Gizem", "Animasyon", "Belgesel"];
const imageUrl = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;

export default function FilmDiziPage() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("Tümü");
  const [genre, setGenre] = useState("Tümü");
  const [selected, setSelected] = useState<Title | null>(null);
  const [saved, setSaved] = useState<number[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const filtered = useMemo(() => titles.filter((item) =>
    (!showSaved || saved.includes(item.id)) &&
    (kind === "Tümü" || item.kind === kind) &&
    (genre === "Tümü" || item.genre === genre) &&
    item.name.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))
  ), [query, kind, genre, saved, showSaved]);

  const toggleSaved = (id: number) => setSaved((old) => old.includes(id) ? old.filter((x) => x !== id) : [...old, id]);
  const featured = titles[0];

  return (
    <main className="cinemaPage">
      <div className="cinemaBackdrop" />
      <header className="cinemaNav">
        <Link href="/" className="cinemaLogo"><span className="logoGlyph"><Clapperboard size={19}/></span><span>AY<span className="logoGold">FLIX</span></span></Link>
        <nav><a className="navCurrent" href="#kesfet">Keşfet</a><a href="#filmler">Filmler & Diziler</a><button onClick={() => setShowSaved(!showSaved)} className={showSaved ? "navSaved active" : "navSaved"}><Bookmark size={15}/> Listem <span>{saved.length}</span></button></nav>
        <Link href="/" className="backAy"><ArrowLeft size={15}/> Ay Zek'e dön</Link>
      </header>

      <section className="cinemaHero" id="kesfet">
        <div className="heroVisual" style={{ backgroundImage: `linear-gradient(90deg,#090b10 0%,#090b10dd 36%,#090b1060 68%,#090b1030 100%),linear-gradient(0deg,#090b10 0%,transparent 45%),url(${imageUrl(featured.image)})` }} />
        <div className="heroContent">
          <div className="heroKicker"><Sparkles size={14}/> SİNEMA KEYFİ BURADA BAŞLAR</div>
          <div className="heroPill">AYFLIX ÖZEL SEÇKİ</div>
          <h1>Hikâyenin<br/><em>içine dal.</em></h1>
          <p className="heroDescription">Sevdiğin filmleri keşfet, yeni diziler bul ve bir sonraki favorini seç. Sinema dünyası tek ekranda.</p>
          <div className="heroMeta"><span>{featured.year}</span><i/> <span>{featured.kind}</span><i/> <span><Star size={14} fill="currentColor"/> {featured.rating}</span><i/> <span>{featured.duration}</span></div>
          <div className="heroActions"><button className="watchButton" onClick={() => setSelected(featured)}><Play size={17} fill="currentColor"/> Fragmanı keşfet</button><button className="moreButton" onClick={() => toggleSaved(featured.id)}>{saved.includes(featured.id) ? <Check size={17}/> : <Bookmark size={17}/>} {saved.includes(featured.id) ? "Listende" : "Listeme ekle"}</button></div>
        </div>
        <div className="heroIndex"><span>01</span><i/> 08</div>
      </section>

      <section className="browseSection" id="filmler">
        <div className="browseHeading"><div><div className="sectionEyebrow">SENİN İÇİN SEÇTİK</div><h2>{showSaved ? "İzleme listen" : "Keşfetmeye başla"}</h2><p>{showSaved ? "Kaydettiğin yapımlar burada." : "Ruhuna göre bir hikâye bul."}</p></div>
          <div className="searchBox"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Film veya dizi ara..." aria-label="Film veya dizi ara"/>{query && <button onClick={() => setQuery("")} aria-label="Aramayı temizle"><X size={15}/></button>}</div>
        </div>
        <div className="filterBar"><div className="kindFilters">{["Tümü", "Film", "Dizi"].map((item) => <button key={item} onClick={() => setKind(item)} className={kind === item ? "filterActive" : ""}>{item === "Film" ? <Film size={14}/> : item === "Dizi" ? <Tv size={14}/> : <Sparkles size={14}/>} {item}</button>)}</div><div className="genreFilters">{genres.map((item) => <button key={item} onClick={() => setGenre(item)} className={genre === item ? "genreActive" : ""}>{item}</button>)}</div></div>

        {filtered.length ? <div className="posterGrid">{filtered.map((item) => <article className="posterCard" key={item.id}>
          <button className="posterImage" onClick={() => setSelected(item)} style={{ backgroundImage: `linear-gradient(0deg,#080a10e8 0%,transparent 65%),url(${imageUrl(item.image)})` }} aria-label={item.name + " detaylarını aç"}>
            <span className="posterType">{item.kind}</span><span className="posterPlay"><Play size={18} fill="currentColor"/></span><span className="posterBottom"><span>{item.genre}</span><span><Star size={12} fill="currentColor"/> {item.rating}</span></span>
          </button>
          <div className="posterInfo"><div><h3>{item.name}</h3><p>{item.year} <i/> {item.duration}</p></div><button className={saved.includes(item.id) ? "saveButton isSaved" : "saveButton"} onClick={() => toggleSaved(item.id)} aria-label="Listeme ekle"><Heart size={17} fill={saved.includes(item.id) ? "currentColor" : "none"}/></button></div>
        </article>)}</div> : <div className="emptyResults"><Search size={27}/><b>Burada henüz bir şey yok</b><p>Aramanı veya filtrelerini değiştirmeyi dene.</p><button onClick={() => {setQuery("");setGenre("Tümü");setKind("Tümü");setShowSaved(false);}}>Filtreleri temizle</button></div>}
      </section>

      <section className="cinemaNote"><div className="noteIcon"><Play size={17}/></div><div><b>İzleme keyfin için küçük bir not</b><p>Bu sürüm keşif ve fragman kataloğudur. Tam film ve bölümler için yapımın lisanslı yayın platformlarına yönlendirme yapılır.</p></div><span>YASAL İZLEME</span></section>
      <footer className="cinemaFooter"><Link href="/" className="cinemaLogo"><span className="logoGlyph"><Clapperboard size={16}/></span><span>AY<span className="logoGold">FLIX</span></span></Link><span>İyi seyirler. <span>✦</span></span><small>Ay Zek içinde bir sinema keşif alanı</small></footer>

      {selected && <div className="detailOverlay" onClick={() => setSelected(null)}><section className="detailModal" onClick={(e) => e.stopPropagation()}>
        <button className="closeDetail" onClick={() => setSelected(null)} aria-label="Kapat"><X size={19}/></button>
        <div className="detailImage" style={{backgroundImage:`linear-gradient(0deg,#0c0e14 0%,transparent 100%),url(${imageUrl(selected.image)})`}}/>
        <div className="detailBody"><div className="heroKicker"><Sparkles size={13}/> AYFLIX SEÇKİSİ</div><h2>{selected.name}</h2><div className="detailMeta"><span>{selected.year}</span><span>{selected.kind}</span><span>{selected.genre}</span><span><Star size={13} fill="currentColor"/> {selected.rating}</span><span>{selected.duration}</span></div><p>{selected.description}</p>
          <div className="detailActions"><a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selected.name + " official trailer")}`} target="_blank" rel="noreferrer" className="watchButton"><Play size={16} fill="currentColor"/> Fragmanı izle <ArrowRight size={15}/></a><a href={`https://www.justwatch.com/tr/arama?q=${encodeURIComponent(selected.name)}`} target="_blank" rel="noreferrer" className="moreButton">Nerede izlenir? <ArrowRight size={15}/></a><button className="moreButton" onClick={() => toggleSaved(selected.id)}>{saved.includes(selected.id) ? <Check size={16}/> : <Bookmark size={16}/>} {saved.includes(selected.id) ? "Listende" : "Listeme ekle"}</button></div>
        </div>
      </section></div>}
    </main>
  );
}
