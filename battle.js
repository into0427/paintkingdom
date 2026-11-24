'use strict';
// ===== battle.js =====
// 전투 계산 — 소환, 피해, 캐릭터별 행동(기사·궁수·런처 등), 투사체, 게임 시작/종료.
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['battle.js'] = '2026.11.24-1';

function newGame(real) {
  S = { phase: 'prep', t: CFG.PREP, coin: [CFG.START_COIN, CFG.START_COIN],
        units: [], shots: [], fx: [], zones: [], timers: [], stats: { summoned: {}, prepTypes: {}, battleSummons: 0, deaths: {}, kills: {}, killsTotal: 0, prepLeft: 0 }, aiPool: unlockedPool(SAVE.maxPower), aiAugs: {}, owner: new Uint8Array(GW * GH), incomeT: 0, drag: null };
  S.event = real ? rollEvent() : null;               // 특별 지휘관 등장 여부 (진짜 게임을 시작할 때만 판정)
  S.cmd = pickCommander(); S.acc = aiAcc(S.cmd); FOE_NAME = S.cmd.name; aiPrep();   // AI 지휘관이 덱을 정하고 배치
  $('over').hidden = true;
}

function startBattle() {
  if (S.phase !== 'prep') return;
  S.phase = 'battle'; S.t = CFG.BATTLE; S.drag = null;
  S.stats.prepLeft = S.coin[0]; S.coin = [0, 0]; S.incomeT = 0; titanGuard();                  // 못 쓴 코인은 사라지고, 전투는 0코인에서 시작
}

function endBattle() {
  S.phase = 'over';
  let a = 0, b = 0;
  for (const t of S.owner) { if (t === 1) a++; else if (t === 2) b++; }
  const tot = S.owner.length;
  $('title').textContent = a > b ? '🎉 승리!' : a < b ? '😢 패배' : '🤝 무승부';
  $('result').innerHTML = `${esc(NICK)} <b>${(a / tot * 100).toFixed(1)}%</b><br>${S.event ? '⚡ ' : ''}${FOE_NAME} <b>${(b / tot * 100).toFixed(1)}%</b>`;
  showOutcome(a, b);
  startRes1(a, b);                                 // 결과 화면 1(점유율 애니메이션) 다음에 결과 화면 2가 나와요
}

function spawn(team, type, x, y, free, mods) {    // free = 소환 카드가 아닌 소환(캐슬/졸병), mods = 능력치 배율
  let d = CFG.UNITS[type] || EXTRA[type];
  if (mods) { d = Object.assign({}, d); d.hp = Math.round(d.hp * (mods.hp || 1)); d.atk *= mods.atk || 1; d.spd *= mods.spd || 1; }
  const u = { team, type, d, x, y, hp: d.hp, max: d.hp, cd: 0, hit: 0,
    face: team === 1 ? -Math.PI / 2 : Math.PI / 2, turn: 0, wx: x, wy: y, wt: 0, acc: 0, spray: false, born: S.phase,
    card: team === 1 && !free, nobar: !!d.nobar, elite: !!(mods && mods.elite), shield: d.shield || 0, shMax: d.shield || 0, inv: (S.phase === 'battle' && !free) ? CFG.SPAWN_SHIELD : 0, rs: 'walk', hits: [], seed: Math.random() * TAU };
  if (!free) applyAug(u, team === 1 ? undefined : (S.aiAugs || {})[type]);   // 내 소환 카드는 해금한 증강, AI는 랜덤 증강이 자동 적용
  S.units.push(u);
}

function pickSpot(team, type, yMin, yMax) {
  const r = CFG.UNITS[type].r; let x, y;
  for (let i = 0; i < 25; i++) {
    x = r + Math.random() * (W - 2 * r);
    y = Math.min(H - r, Math.max(r, yMin + Math.random() * (yMax - yMin)));
    if (!S.units.some(u => u.team === team && Math.hypot(u.x - x, u.y - y) < r + u.d.r + 4)) break;
  }
  return [x, y];
}

