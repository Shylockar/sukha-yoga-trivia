export const INTERMEDIATE_THRESHOLD = 5000;
export const ADVANCED_THRESHOLD = 15000;

export type Level = "principiante" | "intermedio" | "avanzado";

export function getLevel(totalScore: number): Level {
  if (totalScore >= ADVANCED_THRESHOLD) return "avanzado";
  if (totalScore >= INTERMEDIATE_THRESHOLD) return "intermedio";
  return "principiante";
}

export function getNextThreshold(totalScore: number): number {
  if (totalScore >= ADVANCED_THRESHOLD) return ADVANCED_THRESHOLD;
  if (totalScore >= INTERMEDIATE_THRESHOLD) return ADVANCED_THRESHOLD;
  return INTERMEDIATE_THRESHOLD;
}

const KEY_SCORE = "sukha_total_score";
const KEY_EMAIL = "sukha_email";
const KEY_NAME  = "sukha_name";

export function getLocalScore(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEY_SCORE) ?? "0", 10);
}

export function addLocalScore(points: number): number {
  const current = getLocalScore();
  const next = current + points;
  localStorage.setItem(KEY_SCORE, String(next));
  return next;
}

export function getRegisteredUser(): { email: string; name: string } | null {
  if (typeof window === "undefined") return null;
  const email = localStorage.getItem(KEY_EMAIL);
  const name  = localStorage.getItem(KEY_NAME);
  return email && name ? { email, name } : null;
}

export function saveRegisteredUser(email: string, name: string) {
  localStorage.setItem(KEY_EMAIL, email);
  localStorage.setItem(KEY_NAME, name);
}
