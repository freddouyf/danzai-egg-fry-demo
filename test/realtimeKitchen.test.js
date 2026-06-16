import test from "node:test";
import assert from "node:assert/strict";
import {
  REALTIME_LEVELS,
  getRealtimeNewRecipe,
} from "../src/realtimeKitchenData.js";
import {
  getSwipeProgress,
  judgeHoldAction,
  judgeMashAction,
  judgeSwipeAction,
  RealtimeKitchenGame,
} from "../src/realtimeKitchenGame.js";
import { shouldShowRealtimePlate } from "../src/realtimeKitchenMode.js";

function startRealtimeGame(levelIndex = 0) {
  const game = new RealtimeKitchenGame({ levelIndex });
  game.startBusiness();
  return game;
}

function completeQuickFriedEgg(game) {
  game.dropIngredient("egg", "pan");
  game.completeTap();
  game.completeHold(900);
  game.completeSwipe(90);
}

test("realtime kitchen starts in teaching state", () => {
  const game = new RealtimeKitchenGame();
  const snapshot = game.getSnapshot();

  assert.equal(snapshot.state, "teaching");
  assert.equal(snapshot.currentOrder, null);
  assert.equal(snapshot.serviceTarget, 3);
});

test("start business enters playing with the first customer order", () => {
  const game = startRealtimeGame();
  const snapshot = game.getSnapshot();

  assert.equal(snapshot.state, "playing");
  assert.equal(snapshot.currentOrder.dishName, "\u5feb\u624b\u714e\u86cb");
  assert.equal(snapshot.currentStep.type, "ingredient");
  assert.equal(snapshot.currentStep.ingredientId, "egg");
  assert.equal(snapshot.currentStep.targetId, "pan");
});

test("service target is three customers", () => {
  const game = new RealtimeKitchenGame();
  assert.equal(game.getSnapshot().serviceTarget, 3);
});

test("level one only serves quick fried egg orders", () => {
  const game = startRealtimeGame(0);
  assert.equal(game.getSnapshot().currentOrder.id, "quick-fried-egg");

  game.completeCurrentOrder();
  assert.equal(game.getSnapshot().currentOrder.id, "quick-fried-egg");
});

test("level two adds thick egg toast after quick fried egg", () => {
  const game = startRealtimeGame(1);
  assert.equal(game.getSnapshot().serviceTarget, 4);
  assert.equal(game.getSnapshot().currentOrder.id, "quick-fried-egg");

  game.completeCurrentOrder();
  assert.equal(game.getSnapshot().currentOrder.id, "thick-egg-toast");
});

test("level three adds spicy stir egg after the first two recipes", () => {
  const game = startRealtimeGame(2);
  assert.equal(game.getSnapshot().serviceTarget, 5);

  assert.equal(game.getSnapshot().currentOrder.id, "quick-fried-egg");
  game.completeCurrentOrder();
  assert.equal(game.getSnapshot().currentOrder.id, "thick-egg-toast");
  game.completeCurrentOrder();
  assert.equal(game.getSnapshot().currentOrder.id, "spicy-stir-egg");
});

test("each level teaches only its newly introduced recipe", () => {
  assert.equal(getRealtimeNewRecipe(REALTIME_LEVELS[0]).id, "quick-fried-egg");
  assert.equal(getRealtimeNewRecipe(REALTIME_LEVELS[1]).id, "thick-egg-toast");
  assert.equal(getRealtimeNewRecipe(REALTIME_LEVELS[2]).id, "spicy-stir-egg");
});

test("current order exposes recipe icon flow and active step", () => {
  const game = startRealtimeGame();
  let snapshot = game.getSnapshot();

  assert.deepEqual(snapshot.recipeFlow, ["\u{1F95A}", "\u{1F373}", "\u{1F446}", "\u{1F525}", "\u{1F37D}\uFE0F"]);
  assert.equal(snapshot.recipeSteps[0].status, "active");
  assert.equal(snapshot.recipeSteps[1].status, "upcoming");

  game.dropIngredient("egg", "pan");
  snapshot = game.getSnapshot();
  assert.equal(snapshot.recipeSteps[0].status, "done");
  assert.equal(snapshot.recipeSteps[1].status, "active");
});

test("two walked out customers fail the level", () => {
  const game = startRealtimeGame();
  game.update(999999);
  assert.equal(game.getSnapshot().walkedOutCustomers, 1);
  assert.equal(game.getSnapshot().state, "playing");

  game.update(999999);
  const snapshot = game.getSnapshot();
  assert.equal(snapshot.walkedOutCustomers, 2);
  assert.equal(snapshot.state, "ended");
  assert.equal(snapshot.result.passed, false);
});

