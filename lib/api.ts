/**
 * Centralized API client for the FastAPI backend.
 * Uses NEXT_PUBLIC_API_URL so the browser can call the backend (e.g. http://localhost:8000).
 * credentials: "include" sends the HttpOnly session cookie set by Google OAuth callback.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const GENERIC_CHAT_ERROR = "Something went wrong. Please try again.";

const cred: RequestCredentials = "include";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatModelOption = {
  id: string;
  provider: string;
  label: string;
  speed_tag: string;
  enabled: boolean;
  supports_tools?: boolean;
};

export type CurrentUser = { id: string; name: string; email: string | null };

export function getGoogleLoginUrl(): string {
  return `${API_URL}/api/auth/google/login`;
}

export async function getMe(): Promise<CurrentUser | null> {
  const res = await fetch(`${API_URL}/api/auth/me`, { credentials: cred });
  if (!res.ok) return null;
  const data = await res.json();
  if (data == null || typeof data !== "object") return null;
  return data as CurrentUser;
}

export async function logoutApi(): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: cred });
  if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
}

export async function streamChat(
  message: string,
  history: ChatMessage[],
  modelId: string,
  onToken: (token: string) => void,
  onDone?: () => void,
  onError?: (err: Error) => void,
  signal?: AbortSignal,
  onStatus?: (status: string) => void,
  onRateLimit?: (message: string) => void,
  onReplace?: (fullText: string) => void
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, model_id: modelId }),
      signal,
      credentials: cred,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return;
    throw e;
  }
  if (!res.ok) {
    if (res.status === 429) {
      onRateLimit?.("Rate limit reached. Please wait a moment and try again, or switch to another model.");
      onDone?.();
      return;
    }
    const err = new Error(`Chat failed: ${res.status}`);
    onError?.(err);
    return;
  }
  if (signal?.aborted) return;
  const reader = res.body?.getReader();
  if (!reader) {
    onError?.(new Error("No response body"));
    return;
  }
  const decoder = new TextDecoder();
  let buffer = "";
  const dispatch = (data: string, eventType: string) => {
    if (data === "[DONE]") return;
    try {
      const parsed = JSON.parse(data) as { data?: string };
      if (parsed?.data != null) data = String(parsed.data);
    } catch {
      /* use raw data */
    }
    if (eventType === "status") {
      if (data) onStatus?.(data);
      return;
    }
    if (eventType === "rate_limit") {
      if (data) onRateLimit?.(data);
      return;
    }
    if (eventType === "replace") {
      onReplace?.(data);
      return;
    }
    if (data.trim().startsWith("[Error:")) {
      onToken(GENERIC_CHAT_ERROR);
      return;
    }
    onToken(data);
  };

  const processEvent = (rawEvent: string) => {
    if (!rawEvent) return;
    let eventType = "message";
    const dataLines: string[] = [];
    for (const line of rawEvent.split("\n")) {
      if (line.startsWith("event:")) {
        eventType = line.slice(6).trim() || "message";
      } else if (line.startsWith("data:")) {
        const data = line.startsWith("data: ") ? line.slice(6) : line.slice(5);
        dataLines.push(data);
      }
    }
    if (!dataLines.length) return;
    dispatch(dataLines.join("\n"), eventType);
  };
  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        processEvent(rawEvent);
        boundary = buffer.indexOf("\n\n");
      }
    }
    processEvent(buffer.trimEnd());
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return;
    onError?.(e instanceof Error ? e : new Error(String(e)));
    return;
  } finally {
    reader.releaseLock();
  }
  onDone?.();
}

export async function getChatModels(): Promise<{ models: ChatModelOption[] }> {
  const res = await fetch(`${API_URL}/api/chat/models`, { credentials: cred });
  if (!res.ok) throw new Error(`Chat models failed: ${res.status}`);
  return res.json();
}

export async function getPortfolio(): Promise<{
  positions: Array<{
    id: number;
    symbol: string;
    quantity: number;
    entry_price: number;
    notes: string | null;
    created_at: string;
  }>;
  total_positions: number;
  goal: string | null;
}> {
  const res = await fetch(`${API_URL}/api/portfolio`, { credentials: cred });
  if (!res.ok) throw new Error(`Portfolio failed: ${res.status}`);
  return res.json();
}

export async function updatePortfolioGoal(goal: string | null): Promise<{ goal: string | null }> {
  const res = await fetch(`${API_URL}/api/portfolio/goal`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal }),
    credentials: cred,
  });
  if (!res.ok) throw new Error(`Update goal failed: ${res.status}`);
  return res.json();
}

export async function addPosition(data: {
  symbol: string;
  quantity: number;
  entry_price?: number | null;
  notes?: string | null;
}): Promise<{ id: number }> {
  const res = await fetch(`${API_URL}/api/portfolio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: cred,
  });
  if (!res.ok) throw new Error(`Add position failed: ${res.status}`);
  return res.json();
}

export type Coin = { id: string; symbol: string; name: string; market_cap_rank?: number };

export async function getCoins(search?: string): Promise<{ coins: Coin[] }> {
  const url = search?.trim()
    ? `${API_URL}/api/coins?search=${encodeURIComponent(search.trim())}`
    : `${API_URL}/api/coins`;
  const res = await fetch(url, { credentials: cred });
  if (!res.ok) throw new Error(`Coins failed: ${res.status}`);
  return res.json();
}

export async function deletePosition(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/portfolio/${id}`, { method: "DELETE", credentials: cred });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

export async function editPosition(
  id: number,
  data: { quantity?: number; entry_price?: number; notes?: string | null }
): Promise<{
  id: number;
  symbol: string;
  quantity: number;
  entry_price: number;
  notes: string | null;
  created_at: string;
}> {
  const res = await fetch(`${API_URL}/api/portfolio/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: cred,
  });
  if (!res.ok) throw new Error(`Edit failed: ${res.status}`);
  return res.json();
}

export async function getNotifications(): Promise<
  Array<{
    id: number;
    title: string;
    body: string;
    suggested_action: string | null;
    read: boolean;
    created_at: string;
  }>
> {
  const res = await fetch(`${API_URL}/api/notifications`, { credentials: cred });
  if (!res.ok) throw new Error(`Notifications failed: ${res.status}`);
  return res.json();
}

export async function markNotificationRead(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ read: true }),
    credentials: cred,
  });
  if (!res.ok) throw new Error(`Mark read failed: ${res.status}`);
}
