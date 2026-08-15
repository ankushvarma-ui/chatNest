export const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:5000";

export async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || "Request failed.");
    error.code = body.error;
    throw error;
  }
  return body;
}
