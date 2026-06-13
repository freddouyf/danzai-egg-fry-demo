export const GAME_DURATION_MS = 10_000;
export const MAX_HEALTH = 3;
export const BASE_HEAT_PER_SECOND = 36;
export const EVENT_CHANCE = 0.72;
export const LEVEL_SPEED_STEP = 0.14;
export const LEVEL_SCORE_STEP = 0.75;
export const MAX_STAGE_EARNED_TIME_MS = 0;
export const COIN_RUSH_END_GRACE_MS = 1_200;
export const EARLY_LEVEL_TARGETS = Object.freeze([
  7,
  8,
  9,
  10,
  11,
]);

export const PAN_PERKS = Object.freeze([
  Object.freeze({
    id: "basic-pan",
    icon: "🍳",
    name: "基础煎锅",
    description: "基础款煎锅，不随关卡自动升级。",
    short: "基础款",
  }),
]);

export const HEAT_STATUS = Object.freeze({
  RAW: "raw",
  NORMAL: "normal",
  PERFECT: "perfect",
  SINGED: "singed",
  BURNT: "burnt",
});

export const HIT_QUALITY = Object.freeze({
  MISS: "miss",
  GOOD: "good",
  PERFECT: "perfect",
});

export const COMBO_MOOD = Object.freeze({
  NORMAL: "normal",
  LIVELY: "lively",
  FEVER: "fever",
});

export const HEAT_LABELS = Object.freeze({
  [HEAT_STATUS.RAW]: "太生",
  [HEAT_STATUS.NORMAL]: "普通",
  [HEAT_STATUS.PERFECT]: "完美",
  [HEAT_STATUS.SINGED]: "微焦",
  [HEAT_STATUS.BURNT]: "煎糊",
});

const BASE_EFFECT = Object.freeze({
  id: "none",
  icon: "🍳",
  title: "普通鸡蛋",
  short: "稳火",
  message: "稳火",
  rarity: "normal",
  weight: 8,
  speedMultiplier: 1,
  scoreMultiplier: 1,
  successBonus: 0,
  perfectBonus: 0,
  perfectMin: 70,
  perfectMax: 85,
  preserveCombo: false,
  crisis: false,
  healOnSuccess: 0,
  doubleYolk: false,
  hiddenHeatAfter: null,
  coinMultiplier: 1,
  coinBonus: 0,
  progressBonus: 0,
  guardHeart: false,
});

export const EVENT_DEFINITIONS = Object.freeze([
  Object.freeze({
    ...BASE_EFFECT,
    id: "double-yolk",
    icon: "🥚",
    title: "双黄暴富蛋！",
    short: "金币翻倍",
    message: "双黄蛋登场，本颗金币奖励加倍！",
    rarity: "rare",
    weight: 12,
    scoreMultiplier: 3,
    doubleYolk: true,
    coinBonus: 4,
  }),
  Object.freeze({
    ...BASE_EFFECT,
    id: "golden-heat",
    icon: "🌟",
    title: "黄金火候降临！",
    short: "超宽目标区",
    message: "发光区大幅扩张，成功再多掉 4 金币！",
    rarity: "rare",
    weight: 12,
    scoreMultiplier: 1.5,
    perfectMin: 55,
    perfectMax: 95,
    perfectBonus: 400,
    coinBonus: 4,
  }),
  Object.freeze({
    ...BASE_EFFECT,
    id: "angry-fire",
    icon: "🔥",
    title: "暴躁炉火开大！",
    short: "极速双倍币",
    message: "升温速度暴涨，成功金币翻倍！",
    rarity: "danger",
    weight: 12,
    minLevel: 2,
    speedMultiplier: 2.1,
    scoreMultiplier: 4,
    coinMultiplier: 2,
  }),
  Object.freeze({
    ...BASE_EFFECT,
    id: "slow-egg",
    icon: "🫧",
    title: "慢悠悠蛋！",
    short: "慢速绿区",
    message: "指针速度大幅降低，稳稳瞄准绿色区域！",
    rarity: "rare",
    weight: 10,
    speedMultiplier: 0.62,
    perfectBonus: 200,
  }),
  Object.freeze({
    ...BASE_EFFECT,
    id: "lucky-scallion",
    icon: "🌱",
    title: "幸运葱花雨！",
    short: "金币 +8",
    message: "成功出锅额外撒落 8 金币！",
    rarity: "rare",
    weight: 12,
    successBonus: 180,
    coinBonus: 8,
  }),
  Object.freeze({
    ...BASE_EFFECT,
    id: "spatula-critical",
    icon: "⚡",
    title: "锅铲暴击充能！",
    short: "暴击金币 +12",
    message: "命中绿色区域后暴击，额外爆出 12 金币！",
    rarity: "epic",
    weight: 8,
    perfectBonus: 500,
    coinBonus: 12,
  }),
  Object.freeze({
    ...BASE_EFFECT,
    id: "pan-crisis",
    icon: "💥",
    title: "糊锅危机！",
    short: "乱火大赏",
    message: "火力疯狂乱跳，成功金币 ×2.5！",
    rarity: "danger",
    weight: 10,
    minLevel: 2,
    scoreMultiplier: 5,
    coinMultiplier: 2.5,
    crisis: true,
  }),
  Object.freeze({
    ...BASE_EFFECT,
    id: "danzai-cheer",
    icon: "💛",
    title: "旦仔替你撑腰！",
    short: "免伤一次",
    message: "这颗蛋失误不扣心，旦仔帮你接住！",
    rarity: "rare",
    weight: 10,
    preserveCombo: true,
    successBonus: 250,
    guardHeart: true,
  }),
  Object.freeze({
    ...BASE_EFFECT,
    id: "time-warp",
    icon: "❤️",
    title: "爱心回锅！",
    short: "成功回血",
    message: "本颗成功时恢复 1 颗心！",
    rarity: "epic",
    weight: 6,
    healOnSuccess: 1,
  }),
  Object.freeze({
    ...BASE_EFFECT,
    id: "coin-rush",
    icon: "🤑",
    title: "金币狂欢机！",
    short: "狂点金币",
    message: "大奖时间！狂点按钮，把金币全敲出来！",
    rarity: "legendary",
    weight: 5,
    specialMode: "coin-rush",
    specialDurationMs: 3_500,
  }),
  Object.freeze({
    ...BASE_EFFECT,
    id: "jackpot",
    icon: "🎰",
    title: "超级大奖蛋！",
    short: "超级金币 ×4",
    message: "叮叮叮！成功出锅触发四倍金币！",
    rarity: "legendary",
    weight: 3,
    scoreMultiplier: 10,
    coinMultiplier: 4,
    coinBonus: 8,
  }),
  Object.freeze({
    ...BASE_EFFECT,
    id: "devil-fire",
    icon: "😈",
    title: "恶魔火焰契约！",
    short: "针眼高回报",
    message: "极速针眼目标区，成功金币 ×3！",
    rarity: "legendary",
    weight: 3,
    minLevel: 3,
    speedMultiplier: 2.5,
    scoreMultiplier: 8,
    coinMultiplier: 3,
    coinBonus: 8,
    perfectMin: 78,
    perfectMax: 82,
  }),
  Object.freeze({
    ...BASE_EFFECT,
    id: "blind-heat",
    icon: "🙈",
    title: "蒙眼豪赌蛋！",
    short: "蒙眼三倍币",
    message: "指针过半后隐藏，成功金币 ×3！",
    rarity: "legendary",
    weight: 5,
    minLevel: 2,
    scoreMultiplier: 6,
    coinMultiplier: 3,
    coinBonus: 5,
    hiddenHeatAfter: 52,
  }),
]);

