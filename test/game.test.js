import test from "node:test";
import assert from "node:assert/strict";

import {
  adaptiveLevelTarget,
  awakenedUpgradeCount,
  classifyHeat,
  COMBO_MOOD,
  COIN_RUSH_END_GRACE_MS,
  comboMultiplier,
  createEvent,
  createRandomEvent,
  EggFryGame,
  EVENT_DEFINITIONS,
  EARLY_LEVEL_TARGETS,
  GAME_DURATION_MS,
  getComboMood,
  getHitQuality,
  getHitWindow,
  getMissFeedback,
  getPanPerk,
  getUpgradePreview,
  HEAT_STATUS,
  HIT_QUALITY,
  levelScoreMultiplier,
  levelTarget,
  MAX_HEALTH,
  nextLevelTarget,
  scoreEgg,
  scoreSingleTap,
  PAN_PERKS,
  UPGRADE_DEFINITIONS,
} from "../src/game.js";

function cookAt(game, heat) {
  game.currentEgg.heat = heat;
  return game.cook();
}

test("单次点击命中区分 Good、Perfect 与 Miss", () => {
  assert.deepEqual(getHitWindow(createEvent()), {
    goodMin: 62,
    goodMax: 93,
    perfectMin: 70,
    perfectMax: 85,
  });
  assert.equal(getHitQuality(61), HIT_QUALITY.MISS);
  assert.equal(getHitQuality(62), HIT_QUALITY.GOOD);
  assert.equal(getHitQuality(69), HIT_QUALITY.GOOD);
  assert.equal(getHitQuality(70), HIT_QUALITY.PERFECT);
  assert.equal(getHitQuality(85), HIT_QUALITY.PERFECT);
  assert.equal(getHitQuality(86), HIT_QUALITY.GOOD);
  assert.equal(getHitQuality(93), HIT_QUALITY.GOOD);
  assert.equal(getHitQuality(94), HIT_QUALITY.MISS);
  assert.equal(getHitQuality(96), HIT_QUALITY.MISS);
  assert.equal(getMissFeedback(20).label, "太早啦！");
  assert.equal(getMissFeedback(94).label, "太晚啦！");
  assert.equal(getMissFeedback(96).label, "糊锅啦！");
});

test("Good 奖励低于 Perfect，且两者都能一次出锅", () => {
  const good = scoreSingleTap(65);
  const perfect = scoreSingleTap(75);
  assert.equal(good.hitQuality, HIT_QUALITY.GOOD);
  assert.equal(good.baseScore, 40);
  assert.equal(perfect.hitQuality, HIT_QUALITY.PERFECT);
  assert.equal(perfect.baseScore, 100);
  assert.ok(perfect.awardedScore > good.awardedScore);
});

test("Perfect 三连进入活力状态，五连进入狂欢，Good 保留而 Miss 清空", () => {
  assert.equal(getComboMood(2), COMBO_MOOD.NORMAL);
  assert.equal(getComboMood(3), COMBO_MOOD.LIVELY);
  assert.equal(getComboMood(5), COMBO_MOOD.FEVER);

  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.drainEvents();
  cookAt(game, 75);
  cookAt(game, 75);
  cookAt(game, 75);
  let snapshot = game.getSnapshot();
  assert.equal(snapshot.perfectStreak, 3);
  assert.equal(snapshot.comboMood, COMBO_MOOD.LIVELY);
  assert.ok(game.drainEvents().some((event) => event.type === "perfectStreakLively"));

  cookAt(game, 65);
  snapshot = game.getSnapshot();
  assert.equal(snapshot.perfectStreak, 3);
  assert.equal(snapshot.lastHitQuality, HIT_QUALITY.GOOD);

  cookAt(game, 75);
  cookAt(game, 75);
  snapshot = game.getSnapshot();
  assert.equal(snapshot.perfectStreak, 5);
  assert.equal(snapshot.comboMood, COMBO_MOOD.FEVER);
  assert.ok(game.drainEvents().some((event) => event.type === "perfectStreakFever"));

  assert.equal(cookAt(game, 20), false);
  snapshot = game.getSnapshot();
  assert.equal(snapshot.perfectStreak, 0);
  assert.equal(snapshot.comboMood, COMBO_MOOD.NORMAL);
  assert.equal(snapshot.lastHitQuality, HIT_QUALITY.MISS);
  assert.ok(
    game.drainEvents().some(
      (event) => event.type === "heartLost" && event.missLabel === "太早啦！",
    ),
  );
});

