import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth-token";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await sendRequest(path, init);

  if (response.status === 401 && !path.startsWith("/auth/")) {
    const refreshResponse = await sendRequest("/auth/refresh", {
      method: "POST"
    });

    if (refreshResponse.ok) {
      const refreshData = (await refreshResponse.json()) as { accessToken: string };
      setAccessToken(refreshData.accessToken);
      const retryResponse = await sendRequest(path, init);
      return parseResponse<T>(retryResponse);
    }

    clearAccessToken();
  }

  return parseResponse<T>(response);
}

export async function downloadApiFile(path: string, filename: string) {
  const response = await sendRequest(path);

  if (!response.ok) {
    await parseResponse(response);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function sendRequest(path: string, init?: RequestInit) {
  const token = getAccessToken();
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers
    },
    credentials: "include",
    ...init
  });

  return response;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const message =
      errorPayload && "message" in errorPayload
        ? Array.isArray(errorPayload.message)
          ? errorPayload.message.join(", ")
          : String(errorPayload.message)
        : `API request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
