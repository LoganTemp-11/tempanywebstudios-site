// Draws the pencil rough of Rayney Day's opening screen as SVG, stroke by stroke,
// so the page can draw it, letter it, wash it with colour and then lift it off the real site.
// Coordinates match the 390 x 844 phone screenshot it sits on.
let seed = 11;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const j = (a) => (rnd() - 0.5) * 2 * a;
const f = (n) => n.toFixed(1);
const strokes = [];           // each { d, w } is one pencil stroke, drawn in order
let standIn = false;
const pencil = (d, w = 1.5) => strokes.push({ d, w, standIn });

// a hand-drawn line: slightly bowed, overshoots a touch, usually gone over twice
function line(x1, y1, x2, y2, { w = 1.5, twice = true, wob = 1.6 } = {}) {
  for (let k = 0; k < (twice ? 2 : 1); k++) {
    const mx = (x1 + x2) / 2 + j(wob * 1.5), my = (y1 + y2) / 2 + j(wob * 1.5);
    pencil(`M${f(x1 + j(wob))} ${f(y1 + j(wob))}Q${f(mx)} ${f(my)} ${f(x2 + j(wob))} ${f(y2 + j(wob))}`, w * (k ? 0.7 : 1));
  }
}
function box(x, y, w, h, o = {}) { line(x, y, x + w, y, o); line(x + w, y, x + w, y + h, o); line(x + w, y + h, x, y + h, o); line(x, y + h, x, y, o); }
function poly(pts, { w = 1.5, wob = 1.2, close = false } = {}) {
  const p = pts.map(([x, y]) => [x + j(wob), y + j(wob)]);
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 1; i < p.length - 1; i++) d += `Q${f(p[i][0])} ${f(p[i][1])} ${f((p[i][0] + p[i + 1][0]) / 2)} ${f((p[i][1] + p[i + 1][1]) / 2)}`;
  d += `L${f(p.at(-1)[0])} ${f(p.at(-1)[1])}` + (close ? 'Z' : '');
  pencil(d, w);
}
function ring(cx, cy, rx, ry, o = {}) {
  const pts = []; const a0 = rnd() * 6.28;
  for (let i = 0; i <= 14; i++) { const a = a0 + (i / 13) * 6.6; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  poly(pts, o);
}
function pill(x, y, w, h, o = {}) {
  const r = h / 2, pts = [];
  for (let i = 0; i <= 6; i++) { const a = Math.PI / 2 + (i / 6) * Math.PI; pts.push([x + r + Math.cos(a) * r, y + r + Math.sin(a) * r]); }
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * Math.PI; pts.push([x + w - r + Math.cos(a) * r, y + r + Math.sin(a) * r]); }
  pts.push(pts[0], pts[1]);
  poly(pts, o);
}
function scribble(x, y, w, h, n, o = {}) {       // a block of lines standing in for text
  for (let i = 0; i < n; i++) { const yy = y + (i + 0.5) * h / n; line(x, yy, x + w * (i === n - 1 ? 0.62 + rnd() * 0.2 : 0.9 + rnd() * 0.1), yy, { twice: false, wob: 1.2, ...o }); }
}