export const UPGRADE_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "steady-hand",
    icon: "🧲",
    name: "磁吸锅铲",
    rule: "进入绿色区域自动出锅",
    family: "basic",
    rarity: "rare",
    maxStacks: 2,
  }),
  Object.freeze({
    id: "perfect-chain",
    icon: "🖨️",
    name: "完美复印机",
    rule: "连续命中会爆出额外金币",
    family: "basic",
    rarity: "epic",
    maxStacks: 2,
  }),
  Object.freeze({
    id: "event-booster",
    icon: "📣",
    name: "奇遇复读机",
    rule: "成功事件会在下一颗重演",
    family: "basic",
    rarity: "epic",
    maxStacks: 2,
  }),
  Object.freeze({
    id: "event-album",
    icon: "🎰",
    name: "大奖蓄力器",
    rule: "连续事件成功后必出大奖",
    family: "basic",
    rarity: "epic",
    maxStacks: 2,
  }),
  Object.freeze({
    id: "combo-engine",
    icon: "⚡",
    name: "连击超频器",
    rule: "连击达标后连续金币暴击",
    family: "basic",
    rarity: "epic",
    maxStacks: 2,
  }),
  Object.freeze({
    id: "singed-gourmet",
    icon: "🥩",
    name: "焦香翻身",
    rule: "微焦直接按 Perfect 结算",
    family: "basic",
    rarity: "epic",
    maxStacks: 2,
  }),
  Object.freeze({
    id: "opening-jackpot",
    icon: "🍽️",
    name: "双份装盘",
    rule: "每 3 颗成功蛋额外爆金币",
    family: "basic",
    rarity: "rare",
    maxStacks: 2,
  }),
  Object.freeze({
    id: "last-call",
    icon: "🚨",
    name: "末秒狂飙",
    rule: "最后 3 秒全锅进入暴走",
    family: "basic",
    rarity: "epic",
    maxStacks: 2,
  }),
  Object.freeze({
    id: "time-seasoning",
    icon: "❤️",
    name: "爱心便当",
    rule: "连续成功可以恢复生命",
    family: "basic",
    rarity: "rare",
    maxStacks: 2,
  }),
  Object.freeze({
    id: "combo-armor",
    icon: "🛟",
    name: "回魂锅盖",
    rule: "把糊锅强行救回 Perfect",
    family: "basic",
    rarity: "epic",
    maxStacks: 2,
  }),
  Object.freeze({
    id: "danger-chef",
    icon: "🌋",
    name: "红温引擎",
    rule: "连续微焦会叠高金币奖励",
    family: "basic",
    rarity: "epic",
    maxStacks: 2,
  }),
  Object.freeze({
    id: "lucky-lid",
    icon: "🔮",
    name: "命运双开",
    rule: "每颗事件取更稀有的一次",
    family: "basic",
    rarity: "rare",
    maxStacks: 2,
  }),
  Object.freeze({
    id: "coin-sprout",
    icon: "🎆",
    name: "彩蛋礼炮",
    rule: "事件成功和狂点都会多掉金币",
    family: "basic",
    rarity: "epic",
    maxStacks: 2,
  }),
]);

export function awakenedUpgradeCount(upgrades = {}) {
  return UPGRADE_DEFINITIONS.filter(
    (upgrade) => (upgrades[upgrade.id] || 0) >= upgrade.maxStacks,
  ).length;
}

export function getUpgradePreview(id, currentStacks = 0) {
  const stacks = Math.max(0, Number(currentStacks) || 0);
  const nextStacks = stacks + 1;
  const previews = {
    "steady-hand": {
      headline: nextStacks === 1 ? "绿区自动出锅" : "自动出锅 +3 币",
      before: stacks === 0 ? "手动出锅" : "自动出锅",
      after: nextStacks === 1 ? "指针进绿区立即完成" : "自动完成时额外掉金币",
    },
    "perfect-chain": {
      headline: nextStacks === 1 ? "3 连命中 +6 币" : "2 连命中 +10 币",
      before: stacks === 0 ? "尚未启动" : "3 连爆发",
      after: nextStacks === 1 ? "第三颗额外爆金币" : "每两颗触发更大金币袋",
    },
    "event-booster": {
      headline: nextStacks === 1 ? "事件再演一次" : "再演额外 +8 币",
      before: stacks === 0 ? "事件只出现一次" : "下一颗重演",
      after: nextStacks === 1 ? "成功事件下一颗重演" : "重演成功额外掉金币",
    },
    "event-album": {
      headline: nextStacks === 1 ? "3 次事件后必出大奖" : "2 次事件后必出大奖",
      before: stacks === 0 ? "大奖靠运气" : "三次保底",
      after: nextStacks === 1 ? "事件成功填充转盘" : "更快填满转盘",
    },
    "combo-engine": {
      headline: nextStacks === 1 ? "连中 5 次开超频" : "连中 4 次开超频",
      before: stacks === 0 ? "普通节奏" : "4 秒超频",
      after: nextStacks === 1 ? "4 秒内每颗额外 +4 币" : "6 秒内每颗额外 +8 币",
    },
    "singed-gourmet": {
      headline: nextStacks === 1 ? "微焦也算命中" : "微焦额外 +6 币",
      before: stacks === 0 ? "微焦低分" : "微焦可当完美",
      after: nextStacks === 1 ? "焦香区成为新目标" : "焦香区命中再掉金币",
    },
    "opening-jackpot": {
      headline: nextStacks === 1 ? "每 3 颗 +4 币" : "每 2 颗 +8 币",
      before: stacks === 0 ? "普通装盘" : "三颗触发金币装盘",
      after: nextStacks === 1 ? "定期爆出金币" : "更频繁爆出大金币袋",
    },
    "last-call": {
      headline: nextStacks === 1 ? "末 3 秒 +4 币" : "末 3 秒 +8 币",
      before: stacks === 0 ? "正常收尾" : "末秒暴走",
      after: nextStacks === 1 ? "末秒每颗额外爆币" : "末秒金币奖励翻倍",
    },
    "time-seasoning": {
      headline: nextStacks === 1 ? "5 连成功回 1 心" : "4 连成功回 1 心",
      before: stacks === 0 ? "生命不会恢复" : "五连成功回血",
      after: nextStacks === 1 ? "稳定操作可恢复生命" : "更快触发回血",
    },
    "combo-armor": {
      headline: nextStacks === 1 ? "每关救回 1 次" : "每关救回 2 次",
      before: stacks === 0 ? "糊锅直接失败" : "一次回魂",
      after: nextStacks === 1 ? "糊锅拉回 Perfect" : "两次强制救场",
    },
    "danger-chef": {
      headline: nextStacks === 1 ? "微焦连续升压" : "红温升压翻倍",
      before: stacks === 0 ? "火力稳定" : "焦香会叠层",
      after: nextStacks === 1 ? "每层 +2 金币，火也更快" : "每层 +4 金币",
    },
    "lucky-lid": {
      headline: nextStacks === 1 ? "事件取优 2 次" : "事件取优 3 次",
      before: stacks === 0 ? "只抽一次事件" : "两次取优",
      after: nextStacks === 1 ? "更常遇到史诗事件" : "三次只留最稀有",
    },
    "coin-sprout": {
      headline: nextStacks === 1 ? "事件成功 +5 币" : "事件成功 +10 币",
      before: stacks === 0 ? "普通掉币" : "小型金币礼炮",
      after: nextStacks === 1 ? "狂点每次也多 1 币" : "金币礼炮效果翻倍",
    },
  };
  const preview = previews[id] || {
    headline: "强力提升",
    before: "当前",
    after: "强化后",
  };
  const definition = UPGRADE_DEFINITIONS.find((upgrade) => upgrade.id === id);
  if (definition && nextStacks >= definition.maxStacks) {
    return { ...preview, awakening: "完全体" };
  }
  return preview;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createEvent(id = "none") {
  if (id === "none") {
    return { ...BASE_EFFECT };
  }

  const event = EVENT_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!event) {
    throw new Error(`Unknown event: ${id}`);
  }
  return { ...event };
}

export function createRandomEvent(
  random = Math.random,
  chance = EVENT_CHANCE,
  { level = 1 } = {},
) {
  if (random() >= chance) {
    return createEvent();
  }

  const candidates = EVENT_DEFINITIONS.filter(
    (event) => level >= (event.minLevel || 1),
  );
  const totalWeight = candidates.reduce((sum, event) => sum + event.weight, 0);
  let roll = random() * totalWeight;
  for (const event of candidates) {
    roll -= event.weight;
    if (roll <= 0) {
      return { ...event };
    }
  }
  return { ...candidates.at(-1) };
}

export function classifyHeat(value, perfectMin = 70, perfectMax = 85) {
  const heat = clamp(Number(value) || 0, 0, 100);
  if (heat >= 96) return HEAT_STATUS.BURNT;
  if (heat >= perfectMin && heat <= perfectMax) return HEAT_STATUS.PERFECT;
  if (heat >= 86) return HEAT_STATUS.SINGED;
  if (heat >= 40) return HEAT_STATUS.NORMAL;
  return HEAT_STATUS.RAW;
}

