/**
 * ArogyaSaathi Android Mobile API Gateway Client
 */

import { Capacitor } from "@capacitor/core";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const defaultApiHost = Capacitor.getPlatform() === "android"
  ? "http://10.0.2.2:8000"
  : "http://127.0.0.1:8000";

export const API_BASE_URL = (configuredApiUrl || `${defaultApiHost}/api/v1`).replace(/\/+$/, "");
const SESSION_KEY = "arogyasaathi_mobile_session";
const DEVICE_KEY = "arogyasaathi_mobile_device_id";

export interface MobileSession {
  access_token: string;
  token_type: string;
  role: string;
  user_id: string;
  full_name: string;
  first_login_done: boolean;
  scope?: Record<string, string | null>;
}

export class MobileApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.name = "MobileApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function saveMobileSession(session: MobileSession): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function getMobileSession(): MobileSession | null {
  if (typeof window === "undefined") return null;

  const saved = window.sessionStorage.getItem(SESSION_KEY);
  if (!saved) return null;

  try {
    const session = JSON.parse(saved) as MobileSession;
    return session.access_token && session.user_id && session.role ? session : null;
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearMobileSession(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
}

export function getMobileDeviceId(): string {
  if (typeof window === "undefined") return "arogyasaathi-server";

  let deviceId = window.localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = `mobile-${crypto.randomUUID()}`;
    window.localStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
}

export async function mobileApiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = token ?? getMobileSession()?.access_token;
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed.";
    throw new MobileApiError(
      `Could not connect to the ArogyaSaathi backend at ${API_BASE_URL}. ${message}`,
      0,
      null
    );
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null) as { detail?: unknown } | null;
    const detail = errorBody?.detail;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => typeof item === "object" && item !== null && "msg" in item
          ? String(item.msg)
          : String(item)).join(" ")
        : `Request failed with status ${res.status}.`;
    throw new MobileApiError(message, res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return await res.json() as T;
}
