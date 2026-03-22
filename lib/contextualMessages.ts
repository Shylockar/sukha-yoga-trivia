import { INTERMEDIATE_THRESHOLD, ADVANCED_THRESHOLD } from "./progress";
import type { Level } from "./progress";

// ── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  firstGame:          "sukha_msg_first_game",
  halfInter:          "sukha_msg_half_inter",
  halfAdv:            "sukha_msg_half_adv",
  nearInter:          "sukha_msg_near_inter",
  nearAdv:            "sukha_msg_near_adv",
  levelupInter:       "sukha_msg_levelup_inter",
  levelupAdv:         "sukha_msg_levelup_adv",
  perfect:            "sukha_msg_perfect",
  register3:          "sukha_msg_register_3",
  gamesPlayed:        "sukha_games_played",
};

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

// ── Evaluation ────────────────────────────────────────────────────────────────

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

  // 3. Perfect 10/10
  if (correctCount === 10 && !seen(KEYS.perfect)) {
    markSeen(KEYS.perfect);
    return {
      toast: { id: "perfect", text: "¡Increíble! 10 de 10 correctas. Sos un verdadero yogui." },
      levelUp: null,
    };
  }

  // 4. 50% toward intermediate (principiante only)
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

  // 5. 50% toward advanced (intermedio only)
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

  // 6. Near intermediate (>80%, principiante only)
  const near80Inter = INTERMEDIATE_THRESHOLD * 0.8; // 4000
  if (newLevel === "principiante" && prevScore < near80Inter && newScore >= near80Inter && !seen(KEYS.nearInter)) {
    markSeen(KEYS.nearInter);
    const ptsLeft = (INTERMEDIATE_THRESHOLD - newScore).toLocaleString();
    return {
      toast: {
        id: "near_inter",
        text: `¡Ya casi! Te faltan ${ptsLeft} pts y desbloqueás el nivel Intermedio. ¿Te animás a una partida más?`,
      },
      levelUp: null,
    };
  }

  // 7. Near advanced (>80%, intermedio only)
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

  // 8. 3+ games unregistered
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
