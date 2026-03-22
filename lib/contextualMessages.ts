import { INTERMEDIATE_THRESHOLD, ADVANCED_THRESHOLD } from "./progress";
import type { Level } from "./progress";

// ── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  // Results-page messages
  firstGame:          "sukha_msg_first_game",
  halfInter:          "sukha_msg_half_inter",
  halfAdv:            "sukha_msg_half_adv",
  nearInter:          "sukha_msg_near_inter",
  nearAdv:            "sukha_msg_near_adv",
  levelupInter:       "sukha_msg_levelup_inter",
  levelupAdv:         "sukha_msg_levelup_adv",
  perfect:            "sukha_msg_perfect",
  register3:          "sukha_msg_register_3",
  fiveGames:          "sukha_msg_5games",
  gamesPlayed:        "sukha_games_played",

  // Play-page messages
  gameIntro:          "sukha_msg_game_intro",
  speedBonus:         "sukha_msg_speed_bonus",
  timeout:            "sukha_msg_timeout",
  // Category-first: sukha_msg_cat_{category}

  // Leaderboard message
  leaderboard:        "sukha_msg_leaderboard",

  // Home / return messages
  lastGameTs:         "sukha_last_game_ts",
  lastReturnShown:    "sukha_last_return_shown",

  // Rank tracking (not a "shown once" key)
  lastRank:           "sukha_last_rank",
};

// ── Low-level helpers ─────────────────────────────────────────────────────────

function seen(key: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(key) === "1";
}

function markSeen(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, "1");
}

// ── Games played counter ──────────────────────────────────────────────────────

export function incrementGamesPlayed(): number {
  if (typeof window === "undefined") return 0;
  const prev = parseInt(localStorage.getItem(KEYS.gamesPlayed) ?? "0", 10);
  const next = prev + 1;
  localStorage.setItem(KEYS.gamesPlayed, String(next));
  return next;
}

export function getGamesPlayed(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEYS.gamesPlayed) ?? "0", 10);
}

// ── Last game timestamp (for 24h return detection) ────────────────────────────

export function updateLastGameTimestamp(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.lastGameTs, String(Date.now()));
}

export function checkReturnAfter24h(totalScore: number): string | null {
  if (typeof window === "undefined") return null;
  const lastTs = parseInt(localStorage.getItem(KEYS.lastGameTs) ?? "0", 10);
  if (!lastTs) return null; // never played before
  const hoursAgo = (Date.now() - lastTs) / (1000 * 60 * 60);
  if (hoursAgo < 24) return null;
  // Avoid showing again if we already showed within last 24h (page reloads, etc.)
  const lastShown = parseInt(localStorage.getItem(KEYS.lastReturnShown) ?? "0", 10);
  if (lastShown && (Date.now() - lastShown) / (1000 * 60 * 60) < 24) return null;
  localStorage.setItem(KEYS.lastReturnShown, String(Date.now()));
  return `¡Volviste! Tu puntaje sigue en ${totalScore.toLocaleString()} pts. ¿Seguimos?`;
}

// ── Rank tracking ─────────────────────────────────────────────────────────────

export function getLastRank(): number | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEYS.lastRank);
  return v !== null ? parseInt(v, 10) : null;
}

export function saveLastRank(rank: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.lastRank, String(rank));
}

// ── Play-page one-shot helpers ────────────────────────────────────────────────

export function shouldShowGameIntro(): boolean  { return !seen(KEYS.gameIntro); }
export function markGameIntroSeen(): void       { markSeen(KEYS.gameIntro); }

export function shouldShowSpeedBonus(): boolean { return !seen(KEYS.speedBonus); }
export function markSpeedBonusSeen(): void      { markSeen(KEYS.speedBonus); }

export function shouldShowTimeout(): boolean    { return !seen(KEYS.timeout); }
export function markTimeoutSeen(): void         { markSeen(KEYS.timeout); }

export function shouldShowCategoryFirst(category: string): boolean {
  return !seen(`sukha_msg_cat_${category}`);
}
export function markCategoryFirstSeen(category: string): void {
  markSeen(`sukha_msg_cat_${category}`);
}

// ── Leaderboard one-shot helper ───────────────────────────────────────────────

export function shouldShowLeaderboardIntro(): boolean { return !seen(KEYS.leaderboard); }
export function markLeaderboardIntroSeen(): void      { markSeen(KEYS.leaderboard); }

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ToastMsg {
  id: string;
  text: string;
}

export interface LevelUpMsg {
  level: "intermedio" | "avanzado";
}

export interface MsgEvalResult {
  toast: ToastMsg | null;
  levelUp: LevelUpMsg | null;
}

// ── Evaluation (results page) ─────────────────────────────────────────────────

