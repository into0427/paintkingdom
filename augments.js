'use strict';
// ===== augments.js =====
// 증강 — 증강 설명표(AUG), 증강 효과 적용, 증강 화면.
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['augments.js'] = '2026.11.24-1';

const AUG = {                                      // [이름, 설명] — 효과는 아래 applyAug / augTick 등에서 구현
  knight: [['든든한 탱커', '체력 +10%'], ['집단지성', '반경 70 안에 아군 기사가 있으면 체력을 초당 2%씩 회복 (오버힐 없음)'], ['멋있는 전사', '체력이 50% 미만이면 이동속도 +30%, 공격속도 1.5배'], ['쉴드 장착', '원거리 공격으로 받는 피해 25% 감소'], ['용맹함', '체력과 공격력 +25%']],
  archer: [['백스텝', '공격할 때마다 조금씩 물러나요'], ['긴 사정거리', '사거리 +12%'], ['다재다능', '지나간 길도 칠해요 (굵기는 기사의 절반)'], ['더블킬', '화살이 적을 관통해요'], ['파워샷', '세 번째 공격마다 피해 +40%']],
  titan: [['광전사', '공격속도 1.15배'], ['튼튼함', '체력 +10%'], ['흡혈', '적을 처치할 때마다 최대 체력의 5% 회복'], ['아군 보호', '전투 시작 때 후방 반경 100 안의 아군 최대 4명(타이탄 제외)에게 1회 방어 쉴드'], ['자폭', '처치되면 반경 120 안의 적에게 50 피해, 주변에 페인트를 흩뿌려요']],
  chicken: [['푸드덕', '이동속도 +10%'], ['두툼한 깃털', '체력 +20%'], ['넓은 발자국', '칠하는 굵기 +25%'], ['놀란 가슴', '피격 시 3초간 이동속도 +40% (재발동 5초)'], ['황금알', '5초마다 제자리에 체력 1짜리 알을 낳아요. 적들이 알을 부수려고 쫓아와요']],
  launcher: [['단단한 포신', '체력 +10%'], ['빠른 장전', '공격 간격 -10%'], ['대형 페인트볼', '폭발 반경 +20%'], ['로켓 배송', '탄착 지점에 졸병을 소환해요 (체력·공격력은 기사의 절반)'], ['연쇄 폭발', '0.4초 뒤 같은 자리에서 한 번 더 폭발 (피해 50%)']],
  fire: [['날쌘 몸놀림', '방향 전환 시간 -20%'], ['롱 노즐', '사거리 +15%'], ['넓은 분사', '부채꼴 각도 40°→50°'], ['방화복', '모든 슬로우 효과 면역, 체력 +10%'], ['고압 분사', '초당 피해 +25%']],
  assassin: [['날쌘 발놀림', '이동속도 +10%'], ['독 묻은 단검', '공격력 +15%'], ['그림자 도약', '순간이동 반경 +25%'], ['연막탄', '순간이동 직후 1.5초 동안 무적 (타겟 제외)'], ['기습의 달인', '순간이동 직후 첫 공격 피해 +100%']],
  witch: [['마녀의 유언', '처치당하면 그 자리에 저주 장판을 남겨요 (피해 없음)'], ['오래가는 저주', '장판 지속시간 +25%'], ['넓은 장판', '장판 반경 +20%'], ['깊은 저주', '장판 안의 적이 받는 피해 +10%'], ['이중 저주', '두 번째로 가까운 적에게도 약한 저주구 발사 (피해 50%)']],
  mage: [['마력 응축', '공격 간격 -8%'], ['롱 스태프', '사거리 +10%'], ['오래가는 감전', '경직 시간 0.5초→0.7초'], ['마법 방패', '피해를 50까지 막아주는 방어막'], ['체인 라이트닝', '번개가 반경 50 안의 다른 적 1명에게 튕겨요 (피해 30%)']],
  castle: [['튼튼한 성벽', '체력 +10%'], ['넓은 경계', '감지 반경 +15%'], ['단련된 기사', '소환하는 기사의 체력 +20%'], ['보급', '소환 주기 -10%'], ['근위 기사', '소환하는 기사의 공격력 +25%, 이동속도 +10% (금빛 투구와 붉은 깃털로 구분돼요)']],
  arma: [['두꺼운 껍질', '쉴드 100→120'], ['가시', '받은 피해의 10%를 공격한 적에게 돌려줘요'], ['짧은 휴식', '구르기 쿨타임 2초→1.5초'], ['재충전', '구르기를 멈출 때마다 쉴드 50 회복'], ['강철 구슬', '구르기 피해 +40%']],
  flower: [['튼튼한 줄기', '체력 +10%'], ['활짝 핀 꽃', '꽃 반경 +15%'], ['달콤한 향기', '회복량 20%→25%'], ['끈적한 꿀', '꽃에 맞은 적 이동속도 -20% (2초)'], ['만개', '0.6초 뒤 꽃이 한 번 더 활짝! (효과 50%)']]
};

const augsOf = k => SAVE.augs[k] || [];

