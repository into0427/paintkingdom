'use strict';
// ===== palette.js =====
// 팔레트 — 뽑기 확률, 열기 연출.
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['palette.js'] = '2026.11.24-1';

function rollGem() { let r = Math.random(); for (const g of PALETTE.gems) { r -= g[1]; if (r <= 0) return g[0]; } return PALETTE.gems[0][0]; }

function rollPalette() {                           // 팔레트 하나를 열어서 결과를 적용하고, 화면에 보여줄 내용을 돌려줌
  const pool = unlockedPool(SAVE.maxPower), unowned = pool.filter(k => !SAVE.owned.includes(k));
  const lockedColors = COLORS.filter(c => c.tier > 0 && !UNLOCKED.includes(c.id));
  let kind;
  if (unowned.length && SAVE.dry >= PALETTE.pity) kind = 'new';
  else {
    const r = Math.random();
    kind = r < PALETTE.char ? 'char' : r < PALETTE.char + PALETTE.color ? 'color' : 'gem';
    if (kind === 'color' && !lockedColors.length) kind = 'gem';
  }
  if (kind === 'new' || kind === 'char') {
    let id;
    if (kind === 'new') id = unowned[Math.floor(Math.random() * unowned.length)];
    else {
      const w = pool.map(k => SAVE.owned.includes(k) ? 1 : PALETTE.newWeight);
      let x = Math.random() * w.reduce((t, v) => t + v, 0);
      id = pool[0];
      for (let i = 0; i < pool.length; i++) { x -= w[i]; if (x <= 0) { id = pool[i]; break; } }
    }
    const d = CFG.UNITS[id];
    if (!SAVE.owned.includes(id)) {
      SAVE.owned.push(id); SAVE.dry = 0;
      if (SEL.length < MAX_PICK) { SEL.push(id); saveSel(); }
      return { icon: d.icon, unit: id, title: `새 캐릭터! ${d.name}`, sub: '이제 캐릭터 선택에서 쓸 수 있어요', cls: 'new' };
    }
    SAVE.dry++;
    if ((SAVE.augs[id] || []).length >= 5) { SAVE.gems += PALETTE.maxedGems; return { icon: d.icon, unit: id, title: `${d.name} 중복!`, sub: `증강을 모두 해금해서 보석 ${PALETTE.maxedGems}개로 바뀌었어요`, cls: 'dup' }; }
    SAVE.tickets[id] = (SAVE.tickets[id] || 0) + 1;
    return { icon: d.icon, unit: id, title: `${d.name} 중복!`, sub: `증강권 +1 (보유 ${SAVE.tickets[id]}장)`, cls: 'dup' };
  }
  SAVE.dry++;
  if (kind === 'color') {
    let cw = Math.random() * lockedColors.reduce((t, x) => t + (x.tier === 2 ? 1 : 3), 0), c = lockedColors[0];
    for (const x of lockedColors) { cw -= (x.tier === 2 ? 1 : 3); if (cw <= 0) { c = x; break; } }      // 전설 색은 희귀 색의 3분의 1 확률
    UNLOCKED.push(c.id); store('pk_colors', JSON.stringify(UNLOCKED));
    return { icon: '🎨', title: `새 색상! ${c.name}`, sub: '닉네임 · 색상에서 고를 수 있어요', cls: 'new' };
  }
  const n = rollGem(); SAVE.gems += n;
  return { icon: '💎', title: `보석 ${n}개`, sub: `보유 보석 ${SAVE.gems}개`, cls: n >= 150 ? 'jack' : '' };
}

let palBusy = false, palFrom = 'home';

function palUI() {
  $('palcnt').textContent = `보유 팔레트 ${SAVE.palettes}개 · 💎 ${SAVE.gems}`;
  $('palopen').disabled = palBusy || SAVE.palettes <= 0;
  $('palopen').textContent = SAVE.palettes > 0 ? '열기!' : '팔레트가 없어요';
}

function openPaletteScreen(from) { palFrom = from; $('palres').innerHTML = ''; palReset(); palUI(); show('palette'); }

const pal = { phase: 'idle', t: 0, res: null, shown: false, parts: [], rings: [], flash: 0, last: 0 };