function buy(type) {
  const d = CFG.UNITS[type];
  if (S.phase === 'over' || S.coin[0] < d.cost) return;
  S.coin[0] -= d.cost;
  { const st = S.stats; st.summoned[type] = (st.summoned[type] || 0) + 1; if (S.phase === 'battle') st.battleSummons++; else st.prepTypes[type] = 1; }
  const [x, y] = S.phase === 'prep' ? pickSpot(1, type, MID + 24, H - 20) : pickSpot(1, type, H - 40, H - 18);
  spawn(1, type, x, y);
}

function paint(x, y, r, team) {
  const cx = x / CELL, cy = y / CELL, cr = r / CELL;
  const x0 = Math.max(0, Math.floor(cx - cr)), x1 = Math.min(GW - 1, Math.ceil(cx + cr));
  const y0 = Math.max(0, Math.floor(cy - cr)), y1 = Math.min(GH - 1, Math.ceil(cy + cr));
  for (let yy = y0; yy <= y1; yy++)
    for (let xx = x0; xx <= x1; xx++)
      if ((xx + .5 - cx) ** 2 + (yy + .5 - cy) ** 2 <= cr * cr) S.owner[yy * GW + xx] = team;
}

function near(u) {
  let b = null, bd = 1e9;
  for (const e of S.units) {
    if (e.team === u.team || e.hp <= 0) continue;
    if (e.inv > 0) continue;                       // 무적인 캐릭터는 타겟에서 제외
    const d = Math.hypot(e.x - u.x, e.y - u.y);
    if (d < bd) { bd = d; b = e; }
  }
  return [b, bd];
}

function moveTo(u, tx, ty, dt, sp) {
  const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy) || 1;
  const s = Math.min((sp || u.d.spd) * CFG.SPEED_SCALE * (u.cursed ? CFG.CURSE_MOVE : 1) * (u.spdMul || 1) * (u.slowT > 0 ? .8 : 1) * dt, d);
  u.x += dx / d * s; u.y += dy / d * s;
}

const forward = (u, dt) => moveTo(u, u.x, u.team === 1 ? 0 : H, dt);

function calcDmg(e, dmg, ranged) {                 // 받는 피해 보정 (원거리 저항, 저주 장판 증폭)
  let m = 1;
  if (ranged && e.rr) m *= e.rr;
  if (e.amp) m *= 1 + e.amp;
  return dmg * m;
}

function hurt(e, dmg, ranged, src, noRef) {        // 무적이면 무시, 쉴드가 있으면 쉴드만 깎임(남는 피해는 버려짐)
  if (e.inv > 0) return;
  dmg = calcDmg(e, dmg, ranged);
  e.hit = .12;
  if (src) e.lastHit = src;
  if (e.shield > 0) {
    if (e.shLeak) { const ab = Math.min(e.shield, dmg); e.shield -= ab; e.hp -= dmg - ab; }   // 마법 방패: 막아준 만큼만 흡수, 남는 피해는 본체로
    else e.shield -= dmg;
  } else e.hp -= dmg;
  if (e.thorn && src && !noRef && src.hp > 0) hurt(src, dmg * e.thorn, false, null, true);      // 가시: 받은 피해의 일부를 돌려줌
  if (e.type === 'chicken' && e.au && e.au.includes(4) && !(e.burstCd > 0) && e.hp > 0) { e.burstT = 3; e.burstCd = 5; }   // 놀란 가슴
}

