'use strict';
// ===== ai.js =====
// AI 지휘관 — 지휘관 목록, 덱, 배치 구역, 상성표, 특별 이벤트, 전투 중 AI 운영.
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['ai.js'] = '2026.11.24-1';

function aiBuyOne() {
  const names = Object.keys(CFG.UNITS).filter(k => CFG.UNITS[k].cost <= S.coin[1] && S.aiPool.includes(k));   // AI는 내 리그에 열린 캐릭터만
  if (!names.length) return false;
  const w = { knight: 5, archer: 3, launcher: 1.5, chicken: 1.5, titan: 1.5, fire: 2, assassin: 1, witch: 2, mage: 1.5, castle: 1, arma: 2, flower: 1.5 };
  let sum = 0; names.forEach(k => sum += (w[k] || 1.5));
  let r = Math.random() * sum, pick = names[0];
  for (const k of names) { r -= (w[k] || 1.5); if (r <= 0) { pick = k; break; } }
  S.coin[1] -= CFG.UNITS[pick].cost;
  const prep = S.phase === 'prep';
  const [x, y] = (['launcher', 'witch', 'mage', 'flower'].includes(pick) && prep) ? pickSpot(2, pick, 15, 70)
               : pickSpot(2, pick, prep ? 40 : 18, prep ? MID - 24 : 40);
  spawn(2, pick, x, y);
  return true;
}

function rollAiAugs(focus) {                       // 이번 판 AI의 증강: 정확도가 높을수록 덱에 쓰는 캐릭터에 몰아줌
  const pool = unlockedPool(SAVE.maxPower), T = AI_AUG, x = SAVE.power / 100, i = Math.floor(x);
  const a = T[Math.min(i, T.length - 1)], b = T[Math.min(i + 1, T.length - 1)];
  let exp = a + (b - a) * (x - i);
  if (x > T.length - 1) exp += 1.6 * (x - (T.length - 1));
  if (S.event && S.event.type === 'aug') exp *= EVENT_AUG_MULT;
  exp = Math.min(exp * AI_AUG_MULT, pool.length * 5);
  let n = Math.floor(exp) + (Math.random() < exp - Math.floor(exp) ? 1 : 0);
  const fp = focus ? pool.filter(k => focus.includes(k)) : [], res = {};
  while (n > 0) {
    const src = (fp.length && Math.random() < (S.acc || 0)) ? fp : pool;
    let open = src.filter(k => (res[k] || []).length < 5 && AUG[k]);
    if (!open.length) open = pool.filter(k => (res[k] || []).length < 5 && AUG[k]);
    if (!open.length) break;
    const k = open[Math.floor(Math.random() * open.length)], have = res[k] || [];
    const cand = [1, 2, 3, 4, 5].filter(v => !have.includes(v)), w = cand.map(v => 6 - v);
    let r = Math.random() * w.reduce((t, v) => t + v, 0), pick = cand[0];
    for (let j = 0; j < cand.length; j++) { r -= w[j]; if (r <= 0) { pick = cand[j]; break; } }
    res[k] = have.concat(pick); n--;
  }
  return res;
}

// 상성표: [A, B, 점수] = A가 B를 카운터 (2 = 하드 카운터, 1 = 유리). 반대 방향은 자동으로 마이너스가 돼요
const CTR = [
  ['knight', 'launcher', 2], ['knight', 'titan', 1], ['knight', 'mage', 1], ['knight', 'witch', 1], ['knight', 'assassin', 1],
  ['archer', 'knight', 2], ['archer', 'chicken', 2],
  ['titan', 'launcher', 1], ['titan', 'fire', 1], ['titan', 'arma', 1], ['titan', 'assassin', 1],
  ['launcher', 'archer', 2], ['launcher', 'fire', 2], ['launcher', 'witch', 2], ['launcher', 'mage', 2], ['launcher', 'flower', 2], ['launcher', 'castle', 2],
  ['fire', 'knight', 2], ['fire', 'castle', 2],
  ['assassin', 'witch', 2], ['assassin', 'mage', 1], ['assassin', 'fire', 1], ['assassin', 'launcher', 1],
  ['witch', 'chicken', 1], ['witch', 'castle', 1],
  ['mage', 'titan', 2], ['mage', 'castle', 1], ['castle', 'titan', 1]
];

