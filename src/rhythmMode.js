import { RhythmCookingGame, RHYTHM_HIT_QUALITY } from "./rhythmGame.js";
import { RHYTHM_COMMAND_TYPES, RHYTHM_TEST_LEVEL } from "./rhythmLevels.js";

const QUALITY_LABELS = {
  [RHYTHM_HIT_QUALITY.PERFECT]: "Perfect",
  [RHYTHM_HIT_QUALITY.GOOD]: "Good",
  [RHYTHM_HIT_QUALITY.MISS]: "Miss",
};

const COMMAND_LABELS = {
  [RHYTHM_COMMAND_TYPES.TAP]: "TAP",
  [RHYTHM_COMMAND_TYPES.HOLD]: "HOLD",
  [RHYTHM_COMMAND_TYPES.MASH]: "MASH",
};

const COMMAND_HINTS = {
  [RHYTHM_COMMAND_TYPES.TAP]: "节拍点亮时点一下",
  [RHYTHM_COMMAND_TYPES.HOLD]: "按住，接近目标时松开",
  [RHYTHM_COMMAND_TYPES.MASH]: "限定时间内快速连点",
};

function createRhythmOverlay() {
  const overlay = document.createElement("section");
  overlay.className = "overlay rhythm-overlay";
  overlay.setAttribute("aria-labelledby", "rhythmTitle");
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="rhythm-card">
      <header class="rhythm-header">
        <div>
          <p>实验模式</p>
          <h2 id="rhythmTitle">节奏厨房</h2>
        </div>
        <button class="rhythm-home-button" type="button" data-rhythm-home>返回首页</button>
      </header>

      <div class="rhythm-stats">
        <span>时间 <strong data-rhythm-time>30</strong>s</span>
        <span>得分 <strong data-rhythm-score>0</strong></span>
        <span>Combo <strong data-rhythm-combo>0</strong></span>
      </div>

      <div class="rhythm-stage">
        <div class="rhythm-mascot" data-rhythm-mascot aria-hidden="true"></div>
        <div class="rhythm-command">
          <small data-rhythm-command-step>1 / 1</small>
          <strong data-rhythm-command-type>READY</strong>
          <span data-rhythm-command-label>准备开火</span>
          <em data-rhythm-command-hint>看指令操作</em>
        </div>
        <div class="rhythm-feedback" data-rhythm-feedback aria-hidden="true"></div>
      </div>

      <div class="rhythm-track" data-rhythm-track>
        <i data-rhythm-fill></i>
        <b data-rhythm-target></b>
        <span data-rhythm-track-copy>等待第一道指令</span>
      </div>

      <button class="rhythm-action-button" type="button" data-rhythm-action>
        <span data-rhythm-action-icon>🍳</span>
        <strong data-rhythm-action-label>准备</strong>
      </button>

      <div class="rhythm-result" data-rhythm-result hidden>
        <h3>节奏厨房结算</h3>
        <div class="rhythm-stars" data-rhythm-stars>☆☆☆</div>
        <dl>
          <div><dt>得分</dt><dd data-rhythm-final-score>0</dd></div>
          <div><dt>最高 Combo</dt><dd data-rhythm-final-combo>0</dd></div>
          <div><dt>Perfect</dt><dd data-rhythm-final-perfect>0</dd></div>
          <div><dt>Miss</dt><dd data-rhythm-final-miss>0</dd></div>
          <div><dt>获得金币</dt><dd data-rhythm-final-coins>0</dd></div>
        </dl>
        <div class="rhythm-result-actions">
          <button class="primary-button" type="button" data-rhythm-retry><span>再试一次</span></button>
          <button class="secondary-button" type="button" data-rhythm-home>返回首页</button>
        </div>
      </div>
    </div>
  `;
  return overlay;
}

function formatStars(stars) {
  return "★".repeat(stars) + "☆".repeat(Math.max(0, 3 - stars));
}

function commandProgress(command, elapsedMs, mashTaps) {
  if (!command) return { fill: 0, target: 50, copy: "等待指令" };
  if (command.type === RHYTHM_COMMAND_TYPES.MASH) {
    return {
      fill: Math.min(100, (mashTaps / command.targetTaps) * 100),
      target: 100,
      copy: `${mashTaps} / ${command.targetTaps}`,
    };
  }

  const span = Math.max(1, command.expireAtMs - command.startAtMs);
  const fill = Math.min(100, Math.max(0, ((elapsedMs - command.startAtMs) / span) * 100));
  const target = Math.min(100, Math.max(0, ((command.targetAtMs - command.startAtMs) / span) * 100));
  const untilTarget = Math.round((command.targetAtMs - elapsedMs) / 100) / 10;
  return {
    fill,
    target,
    copy: untilTarget > 0 ? `${untilTarget.toFixed(1)}s` : "现在！",
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
    time: overlay.querySelector("[data-rhythm-time]"),
    score: overlay.querySelector("[data-rhythm-score]"),
    combo: overlay.querySelector("[data-rhythm-combo]"),
    mascot: overlay.querySelector("[data-rhythm-mascot]"),
    commandStep: overlay.querySelector("[data-rhythm-command-step]"),
    commandType: overlay.querySelector("[data-rhythm-command-type]"),
    commandLabel: overlay.querySelector("[data-rhythm-command-label]"),
    commandHint: overlay.querySelector("[data-rhythm-command-hint]"),
    feedback: overlay.querySelector("[data-rhythm-feedback]"),
    track: overlay.querySelector("[data-rhythm-track]"),
    fill: overlay.querySelector("[data-rhythm-fill]"),
    target: overlay.querySelector("[data-rhythm-target]"),
    trackCopy: overlay.querySelector("[data-rhythm-track-copy]"),
    actionButton: overlay.querySelector("[data-rhythm-action]"),
    actionIcon: overlay.querySelector("[data-rhythm-action-icon]"),
    actionLabel: overlay.querySelector("[data-rhythm-action-label]"),
    result: overlay.querySelector("[data-rhythm-result]"),
    finalScore: overlay.querySelector("[data-rhythm-final-score]"),
    finalCombo: overlay.querySelector("[data-rhythm-final-combo]"),
    finalPerfect: overlay.querySelector("[data-rhythm-final-perfect]"),
    finalMiss: overlay.querySelector("[data-rhythm-final-miss]"),
    finalCoins: overlay.querySelector("[data-rhythm-final-coins]"),
    stars: overlay.querySelector("[data-rhythm-stars]"),
    retry: overlay.querySelector("[data-rhythm-retry]"),
    homeButtons: overlay.querySelectorAll("[data-rhythm-home]"),
  };

  let game = new RhythmCookingGame(RHYTHM_TEST_LEVEL);
  let animationFrame = 0;
  let startTime = 0;
  let active = false;
  let settled = false;
  let feedbackTimer = 0;
  let spaceDown = false;

  function nowElapsed() {
    return Math.max(0, performance.now() - startTime);
  }

  function refreshMascot() {
    mountMascot?.(refs.mascot, active && game.getSnapshot().fever ? "happy" : "idle");
  }

  function startRun() {
    ensureAudio?.();
    game = new RhythmCookingGame(RHYTHM_TEST_LEVEL);
    game.start(0);
    settled = false;
    active = true;
    startTime = performance.now();
    overlay.hidden = false;
    overlay.classList.add("is-visible");
    overlay.classList.remove("is-ended", "is-fever");
    refs.result.hidden = true;
    refs.actionButton.disabled = false;
    homeOverlay?.classList.remove("is-visible");
    refreshMascot();
    game.drainEvents();
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(tick);
  }

  function stopRun({ showHome = true } = {}) {
    active = false;
    spaceDown = false;
    window.cancelAnimationFrame(animationFrame);
    overlay.classList.remove("is-visible", "is-fever");
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
      bestScore: Math.max(Number(progress.bestScore) || 0, result.score),
      bestCombo: Math.max(Number(progress.bestCombo) || 0, result.bestCombo),
      totalRuns: (Number(progress.totalRuns) || 0) + 1,
      totalPerfects: (Number(progress.totalPerfects) || 0) + result.perfectCount,
      totalCoinsEarned: (Number(progress.totalCoinsEarned) || 0) + result.coinsEarned,
    });
  }

  function showResult(result) {
    applyResult(result);
    refs.result.hidden = false;
    refs.actionButton.disabled = true;
    overlay.classList.add("is-ended");
    refs.finalScore.textContent = result.score;
    refs.finalCombo.textContent = `x${result.bestCombo}`;
    refs.finalPerfect.textContent = result.perfectCount;
    refs.finalMiss.textContent = result.missCount;
    refs.finalCoins.textContent = `+${result.coinsEarned}`;
    refs.stars.textContent = formatStars(result.stars);
    playCue?.(result.stars >= 2 ? "perfect" : "good");
    vibrate?.(result.stars >= 2 ? [35, 20, 55] : 20);
  }

  function handleEvents() {
    for (const event of game.drainEvents()) {
      if (event.type === "hit") {
        showFeedback(event);
        if (event.quality === RHYTHM_HIT_QUALITY.PERFECT) {
          playCue?.(event.combo >= 5 ? "fever" : "perfect");
          vibrate?.(event.combo >= 5 ? [35, 15, 55] : 20);
        } else if (event.quality === RHYTHM_HIT_QUALITY.GOOD) {
          playCue?.("good");
          vibrate?.(12);
        } else {
          playCue?.("burn");
          vibrate?.([25, 20, 25]);
        }
        if (event.combo >= 5) {
          overlay.classList.add("is-fever");
          refreshMascot();
        }
      } else if (event.type === "mashTap") {
        refs.actionButton.classList.remove("is-tapping");
        void refs.actionButton.offsetWidth;
        refs.actionButton.classList.add("is-tapping");
      }
    }
  }

  function showFeedback(event) {
    window.clearTimeout(feedbackTimer);
    refs.feedback.className = `rhythm-feedback is-visible is-${event.quality}`;
    const label = QUALITY_LABELS[event.quality] || "Hit";
    refs.feedback.textContent =
      event.combo >= 3 && event.quality !== RHYTHM_HIT_QUALITY.MISS
        ? `${label} x${event.combo}`
        : `${label}!`;
    feedbackTimer = window.setTimeout(() => {
      refs.feedback.classList.remove("is-visible");
    }, 650);
  }

  function render() {
    const snapshot = game.getSnapshot();
    const command = snapshot.activeCommand;
    const remainingSeconds = Math.ceil(snapshot.remainingMs / 1000);
    refs.time.textContent = remainingSeconds;
    refs.score.textContent = snapshot.score;
    refs.combo.textContent = snapshot.combo;
    overlay.classList.toggle("is-fever", snapshot.fever);
    refs.commandStep.textContent =
      `${Math.min(snapshot.commandIndex + 1, snapshot.level.commands.length)} / ${snapshot.level.commands.length}`;

    if (!command || snapshot.state === "ended") {
      refs.commandType.textContent = "DONE";
      refs.commandLabel.textContent = "出菜完成";
      refs.commandHint.textContent = "查看本局结算";
      refs.actionLabel.textContent = "完成";
      refs.actionIcon.textContent = "⭐";
      refs.fill.style.width = "100%";
      refs.target.style.left = "100%";
      refs.trackCopy.textContent = "完成";
      return;
    }

    refs.commandType.textContent = COMMAND_LABELS[command.type] || "TAP";
    refs.commandLabel.textContent = command.label || "厨房动作";
    refs.commandHint.textContent = COMMAND_HINTS[command.type] || "按提示操作";
    refs.track.dataset.type = command.type;
    refs.actionButton.dataset.type = command.type;
    refs.actionIcon.textContent =
      command.type === RHYTHM_COMMAND_TYPES.MASH
        ? "⚡"
        : command.type === RHYTHM_COMMAND_TYPES.HOLD
          ? "✊"
          : "👆";
    refs.actionLabel.textContent =
      command.type === RHYTHM_COMMAND_TYPES.MASH
        ? "狂点"
        : command.type === RHYTHM_COMMAND_TYPES.HOLD
          ? "按住"
          : "点击";

    const progress = commandProgress(command, snapshot.elapsedMs, snapshot.mashTaps);
    refs.fill.style.width = `${progress.fill}%`;
    refs.target.style.left = `${progress.target}%`;
    refs.trackCopy.textContent = progress.copy;
  }

  function performPrimaryInput(event) {
    event?.preventDefault();
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
    event?.preventDefault();
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
    refs.actionButton.setPointerCapture?.(event.pointerId);
    performPrimaryInput(event);
  });
  refs.actionButton.addEventListener("pointerup", releasePrimaryInput);
  refs.actionButton.addEventListener("pointercancel", releasePrimaryInput);
  refs.retry.addEventListener("click", startRun);
  refs.homeButtons.forEach((button) => {
    button.addEventListener("click", () => stopRun({ showHome: true }));
  });
  triggerButton?.addEventListener("click", startRun);

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
