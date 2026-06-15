import { RHYTHM_COMMAND_TYPES, RHYTHM_TEST_LEVEL } from "./rhythmLevels.js";

export const RHYTHM_HIT_QUALITY = Object.freeze({
  MISS: "miss",
  GOOD: "good",
  PERFECT: "perfect",
});

export const RHYTHM_ACTION_RESULT = Object.freeze({
  SUCCESS: "success",
  FAIL: "fail",
});

export const RHYTHM_WINDOWS = Object.freeze({
  TAP: Object.freeze({ perfectMs: 150, goodMs: 300 }),
  HOLD: Object.freeze({ perfectMs: 125, goodMs: 290 }),
});

export const DEFAULT_ACTIONS_PER_DISH = 3;
export const DEFAULT_STAR_EGGS = Object.freeze([2, 3, 4]);
export const RHYTHM_DISH_STEP_TYPES = Object.freeze([
  RHYTHM_COMMAND_TYPES.TAP,
  RHYTHM_COMMAND_TYPES.MASH,
  RHYTHM_COMMAND_TYPES.HOLD,
]);
export const TAP_INPUT_PREP_MS = 200;
export const POST_MASH_INPUT_GUARD_MS = 300;

const BASE_COINS = 20;
const STAR_COIN_BONUS = 10;
const EGG_COIN_BONUS = 2;
const STAR_COMMENTS = Object.freeze([
  "旦仔还要练练！",
  "能吃就行！",
  "香气不错！",
  "完美出餐！",
]);

export function judgeTimingError(errorMs, { perfectMs, goodMs }) {
  const error = Math.abs(Number(errorMs) || 0);
  if (error <= perfectMs) return RHYTHM_HIT_QUALITY.PERFECT;
  if (error <= goodMs) return RHYTHM_HIT_QUALITY.GOOD;
  return RHYTHM_HIT_QUALITY.MISS;
}

function clampRatio(value) {
  return Math.min(1, Math.max(0, value));
}

function buildSuccessWindow({ startMs, endMs, minMs = 0, maxMs }) {
  const safeMin = Math.floor(Number(minMs) || 0);
  const safeMax = Math.max(safeMin + 1, Math.floor(Number(maxMs) || safeMin + 1));
  const safeStart = Math.max(safeMin, Math.floor(Number(startMs) || safeMin));
  const safeEnd = Math.min(safeMax, Math.max(safeStart, Math.floor(Number(endMs) || safeStart)));
  const span = safeMax - safeMin;
  return {
    startMs: safeStart,
    endMs: safeEnd,
    minMs: safeMin,
    maxMs: safeMax,
    startRatio: clampRatio((safeStart - safeMin) / span),
    endRatio: clampRatio((safeEnd - safeMin) / span),
  };
}

export function getTapSuccessWindow(command) {
  const startAtMs = Math.floor(Number(command?.startAtMs) || 0);
  const targetAtMs = Math.max(startAtMs, Math.floor(Number(command?.targetAtMs) || startAtMs));
  const goodMs = Math.max(1, Math.floor(Number(command?.goodMs) || RHYTHM_WINDOWS.TAP.goodMs));
  const successStartMs = targetAtMs - goodMs;
  const successEndMs = targetAtMs + goodMs;
  const maxMs = Math.max(
    successEndMs,
    Math.floor(Number(command?.expireAtMs) || successEndMs),
  );
  return buildSuccessWindow({
    startMs: successStartMs,
    endMs: successEndMs,
    minMs: startAtMs,
    maxMs,
  });
}

export function getHoldSuccessWindow(command) {
  const targetHoldMs = Math.max(250, Math.floor(Number(command?.targetHoldMs) || 250));
  const goodMs = Math.max(1, Math.floor(Number(command?.goodMs) || RHYTHM_WINDOWS.HOLD.goodMs));
  const successStartMs = targetHoldMs - goodMs;
  const successEndMs = targetHoldMs + goodMs;
  const maxMs = Math.max(targetHoldMs + 450, targetHoldMs * 1.45, successEndMs);
  return buildSuccessWindow({
    startMs: successStartMs,
    endMs: successEndMs,
    minMs: 0,
    maxMs,
  });
}