const COUNTER = {};

CTR.forEach(c => { (COUNTER[c[0]] = COUNTER[c[0]] || {})[c[1]] = c[2]; (COUNTER[c[1]] = COUNTER[c[1]] || {})[c[0]] = -c[2]; });

// 배치 구역: d = 깊이(0 = 중앙선 쪽 최전방 ~ 1 = 맨 뒤), x = 가로 범위(0~1), group = 한 덩어리로 뭉침, form = line / arc(학익진)
const ZONE = {
  titan:    { d: [.04, .16], x: [.15, .85] },
  arma:     { d: [.04, .16], x: [.15, .85], group: true },
  knight:   { d: [.08, .50], x: [.05, .95] },
  assassin: { d: [.30, .55], x: [.10, .90] },
  fire:     { d: [.25, .42], x: [.20, .80] },
  flower:   { d: [.14, .28], x: [.20, .80] },
  castle:   { d: [.42, .55], x: [.40, .60] },
  launcher: { d: [.52, .68], x: [.25, .75] },
  archer:   { d: [.62, .85], x: [.10, .90] },
  witch:    { d: [.72, .90], x: [.25, .75] },
  mage:     { d: [.78, .96], x: [.10, .90] },
  chicken:  { d: [.82, .97], x: [.05, .95] }
};

// 덱: cards = 종류별 개수 (코인 합 30), place = 이 덱만의 배치 규칙 (behind = 그 캐릭터 바로 뒤)
const DECKS = {
  knightMass:   { name: '기사 몰빵', cards: { knight: 30 } },
  archerMass:   { name: '궁수 몰빵', cards: { archer: 15 }, place: { archer: { d: [.68, .86], x: [.06, .94], form: 'arc' } } },
  mageMass:     { name: '마법사 몰빵', cards: { mage: 7, knight: 2 }, place: { mage: { d: [.80, .97], x: [.10, .90] } } },
  launcherTrio: { name: '런처 트리오', cards: { launcher: 3, fire: 3, witch: 3 },
                  place: { fire: { d: [.26, .36], x: [.32, .68] }, launcher: { d: [.46, .56], x: [.32, .68] }, witch: { d: [.70, .80], x: [.32, .68] } } },
  castleHold:   { name: '캐슬 수비', cards: { castle: 1, launcher: 2, witch: 2, archer: 2, chicken: 1, knight: 4 },
                  place: { castle: { d: [.40, .48], x: [.44, .56] }, launcher: { d: [.62, .72], x: [.36, .64] }, witch: { d: [.76, .88], x: [.36, .64] }, archer: { d: [.70, .85], x: [.15, .85], form: 'line' } } },
  titanFlower:  { name: '타이탄+꽃순이', cards: { titan: 2, flower: 4, assassin: 2, knight: 2 }, place: { flower: { behind: 'titan' } } },
  titanBreak:   { name: '타이탄 돌파', cards: { titan: 2, arma: 3, fire: 2, assassin: 2, knight: 3 }, place: { fire: { behind: 'titan' } } },
  balanced:     { name: '균형 덱', cards: { titan: 1, launcher: 1, archer: 3, knight: 8, fire: 1, chicken: 1, assassin: 1 } },
  paintPress:   { name: '색칠 압박', cards: { chicken: 3, fire: 2, knight: 13, archer: 1 } },
  // 정석을 깨는 반(反)메타 덱
  antiLauncher: { name: '런처 사냥', cards: { knight: 18, assassin: 6 } },
  antiTitan:    { name: '타이탄 사냥', cards: { mage: 4, knight: 14 } },
  antiSwarm:    { name: '물량 파괴', cards: { fire: 4, launcher: 2, archer: 5 } },
  antiRanged:   { name: '원거리 파괴', cards: { launcher: 3, knight: 12, assassin: 3 } }
};

