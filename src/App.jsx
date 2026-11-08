import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChartWindow.jsx";
import { askGemini, friendlyError } from "./services/gemini";

const STORAGE_KEY = "chat-conversations";

function loadConversations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export default function App() {
  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(null); // null = new, empty chat
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved;
    } catch {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  // Apply theme to <html data-theme="...">
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  // Save conversations so a page refresh doesn't lose them
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)); } catch {}
  }, [conversations]);

  const active = conversations.find((c) => c.id === activeId);
  const messages = active ? active.messages : [];

  function addMessage(convId, message) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, messages: [...c.messages, message] } : c
      )
    );
  }

  async function handleSend(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { id: crypto.randomUUID(), role: "user", text: trimmed };
    const previous = messages; // context = messages before this one
    let convId = activeId;

    if (!convId) {
      convId = crypto.randomUUID();
      setConversations((prev) => [
        { id: convId, title: trimmed.slice(0, 40), messages: [userMsg] },
        ...prev,
      ]);
      setActiveId(convId);
    } else {
      addMessage(convId, userMsg);
    }

    setLoading(true);
    try {
      const reply = await askGemini(previous, trimmed);
      addMessage(convId, { id: crypto.randomUUID(), role: "model", text: reply });
    } catch (err) {
      console.error(err);
      addMessage(convId, {
        id: crypto.randomUUID(),
        role: "model",
        text: friendlyError(err),
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    if (!activeId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, messages: [] } : c))
    );
  }

  function handleDelete(id) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) setActiveId(null);
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
      <ChatWindow
        title={active?.title}
        messages={messages}
        loading={loading}
        onSend={handleSend}
        onClear={handleClear}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
    </div>
  );
}