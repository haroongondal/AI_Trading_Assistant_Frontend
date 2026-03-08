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
  onError?: (err: Error) => void
): Promise<void> {
  const res = await fetch(`${API_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    const err = new Error(`Chat failed: ${res.status}`);
    onError?.(err);
    return;
  }
  const reader = res.body?.getReader();
  if (!reader) {
    onError?.(new Error("No response body"));
    return;
  }
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          let data = line.slice(6);
          if (data === "[DONE]" || !data.trim()) continue;
          try {
            const parsed = JSON.parse(data) as { data?: string };
            if (parsed?.data != null) data = String(parsed.data);
          } catch {
            /* use raw data */
          }
          onToken(data);
        }
      }
    }
    if (buffer.startsWith("data: ")) {
      let data = buffer.slice(6).trim();
      if (data && data !== "[DONE]") {
        try {
          const parsed = JSON.parse(data) as { data?: string };
          if (parsed?.data != null) data = String(parsed.data);
        } catch {
          /* use raw */
        }
        onToken(data);
      }
    }
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
}> {
  const res = await fetch(`${API_URL}/api/portfolio`);
  if (!res.ok) throw new Error(`Portfolio failed: ${res.status}`);
  return res.json();
}

export async function addPosition(data: {
  symbol: string;
  quantity: number;
  entry_price: number;
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
