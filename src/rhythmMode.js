import {
  getHoldSuccessWindow,
  getTapSuccessWindow,
  RhythmCookingGame,
} from "./rhythmGame.js";
import { RHYTHM_COMMAND_TYPES, RHYTHM_DISH_LEVELS } from "./rhythmLevels.js";
import {
  getRhythmResultProgressUpdate,
  isRhythmLevelUnlocked,
  readRhythmProgress,
  saveRhythmProgress,
} from "./rhythmProgress.js";

const COMMAND_LABELS = {
  [RHYTHM_COMMAND_TYPES.TAP]: "TAP",
  [RHYTHM_COMMAND_TYPES.HOLD]: "HOLD",
  [RHYTHM_COMMAND_TYPES.MASH]: "MASH",
  [RHYTHM_COMMAND_TYPES.SWIPE]: "SWIPE",
};

const COMMAND_HINTS = {
  [RHYTHM_COMMAND_TYPES.TAP]: "看准蓝色成功区点击",
  [RHYTHM_COMMAND_TYPES.HOLD]: "按住，到亮区松开",
  [RHYTHM_COMMAND_TYPES.MASH]: "时间内快速连点",
  [RHYTHM_COMMAND_TYPES.SWIPE]: "滑动完成",
};

const COMMAND_UI = {
  [RHYTHM_COMMAND_TYPES.TAP]: {
    icon: "👆",
    code: "TAP",
    actionLabel: "点击",
    fallbackPrompt: "点击！",
  },
  [RHYTHM_COMMAND_TYPES.HOLD]: {
    icon: "✋",
    code: "HOLD",
    actionLabel: "按住",
    fallbackPrompt: "按住后松开！",
  },
  [RHYTHM_COMMAND_TYPES.MASH]: {
    icon: "⚡",
    code: "MASH",
    actionLabel: "狂点",
    fallbackPrompt: "狂点！",
  },
  [RHYTHM_COMMAND_TYPES.SWIPE]: {
    icon: "➡️",
    code: "SWIPE",
    actionLabel: "滑动",
    fallbackPrompt: "滑动！",
  },
};

export const actionVisuals = Object.freeze({
  crack: Object.freeze({ icon: "🥚", scene: "crack", primary: "🥚", secondary: "💢", plate: "🍽️", effect: "crack" }),
  whisk: Object.freeze({ icon: "🥣", scene: "mash", primary: "🥣", secondary: "🌀", plate: "🥚", effect: "spin" }),
  "fry-egg": Object.freeze({ icon: "🍳", scene: "fry", primary: "🍳", secondary: "🍳", plate: "🍽️", effect: "heat" }),
  "omelette-fry": Object.freeze({ icon: "🟡", scene: "fry", primary: "🍳", secondary: "🟡", plate: "🍽️", effect: "golden" }),
  roll: Object.freeze({ icon: "🌯", scene: "serve", primary: "🌯", secondary: "✨", plate: "🍽️", effect: "slide" }),
  toast: Object.freeze({ icon: "🍞", scene: "serve", primary: "🍞", secondary: "⬇️", plate: "🍽️", effect: "drop" }),
  bake: Object.freeze({ icon: "🔥", scene: "fry", primary: "🍞", secondary: "♨️", plate: "🍽️", effect: "toast" }),
  "egg-on-plate": Object.freeze({ icon: "🍳", scene: "serve", primary: "🍳", secondary: "⬇️", plate: "🍽️", effect: "drop" }),
  stir: Object.freeze({ icon: "🥄", scene: "mash", primary: "🥘", secondary: "🥄", plate: "🍽️", effect: "shake" }),
  plate: Object.freeze({ icon: "🍽️", scene: "serve", primary: "🍽️", secondary: "✨", plate: "🍳", effect: "shine" }),
});

function visualForCommand(command = {}) {
  return actionVisuals[command.visualKey]
    || actionVisuals[command.scene]
    || actionVisuals[command.type]
    || actionVisuals.crack;
}

