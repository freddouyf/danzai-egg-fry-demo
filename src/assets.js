// Add alternate filenames here when your designer's PNG names are different.
// The loader tries each filename from left to right and keeps the first match.
export const ASSET_CANDIDATES = Object.freeze({
  danzaiStart: ["origin/资源 4.png", "danzai_start.png"],
  danzaiIdle: ["origin/资源 6.png", "danzai_idle.png", "旦仔_待机.png", "旦仔.png"],
  danzaiHappy: ["origin/资源 3.png", "danzai_happy.png", "旦仔_开心.png"],
  danzaiAction: [
    "origin/资源 7.png",
    "danzai_action.png",
    "旦仔_出锅.png",
    "danzai_flip.png",
  ],
  danzaiFail: ["origin/资源 1.png", "danzai_fail.png", "旦仔_失败.png"],
  danzaiCheer: ["origin/资源 2.png", "danzai_cheer.png"],
  danzaiCalm: ["origin/资源 5.png", "danzai_calm.png"],
  costumeDrummer: ["special/资源 1.png"],
  costumeSwordsman: ["special/资源 2.png"],
  costumeLeafDancer: ["special/资源 3.png"],
  costumeStoneAge: ["special/资源 4.png"],
  costumeCarrot: ["special/资源 5.png"],
  costumeDetective: ["special/资源 6.png"],
  costumeStreetCap: ["special/资源 7.png"],
  kitchenStage: ["generated/kitchen-stage.png"],
  panIron: ["generated/pans/pan-iron.png"],
  panCopper: ["generated/pans/pan-copper.png"],
  panGolden: ["generated/pans/pan-golden.png"],
  panCrystal: ["generated/pans/pan-crystal.png"],
  panLegendary: ["generated/pans/pan-legendary.png"],
  eggRaw: ["generated/eggs/egg-raw.png"],
  eggNormal: ["generated/eggs/egg-normal.png"],
  eggPerfect: ["generated/eggs/egg-perfect.png"],
  eggSinged: ["generated/eggs/egg-singed.png"],
  eggBurnt: ["generated/eggs/egg-burnt.png"],
  eggDoubleYolk: ["generated/eggs/egg-double-yolk.png"],
  eventDoubleYolk: ["generated/events/event-double-yolk.png"],
  eventGoldenHeat: ["generated/events/event-golden-heat.png"],
  eventAngryFire: ["generated/events/event-angry-fire.png"],
  eventSlowEgg: ["generated/events/event-slow-egg.png"],
  eventLuckyScallion: ["generated/events/event-lucky-scallion.png"],
  eventSpatulaCritical: ["generated/events/event-spatula-critical.png"],
  eventPanCrisis: ["generated/events/event-pan-crisis.png"],
  eventDanzaiCheer: ["generated/events/event-danzai-cheer.png"],
  eventTimeWarp: ["generated/events/event-time-warp.png"],
  eventJackpot: ["generated/events/event-jackpot.png"],
  eventDevilFire: ["generated/events/event-devil-fire.png"],
  eventBlindHeat: ["generated/events/event-blind-heat.png"],
  uiEventFrame: ["generated/ui/ui-event-frame.png"],
  uiGoalFrame: ["generated/ui/ui-goal-frame.png"],
  uiRewardBurst: ["generated/ui/ui-reward-burst.png"],
  uiRibbon: ["generated/ui/ui-ribbon.png"],
  uiSparkles: ["generated/ui/ui-sparkles.png"],
  uiCoins: ["generated/ui/ui-coins.png"],
  uiHearts: ["generated/ui/ui-hearts.png"],
  uiScallionConfetti: ["generated/ui/ui-scallion-confetti.png"],
  pan: ["pan.png", "平底锅.png"],
  egg: ["egg.png", "鸡蛋.png"],
  logo: ["logo.png", "旦仔煎蛋挑战_logo.png"],
});

function loadImage(path) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = path;
  });
}

async function loadFirstAvailable(filenames) {
  for (const filename of filenames) {
    const encodedPath = filename.split("/").map(encodeURIComponent).join("/");
    const image = await loadImage(`/assets/${encodedPath}`);
    if (image) {
      return image;
    }
  }
  return null;
}

export async function loadAssets(candidates = ASSET_CANDIDATES) {
  const entries = await Promise.all(
    Object.entries(candidates).map(async ([key, filenames]) => [
      key,
      await loadFirstAvailable(filenames),
    ]),
  );
  return Object.fromEntries(entries);
}

export function chooseDanzaiAsset(assets, mood = "idle") {
  const moodMap = {
    start: assets.danzaiStart,
    idle: assets.danzaiIdle,
    action: assets.danzaiAction,
    happy: assets.danzaiHappy,
    fail: assets.danzaiFail,
    cheer: assets.danzaiCheer,
    calm: assets.danzaiCalm,
  };
  return moodMap[mood] || assets.danzaiIdle || null;
}

export function choosePanAsset(assets, level = 1) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  const key = [
    "panIron",
    "panCopper",
    "panGolden",
    "panCrystal",
    "panLegendary",
  ][Math.min(5, safeLevel) - 1];
  return assets[key] || assets.pan || null;
}

export function chooseEggAsset(assets, heat = 0, effect = null) {
  if (effect?.doubleYolk && assets.eggDoubleYolk) return assets.eggDoubleYolk;
  const value = Math.max(0, Math.min(100, Number(heat) || 0));
  if (value >= 96) return assets.eggBurnt || assets.egg;
  if (value >= 86) return assets.eggSinged || assets.egg;
  if (value >= 70) return assets.eggPerfect || assets.egg;
  if (value >= 40) return assets.eggNormal || assets.egg;
  return assets.eggRaw || assets.egg || null;
}

const EVENT_ASSET_KEYS = Object.freeze({
  "double-yolk": "eventDoubleYolk",
  "golden-heat": "eventGoldenHeat",
  "angry-fire": "eventAngryFire",
  "slow-egg": "eventSlowEgg",
  "lucky-scallion": "eventLuckyScallion",
  "spatula-critical": "eventSpatulaCritical",
  "pan-crisis": "eventPanCrisis",
  "danzai-cheer": "eventDanzaiCheer",
  "time-warp": "eventTimeWarp",
  jackpot: "eventJackpot",
  "devil-fire": "eventDevilFire",
  "blind-heat": "eventBlindHeat",
});

export function chooseEventAsset(assets, eventId) {
  const key = EVENT_ASSET_KEYS[eventId];
  return key ? assets[key] || null : null;
}
