"use client";

import { useMemo, useState } from "react";

type State = {
  day: number; turn: number; health: number; hunger: number; thirst: number;
  energy: number; wood: number; stone: number; food: number; water: number;
  shelter: number; zombies: number; log: string[];
};
const initial: State = {
  day: 1, turn: 0, health: 100, hunger: 82, thirst: 82, energy: 90,
  wood: 0, stone: 0, food: 2, water: 2, shelter: 0, zombies: 0,
  log: ["Gözlerini terk edilmiş bir ormanda açtın. İlk hedefin: kaynak topla ve gece olmadan barınak kur."]
};
const clamp = (n: number) => Math.max(0, Math.min(100, n));

export default function SurvivalGame() {
  const [s, setS] = useState<State>(initial);
  const [busy, setBusy] = useState(false);
  const night = s.turn % 6 >= 4;
  const ended = s.health <= 0 || s.hunger <= 0 || s.thirst <= 0;
  const phase = night ? "GECE" : "GÜNDÜZ";
  const pushLog = (message: string) => message;

  function act(kind: string) {
    if (ended || busy) return;
    setBusy(true);
    setS(prev => {
      let n = { ...prev, log: [...prev.log] };
      let msg = "";
      const roll = Math.random();
      if (kind === "wood") { const amount = 2 + Math.floor(Math.random() * 3); n.wood += amount; n.energy -= 12; msg = `Ormandan ${amount} odun topladın.`; }
      if (kind === "stone") { const amount = 1 + Math.floor(Math.random() * 3); n.stone += amount; n.energy -= 14; msg = `Yerden ${amount} taş çıkardın.`; }
      if (kind === "food") { if (roll < .25) { n.food += 2; msg = "Yabani meyve buldun: +2 yemek."; } else { n.food += 1; msg = "Yiyecek buldun: +1 yemek."; } n.energy -= 10; }
      if (kind === "water") { n.water += 2; n.energy -= 9; msg = "Temiz bir dere buldun: +2 su."; }
      if (kind === "eat") { if (n.food < 1) { msg = "Yiyeceğin kalmadı!"; } else { n.food--; n.hunger = clamp(n.hunger + 32); msg = "Yemek yedin. Açlığın azaldı."; } }
      if (kind === "drink") { if (n.water < 1) { msg = "Suyun kalmadı!"; } else { n.water--; n.thirst = clamp(n.thirst + 36); msg = "Su içtin. Susuzluğun azaldı."; } }
      if (kind === "rest") { n.energy = clamp(n.energy + 38); n.health = clamp(n.health + 7); msg = "Güvenli bir yerde dinlendin. Enerjin ve canın yenilendi."; }
      if (kind === "shelter") { if (n.wood < 6 || n.stone < 3) { msg = "Barınak için 6 odun ve 3 taş gerekiyor."; } else { n.wood -= 6; n.stone -= 3; n.shelter = Math.min(3, n.shelter + 1); msg = "Barınağını güçlendirdin. Gece saldırılarında daha güvendesin."; } }
      if (kind === "fight") { if (n.zombies < 1) { msg = "Şu an yakınında zombi yok."; } else if (roll < .68) { n.zombies--; msg = "Zombiyi etkisiz hale getirdin!"; } else { n.health -= 18; msg = "Zombi saldırdı! 18 can kaybettin."; } n.energy -= 13; }
      n.turn++;
      n.hunger = clamp(n.hunger - 5);
      n.thirst = clamp(n.thirst - 6);
      n.energy = clamp(n.energy - (kind === "eat" || kind === "drink" ? 2 : 3));
      if (n.turn % 6 === 0) {
        n.day++;
        if (n.shelter === 0) { n.health -= 16; msg += " Geceyi barınaksız geçirdin: 16 can kaybettin."; }
        else { n.health -= Math.max(0, 8 - n.shelter * 3); msg += " Geceyi barınağında atlattın."; }
        n.zombies = Math.min(4, n.zombies + 1 + (Math.random() < .35 ? 1 : 0));
      } else if (n.turn % 6 >= 4 && Math.random() < .25) {
        n.zombies = Math.min(4, n.zombies + 1);
        msg += " Uzakta bir zombi sesi duydun...";
      }
      if (n.hunger === 0) n.health -= 8;
      if (n.thirst === 0) n.health -= 10;
      if (n.energy === 0) n.health -= 4;
      n.health = clamp(n.health);
      n.log = [pushLog(msg || "Zaman ilerledi."), ...n.log].slice(0, 7);
      return n;
    });
    setBusy(false);
  }

  function restart() { setS(initial); }
  const stats = useMemo(() => [
    { label: "CAN", value: s.health, icon: "❤️" },
    { label: "AÇLIK", value: s.hunger, icon: "🍖" },
    { label: "SUSUZLUK", value: s.thirst, icon: "💧" },
    { label: "ENERJİ", value: s.energy, icon: "⚡" },
  ], [s.health, s.hunger, s.thirst, s.energy]);

  const button = (id: string, icon: string, title: string, desc: string, disabled = false) => (
    <button className="surv-action" key={id} onClick={() => act(id)} disabled={disabled || ended || busy}>
      <span className="surv-action-icon">{icon}</span><span className="surv-action-copy"><b>{title}</b><small>{desc}</small></span><span className="surv-arrow">›</span>
    </button>
  );

  return <main className="survival">
    <nav className="surv-nav"><a href="/" className="surv-brand"><span>A</span> Ay Zek</a><a href="/indir" className="surv-back">← Mağazaya dön</a></nav>
    <header className="surv-hero">
      <div className="surv-eyebrow">AY ZEK OYUNLARI · HAYATTA KALMA</div>
      <h1>SON <em>Sığınak</em></h1>
      <p>Issız ormanda hayatta kal. Kaynak topla, barınağını kur ve karanlık çökmeden hazırlan.</p>
      <div className="surv-world"><span>📍 Terk edilmiş orman</span><span>☀️ 1 gün = 6 hamle</span><strong>{night ? "🌙 GECE" : "☀️ GÜNDÜZ"}</strong></div>
    </header>
    <section className="surv-wrap">
      <div className="surv-main">
        <div className="surv-panel">
          <div className="surv-panel-head"><div><small>DURUMUN</small><h2>Hayatta kalma göstergeleri</h2></div><b className="surv-day">GÜN {s.day}</b></div>
          <div className="surv-stats">{stats.map(x => <div className="surv-stat" key={x.label}><div><span>{x.icon} {x.label}</span><b>{x.value}%</b></div><div className="surv-track"><i style={{width:x.value+"%"}} /></div></div>)}</div>
        </div>
        <div className="surv-panel">
          <div className="surv-panel-head"><div><small>NE YAPACAKSIN?</small><h2>Bir sonraki hamleni seç</h2></div><span className="surv-turn">{s.turn} hamle</span></div>
          <div className="surv-actions">
            {button("wood","🪵","Odun topla","2–4 odun · 12 enerji",s.energy < 12)}
            {button("stone","🪨","Taş topla","1–3 taş · 14 enerji",s.energy < 14)}
            {button("food","🍓","Yiyecek ara","+1–2 yemek · 10 enerji",s.energy < 10)}
            {button("water","💧","Su bul","+2 su · 9 enerji",s.energy < 9)}
            {button("eat","🍲","Yemek ye","Açlığı azalt",s.food < 1)}
            {button("drink","🥤","Su iç","Susuzluğu azalt",s.water < 1)}
            {button("shelter","🏕️","Barınak yap","6 odun + 3 taş",s.wood < 6 || s.stone < 3 || s.shelter >= 3)}
            {button("rest","🛏️","Dinlen","Enerji ve can kazan")}
            {button("fight","🗡️","Zombiyle savaş","Yakındaki tehdidi yok et",s.zombies < 1 || s.energy < 13)}
          </div>
        </div>
      </div>
      <aside className="surv-side">
        <div className="surv-panel">
          <div className="surv-panel-head"><div><small>ÇANTAN</small><h2>Kaynakların</h2></div><span>🎒</span></div>
          <div className="surv-inventory"><div><span>🪵 Odun</span><b>{s.wood}</b></div><div><span>🪨 Taş</span><b>{s.stone}</b></div><div><span>🍖 Yemek</span><b>{s.food}</b></div><div><span>💧 Su</span><b>{s.water}</b></div><div><span>🏕️ Barınak seviyesi</span><b>{s.shelter}/3</b></div><div><span>🧟 Zombiler</span><b className={s.zombies ? "danger" : ""}>{s.zombies}</b></div></div>
          <div className="surv-tip">💡 <span><b>İpucu</b> Gece gelmeden 6 odun ve 3 taş toplayıp barınak kur. Açlık ve susuzluğu ihmal etme.</span></div>
        </div>
        <div className="surv-panel surv-journal"><div className="surv-panel-head"><div><small>ORMANDAN NOTLAR</small><h2>Günlük</h2></div><span>📓</span></div><div className="surv-log">{s.log.map((x,i)=><p key={s.turn+"-"+i}><i />{x}</p>)}</div></div>
      </aside>
    </section>
    {ended && <div className="surv-overlay"><div className="surv-end"><span>☠️</span><small>OYUN BİTTİ</small><h2>Bu orman kazandı...</h2><p>{s.day}. güne kadar hayatta kaldın. Bir dahaki sefere daha iyi hazırlan!</p><button onClick={restart}>↻ Yeniden başla</button></div></div>}
    <footer className="surv-footer">SON SIĞINAK · AY ZEK OYUNLARI <span>Hayatta kalmak senin elinde.</span></footer>
    <style jsx global>{`
      .survival{min-height:100vh;background:#080e10;color:#eef8f2;font-family:Arial,sans-serif;padding-bottom:24px;background-image:radial-gradient(ellipse at 50% 0%,#1c55402b,transparent 45%)}
      .surv-nav{height:66px;border-bottom:1px solid #ffffff14;display:flex;align-items:center;justify-content:space-between;padding:0 max(5%,calc((100% - 1120px)/2))}
      .surv-brand{display:flex;align-items:center;gap:9px;color:#fff;text-decoration:none;font-weight:800;font-size:18px}.surv-brand span{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#4ade80,#0f766e);color:#06251a}.surv-back{font-size:11px;color:#a6c6b4;text-decoration:none}
      .surv-hero{max-width:1120px;margin:0 auto;padding:45px 24px 30px}.surv-eyebrow{font-size:9px;letter-spacing:2px;color:#6ee7a5;font-weight:800}.surv-hero h1{font-size:clamp(38px,6vw,62px);letter-spacing:-2px;margin:14px 0 8px}.surv-hero h1 em{font-style:normal;color:#6ee7a5}.surv-hero p{font-size:13px;color:#9aada3;line-height:1.7;max-width:620px}.surv-world{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.surv-world span,.surv-world strong{font-size:10px;border:1px solid #ffffff1c;background:#ffffff08;padding:8px 11px;border-radius:20px;color:#c3d5ca}.surv-world strong{border-color:#4ade8040;color:#86efac}
      .surv-wrap{max-width:1120px;margin:auto;padding:0 24px;display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,.8fr);gap:17px;align-items:start}.surv-main,.surv-side{display:grid;gap:17px}.surv-panel{border:1px solid #ffffff17;background:linear-gradient(150deg,#14201d,#101817);border-radius:16px;padding:21px;box-shadow:0 12px 35px #0003}.surv-panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:19px}.surv-panel-head small{font-size:9px;letter-spacing:1.4px;color:#6ee7a5;font-weight:800}.surv-panel-head h2{font-size:15px;margin:6px 0 0}.surv-day,.surv-turn{font-size:10px;color:#b7e8c8;border:1px solid #4ade8038;background:#4ade8010;border-radius:20px;padding:7px 10px}.surv-stats{display:grid;grid-template-columns:1fr 1fr;gap:18px 20px}.surv-stat>div:first-child{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.surv-stat span{font-size:10px;color:#b6c8be}.surv-stat b{font-size:12px}.surv-track{height:7px;background:#ffffff12;border-radius:10px;overflow:hidden}.surv-track i{display:block;height:100%;border-radius:10px;background:linear-gradient(90deg,#10b981,#86efac);transition:width .25s}
      .surv-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}.surv-action{display:flex;align-items:center;gap:10px;text-align:left;padding:12px 10px;border:1px solid #ffffff17;background:#ffffff06;border-radius:11px;color:#f0f7f2;cursor:pointer;min-width:0;transition:.15s}.surv-action:hover:not(:disabled){border-color:#4ade8066;background:#4ade800d;transform:translateY(-1px)}.surv-action:disabled{opacity:.35;cursor:not-allowed}.surv-action-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:9px;background:#4ade8015;font-size:17px;flex-shrink:0}.surv-action-copy{display:grid;gap:4px;min-width:0}.surv-action-copy b{font-size:11px}.surv-action-copy small{font-size:9px;color:#91a69a}.surv-arrow{margin-left:auto;color:#6ee7a5;font-size:20px}
      .surv-inventory{display:grid;gap:0}.surv-inventory>div{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid #ffffff10;font-size:11px;color:#b8c9bf}.surv-inventory b{color:#f3fff6;font-size:12px}.surv-inventory .danger{color:#fb7185}.surv-tip{display:flex;gap:9px;margin-top:17px;padding:12px;border:1px solid #4ade8030;background:#4ade800b;border-radius:10px;font-size:11px;line-height:1.6;color:#8fbaa0}.surv-tip b{display:block;color:#a7f3c1;margin-bottom:3px}.surv-journal{min-height:210px}.surv-log p{display:flex;gap:9px;font-size:10px;line-height:1.6;color:#a5b7ac;margin:0;padding:10px 0;border-bottom:1px solid #ffffff0d}.surv-log i{width:6px;height:6px;margin-top:5px;border-radius:50%;background:#4ade80;flex-shrink:0}
      .surv-overlay{position:fixed;inset:0;background:#020807d9;display:grid;place-items:center;padding:20px;z-index:10}.surv-end{width:min(410px,100%);padding:32px;text-align:center;border:1px solid #fb718544;background:#111b18;border-radius:20px;box-shadow:0 25px 90px #0009}.surv-end>span{font-size:40px}.surv-end small{display:block;margin-top:13px;color:#fb7185;font-size:10px;letter-spacing:2px;font-weight:800}.surv-end h2{font-size:25px;margin:10px 0}.surv-end p{font-size:12px;color:#a7b8ad;line-height:1.7}.surv-end button{margin-top:13px;border:0;border-radius:9px;padding:12px 19px;background:#4ade80;color:#062015;font-weight:800;cursor:pointer}.surv-footer{max-width:1120px;margin:25px auto 0;padding:0 24px;display:flex;justify-content:space-between;color:#648071;font-size:9px;letter-spacing:1px}.surv-footer span{letter-spacing:0}
      @media(max-width:800px){.surv-wrap{grid-template-columns:1fr}.surv-side{grid-template-columns:1fr 1fr}.surv-hero{padding-top:35px}}@media(max-width:580px){.surv-nav{padding:0 16px}.surv-hero{padding:35px 17px 23px}.surv-wrap{padding:0 14px}.surv-panel{padding:16px}.surv-actions{grid-template-columns:1fr}.surv-side{grid-template-columns:1fr}.surv-stats{gap:15px 12px}.surv-footer{padding:0 15px;gap:10px;flex-wrap:wrap}}
    `}</style>
  </main>;
}
