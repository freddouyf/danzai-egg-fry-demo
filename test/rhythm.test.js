import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateRhythmCoins,
  calculateRhythmStarsFromEggs,
  judgeMash,
  judgeTimingError,
  RHYTHM_ACTION_RESULT,
  RHYTHM_HIT_QUALITY,
  RHYTHM_WINDOWS,
  RhythmCookingGame,
  unlockRhythmLevelIndex,
} from "../src/rhythmGame.js";
import {
  RHYTHM_COMMAND_TYPES,
  RHYTHM_DISH_LEVELS,
  RHYTHM_TEST_LEVEL,
} from "../src/rhythmLevels.js";
import { shouldShowRhythmNextLevel } from "../src/rhythmMode.js";

const SMALL_LEVEL = {
  id: "test-rhythm",
  title: "Test Rhythm",
  durationMs: 8_000,
  actionsPerDish: 3,
  starEggs: [1, 2, 3],
  commands: [
    {
      id: "tap",
      type: RHYTHM_COMMAND_TYPES.TAP,
      startAtMs: 0,
      targetAtMs: 1_000,
      expireAtMs: 1_700,
    },
    {
      id: "mash",
      type: RHYTHM_COMMAND_TYPES.MASH,
      startAtMs: 2_000,
      endAtMs: 3_600,
      targetTaps: 6,
    },
    {
      id: "hold",
      type: RHYTHM_COMMAND_TYPES.HOLD,
      startAtMs: 4_000,
      targetAtMs: 5_000,
      expireAtMs: 5_700,
    },
  ],
};

function makeTapLevel(count) {
  return {
    id: `tap-${count}`,
    title: "Tap Dish",
    dishName: "测试煎蛋",
    durationMs: count * 1_000 + 2_000,
    actionsPerDish: 3,
    starEggs: [2, 4, 6],
    commands: Array.from({ length: count }, (_, index) => {
      const startAtMs = index * 900;
      return {
        id: `tap-${index}`,
        type: RHYTHM_COMMAND_TYPES.TAP,
        actionName: index % 3 === 0 ? "敲蛋" : index % 3 === 1 ? "煎蛋" : "出锅",
        prompt: "点击！",
        startAtMs,
        targetAtMs: startAtMs + 300,
        expireAtMs: startAtMs + 700,
      };
    }),
  };
}

test("rhythm TAP uses the narrowed success timing window", () => {
  assert.equal(
    judgeTimingError(150, RHYTHM_WINDOWS.TAP),
    RHYTHM_HIT_QUALITY.PERFECT,
  );
  assert.equal(
    judgeTimingError(300, RHYTHM_WINDOWS.TAP),
    RHYTHM_HIT_QUALITY.GOOD,
  );
  assert.equal(
    judgeTimingError(301, RHYTHM_WINDOWS.TAP),
    RHYTHM_HIT_QUALITY.MISS,
  );
});

test("rhythm HOLD uses the narrowed success timing window", () => {
  assert.equal(
    judgeTimingError(125, RHYTHM_WINDOWS.HOLD),
    RHYTHM_HIT_QUALITY.PERFECT,
  );
  assert.equal(
    judgeTimingError(290, RHYTHM_WINDOWS.HOLD),
    RHYTHM_HIT_QUALITY.GOOD,
  );
  assert.equal(
    judgeTimingError(291, RHYTHM_WINDOWS.HOLD),
    RHYTHM_HIT_QUALITY.MISS,
  );
});

