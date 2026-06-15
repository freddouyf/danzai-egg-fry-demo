import {
  cloneRealtimeTemplate,
  REALTIME_ORDER_TEMPLATES,
  REALTIME_SERVICE_TARGET,
  REALTIME_WALKOUT_LIMIT,
  WRONG_INGREDIENT_PATIENCE_PENALTY_MS,
} from "./realtimeKitchenData.js";

function clampNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function cloneOrder(order) {
  return {
    ...order,
    steps: order.steps.map((step) => ({ ...step })),
  };
}

function buildOrder(template, sequence) {
  return {
    ...cloneRealtimeTemplate(template),
    instanceId: `${template.id}-${sequence}`,
    remainingPatienceMs: template.patienceMs,
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

export function getHoldFailureReason(action, heldMs) {
  const window = getHoldWindow(action);
  const elapsed = clampNumber(heldMs);
  if (elapsed < window.startMs) return "太早了";
  if (elapsed > window.endMs) return "太晚了";
  return "";
}

export function judgeMashAction(action, taps) {
  return clampNumber(taps) >= Math.max(1, Math.floor(clampNumber(action?.targetTaps, 1)));
}

export function judgeSwipeAction(action, distancePx) {
  return clampNumber(distancePx) >= Math.max(1, Math.floor(clampNumber(action?.minDistancePx, 70)));
}

export class RealtimeKitchenGame {
  constructor({
    templates = REALTIME_ORDER_TEMPLATES,
    serviceTarget = REALTIME_SERVICE_TARGET,
    walkoutLimit = REALTIME_WALKOUT_LIMIT,
  } = {}) {
    this.templates = templates;
    this.serviceTarget = serviceTarget;
    this.walkoutLimit = walkoutLimit;
    this.reset();
  }

  reset() {
    this.state = "playing";
    this.coins = 0;
    this.servedCustomers = 0;
    this.walkedOutCustomers = 0;
    this.failedActions = 0;
    this.orderSequence = 0;
    this.templateIndex = 0;
    this.currentOrder = null;
    this.currentStepIndex = 0;
    this.lastFeedback = "顾客来了，先看订单。";
    this.assignNextOrder();
  }

  assignNextOrder({ updateFeedback = true } = {}) {
    if (this.state !== "playing") return null;
    const template = this.templates[this.templateIndex % this.templates.length];
    this.templateIndex += 1;
    this.orderSequence += 1;
    this.currentOrder = buildOrder(template, this.orderSequence);
    this.currentStepIndex = 0;
    if (updateFeedback) this.lastFeedback = `新订单：${this.currentOrder.dishName}`;
    return this.currentOrder;
  }

  get currentStep() {
    return this.currentOrder?.steps?.[this.currentStepIndex] || null;
  }

  update(deltaMs) {
    if (this.state !== "playing") return this.getSnapshot();
    const delta = Math.max(0, clampNumber(deltaMs));
    if (!this.currentOrder) this.assignNextOrder();
    if (!this.currentOrder) return this.getSnapshot();
    this.currentOrder.remainingPatienceMs = Math.max(0, this.currentOrder.remainingPatienceMs - delta);
    if (this.currentOrder.remainingPatienceMs <= 0) {
      this.walkoutCurrentCustomer();
    }
    return this.getSnapshot();
  }

  dropIngredient(ingredientId, targetId) {
    if (this.state !== "playing" || !this.currentOrder) return null;
    const step = this.currentStep;
    if (step?.type !== "ingredient") return null;
    if (step.ingredientId === ingredientId && step.targetId === targetId) {
      this.lastFeedback = `放对了：${step.label}`;
      return this.advanceStep();
    }
    this.currentOrder.remainingPatienceMs = Math.max(
      0,
      this.currentOrder.remainingPatienceMs - WRONG_INGREDIENT_PATIENCE_PENALTY_MS,
    );
    this.lastFeedback = "不是这个食材！";
    if (this.currentOrder.remainingPatienceMs <= 0) this.walkoutCurrentCustomer();
    return this.getSnapshot();
  }

  advanceStep() {
    if (this.state !== "playing" || !this.currentOrder) return null;
    this.currentStepIndex += 1;
    if (this.currentStepIndex >= this.currentOrder.steps.length) {
      return this.completeCurrentOrder();
    }
    return this.getSnapshot();
  }

  failAction(reason) {
    if (this.state !== "playing" || !this.currentOrder) return null;
    this.failedActions += 1;
    this.lastFeedback = reason;
    return this.getSnapshot();
  }

  completeTap() {
    const step = this.currentStep;
    if (step?.type !== "action" || step.actionType !== "tap") return null;
    this.lastFeedback = `完成：${step.label}`;
    return this.advanceStep();
  }

  completeHold(heldMs) {
    const step = this.currentStep;
    if (step?.type !== "action" || step.actionType !== "hold") return null;
    if (!judgeHoldAction(step, heldMs)) return this.failAction(getHoldFailureReason(step, heldMs) || "控火失败");
    this.lastFeedback = `完成：${step.label}`;
    return this.advanceStep();
  }

  completeMash(taps) {
    const step = this.currentStep;
    if (step?.type !== "action" || step.actionType !== "mash") return null;
    if (!judgeMashAction(step, taps)) return this.failAction("没搅够");
    this.lastFeedback = `完成：${step.label}`;
    return this.advanceStep();
  }

  completeSwipe(distancePx) {
    const step = this.currentStep;
    if (step?.type !== "action" || step.actionType !== "swipe") return null;
    if (!judgeSwipeAction(step, distancePx)) return this.failAction("装盘失败");
    this.lastFeedback = `完成：${step.label}`;
    return this.advanceStep();
  }

  completeCurrentOrder() {
    if (this.state !== "playing" || !this.currentOrder) return null;
    const order = this.currentOrder;
    this.coins += order.rewardCoins;
    this.servedCustomers += 1;
    this.lastFeedback = "出餐成功！";
    if (this.servedCustomers >= this.serviceTarget) {
      return this.finish("passed");
    }
    this.assignNextOrder({ updateFeedback: false });
    return this.getSnapshot();
  }

  walkoutCurrentCustomer() {
    if (this.state !== "playing" || !this.currentOrder) return null;
    this.walkedOutCustomers += 1;
    this.lastFeedback = "顾客生气走了！";
    this.currentOrder = null;
    this.currentStepIndex = 0;
    if (this.walkedOutCustomers >= this.walkoutLimit) {
      return this.finish("failed");
    }
    this.assignNextOrder({ updateFeedback: false });
    return this.getSnapshot();
  }

  finish(reason) {
    this.state = "ended";
    this.currentOrder = null;
    this.currentStepIndex = 0;
    this.lastFeedback = reason === "passed" ? "通关成功！" : "今日营业失败";
    return this.getResult();
  }

  getRequiredIngredientIds() {
    if (!this.currentOrder) return [];
    return [...new Set(
      this.currentOrder.steps
        .filter((step) => step.type === "ingredient")
        .map((step) => step.ingredientId),
    )];
  }

  getResult() {
    const passed = this.servedCustomers >= this.serviceTarget;
    return {
      passed,
      coins: this.coins,
      servedCustomers: this.servedCustomers,
      walkedOutCustomers: this.walkedOutCustomers,
      failedActions: this.failedActions,
      comment: passed ? "旦仔稳住了后厨节奏！" : "客人跑太多了，后厨需要重整。",
    };
  }

  getSnapshot() {
    const order = this.currentOrder;
    return {
      state: this.state,
      coins: this.coins,
      servedCustomers: this.servedCustomers,
      walkedOutCustomers: this.walkedOutCustomers,
      failedActions: this.failedActions,
      serviceTarget: this.serviceTarget,
      walkoutLimit: this.walkoutLimit,
      currentOrder: order ? cloneOrder(order) : null,
      currentStepIndex: this.currentStepIndex,
      currentStep: this.currentStep ? { ...this.currentStep } : null,
      requiredIngredientIds: this.getRequiredIngredientIds(),
      lastFeedback: this.lastFeedback,
      result: this.state === "ended" ? this.getResult() : null,
    };
  }
}
