export default function TypingIndicator() {
  return (
    <div className="message ai">
      <div className="avatar">AI</div>
      <div className="bubble typing" aria-label="AI is typing">
        <span></span><span></span><span></span>
      </div>
    </div>
  );
}