export const RHYTHM_COMMAND_TYPES = Object.freeze({
  TAP: "tap",
  HOLD: "hold",
  MASH: "mash",
});

const EGG_CYCLE_OFFSETS = [600, 3_000, 5_400, 7_800, 10_200, 12_600, 15_000, 17_400, 19_800, 22_200, 24_600, 27_000];

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
      dishStepIndex: 0,
      eggIndex,
      startAtMs,
      targetAtMs: startAtMs + 330,
      expireAtMs: startAtMs + 720,
    },
    {
      id: `${label}-whisk`,
      input: RHYTHM_COMMAND_TYPES.MASH,
      actionName: "打蛋",
      prompt: "快速打蛋！",
      helperText: "时间内狂点",
      scene: "mash",
      dishStepIndex: 1,
      eggIndex,
      startAtMs: startAtMs + 600,
      endAtMs: startAtMs + 2_800,
      targetTaps: 8,
    },
    {
      id: `${label}-fry-serve`,
      input: RHYTHM_COMMAND_TYPES.HOLD,
      actionName: "煎熟出锅",
      prompt: "按住煎熟！",
      helperText: "按住到亮区松开",
      scene: "fry",
      dishStepIndex: 2,
      eggIndex,
      startAtMs: startAtMs + 1_500,
      targetAtMs: startAtMs + 2_300,
      targetHoldMs: 800,
      expireAtMs: startAtMs + 2_900,
    },
  ];
}

export const RHYTHM_DISH_LEVELS = Object.freeze([
  Object.freeze({
    id: "genki-fried-egg",
    title: "元气煎蛋",
    dishName: "元气煎蛋",
    durationMs: 30_000,
    tapDurationMs: 1_500,
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
    tapDurationMs: 1_300,
    actionsPerDish: 3,
    starEggs: Object.freeze([2, 4, 5]),
    commands: Object.freeze([
      { id: "gold-crack", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "敲蛋", prompt: "敲蛋！", helperText: "看准节奏点击", scene: "crack", startAtMs: 600, targetAtMs: 960, expireAtMs: 1_350 },
      { id: "gold-stir", input: RHYTHM_COMMAND_TYPES.MASH, actionName: "搅拌", prompt: "快速搅拌！", helperText: "时间内狂点", scene: "mash", startAtMs: 1_200, endAtMs: 3_400, targetTaps: 8 },
      { id: "gold-warm", input: RHYTHM_COMMAND_TYPES.HOLD, actionName: "保温", prompt: "按住保温！", helperText: "按住到亮区松开", scene: "fry", startAtMs: 2_100, targetAtMs: 2_900, targetHoldMs: 800, expireAtMs: 3_500 },
      { id: "gold-pour", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "倒入锅中", prompt: "倒入锅中！", helperText: "进命中区再点", scene: "serve", startAtMs: 3_200, targetAtMs: 3_560, expireAtMs: 3_950 },
      { id: "gold-fast-stir", input: RHYTHM_COMMAND_TYPES.MASH, actionName: "快速搅拌", prompt: "快速搅拌！", helperText: "连点打出金色蛋液", scene: "mash", startAtMs: 4_100, endAtMs: 6_300, targetTaps: 9 },
      { id: "gold-finish", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "完成", prompt: "完成！", helperText: "最后一下定型", scene: "serve", startAtMs: 5_200, targetAtMs: 5_560, expireAtMs: 5_950 },
    ]),
  }),
  Object.freeze({
    id: "breakfast-plate",
    title: "早餐拼盘",
    dishName: "早餐拼盘",
    durationMs: 22_000,
    tapDurationMs: 1_100,
    actionsPerDish: 3,
    starEggs: Object.freeze([1, 2, 3]),
    commands: Object.freeze([
      { id: "toast-place", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "放面包", prompt: "放面包！", helperText: "看准节奏点击", scene: "serve", startAtMs: 600, targetAtMs: 960, expireAtMs: 1_350 },
      { id: "toast-bake", input: RHYTHM_COMMAND_TYPES.HOLD, actionName: "烘烤", prompt: "按住烘烤！", helperText: "按住到亮区松开", scene: "fry", startAtMs: 1_200, targetAtMs: 2_000, targetHoldMs: 800, expireAtMs: 2_600 },
      { id: "plate-egg", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "加蛋", prompt: "加蛋！", helperText: "进命中区再点", scene: "crack", startAtMs: 2_300, targetAtMs: 2_660, expireAtMs: 3_050 },
      { id: "plate-arrange", input: RHYTHM_COMMAND_TYPES.MASH, actionName: "摆盘", prompt: "快速摆盘！", helperText: "时间内狂点", scene: "mash", startAtMs: 3_200, endAtMs: 5_400, targetTaps: 8 },
      { id: "plate-serve", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "出餐", prompt: "出餐！", helperText: "最后一下上桌", scene: "serve", startAtMs: 4_400, targetAtMs: 4_760, expireAtMs: 5_150 },
    ]),
  }),
]);

export const RHYTHM_TEST_LEVEL = RHYTHM_DISH_LEVELS[0];
