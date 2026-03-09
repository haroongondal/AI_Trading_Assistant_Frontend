/**
 * Centralized API client for the FastAPI backend.
 * Uses NEXT_PUBLIC_API_URL so the browser can call the backend (e.g. http://localhost:8000).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function streamChat(
  message: string,
  history: ChatMessage[],
  onToken: (token: string) => void,
  onDone?: () => void,
  onError?: (err: Error) => void,
  signal?: AbortSignal,
  onStatus?: (status: string) => void
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
      signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return;
    throw e;
  }
  if (!res.ok) {
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
  let currentEvent = "message";
  const dispatch = (data: string, eventType: string) => {
    if (data === "[DONE]" || !data.trim()) return;
    try {
      const parsed = JSON.parse(data) as { data?: string };
      if (parsed?.data != null) data = String(parsed.data);
    } catch {
      /* use raw data */
    }
    if (eventType === "status") onStatus?.(data);
    else onToken(data);
  };
  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
          continue;
        }
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          dispatch(data, currentEvent);
          currentEvent = "message";
        }
      }
    }
    if (buffer.startsWith("data: ")) {
      const data = buffer.slice(6).trim();
      dispatch(data, currentEvent);
    } else if (buffer.startsWith("event: ")) {
      currentEvent = buffer.slice(7).trim();
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return;
    onError?.(e instanceof Error ? e : new Error(String(e)));
    return;
  } finally {
    reader.releaseLock();
  }
  onDone?.();
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
  const res = await fetch(`${API_URL}/api/portfolio`);
  if (!res.ok) throw new Error(`Portfolio failed: ${res.status}`);
  return res.json();
}

export async function updatePortfolioGoal(goal: string | null): Promise<{ goal: string | null }> {
  const res = await fetch(`${API_URL}/api/portfolio/goal`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal }),
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
  });
  if (!res.ok) throw new Error(`Add position failed: ${res.status}`);
  return res.json();
}

export type Coin = { id: string; symbol: string; name: string; market_cap_rank?: number };

export async function getCoins(search?: string): Promise<{ coins: Coin[] }> {
  const url = search?.trim()
    ? `${API_URL}/api/coins?search=${encodeURIComponent(search.trim())}`
    : `${API_URL}/api/coins`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Coins failed: ${res.status}`);
  return res.json();
}

export async function deletePosition(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/portfolio/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
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
  const res = await fetch(`${API_URL}/api/notifications`);
  if (!res.ok) throw new Error(`Notifications failed: ${res.status}`);
  return res.json();
}

export async function markNotificationRead(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ read: true }),
  });
  if (!res.ok) throw new Error(`Mark read failed: ${res.status}`);
}
