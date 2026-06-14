import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateRhythmCoins,
  calculateRhythmStarsFromEggs,
  getHoldSuccessWindow,
  getTapSuccessWindow,
  judgeMash,
  judgeTimingError,
  POST_MASH_INPUT_GUARD_MS,
  RHYTHM_ACTION_RESULT,
  RHYTHM_HIT_QUALITY,
  RHYTHM_WINDOWS,
  TAP_INPUT_PREP_MS,
  RhythmCookingGame,
  unlockRhythmLevelIndex,
} from "../src/rhythmGame.js";
import {
  RHYTHM_COMMAND_TYPES,
  RHYTHM_DISH_LEVELS,
  RHYTHM_TEST_LEVEL,
} from "../src/rhythmLevels.js";
import {
  canRunRhythmClock,
  getRhythmResultUiState,
  shouldShowRhythmNextLevel,
} from "../src/rhythmMode.js";

const LOOP_LEVEL = {
  id: "loop-test",
  title: "Loop Test",
  dishName: "测试煎蛋",
  durationMs: 120_000,
  actionsPerDish: 3,
  starEggs: [2, 4, 6],
  commands: [
    {
      id: "tap",
      type: RHYTHM_COMMAND_TYPES.TAP,
      input: RHYTHM_COMMAND_TYPES.TAP,
      actionName: "敲蛋",
      prompt: "敲蛋！",
      dishStepIndex: 0,
      startAtMs: 0,
      targetAtMs: 320,
      expireAtMs: 760,
    },
    {
      id: "mash",
      type: RHYTHM_COMMAND_TYPES.MASH,
      input: RHYTHM_COMMAND_TYPES.MASH,
      actionName: "快速打蛋",
      prompt: "快速打蛋！",
      dishStepIndex: 1,
      startAtMs: 0,
      endAtMs: 2_200,
      targetTaps: 3,
    },
    {
      id: "hold",
      type: RHYTHM_COMMAND_TYPES.HOLD,
      input: RHYTHM_COMMAND_TYPES.HOLD,
      actionName: "按住煎熟",
      prompt: "按住煎熟！",
      dishStepIndex: 2,
      startAtMs: 0,
      targetAtMs: 800,
      targetHoldMs: 800,
      expireAtMs: 1_600,
    },
  ],
};

function activeCommand(game) {
  return game.getSnapshot().activeCommand;
}

function assertActiveType(game, type) {
  assert.equal(activeCommand(game)?.type, type);
}

function completeTap(game) {
  const command = activeCommand(game);
  assert.equal(command.type, RHYTHM_COMMAND_TYPES.TAP);
  return game.tap(command.targetAtMs);
}

function failTap(game) {
  const command = activeCommand(game);
  assert.equal(command.type, RHYTHM_COMMAND_TYPES.TAP);
  return game.tap(command.targetAtMs + RHYTHM_WINDOWS.TAP.goodMs + 1);
}

function completeMash(game) {
  const command = activeCommand(game);
  assert.equal(command.type, RHYTHM_COMMAND_TYPES.MASH);
  let event = null;
  for (let index = 0; index < command.targetTaps; index += 1) {
    event = game.tap(command.startAtMs + index * 50);
  }
  return event;
}

function failMash(game) {
  assertActiveType(game, RHYTHM_COMMAND_TYPES.MASH);
  return game.resolveCurrentStep(RHYTHM_HIT_QUALITY.MISS, { reason: "testFail" });
}

function completeHold(game) {
  let snapshot = game.getSnapshot();
  let command = snapshot.activeCommand;
  assert.equal(command.type, RHYTHM_COMMAND_TYPES.HOLD);
  const startAtMs = Math.max(command.startAtMs, snapshot.elapsedMs + snapshot.inputGuardRemainingMs);
  assert.equal(game.holdStart(startAtMs).type, "holdStarted");
  snapshot = game.getSnapshot();
  command = snapshot.activeCommand;
  return game.holdEnd(startAtMs + command.targetHoldMs);
}

