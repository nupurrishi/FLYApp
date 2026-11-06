const API_URL = process.env.EXPO_PUBLIC_FLYAPP_API_URL?.replace(/\/$/, "");

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new Error("The FLYApp server API URL has not been configured yet.");
  }
  const response = await fetch(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || `FLYApp API request failed (${response.status}).`);
  }
  return body as T;
}
