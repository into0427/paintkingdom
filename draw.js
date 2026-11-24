'use strict';
// ===== draw.js =====
// 게임 화면 그리기 — 캐릭터 그림, 페인트 칠, 금속 광택, 이펙트.
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['draw.js'] = '2026.11.24-1';

function renderPaint() {
  const d = img.data, o = S.owner, sh = SHINE.on, sw0 = (clock * 38) % (GW + GH * .6 + 60) - 30, tk = Math.floor(clock * 7) * 40503;
  for (let i = 0; i < o.length; i++) {
    const t = o[i], j = i * 4;
    if (!t) { d[j + 3] = 0; continue; }
    const c = COL[t];
    if (t === 1 && sh) {                           // 금속 광택: 결을 따라 일렁이고, 빛줄기가 대각선으로 쓸고 지나가고, 가끔 반짝여요
      const u = (i % GW) + ((i / GW) | 0) * .6, wave = .94 + .06 * Math.sin(u * .35 - clock * .8);
      const k = Math.min(1, Math.max(0, 1 - Math.abs(u - sw0) / 10) * .6 + ((((i * 2654435761) ^ tk) >>> 0) % 420 === 0 ? .5 : 0));
      d[j] = Math.min(255, c[0] * wave + (255 - c[0]) * k); d[j + 1] = Math.min(255, c[1] * wave + (255 - c[1]) * k); d[j + 2] = Math.min(255, c[2] * wave + (255 - c[2]) * k);
    } else { d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; }
    d[j + 3] = 200;
  }
  pctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(pcv, 0, 0, W, H);
}

function drawTitan(u, c) {
  const x = u.x, y = u.y, r = u.d.r, t = clock * 3 + u.seed;
  ctx.fillStyle = c; ctx.beginPath();              // 질퍽질퍽 출렁이는 몸
  for (let i = 0; i <= 32; i++) {
    const a = i / 32 * TAU, k = r * (1 + .07 * Math.sin(a * 3 + t) + .05 * Math.sin(a * 5 - t * 1.4));
    const px = x + Math.cos(a) * k, py = y + Math.sin(a) * k;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + r * .45, y + r + 2 + Math.sin(t) * 2, 3, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();   // 뚝뚝 떨어지는 물감
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(x - r * .5, y + r * .3, r * .16, r * .28, .5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#111';
  [-6, 6].forEach(o => { ctx.beginPath(); ctx.arc(x + o, y + 6, 2.2, 0, TAU); ctx.fill(); });
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 9, y + 1); ctx.lineTo(x - 3, y + 4); ctx.moveTo(x + 9, y + 1); ctx.lineTo(x + 3, y + 4); ctx.stroke();
  ctx.lineCap = 'round';                           // 바이킹 뿔
  [-1, 1].forEach(s => {
    ctx.beginPath(); ctx.moveTo(x + s * r * .85, y - 8); ctx.quadraticCurveTo(x + s * r * 1.35, y - 8, x + s * r * 1.3, y - r * 1.2);
    ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 4; ctx.stroke();
  });
  ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 2; ctx.lineCap = 'butt';   // 바이킹 투구
  ctx.fillStyle = '#9ca3af'; ctx.beginPath(); ctx.arc(x, y - 2, r * .92, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6b7280'; ctx.fillRect(x - r * .92, y - 6, r * 1.84, 4); ctx.strokeRect(x - r * .92, y - 6, r * 1.84, 4);
  ctx.lineCap = 'round';                           // 커다란 칼
  ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x + r * .8, y + r * .5); ctx.lineTo(x + r * 1.6, y - r * .8); ctx.stroke();
  ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = '#92400e'; ctx.beginPath(); ctx.moveTo(x + r * .7, y + r * .65); ctx.lineTo(x + r * .95, y + r * .25); ctx.stroke();
}

function drawChicken(u, c) {
  const x = u.x, y = u.y, r = u.d.r, w = Math.sin(clock * 18 + u.seed) * 2;
  ctx.fillStyle = '#ef4444';                       // 벼슬
  [[-4, 1], [0, -2], [4, 1]].forEach(p => { ctx.beginPath(); ctx.arc(x + p[0], y - r + p[1], 3.5, 0, TAU); ctx.fill(); ctx.stroke(); });
  ctx.fillStyle = c;                               // 파닥이는 날개
  ctx.beginPath(); ctx.ellipse(x - r - 1, y + 2 + w, 3, 5, -.4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + r + 1, y + 2 - w, 3, 5, .4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x - r * .35, y - r * .4, r * .28, r * .18, -.6, 0, TAU); ctx.fill();
  [-3.5, 3.5].forEach(o => {                       // 깜짝 놀란 눈
    ctx.fillStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + o, y - 2, 3.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x + o, y - 2, 1.1, 0, TAU); ctx.fill();
  });
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 6.5, y - 6.5); ctx.lineTo(x - 1.5, y - 8); ctx.moveTo(x + 6.5, y - 6.5); ctx.lineTo(x + 1.5, y - 8); ctx.stroke();
  ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.moveTo(x - 3.5, y + 2); ctx.lineTo(x + 3.5, y + 2); ctx.lineTo(x, y + 8); ctx.closePath(); ctx.fill(); ctx.stroke();   // 부리
  ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(x, y + 10, 2, 0, TAU); ctx.fill();
}

