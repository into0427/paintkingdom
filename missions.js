'use strict';
// ===== missions.js =====
// 미션 — 미션 목록과 판정, 미션 화면.
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['missions.js'] = '2026.11.24-1';

const RANGED = ['archer', 'launcher', 'witch', 'mage', 'flower'], MELEE = ['knight', 'titan', 'assassin', 'arma'];

const only = (c, list) => { const ks = Object.keys(c.st.summoned); return ks.length > 0 && ks.every(k => list.includes(k)); };

const kl = (c, k) => c.st.kills[k] || 0, sm = (c, k) => c.st.summoned[k] || 0;

const total = o => Object.values(o).reduce((t, v) => t + v, 0);

// req = 필요한 캐릭터, need = 추가 조건, ok = 한 판 안에서 달성 여부, type 'streak' = 연승, type 'sum' = 여러 판 합산
const MISSIONS = [
  { id: 'wins2', lv: 1, type: 'sum', target: 2, txt: '승리 2번 하기 (여러 판 합산)', val: c => c.win ? 1 : 0 },
  { id: 'prep0', lv: 1, txt: '준비 시간에 코인을 하나도 남기지 않고 모두 쓰기', ok: c => c.st.prepLeft === 0 },
  { id: 'reinf5', lv: 1, txt: '전투 중에 지원군을 8번 이상 소환하기', ok: c => c.st.battleSummons >= 8 },
  { id: 'mix4', lv: 1, txt: '준비 시간에 서로 다른 캐릭터 4종 이상 배치하기', need: o => o.length >= 4, ok: c => Object.keys(c.st.prepTypes).length >= 4 },
  { id: 'archer3', lv: 1, txt: '궁수를 5명 이상 소환하기', req: ['archer'], ok: c => sm(c, 'archer') >= 5 },
  { id: 'chick2', lv: 1, txt: '런치킨을 3마리 이상 소환하고 승리하기', req: ['chicken'], ok: c => c.win && sm(c, 'chicken') >= 3 },
  { id: 'launch1', lv: 1, txt: '페인트런처를 2대 이상 소환하고 승리하기', req: ['launcher'], ok: c => c.win && sm(c, 'launcher') >= 2 },
  { id: 'kill10', lv: 1, txt: '한 판에 적을 15명 이상 처치하기', ok: c => c.st.killsTotal >= 15 },

  { id: 'knightOnly', lv: 2, txt: '기사만 써서 승리하기', req: ['knight'], ok: c => c.win && only(c, ['knight']) },
  { id: 'chickLive', lv: 2, txt: '런치킨이 처음부터 끝까지 죽지 않게 하기', req: ['chicken'], ok: c => !!c.st.prepTypes.chicken && !c.st.deaths.chicken },
  { id: 'titanLive', lv: 2, txt: '타이탄이 처음부터 끝까지 살아남아 승리하기', req: ['titan'], ok: c => c.win && !!c.st.prepTypes.titan && !c.st.deaths.titan },
  { id: 'flowerLive', lv: 2, txt: '꽃순이가 처음부터 끝까지 살아남아 승리하기', req: ['flower'], ok: c => c.win && !!c.st.prepTypes.flower && !c.st.deaths.flower },
  { id: 'streak3', lv: 2, type: 'streak', target: 3, txt: '3연승 하기' },
  { id: 'wins5', lv: 2, type: 'sum', target: 5, txt: '승리 5번 하기 (여러 판 합산)', val: c => c.win ? 1 : 0 },
  { id: 'kills30', lv: 2, type: 'sum', target: 30, txt: '적 30명 처치하기 (여러 판 합산)', val: c => c.st.killsTotal },
  { id: 'fireKill', lv: 2, txt: '소방관으로 적 3명 이상 처치하기', req: ['fire'], ok: c => kl(c, 'fire') >= 3 },
  { id: 'launchKill', lv: 2, txt: '페인트런처로 적 4명 이상 처치하기', req: ['launcher'], ok: c => kl(c, 'launcher') >= 4 },
  { id: 'mageKill', lv: 2, txt: '마법사로 적 3명 이상 처치하기', req: ['mage'], ok: c => kl(c, 'mage') >= 3 },
  { id: 'assnKill', lv: 2, txt: '암살자로 적 2명 이상 처치하기', req: ['assassin'], ok: c => kl(c, 'assassin') >= 2 },
  { id: 'armaKill', lv: 2, txt: '아르마딜로로 적 3명 이상 처치하기', req: ['arma'], ok: c => kl(c, 'arma') >= 3 },
  { id: 'titanWin', lv: 2, txt: '타이탄을 소환하고 승리하기', req: ['titan'], ok: c => c.win && sm(c, 'titan') >= 1 },
  { id: 'castleWin', lv: 2, txt: '캐슬을 소환하고 승리하기', req: ['castle'], ok: c => c.win && sm(c, 'castle') >= 1 },
  { id: 'witchWin', lv: 2, txt: '마녀를 소환하고 승리하기', req: ['witch'], ok: c => c.win && sm(c, 'witch') >= 1 },
  { id: 'big', lv: 2, txt: '점유율 차이 30% 이상으로 승리하기', ok: c => c.win && c.d >= .3 },

  { id: 'streak5', lv: 3, type: 'streak', target: 5, txt: '5연승 하기' },
  { id: 'wipe', lv: 4, txt: '게임이 끝났을 때 적이 한 명도 남지 않게 하기', ok: c => c.enemyAlive === 0 && c.st.killsTotal >= 3 },
  { id: 'noLoss', lv: 4, txt: '내 캐릭터를 하나도 잃지 않고 승리하기', ok: c => c.win && total(c.st.deaths) === 0 && total(c.st.summoned) >= 5 },
  { id: 'rangedOnly', lv: 3, txt: '원거리 캐릭터(궁수·페인트런처·마녀·마법사·꽃순이)만 써서 승리하기', need: o => RANGED.filter(k => o.includes(k)).length >= 2, ok: c => c.win && only(c, RANGED) },
  { id: 'meleeOnly', lv: 3, txt: '근접 캐릭터(기사·타이탄·암살자·아르마딜로)만 써서 승리하기', need: o => MELEE.filter(k => o.includes(k)).length >= 2, ok: c => c.win && only(c, MELEE) },
  { id: 'crush', lv: 4, txt: '점유율 차이 50% 이상으로 압승하기', ok: c => c.win && c.d >= .5 },
  { id: 'mix6', lv: 3, txt: '한 판에 서로 다른 캐릭터 6종 이상 소환하기', need: o => o.length >= 6, ok: c => Object.keys(c.st.summoned).length >= 6 },
  { id: 'kill25', lv: 3, txt: '한 판에 적을 25명 이상 처치하기', ok: c => c.st.killsTotal >= 25 }
];

