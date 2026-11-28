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

/** glazed square tiles; `inset` is the grout: half the gap, in texture pixels, between neighbours (1.5 = the wide Paris Panini tile, less = thin grout) */
export function glazedTileTexture(color: string, dark: string, inset = 1.5) {
  const [c, g] = canvas(256, 256); g.fillStyle = dark; g.fillRect(0, 0, 256, 256);
  const s = 32 - inset * 2;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    g.fillStyle = color; g.fillRect(x * 32 + inset, y * 32 + inset, s, s);
    const gr = g.createLinearGradient(x * 32, y * 32, x * 32 + 32, y * 32 + 32); gr.addColorStop(0, "rgba(255,255,255,.38)"); gr.addColorStop(0.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,.28)");
    g.fillStyle = gr; g.fillRect(x * 32 + inset, y * 32 + inset, s, s);
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

/** black and cream stripes like the restaurant's ceiling */
export function stripeTexture() {
  const [c, g] = canvas(256, 64); g.fillStyle = "#f1ebdd"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#26262e";
  for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 16, 64);
  noise(g, 256, 64, 600, 0.08);
  return tex(c, 20, 1);
}

/** big grey floor tiles with thin grout (the Smash Guys dining room) */
export function floorTileTexture() {
  const [c, g] = canvas(256, 256); g.fillStyle = "#4f4f54"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
    const l = 120 + Math.floor(rnd() * 16); g.fillStyle = `rgb(${l},${l},${l + 4})`; g.fillRect(x * 128 + 2, y * 128 + 2, 124, 124);
    const gr = g.createLinearGradient(x * 128, y * 128, x * 128 + 128, y * 128 + 128); gr.addColorStop(0, "rgba(255,255,255,.12)"); gr.addColorStop(1, "rgba(0,0,0,.12)"); g.fillStyle = gr; g.fillRect(x * 128 + 2, y * 128 + 2, 124, 124);
  }
  noise(g, 256, 256, 1500, 0.1); noise(g, 256, 256, 500, 0.08, true);
  return tex(c);
}

/** buttoned, diamond-quilted leather (the red booths) */
export function leatherTexture(color = "#8e1b22") {
  const [c, g] = canvas(256, 256); g.fillStyle = color; g.fillRect(0, 0, 256, 256);
  const cell = 128;
  for (let gy = -1; gy <= 2; gy++) for (let gx = -1; gx <= 2; gx++) {
    const cx = gx * cell + (gy % 2 ? 0 : 0), cy = gy * cell;
    for (const [ox, oy] of [[0, 0], [cell / 2, cell / 2]]) {
      const x = cx + ox, y = cy + oy, r = cell / 2;
      g.save(); g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.clip();
      const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.22)"); gr.addColorStop(0.6, "rgba(255,255,255,.04)"); gr.addColorStop(1, "rgba(0,0,0,.45)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
      g.restore();
      g.strokeStyle = "rgba(20,0,0,.55)"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.stroke();
    }
  }
  g.fillStyle = "#3a0a0e"; for (let y = 0; y <= 256; y += 64) for (let x = 0; x <= 256; x += 64) if ((x / 64 + y / 64) % 2 === 0) { g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); }
  noise(g, 256, 256, 900, 0.07);
  return tex(c);
}

/** a black band of white stars (the stripe under the Smash Guys sign) */
export function starBandTexture() {
  const [c, g] = canvas(512, 64); g.fillStyle = "#121212"; g.fillRect(0, 0, 512, 64);
  g.fillStyle = "#fff6d6";
  for (let k = 0; k < 8; k++) {
    const cx = 32 + k * 64, cy = 32, R = 14, r = 6; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r : R; g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
    g.closePath(); g.fill();
  }
  return tex(c);
}

