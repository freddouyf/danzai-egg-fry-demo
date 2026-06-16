export const REALTIME_LEVEL_ID = "realtime-kitchen-1";
export const REALTIME_LEVEL_NAME = "\u7b2c 1 \u5173";
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
  Object.freeze({ id: "pan", label: "\u9505", icon: "\u{1F373}" }),
  Object.freeze({ id: "board", label: "\u6848\u677f", icon: "\u{1F52A}" }),
  Object.freeze({ id: "plate", label: "\u76d8\u5b50", icon: "\u{1F37D}\uFE0F" }),
]);

export const REALTIME_INGREDIENTS = Object.freeze([
  Object.freeze({ id: "egg", label: "\u9e21\u86cb", icon: "\u{1F95A}" }),
  Object.freeze({ id: "bread", label: "\u9762\u5305", icon: "\u{1F35E}" }),
  Object.freeze({ id: "chili", label: "\u8fa3\u6912", icon: "\u{1F336}\uFE0F" }),
  Object.freeze({ id: "scallion", label: "\u8471\u82b1", icon: "\u{1F7E2}" }),
]);

export const REALTIME_ORDER_TEMPLATES = Object.freeze([
  Object.freeze({
    id: "quick-fried-egg",
    customerName: "\u8d76\u65e9\u5b66\u751f",
    dishName: "\u5feb\u624b\u714e\u86cb",
    rewardCoins: 18,
    patienceMs: 18000,
    steps: Object.freeze([
      Object.freeze({ type: "ingredient", ingredientId: "egg", targetId: "pan", label: "\u9e21\u86cb\u5165\u9505" }),
      Object.freeze({ type: "action", actionType: "tap", label: "\u6572\u86cb" }),
      Object.freeze({ type: "action", actionType: "hold", label: "\u714e\u719f", targetMs: 900, windowMs: 260, maxMs: 1500 }),
      Object.freeze({ type: "action", actionType: "swipe", label: "\u88c5\u76d8", minDistancePx: 90 }),
    ]),
  }),
  Object.freeze({
    id: "thick-egg-toast",
    customerName: "\u901a\u52e4\u5927\u53d4",
    dishName: "\u539a\u86cb\u5410\u53f8",
    rewardCoins: 26,
    patienceMs: 22000,
    steps: Object.freeze([
      Object.freeze({ type: "ingredient", ingredientId: "egg", targetId: "pan", label: "\u9e21\u86cb\u5165\u9505" }),
      Object.freeze({ type: "action", actionType: "hold", label: "\u714e\u86cb", targetMs: 1000, windowMs: 280, maxMs: 1700 }),
      Object.freeze({ type: "ingredient", ingredientId: "bread", targetId: "plate", label: "\u9762\u5305\u4e0a\u76d8" }),
      Object.freeze({ type: "action", actionType: "swipe", label: "\u88c5\u76d8", minDistancePx: 90 }),
    ]),
  }),
  Object.freeze({
    id: "spicy-stir-egg",
    customerName: "\u7206\u8fa3\u98df\u5ba2",
    dishName: "\u8fa3\u5473\u7206\u7092\u86cb",
    rewardCoins: 30,
    patienceMs: 21000,
    steps: Object.freeze([
      Object.freeze({ type: "ingredient", ingredientId: "egg", targetId: "pan", label: "\u9e21\u86cb\u5165\u9505" }),
      Object.freeze({ type: "ingredient", ingredientId: "chili", targetId: "pan", label: "\u8fa3\u6912\u5165\u9505" }),
      Object.freeze({ type: "action", actionType: "mash", label: "\u7206\u7092", targetTaps: 8, durationMs: 1900 }),
      Object.freeze({ type: "action", actionType: "swipe", label: "\u88c5\u76d8", minDistancePx: 90 }),
    ]),
  }),
]);

export function cloneRealtimeTemplate(template) {
  return {
    ...template,
    steps: template.steps.map((step) => ({ ...step })),
  };
}