test("火候边界与默认完美区间正确", () => {
  assert.equal(classifyHeat(0), HEAT_STATUS.RAW);
  assert.equal(classifyHeat(39), HEAT_STATUS.RAW);
  assert.equal(classifyHeat(40), HEAT_STATUS.NORMAL);
  assert.equal(classifyHeat(69), HEAT_STATUS.NORMAL);
  assert.equal(classifyHeat(70), HEAT_STATUS.PERFECT);
  assert.equal(classifyHeat(85), HEAT_STATUS.PERFECT);
  assert.equal(classifyHeat(86), HEAT_STATUS.SINGED);
  assert.equal(classifyHeat(95), HEAT_STATUS.SINGED);
  assert.equal(classifyHeat(96), HEAT_STATUS.BURNT);
  assert.equal(classifyHeat(100), HEAT_STATUS.BURNT);
});

test("黄金火候能覆盖原本微焦的 86 至 90", () => {
  assert.equal(classifyHeat(65, 65, 90), HEAT_STATUS.PERFECT);
  assert.equal(classifyHeat(90, 65, 90), HEAT_STATUS.PERFECT);
  assert.equal(classifyHeat(91, 65, 90), HEAT_STATUS.SINGED);
});

test("基础评分覆盖主要组合", () => {
  assert.equal(scoreEgg(75, 80).baseScore, 100);
  assert.equal(scoreEgg(75, 55).baseScore, 60);
  assert.equal(scoreEgg(50, 60).baseScore, 30);
  assert.equal(scoreEgg(20, 75).baseScore, 10);
  assert.equal(scoreEgg(90, 75).baseScore, 10);
  assert.equal(scoreEgg(96, 75).baseScore, 0);
});

test("每 3 combo 增加 0.5 倍率", () => {
  assert.equal(comboMultiplier(0), 1);
  assert.equal(comboMultiplier(2), 1);
  assert.equal(comboMultiplier(3), 1.5);
  assert.equal(comboMultiplier(6), 2);
});

test("计分顺序为事件倍率、固定奖励、combo 倍率", () => {
  const doubleYolk = scoreEgg(75, 80, createEvent("double-yolk"), 4);
  assert.equal(doubleYolk.combo, 5);
  assert.equal(doubleYolk.awardedScore, 450);

  const scallion = scoreEgg(75, 80, createEvent("lucky-scallion"), 4);
  assert.equal(scallion.awardedScore, 420);

  const critical = scoreEgg(75, 80, createEvent("spatula-critical"), 4);
  assert.equal(critical.awardedScore, 900);
});

test("暴躁炉火提高速度和分数，慢悠悠蛋降低速度", () => {
  const angry = createEvent("angry-fire");
  const slow = createEvent("slow-egg");
  assert.equal(angry.speedMultiplier, 2.1);
  assert.equal(slow.speedMultiplier, 0.62);
  assert.equal(scoreEgg(75, 80, angry, 0).awardedScore, 400);

  const angryGame = new EggFryGame({ eventChance: 0 });
  angryGame.start();
  angryGame.spawnEgg("angry-fire");
  angryGame.update(1_000);

  const slowGame = new EggFryGame({ eventChance: 0 });
  slowGame.start();
  slowGame.spawnEgg("slow-egg");
  slowGame.update(1_000);

  assert.ok(angryGame.currentEgg.heat > slowGame.currentEgg.heat);
});

test("全部随机事件与配方均可按定义读取", () => {
  assert.equal(EVENT_DEFINITIONS.length, 13);
  assert.equal(UPGRADE_DEFINITIONS.length, 13);
  assert.ok(UPGRADE_DEFINITIONS.every((upgrade) => upgrade.family === "basic"));
  assert.equal(PAN_PERKS.length, 1);
  for (const event of EVENT_DEFINITIONS) {
    assert.equal(createEvent(event.id).id, event.id);
  }
});

test("煎锅不再按关卡自动升级", () => {
  assert.equal(getPanPerk(1).id, "basic-pan");
  assert.equal(getPanPerk(2).id, "basic-pan");
  assert.equal(getPanPerk(9).id, "basic-pan");
  assert.equal(getPanPerk(9).level, 0);
});

test("随机事件可命中无事件与事件列表两端", () => {
  assert.equal(createRandomEvent(() => 0.99, 0.85).id, "none");

  const rolls = [0.1, 0];
  assert.equal(createRandomEvent(() => rolls.shift()).id, EVENT_DEFINITIONS[0].id);

  const lastRolls = [0.1, 0.999];
  assert.equal(
    createRandomEvent(() => lastRolls.shift(), 1, { level: 2 }).id,
    EVENT_DEFINITIONS.at(-1).id,
  );
});

test("第一关不会抽到蒙眼豪赌，第二关开始才会进入事件池", () => {
  const firstLevelRolls = [0, 0.999];
  assert.notEqual(
    createRandomEvent(() => firstLevelRolls.shift(), 1, { level: 1 }).id,
    "blind-heat",
  );

  const secondLevelRolls = [0, 0.999];
  assert.equal(
    createRandomEvent(() => secondLevelRolls.shift(), 1, { level: 2 }).id,
    "blind-heat",
  );
});

