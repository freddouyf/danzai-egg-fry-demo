import test from "node:test";
import assert from "node:assert/strict";
import {
  BUSINESS_MAX_WAVES,
  BUSINESS_ORDERS_BY_WAVE,
  BUSINESS_UPGRADES,
} from "../src/businessData.js";
import {
  BUSINESS_CHAOS_END_THRESHOLD,
  BUSINESS_CHAOS_PRESSURE_THRESHOLD,
  calculateBusinessOrderReward,
  drawBusinessUpgradeOptions,
  TodayBusinessGame,
} from "../src/businessGame.js";

function completeCurrentOrder(game, success = true, approach = "normal") {
  let snapshot = game.getSnapshot();
  while (snapshot.state === "cooking") {
    snapshot = game.completeAction({ success, approach });
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

test("upgrade options are random, unique and exclude owned upgrades", () => {
  const seen = new Set();
  [
    () => 0,
    () => 0.5,
    () => 0.999,
  ].forEach((random) => {
    drawBusinessUpgradeOptions([], random).forEach((upgrade) => seen.add(upgrade.id));
  });

  const options = drawBusinessUpgradeOptions(["double-yolk-plan"], () => 0);
  assert.equal(new Set(options.map((upgrade) => upgrade.id)).size, options.length);
  assert.equal(options.some((upgrade) => upgrade.id === "double-yolk-plan"), false);
  assert.equal(seen.size, BUSINESS_UPGRADES.length);
});

test("preview order reward uses current build and does not mutate state", () => {
  const game = new TodayBusinessGame();
  const spicyOrder = game.getSnapshot().orders.find((order) => order.tags.includes("spicy"));
  game.upgrades.push("red-hot-wok", "golden-bell");
  const preview = game.previewOrderReward(spicyOrder.id);

  assert.ok(preview.coins > spicyOrder.baseCoins);
  assert.ok(preview.reasons.includes("红温锅"));
  assert.ok(preview.reasons.includes("金色餐铃"));
  assert.equal(game.getSnapshot().state, "choosing-order");
});

test("chaos pressure lowers order reward and chaos overflow ends the run", () => {
  const spicyOrder = BUSINESS_ORDERS_BY_WAVE.flat().find((order) => order.chaosRisk >= 2);
  const calm = calculateBusinessOrderReward({ upgrades: [], chaos: BUSINESS_CHAOS_PRESSURE_THRESHOLD - 1 }, spicyOrder);
  const messy = calculateBusinessOrderReward({ upgrades: [], chaos: BUSINESS_CHAOS_PRESSURE_THRESHOLD }, spicyOrder);

  assert.ok(messy.coins < calm.coins);
  assert.ok(messy.reasons.includes("后厨混乱"));

  const game = new TodayBusinessGame();
  game.chaos = BUSINESS_CHAOS_END_THRESHOLD - 1;
  game.chooseOrder(game.getSnapshot().orders.find((order) => order.chaosRisk >= 2).id);
  const snapshot = completeCurrentOrder(game);

  assert.equal(snapshot.state, "ended");
  assert.equal(snapshot.result.comment, "厨房爆单失控");
});

test("cooking approaches modify final coins and chaos", () => {
  const normal = new TodayBusinessGame();
  const steady = new TodayBusinessGame();
  const quick = new TodayBusinessGame();
  const orderId = normal.getSnapshot().orders[0].id;

  normal.chooseOrder(orderId);
  steady.chooseOrder(orderId);
  quick.chooseOrder(orderId);

  const normalResult = completeCurrentOrder(normal, true, "normal").lastReward;
  const steadyResult = completeCurrentOrder(steady, true, "steady").lastReward;
  const quickResult = completeCurrentOrder(quick, true, "quick").lastReward;

  assert.ok(steadyResult.coins < normalResult.coins);
  assert.ok(steadyResult.chaosDelta < normalResult.chaosDelta);
  assert.ok(quickResult.coins > normalResult.coins);
  assert.ok(quickResult.chaosDelta > normalResult.chaosDelta);
});

test("multiple cooking modifiers accumulate before order settlement", () => {
  const game = new TodayBusinessGame();
  const order = game.getSnapshot().orders[0];
  game.chooseOrder(order.id);

  game.completeAction({ approach: "quick" });
  game.completeAction({ approach: "quick" });
  const snapshot = game.completeAction({ approach: "steady" });

  assert.equal(snapshot.lastReward.coins, Math.round(order.baseCoins * 1.3));
  assert.equal(snapshot.lastReward.chaosDelta, order.chaosRisk + 1);
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
