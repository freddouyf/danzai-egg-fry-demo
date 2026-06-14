import { RHYTHM_WINDOWS, RhythmCookingGame, unlockRhythmLevelIndex } from "./rhythmGame.js";
import { RHYTHM_COMMAND_TYPES, RHYTHM_DISH_LEVELS } from "./rhythmLevels.js";

const RHYTHM_UNLOCK_KEY = "danzai-rhythm-unlocked-level";
const GOAL_CARD_MS = 1_350;

const COMMAND_LABELS = {
  [RHYTHM_COMMAND_TYPES.TAP]: "TAP",
  [RHYTHM_COMMAND_TYPES.HOLD]: "HOLD",
  [RHYTHM_COMMAND_TYPES.MASH]: "MASH",
};

const COMMAND_HINTS = {
  [RHYTHM_COMMAND_TYPES.TAP]: "看准蓝色成功区点击",
  [RHYTHM_COMMAND_TYPES.HOLD]: "按住，到亮区松开",
  [RHYTHM_COMMAND_TYPES.MASH]: "时间内快速连点",
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
};

function createRhythmOverlay() {
  const overlay = document.createElement("section");
  overlay.className = "overlay rhythm-overlay";
  overlay.setAttribute("aria-labelledby", "rhythmTitle");
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="rhythm-card">
      <div class="rhythm-stats">
        <span>时间 <strong data-rhythm-time>30</strong>s</span>
        <span>煎蛋 <strong data-rhythm-eggs>0</strong>个</span>
        <span>失败 <strong data-rhythm-fails>0</strong></span>
      </div>

      <div class="rhythm-stage">
        <div class="rhythm-goal-card" data-rhythm-goal-card>
          <strong data-rhythm-goal-title>元气煎蛋</strong>
          <span data-rhythm-goal-stars>2 个 = ★ · 4 个 = ★★ · 6 个 = ★★★</span>
        </div>
        <div class="rhythm-step-progress" data-rhythm-step-progress aria-label="当前煎蛋步骤">
          <span data-step-index="0">🥚</span>
          <span data-step-index="1">🥣</span>
          <span data-step-index="2">🍳</span>
        </div>
        <div class="rhythm-mascot" data-rhythm-mascot aria-hidden="true"></div>
        <div class="rhythm-cook-scene" data-rhythm-scene data-scene="crack" aria-hidden="true">
          <span class="scene-egg" data-scene-egg>🥚</span>
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
          <div><dt>完成煎蛋</dt><dd data-rhythm-final-eggs>0 个</dd></div>
          <div><dt>失败动作</dt><dd data-rhythm-final-fails>0</dd></div>
          <div><dt>星级</dt><dd data-rhythm-stars>☆☆☆</dd></div>
          <div><dt>获得金币</dt><dd data-rhythm-final-coins>+0</dd></div>
        </dl>
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

function zonePercent(value, max) {
  return Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100));
}

function timingZone(command, goodMs) {
  const span = Math.max(1, command.expireAtMs - command.startAtMs);
  const target = command.targetAtMs - command.startAtMs;
  const goodStart = zonePercent(target - goodMs, span);
  const goodEnd = zonePercent(target + goodMs, span);
  return {
    goodLeft: goodStart,
    goodWidth: Math.max(8, goodEnd - goodStart),
  };
}

function holdZone(command) {
  const max = Math.max(command.targetHoldMs + 450, command.targetHoldMs * 1.45);
  const goodStart = zonePercent(command.targetHoldMs - RHYTHM_WINDOWS.HOLD.goodMs, max);
  const goodEnd = zonePercent(command.targetHoldMs + RHYTHM_WINDOWS.HOLD.goodMs, max);
  return {
    max,
    goodLeft: goodStart,
    goodWidth: Math.max(8, goodEnd - goodStart),
  };
}