// ---- the rough, in the order a hand would draw it ----
// the sheet edge
box(7, 7, 376, 830, { w: 1.8, wob: 2.2 });
// header: mark, name, the email link and the rule under it
ring(36, 45, 17, 17, { w: 1.4 });
standIn = true; line(66, 46, 158, 45, { twice: false }); line(284, 48, 372, 49, { twice: false }); standIn = false;
line(282, 66, 374, 65, { w: 1.1, twice: false });
line(16, 90, 374, 89, { w: 1.2 });
// the photograph: an arch running off the right-hand edge
const arch = [[383, 96], [330, 82], [272, 96], [222, 140], [184, 208], [160, 300], [152, 420], [154, 560], [150, 640]];
poly(arch, { w: 1.7 });
const ARCH = `M383 96C330 78 262 96 215 150C172 205 152 320 152 430L150 640L383 640Z`;
const hatchStart = strokes.length;
for (let i = 0; i < 17; i++) { const o = 60 + i * 34; line(383, 96 + o - 250, 383 - 330, 96 + o + 80, { w: 0.9, twice: false, wob: 0.8 }); }
const hatchEnd = strokes.length;
// what it is, in two small lines
standIn = true; scribble(18, 146, 250, 42, 2, { w: 1.1 }); standIn = false;
// the name, big: two heavy guide lines the lettering sits on
line(18, 352, 330, 350, { w: 1.2 }); line(18, 424, 322, 423, { w: 1.2 });
// the line under it
standIn = true; scribble(18, 572, 220, 48, 2, { w: 1.1 }); standIn = false;
// the two things people do
pill(168, 652, 206, 48, { w: 1.6 }); pill(168, 714, 206, 48, { w: 1.6 });
// the bar at the foot
line(8, 782, 382, 781, { w: 1.4 }); line(158, 783, 157, 836, { w: 1.3 });
// a note in the margin, with its arrow
poly([[128, 742], [140, 735], [152, 738], [163, 738]], { w: 1.2 }); poly([[155, 731], [164, 738], [155, 745]], { w: 1.2 });

const N = strokes.length;
const paths = strokes.map((s, i) => `<path d="${s.d}" pathLength="1" style="--i:${i};stroke-width:${s.w}"${i >= hatchStart && i < hatchEnd ? ' class="rh" clip-path="url(#roughArch)"' : s.standIn ? ' class="rs"' : ''}/>`).join('');
// hand lettering, written on after the pencil; --i orders it
const words = [
  [36, 51, 13, 'middle', 'RD'], [68, 40, 13, 'start', 'pet services'], [372, 60, 14, 'end', 'email Fiona'],
  [18, 158, 15, 'start', 'dog walking + home checks'], [18, 182, 15, 'start', 'Dollar and round about'],
  [16, 344, 46, 'start', 'Rayney Day'], [16, 416, 46, 'start', 'Pet Services'],
  [18, 588, 17, 'start', 'good days for pets,'], [18, 612, 17, 'start', 'peace of mind for people'],
  [271, 683, 18, 'middle', 'Email Fiona'], [271, 745, 18, 'middle', 'Call Fiona'],
  [82, 818, 15, 'middle', 'call'], [270, 818, 15, 'middle', 'email'],
  [286, 232, 17, 'middle', 'her photo'], [286, 254, 17, 'middle', 'goes here'],
  [16, 736, 14, 'start', 'the one thing'], [16, 753, 14, 'start', 'people do'],
];
const text = words.map(([x, y, s, a, t], i) => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="${a}" style="--i:${i}"${t.includes('photo') || t.includes('goes here') ? ' class="rn"' : (t === 'Email Fiona' || t === 'call') ? ' class="rd"' : ''}>${t}</text>`).join('');
// colour, laid in as flat washes with the client's own colours
const wash = [
  `<rect x="0" y="0" width="390" height="844" fill="#17392f" style="--i:0"/>`,
  `<path d="${ARCH}" fill="#7fa9c9" style="--i:1"/>`,
  `<path d="M150 430C210 400 300 395 383 420L383 640L150 640Z" fill="#4f7a3c" style="--i:2"/>`,
  `<rect x="168" y="652" width="206" height="48" rx="24" fill="#f2ece0" style="--i:3"/>`,
  `<rect x="0" y="782" width="158" height="62" fill="#f2ece0" style="--i:3"/>`,
].join('');
const svg = `<svg class="rough__sheet" viewBox="0 0 390 844" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false" style="--n:${N};--nt:${words.length}">`
  + `<rect class="rough__paper" width="390" height="844"/>`
  + `<g class="rough__wash">${wash}</g>`
  + `<clipPath id="roughArch"><path d="${ARCH}"/></clipPath>`
  + `<g class="rough__pencil">${paths}</g>`
  + `<g class="rough__hand">${text}</g>`
  + `</svg>`;
import fs from 'fs';
fs.writeFileSync('rough.svg.html', svg);
console.log('strokes', N, 'words', words.length, 'bytes', svg.length);