// 지휘관: min = 등장 최소 리그(통솔력÷100), need = 이 캐릭터가 열려 있어야 등장, acc = 정확도 보정, accMul = 정확도 배율, scout = 내 출전 목록을 보고 카운터 덱 선택
const COMMANDERS = [
  { id: 'arthur',  name: '기사단장 아서',   style: '기사 몰빵',    decks: ['knightMass'] },
  { id: 'pollock', name: '색칠장이 폴록',   style: '색칠 압박',    decks: ['paintPress'], need: ['chicken'] },
  { id: 'coach',   name: '균형잡이 코치',   style: '균형 덱',      decks: ['balanced'], acc: .08 },
  { id: 'chaos',   name: '잡덱 대마왕',     style: '막장 즉흥',    decks: [], accMul: .4, w: .6 },
  { id: 'hansan',  name: '학익진 한산',     style: '궁수 몰빵',    decks: ['archerMass'], min: 1 },
  { id: 'luna',    name: '포격수 루나',     style: '런처 트리오',  decks: ['launcherTrio'], min: 1, need: ['launcher', 'fire'] },
  { id: 'leo',     name: '사냥꾼 레오',     style: '메타 파괴',    decks: ['antiLauncher', 'antiTitan'], min: 1 },
  { id: 'merlin',  name: '마법사 멀린',     style: '마법사 몰빵',  decks: ['mageMass'], min: 2, need: ['mage'] },
  { id: 'holmes',  name: '분석가 홈즈',     style: '카운터 덱',    decks: ['balanced'], min: 2, scout: true },
  { id: 'krom',    name: '파괴자 크롬',     style: '메타 파괴',    decks: ['antiSwarm', 'antiRanged'], min: 2 },
  { id: 'daisy',   name: '철옹성 데이지',   style: '캐슬 수비',    decks: ['castleHold'], min: 3, need: ['castle'] },
  { id: 'tiger',   name: '돌격 타이거',     style: '타이탄+꽃순이', decks: ['titanFlower'], min: 4, need: ['titan', 'flower'] },
  { id: 'rai',     name: '그림자 라이',     style: '타이탄 돌파',  decks: ['titanBreak'], min: 4, need: ['arma'] }
];

function aiAcc(c) {                                // 정확도 = 0.8 × (1 − 0.62^(리그 번호+1)) + 지휘관 보정, 항상 15%~80%
  const i = Math.floor(SAVE.power / 100);
  let a = AI_ACC_MAX * (1 - Math.pow(0.62, i + 1)) + AI_ACC_BONUS;
  if (c.accFixed) a += .15;                        // 특별 지휘관은 정확도가 높음 (그래도 80% 상한)
  else { a += (c.acc || 0); if (c.accMul) a *= c.accMul; }
  return Math.max(AI_ACC_MIN, Math.min(AI_ACC_MAX, a));
}

let lastCmd = null;

function pickCommander() {                         // 내 리그에서 등장할 수 있는 지휘관 중 랜덤 (직전 지휘관은 피함)
  if (S.event) return specialCommander(S.event);
  const lg = Math.floor(SAVE.power / 100), pool = S.aiPool;
  let ok = COMMANDERS.filter(c => lg >= (c.min || 0) && (c.need || []).every(k => pool.includes(k)));
  if (ok.length > 1) ok = ok.filter(c => c.id !== lastCmd);
  let r = Math.random() * ok.reduce((t, c) => t + (c.w || 1), 0), pick = ok[0];
  for (const c of ok) { r -= (c.w || 1); if (r <= 0) { pick = c; break; } }
  lastCmd = pick.id;
  return pick;
}

