import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";

const SUGGESTIONS = [
  "Explain how the internet works in simple words",
  "Give me 5 ideas for a weekend project",
  "Help me write a polite email to my teacher",
];

export default function ChatWindow({
  title, messages, loading, onSend, onClear, onOpenSidebar,
}) {
  const bottomRef = useRef(null);

  // Auto-scroll whenever messages change or loading starts/stops
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const isEmpty = messages.length === 0;

  return (
    <main className="chat">
      <header className="chat-header">
        <button className="icon-btn menu-btn" onClick={onOpenSidebar} aria-label="Open menu">☰</button>
        <h1>{title || "New chat"}</h1>
        <button className="ghost-btn" onClick={onClear} disabled={isEmpty || loading}>
          Clear
        </button>
      </header>

      <div className="messages">
        {isEmpty && !loading ? (
          <div className="welcome">
            <div className="welcome-logo">✨</div>
            <h2>Hi! I'm your AI assistant</h2>
            <p>Ask me anything. I remember what we talk about in this chat.</p>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => onSend(s)}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={onSend} disabled={loading} />
    </main>
  );
}