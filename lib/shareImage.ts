const MAX_SCORE = 1500;
const MEDALS = ["🥇", "🥈", "🥉"];
const PAD = 72;

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
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background gradient ──────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#2e2840");
  bg.addColorStop(0.5, "#5a4a6b");
  bg.addColorStop(1, "#9993C0");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Card geometry
  const CX = 80, CY = 200, CW = W - CX * 2;  // 920px wide
  const MID = CX + CW / 2;

  // ── Pre-calculate card height ────────────────
  const CH = calcCardHeight(params);

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
  y += 26 + 32;

  // Category
  ctx.fillStyle = "#9ca3af";
  ctx.font = "400 30px -apple-system, Arial, sans-serif";
  ctx.fillText(params.categoryLabel, MID, y);
  y += 100;

  // Score number
  ctx.fillStyle = "#434344";
  ctx.font = "700 170px -apple-system, Arial, sans-serif";
  ctx.fillText(String(params.score), MID, y);
  y += 56;

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
    // Divider
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

    // User row (if outside top 3)
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

  // ── Branding below card ──────────────────────
  const brandY = CY + CH + 90;
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "500 32px -apple-system, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("sukhaonline.com.ar", W / 2, brandY);
  ctx.fillStyle = "rgba(255,255,255,0.50)";
  ctx.font = "400 26px -apple-system, Arial, sans-serif";
  ctx.fillText("sukha-yoga-trivia.vercel.app", W / 2, brandY + 46);

  return new Promise(res => canvas.toBlob(b => res(b!), "image/png"));
}

// Pre-calculate card height from the same increments used during drawing
function calcCardHeight(params: ShareImageParams): number {
  let h = PAD;          // top padding
  h += 26 + 32;         // SUKHA TRIVIA baseline + gap
  h += 100;             // category + gap to score
  h += 56;              // score baseline + gap
  h += 64;              // subtext + gap
  h += 18 + 80;         // bar + gap
  h += 122;             // stats + gap

  if (params.top3 && params.top3.length > 0) {
    h += 54;            // divider gap
    h += 62;            // RANKING label + gap
    h += params.top3.length * 68;
    const userInTop3 = params.userName && params.top3.some(e => e.name === params.userName);
    if (params.userRankEntry && params.userName && !userInTop3) {
      h += 16 + 58;     // user highlight row
    }
  }
  h += PAD;             // bottom padding
  return h;
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