export function getHitWindow(effect = createEvent(), goodPadding = 8) {
  const perfectMin = clamp(Number(effect.perfectMin) || 70, 0, 95);
  const perfectMax = clamp(
    Number(effect.perfectMax) || 85,
    perfectMin,
    95,
  );
  const padding = Math.max(0, Number(goodPadding) || 0);
  return {
    goodMin: clamp(perfectMin - padding, 0, perfectMin),
    goodMax: clamp(perfectMax + padding, perfectMax, 95),
    perfectMin,
    perfectMax,
  };
}

export function getHitQuality(value, effect = createEvent()) {
  const heat = clamp(Number(value) || 0, 0, 100);
  const window = getHitWindow(effect);
  if (heat >= window.perfectMin && heat <= window.perfectMax) {
    return HIT_QUALITY.PERFECT;
  }
  if (heat >= window.goodMin && heat <= window.goodMax) {
    return HIT_QUALITY.GOOD;
  }
  return HIT_QUALITY.MISS;
}

export function getMissFeedback(value, effect = createEvent()) {
  const heat = clamp(Number(value) || 0, 0, 100);
  const { goodMin } = getHitWindow(effect);
  if (heat >= 96) return { id: "burnt", label: "糊锅啦！" };
  if (heat < goodMin) return { id: "early", label: "太早啦！" };
  return { id: "late", label: "太晚啦！" };
}

export function getComboMood(perfectStreak) {
  const streak = Math.max(0, Math.floor(Number(perfectStreak) || 0));
  if (streak >= 5) return COMBO_MOOD.FEVER;
  if (streak >= 3) return COMBO_MOOD.LIVELY;
  return COMBO_MOOD.NORMAL;
}

export function getEarlyLevelPerfectPadding(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  if (safeLevel <= 1) return 8;
  if (safeLevel === 2) return 6;
  if (safeLevel === 3) return 4;
  if (safeLevel === 4) return 2;
  return 0;
}

export function comboMultiplier(combo) {
  return 1 + Math.floor(Math.max(0, combo) / 3) * 0.5;
}

export function levelScoreMultiplier(level) {
  return 1 + Math.max(0, level - 1) * LEVEL_SCORE_STEP;
}

export function getPanPerk(level) {
  void level;
  return { ...PAN_PERKS[0], level: 0 };
}

export function levelTarget(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  if (safeLevel <= EARLY_LEVEL_TARGETS.length) {
    return EARLY_LEVEL_TARGETS[safeLevel - 1];
  }
  return Math.min(12, EARLY_LEVEL_TARGETS.at(-1) + safeLevel - 5);
}

export function adaptiveLevelTarget(level, upgrades = {}, combo = 0) {
  void upgrades;
  void combo;
  return levelTarget(level);
}

export function nextLevelTarget(
  currentLevel,
  previousStageScore,
  upgrades = {},
  combo = 0,
) {
  const nextLevel = Math.max(2, Math.floor(Number(currentLevel) || 1) + 1);
  void previousStageScore;
  void upgrades;
  void combo;
  return levelTarget(nextLevel);
}

function rarityRank(rarity) {
  return {
    normal: 0,
    common: 1,
    rare: 2,
    epic: 3,
    danger: 4,
    legendary: 5,
  }[rarity] ?? 0;
}

export function scoreEgg(sideOne, sideTwo, effect = createEvent(), currentCombo = 0) {
  const firstStatus = classifyHeat(sideOne, effect.perfectMin, effect.perfectMax);
  const secondStatus = classifyHeat(sideTwo, effect.perfectMin, effect.perfectMax);
  const statuses = [firstStatus, secondStatus];
  const isBurnt = statuses.includes(HEAT_STATUS.BURNT);
  const scoredStatuses = statuses.map((status) =>
    effect.singedAsPerfect && status === HEAT_STATUS.SINGED
      ? HEAT_STATUS.PERFECT
      : status,
  );
  const isPerfect = scoredStatuses.every(
    (status) => status === HEAT_STATUS.PERFECT,
  );

  let baseScore = 10;
  if (isBurnt) {
    baseScore = 0;
  } else if (isPerfect) {
    baseScore = 100;
  } else if (
    scoredStatuses.includes(HEAT_STATUS.PERFECT) &&
    scoredStatuses.includes(HEAT_STATUS.NORMAL)
  ) {
    baseScore = 60;
  } else if (scoredStatuses.every((status) => status === HEAT_STATUS.NORMAL)) {
    baseScore = 30;
  }

  let nextCombo = currentCombo;
  let preservedCombo = false;
  if (baseScore > 0) {
    nextCombo += 1;
  } else if (effect.preserveCombo) {
    preservedCombo = true;
  } else {
    nextCombo = 0;
  }

  let scoreBeforeCombo = baseScore * effect.scoreMultiplier;
  if (baseScore > 0) {
    scoreBeforeCombo += effect.successBonus;
    if (isPerfect) scoreBeforeCombo += effect.perfectBonus;
  }

  const multiplier = comboMultiplier(nextCombo);
  return {
    sideOne: clamp(sideOne, 0, 100),
    sideTwo: clamp(sideTwo, 0, 100),
    firstStatus,
    secondStatus,
    baseScore,
    awardedScore: Math.round(scoreBeforeCombo * multiplier),
    combo: nextCombo,
    comboMultiplier: multiplier,
    isPerfect,
    isBurnt,
    convertedSinged:
      effect.singedAsPerfect && statuses.includes(HEAT_STATUS.SINGED),
    preservedCombo,
    effectId: effect.id,
    rarity: effect.rarity,
  };
}

export function scoreSingleTap(heat, effect = createEvent(), currentCombo = 0) {
  const safeHeat = clamp(Number(heat) || 0, 0, 100);
  const status = classifyHeat(safeHeat, effect.perfectMin, effect.perfectMax);
  const hitQuality = getHitQuality(safeHeat, effect);
  const isPerfect = hitQuality === HIT_QUALITY.PERFECT;
  const isGood = hitQuality === HIT_QUALITY.GOOD;
  const isBurnt = safeHeat >= 96;
  const baseScore = isPerfect ? 100 : isGood ? 40 : 0;

  let nextCombo = currentCombo;
  let preservedCombo = false;
  if (baseScore > 0) {
    nextCombo += 1;
  } else if (effect.preserveCombo) {
    preservedCombo = true;
  } else {
    nextCombo = 0;
  }

  let scoreBeforeCombo = baseScore * effect.scoreMultiplier;
  if (baseScore > 0) {
    scoreBeforeCombo += effect.successBonus;
    if (isPerfect) scoreBeforeCombo += effect.perfectBonus;
  }
  const multiplier = comboMultiplier(nextCombo);
  return {
    sideOne: safeHeat,
    sideTwo: safeHeat,
    firstStatus: status,
    secondStatus: status,
    baseScore,
    awardedScore: Math.round(scoreBeforeCombo * multiplier),
    combo: nextCombo,
    comboMultiplier: multiplier,
    hitQuality,
    isGood,
    isPerfect,
    isBurnt,
    preservedCombo,
    effectId: effect.id,
    rarity: effect.rarity,
  };
}

function upgradePower(stacks, multiplier) {
  return stacks > 0 ? multiplier ** stacks : 1;
}

export class EggFryGame {
  constructor({
    random = Math.random,
    durationMs = GAME_DURATION_MS,
    heatPerSecond = BASE_HEAT_PER_SECOND,
    eventChance = EVENT_CHANCE,
    characterBuff = {},
  } = {}) {
    this.random = random;
    this.durationMs = durationMs;
    this.heatPerSecond = heatPerSecond;
    this.eventChance = eventChance;
    this.characterBuff = { ...characterBuff };
    this.events = [];
    this.reset();
  }

  setCharacterBuff(characterBuff = {}) {
    this.characterBuff = { ...characterBuff };
  }

