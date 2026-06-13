export const SKIN_CATALOG = Object.freeze([
  {
    id: "default",
    name: "经典旦仔",
    image: "/assets/origin/%E8%B5%84%E6%BA%90%204.png",
    assetKey: "danzaiStart",
    price: 0,
    tagline: "最熟悉的元气原型",
    buffTitle: "稳定手感",
    buffDescription: "无额外被动，适合默认手感",
    buff: {},
  },
  {
    id: "drummer",
    name: "鼓手旦仔",
    image: "/assets/special/%E8%B5%84%E6%BA%90%201.png",
    assetKey: "costumeDrummer",
    price: 60,
    tagline: "暴击时自带节拍",
    buffTitle: "连击鼓点",
    buffDescription: "连击狂欢每次额外 +1 连击",
    buff: { coinRushTapBonus: 1 },
  },
  {
    id: "swordsman",
    name: "竹叶剑侠",
    image: "/assets/special/%E8%B5%84%E6%BA%90%202.png",
    assetKey: "costumeSwordsman",
    price: 120,
    tagline: "出锅快准狠",
    buffTitle: "剑心",
    buffDescription: "目标区域向两侧各扩大 4%",
    buff: { perfectPadding: 4 },
  },
  {
    id: "leaf-dancer",
    name: "绿叶舞者",
    image: "/assets/special/%E8%B5%84%E6%BA%90%203.png",
    assetKey: "costumeLeafDancer",
    price: 90,
    tagline: "锅边旋转登场",
    buffTitle: "连舞",
    buffDescription: "目标区域向两侧各扩大 2%",
    buff: { perfectPadding: 2 },
  },
  {
    id: "stone-age",
    name: "石器旦仔",
    image: "/assets/special/%E8%B5%84%E6%BA%90%204.png",
    assetKey: "costumeStoneAge",
    price: 100,
    tagline: "原始火力全开",
    buffTitle: "原始猛火",
    buffDescription: "火力更快，节奏更刺激",
    buff: { heatSpeedMultiplier: 1.15 },
  },
  {
    id: "carrot",
    name: "萝卜旦仔",
    image: "/assets/special/%E8%B5%84%E6%BA%90%205.png",
    assetKey: "costumeCarrot",
    price: 40,
    tagline: "便宜又醒目",
    buffTitle: "守锅",
    buffDescription: "每关可以救回 1 次失误",
    buff: { stageGuard: 1 },
  },
  {
    id: "detective",
    name: "侦探旦仔",
    image: "/assets/special/%E8%B5%84%E6%BA%90%206.png",
    assetKey: "costumeDetective",
    price: 180,
    tagline: "火候真相只有一个",
    buffTitle: "事件推理",
    buffDescription: "随机事件额外抽一次，保留更稀有结果",
    buff: { eventDraws: 1 },
  },
  {
    id: "street-cap",
    name: "潮帽旦仔",
    image: "/assets/special/%E8%B5%84%E6%BA%90%207.png",
    assetKey: "costumeStreetCap",
    price: 150,
    tagline: "街头锅王登场",
    buffTitle: "硬核体质",
    buffDescription: "开局额外 +1 颗心",
    buff: { maxHealthBonus: 1 },
  },
]);

export const DEFAULT_SKIN_ID = "default";

export function findSkin(id) {
  return SKIN_CATALOG.find((skin) => skin.id === id) || null;
}

export function getSkinBuff(id) {
  return { ...(findSkin(id)?.buff || {}) };
}

export function normalizeWardrobe(value = {}) {
  const validIds = new Set(SKIN_CATALOG.map((skin) => skin.id));
  const owned = new Set(
    Array.isArray(value.owned) ? value.owned.filter((id) => validIds.has(id)) : [],
  );
  owned.add(DEFAULT_SKIN_ID);
  const equipped =
    validIds.has(value.equipped) && owned.has(value.equipped)
      ? value.equipped
      : DEFAULT_SKIN_ID;
  return {
    owned: [...owned],
    equipped,
  };
}

export function buySkin(wardrobe, balance, skinId) {
  const current = normalizeWardrobe(wardrobe);
  const skin = findSkin(skinId);
  const coins = Math.max(0, Number(balance) || 0);
  if (!skin) return { ok: false, reason: "unknown", wardrobe: current, balance: coins };
  if (current.owned.includes(skin.id)) {
    return {
      ok: true,
      reason: "owned",
      wardrobe: { ...current, equipped: skin.id },
      balance: coins,
    };
  }
  if (coins < skin.price) {
    return { ok: false, reason: "insufficient", wardrobe: current, balance: coins };
  }
  return {
    ok: true,
    reason: "purchased",
    wardrobe: {
      owned: [...current.owned, skin.id],
      equipped: skin.id,
    },
    balance: coins - skin.price,
  };
}

export function equipSkin(wardrobe, skinId) {
  const current = normalizeWardrobe(wardrobe);
  if (!current.owned.includes(skinId) || !findSkin(skinId)) {
    return { ok: false, wardrobe: current };
  }
  return {
    ok: true,
    wardrobe: { ...current, equipped: skinId },
  };
}
