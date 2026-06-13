import "./style.css";
import {
  chooseDanzaiAsset,
  chooseEventAsset,
  choosePanAsset,
  loadAssets,
} from "./assets.js";
import {
  awakenedUpgradeCount,
  BUILD_FAMILIES,
  buildFamilyCount,
  classifyHeat,
  EggFryGame,
  EVENT_DEFINITIONS,
  getHitQuality,
  getHitWindow,
  getUpgradePreview,
  HIT_QUALITY,
} from "./game.js";
import { GameRenderer } from "./renderer.js";
import {
  buySkin,
  equipSkin,
  findSkin,
  getSkinBuff,
  normalizeWardrobe,
  SKIN_CATALOG,
} from "./skins.js";
import {
  collectionProgress,
  discoverEvent,
  normalizeProgress,
  recordRun,
} from "./progression.js";

const RARITY_LABELS = {
  normal: "普通",
  common: "普通",
  rare: "稀有",
  epic: "史诗",
  danger: "高危",
  legendary: "传说",
};
const RARITY_CLASSES = Object.keys(RARITY_LABELS).map((rarity) => `rarity-${rarity}`);
const WALLET_KEY = "danzai-egg-fry-wallet";
const WARDROBE_KEY = "danzai-egg-fry-wardrobe";
const PROGRESS_KEY = "danzai-egg-fry-progress";
const EVENT_IDS = EVENT_DEFINITIONS.map((event) => event.id);

const elements = {
  app: document.querySelector("#app"),
  startOverlay: document.querySelector("#startOverlay"),
  shopOverlay: document.querySelector("#shopOverlay"),
  recordsOverlay: document.querySelector("#recordsOverlay"),
  mechanicsOverlay: document.querySelector("#mechanicsOverlay"),
  upgradeOverlay: document.querySelector("#upgradeOverlay"),
  upgradeTitle: document.querySelector("#upgradeTitle"),
  pauseOverlay: document.querySelector("#pauseOverlay"),
  resultOverlay: document.querySelector("#resultOverlay"),
  resultCard: document.querySelector("#resultOverlay .result-card"),
  upgradeOptions: document.querySelector("#upgradeOptions"),
  upgradeCopy: document.querySelector("#upgradeCopy"),
  upgradeRerollButton: document.querySelector("#upgradeRerollButton"),
  upgradeRerollCount: document.querySelector("#upgradeRerollCount"),
  startButton: document.querySelector("#startButton"),
  shopButton: document.querySelector("#shopButton"),
  shopCloseButton: document.querySelector("#shopCloseButton"),
  recordsButton: document.querySelector("#recordsButton"),
  recordsCloseButton: document.querySelector("#recordsCloseButton"),
  mechanicsButton: document.querySelector("#mechanicsButton"),
  mechanicsCloseButton: document.querySelector("#mechanicsCloseButton"),
  mechanicsDoneButton: document.querySelector("#mechanicsDoneButton"),
  pauseMechanicsButton: document.querySelector("#pauseMechanicsButton"),
  restartButton: document.querySelector("#restartButton"),
  continueButton: document.querySelector("#continueButton"),
  homeButton: document.querySelector("#homeButton"),
  pauseButton: document.querySelector("#pauseButton"),
  resumeButton: document.querySelector("#resumeButton"),
  pauseHomeButton: document.querySelector("#pauseHomeButton"),
  actionButton: document.querySelector("#actionButton"),
  actionIcon: document.querySelector("#actionIcon"),
  actionLabel: document.querySelector("#actionLabel"),
  canvas: document.querySelector("#gameCanvas"),
  time: document.querySelector("#timeValue"),
  score: document.querySelector("#scoreValue"),
  scoreLabel: document.querySelector("#scoreLabel"),
  combo: document.querySelector("#comboValue"),
  comboCard: document.querySelector("#comboCard"),
  level: document.querySelector("#levelValue"),
  shield: document.querySelector("#shieldValue"),
  eventBubble: document.querySelector("#eventBubble"),
  eventIcon: document.querySelector("#eventIcon"),
  eventTitle: document.querySelector("#eventTitle"),
  toast: document.querySelector("#toast"),
  scoreBurst: document.querySelector("#scoreBurst"),
  scoreBurstValue: document.querySelector("#scoreBurstValue"),
  scoreBurstLabel: document.querySelector("#scoreBurstLabel"),
  scoreBurstReasons: document.querySelector("#scoreBurstReasons"),
  impactBanner: document.querySelector("#impactBanner"),
  impactIcon: document.querySelector("#impactIcon"),
  impactTitle: document.querySelector("#impactTitle"),
  impactSubtitle: document.querySelector("#impactSubtitle"),
  panAwaken: document.querySelector("#panAwaken"),
  panAwakenIcon: document.querySelector("#panAwakenIcon"),
  panAwakenKicker: document.querySelector("#panAwakenKicker"),
  panAwakenName: document.querySelector("#panAwakenName"),
  panAwakenGoal: document.querySelector("#panAwakenGoal"),
  panAwakenTrait: document.querySelector("#panAwakenTrait"),
  panReadyButton: document.querySelector("#panReadyButton"),
  recipeStrip: document.querySelector("#recipeStrip"),
  heatRow: document.querySelector("#heatRow"),
  heatFill: document.querySelector("#heatFill"),
  heatMarker: document.querySelector("#heatMarker"),
  goodZone: document.querySelector("#goodZone"),
  perfectZone: document.querySelector("#perfectZone"),
  buildTargetZone: document.querySelector("#buildTargetZone"),
  buildRouteBadge: document.querySelector("#buildRouteBadge"),
  actionBuildBadge: document.querySelector("#actionBuildBadge"),
  finalScoreLabel: document.querySelector("#finalScoreLabel"),
  finalScore: document.querySelector("#finalScore"),
  finalEggs: document.querySelector("#finalEggs"),
  finalCombo: document.querySelector("#finalCombo"),
  finalPerfect: document.querySelector("#finalPerfect"),
  finalCoins: document.querySelector("#finalCoins"),
  resultTitle: document.querySelector("#resultTitle"),
  resultKicker: document.querySelector("#resultKicker"),
  resultComment: document.querySelector("#resultComment"),
  continueLabel: document.querySelector("#continueLabel"),
  startMascot: document.querySelector("#startMascot"),
  resultMascot: document.querySelector("#resultMascot"),
  logoArea: document.querySelector("#logoArea"),
  walletCoins: document.querySelector("#walletCoins"),
  shopBalance: document.querySelector("#shopBalance"),
  shopMessage: document.querySelector("#shopMessage"),
  skinGrid: document.querySelector("#skinGrid"),
  shopPreviewMascot: document.querySelector("#shopPreviewMascot"),
  shopEquippedName: document.querySelector("#shopEquippedName"),
  equippedSkinLabel: document.querySelector("#equippedSkinLabel"),
  homeBestScore: document.querySelector("#homeBestScore"),
  homeBestLevel: document.querySelector("#homeBestLevel"),
  homeEventProgress: document.querySelector("#homeEventProgress"),
  recordBestScore: document.querySelector("#recordBestScore"),
  recordBestLevel: document.querySelector("#recordBestLevel"),
  recordBestCombo: document.querySelector("#recordBestCombo"),
  recordTotalRuns: document.querySelector("#recordTotalRuns"),
  eventCollectionText: document.querySelector("#eventCollectionText"),
  eventCollectionFill: document.querySelector("#eventCollectionFill"),
  skinCollectionText: document.querySelector("#skinCollectionText"),
  skinCollectionFill: document.querySelector("#skinCollectionFill"),
  careerSummary: document.querySelector("#careerSummary"),
  eventCodex: document.querySelector("#eventCodex"),
};