function judgeWithinSuccessWindow(valueMs, window, targetMs, timingWindow) {
  const value = Math.floor(Number(valueMs) || 0);
  if (value < window.startMs || value > window.endMs) return RHYTHM_HIT_QUALITY.MISS;
  const error = Math.abs(value - targetMs);
  if (error <= timingWindow.perfectMs) return RHYTHM_HIT_QUALITY.PERFECT;
  return RHYTHM_HIT_QUALITY.GOOD;
}

export function judgeMash(taps, targetTaps) {
  const count = Math.max(0, Math.floor(Number(taps) || 0));
  const target = Math.max(1, Math.floor(Number(targetTaps) || 1));
  if (count >= target) return RHYTHM_HIT_QUALITY.PERFECT;
  return RHYTHM_HIT_QUALITY.MISS;
}

export function judgeSwipe({ startX = 0, startY = 0, endX = 0, endY = 0 } = {}, {
  minDistancePx = 70,
  direction = "any",
} = {}) {
  const dx = Number(endX) - Number(startX);
  const dy = Number(endY) - Number(startY);
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const required = Math.max(1, Math.floor(Number(minDistancePx) || 70));
  const axisDistance = Math.max(absX, absY);
  const normalizedDirection = direction || "any";
  const directionOk =
    normalizedDirection === "any"
    || (normalizedDirection === "left" && dx <= -required && absX >= absY)
    || (normalizedDirection === "right" && dx >= required && absX >= absY)
    || (normalizedDirection === "up" && dy <= -required && absY >= absX)
    || (normalizedDirection === "down" && dy >= required && absY >= absX);
  if (axisDistance >= required && directionOk) return RHYTHM_HIT_QUALITY.PERFECT;
  return RHYTHM_HIT_QUALITY.MISS;
}

// Kept for old unit coverage. Rhythm mode now uses completed egg count for stars.
export function calculateRhythmStars(score, maxScore) {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.78) return 3;
  if (ratio >= 0.52) return 2;
  if (ratio >= 0.28) return 1;
  return 0;
}

export function calculateRhythmStarsFromEggs(completedEggs, thresholds = DEFAULT_STAR_EGGS) {
  const eggs = Math.max(0, Math.floor(Number(completedEggs) || 0));
  const [oneStar = 2, twoStars = 4, threeStars = 6] = thresholds;
  if (eggs >= threeStars) return 3;
  if (eggs >= twoStars) return 2;
  if (eggs >= oneStar) return 1;
  return 0;
}

export function calculateRhythmCoins(starsOrResult, completedEggsArg = 0) {
  const stars =
    typeof starsOrResult === "object"
      ? starsOrResult?.stars
      : starsOrResult;
  const completedEggs =
    typeof starsOrResult === "object"
      ? starsOrResult?.completedEggs
      : completedEggsArg;
  return (
    BASE_COINS
    + Math.max(0, Math.floor(Number(stars) || 0)) * STAR_COIN_BONUS
    + Math.max(0, Math.floor(Number(completedEggs) || 0)) * EGG_COIN_BONUS
  );
}

export function getRhythmStarComment(stars) {
  const index = Math.min(3, Math.max(0, Math.floor(Number(stars) || 0)));
  return STAR_COMMENTS[index];
}

export function unlockRhythmLevelIndex(currentUnlockedIndex, completedLevelIndex, stars = 0) {
  const current = Math.max(0, Math.floor(Number(currentUnlockedIndex) || 0));
  const completed = Math.max(0, Math.floor(Number(completedLevelIndex) || 0));
  if (Math.floor(Number(stars) || 0) < 1) return current;
  return Math.max(current, completed + 1);
}

