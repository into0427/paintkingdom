'use strict';
// ===== screens.js =====
// 화면들 — 소환 버튼 줄, 캐릭터 선택, 튜토리얼 글, 홈 화면 글자들.
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['screens.js'] = '2026.11.24-1';

function ui() {
  $('phase').textContent = S.phase === 'prep' ? '🎨 전투 준비' : S.phase === 'battle' ? '⚔️ 전투 중' : '🏁 종료';
  $('timer').textContent = Math.max(0, Math.ceil(S.t)) + '초';
  $('coin').textContent = '🪙 ' + S.coin[0];
  document.querySelectorAll('.ub').forEach(b => { b.disabled = S.phase === 'over' || S.coin[0] < CFG.UNITS[b.dataset.t].cost; });
  const go = $('go');
  go.disabled = S.phase !== 'prep';
  go.textContent = S.phase === 'prep' ? '전투 시작 (남은 코인은 사라져요)' : S.phase === 'battle' ? `전투 중 · ${incomeEvery()}초마다 +1코인` : '전투 종료';
}

function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }

const DESC = {                                     // 캐릭터 한 줄 설명 (새 캐릭터를 만들면 여기에도 추가하세요)
  knight: '빠르고 값싼 기본 병사. 지나간 길을 칠해요',
  archer: '긴 사거리로 근접 캐릭터를 사냥해요',
  launcher: '멀리 있는 적에게 거대한 페인트볼 발사',
  chicken: '공격 없이 뛰어다니며 색칠만 하는 닭',
  titan: '거대한 체력으로 앞을 막는 탱커',
  fire: '부채꼴로 계속 분사해요. 방향 전환은 느려요',
  assassin: '적이 가까워지면 순간이동해서 기습해요',
  witch: '저주 장판으로 적을 느리고 둔하게 만들어요',
  mage: '번개 한 방으로 적을 잠깐 기절시켜요',
  castle: '적이 다가오면 기사를 계속 소환하는 건물',
  arma: '쉴드를 두르고 연쇄로 구르는 돌격병',
  flower: '꽃씨로 적은 공격, 아군은 회복시켜요'
};

function show(name) {                              // 화면 전환: home / select / tutorial / game
  screen = name; if (name === 'home') refreshHome();
  for (const id of ['home', 'select', 'profile', 'palette', 'augscr', 'missions', 'settings', 'tutorial']) $(id).hidden = id !== name;
}

function buildShop() {                             // 선택한 캐릭터만 소환 버튼으로 만들기
  const box = $('units'); box.innerHTML = '';
  for (const k in CFG.UNITS) {
    if (!SEL.includes(k)) continue;
    const d = CFG.UNITS[k], b = document.createElement('button');
    b.className = 'ub'; b.dataset.t = k;
    b.innerHTML = `<span class="ic"></span><span class="tx">${d.name}<small>${d.cost}코인</small></span>`;
    b.querySelector('.ic').appendChild(mkIcon(k, 30));
    b.onclick = () => buy(k);
    box.appendChild(b);
  }
}

function startGame() {
  if (!SEL.length) { buildSelect(); show('select'); return; }
  loadScreen(() => { buildShop(); newGame(true); show('game'); }, 1.2);
}

let hintT;

function buildSelect() {
  const g = $('sgrid'); g.innerHTML = '';
  const pool = unlockedPool(SAVE.maxPower);
  for (const k in CFG.UNITS) {
    const d = CFG.UNITS[k], own = SAVE.owned.includes(k), c = document.createElement('button');
    c.className = 'card' + (own ? '' : ' lock') + (own && SEL.includes(k) ? ' on' : '');
    const na = (SAVE.augs[k] || []).length, tk = SAVE.tickets[k] || 0;
    const note = own ? (DESC[k] || '') : pool.includes(k) ? '팔레트에서 얻을 수 있어요' : `${leagueOf(k)}에 도달하면 팔레트에 등장해요`;
    c.innerHTML = `<span class="ci">${own ? '' : '🔒'}</span><span class="ct"><b>${d.name} <small>${d.cost}코인</small></b><em>체력 ${d.hp}${d.shield ? '+' + d.shield : ''} · 공격 ${d.atk}${own ? ' · 증강 ' + na + '/5' : ''}</em><i>${note}</i>${own && tk > 0 && na < 5 ? `<span class="up">⬆ 업그레이드 가능! (증강권 ${tk})</span>` : ''}</span>${own ? '<span class="gear">⚙️</span>' : ''}`;
    if (own) {
      c.querySelector('.ci').appendChild(mkIcon(k, 34));
      const open = e => { e.stopPropagation(); openAug(k); };
      c.querySelector('.gear').onclick = open;
      const up = c.querySelector('.up'); if (up) up.onclick = open;
    }
    c.onclick = () => {
      if (!own) { hint(note); return; }
      const i = SEL.indexOf(k);
      if (i >= 0) SEL.splice(i, 1);
      else if (SEL.length < MAX_PICK) SEL.push(k);
      else { hint(`최대 ${MAX_PICK}개까지 고를 수 있어요`); return; }
      c.classList.toggle('on', SEL.includes(k)); saveSel(); count();
    };
    g.appendChild(c);
  }
  count();
}