function commandProgress(snapshot) {
  const command = snapshot.activeCommand;
  if (!command) return { fill: 0, copy: "等待动作", goodLeft: 0, goodWidth: 0 };
  if (command.type === RHYTHM_COMMAND_TYPES.MASH) {
    const goodAt = Math.ceil(command.targetTaps * 0.65);
    return {
      fill: Math.min(100, (snapshot.mashTaps / command.targetTaps) * 100),
      copy: `${snapshot.mashTaps} / ${command.targetTaps}`,
      goodLeft: zonePercent(goodAt, command.targetTaps),
      goodWidth: Math.max(8, 100 - zonePercent(goodAt, command.targetTaps)),
    };
  }

  if (command.type === RHYTHM_COMMAND_TYPES.HOLD) {
    const zone = holdZone(command);
    const fill = Math.min(100, (snapshot.holdElapsedMs / zone.max) * 100);
    return {
      fill,
      copy: snapshot.holdActive
        ? `${(snapshot.holdElapsedMs / 1000).toFixed(1)}s`
        : "按住开始",
      ...zone,
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
    ...timingZone(command, RHYTHM_WINDOWS.TAP.goodMs),
  };
}

function readUnlockedLevelIndex() {
  try {
    return Math.max(0, Math.floor(Number(localStorage.getItem(RHYTHM_UNLOCK_KEY)) || 0));
  } catch {
    return 0;
  }
}

function saveUnlockedLevelIndex(index) {
  try {
    localStorage.setItem(RHYTHM_UNLOCK_KEY, String(Math.max(0, Math.floor(Number(index) || 0))));
  } catch {
    // Local storage can be unavailable in private contexts.
  }
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
    time: overlay.querySelector("[data-rhythm-time]"),
    eggs: overlay.querySelector("[data-rhythm-eggs]"),
    fails: overlay.querySelector("[data-rhythm-fails]"),
    goalCard: overlay.querySelector("[data-rhythm-goal-card]"),
    goalTitle: overlay.querySelector("[data-rhythm-goal-title]"),
    goalStars: overlay.querySelector("[data-rhythm-goal-stars]"),
    stepProgress: overlay.querySelector("[data-rhythm-step-progress]"),
    stepIcons: overlay.querySelectorAll("[data-step-index]"),
    stage: overlay.querySelector(".rhythm-stage"),
    mascot: overlay.querySelector("[data-rhythm-mascot]"),
    scene: overlay.querySelector("[data-rhythm-scene]"),
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
    retry: overlay.querySelector("[data-rhythm-retry]"),
    nextLevel: overlay.querySelector("[data-rhythm-next-level]"),
    homeButtons: overlay.querySelectorAll("[data-rhythm-home]"),
  };

  const first = levelAt(0);
  let activeLevelIndex = first.index;
  let unlockedLevelIndex = readUnlockedLevelIndex();
  let game = new RhythmCookingGame(first.level);
  let animationFrame = 0;
  let startTime = 0;
  let active = false;
  let settled = false;
  let feedbackTimer = 0;
  let spaceDown = false;
  let lastCommandId = "";
  let sceneTimer = 0;
  let goalTimer = 0;

  function nowElapsed() {
    return Math.max(0, performance.now() - startTime);
  }

  function refreshMascot() {
    mountMascot?.(refs.mascot, active ? "happy" : "idle");
  }

  function startRun(levelIndex = activeLevelIndex) {
    ensureAudio?.();
    const picked = levelAt(Math.min(levelIndex, unlockedLevelIndex));
    activeLevelIndex = picked.index;
    game = new RhythmCookingGame(picked.level);
    game.start(0);
    settled = false;
    active = true;
    startTime = performance.now() + GOAL_CARD_MS;
    lastCommandId = "";
    overlay.hidden = false;
    overlay.classList.add("is-visible");
    overlay.classList.remove("is-ended", "is-holding");
    refs.result.hidden = true;
    refs.track.hidden = false;
    refs.actionButton.hidden = false;
    refs.actionButton.disabled = false;
    refs.nextLevel.hidden = true;
    refs.commandBox.hidden = false;
    refs.stepProgress.hidden = false;
    refs.goalTitle.textContent = picked.level.dishName;
    refs.goalStars.textContent = formatGoalText(picked.level);
    refs.goalCard.hidden = false;
    window.clearTimeout(goalTimer);
    goalTimer = window.setTimeout(() => {
      refs.goalCard.hidden = true;
    }, GOAL_CARD_MS);
    homeOverlay?.classList.remove("is-visible");
    refreshMascot();
    game.drainEvents();
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(tick);
  }

  function stopRun({ showHome = true } = {}) {
    active = false;
    spaceDown = false;
    window.clearTimeout(goalTimer);
    window.cancelAnimationFrame(animationFrame);
    overlay.classList.remove("is-visible", "is-holding");
    overlay.hidden = true;
    if (showHome) homeOverlay?.classList.add("is-visible");
  }

  function tick() {
    if (!active) return;
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
    if (result.stars >= 1 && activeLevelIndex < RHYTHM_DISH_LEVELS.length - 1) {
      const nextUnlocked = Math.min(
        RHYTHM_DISH_LEVELS.length - 1,
        unlockRhythmLevelIndex(unlockedLevelIndex, activeLevelIndex, result.stars),
      );
      if (nextUnlocked > unlockedLevelIndex) {
        unlockedLevelIndex = nextUnlocked;
        saveUnlockedLevelIndex(unlockedLevelIndex);
      }
    }
  }

  function showResult(result) {
    applyResult(result);
    refs.result.hidden = false;
    refs.actionButton.disabled = true;
    refs.actionButton.hidden = true;
    refs.track.hidden = true;
    refs.commandBox.hidden = true;
    refs.stepProgress.hidden = true;
    refs.goalCard.hidden = true;
    overlay.classList.add("is-ended");
    refs.resultTitle.textContent = `菜品完成：${result.dishName}`;
    refs.finalEggs.textContent = `${result.completedEggs} 个`;
    refs.finalFails.textContent = result.failedActions;
    refs.finalCoins.textContent = `+${result.coinsEarned}`;
    refs.stars.textContent = formatStars(result.stars);
    refs.nextLevel.hidden = !shouldShowRhythmNextLevel({
      activeLevelIndex,
      stars: result.stars,
      unlockedLevelIndex,
    });
    playCue?.(result.stars >= 2 ? "perfect" : "good");
    vibrate?.(result.stars >= 2 ? [35, 20, 55] : 20);
  }

  function handleEvents() {
    for (const event of game.drainEvents()) {
      if (event.type === "hit") {
        showActionFeedback(event.actionResult === "success" ? "成功！" : "失败！", event.actionResult);
        spawnActionFx(event.command?.type, event.actionResult, event.command?.scene);
        if (event.actionResult === "success") {
          playCue?.("good");
          vibrate?.(12);
        } else {
          playCue?.("burn");
          vibrate?.([25, 20, 25]);
        }
      } else if (event.type === "eggCompleted") {
        refs.scene.classList.remove("is-egg-complete");
        void refs.scene.offsetWidth;
        refs.scene.classList.add("is-egg-complete");
        window.clearTimeout(sceneTimer);
        sceneTimer = window.setTimeout(() => refs.scene.classList.remove("is-egg-complete"), 680);
        showActionFeedback("煎蛋完成！", "complete");
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
        if (event.milestone) showMashPop(event.completeReady ? "完成！" : "达标！");
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
    const nextCommand = snapshot.level.commands[snapshot.commandIndex + 1];
    const stepIndex = Math.min(
      snapshot.actionsPerDish - 1,
      Math.max(0, Number(command.dishStepIndex ?? (snapshot.commandIndex % snapshot.actionsPerDish)) || 0),
    );
    refs.stepIcons.forEach((icon, index) => {
      icon.classList.toggle("is-active", index === stepIndex);
      icon.classList.toggle("is-done", index < stepIndex);
    });
    refs.commandBox.dataset.type = command.type;
    refs.scene.dataset.scene = command.scene || command.type;
    refs.scene.dataset.holding = String(snapshot.holdActive);
    refs.commandIcon.textContent = ui.icon;
    refs.commandStep.textContent = ui.code;
    refs.commandType.textContent = command.prompt || ui.fallbackPrompt;
    refs.commandLabel.textContent = command.actionName || ui.fallbackPrompt;
    refs.commandHint.textContent =
      command.helperText || COMMAND_HINTS[command.type] || "按提示操作";
    refs.commandNext.textContent = nextCommand
      ? `下一步：${nextCommand.actionName || COMMAND_LABELS[nextCommand.type]}`
      : "最后一道";
    refs.track.dataset.type = command.type;
    refs.actionButton.dataset.type = command.type;
    refs.actionIcon.textContent = ui.icon;
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
    if (!active || game.state !== "playing") return;
    const command = game.getSnapshot().activeCommand;
    if (command?.type === RHYTHM_COMMAND_TYPES.HOLD) {
      refs.actionButton.classList.add("is-holding");
      game.holdStart(nowElapsed());
    } else {
      game.tap(nowElapsed());
    }
    handleEvents();
    render();
  }

  function releasePrimaryInput(event) {
    if (event?.cancelable) event.preventDefault();
    if (!active || game.state !== "playing") return;
    const command = game.getSnapshot().activeCommand;
    refs.actionButton.classList.remove("is-holding");
    if (command?.type === RHYTHM_COMMAND_TYPES.HOLD) {
      game.holdEnd(nowElapsed());
      handleEvents();
      render();
    }
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
  refs.retry.addEventListener("click", () => startRun(activeLevelIndex));
  refs.nextLevel.addEventListener("click", () => startRun(activeLevelIndex + 1));
  refs.homeButtons.forEach((button) => {
    button.addEventListener("click", () => stopRun({ showHome: true }));
  });
  triggerButton?.addEventListener("click", () => startRun(0));

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

  return {
    isActive: () => active,
    refreshMascot,
    stop: stopRun,
  };
}
