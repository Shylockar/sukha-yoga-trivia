import level1Data from "@/data/questions/level1.json";
import level2Data from "@/data/questions/level2.json";
import level3Data from "@/data/questions/level3.json";
import { Question, Category } from "./types";

const questionsByLevel: Record<number, Question[]> = {
  1: level1Data.questions as Question[],
  2: level2Data.questions as Question[],
  3: level3Data.questions as Question[],
};

export const VALID_CATEGORIES: Exclude<Category, "aleatorio">[] = [
  "historia",
  "filosofia",
  "posturas",
  "anatomia",
  "curiosidades",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleOptions(q: Question): Question {
  const correctAnswer = q.options[q.correct];
  const shuffled = shuffle(q.options);
  return { ...q, options: shuffled, correct: shuffled.indexOf(correctAnswer) };
}

export function getQuestionsByCategory(
  category: string,
  count = 10,
  level: 1 | 2 | 3 = 1
): Question[] {
  const pool = questionsByLevel[level] ?? questionsByLevel[1];

  if (category === "aleatorio") {
    return VALID_CATEGORIES.flatMap((cat) =>
      shuffle(pool.filter((q) => q.category === cat)).slice(0, 2)
    ).map(shuffleOptions);
  }

  return shuffle(pool.filter((q) => q.category === category))
    .slice(0, count)
    .map(shuffleOptions);
}