function count() { $('scount').textContent = `선택 ${SEL.length} / ${MAX_PICK}`; $('sdone').disabled = !SEL.length; }

function hint(t) {
  $('shint').textContent = t; clearTimeout(hintT);
  hintT = setTimeout(() => { $('shint').textContent = '출전시킬 캐릭터를 눌러서 고르세요'; }, 1800);
}

let tp = 0;

function tutPages() {
  const C = CFG;
  const list = Object.keys(C.UNITS).map(k => `<li>${C.UNITS[k].icon} <b>${C.UNITS[k].name}</b> (${C.UNITS[k].cost}코인) – ${DESC[k] || ''}</li>`).join('');
  return [
    ['🎯 게임 목표', `<p>아레나를 <b>내 페인트</b>로 더 많이 칠하면 승리!</p><p>화면의 <b>위쪽 절반은 상대 진영</b>, <b>아래쪽 절반은 내 진영</b>이에요. 전투가 끝났을 때 아레나에 내 색이 더 많이 칠해져 있으면 이겨요.</p><p>같은 자리를 다시 칠하면 <b>나중에 칠한 색</b>으로 바뀌어요. 싸움도 중요하지만 칠하는 것도 잊지 마세요!</p>`],
    [`🎨 1단계: 전투 준비 (${C.PREP}초)`, `<p>${C.START_COIN}코인으로 군대를 짜요.</p><ul><li>아래 버튼으로 캐릭터를 고르면 코인이 쓰이고 내 진영에 소환돼요.</li><li>소환된 캐릭터는 <b>끌어서</b> 원하는 위치로 옮길 수 있어요.</li><li>상대 진영은 <b>보이지 않아요!</b> 상대가 뭘 냈을지 예상해 보세요.</li><li>준비가 끝나면 <b>전투 시작</b> 버튼을 누르거나 ${C.PREP}초를 기다리세요.</li></ul><p>⚠️ <b>남은 코인은 전투가 시작되면 사라져요.</b> 아끼지 말고 다 쓰세요!</p>`],
    [`⚔️ 2단계: 전투 (${C.BATTLE}초)`, `<p>이제 양쪽 진영이 모두 보여요. 캐릭터들은 <b>알아서 싸워요</b>.</p><ul><li>전투는 <b>0코인</b>에서 시작해요. 코인은 <b>${C.INCOME_STEPS.map(x => x[1] + '초').join(' → ')}</b> 간격으로 1코인씩 들어오고, <b>후반으로 갈수록 빨라져요.</b></li><li>모은 코인으로 추가 지원군을 소환할 수 있어요. 지원군은 내 진영 맨 아래쪽에서 나타나요.</li><li>전투 중에 소환한 캐릭터는 <b>${C.SPAWN_SHIELD}초 동안 무적</b>이고 상대의 타겟이 되지 않아요. 밀리고 있을 때 역전 기회예요!</li></ul>`],
    ['🖌️ 페인트 칠하기', `<p>캐릭터마다 칠하는 방식이 달라요.</p><ul><li><b>지나간 길</b>을 칠해요: 기사, 타이탄, 런치킨, 아르마딜로</li><li><b>화살이 지나간 길</b>: 궁수</li><li><b>맞은 곳 주변</b>: 페인트런처, 마녀, 마법사</li><li><b>부채꼴 범위에 점</b>을 흩뿌려요: 소방관</li><li>걸어다니며 점을 흩뿌려요: 꽃순이</li></ul><p>전투가 약해도 색칠을 잘하는 캐릭터가 승부를 가를 수 있어요.</p>`],
    ['🧠 상성 팁', `<ul><li><b>궁수·소방관</b>: 기사 같은 근접 캐릭터를 잘 잡아요.</li><li><b>페인트런처</b>: 먼 곳에서 궁수·소방관을 순삭해요.</li><li><b>기사·타이탄</b>: 빠르게 다가가 느린 런처를 잡아요.</li><li><b>런치킨</b>: 싸움엔 도움이 안 되지만 후반 색칠 싸움의 핵심! 단, 궁수에게는 약해요.</li><li><b>캐슬</b>: 수비할 때 든든해요. 적이 다가오면 기사가 계속 나와요.</li></ul><p>상대의 조합을 보고 맞는 카운터를 소환해 보세요.</p>`],
    ['👑 통솔력과 팔레트', `<p>전투에서 이기면 <b>통솔력</b>이 오르고, 지면 내려가요. (AI전은 약 ±${POWER.ai}, 점유율 차이가 클수록 더 많이 변해요)</p><ul><li>통솔력 100마다 <b>리그</b>가 올라가요. 한 번 올라간 리그의 <b>최저점 아래로는 떨어지지 않아요.</b></li><li>통솔력이 ${PALETTE_STEP} 오를 때마다 <b>팔레트</b>를 1개 받아요. (최고 기록을 넘을 때만이에요)</li><li>팔레트에서는 <b>새 캐릭터</b>, <b>보석</b>, <b>새 색상</b>이 나와요.</li><li>이미 가진 캐릭터가 또 나오면 <b>증강권</b>이 돼요.</li><li>리그가 올라가면 더 많은 캐릭터가 팔레트에 나오고, AI도 더 다양한 캐릭터를 써요.</li></ul>`],
    ['🔧 증강', `<p>팔레트에서 <b>이미 가진 캐릭터</b>가 또 나오면 <b>증강권</b>을 얻어요.</p><ul><li>캐릭터 선택 화면에서 <b>⬆ 업그레이드 가능!</b>이 뜬 캐릭터(또는 ⚙️)를 눌러요.</li><li>증강 5개 중 마음에 드는 것을 <b>증강권 1장 + 보석</b>으로 해금해요.</li><li>해금한 증강은 <b>전부 자동으로 적용</b>돼요. (내 캐릭터에만 적용돼요)</li></ul>`],
    ['📜 미션', `<p>미션을 완료하면 <b>보석(💎)</b>을 받아요. (통솔력은 오르지 않아요)</p><ul><li>미션은 항상 <b>3개</b>가 떠 있고, 내가 가진 캐릭터로 깰 수 있는 것만 나와요.</li><li>하나를 완료하면 새 미션으로 바뀌어요.</li><li>마음에 안 드는 미션은 칸마다 <b>하루에 한 번</b> 바꿀 수 있어요.</li><li>필요한 캐릭터는 <b>캐릭터 선택</b>에서 출전시켜야 해요.</li></ul>`],
    ['🤖 AI 지휘관', `<p>상대는 <b>이름과 스타일이 있는 AI 지휘관</b>이에요. 이름은 전투가 시작돼야 보여요.</p><ul><li>지휘관마다 좋아하는 덱이 있고, 어떤 덱인지는 전투가 시작돼야 알 수 있어요.</li><li>리그가 높아질수록 정석에 가깝게 덱을 짜고, 배치하고, 증강과 지원군을 쓰지만 <b>절대 완벽하진 않아요.</b></li><li>높은 리그에는 내 출전 목록을 보고 카운터 덱을 꺼내는 분석가도 나와요.</li><li>가끔 <b>⚡ 특별 지휘관</b>이 나와요. 전투 전에 안내가 뜨고, 이기면 <b>팔레트를 여러 개</b> 받아요.</li></ul>`],
    ['📋 캐릭터 도감', `<ul>${list}</ul>`]
  ];
}

