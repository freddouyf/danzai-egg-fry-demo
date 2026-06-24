import {
  cloneRealtimeTemplate,
  getRealtimeRecipeFlow,
  getRealtimeRecipeSteps,
  REALTIME_DEFAULT_LEVEL,
  REALTIME_LEVELS,
  REALTIME_ORDER_TEMPLATES,
  REALTIME_SERVICE_TARGET,
  REALTIME_WALKOUT_LIMIT,
  WRONG_INGREDIENT_PATIENCE_PENALTY_MS,
} from "./realtimeKitchenData.js";

function clampNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clonePlacedTargets(placedTargets = {}) {
  return Object.fromEntries(
    Object.entries(placedTargets).map(([targetId, ingredientIds]) => [targetId, [...ingredientIds]]),
  );
}

function cloneOrder(order) {
  return {
    ...order,
    placedTargets: clonePlacedTargets(order.placedTargets),
    steps: order.steps.map((step) => ({ ...step })),
  };
}

function buildOrder(template, sequence) {
  return {
    ...cloneRealtimeTemplate(template),
    instanceId: `${template.id}-${sequence}`,
    remainingPatienceMs: template.patienceMs,
    placedTargets: {},
  };
}

function getLevelTemplates(level) {
  const orderIds = Array.isArray(level?.availableOrders) ? level.availableOrders : [];
  const filtered = orderIds.length > 0
    ? REALTIME_ORDER_TEMPLATES.filter((template) => orderIds.includes(template.id))
    : [];
  return filtered.length > 0 ? filtered : REALTIME_ORDER_TEMPLATES;
}

function clampLevelIndex(levels, levelIndex) {
  const max = Math.max(0, levels.length - 1);
  return Math.max(0, Math.min(max, Math.floor(clampNumber(levelIndex))));
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
  if (elapsed < window.startMs) return "\u592a\u65e9\u4e86";
  if (elapsed > window.endMs) return "\u592a\u665a\u4e86";
  return "";
}

export function judgeMashAction(action, taps) {
  return clampNumber(taps) >= Math.max(1, Math.floor(clampNumber(action?.targetTaps, 1)));
}

export function getSwipeProgress(distancePx, requiredDistancePx = 70) {
  const required = Math.max(1, clampNumber(requiredDistancePx, 70));
  const distance = Math.max(0, clampNumber(distancePx));
  const ratio = Math.max(0, Math.min(1, distance / required));
  return {
    distancePx: distance,
    requiredDistancePx: required,
    percent: ratio * 100,
    ratio,
    ready: distance >= required,
  };
}

export function judgeSwipeAction(action, distancePx) {
  return getSwipeProgress(distancePx, action?.minDistancePx).ready;
}

export class RealtimeKitchenGame {
  constructor({
    levels = REALTIME_LEVELS,
    levelIndex = 0,
    templates = null,
    serviceTarget = null,
    walkoutLimit = null,
  } = {}) {
    this.levels = Array.isArray(levels) && levels.length > 0 ? levels : REALTIME_LEVELS;
    this.customTemplates = templates;
    this.customServiceTarget = serviceTarget;
    this.customWalkoutLimit = walkoutLimit;
    this.currentLevelIndex = clampLevelIndex(this.levels, levelIndex);
    this.reset({ levelIndex: this.currentLevelIndex });
  }

  configureLevel(levelIndex = this.currentLevelIndex) {
    this.currentLevelIndex = clampLevelIndex(this.levels, levelIndex);
    this.level = this.levels[this.currentLevelIndex] || REALTIME_DEFAULT_LEVEL;
    this.templates = this.customTemplates || getLevelTemplates(this.level);
    this.serviceTarget = this.customServiceTarget ?? this.level.serviceTarget ?? REALTIME_SERVICE_TARGET;
    this.walkoutLimit = this.customWalkoutLimit ?? this.level.walkoutLimit ?? REALTIME_WALKOUT_LIMIT;
  }

  reset({ levelIndex = this.currentLevelIndex } = {}) {
    this.configureLevel(levelIndex);
    this.state = "teaching";
    this.coins = 0;
    this.servedCustomers = 0;
    this.walkedOutCustomers = 0;
    this.failedActions = 0;
    this.orderSequence = 0;
    this.templateIndex = 0;
    this.currentOrder = null;
    this.currentStepIndex = 0;
    this.lastFeedback = "\u5148\u770b\u83dc\u8c31\uff0c\u518d\u5f00\u59cb\u8425\u4e1a\u3002";
  }

  hasNextLevel() {
    return this.currentLevelIndex < this.levels.length - 1;
  }

  startNextLevel() {
    if (!this.hasNextLevel()) return this.getSnapshot();
    this.reset({ levelIndex: this.currentLevelIndex + 1 });
    return this.getSnapshot();
  }

  startBusiness() {
    if (this.state !== "teaching") return this.getSnapshot();
    this.state = "playing";
    this.lastFeedback = "\u987e\u5ba2\u6765\u4e86\uff0c\u5148\u770b\u8ba2\u5355\u3002";
    this.assignNextOrder();
    return this.getSnapshot();
  }

