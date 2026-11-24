'use strict';
// ===== config.js =====
// 숫자 설정 모음 — 캐릭터 능력치(CFG), 코인 속도, 리그, 팔레트 확률, 이벤트·AI 난이도 등. 밸런스 패치는 보통 이 파일만 바꾸면 돼요.
// (이 파일만 바꿔서 올리면 돼요. 아래 줄의 버전 번호로 설정 화면에서 확인할 수 있어요)
FV['config.js'] = '2026.11.24-1';

const CFG = {
  PREP: 60,            // 전투 전 준비 시간(초)
  BATTLE: 60,          // 전투 시간(초)
  START_COIN: 30,      // 시작 코인
  INCOME_STEPS: [      // 전투 중 코인 지급 단계: [전투 시작 후 몇 초부터, 몇 초마다 1코인]
    [0, 3],            //  0~20초: 3초마다 1코인
    [20, 2],           // 20~40초: 2초마다 1코인
    [40, 1]            // 40~60초: 1초마다 1코인
  ],
  CURSE_MOVE: 0.4,     // 저주 장판 안 이동속도 배율 (60% 감소)
  CURSE_ATK: 0.4,      // 저주 장판 안 공격속도 배율 (60% 감소)
  SPAWN_SHIELD: 4,     // 전투 중 소환한 캐릭터의 무적 시간(초) (타겟에서도 제외됨)
  SPEED_SCALE: 3,      // 이동속도 배율 (1로 하면 적어둔 숫자 그대로, 더 느려요)
  UNITS: {
    knight:   { name: '기사',       icon: '🛡️', cost: 1, hp: 100, atk: 50,  spd: 10, rate: 1,   range: 0,   r: 11, trail: 6, ai: 'melee' },
    archer:   { name: '궁수',       icon: '🏹', cost: 2, hp: 80,  atk: 70,  spd: 8,  rate: 1.2, range: 100, r: 11, arrow: 5, ai: 'ranged' },
    launcher: { name: '페인트런처', icon: '🪨', cost: 4, hp: 200, atk: 100, spd: 0,  rate: 3,   range: 250, r: 14, boom: 15, ai: 'artillery' },
    // 런치킨: 공격 없이 랜덤하게 뛰어다니며 칠함
    chicken:  { name: '런치킨',     icon: '🐔', cost: 3, hp: 70,  atk: 0,   spd: 15, rate: 0,   range: 0,   r: 9,  trail: 7, ai: 'wander' },
    // 타이탄: 거대한 탱커 (trail = 지나간 길에 칠하는 굵기)
    titan:    { name: '타이탄',     icon: '🪓', cost: 4, hp: 500, atk: 200, spd: 7,  rate: 2.2, range: 0,   r: 20, trail: 6, ai: 'melee' },
    // 소방관: atk = 초당 피해, cone = 부채꼴 각도(도), turn = 방향 전환 시간(초), dots = 초당 칠하는 점 개수, dot = 점 크기
    fire:     { name: '소방관',     icon: '🧯', cost: 3, hp: 150, atk: 40,  spd: 8,  rate: 0,   range: 90,  r: 11, cone: 40, turn: 1, dots: 100, dot: 3, ai: 'flame' },
    // 암살자: tp = 순간이동 반경, tpPaint = 도착 지점 칠하는 반경, lateTp = 전투 중 소환해도 순간이동할지(false면 전투 시작 때 있던 암살자만)
    assassin: { name: '암살자',     icon: '🥷', cost: 2, hp: 70,  atk: 80,  spd: 10, rate: 1.8, range: 0,   r: 11, tp: 200, tpPaint: 20, lateTp: true, ai: 'melee' },
    // 마녀: zone = 저주 장판 반경(칠하는 반경도 같음), zoneTime = 장판 지속시간(초)
    witch:    { name: '마녀',       icon: '🧹', cost: 3, hp: 100, atk: 50,  spd: 9,  rate: 2,   range: 90,  r: 11, zone: 25, zoneTime: 4, ai: 'witch' },
    // 마법사: zap = 번개 맞은 곳 칠하는 반경, stun = 경직 시간(초)
    mage:     { name: '마법사',     icon: '🧙', cost: 4, hp: 100, atk: 250, spd: 8,  rate: 3,   range: 120, r: 11, zap: 15, stun: 0.5, ai: 'mage' },
    // 캐슬: 건물. 반경(range) 안에 적이 있으면 rate초마다 summon 캐릭터를 자기 위치에 소환
    castle:   { name: '캐슬',       icon: '🏰', cost: 5, hp: 200, atk: 0,   spd: 0,  rate: 1.5,   range: 120, r: 18, summon: 'knight', ai: 'castle' },
    // 아르마딜로: shield = 쉴드 체력, meet = 구르기 시작 거리, rollSpd = 구르는 속도, chain = 연쇄 반경, cool = 구르기 후 쿨타임(초)
    arma:     { name: '아르마딜로', icon: '🌀', cost: 3, hp: 100, shield: 100, atk: 50, spd: 8, rate: 0, range: 0, r: 11, trail: 5, meet: 30, rollSpd: 20, chain: 75, cool: 2, ai: 'arma' },
    // 꽃순이: splash = 꽃 이펙트 반경, heal = 아군 회복 비율, dots = 걸을 때 초당 흩뿌리는 점 개수, scatter = 흩뿌리는 범위, dot = 점 크기
    flower:   { name: '꽃순이',     icon: '🌸', cost: 4, hp: 120, atk: 40,  spd: 9,  rate: 1.8, range: 70,  r: 11, splash: 35, heal: 0.2, dots: 30, scatter: 12, dot: 3, ai: 'flower' }
  }
};