function resolveDeck(def, pool, budget) {
  budget = budget || CFG.START_COIN;                  // 아직 열리지 않은 캐릭터는 비슷한 역할의 열린 캐릭터로 코인을 맞춰 대체
  const cost = k => CFG.UNITS[k].cost;
  const SUBS = { fire: ['knight'], assassin: ['knight'], witch: ['archer', 'knight'], mage: ['archer', 'knight'], castle: ['knight'], arma: ['knight'], flower: ['knight'], titan: ['knight'], launcher: ['archer', 'knight'], chicken: ['knight'], archer: ['knight'] };
  const cards = {}, place = {};
  for (const k in def.cards) {
    if (!CFG.UNITS[k]) continue;
    const t = pool.includes(k) ? k : ((SUBS[k] || []).find(x => pool.includes(x)) || 'knight');
    cards[t] = (cards[t] || 0) + (t === k ? def.cards[k] : Math.round(def.cards[k] * cost(k) / cost(t)));
    if (def.place && def.place[k] && !place[t]) place[t] = def.place[k];
  }
  const total = () => Object.keys(cards).reduce((s, k) => s + cards[k] * cost(k), 0);
  while (total() > budget) { const k = Object.keys(cards).filter(x => cards[x] > 0).sort((a, b) => cards[b] * cost(b) - cards[a] * cost(a))[0]; cards[k]--; }
  while (total() + cost('knight') <= budget) cards.knight = (cards.knight || 0) + 1;
  return { cards, place };
}

function counterScore(deck, mine) {                // 이 덱이 내 출전 목록을 얼마나 잘 카운터하는지 (코인 비중으로 가중 평균)
  let s = 0, tot = 0;
  for (const k in deck.cards) {
    const w = deck.cards[k] * CFG.UNITS[k].cost; tot += w;
    let m = 0; mine.forEach(y => { m += (COUNTER[k] && COUNTER[k][y]) || 0; });
    s += w * (mine.length ? m / mine.length : 0);
  }
  return tot ? s / tot : 0;
}

function bestCounterDeck() {
  const mine = SEL.filter(k => SAVE.owned.includes(k));
  return Object.keys(DECKS).map(id => ({ id, s: counterScore(resolveDeck(DECKS[id], S.aiPool), mine) + Math.random() * .25 })).sort((a, b) => b.s - a.s)[0].id;
}

function specFor(type, deck) {                     // 이 캐릭터의 정석 배치 규칙 (+ 증강에 따른 배치 변화)
  const base = ZONE[type] || (CFG.UNITS[type].range > 0 ? ZONE.archer : ZONE.knight);
  const sp = Object.assign({}, base, (deck.place && deck.place[type]) || {});
  const au = S.aiAugs || {}, has = (k, n) => (au[k] || []).includes(n);
  S.augUse = S.augUse || {};
  const skill = key => (key in S.augUse) ? S.augUse[key] : (S.augUse[key] = Math.random() < S.acc);   // 정확도가 높을수록 증강을 살리는 배치를 더 잘 해요
  if (type === 'flower' && !sp.behind) sp.behind = ['titan', 'arma', 'knight'];                       // 꽃순이는 사거리가 짧아서 탱커 바로 뒤에
  if (deck.cards.titan && has('titan', 4) && ['fire', 'flower', 'assassin'].includes(type) && skill('titanGuard')) sp.behind = 'titan';   // 타이탄 4증강(아군 보호): 뒤에 모아둠
  if (type === 'knight' && has('knight', 2) && skill('knightTight')) sp.tight = true;                                                     // 기사 2증강(집단지성): 바짝 붙임
  if (sp.group) sp.tight = true;
  return sp;
}