function failHoldLate(game) {
  const snapshot = game.getSnapshot();
  const command = snapshot.activeCommand;
  assert.equal(command.type, RHYTHM_COMMAND_TYPES.HOLD);
  const startAtMs = Math.max(command.startAtMs, snapshot.elapsedMs + snapshot.inputGuardRemainingMs);
  assert.equal(game.holdStart(startAtMs).type, "holdStarted");
  return game.holdEnd(startAtMs + command.targetHoldMs + RHYTHM_WINDOWS.HOLD.goodMs + 1);
}

function completeEgg(game) {
  assert.equal(completeTap(game).actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assert.equal(completeMash(game).actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  const hit = completeHold(game);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  return hit;
}

function completeEggs(game, count) {
  for (let index = 0; index < count; index += 1) {
    completeEgg(game);
  }
}

function makeGameAtHoldStep() {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeTap(game);
  completeMash(game);
  assertActiveType(game, RHYTHM_COMMAND_TYPES.HOLD);
  return game;
}

test("rhythm TAP uses the narrowed success timing window", () => {
  assert.equal(judgeTimingError(150, RHYTHM_WINDOWS.TAP), RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(judgeTimingError(300, RHYTHM_WINDOWS.TAP), RHYTHM_HIT_QUALITY.GOOD);
  assert.equal(judgeTimingError(301, RHYTHM_WINDOWS.TAP), RHYTHM_HIT_QUALITY.MISS);
});

test("rhythm HOLD uses the narrowed success timing window", () => {
  assert.equal(judgeTimingError(125, RHYTHM_WINDOWS.HOLD), RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(judgeTimingError(290, RHYTHM_WINDOWS.HOLD), RHYTHM_HIT_QUALITY.GOOD);
  assert.equal(judgeTimingError(291, RHYTHM_WINDOWS.HOLD), RHYTHM_HIT_QUALITY.MISS);
});

test("rhythm MASH succeeds only when the progress is full", () => {
  assert.equal(judgeMash(6, 6), RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(judgeMash(5, 6), RHYTHM_HIT_QUALITY.MISS);
});

test("rhythm level one is a 30 second fried egg completion challenge with TAP MASH HOLD", () => {
  assert.equal(RHYTHM_TEST_LEVEL.dishName, "元气煎蛋");
  assert.equal(RHYTHM_TEST_LEVEL.durationMs, 30_000);
  assert.equal(RHYTHM_TEST_LEVEL.actionsPerDish, 3);
  assert.deepEqual(RHYTHM_TEST_LEVEL.starEggs, [2, 4, 6]);
  assert.deepEqual(
    RHYTHM_TEST_LEVEL.commands.slice(0, 3).map((command) => command.actionName),
    ["敲蛋", "打蛋", "煎熟出锅"],
  );
  assert.deepEqual(
    RHYTHM_TEST_LEVEL.commands.slice(0, 3).map((command) => command.input),
    [RHYTHM_COMMAND_TYPES.TAP, RHYTHM_COMMAND_TYPES.MASH, RHYTHM_COMMAND_TYPES.HOLD],
  );
});

test("initial rhythm step is TAP", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  assertActiveType(game, RHYTHM_COMMAND_TYPES.TAP);
  assert.equal(game.getSnapshot().currentDishStepIndex, 0);
});

test("TAP success advances to MASH", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  const hit = completeTap(game);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assertActiveType(game, RHYTHM_COMMAND_TYPES.MASH);
  assert.equal(game.getSnapshot().currentDishStepIndex, 1);
});

test("TAP at the visible success window left edge succeeds", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  const window = getTapSuccessWindow(activeCommand(game));
  const hit = game.tap(window.startMs);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assert.equal(hit.successStartMs, window.startMs);
  assert.equal(hit.successEndMs, window.endMs);
});

test("TAP at the visible success window middle succeeds", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  const window = getTapSuccessWindow(activeCommand(game));
  const hit = game.tap(Math.floor((window.startMs + window.endMs) / 2));
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
});

test("TAP at the visible success window right edge succeeds", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  const window = getTapSuccessWindow(activeCommand(game));
  const hit = game.tap(window.endMs);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
});

