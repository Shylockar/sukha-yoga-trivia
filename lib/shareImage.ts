const MAX_SCORE = 1500;
const MEDALS = ["🥇", "🥈", "🥉"];

// Layout constants
const W      = 1080;
const CX     = 80;          // card left margin
const CW     = W - CX * 2;  // card width = 920
const MID    = CX + CW / 2; // horizontal center = 540
const PAD    = 88;           // inner horizontal + vertical padding
const CY     = 140;          // card top

// Flor SVG size drawn on canvas
const FLOR_SIZE = 56;

function getAchievement(score: number): { title: string; subtitle: string } {
  if (score >= 1200) return {
    title:    "Maestro yogui",
    subtitle: "Conocimiento digno de un gurú. ¡Impresionante!",
  };
  if (score >= 800) return {
    title:    "Buen camino",
    subtitle: "Sólido conocimiento del yoga. Seguí practicando.",
  };
  return {
    title:    "Seguí practicando",
    subtitle: "Cada clase te acerca más. ¡La constancia es todo!",
  };
}

export interface ShareImageParams {
  score: number;
  correctCount: number;
  totalBonus: number;
  top3: { rank: number; name: string; totalScore: number }[] | null;
  userRankEntry: { rank: number; name: string; totalScore: number } | null;
  userName?: string;
}

