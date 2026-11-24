'use strict';
// ===== main.js =====
// 시작 준비 — 변수, 저장 불러오기, 버튼 연결, 게임 루프. (거의 안 바꿔요)
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['main.js'] = '2026.11.24-1';

/* ====================================================
   설정 (CONFIG) — 여기 숫자를 바꾸면 밸런스가 바뀝니다
   ==================================================== */

/* ====================================================
   기본 준비
   ==================================================== */

const W = 360, H = 480, MID = H / 2, CELL = 4, GW = W / CELL, GH = H / CELL, TAU = Math.PI * 2;

const $ = id => document.getElementById(id);

const cv = $('cv'); let ctx = cv.getContext('2d'); const gctx = ctx;   // 홈 화면에서 ctx를 잠깐 바꿔 쓰기 위해 let

const pcv = document.createElement('canvas'); pcv.width = GW; pcv.height = GH;

const pctx = pcv.getContext('2d'), img = pctx.createImageData(GW, GH);

const COL = { 1: [47, 107, 255], 2: [255, 61, 110] };      // 1 = 플레이어(파랑), 2 = AI(분홍)

const HEX = { 1: '#2f6bff', 2: '#ff3d6e' };

let S, last = 0, clock = 0, screen = 'home';

/* ====================================================
   게임 시작 / 상태
   ==================================================== */

/* ====================================================
   캐릭터 소환
   ==================================================== */

/* ====================================================
   페인트 칠하기
   ==================================================== */

/* ====================================================
   전투 로직
   ==================================================== */

/* ====================================================
   그리기
   ==================================================== */

/* ====================================================
   화면 갱신 / 버튼 / 드래그
   ==================================================== */

$('go').onclick = startBattle;

$('again').onclick = startGame;

$('tohome').onclick = () => loadScreen(() => show('home'), 1.1);

cv.addEventListener('pointerdown', e => {          // 준비 시간에만 아군을 드래그해서 배치
  if (S.phase !== 'prep') return;
  const [x, y] = pos(e); let best = null, bd = 1e9;
  for (const u of S.units) {
    if (u.team !== 1) continue;
    const d = Math.hypot(u.x - x, u.y - y);
    if (d < u.d.r + 8 && d < bd) { bd = d; best = u; }
  }
  if (best) { S.drag = { u: best, ox: best.x - x, oy: best.y - y }; cv.setPointerCapture(e.pointerId); }
});

cv.addEventListener('pointermove', e => {
  if (!S.drag) return;
  const [x, y] = pos(e), u = S.drag.u, r = u.d.r;
  u.x = Math.min(W - r, Math.max(r, x + S.drag.ox));
  u.y = Math.min(H - r, Math.max(MID + r, y + S.drag.oy));
});

const endDrag = () => { if (S) S.drag = null; };

cv.addEventListener('pointerup', endDrag);

cv.addEventListener('pointercancel', endDrag);

/* ====================================================
   홈 화면 / 캐릭터 선택 / 튜토리얼
   ==================================================== */

let SEL = [];

try { SEL = JSON.parse(localStorage.getItem('pk_sel') || '[]'); } catch (e) { SEL = []; }

if (!Array.isArray(SEL)) SEL = [];

SEL = SEL.filter(k => CFG.UNITS[k]).slice(0, MAX_PICK);

if (!SEL.length) SEL = Object.keys(CFG.UNITS).slice(0, MAX_PICK);

const saveSel = () => { try { localStorage.setItem('pk_sel', JSON.stringify(SEL)); } catch (e) {} };

$('bStart').onclick = startGame;

$('bSel').onclick = () => { buildSelect(); show('select'); };

$('bTut').onclick = () => { showTut(0); show('tutorial'); };

$('sdone').onclick = () => show('home');

$('tclose').onclick = () => show('home');

$('tprev').onclick = () => showTut(tp - 1);

$('tnext').onclick = () => showTut(tp + 1);

/* ====================================================
   닉네임 / 색상
   ==================================================== */

let FOE_NAME = 'AI 사령관';                         // 이번 판 AI 지휘관 이름 (newGame에서 바뀌어요)

