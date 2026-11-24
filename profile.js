'use strict';
// ===== profile.js =====
// 닉네임 / 색상 — 색상 목록, 변하는 색(무지개 등), 프로필 화면.
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['profile.js'] = '2026.11.24-1';

const TIERS = ['기본', '희귀', '전설'];

// hex = 내 색, foe = 그때 상대에게 자동으로 붙는 보색, tier = 0 기본(처음부터 사용) / 1 희귀 / 2 전설, anim = 계속 변하는 색
const COLORS = [
  { id: 'cobalt', name: '코발트 블루', hex: '#2f6bff', foe: '#ff3d6e', tier: 0 },
  { id: 'cherry', name: '체리 레드',   hex: '#ff3d6e', foe: '#2f6bff', tier: 0 },
  { id: 'mint',   name: '민트 그린',   hex: '#22b573', foe: '#e83e8c', tier: 0 },
  { id: 'sunset', name: '선셋 오렌지', hex: '#ff8a1f', foe: '#1f8fff', tier: 0 },
  { id: 'violet', name: '바이올렛',    hex: '#8b5cf6', foe: '#8fbf1f', tier: 1 },
  { id: 'teal',   name: '터콰이즈',    hex: '#14b8a6', foe: '#f0455f', tier: 1 },
  { id: 'gold',   name: '골드',        hex: '#f2b705', foe: '#4f46e5', tier: 1, shine: true, sw: 'linear-gradient(135deg,#fff6bf,#f2b705 38%,#b8860b 62%,#ffe27a)' },
  { id: 'silver',   name: '실버',     hex: '#a9b6c8', foe: '#c2255c', tier: 1, shine: true, sw: 'linear-gradient(135deg,#ffffff,#b8c4d4 35%,#7d8a9b 60%,#eef3f8)' },
  { id: 'rosegold', name: '로즈골드', hex: '#e8a190', foe: '#1b998b', tier: 1, shine: true, sw: 'linear-gradient(135deg,#fff0ea,#e8a190 40%,#b86f61 62%,#ffd5c9)' },
  { id: 'emerald',  name: '에메랄드', hex: '#0b8f5a', foe: '#d63384', tier: 1, shine: true, sw: 'linear-gradient(135deg,#a7ffd8,#0b8f5a 45%,#065f3b 70%,#4ade80)' },
  { id: 'rose',   name: '로즈 핑크',   hex: '#ff6fae', foe: '#1fa37a', tier: 1 },
  { id: 'onyx',     name: '오닉스',   hex: '#2b2e3f', foe: '#ffb020', tier: 2, shine: true, sw: 'linear-gradient(135deg,#8a8fa8,#2b2e3f 40%,#14151f 65%,#5b4b8a)' },
  { id: 'rainbow', name: '무지개', anim: 'rainbow', tier: 2 },
  { id: 'aurora',  name: '오로라', anim: 'aurora', tier: 2, sw: 'linear-gradient(135deg,#34d399,#6366f1 55%,#a855f7)' },
  { id: 'lava',    name: '용암',   anim: 'lava', tier: 2, sw: 'linear-gradient(135deg,#fde047,#f97316 50%,#b91c1c)' },
  { id: 'cyber',   name: '사이버', anim: 'cyber', tier: 2, sw: 'linear-gradient(135deg,#ff2bd6,#00e5ff)' }
];

const isOpen = c => TEST_UNLOCK_ALL || c.tier === 0 || UNLOCKED.includes(c.id);

function hsl2hex(h, sat, l) {
  h = ((h % 360) + 360) % 360;
  const a = sat * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

const ANIM = {                                     // 계속 변하는 색상들: 시간(초) -> [내 색, 상대 색]
  rainbow: t => { const h = (t * 30) % 360; return [hsl2hex(h, .85, .55), hsl2hex(h + 180, .85, .55)]; },
  aurora:  t => { const h = 225 + 55 * Math.sin(t * .5); return [hsl2hex(h, .75, .55), hsl2hex(h + 150, .7, .5)]; },
  lava:    t => { const h = 18 + 14 * Math.sin(t * .8); return [hsl2hex(h, 1, .5 + .06 * Math.sin(t * 2.2)), hsl2hex(205, .85, .45)]; },
  cyber:   t => { const h = 242 + 58 * Math.sin(t * 1.1); return [hsl2hex(h, 1, .55), hsl2hex(78, 1, .45)]; }
};

function applyColors() {                           // 선택한 색을 게임 전체에 적용 (1 = 나, 2 = 상대)
  const c = COLORS.find(x => x.id === myColor) || COLORS[0];
  let mine = c.hex, foe = c.foe;
  animColor = !!c.anim; SHINE.on = !!c.shine;
  if (c.anim && ANIM[c.anim]) { const r = ANIM[c.anim](clock); mine = r[0]; foe = r[1]; }
  HEX[1] = mine; HEX[2] = foe;
  COL[1] = [1, 3, 5].map(i => parseInt(mine.slice(i, i + 2), 16));
  COL[2] = [1, 3, 5].map(i => parseInt(foe.slice(i, i + 2), 16));
  const st = document.documentElement.style; st.setProperty('--c1', mine); st.setProperty('--c2', foe);
}

function refreshWho() { $('who').textContent = '👤 ' + NICK; }

function saveNick() {
  NICK = $('nick').value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 10) || '지휘관';
  $('nick').value = NICK; store('pk_nick', NICK); refreshWho();
}

let phT;

function phint(t) { $('phint').textContent = t; clearTimeout(phT); phT = setTimeout(() => { $('phint').textContent = ''; }, 2000); }

function buildProfile() {
  $('nick').value = NICK;
  const g = $('cgrid'); g.innerHTML = '';
  for (const c of COLORS) {
    const open = isOpen(c), b = document.createElement('button');
    b.className = 'sw t' + c.tier + (c.id === myColor ? ' on' : '') + (open ? '' : ' lock');
    const bg = c.sw || (c.anim ? 'conic-gradient(#ff3d3d,#ffd93d,#3dff6e,#3dd1ff,#6e3dff,#ff3dd1,#ff3d3d)' : c.hex);
    b.innerHTML = `<span class="dot" style="background:${bg}">${open ? '' : '🔒'}</span><b>${c.name}</b><small>${TIERS[c.tier]}</small>`;
    b.onclick = () => {
      if (!open) { phint('아직 잠겨 있어요. 팔레트에서 얻을 수 있어요'); return; }
      myColor = c.id; store('pk_color', myColor); applyColors();
      g.querySelectorAll('.sw').forEach(x => x.classList.remove('on')); b.classList.add('on');
    };
    g.appendChild(b);
  }
}