export async function generateShareImage(params: ShareImageParams): Promise<Blob> {
  const florImg    = await loadSvgImage("/flor-sukha.svg").catch(() => null);
  const achievement = getAchievement(params.score);

  const CH = calcCardHeight(params, florImg !== null);
  const H  = CY + CH + 220;

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background gradient ──────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,    "#2e2840");
  bg.addColorStop(0.55, "#5a4a6b");
  bg.addColorStop(1,    "#9993C0");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── White card ───────────────────────────────────────
  rrect(ctx, CX, CY, CW, CH, 48);
  ctx.fillStyle = "white";
  ctx.fill();

  // ── Card content ─────────────────────────────────────
  let y = CY + PAD;

  // Flor isotipo
  if (florImg) {
    ctx.drawImage(florImg, MID - FLOR_SIZE / 2, y, FLOR_SIZE, FLOR_SIZE);
    y += FLOR_SIZE + 22;
  }

  // "SUKHA TRIVIA"
  ctx.fillStyle = "#9993C0";
  ctx.font      = "600 32px -apple-system, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SUKHA TRIVIA", MID, y + 28);
  y += 28 + 52;

  // Achievement title
  ctx.fillStyle = "#434344";
  ctx.font      = "700 52px -apple-system, Arial, sans-serif";
  ctx.fillText(achievement.title, MID, y + 44);
  y += 44; // y is now at title baseline

  // Achievement subtitle — 12px gap below title
  // title descender ~10px + 12px margin + subtitle cap ~18px = 40px to subtitle baseline
  ctx.fillStyle = "#b0b8c4";
  ctx.font      = "400 24px -apple-system, Arial, sans-serif";
  ctx.fillText(achievement.subtitle, MID, y + 40);
  y += 40; // y is now at subtitle baseline

  // Score — 32px gap below subtitle
  // subtitle descender ~6px + 32px margin + score cap ~128px = 166px to score baseline
  y += 166;

  // Score number
  ctx.fillStyle = "#434344";
  ctx.font      = "700 170px -apple-system, Arial, sans-serif";
  ctx.fillText(String(params.score), MID, y);
  y += 64;

  // Score bar
  const BAR_X = CX + PAD;
  const BAR_W = CW - PAD * 2;
  const BAR_H = 20;
  ctx.fillStyle = "#f0f0f0";
  rrect(ctx, BAR_X, y, BAR_W, BAR_H, 10); ctx.fill();
  const barGrad = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_W, 0);
  barGrad.addColorStop(0, "#9993C0");
  barGrad.addColorStop(1, "#7b74a8");
  ctx.fillStyle = barGrad;
  rrect(ctx, BAR_X, y, Math.max(28, BAR_W * (params.score / MAX_SCORE)), BAR_H, 10); ctx.fill();
  y += BAR_H + 96;

  // Stats row (3 cols)
  const COL = (CW - PAD * 2) / 3;
  ctx.strokeStyle = "#ebebeb";
  ctx.lineWidth   = 2;
  for (let i = 1; i < 3; i++) {
    const lx = CX + PAD + COL * i;
    ctx.beginPath();
    ctx.moveTo(lx, y - 12);
    ctx.lineTo(lx, y + 126);
    ctx.stroke();
  }
  const stats = [
    { v: `${params.correctCount}/10`, label: "Correctas", color: "#434344" },
    { v: `+${params.totalBonus}`,     label: "Bonus",     color: "#6BAF7A" },
    { v: `${Math.round((params.score / MAX_SCORE) * 100)}%`, label: "Aciertos", color: "#434344" },
  ];
  stats.forEach((s, i) => {
    const cx2 = CX + PAD + COL * i + COL / 2;
    ctx.fillStyle = s.color;
    ctx.font      = "600 64px -apple-system, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(s.v, cx2, y + 58);
    ctx.fillStyle = "#9ca3af";
    ctx.font      = "400 28px -apple-system, Arial, sans-serif";
    ctx.fillText(s.label, cx2, y + 104);
  });
  y += 140;

  // ── Ranking section ──────────────────────────────────
  if (params.top3 && params.top3.length > 0) {
    ctx.strokeStyle = "#ebebeb";
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(CX + PAD, y);
    ctx.lineTo(CX + CW - PAD, y);
    ctx.stroke();
    y += 54;

    ctx.fillStyle = "#c0bbd4";
    ctx.font      = "500 26px -apple-system, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("RANKING", CX + PAD, y);
    y += 68;

    for (let i = 0; i < params.top3.length; i++) {
      const entry = params.top3[i];
      ctx.fillStyle = "#434344";
      ctx.font      = "400 36px -apple-system, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(MEDALS[i], CX + PAD, y);
      ctx.fillText(clip(entry.name, 20), CX + PAD + 54, y);
      ctx.fillStyle = "#9ca3af";
      ctx.font      = "400 32px -apple-system, Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${entry.totalScore.toLocaleString()} pts`, CX + CW - PAD, y);
      y += 68;
    }

    const userInTop3 = params.userName && params.top3.some(e => e.name === params.userName);
    if (params.userRankEntry && params.userName && !userInTop3) {
      ctx.fillStyle = "#d1d5db";
      ctx.font      = "400 28px -apple-system, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("···", MID, y + 12);
      y += 42;

      ctx.fillStyle = "rgba(153,147,192,0.12)";
      rrect(ctx, CX + PAD, y - 36, CW - PAD * 2, 62, 14);
      ctx.fill();

      ctx.fillStyle = "#9993C0";
      ctx.font      = "600 30px -apple-system, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Vos: #${params.userRankEntry.rank}`, CX + PAD + 20, y);
      ctx.fillStyle = "#9993C0";
      ctx.font      = "400 30px -apple-system, Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${params.userRankEntry.totalScore.toLocaleString()} pts`, CX + CW - PAD - 20, y);
      y += 40;
    }
  }

  // ── CTA below card ───────────────────────────────────
  const brandY = CY + CH + 64;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font      = "500 30px -apple-system, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("¿Cuánto sabés sobre yoga?", W / 2, brandY);
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font      = "400 24px -apple-system, Arial, sans-serif";
  ctx.fillText("Jugá en trivia.sukhaonline.com.ar", W / 2, brandY + 44);

  return new Promise(res => canvas.toBlob(b => res(b!), "image/png"));
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcCardHeight(params: ShareImageParams, hasFlor: boolean): number {
  let h = PAD;

  if (hasFlor) h += FLOR_SIZE + 22; // flor + gap
  h += 28 + 52;  // "SUKHA TRIVIA" baseline + gap
  h += 44;        // achievement title baseline
  h += 40 + 166;  // subtitle baseline + gap to score
  h += 64;        // score + gap
  h += 20 + 96;   // bar + gap
  h += 140;       // stats block

  if (params.top3 && params.top3.length > 0) {
    h += 54;
    h += 68;
    h += params.top3.length * 68;
    const userInTop3 = params.userName && params.top3.some(e => e.name === params.userName);
    if (params.userRankEntry && params.userName && !userInTop3) {
      h += 42 + 62 + 40;
    }
  }

  h += PAD;
  return h;
}

async function loadSvgImage(url: string): Promise<HTMLImageElement> {
  const res     = await fetch(url);
  const svg     = await res.text();
  const blob    = new Blob([svg], { type: "image/svg+xml" });
  const blobUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img   = new Image();
    img.onload  = () => { URL.revokeObjectURL(blobUrl); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error("SVG load failed")); };
    img.src     = blobUrl;
  });
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

function clip(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
