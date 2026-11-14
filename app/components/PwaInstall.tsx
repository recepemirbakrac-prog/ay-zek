"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PwaInstall() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch(() => {});
      });
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setPromptEvent(null);
  };

  if (installed || hidden || !promptEvent) return null;

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 1000, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", border: "1px solid #a78bfa55", borderRadius: 14, background: "#191522", color: "#f5f3fa", boxShadow: "0 8px 30px #0008", fontSize: 13 }}>
      <button onClick={() => void install()} style={{ display: "flex", alignItems: "center", gap: 8, border: 0, background: "transparent", color: "inherit", cursor: "pointer", font: "inherit" }}>
        <Download size={17} /> Ay Zek'i yükle
      </button>
      <button onClick={() => setHidden(true)} aria-label="Kapat" style={{ border: 0, background: "transparent", color: "#aaa", cursor: "pointer", display: "grid", placeItems: "center" }}>
        <X size={15} />
      </button>
    </div>
  );
}
