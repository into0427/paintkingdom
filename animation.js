'use strict';
// ===== animations.js =====
// 움직이는 연출 — 홈 화면 배경, 로딩 화면(팁 포함), 결과 화면 1(점유율 애니메이션).
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['animations.js'] = '2026.11.24-1';

const BLOBS = [];

(function () {
  const pal = ['#2f6bff', '#ff3d6e', '#ffd84d', '#34d399', '#a855f7'], rnd = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < 26; i++) {
    const left = i % 2 === 0, mix = Math.random() < .25;
    BLOBS.push({ fx: left ? rnd(-.05, .55) : rnd(.45, 1.05), fy: rnd(0, 1), r: rnd(22, 70), ph: rnd(0, 6.28), a: rnd(.55, .9),
                 c: pal[2 + i % 3], left, mix });
  }
})();

const CAST = [[1, 'titan', 50, 0], [1, 'archer', 84, -38], [1, 'knight', 112, 10], [1, 'flower', 158, 4],
              [2, 'mage', 204, 4], [2, 'assassin', 252, 10], [2, 'fire', 292, -38], [2, 'witch', 320, 6]];

function drawHome() {
  const hc = $('hcv'), Hh = $('wrap').offsetHeight || 770;
  if (hc.height !== Hh) { hc.width = 360; hc.height = Hh; }
  const hx = hc.getContext('2d');
  hx.fillStyle = '#fbfbf8'; hx.fillRect(0, 0, 360, Hh);
  for (const b of BLOBS) {
    const cx = b.fx * 360, cy = b.fy * Hh;
    hx.globalAlpha = b.a; hx.fillStyle = b.mix ? b.c : (b.left ? HEX[1] : HEX[2]); hx.beginPath();
    for (let i = 0; i <= 28; i++) {
      const a = i / 28 * TAU, k = b.r * (1 + .09 * Math.sin(a * 3 + clock * 1.2 + b.ph) + .06 * Math.sin(a * 5 - clock + b.ph));
      if (i) hx.lineTo(cx + Math.cos(a) * k, cy + Math.sin(a) * k); else hx.moveTo(cx + Math.cos(a) * k, cy + Math.sin(a) * k);
    }
    hx.closePath(); hx.fill();
    for (let j = 0; j < 3; j++) { const a = b.ph + j * 2.1; hx.beginPath(); hx.arc(cx + Math.cos(a) * b.r * 1.35, cy + Math.sin(a) * b.r * 1.35, b.r * .12, 0, TAU); hx.fill(); }
  }
  hx.globalAlpha = 1;
  const g = hx.createRadialGradient(180, 150, 10, 180, 150, 200);     // 로고 뒤에 은은한 흰 빛
  g.addColorStop(0, 'rgba(255,255,255,.88)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  hx.fillStyle = g; hx.fillRect(0, 0, 360, Hh);
  ctx = hx;
  try {
    CAST.forEach((c, i) => {
      const d = CFG.UNITS[c[1]]; if (!d) return;
      drawUnit({ team: c[0], type: c[1], d, x: c[2], y: Hh - 62 + c[3] + Math.sin(clock * 3 + i) * 3, hp: d.hp, max: d.hp,
                 shield: 0, inv: 0, hit: 0, stun: 0, rs: 'walk', spray: false, nobar: true, seed: i * 1.7, face: c[0] === 1 ? -.3 : Math.PI + .3 });
    });
  } finally { ctx = gctx; }
}

const TIPS = [
  '타이탄과 아르마딜로는 맨 앞에 두는 게 좋아요.', '런치킨은 후방에 두면 오래 살아서 더 많이 칠해요.', '남은 코인은 전투가 시작되면 사라져요. 준비 시간에 다 쓰세요!',
  '페인트런처는 모든 원거리 캐릭터의 천적이에요.', '캐슬은 중앙에 두면 가장 효율이 좋아요.', '전투 중에 소환한 캐릭터는 잠깐 무적이에요.',
  '점유율은 전투가 끝났을 때만 계산돼요. 후반에 칠하는 게 중요해요!', '같은 곳을 다시 칠하면 나중에 칠한 색이 남아요.', '소방관은 뭉쳐서 오는 기사에게 강해요.',
  '마법사는 타이탄의 천적이에요.', '꽃순이는 튼튼한 탱커 뒤에 있으면 훨씬 강해요.', '아르마딜로는 혼자보다 여럿이 뭉칠 때 강해요.',
  '궁수가 서넛 모이면 웬만한 상대에게 지지 않아요.', '마녀의 저주 장판 안에서는 적이 느려지고 둔해져요.', '팔레트에서 같은 캐릭터가 또 나오면 증강권이 돼요.',
  '미션은 칸마다 하루에 한 번 바꿀 수 있어요.', '통솔력이 오르면 AI 지휘관도 점점 똑똑해져요.', '후반에는 즉각 승부를 내는 카드가 유리해요.',
  '암살자는 적의 원거리 유닛을 노려요.', '전투 중 코인은 후반으로 갈수록 빨리 모여요.', '백업 코드는 ⚙️ 설정에서 만들 수 있어요.', '전투 전에는 상대 지휘관이 누군지 알 수 없어요. 방심하지 마세요!'
];

const LD = { on: false, t: 0, dur: 1.2, blobs: [], cb: null, hold: 0, done: false };

const LD_COLS = ['#ff3d6e', '#2f6bff', '#ffd84d', '#34d399', '#a855f7', '#ff8a1f', '#14b8a6', '#f472b6'];

function loadScreen(cb, dur) {                     // cb는 화면이 페인트로 완전히 덮였을 때 실행돼요
  LD.on = true; LD.t = 0; LD.hold = 0; LD.done = false; LD.dur = dur || 1.2; LD.blobs = []; LD.cb = cb || null;
  $('ldTip').textContent = '💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)];
  const l = $('loading'); l.style.opacity = 1; l.hidden = false;
}

function drawLoading(dt) {
  const cvs = $('ldCv'), g = cvs.getContext('2d'), Wc = cvs.width, Hc = cvs.height;
  LD.t += dt;
  const k = Math.min(1, LD.t / LD.dur), p = k * k * (3 - 2 * k), want = Math.floor(p * 80);
  while (LD.blobs.length < want) {
    LD.blobs.push({ x: Math.random() * Wc, y: Math.random() * Hc, r: 0, max: 50 + Math.random() * 70, c: LD_COLS[Math.floor(Math.random() * LD_COLS.length)],
                    ph: Math.random() * 6, len: 0, dmax: 30 + Math.random() * 200, w: 5 + Math.random() * 8, sp: 40 + Math.random() * 70 });
  }
  g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, Wc, Hc);
  for (const b of LD.blobs) {
    b.r += (b.max - b.r) * Math.min(1, dt * 7); b.len = Math.min(b.dmax, b.len + b.sp * dt);
    g.fillStyle = b.c; g.beginPath();
    for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU, rr = b.r * (1 + .08 * Math.sin(a * 4 + b.ph + clock * 2)), px = b.x + Math.cos(a) * rr, py = b.y + Math.sin(a) * rr; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    g.closePath(); g.fill();
    g.fillRect(b.x - b.w / 2, b.y, b.w, b.len);                       // 흘러내리는 페인트
    g.beginPath(); g.arc(b.x, b.y + b.len, b.w / 2 + 1, 0, TAU); g.fill();
  }
  const pc = Math.floor(p * 100) + '%';
  $('ldFill').style.width = pc; $('ldPct').textContent = pc;
  if (k >= 1) {
    LD.hold += dt;
    if (LD.hold > .2 && !LD.done) {
      LD.done = true;
      if (LD.cb) { const f = LD.cb; LD.cb = null; f(); }
      $('loading').style.opacity = 0;
      setTimeout(() => { $('loading').hidden = true; LD.on = false; }, 380);
    }
  }
}

