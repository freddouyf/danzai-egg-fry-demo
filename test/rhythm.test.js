import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateRhythmCoins,
  calculateRhythmStars,
  getRhythmStarComment,
  judgeMash,
  judgeTimingError,
  RHYTHM_HIT_QUALITY,
  RHYTHM_WINDOWS,
  RhythmCookingGame,
} from "../src/rhythmGame.js";
import {
  RHYTHM_COMMAND_TYPES,
  RHYTHM_DISH_LEVELS,
  RHYTHM_TEST_LEVEL,
} from "../src/rhythmLevels.js";

const SMALL_LEVEL = {
  id: "test-rhythm",
  title: "Test Rhythm",
  durationMs: 8_000,
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
    {
      id: "mash",
      type: RHYTHM_COMMAND_TYPES.MASH,
      startAtMs: 4_000,
      endAtMs: 5_600,
      targetTaps: 6,
    },
  ],
};

test("rhythm TAP uses the loose prototype timing window", () => {
  assert.equal(
    judgeTimingError(180, RHYTHM_WINDOWS.TAP),
    RHYTHM_HIT_QUALITY.PERFECT,
  );
  assert.equal(
    judgeTimingError(360, RHYTHM_WINDOWS.TAP),
    RHYTHM_HIT_QUALITY.GOOD,
  );
  assert.equal(
    judgeTimingError(361, RHYTHM_WINDOWS.TAP),
    RHYTHM_HIT_QUALITY.MISS,
  );
});