function drawFire(u, c) {
  const D = u.d, x = u.x, y = u.y, r = D.r, HALF = D.cone / 2 * Math.PI / 180;
  if (u.spray) {                                   // 분사 중인 부채꼴
    ctx.globalAlpha = .25; ctx.fillStyle = HEX[u.team];
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, D.range, u.face - HALF, u.face + HALF); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x - r * .35, y - r * .4, r * .28, r * .18, -.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#111';
  [-3.5, 3.5].forEach(o => { ctx.beginPath(); ctx.arc(x + o, y + 3, 1.7, 0, TAU); ctx.fill(); });
  ctx.save(); ctx.translate(x, y); ctx.rotate(u.face);   // 소화기 (바라보는 방향)
  ctx.fillStyle = '#dc2626'; ctx.fillRect(r - 3, -4, 9, 8); ctx.strokeRect(r - 3, -4, 9, 8);
  ctx.strokeStyle = '#374151'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r + 6, 0); ctx.lineTo(r + 13, 0); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(x, y - 1, r + 1, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();   // 소방관 모자
  ctx.fillRect(x - r - 3, y - 2, r * 2 + 6, 3); ctx.strokeRect(x - r - 3, y - 2, r * 2 + 6, 3);
  ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(x, y - r * .55, 2.6, 0, TAU); ctx.fill();
}