const R1 = { on: false, t: 0, pa: 0, pb: 0, win: 0, end: 4.2, parts: [], burst: false };

function startRes1(a, b) {
  const tot = S.owner.length || 1;
  Object.assign(R1, { on: true, t: 0, pa: a / tot * 100, pb: b / tot * 100, win: a > b ? 1 : a < b ? -1 : 0, parts: [], burst: false });
  $('res1').hidden = false;
}

function finishRes1() { R1.on = false; $('res1').hidden = true; $('over').hidden = false; }

function rrect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}

function drawRes1(dt) {
  const cvs = $('r1cv'), g = cvs.getContext('2d'), Wc = cvs.width, Hc = cvs.height;
  R1.t += dt;
  if (R1.t > R1.end + 1.2) { finishRes1(); return; }
  const t = R1.t, m = Math.min(R1.pa, R1.pb), hi = Math.max(R1.pa, R1.pb), scale = Math.max(50, Math.ceil((hi + 5) / 10) * 10);
  const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 2.2);
  const t1 = 1.8, t2 = 2.3, t3 = 3.0;
  const base = t < t1 ? m * ease(t / t1) : m, f2 = t < t2 ? 0 : ease((t - t2) / (t3 - t2));      // 둘 다 낮은 쪽까지 → 잠깐 멈춤 → 이긴 쪽만 마저 차오름
  const va = base + (R1.pa - m) * f2, vb = base + (R1.pb - m) * f2;
  g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, Wc, Hc);
  const TX = [45, 195], TW = 120, TT = 170, TB = 650, TH = TB - TT, cols = [HEX[1], HEX[2]], vals = [va, vb], names = [NICK, (S.event ? '⚡ ' : '') + FOE_NAME];
  g.textAlign = 'center'; g.lineJoin = 'round';
  for (let i = 0; i < 2; i++) {
    const x = TX[i], h = vals[i] / scale * TH, top = TB - h;
    g.save(); rrect(g, x, TT, TW, TH, 18); g.clip();                    // 유리 탱크 안의 페인트
    g.fillStyle = 'rgba(27,31,59,.06)'; g.fillRect(x, TT, TW, TH);
    g.fillStyle = cols[i]; g.beginPath(); g.moveTo(x, TB);
    for (let px = 0; px <= TW; px += 6) g.lineTo(x + px, top + Math.sin(px * .08 + clock * 4 + i * 2) * 4);
    g.lineTo(x + TW, TB); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 12, TT + 14, 8, TH - 28);
    g.restore();
    g.strokeStyle = '#1b1f3b'; g.lineWidth = 5; rrect(g, x, TT, TW, TH, 18); g.stroke();
    g.font = '34px "Jua", sans-serif'; g.lineWidth = 6; g.strokeStyle = '#fbfbf8'; g.fillStyle = '#1b1f3b';
    g.strokeText(vals[i].toFixed(1) + '%', x + TW / 2, TT - 14); g.fillText(vals[i].toFixed(1) + '%', x + TW / 2, TT - 14);
    g.font = '16px "Jua", sans-serif'; g.fillStyle = cols[i]; g.lineWidth = 4; g.strokeStyle = '#1b1f3b';
    g.strokeText(names[i], x + TW / 2, TB + 30, TW); g.fillText(names[i], x + TW / 2, TB + 30, TW);
  }
  if (t >= t3 && !R1.burst) {                      // 이긴 쪽이 다 차오르는 순간: 페인트가 사방으로 튀어요
    R1.burst = true;
    const wi = R1.win >= 0 ? 0 : 1, wx = TX[wi] + TW / 2, wy = TB - (hi / scale) * TH, cc = R1.win === 0 ? ['#ffd84d', cols[0], cols[1]] : [cols[wi], '#ffd84d', '#ffffff'];
    for (let n = 0; n < (R1.win === 0 ? 30 : 70); n++) { const a = -Math.PI / 2 + (Math.random() - .5) * 2.4, sp = 140 + Math.random() * 300; R1.parts.push({ x: wx, y: wy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 3 + Math.random() * 6, c: cc[n % cc.length], life: 1.2 + Math.random() * .6 }); }
  }
  if (R1.win > 0 && t > t3 && t < t3 + 1.2) for (let n = 0; n < 2; n++) R1.parts.push({ x: Math.random() * Wc, y: -10, vx: (Math.random() - .5) * 60, vy: 80 + Math.random() * 120, r: 3 + Math.random() * 4, c: LD_COLS[Math.floor(Math.random() * LD_COLS.length)], life: 2 });
  for (const q of R1.parts) { q.vy += 520 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; if (q.life > 0) { g.globalAlpha = Math.min(1, q.life); g.fillStyle = q.c; g.beginPath(); g.arc(q.x, q.y, q.r, 0, TAU); g.fill(); } }
  R1.parts = R1.parts.filter(q => q.life > 0); g.globalAlpha = 1;
  if (t < t3) { g.font = '44px "Jua", sans-serif'; g.lineWidth = 8; g.strokeStyle = '#fbfbf8'; g.fillStyle = '#1b1f3b'; g.strokeText('점유율', Wc / 2, 90); g.fillText('점유율', Wc / 2, 90); }
  else {                                           // 승리! / 패배… / 무승부
    const k = Math.min(1, (t - t3) / .35), sc = 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2);
    const txt = R1.win > 0 ? '승리!' : R1.win < 0 ? '패배…' : '무승부';
    g.save(); g.translate(Wc / 2, 92); g.scale(sc, sc);
    g.font = '72px "Jua", sans-serif'; g.lineWidth = 12; g.strokeStyle = '#1b1f3b'; g.fillStyle = R1.win > 0 ? '#ffd84d' : R1.win < 0 ? '#9aa3c7' : '#ffffff';
    g.strokeText(txt, 0, 0); g.fillText(txt, 0, 0); g.restore();
  }
  if (t > 1) { g.font = '13px "Jua", sans-serif'; g.fillStyle = 'rgba(27,31,59,.5)'; g.fillText('화면을 터치하면 넘어가요', Wc / 2, Hc - 24); }
}