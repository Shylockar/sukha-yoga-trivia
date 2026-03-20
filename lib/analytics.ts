import { redis } from "./redis";

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/** Fire-and-forget analytics increment. Swallows errors silently. */
export async function trackEvent(key: string): Promise<void> {
  try {
    await redis.hincrby(key, todayUTC(), 1);
  } catch {
    // analytics failures must never break the main flow
  }
}