test("致盲事件结束后重新开局会清空事件并可正常出锅", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.level = 2;
  game.spawnEgg("blind-heat");
  game.currentEgg.heat = 80;
  game.endRun("no-health");

  game.start();
  assert.equal(game.state, "playing");
  assert.equal(game.effect.id, "none");
  assert.equal(game.currentEgg.heat, 0);

  game.currentEgg.heat = 75;
  assert.ok(game.cook());
  assert.equal(game.eggsCooked, 1);
});

test("第一关使用教学目标，并暂时排除三种高压事件", () => {
  assert.deepEqual(EARLY_LEVEL_TARGETS, [7, 8, 9, 10, 11]);
  assert.equal(levelTarget(1), 7);
  assert.equal(levelTarget(2), 8);
  assert.equal(levelTarget(6), 12);
  for (const id of ["angry-fire", "pan-crisis", "devil-fire"]) {
    const event = EVENT_DEFINITIONS.find((candidate) => candidate.id === id);
    assert.ok(event.minLevel >= 2);
  }
});

test("旦仔鼓励只在煎糊时保留当前 combo", () => {
  const protectedFailure = scoreEgg(96, 80, createEvent("danzai-cheer"), 7);
  assert.equal(protectedFailure.awardedScore, 0);
  assert.equal(protectedFailure.combo, 7);
  assert.equal(protectedFailure.preservedCombo, true);

  const normalFailure = scoreEgg(96, 80, createEvent(), 7);
  assert.equal(normalFailure.combo, 0);
  assert.equal(normalFailure.preservedCombo, false);
});

test("倒计时结束后未出锅鸡蛋不计入成绩", () => {
  const game = new EggFryGame({
    durationMs: 1_000,
    eventChance: 0,
  });
  game.start();
  game.update(1_000);

  const snapshot = game.getSnapshot();
  assert.equal(snapshot.state, "stage-ended");
  assert.equal(snapshot.remainingMs, 0);
  assert.equal(snapshot.eggsCooked, 0);
  assert.equal(snapshot.totalScore, 0);
  assert.equal(snapshot.currentEgg, null);
});

test("暂停会冻结倒计时和火候，继续后恢复推进", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.update(500);
  const remaining = game.remainingMs;
  const heat = game.currentEgg.heat;

  assert.equal(game.pause(), true);
  game.update(3_000);
  assert.equal(game.remainingMs, remaining);
  assert.equal(game.currentEgg.heat, heat);

  assert.equal(game.resume(), true);
  game.update(500);
  assert.ok(game.remainingMs < remaining);
  assert.ok(game.currentEgg.heat > heat);
});

test("默认关卡时长为 10 秒", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  assert.equal(GAME_DURATION_MS, 10_000);
  assert.equal(game.remainingMs, 10_000);
});

test("绿色区域点击出锅会立刻完成并生成下一颗蛋", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.currentEgg.heat = 75;
  const result = game.cook();
  const snapshot = game.getSnapshot();

  assert.equal(result.isPerfect, true);
  assert.equal(snapshot.totalScore, 100);
  assert.equal(snapshot.combo, 1);
  assert.equal(snapshot.eggsCooked, 1);
  assert.equal(snapshot.perfectEggs, 1);
  assert.equal(snapshot.currentEgg.number, 2);
  assert.equal(snapshot.currentEgg.phase, "first");
});

test("磁吸锅铲会在进入绿色区域时自动出锅", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.stageEggs = 2;
  game.upgrades["steady-hand"] = 1;
  game.update(2_000);

  assert.equal(game.eggsCooked, 1);
  assert.equal(game.currentEgg.phase, "first");
  assert.equal(game.currentEgg.heat, 0);
  assert.ok(game.drainEvents().some((event) => event.type === "autoServed"));

  game.upgrades["steady-hand"] = 2;
  game.spawnEgg("none");
  game.update(2_000);
  assert.equal(game.eggsCooked, 2);
  assert.equal(game.currentEgg.phase, "first");
});

test("黄色区域点击出锅会扣除一颗心", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.currentEgg.heat = 20;

  assert.equal(game.cook(), false);
  assert.equal(game.health, 2);
  assert.equal(game.currentEgg.phase, "first");
});

test("双份装盘会定期爆出额外金币而不会改变读条起点", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.upgrades["opening-jackpot"] = 1;
  game.spawnEgg("none");
  assert.equal(game.currentEgg.heat, 0);
  for (let index = 0; index < 3; index += 1) {
    var result = cookAt(game, 80);
  }
  assert.equal(result.doublePlate, true);
  assert.equal(result.doublePlateCoinBonus, 4);
  assert.equal(result.progressGain, 1);
});

test("奇遇复读机会把成功事件带到下一颗蛋", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.upgrades["event-booster"] = 1;
  game.spawnEgg("double-yolk");
  cookAt(game, 80);

  assert.equal(game.effect.id, "double-yolk");
  assert.equal(game.currentEgg.isEncore, true);
  assert.ok(game.drainEvents().some((event) => event.type === "buildBurst"));
});

