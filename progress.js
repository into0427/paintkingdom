'use strict';
// ===== progress.js =====
// 통솔력 / 리그 / 전투 결과 처리 (결과 화면 2의 글 내용 포함).
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['progress.js'] = '2026.11.24-1';

function leagueIdx(p) { let i = 0; LEAGUES.forEach((l, n) => { if (p >= l.min) i = n; }); return i; }

function unlockedPool(p) {                         // 이 통솔력에서 팔레트(와 AI)에 나올 수 있는 캐릭터
  const pool = BASE.filter(k => CFG.UNITS[k]);
  LEAGUES.forEach(l => { if (p >= l.min) l.unlock.forEach(k => { if (CFG.UNITS[k] && !pool.includes(k)) pool.push(k); }); });
  return pool;
}

function applyResult(a, b) {                       // 전투 결과를 통솔력에 반영
  const tot = a + b, d = tot ? Math.abs(a - b) / tot : 0;
  const delta = Math.round(POWER.ai - 2 + 4 * Math.min(1, d / .5));     // 점유율 차이에 따라 18~22
  const before = SAVE.power, lg0 = leagueIdx(SAVE.maxPower);
  const ch = a > b ? delta : a < b ? -delta : 0;
  SAVE.power = Math.max(LEAGUES[lg0].min, SAVE.power + ch);              // 리그 바닥 아래로는 안 떨어짐
  SAVE.maxPower = Math.max(SAVE.maxPower, SAVE.power);
  const earned = Math.max(0, Math.floor(SAVE.maxPower / PALETTE_STEP) - SAVE.palGiven);
  SAVE.palGiven += earned; SAVE.palettes += earned;
  persist();
  const lg1 = leagueIdx(SAVE.maxPower);
  return { ch, real: SAVE.power - before, earned, promoted: lg1 > lg0 ? lg1 : -1 };
}

function showOutcome(a, b) {                       // 종료 화면에 통솔력/팔레트 결과 표시
  const r = applyResult(a, b), lg = LEAGUES[leagueIdx(SAVE.maxPower)];
  const lab = a > b ? '+' + r.ch : a < b ? (r.real === 0 ? '리그 바닥이라 유지' : r.real) : '무승부';
  let h = `👑 통솔력 <b>${SAVE.power}</b> (${lab}) · ${lg.name}`;
  if (r.promoted >= 0) {
    const names = LEAGUES[r.promoted].unlock.map(k => CFG.UNITS[k] && CFG.UNITS[k].name).filter(Boolean).join('·');
    h += `<br>🎉 ${LEAGUES[r.promoted].name} 승급!` + (names ? ` ${names}이(가) 팔레트에 나와요` : '');
  }
  if (r.earned) h += `<br>🎁 팔레트 +${r.earned}`;
  evalMissions(missionCtx(a, b)).forEach(m => { h += `<br>✅ 미션 완료! ${m.txt} (+${MISSION_GEMS[m.lv - 1]}💎)`; });
  if (S.event) {                                   // 특별 지휘관: 이기면 팔레트 보상
    if (a > b) { SAVE.palettes += S.event.pal; h += `<br>⚡ 특별 지휘관을 쓰러뜨렸어요! 🎁 팔레트 +${S.event.pal}`; }
    else h += `<br>⚡ 특별 지휘관에게 졌어요… 다음엔 꼭!`;
  }
  persist();
  $('pinfo').innerHTML = h; syncOpal();
}

function syncOpal() { $('opal').hidden = SAVE.palettes <= 0; $('opal').textContent = `🎨 팔레트 열기 (${SAVE.palettes})`; }