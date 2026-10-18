// Portal API client. The sign-in lives in an HttpOnly cookie set by the server, so no token is
// ever stored where page scripts could read it. Every request sends X-Portal-Request, which the
// server requires on cookie requests that change data (protection against cross-site forgery).

const API = import.meta.env.VITE_PORTAL_API || "/api/ai/v1";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

/**
 * Call the API. `body` may be a plain object (sent as JSON) or FormData (for uploads).
 * Multipart updates are sent as POST with _method=PUT, since PHP only parses files on POST.
 */
export async function api(path, { method = "GET", body, raw = false } = {}) {
  const headers = { "X-Portal-Request": "1" };
  let payload;
  let httpMethod = method;
  if (body instanceof FormData) {
    if (method !== "POST") {
      body.set("_method", method);
      httpMethod = "POST";
    }
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const cleanPath = path.replace(/^\//, "");
  let res;
  try {
    res = await fetch(`${API}/${cleanPath}`, { method: httpMethod, headers, body: payload, credentials: "same-origin" });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection.", 0);
  }
  if (raw && res.ok) return res;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && cleanPath !== "auth/login") onUnauthorized();
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  return data;
}

/** Open an authenticated file (bill, contract) in a new tab. */
export async function openFile(path) {
  const res = await api(path, { raw: true });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Download an authenticated CSV/file. */
export async function downloadFile(path, filename) {
  const res = await api(path, { raw: true });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
