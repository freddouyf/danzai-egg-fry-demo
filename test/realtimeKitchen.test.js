import test from "node:test";
import assert from "node:assert/strict";
import {
  judgeHoldAction,
  judgeMashAction,
  judgeSwipeAction,
  RealtimeKitchenGame,
} from "../src/realtimeKitchenGame.js";

test("realtime kitchen initializes with two orders", () => {
  const game = new RealtimeKitchenGame();
  const snapshot = game.getSnapshot();

  assert.equal(snapshot.state, "playing");
  assert.equal(snapshot.orders.length, 2);
  assert.equal(snapshot.coins, 0);
  assert.equal(snapshot.chaos, 0);
});

test("update reduces time and customer patience", () => {
  const game = new RealtimeKitchenGame();
  const before = game.getSnapshot();
  game.update(1000);
  const after = game.getSnapshot();

  assert.equal(after.remainingMs, before.remainingMs - 1000);
  assert.equal(after.orders[0].remainingPatienceMs, before.orders[0].remainingPatienceMs - 1000);
});

test("timed out orders fail and increase chaos", () => {
  const game = new RealtimeKitchenGame();
  game.update(30000);
  const snapshot = game.getSnapshot();

  assert.ok(snapshot.failedOrders > 0);
  assert.ok(snapshot.chaos >= 2);
  assert.equal(snapshot.orders.length, 2);
});

test("selectOrder sets active order", () => {
  const game = new RealtimeKitchenGame();
  const order = game.getSnapshot().orders[0];
  game.selectOrder(order.instanceId);

  assert.equal(game.getSnapshot().activeOrder.instanceId, order.instanceId);
});

test("successful actions advance steps", () => {
  const game = new RealtimeKitchenGame();
  const order = game.getSnapshot().orders[0];
  game.selectOrder(order.instanceId);
  game.completeTap();

  const snapshot = game.getSnapshot();
  assert.equal(snapshot.activeActionIndex, 1);
  assert.equal(snapshot.activeAction.type, "hold");
});

test("completing all actions finishes order and grants coins", () => {
  const game = new RealtimeKitchenGame();
  const order = game.getSnapshot().orders[0];
  game.selectOrder(order.instanceId);
  game.completeTap();
  game.completeHold(900);

  const snapshot = game.getSnapshot();
  assert.equal(snapshot.completedOrders, 1);
  assert.equal(snapshot.coins, order.rewardCoins);
  assert.equal(snapshot.activeOrder, null);
});

test("failed action increases chaos", () => {
  const game = new RealtimeKitchenGame();
  const order = game.getSnapshot().orders[0];
  game.selectOrder(order.instanceId);
  game.completeTap();
  game.completeHold(100);

  const snapshot = game.getSnapshot();
  assert.equal(snapshot.failedActions, 1);
  assert.equal(snapshot.chaos, 1);
});

test("run ends when 60 seconds expire", () => {
  const game = new RealtimeKitchenGame();
  game.update(60000);

  assert.equal(game.getSnapshot().state, "ended");
});

test("run ends early when chaos reaches max", () => {
  const game = new RealtimeKitchenGame();
  game.chaos = 9;
  const order = game.getSnapshot().orders[0];
  game.selectOrder(order.instanceId);
  game.completeTap();
  game.completeHold(100);

  assert.equal(game.getSnapshot().state, "ended");
});

test("realtime kitchen numeric fields never become NaN", () => {
  const game = new RealtimeKitchenGame();
  game.update(Number.NaN);
  const snapshot = game.getSnapshot();

  [
    snapshot.remainingMs,
    snapshot.coins,
    snapshot.chaos,
    snapshot.completedOrders,
    snapshot.failedOrders,
  ].forEach((value) => assert.equal(Number.isFinite(value), true));
});

test("realtime action judges cover hold mash and swipe", () => {
  assert.equal(judgeHoldAction({ targetMs: 1000, windowMs: 200, maxMs: 1600 }, 1000), true);
  assert.equal(judgeHoldAction({ targetMs: 1000, windowMs: 200, maxMs: 1600 }, 300), false);
  assert.equal(judgeMashAction({ targetTaps: 5 }, 5), true);
  assert.equal(judgeMashAction({ targetTaps: 5 }, 4), false);
  assert.equal(judgeSwipeAction({ minDistancePx: 70 }, 80), true);
  assert.equal(judgeSwipeAction({ minDistancePx: 70 }, 20), false);
});
