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
  TAP: Object.freeze({ perfectMs: 180, goodMs: 360 }),
  HOLD: Object.freeze({ perfectMs: 150, goodMs: 350 }),
});

export const DEFAULT_ACTIONS_PER_DISH = 3;
export const DEFAULT_STAR_EGGS = Object.freeze([2, 4, 6]);

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

export function judgeMash(taps, targetTaps) {
  const count = Math.max(0, Math.floor(Number(taps) || 0));
  const target = Math.max(1, Math.floor(Number(targetTaps) || 1));
  if (count >= target) return RHYTHM_HIT_QUALITY.PERFECT;
  if (count >= Math.ceil(target * 0.65)) return RHYTHM_HIT_QUALITY.GOOD;
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

export function unlockRhythmLevelIndex(currentUnlockedIndex, completedLevelIndex, stars) {
  const current = Math.max(0, Math.floor(Number(currentUnlockedIndex) || 0));
  const completed = Math.max(0, Math.floor(Number(completedLevelIndex) || 0));
  if (Math.floor(Number(stars) || 0) <= 0) return current;
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
    inputStartAtMs:
      type === RHYTHM_COMMAND_TYPES.TAP
        ? Math.max(startAtMs, targetAtMs - RHYTHM_WINDOWS.TAP.goodMs)
        : startAtMs,
    expireAtMs: Math.max(targetAtMs + 200, Math.floor(Number(command.expireAtMs) || targetAtMs + 650)),
  };
}

function normalizeLevel(level) {
  const title = level?.title || RHYTHM_TEST_LEVEL.title;
  const dishName = level?.dishName || title;
  return {
    ...RHYTHM_TEST_LEVEL,
    ...level,
    title,
    dishName,
    durationMs: Math.max(5_000, Math.floor(Number(level?.durationMs) || RHYTHM_TEST_LEVEL.durationMs)),
    actionsPerDish: Math.max(
      1,
      Math.floor(Number(level?.actionsPerDish) || Number(RHYTHM_TEST_LEVEL.actionsPerDish) || DEFAULT_ACTIONS_PER_DISH),
    ),
    starEggs: level?.starEggs || RHYTHM_TEST_LEVEL.starEggs || DEFAULT_STAR_EGGS,
    commands: (level?.commands || RHYTHM_TEST_LEVEL.commands).map(normalizeCommand),
  };
}

export class RhythmCookingGame {
  constructor(level = RHYTHM_TEST_LEVEL) {
    this.level = normalizeLevel(level);
    this.events = [];
    this.reset();
  }

  reset() {
    this.state = "idle";
    this.elapsedMs = 0;
    this.commandIndex = 0;
    this.successfulActions = 0;
    this.failedActions = 0;
    this.completedEggs = 0;
    this.score = 0;
    this.mashTaps = 0;
    this.holdStartedAtMs = null;
    this.lastHitQuality = null;
    this.lastActionResult = null;
    this.result = null;
    this.events = [];
  }

  start(startAtMs = 0) {
    this.reset();
    this.state = "playing";
    this.startAtMs = Math.floor(Number(startAtMs) || 0);
    this.events.push({ type: "rhythmStarted", level: this.level });
  }

  get activeCommand() {
    return this.level.commands[this.commandIndex] || null;
  }

  update(nowMs) {
    if (this.state !== "playing") return;
    this.elapsedMs = Math.max(0, Math.floor(Number(nowMs) || 0));
    this.resolveExpiredCommands();
    if (this.elapsedMs >= this.level.durationMs || this.commandIndex >= this.level.commands.length) {
      this.finish();
    }
  }

