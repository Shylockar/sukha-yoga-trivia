const MAX_SCORE = 1500;
const MEDALS = ["🥇", "🥈", "🥉"];

export interface ShareImageParams {
  score: number;
  correctCount: number;
  totalBonus: number;
  categoryLabel: string;
  top3: { rank: number; name: string; totalScore: number }[] | null;
  userRankEntry: { rank: number; name: string; totalScore: number } | null;
  userName?: string;
}

export async function generateShareImage(params: ShareImageParams): Promise<Blob> {
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#3a3344");
  bg.addColorStop(0.55, "#5a4a6b");
  bg.addColorStop(1, "#9993C0");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // White card
  const CX = 60, CY = 60, CW = 960, CH = 780;
  rrect(ctx, CX, CY, CW, CH, 36);
  ctx.fillStyle = "white";
  ctx.fill();

  // Content
  const P = 52;
  const MID = CX + CW / 2;
  let y = CY + P;

  // "SUKHA TRIVIA"
  ctx.fillStyle = "#9993C0";
  ctx.font = "600 24px -apple-system, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SUKHA TRIVIA", MID, y + 20);
  y += 54;

  // Category
  ctx.fillStyle = "#9ca3af";
  ctx.font = "400 22px -apple-system, Arial, sans-serif";
  ctx.fillText(params.categoryLabel, MID, y);
  y += 72;

  // Score (big)
  ctx.fillStyle = "#434344";
  ctx.font = "700 108px -apple-system, Arial, sans-serif";
  ctx.fillText(String(params.score), MID, y);
  y += 30;

  // "de N pts"
  ctx.fillStyle = "#9ca3af";
  ctx.font = "400 24px -apple-system, Arial, sans-serif";
  ctx.fillText(`de ${MAX_SCORE} puntos posibles`, MID, y);
  y += 44;

  // Score bar
  const BAR_X = CX + P, BAR_W = CW - P * 2, BAR_H = 12;
  ctx.fillStyle = "#f3f4f6";
  rrect(ctx, BAR_X, y, BAR_W, BAR_H, 6); ctx.fill();
  const barGrad = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_W, 0);
  barGrad.addColorStop(0, "#9993C0");
  barGrad.addColorStop(1, "#7b74a8");
  ctx.fillStyle = barGrad;
  rrect(ctx, BAR_X, y, Math.max(20, BAR_W * (params.score / MAX_SCORE)), BAR_H, 6); ctx.fill();
  y += BAR_H + 52;

  // Stats row
  const COL = (CW - P * 2) / 3;
  ctx.strokeStyle = "#f3f4f6";
  ctx.lineWidth = 2;
  for (let i = 1; i < 3; i++) {
    const lx = CX + P + COL * i;
    ctx.beginPath(); ctx.moveTo(lx, y - 8); ctx.lineTo(lx, y + 78); ctx.stroke();
  }
  const stats = [
    { v: `${params.correctCount}/10`, label: "Correctas", color: "#434344" },
    { v: `+${params.totalBonus}`,    label: "Bonus",     color: "#6BAF7A" },
    { v: `${Math.round((params.score / MAX_SCORE) * 100)}%`, label: "Aciertos", color: "#434344" },
  ];
  stats.forEach((s, i) => {
    const cx2 = CX + P + COL * i + COL / 2;
    ctx.fillStyle = s.color;
    ctx.font = "600 42px -apple-system, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(s.v, cx2, y + 38);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "400 20px -apple-system, Arial, sans-serif";
    ctx.fillText(s.label, cx2, y + 68);
  });
  y += 100;

  // Ranking section
  if (params.top3 && params.top3.length > 0) {
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(CX + P, y); ctx.lineTo(CX + CW - P, y); ctx.stroke();
    y += 36;

    ctx.fillStyle = "#c0bbd4";
    ctx.font = "500 20px -apple-system, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("RANKING", CX + P, y);
    y += 42;

    for (let i = 0; i < params.top3.length; i++) {
      const entry = params.top3[i];
      ctx.fillStyle = "#434344";
      ctx.font = "400 26px -apple-system, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(MEDALS[i], CX + P, y);
      ctx.fillText(clip(entry.name, 22), CX + P + 38, y);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "400 22px -apple-system, Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${entry.totalScore.toLocaleString()} pts`, CX + CW - P, y);
      y += 46;
    }

    // User highlight if outside top 3
    const userInTop3 = params.userName && params.top3.some(e => e.name === params.userName);
    if (params.userRankEntry && params.userName && !userInTop3) {
      y += 10;
      ctx.fillStyle = "rgba(153,147,192,0.10)";
      rrect(ctx, CX + P, y - 26, CW - P * 2, 40, 8); ctx.fill();
      ctx.fillStyle = "#9993C0";
      ctx.font = "600 23px -apple-system, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        `Vos: #${params.userRankEntry.rank}  ·  ${params.userRankEntry.totalScore.toLocaleString()} pts`,
        CX + P + 14, y
      );
    }
  }

  // Branding below card
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "500 26px -apple-system, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("sukhaonline.com.ar", W / 2, H - 70);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "400 22px -apple-system, Arial, sans-serif";
  ctx.fillText("sukha-yoga-trivia.vercel.app", W / 2, H - 36);

  return new Promise(res => canvas.toBlob(b => res(b!), "image/png"));
}

// Helpers
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clip(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