test("TAP just beyond the visible success window right edge fails", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  const window = getTapSuccessWindow(activeCommand(game));
  const hit = game.tap(window.endMs + 1);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.FAIL);
});

test("MASH success advances to HOLD", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeTap(game);
  const hit = completeMash(game);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assertActiveType(game, RHYTHM_COMMAND_TYPES.HOLD);
  assert.equal(game.getSnapshot().currentDishStepIndex, 2);
});

test("HOLD at the visible success window left edge succeeds", () => {
  const game = makeGameAtHoldStep();
  const snapshot = game.getSnapshot();
  const command = snapshot.activeCommand;
  const window = getHoldSuccessWindow(command);
  const startAtMs = snapshot.elapsedMs + snapshot.inputGuardRemainingMs;
  game.holdStart(startAtMs);
  const hit = game.holdEnd(startAtMs + window.startMs);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assert.equal(hit.successStartMs, window.startMs);
  assert.equal(hit.successEndMs, window.endMs);
});

test("HOLD at the visible success window middle succeeds", () => {
  const game = makeGameAtHoldStep();
  const snapshot = game.getSnapshot();
  const command = snapshot.activeCommand;
  const window = getHoldSuccessWindow(command);
  const startAtMs = snapshot.elapsedMs + snapshot.inputGuardRemainingMs;
  game.holdStart(startAtMs);
  const hit = game.holdEnd(startAtMs + Math.floor((window.startMs + window.endMs) / 2));
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
});

test("HOLD at the visible success window right edge succeeds", () => {
  const game = makeGameAtHoldStep();
  const snapshot = game.getSnapshot();
  const command = snapshot.activeCommand;
  const window = getHoldSuccessWindow(command);
  const startAtMs = snapshot.elapsedMs + snapshot.inputGuardRemainingMs;
  game.holdStart(startAtMs);
  const hit = game.holdEnd(startAtMs + window.endMs);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
});

test("HOLD just beyond the visible success window right edge fails", () => {
  const game = makeGameAtHoldStep();
  const snapshot = game.getSnapshot();
  const command = snapshot.activeCommand;
  const window = getHoldSuccessWindow(command);
  const startAtMs = snapshot.elapsedMs + snapshot.inputGuardRemainingMs;
  game.holdStart(startAtMs);
  const hit = game.holdEnd(startAtMs + window.endMs + 1);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.FAIL);
});

test("HOLD success completes one egg and returns to next TAP", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeTap(game);
  completeMash(game);
  const hit = completeHold(game);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assert.equal(game.getSnapshot().completedEggs, 1);
  assertActiveType(game, RHYTHM_COMMAND_TYPES.TAP);
  assert.equal(game.getSnapshot().currentDishStepIndex, 0);
});

test("TAP failure starts the next egg at TAP", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  const hit = failTap(game);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.FAIL);
  assert.equal(game.getSnapshot().failedActions, 1);
  assert.equal(game.getSnapshot().completedEggs, 0);
  assertActiveType(game, RHYTHM_COMMAND_TYPES.TAP);
});

test("MASH failure starts the next egg at TAP", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeTap(game);
  const hit = failMash(game);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.FAIL);
  assert.equal(game.getSnapshot().failedActions, 1);
  assert.equal(game.getSnapshot().completedEggs, 0);
  assertActiveType(game, RHYTHM_COMMAND_TYPES.TAP);
});

test("HOLD failure starts the next egg at TAP", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeTap(game);
  completeMash(game);
  const hit = failHoldLate(game);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.FAIL);
  assert.equal(hit.quality, RHYTHM_HIT_QUALITY.MISS);
  assert.equal(game.getSnapshot().failedActions, 1);
  assert.equal(game.getSnapshot().completedEggs, 0);
  assertActiveType(game, RHYTHM_COMMAND_TYPES.TAP);
});