  reset() {
    this.state = "start";
    this.level = 1;
    this.stageTarget = levelTarget(1);
    this.pendingNextStageTarget = null;
    this.remainingMs = this.durationMs;
    this.maxHealth = MAX_HEALTH + (this.characterBuff.maxHealthBonus || 0);
    this.health = this.maxHealth;
    this.stageProgress = 0;
    this.stageCleared = false;
    this.successfulActions = 0;
    this.stageSuccessfulActions = 0;
    this.runCoins = 0;
    this.stageCoins = 0;
    this.coinRushRemainingMs = 0;
    this.coinRushGraceRemainingMs = 0;
    this.coinRushTaps = 0;
    this.stageGuardCharges = this.characterBuff.stageGuard || 0;
    this.eventGuardUsed = false;
    this.runEndReason = null;
    this.totalScore = 0;
    this.stageScore = 0;
    this.stageEggs = 0;
    this.stagePerfects = 0;
    this.stageEarnedTimeMs = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.bestPerfectStreak = 0;
    this.perfectChain = 0;
    this.perfectStreak = 0;
    this.comboMood = COMBO_MOOD.NORMAL;
    this.lastHitQuality = null;
    this.riskStreak = 0;
    this.eventMeter = 0;
    this.queuedEventId = null;
    this.forcedJackpotPending = false;
    this.overdriveRemainingMs = 0;
    this.eggsCooked = 0;
    this.perfectEggs = 0;
    this.currentEgg = null;
    this.effect = createEvent();
    this.panCharge = 0;
    this.panGuardCharges = getPanPerk(this.level).guardCharges || 0;
    this.panIntroRemainingMs = 0;
    this.upgrades = {};
    this.encounteredEventIds = new Set();
    this.shieldCharges = 0;
    this.pendingChoices = [];
    this.draftRerolls = 0;
    this.coinsEarned = 0;
    this.events.length = 0;
  }

  start() {
    this.reset();
    this.state = "playing";
    this.pushEvent("gameStarted", {
      level: this.level,
      target: this.stageTarget,
      scoreMultiplier: levelScoreMultiplier(this.level),
      panPerk: getPanPerk(this.level),
    });
    this.spawnEgg();
    return this.getSnapshot();
  }

  beginPanIntro(durationMs = 1_600) {
    if (this.state !== "playing") return false;
    this.panIntroRemainingMs = Math.max(0, Number(durationMs) || 0);
    return true;
  }

  confirmPanIntro() {
    if (this.state !== "playing" || this.panIntroRemainingMs <= 0) return false;
    this.panIntroRemainingMs = 0;
    this.pushEvent("panReady", { panPerk: getPanPerk(this.level) });
    return true;
  }

  pause() {
    if (this.state !== "playing") return false;
    this.state = "paused";
    this.pushEvent("gamePaused");
    return true;
  }

  resume() {
    if (this.state !== "paused") return false;
    this.state = "playing";
    this.pushEvent("gameResumed");
    return true;
  }

  update(deltaMs) {
    if (this.state !== "playing") return this.getSnapshot();

    let rawElapsedMs = Math.max(0, Number(deltaMs) || 0);
    if (this.panIntroRemainingMs > 0) {
      const introElapsedMs = Math.min(rawElapsedMs, this.panIntroRemainingMs);
      this.panIntroRemainingMs -= introElapsedMs;
      rawElapsedMs -= introElapsedMs;
      if (this.panIntroRemainingMs === 0) {
        this.pushEvent("panReady", { panPerk: getPanPerk(this.level) });
      }
      if (rawElapsedMs <= 0) return this.getSnapshot();
    }

    if (this.coinRushRemainingMs > 0) {
      this.coinRushRemainingMs = Math.max(
        0,
        this.coinRushRemainingMs - rawElapsedMs,
      );
      if (this.coinRushRemainingMs <= 0) {
        this.coinRushGraceRemainingMs = COIN_RUSH_END_GRACE_MS;
        this.pushEvent("coinRushEnded", {
          taps: this.coinRushTaps,
          coins: this.stageCoins,
          graceMs: this.coinRushGraceRemainingMs,
        });
        this.spawnEgg();
      }
      return this.getSnapshot();
    }

    if (this.coinRushGraceRemainingMs > 0) {
      this.coinRushGraceRemainingMs = Math.max(
        0,
        this.coinRushGraceRemainingMs - rawElapsedMs,
      );
      if (this.coinRushGraceRemainingMs === 0) {
        this.pushEvent("coinRushGraceEnded");
      }
      return this.getSnapshot();
    }

    const elapsedMs = clamp(rawElapsedMs, 0, this.remainingMs);
    const clockElapsedMs = elapsedMs;
    this.remainingMs -= clockElapsedMs;
    this.overdriveRemainingMs = Math.max(
      0,
      this.overdriveRemainingMs - clockElapsedMs,
    );

    if (this.currentEgg && elapsedMs > 0) {
      this.updateCrisis(elapsedMs);
      const activeEffect = this.getActiveEffect();
      const speed =
        activeEffect.speedMultiplier *
        this.currentEgg.crisisMultiplier *
        (this.characterBuff.heatSpeedMultiplier || 1);
      const heatGain = this.heatPerSecond * speed * (elapsedMs / 1000);
      const previousHeat = this.currentEgg.heat;
      this.currentEgg.heat = clamp(this.currentEgg.heat + heatGain, 0, 100);

      const magneticStacks = this.upgrades["steady-hand"] || 0;
      if (
        magneticStacks > 0 &&
        previousHeat < activeEffect.perfectMin &&
        this.currentEgg.heat >= activeEffect.perfectMin
      ) {
        this.currentEgg.heat =
          (activeEffect.perfectMin + activeEffect.perfectMax) / 2;
        this.pushEvent("autoServed", {
          upgrade: UPGRADE_DEFINITIONS.find(
            (upgrade) => upgrade.id === "steady-hand",
          ),
        });
        this.cook();
        return this.getSnapshot();
      }

      if (this.currentEgg.heat >= 96 && !this.currentEgg.smokeStarted) {
        this.currentEgg.smokeStarted = true;
        this.pushEvent("burning", { phase: this.currentEgg.phase });
      }
      if (this.currentEgg.heat >= 100) {
        this.loseHeart("overheat");
        if (this.state === "playing") this.spawnEgg();
      }
    }

    if (this.remainingMs <= 0) {
      this.finishStage({ cleared: this.health > 0 });
    }
    return this.getSnapshot();
  }

  cook() {
    return this.serve({ singleTap: true });
  }

  flip() {
    if (!this.ensurePlaying()) return false;
    if (this.currentEgg.phase !== "first") {
      this.pushEvent("invalidAction", { message: "这颗蛋已经进入下一阶段。" });
      return false;
    }

    const activeEffect = this.getActiveEffect();
    this.currentEgg.heat = this.applyPanHeatAssist(
      this.currentEgg.heat,
      activeEffect,
      "第一面",
    );
    if (!this.isHeatSuccessful(this.currentEgg.heat, activeEffect)) {
      this.loseHeart("missed-zone", {
        heat: this.currentEgg.heat,
        feedback: getMissFeedback(this.currentEgg.heat, activeEffect),
      });
      if (this.state === "playing") this.spawnEgg();
      return false;
    }
    this.currentEgg.sideOne = this.currentEgg.heat;
    this.registerSuccessfulAction("flip");
    this.currentEgg.heat = 0;
    this.currentEgg.phase = "second";
    this.currentEgg.smokeStarted = false;
    this.pushEvent("flipped", { sideOne: this.currentEgg.sideOne });
    return true;
  }