function normalizeCommand(command, index) {
  const type = command.input || command.type;
  const startAtMs = Math.max(0, Math.floor(Number(command.startAtMs) || 0));
  const id = command.id || `command-${index + 1}`;
  const actionName = command.actionName || command.label || id;
  const prompt = command.prompt || `${actionName}！`;
  const helperText = command.helperText || command.label || "";
  if (type === RHYTHM_COMMAND_TYPES.MASH) {
    const endAtMs = Math.max(startAtMs + 300, Math.floor(Number(command.endAtMs) || startAtMs + 1_500));
    return {
      ...command,
      id,
      type,
      input: type,
      actionName,
      prompt,
      helperText,
      startAtMs,
      endAtMs,
      expireAtMs: endAtMs,
      targetTaps: Math.max(1, Math.floor(Number(command.targetTaps) || 6)),
      visualKey: command.visualKey || command.scene || "whisk",
      dishStepIndex: Math.max(0, Math.floor(Number(command.dishStepIndex) || 0)),
    };
  }

  if (type === RHYTHM_COMMAND_TYPES.SWIPE) {
    return {
      ...command,
      id,
      type,
      input: type,
      actionName,
      prompt,
      helperText,
      startAtMs,
      expireAtMs: Number.POSITIVE_INFINITY,
      minDistancePx: Math.max(1, Math.floor(Number(command.minDistancePx) || 70)),
      direction: command.direction || "any",
      visualKey: command.visualKey || command.scene || "plate",
      dishStepIndex: Math.max(0, Math.floor(Number(command.dishStepIndex) || 0)),
    };
  }

  const targetAtMs = Math.max(startAtMs, Math.floor(Number(command.targetAtMs) || startAtMs + 600));
  const targetHoldMs = Math.max(250, Math.floor(Number(command.targetHoldMs) || targetAtMs - startAtMs));
  return {
    ...command,
    id,
    type,
    input: type,
    actionName,
    prompt,
    helperText,
    startAtMs,
    targetAtMs,
    targetHoldMs,
    visualKey: command.visualKey || command.scene || type,
    dishStepIndex: Math.max(0, Math.floor(Number(command.dishStepIndex) || 0)),
    inputStartAtMs:
      type === RHYTHM_COMMAND_TYPES.TAP
        ? Math.max(
          startAtMs,
          Math.min(targetAtMs - RHYTHM_WINDOWS.TAP.goodMs, startAtMs + TAP_INPUT_PREP_MS),
        )
        : startAtMs,
    expireAtMs: Math.max(targetAtMs + 200, Math.floor(Number(command.expireAtMs) || targetAtMs + 650)),
  };
}

function normalizeLevel(level) {
  const title = level?.title || RHYTHM_TEST_LEVEL.title;
  const dishName = level?.dishName || title;
  const commands = (level?.commands || RHYTHM_TEST_LEVEL.commands).map(normalizeCommand);
  const inferredActionsPerDish = commands.reduce(
    (max, command) => Math.max(max, command.dishStepIndex + 1),
    DEFAULT_ACTIONS_PER_DISH,
  );
  return {
    ...RHYTHM_TEST_LEVEL,
    ...level,
    title,
    dishName,
    durationMs: Math.max(5_000, Math.floor(Number(level?.durationMs) || RHYTHM_TEST_LEVEL.durationMs)),
    unitName: level?.unitName || "成品",
    tapDurationMs: Math.max(600, Math.floor(Number(level?.tapDurationMs) || Number(RHYTHM_TEST_LEVEL.tapDurationMs) || 1_300)),
    actionsPerDish: Math.max(
      1,
      Math.floor(Number(level?.actionsPerDish) || inferredActionsPerDish),
    ),
    starEggs: level?.starEggs || RHYTHM_TEST_LEVEL.starEggs || DEFAULT_STAR_EGGS,
    commands,
  };
}

function fallbackStepTemplate(stepIndex) {
  const type = RHYTHM_DISH_STEP_TYPES[stepIndex] || RHYTHM_COMMAND_TYPES.TAP;
  const names = ["敲蛋", "打蛋", "煎熟出锅", "装盘"];
  const prompts = ["敲蛋！", "快速打蛋！", "按住煎熟！", "装盘！"];
  return normalizeCommand({
    id: `fallback-step-${stepIndex}`,
    input: type,
    actionName: names[stepIndex] || "做菜",
    prompt: prompts[stepIndex] || "开始！",
    helperText: "",
    scene:
      type === RHYTHM_COMMAND_TYPES.MASH
        ? "mash"
        : type === RHYTHM_COMMAND_TYPES.HOLD
          ? "fry"
          : "crack",
    visualKey:
      type === RHYTHM_COMMAND_TYPES.MASH
        ? "whisk"
        : type === RHYTHM_COMMAND_TYPES.HOLD
          ? "fry-egg"
          : "crack",
    dishStepIndex: stepIndex,
    startAtMs: 0,
    targetAtMs: type === RHYTHM_COMMAND_TYPES.TAP ? 330 : 800,
    targetHoldMs: 800,
    expireAtMs: 720,
    endAtMs: 2_200,
    targetTaps: 8,
    minDistancePx: 70,
    direction: "any",
  }, stepIndex);
}