test("HOLD release outside the target zone fails and advances state", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeTap(game);
  completeMash(game);
  const snapshot = game.getSnapshot();
  const command = snapshot.activeCommand;
  const startAtMs = snapshot.elapsedMs + snapshot.inputGuardRemainingMs;
  game.holdStart(startAtMs);
  const hit = game.holdEnd(startAtMs + command.targetHoldMs - RHYTHM_WINDOWS.HOLD.goodMs - 1);
  assert.equal(hit.type, "hit");
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.FAIL);
  assert.equal(game.getSnapshot().failedActions, 1);
  assertActiveType(game, RHYTHM_COMMAND_TYPES.TAP);
});

test("HOLD release resolves only once", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeTap(game);
  completeMash(game);
  const snapshot = game.getSnapshot();
  const command = snapshot.activeCommand;
  const startAtMs = snapshot.elapsedMs + snapshot.inputGuardRemainingMs;
  game.holdStart(startAtMs);
  const first = game.holdEnd(startAtMs + command.targetHoldMs);
  const afterFirst = game.getSnapshot();
  const second = game.holdEnd(startAtMs + command.targetHoldMs + 100);
  const afterSecond = game.getSnapshot();
  assert.equal(first.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assert.equal(second, null);
  assert.equal(afterSecond.successfulActions, afterFirst.successfulActions);
  assert.equal(afterSecond.failedActions, afterFirst.failedActions);
  assert.equal(afterSecond.completedEggs, afterFirst.completedEggs);
});

test("HOLD release freezes the elapsed value and later updates do not change the result", () => {
  const game = makeGameAtHoldStep();
  const snapshot = game.getSnapshot();
  const command = snapshot.activeCommand;
  const window = getHoldSuccessWindow(command);
  const startAtMs = snapshot.elapsedMs + snapshot.inputGuardRemainingMs;
  game.holdStart(startAtMs);
  const hit = game.holdEnd(startAtMs + window.endMs);
  const afterRelease = game.getSnapshot();
  game.update(startAtMs + window.endMs + 100);
  const afterUpdate = game.getSnapshot();
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assert.equal(afterRelease.completedEggs, 1);
  assert.equal(afterUpdate.completedEggs, 1);
  assert.equal(afterUpdate.failedActions, afterRelease.failedActions);
  assert.equal(afterUpdate.holdElapsedMs, 0);
});

test("HOLD progress only grows while the player is holding", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeTap(game);
  completeMash(game);
  const command = activeCommand(game);
  const startAtMs = game.getSnapshot().elapsedMs + game.getSnapshot().inputGuardRemainingMs;
  game.update(startAtMs + 400);
  assert.equal(game.getSnapshot().holdElapsedMs, 0);
  assert.equal(game.getSnapshot().holdActive, false);
  game.holdStart(startAtMs + 500);
  game.update(startAtMs + 850);
  assert.equal(game.getSnapshot().holdActive, true);
  assert.equal(game.getSnapshot().holdElapsedMs, 350);
  game.holdEnd(startAtMs + 500 + command.targetHoldMs);
});

test("HOLD idle does not trigger a step failure", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeTap(game);
  completeMash(game);
  game.update(game.getSnapshot().elapsedMs + 5_000);
  assert.equal(game.getSnapshot().state, "playing");
  assert.equal(game.getSnapshot().holdElapsedMs, 0);
  assert.equal(game.getSnapshot().failedActions, 0);
  assertActiveType(game, RHYTHM_COMMAND_TYPES.HOLD);
});

test("MASH resolves immediately when target taps are reached", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeTap(game);
  const hit = completeMash(game);
  assert.equal(hit.type, "hit");
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assert.equal(game.getSnapshot().successfulActions, 2);
  assertActiveType(game, RHYTHM_COMMAND_TYPES.HOLD);
});

test("MASH does not fail from step timeout if the progress is not full", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeTap(game);
  game.tap(activeCommand(game).startAtMs);
  game.update(game.getSnapshot().elapsedMs + 5_000);
  assert.equal(game.getSnapshot().state, "playing");
  assert.equal(game.getSnapshot().failedActions, 0);
  assert.equal(game.getSnapshot().mashTaps, 1);
  assertActiveType(game, RHYTHM_COMMAND_TYPES.MASH);
});