const MAX_PICK = 12;                               // 출전시킬 수 있는 캐릭터 최대 개수

const TEST_UNLOCK_ALL = false;                     // true로 바꾸면 잠긴 색도 전부 써볼 수 있어요 (테스트용)

const BASE = ['knight', 'archer', 'titan', 'launcher', 'chicken'];   // 처음부터 가진 캐릭터

const LEAGUES = [                                  // min = 리그 시작 통솔력(= 바닥), unlock = 이 리그부터 팔레트에 나오는 캐릭터
  { name: '캐주얼 리그', min: 0,   unlock: [] },
  { name: '루키 리그',   min: 100, unlock: ['fire', 'assassin'] },
  { name: '위즈 리그',   min: 200, unlock: ['witch', 'mage'] },
  { name: '스톤 리그',   min: 300, unlock: ['castle'] },
  { name: '가든 리그',   min: 400, unlock: ['arma', 'flower'] }
];

const POWER = { ai: 20, pvp: 40 };                 // 승패에 따른 통솔력 기준값 (실제로는 점유율 차이에 따라 ±2)

const PALETTE_STEP = 25;                           // 통솔력 최고 기록이 이만큼 오를 때마다 팔레트 1개

const PALETTE = {
  char: 0.40, color: 0.05,                         // 캐릭터 40%, 새 색상 5%, 나머지 55%는 보석
  maxedGems: 60,                                   // 증강을 다 해금한 캐릭터가 또 나오면 보석으로 환급
  newWeight: 3,                                    // 못 가진 캐릭터가 뽑히는 가중치 (가진 캐릭터는 1)
  pity: 4,                                         // 새 캐릭터를 이만큼 연속으로 못 뽑으면 다음 팔레트는 새 캐릭터 확정
  gems: [[20, .5], [40, .3], [80, .15], [150, .05]]   // [보석 개수, 확률]
};

const DEV_BOOST = null;                            // 테스트용: { id: 1, power: 250, gems: 500, palettes: 5 } 처럼 적으면 한 번만 적용돼요 (id를 바꾸면 또 적용)

const AUG_PRICE = [50, 80, 120, 170, 240];         // 1~5번 증강 가격 (보석)

const EGG_EVERY = 5;                               // 황금알 주기(초). 너무 강하면 늘리고, 너무 약하면 줄이세요

const AI_AUG_MULT = 1.0;                           // AI 증강 개수 배율 (1.0 = 같은 통솔력의 평균 플레이어와 같은 수, 올리면 AI가 더 세져요)

// 통솔력 0, 100, 200, ... 에서 평균적인 플레이어가 가진 증강 총 개수 (팔레트 확률 시뮬레이션 결과)
const AI_AUG = [0, 1.2, 2.1, 2.9, 3.7, 4.5, 5.4, 6.6, 8.1, 9.6, 11.2, 12.8, 14.4];

const AI_ACC_BONUS = 0;                            // AI 전체 정확도 가감 (예: 0.05 = 5%p 더 정석대로). 최종 정확도는 항상 15%~80% 안

const AI_ACC_MAX = 0.8, AI_ACC_MIN = 0.15;

const EVENT_CHANCE = 0.06;                         // 판마다 특별 지휘관이 나올 확률

const EVENT_MIN_GAP = 3, EVENT_MAX_GAP = 30;       // 직전 이벤트 뒤 최소 몇 판 쉬고, 최대 몇 판 안에는 꼭 나오게 할지

const EVENT_MIN_POWER = 100;                       // 이 통솔력부터 등장

const EVENT_AUG_MULT = 1.6;                        // 증강 마스터: 평균 플레이어 증강 수의 몇 배 (2는 너무 빡셀 수 있어요)

const EVENT_HORDE_BUDGET = 40;                     // 컨셉 군단: AI 시작 코인

const EVENT_PALETTES = { aug: 3, horde: 2 };       // 이기면 받는 팔레트 수

const EVENT_WEIGHTS = { aug: 1, horde: 1 };        // 종류별 등장 비율 (새 이벤트는 여기에 추가)

const MISSION_GEMS = [10, 20, 40, 100];                 // 난이도(★ / ★★ / ★★★)별 보상 보석