import test from "node:test";
import assert from "node:assert/strict";

import {
  collectionProgress,
  discoverEvent,
  normalizeProgress,
  recordRun,
} from "../src/progression.js";

const eventIds = ["a", "b", "c"];

test("损坏的本地战绩会被归一化", () => {
  const progress = normalizeProgress(
    {
      bestScore: -12,
      bestLevel: "4",
      discoveredEvents: ["a", "a", "missing"],
    },
    eventIds,
  );
  assert.equal(progress.bestScore, 0);
  assert.equal(progress.bestLevel, 4);
  assert.deepEqual(progress.discoveredEvents, ["a"]);
});

test("首次遇到事件会解锁图鉴，重复事件不会重复增加", () => {
  const first = discoverEvent({}, "b", eventIds);
  assert.equal(first.isNew, true);
  assert.deepEqual(first.progress.discoveredEvents, ["b"]);

  const repeated = discoverEvent(first.progress, "b", eventIds);
  assert.equal(repeated.isNew, false);
  assert.deepEqual(repeated.progress.discoveredEvents, ["b"]);
});

test("整轮结算会累加统计并识别新纪录", () => {
  const result = recordRun(
    {
      bestScore: 500,
      bestLevel: 2,
      bestCombo: 4,
      totalRuns: 2,
      totalCoinsEarned: 20,
    },
    {
      totalScore: 900,
      levelReached: 2,
      bestCombo: 7,
      eggsCooked: 8,
      perfectEggs: 3,
      coinsEarned: 18,
    },
    eventIds,
  );
  assert.equal(result.hasNewRecord, true);
  assert.deepEqual(result.records, { score: true, level: false, combo: true });
  assert.equal(result.progress.totalRuns, 3);
  assert.equal(result.progress.totalCoinsEarned, 38);
  assert.equal(result.progress.totalEggs, 8);
});

test("收藏进度会限制范围并计算整数百分比", () => {
  assert.deepEqual(collectionProgress(5, 12), {
    count: 5,
    total: 12,
    percent: 42,
  });
  assert.equal(collectionProgress(20, 8).percent, 100);
});