export function evaluateMessages(params: {
  prevScore: number;
  newScore: number;
  prevLevel: Level;
  newLevel: Level;
  correctCount: number;
  isRegistered: boolean;
  gamesPlayed: number;
}): MsgEvalResult {
  const { prevScore, newScore, prevLevel, newLevel, correctCount, isRegistered, gamesPlayed } = params;

  // 1. Level up (modal, highest priority)
  if (prevLevel !== newLevel && newLevel !== "principiante") {
    const key = newLevel === "intermedio" ? KEYS.levelupInter : KEYS.levelupAdv;
    if (!seen(key)) {
      markSeen(key);
      return { toast: null, levelUp: { level: newLevel as "intermedio" | "avanzado" } };
    }
  }

  // 2. First game
  if (gamesPlayed === 1 && !seen(KEYS.firstGame)) {
    markSeen(KEYS.firstGame);
    return {
      toast: {
        id: "first_game",
        text: `¡Bien! Sumaste ${newScore.toLocaleString()} pts. Acumulá puntos para subir de nivel, desbloquear preguntas más difíciles y ganar premios de Sukha.`,
      },
      levelUp: null,
    };
  }

  // 3. 5 games milestone
  if (gamesPlayed === 5 && !seen(KEYS.fiveGames)) {
    markSeen(KEYS.fiveGames);
    return {
      toast: { id: "5games", text: "¡5 partidas! Ya sos parte de la TribuSukha. Seguí sumando puntos." },
      levelUp: null,
    };
  }

  // 4. Perfect 10/10
  if (correctCount === 10 && !seen(KEYS.perfect)) {
    markSeen(KEYS.perfect);
    return {
      toast: { id: "perfect", text: "¡Increíble! 10 de 10 correctas. Sos un verdadero yogui." },
      levelUp: null,
    };
  }

  // 5. 50% toward intermediate (principiante only)
  const halfInter = INTERMEDIATE_THRESHOLD / 2; // 2500
  if (newLevel === "principiante" && prevScore < halfInter && newScore >= halfInter && !seen(KEYS.halfInter)) {
    markSeen(KEYS.halfInter);
    const ptsLeft = (INTERMEDIATE_THRESHOLD - newScore).toLocaleString();
    return {
      toast: {
        id: "half_inter",
        text: `¡Vas por la mitad! Te faltan ${ptsLeft} pts para el nivel Intermedio, donde las preguntas se ponen más interesantes.`,
      },
      levelUp: null,
    };
  }

  // 6. 50% toward advanced (intermedio only)
  const halfAdv = INTERMEDIATE_THRESHOLD + (ADVANCED_THRESHOLD - INTERMEDIATE_THRESHOLD) / 2; // 10000
  if (newLevel === "intermedio" && prevScore < halfAdv && newScore >= halfAdv && !seen(KEYS.halfAdv)) {
    markSeen(KEYS.halfAdv);
    const ptsLeft = (ADVANCED_THRESHOLD - newScore).toLocaleString();
    return {
      toast: {
        id: "half_adv",
        text: `¡Vas por la mitad! Te faltan ${ptsLeft} pts para el nivel Avanzado, donde las preguntas se ponen más interesantes.`,
      },
      levelUp: null,
    };
  }

  // 7. Near intermediate — 80% = 4000 pts (includes prize teaser)
  const near80Inter = INTERMEDIATE_THRESHOLD * 0.8; // 4000
  if (newLevel === "principiante" && prevScore < near80Inter && newScore >= near80Inter && !seen(KEYS.nearInter)) {
    markSeen(KEYS.nearInter);
    return {
      toast: {
        id: "near_inter",
        text: "¡Casi ahí! Pronto desbloqueás el nivel Intermedio y tu primer premio de Sukha. ¿Te animás a una partida más?",
      },
      levelUp: null,
    };
  }

  // 8. Near advanced — 80% (intermedio only)
  const near80Adv = INTERMEDIATE_THRESHOLD + (ADVANCED_THRESHOLD - INTERMEDIATE_THRESHOLD) * 0.8; // 13000
  if (newLevel === "intermedio" && prevScore < near80Adv && newScore >= near80Adv && !seen(KEYS.nearAdv)) {
    markSeen(KEYS.nearAdv);
    const ptsLeft = (ADVANCED_THRESHOLD - newScore).toLocaleString();
    return {
      toast: {
        id: "near_adv",
        text: `¡Ya casi! Te faltan ${ptsLeft} pts y desbloqueás el nivel Avanzado. ¿Te animás a una partida más?`,
      },
      levelUp: null,
    };
  }

  // 9. 3+ games unregistered
  if (gamesPlayed >= 3 && !isRegistered && !seen(KEYS.register3)) {
    markSeen(KEYS.register3);
    return {
      toast: {
        id: "register_3",
        text: `Ya jugaste ${gamesPlayed} partidas. Registrate para no perder tu progreso y competir en el ranking.`,
      },
      levelUp: null,
    };
  }

  return { toast: null, levelUp: null };
}
