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
  actionVisuals,
  canRunRhythmClock,
  formatRhythmLevelInfo,
  getRhythmMapCards,
  getRhythmResultUiState,
  shouldShowRhythmNextLevel,
} from "../src/rhythmMode.js";
import {
  createDefaultRhythmProgress,
  getRhythmResultProgressUpdate,
  isRhythmLevelUnlocked,
  recordRhythmLevelResult,
} from "../src/rhythmProgress.js";

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
  const startEggs = game.getSnapshot().completedEggs;
  let hit = null;
  let guard = 0;
  while (game.getSnapshot().completedEggs === startEggs && guard < 8) {
    const command = activeCommand(game);
    if (command.type === RHYTHM_COMMAND_TYPES.TAP) {
      hit = completeTap(game);
    } else if (command.type === RHYTHM_COMMAND_TYPES.MASH) {
      hit = completeMash(game);
    } else if (command.type === RHYTHM_COMMAND_TYPES.HOLD) {
      hit = completeHold(game);
    }
    assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
    guard += 1;
  }
  assert.equal(game.getSnapshot().completedEggs, startEggs + 1);
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
    ["敲蛋", "快速打蛋", "按住煎熟"],
  );
  assert.deepEqual(
    RHYTHM_TEST_LEVEL.commands.slice(0, 3).map((command) => command.input),
    [RHYTHM_COMMAND_TYPES.TAP, RHYTHM_COMMAND_TYPES.MASH, RHYTHM_COMMAND_TYPES.HOLD],
  );
});

test("breakfast street level one is a 3 step dish", () => {
  assert.equal(RHYTHM_DISH_LEVELS[0].actionsPerDish, 3);
  assert.deepEqual(
    RHYTHM_DISH_LEVELS[0].commands.map((command) => command.input),
    [RHYTHM_COMMAND_TYPES.TAP, RHYTHM_COMMAND_TYPES.MASH, RHYTHM_COMMAND_TYPES.HOLD],
  );
});

test("level one steps expose reusable visual keys", () => {
  assert.deepEqual(
    RHYTHM_DISH_LEVELS[0].commands.map((command) => command.visualKey),
    ["crack", "whisk", "fry-egg"],
  );
});

test("breakfast street level two is a 4 step dish", () => {
  assert.equal(RHYTHM_DISH_LEVELS[1].dishName, "黄金蛋卷");
  assert.equal(RHYTHM_DISH_LEVELS[1].actionsPerDish, 4);
  assert.deepEqual(
    RHYTHM_DISH_LEVELS[1].commands.map((command) => command.input),
    [
      RHYTHM_COMMAND_TYPES.TAP,
      RHYTHM_COMMAND_TYPES.MASH,
      RHYTHM_COMMAND_TYPES.HOLD,
      RHYTHM_COMMAND_TYPES.TAP,
    ],
  );
});

test("level two steps expose reusable visual keys", () => {
  assert.deepEqual(
    RHYTHM_DISH_LEVELS[1].commands.map((command) => command.visualKey),
    ["crack", "whisk", "omelette-fry", "roll"],
  );
});

test("breakfast street level three is a 5 step dish", () => {
  assert.equal(RHYTHM_DISH_LEVELS[2].actionsPerDish, 5);
  assert.deepEqual(
    RHYTHM_DISH_LEVELS[2].commands.map((command) => command.input),
    [
      RHYTHM_COMMAND_TYPES.TAP,
      RHYTHM_COMMAND_TYPES.HOLD,
      RHYTHM_COMMAND_TYPES.TAP,
      RHYTHM_COMMAND_TYPES.MASH,
      RHYTHM_COMMAND_TYPES.TAP,
    ],
  );
});

test("level three steps expose reusable visual keys", () => {
  assert.deepEqual(
    RHYTHM_DISH_LEVELS[2].commands.map((command) => command.visualKey),
    ["toast", "bake", "egg-on-plate", "stir", "plate"],
  );
});

