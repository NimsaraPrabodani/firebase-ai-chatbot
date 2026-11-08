import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChartWindow.jsx";
import { askGemini, friendlyError } from "./services/gemini";

import {
  loadConversations as loadCloud,
  saveConversation,
  removeConversation,
} from "./services/cloudHistory";

const STORAGE_KEY = "chat-conversations";

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

const byNewest = (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0);

export default function App() {
  const [conversations, setConversations] = useState(() =>
    loadLocal().sort(byNewest)
  );
  const [activeId, setActiveId] = useState(null); // null = new, empty chat
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved;
    } catch {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Remember what was on this device when the app opened
  const initialLocal = useRef(conversations);

  // ---------- Theme ----------
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  // ---------- Local cache ----------
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  // ---------- Load from Firestore once, when the app opens ----------
  useEffect(() => {
    let cancelled = false;

    async function syncFromCloud() {
      try {
        const cloud = await loadCloud();
        if (cancelled) return;

        // Merge: the newest copy of each conversation wins
        setConversations((prev) => {
          const merged = new Map(prev.map((c) => [c.id, c]));
          for (const c of cloud) {
            const local = merged.get(c.id);
            if (!local || (c.updatedAt || 0) >= (local.updatedAt || 0)) {
              merged.set(c.id, c);
            }
          }
          return [...merged.values()].sort(byNewest);
        });

        // Upload conversations that only exist on this device
        const cloudIds = new Set(cloud.map((c) => c.id));
        for (const c of initialLocal.current) {
          if (!cloudIds.has(c.id)) {
            await saveConversation(c);
          }
        }
        setSyncError("");
      } catch (err) {
        console.error("Cloud sync failed:", err);
        setSyncError(
          "Couldn't sync with the cloud. Your chats are still saved on this device."
        );
      }
    }

    syncFromCloud();
    return () => { cancelled = true; };
  }, []);

  // ---------- Helpers ----------
  const active = conversations.find((c) => c.id === activeId);
  const messages = active ? active.messages : [];

  // Save to Firestore without blocking the UI
  async function persist(conv) {
    try {
      await saveConversation(conv);
      setSyncError("");
    } catch (err) {
      console.error("Save failed:", err);
      setSyncError(
        "Couldn't save to the cloud. Your chat is still saved on this device."
      );
    }
  }

  // Replace one conversation in state with a new version
  function replaceConversation(conv) {
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? conv : c)).sort(byNewest)
    );
  }

  // ---------- Sending a message ----------
  async function handleSend(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { id: crypto.randomUUID(), role: "user", text: trimmed };
    const previous = messages; // context = messages before this one

    // 1. Build the conversation including the user's message
    let conv;
    if (!active) {
      conv = {
        id: crypto.randomUUID(),
        title: trimmed.slice(0, 40),
        messages: [userMsg],
        updatedAt: Date.now(),
      };
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
    } else {
      conv = {
        ...active,
        messages: [...active.messages, userMsg],
        updatedAt: Date.now(),
      };
      replaceConversation(conv);
    }

    // 2. Ask Gemini
    setLoading(true);
    let replyMsg;
    try {
      const reply = await askGemini(previous, trimmed);
      replyMsg = { id: crypto.randomUUID(), role: "model", text: reply };
    } catch (err) {
      console.error(err);
      replyMsg = {
        id: crypto.randomUUID(),
        role: "model",
        text: friendlyError(err),
        isError: true,
      };
    }

    // 3. Show the reply and save to the cloud
    const finalConv = {
      ...conv,
      messages: [...conv.messages, replyMsg],
      updatedAt: Date.now(),
    };
    replaceConversation(finalConv);
    setLoading(false);
    persist(finalConv);
  }

  // ---------- Clear / delete ----------
  function handleClear() {
    if (!active) return;
    const cleared = { ...active, messages: [], updatedAt: Date.now() };
    replaceConversation(cleared);
    persist(cleared);
  }

  async function handleDelete(id) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) setActiveId(null);
    try {
      await removeConversation(id);
    } catch (err) {
      console.error("Delete failed:", err);
      setSyncError("Couldn't delete from the cloud. Try again later.");
    }
  }

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        theme={theme}
        open={sidebarOpen}
        onNew={() => { setActiveId(null); setSidebarOpen(false); }}
        onSelect={(id) => { setActiveId(id); setSidebarOpen(false); }}
        onDelete={handleDelete}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="chat-column">
        {syncError && <div className="sync-banner">{syncError}</div>}
        <ChatWindow
          title={active?.title}
          messages={messages}
          loading={loading}
          onSend={handleSend}
          onClear={handleClear}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      </div>
    </div>
  );
}