test("post-MASH input guard ignores residual input before HOLD starts", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeTap(game);
  const hit = completeMash(game);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assert.equal(game.getSnapshot().inputGuardRemainingMs, POST_MASH_INPUT_GUARD_MS);
  const guarded = game.holdStart(game.getSnapshot().elapsedMs + 100);
  assert.equal(guarded.type, "inputGuarded");
  assert.equal(game.getSnapshot().failedActions, 0);
  assertActiveType(game, RHYTHM_COMMAND_TYPES.HOLD);
});

test("TAP input opens within the short prep window", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  const command = game.getSnapshot().activeCommand;
  assert.equal(command.inputStartAtMs - command.startAtMs <= TAP_INPUT_PREP_MS, true);
});

test("reaching the 1 star threshold does not end the level early", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeEggs(game, 2);
  assert.equal(game.getSnapshot().completedEggs, 2);
  assert.equal(game.getSnapshot().state, "playing");
  assert.equal(game.getSnapshot().result, null);
});

test("reaching the 3 star threshold does not end the level early", () => {
  const game = new RhythmCookingGame(LOOP_LEVEL);
  game.start();
  completeEggs(game, 6);
  assert.equal(game.getSnapshot().completedEggs, 6);
  assert.equal(game.getSnapshot().state, "playing");
  assert.equal(game.getSnapshot().result, null);
});

test("rhythm result appears only when countdown reaches zero", () => {
  const game = new RhythmCookingGame({ ...LOOP_LEVEL, durationMs: 10_000 });
  game.start();
  completeEgg(game);
  game.update(9_999);
  assert.equal(game.getSnapshot().state, "playing");
  assert.equal(game.getSnapshot().result, null);
  game.update(10_000);
  assert.equal(game.getSnapshot().state, "ended");
  assert.equal(game.getSnapshot().result.completedEggs, 1);
});

test("second rhythm level does not end early at the 1 star threshold", () => {
  const game = new RhythmCookingGame({ ...RHYTHM_DISH_LEVELS[1], durationMs: 120_000 });
  game.start();
  completeEggs(game, 2);
  assert.equal(game.getSnapshot().completedEggs, 2);
  assert.equal(game.getSnapshot().state, "playing");
  assert.equal(game.getSnapshot().result, null);
});

test("later rhythm levels avoid long fixed waits between steps", () => {
  for (const level of RHYTHM_DISH_LEVELS.slice(1)) {
    const starts = level.commands.map((command) => command.startAtMs);
    for (let index = 1; index < starts.length; index += 1) {
      assert.equal(starts[index] - starts[index - 1] <= 1_200, true);
    }
  }
});

test("rhythm prototype has simple dish names for later levels", () => {
  assert.deepEqual(
    RHYTHM_DISH_LEVELS.map((level) => level.dishName),
    ["元气煎蛋", "黄金蛋液", "早餐拼盘"],
  );
});

test("rhythm game snapshots expose cooking action fields", () => {
  const game = new RhythmCookingGame(RHYTHM_TEST_LEVEL);
  game.start();
  const snapshot = game.getSnapshot();
  assert.equal(snapshot.dishName, "元气煎蛋");
  assert.equal(snapshot.activeCommand.actionName, "敲蛋");
  assert.equal(snapshot.activeCommand.prompt, "敲蛋！");
  assert.equal(snapshot.currentDishActions, 0);
  assert.equal(snapshot.actionsPerDish, 3);
  assert.equal(snapshot.nextCommand.type, RHYTHM_COMMAND_TYPES.MASH);
});

test("2, 4 and 6 completed eggs map to 1, 2 and 3 stars", () => {
  assert.equal(calculateRhythmStarsFromEggs(0), 0);
  assert.equal(calculateRhythmStarsFromEggs(1), 0);
  assert.equal(calculateRhythmStarsFromEggs(2), 1);
  assert.equal(calculateRhythmStarsFromEggs(3), 1);
  assert.equal(calculateRhythmStarsFromEggs(4), 2);
  assert.equal(calculateRhythmStarsFromEggs(5), 2);
  assert.equal(calculateRhythmStarsFromEggs(6), 3);
});