  assignNextOrder({ updateFeedback = true } = {}) {
    if (this.state !== "playing") return null;
    const template = this.templates[this.templateIndex % this.templates.length];
    this.templateIndex += 1;
    this.orderSequence += 1;
    this.currentOrder = buildOrder(template, this.orderSequence);
    this.currentStepIndex = 0;
    if (updateFeedback) this.lastFeedback = `\u65b0\u8ba2\u5355\uff1a${this.currentOrder.dishName}`;
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
      if (!this.currentOrder.placedTargets[targetId]) this.currentOrder.placedTargets[targetId] = [];
      this.currentOrder.placedTargets[targetId].push(ingredientId);
      this.lastFeedback = `\u653e\u5bf9\u4e86\uff1a${step.label}`;
      return this.advanceStep();
    }
    this.currentOrder.remainingPatienceMs = Math.max(
      0,
      this.currentOrder.remainingPatienceMs - WRONG_INGREDIENT_PATIENCE_PENALTY_MS,
    );
    this.lastFeedback = "\u4e0d\u662f\u8fd9\u4e2a\u98df\u6750\uff01";
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
    this.lastFeedback = `\u5b8c\u6210\uff1a${step.label}`;
    return this.advanceStep();
  }

  completeHold(heldMs) {
    const step = this.currentStep;
    if (step?.type !== "action" || step.actionType !== "hold") return null;
    if (!judgeHoldAction(step, heldMs)) return this.failAction(getHoldFailureReason(step, heldMs) || "\u63a7\u706b\u5931\u8d25");
    this.lastFeedback = `\u5b8c\u6210\uff1a${step.label}`;
    return this.advanceStep();
  }

  completeMash(taps) {
    const step = this.currentStep;
    if (step?.type !== "action" || step.actionType !== "mash") return null;
    if (!judgeMashAction(step, taps)) return this.failAction("\u6ca1\u6405\u591f");
    this.lastFeedback = `\u5b8c\u6210\uff1a${step.label}`;
    return this.advanceStep();
  }

  completeSwipe(distancePx) {
    const step = this.currentStep;
    if (step?.type !== "action" || step.actionType !== "swipe") return null;
    if (!judgeSwipeAction(step, distancePx)) return this.failAction("\u88c5\u76d8\u5931\u8d25");
    this.lastFeedback = `\u5b8c\u6210\uff1a${step.label}`;
    return this.advanceStep();
  }

  completeCurrentOrder() {
    if (this.state !== "playing" || !this.currentOrder) return null;
    const order = this.currentOrder;
    this.coins += order.rewardCoins;
    this.servedCustomers += 1;
    this.lastFeedback = "\u51fa\u9910\u6210\u529f\uff01";
    if (this.servedCustomers >= this.serviceTarget) {
      return this.finish("passed");
    }
    this.assignNextOrder({ updateFeedback: false });
    return this.getSnapshot();
  }

  walkoutCurrentCustomer() {
    if (this.state !== "playing" || !this.currentOrder) return null;
    this.walkedOutCustomers += 1;
    this.lastFeedback = "\u987e\u5ba2\u751f\u6c14\u8d70\u4e86\uff01";
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
    this.lastFeedback = reason === "passed" ? "\u901a\u5173\u6210\u529f\uff01" : "\u4eca\u65e5\u8425\u4e1a\u5931\u8d25";
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
      hasNextLevel: passed && this.hasNextLevel(),
      levelIndex: this.currentLevelIndex,
      levelName: this.level?.levelName || "",
      coins: this.coins,
      servedCustomers: this.servedCustomers,
      walkedOutCustomers: this.walkedOutCustomers,
      failedActions: this.failedActions,
      comment: passed ? "\u65e6\u4ed4\u7a33\u4f4f\u4e86\u540e\u53a8\u8282\u594f\uff01" : "\u5ba2\u4eba\u8dd1\u592a\u591a\u4e86\uff0c\u540e\u53a8\u9700\u8981\u91cd\u6574\u3002",
    };
  }

  getSnapshot() {
    const order = this.currentOrder;
    return {
      state: this.state,
      level: { ...this.level },
      levelIndex: this.currentLevelIndex,
      hasNextLevel: this.hasNextLevel(),
      coins: this.coins,
      servedCustomers: this.servedCustomers,
      walkedOutCustomers: this.walkedOutCustomers,
      failedActions: this.failedActions,
      serviceTarget: this.serviceTarget,
      walkoutLimit: this.walkoutLimit,
      currentOrder: order ? cloneOrder(order) : null,
      currentStepIndex: this.currentStepIndex,
      currentStep: this.currentStep ? { ...this.currentStep } : null,
      recipeFlow: order ? getRealtimeRecipeFlow(order) : [],
      recipeSteps: order ? getRealtimeRecipeSteps(order, this.currentStepIndex) : [],
      requiredIngredientIds: this.getRequiredIngredientIds(),
      lastFeedback: this.lastFeedback,
      result: this.state === "ended" ? this.getResult() : null,
    };
  }
}
