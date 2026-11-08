import ReactMarkdown from "react-markdown";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`message ${isUser ? "user" : "ai"}`}>
      <div className="avatar">{isUser ? "You" : "AI"}</div>
      <div className={`bubble ${message.isError ? "error" : ""}`}>
        {isUser || message.isError ? (
          <p>{message.text}</p>
        ) : (
          <ReactMarkdown>{message.text}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}