function buyAug(k, n) {                            // 성공하면 '' / 실패하면 안내 문구
  if (augsOf(k).includes(n)) return '이미 해금한 증강이에요';
  if ((SAVE.tickets[k] || 0) < 1) return '증강권이 없어요. 팔레트에서 같은 캐릭터가 또 나오면 얻어요';
  if (SAVE.gems < AUG_PRICE[n - 1]) return '보석이 부족해요';
  SAVE.tickets[k]--; SAVE.gems -= AUG_PRICE[n - 1]; SAVE.augs[k] = augsOf(k).concat(n); persist();
  return '';
}

let augKey = null;

function openAug(k) { augKey = k; buildAug(); show('augscr'); }

function buildAug(msg) {
  const k = augKey, d = CFG.UNITS[k];
  { const t = $('augtitle'); t.textContent = ''; t.appendChild(mkIcon(k, 36)); t.appendChild(document.createTextNode(` ${d.name} 증강`)); }
  $('augsub').textContent = `🔧 증강권 ${SAVE.tickets[k] || 0}장 · 💎 ${SAVE.gems} · 해금 ${augsOf(k).length}/5`;
  $('aughint').textContent = msg || '';
  const box = $('auglist'); box.innerHTML = '';
  (AUG[k] || []).forEach((a, i) => {
    const n = i + 1, done = augsOf(k).includes(n), can = (SAVE.tickets[k] || 0) > 0 && SAVE.gems >= AUG_PRICE[i];
    const row = document.createElement('div'); row.className = 'arow' + (done ? ' done' : '');
    row.innerHTML = `<div class="an"><b>${n}. ${a[0]}</b><span>${a[1]}</span></div>`;
    const b = document.createElement('button'); b.className = 'abuy' + (done || can ? '' : ' dim');
    b.textContent = done ? '해금됨 ✔' : `💎 ${AUG_PRICE[i]}`; b.disabled = done;
    b.onclick = () => { const m = buyAug(k, n); buildAug(m || '🎉 증강을 해금했어요!'); };
    row.appendChild(b); box.appendChild(row);
  });
}

function applyAug(u, listIn) {                             // 소환될 때 해금한 증강을 능력치에 반영 (같은 능력치의 %는 더하기로 합산)
  const list = listIn || SAVE.augs[u.type];
  if (!list || !list.length) return;
  u.au = list.slice();
  const D = u.d = Object.assign({}, u.d), A = n => list.includes(n), f = (...p) => 1 + p.reduce((t, x) => t + x, 0);
  switch (u.type) {
    case 'knight': D.hp = Math.round(D.hp * f(A(1) && .10, A(5) && .25)); D.atk *= f(A(5) && .25); if (A(4)) u.rr = .75; break;
    case 'archer': D.range *= f(A(2) && .12); if (A(3)) u.trailAug = 3; break;
    case 'titan': D.hp = Math.round(D.hp * f(A(2) && .1)); if (A(1)) D.rate /= 1.15; if (A(3)) u.vamp = .05; break;
    case 'chicken': if (A(1)) D.spd *= 1.1; D.hp = Math.round(D.hp * f(A(2) && .2)); if (A(3)) D.trail *= 1.25; break;
    case 'launcher': D.hp = Math.round(D.hp * f(A(1) && .1)); if (A(2)) D.rate *= .9; if (A(3)) D.boom *= 1.2; break;
    case 'fire': if (A(1)) D.turn *= .8; if (A(2)) D.range *= 1.15; if (A(3)) D.cone = 50; if (A(4)) { u.slowImm = true; D.hp = Math.round(D.hp * 1.1); } if (A(5)) D.atk *= 1.25; break;
    case 'assassin': if (A(1)) D.spd *= 1.1; if (A(2)) D.atk *= 1.15; if (A(3)) D.tp *= 1.25; break;
    case 'witch': if (A(2)) D.zoneTime *= 1.25; if (A(3)) D.zone *= 1.2; break;
    case 'mage': if (A(1)) D.rate *= .92; if (A(2)) D.range *= 1.1; if (A(3)) D.stun = .7; if (A(4)) { D.shield = 50; u.shLeak = true; } break;
    case 'castle': D.hp = Math.round(D.hp * f(A(1) && .1)); if (A(2)) D.range *= 1.15; if (A(4)) D.rate *= .9; break;
    case 'arma': if (A(1)) D.shield = 120; if (A(2)) u.thorn = .1; if (A(3)) D.cool = 1.5; if (A(5)) D.atk *= 1.4; break;
    case 'flower': D.hp = Math.round(D.hp * f(A(1) && .1)); if (A(2)) D.splash *= 1.15; if (A(3)) D.heal = .25; break;
  }
  u.hp = u.max = D.hp; u.shield = u.shMax = D.shield || 0;
}