  serve({ singleTap = false } = {}) {
    if (!this.ensurePlaying()) return false;
    if (!singleTap && this.currentEgg.phase !== "second") {
      this.pushEvent("invalidAction", { message: "请使用单次出锅操作。" });
      return false;
    }

    const activeEffect = this.getActiveEffect();
    this.currentEgg.heat = this.applyPanHeatAssist(
      this.currentEgg.heat,
      activeEffect,
      singleTap ? "火候" : "第二面",
    );
    this.currentEgg.sideTwo = this.currentEgg.heat;
    if (singleTap) {
      this.currentEgg.sideOne = this.currentEgg.sideTwo;
      this.currentEgg.phase = "second";
    }
    const originalSideOne = this.currentEgg.sideOne;
    const originalSideTwo = this.currentEgg.sideTwo;
    const hasBurntSide = originalSideOne >= 96 || originalSideTwo >= 96;
    const initialHitQuality = getHitQuality(originalSideTwo, activeEffect);
    const missedSecondSide = initialHitQuality === HIT_QUALITY.MISS;
    const rescuedByShield = missedSecondSide && this.shieldCharges > 0;
    if (rescuedByShield) {
      this.shieldCharges -= 1;
      this.currentEgg.sideTwo =
        (activeEffect.perfectMin + activeEffect.perfectMax) / 2;
      if (singleTap) this.currentEgg.sideOne = this.currentEgg.sideTwo;
    } else if (missedSecondSide) {
      this.loseHeart("missed-zone", {
        heat: originalSideTwo,
        feedback: getMissFeedback(originalSideTwo, activeEffect),
      });
      if (this.state === "playing") this.spawnEgg();
      return false;
    }
    this.registerSuccessfulAction("serve");

    const result = singleTap
      ? scoreSingleTap(this.currentEgg.sideTwo, activeEffect, this.combo)
      : scoreEgg(
          this.currentEgg.sideOne,
          this.currentEgg.sideTwo,
          activeEffect,
          this.combo,
        );
    if (!result.hitQuality) {
      result.hitQuality = result.isPerfect
        ? HIT_QUALITY.PERFECT
        : HIT_QUALITY.GOOD;
      result.isGood = result.hitQuality === HIT_QUALITY.GOOD;
    }
    const previousComboMood = this.comboMood;
    if (result.hitQuality === HIT_QUALITY.PERFECT) {
      this.perfectStreak += 1;
      this.bestPerfectStreak = Math.max(
        this.bestPerfectStreak,
        this.perfectStreak,
      );
    }
    this.lastHitQuality = result.hitQuality;
    this.comboMood = getComboMood(result.combo);
    result.perfectStreak = this.perfectStreak;
    result.comboMood = this.comboMood;
    result.awakenedCount = activeEffect.awakenedCount;
    result.awakenedMultiplier = activeEffect.awakenedMultiplier;
    result.originalSideOne = originalSideOne;
    result.originalSideTwo = originalSideTwo;
    result.preservedByShield = rescuedByShield;
    const hadSingedSide =
      classifyHeat(originalSideOne, activeEffect.perfectMin, activeEffect.perfectMax) ===
        HEAT_STATUS.SINGED ||
      classifyHeat(originalSideTwo, activeEffect.perfectMin, activeEffect.perfectMax) ===
        HEAT_STATUS.SINGED;
    result.hadSingedSide = hadSingedSide;
    result.level = this.level;
    result.levelMultiplier = levelScoreMultiplier(this.level);
    result.rawAwardedScore = result.awardedScore;
    result.awardedScore = Math.round(result.awardedScore * result.levelMultiplier);
    const buildTriggers = [];
    let buildMultiplier = 1;

    if (rescuedByShield) {
      buildTriggers.push({
        id: "combo-armor",
        icon: "🛟",
        label: "糊锅回魂",
        text: "救回 Perfect",
        family: "basic",
      });
      this.pushEvent("buildBurst", {
        icon: "🛟",
        title: "回魂锅盖！",
        short: "糊锅被强行拉回 Perfect",
        rarity: "legendary",
        family: "basic",
      });
    }

    const perfectChainStacks = this.upgrades["perfect-chain"] || 0;
    if (result.isPerfect) {
      this.perfectChain += 1;
      if (perfectChainStacks > 0) {
        const chainTarget = perfectChainStacks >= 2 ? 2 : 3;
        if (this.perfectChain >= chainTarget) {
          const chainMultiplier = perfectChainStacks >= 2 ? 4 : 3;
          this.perfectChain = 0;
          buildMultiplier *= chainMultiplier;
          buildTriggers.push({
            id: "perfect-chain",
            icon: "🖨️",
            label: "完美复印",
            multiplier: chainMultiplier,
            family: "basic",
          });
          this.pushEvent("buildBurst", {
            icon: "🖨️",
            title: "完美复印！",
            short: "连中触发金币复印",
            rarity: perfectChainStacks >= 2 ? "legendary" : "epic",
            family: "basic",
          });
        }
      }
    } else {
      this.perfectChain = 0;
    }

    const singedStacks = this.upgrades["singed-gourmet"] || 0;
    if (singedStacks >= 2 && !result.isBurnt && hadSingedSide) {
      const singedMultiplier = 3;
      buildMultiplier *= singedMultiplier;
      buildTriggers.push({
        id: "singed-gourmet",
        icon: "🥩",
        label: "焦香翻身",
        multiplier: singedMultiplier,
        family: "basic",
      });
      result.singedCoinBonus = 6;
    }

    const dangerStacks = this.upgrades["danger-chef"] || 0;
    if (hasBurntSide) {
      this.riskStreak = 0;
    } else if (dangerStacks > 0 && hadSingedSide && result.baseScore > 0) {
      this.riskStreak += 1;
      const riskStep = dangerStacks >= 2 ? 1.5 : 0.75;
      const riskMultiplier = 1 + this.riskStreak * riskStep;
      buildMultiplier *= riskMultiplier;
      buildTriggers.push({
        id: "danger-chef",
        icon: "🌋",
        label: `红温 ${this.riskStreak} 层`,
        multiplier: riskMultiplier,
        family: "basic",
      });
      result.riskCoinBonus = this.riskStreak * (dangerStacks >= 2 ? 4 : 2);
    }

    const lastCallStacks = this.upgrades["last-call"] || 0;
    if (lastCallStacks > 0 && this.remainingMs <= 3_000) {
      const lastCallMultiplier = lastCallStacks >= 2 ? 5 : 3;
      buildMultiplier *= lastCallMultiplier;
      buildTriggers.push({
        id: "last-call",
        icon: "🚨",
        label: "末秒狂飙",
        multiplier: lastCallMultiplier,
        family: "basic",
      });
    }

    const comboEngineStacks = this.upgrades["combo-engine"] || 0;
    if (comboEngineStacks > 0 && this.overdriveRemainingMs > 0) {
      const overdriveMultiplier = comboEngineStacks >= 2 ? 5 : 3;
      buildMultiplier *= overdriveMultiplier;
      buildTriggers.push({
        id: "combo-engine",
        icon: "⚡",
        label: "连击超频",
        multiplier: overdriveMultiplier,
        family: "basic",
      });
    }

    const isEventSuccess = this.effect.id !== "none" && result.baseScore > 0;
    const eventBoosterStacks = this.upgrades["event-booster"] || 0;
    if (isEventSuccess && eventBoosterStacks > 0) {
      if (this.currentEgg.isEncore && eventBoosterStacks >= 2) {
        buildMultiplier *= 2;
        buildTriggers.push({
          id: "event-booster",
          icon: "📣",
          label: "复读加倍",
          multiplier: 2,
          family: "basic",
        });
        result.encoreCoinBonus = 8;
      } else if (!this.currentEgg.isEncore) {
        this.queuedEventId = this.effect.id;
        buildTriggers.push({
          id: "event-booster",
          icon: "📣",
          label: "下一颗复读",
          text: this.effect.title,
          family: "basic",
        });
      }
    }

    const eventAlbumStacks = this.upgrades["event-album"] || 0;
    if (isEventSuccess && eventAlbumStacks > 0) {
      this.eventMeter += 1;
      const eventTarget = eventAlbumStacks >= 2 ? 2 : 3;
      if (this.eventMeter >= eventTarget) {
        this.eventMeter = 0;
        this.forcedJackpotPending = true;
        buildTriggers.push({
          id: "event-album",
          icon: "🎰",
          label: "大奖已装填",
          text: "下一颗必出大奖",
          family: "basic",
        });
        this.pushEvent("buildBurst", {
          icon: "🎰",
          title: "大奖已装填！",
          short: "下一颗必定超级大奖",
          rarity: "legendary",
          family: "basic",
        });
      }
    }

    const confettiStacks = this.upgrades["coin-sprout"] || 0;
    if (isEventSuccess && confettiStacks > 0) {
      const confettiMultiplier = confettiStacks >= 2 ? 2 : 1.5;
      buildMultiplier *= confettiMultiplier;
      buildTriggers.push({
        id: "coin-sprout",
        icon: "🎆",
        label: "彩蛋礼炮",
        multiplier: confettiMultiplier,
        family: "basic",
      });
      result.confettiCoinBonus = confettiStacks >= 2 ? 10 : 5;
    }

    if (buildMultiplier > 1 && result.awardedScore > 0) {
      result.awardedScore = Math.round(result.awardedScore * buildMultiplier);
      result.buildMultiplier = buildMultiplier;
    }
    result.buildTriggers = buildTriggers.map((trigger) => ({ ...trigger }));
    result.buildLabel = buildTriggers
      .map((trigger) => {
        if (!trigger.multiplier) return trigger.label;
        const multiplier = Number.isInteger(trigger.multiplier)
          ? trigger.multiplier
          : trigger.multiplier.toFixed(1);
        return `${trigger.label} ×${multiplier}`;
      })
      .join(" · ");

    if (
      comboEngineStacks > 0 &&
      result.baseScore > 0 &&
      result.combo > 0
    ) {
      const comboTarget = comboEngineStacks >= 2 ? 4 : 5;
      if (result.combo % comboTarget === 0) {
        this.overdriveRemainingMs = comboEngineStacks >= 2 ? 6_000 : 4_000;
        this.pushEvent("buildBurst", {
          icon: "⚡",
          title: "连击超频启动！",
          short:
            comboEngineStacks >= 2
              ? "6 秒内每颗额外爆出 8 金币"
              : "4 秒内每颗额外爆出 4 金币",
          rarity: "legendary",
          family: "basic",
        });
      }
    }

    this.combo = result.combo;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.totalScore += result.awardedScore;
    this.stageScore += result.awardedScore;
    this.eggsCooked += 1;
    this.stageEggs += 1;
    if (result.isPerfect) this.perfectEggs += 1;
    if (result.isPerfect) this.stagePerfects += 1;

    this.stageProgress += 1;
    result.progressGain = 1;
    result.unlockedLevel = this.level + 1;

    if (activeEffect.progressBonus > 0) {
      result.eventCoinBonus = activeEffect.progressBonus * 4;
    }
    const plateStacks = this.upgrades["opening-jackpot"] || 0;
    const plateTarget = plateStacks >= 2 ? 2 : 3;
    if (plateStacks > 0 && this.stageEggs % plateTarget === 0) {
      result.doublePlate = true;
      result.doublePlateCoinBonus = plateStacks >= 2 ? 8 : 4;
      buildTriggers.push({
        id: "opening-jackpot",
        icon: "🍽️",
        label: "双份装盘",
        text: `金币 +${result.doublePlateCoinBonus}`,
        family: "basic",
      });
    }
    if (lastCallStacks > 0 && this.remainingMs <= 3_000) {
      result.lastCallCoinBonus = lastCallStacks >= 2 ? 8 : 4;
    }
    if (buildTriggers.some((trigger) => trigger.id === "perfect-chain")) {
      result.chainCoinBonus = perfectChainStacks >= 2 ? 10 : 6;
    }
    if (comboEngineStacks > 0 && this.overdriveRemainingMs > 0) {
      result.overdriveCoinBonus = comboEngineStacks >= 2 ? 8 : 4;
    }
    const characterCoinEvery =
      this.characterBuff.coinEvery || this.characterBuff.progressEvery || 0;
    if (
      characterCoinEvery > 0 &&
      this.stageEggs % characterCoinEvery === 0
    ) {
      result.characterPeriodicCoinBonus =
        this.characterBuff.periodicCoinBonus ||
        (this.characterBuff.bonusProgress || 1) * 6;
    }
    result.buildTriggers = buildTriggers.map((trigger) => ({ ...trigger }));
    result.buildLabel = buildTriggers
      .map((trigger) => {
        if (trigger.text) return trigger.text;
        if (!trigger.multiplier) return trigger.label;
        const multiplier = Number.isInteger(trigger.multiplier)
          ? trigger.multiplier
          : trigger.multiplier.toFixed(1);
        return `${trigger.label} ×${multiplier}`;
      })
      .join(" · ");
    const rarityCoins = {
      normal: 0,
      common: 0,
      rare: 1,
      epic: 2,
      danger: 3,
      legendary: 5,
    }[result.rarity] || 0;
    const buildCoins = Math.max(
      0,
      Math.floor(Math.log2(Math.max(1, result.buildMultiplier || 1))),
    );
    let coinReward = 2 + (result.isPerfect ? 2 : 0) + rarityCoins + buildCoins;
    coinReward += result.singedCoinBonus || 0;
    coinReward += result.riskCoinBonus || 0;
    coinReward += result.encoreCoinBonus || 0;
    coinReward += result.confettiCoinBonus || 0;
    coinReward += result.eventCoinBonus || 0;
    coinReward += result.doublePlateCoinBonus || 0;
    coinReward += result.lastCallCoinBonus || 0;
    coinReward += result.chainCoinBonus || 0;
    coinReward += result.overdriveCoinBonus || 0;
    coinReward += result.characterPeriodicCoinBonus || 0;
    if (singleTap && (this.upgrades["steady-hand"] || 0) >= 2) {
      coinReward += 3;
      result.magneticCoinBonus = 3;
    }
    coinReward += this.characterBuff.serveCoinBonus || 0;
    if (this.stageEggs === 1) {
      coinReward += this.characterBuff.firstEggCoinBonus || 0;
    }
    coinReward += activeEffect.coinBonus || 0;
    coinReward = Math.max(
      1,
      Math.round(
        coinReward *
          (activeEffect.coinMultiplier || 1) *
          (this.characterBuff.serveCoinMultiplier || 1),
      ),
    );
    this.runCoins += coinReward;
    this.stageCoins += coinReward;
    result.coinReward = coinReward;

    const timeSeasoningStacks = this.upgrades["time-seasoning"] || 0;
    const healingComboTarget = timeSeasoningStacks >= 2 ? 4 : 5;
    const buildHeal =
      timeSeasoningStacks > 0 &&
      this.stageEggs % healingComboTarget === 0;
    const eventHeal = activeEffect.healOnSuccess > 0;
    if ((buildHeal || eventHeal) && this.health < this.maxHealth) {
      this.health = Math.min(
        this.maxHealth,
        this.health + Math.max(activeEffect.healOnSuccess || 0, buildHeal ? 1 : 0),
      );
      result.heartRestored = 1;
      this.pushEvent("heartRestored", {
        health: this.health,
        maxHealth: this.maxHealth,
        source: eventHeal ? "event" : "upgrade",
      });
    }

    this.pushEvent("served", { result, eggNumber: this.eggsCooked });
    if (
      previousComboMood === COMBO_MOOD.NORMAL &&
      this.comboMood === COMBO_MOOD.LIVELY
    ) {
      this.pushEvent("perfectStreakLively", {
        perfectStreak: this.perfectStreak,
        combo: result.combo,
        hitQuality: result.hitQuality,
        comboMood: this.comboMood,
      });
    } else if (
      previousComboMood !== COMBO_MOOD.FEVER &&
      this.comboMood === COMBO_MOOD.FEVER
    ) {
      this.pushEvent("perfectStreakFever", {
        perfectStreak: this.perfectStreak,
        combo: result.combo,
        hitQuality: result.hitQuality,
        comboMood: this.comboMood,
      });
    }
    if (this.remainingMs <= 0) {
      this.finishStage({ cleared: this.health > 0 });
    } else {
      this.spawnEgg();
    }
    return result;
  }

