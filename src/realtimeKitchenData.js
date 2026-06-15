export const REALTIME_RUN_DURATION_MS = 60000;
export const REALTIME_MAX_CHAOS = 10;
export const REALTIME_VISIBLE_ORDERS = 2;

export const REALTIME_ACTION_TYPES = Object.freeze({
  TAP: "tap",
  HOLD: "hold",
  MASH: "mash",
  SWIPE: "swipe",
});

export const REALTIME_ACTION_LABELS = Object.freeze({
  tap: "TAP",
  hold: "HOLD",
  mash: "MASH",
  swipe: "SWIPE",
});

export const REALTIME_ORDER_TEMPLATES = Object.freeze([
  Object.freeze({
    id: "quick-fried-egg",
    customerName: "赶早学生",
    dishName: "快手煎蛋",
    rewardCoins: 18,
    patienceMs: 16000,
    actions: Object.freeze([
      Object.freeze({ type: "tap", label: "敲蛋" }),
      Object.freeze({ type: "hold", label: "煎熟", targetMs: 900, windowMs: 260, maxMs: 1500 }),
    ]),
  }),
  Object.freeze({
    id: "golden-omelette",
    customerName: "白领姐姐",
    dishName: "黄金蛋卷",
    rewardCoins: 28,
    patienceMs: 22000,
    actions: Object.freeze([
      Object.freeze({ type: "tap", label: "倒蛋液" }),
      Object.freeze({ type: "mash", label: "搅拌", targetTaps: 6, durationMs: 1800 }),
      Object.freeze({ type: "swipe", label: "卷起", minDistancePx: 80 }),
    ]),
  }),
  Object.freeze({
    id: "spicy-stir-egg",
    customerName: "爆辣食客",
    dishName: "辣味爆炒蛋",
    rewardCoins: 34,
    patienceMs: 19000,
    actions: Object.freeze([
      Object.freeze({ type: "mash", label: "爆炒", targetTaps: 8, durationMs: 1900 }),
      Object.freeze({ type: "swipe", label: "颠锅", minDistancePx: 90 }),
    ]),
  }),
  Object.freeze({
    id: "breakfast-plate",
    customerName: "拍照游客",
    dishName: "早餐拼盘",
    rewardCoins: 42,
    patienceMs: 26000,
    actions: Object.freeze([
      Object.freeze({ type: "tap", label: "放面包" }),
      Object.freeze({ type: "hold", label: "烘烤", targetMs: 1100, windowMs: 300, maxMs: 1800 }),
      Object.freeze({ type: "mash", label: "摆盘", targetTaps: 7, durationMs: 1900 }),
      Object.freeze({ type: "swipe", label: "出餐", minDistancePx: 90 }),
    ]),
  }),
  Object.freeze({
    id: "thick-egg-toast",
    customerName: "通勤大叔",
    dishName: "厚蛋吐司",
    rewardCoins: 36,
    patienceMs: 24000,
    actions: Object.freeze([
      Object.freeze({ type: "tap", label: "切吐司" }),
      Object.freeze({ type: "hold", label: "煎厚蛋", targetMs: 1000, windowMs: 280, maxMs: 1700 }),
      Object.freeze({ type: "tap", label: "夹起来" }),
    ]),
  }),
]);

export function cloneRealtimeTemplate(template) {
  return {
    ...template,
    actions: template.actions.map((action) => ({ ...action })),
  };
}
