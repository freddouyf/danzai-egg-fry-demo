import test from "node:test";
import assert from "node:assert/strict";

import {
  buySkin,
  DEFAULT_SKIN_ID,
  equipSkin,
  findSkin,
  getSkinBuff,
  normalizeWardrobe,
  SKIN_CATALOG,
} from "../src/skins.js";

test("衣柜始终拥有并装备合法的默认造型", () => {
  const wardrobe = normalizeWardrobe({
    owned: ["missing"],
    equipped: "missing",
  });

  assert.deepEqual(wardrobe.owned, [DEFAULT_SKIN_ID]);
  assert.equal(wardrobe.equipped, DEFAULT_SKIN_ID);
});

test("购买造型会正确扣除金币并自动装备", () => {
  const skin = findSkin("carrot");
  const result = buySkin(normalizeWardrobe(), skin.price + 15, skin.id);

  assert.equal(result.ok, true);
  assert.equal(result.reason, "purchased");
  assert.equal(result.balance, 15);
  assert.ok(result.wardrobe.owned.includes(skin.id));
  assert.equal(result.wardrobe.equipped, skin.id);
});

test("金币不足时不会修改余额或解锁造型", () => {
  const result = buySkin(normalizeWardrobe(), 5, "detective");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "insufficient");
  assert.equal(result.balance, 5);
  assert.equal(result.wardrobe.equipped, DEFAULT_SKIN_ID);
  assert.equal(result.wardrobe.owned.includes("detective"), false);
});

test("已拥有的造型可以免费切换装备", () => {
  const wardrobe = normalizeWardrobe({
    owned: ["default", "drummer", "carrot"],
    equipped: "drummer",
  });
  const result = equipSkin(wardrobe, "carrot");

  assert.equal(result.ok, true);
  assert.equal(result.wardrobe.equipped, "carrot");
  assert.deepEqual(result.wardrobe.owned, wardrobe.owned);
});

test("全部商城造型都有唯一 id、素材键和非负价格", () => {
  const ids = new Set();
  for (const skin of SKIN_CATALOG) {
    assert.equal(ids.has(skin.id), false);
    ids.add(skin.id);
    assert.ok(skin.assetKey);
    assert.ok(skin.image);
    assert.ok(skin.price >= 0);
    assert.ok(skin.buffTitle);
    assert.ok(skin.buffDescription);
    if (skin.id !== DEFAULT_SKIN_ID) {
      assert.ok(Object.keys(getSkinBuff(skin.id)).length > 0);
    }
  }
});
