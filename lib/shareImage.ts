const MAX_SCORE = 1500;
const MEDALS = ["🥇", "🥈", "🥉"];
const PAD = 72;
const CX = 80;

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
  const W = 1080;
  const CW = W - CX * 2;   // 920
  const MID = CX + CW / 2;

  // Compute card height first so canvas height is exact
  const CY = 120;
  const CH = calcCardHeight(params);
  const H = CY + CH + 200;  // 200px below card: branding + bottom margin

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background gradient ──────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#2e2840");
  bg.addColorStop(0.55, "#5a4a6b");
  bg.addColorStop(1, "#9993C0");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── White card ───────────────────────────────
  rrect(ctx, CX, CY, CW, CH, 44);
  ctx.fillStyle = "white";
  ctx.fill();

  // ── Content ──────────────────────────────────
  let y = CY + PAD;

  // "SUKHA TRIVIA"
  ctx.fillStyle = "#9993C0";
  ctx.font = "600 30px -apple-system, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SUKHA TRIVIA", MID, y + 26);
  y += 26 + 36;   // baseline + gap below

  // Category
  ctx.fillStyle = "#9ca3af";
  ctx.font = "400 30px -apple-system, Arial, sans-serif";
  ctx.fillText(params.categoryLabel, MID, y);
  y += 160;       // large gap: 170px score cap-height is ~126px, need clearance

  // Score number (baseline at y, visually spans ~126px above)
  ctx.fillStyle = "#434344";
  ctx.font = "700 170px -apple-system, Arial, sans-serif";
  ctx.fillText(String(params.score), MID, y);
  y += 52;

  // "de N puntos posibles"
  ctx.fillStyle = "#9ca3af";
  ctx.font = "400 30px -apple-system, Arial, sans-serif";
  ctx.fillText(`de ${MAX_SCORE} puntos posibles`, MID, y);
  y += 64;

  // Score bar
  const BAR_X = CX + PAD, BAR_W = CW - PAD * 2, BAR_H = 18;
  ctx.fillStyle = "#f0f0f0";
  rrect(ctx, BAR_X, y, BAR_W, BAR_H, 9); ctx.fill();
  const barGrad = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_W, 0);
  barGrad.addColorStop(0, "#9993C0");
  barGrad.addColorStop(1, "#7b74a8");
  ctx.fillStyle = barGrad;
  rrect(ctx, BAR_X, y, Math.max(24, BAR_W * (params.score / MAX_SCORE)), BAR_H, 9); ctx.fill();
  y += BAR_H + 80;

  // Stats row
  const COL = (CW - PAD * 2) / 3;
  ctx.strokeStyle = "#ebebeb";
  ctx.lineWidth = 2;
  for (let i = 1; i < 3; i++) {
    const lx = CX + PAD + COL * i;
    ctx.beginPath(); ctx.moveTo(lx, y - 10); ctx.lineTo(lx, y + 112); ctx.stroke();
  }
  const stats = [
    { v: `${params.correctCount}/10`, label: "Correctas", color: "#434344" },
    { v: `+${params.totalBonus}`,    label: "Bonus",     color: "#6BAF7A" },
    { v: `${Math.round((params.score / MAX_SCORE) * 100)}%`, label: "Aciertos", color: "#434344" },
  ];
  stats.forEach((s, i) => {
    const cx2 = CX + PAD + COL * i + COL / 2;
    ctx.fillStyle = s.color;
    ctx.font = "600 60px -apple-system, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(s.v, cx2, y + 52);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "400 26px -apple-system, Arial, sans-serif";
    ctx.fillText(s.label, cx2, y + 94);
  });
  y += 122;

  // Ranking section
  if (params.top3 && params.top3.length > 0) {
    ctx.strokeStyle = "#ebebeb";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(CX + PAD, y); ctx.lineTo(CX + CW - PAD, y); ctx.stroke();
    y += 54;

    ctx.fillStyle = "#c0bbd4";
    ctx.font = "500 26px -apple-system, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("RANKING", CX + PAD, y);
    y += 62;

    for (let i = 0; i < params.top3.length; i++) {
      const entry = params.top3[i];
      ctx.fillStyle = "#434344";
      ctx.font = "400 36px -apple-system, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(MEDALS[i], CX + PAD, y);
      ctx.fillText(clip(entry.name, 20), CX + PAD + 52, y);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "400 32px -apple-system, Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${entry.totalScore.toLocaleString()} pts`, CX + CW - PAD, y);
      y += 68;
    }

    const userInTop3 = params.userName && params.top3.some(e => e.name === params.userName);
    if (params.userRankEntry && params.userName && !userInTop3) {
      y += 16;
      ctx.fillStyle = "rgba(153,147,192,0.12)";
      rrect(ctx, CX + PAD, y - 38, CW - PAD * 2, 58, 12); ctx.fill();
      ctx.fillStyle = "#9993C0";
      ctx.font = "600 30px -apple-system, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        `Vos: #${params.userRankEntry.rank}  ·  ${params.userRankEntry.totalScore.toLocaleString()} pts`,
        CX + PAD + 18, y
      );
    }
  }

  // ── CTA below card ───────────────────────────
  const brandY = CY + CH + 56;
  ctx.fillStyle = "rgba(255,255,255,0.90)";
  ctx.font = "500 28px -apple-system, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("¿Cuánto sabés sobre yoga?", W / 2, brandY);
  ctx.fillStyle = "rgba(255,255,255,0.60)";
  ctx.font = "400 24px -apple-system, Arial, sans-serif";
  ctx.fillText("Jugá en sukha-yoga-trivia.vercel.app", W / 2, brandY + 40);

  return new Promise(res => canvas.toBlob(b => res(b!), "image/png"));
}

function calcCardHeight(params: ShareImageParams): number {
  let h = PAD;          // top padding
  h += 26 + 36;         // SUKHA TRIVIA + gap
  h += 160;             // category + gap to score (must clear 170px cap height)
  h += 52;              // score + gap
  h += 64;              // subtext + gap
  h += 18 + 80;         // bar + gap
  h += 122;             // stats + gap

  if (params.top3 && params.top3.length > 0) {
    h += 54;
    h += 62;
    h += params.top3.length * 68;
    const userInTop3 = params.userName && params.top3.some(e => e.name === params.userName);
    if (params.userRankEntry && params.userName && !userInTop3) {
      h += 16 + 58;
    }
  }
  h += PAD;             // bottom padding
  return h;
}

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
