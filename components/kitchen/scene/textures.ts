import * as THREE from "three";

/** Every surface of the kitchen is painted here, in code, so the scene needs no image downloads other than the food photos. */
function canvas(w: number, h: number) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")!] as const; }
function tex(c: HTMLCanvasElement, rx = 1, ry = 1, repeat = true) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
  return t;
}
let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const noise = (g: CanvasRenderingContext2D, w: number, h: number, n: number, a: number, light = false) => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${light ? "255,255,255" : "0,0,0"},${rnd() * a})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } };

export function checkerTexture(a: string, b: string) {
  const [c, g] = canvas(256, 256);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * 128, y * 128, 128, 128); }
  noise(g, 256, 256, 1400, 0.09); noise(g, 256, 256, 500, 0.06, true);
  g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2; g.strokeRect(0, 0, 256, 256); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
  return tex(c, 14, 14);
}

export function subwayTexture(tint = "#f4efe4") {
  const [c, g] = canvas(256, 256); g.fillStyle = "#8d8a84"; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) for (let k = 0; k < 5; k++) {
    const x = k * 64 - (r % 2 ? 32 : 0), y = r * 32; const s = 232 + Math.floor(rnd() * 18);
    g.fillStyle = tint; g.fillRect(x + 1.5, y + 1.5, 61, 29);
    g.fillStyle = `rgba(${s},${s},${s - 8},.18)`; g.fillRect(x + 1.5, y + 1.5, 61, 29);
    const gr = g.createLinearGradient(0, y, 0, y + 32); gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(0.35, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,.14)");
    g.fillStyle = gr; g.fillRect(x + 1.5, y + 1.5, 61, 29);
  }
  return tex(c);
}

export function glazedTileTexture(color: string, dark: string) {
  const [c, g] = canvas(256, 256); g.fillStyle = dark; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    g.fillStyle = color; g.fillRect(x * 32 + 1.5, y * 32 + 1.5, 29, 29);
    const gr = g.createLinearGradient(x * 32, y * 32, x * 32 + 32, y * 32 + 32); gr.addColorStop(0, "rgba(255,255,255,.38)"); gr.addColorStop(0.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,.28)");
    g.fillStyle = gr; g.fillRect(x * 32 + 1.5, y * 32 + 1.5, 29, 29);
  }
  return tex(c);
}

export function steelTexture() {
  const [c, g] = canvas(256, 256); const gr = g.createLinearGradient(0, 0, 256, 0);
  gr.addColorStop(0, "#9aa0a8"); gr.addColorStop(0.5, "#c4c9cf"); gr.addColorStop(1, "#959ba3"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${rnd() > 0.5 ? "255,255,255" : "40,45,55"},${rnd() * 0.12})`; g.fillRect(0, rnd() * 256, 256, 1); }
  return tex(c, 2, 2);
}

export function graniteTexture() {
  const [c, g] = canvas(256, 256); g.fillStyle = "#1c1d26"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) { const l = 60 + Math.floor(rnd() * 150); g.fillStyle = `rgba(${l},${l},${l + 8},${0.2 + rnd() * 0.5})`; g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 1.6, 1 + rnd() * 1.6); }
  return tex(c, 4, 1);
}

export function woodTexture(base = "#9a6b3c") {
  const [c, g] = canvas(256, 256); g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${rnd() > 0.5 ? "50,25,5" : "255,220,170"},${0.05 + rnd() * 0.1})`; g.lineWidth = 1 + rnd() * 2; g.beginPath(); const y = rnd() * 256; g.moveTo(0, y); g.bezierCurveTo(80, y + rnd() * 10 - 5, 170, y + rnd() * 10 - 5, 256, y + rnd() * 6 - 3); g.stroke(); }
  g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 2; for (let y = 0; y <= 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  return tex(c, 2, 2);
}