export const game = new EggFryGame();
if (import.meta.env.DEV) window.__danzaiGame = game;
const renderer = new GameRenderer(elements.canvas);
let loadedAssets = {};
let lastFrameAt = performance.now();
let toastTimer = null;
let impactTimer = null;
let scoreBurstTimer = null;
let panAwakenTimer = null;
let stageResultTimer = null;
let pendingPanIntroEvent = null;
let walletCoins = readWallet();
let wardrobe = readWardrobe();
let progress = readProgress();
let audioContext = null;

function readWallet() {
  try {
    return Math.max(0, Number.parseInt(localStorage.getItem(WALLET_KEY) || "0", 10) || 0);
  } catch {
    return 0;
  }
}

function saveWallet(value) {
  walletCoins = Math.max(0, value);
  elements.walletCoins.textContent = walletCoins;
  elements.shopBalance.textContent = walletCoins;
  try {
    localStorage.setItem(WALLET_KEY, String(walletCoins));
  } catch {
    // Private browsing can reject storage; the current run still works.
  }
}

function readWardrobe() {
  try {
    return normalizeWardrobe(JSON.parse(localStorage.getItem(WARDROBE_KEY) || "{}"));
  } catch {
    return normalizeWardrobe();
  }
}

function saveWardrobe(nextWardrobe) {
  wardrobe = normalizeWardrobe(nextWardrobe);
  try {
    localStorage.setItem(WARDROBE_KEY, JSON.stringify(wardrobe));
  } catch {
    // The equipped skin still works for the current page.
  }
  applyEquippedSkin();
  renderHomeProgress();
}

function readProgress() {
  try {
    return normalizeProgress(
      JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"),
      EVENT_IDS,
    );
  } catch {
    return normalizeProgress({}, EVENT_IDS);
  }
}

function saveProgress(nextProgress) {
  progress = normalizeProgress(nextProgress, EVENT_IDS);
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Records remain available until the page closes.
  }
  renderHomeProgress();
}

function vibrate(pattern) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function ensureAudio() {
  if (audioContext) {
    if (audioContext.state === "suspended") audioContext.resume();
    return;
  }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) audioContext = new AudioContext();
}

function playTone(frequency, duration = 0.08, options = {}) {
  if (!audioContext) return;
  const { delay = 0, gain = 0.035, type = "sine", endFrequency = frequency } = options;
  const startAt = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), startAt + duration);
  volume.gain.setValueAtTime(0.0001, startAt);
  volume.gain.exponentialRampToValueAtTime(gain, startAt + 0.012);
  volume.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function playCue(name, rarity = "normal") {
  if (!audioContext) return;
  if (name === "good") {
    playTone(410, 0.08, { endFrequency: 720, type: "triangle" });
  } else if (name === "perfect") {
    playTone(660, 0.12, { gain: 0.045 });
    playTone(880, 0.16, { delay: 0.07, gain: 0.04 });
    playTone(1100, 0.18, { delay: 0.14, gain: 0.035 });
  } else if (name === "streak3") {
    playTone(620, 0.1, { gain: 0.045, type: "triangle" });
    playTone(840, 0.13, { delay: 0.06, gain: 0.045, type: "triangle" });
    playTone(1080, 0.16, { delay: 0.12, gain: 0.04, type: "triangle" });
  } else if (name === "fever") {
    playTone(440, 0.14, { gain: 0.05, type: "square" });
    playTone(660, 0.18, { delay: 0.07, gain: 0.05, type: "triangle" });
    playTone(990, 0.24, { delay: 0.14, gain: 0.055, type: "triangle" });
    playTone(1320, 0.28, { delay: 0.22, gain: 0.045, type: "triangle" });
  } else if (name === "burn") {
    playTone(150, 0.24, { endFrequency: 62, type: "sawtooth", gain: 0.035 });
  } else if (name === "upgrade") {
    playTone(520, 0.1, { type: "triangle" });
    playTone(780, 0.15, { delay: 0.08, type: "triangle" });
  } else if (name === "event") {
    if (rarity === "legendary") {
      playTone(280, 0.18, { type: "square", gain: 0.025 });
      playTone(840, 0.28, { delay: 0.1, type: "triangle", gain: 0.045 });
    } else if (rarity === "danger") {
      playTone(220, 0.12, { endFrequency: 120, type: "sawtooth", gain: 0.03 });
      playTone(220, 0.12, { delay: 0.16, endFrequency: 120, type: "sawtooth", gain: 0.03 });
    } else {
      playTone(rarity === "epic" ? 720 : 560, 0.12, { endFrequency: 880, type: "triangle" });
    }
  }
}

function fallbackMascotMarkup() {
  return `
    <div class="fallback-danzai">
      <span class="mouth"></span>
      <span class="cheek"></span>
    </div>
  `;
}

function getEquippedImage(includeDefault = false) {
  const skin = findSkin(wardrobe.equipped);
  if (!includeDefault && skin?.id === "default") return null;
  return skin ? loadedAssets[skin.assetKey] || null : null;
}

function mountMascot(container, mood) {
  const image = getEquippedImage() || chooseDanzaiAsset(loadedAssets, mood);
  container.replaceChildren();
  if (image) {
    const element = image.cloneNode();
    element.alt = "";
    container.append(element);
  } else {
    container.innerHTML = fallbackMascotMarkup();
  }
}

function mountShopPreview() {
  const skin = findSkin(wardrobe.equipped);
  elements.shopPreviewMascot.replaceChildren();
  const image = getEquippedImage(true);
  if (image) {
    const element = image.cloneNode();
    element.alt = "";
    elements.shopPreviewMascot.append(element);
  } else {
    elements.shopPreviewMascot.innerHTML = fallbackMascotMarkup();
  }
  elements.shopEquippedName.textContent = skin?.name || "经典旦仔";
  elements.equippedSkinLabel.textContent = `当前：${skin?.name || "经典旦仔"}`;
}

function applyEquippedSkin() {
  const skin = findSkin(wardrobe.equipped);
  renderer.setEquippedSkin(skin?.assetKey || null);
  mountMascot(elements.startMascot, "start");
  mountShopPreview();
  if (elements.resultOverlay.classList.contains("is-visible")) {
    mountMascot(elements.resultMascot, "happy");
  }
}