function buildStepTemplates(commands, actionsPerDish = DEFAULT_ACTIONS_PER_DISH) {
  const usedIds = new Set();
  return Array.from({ length: actionsPerDish }, (_, stepIndex) => {
    const byStep = commands.find((command) => command.dishStepIndex === stepIndex);
    const type = byStep?.type || RHYTHM_DISH_STEP_TYPES[stepIndex] || RHYTHM_COMMAND_TYPES.TAP;
    const byType = commands.find((command) => command.type === type && !usedIds.has(command.id));
    const picked = byStep || byType || fallbackStepTemplate(stepIndex);
    usedIds.add(picked.id);
    return picked;
  });
}

export class RhythmCookingGame {
  constructor(level = RHYTHM_TEST_LEVEL) {
    this.level = normalizeLevel(level);
    this.stepTemplates = buildStepTemplates(this.level.commands, this.level.actionsPerDish);
    this.events = [];
    this.reset();
  }

  reset() {
    this.state = "idle";
    this.elapsedMs = 0;
    this.commandIndex = 0;
    this.currentDishStepIndex = 0;
    this.currentEggActions = 0;
    this.eggAttemptIndex = 1;
    this.currentCommand = null;
    this.successfulActions = 0;
    this.failedActions = 0;
    this.completedEggs = 0;
    this.score = 0;
    this.mashTaps = 0;
    this.holdStartedAtMs = null;
    this.stepResolved = false;
    this.stepInputGuardUntilMs = 0;
    this.lastHitQuality = null;
    this.lastActionResult = null;
    this.result = null;
    this.events = [];
  }

  start(startAtMs = 0) {
    this.reset();
    this.state = "playing";
    this.startAtMs = Math.floor(Number(startAtMs) || 0);
    this.elapsedMs = this.startAtMs;
    this.startStep(0, this.startAtMs);
    this.events.push({ type: "rhythmStarted", level: this.level });
  }

  get activeCommand() {
    return this.currentCommand;
  }

  update(nowMs) {
    if (this.state !== "playing") return;
    this.elapsedMs = Math.max(0, Math.floor(Number(nowMs) || 0));
    if (this.elapsedMs >= this.level.durationMs) {
      this.finish();
      return;
    }
    this.resolveExpiredCommands();
  }

