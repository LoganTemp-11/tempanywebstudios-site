// Draws the pencil roughs of Rayney Day's opening screen as SVG: a wide one traced over the
// desktop site and a tall one traced over the phone site. Each sheet has the pencil and hand
// lettering in dark, then a clipped group holding the colour washes and a light copy of the
// same lines, so colour can be wiped down the sheet and the lines stay readable on both sides.
import fs from 'fs';

function sheet(id, W, H, draw) {
  let seed = id === 'w' ? 23 : 11;
  const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const k = W / 390 > 2 ? 1.7 : 1;                       // the wide sheet is drawn with a slightly heavier hand
  const j = (a) => (rnd() - 0.5) * 2 * a * k;
  const f = (n) => n.toFixed(1);
  const strokes = []; let cls = '';
  const pencil = (d, w = 1.5) => strokes.push({ d, w: w * (k > 1 ? 1.35 : 1), cls });
  const P = {
    line(x1, y1, x2, y2, { w = 1.5, twice = true, wob = 1.6 } = {}) {
      for (let n = 0; n < (twice ? 2 : 1); n++) {
        const mx = (x1 + x2) / 2 + j(wob * 1.5), my = (y1 + y2) / 2 + j(wob * 1.5);
        pencil(`M${f(x1 + j(wob))} ${f(y1 + j(wob))}Q${f(mx)} ${f(my)} ${f(x2 + j(wob))} ${f(y2 + j(wob))}`, w * (n ? 0.7 : 1));
      }
    },
    box(x, y, w, h, o = {}) { P.line(x, y, x + w, y, o); P.line(x + w, y, x + w, y + h, o); P.line(x + w, y + h, x, y + h, o); P.line(x, y + h, x, y, o); },
    poly(pts, { w = 1.5, wob = 1.2 } = {}) {
      const p = pts.map(([x, y]) => [x + j(wob), y + j(wob)]);
      let d = `M${f(p[0][0])} ${f(p[0][1])}`;
      for (let i = 1; i < p.length - 1; i++) d += `Q${f(p[i][0])} ${f(p[i][1])} ${f((p[i][0] + p[i + 1][0]) / 2)} ${f((p[i][1] + p[i + 1][1]) / 2)}`;
      pencil(d + `L${f(p.at(-1)[0])} ${f(p.at(-1)[1])}`, w);
    },
    ring(cx, cy, rx, ry, o = {}) { const pts = [], a0 = rnd() * 6.28; for (let i = 0; i <= 14; i++) { const a = a0 + (i / 13) * 6.6; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } P.poly(pts, o); },
    pill(x, y, w, h, o = {}) {
      const r = h / 2, pts = [];
      for (let i = 0; i <= 6; i++) { const a = Math.PI / 2 + (i / 6) * Math.PI; pts.push([x + r + Math.cos(a) * r, y + r + Math.sin(a) * r]); }
      for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * Math.PI; pts.push([x + w - r + Math.cos(a) * r, y + r + Math.sin(a) * r]); }
      pts.push(pts[0], pts[1]); P.poly(pts, o);
    },
    scribble(x, y, w, h, n, o = {}) { for (let i = 0; i < n; i++) { const yy = y + (i + 0.5) * h / n; P.line(x, yy, x + w * (i === n - 1 && n > 1 ? 0.62 + rnd() * 0.2 : 0.9 + rnd() * 0.1), yy, { twice: false, wob: 1.2, ...o }); } },
    standIn(fn) { cls = 'rs'; fn(); cls = ''; },          // strokes that stand in for words, rubbed out once lettered
    hatch(fn) { cls = 'rh'; fn(); cls = ''; },
  };
  const { words, wash, arch } = draw(P);
  const N = strokes.length;
  const paths = strokes.map((s, i) => `<path d="${s.d}" pathLength="1" style="--i:${i};stroke-width:${s.w.toFixed(2)}"${s.cls === 'rh' ? ` class="rh" clip-path="url(#ra-${id})"` : s.cls ? ` class="${s.cls}"` : ''}/>`).join('');
  const text = words.map(([x, y, s, a, t, c], i) => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="${a}" style="--i:${i}"${c ? ` class="${c}"` : ''}>${t}</text>`).join('');
  return `<svg class="rough__sheet" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false" style="--n:${N};--nt:${words.length}">`
    + `<rect class="rough__paper" width="${W}" height="${H}"/>`
    + `<clipPath id="ra-${id}"><path d="${arch}"/></clipPath>`
    + `<clipPath id="rw-${id}"><rect class="rough__wipe" width="${W}" height="${H}"/></clipPath>`
    + `<g id="rk-${id}" class="rough__lines"><g class="rough__pencil">${paths}</g><g class="rough__hand">${text}</g></g>`
    + `<g clip-path="url(#rw-${id})"><g class="rough__wash">${wash}</g><use href="#rk-${id}" class="rough__lt"/></g>`
    + `</svg>`;
}