const RAR = { new: '#ffd84d', dup: '#7dd3fc', jack: '#ff9ff3', '': '#a7f3d0' };

function palReset() { pal.phase = 'idle'; pal.t = 0; pal.res = null; pal.shown = false; pal.parts = []; pal.rings = []; pal.flash = 0; palBusy = false; }

const palCols = () => COLORS.filter(c => c.hex).map(c => c.hex).concat(['#ffd84d', '#ffffff']);

function palBurst(cx, cy, col) {                   // 열리는 순간: 물감 방울 폭발 + 충격파 + 번쩍임
  const cols = palCols().concat([col, col]);
  for (let i = 0; i < 100; i++) {
    const a = Math.random() * TAU, sp = 120 + Math.random() * 380;
    pal.parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 140, r: 3 + Math.random() * 7, c: cols[i % cols.length], life: 1 + Math.random() * .9 });
  }
  pal.rings.push({ x: cx, y: cy, t: 0, c: col }, { x: cx, y: cy, t: -.12, c: '#ffffff' });
  pal.flash = 1;
}

function drawPal() {
  const cv2 = $('pcv'), g = cv2.getContext('2d'), Wc = cv2.width, Hc = cv2.height, cx = Wc / 2, cy = Hc / 2 + 4;
  const dt = Math.min(.05, clock - (pal.last || clock)); pal.last = clock; pal.t += dt;
  g.clearRect(0, 0, Wc, Hc);
  if (pal.phase === 'open' && pal.t >= 1.1) {      // 열림!
    SAVE.palettes--; pal.res = rollPalette(); persist();
    pal.phase = 'reveal'; pal.t = 0; palBurst(cx, cy, RAR[pal.res.cls] || RAR['']);
  }
  const col = pal.res ? (RAR[pal.res.cls] || RAR['']) : '#ffd84d';
  const glow = pal.phase === 'open' ? Math.min(1, pal.t / 1.1) : pal.phase === 'reveal' ? Math.max(.4, 1 - pal.t * .25) : 0;
  if (glow > 0) {                                  // 뒤에서 도는 빛줄기
    g.save(); g.translate(cx, cy); g.rotate(clock * (pal.phase === 'open' ? 1.8 : .5)); g.fillStyle = pal.phase === 'reveal' ? col : '#ffd84d'; g.globalAlpha = .22 * glow;
    for (let k = 0; k < 14; k++) { g.rotate(TAU / 14); g.beginPath(); g.moveTo(0, 0); g.lineTo(-18, -Hc); g.lineTo(18, -Hc); g.closePath(); g.fill(); }
    g.restore(); g.globalAlpha = 1;
  }
  if (pal.phase !== 'reveal' || pal.t < .25) {     // 팔레트 본체 (대기 중엔 둥실, 열리는 중엔 점점 더 흔들림)
    const out = pal.phase === 'reveal' ? 1 - pal.t / .25 : 1, op = pal.phase === 'open';
    const sh = op ? (Math.random() - .5) * (3 + pal.t * 14) : 0, sc = (1 + (op ? pal.t * .25 : Math.sin(clock * 2) * .03)) * Math.max(0, out);
    g.save(); g.globalAlpha = Math.max(0, out); g.translate(cx + sh, cy - 6 + (op ? 0 : Math.sin(clock * 2.4) * 6)); g.rotate(-.18 + Math.sin(clock * 1.6) * .05 + sh * .01); g.scale(sc, sc);
    g.lineJoin = 'round'; g.lineWidth = 6; g.strokeStyle = '#6b3f1d'; g.fillStyle = '#e8b27a';
    g.beginPath(); g.ellipse(0, 0, 110, 78, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#f3c995'; g.beginPath(); g.ellipse(-12, -14, 82, 50, 0, 0, TAU); g.fill();
    g.fillStyle = '#2b3060'; g.lineWidth = 4; g.beginPath(); g.ellipse(-58, 26, 17, 13, .3, 0, TAU); g.fill(); g.stroke();
    [['#ff3d6e', -66, -34], ['#ffd84d', -26, -56], ['#34d399', 24, -58], ['#2f6bff', 68, -28], ['#a855f7', 74, 20], ['#ff8a1f', 36, 52]].forEach((b, i) => {
      const q = 1 + Math.sin(clock * 3 + i) * .08 * (op ? 3 : 1);
      g.fillStyle = b[0]; g.lineWidth = 3; g.beginPath(); g.ellipse(b[1], b[2], 17 * q, 14 * q, i, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(b[1] - 5, b[2] - 5, 5, 3, -.6, 0, TAU); g.fill();
    });
    g.restore(); g.globalAlpha = 1;
  }
  if (pal.phase !== 'reveal') {                    // 반짝이 / 열리는 중엔 물감 방울이 튀어 오름
    g.fillStyle = '#fff';
    for (let i = 0; i < 6; i++) { const a = clock * .8 + i * 1.05, r = 120 + Math.sin(clock * 3 + i) * 10, sz = 3 + Math.abs(Math.sin(clock * 4 + i * 2)) * 3; g.globalAlpha = .6; g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .75, sz, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    if (pal.phase === 'open' && Math.random() < .6) { const cc = palCols(); pal.parts.push({ x: cx + (Math.random() - .5) * 160, y: cy - 30, vx: (Math.random() - .5) * 90, vy: -170 - Math.random() * 150, r: 3 + Math.random() * 3, c: cc[Math.floor(Math.random() * cc.length)], life: .8 }); }
  } else {                                         // 결과 공개: 아이콘이 통! 하고 커지며 등장
    const t = pal.t;
    if (t > .35 && !pal.shown) { pal.shown = true; $('palres').innerHTML = `<b class="${pal.res.cls}">${pal.res.title}</b><small>${pal.res.sub}</small>`; palUI(); }
    if (t > 1.2 && palBusy) { palBusy = false; palUI(); }
    const k = t < .25 ? 0 : Math.min(1, (t - .25) / .4), s2 = k ? 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2) : 0;
    if (s2 > 0) {
      const gr = g.createRadialGradient(cx, cy, 4, cx, cy, 120 * s2); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.globalAlpha = .75; g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 120 * s2, 0, TAU); g.fill(); g.globalAlpha = 1;
      if (pal.res.unit && CFG.UNITS[pal.res.unit]) drawUnitBig(g, pal.res.unit, cx, cy + 6, 3.4 * s2);      // 캐릭터는 인게임 모습 그대로
      else { g.font = `${100 * s2}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(pal.res.icon, cx, cy + 4); }
      g.fillStyle = '#fff';
      for (let i = 0; i < 8; i++) { const a = clock * .7 + i * TAU / 8, r = (88 + Math.sin(clock * 4 + i) * 8) * s2, sz = 5 + Math.abs(Math.sin(clock * 5 + i)) * 4; g.beginPath(); g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r - sz); g.lineTo(cx + Math.cos(a) * r + sz * .4, cy + Math.sin(a) * r); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r + sz); g.lineTo(cx + Math.cos(a) * r - sz * .4, cy + Math.sin(a) * r); g.closePath(); g.fill(); }
    }
  }
  for (const q of pal.parts) {                     // 물감 방울
    q.vy += 620 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
    if (q.life > 0) { g.globalAlpha = Math.min(1, q.life); g.fillStyle = q.c; g.beginPath(); g.arc(q.x, q.y, q.r * Math.min(1, q.life + .3), 0, TAU); g.fill(); }
  }
  pal.parts = pal.parts.filter(q => q.life > 0 && q.y < Hc + 20);
  for (const r of pal.rings) {                     // 충격파
    r.t += dt;
    if (r.t > 0) { g.globalAlpha = Math.max(0, 1 - r.t / .6); g.strokeStyle = r.c; g.lineWidth = 6 * (1 - r.t / .6) + 1; g.beginPath(); g.arc(r.x, r.y, r.t * 380, 0, TAU); g.stroke(); }
  }
  pal.rings = pal.rings.filter(r => r.t < .6);
  g.globalAlpha = 1;
  if (pal.flash > 0) { g.fillStyle = `rgba(255,255,255,${pal.flash * .85})`; g.fillRect(0, 0, Wc, Hc); pal.flash = Math.max(0, pal.flash - dt * 3); }
}