function augTick(u, dt) {                          // 매 프레임 적용되는 증강 효과
  const A = n => u.au.includes(n);
  if (u.burstCd > 0) u.burstCd -= dt;
  if (u.burstT > 0) u.burstT -= dt;
  if (u.type === 'knight') {
    if (A(2) && S.units.some(o => o !== u && o.hp > 0 && o.team === u.team && o.type === 'knight' && Math.hypot(o.x - u.x, o.y - u.y) <= 70))
      u.hp = Math.min(u.max, u.hp + u.max * .02 * dt);                                // 집단지성
    const rage = A(3) && u.hp < u.max * .5;                                           // 멋있는 전사
    u.spdMul = rage ? 1.3 : 1; u.atkMul = rage ? 1.5 : 1;
  }
  if (u.type === 'chicken') {
    u.spdMul = u.burstT > 0 ? 1.4 : 1;                                                // 놀란 가슴
    if (A(5)) {                                                                       // 황금알
      u.eggT = (u.eggT === undefined ? EGG_EVERY : u.eggT) - dt;
      if (u.eggT <= 0) { u.eggT = EGG_EVERY; spawn(u.team, 'egg', u.x, u.y, true); S.fx.push({ x: u.x, y: u.y, t: 0, team: u.team, r: 8 }); }
    }
  }
  if (u.trailAug && (Math.abs(u.x - u.lx) > .01 || Math.abs(u.y - u.ly) > .01)) paint(u.x, u.y, u.trailAug, u.team);   // 다재다능
  u.lx = u.x; u.ly = u.y;
  if (u.backT > 0 && u.backTgt && !(u.stun > 0)) { u.backT -= dt; moveTo(u, 2 * u.x - u.backTgt.x, 2 * u.y - u.backTgt.y, dt); }   // 백스텝
}

function fireArrow(u, e) {                         // 궁수 공격 (파워샷, 관통, 백스텝)
  const D = u.d, au = u.au || [];
  u.shots = (u.shots || 0) + 1;
  const dmg = D.atk * (au.includes(5) && u.shots % 3 === 0 ? 1.4 : 1);
  if (au.includes(4)) {
    const dx = e.x - u.x, dy = e.y - u.y, d = Math.hypot(dx, dy) || 1;
    S.shots.push({ k: 'parrow', team: u.team, x: u.x, y: u.y, vx: dx / d, vy: dy / d, a: Math.atan2(dy, dx), left: D.range + 30, hit: [], dmg, d: D, src: u });
  } else S.shots.push({ k: 'arrow', team: u.team, x: u.x, y: u.y, tgt: e, tx: e.x, ty: e.y, dmg, a: 0, d: D, src: u });
  if (au.includes(1)) { u.backT = .2; u.backTgt = e; }
}

function castOrbs(u, e) {                          // 마녀 공격 (이중 저주, 깊은 저주)
  const D = u.d, A = n => u.au && u.au.includes(n), amp = A(4) ? .1 : 0;
  const mk = (t, m) => S.shots.push({ k: 'orb', team: u.team, x: u.x, y: u.y, tgt: t, tx: t.x, ty: t.y, dmg: D.atk * m, d: D, src: u, amp });
  mk(e, 1);
  if (A(5)) {
    let b = null, bd = 1e9;
    for (const o of S.units) {
      if (o === e || o.team === u.team || o.hp <= 0 || o.inv > 0) continue;
      const dd = Math.hypot(o.x - u.x, o.y - u.y);
      if (dd <= D.range && dd < bd) { bd = dd; b = o; }
    }
    if (b) mk(b, .5);
  }
}

function boomAt(x, y, team, D, dmg, src, mul) {    // 페인트런처 폭발
  paint(x, y, D.boom, team);
  for (const e of S.units) if (e.team !== team && e.hp > 0 && Math.hypot(e.x - x, e.y - y) <= D.boom + e.d.r) hurt(e, dmg * mul, true, src);
  S.fx.push({ x, y, t: 0, team, r: D.boom });
}

function bloomAt(x, y, team, D, mul, src, slow, blossom) {   // 꽃순이 꽃 이펙트 (적 피해, 아군 회복, 만개)
  for (const e of S.units) {
    if (e.hp <= 0 || Math.hypot(e.x - x, e.y - y) > D.splash + e.d.r) continue;
    if (e.team === team) e.hp = Math.min(e.max, e.hp + e.max * D.heal * mul);
    else { hurt(e, D.atk * mul, true, src); if (slow && !e.slowImm && !(e.inv > 0)) e.slowT = 2; }
  }
  if (blossom) {
    const pts = [];
    for (let i = 0; i < 14; i++) { const a = Math.random() * TAU, r = D.splash * Math.sqrt(Math.random()); pts.push([Math.cos(a) * r, Math.sin(a) * r, 5 + Math.random() * 3]); }
    S.fx.push({ x, y, t: 0, team, life: .7, blossom: true, pts });
  } else S.fx.push({ x, y, t: 0, team, r: D.splash * .7, flower: true });
}

function castleMods(u) { const au = u.au || []; return { hp: au.includes(3) ? 1.2 : 1, atk: au.includes(5) ? 1.25 : 1, spd: au.includes(5) ? 1.1 : 1, elite: au.includes(5) }; }