function think(u, dt) {
  u.cd -= dt * (u.cursed ? CFG.CURSE_ATK : 1) * (u.atkMul || 1); if (u.hit > 0) u.hit -= dt; if (u.inv > 0) u.inv -= dt; if (u.slowT > 0) u.slowT -= dt;
  if (u.stun > 0) { u.stun -= dt; u.spray = false; return; }      // 경직 중에는 아무것도 못 함
  const D = u.d;
  if (D.tp && !u.tpDone) teleport(u);
  const [e, d] = near(u);
  if (D.ai === 'egg') return;                       // 알은 가만히 있는 어그로용 유닛
  if (D.ai === 'wander') return wander(u, dt);
  if (D.ai === 'flame') return flame(u, dt, e, d);
  if (D.ai === 'witch' || D.ai === 'mage') return cast(u, dt, e, d);
  if (D.ai === 'castle') return castle(u, dt, e, d);
  if (D.ai === 'arma') return arma(u, dt, e, d);
  if (D.ai === 'flower') return bloom(u, dt, e, d);

  if (D.ai === 'melee') {                       // 기사: 가장 가까운 적에게 달려가 칼질, 지나간 길을 칠함
    if (e && d <= D.r + e.d.r + 3) { if (u.cd <= 0) { hurt(e, D.atk * (u.ambushReady ? 2 : 1), false, u); u.ambushReady = false; u.cd = D.rate; } }
    else if (e) moveTo(u, e.x, e.y, dt);
    else forward(u, dt);
    if (D.trail) paint(u.x, u.y, D.trail, u.team);

  } else if (u.type === 'archer') {                // 궁수: 사거리 안이면 발사, 아니면 적을 향해 전진
    if (e && d <= D.range) {
      if (u.cd <= 0) { fireArrow(u, e); u.cd = D.rate; }
    } else if (e) moveTo(u, e.x, e.y, dt);
    else forward(u, dt);

  } else if (u.cd <= 0) {                          // 페인트런처: 사거리 안에서 가장 먼 적을 노림
    let b = null, bd = -1;
    for (const x of S.units) {
      if (x.team === u.team || x.hp <= 0) continue;
      const dd = Math.hypot(x.x - u.x, x.y - u.y);
      if (dd <= D.range && dd > bd && !(x.inv > 0)) { bd = dd; b = x; }
    }
    if (b) { S.shots.push({ k: 'ball', team: u.team, sx: u.x, sy: u.y, x: u.x, y: u.y, tx: b.x, ty: b.y, t: 0, z: 0, dmg: D.atk, d: D, src: u, rocket: !!(u.au && u.au.includes(4)), chain2: !!(u.au && u.au.includes(5)) }); u.cd = D.rate; }
  }
}

function castle(u, dt, e, d) {                     // 캐슬: 적이 반경 안에 있으면 일정 주기로 기사 소환
  const D = u.d;
  if (e && d <= D.range && u.cd <= 0) { spawn(u.team, D.summon, u.x, u.y, true, castleMods(u)); u.cd = D.rate; }
}

function pickChain(u) {                            // 아르마딜로: 구르기 연쇄 대상 (아직 안 맞춘 가장 가까운 적)
  let b = null, bd = 1e9;
  for (const e of S.units) {
    if (e.team === u.team || e.hp <= 0 || e.inv > 0 || u.hits.includes(e)) continue;
    const dd = Math.hypot(e.x - u.x, e.y - u.y) - e.d.r;
    if (dd <= u.d.chain && dd < bd) { bd = dd; b = e; }
  }
  return b;
}

function arma(u, dt, e, d) {
  const D = u.d;
  if (u.rs === 'roll') {                           // 구르는 중: 맞출 적이 없어지면 멈추고 쿨타임
    u.rtm -= dt;
    if (!u.rt || u.rt.hp <= 0 || u.rt.inv > 0) u.rt = pickChain(u);
    if (!u.rt || u.rtm <= 0) { endRoll(u); return; }
    moveTo(u, u.rt.x, u.rt.y, dt, D.rollSpd);
    paint(u.x, u.y, D.trail + 1, u.team);
    if (Math.hypot(u.rt.x - u.x, u.rt.y - u.y) <= D.r + u.rt.d.r + 2) {
      hurt(u.rt, D.atk, false, u); u.hits.push(u.rt); u.rt = pickChain(u); u.rtm = 2.5;
      if (!u.rt) endRoll(u);
    }
    return;
  }
  if (e) moveTo(u, e.x, e.y, dt); else forward(u, dt);
  paint(u.x, u.y, D.trail, u.team);
  if (u.rs === 'cool') { if (u.cd <= 0) u.rs = 'walk'; return; }
  if (e && d <= D.r + e.d.r + D.meet) { u.rs = 'roll'; u.rt = e; u.hits = []; u.rtm = 2.5; }
}