function drawCastle(u, c) {
  const x = u.x, y = u.y;
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(x - 16, y - 8, 32, 22); ctx.strokeRect(x - 16, y - 8, 32, 22);                       // 성벽
  [-16, -5, 6].forEach(o => { ctx.fillRect(x + o, y - 13, 10, 6); ctx.strokeRect(x + o, y - 13, 10, 6); });   // 성벽 위 총안
  ctx.fillStyle = u.hit > 0 ? '#fff' : c; ctx.fillRect(x - 16, y - 1, 32, 4);                      // 팀 색 띠
  ctx.fillStyle = '#4b5563'; ctx.fillRect(x - 5, y + 4, 10, 10); ctx.strokeRect(x - 5, y + 4, 10, 10);   // 성문
  ctx.beginPath(); ctx.moveTo(x, y - 13); ctx.lineTo(x, y - 27); ctx.stroke();                     // 깃발
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y - 27); ctx.lineTo(x + 13, y - 23); ctx.lineTo(x, y - 19); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawArma(u, c) {
  const x = u.x, y = u.y, r = u.d.r;
  if (u.shield > 0) { ctx.globalAlpha = .28; ctx.fillStyle = '#7dd3fc'; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  if (u.rs === 'roll') {                           // 몸을 돌돌 말고 구르는 중
    ctx.fillStyle = '#9ca3af'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    ctx.translate(x, y); ctx.rotate(clock * 22 + u.seed); ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 2;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 5, -r); ctx.lineTo(k * 5, r); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    return;
  }
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9ca3af'; ctx.beginPath(); ctx.arc(x, y - 2, r, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill(); ctx.stroke();   // 등껍질
  ctx.lineWidth = 1.2; [-4, 0, 4].forEach(o => { ctx.beginPath(); ctx.moveTo(x + o, y - 3); ctx.lineTo(x + o * 1.4, y - r); ctx.stroke(); });
  ctx.lineWidth = 2; ctx.fillStyle = c;
  [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(x + s * r * .7, y - r * .6, 3, 0, TAU); ctx.fill(); ctx.stroke(); });                 // 귀
  ctx.fillStyle = '#d6b3a1'; ctx.beginPath(); ctx.ellipse(x, y + 5, 4.5, 3.2, 0, 0, TAU); ctx.fill(); ctx.stroke();                       // 주둥이
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x, y + 4.5, 1, 0, TAU); ctx.fill();
  [-4, 4].forEach(o => { ctx.beginPath(); ctx.arc(x + o, y + 0, 1.6, 0, TAU); ctx.fill(); });
}

function drawFlower(u, c) {
  const x = u.x, y = u.y, r = u.d.r;
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x - r * .35, y - r * .4, r * .28, r * .18, -.6, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(253,164,175,.9)';          // 볼터치
  [-6.5, 6.5].forEach(o => { ctx.beginPath(); ctx.ellipse(x + o, y + 4, 2.6, 1.7, 0, 0, TAU); ctx.fill(); });
  ctx.fillStyle = '#111'; ctx.lineWidth = 1.2;
  [-3.5, 3.5].forEach(o => { ctx.beginPath(); ctx.arc(x + o, y + 1.5, 1.7, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + o, y - .2); ctx.lineTo(x + o * 1.7, y - 2); ctx.stroke(); });   // 눈, 속눈썹
  ctx.lineWidth = 1; ctx.fillStyle = '#f472b6';    // 머리의 분홍 꽃
  for (let k = 0; k < 5; k++) { const a = k * TAU / 5 - Math.PI / 2; ctx.beginPath(); ctx.arc(x + 5 + Math.cos(a) * 3.6, y - r + 1 + Math.sin(a) * 3.6, 3, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(x + 5, y - r + 1, 2.4, 0, TAU); ctx.fill(); ctx.stroke();
}

function drawAssassin(u, c) {
  const x = u.x, y = u.y, r = u.d.r;
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  ctx.fillStyle = '#111827'; ctx.fillRect(x - r, y - 7, r * 2, 4); ctx.fillRect(x - r, y + 2, r * 2, r);   // 머리띠, 복면
  ctx.restore();
  ctx.fillStyle = '#fff';
  [-3.5, 3.5].forEach(o => { ctx.beginPath(); ctx.ellipse(x + o, y - .5, 2.4, 1.6, 0, 0, TAU); ctx.fill(); });
  ctx.fillStyle = '#111'; [-3.5, 3.5].forEach(o => { ctx.beginPath(); ctx.arc(x + o, y - .5, .9, 0, TAU); ctx.fill(); });
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.lineCap = 'round'; ctx.strokeStyle = '#111827'; ctx.lineWidth = 3;   // 펄럭이는 머리띠 끈
  const f = Math.sin(clock * 9 + u.seed) * 2;
  ctx.beginPath(); ctx.moveTo(x - r + 1, y - 5); ctx.lineTo(x - r - 7, y - 9 + f); ctx.moveTo(x - r + 1, y - 5); ctx.lineTo(x - r - 8, y - 3 - f); ctx.stroke();
  ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + r - 2, y + 4); ctx.lineTo(x + r + 8, y - 6); ctx.stroke();   // 쿠나이
  ctx.strokeStyle = '#111827'; ctx.beginPath(); ctx.moveTo(x + r - 3, y + 5); ctx.lineTo(x + r, y + 2); ctx.stroke();
}

function drawWitch(u, c) {
  const x = u.x, y = u.y - 3 + Math.sin(clock * 5 + u.seed) * 1.5, r = u.d.r;
  ctx.lineCap = 'round';                           // 빗자루
  ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x - r - 4, y + r - 1); ctx.lineTo(x + r + 8, y + r - 3); ctx.stroke();
  ctx.fillStyle = '#eab308'; ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x - r - 3, y + r - 1); ctx.lineTo(x - r - 14, y + r - 6); ctx.lineTo(x - r - 14, y + r + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineCap = 'butt'; ctx.lineWidth = 2;
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x - r * .35, y - r * .1, r * .25, r * .16, -.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#111'; [-3.5, 3.5].forEach(o => { ctx.beginPath(); ctx.arc(x + o, y + 3, 1.7, 0, TAU); ctx.fill(); });
  ctx.fillStyle = '#4c1d95';                       // 마녀 모자
  ctx.beginPath(); ctx.ellipse(x, y - r * .55, r + 5, 3.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - r * .65, y - r * .55); ctx.lineTo(x + 3, y - r - 15); ctx.lineTo(x + r * .65, y - r * .55); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#facc15'; ctx.fillRect(x - r * .5, y - r * .55 - 4, r, 3);
}