let NICK = '지휘관', myColor = 'cobalt', UNLOCKED = [], animColor = false;

try {
  NICK = localStorage.getItem('pk_nick') || NICK;
  myColor = localStorage.getItem('pk_color') || myColor;
  UNLOCKED = JSON.parse(localStorage.getItem('pk_colors') || '[]');   // 팔레트로 해금한 색 id 목록 (나중에 팔레트 시스템이 채움)
} catch (e) {}

if (!Array.isArray(UNLOCKED)) UNLOCKED = [];

if (!COLORS.some(c => c.id === myColor && isOpen(c))) myColor = 'cobalt';

const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

applyColors(); refreshWho();

$('bProf').onclick = () => { buildProfile(); show('profile'); };

$('who').onclick = () => { buildProfile(); show('profile'); };

$('pdone').onclick = () => { saveNick(); show('home'); };

$('nick').onchange = saveNick;

$('nick').onkeydown = e => { if (e.key === 'Enter') e.target.blur(); };

/* ====================================================
   통솔력 / 리그 / 팔레트 / 보석
   ==================================================== */

let SAVE = { power: 0, maxPower: 0, gems: 0, owned: BASE.slice(), tickets: {}, augs: {}, missions: [], palettes: 0, palGiven: 0, dry: 0 };

try { Object.assign(SAVE, JSON.parse(localStorage.getItem('pk_save') || '{}')); } catch (e) {}

if (!Array.isArray(SAVE.owned)) SAVE.owned = [];

if (!SAVE.augs || typeof SAVE.augs !== 'object') SAVE.augs = {};

if (!Array.isArray(SAVE.missions)) SAVE.missions = [];

if (!SAVE.tickets || typeof SAVE.tickets !== 'object') SAVE.tickets = {};

SAVE.owned = SAVE.owned.filter(k => CFG.UNITS[k]);

BASE.forEach(k => { if (CFG.UNITS[k] && !SAVE.owned.includes(k)) SAVE.owned.push(k); });

const persist = () => store('pk_save', JSON.stringify(SAVE));

if (DEV_BOOST && SAVE.boost !== DEV_BOOST.id) {
  SAVE.power = Math.max(SAVE.power, DEV_BOOST.power || 0); SAVE.maxPower = Math.max(SAVE.maxPower, SAVE.power);
  SAVE.gems += DEV_BOOST.gems || 0; SAVE.palettes += DEV_BOOST.palettes || 0;
  if (DEV_BOOST.all) { Object.keys(CFG.UNITS).forEach(k => { if (!SAVE.owned.includes(k)) SAVE.owned.push(k); }); SEL = SAVE.owned.slice(0, MAX_PICK); saveSel(); }
  if (DEV_BOOST.tickets) SAVE.owned.forEach(k => { SAVE.tickets[k] = (SAVE.tickets[k] || 0) + DEV_BOOST.tickets; });
  SAVE.palGiven = Math.floor(SAVE.maxPower / PALETTE_STEP); SAVE.boost = DEV_BOOST.id; persist();
}

SEL = SEL.filter(k => SAVE.owned.includes(k));

if (!SEL.length) SEL = SAVE.owned.slice(0, MAX_PICK);

const leagueOf = k => { const l = LEAGUES.find(x => x.unlock.includes(k)); return l ? l.name : '더 높은 리그'; };

$('bPal').onclick = () => openPaletteScreen('home');

$('opal').onclick = () => openPaletteScreen('game');

$('palback').onclick = () => { if (palFrom === 'game') syncOpal(); show(palFrom); };

$('palopen').onclick = () => {
  if (palBusy || SAVE.palettes <= 0) return;
  palBusy = true; $('palres').innerHTML = ''; pal.phase = 'open'; pal.t = 0; pal.res = null; pal.shown = false; palUI();
};

/* ====================================================
   증강 (캐릭터당 5개, 증강권 1장 + 보석으로 해금, 해금하면 자동 적용)
   ==================================================== */

$('augback').onclick = () => { buildSelect(); show('select'); };