  createStepCommand(stepIndex, startAtMs = this.elapsedMs, { preview = false } = {}) {
    const template = this.stepTemplates[stepIndex] || fallbackStepTemplate(stepIndex);
    const type = template.type || RHYTHM_DISH_STEP_TYPES[stepIndex] || RHYTHM_COMMAND_TYPES.TAP;
    const baseStart = Number(template.startAtMs) || 0;
    const idSuffix = preview ? "preview" : `${this.eggAttemptIndex}-${this.commandIndex}`;

    if (type === RHYTHM_COMMAND_TYPES.MASH) {
      const durationMs = Math.max(900, (Number(template.endAtMs) || baseStart + 2_200) - baseStart);
      return {
        ...template,
        id: `${template.id}-${idSuffix}`,
        type,
        input: type,
        dishStepIndex: stepIndex,
        eggIndex: this.eggAttemptIndex,
        startAtMs,
        endAtMs: startAtMs + durationMs,
        expireAtMs: Number.POSITIVE_INFINITY,
      };
    }

    if (type === RHYTHM_COMMAND_TYPES.SWIPE) {
      return {
        ...template,
        id: `${template.id}-${idSuffix}`,
        type,
        input: type,
        dishStepIndex: stepIndex,
        eggIndex: this.eggAttemptIndex,
        startAtMs,
        expireAtMs: Number.POSITIVE_INFINITY,
        minDistancePx: Math.max(1, Math.floor(Number(template.minDistancePx) || 70)),
        direction: template.direction || "any",
      };
    }

    const configuredTapDurationMs =
      type === RHYTHM_COMMAND_TYPES.TAP
        ? Math.floor(Number(template.tapDurationMs) || Number(this.level.tapDurationMs) || 0)
        : 0;
    const targetDelayMs =
      type === RHYTHM_COMMAND_TYPES.HOLD
        ? Math.max(250, Number(template.targetHoldMs) || 800)
        : Math.max(
          250,
          Math.floor(Number(template.targetDelayMs) || 0)
            || (configuredTapDurationMs ? Math.round(configuredTapDurationMs * 0.6) : 0)
            || ((Number(template.targetAtMs) || baseStart + 330) - baseStart),
        );
    const expireDelayMs =
      type === RHYTHM_COMMAND_TYPES.TAP && configuredTapDurationMs
        ? Math.max(configuredTapDurationMs, targetDelayMs + RHYTHM_WINDOWS.TAP.goodMs)
        : Math.max(
          targetDelayMs + RHYTHM_WINDOWS.TAP.goodMs,
          targetDelayMs + 200,
          (Number(template.expireAtMs) || baseStart + targetDelayMs + 390) - baseStart,
        );
    const targetAtMs = startAtMs + targetDelayMs;
    return {
      ...template,
      id: `${template.id}-${idSuffix}`,
      type,
      input: type,
      goodMs: template.goodMs,
      dishStepIndex: stepIndex,
      eggIndex: this.eggAttemptIndex,
      startAtMs,
      targetAtMs,
      targetHoldMs:
        type === RHYTHM_COMMAND_TYPES.HOLD
          ? targetDelayMs
          : Math.max(250, Number(template.targetHoldMs) || targetDelayMs),
      inputStartAtMs:
        type === RHYTHM_COMMAND_TYPES.TAP
          ? Math.max(
            startAtMs,
            Math.min(targetAtMs - RHYTHM_WINDOWS.TAP.goodMs, startAtMs + TAP_INPUT_PREP_MS),
          )
          : startAtMs,
      expireAtMs:
        type === RHYTHM_COMMAND_TYPES.TAP
          ? startAtMs + expireDelayMs
          : Number.POSITIVE_INFINITY,
    };
  }

  startStep(stepIndex, startAtMs = this.elapsedMs) {
    this.currentDishStepIndex = Math.min(
      this.level.actionsPerDish - 1,
      Math.max(0, Math.floor(Number(stepIndex) || 0)),
    );
    this.currentCommand = this.createStepCommand(this.currentDishStepIndex, startAtMs);
    this.stepResolved = false;
    this.mashTaps = 0;
    this.holdStartedAtMs = null;
  }

  resolveExpiredCommands() {
    let command = this.activeCommand;
    while (
      command
      && command.type === RHYTHM_COMMAND_TYPES.TAP
      && this.elapsedMs > command.expireAtMs
    ) {
      this.resolveCurrentStep(RHYTHM_HIT_QUALITY.MISS, {
        reason: "timeout",
      });
      command = this.activeCommand;
    }
  }

  getHoldElapsedMs(nowMs = this.elapsedMs) {
    if (this.holdStartedAtMs === null) return 0;
    return Math.max(0, Math.floor(Number(nowMs) || 0) - this.holdStartedAtMs);
  }

  tap(nowMs) {
    this.update(nowMs);
    if (this.state !== "playing") return null;
    const command = this.activeCommand;
    if (!command || this.elapsedMs < command.startAtMs) return null;

    if (this.elapsedMs < this.stepInputGuardUntilMs) {
      const event = {
        type: "inputGuarded",
        command,
        untilMs: this.stepInputGuardUntilMs,
      };
      this.events.push(event);
      return event;
    }

    if (command.type === RHYTHM_COMMAND_TYPES.MASH) {
      this.mashTaps += 1;
      const completeReady = this.mashTaps >= command.targetTaps;
      const event = {
        type: "mashTap",
        taps: this.mashTaps,
        targetTaps: command.targetTaps,
        goodReady: false,
        completeReady,
        milestone: completeReady,
      };
      this.events.push(event);
      if (completeReady) {
        return this.resolveCurrentStep(RHYTHM_HIT_QUALITY.PERFECT, {
          taps: this.mashTaps,
          targetTaps: command.targetTaps,
        });
      }
      return event;
    }

    if (command.type !== RHYTHM_COMMAND_TYPES.TAP) return null;
    if (this.elapsedMs < command.inputStartAtMs) {
      const event = {
        type: "earlyTapIgnored",
        command,
        untilMs: command.inputStartAtMs,
      };
      this.events.push(event);
      return event;
    }
    const hitAtMs = this.elapsedMs;
    const window = getTapSuccessWindow(command);
    const quality = judgeWithinSuccessWindow(
      hitAtMs,
      window,
      command.targetAtMs,
      RHYTHM_WINDOWS.TAP,
    );
    return this.resolveCurrentStep(quality, {
      errorMs: hitAtMs - command.targetAtMs,
      hitAtMs,
      successStartMs: window.startMs,
      successEndMs: window.endMs,
    });
  }

