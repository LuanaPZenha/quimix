const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const ACCESS_KEY = "quimix_access_token";
const REFRESH_KEY = "quimix_refresh_token";
const USER_KEY = "quimix_user";

export type Role = "aluno" | "professor" | "admin";

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
};

export type Reagent = {
  id: string;
  name: string;
  formula: string;
  concentration_mol_l: number;
  unit_label: string;
};

export type MixtureComponentInput = {
  reagent_id: string;
  volume_ml: number;
};

export type SoluteResult = {
  reagent_id: string;
  name: string;
  formula: string;
  resulting_concentration_mol_l: number;
  contributed_volume_ml: number;
};

export type MixtureResult = {
  total_volume_ml: number;
  solutes: SoluteResult[];
  logs: string[];
  warnings: string[];
};

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    return JSON.stringify(data.detail ?? data);
  } catch {
    return `Erro HTTP ${response.status}`;
  }
}

export function saveSession(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function loadStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export async function registerUser(input: {
  email: string;
  password: string;
  full_name: string;
  role: Role;
}): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function fetchMe(): Promise<User> {
  const token = getAccessToken();
  if (!token) throw new Error("Não autenticado");
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Login obrigatório para executar experimentos.");
  }
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

export async function fetchReagents(): Promise<Reagent[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/reagents`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function simulateMixture(
  components: MixtureComponentInput[],
): Promise<MixtureResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulations/mixtures`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ components }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export function formatConcentration(value: number): string {
  if (Number.isInteger(value)) return `${value}`;
  return value.toFixed(4).replace(/\.?0+$/, "");
}
