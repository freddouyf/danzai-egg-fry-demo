import {
  cloneRealtimeTemplate,
  REALTIME_MAX_CHAOS,
  REALTIME_ORDER_TEMPLATES,
  REALTIME_RUN_DURATION_MS,
  REALTIME_VISIBLE_ORDERS,
} from "./realtimeKitchenData.js";

function clampNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function cloneOrder(order) {
  return {
    ...order,
    actions: order.actions.map((action) => ({ ...action })),
  };
}

function buildOrder(template, sequence) {
  return {
    ...cloneRealtimeTemplate(template),
    instanceId: `${template.id}-${sequence}`,
    remainingPatienceMs: template.patienceMs,
    status: "waiting",
  };
}

export function getHoldWindow(action = {}) {
  const targetMs = Math.max(1, Math.floor(clampNumber(action.targetMs, 900)));
  const windowMs = Math.max(1, Math.floor(clampNumber(action.windowMs, 250)));
  const maxMs = Math.max(targetMs + windowMs + 1, Math.floor(clampNumber(action.maxMs, targetMs + windowMs + 500)));
  return {
    startMs: Math.max(0, targetMs - windowMs),
    endMs: Math.min(maxMs, targetMs + windowMs),
    maxMs,
  };
}

export function judgeHoldAction(action, heldMs) {
  const window = getHoldWindow(action);
  const elapsed = clampNumber(heldMs);
  return elapsed >= window.startMs && elapsed <= window.endMs;
}

export function judgeMashAction(action, taps) {
  return clampNumber(taps) >= Math.max(1, Math.floor(clampNumber(action?.targetTaps, 1)));
}

export function judgeSwipeAction(action, distancePx) {
  return clampNumber(distancePx) >= Math.max(1, Math.floor(clampNumber(action?.minDistancePx, 70)));
}

export class RealtimeKitchenGame {
  constructor({
    durationMs = REALTIME_RUN_DURATION_MS,
    templates = REALTIME_ORDER_TEMPLATES,
    visibleOrders = REALTIME_VISIBLE_ORDERS,
  } = {}) {
    this.durationMs = durationMs;
    this.templates = templates;
    this.visibleOrders = visibleOrders;
    this.reset();
  }

  reset() {
    this.state = "playing";
    this.remainingMs = this.durationMs;
    this.coins = 0;
    this.chaos = 0;
    this.completedOrders = 0;
    this.failedOrders = 0;
    this.failedActions = 0;
    this.orderSequence = 0;
    this.templateIndex = 0;
    this.orders = [];
    this.activeOrderId = null;
    this.activeActionIndex = 0;
    this.lastFeedback = "";
    while (this.orders.length < this.visibleOrders) this.spawnOrder();
  }

  spawnOrder() {
    const template = this.templates[this.templateIndex % this.templates.length];
    this.templateIndex += 1;
    this.orderSequence += 1;
    const order = buildOrder(template, this.orderSequence);
    this.orders.push(order);
    return order;
  }

  fillOrders() {
    while (this.state === "playing" && this.orders.length < this.visibleOrders) this.spawnOrder();
  }

  selectOrder(instanceId) {
    if (this.state !== "playing") return null;
    const order = this.orders.find((candidate) => candidate.instanceId === instanceId);
    if (!order) return null;
    this.activeOrderId = order.instanceId;
    this.activeActionIndex = 0;
    this.lastFeedback = `开始制作：${order.dishName}`;
    return this.getSnapshot();
  }

  get activeOrder() {
    return this.orders.find((order) => order.instanceId === this.activeOrderId) || null;
  }

  get activeAction() {
    return this.activeOrder?.actions?.[this.activeActionIndex] || null;
  }

  update(deltaMs) {
    if (this.state !== "playing") return this.getSnapshot();
    const delta = Math.max(0, clampNumber(deltaMs));
    this.remainingMs = Math.max(0, this.remainingMs - delta);
    this.orders.forEach((order) => {
      order.remainingPatienceMs = Math.max(0, order.remainingPatienceMs - delta);
    });

    const timedOut = this.orders.filter((order) => order.remainingPatienceMs <= 0);
    timedOut.forEach((order) => this.failOrder(order.instanceId, "顾客等不及了"));
    if (this.remainingMs <= 0) this.finish("time");
    if (this.chaos >= REALTIME_MAX_CHAOS) this.finish("chaos");
    this.fillOrders();
    return this.getSnapshot();
  }