  isHeatSuccessful(heat, effect = this.getActiveEffect()) {
    return getHitQuality(heat, effect) !== HIT_QUALITY.MISS;
  }

  registerSuccessfulAction(action) {
    this.successfulActions += 1;
    this.stageSuccessfulActions += 1;
    this.pushEvent("timingSuccess", {
      action,
      successfulActions: this.successfulActions,
    });
  }

  loseHeart(reason = "missed-zone", detail = {}) {
    const phase = this.currentEgg?.phase || "first";
    const feedback =
      detail.feedback ||
      (reason === "overheat"
        ? { id: "burnt", label: "糊锅啦！" }
        : getMissFeedback(detail.heat ?? this.currentEgg?.heat ?? 0, this.getActiveEffect()));
    this.currentEgg = null;
    this.combo = 0;
    this.perfectChain = 0;
    this.perfectStreak = 0;
    this.comboMood = COMBO_MOOD.NORMAL;
    this.lastHitQuality = HIT_QUALITY.MISS;
    this.riskStreak = 0;

    if (this.stageGuardCharges > 0) {
      this.stageGuardCharges -= 1;
      this.pushEvent("heartSaved", {
          reason,
          phase,
          missReason: feedback.id,
          missLabel: feedback.label,
          source: "character",
      });
      return false;
    }
    if (this.panGuardCharges > 0) {
      this.panGuardCharges -= 1;
      this.pushEvent("heartSaved", {
          reason,
          phase,
          missReason: feedback.id,
          missLabel: feedback.label,
          source: "pan",
      });
      return false;
    }
    if (this.effect.guardHeart && !this.eventGuardUsed) {
      this.eventGuardUsed = true;
      this.pushEvent("heartSaved", {
          reason,
          phase,
          missReason: feedback.id,
          missLabel: feedback.label,
          source: "event",
      });
      return false;
    }
    if (this.shieldCharges > 0) {
      this.shieldCharges -= 1;
      this.pushEvent("heartSaved", {
          reason,
          phase,
          missReason: feedback.id,
          missLabel: feedback.label,
          source: "upgrade",
      });
      return false;
    }

    this.health = Math.max(0, this.health - 1);
    this.pushEvent("heartLost", {
      reason,
      phase,
      missReason: feedback.id,
      missLabel: feedback.label,
      health: this.health,
      maxHealth: this.maxHealth,
    });
    if (this.health <= 0) {
      this.endRun("no-health");
    }
    return true;
  }

