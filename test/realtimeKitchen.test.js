import test from "node:test";
import assert from "node:assert/strict";
import {
  judgeHoldAction,
  judgeMashAction,
  judgeSwipeAction,
  RealtimeKitchenGame,
} from "../src/realtimeKitchenGame.js";

test("realtime kitchen initializes the first customer order", () => {
  const game = new RealtimeKitchenGame();
  const snapshot = game.getSnapshot();

  assert.equal(snapshot.state, "playing");
  assert.equal(snapshot.currentOrder.dishName, "快手煎蛋");
  assert.equal(snapshot.currentStep.type, "ingredient");
  assert.equal(snapshot.currentStep.ingredientId, "egg");
  assert.equal(snapshot.currentStep.targetId, "pan");
});

test("service target is three customers", () => {
  const game = new RealtimeKitchenGame();
  assert.equal(game.getSnapshot().serviceTarget, 3);
});

test("two walked out customers fail the level", () => {
  const game = new RealtimeKitchenGame();
  game.update(999999);
  assert.equal(game.getSnapshot().walkedOutCustomers, 1);
  assert.equal(game.getSnapshot().state, "playing");

  game.update(999999);
  const snapshot = game.getSnapshot();
  assert.equal(snapshot.walkedOutCustomers, 2);
  assert.equal(snapshot.state, "ended");
  assert.equal(snapshot.result.passed, false);
});

test("correct ingredient drop advances the step", () => {
  const game = new RealtimeKitchenGame();
  game.dropIngredient("egg", "pan");
  const snapshot = game.getSnapshot();

  assert.equal(snapshot.currentStep.type, "action");
  assert.equal(snapshot.currentStep.actionType, "tap");
});

test("wrong ingredient drop does not advance and costs patience", () => {
  const game = new RealtimeKitchenGame();
  const before = game.getSnapshot();
  game.dropIngredient("scallion", "pan");
  const after = game.getSnapshot();

  assert.equal(after.currentStepIndex, before.currentStepIndex);
  assert.equal(after.currentOrder.remainingPatienceMs, before.currentOrder.remainingPatienceMs - 1000);
  assert.equal(after.lastFeedback, "不是这个食材！");
});

test("TAP success advances", () => {
  const game = new RealtimeKitchenGame();
  game.dropIngredient("egg", "pan");
  game.completeTap();

  assert.equal(game.getSnapshot().currentStep.actionType, "hold");
});

test("HOLD success window is inclusive", () => {
  const action = { targetMs: 1000, windowMs: 200, maxMs: 1600 };
  assert.equal(judgeHoldAction(action, 800), true);
  assert.equal(judgeHoldAction(action, 1000), true);
  assert.equal(judgeHoldAction(action, 1200), true);
  assert.equal(judgeHoldAction(action, 799), false);
  assert.equal(judgeHoldAction(action, 1201), false);
});

test("MASH reaching target advances", () => {
  const game = new RealtimeKitchenGame();
  game.dropIngredient("egg", "pan");
  game.completeTap();
  game.completeHold(900);
  game.completeSwipe(90);
  game.dropIngredient("egg", "pan");
  game.completeHold(1000);
  game.dropIngredient("bread", "plate");
  game.completeSwipe(100);
  game.dropIngredient("egg", "pan");
  game.dropIngredient("chili", "pan");
  assert.equal(game.getSnapshot().currentStep.actionType, "mash");

  game.completeMash(8);
  assert.equal(game.getSnapshot().currentStep.actionType, "swipe");
});

test("SWIPE reaching target advances", () => {
  const game = new RealtimeKitchenGame();
  game.dropIngredient("egg", "pan");
  game.completeTap();
  game.completeHold(900);
  assert.equal(game.getSnapshot().currentStep.actionType, "swipe");

  game.completeSwipe(90);
  const snapshot = game.getSnapshot();
  assert.equal(snapshot.servedCustomers, 1);
  assert.equal(snapshot.coins, 18);
});

test("completing three customers passes the level", () => {
  const game = new RealtimeKitchenGame();

  game.dropIngredient("egg", "pan");
  game.completeTap();
  game.completeHold(900);
  game.completeSwipe(90);

  game.dropIngredient("egg", "pan");
  game.completeHold(1000);
  game.dropIngredient("bread", "plate");
  game.completeSwipe(90);

  game.dropIngredient("egg", "pan");
  game.dropIngredient("chili", "pan");
  game.completeMash(8);
  game.completeSwipe(90);

  const snapshot = game.getSnapshot();
  assert.equal(snapshot.state, "ended");
  assert.equal(snapshot.result.passed, true);
  assert.equal(snapshot.result.servedCustomers, 3);
});

test("action judges cover hold mash and swipe", () => {
  assert.equal(judgeHoldAction({ targetMs: 1000, windowMs: 200, maxMs: 1600 }, 1000), true);
  assert.equal(judgeHoldAction({ targetMs: 1000, windowMs: 200, maxMs: 1600 }, 300), false);
  assert.equal(judgeMashAction({ targetTaps: 5 }, 5), true);
  assert.equal(judgeMashAction({ targetTaps: 5 }, 4), false);
  assert.equal(judgeSwipeAction({ minDistancePx: 70 }, 80), true);
  assert.equal(judgeSwipeAction({ minDistancePx: 70 }, 20), false);
});
