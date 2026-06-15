import {
  BUSINESS_COOKING_APPROACHES,
  BUSINESS_MAX_WAVES,
  BUSINESS_UPGRADES,
  getBusinessOrdersForWave,
  getBusinessUpgradeById,
} from "./businessData.js";

export const BUSINESS_CHAOS_PRESSURE_THRESHOLD = 5;
export const BUSINESS_CHAOS_END_THRESHOLD = 8;

function clampNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function hasTag(order, tag) {
  return Array.isArray(order?.tags) && order.tags.includes(tag);
}

function cloneOrder(order) {
  return { ...order, tags: [...order.tags], actions: [...order.actions] };
}

function createPendingModifiers() {
  return {
    coinMultiplier: 1,
    chaosDelta: 0,
    reasons: [],
  };
}

function normalizeRandom(random) {
  return typeof random === "function" ? random : Math.random;
}

export function drawBusinessUpgradeOptions(ownedIds = [], random = Math.random, count = 3) {
  const randomFn = normalizeRandom(random);
  const owned = new Set(ownedIds);
  const pool = BUSINESS_UPGRADES.filter((upgrade) => !owned.has(upgrade.id));
  const options = [];

  while (pool.length > 0 && options.length < count) {
    const raw = randomFn();
    const safe = Number.isFinite(raw) ? Math.min(0.999999, Math.max(0, raw)) : 0;
    const index = Math.floor(safe * pool.length);
    options.push(pool.splice(index, 1)[0]);
  }

  return options;
}

export function calculateBusinessOrderReward(state, order) {
  const upgrades = new Set(state?.upgrades || []);
  const reasons = [];
  let coins = clampNumber(order?.baseCoins);
  let satisfaction = clampNumber(order?.satisfactionReward);
  let chaosDelta = clampNumber(order?.chaosRisk);

  if (clampNumber(state?.chaos) >= BUSINESS_CHAOS_PRESSURE_THRESHOLD) {
    coins *= 0.9;
    reasons.push("后厨混乱");
  }

  if (upgrades.has("michelin-pan") && hasTag(order, "premium") && !state.wavePremiumUsed) {
    coins *= 1.5;
    reasons.push("米其林小锅");
  }

  if (upgrades.has("red-hot-wok") && hasTag(order, "spicy")) {
    coins *= 1.6;
    chaosDelta += 1;
    reasons.push("红温锅");
  }

  if (upgrades.has("smile-service") && clampNumber(state?.satisfaction) >= 3) {
    coins *= 1.1;
    reasons.push("笑脸服务");
  }

  if (upgrades.has("golden-bell") && clampNumber(order?.chaosRisk) >= 2) {
    coins *= 1.25;
    reasons.push("金色餐铃");
  }

  if (upgrades.has("assistant-danzai") && state.assistantBonusReady) {
    coins += 10;
    reasons.push("副手旦仔");
  }

  const nextEggOrders = clampNumber(state?.eggOrdersCompleted) + (hasTag(order, "egg") ? 1 : 0);
  if (upgrades.has("double-yolk-plan") && hasTag(order, "egg") && nextEggOrders > 0 && nextEggOrders % 2 === 0) {
    coins += 15;
    reasons.push("双黄蛋计划");
  }

  if (upgrades.has("breakfast-set") && hasTag(order, "breakfast") && state.lastTags?.includes("breakfast")) {
    satisfaction += 1;
    reasons.push("早餐套餐");
  }

  const pending = state?.pendingOrderModifiers || createPendingModifiers();
  if (pending.coinMultiplier !== 1) {
    coins *= Math.max(0.2, pending.coinMultiplier);
  }
  if (pending.chaosDelta) {
    chaosDelta += pending.chaosDelta;
  }
  if (Array.isArray(pending.reasons) && pending.reasons.length) {
    reasons.push(...pending.reasons);
  }

  return {
    coins: Math.max(0, Math.round(coins)),
    satisfaction: Math.max(0, Math.round(satisfaction)),
    chaosDelta: Math.round(chaosDelta),
    reasons,
  };
}

export class TodayBusinessGame {
  constructor({ maxWaves = BUSINESS_MAX_WAVES, random = Math.random } = {}) {
    this.maxWaves = maxWaves;
    this.random = normalizeRandom(random);
    this.reset();
  }

  reset() {
    this.state = "choosing-order";
    this.wave = 1;
    this.coins = 0;
    this.satisfaction = 0;
    this.chaos = 0;
    this.completedOrders = 0;
    this.failedActions = 0;
    this.currentActionIndex = 0;
    this.selectedOrder = null;
    this.upgrades = [];
    this.lastTags = [];
    this.eggOrdersCompleted = 0;
    this.wavePremiumUsed = false;
    this.assistantBonusReady = false;
    this.orders = getBusinessOrdersForWave(this.wave);
    this.upgradeOptions = [];
    this.pendingOrderModifiers = createPendingModifiers();
    this.lastReward = null;
    this.result = null;
    this.endReason = null;
  }

  chooseOrder(orderId) {
    if (this.state !== "choosing-order") return null;
    const order = this.orders.find((candidate) => candidate.id === orderId);
    if (!order) return null;
    this.selectedOrder = cloneOrder(order);
    this.currentActionIndex = 0;
    this.pendingOrderModifiers = createPendingModifiers();
    this.state = "cooking";
    return this.getSnapshot();
  }