function bloom(u, dt, e, d) {                      // 꽃순이: 사거리 안이면 꽃씨 던지기, 아니면 걸으면서 도트 페인트
  const D = u.d;
  if (e && d <= D.range) {
    if (u.cd <= 0) { u.cd = D.rate; S.shots.push({ k: 'seed', team: u.team, sx: u.x, sy: u.y, x: u.x, y: u.y, tx: e.x, ty: e.y, t: 0, z: 0, dmg: D.atk, d: D, src: u, slow: !!(u.au && u.au.includes(4)), twice: !!(u.au && u.au.includes(5)) }); }
    return;
  }
  if (e) moveTo(u, e.x, e.y, dt); else forward(u, dt);
  u.acc += D.dots * dt;
  while (u.acc >= 1) {
    u.acc--;
    paint(u.x + (Math.random() - .5) * 2 * D.scatter, u.y + (Math.random() - .5) * 2 * D.scatter, D.dot, u.team);
  }
}

function teleport(u) {                             // 암살자: 처음 한 번, 반경 안에서 가장 먼 적에게 순간이동
  if (u.born === 'battle' && !u.d.lateTp) { u.tpDone = true; return; }
  let b = null, bd = -1;
  for (const e of S.units) {
    if (e.team === u.team || e.hp <= 0) continue;
    const dd = Math.hypot(e.x - u.x, e.y - u.y);
    if (dd <= u.d.tp && dd > bd && !(e.inv > 0) && e.type !== 'egg') { bd = dd; b = e; }
  }
  if (!b) return;                                  // 반경 안에 적이 없으면 첫 적이 나타날 때까지 대기
  u.tpDone = true;
  S.fx.push({ x: u.x, y: u.y, t: 0, team: u.team, r: 12 });
  u.x = b.x; u.y = b.y;
  S.fx.push({ x: u.x, y: u.y, t: 0, team: u.team, r: 12 });
  paint(u.x, u.y, u.d.tpPaint, u.team);
  if (u.au && u.au.includes(4)) u.inv = 1.5;                       // 연막탄: 순간이동 직후 무적
  if (u.au && u.au.includes(5)) u.ambushReady = true;              // 기습의 달인: 첫 공격 2배
}

function cast(u, dt, e, d) {                       // 마녀/마법사: 사거리 안이면 멈춰서 시전, 아니면 적을 향해 이동
  const D = u.d;
  if (e && d <= D.range) {
    if (u.cd <= 0) {
      u.cd = D.rate;
      if (D.ai === 'witch') castOrbs(u, e);
      else strike(u, e);
    }
  } else if (e) moveTo(u, e.x, e.y, dt);
  else forward(u, dt);
}

function strike(u, e) {                            // 마법사: 번개 한 방 (단일 피해 + 짧은 경직)
  const D = u.d;
  hurt(e, D.atk, true, u);
  if (!(e.inv > 0)) e.stun = Math.max(e.stun || 0, D.stun);
  paint(e.x, e.y, D.zap, u.team);
  S.fx.push({ x: e.x, y: e.y, t: 0, team: u.team, r: D.zap, bolt: true });
  if (u.au && u.au.includes(5)) {                  // 체인 라이트닝: 가까운 다른 적 1명에게 튕김 (피해 30%)
    let b = null, bd = 1e9;
    for (const o of S.units) {
      if (o === e || o.team === u.team || o.hp <= 0 || o.inv > 0) continue;
      const dd = Math.hypot(o.x - e.x, o.y - e.y);
      if (dd <= 50 && dd < bd) { bd = dd; b = o; }
    }
    if (b) { hurt(b, D.atk * .3, true, u); paint(b.x, b.y, D.zap, u.team); S.fx.push({ x: b.x, y: b.y, t: 0, team: u.team, r: D.zap, bolt: true }); }
  }
}

function wander(u, dt) {                           // 런치킨: 아레나 아무 곳이나 정해서 뛰어다니며 칠함
  if (Math.hypot(u.wx - u.x, u.wy - u.y) < 6 || (u.wt -= dt) <= 0) {
    u.wx = 15 + Math.random() * (W - 30); u.wy = 15 + Math.random() * (H - 30); u.wt = 3;
  }
  moveTo(u, u.wx, u.wy, dt);
  paint(u.x, u.y, u.d.trail, u.team);
}

const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