function createRhythmOverlay() {
  const overlay = document.createElement("section");
  overlay.className = "overlay rhythm-overlay";
  overlay.setAttribute("aria-labelledby", "rhythmTitle");
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="rhythm-card">
      <div class="rhythm-stats">
        <span class="rhythm-level-stat">
          <strong data-rhythm-level>第 1 关</strong>
          <small data-rhythm-dish>元气煎蛋</small>
        </span>
        <span>时间 <strong data-rhythm-time>30</strong>s</span>
        <span><small data-rhythm-unit-label>煎蛋</small> <strong data-rhythm-eggs>0</strong>个</span>
        <span>失败 <strong data-rhythm-fails>0</strong></span>
      </div>

      <div class="rhythm-map" data-rhythm-map hidden>
        <header>
          <span>
            <strong>早餐街</strong>
            <small>通关上一关后解锁下一关</small>
          </span>
          <button class="secondary-button rhythm-map-exit" type="button" data-rhythm-exit>返回首页</button>
        </header>
        <div class="rhythm-map-list" data-rhythm-map-list></div>
      </div>

      <div class="rhythm-stage">
        <div class="rhythm-goal-card" data-rhythm-goal-card>
          <strong data-rhythm-goal-title>元气煎蛋</strong>
          <p data-rhythm-goal-desc>目标：30 秒内尽可能多做煎蛋</p>
          <span data-rhythm-goal-stars>2 个 = ★ · 4 个 = ★★ · 6 个 = ★★★</span>
          <small data-rhythm-goal-flow>流程：敲蛋 → 快速打蛋 → 按住煎熟</small>
          <button class="primary-button" type="button" data-rhythm-goal-start>
            <span>开始做菜</span>
          </button>
        </div>
        <div class="rhythm-step-progress" data-rhythm-step-progress aria-label="当前煎蛋步骤">
          <span data-step-index="0">🥚</span>
          <span data-step-index="1">🥣</span>
          <span data-step-index="2">🍳</span>
        </div>
        <div class="rhythm-mascot" data-rhythm-mascot aria-hidden="true"></div>
        <div class="rhythm-cook-scene" data-rhythm-scene data-scene="crack" aria-hidden="true">
          <span class="scene-egg" data-scene-egg>🥚</span>
          <span class="scene-secondary" data-scene-secondary>💢</span>
          <span class="scene-pan" data-scene-pan>🍳</span>
          <span class="scene-fire" data-scene-fire>🔥</span>
          <span class="scene-plate" data-scene-plate>🍽️</span>
          <span class="scene-sparkle" data-scene-sparkle>✨</span>
        </div>
        <div class="rhythm-command" data-rhythm-command>
          <small data-rhythm-command-step>TAP</small>
          <i data-rhythm-command-icon aria-hidden="true">👆</i>
          <strong data-rhythm-command-type>准备</strong>
          <span data-rhythm-command-label>准备开火</span>
          <em data-rhythm-command-hint>看指令操作</em>
          <b data-rhythm-next>下一步：--</b>
        </div>
        <div class="rhythm-feedback" data-rhythm-feedback aria-hidden="true"></div>
      </div>

      <div class="rhythm-track" data-rhythm-track>
        <em data-rhythm-good-zone></em>
        <strong data-rhythm-perfect-zone></strong>
        <i data-rhythm-fill></i>
        <b data-rhythm-target></b>
        <span data-rhythm-track-copy>等待第一道动作</span>
      </div>

      <button class="rhythm-action-button" type="button" data-rhythm-action>
        <span data-rhythm-action-icon>👆</span>
        <strong data-rhythm-action-label>点击</strong>
      </button>

      <div class="rhythm-result" data-rhythm-result hidden>
        <h3 data-rhythm-result-title>菜品完成：元气煎蛋</h3>
        <dl>
          <div><dt>完成数量</dt><dd data-rhythm-final-eggs>0 个</dd></div>
          <div><dt>失败动作</dt><dd data-rhythm-final-fails>0</dd></div>
          <div><dt>星级</dt><dd data-rhythm-stars>☆☆☆</dd></div>
          <div><dt>获得金币</dt><dd data-rhythm-final-coins>+0</dd></div>
        </dl>
        <p class="rhythm-result-badges" data-rhythm-result-badges hidden></p>
        <div class="rhythm-result-actions">
          <button class="primary-button" type="button" data-rhythm-retry><span>再试一次</span></button>
          <button class="primary-button" type="button" data-rhythm-next-level hidden><span>下一关</span></button>
          <button class="secondary-button" type="button" data-rhythm-home>返回地图</button>
        </div>
      </div>
    </div>
  `;
  return overlay;
}

function formatStars(stars) {
  return "★".repeat(stars) + "☆".repeat(Math.max(0, 3 - stars));
}

function formatGoalText(level) {
  const [one = 2, two = 4, three = 6] = level?.starEggs || [];
  return `${one} 个 = ★ · ${two} 个 = ★★ · ${three} 个 = ★★★`;
}

function getDishStepCommands(level = {}) {
  const actionsPerDish = Math.max(1, Math.floor(Number(level.actionsPerDish) || 1));
  return Array.from({ length: actionsPerDish }, (_, stepIndex) => (
    level.commands?.find((command) => command.dishStepIndex === stepIndex)
    || level.commands?.[stepIndex]
  )).filter(Boolean);
}

function formatActionFlow(level = {}) {
  return getDishStepCommands(level)
    .map((command) => command.actionName || command.prompt || COMMAND_LABELS[command.type] || "做菜")
    .join(" → ");
}

function commandIcon(type) {
  if (type === RHYTHM_COMMAND_TYPES.SWIPE) return "➡️";
  if (type === RHYTHM_COMMAND_TYPES.MASH) return "🥣";
  if (type === RHYTHM_COMMAND_TYPES.HOLD) return "🍳";
  return "🥚";
}

function stepIcon(command) {
  return visualForCommand(command).icon || commandIcon(command.type);
}

export function getRhythmMapCards(levels = RHYTHM_DISH_LEVELS, progress = {}) {
  return levels.map((level, index) => ({
    index,
    title: level.title || `第 ${index + 1} 关`,
    dishName: level.dishName,
    bestStars: Math.max(0, Math.floor(Number(progress.bestStarsByLevel?.[index]) || 0)),
    unlocked: isRhythmLevelUnlocked(progress, index),
    goalText: formatGoalText(level),
  }));
}

export function formatRhythmLevelInfo(levelIndex = 0, level = {}) {
  const safeIndex = Math.max(0, Math.floor(Number(levelIndex) || 0));
  return {
    levelText: `第 ${safeIndex + 1} 关`,
    dishText: level?.dishName || level?.title || "",
  };
}

export function canRunRhythmClock({
  isActive = false,
  isGoalConfirmed = false,
  gameState = "idle",
} = {}) {
  return Boolean(isActive && isGoalConfirmed && gameState === "playing");
}

function windowToPercent(window) {
  return {
    goodLeft: window.startRatio * 100,
    goodWidth: Math.max(0, (window.endRatio - window.startRatio) * 100),
  };
}

function commandProgress(snapshot) {
  const command = snapshot.activeCommand;
  if (!command) return { fill: 0, copy: "等待动作", goodLeft: 0, goodWidth: 0 };
  if (command.type === RHYTHM_COMMAND_TYPES.MASH) {
    return {
      fill: Math.min(100, (snapshot.mashTaps / command.targetTaps) * 100),
      copy: `${snapshot.mashTaps} / ${command.targetTaps}`,
      goodLeft: 0,
      goodWidth: 0,
    };
  }

  if (command.type === RHYTHM_COMMAND_TYPES.SWIPE) {
    return {
      fill: 0,
      copy: `滑动 ${command.minDistancePx || 70}px`,
      goodLeft: 0,
      goodWidth: 100,
    };
  }

  if (command.type === RHYTHM_COMMAND_TYPES.HOLD) {
    const window = getHoldSuccessWindow(command);
    const fill = Math.min(100, (snapshot.holdElapsedMs / window.maxMs) * 100);
    return {
      fill,
      copy: snapshot.holdActive
        ? `${(snapshot.holdElapsedMs / 1000).toFixed(1)}s`
        : "按住开始",
      ...windowToPercent(window),
    };
  }

  const span = Math.max(1, command.expireAtMs - command.startAtMs);
  const fill = Math.min(100, Math.max(0, ((snapshot.elapsedMs - command.startAtMs) / span) * 100));
  const untilTarget = Math.round((command.targetAtMs - snapshot.elapsedMs) / 100) / 10;
  return {
    fill,
    copy:
      snapshot.elapsedMs < command.inputStartAtMs
        ? "准备点击"
        : untilTarget > 0
        ? `${untilTarget.toFixed(1)}s`
        : "现在！",
    ...windowToPercent(getTapSuccessWindow(command)),
  };
}

function levelAt(index) {
  const safeIndex = Math.min(
    RHYTHM_DISH_LEVELS.length - 1,
    Math.max(0, Math.floor(Number(index) || 0)),
  );
  return { index: safeIndex, level: RHYTHM_DISH_LEVELS[safeIndex] };
}

export function shouldShowRhythmNextLevel({
  activeLevelIndex,
  totalLevels = RHYTHM_DISH_LEVELS.length,
  stars = 0,
  unlockedLevelIndex = 0,
} = {}) {
  const current = Math.max(0, Math.floor(Number(activeLevelIndex) || 0));
  const lastIndex = Math.max(0, Math.floor(Number(totalLevels) || 0) - 1);
  const nextExists = current < lastIndex;
  const passed = Math.floor(Number(stars) || 0) >= 1;
  const nextAlreadyUnlocked = Math.max(0, Math.floor(Number(unlockedLevelIndex) || 0)) >= current + 1;
  return nextExists && (passed || nextAlreadyUnlocked);
}

export function getRhythmResultUiState({
  activeLevelIndex = 0,
  result = null,
  unlockedLevelIndex = 0,
  totalLevels = RHYTHM_DISH_LEVELS.length,
} = {}) {
  return {
    showActionButton: false,
    actionLabel: "",
    showTrack: false,
    showCommand: false,
    showStepProgress: false,
    showGoalCard: false,
    showNextLevel: shouldShowRhythmNextLevel({
      activeLevelIndex,
      totalLevels,
      stars: result?.stars || 0,
      unlockedLevelIndex,
    }),
  };
}

export function createRhythmMode({
  root,
  triggerButton,
  homeOverlay,
  mountMascot,
  ensureAudio,
  playCue,
  vibrate,
  getWallet,
  saveWallet,
  getProgress,
  saveProgress,
} = {}) {
  const overlay = createRhythmOverlay();
  root.append(overlay);

  const refs = {
    level: overlay.querySelector("[data-rhythm-level]"),
    dish: overlay.querySelector("[data-rhythm-dish]"),
    unitLabel: overlay.querySelector("[data-rhythm-unit-label]"),
    time: overlay.querySelector("[data-rhythm-time]"),
    eggs: overlay.querySelector("[data-rhythm-eggs]"),
    fails: overlay.querySelector("[data-rhythm-fails]"),
    map: overlay.querySelector("[data-rhythm-map]"),
    mapList: overlay.querySelector("[data-rhythm-map-list]"),
    mapExit: overlay.querySelector("[data-rhythm-exit]"),
    goalCard: overlay.querySelector("[data-rhythm-goal-card]"),
    goalTitle: overlay.querySelector("[data-rhythm-goal-title]"),
    goalDesc: overlay.querySelector("[data-rhythm-goal-desc]"),
    goalStars: overlay.querySelector("[data-rhythm-goal-stars]"),
    goalFlow: overlay.querySelector("[data-rhythm-goal-flow]"),
    goalStart: overlay.querySelector("[data-rhythm-goal-start]"),
    stepProgress: overlay.querySelector("[data-rhythm-step-progress]"),
    stage: overlay.querySelector(".rhythm-stage"),
    mascot: overlay.querySelector("[data-rhythm-mascot]"),
    scene: overlay.querySelector("[data-rhythm-scene]"),
    sceneEgg: overlay.querySelector("[data-scene-egg]"),
    sceneSecondary: overlay.querySelector("[data-scene-secondary]"),
    scenePan: overlay.querySelector("[data-scene-pan]"),
    scenePlate: overlay.querySelector("[data-scene-plate]"),
    sceneSparkle: overlay.querySelector("[data-scene-sparkle]"),
    commandBox: overlay.querySelector("[data-rhythm-command]"),
    commandStep: overlay.querySelector("[data-rhythm-command-step]"),
    commandIcon: overlay.querySelector("[data-rhythm-command-icon]"),
    commandType: overlay.querySelector("[data-rhythm-command-type]"),
    commandLabel: overlay.querySelector("[data-rhythm-command-label]"),
    commandHint: overlay.querySelector("[data-rhythm-command-hint]"),
    commandNext: overlay.querySelector("[data-rhythm-next]"),
    feedback: overlay.querySelector("[data-rhythm-feedback]"),
    track: overlay.querySelector("[data-rhythm-track]"),
    goodZone: overlay.querySelector("[data-rhythm-good-zone]"),
    perfectZone: overlay.querySelector("[data-rhythm-perfect-zone]"),
    fill: overlay.querySelector("[data-rhythm-fill]"),
    target: overlay.querySelector("[data-rhythm-target]"),
    trackCopy: overlay.querySelector("[data-rhythm-track-copy]"),
    actionButton: overlay.querySelector("[data-rhythm-action]"),
    actionIcon: overlay.querySelector("[data-rhythm-action-icon]"),
    actionLabel: overlay.querySelector("[data-rhythm-action-label]"),
    result: overlay.querySelector("[data-rhythm-result]"),
    resultTitle: overlay.querySelector("[data-rhythm-result-title]"),
    finalEggs: overlay.querySelector("[data-rhythm-final-eggs]"),
    finalFails: overlay.querySelector("[data-rhythm-final-fails]"),
    finalCoins: overlay.querySelector("[data-rhythm-final-coins]"),
    stars: overlay.querySelector("[data-rhythm-stars]"),
    resultBadges: overlay.querySelector("[data-rhythm-result-badges]"),
    retry: overlay.querySelector("[data-rhythm-retry]"),
    nextLevel: overlay.querySelector("[data-rhythm-next-level]"),
    homeButtons: overlay.querySelectorAll("[data-rhythm-home]"),
  };

  const first = levelAt(0);
  let activeLevelIndex = first.index;
  let rhythmProgress = readRhythmProgress(localStorage, RHYTHM_DISH_LEVELS.length);
  let game = new RhythmCookingGame(first.level);
  let animationFrame = 0;
  let startTime = 0;
  let active = false;
  let settled = false;
  let feedbackTimer = 0;
  let spaceDown = false;
  let lastCommandId = "";
  let sceneTimer = 0;
  let awaitingGoal = false;
  let swipeStart = null;

  function nowElapsed() {
    return Math.max(0, performance.now() - startTime);
  }

  function refreshMascot() {
    mountMascot?.(refs.mascot, active ? "happy" : "idle");
  }

  function renderStepProgress(level) {
    refs.stepProgress.innerHTML = getDishStepCommands(level)
      .map((command, index) => `<span data-step-index="${index}">${stepIcon(command)}</span>`)
      .join("");
  }

  function renderMap() {
    const cards = getRhythmMapCards(RHYTHM_DISH_LEVELS, rhythmProgress);
    refs.mapList.innerHTML = "";
    cards.forEach((card) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `rhythm-map-card${card.unlocked ? "" : " is-locked"}`;
      button.disabled = !card.unlocked;
      button.innerHTML = `
        <span>${card.title}</span>
        <strong>${card.dishName}</strong>
        <small>${card.goalText}</small>
        <b>${card.unlocked ? formatStars(card.bestStars) : "未解锁"}</b>
      `;
      button.addEventListener("click", () => startRun(card.index));
      refs.mapList.append(button);
    });
  }

  function openMap() {
    active = false;
    settled = false;
    awaitingGoal = false;
    window.cancelAnimationFrame(animationFrame);
    rhythmProgress = readRhythmProgress(localStorage, RHYTHM_DISH_LEVELS.length);
    overlay.hidden = false;
    overlay.classList.add("is-visible", "is-map");
    overlay.classList.remove("is-ended", "is-goal", "is-holding");
    refs.map.hidden = false;
    refs.stage.hidden = true;
    refs.track.hidden = true;
    refs.actionButton.hidden = true;
    refs.result.hidden = true;
    refs.commandBox.hidden = true;
    refs.stepProgress.hidden = true;
    refs.goalCard.hidden = true;
    refs.nextLevel.hidden = true;
    homeOverlay?.classList.remove("is-visible");
    renderMap();
  }

  function startRun(levelIndex = activeLevelIndex) {
    rhythmProgress = readRhythmProgress(localStorage, RHYTHM_DISH_LEVELS.length);
    const requestedIndex = Math.min(
      RHYTHM_DISH_LEVELS.length - 1,
      Math.max(0, Math.floor(Number(levelIndex) || 0)),
    );
    if (!isRhythmLevelUnlocked(rhythmProgress, requestedIndex)) {
      openMap();
      return;
    }
    const picked = levelAt(requestedIndex);
    activeLevelIndex = picked.index;
    game = new RhythmCookingGame(picked.level);
    settled = false;
    active = true;
    awaitingGoal = true;
    startTime = 0;
    lastCommandId = "";
    overlay.hidden = false;
    overlay.classList.add("is-visible");
    overlay.classList.remove("is-map");
    overlay.classList.add("is-goal");
    overlay.classList.remove("is-ended", "is-holding");
    refs.map.hidden = true;
    refs.stage.hidden = false;
    refs.result.hidden = true;
    refs.track.hidden = true;
    refs.actionButton.hidden = true;
    refs.actionButton.disabled = false;
    refs.nextLevel.hidden = true;
    refs.commandBox.hidden = true;
    refs.stepProgress.hidden = true;
    refs.goalTitle.textContent = picked.level.dishName;
    refs.goalDesc.textContent = `${Math.ceil(picked.level.durationMs / 1000)} 秒内尽可能多做${picked.level.unitName || "成品"}`;
    refs.goalStars.textContent = formatGoalText(picked.level);
    refs.goalFlow.textContent = `流程：${formatActionFlow(picked.level)}`;
    const levelInfo = formatRhythmLevelInfo(picked.index, picked.level);
    refs.level.textContent = levelInfo.levelText;
    refs.dish.textContent = levelInfo.dishText;
    renderStepProgress(picked.level);
    refs.goalCard.hidden = false;
    refs.time.textContent = Math.ceil(picked.level.durationMs / 1000);
    refs.unitLabel.textContent = picked.level.unitName || "成品";
    refs.eggs.textContent = "0";
    refs.fails.textContent = "0";
    refs.actionButton.classList.remove("is-holding", "is-tapping");
    refs.actionButton.classList.remove("is-swiping");
    refs.stage.classList.remove("is-mashing");
    refs.stage.classList.remove("is-swiping");
    refs.scene.classList.remove("is-mashing", "is-egg-complete");
    refs.track.classList.remove("is-mash-good", "is-mash-perfect");
    homeOverlay?.classList.remove("is-visible");
    refreshMascot();
    window.cancelAnimationFrame(animationFrame);
  }

  function beginCooking() {
    if (!active || !awaitingGoal) return;
    ensureAudio?.();
    awaitingGoal = false;
    overlay.classList.remove("is-goal");
    game.start(0);
    startTime = performance.now();
    lastCommandId = "";
    refs.goalCard.hidden = true;
    refs.track.hidden = false;
    refs.actionButton.hidden = false;
    refs.actionButton.disabled = false;
    refs.commandBox.hidden = false;
    refs.stepProgress.hidden = false;
    refs.actionButton.classList.remove("is-holding", "is-tapping");
    refs.actionButton.classList.remove("is-swiping");
    refs.stage.classList.remove("is-mashing");
    refs.stage.classList.remove("is-swiping");
    refs.scene.classList.remove("is-mashing", "is-egg-complete");
    refs.track.classList.remove("is-mash-good", "is-mash-perfect");
    game.drainEvents();
    render();
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(tick);
  }

  function stopRun({ showHome = true } = {}) {
    active = false;
    spaceDown = false;
    awaitingGoal = false;
    window.cancelAnimationFrame(animationFrame);
    overlay.classList.remove("is-visible", "is-holding", "is-goal", "is-map");
    overlay.hidden = true;
    if (showHome) homeOverlay?.classList.add("is-visible");
  }

  function tick() {
    if (!canRunRhythmClock({ isActive: active, isGoalConfirmed: !awaitingGoal, gameState: game.state })) return;
    game.update(nowElapsed());
    handleEvents();
    render();
    if (game.state === "ended") {
      showResult(game.result);
      return;
    }
    animationFrame = window.requestAnimationFrame(tick);
  }

  function applyResult(result) {
    if (settled || !result) return;
    settled = true;
    saveWallet?.((getWallet?.() || 0) + result.coinsEarned);
    const progress = getProgress?.() || {};
    saveProgress?.({
      ...progress,
      bestScore: Math.max(Number(progress.bestScore) || 0, result.completedEggs),
      totalRuns: (Number(progress.totalRuns) || 0) + 1,
      totalEggs: (Number(progress.totalEggs) || 0) + result.completedEggs,
      totalCoinsEarned: (Number(progress.totalCoinsEarned) || 0) + result.coinsEarned,
    });
    const progressUpdate = getRhythmResultProgressUpdate(
      rhythmProgress,
      activeLevelIndex,
      result.stars,
      RHYTHM_DISH_LEVELS.length,
    );
    rhythmProgress = progressUpdate.progress;
    result.newBestStars = progressUpdate.newBestStars;
    result.unlockedNext = progressUpdate.unlockedNext;
    saveRhythmProgress(rhythmProgress, localStorage);
  }

  function showResult(result) {
    applyResult(result);
    const resultUi = getRhythmResultUiState({
      activeLevelIndex,
      result,
      unlockedLevelIndex: rhythmProgress.unlockedLevelIndex,
    });
    awaitingGoal = false;
    refs.result.hidden = false;
    refs.actionButton.disabled = true;
    refs.actionButton.hidden = !resultUi.showActionButton;
    refs.track.hidden = !resultUi.showTrack;
    refs.commandBox.hidden = !resultUi.showCommand;
    refs.stepProgress.hidden = !resultUi.showStepProgress;
    refs.goalCard.hidden = !resultUi.showGoalCard;
    refs.actionButton.classList.remove("is-holding", "is-tapping");
    refs.actionButton.classList.remove("is-swiping");
    refs.stage.classList.remove("is-mashing");
    refs.stage.classList.remove("is-swiping");
    refs.scene.classList.remove("is-mashing", "is-egg-complete");
    refs.track.classList.remove("is-mash-good", "is-mash-perfect");
    overlay.classList.add("is-ended");
    overlay.classList.remove("is-holding", "is-goal");
    refs.actionIcon.textContent = "";
    refs.actionLabel.textContent = resultUi.actionLabel;
    refs.resultTitle.textContent = `菜品完成：${result.dishName}`;
    refs.finalEggs.textContent = `${result.completedEggs} 个`;
    refs.finalFails.textContent = result.failedActions;
    refs.finalCoins.textContent = `+${result.coinsEarned}`;
    refs.stars.textContent = formatStars(result.stars);
    const resultBadges = [
      result.newBestStars ? "新纪录！" : "",
      result.unlockedNext ? "解锁新关卡！" : "",
    ].filter(Boolean);
    refs.resultBadges.textContent = resultBadges.join(" · ");
    refs.resultBadges.hidden = resultBadges.length === 0;
    refs.nextLevel.hidden = !resultUi.showNextLevel;
    playCue?.(result.stars >= 2 ? "perfect" : "good");
    vibrate?.(result.stars >= 2 ? [35, 20, 55] : 20);
  }

  function handleEvents() {
    for (const event of game.drainEvents()) {
      if (event.type === "hit") {
        const feedbackText = event.actionResult === "success"
          ? (event.command?.type === RHYTHM_COMMAND_TYPES.SWIPE ? "装盘完成！" : "成功！")
          : (event.command?.type === RHYTHM_COMMAND_TYPES.SWIPE ? "再滑远一点！" : "失败！");
        showActionFeedback(feedbackText, event.actionResult);
        spawnActionFx(event.command?.type, event.actionResult, event.command?.scene);
        if (event.actionResult === "success") {
          playCue?.("good");
          vibrate?.(12);
        } else {
          playCue?.("burn");
          vibrate?.([25, 20, 25]);
        }
      } else if (event.type === "eggCompleted") {
        const unitName = game.getSnapshot().level?.unitName || "成品";
        refs.scene.classList.remove("is-egg-complete");
        void refs.scene.offsetWidth;
        refs.scene.classList.add("is-egg-complete");
        window.clearTimeout(sceneTimer);
        sceneTimer = window.setTimeout(() => refs.scene.classList.remove("is-egg-complete"), 680);
        showActionFeedback(`+1 ${unitName}`, "complete");
        spawnActionFx(RHYTHM_COMMAND_TYPES.TAP, "success", "serve");
        playCue?.("perfect");
        vibrate?.([22, 18, 36]);
      } else if (event.type === "mashTap") {
        refs.actionButton.classList.remove("is-tapping");
        void refs.actionButton.offsetWidth;
        refs.actionButton.classList.add("is-tapping");
        refs.stage.classList.remove("is-mashing");
        void refs.stage.offsetWidth;
        refs.stage.classList.add("is-mashing");
        refs.scene.classList.remove("is-mashing");
        void refs.scene.offsetWidth;
        refs.scene.classList.add("is-mashing");
        refs.track.classList.toggle("is-mash-good", event.goodReady);
        refs.track.classList.toggle("is-mash-perfect", event.completeReady);
        spawnMashTapFx(event);
        if (event.milestone) showMashPop("打蛋完成！");
      } else if (event.type === "earlyTapIgnored") {
        showWaitingHint();
      }
    }
  }

  function spawnActionFx(type, result, scene) {
    if (result !== "success") return;
    const particles =
      scene === "fry" || type === RHYTHM_COMMAND_TYPES.HOLD
        ? ["🔥", "♨️", "🔥"]
        : scene === "serve"
          ? ["✨", "🍳", "⭐"]
          : type === RHYTHM_COMMAND_TYPES.SWIPE
            ? ["➡️", "✨", "🍽️"]
          : type === RHYTHM_COMMAND_TYPES.MASH
            ? ["⚡", "🥣", "⚡", "💥"]
            : ["⭐", "🥚", "✨"];
    particles.forEach((text, index) => {
      const particle = document.createElement("span");
      particle.className = `rhythm-action-fx fx-${type || "tap"}`;
      particle.textContent = text;
      particle.style.setProperty("--fx-x", `${(index - (particles.length - 1) / 2) * 24}px`);
      particle.style.setProperty("--fx-delay", `${index * 35}ms`);
      refs.stage.append(particle);
      window.setTimeout(() => particle.remove(), 760);
    });
  }

  function spawnMashTapFx(event) {
    const particle = document.createElement("span");
    particle.className = `rhythm-action-fx fx-mash-tap${event.completeReady ? " is-complete" : ""}`;
    particle.textContent = event.completeReady ? "💥" : "⚡";
    particle.style.setProperty("--fx-x", `${((event.taps % 5) - 2) * 18}px`);
    refs.stage.append(particle);
    window.setTimeout(() => particle.remove(), 520);
  }

  function showWaitingHint() {
    window.clearTimeout(feedbackTimer);
    refs.feedback.className = "rhythm-feedback is-visible is-wait";
    refs.feedback.textContent = "等一下";
    feedbackTimer = window.setTimeout(() => {
      refs.feedback.classList.remove("is-visible");
    }, 360);
  }

  function showMashPop(text) {
    const pop = document.createElement("span");
    pop.className = "rhythm-mash-pop";
    pop.textContent = text;
    refs.actionButton.append(pop);
    window.setTimeout(() => pop.remove(), 680);
  }

  function showActionFeedback(text, type) {
    window.clearTimeout(feedbackTimer);
    refs.feedback.className = `rhythm-feedback is-visible is-${type}`;
    refs.feedback.textContent = text;
    feedbackTimer = window.setTimeout(() => {
      refs.feedback.classList.remove("is-visible");
    }, 650);
  }

  function render() {
    const snapshot = game.getSnapshot();
    const command = snapshot.activeCommand;
    const remainingSeconds = Math.ceil(snapshot.remainingMs / 1000);
    refs.time.textContent = remainingSeconds;
    refs.eggs.textContent = snapshot.completedEggs;
    refs.fails.textContent = snapshot.failedActions;
    overlay.classList.toggle("is-holding", snapshot.holdActive);

    if (!command || snapshot.state === "ended") {
      refs.commandBox.dataset.type = "done";
      refs.scene.dataset.scene = "serve";
      refs.scene.dataset.holding = "false";
      refs.fill.style.width = "100%";
      refs.goodZone.style.left = "0%";
      refs.goodZone.style.width = "100%";
      return;
    }

    if (command.id !== lastCommandId) {
      lastCommandId = command.id;
      refs.commandBox.classList.remove("is-entering");
      void refs.commandBox.offsetWidth;
      refs.commandBox.classList.add("is-entering");
      refs.track.classList.remove("is-mash-good", "is-mash-perfect");
    }

    const ui = COMMAND_UI[command.type] || COMMAND_UI[RHYTHM_COMMAND_TYPES.TAP];
    const visual = visualForCommand(command);
    const nextCommand = snapshot.nextCommand;
    const stepIndex = Math.min(
      snapshot.actionsPerDish - 1,
      Math.max(0, Number(command.dishStepIndex ?? (snapshot.commandIndex % snapshot.actionsPerDish)) || 0),
    );
    refs.stepProgress.querySelectorAll("[data-step-index]").forEach((icon, index) => {
      icon.classList.toggle("is-active", index === stepIndex);
      icon.classList.toggle("is-done", index < stepIndex);
    });
    refs.commandBox.dataset.type = command.type;
    refs.scene.dataset.scene = visual.scene || command.scene || command.type;
    refs.scene.dataset.visual = command.visualKey || visual.effect || command.scene || command.type;
    refs.scene.dataset.effect = visual.effect || "";
    refs.scene.dataset.holding = String(snapshot.holdActive);
    refs.sceneEgg.textContent = visual.primary || visual.icon || "🥚";
    refs.sceneSecondary.textContent = visual.secondary || "";
    refs.scenePan.textContent = visual.pan || "🍳";
    refs.scenePlate.textContent = visual.plate || "🍽️";
    refs.sceneSparkle.textContent = visual.sparkle || "✨";
    refs.commandIcon.textContent = visual.icon || ui.icon;
    refs.commandStep.textContent = ui.code;
    refs.commandType.textContent = command.prompt || ui.fallbackPrompt;
    refs.commandLabel.textContent = command.actionName || ui.fallbackPrompt;
    refs.commandHint.textContent = "";
    refs.commandNext.textContent = nextCommand
      ? `下一步：${nextCommand.actionName || COMMAND_LABELS[nextCommand.type]}`
      : "最后一道";
    refs.track.dataset.type = command.type;
    refs.actionButton.dataset.type = command.type;
    refs.actionIcon.textContent = visual.icon || ui.icon;
    refs.actionLabel.textContent = ui.actionLabel;

    const progress = commandProgress(snapshot);
    refs.fill.style.width = `${progress.fill}%`;
    refs.goodZone.style.left = `${progress.goodLeft ?? 0}%`;
    refs.goodZone.style.width = `${progress.goodWidth ?? 0}%`;
    refs.perfectZone.style.left = "0%";
    refs.perfectZone.style.width = "0%";
    refs.target.style.left = "0%";
    refs.trackCopy.textContent = progress.copy;
  }

  function performPrimaryInput(event) {
    if (event?.cancelable) event.preventDefault();
    if (!canRunRhythmClock({ isActive: active, isGoalConfirmed: !awaitingGoal, gameState: game.state })) return;
    const command = game.getSnapshot().activeCommand;
    if (command?.type === RHYTHM_COMMAND_TYPES.HOLD) {
      refs.actionButton.classList.add("is-holding");
      game.holdStart(nowElapsed());
    } else if (command?.type === RHYTHM_COMMAND_TYPES.SWIPE) {
      swipeStart = {
        x: Number(event?.clientX) || 0,
        y: Number(event?.clientY) || 0,
      };
      refs.actionButton.classList.add("is-swiping");
      refs.stage.classList.add("is-swiping");
    } else {
      game.tap(nowElapsed());
    }
    handleEvents();
    render();
  }

  function releasePrimaryInput(event) {
    if (event?.cancelable) event.preventDefault();
    if (!canRunRhythmClock({ isActive: active, isGoalConfirmed: !awaitingGoal, gameState: game.state })) return;
    const command = game.getSnapshot().activeCommand;
    refs.actionButton.classList.remove("is-holding");
    refs.actionButton.classList.remove("is-swiping");
    refs.stage.classList.remove("is-swiping");
    if (command?.type === RHYTHM_COMMAND_TYPES.HOLD) {
      game.holdEnd(nowElapsed());
      handleEvents();
      render();
    } else if (command?.type === RHYTHM_COMMAND_TYPES.SWIPE && swipeStart) {
      game.swipe({
        startX: swipeStart.x,
        startY: swipeStart.y,
        endX: Number(event?.clientX) || (event?.code === "Space" ? swipeStart.x + command.minDistancePx : swipeStart.x),
        endY: Number(event?.clientY) || swipeStart.y,
      }, nowElapsed());
      swipeStart = null;
      handleEvents();
      render();
    }
  }

  function cancelActiveHold() {
    if (!canRunRhythmClock({ isActive: active, isGoalConfirmed: !awaitingGoal, gameState: game.state })) return;
    if (!game.getSnapshot().holdActive) return;
    refs.actionButton.classList.remove("is-holding");
    refs.actionButton.classList.remove("is-swiping");
    refs.stage.classList.remove("is-swiping");
    swipeStart = null;
    game.cancelHold(nowElapsed());
    handleEvents();
    render();
  }

  refs.actionButton.addEventListener("pointerdown", (event) => {
    if (event?.cancelable) event.preventDefault();
    refs.actionButton.setPointerCapture?.(event.pointerId);
    performPrimaryInput(event);
  });
  refs.actionButton.addEventListener("pointerup", releasePrimaryInput);
  refs.actionButton.addEventListener("pointercancel", releasePrimaryInput);
  refs.actionButton.addEventListener(
    "touchstart",
    (event) => event.preventDefault(),
    { passive: false },
  );
  refs.actionButton.addEventListener(
    "touchend",
    (event) => event.preventDefault(),
    { passive: false },
  );
  overlay.addEventListener("contextmenu", (event) => event.preventDefault());
  refs.goalStart.addEventListener("click", beginCooking);
  refs.retry.addEventListener("click", () => startRun(activeLevelIndex));
  refs.nextLevel.addEventListener("click", () => startRun(activeLevelIndex + 1));
  refs.mapExit.addEventListener("click", () => stopRun({ showHome: true }));
  refs.homeButtons.forEach((button) => {
    button.addEventListener("click", openMap);
  });
  triggerButton?.addEventListener("click", openMap);

  window.addEventListener("keydown", (event) => {
    if (!active || event.code !== "Space" || spaceDown) return;
    spaceDown = true;
    performPrimaryInput(event);
  });

  window.addEventListener("keyup", (event) => {
    if (!active || event.code !== "Space") return;
    spaceDown = false;
    releasePrimaryInput(event);
  });

  window.addEventListener("blur", cancelActiveHold);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelActiveHold();
  });

  return {
    isActive: () => active,
    refreshMascot,
    stop: stopRun,
  };
}
