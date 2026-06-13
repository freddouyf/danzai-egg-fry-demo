import test from "node:test";
import assert from "node:assert/strict";

import { getPanEvolution } from "../src/renderer.js";

test("煎锅外观不再按关卡自动变化", () => {
  assert.equal(getPanEvolution(1).name, "基础锅");
  assert.equal(getPanEvolution(2).name, "基础锅");
  assert.equal(getPanEvolution(4).name, "基础锅");
});

test("高关卡仍保持基础锅视觉层级", () => {
  assert.equal(getPanEvolution(5).name, "基础锅");
  assert.equal(getPanEvolution(12).tier, 1);
  assert.equal(getPanEvolution(12).level, 1);
});