  swipe(points = {}, nowMs = this.elapsedMs) {
    this.update(nowMs);
    if (this.state !== "playing") return null;
    const command = this.activeCommand;
    if (!command || command.type !== RHYTHM_COMMAND_TYPES.SWIPE) return null;
    if (this.elapsedMs < command.startAtMs) return null;
    if (this.elapsedMs < this.stepInputGuardUntilMs) {
      const event = {
        type: "inputGuarded",
        command,
        untilMs: this.stepInputGuardUntilMs,
      };
      this.events.push(event);
      return event;
    }
    const effectiveMinDistancePx = Math.max(
      1,
      Math.floor(Number(points.minDistancePx) || Number(command.minDistancePx) || 70),
    );
    const quality = judgeSwipe(points, {
      ...command,
      minDistancePx: effectiveMinDistancePx,
    });
    return this.resolveCurrentStep(quality, {
      swipe: {
        startX: Number(points.startX) || 0,
        startY: Number(points.startY) || 0,
        endX: Number(points.endX) || 0,
        endY: Number(points.endY) || 0,
      },
      minDistancePx: effectiveMinDistancePx,
      direction: command.direction,
    });
  }

  holdStart(nowMs) {
    this.update(nowMs);
    const command = this.activeCommand;
    if (this.state !== "playing" || !command || command.type !== RHYTHM_COMMAND_TYPES.HOLD) {
      return null;
    }
    if (this.elapsedMs < command.startAtMs) return null;
    if (this.elapsedMs < this.stepInputGuardUntilMs) {
      const event = {
        type: "inputGuarded",
        command,
        untilMs: this.stepInputGuardUntilMs,
      };
      this.events.push(event);
      return event;
    }
    if (this.holdStartedAtMs !== null) return null;
    this.holdStartedAtMs = this.elapsedMs;
    const event = { type: "holdStarted", command };
    this.events.push(event);
    return event;
  }

  holdEnd(nowMs) {
    this.update(nowMs);
    const command = this.activeCommand;
    if (this.state !== "playing" || !command || command.type !== RHYTHM_COMMAND_TYPES.HOLD) {
      this.holdStartedAtMs = null;
      return null;
    }
    if (this.elapsedMs < command.startAtMs) return null;
    if (this.holdStartedAtMs === null) return null;
    const holdDurationMs = this.getHoldElapsedMs(this.elapsedMs);
    const startedAtMs = this.holdStartedAtMs;
    this.holdStartedAtMs = null;
    const window = getHoldSuccessWindow(command);
    const quality = judgeWithinSuccessWindow(
      holdDurationMs,
      window,
      command.targetHoldMs,
      RHYTHM_WINDOWS.HOLD,
    );
    return this.resolveCurrentStep(quality, {
      errorMs: holdDurationMs - command.targetHoldMs,
      holdDurationMs,
      startedAtMs,
      successStartMs: window.startMs,
      successEndMs: window.endMs,
    });
  }

  cancelHold(nowMs = this.elapsedMs) {
    if (this.holdStartedAtMs === null) return null;
    return this.holdEnd(nowMs);
  }

  clearActiveHold() {
    this.holdStartedAtMs = null;
  }