function mountLoadedAssets() {
  renderer.setAssets(loadedAssets);
  applyEquippedSkin();
  if (elements.recordsOverlay.classList.contains("is-visible")) renderRecords();
  if (loadedAssets.logo) {
    elements.logoArea.replaceChildren();
    const logo = loadedAssets.logo.cloneNode();
    logo.alt = "旦仔煎蛋挑战";
    elements.logoArea.append(logo);
    elements.logoArea.classList.add("has-image");
  }
}

function renderShop() {
  elements.shopBalance.textContent = walletCoins;
  mountShopPreview();
  elements.skinGrid.replaceChildren();

  for (const skin of SKIN_CATALOG) {
    const owned = wardrobe.owned.includes(skin.id);
    const equipped = wardrobe.equipped === skin.id;
    const card = document.createElement("article");
    card.className = `skin-card${equipped ? " is-equipped" : ""}`;

    const imageWrap = document.createElement("div");
    imageWrap.className = "skin-card-image";
    const image = document.createElement("img");
    image.src = skin.image;
    image.alt = skin.name;
    imageWrap.append(image);

    const copy = document.createElement("div");
    copy.className = "skin-card-copy";
    const name = document.createElement("strong");
    name.textContent = skin.name;
    const tagline = document.createElement("small");
    tagline.textContent = `${skin.buffTitle}：${skin.buffDescription}`;
    copy.append(name, tagline);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "skin-buy-button";
    if (equipped) {
      button.textContent = "已装备";
      button.disabled = true;
    } else if (owned) {
      button.textContent = "装备";
    } else {
      button.textContent = skin.price === 0 ? "免费解锁" : `🪙 ${skin.price}`;
      button.classList.toggle("is-expensive", walletCoins < skin.price);
    }
    button.addEventListener("click", () => handleSkinAction(skin.id));
    card.append(imageWrap, copy, button);
    elements.skinGrid.append(card);
  }
}

function handleSkinAction(skinId) {
  ensureAudio();
  const skin = findSkin(skinId);
  if (!skin) return;

  if (wardrobe.owned.includes(skinId)) {
    const result = equipSkin(wardrobe, skinId);
    if (result.ok) {
      saveWardrobe(result.wardrobe);
      elements.shopMessage.textContent = `${skin.name} 已装备，下一锅就穿这套！`;
      playCue("upgrade");
      vibrate(35);
    }
  } else {
    const result = buySkin(wardrobe, walletCoins, skinId);
    if (!result.ok) {
      elements.shopMessage.textContent =
        `还差 ${Math.max(0, skin.price - walletCoins)} 金币，再挑战几关就能带走！`;
      vibrate(25);
      return;
    }
    saveWallet(result.balance);
    saveWardrobe(result.wardrobe);
    elements.shopMessage.textContent = `购买成功！${skin.name} 已自动装备。`;
    playCue("perfect");
    vibrate([40, 25, 70]);
  }
  renderShop();
}

function openShop() {
  ensureAudio();
  elements.shopMessage.textContent = "购买后永久拥有，可随时回来换装。";
  renderShop();
  elements.shopOverlay.classList.add("is-visible");
}

function closeShop() {
  elements.shopOverlay.classList.remove("is-visible");
}

function renderHomeProgress() {
  const eventProgress = collectionProgress(
    progress.discoveredEvents.length,
    EVENT_DEFINITIONS.length,
  );
  elements.homeBestScore.textContent =
    progress.totalCoinsEarned.toLocaleString("zh-CN");
  elements.homeBestLevel.textContent = progress.bestLevel;
  elements.homeEventProgress.textContent = `${eventProgress.count}/${eventProgress.total}`;
}

function renderRecords() {
  const eventProgress = collectionProgress(
    progress.discoveredEvents.length,
    EVENT_DEFINITIONS.length,
  );
  const skinProgress = collectionProgress(wardrobe.owned.length, SKIN_CATALOG.length);
  elements.recordBestScore.textContent =
    progress.totalCoinsEarned.toLocaleString("zh-CN");
  elements.recordBestLevel.textContent = progress.bestLevel;
  elements.recordBestCombo.textContent = progress.bestCombo;
  elements.recordTotalRuns.textContent = progress.totalRuns;
  elements.eventCollectionText.textContent =
    `${eventProgress.count} / ${eventProgress.total}`;
  elements.eventCollectionFill.style.width = `${eventProgress.percent}%`;
  elements.skinCollectionText.textContent = `${skinProgress.count} / ${skinProgress.total}`;
  elements.skinCollectionFill.style.width = `${skinProgress.percent}%`;
  elements.careerSummary.textContent =
    `累计完成 ${progress.totalEggs} 颗蛋 · Perfect ${progress.totalPerfects} 次 · 赚取 ${progress.totalCoinsEarned} 金币`;

  elements.eventCodex.replaceChildren();
  for (const event of EVENT_DEFINITIONS) {
    const discovered = progress.discoveredEvents.includes(event.id);
    const card = document.createElement("article");
    card.className = `codex-card rarity-${event.rarity}${discovered ? "" : " is-locked"}`;
    if (discovered) {
      card.innerHTML = `
        <span>${event.icon}</span>
        <div>
          <strong>${event.title}</strong>
          <small>${event.message}</small>
        </div>
        <b>${RARITY_LABELS[event.rarity] || "特殊"}</b>
      `;
      setEventArt(card.querySelector(":scope > span"), event);
    } else {
      card.innerHTML = `
        <span>？</span>
        <div>
          <strong>尚未遭遇</strong>
          <small>继续爆炒，等待随机惊喜</small>
        </div>
        <b>未解锁</b>
      `;
    }
    elements.eventCodex.append(card);
  }
}

function openRecords() {
  renderRecords();
  elements.recordsOverlay.classList.add("is-visible");
}

function closeRecords() {
  elements.recordsOverlay.classList.remove("is-visible");
}

function openMechanics({ pause = false } = {}) {
  if (pause && game.state === "playing") pauseGame();
  elements.mechanicsOverlay.classList.add("is-visible");
}

function closeMechanics({ resume = false } = {}) {
  elements.mechanicsOverlay.classList.remove("is-visible");
  if (resume && game.state === "paused") resumeGame();
}

function resetTransientGameUi() {
  window.clearTimeout(toastTimer);
  window.clearTimeout(impactTimer);
  window.clearTimeout(scoreBurstTimer);
  window.clearTimeout(panAwakenTimer);
  elements.heatRow.classList.remove("is-blind", "is-coin-rush", "is-build-ready");
  elements.heatRow.dataset.status = "raw";
  elements.actionButton.classList.remove(
    "is-coin-rush",
    "is-build-ready",
    "is-awakening",
  );
  elements.actionButton.disabled = false;
  elements.actionIcon.textContent = "✓";
  elements.actionLabel.textContent = "出锅";
  elements.actionButton.setAttribute("aria-label", "出锅");
  elements.app.dataset.event = "none";
  elements.app.dataset.coinRush = "false";
  elements.app.dataset.comboMood = "normal";
  elements.app.dataset.lastHitQuality = "";
  elements.eventBubble.classList.remove(...RARITY_CLASSES);
  elements.eventBubble.classList.add("rarity-normal");
  elements.toast.classList.remove("is-visible");
  elements.impactBanner.classList.remove("is-visible", ...RARITY_CLASSES);
  elements.impactBanner.setAttribute("aria-hidden", "true");
  elements.scoreBurst.classList.remove(
    "is-visible",
    "is-perfect",
    "is-good",
    "is-fever",
    "is-burnt",
    "is-build",
    "is-goal",
  );
  elements.panAwaken.classList.remove("is-visible");
  elements.panAwaken.setAttribute("aria-hidden", "true");
}

