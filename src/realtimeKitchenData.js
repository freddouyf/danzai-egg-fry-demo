export const REALTIME_LEVEL_ID = "realtime-kitchen-1";
export const REALTIME_LEVEL_NAME = "第 1 关";
export const REALTIME_SERVICE_TARGET = 3;
export const REALTIME_WALKOUT_LIMIT = 2;
export const WRONG_INGREDIENT_PATIENCE_PENALTY_MS = 1000;

export const REALTIME_ACTION_TYPES = Object.freeze({
  TAP: "tap",
  HOLD: "hold",
  MASH: "mash",
  SWIPE: "swipe",
});

export const REALTIME_STEP_TYPES = Object.freeze({
  INGREDIENT: "ingredient",
  ACTION: "action",
});

export const REALTIME_ACTION_LABELS = Object.freeze({
  tap: "TAP",
  hold: "HOLD",
  mash: "MASH",
  swipe: "SWIPE",
});

export const REALTIME_TARGETS = Object.freeze([
  Object.freeze({ id: "pan", label: "锅", icon: "🍳" }),
  Object.freeze({ id: "board", label: "案板", icon: "🔪" }),
  Object.freeze({ id: "plate", label: "盘子", icon: "🍽️" }),
]);

export const REALTIME_INGREDIENTS = Object.freeze([
  Object.freeze({ id: "egg", label: "鸡蛋", icon: "🥚" }),
  Object.freeze({ id: "bread", label: "面包", icon: "🍞" }),
  Object.freeze({ id: "chili", label: "辣椒", icon: "🌶️" }),
  Object.freeze({ id: "scallion", label: "葱花", icon: "🟢" }),
]);

export const REALTIME_ORDER_TEMPLATES = Object.freeze([
  Object.freeze({
    id: "quick-fried-egg",
    customerName: "赶早学生",
    dishName: "快手煎蛋",
    rewardCoins: 18,
    patienceMs: 18000,
    steps: Object.freeze([
      Object.freeze({ type: "ingredient", ingredientId: "egg", targetId: "pan", label: "鸡蛋入锅" }),
      Object.freeze({ type: "action", actionType: "tap", label: "敲蛋" }),
      Object.freeze({ type: "action", actionType: "hold", label: "煎熟", targetMs: 900, windowMs: 260, maxMs: 1500 }),
      Object.freeze({ type: "action", actionType: "swipe", label: "装盘", minDistancePx: 90 }),
    ]),
  }),
  Object.freeze({
    id: "thick-egg-toast",
    customerName: "通勤大叔",
    dishName: "厚蛋吐司",
    rewardCoins: 26,
    patienceMs: 22000,
    steps: Object.freeze([
      Object.freeze({ type: "ingredient", ingredientId: "egg", targetId: "pan", label: "鸡蛋入锅" }),
      Object.freeze({ type: "action", actionType: "hold", label: "煎蛋", targetMs: 1000, windowMs: 280, maxMs: 1700 }),
      Object.freeze({ type: "ingredient", ingredientId: "bread", targetId: "plate", label: "面包上盘" }),
      Object.freeze({ type: "action", actionType: "swipe", label: "装盘", minDistancePx: 90 }),
    ]),
  }),
  Object.freeze({
    id: "spicy-stir-egg",
    customerName: "爆辣食客",
    dishName: "辣味爆炒蛋",
    rewardCoins: 30,
    patienceMs: 21000,
    steps: Object.freeze([
      Object.freeze({ type: "ingredient", ingredientId: "egg", targetId: "pan", label: "鸡蛋入锅" }),
      Object.freeze({ type: "ingredient", ingredientId: "chili", targetId: "pan", label: "辣椒入锅" }),
      Object.freeze({ type: "action", actionType: "mash", label: "爆炒", targetTaps: 8, durationMs: 1900 }),
      Object.freeze({ type: "action", actionType: "swipe", label: "装盘", minDistancePx: 90 }),
    ]),
  }),
]);

export function cloneRealtimeTemplate(template) {
  return {
    ...template,
    steps: template.steps.map((step) => ({ ...step })),
  };
}