test("大奖蓄力器会在连续事件成功后强制生成大奖蛋", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.stageTarget = 99;
  game.upgrades["event-album"] = 1;
  for (let index = 0; index < 3; index += 1) {
    game.spawnEgg("double-yolk");
    cookAt(game, 80);
  }

  assert.equal(game.effect.id, "jackpot");
  assert.equal(game.currentEgg.isForcedJackpot, true);
  assert.equal(game.eventMeter, 0);
});

test("连击超频会让下一颗成功蛋额外爆出金币", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.upgrades["combo-engine"] = 1;
  game.combo = 4;
  cookAt(game, 80);

  assert.equal(game.overdriveRemainingMs, 4_000);
  assert.equal(game.currentEgg.heat, 0);

  const boosted = cookAt(game, 80);
  assert.equal(boosted.overdriveCoinBonus, 4);
  assert.equal(boosted.progressGain, 1);
  assert.ok(
    boosted.buildTriggers.some(
      (trigger) => trigger.id === "combo-engine" && trigger.multiplier === 3,
    ),
  );
});

test("战斗中不再弹强化，过关后才出现一次三选一配方", () => {
  const game = new EggFryGame({ eventChance: 0, random: () => 0 });
  game.start();
  for (let egg = 0; egg < 2; egg += 1) {
    cookAt(game, 80);
  }

  assert.equal(game.state, "playing");
  assert.equal(game.pendingChoices.length, 0);

  game.stageProgress = game.stageTarget;
  game.finishStage({ cleared: true });
  assert.equal(game.state, "stage-ended");
  assert.equal(game.continueStage(), true);
  assert.equal(game.state, "choosing");
  assert.equal(game.pendingChoices.length, 3);
  const selected = game.pendingChoices.at(0);
  assert.equal(game.selectUpgrade(selected.id), true);
  assert.equal(game.state, "playing");
  assert.equal(game.upgrades[selected.id], 1);
  assert.equal(game.level, 2);
});

test("强化预览只显示会直接改变玩法的结果", () => {
  assert.deepEqual(getUpgradePreview("perfect-chain", 0), {
    headline: "3 连命中 +6 币",
    before: "尚未启动",
    after: "第三颗额外爆金币",
  });
  assert.equal(getUpgradePreview("time-seasoning", 0).headline, "5 连成功回 1 心");
  assert.equal(getUpgradePreview("combo-armor", 1).headline, "每关救回 2 次");
  assert.equal(getUpgradePreview("danger-chef", 0).headline, "微焦连续升压");
  assert.equal(
    getUpgradePreview("steady-hand", 1).awakening,
    "完全体",
  );
});

test("三选一不再按流派偏置，选项保持唯一", () => {
  const game = new EggFryGame({ random: () => 0, eventChance: 0 });
  game.start();
  game.upgrades["steady-hand"] = 1;
  game.openUpgradeDraft();

  assert.equal(game.state, "choosing");
  assert.equal(game.pendingChoices.length, 3);
  assert.equal(new Set(game.pendingChoices.map((choice) => choice.id)).size, 3);
  assert.ok(game.pendingChoices.every((choice) => choice.family === "basic"));
});

test("遗留流派字段不会影响强化选项", () => {
  const game = new EggFryGame({ random: () => 0, eventChance: 0 });
  game.start();
  game.activeBuildFamily = "precision";
  game.openUpgradeDraft();

  assert.equal(game.pendingChoices.length, 3);
  assert.ok(game.pendingChoices.every((choice) => choice.family === "basic"));
});

test("每关强化可免费换一批一次，并尽量避开原三张", () => {
  const rolls = [0, 0, 0, 0.99, 0.99, 0.99];
  const game = new EggFryGame({
    random: () => rolls.shift() ?? 0.5,
    eventChance: 0,
  });
  game.start();
  game.openUpgradeDraft();
  const firstIds = game.pendingChoices.map((choice) => choice.id);

  assert.equal(game.rerollUpgradeDraft(), true);
  assert.equal(game.draftRerolls, 0);
  assert.equal(game.rerollUpgradeDraft(), false);
  assert.ok(game.pendingChoices.every((choice) => !firstIds.includes(choice.id)));
});

test("单卡满级后进入完全体但不叠隐藏全局倍率", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.upgrades["steady-hand"] = 1;
  game.state = "choosing";
  game.pendingChoices = [
    UPGRADE_DEFINITIONS.find((upgrade) => upgrade.id === "steady-hand"),
  ];

  assert.equal(game.selectUpgrade("steady-hand"), true);
  assert.equal(awakenedUpgradeCount(game.upgrades), 1);
  assert.equal(game.getActiveEffect().awakenedMultiplier, 1);
  const selected = game
    .drainEvents()
    .find((event) => event.type === "upgradeSelected");
  assert.equal(selected.awakened, true);
  assert.equal(selected.awakenedCount, 1);
});