  tapCoinRush() {
    if (this.state !== "playing" || this.coinRushRemainingMs <= 0) return false;
    this.coinRushTaps += 1;
    let reward = 1 + (this.characterBuff.coinRushTapBonus || 0);
    const confettiStacks = this.upgrades["coin-sprout"] || 0;
    reward += confettiStacks;
    const milestone = this.coinRushTaps % 10 === 0;
    if (milestone) reward += 5;
    this.runCoins += reward;
    this.stageCoins += reward;
    this.pushEvent("coinRushTap", {
      taps: this.coinRushTaps,
      reward,
      milestone,
      coins: this.runCoins,
    });
    return true;
  }

  endRun(reason = "cash-out", { silent = false } = {}) {
    if (this.state === "ended") return false;
    this.state = "ended";
    this.runEndReason = reason;
    this.currentEgg = null;
    this.coinRushRemainingMs = 0;
    this.coinRushGraceRemainingMs = 0;
    this.remainingMs = 0;
    this.coinsEarned = this.calculateCoins();
    this.pushEvent("gameEnded", {
      silent,
      reason,
      levelReached: this.level,
      totalScore: this.totalScore,
      eggsCooked: this.eggsCooked,
      bestCombo: this.bestCombo,
      bestPerfectStreak: this.bestPerfectStreak,
      perfectEggs: this.perfectEggs,
      coinsEarned: this.coinsEarned,
      upgrades: this.getUpgradeSummary(),
    });
    return true;
  }

  selectUpgrade(id) {
    if (this.state !== "choosing") return false;
    const upgrade = this.pendingChoices.find((candidate) => candidate.id === id);
    if (!upgrade) return false;

    this.upgrades[id] = (this.upgrades[id] || 0) + 1;
    const awakened = this.upgrades[id] === upgrade.maxStacks;
    this.pendingChoices = [];
    this.pushEvent("upgradeSelected", {
      upgrade: { ...upgrade },
      stacks: this.upgrades[id],
      preview: getUpgradePreview(id, this.upgrades[id] - 1),
      awakened,
      awakenedCount: awakenedUpgradeCount(this.upgrades),
    });
    this.startNextStage();
    return true;
  }

  spawnEgg(forcedEventId) {
    this.eventGuardUsed = false;
    const luckyStacks = this.upgrades["lucky-lid"] || 0;
    const chance = clamp(this.eventChance, 0, 1);
    const encoreEventId = !forcedEventId ? this.queuedEventId : null;
    const forceJackpot =
      !forcedEventId && !encoreEventId && this.forcedJackpotPending;
    if (forcedEventId) {
      this.effect = createEvent(forcedEventId);
    } else if (encoreEventId) {
      this.effect = createEvent(encoreEventId);
      this.queuedEventId = null;
    } else if (forceJackpot) {
      this.effect = createEvent("jackpot");
      this.forcedJackpotPending = false;
    } else {
      this.effect = createRandomEvent(this.random, chance, { level: this.level });
      const extraDraws = luckyStacks + (this.characterBuff.eventDraws || 0);
      for (let draw = 0; draw < extraDraws; draw += 1) {
        const challenger = createRandomEvent(this.random, chance, {
          level: this.level,
        });
        if (rarityRank(challenger.rarity) > rarityRank(this.effect.rarity)) {
          this.effect = challenger;
        }
      }
    }

    if (this.effect.specialMode === "coin-rush") {
      this.currentEgg = null;
      this.coinRushRemainingMs = this.effect.specialDurationMs;
      this.coinRushTaps = 0;
      this.encounteredEventIds.add(this.effect.id);
      this.pushEvent("eventTriggered", { effect: { ...this.effect } });
      this.pushEvent("coinRushStarted", {
        effect: { ...this.effect },
        durationMs: this.coinRushRemainingMs,
      });
      return;
    }

    this.currentEgg = {
      number: this.eggsCooked + 1,
      phase: "first",
      heat: 0,
      sideOne: null,
      sideTwo: null,
      smokeStarted: false,
      crisisElapsedMs: 0,
      crisisMultiplier: 1,
      isEncore: Boolean(encoreEventId),
      isForcedJackpot: forceJackpot,
    };
    if (this.effect.id !== "none") this.encounteredEventIds.add(this.effect.id);
    if (this.effect.crisis) this.rollCrisisSpeed();

    this.pushEvent("eggStarted", {
      eggNumber: this.currentEgg.number,
      effect: { ...this.effect },
      startingHeat: 0,
      isEncore: this.currentEgg.isEncore,
      isForcedJackpot: this.currentEgg.isForcedJackpot,
    });
    if (this.currentEgg.isEncore) {
      this.pushEvent("buildBurst", {
        icon: "📣",
        title: "奇遇复读！",
        short: this.effect.title,
        rarity: "epic",
        family: "basic",
      });
    }
    if (this.currentEgg.isForcedJackpot) {
      this.pushEvent("buildBurst", {
        icon: "🎰",
        title: "保底大奖登场！",
        short: "蓄力完成，本颗 ×10",
        rarity: "legendary",
        family: "basic",
      });
    }
    if (this.effect.id !== "none") {
      this.pushEvent("eventTriggered", { effect: { ...this.effect } });
    }
  }

  getActiveEffect() {
    const effect = { ...this.effect };
    const dangerStacks = this.upgrades["danger-chef"] || 0;
    const singedStacks = this.upgrades["singed-gourmet"] || 0;
    const awakenedCount = awakenedUpgradeCount(this.upgrades);
    const characterPadding = this.characterBuff.perfectPadding || 0;
    const earlyPadding = getEarlyLevelPerfectPadding(this.level);

    effect.perfectMin = clamp(effect.perfectMin - characterPadding - earlyPadding, 40, 90);
    effect.perfectMax = clamp(effect.perfectMax + characterPadding + earlyPadding, 55, 95);
    if (dangerStacks === 1) effect.speedMultiplier *= 1.28;
    if (dangerStacks >= 2) effect.speedMultiplier *= 1.55;
    effect.singedAsPerfect = singedStacks > 0;
    effect.awakenedCount = awakenedCount;
    effect.awakenedMultiplier = 1;
    const levelPressure = Math.max(0, this.level - 1);
    effect.speedMultiplier *= 1 + levelPressure * LEVEL_SPEED_STEP;
    const perfectShrink = Math.min(10, levelPressure * 1.5);
    effect.perfectMin = clamp(effect.perfectMin + perfectShrink, 45, 92);
    effect.perfectMax = clamp(effect.perfectMax - perfectShrink, effect.perfectMin + 4, 95);

    return effect;
  }

  applyPanHeatAssist(heat) {
    return heat;
  }

  openUpgradeDraft() {
    this.draftRerolls = 1;
    this.pendingChoices = this.createUpgradeChoices();
    if (this.pendingChoices.length === 0) {
      this.startNextStage();
      return;
    }
    this.state = "choosing";
    this.pushEvent("upgradeDraft", this.getUpgradeDraftPayload());
  }

  createUpgradeChoices(excludedIds = []) {
    const available = UPGRADE_DEFINITIONS.filter(
      (upgrade) => (this.upgrades[upgrade.id] || 0) < upgrade.maxStacks,
    );
    const excluded = new Set(excludedIds);
    const freshPool = available.filter((upgrade) => !excluded.has(upgrade.id));
    const pool = freshPool.length >= 3 ? [...freshPool] : [...available];
    const choices = [];

    const takeChoice = (candidates) => {
      if (candidates.length === 0) return;
      const candidateIds = new Set(candidates.map((candidate) => candidate.id));
      const eligibleIndexes = pool
        .map((candidate, index) => (candidateIds.has(candidate.id) ? index : -1))
        .filter((index) => index >= 0);
      if (eligibleIndexes.length === 0) return;
      const roll = Math.floor(this.random() * eligibleIndexes.length);
      const poolIndex = eligibleIndexes[clamp(roll, 0, eligibleIndexes.length - 1)];
      choices.push(pool.splice(poolIndex, 1)[0]);
    };

    const awakeningCandidates = pool.filter(
      (upgrade) => (this.upgrades[upgrade.id] || 0) === upgrade.maxStacks - 1,
    );
    takeChoice(awakeningCandidates);

    while (pool.length > 0 && choices.length < 3) {
      const selected = pool[
        clamp(Math.floor(this.random() * pool.length), 0, pool.length - 1)
      ];
      const index = pool.findIndex((choice) => choice.id === selected.id);
      choices.push(pool.splice(index, 1)[0]);
    }

    return choices.map((choice) => ({ ...choice }));
  }