  resolveCurrentStep(quality, detail = {}) {
    if (this.stepResolved || this.state !== "playing" || !this.currentCommand) return null;
    this.stepResolved = true;
    const command = this.currentCommand;
    const completedStepIndex = this.currentDishStepIndex;
    const actionResult =
      quality === RHYTHM_HIT_QUALITY.MISS
        ? RHYTHM_ACTION_RESULT.FAIL
        : RHYTHM_ACTION_RESULT.SUCCESS;
    const previousEggs = this.completedEggs;

    if (actionResult === RHYTHM_ACTION_RESULT.SUCCESS) {
      this.successfulActions += 1;
      this.currentEggActions += 1;
      this.score += 10;
    } else {
      this.failedActions += 1;
    }

    if (
      actionResult === RHYTHM_ACTION_RESULT.SUCCESS
      && completedStepIndex >= this.level.actionsPerDish - 1
    ) {
      this.completedEggs += 1;
    }
    this.lastHitQuality = quality;
    this.lastActionResult = actionResult;
    this.holdStartedAtMs = null;

    const event = {
      type: "hit",
      quality,
      actionResult,
      command,
      successfulActions: this.successfulActions,
      failedActions: this.failedActions,
      completedEggs: this.completedEggs,
      currentDishActions:
        actionResult === RHYTHM_ACTION_RESULT.SUCCESS
          ? this.currentEggActions
          : 0,
      score: this.score,
      ...detail,
    };
    this.events.push(event);
    this.commandIndex += 1;

    if (this.completedEggs > previousEggs) {
      this.events.push({
        type: "eggCompleted",
        command,
        completedEggs: this.completedEggs,
        successfulActions: this.successfulActions,
      });
    }

    if (
      actionResult === RHYTHM_ACTION_RESULT.SUCCESS
      && completedStepIndex < this.level.actionsPerDish - 1
    ) {
      this.startStep(completedStepIndex + 1, this.elapsedMs);
    } else {
      this.currentEggActions = 0;
      this.eggAttemptIndex += 1;
      this.startStep(0, this.elapsedMs);
    }

    if (command.type === RHYTHM_COMMAND_TYPES.MASH) {
      this.stepInputGuardUntilMs = this.elapsedMs + POST_MASH_INPUT_GUARD_MS;
    } else {
      this.stepInputGuardUntilMs = 0;
    }
    this.mashTaps = 0;
    return event;
  }

  finish() {
    if (this.state === "ended") return this.result;
    const stars = calculateRhythmStarsFromEggs(this.completedEggs, this.level.starEggs);
    const coinsEarned = calculateRhythmCoins({ stars, completedEggs: this.completedEggs });
    const starComment = getRhythmStarComment(stars);
    this.state = "ended";
    this.result = {
      dishName: this.level.dishName,
      score: this.score,
      stars,
      starComment,
      completedEggs: this.completedEggs,
      successfulActions: this.successfulActions,
      failedActions: this.failedActions,
      coinsEarned,
      commandsCompleted: this.successfulActions + this.failedActions,
      totalCommands: this.commandIndex,
    };
    this.events.push({ type: "rhythmEnded", result: this.result });
    return this.result;
  }

  getSnapshot() {
    const command = this.activeCommand;
    const remainingMs = Math.max(0, this.level.durationMs - this.elapsedMs);
    const holdElapsedMs = this.getHoldElapsedMs();
    return {
      state: this.state,
      level: this.level,
      dishName: this.level.dishName,
      elapsedMs: this.elapsedMs,
      remainingMs,
      activeCommand: command,
      commandIndex: this.commandIndex,
      currentDishStepIndex: this.currentDishStepIndex,
      successfulActions: this.successfulActions,
      failedActions: this.failedActions,
      completedEggs: this.completedEggs,
      currentDishActions: this.currentDishStepIndex,
      actionsPerDish: this.level.actionsPerDish,
      nextCommand:
        this.state === "playing"
          ? this.createStepCommand(
            this.currentDishStepIndex >= this.level.actionsPerDish - 1
              ? 0
              : this.currentDishStepIndex + 1,
            this.elapsedMs,
            { preview: true },
          )
          : null,
      score: this.score,
      mashTaps: this.mashTaps,
      holdActive: this.holdStartedAtMs !== null,
      holdElapsedMs,
      holdTargetMs: command?.type === RHYTHM_COMMAND_TYPES.HOLD ? command.targetHoldMs : 0,
      inputGuardRemainingMs: Math.max(0, this.stepInputGuardUntilMs - this.elapsedMs),
      lastHitQuality: this.lastHitQuality,
      lastActionResult: this.lastActionResult,
      result: this.result,
    };
  }

  drainEvents() {
    const pending = this.events;
    this.events = [];
    return pending;
  }
}