export function breadTexture() {
  const [c, g] = canvas(256, 128); const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, "#d9a45a"); gr.addColorStop(0.5, "#c07f35"); gr.addColorStop(1, "#8f5a22"); g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 5; i++) { g.strokeStyle = "rgba(255,235,190,.75)"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); g.moveTo(24 + i * 50, 18); g.lineTo(52 + i * 50, 108); g.stroke(); }
  noise(g, 256, 128, 900, 0.18); noise(g, 256, 128, 500, 0.35, true);
  return tex(c, 1, 1, false);
}

export function caneTexture() {
  const [c, g] = canvas(128, 128); g.fillStyle = "#e0c28b"; g.fillRect(0, 0, 128, 128); g.strokeStyle = "#8a6a38"; g.lineWidth = 3;
  for (let i = -128; i < 256; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke(); g.beginPath(); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke(); }
  return tex(c, 5, 1);
}

export function muralTexture(ink: string) {
  const [c, g] = canvas(1024, 256); g.fillStyle = "#f6efe0"; g.fillRect(0, 0, 1024, 256); g.strokeStyle = ink; g.lineWidth = 2.4; g.globalAlpha = 0.8; g.lineJoin = "round";
  for (let x = 6; x < 1024; x += 120) {
    const h = 110 + ((x * 37) % 80), w = 104; g.strokeRect(x, 236 - h, w, h);
    g.beginPath(); g.moveTo(x - 6, 236 - h); g.lineTo(x + w / 2, 236 - h - 30); g.lineTo(x + w + 6, 236 - h); g.stroke();
    for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) { g.strokeRect(x + 16 + k * 44, 236 - h + 14 + r * 44, 24, 32); g.beginPath(); g.arc(x + 28 + k * 44, 236 - h + 14 + r * 44, 12, Math.PI, 0); g.stroke(); }
  }
  g.beginPath(); g.moveTo(480, 236); g.lineTo(512, 40); g.lineTo(544, 236); g.moveTo(493, 150); g.lineTo(531, 150); g.moveTo(500, 100); g.lineTo(524, 100); g.stroke();
  g.beginPath(); g.moveTo(0, 236); g.lineTo(1024, 236); g.stroke();
  return tex(c, 6, 1);
}

export function softTexture() {
  const [c, g] = canvas(128, 128); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** a sign painted with the restaurant's own display font; call again once the font has loaded */
export function signTexture(opts: { w: number; h: number; bg: string | null; lines: { text: string; size: number; color: string; font: string; y: number; spacing?: number }[]; border?: string }) {
  const [c, g] = canvas(opts.w, opts.h);
  if (opts.bg) { g.fillStyle = opts.bg; g.fillRect(0, 0, opts.w, opts.h); }
  if (opts.border) { g.strokeStyle = opts.border; g.lineWidth = 8; g.strokeRect(14, 14, opts.w - 28, opts.h - 28); }
  g.textAlign = "center"; g.textBaseline = "middle";
  for (const l of opts.lines) { g.font = `${l.size}px ${l.font}`; (g as unknown as { letterSpacing: string }).letterSpacing = `${l.spacing ?? 0}px`; g.fillStyle = l.color; g.fillText(l.text, opts.w / 2, l.y); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function chalkTexture(lines: { text: string; size: number; y: number; color?: string }[], font: string) {
  const [c, g] = canvas(1024, 640); g.fillStyle = "#1d2a26"; g.fillRect(0, 0, 1024, 640);
  const gr = g.createRadialGradient(512, 320, 100, 512, 320, 640); gr.addColorStop(0, "rgba(255,255,255,.06)"); gr.addColorStop(1, "rgba(0,0,0,.35)"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 640);
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 5; g.strokeRect(24, 24, 976, 592);
  g.textAlign = "center"; g.textBaseline = "middle";
  for (const l of lines) { g.font = `${l.size}px ${font}`; g.fillStyle = l.color ?? "rgba(255,255,255,.9)"; g.fillText(l.text, 512, l.y); }
  noise(g, 1024, 640, 2500, 0.1, true);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