test("correct ingredient drop advances the step and records target contents", () => {
  const game = startRealtimeGame();
  game.dropIngredient("egg", "pan");
  const snapshot = game.getSnapshot();

  assert.equal(snapshot.currentStep.type, "action");
  assert.equal(snapshot.currentStep.actionType, "tap");
  assert.deepEqual(snapshot.currentOrder.placedTargets.pan, ["egg"]);
});

test("wrong ingredient drop does not advance and costs patience", () => {
  const game = startRealtimeGame();
  const before = game.getSnapshot();
  game.dropIngredient("scallion", "pan");
  const after = game.getSnapshot();

  assert.equal(after.currentStepIndex, before.currentStepIndex);
  assert.equal(after.currentOrder.remainingPatienceMs, before.currentOrder.remainingPatienceMs - 1000);
  assert.equal(after.lastFeedback, "\u4e0d\u662f\u8fd9\u4e2a\u98df\u6750\uff01");
});

test("TAP success advances", () => {
  const game = startRealtimeGame();
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
  const game = startRealtimeGame(2);
  game.completeCurrentOrder();
  game.completeCurrentOrder();
  game.dropIngredient("egg", "pan");
  game.dropIngredient("chili", "pan");
  assert.equal(game.getSnapshot().currentStep.actionType, "mash");

  game.completeMash(8);
  assert.equal(game.getSnapshot().currentStep.actionType, "swipe");
});

test("SWIPE below slider distance fails", () => {
  assert.equal(getSwipeProgress(40, 120).ready, false);
  assert.equal(judgeSwipeAction({ minDistancePx: 90 }, 40), false);
});

test("plate is muted outside plating steps", () => {
  assert.equal(shouldShowRealtimePlate({ type: "ingredient", ingredientId: "egg", targetId: "pan" }), false);
  assert.equal(shouldShowRealtimePlate({ type: "action", actionType: "hold" }), false);
});

test("plate appears for plating targets and swipe service", () => {
  assert.equal(shouldShowRealtimePlate({ type: "ingredient", ingredientId: "bread", targetId: "plate" }), true);
  assert.equal(shouldShowRealtimePlate({ type: "action", actionType: "swipe" }), true);
});

test("SWIPE reaching slider distance succeeds and advances", () => {
  assert.equal(getSwipeProgress(120, 120).ready, true);

  const game = startRealtimeGame();
  game.dropIngredient("egg", "pan");
  game.completeTap();
  game.completeHold(900);
  assert.equal(game.getSnapshot().currentStep.actionType, "swipe");

  game.completeSwipe(90);
  const snapshot = game.getSnapshot();
  assert.equal(snapshot.servedCustomers, 1);
  assert.equal(snapshot.coins, 18);
});

test("level one passes after three served customers", () => {
  const game = startRealtimeGame();

  completeQuickFriedEgg(game);
  completeQuickFriedEgg(game);
  completeQuickFriedEgg(game);

  const snapshot = game.getSnapshot();
  assert.equal(snapshot.state, "ended");
  assert.equal(snapshot.result.passed, true);
  assert.equal(snapshot.result.servedCustomers, 3);
});

test("passing level one can advance to level two teaching state", () => {
  const game = startRealtimeGame();
  completeQuickFriedEgg(game);
  completeQuickFriedEgg(game);
  completeQuickFriedEgg(game);

  assert.equal(game.getSnapshot().result.hasNextLevel, true);
  const next = game.startNextLevel();
  assert.equal(next.state, "teaching");
  assert.equal(next.levelIndex, 1);
  assert.equal(next.serviceTarget, 4);
  assert.equal(next.currentOrder, null);
});

test("last level result does not expose a next level", () => {
  const game = startRealtimeGame(2);
  for (let index = 0; index < 5; index += 1) {
    game.completeCurrentOrder();
  }

  const snapshot = game.getSnapshot();
  assert.equal(snapshot.result.passed, true);
  assert.equal(snapshot.result.hasNextLevel, false);
  assert.equal(snapshot.hasNextLevel, false);
});

test("action judges cover hold mash and swipe", () => {
  assert.equal(judgeHoldAction({ targetMs: 1000, windowMs: 200, maxMs: 1600 }, 1000), true);
  assert.equal(judgeHoldAction({ targetMs: 1000, windowMs: 200, maxMs: 1600 }, 300), false);
  assert.equal(judgeMashAction({ targetTaps: 5 }, 5), true);
  assert.equal(judgeMashAction({ targetTaps: 5 }, 4), false);
  assert.equal(judgeSwipeAction({ minDistancePx: 70 }, 80), true);
  assert.equal(judgeSwipeAction({ minDistancePx: 70 }, 20), false);
});
