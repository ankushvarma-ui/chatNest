import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../api";

const EMPTY_FORM = { username: "", room: "", password: "" };

export default function JoinPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadRooms = useCallback(async () => {
    try {
      const data = await request("/api/rooms");
      if (!Array.isArray(data.rooms)) {
        throw new Error("The backend returned an invalid room list.");
      }
      setRooms(data.rooms);
    } catch (fetchError) {
      setRooms([]);
      setError("Unable to load active rooms. Is the backend running?");
    }
  }, []);

  useEffect(() => {
    loadRooms();
    const refreshId = window.setInterval(loadRooms, 8000);
    return () => window.clearInterval(refreshId);
  }, [loadRooms]);

  function selectRoom(room) {
    setForm((current) => ({ ...current, room: room.name }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await request("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      sessionStorage.setItem("chat_token", data.token);
      sessionStorage.setItem("chat_room", data.room);
      sessionStorage.setItem("chat_username", data.username);
      navigate("/chat");
    } catch (joinError) {
      setError(joinError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="join-page py-5">
      <div className="container">
        <div className="row g-4 justify-content-center align-items-start">
          <section className="col-lg-5">
            <div className="panel p-4 p-md-5">
              <span className="eyebrow">Realtime MERN chat</span>
              <h1 className="display-6 fw-bold mb-2">ChatNest</h1>
              <p className="text-secondary mb-4">
                Create a room or join an active conversation. Rooms hold up to
                10 people.
              </p>
              <form onSubmit={handleSubmit}>
                <label className="form-label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  className="form-control mb-3"
                  value={form.username}
                  onChange={(event) =>
                    setForm({ ...form, username: event.target.value })
                  }
                  placeholder="e.g. nova_42"
                  maxLength="24"
                  autoComplete="off"
                  required
                />
                <label className="form-label" htmlFor="room">
                  Room name
                </label>
                <input
                  id="room"
                  className="form-control mb-3"
                  value={form.room}
                  onChange={(event) =>
                    setForm({ ...form, room: event.target.value })
                  }
                  placeholder="e.g. design-team"
                  maxLength="32"
                  autoComplete="off"
                  required
                />
                <label className="form-label" htmlFor="password">
                  Room password{" "}
                  <span className="text-secondary fw-normal">
                    (optional for new rooms)
                  </span>
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-control mb-3"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  placeholder="Required only for locked rooms"
                  maxLength="64"
                  autoComplete="current-password"
                />
                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {error}
                  </div>
                )}
                <button
                  className="btn btn-primary w-100"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Joining room..." : "Join room"}
                </button>
              </form>
            </div>
          </section>
          <section className="col-lg-5">
            <div className="panel p-4 h-100">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <span className="eyebrow">Room browser</span>
                  <h2 className="h4 mb-0">Active rooms</h2>
                </div>
                <button
                  className="btn btn-outline-light btn-sm"
                  type="button"
                  onClick={loadRooms}
                >
                  Refresh
                </button>
              </div>
              {rooms.length === 0 ? (
                <p className="text-secondary mb-0">
                  No rooms are active yet. Start one from the form.
                </p>
              ) : (
                <div className="list-group list-group-flush room-list">
                  {rooms.map((room) => (
                    <button
                      className="list-group-item list-group-item-action room-card"
                      type="button"
                      key={room.name}
                      onClick={() => selectRoom(room)}
                    >
                      <span>
                        <strong>#{room.name}</strong>
                        {room.hasPassword && (
                          <span
                            className="ms-2"
                            title="Password protected"
                            aria-label="Password protected"
                          >
                            🔒
                          </span>
                        )}
                      </span>
                      <span
                        className={`badge ${room.userCount >= 10 ? "text-bg-danger" : "text-bg-primary"}`}
                      >
                        {room.userCount}/10
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