function startGame() {
  ensureAudio();
  window.clearTimeout(stageResultTimer);
  pendingPanIntroEvent = null;
  resetTransientGameUi();
  elements.startOverlay.classList.remove("is-visible");
  elements.mechanicsOverlay.classList.remove("is-visible");
  elements.upgradeOverlay.classList.remove("is-visible");
  elements.pauseOverlay.classList.remove("is-visible");
  elements.resultOverlay.classList.remove("is-visible");
  game.setCharacterBuff(getSkinBuff(wardrobe.equipped));
  game.start();
  game.beginPanIntro(Number.POSITIVE_INFINITY);
  lastFrameAt = performance.now();
  handleGameEvents();
  updateInterface(game.getSnapshot());
}

function performAction() {
  if (game.state !== "playing") return;
  if (game.coinRushRemainingMs > 0) {
    game.tapCoinRush();
    handleGameEvents();
    return;
  }
  game.cook();
  handleGameEvents();
}

function presentEventTrigger(event) {
  const discovery = discoverEvent(progress, event.effect.id, EVENT_IDS);
  if (discovery.isNew) {
    saveProgress(discovery.progress);
    showToast(`📖 图鉴解锁：${event.effect.title}`);
  }
  replayClass(elements.eventBubble, "is-popping");
  replayClass(elements.app, "is-event-struck");
  renderer.triggerEvent(event.effect);
  showImpactBanner(event.effect, 1650);
  playCue("event", event.effect.rarity);
  vibrate(
    event.effect.rarity === "legendary"
      ? [70, 35, 110, 35, 70]
      : ["epic", "danger"].includes(event.effect.rarity)
        ? [55, 25, 80]
        : [35, 20, 45],
  );
}

function handleGameEvents() {
  for (const event of game.drainEvents()) {
    switch (event.type) {
      case "eggStarted":
        renderer.triggerEggStart();
        break;
      case "gameStarted":
        renderer.triggerStage(event.level, event.scoreMultiplier, event.panPerk);
        showPanAwaken(event.panPerk, event.level, event.target);
        playCue("upgrade");
        vibrate([35, 20, 55]);
        break;
      case "eventTriggered":
        if (game.panIntroRemainingMs > 0) {
          pendingPanIntroEvent = event;
        } else {
          presentEventTrigger(event);
        }
        break;
      case "panReady":
        if (pendingPanIntroEvent) {
          const deferredEvent = pendingPanIntroEvent;
          pendingPanIntroEvent = null;
          presentEventTrigger(deferredEvent);
        }
        break;
      case "autoServed":
        showImpactBanner({
          icon: event.upgrade?.icon || "🧲",
          title: "自动出锅！",
          short: "进入绿区，自动完成",
          rarity: "legendary",
        }, 700);
        playCue("perfect");
        vibrate([30, 15, 55]);
        break;
      case "buildBurst":
        renderer.triggerUpgrade(event.title, event.short);
        showImpactBanner(event, 1050);
        playCue(event.rarity === "legendary" ? "perfect" : "upgrade");
        vibrate(
          event.rarity === "legendary"
            ? [55, 25, 90, 30, 70]
            : [35, 20, 55],
        );
        break;
      case "burning":
        renderer.triggerBurn();
        playCue("burn");
        vibrate([55, 40, 55]);
        showToast("冒烟啦！快出锅！");
        break;
      case "heartLost":
        renderer.triggerBurn();
        replayClass(elements.app, "is-heart-hit");
        showImpactBanner({
          icon: "💔",
          title: event.missLabel || "失误啦！",
          short: `还剩 ${event.health} 颗心`,
          rarity: "danger",
        }, 900);
        playCue("burn");
        vibrate([80, 40, 100]);
        break;
      case "heartSaved":
        {
          const savedByEvent = event.source === "event";
          const savedByCharacter = event.source === "character";
          const savedByPan = event.source === "pan";
        showImpactBanner({
          icon: savedByEvent || savedByCharacter ? "💛" : savedByPan ? "🛡️" : "🛟",
          title: event.missLabel
            ? `${event.missLabel.replace("！", "")}，但没扣心！`
            : "这次没扣心！",
          short: savedByEvent
            ? "旦仔鼓励接住了这颗蛋"
            : savedByCharacter
              ? "角色被动挡住失误"
              : savedByPan
                ? "铜锅护心挡住本关第一次失误"
              : "回魂锅盖挡住失误",
          rarity: "epic",
        }, 850);
        playCue("upgrade");
        vibrate([35, 20, 55]);
        break;
        }
      case "heartRestored":
        showImpactBanner({
          icon: "❤️",
          title: "恢复 1 颗心！",
          short: event.source === "event" ? "爱心回锅生效" : "爱心便当生效",
          rarity: "epic",
        }, 850);
        playCue("perfect");
        vibrate([35, 20, 55]);
        break;
      case "coinRushStarted":
        renderer.triggerUpgrade("金币狂欢！", "狂点金币");
        showImpactBanner({
          icon: "🤑",
          title: "金币狂欢！",
          short: "狂点按钮，把金币敲出来！",
          rarity: "legendary",
        }, 1200);
        playCue("perfect");
        vibrate([45, 20, 70, 25, 90]);
        break;
      case "coinRushTap":
        showCoinTap(event);
        if (event.milestone) {
          playCue("perfect");
          vibrate([25, 15, 45]);
        } else {
          playCue("good");
          vibrate(10);
        }
        break;
      case "coinRushEnded":
        showToast(`金币狂欢结束！共点击 ${event.taps} 次`);
        break;
      case "served":
        renderer.triggerServe(event.result);
        showScoreBurst(event.result);
        showServeFeedback(event.result);
        if (event.result.combo > 0) replayClass(elements.comboCard, "is-bumping");
        if (event.result.isPerfect) {
          vibrate([35, 25, 65]);
          playCue("perfect");
        } else if (event.result.hitQuality === HIT_QUALITY.GOOD) {
          vibrate(18);
          playCue("good");
        }
        break;
      case "perfectStreakLively":
        renderer.triggerComboMood("lively", event.perfectStreak);
        showImpactBanner({
          icon: "✨",
          title: "Perfect x3 活力开锅！",
          short: "背景和旦仔都热起来了",
          rarity: "epic",
        }, 1150);
        playCue("streak3");
        vibrate([35, 20, 55]);
        break;
      case "perfectStreakFever":
        renderer.triggerComboMood("fever", event.perfectStreak);
        showImpactBanner({
          icon: "🎉",
          title: "Perfect x5 大狂欢！",
          short: "保持节奏，继续连中",
          rarity: "legendary",
        }, 1500);
        playCue("fever");
        vibrate([55, 25, 85, 30, 110]);
        break;
      case "stageGoalReached":
        renderer.triggerStageGoal(event.target);
        showImpactBanner({
          icon: "🍳",
          title: "本关完成！",
          message: "选择强化，继续下一关",
          rarity: "legendary",
        });
        playCue("perfect");
        vibrate([65, 30, 95]);
        break;
      case "upgradeDraft":
        showUpgradeDraft(event);
        vibrate([40, 25, 40]);
        break;
      case "upgradeDraftRerolled":
        showUpgradeDraft(event);
        playCue("good");
        vibrate([25, 15, 35]);
        break;
      case "upgradeSelected":
        elements.upgradeOverlay.classList.remove("is-visible");
        const selectedFamily =
          BUILD_FAMILIES[event.activeBuildFamily || event.upgrade.family];
        const upgradeImpact = event.awakened
          ? {
              icon: event.upgrade.icon,
              title: `${event.upgrade.name}完全体！`,
              short: event.preview.headline,
              rarity: "legendary",
              duration: 1550,
            }
          : event.familyMilestone
            ? {
                icon: event.familyMilestone.icon,
                title:
                  event.familyMilestone.count >= 3
                    ? `${event.familyMilestone.name}流派完全体！`
                    : `${event.familyMilestone.name}联动启动！`,
                short: BUILD_FAMILIES[event.familyMilestone.id].stance,
                rarity:
                  event.familyMilestone.multiplier >= 4 ? "legendary" : "epic",
                duration: 1450,
              }
            : {
                icon: event.upgrade.icon,
                title: `${event.upgrade.name}装入锅具！`,
                short: event.preview.headline,
                rarity: event.upgrade.rarity,
                duration: 1150,
              };
        renderer.triggerUpgrade(upgradeImpact.title, upgradeImpact.short);
        playCue("upgrade");
        showImpactBanner(upgradeImpact, upgradeImpact.duration);
        vibrate(
          event.awakened || event.familyMilestone
            ? [65, 30, 100, 35, 80]
            : [45, 25, 75],
        );
        break;
      case "panPerkTriggered":
        renderer.triggerPanPerk(event);
        showToast(`${event.panPerk.icon} ${event.label}：${event.message}`);
        playCue(
          ["golden-feast", "legendary-resonance"].includes(event.kind)
            ? "perfect"
            : "upgrade",
        );
        vibrate(
          event.kind === "legendary-resonance"
            ? [55, 25, 90]
            : event.kind === "crystal-charge"
              ? [35, 20, 55]
              : 24,
        );
        break;
      case "invalidAction":
        showToast(event.message);
        break;
      case "gameEnded":
        saveWallet(walletCoins + event.coinsEarned);
        {
          const recorded = recordRun(progress, event, EVENT_IDS);
          saveProgress(recorded.progress);
          event.records = recorded.records;
          event.hasNewRecord = recorded.hasNewRecord;
        }
        if (!event.silent) showFinalResults(event);
        break;
      case "stageEnded":
        window.clearTimeout(stageResultTimer);
        if (!event.canContinue) {
          game.cashOut();
          handleGameEvents();
          break;
        }
        stageResultTimer = window.setTimeout(
          () => showStageResults(event),
          650,
        );
        break;
      case "stageStarted":
        elements.resultOverlay.classList.remove("is-visible");
        pendingPanIntroEvent = null;
        game.beginPanIntro(Number.POSITIVE_INFINITY);
        lastFrameAt = performance.now();
        renderer.triggerStage(event.level, event.scoreMultiplier, event.panPerk);
        showPanAwaken(event.panPerk, event.level, event.target);
        playCue("perfect");
        vibrate([50, 30, 85]);
        break;
      case "gamePaused":
        elements.pauseOverlay.classList.add("is-visible");
        break;
      case "gameResumed":
        elements.pauseOverlay.classList.remove("is-visible");
        break;
      default:
        break;
    }
  }
}

