export default function Sidebar({
  conversations, activeId, theme, open,
  onNew, onSelect, onDelete, onToggleTheme, onClose,
}) {
  return (
    <>
      {open && <div className="overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <button className="new-chat" onClick={onNew}>＋ New chat</button>

        <div className="history">
          {conversations.length === 0 && (
            <p className="muted small">No conversations yet.</p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`history-item ${c.id === activeId ? "active" : ""}`}
              onClick={() => onSelect(c.id)}
            >
              <span className="history-title">{c.title}</span>
              <button
                className="icon-btn"
                aria-label="Delete conversation"
                onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button className="ghost-btn" onClick={onToggleTheme}>
          {theme === "dark" ? "☀️ Light theme" : "🌙 Dark theme"}
        </button>
      </aside>
    </>
  );
}