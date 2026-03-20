"use client";

interface ScoreDisplayProps {
  score: number;
  lastBonus: number | null;
}

export default function ScoreDisplay({ score, lastBonus }: ScoreDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-rubik text-sm text-sukha-mid">Puntaje:</span>
      <span className="font-rubik font-medium text-sukha-dark tabular-nums">{score}</span>
      {lastBonus !== null && lastBonus > 0 && (
        <span className="font-rubik text-xs font-medium text-sukha-correct animate-pulse">
          +{lastBonus} bonus
        </span>
      )}
    </div>
  );
}