function layout(n, sp, type) {                     // 한 종류 n마리의 정석 위치들
  const span = MID - 36, yOf = d => MID - 16 - d * span, rr = CFG.UNITS[type].r, pts = [];
  if (sp.behind) {                                 // 지정한 캐릭터(예: 타이탄) 바로 뒤에 모아서
    let ref = [];
    for (const bt of [].concat(sp.behind)) { ref = S.units.filter(u => u.team === 2 && u.type === bt); if (ref.length) break; }   // 첫 번째로 있는 탱커 뒤에
    if (ref.length) {
      const cx = ref.reduce((t, u) => t + u.x, 0) / ref.length, cy = Math.min.apply(null, ref.map(u => u.y)), st = 2 * rr + 4;
      for (let i = 0; i < n; i++) pts.push([cx + ((i % 4) - 1.5) * st, cy - 30 - Math.floor(i / 4) * st]);
      return pts;
    }
  }
  const x0 = sp.x[0], x1 = sp.x[1], d0 = sp.d[0], d1 = sp.d[1], wpx = (x1 - x0) * W;
  if (sp.form === 'line' || sp.form === 'arc') {   // 일렬 / 학익진(양 끝이 앞으로 나온 반달 모양)
    for (let i = 0; i < n; i++) {
      const f = n === 1 ? .5 : i / (n - 1);
      const d = sp.form === 'arc' ? d1 - (d1 - d0) * Math.pow(Math.abs(f - .5) * 2, 2) : (d0 + d1) / 2;
      pts.push([(x0 + (x1 - x0) * f) * W, yOf(d)]);
    }
    return pts;
  }
  const dpx = Math.max(10, (d1 - d0) * span), minSt = 2 * rr + 4;
  const st = sp.tight ? minSt : Math.max(minSt, Math.min(46, Math.sqrt(wpx * dpx / n)));
  const cols = sp.group ? Math.min(n, 3) : Math.max(1, Math.min(n, Math.floor(wpx / st) + 1));
  const cx = sp.group ? (x0 + Math.random() * (x1 - x0)) * W : (x0 + x1) / 2 * W;
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols), inRow = Math.min(cols, n - row * cols), col = i % cols;
    pts.push([cx + (col - (inRow - 1) / 2) * st + (Math.random() - .5) * 4, yOf(d0) - row * st * .9]);
  }
  return pts;
}

function freeSpot(x, y, r) {                       // 다른 AI 캐릭터와 겹치면 바깥쪽으로 조금씩 밀어서 빈 자리 찾기
  const ok = (px, py) => !S.units.some(u => u.team === 2 && Math.hypot(u.x - px, u.y - py) < r + u.d.r + 1);
  const cX = v => Math.min(W - r, Math.max(r, v)), cY = v => Math.min(MID - r, Math.max(r, v));
  x = cX(x); y = cY(y);
  if (ok(x, y)) return [x, y];
  for (let k = 1; k < 40; k++) for (let a = 0; a < 8; a++) {
    const ang = a * TAU / 8 + k, px = cX(x + Math.cos(ang) * k * 5), py = cY(y + Math.sin(ang) * k * 5);
    if (ok(px, py)) return [px, py];
  }
  return [x, y];
}

function placeDeck(deck, acc) {                    // 덱을 소환해서 배치: 유닛마다 정확도 확률로 정석 위치, 아니면 아무 곳
  const ORD = ['titan', 'arma', 'castle', 'knight', 'fire', 'flower', 'assassin', 'launcher', 'archer', 'witch', 'mage', 'chicken'];
  const ord = k => { const i = ORD.indexOf(k); return i < 0 ? 50 : i; };
  Object.keys(deck.cards).filter(k => deck.cards[k] > 0).sort((a, b) => ord(a) - ord(b)).forEach(type => {
    const n = deck.cards[type], r = CFG.UNITS[type].r, pts = layout(n, specFor(type, deck), type);
    for (let i = 0; i < n; i++) {
      let x = pts[i][0], y = pts[i][1];
      if (!(Math.random() < acc)) { const q = pickSpot(2, type, 20, MID - 20); x = q[0]; y = q[1]; }   // 실수: 엉뚱한 자리
      const f = freeSpot(x, y, r);
      spawn(2, type, f[0], f[1]);
    }
  });
}

