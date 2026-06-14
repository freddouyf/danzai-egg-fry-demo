import { RHYTHM_COMMAND_TYPES, RHYTHM_TEST_LEVEL } from "./rhythmLevels.js";

export const RHYTHM_HIT_QUALITY = Object.freeze({
  MISS: "miss",
  GOOD: "good",
  PERFECT: "perfect",
});

const PERFECT_SCORE = 100;
const GOOD_SCORE = 60;
const BASE_COINS = 20;
const STAR_COIN_BONUS = 10;

export const RHYTHM_WINDOWS = Object.freeze({
  TAP: Object.freeze({ perfectMs: 180, goodMs: 360 }),
  HOLD: Object.freeze({ perfectMs: 150, goodMs: 350 }),
});

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

export function calculateRhythmStars(score, maxScore) {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.78) return 3;
  if (ratio >= 0.52) return 2;
  if (ratio >= 0.28) return 1;
  return 0;
}

export function calculateRhythmCoins(stars) {
  return BASE_COINS + Math.max(0, Math.floor(Number(stars) || 0)) * STAR_COIN_BONUS;
}

function normalizeCommand(command, index) {
  const type = command.type;
  const startAtMs = Math.max(0, Math.floor(Number(command.startAtMs) || 0));
  if (type === RHYTHM_COMMAND_TYPES.MASH) {
    const endAtMs = Math.max(startAtMs + 300, Math.floor(Number(command.endAtMs) || startAtMs + 1_500));
    return {
      ...command,
      id: command.id || `command-${index + 1}`,
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
    id: command.id || `command-${index + 1}`,
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
  return {
    ...RHYTHM_TEST_LEVEL,
    ...level,
    durationMs: Math.max(5_000, Math.floor(Number(level?.durationMs) || RHYTHM_TEST_LEVEL.durationMs)),
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
    this.combo = 0;
    this.bestCombo = 0;
    this.perfectCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.score = 0;
    this.mashTaps = 0;
    this.holdStartedAtMs = null;
    this.lastHitQuality = null;
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
        perfectReady: this.mashTaps >= command.targetTaps,
        milestone:
          this.mashTaps === goodThreshold || this.mashTaps === command.targetTaps,
        combo: this.combo,
      };
      this.events.push(event);
      return event;
    }

    if (command.type !== RHYTHM_COMMAND_TYPES.TAP) return null;
    if (this.elapsedMs < command.inputStartAtMs) {
      const event = {
        type: "earlyTapIgnored",
        command,
        waitMs: command.inputStartAtMs - this.elapsedMs,
      };
      this.events.push(event);
      return event;
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
    const scoreDelta =
      quality === RHYTHM_HIT_QUALITY.PERFECT
        ? PERFECT_SCORE
        : quality === RHYTHM_HIT_QUALITY.GOOD
          ? GOOD_SCORE
          : 0;

    if (quality === RHYTHM_HIT_QUALITY.MISS) {
      this.combo = 0;
      this.missCount += 1;
    } else {
      this.combo += 1;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      if (quality === RHYTHM_HIT_QUALITY.PERFECT) this.perfectCount += 1;
      if (quality === RHYTHM_HIT_QUALITY.GOOD) this.goodCount += 1;
    }

    this.score += scoreDelta;
    this.lastHitQuality = quality;
    this.holdStartedAtMs = null;
    const event = {
      type: "hit",
      quality,
      command,
      combo: this.combo,
      bestCombo: this.bestCombo,
      scoreDelta,
      score: this.score,
      fever: this.combo >= 5,
      ...detail,
    };
    this.events.push(event);
    this.commandIndex += 1;
    this.mashTaps = 0;
    return event;
  }

  finish() {
    if (this.state === "ended") return this.result;
    const maxScore = this.level.commands.length * PERFECT_SCORE;
    const stars = calculateRhythmStars(this.score, maxScore);
    const coinsEarned = calculateRhythmCoins(stars);
    this.state = "ended";
    this.result = {
      score: this.score,
      maxScore,
      stars,
      bestCombo: this.bestCombo,
      perfectCount: this.perfectCount,
      goodCount: this.goodCount,
      missCount: this.missCount,
      coinsEarned,
      commandsCompleted: this.perfectCount + this.goodCount + this.missCount,
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
      elapsedMs: this.elapsedMs,
      remainingMs,
      activeCommand: command,
      commandIndex: this.commandIndex,
      combo: this.combo,
      bestCombo: this.bestCombo,
      perfectCount: this.perfectCount,
      goodCount: this.goodCount,
      missCount: this.missCount,
      score: this.score,
      mashTaps: this.mashTaps,
      holdActive: this.holdStartedAtMs !== null,
      holdElapsedMs,
      holdTargetMs: command?.type === RHYTHM_COMMAND_TYPES.HOLD ? command.targetHoldMs : 0,
      lastHitQuality: this.lastHitQuality,
      fever: this.combo >= 5,
      result: this.result,
    };
  }

  drainEvents() {
    const pending = this.events;
    this.events = [];
    return pending;
  }
}