test("rhythm coins use base 20 plus stars and completed eggs", () => {
  assert.equal(calculateRhythmCoins({ stars: 0, completedEggs: 0 }), 20);
  assert.equal(calculateRhythmCoins({ stars: 1, completedEggs: 2 }), 34);
  assert.equal(calculateRhythmCoins({ stars: 3, completedEggs: 6 }), 62);
});

test("rhythm final result uses completed eggs, action counts and coin formula", () => {
  const game = new RhythmCookingGame({ ...LOOP_LEVEL, durationMs: 20_000 });
  game.start();
  completeEggs(game, 2);
  game.update(20_000);
  const result = game.getSnapshot().result;
  assert.equal(result.dishName, "测试煎蛋");
  assert.equal(result.completedEggs, 2);
  assert.equal(result.successfulActions, 6);
  assert.equal(result.failedActions, 0);
  assert.equal(result.stars, 1);
  assert.equal(result.coinsEarned, 34);
});

test("0 star level one result does not unlock level two", () => {
  assert.equal(unlockRhythmLevelIndex(0, 0, 0), 0);
});

test("0 star level one result hides the next-level entrance when locked", () => {
  assert.equal(
    shouldShowRhythmNextLevel({
      activeLevelIndex: 0,
      totalLevels: RHYTHM_DISH_LEVELS.length,
      stars: 0,
      unlockedLevelIndex: 0,
    }),
    false,
  );
});

test("1 star level one result unlocks and shows level two", () => {
  assert.equal(unlockRhythmLevelIndex(0, 0, 1), 1);
  assert.equal(
    shouldShowRhythmNextLevel({
      activeLevelIndex: 0,
      totalLevels: RHYTHM_DISH_LEVELS.length,
      stars: 1,
      unlockedLevelIndex: 0,
    }),
    true,
  );
});

test("last rhythm level never shows the next-level entrance", () => {
  assert.equal(
    shouldShowRhythmNextLevel({
      activeLevelIndex: RHYTHM_DISH_LEVELS.length - 1,
      totalLevels: RHYTHM_DISH_LEVELS.length,
      stars: 3,
      unlockedLevelIndex: RHYTHM_DISH_LEVELS.length - 1,
    }),
    false,
  );
});

test("replaying level one with 0 stars still shows next level if it was already unlocked", () => {
  assert.equal(
    shouldShowRhythmNextLevel({
      activeLevelIndex: 0,
      totalLevels: RHYTHM_DISH_LEVELS.length,
      stars: 0,
      unlockedLevelIndex: 1,
    }),
    true,
  );
});

test("rhythm clock starts only after goal card confirmation", () => {
  assert.equal(
    canRunRhythmClock({
      isActive: true,
      isGoalConfirmed: false,
      gameState: "playing",
    }),
    false,
  );
  assert.equal(
    canRunRhythmClock({
      isActive: true,
      isGoalConfirmed: true,
      gameState: "playing",
    }),
    true,
  );
});

test("result UI hides the live action controls and keeps next level eligibility", () => {
  const state = getRhythmResultUiState({
    activeLevelIndex: 0,
    unlockedLevelIndex: 0,
    result: {
      stars: 2,
    },
  });
  assert.equal(state.showActionButton, false);
  assert.equal(state.actionLabel, "");
  assert.equal(state.showTrack, false);
  assert.equal(state.showCommand, false);
  assert.equal(state.showNextLevel, true);
});

test("rhythm star comments map to result copy", () => {
  const game = new RhythmCookingGame({ ...LOOP_LEVEL, durationMs: 60_000 });
  game.start();
  completeEggs(game, 6);
  game.update(60_000);
  assert.equal(game.getSnapshot().result.starComment, "完美出餐！");
});
