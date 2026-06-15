import test from "node:test";
import assert from "node:assert/strict";
import {
  BUSINESS_MAX_WAVES,
  BUSINESS_ORDERS_BY_WAVE,
  BUSINESS_UPGRADES,
} from "../src/businessData.js";
import {
  calculateBusinessOrderReward,
  TodayBusinessGame,
} from "../src/businessGame.js";

function completeCurrentOrder(game, success = true) {
  let snapshot = game.getSnapshot();
  while (snapshot.state === "cooking") {
    snapshot = game.completeAction({ success });
  }
  return snapshot;
}

test("today business initializes with first wave orders", () => {
  const game = new TodayBusinessGame();
  const snapshot = game.getSnapshot();

  assert.equal(snapshot.state, "choosing-order");
  assert.equal(snapshot.wave, 1);
  assert.equal(snapshot.maxWaves, BUSINESS_MAX_WAVES);
  assert.equal(snapshot.orders.length, 3);
  assert.equal(snapshot.coins, 0);
  assert.equal(snapshot.satisfaction, 0);
  assert.equal(snapshot.chaos, 0);
});

test("choosing and completing an order grants rewards", () => {
  const game = new TodayBusinessGame();
  const order = game.getSnapshot().orders[0];

  game.chooseOrder(order.id);
  const snapshot = completeCurrentOrder(game);

  assert.equal(snapshot.completedOrders, 1);
  assert.ok(snapshot.coins >= order.baseCoins);
  assert.ok(snapshot.satisfaction >= order.satisfactionReward);
  assert.equal(snapshot.state, "choosing-upgrade");
});

test("strategy upgrades can change order rewards", () => {
  const spicyOrder = BUSINESS_ORDERS_BY_WAVE.flat().find((order) => order.tags.includes("spicy"));
  const base = calculateBusinessOrderReward({ upgrades: [] }, spicyOrder);
  const withRedWok = calculateBusinessOrderReward({ upgrades: ["red-hot-wok"] }, spicyOrder);

  assert.ok(withRedWok.coins > base.coins);
  assert.ok(withRedWok.chaosDelta > base.chaosDelta);
});

test("three completed waves enter result state", () => {
  const game = new TodayBusinessGame();

  for (let wave = 1; wave <= BUSINESS_MAX_WAVES; wave += 1) {
    const order = game.getSnapshot().orders[0];
    game.chooseOrder(order.id);
    const afterOrder = completeCurrentOrder(game);
    if (wave < BUSINESS_MAX_WAVES) {
      game.chooseUpgrade(afterOrder.upgradeOptions[0].id);
    }
  }

  const snapshot = game.getSnapshot();
  assert.equal(snapshot.state, "ended");
  assert.equal(snapshot.result.completedOrders, BUSINESS_MAX_WAVES);
  assert.equal(snapshot.completedOrders, BUSINESS_MAX_WAVES);
});

test("business satisfaction and chaos stay finite", () => {
  const game = new TodayBusinessGame();
  const order = game.getSnapshot().orders[2];

  game.chooseOrder(order.id);
  completeCurrentOrder(game, false);

  const snapshot = game.getSnapshot();
  assert.equal(Number.isFinite(snapshot.satisfaction), true);
  assert.equal(Number.isFinite(snapshot.chaos), true);
  assert.equal(Number.isNaN(snapshot.satisfaction), false);
  assert.equal(Number.isNaN(snapshot.chaos), false);
});

test("business upgrade catalog contains eight strategy upgrades", () => {
  assert.equal(BUSINESS_UPGRADES.length, 8);
  assert.deepEqual(
    BUSINESS_UPGRADES.map((upgrade) => upgrade.id),
    [
      "double-yolk-plan",
      "michelin-pan",
      "breakfast-set",
      "red-hot-wok",
      "assistant-danzai",
      "warmer-lamp",
      "smile-service",
      "golden-bell",
    ],
  );
});