/* ====================================================
   AI 지휘관 시스템 (정석 매뉴얼 + 정확도)
   ==================================================== */

/* ====================================================
   특별 AI 이벤트 (특별 지휘관) + 전투 중 AI 운영
   ==================================================== */

/* ====================================================
   팔레트 열기 연출
   ==================================================== */

/* ====================================================
   미션 (완료하면 보석, 가진 캐릭터로 깰 수 있는 것만 등장)
   ==================================================== */

fillMissions();

$('bMis').onclick = () => { buildMissions(); show('missions'); };

$('mback').onclick = () => show('home');

/* ====================================================
   캐릭터 그림(이모지 대신) / 배경음악 / 설정 / 백업
   ==================================================== */

$('sMusic').onclick = toggleMusic;

$('hMute').onclick = toggleMusic;

$('sVol').oninput = e => { SND.vol = e.target.value / 100; saveSnd(); renderSnd(); };

$('bSet').onclick = () => { renderSnd(); $('bk').value = ''; $('bkHint').textContent = ''; show('settings'); };

$('sdone2').onclick = () => show('home');

renderSnd();

$('bkOut').onclick = () => {                       // 저장 데이터를 글자 한 줄(백업 코드)로 만들어요
  const data = { v: 1, save: SAVE, nick: NICK, color: myColor, colors: UNLOCKED, sel: SEL };
  const bytes = new TextEncoder().encode(JSON.stringify(data)); let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  const code = btoa(bin);
  $('bk').value = code; $('bk').select();
  bkHint('백업 코드를 만들었어요. 전체를 복사해서 메모장이나 메신저에 보관하세요');
  try { if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => bkHint('복사했어요! 메모장이나 메신저에 붙여넣어 보관하세요')).catch(() => {}); } catch (e) {}
};

$('bkIn').onclick = () => {
  const code = $('bk').value.trim();
  if (!code) { bkHint('붙여넣은 코드가 없어요'); return; }
  try {
    const bytes = Uint8Array.from(atob(code), c => c.charCodeAt(0)), d = JSON.parse(new TextDecoder().decode(bytes));
    if (!d || d.v !== 1 || !d.save || typeof d.save !== 'object') throw new Error('bad');
    if (!confirm('지금 저장된 데이터가 백업 데이터로 바뀌어요. 계속할까요?')) return;
    store('pk_save', JSON.stringify(d.save)); store('pk_nick', d.nick || ''); store('pk_color', d.color || '');
    store('pk_colors', JSON.stringify(d.colors || [])); store('pk_sel', JSON.stringify(d.sel || []));
    location.reload();
  } catch (e) { bkHint('올바른 백업 코드가 아니에요'); }
};

/* ====================================================
   금속 광택 / 로딩 화면 / 결과 화면 1 / 버전
   ==================================================== */

$('sVer').textContent = '파일 버전\n' + Object.keys(FV).map(k => k + '  ' + FV[k]).join('\n');   // 설정 화면에서 어떤 버전이 올라가 있는지 확인용

$('res1').onclick = () => { if (!R1.on) return; if (R1.t < R1.end) R1.t = R1.end; else finishRes1(); };   // 터치하면 건너뛰기

function fit() {
  const s = Math.min(innerWidth / 360, innerHeight / 770);
  $('wrap').style.height = Math.max(770, innerHeight / s) + 'px';     // 화면이 세로로 더 길면 아래쪽을 늘려서 꽉 채움
  $('wrap').style.transform = `translate(-50%,-50%) scale(${s})`;
}

addEventListener('resize', fit);

function loop(ts) {
  const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts; clock = ts / 1000; if (animColor) applyColors(); bgmTick(dt);
  if (screen === 'game') { if (S.phase !== 'over') update(dt); draw(); ui(); }
  else if (screen === 'home') drawHome();
  else if (screen === 'palette') drawPal();
  if (R1.on) drawRes1(dt);
  if (LD.on) drawLoading(dt);
  requestAnimationFrame(loop);
}

fit(); newGame(); show('home'); loadScreen(null, 1.4); requestAnimationFrame(loop);