import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateRhythmCoins,
  calculateRhythmStars,
  judgeMash,
  judgeTimingError,
  RHYTHM_HIT_QUALITY,
  RhythmCookingGame,
} from "../src/rhythmGame.js";
import { RHYTHM_COMMAND_TYPES } from "../src/rhythmLevels.js";

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

test("rhythm timing windows classify Perfect, Good and Miss", () => {
  assert.equal(
    judgeTimingError(110, { perfectMs: 120, goodMs: 260 }),
    RHYTHM_HIT_QUALITY.PERFECT,
  );
  assert.equal(
    judgeTimingError(240, { perfectMs: 120, goodMs: 260 }),
    RHYTHM_HIT_QUALITY.GOOD,
  );
  assert.equal(
    judgeTimingError(300, { perfectMs: 120, goodMs: 260 }),
    RHYTHM_HIT_QUALITY.MISS,
  );
});

test("rhythm mash uses target count and 65 percent Good threshold", () => {
  assert.equal(judgeMash(6, 6), RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(judgeMash(4, 6), RHYTHM_HIT_QUALITY.GOOD);
  assert.equal(judgeMash(3, 6), RHYTHM_HIT_QUALITY.MISS);
});

test("rhythm game handles TAP, HOLD, MASH and combo", () => {
  const game = new RhythmCookingGame(SMALL_LEVEL);
  game.start();

  let hit = game.tap(1_000);
  assert.equal(hit.quality, RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(game.getSnapshot().combo, 1);
  assert.equal(game.getSnapshot().perfectCount, 1);

  game.holdStart(2_150);
  hit = game.holdEnd(3_280);
  assert.equal(hit.quality, RHYTHM_HIT_QUALITY.GOOD);
  assert.equal(game.getSnapshot().combo, 2);
  assert.equal(game.getSnapshot().perfectCount, 1);

  for (let index = 0; index < 6; index += 1) {
    game.tap(4_100 + index * 100);
  }
  game.update(5_700);
  hit = game.drainEvents().findLast((event) => event.type === "hit");
  assert.equal(hit.quality, RHYTHM_HIT_QUALITY.PERFECT);
  assert.equal(game.getSnapshot().bestCombo, 3);
  assert.equal(game.getSnapshot().state, "ended");
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

test("rhythm stars and coins use base 20 plus 10 per star", () => {
  assert.equal(calculateRhythmStars(0, 1_000), 0);
  assert.equal(calculateRhythmStars(300, 1_000), 1);
  assert.equal(calculateRhythmStars(540, 1_000), 2);
  assert.equal(calculateRhythmStars(800, 1_000), 3);
  assert.equal(calculateRhythmCoins(0), 20);
  assert.equal(calculateRhythmCoins(3), 50);
});