function flame(u, dt, e, d) {                      // 소방관: 부채꼴 분사, 방향을 바꾸려면 잠깐 멈춤
  const D = u.d, HALF = D.cone / 2 * Math.PI / 180;
  u.spray = false;
  if (!e) { u.face = u.team === 1 ? -Math.PI / 2 : Math.PI / 2; forward(u, dt); return; }
  const ang = Math.atan2(e.y - u.y, e.x - u.x);
  if (d - e.d.r > D.range) {                       // 사거리 밖: 적을 향해 이동
    u.turn = 0; u.face = ang; moveTo(u, e.x, e.y, dt); return;
  }
  if (u.turn > 0) {                                // 방향 전환 중 (이 동안은 공격 못 함)
    u.turn -= dt; if (u.turn <= 0) u.face = ang;
    return;
  }
  if (angDiff(ang, u.face) > HALF + Math.atan2(e.d.r, d)) { u.turn = D.turn; return; }   // 적이 부채꼴 밖 → 방향 전환 시작
  u.spray = true;                                  // 분사: 부채꼴 안의 모든 적에게 초당 피해
  for (const t of S.units) {
    if (t.team === u.team || t.hp <= 0 || t.inv > 0) continue;
    const dx = t.x - u.x, dy = t.y - u.y, dd = Math.hypot(dx, dy) || 1;
    if (dd - t.d.r > D.range) continue;
    if (angDiff(Math.atan2(dy, dx), u.face) <= HALF + Math.atan2(t.d.r, dd)) { const v = calcDmg(t, D.atk * dt * (u.cursed ? CFG.CURSE_ATK : 1), true); t.lastHit = u; if (t.shield > 0) t.shield -= v; else t.hp -= v; }
  }
  u.acc += D.dots * dt * (u.cursed ? CFG.CURSE_ATK : 1);                            // 부채꼴 안에 도트로 페인트 흩뿌리기
  while (u.acc >= 1) {
    u.acc--;
    const rr = D.range * Math.sqrt(Math.random()), aa = u.face + (Math.random() - .5) * 2 * HALF;
    paint(u.x + Math.cos(aa) * rr, u.y + Math.sin(aa) * rr, D.dot, u.team);
  }
}

function separate() {                              // 캐릭터끼리 겹치지 않게 살짝 밀어내기
  const a = S.units;
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) {
    const p = a[i], q = a[j]; if (p.hp <= 0 || q.hp <= 0) continue;
    let dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); const m = (p.d.r + q.d.r) * .9;
    if (d >= m) continue;
    if (d === 0) { dx = 1; dy = 0; d = 1; }
    const pf = p.d.spd ? 1 : 0, qf = q.d.spd ? 1 : 0, tot = pf + qf; if (!tot) continue;
    const push = m - d, nx = dx / d, ny = dy / d;
    p.x -= nx * push * pf / tot; p.y -= ny * push * pf / tot;
    q.x += nx * push * qf / tot; q.y += ny * push * qf / tot;
  }
  for (const u of a) { u.x = Math.min(W - u.d.r, Math.max(u.d.r, u.x)); u.y = Math.min(H - u.d.r, Math.max(u.d.r, u.y)); }
}