  previewOrderReward(orderId) {
    const order = this.orders.find((candidate) => candidate.id === orderId);
    if (!order) return null;
    return calculateBusinessOrderReward(
      {
        upgrades: this.upgrades,
        wavePremiumUsed: this.wavePremiumUsed,
        assistantBonusReady: this.assistantBonusReady,
        eggOrdersCompleted: this.eggOrdersCompleted,
        lastTags: this.lastTags,
        satisfaction: this.satisfaction,
        chaos: this.chaos,
        pendingOrderModifiers: createPendingModifiers(),
      },
      order,
    );
  }

  applyApproach(approachId = "normal") {
    const approach = BUSINESS_COOKING_APPROACHES[approachId] || BUSINESS_COOKING_APPROACHES.normal;
    this.pendingOrderModifiers.coinMultiplier += approach.coinDelta;
    this.pendingOrderModifiers.chaosDelta += approach.chaosDelta;
    if (approach.id !== "normal") this.pendingOrderModifiers.reasons.push(approach.name);
    return approach;
  }

  completeAction({ success = true, approach = "normal" } = {}) {
    if (this.state !== "cooking" || !this.selectedOrder) return null;
    if (!success) {
      this.failedActions += 1;
      this.chaos = Math.max(0, this.chaos + 1);
      if (this.chaos >= BUSINESS_CHAOS_END_THRESHOLD) {
        this.finish("chaos");
        return this.getSnapshot();
      }
    } else {
      this.applyApproach(approach);
    }
    this.currentActionIndex += 1;
    if (this.currentActionIndex >= this.selectedOrder.actions.length) {
      return this.completeOrder();
    }
    return this.getSnapshot();
  }

  chooseCookingApproach(approachId) {
    return this.completeAction({ success: true, approach: approachId });
  }

  completeOrder() {
    if (!this.selectedOrder) return null;
    const reward = calculateBusinessOrderReward(this, this.selectedOrder);
    this.coins += reward.coins;
    this.satisfaction += reward.satisfaction;
    this.chaos = Math.max(0, this.chaos + reward.chaosDelta);
    this.completedOrders += 1;
    if (hasTag(this.selectedOrder, "egg")) this.eggOrdersCompleted += 1;
    if (hasTag(this.selectedOrder, "premium")) this.wavePremiumUsed = true;
    this.assistantBonusReady = this.upgrades.includes("assistant-danzai") && this.completedOrders % 2 === 0;
    this.lastTags = [...this.selectedOrder.tags];
    this.lastReward = {
      orderId: this.selectedOrder.id,
      dishName: this.selectedOrder.dishName,
      ...reward,
    };
    this.selectedOrder = null;
    this.currentActionIndex = 0;
    this.pendingOrderModifiers = createPendingModifiers();

    if (this.upgrades.includes("warmer-lamp") && this.chaos === 0) {
      this.satisfaction += 1;
      this.lastReward.reasons.push("保温灯");
    }

    if (this.chaos >= BUSINESS_CHAOS_END_THRESHOLD) {
      this.finish("chaos");
      return this.getSnapshot();
    }

    if (this.wave >= this.maxWaves) {
      this.finish();
      return this.getSnapshot();
    }

    this.state = "choosing-upgrade";
    this.upgradeOptions = drawBusinessUpgradeOptions(this.upgrades, this.random);
    return this.getSnapshot();
  }

  chooseUpgrade(upgradeId) {
    if (this.state !== "choosing-upgrade") return null;
    const upgrade = getBusinessUpgradeById(upgradeId);
    if (!upgrade) return null;
    if (!this.upgrades.includes(upgrade.id)) this.upgrades.push(upgrade.id);
    this.wave += 1;
    this.wavePremiumUsed = false;
    this.orders = getBusinessOrdersForWave(this.wave);
    this.upgradeOptions = [];
    this.state = "choosing-order";
    return this.getSnapshot();
  }

  finish(reason = "complete") {
    this.state = "ended";
    this.endReason = reason;
    this.result = {
      completedOrders: this.completedOrders,
      coins: this.coins,
      satisfaction: this.satisfaction,
      chaos: this.chaos,
      upgrades: this.upgrades.map((id) => getBusinessUpgradeById(id)).filter(Boolean),
      comment: this.getComment(),
      endReason: this.endReason,
    };
    return this.result;
  }

  getComment() {
    if (this.endReason === "chaos" || this.chaos >= BUSINESS_CHAOS_END_THRESHOLD) return "厨房爆单失控";
    if (this.satisfaction >= 5 && this.chaos <= 3) return "今日口碑爆棚！";
    if (this.coins >= 150) return "赚得很香，但厨房有点冒烟。";
    if (this.chaos >= 7) return "生意很猛，后厨需要整顿。";
    return "小店顺利打烊，明天还能再优化构筑。";
  }

  getSnapshot() {
    return {
      state: this.state,
      wave: this.wave,
      maxWaves: this.maxWaves,
      coins: this.coins,
      satisfaction: this.satisfaction,
      chaos: this.chaos,
      completedOrders: this.completedOrders,
      failedActions: this.failedActions,
      currentActionIndex: this.currentActionIndex,
      selectedOrder: this.selectedOrder,
      currentAction: this.selectedOrder?.actions?.[this.currentActionIndex] || null,
      orders: this.orders.map(cloneOrder),
      upgrades: this.upgrades.map((id) => getBusinessUpgradeById(id)).filter(Boolean),
      upgradeOptions: this.upgradeOptions,
      pendingOrderModifiers: { ...this.pendingOrderModifiers, reasons: [...this.pendingOrderModifiers.reasons] },
      lastReward: this.lastReward,
      result: this.result,
      assistantBonusReady: this.assistantBonusReady,
      endReason: this.endReason,
    };
  }
}