function showUpgradeDraft({
  choices,
  rerolls = 0,
}) {
  elements.upgradeTitle.textContent = "选个新花样";
  elements.upgradeCopy.textContent = "";
  elements.upgradeRerollCount.textContent = rerolls;
  elements.upgradeRerollButton.disabled = rerolls <= 0;
  elements.upgradeOptions.replaceChildren();
  for (const choice of choices) {
    const currentStacks = game.upgrades[choice.id] || 0;
    const preview = getUpgradePreview(choice.id, currentStacks);
    const family = BUILD_FAMILIES[choice.family];
    const isMainRoute =
      !game.activeBuildFamily || game.activeBuildFamily === choice.family;
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      `upgrade-option rarity-${choice.rarity} family-${family.color}` +
      (isMainRoute ? " is-synergy" : "") +
      (preview.awakening ? " is-awakening-card" : "");
    button.dataset.upgradeId = choice.id;
    button.innerHTML = `
      <span class="upgrade-option-icon">${choice.icon}</span>
      <span class="upgrade-option-copy">
        <span class="upgrade-family" aria-label="${family.name}">${family.icon}</span>
        <span class="upgrade-name-row"><strong>${choice.name}</strong></span>
        <em>${preview.headline}</em>
        ${preview.awakening ? `<b class="upgrade-awakening">完全体</b>` : ""}
      </span>
    `;
    button.addEventListener("click", () => {
      game.selectUpgrade(choice.id);
      handleGameEvents();
    });
    elements.upgradeOptions.append(button);
  }
  elements.upgradeOverlay.classList.add("is-visible");
}

function rerollUpgradeDraft() {
  if (!game.rerollUpgradeDraft()) return;
  handleGameEvents();
}

function showServeFeedback(result) {
  if (result.preservedByShield) {
    showToast("🛟 糊锅回魂！这颗蛋救回来了");
  } else if (result.isBurnt) {
    const protectedText = result.preservedCombo
        ? "旦仔替你保住了连击！"
        : "糊锅啦，连击清零！";
    showToast(protectedText);
  }
}

function showImpactBanner(effect, duration = 850) {
  window.clearTimeout(impactTimer);
  setEventArt(elements.impactIcon, effect);
  elements.impactTitle.textContent = effect.title;
  elements.impactSubtitle.textContent = effect.short || effect.message;
  elements.impactBanner.classList.remove("is-visible", ...RARITY_CLASSES);
  elements.impactBanner.classList.add(`rarity-${effect.rarity}`);
  elements.impactBanner.style.setProperty("--impact-duration", `${duration}ms`);
  elements.impactBanner.setAttribute("aria-hidden", "false");
  void elements.impactBanner.offsetWidth;
  elements.impactBanner.classList.add("is-visible");
  impactTimer = window.setTimeout(() => {
    elements.impactBanner.classList.remove("is-visible");
    elements.impactBanner.setAttribute("aria-hidden", "true");
  }, duration);
}

