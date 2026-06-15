export const BUSINESS_MAX_WAVES = 3;

export const BUSINESS_ACTION_LABELS = Object.freeze({
  tap: "TAP",
  hold: "HOLD",
  mash: "MASH",
  swipe: "SWIPE",
});

export const BUSINESS_COOKING_APPROACHES = Object.freeze({
  steady: Object.freeze({
    id: "steady",
    name: "稳稳做",
    short: "金币 -10% · 混乱 -1",
    coinDelta: -0.1,
    chaosDelta: -1,
  }),
  normal: Object.freeze({
    id: "normal",
    name: "正常做",
    short: "正常收益",
    coinDelta: 0,
    chaosDelta: 0,
  }),
  quick: Object.freeze({
    id: "quick",
    name: "快手做",
    short: "金币 +20% · 混乱 +1",
    coinDelta: 0.2,
    chaosDelta: 1,
  }),
});

export const BUSINESS_ORDERS_BY_WAVE = Object.freeze([
  Object.freeze([
    Object.freeze({
      id: "student-egg-toast",
      customerName: "赶课学生",
      dishName: "元气煎蛋吐司",
      tags: ["egg", "fast", "breakfast"],
      baseCoins: 28,
      satisfactionReward: 1,
      chaosRisk: 0,
      actions: ["tap", "mash", "hold"],
    }),
    Object.freeze({
      id: "office-premium-roll",
      customerName: "早八白领",
      dishName: "黄金蛋卷套餐",
      tags: ["egg", "premium", "breakfast"],
      baseCoins: 42,
      satisfactionReward: 1,
      chaosRisk: 1,
      actions: ["tap", "hold", "swipe"],
    }),
    Object.freeze({
      id: "spicy-hurry-egg",
      customerName: "暴躁食客",
      dishName: "辣味爆炒蛋",
      tags: ["egg", "spicy", "fast"],
      baseCoins: 48,
      satisfactionReward: 0,
      chaosRisk: 2,
      actions: ["mash", "mash", "swipe"],
    }),
  ]),
  Object.freeze([
    Object.freeze({
      id: "family-breakfast-plate",
      customerName: "亲子客人",
      dishName: "早餐拼盘",
      tags: ["breakfast", "premium"],
      baseCoins: 52,
      satisfactionReward: 2,
      chaosRisk: 1,
      actions: ["tap", "hold", "mash", "swipe"],
    }),
    Object.freeze({
      id: "night-spicy-noodle",
      customerName: "夜班司机",
      dishName: "红温拌蛋面",
      tags: ["spicy", "fast"],
      baseCoins: 55,
      satisfactionReward: 0,
      chaosRisk: 2,
      actions: ["mash", "hold", "mash"],
    }),
    Object.freeze({
      id: "vip-golden-omelette",
      customerName: "挑剔贵宾",
      dishName: "金箔蛋卷",
      tags: ["egg", "premium"],
      baseCoins: 68,
      satisfactionReward: 1,
      chaosRisk: 2,
      actions: ["tap", "hold", "hold", "swipe"],
    }),
  ]),
  Object.freeze([
    Object.freeze({
      id: "tourist-breakfast-set",
      customerName: "拍照游客",
      dishName: "旦仔招牌早餐",
      tags: ["egg", "breakfast", "premium"],
      baseCoins: 78,
      satisfactionReward: 2,
      chaosRisk: 2,
      actions: ["tap", "mash", "hold", "swipe"],
    }),
    Object.freeze({
      id: "rush-hour-spicy-set",
      customerName: "排队急客",
      dishName: "辣味快手套餐",
      tags: ["spicy", "fast", "breakfast"],
      baseCoins: 72,
      satisfactionReward: 1,
      chaosRisk: 3,
      actions: ["mash", "tap", "mash", "swipe"],
    }),
    Object.freeze({
      id: "critic-premium-egg",
      customerName: "美食评论员",
      dishName: "完美精品煎蛋",
      tags: ["egg", "premium"],
      baseCoins: 92,
      satisfactionReward: 2,
      chaosRisk: 3,
      actions: ["tap", "hold", "mash", "hold", "swipe"],
    }),
  ]),
]);

export const BUSINESS_UPGRADES = Object.freeze([
  Object.freeze({
    id: "double-yolk-plan",
    icon: "🥚",
    name: "双黄蛋计划",
    route: "煎蛋引擎",
    short: "每 2 道 egg 订单 +15 金币",
  }),
  Object.freeze({
    id: "michelin-pan",
    icon: "🍳",
    name: "米其林小锅",
    route: "高价精品",
    short: "每波第一个 premium 订单金币 +50%",
  }),
  Object.freeze({
    id: "breakfast-set",
    icon: "🥪",
    name: "早餐套餐",
    route: "套餐组合",
    short: "连续 breakfast 订单满意度 +1",
  }),
  Object.freeze({
    id: "red-hot-wok",
    icon: "🔥",
    name: "红温锅",
    route: "风险爆炒",
    short: "spicy 金币 +60%，混乱额外 +1",
  }),
  Object.freeze({
    id: "assistant-danzai",
    icon: "🤝",
    name: "副手旦仔",
    route: "自动厨房",
    short: "每完成 2 单，下一单 +10 金币",
  }),
  Object.freeze({
    id: "warmer-lamp",
    icon: "💡",
    name: "保温灯",
    route: "稳定经营",
    short: "波次结束时混乱为 0，满意度 +1",
  }),
  Object.freeze({
    id: "smile-service",
    icon: "😊",
    name: "旦仔笑脸服务",
    route: "顾客经营",
    short: "满意度达到 3 后，订单金币 +10%",
  }),
  Object.freeze({
    id: "golden-bell",
    icon: "🔔",
    name: "金色餐铃",
    route: "贪婪金币",
    short: "选择高风险订单时金币 +25%",
  }),
]);

export function getBusinessOrdersForWave(wave = 1) {
  const index = Math.min(
    BUSINESS_ORDERS_BY_WAVE.length - 1,
    Math.max(0, Math.floor(Number(wave) || 1) - 1),
  );
  return BUSINESS_ORDERS_BY_WAVE[index].map((order) => ({ ...order, tags: [...order.tags], actions: [...order.actions] }));
}

export function getBusinessUpgradeById(id) {
  return BUSINESS_UPGRADES.find((upgrade) => upgrade.id === id) || null;
}