function showTut(i) {
  const pg = tutPages(); tp = Math.max(0, Math.min(pg.length - 1, i));
  $('ttitle').textContent = pg[tp][0]; $('tbody').innerHTML = pg[tp][1]; $('tbody').scrollTop = 0;
  $('tdots').innerHTML = pg.map((_, n) => `<span class="${n === tp ? 'on' : ''}"></span>`).join('');
  $('tprev').disabled = tp === 0; $('tnext').disabled = tp === pg.length - 1;
}

function refreshHome() {
  refreshWho();
  const i = leagueIdx(SAVE.maxPower), lg = LEAGUES[i], nx = LEAGUES[i + 1];
  $('sPow').textContent = `👑 ${SAVE.power} · ${lg.name}`;
  $('sGem').textContent = `💎 ${SAVE.gems}`;
  $('lfill').style.width = Math.max(0, Math.min(100, (SAVE.power - lg.min) / (nx ? nx.min - lg.min : 100) * 100)) + '%';
  const toPal = PALETTE_STEP - (SAVE.maxPower % PALETTE_STEP);
  $('lmsg').textContent = (nx ? `다음 리그까지 ${nx.min - SAVE.power} · ` : '') + `다음 팔레트까지 ${toPal}`;
  $('palN').textContent = SAVE.palettes ? `(${SAVE.palettes})` : '';
  $('bPal').classList.toggle('glow', SAVE.palettes > 0);
}