test("规则型强化会直接改变火速和微焦判定", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.stageEggs = 2;
  game.upgrades["singed-gourmet"] = 1;
  game.upgrades["danger-chef"] = 1;
  game.spawnEgg("double-yolk");
  const effect = game.getActiveEffect();

  assert.equal(effect.perfectMin, 70);
  assert.equal(effect.perfectMax, 85);
  assert.equal(effect.scoreMultiplier, 3);
  assert.equal(effect.speedMultiplier, 1.28);
  assert.equal(effect.singedAsPerfect, true);
});

test("多张强化不会再产生隐藏流派倍率", () => {
  assert.ok(UPGRADE_DEFINITIONS.every((upgrade) => upgrade.family === "basic"));
});

test("完美复印机仍会在第三颗 Perfect 触发自身效果", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.upgrades["steady-hand"] = 1;
  game.upgrades["perfect-chain"] = 1;

  const first = cookAt(game, 80);

  const second = cookAt(game, 80);

  const third = cookAt(game, 80);

  assert.equal(first.buildMultiplier, undefined);
  assert.equal(second.buildMultiplier, undefined);
  assert.equal(third.buildMultiplier, 3);
  assert.deepEqual(
    third.buildTriggers.map((trigger) => trigger.id),
    ["perfect-chain"],
  );
  assert.ok(third.awardedScore > second.awardedScore);
});

test("选择强化只提升卡牌本身，不再发出流派里程碑", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.upgrades["steady-hand"] = 1;
  game.state = "choosing";
  game.pendingChoices = [
    UPGRADE_DEFINITIONS.find((upgrade) => upgrade.id === "perfect-chain"),
  ];

  assert.equal(game.selectUpgrade("perfect-chain"), true);
  const twoPiece = game
    .drainEvents()
    .find((event) => event.type === "upgradeSelected");
  assert.equal(twoPiece.familyMilestone, undefined);
  assert.equal(twoPiece.familyProgress, undefined);

  game.state = "choosing";
  game.pendingChoices = [
    UPGRADE_DEFINITIONS.find((upgrade) => upgrade.id === "combo-engine"),
  ];
  assert.equal(game.selectUpgrade("combo-engine"), true);
  const threePiece = game
    .drainEvents()
    .find((event) => event.type === "upgradeSelected");
  assert.equal(threePiece.familyMilestone, undefined);
  assert.equal(threePiece.familyProgress, undefined);
});

test("微焦强化只触发卡牌自身奖励，不再叠流派倍率", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.upgrades["singed-gourmet"] = 1;
  game.upgrades["danger-chef"] = 1;
  game.upgrades["combo-armor"] = 1;
  game.stageEggs = 2;
  const result = cookAt(game, 90);

  assert.equal(result.isGood, true);
  assert.equal(result.routeMultiplier, undefined);
  assert.equal(result.buildMultiplier, 1.75);
  assert.match(result.buildLabel, /红温 1 层/);
  assert.deepEqual(
    result.buildTriggers.map((trigger) => trigger.family),
    ["basic"],
  );
});

test("基础煎锅不会在前两颗自动扩大完美区", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  assert.equal(game.getActiveEffect().perfectMin, 70);
  assert.equal(game.getActiveEffect().perfectMax, 85);
  game.stageEggs = 2;
  assert.equal(game.getActiveEffect().perfectMin, 70);
  assert.equal(game.getActiveEffect().perfectMax, 85);
});

test("基础煎锅不会把擦边火候吸附进 Perfect", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  const result = cookAt(game, 63);
  assert.equal(result.sideOne, 63);
  assert.equal(result.sideTwo, 63);
  assert.equal(result.hitQuality, HIT_QUALITY.GOOD);
  assert.equal(
    game.drainEvents().filter((event) => event.type === "panPerkTriggered").length,
    0,
  );
});

test("过关后不会获得铜锅免伤", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.startNextStage();
  assert.equal(game.level, 2);
  assert.equal(game.panGuardCharges, 0);

  game.currentEgg.heat = 20;
  assert.equal(game.cook(), false);
  assert.equal(game.health, MAX_HEALTH - 1);
  assert.equal(
    game.drainEvents().filter((event) => event.type === "heartSaved" && event.source === "pan").length,
    0,
  );
});

test("高关卡 Perfect 不再因为黄金锅额外掉落金币", () => {
  const golden = new EggFryGame({ eventChance: 0 });
  golden.start();
  golden.level = 3;
  golden.stageTarget = levelTarget(3);
  const targetHeat =
    (golden.getActiveEffect().perfectMin + golden.getActiveEffect().perfectMax) / 2;
  const goldenResult = cookAt(golden, targetHeat);
  assert.equal(goldenResult.coinReward, 4);
});

