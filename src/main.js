import "./style.css";
import {
  chooseDanzaiAsset,
  chooseEventAsset,
  choosePanAsset,
  loadAssets,
} from "./assets.js";
import {
  classifyHeat,
  EggFryGame,
  EVENT_DEFINITIONS,
  getHitQuality,
  getHitWindow,
  getUpgradePreview,
  HIT_QUALITY,
  UPGRADE_DEFINITIONS,
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

// Prevent double-tap zoom on mobile browsers.
document.addEventListener(
  "dblclick",
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

const RARITY_LABELS = {
  normal: "普通",
  common: "普通",
  rare: "稀有",
  epic: "史诗",
  danger: "危险",
  legendary: "传说",
};
const RARITY_CLASSES = Object.keys(RARITY_LABELS).map((rarity) => `rarity-${rarity}`);
const WALLET_KEY = "danzai-egg-fry-wallet";
const WARDROBE_KEY = "danzai-egg-fry-wardrobe";
const PROGRESS_KEY = "danzai-egg-fry-progress";
const EVENT_IDS = EVENT_DEFINITIONS.map((event) => event.id);

const elements = {
  app: document.querySelector("#app"),
  hud: document.querySelector(".hud"),
  combatReadout: document.querySelector(".combat-readout"),
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
  currentUpgrades: document.querySelector("#currentUpgrades"),
  currentUpgradeList: document.querySelector("#currentUpgradeList"),
  upgradeDetail: document.querySelector("#upgradeDetail"),
  upgradeDetailClose: document.querySelector("#upgradeDetailClose"),
  upgradeDetailIcon: document.querySelector("#upgradeDetailIcon"),
  upgradeDetailName: document.querySelector("#upgradeDetailName"),
  upgradeDetailLevel: document.querySelector("#upgradeDetailLevel"),
  upgradeDetailCurrent: document.querySelector("#upgradeDetailCurrent"),
  upgradeDetailNext: document.querySelector("#upgradeDetailNext"),
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
  levelBadge: document.querySelector(".level-badge"),
  eventBubble: document.querySelector("#eventBubble"),
  eventIcon: document.querySelector("#eventIcon"),
  eventTitle: document.querySelector("#eventTitle"),
  toast: document.querySelector("#toast"),
  scoreBurst: document.querySelector("#scoreBurst"),
  scoreBurstValue: document.querySelector("#scoreBurstValue"),
  scoreBurstLabel: document.querySelector("#scoreBurstLabel"),
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
  heatRow: document.querySelector("#heatRow"),
  heatFill: document.querySelector("#heatFill"),
  heatMarker: document.querySelector("#heatMarker"),
  goodZone: document.querySelector("#goodZone"),
  perfectZone: document.querySelector("#perfectZone"),
  finalScoreLabel: document.querySelector("#finalScoreLabel"),
  finalScore: document.querySelector("#finalScore"),
  finalEggs: document.querySelector("#finalEggs"),
  finalCombo: document.querySelector("#finalCombo"),
  finalPerfect: document.querySelector("#finalPerfect"),
  finalCoins: document.querySelector("#finalCoins"),
  finalBuild: document.querySelector("#finalBuild"),
  finalBuildList: document.querySelector("#finalBuildList"),
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

if (elements.hud && elements.combatReadout && elements.pauseButton) {
  elements.hud.insertBefore(elements.combatReadout, elements.pauseButton);
}

const pauseUpgradePanel = document.createElement("section");
pauseUpgradePanel.className = "pause-upgrades";
pauseUpgradePanel.innerHTML = `
  <strong>褰撳墠寮哄寲</strong>
  <div class="pause-upgrade-list"></div>
`;
elements.pauseOverlay
  ?.querySelector(".pause-card")
  ?.insertBefore(pauseUpgradePanel, elements.resumeButton);
elements.pauseUpgradeList = pauseUpgradePanel.querySelector(".pause-upgrade-list");

export const game = new EggFryGame();
if (import.meta.env.DEV) window.__danzaiGame = game;
const renderer = new GameRenderer(elements.canvas);
let loadedAssets = {};
let lastFrameAt = performance.now();
let toastTimer = null;
let impactTimer = null;
let eventBubbleTimer = null;
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
    logo.alt = "鏃︿粩鐓庤泲鎸戞垬";
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
    tagline.textContent = `${skin.buffTitle}: ${skin.buffDescription}`;
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
      button.textContent = skin.price === 0 ? "免费解锁" : `金币 ${skin.price}`;
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
      elements.shopMessage.textContent = `${skin.name} 已装备`;
      playCue("upgrade");
      vibrate(35);
    }
  } else {
    const result = buySkin(wardrobe, walletCoins, skinId);
    if (!result.ok) {
      elements.shopMessage.textContent =
        `还差 ${Math.max(0, skin.price - walletCoins)} 金币`;
      vibrate(25);
      return;
    }
    saveWallet(result.balance);
    saveWardrobe(result.wardrobe);
    elements.shopMessage.textContent = `购买成功：${skin.name} 已自动装备`;
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
    `累计完成 ${progress.totalEggs} 颗蛋 · Perfect ${progress.totalPerfects} 次 · 获得 ${progress.totalCoinsEarned} 金币`;

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
        <span>?</span>
        <div>
          <strong>尚未遭遇</strong>
          <small>继续挑战，等待随机惊喜</small>
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
  window.clearTimeout(eventBubbleTimer);
  window.clearTimeout(scoreBurstTimer);
  window.clearTimeout(panAwakenTimer);
  elements.heatRow.classList.remove("is-blind", "is-coin-rush");
  elements.heatRow.dataset.status = "raw";
  elements.actionButton.classList.remove(
    "is-coin-rush",
    "is-coin-rush-ending",
    "is-coin-rush-grace",
    "is-coin-tapping",
    "is-awakening",
    "is-auto-locked",
  );
  elements.actionButton.disabled = false;
  elements.actionIcon.textContent = "✓";
  elements.actionLabel.textContent = "出锅";
  elements.actionButton.setAttribute("aria-label", "出锅");
  elements.app.dataset.event = "none";
  elements.app.dataset.coinRush = "false";
  elements.app.dataset.autoServe = "false";
  elements.app.dataset.comboMood = "normal";
  elements.app.dataset.lastHitQuality = "";
  elements.eventBubble.classList.remove(...RARITY_CLASSES);
  elements.eventBubble.classList.add("rarity-normal");
  elements.eventBubble.hidden = true;
  elements.toast.classList.remove("is-visible");
  elements.impactBanner.classList.remove("is-visible", ...RARITY_CLASSES);
  elements.impactBanner.setAttribute("aria-hidden", "true");
  elements.scoreBurst.classList.remove(
    "is-visible",
    "is-perfect",
    "is-good",
    "is-miss",
    "is-event",
    "is-coin-rush",
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
  if (game.coinRushGraceRemainingMs > 0) {
    showToast("准备出锅", 650);
    replayClass(elements.actionButton, "is-coin-tapping");
    window.setTimeout(() => elements.actionButton.classList.remove("is-coin-tapping"), 220);
    return;
  }
  if (game.getSnapshot().autoServeActive) {
    showToast("自动锁定 Perfect", 650);
    replayClass(elements.actionButton, "is-coin-tapping");
    window.setTimeout(() => elements.actionButton.classList.remove("is-coin-tapping"), 220);
    return;
  }
  game.cook();
  handleGameEvents();
}

function presentEventTrigger(event) {
  const discovery = discoverEvent(progress, event.effect.id, EVENT_IDS);
  if (discovery.isNew) {
    saveProgress(discovery.progress);
  }

  if (event.effect.specialMode === "coin-rush") return;

  const important = isImportantEvent(event.effect);
  playCue(important ? "event" : "good", event.effect.rarity);
  vibrate(important ? [35, 20, 55] : 12);

  if (!important) return;

  replayClass(elements.app, "is-event-struck");
}

function handleGameEvents() {
  for (const event of game.drainEvents()) {
    switch (event.type) {
      case "eggStarted":
        renderer.triggerEggStart();
        break;
      case "gameStarted":
        maybeShowLevelIntro(event);
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
        void event;
        playCue("perfect");
        vibrate([30, 15, 55]);
        break;
      case "buildBurst":
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
        break;
      case "heartLost":
        renderer.triggerBurn();
        replayClass(elements.app, "is-heart-hit");
        showActionFeedback({
          quality: HIT_QUALITY.MISS,
          title: event.missLabel || "Miss!",
          rarity: "danger",
          duration: 760,
        });
        playCue("burn");
        vibrate([80, 40, 100]);
        break;
      case "heartSaved":
        {
          const savedByEvent = event.source === "event";
          const savedByCharacter = event.source === "character";
          const savedByPan = event.source === "pan";
        showActionFeedback({
          quality: HIT_QUALITY.MISS,
          title: event.missLabel ? event.missLabel.replace("！", "") : "失误",
          rarity: "epic",
          duration: 760,
        });
        playCue("upgrade");
        vibrate([35, 20, 55]);
        break;
        }
      case "heartRestored":
        playCue("perfect");
        vibrate([35, 20, 55]);
        break;
      case "coinRushStarted":
        showActionFeedback({
          quality: "coin-rush",
          title: "连击狂欢！",
          rarity: "legendary",
          duration: 900,
        });
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
        break;
      case "served":
        renderer.triggerServe(event.result);
        showActionFeedback({ result: event.result });
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
        break;
      case "perfectStreakFever":
        renderer.triggerComboMood("fever", event.perfectStreak);
        showActionFeedback({
          quality: event.hitQuality || HIT_QUALITY.PERFECT,
          title: getHitFeedbackText({
            quality: event.hitQuality || HIT_QUALITY.PERFECT,
            combo: getAuthoritativeCombo(),
          }),
          rarity: "legendary",
          duration: 1_250,
        });
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
        closeUpgradeDetail();
        const upgradeImpact = event.awakened
          ? {
              icon: event.upgrade.icon,
              title: `${event.upgrade.name}完全体！`,
              short: event.preview.headline,
              rarity: "legendary",
              duration: 1550,
            }
          : {
              icon: event.upgrade.icon,
              title: `${event.upgrade.name}已选择`,
              short: event.preview.headline,
              rarity: event.upgrade.rarity,
              duration: 1150,
            };
        renderer.triggerUpgrade(upgradeImpact.title, upgradeImpact.short);
        playCue("upgrade");
        showImpactBanner(upgradeImpact, upgradeImpact.duration);
        vibrate(
          event.awakened
            ? [65, 30, 100, 35, 80]
            : [45, 25, 75],
        );
        break;
      case "panPerkTriggered":
        renderer.triggerPanPerk(event);
        playCue("upgrade");
        vibrate(24);
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
        lastFrameAt = performance.now();
        maybeShowLevelIntro(event);
        break;
      case "gamePaused":
        renderPauseUpgrades();
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
  elements.upgradeTitle.textContent = "选择本轮强化";
  elements.upgradeCopy.textContent = "";
  elements.upgradeRerollCount.textContent = rerolls;
  elements.upgradeRerollButton.disabled = rerolls <= 0;
  closeUpgradeDetail();
  renderCurrentUpgrades();
  elements.upgradeOptions.replaceChildren();
  for (const choice of choices) {
    const currentStacks = game.upgrades[choice.id] || 0;
    const preview = getUpgradePreview(choice.id, currentStacks);
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      `upgrade-option rarity-${choice.rarity}` +
      (preview.awakening ? " is-awakening-card" : "");
    button.dataset.upgradeId = choice.id;
    button.innerHTML = `
      <span class="upgrade-option-icon">${choice.icon}</span>
      <span class="upgrade-option-copy">
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

function renderCurrentUpgrades() {
  const upgrades = game.getUpgradeSummary();
  elements.currentUpgrades.hidden = false;
  elements.currentUpgradeList.replaceChildren();
  if (upgrades.length === 0) {
    const empty = document.createElement("span");
    empty.className = "current-upgrade-empty";
    empty.textContent = "当前暂无强化";
    elements.currentUpgradeList.append(empty);
    return;
  }
  for (const upgrade of upgrades) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "current-upgrade-chip";
    chip.title = `${upgrade.name}: ${upgrade.rule}`;
    chip.textContent = `${upgrade.icon} ${upgrade.name}${upgrade.stacks > 1 ? ` x${upgrade.stacks}` : ""}`;
    chip.addEventListener("click", () => showUpgradeDetail(upgrade));
    elements.currentUpgradeList.append(chip);
  }
}

function renderPauseUpgrades() {
  const list = elements.pauseUpgradeList;
  if (!list) return;
  const upgrades = game.getUpgradeSummary();
  list.replaceChildren();
  if (upgrades.length === 0) {
    const empty = document.createElement("p");
    empty.className = "pause-upgrade-empty";
    empty.textContent = "当前暂无强化";
    list.append(empty);
    return;
  }
  for (const upgrade of upgrades) {
    const preview = getUpgradePreview(upgrade.id, Math.max(0, upgrade.stacks - 1));
    const extra =
      upgrade.id === "steady-hand" && game.getSnapshot().autoServeStageCharges > 0
        ? ` · 剩余 ${game.getSnapshot().autoServeStageCharges} 关`
        : "";
    const item = document.createElement("article");
    item.className = "pause-upgrade-item";
    item.innerHTML = `
      <span>${upgrade.icon}</span>
      <b>${upgrade.name} Lv.${upgrade.stacks}</b>
      <small>${preview.after || upgrade.rule}${extra}</small>
    `;
    list.append(item);
  }
}

function showUpgradeDetail(upgrade) {
  const definition = UPGRADE_DEFINITIONS.find((candidate) => candidate.id === upgrade.id);
  const maxStacks = definition?.maxStacks || upgrade.stacks;
  const currentPreview = getUpgradePreview(upgrade.id, Math.max(0, upgrade.stacks - 1));
  const nextPreview = upgrade.stacks < maxStacks
    ? getUpgradePreview(upgrade.id, upgrade.stacks)
    : null;

  elements.upgradeDetailIcon.textContent = upgrade.icon;
  elements.upgradeDetailName.textContent = upgrade.name;
  elements.upgradeDetailLevel.textContent = `Lv.${upgrade.stacks}`;
  elements.upgradeDetailCurrent.textContent = `当前：${currentPreview.after || upgrade.rule}`;
  elements.upgradeDetailNext.textContent = nextPreview
    ? `下一层：${nextPreview.after}`
    : "已达到当前最高层";
  elements.upgradeDetail.hidden = false;
}

function closeUpgradeDetail() {
  elements.upgradeDetail.hidden = true;
}

function rerollUpgradeDraft() {
  if (!game.rerollUpgradeDraft()) return;
  handleGameEvents();
}

function showServeFeedback(result) {
  void result;
  return;
  if (result.preservedByShield) {
    showToast("护盾救回这颗蛋");
  } else if (result.isBurnt) {
    const protectedText = result.preservedCombo
        ? "连击已保住"
        : "Miss，连击清零";
    showToast(protectedText);
  }
}

function showImpactBanner(effect, duration = 850) {
  void effect;
  void duration;
  return;
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
    element.textContent = effect?.icon || "✓";
    element.style.removeProperty("background-image");
  }
}

function isImportantEvent(effect) {
  return (
    effect?.specialMode === "coin-rush" ||
    effect?.rarity === "danger" ||
    effect?.rarity === "legendary" ||
    ["jackpot", "devil-fire", "blind-heat"].includes(effect?.id)
  );
}

function getEventToast(effect) {
  if (effect?.specialMode === "coin-rush") return "连击狂欢开始！";
  if (effect?.rarity === "danger") return "危险火候！";
  if (effect?.id === "jackpot") return "大奖触发！";
  if (effect?.id === "time-warp") return "成功回血！";
  if (effect?.id === "lucky-scallion") return "加成触发！";
  return effect?.short || "事件触发！";
}

function showEventBubble(effect, duration = 1_000) {
  window.clearTimeout(eventBubbleTimer);
  elements.eventBubble.hidden = false;
  setEventArt(elements.eventIcon, effect);
  elements.eventTitle.textContent = effect.short || effect.title;
  elements.eventBubble.classList.remove(...RARITY_CLASSES);
  elements.eventBubble.classList.add(`rarity-${effect.rarity}`);
  replayClass(elements.eventBubble, "is-popping");
  eventBubbleTimer = window.setTimeout(() => {
    elements.eventBubble.hidden = true;
  }, duration);
}

function maybeShowLevelIntro(event) {
  if (!event?.specialGoal) return false;
  game.beginPanIntro(Number.POSITIVE_INFINITY);
  showPanAwaken({
    panPerk: event.panPerk,
    level: event.level,
    goal: event.specialGoal,
    trait: event.specialTrait,
  });
  playCue("upgrade");
  vibrate([35, 20, 55]);
  return true;
}

function showPanAwaken({ panPerk, level, goal, trait }) {
  window.clearTimeout(panAwakenTimer);
  const displayPerk = panPerk || { id: "basic-pan", icon: "🍳", short: "特殊规则" };
  const panImage = choosePanAsset(loadedAssets, 1);
  elements.panAwakenIcon.classList.toggle("has-art", Boolean(panImage));
  if (panImage) {
    elements.panAwakenIcon.textContent = "";
    elements.panAwakenIcon.style.backgroundImage = `url("${panImage.src}")`;
  } else {
    elements.panAwakenIcon.textContent = displayPerk.icon;
    elements.panAwakenIcon.style.removeProperty("background-image");
  }
  elements.panAwakenKicker.textContent = `第 ${level} 关`;
  elements.panAwakenName.textContent = "特殊目标";
  elements.panAwakenGoal.textContent = goal || "准备开火";
  elements.panAwakenTrait.textContent = trait || `${displayPerk.icon} ${displayPerk.short}`;
  elements.panReadyButton.textContent = "确认开火";
  elements.panAwaken.className = `pan-awaken pan-${displayPerk.id}`;
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

function showToast(message, duration = 1_750) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, duration);
}

function buildActionSummary(result) {
  void result;
  return "";
}

function getHitFeedbackText({ quality, combo = 0, isCoinRush = false } = {}) {
  if (isCoinRush) return "连击狂欢！";
  const safeCombo = Math.max(0, Math.floor(Number(combo) || 0));
  const isPerfect = quality === HIT_QUALITY.PERFECT;
  const isGood = quality === HIT_QUALITY.GOOD;
  if ((isPerfect || isGood) && safeCombo >= 3) {
    return `${isPerfect ? "Perfect" : "Good"} x${safeCombo}`;
  }
  if (isPerfect) return "Perfect!";
  if (isGood) return "Good!";
  if (quality === HIT_QUALITY.MISS) return "Miss!";
  return "";
}

function getAuthoritativeCombo(snapshot = game.getSnapshot()) {
  return snapshot.currentHitCombo ?? snapshot.combo ?? 0;
}

function showActionFeedback({
  result = null,
  quality = result?.hitQuality,
  title = null,
  summary = null,
  rarity = "normal",
  duration = null,
} = {}) {
  window.clearTimeout(scoreBurstTimer);
  const isPerfect = Boolean(quality === HIT_QUALITY.PERFECT || result?.isPerfect);
  const isGood = quality === HIT_QUALITY.GOOD;
  const isMiss = quality === HIT_QUALITY.MISS;
  const isCoinRush = quality === "coin-rush";
  const isEvent = quality === "event";
  const authoritativeCombo = getAuthoritativeCombo();
  const defaultTitle = isPerfect
    ? "Perfect!"
    : isGood
      ? "Good!"
      : isMiss
        ? "Miss!"
        : isCoinRush
          ? "连击狂欢！"
          : isEvent
            ? "事件触发！"
            : "大丰收！";
  const summaryText =
    summary ??
    (result
      ? buildActionSummary(result)
      : "");

  elements.scoreBurstValue.textContent =
    title ||
    getHitFeedbackText({
      quality,
      combo: authoritativeCombo,
      isCoinRush,
    }) ||
    defaultTitle;
  elements.scoreBurstLabel.textContent = summaryText;
  elements.scoreBurst.classList.remove(
    "is-visible",
    "is-perfect",
    "is-good",
    "is-miss",
    "is-event",
    "is-coin-rush",
    "is-fever",
    "is-burnt",
    "is-build",
    "is-goal",
  );
  elements.scoreBurst.classList.toggle("is-perfect", isPerfect);
  elements.scoreBurst.classList.toggle("is-good", isGood);
  elements.scoreBurst.classList.toggle("is-miss", isMiss);
  elements.scoreBurst.classList.toggle("is-event", isEvent || rarity !== "normal");
  elements.scoreBurst.classList.toggle("is-coin-rush", isCoinRush);
  elements.scoreBurst.classList.toggle(
    "is-fever",
    result?.comboMood === "fever" || rarity === "legendary",
  );
  elements.scoreBurst.classList.toggle("is-burnt", false);
  elements.scoreBurst.classList.toggle(
    "is-build",
    Boolean(result?.buildTriggers?.length) || isCoinRush || isEvent,
  );
  elements.scoreBurst.classList.remove("is-goal");
  void elements.scoreBurst.offsetWidth;
  elements.scoreBurst.classList.add("is-visible");
  scoreBurstTimer = window.setTimeout(() => {
    elements.scoreBurst.classList.remove("is-visible");
  }, duration ?? (result?.buildTriggers?.length ? 1_050 : 820));
}

function showCoinTap(event) {
  replayClass(elements.actionButton, "is-coin-tapping");
  window.setTimeout(() => elements.actionButton.classList.remove("is-coin-tapping"), 220);
  spawnCoinTapFloat(event);
}

function spawnCoinTapFloat(event) {
  const float = document.createElement("span");
  const drift = ((event.taps % 7) - 3) * 9;
  const authoritativeCombo = getAuthoritativeCombo();
  float.className = event.milestone
    ? "coin-tap-float is-milestone"
    : "coin-tap-float";
  float.textContent = event.milestone ? `Combo x${authoritativeCombo}` : `+${event.comboGain} 连击`;
  float.style.setProperty("--coin-drift", `${drift}px`);
  elements.actionButton.append(float);
  window.setTimeout(() => float.remove(), 720);
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
  const authoritativeCombo = getAuthoritativeCombo(snapshot);
  elements.combo.textContent = authoritativeCombo;
  elements.comboCard.hidden = authoritativeCombo <= 0;
  elements.level.textContent = `第 ${snapshot.level} 关`;
  elements.levelBadge.dataset.levelSkin = `level-${snapshot.level}`;
  elements.app.dataset.event = snapshot.baseEffect.id;
  elements.app.dataset.pan = snapshot.panPerk.id;
  elements.app.dataset.comboMood = snapshot.comboMood;
  elements.app.dataset.lastHitQuality = snapshot.lastHitQuality || "none";
  elements.app.dataset.goalSecured = "false";

  const egg = snapshot.currentEgg;
  const coinRushActive = snapshot.coinRushRemainingMs > 0;
  const coinRushGraceActive =
    !coinRushActive && snapshot.coinRushGraceRemainingMs > 0;
  const coinRushEnding = coinRushActive && snapshot.coinRushRemainingMs <= 1_000;
  const autoServeActive = Boolean(snapshot.autoServeActive);
  elements.app.dataset.coinRush = String(coinRushActive);
  elements.app.dataset.coinRushEnding = String(coinRushEnding);
  elements.app.dataset.coinRushGrace = String(coinRushGraceActive);
  elements.app.dataset.autoServe = String(autoServeActive);
  elements.actionButton.classList.toggle("is-coin-rush", coinRushActive);
  elements.actionButton.classList.toggle("is-coin-rush-ending", coinRushEnding);
  elements.actionButton.classList.toggle("is-coin-rush-grace", coinRushGraceActive);
  elements.actionButton.classList.toggle(
    "is-auto-locked",
    autoServeActive && !coinRushActive && !coinRushGraceActive,
  );
  elements.heatRow.classList.toggle("is-coin-rush", coinRushActive);
  if (coinRushActive) {
    elements.actionButton.disabled = false;
    elements.actionIcon.textContent = "⚡";
    elements.actionLabel.textContent = coinRushEnding
      ? "最后 1 秒！"
      : `狂点连击！${Math.ceil(snapshot.coinRushRemainingMs / 1000)}`;
    elements.actionButton.setAttribute("aria-label", "狂点连击");
    return;
  }
  if (!egg) return;

  updateHitZones(snapshot.effect);
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

  elements.actionButton.classList.add("is-serve");
  elements.actionButton.classList.toggle(
    "is-awakening",
    snapshot.panIntroRemainingMs > 0,
  );
  elements.actionButton.disabled = snapshot.panIntroRemainingMs > 0 || autoServeActive;
  elements.actionIcon.textContent = "✓";
  elements.actionLabel.textContent =
    coinRushGraceActive
      ? "准备出锅..."
      : autoServeActive
      ? "自动出锅中"
      : snapshot.panIntroRemainingMs > 0
      ? "确认"
      : "出锅";
  elements.actionButton.setAttribute(
    "aria-label",
    coinRushGraceActive
      ? "准备出锅"
      : autoServeActive
      ? "自动锁定 Perfect"
      : snapshot.panIntroRemainingMs > 0
      ? "确认特殊目标"
      : "出锅",
  );
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
  if (active) {
    marker.style.visibility = "visible";
    marker.style.opacity = "1";
    marker.style.display = "block";
    fill.style.visibility = "visible";
    row.style.visibility = "visible";
  }

  const status = blind ? "blind" : classifyHeat(heat, perfectMin, perfectMax);
  const hitQuality = blind
    ? "blind"
    : getHitQuality(heat, { perfectMin, perfectMax });
  row.dataset.status = status;
  row.dataset.quality = hitQuality;
}

function showStageResults(result) {
  elements.resultOverlay.classList.remove("is-stage-clear", "is-stage-fail", "is-final");
  elements.resultKicker.textContent = "下一关";

  if (result.canContinue) {
    elements.resultOverlay.classList.add("is-stage-clear");
    elements.resultTitle.textContent = `即将进入第 ${result.level + 1} 关`;
    elements.resultComment.textContent = "";
    elements.finalBuildList.replaceChildren();
    elements.continueButton.classList.remove("is-hidden");
    elements.restartButton.classList.add("is-hidden");
    elements.homeButton.classList.add("is-hidden");
    elements.continueLabel.textContent = "选择强化";
  }

  mountMascot(elements.resultMascot, result.canContinue ? "happy" : "fail");
  elements.resultOverlay.classList.add("is-visible");
}

function showFinalResults(result) {
  elements.resultOverlay.classList.remove("is-stage-clear", "is-stage-fail");
  elements.resultOverlay.classList.add("is-final");
  elements.finalScoreLabel.textContent = "获得金币";
  elements.finalScore.textContent = `+${result.coinsEarned}`;
  elements.finalEggs.textContent = result.eggsCooked;
  elements.finalCombo.textContent = `x${result.bestPerfectStreak ?? result.bestCombo ?? 0}`;
  elements.finalPerfect.textContent = result.perfectEggs;
  elements.finalCoins.textContent = result.coinsEarned;
  elements.resultKicker.textContent = `到达第 ${result.levelReached} 关`;
  elements.resultTitle.textContent = "本局总结";
  elements.resultComment.textContent = "";
  renderFinalBuild(result.upgrades || []);
  elements.continueButton.classList.add("is-hidden");
  elements.restartButton.classList.remove("is-hidden");
  elements.homeButton.classList.remove("is-hidden");
  mountMascot(elements.resultMascot, "fail");
  elements.resultOverlay.classList.add("is-visible");
}

function renderFinalBuild(upgrades) {
  elements.finalBuildList.replaceChildren();
  if (!upgrades.length) {
    const empty = document.createElement("p");
    empty.className = "final-build-empty";
    empty.textContent = "鏈眬鏆傛棤寮哄寲";
    elements.finalBuildList.append(empty);
    return;
  }
  for (const upgrade of upgrades) {
    const preview = getUpgradePreview(upgrade.id, Math.max(0, upgrade.stacks - 1));
    const item = document.createElement("div");
    item.className = "final-build-item";
    item.innerHTML = `
      <strong>${upgrade.icon} ${upgrade.name} Lv.${upgrade.stacks}</strong>
      <span>${preview.after || upgrade.rule}</span>
    `;
    elements.finalBuildList.append(item);
  }
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
  closeUpgradeDetail();
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
elements.upgradeDetailClose.addEventListener("click", closeUpgradeDetail);
elements.upgradeOverlay.addEventListener("click", (event) => {
  if (event.target === elements.upgradeOverlay) closeUpgradeDetail();
});
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
