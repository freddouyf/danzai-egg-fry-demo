export const RHYTHM_COMMAND_TYPES = Object.freeze({
  TAP: "tap",
  HOLD: "hold",
  MASH: "mash",
});

function step({
  id,
  input,
  actionName,
  prompt,
  scene,
  dishStepIndex,
  helperText = "",
  targetDelayMs = 850,
  targetHoldMs = 850,
  tapDurationMs,
  mashDurationMs = 2_200,
  targetTaps = 8,
  goodMs,
}) {
  return {
    id,
    input,
    actionName,
    prompt,
    helperText,
    scene,
    dishStepIndex,
    startAtMs: 0,
    targetAtMs: targetDelayMs,
    targetDelayMs,
    targetHoldMs,
    expireAtMs: tapDurationMs || targetDelayMs + 650,
    endAtMs: mashDurationMs,
    targetTaps,
    goodMs,
  };
}

export const RHYTHM_DISH_LEVELS = Object.freeze([
  Object.freeze({
    id: "genki-fried-egg",
    title: "第 1 关",
    dishName: "元气煎蛋",
    unitName: "煎蛋",
    durationMs: 30_000,
    tapDurationMs: 1_500,
    actionsPerDish: 3,
    starEggs: Object.freeze([2, 4, 6]),
    commands: Object.freeze([
      step({ id: "egg-crack", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "敲蛋", prompt: "敲蛋！", helperText: "等蛋靠近蓝色区再点", scene: "crack", dishStepIndex: 0, targetDelayMs: 900, tapDurationMs: 1_500, goodMs: 330 }),
      step({ id: "egg-whisk", input: RHYTHM_COMMAND_TYPES.MASH, actionName: "快速打蛋", prompt: "快速打蛋！", helperText: "打满进度", scene: "mash", dishStepIndex: 1, mashDurationMs: 2_400, targetTaps: 7 }),
      step({ id: "egg-fry", input: RHYTHM_COMMAND_TYPES.HOLD, actionName: "按住煎熟", prompt: "按住煎熟！", helperText: "到亮区松开", scene: "fry", dishStepIndex: 2, targetHoldMs: 850, goodMs: 360 }),
    ]),
  }),
  Object.freeze({
    id: "golden-omelette",
    title: "第 2 关",
    dishName: "黄金蛋卷",
    unitName: "蛋卷",
    durationMs: 35_000,
    tapDurationMs: 1_300,
    actionsPerDish: 4,
    starEggs: Object.freeze([2, 4, 6]),
    commands: Object.freeze([
      step({ id: "omelette-crack", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "敲蛋", prompt: "敲蛋！", helperText: "看准节奏点击", scene: "crack", dishStepIndex: 0, targetDelayMs: 780, tapDurationMs: 1_300, goodMs: 300 }),
      step({ id: "omelette-stir", input: RHYTHM_COMMAND_TYPES.MASH, actionName: "搅拌蛋液", prompt: "快速搅拌！", helperText: "打满进度", scene: "mash", dishStepIndex: 1, mashDurationMs: 2_200, targetTaps: 9 }),
      step({ id: "omelette-fry", input: RHYTHM_COMMAND_TYPES.HOLD, actionName: "慢慢煎", prompt: "慢慢煎！", helperText: "到亮区松开", scene: "fry", dishStepIndex: 2, targetHoldMs: 780, goodMs: 300 }),
      step({ id: "omelette-roll", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "卷起出锅", prompt: "卷起出锅！", helperText: "最后一下定型", scene: "serve", dishStepIndex: 3, targetDelayMs: 780, tapDurationMs: 1_300, goodMs: 300 }),
    ]),
  }),
  Object.freeze({
    id: "breakfast-plate",
    title: "第 3 关",
    dishName: "早餐拼盘",
    unitName: "拼盘",
    durationMs: 40_000,
    tapDurationMs: 1_100,
    actionsPerDish: 5,
    starEggs: Object.freeze([1, 3, 5]),
    commands: Object.freeze([
      step({ id: "plate-toast", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "放面包", prompt: "放面包！", helperText: "看准节奏点击", scene: "serve", dishStepIndex: 0, targetDelayMs: 660, tapDurationMs: 1_100, goodMs: 280 }),
      step({ id: "plate-bake", input: RHYTHM_COMMAND_TYPES.HOLD, actionName: "烤面包", prompt: "按住烘烤！", helperText: "到亮区松开", scene: "fry", dishStepIndex: 1, targetHoldMs: 720, goodMs: 280 }),
      step({ id: "plate-crack", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "敲蛋", prompt: "敲蛋！", helperText: "进命中区再点", scene: "crack", dishStepIndex: 2, targetDelayMs: 660, tapDurationMs: 1_100, goodMs: 280 }),
      step({ id: "plate-stir", input: RHYTHM_COMMAND_TYPES.MASH, actionName: "快速翻炒", prompt: "快速翻炒！", helperText: "打满进度", scene: "mash", dishStepIndex: 3, mashDurationMs: 2_000, targetTaps: 10 }),
      step({ id: "plate-serve", input: RHYTHM_COMMAND_TYPES.TAP, actionName: "装盘出餐", prompt: "装盘出餐！", helperText: "最后一下上桌", scene: "serve", dishStepIndex: 4, targetDelayMs: 660, tapDurationMs: 1_100, goodMs: 280 }),
    ]),
  }),
]);

export const RHYTHM_TEST_LEVEL = RHYTHM_DISH_LEVELS[0];
