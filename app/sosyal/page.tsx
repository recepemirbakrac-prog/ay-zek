"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";
import {
  Heart, MessageCircle, ImagePlus, Compass, Home, UserRound, LogOut,
  Send, Search, Sparkles, LoaderCircle, Camera, Users, X, AtSign
} from "lucide-react";
import "./social.css";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Profile = { user_id: string; username: string; display_name?: string; bio?: string; avatar_url?: string | null };
type Comment = { id: string; post_id: string; user_id: string; content: string; created_at: string };
type DirectMessage = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string };
type Post = { id: string; user_id: string; content: string; image_url: string | null; created_at: string; profile?: Profile; likes: string[]; comments: (Comment & { profile?: Profile })[] };

function initials(name = "A") { return name.slice(0, 1).toUpperCase(); }
function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return mins + " dk";
  if (mins < 1440) return Math.floor(mins / 60) + " sa";
  return Math.floor(mins / 1440) + " gün";
}

export default function SocialPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [tab, setTab] = useState<"feed" | "explore" | "profile" | "messages">("feed");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [signup, setSignup] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [content, setContent] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [authReady, setAuthReady] = useState(false);

  const loadProfile = useCallback(async (u: User) => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", u.id).maybeSingle();
    if (data) {
      const p = data as Profile;
      const fallbackHandle = String(u.user_metadata?.username || u.email?.split("@")[0] || "ayzek").trim() || "ayzek";
      if (!p.username) {
        const { data: repaired } = await supabase.from("profiles").update({
          username: fallbackHandle,
          display_name: p.display_name || String(u.user_metadata?.display_name || fallbackHandle)
        }).eq("user_id", u.id).select().single();
        if (repaired) Object.assign(p, repaired);
        else p.username = fallbackHandle;
      }
      setProfile(p); setUsername(p.username); setDisplayName(p.display_name || p.username); setBio(p.bio || "");
    } else {
      const rawHandle = String(u.user_metadata?.username || u.email?.split("@")[0] || "ayzek").trim();
      const handle = rawHandle || "ayzek";
      const { data: created } = await supabase.from("profiles").insert({ user_id: u.id, username: handle, display_name: String(u.user_metadata?.display_name || handle) }).select().single();
      if (created) setProfile(created as Profile);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    const { data: rows, error } = await supabase.from("social_posts").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) { setNotice(error.message); return; }
    const ids = [...new Set((rows || []).map((p: any) => p.user_id))];
    const postIds = (rows || []).map((p: any) => p.id);
    const [profilesRes, likesRes, commentsRes] = await Promise.all([
      ids.length ? supabase.from("profiles").select("*").in("user_id", ids) : Promise.resolve({ data: [] as any[] }),
      postIds.length ? supabase.from("social_likes").select("post_id,user_id").in("post_id", postIds) : Promise.resolve({ data: [] as any[] }),
      postIds.length ? supabase.from("social_comments").select("*").in("post_id", postIds).order("created_at") : Promise.resolve({ data: [] as any[] })
    ]);
    const commentUserIds = [...new Set((commentsRes.data || []).map((c: any) => c.user_id))];
    const commentProfiles = commentUserIds.length ? await supabase.from("profiles").select("*").in("user_id", commentUserIds) : { data: [] as any[] };
    const pMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
    const cpMap = new Map((commentProfiles.data || []).map((p: any) => [p.user_id, p]));
    setPosts((rows || []).map((p: any) => ({
      ...p, profile: pMap.get(p.user_id),
      likes: (likesRes.data || []).filter((l: any) => l.post_id === p.id).map((l: any) => l.user_id),
      comments: (commentsRes.data || []).filter((c: any) => c.post_id === p.id).map((c: any) => ({ ...c, profile: cpMap.get(c.user_id) }))
    })));
  }, []);

  const loadPeople = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").neq("user_id", user?.id || "").order("created_at", { ascending: false }).limit(40);
    setPeople((data || []) as Profile[]);
    if (user) {
      const { data: f } = await supabase.from("social_follows").select("following_id").eq("follower_id", user.id);
      setFollowing((f || []).map((x: any) => x.following_id));
    }
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user || null; setUser(u);
      if (u) loadProfile(u);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      const u = session?.user || null; setUser(u);
      if (u) setTimeout(() => loadProfile(u), 0); else { setProfile(null); setPosts([]); }
    });
    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  useEffect(() => { if (user) { loadFeed(); loadPeople(); } }, [user, loadFeed, loadPeople]);
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("social-live-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "social_posts" }, () => loadFeed())
      .on("postgres_changes", { event: "*", schema: "public", table: "social_likes" }, () => loadFeed())
      .on("postgres_changes", { event: "*", schema: "public", table: "social_comments" }, () => loadFeed())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadFeed]);

  const filteredPeople = useMemo(() => people.filter(p => (p.username + " " + (p.display_name || "")).toLowerCase().includes(search.toLowerCase())), [people, search]);

  async function loadDirectMessages(recipientId: string) {
    if (!user || !recipientId) { setDirectMessages([]); return; }
    const [sent, received] = await Promise.all([
      supabase.from("direct_messages").select("*").eq("sender_id", user.id).eq("recipient_id", recipientId),
      supabase.from("direct_messages").select("*").eq("sender_id", recipientId).eq("recipient_id", user.id)
    ]);
    if (sent.error || received.error) { setNotice((sent.error || received.error)!.message); return; }
    setDirectMessages([...(sent.data || []), ...(received.data || [])].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) as DirectMessage[]);
  }

  async function sendDirectMessage() {
    const body = messageDraft.trim();
    if (!user || !selectedRecipient || !body || busy) return;
    setBusy(true); setNotice("");
    try {
      const { error } = await supabase.from("direct_messages").insert({ sender_id: user.id, recipient_id: selectedRecipient, body });
      if (error) throw error;
      setMessageDraft("");
      await loadDirectMessages(selectedRecipient);
    } catch (e: any) { setNotice(e.message || "Mesaj gönderilemedi."); }
    finally { setBusy(false); }
  }



  async function sendPasswordReset() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || busy) return;
    setBusy(true); setNotice("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin + "/sosyal"
      });
      if (error) throw error;
      setNotice("Şifre yenileme bağlantısı istendi. E-posta gelen kutunu ve spam klasörünü kontrol et.");
    } catch (e: any) {
      setNotice(e.message || "Şifre yenileme e-postası gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function saveNewPassword() {
    if (newPassword.length < 6 || busy) return;
    setBusy(true); setNotice("");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setRecoveryMode(false);
      setNewPassword("");
      setNotice("Şifren yenilendi. Artık yeni şifrenle giriş yapabilirsin.");
    } catch (e: any) {
      setNotice(e.message || "Şifre güncellenemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function authenticate() {
    setBusy(true); setNotice("");
    try {
      if (signup) {
        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = username.trim();
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { username: cleanUsername, display_name: displayName.trim() || cleanUsername } }
        });
        if (error) throw error;
        if (data.session) {
          setNotice("Hesabın oluşturuldu ve giriş yaptın.");
        } else {
          setNotice("E-posta doğrulaması Supabase projesinde hâlâ açık. Supabase Dashboard > Authentication > Sign In / Providers > Email bölümünden Confirm email ayarını kapatmalısın.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) throw error;
      }
    } catch (e: any) {
      const message = String(e?.message || "");
      if (/already registered|user already exists|already been registered/i.test(message)) {
        setSignup(false);
        setNotice("Bu e-posta zaten kayıtlı. Giriş yap bölümüne geçtim; aynı e-posta ve şifrenle giriş yap. Kullanıcı adın giriş yaptıktan sonra profilinde görünür.");
      } else {
        setNotice(message || "Bir hata oluştu.");
      }
    }
    finally { setBusy(false); }
  }

  async function publish() {
    if (!user || (!content.trim() && !photo)) return;
    setBusy(true); setNotice("");
    try {
      let image_url: string | null = null;
      if (photo) {
        if (!photo.type.startsWith("image/") || photo.size > 5 * 1024 * 1024) throw new Error("5 MB altı bir görsel seç.");
        const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = user.id + "/" + crypto.randomUUID() + "." + ext;
        const { error: uploadError } = await supabase.storage.from("social-media").upload(path, photo, { contentType: photo.type, upsert: false });
        if (uploadError) throw uploadError;
        image_url = supabase.storage.from("social-media").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("social_posts").insert({ user_id: user.id, content: content.trim(), image_url });
      if (error) throw error;
      setContent(""); setPhoto(null); await loadFeed(); setNotice("Gönderin paylaşıldı.");
    } catch (e: any) { setNotice(e.message || "Gönderi paylaşılamadı."); }
    finally { setBusy(false); }
  }

  async function toggleLike(post: Post) {
    if (!user) return;
    const liked = post.likes.includes(user.id);
    const { error } = liked
      ? await supabase.from("social_likes").delete().eq("post_id", post.id).eq("user_id", user.id)
      : await supabase.from("social_likes").insert({ post_id: post.id, user_id: user.id });
    if (error) setNotice(error.message); else await loadFeed();
  }

  async function addComment(postId: string) {
    const value = (commentDrafts[postId] || "").trim(); if (!value || !user) return;
    const { error } = await supabase.from("social_comments").insert({ post_id: postId, user_id: user.id, content: value });
    if (error) setNotice(error.message); else { setCommentDrafts(v => ({ ...v, [postId]: "" })); await loadFeed(); }
  }

  async function toggleFollow(personId: string) {
    if (!user) return;
    const exists = following.includes(personId);
    const { error } = exists
      ? await supabase.from("social_follows").delete().eq("follower_id", user.id).eq("following_id", personId)
      : await supabase.from("social_follows").insert({ follower_id: user.id, following_id: personId });
    if (error) setNotice(error.message); else { setFollowing(v => exists ? v.filter(x => x !== personId) : [...v, personId]); }
  }

  async function saveProfile() {
    if (!user || !profile) return;
    const { error } = await supabase.from("profiles").update({ display_name: displayName.trim(), bio: bio.trim() }).eq("user_id", user.id);
    if (error) setNotice(error.message); else { setNotice("Profilin güncellendi."); await loadProfile(user); }
  }

  if (!authReady) return <main className="social-loading"><LoaderCircle className="spin" /> Ay Zek Sosyal açılıyor…</main>;

  if (!user) return (
    <main className="social-auth">
      <div className="auth-glow" />
      <section className="auth-card">
        <a className="social-brand" href="/"><span className="brand-mark">✦</span> Ay Zek <b>Sosyal</b></a>
        <div className="auth-kicker"><Sparkles size={15} /> YENİ NESİL SOSYAL AĞ</div>
        <h1>Bağlantıda kal.<br/><span>Paylaşmaya başla.</span></h1>
        <p className="auth-copy">Arkadaşlarını keşfet, anılarını paylaş ve topluluğa katıl.</p>
        {signup && <><label>Kullanıcı adı</label><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Kullanıcı adın"/><label>Görünen ad</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Adın"/></>}
        <label>E-posta</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ornek@mail.com" autoComplete="email"/>
        {!recoveryMode ? <><label>Şifre</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="En az 6 karakter" autoComplete={signup ? "new-password" : "current-password"}/></> : <><label>Yeni şifre</label><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Yeni şifren (en az 6 karakter)" autoComplete="new-password"/></>}
        {recoveryMode
          ? <button className="primary-btn auth-submit" disabled={busy || newPassword.length < 6} onClick={saveNewPassword}>{busy ? <LoaderCircle className="spin"/> : null}Yeni şifreyi kaydet</button>
          : <button className="primary-btn auth-submit" disabled={busy || !email || password.length < 6} onClick={authenticate}>{busy ? <LoaderCircle className="spin"/> : null}{signup ? "Hesap oluştur" : "Giriş yap"}</button>}

        {!recoveryMode && !signup && <button className="switch-auth" disabled={busy || !email.trim()} onClick={sendPasswordReset}>Şifremi unuttum</button>}
        {!recoveryMode && <button className="switch-auth" onClick={()=>{setSignup(!signup);setNotice("");}}>{signup ? "Zaten hesabın var mı? Giriş yap" : "Yeni misin? Hesap oluştur"}</button>}
        {recoveryMode && <button className="switch-auth" onClick={()=>{setRecoveryMode(false);setNewPassword("");setNotice("");}}>Giriş ekranına dön</button>}
        {notice && <p className="notice">{notice}</p>}
        <small>Devam ederek topluluk kurallarını kabul etmiş olursun.</small>
      </section>
    </main>
  );

  return (
    <main className="social-app">
      <header className="social-topbar">
        <a className="social-brand" href="/"><span className="brand-mark">✦</span> Ay Zek <b>Sosyal</b></a>
        <div className="top-search"><Search size={17}/><input placeholder="Ay Zek'te ara…" value={search} onChange={e=>{setSearch(e.target.value);setTab("explore");}}/></div>
        <button className="top-avatar" onClick={()=>setTab("profile")}>{initials(profile?.display_name || profile?.username)}</button>
      </header>
      <div className="social-layout">
        <aside className="social-sidebar">
          <div className="side-user"><div className="avatar large">{initials(profile?.display_name || profile?.username)}</div><div><strong>{profile?.display_name || profile?.username}</strong><span>@{profile?.username}</span></div></div>
          <button className={tab==="feed"?"nav-active":""} onClick={()=>setTab("feed")}><Home size={19}/> Ana sayfa</button>
          <button className={tab==="explore"?"nav-active":""} onClick={()=>setTab("explore")}><Compass size={19}/> Keşfet</button>
          <button className={tab==="messages"?"nav-active":""} onClick={()=>{setTab("messages");const target=selectedRecipient || people[0]?.user_id || "";if(target){setSelectedRecipient(target);loadDirectMessages(target);}}}><MessageCircle size={19}/> Mesajlar</button>
          <button className={tab==="profile"?"nav-active":""} onClick={()=>setTab("profile")}><UserRound size={19}/> Profilim</button>
          <div className="sidebar-bottom"><div className="side-note"><Sparkles size={17}/><span>Paylaş, keşfet,<br/>bağlantıda kal.</span></div><button onClick={()=>supabase.auth.signOut()}><LogOut size={18}/> Çıkış yap</button></div>
        </aside>

        <section className="social-main">
          {tab==="feed" && <>
            <div className="page-heading"><div><span className="eyebrow">TOPLULUĞUN</span><h1>Ana sayfa</h1><p>Bugün neler oluyor?</p></div><span className="live-pill"><i/> Canlı akış</span></div>
            <div className="composer">
              <div className="avatar">{initials(profile?.display_name || profile?.username)}</div>
              <div className="composer-body"><textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Aklından neler geçiyor?" maxLength={2200}/>{photo && <div className="photo-chip"><Camera size={14}/>{photo.name}<button onClick={()=>setPhoto(null)}><X size={14}/></button></div>}
                <div className="composer-actions"><label className="upload-label"><ImagePlus size={18}/> Fotoğraf<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>setPhoto(e.target.files?.[0] || null)} hidden/></label><span>{content.length}/2200</span><button className="primary-btn" disabled={busy || (!content.trim() && !photo)} onClick={publish}>{busy ? <LoaderCircle className="spin"/> : <Send size={16}/>} Paylaş</button></div>
              </div>
            </div>
            <div className="feed-list">
              {posts.length===0 ? <div className="empty-state"><div className="empty-icon"><Sparkles/></div><h3>İlk paylaşımı sen yap!</h3><p>Topluluk burada şekilleniyor. Bir fotoğraf veya düşünce paylaş.</p></div> : posts.map(post=><article className="post-card" key={post.id}>
                <div className="post-head"><div className="avatar">{initials(post.profile?.display_name || post.profile?.username)}</div><div className="post-author"><strong>{post.profile?.display_name || post.profile?.username || "Ay Zek üyesi"}</strong><span>@{post.profile?.username || "uye"} · {timeAgo(post.created_at)}</span></div><span className="post-dot">✦</span></div>
                {post.content && <p className="post-content">{post.content}</p>}
                {post.image_url && <img className="post-image" src={post.image_url} alt="Gönderi görseli"/>}
                <div className="post-stats"><span>{post.likes.length} beğeni</span><span>{post.comments.length} yorum</span></div>
                <div className="post-actions"><button className={post.likes.includes(user.id)?"liked":""} onClick={()=>toggleLike(post)}><Heart size={19} fill={post.likes.includes(user.id)?"currentColor":"none"}/> Beğen</button><a href={"#comment-"+post.id}><MessageCircle size={19}/> Yorum yap</a></div>
                {post.comments.slice(-3).map(c=><div className="comment" key={c.id}><b>@{c.profile?.username || "uye"}</b> {c.content}</div>)}
                <div className="comment-form" id={"comment-"+post.id}><input placeholder="Bir yorum yaz…" value={commentDrafts[post.id] || ""} onChange={e=>setCommentDrafts(v=>({...v,[post.id]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")addComment(post.id)}}/><button onClick={()=>addComment(post.id)} aria-label="Yorumu gönder"><Send size={17}/></button></div>
              </article>)}
            </div>
          </>}

          {tab==="messages" && <><div className="page-heading"><div><span className="eyebrow">ÖZEL SOHBETLER</span><h1>Mesajlar</h1><p>Arkadaşlarınla birebir konuş.</p></div></div><div className="dm-layout"><div className="dm-people">{people.map(p=><button key={p.user_id} className={selectedRecipient===p.user_id?"dm-person active":"dm-person"} onClick={()=>{setSelectedRecipient(p.user_id);loadDirectMessages(p.user_id);}}><span className="avatar">{initials(p.display_name || p.username)}</span><span><b>{p.display_name || p.username}</b><small>@{p.username}</small></span></button>)}{people.length===0&&<p className="muted">Mesajlaşmak için henüz başka üye yok.</p>}</div><div className="dm-chat">{selectedRecipient ? <><div className="dm-chat-head">{people.find(p=>p.user_id===selectedRecipient)?.display_name || people.find(p=>p.user_id===selectedRecipient)?.username || "Sohbet"}</div><div className="dm-thread">{directMessages.map(m=><div key={m.id} className={m.sender_id===user.id?"dm-bubble mine":"dm-bubble"}><p>{m.body}</p><small>{new Date(m.created_at).toLocaleString("tr-TR",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"})}</small></div>)}{directMessages.length===0&&<div className="dm-empty">Henüz mesaj yok. İlk mesajı sen gönder!</div>}</div><form className="dm-compose" onSubmit={e=>{e.preventDefault();sendDirectMessage();}}><input value={messageDraft} onChange={e=>setMessageDraft(e.target.value)} placeholder="Mesajını yaz…" maxLength={4000}/><button className="primary-btn" disabled={busy || !messageDraft.trim()} type="submit">{busy?"Gönderiliyor…": "Gönder"}</button></form></> : <div className="dm-empty">Mesaj göndermek için soldan bir kişi seç.</div>}</div></div></>}

          {tab==="explore" && <><div className="page-heading"><div><span className="eyebrow">YENİ BAĞLANTILAR</span><h1>Keşfet</h1><p>Topluluktaki insanlarla tanış.</p></div></div><div className="explore-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="İsim veya kullanıcı adı ara…"/></div><div className="people-grid">{filteredPeople.map(p=><article className="person-card" key={p.user_id}><div className="avatar xl">{initials(p.display_name || p.username)}</div><strong>{p.display_name || p.username}</strong><span>@{p.username}</span><p>{p.bio || "Ay Zek Sosyal topluluğunda."}</p><button className={following.includes(p.user_id)?"follow-btn following":"follow-btn"} onClick={()=>toggleFollow(p.user_id)}>{following.includes(p.user_id)?"Takip ediliyor":"Takip et"}</button></article>)}</div>{filteredPeople.length===0&&<div className="empty-state">Henüz başka üye yok. Arkadaşlarını davet et!</div>}</>}

          {tab==="profile" && <><div className="page-heading"><div><span className="eyebrow">KİŞİSEL ALANIN</span><h1>Profilim</h1><p>Topluluğa kendini tanıt.</p></div></div><div className="profile-panel"><div className="profile-cover"/><div className="profile-info"><div className="avatar profile-avatar">{initials(displayName || username)}</div><strong>{profile?.display_name || profile?.username}</strong><span>@{profile?.username}</span><div className="profile-stats"><span><b>{posts.filter(p=>p.user_id===user.id).length}</b> gönderi</span><span><b>{following.length}</b> takip</span></div></div><div className="profile-edit"><label>Görünen ad</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} maxLength={40}/><label>Hakkımda</label><textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={160} placeholder="Kendinden biraz bahset…"/><button className="primary-btn" onClick={saveProfile}>Profili kaydet</button></div></div></>}
          {notice && <div className="toast" role="status">{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}
        </section>

        <aside className="social-right"><div className="right-card"><div className="right-title"><Users size={17}/> Önerilen kişiler</div>{people.slice(0,5).map(p=><div className="suggestion" key={p.user_id}><div className="avatar small">{initials(p.display_name || p.username)}</div><div><b>{p.display_name || p.username}</b><span>@{p.username}</span></div><button onClick={()=>toggleFollow(p.user_id)}>{following.includes(p.user_id)?"✓":"+"}</button></div>)}{people.length===0&&<p className="muted">Yeni üyeler burada görünecek.</p>}<button className="see-all" onClick={()=>setTab("explore")}>Tümünü keşfet</button></div><div className="right-footer">Ay Zek Sosyal · 2026<br/>Güvenli ve saygılı bir topluluk.</div></aside>
      </div>
      <nav className="mobile-nav"><button className={tab==="feed"?"selected":""} onClick={()=>setTab("feed")}><Home/></button><button className={tab==="explore"?"selected":""} onClick={()=>setTab("explore")}><Compass/></button><button className={tab==="messages"?"selected":""} onClick={()=>{setTab("messages");const target=selectedRecipient || people[0]?.user_id || "";if(target){setSelectedRecipient(target);loadDirectMessages(target);}}}><MessageCircle/></button><button className={tab==="profile"?"selected":""} onClick={()=>setTab("profile")}><UserRound/></button><button onClick={()=>supabase.auth.signOut()}><LogOut/></button></nav>
    </main>
  );
}