/** a little poster for a frame on the wall: a drawn burger, a starburst, or a bun */
export function posterTexture(kind: number) {
  const [c, g] = canvas(256, 320); g.fillStyle = ["#fff0b8", "#f6d457", "#f2e3c4"][kind % 3]; g.fillRect(0, 0, 256, 320);
  g.strokeStyle = "#141414"; g.lineWidth = 6; g.lineJoin = "round";
  if (kind % 3 === 1) { // starburst with a word
    g.fillStyle = "#c8201b"; g.beginPath(); for (let i = 0; i < 24; i++) { const a = (i * Math.PI) / 12, r = i % 2 ? 78 : 104; g.lineTo(128 + Math.cos(a) * r, 150 + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#fff6d6"; g.font = "64px Anton, Impact, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("SMASH", 128, 150);
    g.fillStyle = "#141414"; g.font = "30px Anton, Impact, sans-serif"; g.fillText("GOOOD", 128, 290);
    return tex(c, 1, 1, false);
  }
  const burger = (cy: number) => {
    g.fillStyle = "#e0a24a"; g.beginPath(); g.ellipse(128, cy - 62, 82, 52, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();       // top bun
    g.fillStyle = "#4a9a3a"; g.beginPath(); g.moveTo(40, cy - 56); for (let x = 40; x <= 216; x += 22) g.quadraticCurveTo(x + 11, cy - 38, x + 22, cy - 56); g.lineTo(216, cy - 44); g.lineTo(40, cy - 44); g.closePath(); g.fill(); g.stroke(); // lettuce
    g.fillStyle = "#f4b400"; g.beginPath(); g.moveTo(44, cy - 44); g.lineTo(212, cy - 44); g.lineTo(196, cy - 18); g.lineTo(150, cy - 40); g.lineTo(104, cy - 18); g.lineTo(60, cy - 40); g.closePath(); g.fill(); g.stroke(); // cheese
    g.fillStyle = "#5a2e1a"; g.beginPath(); g.roundRect(36, cy - 24, 184, 34, 16); g.fill(); g.stroke();                                    // patty
    g.fillStyle = "#e0a24a"; g.beginPath(); g.roundRect(44, cy + 14, 168, 26, 13); g.fill(); g.stroke();                                    // bottom bun
  };
  burger(kind % 3 === 2 ? 170 : 160);
  g.fillStyle = "#141414"; g.font = "34px Anton, Impact, sans-serif"; g.textAlign = "center"; g.fillText(kind % 3 === 2 ? "MILK BUNS" : "SMASH GUYS", 128, 282);
  return tex(c, 1, 1, false);
}

// ---------------------------------------------------------------- the Smash Guys room, more realistic: glazed tile with a recessed grout, porcelain floor, tufted leather with real dents, soft contact shadows
function plain(c: HTMLCanvasElement, rx = 1, ry = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t;
}
const shade = (hex: string, k: number) => { const n = parseInt(hex.slice(1), 16), f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

/** glazed square tiles (8 x 8 to a picture): each tile a touch different, with a glaze highlight, and a thin recessed grout. `map` is the colour, `bump` the height. */
export function glossTileSet(color: string, grout: string, opts: { gap?: number; vary?: number } = {}) {
  const gap = opts.gap ?? 1.4, vary = opts.vary ?? 0.07, N = 8, S = 512, T = S / N;
  const [c, g] = canvas(S, S); g.fillStyle = grout; g.fillRect(0, 0, S, S);
  const [b, h] = canvas(S, S); h.fillStyle = "#000"; h.fillRect(0, 0, S, S);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const x0 = x * T + gap, y0 = y * T + gap, w = T - gap * 2, k = 1 + (rnd() - 0.5) * 2 * vary;
    g.fillStyle = shade(color, k); g.beginPath(); g.roundRect(x0, y0, w, w, 3); g.fill();
    const gr = g.createLinearGradient(x0, y0, x0 + w, y0 + w); gr.addColorStop(0, "rgba(255,255,255,.30)"); gr.addColorStop(0.45, "rgba(255,255,255,.02)"); gr.addColorStop(1, "rgba(0,0,0,.20)");
    g.fillStyle = gr; g.beginPath(); g.roundRect(x0, y0, w, w, 3); g.fill();
    const hh = h.createRadialGradient(x0 + w / 2, y0 + w / 2, w * 0.1, x0 + w / 2, y0 + w / 2, w * 0.75); hh.addColorStop(0, "#bdbdbd"); hh.addColorStop(1, "#8a8a8a");
    h.fillStyle = hh; h.beginPath(); h.roundRect(x0, y0, w, w, 3); h.fill();
  }
  noise(g, S, S, 3000, 0.05); noise(g, S, S, 900, 0.05, true);
  return { map: plain(c), bump: plain(b, 1, 1, false) };
}

/** big grey porcelain floor tiles (2 x 2 to a picture), a little speckle, a roughness map so the polish is uneven like a real floor */
export function porcelainSet() {
  const S = 512, N = 2, T = S / N;
  const [c, g] = canvas(S, S); g.fillStyle = "#3d3d42"; g.fillRect(0, 0, S, S);
  const [r, q] = canvas(S, S); q.fillStyle = "#bbb"; q.fillRect(0, 0, S, S);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const l = 132 + Math.floor(rnd() * 22); g.fillStyle = `rgb(${l},${l - 1},${l + 3})`; g.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
    const gr = g.createLinearGradient(x * T, y * T, x * T + T, y * T + T); gr.addColorStop(0, "rgba(255,255,255,.10)"); gr.addColorStop(1, "rgba(0,0,0,.14)"); g.fillStyle = gr; g.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
  }
  for (let i = 0; i < 4000; i++) { const l = 80 + Math.floor(rnd() * 120); g.fillStyle = `rgba(${l},${l},${l},${0.12 + rnd() * 0.25})`; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 1.8, 1 + rnd() * 1.8); }
  for (let i = 0; i < 260; i++) { q.fillStyle = `rgba(${rnd() > 0.5 ? "255,255,255" : "90,90,90"},${rnd() * 0.25})`; q.beginPath(); q.ellipse(rnd() * S, rnd() * S, 8 + rnd() * 40, 5 + rnd() * 20, rnd() * 3, 0, Math.PI * 2); q.fill(); }
  return { map: plain(c), rough: plain(r, 1, 1, false) };
}

/** tufted leather: the colour with creases, and a height map with a dent at every button and puffed diamonds between them */
export function leatherSet(color = "#7d1a20") {
  const S = 256, cell = 128;
  const [c, g] = canvas(S, S); g.fillStyle = color; g.fillRect(0, 0, S, S);
  const [b, h] = canvas(S, S); h.fillStyle = "#555"; h.fillRect(0, 0, S, S);
  for (let gy = -1; gy <= 2; gy++) for (let gx = -1; gx <= 2; gx++) for (const [ox, oy] of [[0, 0], [cell / 2, cell / 2]]) {
    const x = gx * cell + ox, y = gy * cell + oy, r = cell / 2;
    for (const [ctx2, light, dark] of [[g, "rgba(255,225,215,.30)", "rgba(10,0,0,.55)"], [h, "#eee", "#111"]] as const) {
      ctx2.save(); ctx2.beginPath(); ctx2.moveTo(x, y - r); ctx2.lineTo(x + r, y); ctx2.lineTo(x, y + r); ctx2.lineTo(x - r, y); ctx2.closePath(); ctx2.clip();
      const gr = ctx2.createRadialGradient(x, y, 3, x, y, r * 0.95); gr.addColorStop(0, light); gr.addColorStop(0.55, ctx2 === g ? "rgba(255,255,255,.04)" : "#999"); gr.addColorStop(1, dark);
      ctx2.fillStyle = gr; ctx2.fillRect(x - r, y - r, 2 * r, 2 * r); ctx2.restore();
    }
  }
  g.fillStyle = "#2a0509"; for (let y = 0; y <= S; y += 64) for (let x = 0; x <= S; x += 64) if ((x / 64 + y / 64) % 2 === 0) { g.beginPath(); g.arc(x, y, 5.5, 0, Math.PI * 2); g.fill(); h.fillStyle = "#000"; h.beginPath(); h.arc(x, y, 8, 0, Math.PI * 2); h.fill(); }
  noise(g, S, S, 1400, 0.06); noise(g, S, S, 500, 0.05, true);
  for (let i = 0; i < 220; i++) { g.strokeStyle = `rgba(0,0,0,${rnd() * 0.07})`; g.lineWidth = 1; g.beginPath(); const x = rnd() * S, y = rnd() * S; g.moveTo(x, y); g.lineTo(x + rnd() * 18 - 9, y + rnd() * 18 - 9); g.stroke(); }
  return { map: plain(c), bump: plain(b, 1, 1, false) };
}

/** a vertical shadow gradient (dark at the foot, clear at the top) used as an alpha map: the darkening where a wall meets the floor or ceiling */
export function foldTexture() {
  const [c, g] = canvas(8, 128); const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "#000"); gr.addColorStop(0.35, "#242424"); gr.addColorStop(1, "#fff");
  g.fillStyle = gr; g.fillRect(0, 0, 8, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}

/** a table-tent card: the dish's name in big black capitals and its price, so it can be read from the aisle */
export function tentCardTexture(name: string, price: string, veg: boolean, fontsOk: boolean) {
  const [c, g] = canvas(768, 420); g.fillStyle = "#f6d457"; g.fillRect(0, 0, 768, 420);
  const gr = g.createLinearGradient(0, 0, 0, 420); gr.addColorStop(0, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(0,0,0,.12)"); g.fillStyle = gr; g.fillRect(0, 0, 768, 420);
  g.strokeStyle = "#141414"; g.lineWidth = 14; g.strokeRect(10, 10, 748, 400);
  g.textAlign = "center"; g.textBaseline = "middle";
  const fam = fontsOk ? "'Anton', Impact, sans-serif" : "Impact, sans-serif";
  const words = name.toUpperCase(); let size = 150; g.font = `${size}px ${fam}`; while (g.measureText(words).width > 640 && size > 60) { size -= 6; g.font = `${size}px ${fam}`; }
  g.fillStyle = "#141414"; g.fillText(words, 384, 150);
  g.fillStyle = "#c8201b"; g.fillRect(150, 238, 468, 6);
  g.fillStyle = "#141414"; g.font = `120px ${fam}`; g.fillText(price, 384, 322);
  g.fillStyle = veg ? "#0f6a28" : "#a93226"; g.beginPath(); g.arc(60, 360, 22, 0, Math.PI * 2); g.fill(); g.fillStyle = "#f6d457"; g.beginPath(); g.arc(60, 360, 9, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