function aiPrep() {                                // 준비 시간에 AI가 덱을 정하고 증강을 배분하고 배치
  const c = S.cmd; S.deckName = '즉흥 덱';
  if (c.decks.length && (c.event || Math.random() < S.acc)) {
    const id = c.scout ? bestCounterDeck() : c.decks[Math.floor(Math.random() * c.decks.length)];
    const def = c.deckDef || DECKS[id];
    S.deckName = def.name;
    const deck = resolveDeck(def, S.aiPool, c.budget);
    S.aiAugs = rollAiAugs(Object.keys(deck.cards));
    placeDeck(deck, S.acc);
    S.coin[1] = 0;
    return;
  }
  S.aiAugs = rollAiAugs(null);
  while (aiBuyOne()) {}                            // 정석을 못 따른 경우: 예전처럼 랜덤으로 사서 아무 데나 배치
}

const EVENT_NAMES = { aug: ['증강 박사 에디', '무장 장군 아테나'], horde: ['군단의 제왕 레기온', '물량의 신 하데스'] };

// 컨셉 군단 덱: key 캐릭터가 열려 있어야 나와요 (코인 합 40)
const HORDES = [
  { key: 'knight',   name: '기사 대군',        cards: { knight: 40 } },
  { key: 'archer',   name: '궁수 대군',        cards: { archer: 20 }, place: { archer: { d: [.66, .86], x: [.05, .95], form: 'arc' } } },
  { key: 'castle',   name: '캐슬 군단',        cards: { castle: 6, knight: 10 }, place: { castle: { d: [.36, .58], x: [.08, .92] } } },
  { key: 'mage',     name: '마법사 군단',      cards: { mage: 8, witch: 2, knight: 2 } },
  { key: 'chicken',  name: '런치킨 떼',        cards: { chicken: 10, knight: 10 } },
  { key: 'titan',    name: '타이탄 군단',      cards: { titan: 8, flower: 2 } },
  { key: 'launcher', name: '런처 포대',        cards: { launcher: 6, fire: 3, knight: 7 } },
  { key: 'arma',     name: '아르마딜로 돌격대', cards: { arma: 10, knight: 10 } }
];

function rollEvent() {                             // 이번 판에 특별 지휘관이 나올지 판정
  const gap = Number(SAVE.evGap) || 0;
  if (SAVE.power < EVENT_MIN_POWER || gap < EVENT_MIN_GAP || !(gap >= EVENT_MAX_GAP || Math.random() < EVENT_CHANCE)) { SAVE.evGap = gap + 1; persist(); return null; }
  SAVE.evGap = 0; persist();
  const kinds = Object.keys(EVENT_WEIGHTS);
  let r = Math.random() * kinds.reduce((t, k) => t + EVENT_WEIGHTS[k], 0), type = kinds[0];
  for (const k of kinds) { r -= EVENT_WEIGHTS[k]; if (r <= 0) { type = k; break; } }
  const desc = type === 'aug' ? `증강을 잔뜩 단 지휘관! (증강 수 ×${EVENT_AUG_MULT})` : `${EVENT_HORDE_BUDGET}코인으로 시작하는 군단 지휘관!`;
  return { type, pal: EVENT_PALETTES[type], desc };
}

function specialCommander(ev) {
  const names = EVENT_NAMES[ev.type], name = names[Math.floor(Math.random() * names.length)];
  if (ev.type === 'horde') {
    const hs = HORDES.filter(h => S.aiPool.includes(h.key)), h = hs[Math.floor(Math.random() * hs.length)];
    S.coin[1] = EVENT_HORDE_BUDGET;
    return { id: 'ev-horde', name, style: h.name, decks: ['horde'], deckDef: h, budget: EVENT_HORDE_BUDGET, accFixed: true, event: 'horde' };
  }
  const lg = Math.floor(SAVE.power / 100);         // 증강 마스터: 평범한 지휘관의 덱을 쓰되 증강이 훨씬 많음
  const base = COMMANDERS.filter(c => c.id !== 'chaos' && lg >= (c.min || 0) && (c.need || []).every(k => S.aiPool.includes(k)));
  return Object.assign({}, base[Math.floor(Math.random() * base.length)], { name, event: 'aug', accFixed: true });
}

const LATE_GOOD = ['archer', 'knight', 'titan', 'assassin', 'launcher', 'fire', 'chicken'];   // 후반에 즉각 승부를 내는 카드