function drawMage(u, c) {
  const x = u.x, y = u.y, r = u.d.r;
  ctx.lineCap = 'round'; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 3;   // 번개 지팡이
  ctx.beginPath(); ctx.moveTo(x + r + 4, y + r + 6); ctx.lineTo(x + r + 4, y - r + 1); ctx.stroke();
  ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x + r + 8, y - r - 11); ctx.lineTo(x + r + 1, y - r - 2); ctx.lineTo(x + r + 5, y - r - 2);
  ctx.lineTo(x + r + 1, y - r + 7); ctx.lineTo(x + r + 10, y - r - 4); ctx.lineTo(x + r + 6, y - r - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineCap = 'butt'; ctx.lineWidth = 2;
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x - r * .35, y - r * .4, r * .28, r * .18, -.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#111'; [-3.5, 3.5].forEach(o => { ctx.beginPath(); ctx.arc(x + o, y - 1, 1.7, 0, TAU); ctx.fill(); });
  ctx.fillStyle = '#f9fafb'; ctx.lineWidth = 1;    // 덥수룩한 눈썹
  [-3.5, 3.5].forEach(o => { ctx.beginPath(); ctx.ellipse(x + o, y - 4.5, 3.2, 1.5, 0, 0, TAU); ctx.fill(); ctx.stroke(); });
  ctx.lineWidth = 2;                               // 희고 긴 수염
  ctx.beginPath(); ctx.moveTo(x - r + 2, y + 2); ctx.quadraticCurveTo(x - 6, y + r + 4, x, y + r + 12);
  ctx.quadraticCurveTo(x + 6, y + r + 4, x + r - 2, y + 2); ctx.quadraticCurveTo(x, y + 6, x - r + 2, y + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawUnit(u) {
  const D = u.d, x = u.x, y = u.y, r = D.r, c = u.hit > 0 ? '#ffffff' : HEX[u.team];
  ctx.save();
  ctx.lineWidth = 2; ctx.strokeStyle = '#1b1f3b';
  if (u.type === 'titan') drawTitan(u, c);
  else if (u.type === 'chicken') drawChicken(u, c);
  else if (u.type === 'fire') drawFire(u, c);
  else if (u.type === 'assassin') drawAssassin(u, c);
  else if (u.type === 'witch') drawWitch(u, c);
  else if (u.type === 'mage') drawMage(u, c);
  else if (u.type === 'castle') drawCastle(u, c);
  else if (u.type === 'arma') drawArma(u, c);
  else if (u.type === 'flower') drawFlower(u, c);
  else if (u.type === 'minion') drawMinion(u, c);
  else if (u.type === 'egg') drawEgg(u, c);
  else if (u.type === 'launcher') {
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x - r, y + 2, r * 2, 7); ctx.strokeRect(x - r, y + 2, r * 2, 7);
    ctx.fillStyle = '#4b5563';
    [-8, 8].forEach(o => { ctx.beginPath(); ctx.arc(x + o, y + 11, 4, 0, TAU); ctx.fill(); ctx.stroke(); });
    ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 8, y + 3); ctx.lineTo(x + 8, y - 12); ctx.stroke();
    ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 2; ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(x + 9, y - 13, 5, 0, TAU); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x - r * .35, y - r * .4, r * .28, r * .18, -.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#111';
    [-3.5, 3.5].forEach(o => { ctx.beginPath(); ctx.arc(x + o, y + 3, 1.7, 0, TAU); ctx.fill(); });
    if (u.type === 'knight') {
      ctx.fillStyle = u.elite ? '#fbbf24' : '#9ca3af'; ctx.beginPath(); ctx.arc(x, y - 1, r + 1, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + r, y + 1); ctx.lineTo(x + r + 9, y - 9); ctx.stroke();
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + r - 2, y + 4); ctx.lineTo(x + r + 1, y); ctx.stroke();
      if (u.elite) {                               // 근위 기사: 금빛 투구 + 붉은 깃털 + 금테
        ctx.fillStyle = '#dc2626'; ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x - 1, y - r - 1); ctx.quadraticCurveTo(x - 9, y - r - 12, x + 1, y - r - 16); ctx.quadraticCurveTo(x + 8, y - r - 8, x + 3, y - r - 1); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r + 2, .25, Math.PI - .25); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x + r - 1, y, 9, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + r - 1, y - 9); ctx.lineTo(x + r - 1, y + 9); ctx.stroke();
    }
  }
  if (SHINE.on && u.team === 1 && !u.nobar) shineUnit(u, x, y, r);
  if (u.inv > 0 && (u.inv > 1 || Math.sin(clock * 30) > 0)) {      // 무적 보호막 (끝나기 1초 전부터 깜빡임)
    ctx.globalAlpha = .3; ctx.fillStyle = '#7dd3fc'; ctx.beginPath(); ctx.arc(x, y, r + 6, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.stroke();
  }
  if (u.cursed) { ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, TAU); ctx.stroke(); }   // 저주 표시
  if (u.stun > 0) {                                // 경직 표시 (머리 위에 빙글빙글)
    ctx.fillStyle = '#facc15';
    for (let k = 0; k < 3; k++) { const a = clock * 8 + k * TAU / 3; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 8, y - r - 15 + Math.sin(a) * 3, 2, 0, TAU); ctx.fill(); }
  }
  if (u.nobar) { ctx.restore(); return; }          // 홈 화면 장식용 캐릭터는 체력바 없음
  const bw = Math.max(26, r * 2), by = y - r - 9;                    // 체력바
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x - bw / 2, by, bw, 4);
  ctx.fillStyle = '#22c55e'; ctx.fillRect(x - bw / 2, by, bw * Math.max(0, u.hp / u.max), 4);
  if (u.shield > 0) { ctx.fillStyle = '#38bdf8'; ctx.fillRect(x - bw / 2, by - 5, bw * Math.min(1, u.shield / (u.shMax || 1)), 4); }   // 쉴드바
  ctx.restore();
}

