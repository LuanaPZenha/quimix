import { API_BASE_URL, authorizedFetch, parseError } from "./client";

export type LearnCard = {
  formula: string;
  name: string;
  equation: string;
  kind: string;
  effect: string;
  caption: string;
};

export type LearnSeal = {
  id: string;
  title: string;
  earned: boolean;
};

export type LearnChallenge = {
  id: string;
  title: string;
  brief: string;
  cleared: boolean;
};

export type LearnMyth = {
  id: string;
  claim: string;
  prompt: string;
  solved: boolean;
  lesson: string | null;
};

export type LearnStage = {
  id: string;
  title: string;
  detail: string;
  requires: string;
  symbols: string[];
  open: boolean;
};

export type LearnProgress = {
  streak: number;
  best_streak: number;
  predictions: number;
  hits: number;
  partials: number;
  cards: LearnCard[];
  seals: LearnSeal[];
  challenges: LearnChallenge[];
  myths: LearnMyth[];
  stages: LearnStage[];
  unlocked_symbols: string[] | null;
  trail_free: boolean;
  stage_title: string;
  next_hint: string;
};

export type DiscoveryFeedback = {
  grade: "hit" | "partial" | "miss" | "skip";
  new_card: boolean;
  cleared_challenge_ids: string[];
  solved_myth_ids: string[];
  progress: LearnProgress;
};

export type DiscoveryInput = {
  formula: string;
  name: string;
  equation: string;
  kind: string;
  effect: string;
  caption?: string;
  prediction_kind?: string | null;
  prediction_effect?: string | null;
  volume_ml?: number | null;
  solutes?: { formula: string; resulting_concentration_mol_l: number }[];
};

export type MissionAttempt = {
  student_id: string;
  student_name: string;
  formula: string;
  compound_name: string;
  correct: boolean;
  note: string;
  created_at: string;
};

export type ClassMission = {
  id: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  brief: string;
  kind: "product" | "concentration" | "myth" | string;
  target_formula: string | null;
  target_mol_l: number | null;
  target_volume_ml: number | null;
  solute_symbol: string | null;
  myth_id: string | null;
  created_at: string;
  my_attempt: MissionAttempt | null;
  attempts: MissionAttempt[];
};

export type MissionDraft = {
  title: string;
  brief: string;
  kind: "product" | "concentration" | "myth";
  target_formula?: string | null;
  target_mol_l?: number | null;
  target_volume_ml?: number | null;
  solute_symbol?: string | null;
  myth_id?: string | null;
};

export type AttemptResult = {
  mission_id: string;
  correct: boolean;
  message: string;
};

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<T>;
}

export function fetchProgress(): Promise<LearnProgress> {
  return authorizedFetch(`${API_BASE_URL}/api/v1/learn/progress`).then((response) =>
    readJson<LearnProgress>(response),
  );
}

export function recordDiscovery(input: DiscoveryInput): Promise<DiscoveryFeedback> {
  return authorizedFetch(`${API_BASE_URL}/api/v1/learn/discoveries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((response) => readJson<DiscoveryFeedback>(response));
}

export function fetchMissions(): Promise<ClassMission[]> {
  return authorizedFetch(`${API_BASE_URL}/api/v1/learn/missions`).then((response) =>
    readJson<ClassMission[]>(response),
  );
}

export function createMission(input: MissionDraft): Promise<ClassMission> {
  return authorizedFetch(`${API_BASE_URL}/api/v1/learn/missions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((response) => readJson<ClassMission>(response));
}

export function submitMissionAttempt(
  missionId: string,
  input: DiscoveryInput & { note?: string },
): Promise<AttemptResult> {
  return authorizedFetch(`${API_BASE_URL}/api/v1/learn/missions/${missionId}/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((response) => readJson<AttemptResult>(response));
}