// ---- the phone sheet, 390 x 844 ----
const phone = sheet('p', 390, 844, (P) => {
  P.box(7, 7, 376, 830, { w: 1.8, wob: 2.2 });
  P.ring(36, 45, 17, 17, { w: 1.4 });
  P.standIn(() => { P.line(66, 46, 158, 45, { twice: false }); P.line(284, 48, 372, 49, { twice: false }); });
  P.line(282, 66, 374, 65, { w: 1.1, twice: false });
  P.line(16, 90, 374, 89, { w: 1.2 });
  P.poly([[383, 96], [330, 82], [272, 96], [222, 140], [184, 208], [160, 300], [152, 420], [154, 560], [150, 640]], { w: 1.7 });
  const arch = 'M383 96C330 78 262 96 215 150C172 205 152 320 152 430L150 640L383 640Z';
  P.hatch(() => { for (let i = 0; i < 17; i++) { const o = 60 + i * 34; P.line(383, 96 + o - 250, 53, 96 + o + 80, { w: 0.9, twice: false, wob: 0.8 }); } });
  P.standIn(() => P.scribble(18, 146, 250, 42, 2, { w: 1.1 }));
  P.line(18, 352, 330, 350, { w: 1.2 }); P.line(18, 424, 322, 423, { w: 1.2 });
  P.standIn(() => P.scribble(18, 572, 220, 48, 2, { w: 1.1 }));
  P.pill(168, 652, 206, 48, { w: 1.6 }); P.pill(168, 714, 206, 48, { w: 1.6 });
  P.line(8, 782, 382, 781, { w: 1.4 }); P.line(158, 783, 157, 836, { w: 1.3 });
  P.poly([[128, 742], [140, 735], [152, 738], [163, 738]], { w: 1.2 }); P.poly([[155, 731], [164, 738], [155, 745]], { w: 1.2 });
  return {
    arch,
    words: [
      [36, 51, 13, 'middle', 'RD'], [68, 40, 13, 'start', 'pet services'], [372, 60, 14, 'end', 'email Fiona'],
      [18, 158, 15, 'start', 'dog walking + home checks'], [18, 182, 15, 'start', 'Dollar and round about'],
      [16, 344, 46, 'start', 'Rayney Day'], [16, 416, 46, 'start', 'Pet Services'],
      [18, 588, 17, 'start', 'good days for pets,'], [18, 612, 17, 'start', 'peace of mind for people'],
      [271, 683, 18, 'middle', 'Email Fiona', 'rd'], [271, 745, 18, 'middle', 'Call Fiona'],
      [82, 818, 15, 'middle', 'call', 'rd'], [270, 818, 15, 'middle', 'email'],
      [286, 232, 17, 'middle', 'her photo', 'rn'], [286, 254, 17, 'middle', 'goes here', 'rn'],
      [16, 736, 14, 'start', 'the one thing'], [16, 753, 14, 'start', 'people do'],
    ],
    wash: `<rect width="390" height="844" fill="#17392f"/><path d="${arch}" fill="#8fb0d0"/><path d="M150 430C210 400 300 395 383 420L383 640L150 640Z" fill="#4f7a3c"/>`
      + `<rect x="168" y="652" width="206" height="48" rx="24" fill="#f2ece0"/><rect x="0" y="782" width="158" height="62" fill="#f2ece0"/>`,
  };
});