function stepShots(dt) {
  for (const s of S.shots) {
    if (s.k === 'orb') {                           // 마녀의 저주구: 맞은 상대만 피해, 떨어진 곳에 저주 장판
      if (s.tgt.hp > 0) { s.tx = s.tgt.x; s.ty = s.tgt.y; }
      const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy) || 1, st = 150 * dt;
      if (d <= st + s.tgt.d.r * .6) {
        if (s.tgt.hp > 0) hurt(s.tgt, s.dmg, true, s.src);
        const D = s.d || CFG.UNITS.witch;
        paint(s.tx, s.ty, D.zone, s.team);
        S.zones.push({ x: s.tx, y: s.ty, r: D.zone, team: s.team, t: D.zoneTime, amp: s.amp || 0 });
        S.fx.push({ x: s.tx, y: s.ty, t: 0, team: s.team, r: D.zone * .5 });
        s.dead = true;
      } else { s.x += dx / d * st; s.y += dy / d * st; }
    } else if (s.k === 'seed') {                   // 꽃순이의 꽃씨: 떨어진 곳에서 적 피해 + 아군 회복
      s.t += dt / .6;
      const t = Math.min(s.t, 1);
      s.x = s.sx + (s.tx - s.sx) * t; s.y = s.sy + (s.ty - s.sy) * t; s.z = Math.sin(Math.PI * t) * 30;
      if (s.t >= 1) {
        const D = s.d || CFG.UNITS.flower;
        bloomAt(s.tx, s.ty, s.team, D, 1, s.src, s.slow, false);
        if (s.twice) S.timers.push({ t: .6, fn: () => bloomAt(s.tx, s.ty, s.team, D, .5, s.src, s.slow, true) });
        s.dead = true;
      }
    } else if (s.k === 'parrow') {                   // 관통 화살: 방향대로 쭉 날아가며 맞는 적을 모두 공격
      const st = 220 * dt;
      s.x += s.vx * st; s.y += s.vy * st; s.left -= st;
      paint(s.x, s.y, (s.d || CFG.UNITS.archer).arrow, s.team);
      for (const e of S.units) {
        if (e.team === s.team || e.hp <= 0 || e.inv > 0 || s.hit.includes(e)) continue;
        if (Math.hypot(e.x - s.x, e.y - s.y) <= e.d.r + 3) { s.hit.push(e); hurt(e, s.dmg, true, s.src); }
      }
      if (s.left <= 0 || s.x < -20 || s.x > W + 20 || s.y < -20 || s.y > H + 20) s.dead = true;
    } else if (s.k === 'arrow') {
      if (s.tgt.hp > 0) { s.tx = s.tgt.x; s.ty = s.tgt.y; }
      const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy), st = 220 * dt;
      s.a = Math.atan2(dy, dx);
      if (d <= st + s.tgt.d.r * .6) { if (s.tgt.hp > 0) hurt(s.tgt, s.dmg, true, s.src); paint(s.tx, s.ty, (s.d || CFG.UNITS.archer).arrow, s.team); s.dead = true; }
      else { s.x += dx / d * st; s.y += dy / d * st; paint(s.x, s.y, (s.d || CFG.UNITS.archer).arrow, s.team); }
    } else {
      s.t += dt / .9;
      const t = Math.min(s.t, 1);
      s.x = s.sx + (s.tx - s.sx) * t; s.y = s.sy + (s.ty - s.sy) * t; s.z = Math.sin(Math.PI * t) * 50;
      if (s.t >= 1) {
        boomAt(s.tx, s.ty, s.team, s.d || CFG.UNITS.launcher, s.dmg, s.src, 1);
        if (s.rocket) spawn(s.team, 'minion', s.tx, s.ty, true);                       // 로켓 배송: 졸병 소환
        if (s.chain2) S.timers.push({ t: .4, fn: () => boomAt(s.tx, s.ty, s.team, s.d || CFG.UNITS.launcher, s.dmg, s.src, .5) });   // 연쇄 폭발
        s.dead = true;
      }
    }
  }
  S.shots = S.shots.filter(s => !s.dead);
  for (const f of S.fx) f.t += dt;
  S.fx = S.fx.filter(f => f.t < (f.life || .35));
}

function incomeEvery() {                           // 지금 시점의 코인 지급 간격(초) — CFG.INCOME_STEPS 참고
  const el = CFG.BATTLE - S.t;
  let v = CFG.INCOME_STEPS[0][1];
  for (const st of CFG.INCOME_STEPS) if (el >= st[0]) v = st[1];
  return v;
}

function update(dt) {
  S.t -= dt;
  if (S.phase === 'prep') { if (S.t <= 0) startBattle(); return; }

  S.incomeT += dt;
  while (S.incomeT >= incomeEvery()) {          // 5초마다 코인 +1 (플레이어, AI 모두)
    S.incomeT -= incomeEvery(); S.coin[0]++; S.coin[1]++;
    // (AI 지원군은 아래 aiBattle이 판단해요)
  }
  S.aiT = (S.aiT || 0) - dt; if (S.aiT <= 0) { S.aiT = .8; aiBattle(); }       // AI 지휘관이 0.8초마다 상황을 보고 판단
  S.zones.forEach(z => z.t -= dt);                 // 저주 장판: 시간 지나면 사라지고, 안에 있는 적은 저주 상태
  S.zones = S.zones.filter(z => z.t > 0);
  for (const u of S.units) {
    let cu = false, amp = 0;
    if (!u.slowImm) for (const z of S.zones) if (z.team !== u.team && Math.hypot(u.x - z.x, u.y - z.y) <= z.r) { cu = true; amp = Math.max(amp, z.amp || 0); }
    u.cursed = cu; u.amp = amp;
  }
  for (const u of S.units) if (u.hp > 0) { think(u, dt); if (u.au) augTick(u, dt); }
  separate();
  stepShots(dt);
  S.timers.forEach(tm => { tm.t -= dt; if (tm.t <= 0) { tm.done = true; tm.fn(); } });
  S.timers = S.timers.filter(tm => !tm.done);
  processDeaths();
  S.units = S.units.filter(u => u.hp > 0);
  if (S.t <= 0) endBattle();
}

