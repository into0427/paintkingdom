'use strict';
// ===== audio.js =====
// 배경음악 / 소리 설정.
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['audio.js'] = '2026.11.24-1';

// 배경음악 파일: index.html과 같은 곳(저장소 맨 위)에 main.mp3 / prep.mp3 / battle.mp3 를 올리면 돼요. 안 보이면 audio 폴더, 그다음 원래 이름(main_mp3.mp3 등)도 찾아봐요
const BGM = { home: ['main.mp3', 'audio/main.mp3', 'main_mp3.mp3'], prep: ['prep.mp3', 'audio/prep.mp3', 'prep_mp3.mp3'], battle: ['battle.mp3', 'audio/battle.mp3', 'battle_mp3.mp3'] };

const SND = { music: true, vol: .6 };

try { Object.assign(SND, JSON.parse(localStorage.getItem('pk_snd') || '{}')); } catch (e) {}

if (!(SND.vol >= 0 && SND.vol <= 1)) SND.vol = .6;

const saveSnd = () => store('pk_snd', JSON.stringify(SND));

const IS_IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const bgm = {}; let bgmWant = 'home', audioOn = false, actx = null;

for (const k in BGM) {
  const list = BGM[k], a = new Audio(); a.loop = true; a.preload = 'metadata'; a.volume = 0;
  const t = { a, v: 0, bad: false, gain: null, i: 0 };
  a.addEventListener('error', () => {              // 파일을 못 찾으면 다음 후보 이름으로 다시 시도
    if (t.i + 1 < list.length) { t.i++; a.src = list[t.i]; a.load(); } else t.bad = true;
  });
  a.src = list[0];
  bgm[k] = t;
}

function unlockAudio() {                           // 브라우저 규칙: 첫 터치 뒤에야 소리를 낼 수 있어요
  if (audioOn) return; audioOn = true;
  if (IS_IOS) {                                    // 아이폰은 audio.volume이 안 먹어서 WebAudio로 볼륨 조절
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      for (const k in bgm) { const t = bgm[k]; t.gain = actx.createGain(); t.gain.gain.value = 0; actx.createMediaElementSource(t.a).connect(t.gain); t.gain.connect(actx.destination); }
      actx.resume();
    } catch (e) { for (const k in bgm) bgm[k].gain = null; }
  }
  for (const k in bgm) { const t = bgm[k]; t.a.play().then(() => { if (!(t.v > .001)) t.a.pause(); }).catch(() => {}); }
}

['pointerdown', 'keydown', 'touchend'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true }));

function bgmTick(dt) {                             // 화면에 맞는 곡으로 부드럽게 바꿔요 (메인 / 전투 전 / 전투 중)
  bgmWant = screen === 'game' ? (S.phase === 'prep' ? 'prep' : S.phase === 'battle' ? 'battle' : 'home') : 'home';
  for (const k in bgm) {
    const t = bgm[k]; if (t.bad) continue;
    const goal = (audioOn && SND.music && bgmWant === k && !document.hidden) ? SND.vol : 0;
    t.v += Math.sign(goal - t.v) * Math.min(Math.abs(goal - t.v), dt * 1.2);
    if (t.gain) t.gain.gain.value = t.v; else t.a.volume = Math.max(0, Math.min(1, t.v));
    if (t.v > .001 && t.a.paused) t.a.play().catch(() => {});
    else if (t.v <= .001 && goal === 0 && !t.a.paused) t.a.pause();
  }
}

function renderSnd() {
  $('sMusic').textContent = SND.music ? '🔊 배경음악 켜짐' : '🔇 배경음악 꺼짐';
  $('hMute').textContent = SND.music ? '🔊' : '🔇';
  $('sVol').value = Math.round(SND.vol * 100); $('sVolN').textContent = Math.round(SND.vol * 100);
  const bad = Object.keys(BGM).filter(k => bgm[k].bad).map(k => BGM[k][0]);
  $('sNote').textContent = bad.length ? `⚠ 찾지 못한 파일: ${bad.join(', ')}` : `음악 파일: ${Object.values(BGM).map(l => l[0]).join(' · ')}`;
}

function toggleMusic() { SND.music = !SND.music; saveSnd(); renderSnd(); }

function bkHint(t) { $('bkHint').textContent = t; }