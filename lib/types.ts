export type Category =
  | "historia"
  | "filosofia"
  | "posturas"
  | "anatomia"
  | "curiosidades"
  | "aleatorio";

export interface Question {
  id: string;
  category: string;
  level: number;
  question: string;
  options: string[];
  correct: number;
  hint: string;
}

export interface AnswerRecord {
  question: Question;
  selectedOption: number | null; // null = timeout
  isCorrect: boolean;
  timeLeft: number;
  pointsEarned: number;
  bonusEarned: number;
}

export interface UserProgress {
  name: string;
  email: string;
  totalScore: number;
  gamesPlayed: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  totalScore: number;
  streak?: number;
}

export interface GameResult {
  category: Category;
  level: number;
  totalScore: number;
  totalBonus: number;
  correctCount: number;
  answers: AnswerRecord[];
}
