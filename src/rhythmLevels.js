export const RHYTHM_COMMAND_TYPES = Object.freeze({
  TAP: "tap",
  HOLD: "hold",
  MASH: "mash",
});

export const RHYTHM_TEST_LEVEL = Object.freeze({
  id: "rhythm-kitchen-01",
  title: "节奏厨房实验关",
  durationMs: 30_000,
  commands: Object.freeze([
    { id: "tap-1", type: RHYTHM_COMMAND_TYPES.TAP, startAtMs: 900, targetAtMs: 1_500, expireAtMs: 2_100, label: "撒盐" },
    { id: "tap-2", type: RHYTHM_COMMAND_TYPES.TAP, startAtMs: 2_450, targetAtMs: 3_050, expireAtMs: 3_650, label: "点火" },
    { id: "hold-1", type: RHYTHM_COMMAND_TYPES.HOLD, startAtMs: 4_000, targetAtMs: 5_050, expireAtMs: 5_750, label: "压锅铲" },
    { id: "mash-1", type: RHYTHM_COMMAND_TYPES.MASH, startAtMs: 6_200, endAtMs: 8_000, targetTaps: 8, label: "爆炒" },
    { id: "tap-3", type: RHYTHM_COMMAND_TYPES.TAP, startAtMs: 8_600, targetAtMs: 9_200, expireAtMs: 9_800, label: "翻香气" },
    { id: "hold-2", type: RHYTHM_COMMAND_TYPES.HOLD, startAtMs: 10_250, targetAtMs: 11_300, expireAtMs: 12_000, label: "稳火" },
    { id: "tap-4", type: RHYTHM_COMMAND_TYPES.TAP, startAtMs: 12_450, targetAtMs: 13_000, expireAtMs: 13_600, label: "收汁" },
    { id: "mash-2", type: RHYTHM_COMMAND_TYPES.MASH, startAtMs: 14_100, endAtMs: 15_950, targetTaps: 9, label: "快炒" },
    { id: "tap-5", type: RHYTHM_COMMAND_TYPES.TAP, startAtMs: 16_500, targetAtMs: 17_050, expireAtMs: 17_650, label: "撒葱" },
    { id: "tap-6", type: RHYTHM_COMMAND_TYPES.TAP, startAtMs: 18_000, targetAtMs: 18_520, expireAtMs: 19_100, label: "抖锅" },
    { id: "hold-3", type: RHYTHM_COMMAND_TYPES.HOLD, startAtMs: 19_550, targetAtMs: 20_650, expireAtMs: 21_350, label: "压香" },
    { id: "mash-3", type: RHYTHM_COMMAND_TYPES.MASH, startAtMs: 21_850, endAtMs: 23_800, targetTaps: 10, label: "终极爆炒" },
    { id: "tap-7", type: RHYTHM_COMMAND_TYPES.TAP, startAtMs: 24_350, targetAtMs: 24_880, expireAtMs: 25_500, label: "装盘" },
    { id: "hold-4", type: RHYTHM_COMMAND_TYPES.HOLD, startAtMs: 25_950, targetAtMs: 27_000, expireAtMs: 27_700, label: "定型" },
    { id: "tap-8", type: RHYTHM_COMMAND_TYPES.TAP, startAtMs: 28_250, targetAtMs: 28_750, expireAtMs: 29_350, label: "上菜" },
  ]),
});