const todayStr = () => { const t = new Date(); return `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`; };

function newMission(slot, excl, rr) {              // 가진 캐릭터로 깰 수 있는 미션 중 하나를 랜덤으로 뽑음
  const shown = SAVE.missions.map(m => m && m.id);
  const el = MISSIONS.filter(m => (m.req || []).every(k => CFG.UNITS[k] && SAVE.owned.includes(k)) && (!m.need || m.need(SAVE.owned)));
  let pool = el.filter(m => m.id !== excl && !shown.includes(m.id));
  if (!pool.length) pool = el.filter(m => m.id !== excl);
  if (!pool.length) pool = el;
  const m = pool[Math.floor(Math.random() * pool.length)];
  return { id: m.id, prog: 0, rr: rr || '' };
}

function fillMissions() {
  for (let i = 0; i < 3; i++) if (!SAVE.missions[i] || !MISSIONS.some(m => m.id === SAVE.missions[i].id)) SAVE.missions[i] = newMission(i, null, SAVE.missions[i] && SAVE.missions[i].rr);
  SAVE.missions.length = 3; persist();
}

function missionCtx(a, b) {
  const st = S.stats;
  return { win: a > b, loss: a < b, a, b, d: (a + b) ? Math.abs(a - b) / (a + b) : 0, st, enemyAlive: S.units.filter(u => u.team === 2 && u.hp > 0 && u.type !== 'egg').length };
}

function evalMissions(c) {                         // 전투가 끝날 때 미션 3개를 검사, 완료하면 보석 지급 후 새 미션으로 교체
  const done = [];
  SAVE.missions.forEach(m => {
    const def = MISSIONS.find(x => x.id === m.id); if (!def) return;
    let ok;
    if (def.type === 'streak') { m.prog = c.win ? (m.prog || 0) + 1 : c.loss ? 0 : (m.prog || 0); ok = m.prog >= def.target; }
    else if (def.type === 'sum') { m.prog = (m.prog || 0) + def.val(c); ok = m.prog >= def.target; }
    else ok = !!def.ok(c);
    if (ok) done.push(def);
  });
  done.forEach(def => {
    SAVE.gems += MISSION_GEMS[def.lv - 1];
    const i = SAVE.missions.findIndex(m => m.id === def.id);
    SAVE.missions[i] = newMission(i, def.id, SAVE.missions[i].rr);
  });
  return done;
}

function rerollMission(i) {                        // 칸마다 하루에 한 번 무료로 다시 뽑기
  const m = SAVE.missions[i];
  if (m.rr === todayStr()) return;
  SAVE.missions[i] = newMission(i, m.id, todayStr()); persist(); buildMissions();
}

function buildMissions() {
  const box = $('mlist'); box.innerHTML = '';
  SAVE.missions.forEach((m, i) => {
    const def = MISSIONS.find(x => x.id === m.id); if (!def) return;
    const row = document.createElement('div'); row.className = 'mrow';
    row.innerHTML = `<div class="mt"><b>${def.txt}</b><span>${'★'.repeat(def.lv)} · 💎 ${MISSION_GEMS[def.lv - 1]}${def.target ? ` · 진행 ${m.prog || 0}/${def.target}` : ''}</span></div>`;
    const b = document.createElement('button'), used = m.rr === todayStr();
    b.className = 'mre'; b.textContent = used ? '🔄 오늘은 사용함 (내일 초기화)' : '🔄 바꾸기'; b.disabled = used;
    b.onclick = () => rerollMission(i);
    row.appendChild(b); box.appendChild(row);
  });
}