  resolveExpiredCommands() {
    let command = this.activeCommand;
    while (command && this.elapsedMs > command.expireAtMs) {
      if (command.type === RHYTHM_COMMAND_TYPES.MASH) {
        this.resolveCommand(judgeMash(this.mashTaps, command.targetTaps), command, {
          taps: this.mashTaps,
          targetTaps: command.targetTaps,
        });
      } else {
        const holdDurationMs =
          command.type === RHYTHM_COMMAND_TYPES.HOLD
            ? this.getHoldElapsedMs()
            : 0;
        this.holdStartedAtMs = null;
        this.resolveCommand(RHYTHM_HIT_QUALITY.MISS, command, {
          reason: "timeout",
          holdDurationMs,
        });
      }
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

    if (command.type === RHYTHM_COMMAND_TYPES.MASH) {
      this.mashTaps += 1;
      const goodThreshold = Math.ceil(command.targetTaps * 0.65);
      const event = {
        type: "mashTap",
        taps: this.mashTaps,
        targetTaps: command.targetTaps,
        goodReady: this.mashTaps >= goodThreshold,
        completeReady: this.mashTaps >= command.targetTaps,
        milestone:
          this.mashTaps === goodThreshold || this.mashTaps === command.targetTaps,
      };
      this.events.push(event);
      return event;
    }

    if (command.type !== RHYTHM_COMMAND_TYPES.TAP) return null;
    if (this.elapsedMs < command.inputStartAtMs) {
      return this.resolveCommand(RHYTHM_HIT_QUALITY.MISS, command, {
        reason: "tooEarly",
        errorMs: this.elapsedMs - command.targetAtMs,
      });
    }
    const errorMs = this.elapsedMs - command.targetAtMs;
    const quality = judgeTimingError(errorMs, RHYTHM_WINDOWS.TAP);
    return this.resolveCommand(quality, command, { errorMs });
  }

  holdStart(nowMs) {
    this.update(nowMs);
    const command = this.activeCommand;
    if (this.state !== "playing" || !command || command.type !== RHYTHM_COMMAND_TYPES.HOLD) {
      return null;
    }
    if (this.elapsedMs < command.startAtMs) return null;
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
    const holdDurationMs = this.getHoldElapsedMs();
    const errorMs = holdDurationMs - command.targetHoldMs;
    const quality = judgeTimingError(errorMs, RHYTHM_WINDOWS.HOLD);
    const startedAtMs = this.holdStartedAtMs;
    this.holdStartedAtMs = null;
    return this.resolveCommand(quality, command, {
      errorMs,
      holdDurationMs,
      startedAtMs,
    });
  }

  resolveCommand(quality, command, detail = {}) {
    const actionResult =
      quality === RHYTHM_HIT_QUALITY.MISS
        ? RHYTHM_ACTION_RESULT.FAIL
        : RHYTHM_ACTION_RESULT.SUCCESS;
    const previousEggs = this.completedEggs;

    if (actionResult === RHYTHM_ACTION_RESULT.SUCCESS) {
      this.successfulActions += 1;
      this.score += 10;
    } else {
      this.failedActions += 1;
    }

    this.completedEggs = Math.floor(this.successfulActions / this.level.actionsPerDish);
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
      currentDishActions: this.successfulActions % this.level.actionsPerDish,
      score: this.score,
      ...detail,
    };
    this.events.push(event);
    if (this.completedEggs > previousEggs) {
      this.events.push({
        type: "eggCompleted",
        command,
        completedEggs: this.completedEggs,
        successfulActions: this.successfulActions,
      });
    }
    this.commandIndex += 1;
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
      totalCommands: this.level.commands.length,
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
      successfulActions: this.successfulActions,
      failedActions: this.failedActions,
      completedEggs: this.completedEggs,
      currentDishActions: this.successfulActions % this.level.actionsPerDish,
      actionsPerDish: this.level.actionsPerDish,
      score: this.score,
      mashTaps: this.mashTaps,
      holdActive: this.holdStartedAtMs !== null,
      holdElapsedMs,
      holdTargetMs: command?.type === RHYTHM_COMMAND_TYPES.HOLD ? command.targetHoldMs : 0,
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