function setEventArt(element, effect) {
  const image = chooseEventAsset(loadedAssets, effect?.id);
  element.classList.toggle("has-art", Boolean(image));
  if (image) {
    element.textContent = "";
    element.style.backgroundImage = `url("${image.src}")`;
  } else {
    element.textContent = effect?.icon || "✨";
    element.style.removeProperty("background-image");
  }
}

function showPanAwaken(panPerk, level) {
  window.clearTimeout(panAwakenTimer);
  const panImage = choosePanAsset(loadedAssets, level);
  elements.panAwakenIcon.classList.toggle("has-art", Boolean(panImage));
  if (panImage) {
    elements.panAwakenIcon.textContent = "";
    elements.panAwakenIcon.style.backgroundImage = `url("${panImage.src}")`;
  } else {
    elements.panAwakenIcon.textContent = panPerk.icon;
    elements.panAwakenIcon.style.removeProperty("background-image");
  }
  elements.panAwakenKicker.textContent = `第 ${level} 关`;
  elements.panAwakenName.textContent = "守住三颗心";
  elements.panAwakenGoal.textContent = "坚持 10 秒";
  elements.panAwakenTrait.textContent = `${panPerk.icon} ${panPerk.short}`;
  elements.panReadyButton.textContent = "确认开火";
  elements.panAwaken.className = `pan-awaken pan-${panPerk.id}`;
  elements.panAwaken.setAttribute("aria-hidden", "false");
  void elements.panAwaken.offsetWidth;
  elements.panAwaken.classList.add("is-visible");
}

function confirmPanReady() {
  if (!game.confirmPanIntro()) return;
  elements.panAwaken.classList.remove("is-visible");
  elements.panAwaken.setAttribute("aria-hidden", "true");
  lastFrameAt = performance.now();
  handleGameEvents();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 1750);
}

function showScoreBurst(result) {
  window.clearTimeout(scoreBurstTimer);
  elements.scoreBurstValue.textContent =
    result.hitQuality === HIT_QUALITY.PERFECT ? "Perfect!" : "Good!";
  elements.scoreBurstLabel.textContent =
    result.hitQuality === HIT_QUALITY.PERFECT
      ? `Perfect 连中 ×${result.perfectStreak}`
      : "稳稳出锅";
  elements.scoreBurstReasons.replaceChildren();
  const reasons = [];
  if (result.routeTriggered && result.activeBuildFamily) {
    const routeFamily = BUILD_FAMILIES[result.activeBuildFamily];
    reasons.push({
      icon: routeFamily.icon,
      label:
        `${routeFamily.name}流派命中`,
      family: result.activeBuildFamily,
    });
  }
  for (const trigger of result.buildTriggers || []) {
    const multiplier = trigger.multiplier
      ? Number.isInteger(trigger.multiplier)
        ? trigger.multiplier
        : trigger.multiplier.toFixed(1)
      : null;
    reasons.push({
      icon: trigger.icon,
      label: trigger.text || (multiplier ? `${trigger.label} ×${multiplier}` : trigger.label),
      family: trigger.family,
    });
  }
  for (const reason of reasons.slice(0, 3)) {
    const chip = document.createElement("b");
    const familyColor = BUILD_FAMILIES[reason.family]?.color;
    chip.className = familyColor
      ? `score-trigger family-${familyColor}`
      : "score-trigger is-awakened";
    chip.textContent = `${reason.icon} ${reason.label}`;
    elements.scoreBurstReasons.append(chip);
  }
  elements.scoreBurst.classList.remove(
    "is-visible",
    "is-perfect",
    "is-good",
    "is-fever",
    "is-burnt",
    "is-build",
    "is-goal",
  );
  elements.scoreBurst.classList.toggle("is-perfect", result.isPerfect);
  elements.scoreBurst.classList.toggle(
    "is-good",
    result.hitQuality === HIT_QUALITY.GOOD,
  );
  elements.scoreBurst.classList.toggle("is-fever", result.comboMood === "fever");
  elements.scoreBurst.classList.toggle("is-burnt", false);
  elements.scoreBurst.classList.toggle("is-build", reasons.length > 0);
  elements.scoreBurst.classList.remove("is-goal");
  void elements.scoreBurst.offsetWidth;
  elements.scoreBurst.classList.add("is-visible");
  scoreBurstTimer = window.setTimeout(() => {
    elements.scoreBurst.classList.remove("is-visible");
  }, reasons.length > 0 ? 1250 : 900);
}

function showCoinTap(event) {
  window.clearTimeout(scoreBurstTimer);
  elements.scoreBurstValue.textContent = "金币雨！";
  elements.scoreBurstLabel.textContent = event.milestone
    ? "大奖加码！"
    : "继续点击";
  elements.scoreBurstReasons.replaceChildren();
  elements.scoreBurst.classList.remove(
    "is-visible",
    "is-perfect",
    "is-good",
    "is-fever",
    "is-burnt",
    "is-build",
    "is-goal",
  );
  elements.scoreBurst.classList.add("is-visible", "is-perfect", "is-build");
  scoreBurstTimer = window.setTimeout(() => {
    elements.scoreBurst.classList.remove("is-visible");
  }, 280);
}