  failOrder(instanceId, reason = "订单失败") {
    const index = this.orders.findIndex((order) => order.instanceId === instanceId);
    if (index < 0) return null;
    const [order] = this.orders.splice(index, 1);
    if (this.activeOrderId === order.instanceId) {
      this.activeOrderId = null;
      this.activeActionIndex = 0;
    }
    this.failedOrders += 1;
    this.chaos += 2;
    this.lastFeedback = `${reason}：${order.dishName}`;
    if (this.chaos >= REALTIME_MAX_CHAOS) this.finish("chaos");
    this.fillOrders();
    return this.getSnapshot();
  }

  completeActiveAction() {
    const order = this.activeOrder;
    if (!order || this.state !== "playing") return null;
    this.activeActionIndex += 1;
    if (this.activeActionIndex >= order.actions.length) {
      return this.completeOrder(order.instanceId);
    }
    this.lastFeedback = `完成动作：${order.actions[this.activeActionIndex - 1].label}`;
    return this.getSnapshot();
  }

  failActiveAction(reason = "动作失败") {
    if (!this.activeOrder || this.state !== "playing") return null;
    this.failedActions += 1;
    this.chaos += 1;
    this.lastFeedback = reason;
    if (this.chaos >= REALTIME_MAX_CHAOS) this.finish("chaos");
    return this.getSnapshot();
  }

  completeTap() {
    if (this.activeAction?.type !== "tap") return null;
    return this.completeActiveAction();
  }

  completeHold(heldMs) {
    if (this.activeAction?.type !== "hold") return null;
    if (!judgeHoldAction(this.activeAction, heldMs)) return this.failActiveAction("控火失败");
    return this.completeActiveAction();
  }

  completeMash(taps) {
    if (this.activeAction?.type !== "mash") return null;
    if (!judgeMashAction(this.activeAction, taps)) return this.failActiveAction("连点不够");
    return this.completeActiveAction();
  }

  completeSwipe(distancePx) {
    if (this.activeAction?.type !== "swipe") return null;
    if (!judgeSwipeAction(this.activeAction, distancePx)) return this.failActiveAction("滑动太短");
    return this.completeActiveAction();
  }

  completeOrder(instanceId) {
    const index = this.orders.findIndex((order) => order.instanceId === instanceId);
    if (index < 0) return null;
    const [order] = this.orders.splice(index, 1);
    this.coins += order.rewardCoins;
    this.completedOrders += 1;
    this.activeOrderId = null;
    this.activeActionIndex = 0;
    this.lastFeedback = `出餐成功：+${order.rewardCoins} 金币`;
    this.fillOrders();
    return this.getSnapshot();
  }

  finish(reason = "time") {
    this.state = "ended";
    this.activeOrderId = null;
    this.activeActionIndex = 0;
    this.lastFeedback = reason === "chaos" ? "后厨失控，提前打烊" : "营业结束";
    return this.getResult();
  }

  getResult() {
    return {
      coins: this.coins,
      chaos: this.chaos,
      completedOrders: this.completedOrders,
      failedOrders: this.failedOrders,
      failedActions: this.failedActions,
      comment: this.chaos >= REALTIME_MAX_CHAOS ? "后厨已经乱成一团" : "今日厨房顺利收工",
    };
  }

  getSnapshot() {
    const activeOrder = this.activeOrder;
    return {
      state: this.state,
      remainingMs: this.remainingMs,
      coins: this.coins,
      chaos: this.chaos,
      completedOrders: this.completedOrders,
      failedOrders: this.failedOrders,
      failedActions: this.failedActions,
      orders: this.orders.map(cloneOrder),
      activeOrder: activeOrder ? cloneOrder(activeOrder) : null,
      activeActionIndex: this.activeActionIndex,
      activeAction: this.activeAction ? { ...this.activeAction } : null,
      lastFeedback: this.lastFeedback,
      result: this.state === "ended" ? this.getResult() : null,
    };
  }
}