  getUpgradeDraftPayload() {
    return {
      choices: this.pendingChoices.map((choice) => ({ ...choice })),
      rerolls: this.draftRerolls,
      nextLevel: this.level + 1,
      nextTarget: this.pendingNextStageTarget || levelTarget(this.level + 1),
      nextPanPerk: getPanPerk(this.level + 1),
    };
  }

  rerollUpgradeDraft() {
    if (this.state !== "choosing" || this.draftRerolls <= 0) return false;
    const previousIds = this.pendingChoices.map((choice) => choice.id);
    this.draftRerolls -= 1;
    this.pendingChoices = this.createUpgradeChoices(previousIds);
    this.pushEvent("upgradeDraftRerolled", this.getUpgradeDraftPayload());
    return true;
  }

  updateCrisis(elapsedMs) {
    if (!this.effect.crisis || !this.currentEgg) return;
    this.currentEgg.crisisElapsedMs += elapsedMs;
    while (this.currentEgg.crisisElapsedMs >= 480) {
      this.currentEgg.crisisElapsedMs -= 480;
      this.rollCrisisSpeed();
    }
  }

  rollCrisisSpeed() {
    this.currentEgg.crisisMultiplier = 0.35 + this.random() * 2.05;
  }

  finishStage({ cleared = this.health > 0 } = {}) {
    if (this.state === "stage-ended" || this.state === "ended") return;
    this.state = "stage-ended";
    this.stageCleared = Boolean(cleared);
    this.remainingMs = 0;
    this.currentEgg = null;
    this.coinRushRemainingMs = 0;
    this.coinRushGraceRemainingMs = 0;
    if (this.stageCleared) {
      const clearBonus = 8 + this.level * 2;
      this.runCoins += clearBonus;
      this.stageCoins += clearBonus;
    }
    this.coinsEarned = this.calculateCoins();
    const target = null;
    this.pendingNextStageTarget = null;
    this.pushEvent("stageEnded", {
      level: this.level,
      stageScore: this.stageScore,
      stageProgress: this.stageProgress,
      stageEggs: this.stageEggs,
      stagePerfects: this.stagePerfects,
      stageCoins: this.stageCoins,
      health: this.health,
      maxHealth: this.maxHealth,
      target,
      canContinue: this.stageCleared,
      totalScore: this.totalScore,
      eggsCooked: this.eggsCooked,
      bestCombo: this.bestCombo,
      bestPerfectStreak: this.bestPerfectStreak,
      perfectEggs: this.perfectEggs,
      perfectChain: this.perfectChain,
      coinsPreview: this.coinsEarned,
      upgrades: this.getUpgradeSummary(),
      nextLevelMultiplier: levelScoreMultiplier(this.level + 1),
      nextPanPerk: getPanPerk(this.level + 1),
      nextTarget: null,
    });
  }

  continueStage() {
    if (this.state !== "stage-ended") return false;
    if (!this.stageCleared) return false;
    this.openUpgradeDraft();
    return true;
  }

  startNextStage() {
    this.level += 1;
    this.remainingMs = this.durationMs;
    this.stageScore = 0;
    this.stageProgress = 0;
    this.stageCleared = false;
    this.stageCoins = 0;
    this.stageSuccessfulActions = 0;
    this.stageEggs = 0;
    this.stagePerfects = 0;
    this.stageEarnedTimeMs = 0;
    this.panCharge = 0;
    this.coinRushGraceRemainingMs = 0;
    this.panGuardCharges = getPanPerk(this.level).guardCharges || 0;
    this.riskStreak = 0;
    this.overdriveRemainingMs = 0;
    this.shieldCharges = this.upgrades["combo-armor"] || 0;
    this.stageGuardCharges = this.characterBuff.stageGuard || 0;
    this.stageTarget = levelTarget(this.level);
    this.pendingNextStageTarget = null;
    this.state = "playing";
    this.pushEvent("stageStarted", {
      level: this.level,
      target: this.stageTarget,
      scoreMultiplier: levelScoreMultiplier(this.level),
      panPerk: getPanPerk(this.level),
    });
    this.spawnEgg();
  }

  cashOut({ silent = false } = {}) {
    if (this.state === "start" || this.state === "ended") return false;
    return this.endRun("cash-out", { silent });
  }

  calculateCoins() {
    return Math.max(0, Math.round(this.runCoins));
  }

  ensurePlaying() {
    if (this.state === "playing" && this.coinRushGraceRemainingMs > 0) {
      this.pushEvent("invalidAction", { message: "准备出锅！" });
      return false;
    }
    if (this.state === "playing" && this.panIntroRemainingMs > 0) {
      this.pushEvent("invalidAction", { message: "先确认本关特殊目标。" });
      return false;
    }
    if (this.state === "playing" && this.currentEgg) return true;
    if (this.state === "choosing") {
      this.pushEvent("invalidAction", { message: "先选一份秘制配方！" });
    } else if (this.state === "paused") {
      this.pushEvent("invalidAction", { message: "游戏暂停中，先继续挑战！" });
    } else if (this.state === "stage-ended") {
      this.pushEvent("invalidAction", { message: "本关结束，选择继续或领取金币！" });
    } else {
      this.pushEvent("invalidAction", { message: "先点击开始煎蛋吧！" });
    }
    return false;
  }

  getUpgradeSummary() {
    return UPGRADE_DEFINITIONS.filter((upgrade) => this.upgrades[upgrade.id])
      .map((upgrade) => ({
        ...upgrade,
        stacks: this.upgrades[upgrade.id],
      }));
  }

  pushEvent(type, detail = {}) {
    this.events.push({ type, ...detail });
  }

  drainEvents() {
    return this.events.splice(0);
  }

  getSnapshot() {
    const egg = this.currentEgg;
    const sideOne = egg ? (egg.phase === "first" ? egg.heat : egg.sideOne) : null;
    const sideTwo = egg && egg.phase === "second" ? egg.heat : null;
    return {
      state: this.state,
      level: this.level,
      levelTarget: this.stageTarget,
      levelScoreMultiplier: levelScoreMultiplier(this.level),
      panPerk: getPanPerk(this.level),
      panCharge: this.panCharge,
      panGuardCharges: this.panGuardCharges,
      riskStreak: this.riskStreak,
      eventMeter: this.eventMeter,
      forcedJackpotPending: this.forcedJackpotPending,
      overdriveRemainingMs: this.overdriveRemainingMs,
      panIntroRemainingMs: this.panIntroRemainingMs,
      remainingMs: this.remainingMs,
      health: this.health,
      maxHealth: this.maxHealth,
      stageProgress: this.stageProgress,
      stageCleared: this.stageCleared,
      successfulActions: this.successfulActions,
      stageSuccessfulActions: this.stageSuccessfulActions,
      runCoins: this.runCoins,
      stageCoins: this.stageCoins,
      coinRushRemainingMs: this.coinRushRemainingMs,
      coinRushGraceRemainingMs: this.coinRushGraceRemainingMs,
      coinRushTaps: this.coinRushTaps,
      totalScore: this.totalScore,
      stageScore: this.stageScore,
      stageEggs: this.stageEggs,
      stagePerfects: this.stagePerfects,
      combo: this.combo,
      bestCombo: this.bestCombo,
      bestPerfectStreak: this.bestPerfectStreak,
      perfectChain: this.perfectChain,
      perfectStreak: this.perfectStreak,
      comboMood: this.comboMood,
      lastHitQuality: this.lastHitQuality,
      eggsCooked: this.eggsCooked,
      perfectEggs: this.perfectEggs,
      effect: this.getActiveEffect(),
      baseEffect: { ...this.effect },
      upgrades: this.getUpgradeSummary(),
      shieldCharges: this.shieldCharges,
      pendingChoices: this.pendingChoices.map((choice) => ({ ...choice })),
      draftRerolls: this.draftRerolls,
      awakenedCount: awakenedUpgradeCount(this.upgrades),
      coinsEarned: this.coinsEarned,
      autoServeActive: (this.upgrades["steady-hand"] || 0) > 0,
      currentEgg: egg ? { ...egg, sideOne, sideTwo } : null,
      currentMultiplier: comboMultiplier(this.combo),
    };
  }
}
