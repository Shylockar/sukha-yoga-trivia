export const QUESTION_TIMER = 15; // seconds
export const BASE_POINTS = 100;
export const MAX_BONUS = 50;

/**
 * Bonus scale (timer = 15s):
 *   timeLeft > 12s (answered in < 3s) → +50 pts (max)
 *   timeLeft 3-12s                    → linear scale from 50 down to 0
 *   timeLeft < 3s                     → +0 pts
 */
export function calculateScore(timeLeft: number): { base: number; bonus: number } {
  let bonus = 0;
  if (timeLeft > 12) {
    bonus = MAX_BONUS;
  } else if (timeLeft > 3) {
    // Linear: from 50 at timeLeft=12 down to 0 at timeLeft=3
    bonus = Math.round(MAX_BONUS * (timeLeft - 3) / (12 - 3));
  }

  return { base: BASE_POINTS, bonus };
}
