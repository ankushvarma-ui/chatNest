function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({ message, isSelf }) {
  return (
    <article
      className={`message-bubble ${isSelf ? "message-own" : "message-other"}`}
    >
      <div className="message-meta">
        <strong>{isSelf ? "You" : message.username}</strong>
        <span>{formatTime(message.timestamp)}</span>
      </div>
      <p className="mb-0">{message.text}</p>
    </article>
  );
}