const LATE_BAD = ['castle', 'mage', 'witch', 'flower'];                                       // 라인전용 카드는 후반에 도움이 적음

function cardScore(k, st) {                        // 지금 상황에서 이 카드를 내는 게 얼마나 좋은지
  const D = CFG.UNITS[k]; let s = 0, w = 0, m = 0;
  for (const u of st.foes) { const q = u.d.cost || 1; w += q; m += q * ((COUNTER[k] && COUNTER[k][u.type]) || 0); }
  if (w) s += 1.2 * m / w;                                                                    // 살아있는 상대 구성에 맞는 카운터
  const hasL = st.foes.some(u => u.type === 'launcher'), myL = st.mine.some(u => u.type === 'launcher');
  if (hasL && COUNTER[k] && COUNTER[k].launcher > 0) s += .8;                                 // 상대 런처는 카운터로 부수기
  if (!hasL && D.range > 0) s += .4;                                                          // 상대에 런처가 없으면 원거리로 장악
  if (myL && (k === 'archer' || k === 'witch')) s += .5;                                      // 내 런처를 지키는 원거리
  if (st.el >= 40) {
    if (LATE_GOOD.includes(k)) s += .6;
    if (LATE_BAD.includes(k)) s -= .8;
    if (st.lead > .05 && k === 'chicken') s += 1;                                             // 이기고 있으면 런치킨으로 색칠 굳히기
  } else if (st.el > 25 && st.lead > .05 && k === 'chicken') s += .5;
  s += .25 * ((S.aiAugs[k] || []).length);                                                    // 증강이 많은 카드를 더 잘 활용
  return s - .06 * D.cost + (Math.random() - .5) * .5;
}

function aiBattle() {                              // 전투 중 AI 운영: 초반엔 아끼고, 상황 보고 카운터 소환, 후반엔 아낌없이
  if (S.phase !== 'battle') return;
  if (!(Math.random() < S.acc)) { if (Math.random() < .5 / incomeEvery()) aiBuyOne(); return; }   // 정석을 놓친 순간: 즉흥 소환
  const el = CFG.BATTLE - S.t;
  if (el > 57) return;                                                                         // 마지막 순간의 소환은 의미가 없어요
  let a = 0, b = 0;
  for (const t of S.owner) { if (t === 1) a++; else if (t === 2) b++; }
  const lead = (a + b) ? (b - a) / (a + b) : 0;                                                // AI 기준 점유율 우세(+) / 열세(−)
  const foes = S.units.filter(u => u.team === 1 && u.hp > 0 && u.type !== 'egg'), mine = S.units.filter(u => u.team === 2 && u.hp > 0 && u.type !== 'egg');
  const crisis = foes.filter(u => u.y < MID - 25).length;                                      // 내 진영 안으로 들어온 적 수
  const need = crisis >= 3 ? 1 : el >= 40 ? 1 : el < 20 ? 8 : lead > .05 ? 8 : lead < -.05 ? 6 : 5;   // 이만큼 모이면 쓰기 시작
  const st = { el, lead, foes, mine };
  const chickenFirst = el > 25 && el < 40 && lead > .05 && S.coin[1] >= CFG.UNITS.chicken.cost && Math.random() < .3 && S.aiPool.includes('chicken');
  if (!chickenFirst && S.coin[1] < need) return;
  for (let n = 0; n < 4; n++) {
    const opts = Object.keys(CFG.UNITS).filter(k => S.aiPool.includes(k) && CFG.UNITS[k].cost <= S.coin[1]);
    if (!opts.length) break;
    const k = (chickenFirst && n === 0) ? 'chicken' : opts.map(x => ({ x, s: cardScore(x, st) })).sort((p, q) => q.s - p.s)[0].x;
    S.coin[1] -= CFG.UNITS[k].cost;
    const q = pickSpot(2, k, 18, 40);
    spawn(2, k, q[0], q[1]);
    if (S.coin[1] < need - 2 && el < 40) break;                                                // 필요한 만큼만 쓰고 멈춤
  }
}