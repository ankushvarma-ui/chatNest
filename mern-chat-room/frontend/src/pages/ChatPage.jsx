import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../api";
import { disconnectSocket, getSocket } from "../socket";
import MessageBubble from "../components/MessageBubble";
import UserList from "../components/UserList";

function mergeMessages(current, incoming) {
  const unique = new Map(
    current.map((message) => [message._id || message.id, message]),
  );
  incoming.forEach((message) => unique.set(message._id || message.id, message));
  return [...unique.values()].sort(
    (left, right) => new Date(left.timestamp) - new Date(right.timestamp),
  );
}

export default function ChatPage() {
  const token = sessionStorage.getItem("chat_token");
  const room = sessionStorage.getItem("chat_room");
  const username = sessionStorage.getItem("chat_username");
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState("");
  const typingTimer = useRef();
  const joined = useRef(false);

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }, []);

  const loadMessages = useCallback(
    async (before) => {
      const query = before ? `?before=${encodeURIComponent(before)}` : "";
      const data = await request(
        `/api/messages/${encodeURIComponent(room)}${query}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessages((current) => mergeMessages(current, data.messages));
      setHasMore(data.hasMore);
    },
    [room, token],
  );

  useEffect(() => {
    if (!token || !room || !username) {
      navigate("/", { replace: true });
      return undefined;
    }
    let active = true;
    const socket = getSocket(token);
    const onConnect = () =>
      socket.emit("joinRoom", {}, (result) => {
        if (!active) return;
        if (!result?.ok)
          return showToast(result?.message || "Could not join this room.");
        joined.current = true;
        setUsers(result.users);
        loadMessages().catch((error) => showToast(error.message));
      });
    const onMessage = (message) =>
      setMessages((current) => mergeMessages(current, [message]));
    const onUsers = ({ users: roomUsers }) => setUsers(roomUsers);
    const onNotice = ({ text: notice }) => showToast(notice);
    const onError = ({ message }) => showToast(message);
    const onTyping = ({ username: name }) =>
      setTypingUsers((current) =>
        current.includes(name) ? current : [...current, name],
      );
    const onTypingStop = ({ username: name }) =>
      setTypingUsers((current) => current.filter((item) => item !== name));
    const onConnectError = () =>
      showToast("Connection failed. Check that the backend is running.");
    socket.on("connect", onConnect);
    socket.on("message:new", onMessage);
    socket.on("room:users", onUsers);
    socket.on("room:notice", onNotice);
    socket.on("chat:error", onError);
    socket.on("typing", onTyping);
    socket.on("typing:stop", onTypingStop);
    socket.on("connect_error", onConnectError);
    socket.connect();
    return () => {
      active = false;
      joined.current = false;
      socket.off("connect", onConnect);
      socket.off("message:new", onMessage);
      socket.off("room:users", onUsers);
      socket.off("room:notice", onNotice);
      socket.off("chat:error", onError);
      socket.off("typing", onTyping);
      socket.off("typing:stop", onTypingStop);
      socket.off("connect_error", onConnectError);
      disconnectSocket();
    };
  }, [loadMessages, navigate, room, showToast, token, username]);

  function handleTextChange(event) {
    const nextText = event.target.value.slice(0, 500);
    setText(nextText);
    const socket = getSocket(token);
    if (joined.current && nextText.trim()) {
      socket.emit("typing");
      window.clearTimeout(typingTimer.current);
      typingTimer.current = window.setTimeout(
        () => socket.emit("stopTyping"),
        1000,
      );
    }
  }

  function sendMessage(event) {
    event.preventDefault();
    const message = text.trim();
    if (!message || !joined.current) return;
    getSocket(token).emit("sendMessage", { text: message }, (result) => {
      if (!result?.ok)
        showToast(result?.message || "Message could not be sent.");
    });
    setText("");
    getSocket(token).emit("stopTyping");
  }

  async function loadOlderMessages() {
    const oldest = messages[0];
    if (!oldest || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadMessages(oldest.timestamp);
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoadingMore(false);
    }
  }

  function leaveRoom() {
    sessionStorage.removeItem("chat_token");
    sessionStorage.removeItem("chat_room");
    sessionStorage.removeItem("chat_username");
    navigate("/");
  }

  return (
    <main className="chat-page">
      <nav className="navbar navbar-dark border-bottom border-secondary px-3 px-md-4">
        <span className="navbar-brand mb-0 h1">
          ChatNest <small className="text-info">#{room}</small>
        </span>
        <button
          className="btn btn-outline-light btn-sm"
          type="button"
          onClick={leaveRoom}
        >
          Leave room
        </button>
      </nav>
      <div className="container-fluid flex-grow-1 overflow-hidden">
        <div className="row h-100">
          <aside className="col-md-3 col-lg-2 border-end border-secondary p-0">
            <UserList users={users} currentUser={username} />
          </aside>
          <section className="col-md-9 col-lg-10 d-flex flex-column p-0 chat-column">
            <div className="messages-area px-3 py-3">
              {hasMore && (
                <div className="text-center mb-3">
                  <button
                    className="btn btn-outline-info btn-sm"
                    type="button"
                    onClick={loadOlderMessages}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading..." : "Load older messages"}
                  </button>
                </div>
              )}
              {messages.length === 0 && (
                <p className="text-secondary text-center mt-5">
                  No messages yet. Say hello.
                </p>
              )}
              {messages.map((message) => (
                <MessageBubble
                  key={message._id || message.id}
                  message={message}
                  isSelf={message.username === username}
                />
              ))}
            </div>
            <div className="typing-line px-3">
              {typingUsers.length > 0 &&
                `${typingUsers.join(", ")} ${typingUsers.length === 1 ? "is" : "are"} typing...`}
            </div>
            <form
              className="message-form border-top border-secondary p-3"
              onSubmit={sendMessage}
            >
              <div className="input-group">
                <input
                  className="form-control"
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Write a message"
                  maxLength="500"
                  autoComplete="off"
                />
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!text.trim()}
                >
                  Send
                </button>
              </div>
              <div className="form-text text-end">
                {text.length}/500 · 5 messages per 5 seconds
              </div>
            </form>
          </section>
        </div>
      </div>
      {toast && (
        <div className="toast-message" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
