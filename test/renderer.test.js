import test from "node:test";
import assert from "node:assert/strict";

import { getPanEvolution } from "../src/renderer.js";

test("前四关煎锅依次进化为铁、铜、金和晶能锅", () => {
  assert.equal(getPanEvolution(1).name, "铁锅");
  assert.equal(getPanEvolution(2).name, "铜锅");
  assert.equal(getPanEvolution(3).name, "黄金锅");
  assert.equal(getPanEvolution(4).name, "晶能锅");
});

test("第五关后进入传奇锅并保留实际关卡等级", () => {
  assert.equal(getPanEvolution(5).name, "传奇锅");
  assert.equal(getPanEvolution(12).tier, 5);
  assert.equal(getPanEvolution(12).level, 12);
});