const EXTRA = (() => {                             // 소환 카드가 아닌 특수 유닛 (졸병 = 기사의 절반)
  const k = CFG.UNITS.knight;
  return { minion: { name: '졸병', icon: '👀', cost: 0, hp: Math.round(k.hp / 2), atk: Math.round(k.atk / 2), spd: k.spd, rate: k.rate, range: 0, r: 8, trail: Math.max(2, Math.round(k.trail / 2)), ai: 'melee' },
          egg: { name: '알', icon: '🥚', cost: 0, hp: 1, atk: 0, spd: 0, rate: 0, range: 0, r: 6, ai: 'egg', nobar: true } };
})();

function endRoll(u) { u.rs = 'cool'; u.cd = u.d.cool; if (u.au && u.au.includes(4)) u.shield = Math.min(u.shMax, u.shield + 50); }   // 재충전

function titanGuard() {                            // 타이탄 아군 보호: 전투 시작 때 타이탄 한 마리당 후방 아군 최대 4명에게 1회 방어 쉴드
  for (const t of S.units) {
    if (t.type !== 'titan' || !t.au || !t.au.includes(4)) continue;
    S.units.filter(o => o !== t && o.team === t.team && o.type !== 'titan' && o.hp > 0 && !o.guarded
        && Math.hypot(o.x - t.x, o.y - t.y) <= 100 && (t.team === 1 ? o.y >= t.y : o.y <= t.y))
      .sort((p, q) => Math.hypot(p.x - t.x, p.y - t.y) - Math.hypot(q.x - t.x, q.y - t.y))
      .slice(0, 4)
      .forEach(o => { o.guarded = true; o.shield = (o.shield || 0) + 1; o.shMax = Math.max(o.shMax || 0, o.shield); });
  }
}

function processDeaths() {                         // 죽은 캐릭터 처리 (흡혈, 자폭, 마녀의 유언)
  for (const u of S.units) {
    if (u.hp > 0 || u.dead) continue;
    u.dead = true;
    if (u.team === 1 && u.card) S.stats.deaths[u.type] = (S.stats.deaths[u.type] || 0) + 1;
    if (u.team === 2 && u.type !== 'egg' && u.lastHit && u.lastHit.team === 1) { S.stats.kills[u.lastHit.type] = (S.stats.kills[u.lastHit.type] || 0) + 1; S.stats.killsTotal++; }
    const k = u.lastHit;
    if (k && k.hp > 0 && k.vamp) k.hp = Math.min(k.max, k.hp + k.max * k.vamp);
    if (!u.au) continue;
    if (u.type === 'titan' && u.au.includes(5)) {
      for (const e of S.units) if (e.team !== u.team && e.hp > 0 && Math.hypot(e.x - u.x, e.y - u.y) <= 120) hurt(e, 50, true, null);
      for (let i = 0; i < 45; i++) { const a = Math.random() * TAU, r = 120 * Math.sqrt(Math.random()); paint(u.x + Math.cos(a) * r, u.y + Math.sin(a) * r, 3, u.team); }
      S.fx.push({ x: u.x, y: u.y, t: 0, team: u.team, r: 40 });
    }
    if (u.type === 'witch' && u.au.includes(1)) {
      paint(u.x, u.y, u.d.zone, u.team);
      S.zones.push({ x: u.x, y: u.y, r: u.d.zone, team: u.team, t: u.d.zoneTime, amp: u.au.includes(4) ? .1 : 0 });
    }
  }
}