function draw() {
  ctx.fillStyle = '#fbfbf8'; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .06; ctx.fillStyle = HEX[2]; ctx.fillRect(0, 0, W, MID);
  ctx.fillStyle = HEX[1]; ctx.fillRect(0, MID, W, MID); ctx.globalAlpha = 1;
  renderPaint();

  for (const z of S.zones) {                       // 저주 장판
    const a = Math.min(1, z.t);
    ctx.globalAlpha = .35 * a; ctx.fillStyle = '#7c3aed';
    ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill();
    ctx.globalAlpha = .8 * a; ctx.strokeStyle = '#4c1d95'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -clock * 12;
    ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0; ctx.globalAlpha = 1;
  }

  ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(27,31,59,.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, MID); ctx.lineTo(W, MID); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = '14px "Jua", sans-serif'; ctx.textAlign = 'left'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#1b1f3b';   // 닉네임 표시
  ctx.fillStyle = HEX[2]; if (S.phase !== 'prep') { const fl = S.event ? '⚡ ' + FOE_NAME : FOE_NAME; ctx.strokeText(fl, 8, MID - 8); ctx.fillText(fl, 8, MID - 8); }
  ctx.fillStyle = HEX[1]; ctx.strokeText(NICK, 8, MID + 20); ctx.fillText(NICK, 8, MID + 20);

  const list = S.units.filter(u => S.phase !== 'prep' || u.team === 1).sort((a, b) => a.y - b.y);
  for (const u of list) drawUnit(u);

  for (const s of S.shots) {
    if (s.k === 'orb') {
      ctx.fillStyle = '#a855f7'; ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(s.x - 2, s.y - 2, 1.8, 0, TAU); ctx.fill();
    } else if (s.k === 'seed') {
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 5, 2.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f472b6'; ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y - s.z, 5, 0, TAU); ctx.fill(); ctx.stroke();
    } else if (s.k === 'arrow' || s.k === 'parrow') {
      ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(s.x - Math.cos(s.a) * 9, s.y - Math.sin(s.a) * 9); ctx.lineTo(s.x, s.y); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 6, 3, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = HEX[s.team]; ctx.strokeStyle = '#1b1f3b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y - s.z, 7, 0, TAU); ctx.fill(); ctx.stroke();
    }
  }
  for (const f of S.fx) {
    ctx.globalAlpha = 1 - f.t / (f.life || .35); ctx.strokeStyle = HEX[f.team]; ctx.lineWidth = 3;
    if (f.blossom) {                               // 만개: 작은 꽃 여러 송이가 한꺼번에 활짝
      const k = Math.min(1, f.t / .2);
      for (const q of f.pts) {
        const bx = f.x + q[0], by = f.y + q[1], rr = q[2] * k;
        ctx.fillStyle = '#f472b6'; ctx.lineWidth = 1;
        for (let j = 0; j < 5; j++) { const a = j * TAU / 5 + f.t * 2; ctx.beginPath(); ctx.arc(bx + Math.cos(a) * rr * .6, by + Math.sin(a) * rr * .6, rr * .45, 0, TAU); ctx.fill(); ctx.stroke(); }
        ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(bx, by, rr * .35, 0, TAU); ctx.fill();
      }
    } else if (f.flower) {                                // 꽃순이의 꽃 이펙트
      ctx.fillStyle = '#f9a8d4'; ctx.lineWidth = 1.5;
      for (let k = 0; k < 6; k++) {
        const a = k * TAU / 6 + f.t * 3, q = f.r * (.4 + f.t * 2.4);
        ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * q, f.y + Math.sin(a) * q, 8, 0, TAU); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, TAU); ctx.fill(); ctx.stroke();
    } else { ctx.beginPath(); ctx.arc(f.x, f.y, (f.r || CFG.UNITS.launcher.boom) * (1 + f.t * 4), 0, TAU); ctx.stroke(); }
    if (f.bolt) {                                  // 마법사의 번개
      ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(f.x, f.y - 140);
      for (let k = 1; k < 8; k++) ctx.lineTo(f.x + (Math.random() - .5) * 24, f.y - 140 + k * 17.5);
      ctx.lineTo(f.x, f.y);
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (S.phase === 'prep') {                         // 준비 중에는 상대 진영이 가려짐
    ctx.fillStyle = 'rgba(27,31,59,.88)'; ctx.fillRect(0, 0, W, MID);
    ctx.fillStyle = '#fff'; ctx.font = '18px "Jua", sans-serif'; ctx.textAlign = 'center';
    if (S.event) {                                     // 특별 지휘관은 전투 전에 안내 (이름과 덱은 비밀)
      ctx.fillStyle = '#ffd84d'; ctx.fillText('⚡ 특별 지휘관 등장!', W / 2, MID / 2 - 24);
      ctx.fillStyle = '#fff'; ctx.font = '14px "Jua", sans-serif';
      ctx.fillText(S.event.desc, W / 2, MID / 2 + 2); ctx.fillText(`이기면 팔레트 +${S.event.pal}`, W / 2, MID / 2 + 24);
    } else ctx.fillText('❓ 상대 진영 (비공개)', W / 2, MID / 2 + 6);
  }
}

const SHINE = { on: false };                       // 금속 색상(골드·실버 등)이면 칠해진 땅과 캐릭터에 광택 효과

function drawEgg(u, c) {                           // 런치킨의 알
  const x = u.x, y = u.y;
  ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.ellipse(x, y, 5.5, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = c;
  [[-2, -2], [2, 1], [-1, 3]].forEach(q => { ctx.beginPath(); ctx.arc(x + q[0], y + q[1], 1.3, 0, TAU); ctx.fill(); });
}

function drawMinion(u, c) {                        // 졸병: 눈알 달린 페인트볼
  const x = u.x, y = u.y, r = u.d.r, lk = Math.sin(clock * 3 + u.seed) * .7;
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x - r * .4, y - r * .5, r * .28, r * .18, -.6, 0, TAU); ctx.fill();
  [-3.2, 3.2].forEach(o => {
    ctx.fillStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x + o, y + 1, 3.4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x + o + lk, y + 1.5, 1.4, 0, TAU); ctx.fill();
  });
}