test("成功出锅不会延长固定的十秒倒计时", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.spawnEgg("time-warp");
  game.health = 2;
  const result = cookAt(game, 80);

  assert.equal(result.timeBonusMs, undefined);
  assert.equal(game.remainingMs, 10_000);
  assert.equal(game.health, 3);
});

test("事件成功不再因为传奇锅额外掉落金币", () => {
  const basic = new EggFryGame({ eventChance: 0 });
  basic.start();
  basic.spawnEgg("double-yolk");
  const basicTargetHeat =
    (basic.getActiveEffect().perfectMin + basic.getActiveEffect().perfectMax) / 2;
  const basicReward = cookAt(basic, basicTargetHeat).coinReward;

  const legendary = new EggFryGame({ eventChance: 0 });
  legendary.start();
  legendary.level = 5;
  legendary.stageTarget = levelTarget(5);
  legendary.spawnEgg("double-yolk");
  const targetHeat =
    (legendary.getActiveEffect().perfectMin +
      legendary.getActiveEffect().perfectMax) /
    2;
  assert.equal(cookAt(legendary, targetHeat).coinReward, basicReward);
});

test("高关卡不会触发晶能锅护盾", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.level = 4;
  game.stageTarget = levelTarget(4);

  const firstHeat =
    (game.getActiveEffect().perfectMin + game.getActiveEffect().perfectMax) / 2;
  cookAt(game, firstHeat);
  assert.equal(game.panCharge, 0);

  const secondHeat =
    (game.getActiveEffect().perfectMin + game.getActiveEffect().perfectMax) / 2;
  const result = cookAt(game, secondHeat);
  assert.equal(result.panCrystalShieldBonus, undefined);
  assert.equal(game.shieldCharges, 0);
  assert.equal(game.panCharge, 0);
  assert.ok(
    !game
      .drainEvents()
      .some((event) => event.type === "panPerkTriggered"),
  );
});

test("高关卡事件不会触发传奇锅金币袋", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.level = 5;
  game.stageTarget = levelTarget(5);

  let firstReward = 0;
  for (let index = 0; index < 2; index += 1) {
    game.spawnEgg("double-yolk");
    const targetHeat =
      (game.getActiveEffect().perfectMin + game.getActiveEffect().perfectMax) /
      2;
    const result = cookAt(game, targetHeat);
    if (index === 0) {
      assert.equal(game.panCharge, 0);
      assert.equal(result.panResonanceCoinBonus, undefined);
      firstReward = result.coinReward;
    } else {
      assert.equal(game.panCharge, 0);
      assert.equal(result.panResonanceCoinBonus, undefined);
      assert.equal(result.coinReward, firstReward);
    }
  }
});

test("区域外操作会扣心，三次失误后立即结束本轮", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();

  assert.equal(game.health, MAX_HEALTH);
  for (let misses = 1; misses <= MAX_HEALTH; misses += 1) {
    assert.equal(cookAt(game, 20), false);
    assert.equal(game.health, MAX_HEALTH - misses);
  }

  assert.equal(game.state, "ended");
  assert.equal(game.runEndReason, "no-health");
  assert.ok(
    game
      .drainEvents()
      .some((event) => event.type === "gameEnded" && event.reason === "no-health"),
  );
});

test("金币狂欢冻结关卡倒计时，狂点会连续掉币并触发十连奖励", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.spawnEgg("coin-rush");
  const remaining = game.remainingMs;

  assert.equal(game.currentEgg, null);
  assert.equal(game.coinRushRemainingMs, 3_500);
  for (let taps = 0; taps < 10; taps += 1) {
    assert.equal(game.tapCoinRush(), true);
  }
  assert.equal(game.coinRushTaps, 10);
  assert.equal(game.runCoins, 15);

  game.update(1_000);
  assert.equal(game.remainingMs, remaining);
  assert.equal(game.coinRushRemainingMs, 2_500);
  game.update(2_500);
  assert.ok(game.currentEgg);
  assert.equal(game.remainingMs, remaining);
  assert.equal(game.coinRushGraceRemainingMs, COIN_RUSH_END_GRACE_MS);

  const health = game.health;
  assert.equal(game.cook(), false);
  assert.equal(game.health, health);
  assert.ok(
    game
      .drainEvents()
      .some((event) => event.type === "invalidAction" && event.message === "准备出锅！"),
  );

  game.update(COIN_RUSH_END_GRACE_MS);
  assert.equal(game.coinRushGraceRemainingMs, 0);
  assert.equal(game.remainingMs, remaining);
});

test("鼓手旦仔让金币狂欢每次点击额外掉一枚金币", () => {
  const game = new EggFryGame({
    eventChance: 0,
    characterBuff: { coinRushTapBonus: 1 },
  });
  game.start();
  game.spawnEgg("coin-rush");
  game.tapCoinRush();

  assert.equal(game.runCoins, 2);
});