function replayClass(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function updateInterface(snapshot) {
  // Always clear transient heat states before early returns such as results
  // and coin rush. This prevents a previous blind event leaking into a new run.
  elements.heatRow.classList.remove("is-blind");
  elements.heatRow.dataset.status = "raw";
  elements.time.textContent = Math.ceil(snapshot.remainingMs / 1000);
  elements.scoreLabel.textContent = "生命";
  elements.score.textContent =
    "♥".repeat(snapshot.health) + "♡".repeat(snapshot.maxHealth - snapshot.health);
  elements.combo.textContent = snapshot.perfectStreak;
  elements.comboCard.hidden = snapshot.perfectStreak <= 0;
  elements.level.textContent = `第 ${snapshot.level} 关`;
  elements.app.dataset.event = snapshot.baseEffect.id;
  elements.app.dataset.pan = snapshot.panPerk.id;
  elements.app.dataset.comboMood = snapshot.comboMood;
  elements.app.dataset.lastHitQuality = snapshot.lastHitQuality || "none";
  elements.app.dataset.goalSecured = "false";
  elements.shield.textContent = `🛡 回魂 ${snapshot.shieldCharges}`;
  elements.shield.classList.toggle("is-hidden", snapshot.shieldCharges <= 0);

  renderRecipeChips(elements.recipeStrip, snapshot.upgrades, true, true);
  const buildVisual = getBuildVisual(snapshot);
  elements.app.dataset.build = buildVisual?.id || "none";
  elements.app.dataset.buildTier = String(buildVisual?.multiplier || 1);
  elements.buildRouteBadge.hidden = !buildVisual;
  elements.actionBuildBadge.hidden = !buildVisual;
  if (buildVisual) {
    elements.buildRouteBadge.textContent = getBuildStatusText(
      buildVisual,
      snapshot,
    );
    elements.actionBuildBadge.textContent =
      `${buildVisual.family.icon} ${buildVisual.family.name}流派`;
  }

  const egg = snapshot.currentEgg;
  const coinRushActive = snapshot.coinRushRemainingMs > 0;
  elements.app.dataset.coinRush = String(coinRushActive);
  elements.actionButton.classList.toggle("is-coin-rush", coinRushActive);
  elements.heatRow.classList.toggle("is-coin-rush", coinRushActive);
  if (coinRushActive) {
    elements.actionButton.disabled = false;
    elements.actionIcon.textContent = "🪙";
    elements.actionLabel.textContent = "狂点金币";
    elements.actionButton.setAttribute("aria-label", "狂点金币");
    return;
  }
  if (!egg) return;

  const displayedEffect = snapshot.baseEffect;
  setEventArt(elements.eventIcon, displayedEffect);
  elements.eventTitle.textContent = displayedEffect.short || displayedEffect.title;
  elements.eventBubble.classList.remove(...RARITY_CLASSES);
  elements.eventBubble.classList.add(`rarity-${displayedEffect.rarity}`);

  updateHitZones(snapshot.effect);
  updateBuildTargetZone(buildVisual, snapshot.effect);
  const currentHeat = egg.heat;
  const isBlind =
    snapshot.baseEffect.hiddenHeatAfter !== null &&
    currentHeat >= snapshot.baseEffect.hiddenHeatAfter;
  updateHeatRow({
    row: elements.heatRow,
    fill: elements.heatFill,
    marker: elements.heatMarker,
    value: currentHeat,
    active: true,
    done: false,
    perfectMin: snapshot.effect.perfectMin,
    perfectMax: snapshot.effect.perfectMax,
    blind: isBlind,
  });

  const buildReady = isBuildTriggerReady(buildVisual, snapshot, currentHeat);
  elements.actionButton.classList.toggle("is-build-ready", buildReady);
  elements.heatRow.classList.toggle("is-build-ready", buildReady);
  elements.actionButton.classList.add("is-serve");
  elements.actionButton.classList.toggle(
    "is-awakening",
    snapshot.panIntroRemainingMs > 0,
  );
  elements.actionButton.disabled = snapshot.panIntroRemainingMs > 0;
  elements.actionIcon.textContent = "✓";
  elements.actionLabel.textContent =
    snapshot.panIntroRemainingMs > 0
      ? "新锅觉醒"
      : "出锅";
  elements.actionButton.setAttribute(
    "aria-label",
    snapshot.panIntroRemainingMs > 0
      ? "新锅觉醒中"
      : "出锅",
  );
}

function renderRecipeChips(container, upgrades, showEmpty = false, compact = false) {
  container.replaceChildren();
  if (compact) {
    const upgradeMap = Object.fromEntries(
      upgrades.map((upgrade) => [upgrade.id, upgrade.stacks]),
    );
    for (const [familyId, family] of Object.entries(BUILD_FAMILIES)) {
      const count = buildFamilyCount(upgradeMap, familyId);
      if (count <= 0) continue;
      const chip = document.createElement("span");
      chip.className = `recipe-family family-${family.color}${count >= 2 ? " is-active" : ""}`;
      chip.textContent = `${family.icon}${count}`;
      chip.title =
        count >= 3
          ? `${family.name}牌型完全成型`
          : count >= 2
            ? `${family.name}牌型已联动`
            : `${family.name} 1/3`;
      container.append(chip);
    }
    const awakened = awakenedUpgradeCount(upgradeMap);
    if (awakened > 0) {
      const chip = document.createElement("span");
      chip.className = "recipe-family is-awakened";
      chip.textContent = `🌟${awakened}`;
      chip.title = `觉醒牌 ×${awakened}`;
      container.append(chip);
    }
    return;
  }
  if (upgrades.length === 0 && showEmpty) {
    const empty = document.createElement("span");
    empty.className = "recipe-empty";
    empty.textContent = "过关后选择 1 份秘制配方";
    container.append(empty);
    return;
  }
  for (const upgrade of upgrades) {
    const chip = document.createElement("span");
    chip.className = "recipe-chip";
    chip.textContent = `${upgrade.icon} ${upgrade.name} ×${upgrade.stacks}`;
    container.append(chip);
  }
}

function getBuildVisual(snapshot) {
  const upgradeMap = Object.fromEntries(
    snapshot.upgrades.map((upgrade) => [upgrade.id, upgrade.stacks]),
  );
  const candidates = Object.entries(BUILD_FAMILIES)
    .map(([id, family]) => ({
      id,
      family,
      count: buildFamilyCount(upgradeMap, id),
    }))
    .filter((candidate) => candidate.count > 0)
    .sort((left, right) => right.count - left.count);
  if (candidates.length === 0) return null;
  const selected =
    candidates.find((candidate) => candidate.id === snapshot.activeBuildFamily) ||
    candidates[0];
  return {
    ...selected,
    multiplier: selected.count >= 3 ? 4 : selected.count >= 2 ? 2 : 1,
    trigger: selected.family.trigger,
    upgradeMap,
  };
}

function getBuildStatusText(buildVisual, snapshot) {
  const upgrades = buildVisual.upgradeMap;
  if (buildVisual.id === "precision") {
    if (snapshot.overdriveRemainingMs > 0) {
      return `⚡ 超频 ${(snapshot.overdriveRemainingMs / 1000).toFixed(1)}s`;
    }
    const stacks = upgrades["perfect-chain"] || 0;
    if (stacks > 0) {
      const target = stacks >= 2 ? 2 : 3;
      return `🖨️ 复印 ${snapshot.perfectChain || 0}/${target}`;
    }
    return "🧲 绿区自动出锅";
  }
  if (buildVisual.id === "carnival") {
    if (snapshot.forcedJackpotPending) return "🎰 大奖待发";
    const stacks = upgrades["event-album"] || 0;
    if (stacks > 0) {
      const target = stacks >= 2 ? 2 : 3;
      return `🎰 大奖 ${snapshot.eventMeter}/${target}`;
    }
    return "📣 成功事件会续演";
  }
  if (buildVisual.id === "gamble") {
    if (snapshot.riskStreak > 0) return `🌋 红温 ${snapshot.riskStreak} 层`;
    if (snapshot.shieldCharges > 0) return `🛟 回魂 ${snapshot.shieldCharges}`;
    return "🥩 微焦就是 Perfect";
  }
  if (snapshot.remainingMs <= 3_000 && upgrades["last-call"]) {
    return "🚨 末秒狂飙";
  }
  if (upgrades["opening-jackpot"]) return "🍽️ 定期金币装盘";
  return "❤️ 连中恢复生命";
}

function isBuildTriggerReady(buildVisual, snapshot, heat) {
  if (!buildVisual) return false;
  if (buildVisual.id === "precision") {
    return heat >= snapshot.effect.perfectMin && heat <= snapshot.effect.perfectMax;
  }
  if (buildVisual.id === "carnival") return snapshot.baseEffect.id !== "none";
  if (buildVisual.id === "gamble") {
    return heat > snapshot.effect.perfectMax && heat <= 95;
  }
  return true;
}

function updatePerfectZone(min, max) {
  elements.perfectZone.style.left = `${min}%`;
  elements.perfectZone.style.width = `${max - min}%`;
}

function updateHitZones(effect) {
  const { goodMin, goodMax, perfectMin, perfectMax } = getHitWindow(effect);
  elements.goodZone.style.left = `${goodMin}%`;
  elements.goodZone.style.width = `${goodMax - goodMin}%`;
  updatePerfectZone(perfectMin, perfectMax);
}

function updateBuildTargetZone(buildVisual, effect) {
  const isGambleRoute =
    buildVisual?.id === "gamble";
  elements.buildTargetZone.classList.toggle("is-visible", isGambleRoute);
  if (!isGambleRoute) return;
  const start = Math.min(95, effect.perfectMax + 1);
  elements.buildTargetZone.style.left = `${start}%`;
  elements.buildTargetZone.style.width = `${Math.max(0, 95 - start)}%`;
}

function updateHeatRow({
  row,
  fill,
  marker,
  value,
  active,
  done,
  perfectMin,
  perfectMax,
  blind = false,
}) {
  const heat = value ?? 0;
  row.classList.toggle("is-active", active);
  row.classList.toggle("is-done", done);
  row.classList.toggle("is-blind", blind);
  fill.style.width = `${heat}%`;
  marker.style.left = `${heat}%`;

  const status = blind ? "blind" : classifyHeat(heat, perfectMin, perfectMax);
  const hitQuality = blind
    ? "blind"
    : getHitQuality(heat, { perfectMin, perfectMax });
  row.dataset.status = status;
  row.dataset.quality = hitQuality;
}

function showStageResults(result) {
  elements.resultOverlay.classList.remove("is-stage-clear", "is-stage-fail", "is-final");
  elements.resultKicker.textContent = `第 ${result.level} 关`;

  if (result.canContinue) {
    elements.resultOverlay.classList.add("is-stage-clear");
    elements.resultTitle.textContent = `进入第 ${result.level + 1} 关`;
    elements.resultComment.textContent = "";
    elements.continueButton.classList.remove("is-hidden");
    elements.continueLabel.textContent = "选择强化";
  }

  mountMascot(elements.resultMascot, result.canContinue ? "happy" : "fail");
  elements.resultOverlay.classList.add("is-visible");
}

function showFinalResults(result) {
  elements.resultOverlay.classList.remove("is-stage-clear", "is-stage-fail");
  elements.resultOverlay.classList.add("is-final");
  elements.finalScoreLabel.textContent = "本轮金币";
  elements.finalScore.textContent = `+${result.coinsEarned}`;
  elements.resultKicker.textContent = `到达第 ${result.levelReached} 关`;
  elements.resultTitle.textContent = "挑战结束";
  elements.resultComment.textContent = "";
  elements.continueButton.classList.add("is-hidden");
  mountMascot(elements.resultMascot, "fail");
  elements.resultOverlay.classList.add("is-visible");
}

function pauseGame() {
  if (game.state !== "playing") return;
  game.pause();
  handleGameEvents();
}

function resumeGame() {
  if (game.state !== "paused") return;
  game.resume();
  lastFrameAt = performance.now();
  handleGameEvents();
}

function continueStage() {
  if (!game.continueStage()) return;
  handleGameEvents();
}

function cashOutCurrentRun() {
  if (["playing", "paused", "choosing", "stage-ended"].includes(game.state)) {
    game.cashOut({ silent: true });
    handleGameEvents();
  }
}

function restartRun() {
  cashOutCurrentRun();
  startGame();
}

function returnHome() {
  window.clearTimeout(stageResultTimer);
  cashOutCurrentRun();
  game.reset();
  resetTransientGameUi();
  elements.resultOverlay.classList.remove("is-visible");
  elements.upgradeOverlay.classList.remove("is-visible");
  elements.pauseOverlay.classList.remove("is-visible");
  elements.mechanicsOverlay.classList.remove("is-visible");
  elements.impactBanner.classList.remove("is-visible");
  elements.startOverlay.classList.add("is-visible");
  mountMascot(elements.startMascot, "start");
  updateInterface(game.getSnapshot());
}

function frame(now) {
  const deltaMs = now - lastFrameAt;
  lastFrameAt = now;
  if (game.state === "playing") {
    game.update(deltaMs);
    handleGameEvents();
  }
  const snapshot = game.getSnapshot();
  updateInterface(snapshot);
  renderer.render(snapshot, now);
  window.requestAnimationFrame(frame);
}

elements.startButton.addEventListener("click", startGame);
elements.shopButton.addEventListener("click", openShop);
elements.shopCloseButton.addEventListener("click", closeShop);
elements.recordsButton.addEventListener("click", openRecords);
elements.recordsCloseButton.addEventListener("click", closeRecords);
elements.mechanicsButton.addEventListener("click", () => openMechanics());
elements.mechanicsCloseButton.addEventListener("click", () => closeMechanics());
elements.mechanicsDoneButton.addEventListener("click", () => closeMechanics({ resume: true }));
elements.pauseMechanicsButton.addEventListener("click", () => openMechanics());
elements.restartButton.addEventListener("click", restartRun);
elements.continueButton.addEventListener("click", continueStage);
elements.homeButton.addEventListener("click", returnHome);
elements.pauseButton.addEventListener("click", pauseGame);
elements.resumeButton.addEventListener("click", resumeGame);
elements.pauseHomeButton.addEventListener("click", returnHome);
elements.panReadyButton.addEventListener("click", confirmPanReady);
elements.upgradeRerollButton.addEventListener("click", rerollUpgradeDraft);
elements.actionButton.addEventListener("click", performAction);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.mechanicsOverlay.classList.contains("is-visible")) {
    event.preventDefault();
    closeMechanics();
    return;
  }
  if (event.key === "Escape" && elements.recordsOverlay.classList.contains("is-visible")) {
    event.preventDefault();
    closeRecords();
    return;
  }
  if (event.key === "Escape" && elements.shopOverlay.classList.contains("is-visible")) {
    event.preventDefault();
    closeShop();
    return;
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (game.panIntroRemainingMs > 0) confirmPanReady();
    else performAction();
  }
  if (event.key.toLowerCase() === "r") {
    event.preventDefault();
    restartRun();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    if (game.state === "playing") pauseGame();
    else if (game.state === "paused") resumeGame();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.state === "playing") pauseGame();
});

saveWallet(walletCoins);
saveWardrobe(wardrobe);
saveProgress(progress);
loadAssets().then((assets) => {
  loadedAssets = assets;
  mountLoadedAssets();
});
window.requestAnimationFrame(frame);