test("rhythm mash uses target count and 65 percent Good threshold", () => {
  assert.equal(judgeMash(6, 6), RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(judgeMash(4, 6), RHYTHM_HIT_QUALITY.GOOD);
  assert.equal(judgeMash(3, 6), RHYTHM_HIT_QUALITY.MISS);
});

test("rhythm dish level exposes dish name and action prompts", () => {
  assert.equal(RHYTHM_TEST_LEVEL.dishName, "元气煎蛋");
  assert.equal(RHYTHM_TEST_LEVEL.commands.length, 8);
  assert.deepEqual(
    RHYTHM_TEST_LEVEL.commands.map((command) => command.actionName),
    ["敲蛋", "打蛋", "下锅", "煎蛋", "撒盐", "翻炒", "控火", "出锅"],
  );
  assert.equal(RHYTHM_TEST_LEVEL.commands[0].prompt, "敲蛋！");
  assert.equal(RHYTHM_TEST_LEVEL.commands[1].input, RHYTHM_COMMAND_TYPES.MASH);
});

test("rhythm prototype has simple dish names for later levels", () => {
  assert.deepEqual(
    RHYTHM_DISH_LEVELS.map((level) => level.dishName),
    ["元气煎蛋", "黄金蛋液", "早餐拼盘"],
  );
});

test("rhythm game snapshots expose current dish action fields", () => {
  const game = new RhythmCookingGame(RHYTHM_TEST_LEVEL);
  game.start();
  const snapshot = game.getSnapshot();
  assert.equal(snapshot.dishName, "元气煎蛋");
  assert.equal(snapshot.activeCommand.actionName, "敲蛋");
  assert.equal(snapshot.activeCommand.prompt, "敲蛋！");
  assert.equal(snapshot.activeCommand.helperText, "看准节奏点击");
});

test("rhythm game handles TAP, HOLD, MASH and combo", () => {
  const game = new RhythmCookingGame(SMALL_LEVEL);
  game.start();

  let hit = game.tap(1_000);
  assert.equal(hit.quality, RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(game.getSnapshot().combo, 1);
  assert.equal(game.getSnapshot().perfectCount, 1);

  game.holdStart(2_150);
  hit = game.holdEnd(3_150);
  assert.equal(hit.quality, RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(game.getSnapshot().combo, 2);
  assert.equal(game.getSnapshot().perfectCount, 2);

  for (let index = 0; index < 6; index += 1) {
    game.tap(4_100 + index * 100);
  }
  game.update(5_700);
  hit = game.drainEvents().findLast((event) => event.type === "hit");
  assert.equal(hit.quality, RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(game.getSnapshot().bestCombo, 3);
  assert.equal(game.getSnapshot().state, "ended");
});

test("rhythm TAP ignores preview taps before the Good window", () => {
  const game = new RhythmCookingGame(SMALL_LEVEL);
  game.start();

  const early = game.tap(500);
  assert.equal(early.type, "earlyTapIgnored");
  assert.equal(game.getSnapshot().combo, 0);
  assert.equal(game.getSnapshot().commandIndex, 0);

  const hit = game.tap(820);
  assert.equal(hit.quality, RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(game.getSnapshot().combo, 1);
});

test("rhythm HOLD progress only grows while the player is holding", () => {
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
  assert.equal(hit.quality, RHYTHM_HIT_QUALITY.PERFECT);
});

test("rhythm HOLD times out as Miss if the player never holds", () => {
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
  assert.equal(miss.quality, RHYTHM_HIT_QUALITY.MISS);
  assert.equal(miss.reason, "timeout");
  assert.equal(game.getSnapshot().combo, 0);
  assert.equal(game.getSnapshot().missCount, 1);
});

test("rhythm Miss clears combo and increments miss count", () => {
  const game = new RhythmCookingGame(SMALL_LEVEL);
  game.start();
  game.tap(1_000);

  game.update(3_800);
  const miss = game.drainEvents().findLast((event) => event.type === "hit");
  assert.equal(miss.quality, RHYTHM_HIT_QUALITY.MISS);
  const snapshot = game.getSnapshot();
  assert.equal(snapshot.combo, 0);
  assert.equal(snapshot.missCount, 1);
});

test("rhythm Good and Perfect increase combo while Miss clears it", () => {
  const game = new RhythmCookingGame(SMALL_LEVEL);
  game.start();

  assert.equal(game.tap(1_000).quality, RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(game.getSnapshot().combo, 1);

  game.holdStart(2_000);
  assert.equal(game.holdEnd(3_300).quality, RHYTHM_HIT_QUALITY.GOOD);
  assert.equal(game.getSnapshot().combo, 2);

  game.update(5_700);
  const miss = game.drainEvents().findLast((event) => event.type === "hit");
  assert.equal(miss.quality, RHYTHM_HIT_QUALITY.MISS);
  assert.equal(game.getSnapshot().combo, 0);
});

test("rhythm stars and coins use base 20 plus 10 per star", () => {
  assert.equal(calculateRhythmStars(0, 1_000), 0);
  assert.equal(calculateRhythmStars(300, 1_000), 1);
  assert.equal(calculateRhythmStars(540, 1_000), 2);
  assert.equal(calculateRhythmStars(800, 1_000), 3);
  assert.equal(calculateRhythmCoins(0), 20);
  assert.equal(calculateRhythmCoins(3), 50);
});

test("rhythm final result includes dish name and star comment", () => {
  const game = new RhythmCookingGame({
    id: "single-dish",
    title: "Single Dish",
    dishName: "测试煎蛋",
    durationMs: 3_000,
    commands: [
      {
        id: "serve",
        input: RHYTHM_COMMAND_TYPES.TAP,
        actionName: "出锅",
        prompt: "出锅！",
        helperText: "点击完成",
        startAtMs: 0,
        targetAtMs: 1_000,
        expireAtMs: 1_700,
      },
    ],
  });
  game.start();
  game.tap(1_000);
  game.update(1_100);
  const result = game.getSnapshot().result;
  assert.equal(result.dishName, "测试煎蛋");
  assert.equal(result.stars, 3);
  assert.equal(result.starComment, "完美出餐！");
});

test("rhythm star comments map to result copy", () => {
  assert.equal(getRhythmStarComment(3), "完美出餐！");
  assert.equal(getRhythmStarComment(2), "香气不错！");
  assert.equal(getRhythmStarComment(1), "能吃就行！");
  assert.equal(getRhythmStarComment(0), "旦仔还要练练！");
});