test("剑侠扩大目标区，潮帽旦仔增加一颗心", () => {
  const swordsman = new EggFryGame({
    eventChance: 0,
    characterBuff: { perfectPadding: 4 },
  });
  swordsman.start();
  swordsman.stageEggs = 2;
  assert.equal(swordsman.getActiveEffect().perfectMin, 66);
  assert.equal(swordsman.getActiveEffect().perfectMax, 89);

  const streetCap = new EggFryGame({
    eventChance: 0,
    characterBuff: { maxHealthBonus: 1 },
  });
  streetCap.start();
  assert.equal(streetCap.health, 4);
  assert.equal(streetCap.maxHealth, 4);
});

test("旦仔鼓励事件可以挡住本颗蛋的一次失误", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.spawnEgg("danzai-cheer");
  cookAt(game, 20);

  assert.equal(game.health, MAX_HEALTH);
  assert.ok(
    game
      .drainEvents()
      .some((event) => event.type === "heartSaved" && event.source === "event"),
  );
});

test("特殊关卡提示期间仍可冻结倒计时和火候", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.beginPanIntro(1_000);
  game.update(600);
  assert.equal(game.remainingMs, 10_000);
  assert.equal(game.currentEgg.heat, 0);

  game.update(600);
  assert.equal(game.remainingMs, 9_800);
  assert.ok(game.currentEgg.heat > 0);
  assert.equal(game.panIntroRemainingMs, 0);
  assert.ok(game.drainEvents().some((event) => event.type === "panReady"));
});

test("玩家确认特殊关卡提示后才正式开火", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.beginPanIntro(Number.POSITIVE_INFINITY);
  game.update(5_000);

  assert.equal(game.remainingMs, 10_000);
  assert.equal(game.currentEgg.heat, 0);
  assert.equal(game.confirmPanIntro(), true);
  assert.equal(game.panIntroRemainingMs, 0);
  assert.ok(game.drainEvents().some((event) => event.type === "panReady"));
});

test("爱心便当通过连续成功回血，回魂锅盖每关补充次数", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.pendingChoices = [
    UPGRADE_DEFINITIONS.find((upgrade) => upgrade.id === "time-seasoning"),
  ];
  game.state = "choosing";
  assert.equal(game.selectUpgrade("time-seasoning"), true);
  assert.equal(game.level, 2);
  assert.equal(game.activeBuildFamily, undefined);
  assert.equal(game.remainingMs, 10_000);
  game.health = 2;
  game.stageEggs = 4;
  const healed = cookAt(game, 80);
  assert.equal(healed.heartRestored, 1);
  assert.equal(game.health, 3);
  assert.equal(game.remainingMs, 10_000);

  const shieldGame = new EggFryGame({ eventChance: 0 });
  shieldGame.start();
  shieldGame.pendingChoices = [
    UPGRADE_DEFINITIONS.find((upgrade) => upgrade.id === "combo-armor"),
  ];
  shieldGame.state = "choosing";
  assert.equal(shieldGame.selectUpgrade("combo-armor"), true);
  assert.equal(shieldGame.shieldCharges, 1);
});

test("慢悠悠蛋只降低指针速度，不再冻结倒计时", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.spawnEgg("slow-egg");
  game.update(2_000);

  assert.equal(game.remainingMs, 8_000);
  assert.equal(game.currentEgg.freezeRemainingMs, undefined);
  assert.ok(game.currentEgg.heat > 0);
});

test("读条烧到底会立即扣除一颗心并换蛋", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.spawnEgg("devil-fire");
  game.currentEgg.heat = 99;
  game.update(100);

  assert.equal(game.health, 2);
  assert.equal(game.currentEgg.phase, "first");
  assert.ok(game.drainEvents().some((event) => event.type === "heartLost"));
});

test("过关后选择一次强化，并保留已有强化进入下一关", () => {
  const game = new EggFryGame({ durationMs: 1_000, eventChance: 0 });
  game.start();
  game.upgrades["event-booster"] = 1;
  game.combo = 4;
  game.stageProgress = levelTarget(1);
  game.finishStage({ cleared: true });

  assert.equal(game.state, "stage-ended");
  assert.equal(game.continueStage(), true);
  assert.equal(game.state, "choosing");
  game.pendingChoices = [
    UPGRADE_DEFINITIONS.find((upgrade) => upgrade.id === "steady-hand"),
  ];
  assert.equal(game.selectUpgrade("steady-hand"), true);
  assert.equal(game.level, 2);
  assert.equal(game.upgrades["event-booster"], 1);
  assert.equal(game.combo, 4);
  assert.equal(game.remainingMs, 1_000);
  assert.equal(levelScoreMultiplier(2), 1.75);
  assert.ok(game.getActiveEffect().speedMultiplier > 1);
  assert.ok(game.getActiveEffect().perfectMin > 70);
  assert.ok(levelTarget(2) > levelTarget(1));
});