test("all rhythm visual keys have UI mappings", () => {
  for (const level of RHYTHM_DISH_LEVELS) {
    for (const command of level.commands) {
      assert.ok(actionVisuals[command.visualKey], `${command.id} missing visual mapping`);
    }
  }
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

test("HOLD just before the visible success window left edge fails", () => {
  const game = makeGameAtHoldStep();
  const snapshot = game.getSnapshot();
  const command = snapshot.activeCommand;
  const window = getHoldSuccessWindow(command);
  const startAtMs = snapshot.elapsedMs + snapshot.inputGuardRemainingMs;
  game.holdStart(startAtMs);
  const hit = game.holdEnd(startAtMs + window.startMs - 1);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.FAIL);
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

test("early rhythm levels use progressively faster TAP tracks", () => {
  const levelOne = new RhythmCookingGame(RHYTHM_DISH_LEVELS[0]);
  const levelTwo = new RhythmCookingGame(RHYTHM_DISH_LEVELS[1]);
  const levelThree = new RhythmCookingGame(RHYTHM_DISH_LEVELS[2]);
  levelOne.start();
  levelTwo.start();
  levelThree.start();
  const tapDurationOne = activeCommand(levelOne).expireAtMs - activeCommand(levelOne).startAtMs;
  const tapDurationTwo = activeCommand(levelTwo).expireAtMs - activeCommand(levelTwo).startAtMs;
  const tapDurationThree = activeCommand(levelThree).expireAtMs - activeCommand(levelThree).startAtMs;
  assert.equal(tapDurationOne, 1_500);
  assert.equal(tapDurationTwo, 1_300);
  assert.equal(tapDurationThree, 1_100);
  assert.equal(tapDurationOne > tapDurationTwo, true);
  assert.equal(tapDurationTwo > tapDurationThree, true);
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
    ["元气煎蛋", "黄金蛋卷", "早餐拼盘"],
  );
});

test("rhythm HUD level info exposes the current level number and dish name", () => {
  assert.deepEqual(formatRhythmLevelInfo(0, RHYTHM_DISH_LEVELS[0]), {
    levelText: "第 1 关",
    dishText: "元气煎蛋",
  });
  assert.deepEqual(formatRhythmLevelInfo(2, RHYTHM_DISH_LEVELS[2]), {
    levelText: "第 3 关",
    dishText: "早餐拼盘",
  });
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

test("level two uses 2, 4 and 6 completed dishes for 1, 2 and 3 stars", () => {
  const thresholds = RHYTHM_DISH_LEVELS[1].starEggs;
  assert.equal(calculateRhythmStarsFromEggs(1, thresholds), 0);
  assert.equal(calculateRhythmStarsFromEggs(2, thresholds), 1);
  assert.equal(calculateRhythmStarsFromEggs(4, thresholds), 2);
  assert.equal(calculateRhythmStarsFromEggs(6, thresholds), 3);
});

test("level three uses 1, 3 and 5 completed dishes for 1, 2 and 3 stars", () => {
  const thresholds = RHYTHM_DISH_LEVELS[2].starEggs;
  assert.equal(calculateRhythmStarsFromEggs(0, thresholds), 0);
  assert.equal(calculateRhythmStarsFromEggs(1, thresholds), 1);
  assert.equal(calculateRhythmStarsFromEggs(3, thresholds), 2);
  assert.equal(calculateRhythmStarsFromEggs(5, thresholds), 3);
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

test("rhythm progress unlocks level two and level three with at least one star", () => {
  const initial = createDefaultRhythmProgress(RHYTHM_DISH_LEVELS.length);
  assert.equal(isRhythmLevelUnlocked(initial, 0), true);
  assert.equal(isRhythmLevelUnlocked(initial, 1), false);
  const afterLevelOne = recordRhythmLevelResult(initial, 0, 1, RHYTHM_DISH_LEVELS.length);
  assert.equal(afterLevelOne.unlockedLevelIndex, 1);
  assert.equal(isRhythmLevelUnlocked(afterLevelOne, 1), true);
  const afterLevelTwo = recordRhythmLevelResult(afterLevelOne, 1, 1, RHYTHM_DISH_LEVELS.length);
  assert.equal(afterLevelTwo.unlockedLevelIndex, 2);
  assert.equal(isRhythmLevelUnlocked(afterLevelTwo, 2), true);
});

test("replaying an unlocked rhythm level never lowers best stars", () => {
  const initial = createDefaultRhythmProgress(RHYTHM_DISH_LEVELS.length);
  const threeStar = recordRhythmLevelResult(initial, 0, 3, RHYTHM_DISH_LEVELS.length);
  const replayLoss = recordRhythmLevelResult(threeStar, 0, 1, RHYTHM_DISH_LEVELS.length);
  assert.equal(replayLoss.bestStarsByLevel[0], 3);
  assert.equal(replayLoss.unlockedLevelIndex, 1);
});

test("rhythm progress update reports new best stars and unlocked next level", () => {
  const initial = createDefaultRhythmProgress(RHYTHM_DISH_LEVELS.length);
  const firstClear = getRhythmResultProgressUpdate(initial, 0, 2, RHYTHM_DISH_LEVELS.length);
  assert.equal(firstClear.newBestStars, true);
  assert.equal(firstClear.unlockedNext, true);
  assert.equal(firstClear.progress.bestStarsByLevel[0], 2);
  assert.equal(firstClear.progress.unlockedLevelIndex, 1);

  const lowerReplay = getRhythmResultProgressUpdate(firstClear.progress, 0, 1, RHYTHM_DISH_LEVELS.length);
  assert.equal(lowerReplay.newBestStars, false);
  assert.equal(lowerReplay.unlockedNext, false);
  assert.equal(lowerReplay.progress.bestStarsByLevel[0], 2);
});

test("rhythm map cards expose lock state, best stars and star goals", () => {
  const progress = recordRhythmLevelResult(
    createDefaultRhythmProgress(RHYTHM_DISH_LEVELS.length),
    0,
    2,
    RHYTHM_DISH_LEVELS.length,
  );
  const cards = getRhythmMapCards(RHYTHM_DISH_LEVELS, progress);
  assert.equal(cards[0].unlocked, true);
  assert.equal(cards[0].bestStars, 2);
  assert.equal(cards[0].goalText, "2 个 = ★ · 4 个 = ★★ · 6 个 = ★★★");
  assert.equal(cards[1].unlocked, true);
  assert.equal(cards[2].unlocked, false);
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