// ---- the wide sheet, 1440 x 900, traced over the desktop site ----
const wide = sheet('w', 1440, 900, (P) => {
  P.box(12, 12, 1416, 876, { w: 1.6, wob: 2 });
  P.ring(43, 45, 19, 19, { w: 1.2 });
  P.standIn(() => { P.line(74, 46, 168, 45, { twice: false }); P.line(596, 46, 664, 45, { twice: false }); P.line(698, 45, 746, 46, { twice: false }); P.line(778, 46, 844, 45, { twice: false }); P.line(1324, 44, 1414, 45, { twice: false }); });
  P.line(1322, 67, 1416, 66, { w: 1, twice: false });
  P.line(24, 90, 1416, 89, { w: 1 });
  // the photograph: a tall arch, right of centre
  const arch = 'M677 737L677 394A331 331 0 0 1 1339 394L1339 737Q1339 837 1239 837L777 837Q677 837 677 737Z';
  const top = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; top.push([1008 + Math.cos(a) * 331, 394 + Math.sin(a) * 331]); }
  P.poly([[777, 837], [700, 818], [677, 737], [676, 560], ...top, [1340, 560], [1339, 737], [1316, 818], [1239, 837], [1000, 838], [777, 837], [740, 832]], { w: 1.6, wob: 1.6 });
  P.hatch(() => { for (let i = 0; i < 26; i++) { const o = i * 46; P.line(1345, 60 + o - 420, 670, 60 + o + 150, { w: 0.8, twice: false, wob: 0.8 }); } });
  P.standIn(() => P.scribble(24, 181, 560, 18, 1, { w: 1 }));
  P.line(24, 474, 760, 471, { w: 1.1 }); P.line(168, 602, 1080, 600, { w: 1.1 });
  P.line(24, 777, 1416, 776, { w: 1 });
  P.standIn(() => P.scribble(24, 800, 320, 58, 2, { w: 1 }));
  P.pill(913, 808, 144, 52, { w: 1.4 }); P.pill(1069, 808, 203, 52, { w: 1.4 });
  P.ring(1360, 822, 54, 54, { w: 1.2 });
  P.poly([[1150, 742], [1160, 764], [1168, 786], [1170, 800]], { w: 1.1 }); P.poly([[1160, 790], [1170, 802], [1179, 789]], { w: 1.1 });
  return {
    arch,
    words: [
      [43, 51, 14, 'middle', 'RD'], [76, 51, 16, 'start', 'pet services'],
      [630, 51, 16, 'middle', 'services'], [722, 51, 16, 'middle', 'about'], [811, 51, 16, 'middle', 'contact'], [1414, 58, 17, 'end', 'email Fiona'],
      [24, 198, 20, 'start', 'dog walking + pet home checks, Dollar and round about'],
      [22, 462, 156, 'start', 'Rayney Day'], [166, 590, 156, 'start', 'Pet Services'],
      [24, 822, 26, 'start', 'good days for pets,'], [24, 854, 26, 'start', 'peace of mind for their people'],
      [985, 842, 21, 'middle', 'Email Fiona', 'rd'], [1170, 842, 21, 'middle', 'Call Fiona'], [1360, 828, 17, 'middle', 'email'],
      [1008, 250, 26, 'middle', 'her photo', 'rn'], [1008, 282, 26, 'middle', 'goes here', 'rn'],
      [1150, 716, 19, 'middle', 'the one thing'], [1150, 738, 19, 'middle', 'people do'],
    ],
    wash: `<rect width="1440" height="900" fill="#1b403c"/><path d="${arch}" fill="#8fb0d0"/><path d="M677 520C800 470 920 500 1008 540C1100 500 1240 470 1339 510L1339 737Q1339 837 1239 837L777 837Q677 837 677 737Z" fill="#4f7a3c"/>`
      + `<rect x="913" y="808" width="144" height="52" rx="26" fill="#f2ece0"/><circle cx="1360" cy="822" r="54" fill="#1f4a3f"/>`,
  };
});
fs.writeFileSync('phone.svg.html', phone); fs.writeFileSync('wide.svg.html', wide);
console.log('phone', phone.length, 'wide', wide.length);