test("下一关目标固定公开，不会因构筑或连击偷偷追涨", () => {
  const baseTarget = adaptiveLevelTarget(2, {}, 0);
  const poweredTarget = adaptiveLevelTarget(
    2,
    {
      "event-booster": 2,
      "danger-chef": 1,
      "steady-hand": 1,
    },
    6,
  );
  assert.equal(baseTarget, levelTarget(2));
  assert.equal(poweredTarget, baseTarget);
});

test("上一关爆分不会抬高下一关公开目标", () => {
  const target = nextLevelTarget(2, 1_000_000, {}, 0);
  assert.equal(target, levelTarget(3));
});

test("十秒结束时仍有生命即可继续下一关", () => {
  const game = new EggFryGame({ durationMs: 1, eventChance: 0 });
  game.start();
  game.runCoins = 5;
  game.update(1);

  assert.equal(game.continueStage(), true);
  assert.equal(game.state, "choosing");
  assert.equal(game.cashOut({ silent: true }), true);
  assert.equal(game.state, "ended");
  const ended = game.drainEvents().find((event) => event.type === "gameEnded");
  assert.equal(ended.silent, true);
  assert.equal(ended.coinsEarned, 15);
});

test("关卡倍率会直接放大出锅分数", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.level = 2;
  game.stageTarget = levelTarget(2);
  const result = cookAt(game, 80);

  assert.equal(result.levelMultiplier, 1.75);
  assert.equal(result.awardedScore, 175);
});

test("成功煎蛋不会提前结束本关，必须坚持到倒计时结束", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.stageProgress = levelTarget(1) - 1;
  const result = cookAt(game, 80);

  const firstEvents = game.drainEvents();
  assert.equal(result.progressGain, 1);
  assert.equal(result.unlockedLevel, 2);
  assert.equal(
    firstEvents.filter((event) => event.type === "stageGoalReached").length,
    0,
  );
  assert.equal(
    firstEvents.filter((event) => event.type === "stageEnded").length,
    0,
  );
  assert.equal(game.state, "playing");

  game.remainingMs = 1;
  game.update(1);
  assert.equal(game.state, "stage-ended");
  assert.equal(game.stageCleared, true);
});

test("遗留流派字段不会改变火候、倍率或命中结果", () => {
  const baseline = new EggFryGame({ eventChance: 0 });
  baseline.start();
  baseline.stageEggs = 2;

  const legacy = new EggFryGame({ eventChance: 0 });
  legacy.start();
  legacy.stageEggs = 2;
  legacy.activeBuildFamily = "precision";

  assert.deepEqual(
    {
      perfectMin: legacy.getActiveEffect().perfectMin,
      perfectMax: legacy.getActiveEffect().perfectMax,
      speedMultiplier: legacy.getActiveEffect().speedMultiplier,
      scoreMultiplier: legacy.getActiveEffect().scoreMultiplier,
    },
    {
      perfectMin: baseline.getActiveEffect().perfectMin,
      perfectMax: baseline.getActiveEffect().perfectMax,
      speedMultiplier: baseline.getActiveEffect().speedMultiplier,
      scoreMultiplier: baseline.getActiveEffect().scoreMultiplier,
    },
  );
  const result = cookAt(legacy, 80);
  assert.equal(result.routeTriggered, undefined);
  assert.equal(result.routeMultiplier, undefined);
});

test("回魂锅盖会消耗一次并挡住区域外失误", () => {
  const game = new EggFryGame({ eventChance: 0 });
  game.start();
  game.combo = 6;
  game.shieldCharges = 1;
  const result = cookAt(game, 20);

  assert.equal(result.preservedByShield, true);
  assert.equal(result.isPerfect, true);
  assert.equal(game.combo, 7);
  assert.ok(result.awardedScore > 0);
  assert.equal(game.shieldCharges, 0);
});

test("彩蛋礼炮会复制事件得分而不是增加隐藏结算倍率", () => {
  const base = new EggFryGame({ eventChance: 0 });
  base.start();
  base.spawnEgg("double-yolk");
  const baseResult = cookAt(base, 80);

  const boosted = new EggFryGame({ eventChance: 0 });
  boosted.start();
  boosted.upgrades["coin-sprout"] = 1;
  boosted.spawnEgg("double-yolk");
  const boostedResult = cookAt(boosted, 80);

  assert.equal(boostedResult.buildMultiplier, 1.5);
  assert.ok(boostedResult.awardedScore > baseResult.awardedScore);
});

test("糊锅危机会在时间推进时改变速度", () => {
  const rolls = [0.5, 0.75];
  const game = new EggFryGame({
    random: () => rolls.shift() ?? 0.25,
    eventChance: 0,
  });
  game.start();
  game.spawnEgg("pan-crisis");
  const initialSpeed = game.currentEgg.crisisMultiplier;
  game.update(500);

  assert.notEqual(game.currentEgg.crisisMultiplier, initialSpeed);
  assert.ok(game.currentEgg.heat > 0);
});
