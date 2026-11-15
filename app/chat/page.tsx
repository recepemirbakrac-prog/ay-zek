"use client";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import { ArrowLeft, ArrowUp, Sparkles, User } from "lucide-react";

const MessageRow = memo(function MessageRow({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className="chatMessage">
      <span>{isUser ? <User size={16} /> : <Sparkles size={16} />}</span>
      <div>
        <b>{isUser ? "Sen" : "Ay Zek"}</b>
        {message.parts?.map((part, index) =>
          part.type === "text" ? <p key={index}>{part.text}</p> : null
        )}
      </div>
    </div>
  );
});

const suggestions = [
  "Bana yeni bir iş fikri ver",
  "Bir konuyu basitçe açıkla",
  "Bir web sitesi tasarlamama yardım et",
  "Şarkı sözü yazmama yardım et"
];

export default function ChatPage() {
  const [input, setInput] = useState("");
  const started = useRef(false);
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" })
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const prompt = new URLSearchParams(window.location.search).get("prompt");
    if (prompt && !started.current) {
      started.current = true;
      sendMessage({ text: prompt });
    }
  }, [sendMessage]);

  const send = useCallback((value: string) => {
    const text = value.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }, [busy, sendMessage]);

  // Keep the visible DOM small on older phones.
  const visibleMessages = messages.slice(-24);

  return (
    <main className="chatShell">
      <header className="chatHeader">
        <Link href="/" className="back"><ArrowLeft size={17} /> Ana sayfa</Link>
        <div><Sparkles size={20} /><b>Ay Zek AI</b><small>Akıllı Asistan</small></div>
      </header>
      <section className="chatContent">
        {messages.length === 0 ? (
          <div className="chatWelcome">
            <Sparkles size={35} />
            <h1>Merhaba, ben <em>Ay Zek.</em></h1>
            <p>Sorularını cevaplayabilir, fikirlerini geliştirebilir, kod yazabilir ve birçok konuda yardımcı olabilirim.</p>
            <div className="chatHints">
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => send(suggestion)}>{suggestion}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chatMessages">
            {visibleMessages.map((message) => <MessageRow key={message.id} message={message} />)}
            {busy && <p className="chatThinking">Ay Zek düşünüyor…</p>}
            {error && <p role="alert" className="chatError">{error.message || "Yanıt alınamadı. Lütfen tekrar dene."}</p>}
          </div>
        )}
      </section>
      <form className="chatComposer" onSubmit={(event) => { event.preventDefault(); send(input); }}>
        <textarea
          rows={1}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send(input);
            }
          }}
          placeholder="Ay Zek'e ne yapmak istediğini anlat..."
        />
        <button type="submit" disabled={!input.trim() || busy} aria-label="Gönder"><ArrowUp /></button>
      </form>
      <footer className="chatFooter">Ay Zek yapay zekâ tarafından desteklenir. Önemli bilgileri kontrol et.</footer>
    </main>
  );
}