test("rhythm MASH still uses target count and 65 percent success threshold", () => {
  assert.equal(judgeMash(6, 6), RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(judgeMash(4, 6), RHYTHM_HIT_QUALITY.GOOD);
  assert.equal(judgeMash(3, 6), RHYTHM_HIT_QUALITY.MISS);
});

test("MASH tap events expose success threshold and complete readiness", () => {
  const game = new RhythmCookingGame({
    id: "mash-only",
    durationMs: 3_000,
    commands: [
      {
        id: "mash",
        type: RHYTHM_COMMAND_TYPES.MASH,
        startAtMs: 0,
        endAtMs: 2_000,
        targetTaps: 6,
      },
    ],
  });
  game.start();
  let event;
  for (let index = 0; index < 4; index += 1) {
    event = game.tap(index * 120);
  }
  assert.equal(event.goodReady, true);
  assert.equal(event.completeReady, false);

  game.tap(520);
  event = game.tap(640);
  assert.equal(event.goodReady, true);
  assert.equal(event.completeReady, true);
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
  assert.equal(RHYTHM_TEST_LEVEL.commands[0].input, RHYTHM_COMMAND_TYPES.TAP);
  assert.equal(RHYTHM_TEST_LEVEL.commands[1].input, RHYTHM_COMMAND_TYPES.MASH);
  assert.equal(RHYTHM_TEST_LEVEL.commands[2].input, RHYTHM_COMMAND_TYPES.HOLD);
  assert.equal(RHYTHM_TEST_LEVEL.commands[1].targetTaps, 8);
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
});

test("three successful actions complete one fried egg", () => {
  const game = new RhythmCookingGame(SMALL_LEVEL);
  game.start();

  let hit = game.tap(1_000);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assert.equal(game.getSnapshot().completedEggs, 0);
  assert.equal(game.getSnapshot().successfulActions, 1);

  for (let index = 0; index < 6; index += 1) {
    game.tap(2_100 + index * 100);
  }
  game.update(3_700);
  hit = game.drainEvents().findLast((event) => event.type === "hit");
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assert.equal(game.getSnapshot().completedEggs, 0);
  assert.equal(game.getSnapshot().successfulActions, 2);

  game.holdStart(4_000);
  hit = game.holdEnd(5_000);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  assert.equal(game.getSnapshot().completedEggs, 1);
  game.update(5_800);
  assert.equal(game.getSnapshot().state, "ended");
});

test("HOLD progress only grows while the player is holding", () => {
  const game = new RhythmCookingGame({
    id: "hold-progress",
    durationMs: 4_000,
    commands: [
      {
        id: "hold-only",
        type: RHYTHM_COMMAND_TYPES.HOLD,
        startAtMs: 0,
        targetAtMs: 1_000,
        expireAtMs: 2_300,
      },
    ],
  });
  game.start();
  game.update(700);
  assert.equal(game.getSnapshot().holdElapsedMs, 0);
  assert.equal(game.getSnapshot().holdActive, false);

  game.holdStart(800);
  game.update(1_150);
  assert.equal(game.getSnapshot().holdActive, true);
  assert.equal(game.getSnapshot().holdElapsedMs, 350);

  const hit = game.holdEnd(1_800);
  assert.equal(hit.holdDurationMs, 1_000);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
});

test("HOLD can start immediately after switching to the HOLD action", () => {
  const game = new RhythmCookingGame({
    id: "tap-then-hold",
    durationMs: 4_000,
    commands: [
      {
        id: "tap",
        type: RHYTHM_COMMAND_TYPES.TAP,
        startAtMs: 0,
        targetAtMs: 500,
        expireAtMs: 900,
      },
      {
        id: "hold",
        type: RHYTHM_COMMAND_TYPES.HOLD,
        startAtMs: 901,
        targetAtMs: 1_701,
        targetHoldMs: 800,
        expireAtMs: 2_500,
      },
    ],
  });
  game.start();
  assert.equal(game.tap(500).actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  const started = game.holdStart(901);
  assert.equal(started.type, "holdStarted");
  assert.equal(game.getSnapshot().holdActive, true);
});

test("HOLD times out as a failed action if the player never holds", () => {
  const game = new RhythmCookingGame({
    id: "hold-timeout",
    durationMs: 4_000,
    commands: [
      {
        id: "hold-only",
        type: RHYTHM_COMMAND_TYPES.HOLD,
        startAtMs: 0,
        targetAtMs: 1_000,
        expireAtMs: 1_900,
      },
    ],
  });
  game.start();
  game.update(2_000);
  const miss = game.drainEvents().findLast((event) => event.type === "hit");
  assert.equal(miss.actionResult, RHYTHM_ACTION_RESULT.FAIL);
  assert.equal(miss.reason, "timeout");
  assert.equal(game.getSnapshot().failedActions, 1);
});

test("TAP and HOLD success or failure are recorded as action results", () => {
  const game = new RhythmCookingGame({
    id: "tap-hold-record",
    durationMs: 4_000,
    commands: [
      {
        id: "tap",
        type: RHYTHM_COMMAND_TYPES.TAP,
        startAtMs: 0,
        targetAtMs: 1_000,
        expireAtMs: 1_700,
      },
      {
        id: "hold",
        type: RHYTHM_COMMAND_TYPES.HOLD,
        startAtMs: 2_000,
        targetAtMs: 3_000,
        expireAtMs: 3_700,
      },
    ],
  });
  game.start();

  assert.equal(game.tap(1_000).actionResult, RHYTHM_ACTION_RESULT.SUCCESS);
  game.holdStart(2_000);
  assert.equal(game.holdEnd(2_200).actionResult, RHYTHM_ACTION_RESULT.FAIL);

  const snapshot = game.getSnapshot();
  assert.equal(snapshot.successfulActions, 1);
  assert.equal(snapshot.failedActions, 1);
  assert.equal(snapshot.completedEggs, 0);
});

test("TAP outside the success window is recorded as a failed action", () => {
  const game = new RhythmCookingGame(SMALL_LEVEL);
  game.start();
  const hit = game.tap(500);
  assert.equal(hit.actionResult, RHYTHM_ACTION_RESULT.FAIL);
  assert.equal(hit.reason, "tooEarly");
  assert.equal(game.getSnapshot().failedActions, 1);
});

test("2, 4 and 6 completed eggs map to 1, 2 and 3 stars", () => {
  assert.equal(calculateRhythmStarsFromEggs(0), 0);
  assert.equal(calculateRhythmStarsFromEggs(2), 1);
  assert.equal(calculateRhythmStarsFromEggs(4), 2);
  assert.equal(calculateRhythmStarsFromEggs(5), 2);
  assert.equal(calculateRhythmStarsFromEggs(6), 3);
});

test("rhythm coins use base 20 plus stars and completed eggs", () => {
  assert.equal(calculateRhythmCoins({ stars: 0, completedEggs: 0 }), 20);
  assert.equal(calculateRhythmCoins({ stars: 1, completedEggs: 2 }), 34);
  assert.equal(calculateRhythmCoins({ stars: 3, completedEggs: 6 }), 62);
});

test("rhythm final result uses completed eggs, action counts and new coin formula", () => {
  const game = new RhythmCookingGame(makeTapLevel(6));
  game.start();
  for (let index = 0; index < 6; index += 1) {
    const startAtMs = index * 900;
    game.tap(startAtMs + 300);
  }
  game.update(6_000);
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

test("1 star level one result unlocks level two", () => {
  assert.equal(unlockRhythmLevelIndex(0, 0, 1), 1);
});

test("1 star level one result shows the next-level entrance", () => {
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

test("rhythm star comments map to result copy", () => {
  const game = new RhythmCookingGame(makeTapLevel(18));
  game.start();
  for (let index = 0; index < 18; index += 1) {
    const startAtMs = index * 900;
    game.tap(startAtMs + 300);
  }
  game.update(18_000);
  assert.equal(game.getSnapshot().result.starComment, "完美出餐！");
});
