import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:5000";
let socket;

export function getSocket(token) {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false, transports: ["websocket", "polling"], auth: { token } });
  }
  socket.auth = { token };
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = undefined;
}
