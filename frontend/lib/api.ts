import type {
  ContributionCreate,
  ContributionResponse,
  ContributionReview,
  DictionarySearchResponse,
  LessonResponse,
  LoginRequest,
  ProgressResponse,
  ProgressUpdate,
  RegisterRequest,
  TokenResponse,
  TranslateRequest,
  TranslateResponse,
  UserResponse,
  WordResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore parse error
    }
    if (res.status === 401 && token) {
      // Token expired or invalid — clear stored auth and redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("naath-auth");
        // This shared fetch utility runs outside React, so router hooks are unavailable.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/login");
      }
    }
    throw new ApiError(res.status, detail);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function register(body: RegisterRequest): Promise<UserResponse> {
  return apiFetch<UserResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function login(body: LoginRequest): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMe(token: string): Promise<UserResponse> {
  return apiFetch<UserResponse>("/auth/me", {}, token);
}

// ── Translate ─────────────────────────────────────────────────────────────────

export async function translateText(
  req: TranslateRequest,
): Promise<TranslateResponse> {
  return apiFetch<TranslateResponse>("/translate", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// ── Dictionary ────────────────────────────────────────────────────────────────

export async function searchDictionary(
  q: string,
): Promise<DictionarySearchResponse> {
  return apiFetch<DictionarySearchResponse>(
    `/dictionary/search?q=${encodeURIComponent(q)}`,
  );
}

export async function getDictionaryCategory(
  name: string,
): Promise<DictionarySearchResponse> {
  return apiFetch<DictionarySearchResponse>(`/dictionary/category/${name}`);
}

export async function getWord(id: string): Promise<WordResponse> {
  return apiFetch<WordResponse>(`/dictionary/word/${id}`);
}

// ── Lessons ───────────────────────────────────────────────────────────────────

export async function getLessonCards(
  category: string,
  token: string,
): Promise<LessonResponse> {
  return apiFetch<LessonResponse>(`/lessons/${category}`, {}, token);
}

export async function submitProgress(
  body: ProgressUpdate,
  token: string,
): Promise<ProgressResponse> {
  return apiFetch<ProgressResponse>(
    "/lessons/progress",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

// ── Contributions ─────────────────────────────────────────────────────────────

export async function submitContribution(
  body: ContributionCreate,
  token: string,
): Promise<ContributionResponse> {
  return apiFetch<ContributionResponse>(
    "/contributions",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export async function listContributions(
  token: string,
  status: string = "pending",
): Promise<ContributionResponse[]> {
  return apiFetch<ContributionResponse[]>(
    `/contributions?status=${status}`,
    {},
    token,
  );
}

export async function reviewContribution(
  id: string,
  body: ContributionReview,
  token: string,
): Promise<ContributionResponse> {
  return apiFetch<ContributionResponse>(
    `/contributions/${id}/review`,
    { method: "PATCH", body: JSON.stringify(body) },
    token,
  );
}

export { ApiError };
