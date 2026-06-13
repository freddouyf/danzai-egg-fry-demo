import assert from "node:assert/strict";
import test from "node:test";

import {
  chooseEggAsset,
  chooseEventAsset,
  choosePanAsset,
} from "../src/assets.js";

test("pan art follows the five pan tiers", () => {
  const assets = {
    panIron: "iron",
    panCopper: "copper",
    panGolden: "golden",
    panCrystal: "crystal",
    panLegendary: "legendary",
  };
  assert.equal(choosePanAsset(assets, 1), "iron");
  assert.equal(choosePanAsset(assets, 4), "crystal");
  assert.equal(choosePanAsset(assets, 9), "legendary");
});

test("egg art follows heat and double-yolk state", () => {
  const assets = {
    eggRaw: "raw",
    eggNormal: "normal",
    eggPerfect: "perfect",
    eggSinged: "singed",
    eggBurnt: "burnt",
    eggDoubleYolk: "double",
  };
  assert.equal(chooseEggAsset(assets, 20), "raw");
  assert.equal(chooseEggAsset(assets, 55), "normal");
  assert.equal(chooseEggAsset(assets, 78), "perfect");
  assert.equal(chooseEggAsset(assets, 90), "singed");
  assert.equal(chooseEggAsset(assets, 100), "burnt");
  assert.equal(chooseEggAsset(assets, 30, { doubleYolk: true }), "double");
});

test("event art maps known ids and ignores unknown ids", () => {
  const assets = {
    eventDoubleYolk: "double-yolk-art",
    eventJackpot: "jackpot-art",
    eventBlindHeat: "blind-art",
  };
  assert.equal(chooseEventAsset(assets, "double-yolk"), "double-yolk-art");
  assert.equal(chooseEventAsset(assets, "jackpot"), "jackpot-art");
  assert.equal(chooseEventAsset(assets, "blind-heat"), "blind-art");
  assert.equal(chooseEventAsset(assets, "unknown"), null);
});