function drawUnitBig(g, type, x, y, sc) {          // 인게임 캐릭터 모습을 다른 캔버스(g)에 크게/작게 그리기
  const d = CFG.UNITS[type]; if (!d) return;
  const old = ctx, k = 12 / Math.max(12, d.r);
  ctx = g; g.save(); g.translate(x, y); g.scale(sc * k, sc * k);
  try { drawUnit({ team: 1, type, d, x: 0, y: 0, hp: d.hp, max: d.hp, shield: 0, inv: 0, hit: 0, stun: 0, rs: 'walk', spray: false, nobar: true, seed: 1, face: -.3 }); }
  finally { g.restore(); ctx = old; }
}

function mkIcon(type, px) {                        // 버튼/카드에 넣는 작은 캐릭터 그림
  const c = document.createElement('canvas'), n = px * 2;
  c.width = c.height = n; c.style.width = c.style.height = px + 'px';
  drawUnitBig(c.getContext('2d'), type, n / 2, n / 2 + n * .06, n / 46);
  return c;
}

function shineUnit(u, x, y, r) {                   // 금속 색상: 몸통 위로 빛이 스치고 가끔 별 모양으로 반짝여요
  const sd = u.seed || 0, ph = (clock * .8 + sd) % 2.6;
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  if (ph < .7) { ctx.translate(x, y); ctx.rotate(-.6); const px = -r * 1.6 + (ph / .7) * r * 3.2; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(px - r * .18, -r * 1.6, r * .36, r * 3.2); }
  ctx.restore();
  const sp = (clock * .9 + sd * 1.7) % 3;
  if (sp < .4) {
    const k = 1 - Math.abs(sp - .2) / .2, s = r * .5 * k, sx = x - r * .35, sy = y - r * .55;
    ctx.fillStyle = '#fff'; ctx.beginPath();
    ctx.moveTo(sx, sy - s); ctx.lineTo(sx + s * .25, sy - s * .25); ctx.lineTo(sx + s, sy); ctx.lineTo(sx + s * .25, sy + s * .25);
    ctx.lineTo(sx, sy + s); ctx.lineTo(sx - s * .25, sy + s * .25); ctx.lineTo(sx - s, sy); ctx.lineTo(sx - s * .25, sy - s * .25); ctx.closePath(); ctx.fill();
  }
}