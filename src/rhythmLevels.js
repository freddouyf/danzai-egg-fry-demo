export const RHYTHM_COMMAND_TYPES = Object.freeze({
  TAP: "tap",
  HOLD: "hold",
  MASH: "mash",
});

const EGG_CYCLE_OFFSETS = [600, 5_000, 9_400, 13_800, 18_200, 22_600];

function createFriedEggCycle(eggIndex, startAtMs) {
  const label = `egg-${eggIndex}`;
  return [
    {
      id: `${label}-crack`,
      input: RHYTHM_COMMAND_TYPES.TAP,
      actionName: "敲蛋",
      prompt: "敲蛋！",
      helperText: "等蛋靠近蓝色区再点",
      scene: "crack",
      eggIndex,
      startAtMs,
      targetAtMs: startAtMs + 560,
      expireAtMs: startAtMs + 1_060,
    },
    {
      id: `${label}-fry`,
      input: RHYTHM_COMMAND_TYPES.HOLD,
      actionName: "煎蛋",
      prompt: "按住煎！",
      helperText: "按住到亮区松开",
      scene: "fry",
      eggIndex,
      startAtMs: startAtMs + 1_220,
      targetAtMs: startAtMs + 2_000,
      targetHoldMs: 780,
      expireAtMs: startAtMs + 2_580,
    },
    {
      id: `${label}-serve`,
      input: RHYTHM_COMMAND_TYPES.TAP,
      actionName: "出锅",
      prompt: "出锅！",
      helperText: "看准装盘",
      scene: "serve",
      eggIndex,
      startAtMs: startAtMs + 2_760,
      targetAtMs: startAtMs + 3_320,
      expireAtMs: startAtMs + 3_820,
    },
  ];
}

export const RHYTHM_DISH_LEVELS = Object.freeze([
  Object.freeze({
    id: "genki-fried-egg",
    title: "元气煎蛋",
    dishName: "元气煎蛋",
    durationMs: 30_000,
    actionsPerDish: 3,
    starEggs: Object.freeze([2, 4, 6]),
    commands: Object.freeze(
      EGG_CYCLE_OFFSETS.flatMap((offset, index) => createFriedEggCycle(index + 1, offset)),
    ),
  }),
  Object.freeze({
    id: "golden-egg-mix",
    title: "黄金蛋液",
    dishName: "黄金蛋液",
    durationMs: 24_000,
    actionsPerDish: 3,
    starEggs: Object.freeze([2, 4, 5]),
    commands: Object.freeze([
      { id: "gold-crack", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "敲蛋", prompt: "敲蛋！", helperText: "看准节奏点击", scene: "crack", startAtMs: 800, targetAtMs: 1_500, expireAtMs: 2_200 },
      { id: "gold-stir", input: RHYTHM_COMMAND_TYPES.MASH, actionName: "搅拌", prompt: "快速搅拌！", helperText: "时间内狂点", scene: "mash", startAtMs: 2_700, endAtMs: 5_000, targetTaps: 8 },
      { id: "gold-warm", input: RHYTHM_COMMAND_TYPES.HOLD, actionName: "保温", prompt: "按住保温！", helperText: "按住到亮区松开", scene: "fry", startAtMs: 5_600, targetAtMs: 6_800, targetHoldMs: 1_200, expireAtMs: 8_300 },
      { id: "gold-pour", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "倒入锅中", prompt: "倒入锅中！", helperText: "进命中区再点", scene: "serve", startAtMs: 8_900, targetAtMs: 9_650, expireAtMs: 10_400 },
      { id: "gold-fast-stir", input: RHYTHM_COMMAND_TYPES.MASH, actionName: "快速搅拌", prompt: "快速搅拌！", helperText: "连点打出金色蛋液", scene: "mash", startAtMs: 11_000, endAtMs: 13_500, targetTaps: 9 },
      { id: "gold-finish", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "完成", prompt: "完成！", helperText: "最后一下定型", scene: "serve", startAtMs: 14_100, targetAtMs: 14_850, expireAtMs: 15_600 },
    ]),
  }),
  Object.freeze({
    id: "breakfast-plate",
    title: "早餐拼盘",
    dishName: "早餐拼盘",
    durationMs: 22_000,
    actionsPerDish: 3,
    starEggs: Object.freeze([1, 2, 3]),
    commands: Object.freeze([
      { id: "toast-place", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "放面包", prompt: "放面包！", helperText: "看准节奏点击", scene: "serve", startAtMs: 800, targetAtMs: 1_450, expireAtMs: 2_100 },
      { id: "toast-bake", input: RHYTHM_COMMAND_TYPES.HOLD, actionName: "烘烤", prompt: "按住烘烤！", helperText: "按住到亮区松开", scene: "fry", startAtMs: 2_650, targetAtMs: 3_850, targetHoldMs: 1_200, expireAtMs: 5_300 },
      { id: "plate-egg", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "加蛋", prompt: "加蛋！", helperText: "进命中区再点", scene: "crack", startAtMs: 5_900, targetAtMs: 6_600, expireAtMs: 7_300 },
      { id: "plate-arrange", input: RHYTHM_COMMAND_TYPES.MASH, actionName: "摆盘", prompt: "快速摆盘！", helperText: "时间内狂点", scene: "mash", startAtMs: 7_900, endAtMs: 10_300, targetTaps: 8 },
      { id: "plate-serve", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "出餐", prompt: "出餐！", helperText: "最后一下上桌", scene: "serve", startAtMs: 10_950, targetAtMs: 11_700, expireAtMs: 12_500 },
    ]),
  }),
]);

export const RHYTHM_TEST_LEVEL = RHYTHM_DISH_LEVELS[0];
