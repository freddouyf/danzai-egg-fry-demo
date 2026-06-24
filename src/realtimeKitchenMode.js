import {
  REALTIME_ACTION_LABELS,
  REALTIME_ACTION_TYPES,
  REALTIME_DEFAULT_LEVEL,
  REALTIME_INGREDIENTS,
  REALTIME_LEVEL_NAME,
  REALTIME_TARGETS,
  getRealtimeNewRecipe,
  getRealtimeRecipeFlow,
} from "./realtimeKitchenData.js";
import { getHoldWindow, getSwipeProgress, RealtimeKitchenGame } from "./realtimeKitchenGame.js";

const COPY = Object.freeze({
  modeLabel: "\u5b9e\u65f6\u53a8\u623f\u6d4b\u8bd5\u7248",
  modeTitle: "\u987e\u5ba2\u5012\u8ba1\u65f6\u53a8\u623f",
  home: "\u8fd4\u56de\u9996\u9875",
  level: "\u5173\u5361",
  target: "\u76ee\u6807",
  targetValue: "\u670d\u52a1 3 \u4f4d",
  served: "\u5df2\u670d\u52a1",
  walked: "\u8d70\u6389",
  patience: "\u8010\u5fc3",
  customer: "\u987e\u5ba2",
  waitingOrder: "\u7b49\u5f85\u8ba2\u5355",
  currentDish: "\u5f53\u524d\u83dc\u54c1",
  ingredients: "\u98df\u6750\u6846",
  firstHint: "\u5148\u6309\u8ba2\u5355\u653e\u5165\u6b63\u786e\u98df\u6750\u3002",
  resultTitle: "\u4eca\u65e5\u7ed3\u7b97",
  nextLevel: "\u4e0b\u4e00\u5173",
  finalServed: "\u5df2\u670d\u52a1\u5ba2\u4eba",
  finalWalked: "\u8d70\u6389\u5ba2\u4eba",
  finalCoins: "\u603b\u91d1\u5e01",
  finalState: "\u7ed3\u679c",
  restart: "\u518d\u6765\u4e00\u5c40",
  dragIngredient: "\u62d6\u98df\u6750",
  action: "\u505a\u83dc\u52a8\u4f5c",
  waitCustomer: "\u7b49\u5f85\u987e\u5ba2",
  prepareBusiness: "\u51c6\u5907\u8425\u4e1a",
  customerComing: "\u987e\u5ba2\u6765\u4e86\uff01",
  finishInstruction: "\u62d6\u98df\u6750\u5230\u53d1\u5149\u533a\u57df\uff0c\u6216\u5b8c\u6210\u4e0b\u65b9\u52a8\u4f5c\u3002",
  actionFirst: "\u73b0\u5728\u5148\u5b8c\u6210\u52a8\u4f5c\uff01",
  dragToTarget: "\u62d6\u5230\u9505\u3001\u6848\u677f\u6216\u76d8\u5b50\u91cc\u3002",
  todayBusiness: "\u4eca\u65e5\u8425\u4e1a",
  waitResult: "\u7b49\u5f85\u7ed3\u7b97",
  todayClosed: "\u4eca\u65e5\u6253\u70ca",
  passed: "\u901a\u5173\u6210\u529f",
  failed: "\u8425\u4e1a\u5931\u8d25",
  seeResult: "\u67e5\u770b\u7ed3\u7b97\uff0c\u6216\u518d\u6765\u4e00\u5c40\u3002",
  customerOnRoad: "\u987e\u5ba2\u6b63\u5728\u8def\u4e0a\u3002",
  dragCorrect: "\u62d6\u52a8\u6b63\u786e\u98df\u6750\u5230\u53d1\u5149\u533a\u57df\u3002",
  tapOnce: "\u70b9\u51fb\u4e00\u6b21",
  holdRelease: "\u6309\u4f4f\uff0c\u5230\u7eff\u8272\u533a\u677e\u624b",
  mash: "\u72c2\u70b9",
  swipeTitle: "\u62d6\u52a8\u6ed1\u5757",
  swipeIdle: "\u5411\u53f3\u62d6\u52a8\u88c5\u76d8",
  swipeReady: "\u677e\u624b\u88c5\u76d8",
  coin: "\u91d1\u5e01",
  introGoal: "\u76ee\u6807\uff1a\u670d\u52a1 3 \u4f4d\u5ba2\u4eba",
  introNewDish: "\u672c\u5173\u65b0\u83dc",
  introMeaning: "\u9e21\u86cb \u2192 \u9505 \u2192 TAP \u6572\u86cb \u2192 HOLD \u714e\u719f \u2192 SWIPE \u88c5\u76d8",
  startBusiness: "\u5f00\u59cb\u8425\u4e1a",
  shortIngredient: "\u653e\u98df\u6750",
  shortAction: "\u505a\u52a8\u4f5c",
  shortServe: "\u51fa\u9910",
});

function seconds(ms) {
  return Math.max(0, Math.ceil(ms / 1000));
}

function percent(value, max) {
  return `${Math.max(0, Math.min(100, (Number(value) / Math.max(1, Number(max))) * 100))}%`;
}

function byId(items, id) {
  return items.find((item) => item.id === id) || null;
}

export function shouldShowRealtimePlate(step = {}) {
  return step?.targetId === "plate" || step?.actionType === REALTIME_ACTION_TYPES.SWIPE;
}

function getStepTone(step = {}) {
  if (!step) return "idle";
  if (step.type === "ingredient") return `ingredient-${step.targetId || "unknown"}`;
  return step.actionType || "action";
}

function createRealtimeOverlay() {
  const overlay = document.createElement("section");
  overlay.className = "overlay realtime-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="realtime-card">
      <header class="realtime-header">
        <div>
          <small>${COPY.modeLabel}</small>
          <h2>${COPY.modeTitle}</h2>
        </div>
        <button class="secondary-button" type="button" data-realtime-home>${COPY.home}</button>
      </header>

      <section class="realtime-hud">
        <span>${COPY.level} <strong data-realtime-level>${REALTIME_LEVEL_NAME}</strong></span>
        <span>${COPY.target} <strong data-realtime-target>${COPY.targetValue}</strong></span>
        <span>${COPY.served} <strong data-realtime-served>0</strong></span>
        <span>${COPY.walked} <strong data-realtime-walked>0</strong></span>
        <span>${COPY.patience} <strong data-realtime-patience>0s</strong></span>
      </section>

      <section class="realtime-intro" data-realtime-intro>
        <small>${COPY.modeLabel}</small>
        <h3 data-realtime-intro-title>${REALTIME_DEFAULT_LEVEL.levelTitle}</h3>
        <p>${COPY.introGoal}</p>
        <div class="realtime-intro-recipe">
          <strong>${COPY.introNewDish}\uff1a<span data-realtime-intro-dish></span></strong>
          <div class="realtime-intro-flow" data-realtime-intro-flow></div>
          <small data-realtime-intro-meaning>${COPY.introMeaning}</small>
        </div>
        <button class="primary-button" type="button" data-realtime-start><span>${COPY.startBusiness}</span></button>
      </section>

      <section class="realtime-customer">
        <div>
          <small data-realtime-customer-name>${COPY.customer}</small>
          <h3 data-realtime-dish-name>${COPY.waitingOrder}</h3>
        </div>
        <div class="realtime-required" data-realtime-required></div>
        <div class="realtime-patience"><i data-realtime-patience-fill></i></div>
      </section>

      <section class="realtime-ingredients">
        <h3>${COPY.ingredients}</h3>
        <div class="realtime-ingredient-list" data-realtime-ingredients></div>
      </section>

      <section class="realtime-kitchen" data-realtime-kitchen>
        <div class="realtime-kitchen-skin" aria-hidden="true">
          <span class="realtime-kitchen-wall"></span>
          <span class="realtime-kitchen-counter"></span>
        </div>
        <div class="realtime-workstation">
          <div class="realtime-danzai realtime-mascot-shell">
            <div class="realtime-mascot" data-realtime-mascot>\u{1F95A}</div>
            <div class="realtime-dish-bubble">
              <small>${COPY.currentDish}</small>
              <strong data-realtime-stage-dish>${COPY.waitingOrder}</strong>
            </div>
          </div>
          <div class="realtime-targets" data-realtime-targets></div>
        </div>
        <div class="realtime-step-bar" data-realtime-step-bar>
          <small data-realtime-step-kicker>${COPY.dragIngredient}</small>
          <div class="realtime-recipe-track" data-realtime-recipe-track></div>
          <p data-realtime-step-feedback>${COPY.finishInstruction}</p>
        </div>
        <div class="realtime-action-progress" data-realtime-progress hidden>
          <span data-realtime-progress-zone hidden></span>
          <i data-realtime-progress-fill></i>
        </div>
      </section>

      <section class="realtime-controls" data-realtime-controls>
        <p>${COPY.firstHint}</p>
      </section>

      <div class="realtime-toast" data-realtime-toast hidden></div>

      <section class="realtime-result" data-realtime-result hidden>
        <h3 data-realtime-result-title>${COPY.resultTitle}</h3>
        <dl>
          <div><dt>${COPY.finalServed}</dt><dd data-realtime-final-served>0</dd></div>
          <div><dt>${COPY.finalWalked}</dt><dd data-realtime-final-walked>0</dd></div>
          <div><dt>${COPY.finalCoins}</dt><dd data-realtime-final-coins>0</dd></div>
          <div><dt>${COPY.finalState}</dt><dd data-realtime-final-state>--</dd></div>
        </dl>
        <p data-realtime-final-comment></p>
        <div class="realtime-result-actions">
          <button class="primary-button" type="button" data-realtime-next hidden><span>${COPY.nextLevel}</span></button>
          <button class="primary-button" type="button" data-realtime-restart><span>${COPY.restart}</span></button>
          <button class="secondary-button" type="button" data-realtime-result-home>${COPY.home}</button>
        </div>
      </section>
    </div>
  `;
  return overlay;
}

export function createRealtimeKitchenMode({
  root,
  triggerButton,
  homeOverlay,
  ensureAudio,
} = {}) {
  const overlay = createRealtimeOverlay();
  root.append(overlay);

  const refs = {
    level: overlay.querySelector("[data-realtime-level]"),
    target: overlay.querySelector("[data-realtime-target]"),
    intro: overlay.querySelector("[data-realtime-intro]"),
    introTitle: overlay.querySelector("[data-realtime-intro-title]"),
    introDish: overlay.querySelector("[data-realtime-intro-dish]"),
    introFlow: overlay.querySelector("[data-realtime-intro-flow]"),
    introMeaning: overlay.querySelector("[data-realtime-intro-meaning]"),
    startBusiness: overlay.querySelector("[data-realtime-start]"),
    hud: overlay.querySelector(".realtime-hud"),
    customerSection: overlay.querySelector(".realtime-customer"),
    ingredientsSection: overlay.querySelector(".realtime-ingredients"),
    served: overlay.querySelector("[data-realtime-served]"),
    walked: overlay.querySelector("[data-realtime-walked]"),
    patience: overlay.querySelector("[data-realtime-patience]"),
    customerName: overlay.querySelector("[data-realtime-customer-name]"),
    dishName: overlay.querySelector("[data-realtime-dish-name]"),
    stageDish: overlay.querySelector("[data-realtime-stage-dish]"),
    required: overlay.querySelector("[data-realtime-required]"),
    patienceFill: overlay.querySelector("[data-realtime-patience-fill]"),
    kitchen: overlay.querySelector("[data-realtime-kitchen]"),
    mascot: overlay.querySelector("[data-realtime-mascot]"),
    targets: overlay.querySelector("[data-realtime-targets]"),
    ingredients: overlay.querySelector("[data-realtime-ingredients]"),
    stepBar: overlay.querySelector("[data-realtime-step-bar]"),
    recipeTrack: overlay.querySelector("[data-realtime-recipe-track]"),
    stepKicker: overlay.querySelector("[data-realtime-step-kicker]"),
    stepFeedback: overlay.querySelector("[data-realtime-step-feedback]"),
    progress: overlay.querySelector("[data-realtime-progress]"),
    progressZone: overlay.querySelector("[data-realtime-progress-zone]"),
    progressFill: overlay.querySelector("[data-realtime-progress-fill]"),
    controls: overlay.querySelector("[data-realtime-controls]"),
    toast: overlay.querySelector("[data-realtime-toast]"),
    result: overlay.querySelector("[data-realtime-result]"),
    resultTitle: overlay.querySelector("[data-realtime-result-title]"),
    finalServed: overlay.querySelector("[data-realtime-final-served]"),
    finalWalked: overlay.querySelector("[data-realtime-final-walked]"),
    finalCoins: overlay.querySelector("[data-realtime-final-coins]"),
    finalState: overlay.querySelector("[data-realtime-final-state]"),
    finalComment: overlay.querySelector("[data-realtime-final-comment]"),
    nextLevel: overlay.querySelector("[data-realtime-next]"),
    restart: overlay.querySelector("[data-realtime-restart]"),
    homeButtons: overlay.querySelectorAll("[data-realtime-home], [data-realtime-result-home]"),
  };

  const game = new RealtimeKitchenGame();
  let active = false;
  let rafId = 0;
  let lastTick = 0;
  let stageRenderKey = "";
  let toastTimer = 0;
  let holdStartedAt = 0;
  let holdRaf = 0;
  let mashTaps = 0;
  let mashTimer = 0;
  let swipeState = null;
  let dragState = null;

  function stopHoldLoop() {
    window.cancelAnimationFrame(holdRaf);
    holdRaf = 0;
  }

  function cleanupRuntimeInput() {
    window.clearTimeout(mashTimer);
    stopHoldLoop();
    swipeState = null;
    if (dragState?.ghost) dragState.ghost.remove();
    dragState = null;
  }

  function showToast(message) {
    if (!message) return;
    refs.toast.textContent = message;
    refs.toast.hidden = false;
    refs.toast.classList.remove("is-visible");
    refs.toast.offsetHeight;
    refs.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      refs.toast.classList.remove("is-visible");
      refs.toast.hidden = true;
    }, 900);
  }

  function showCoinBurst(amount) {
    if (!amount) return;
    refs.mascot.classList.remove("is-celebrating");
    refs.mascot.offsetHeight;
    refs.mascot.classList.add("is-celebrating");
    const burst = document.createElement("div");
    burst.className = "realtime-coin-burst";
    burst.textContent = `+${amount} ${COPY.coin}`;
    overlay.append(burst);
    window.setTimeout(() => burst.remove(), 900);
  }

  function tick(now) {
    if (!active) return;
    if (!lastTick) lastTick = now;
    const delta = now - lastTick;
    lastTick = now;
    game.update(delta);
    render();
    if (game.getSnapshot().state === "playing") {
      rafId = window.requestAnimationFrame(tick);
    }
  }

  function startBusiness() {
    ensureAudio?.();
    game.startBusiness();
    lastTick = 0;
    stageRenderKey = "";
    cleanupRuntimeInput();
    render();
    showToast(COPY.customerComing);
    window.cancelAnimationFrame(rafId);
    rafId = window.requestAnimationFrame(tick);
  }

  function goNextLevel() {
    game.startNextLevel();
    lastTick = 0;
    stageRenderKey = "";
    cleanupRuntimeInput();
    render();
  }

  function open() {
    ensureAudio?.();
    game.reset({ levelIndex: 0 });
    active = true;
    lastTick = 0;
    stageRenderKey = "";
    cleanupRuntimeInput();
    overlay.hidden = false;
    overlay.classList.add("is-visible");
    homeOverlay?.classList.remove("is-visible");
    render();
  }

  function stop({ showHome = true } = {}) {
    active = false;
    window.cancelAnimationFrame(rafId);
    cleanupRuntimeInput();
    overlay.classList.remove("is-visible");
    overlay.hidden = true;
    if (showHome) homeOverlay?.classList.add("is-visible");
  }

  function renderStaticTargets() {
    refs.targets.replaceChildren();
    ["board", "pan", "plate"].forEach((targetId) => {
      const target = byId(REALTIME_TARGETS, targetId);
      if (!target) return;
      const node = document.createElement("div");
      node.className = `realtime-target-zone is-${target.id}`;
      node.dataset.targetId = target.id;
      node.innerHTML = `
        <div class="realtime-target-base"><span>${target.icon}</span><strong>${target.label}</strong></div>
        <div class="realtime-target-contents" data-target-contents></div>
        <div class="realtime-target-effect" aria-hidden="true"></div>
      `;
      refs.targets.append(node);
    });
  }

  function renderIngredients() {
    refs.ingredients.replaceChildren();
    REALTIME_INGREDIENTS.forEach((ingredient) => {
      const button = document.createElement("button");
      button.className = "realtime-ingredient";
      button.type = "button";
      button.dataset.ingredientId = ingredient.id;
      button.innerHTML = `<span>${ingredient.icon}</span><strong>${ingredient.label}</strong>`;
      button.addEventListener("pointerdown", (event) => startIngredientDrag(event, ingredient));
      refs.ingredients.append(button);
    });
  }

  function renderIngredientHighlights(snapshot) {
    const step = snapshot.currentStep;
    refs.ingredients.querySelectorAll("[data-ingredient-id]").forEach((button) => {
      const isNeeded = step?.type === "ingredient" && button.dataset.ingredientId === step.ingredientId;
      button.classList.toggle("is-needed", isNeeded);
      button.classList.toggle("is-muted", snapshot.state !== "playing" || step?.type !== "ingredient");
    });
  }

  function startIngredientDrag(event, ingredient) {
    const snapshot = game.getSnapshot();
    if (snapshot.currentStep?.type !== "ingredient") {
      showToast(COPY.actionFirst);
      return;
    }
    event.preventDefault();
    const ghost = document.createElement("div");
    ghost.className = "realtime-drag-ghost";
    ghost.textContent = ingredient.icon;
    document.body.append(ghost);
    dragState = { ingredient, ghost };
    moveIngredientGhost(event);
    window.addEventListener("pointermove", moveIngredientGhost);
    window.addEventListener("pointerup", finishIngredientDrag, { once: true });
    window.addEventListener("pointercancel", cancelIngredientDrag, { once: true });
  }

  function moveIngredientGhost(event) {
    if (!dragState?.ghost) return;
    dragState.ghost.style.left = `${event.clientX}px`;
    dragState.ghost.style.top = `${event.clientY}px`;
  }

  function finishIngredientDrag(event) {
    window.removeEventListener("pointermove", moveIngredientGhost);
    const ingredient = dragState?.ingredient;
    dragState?.ghost?.remove();
    dragState = null;
    const targetNode = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-target-id]");
    if (!ingredient || !targetNode) {
      showToast(COPY.dragToTarget);
      return;
    }
    const before = game.getSnapshot();
    const snapshot = game.dropIngredient(ingredient.id, targetNode.dataset.targetId);
    const isCorrect = snapshot?.currentStepIndex !== before.currentStepIndex;
    flashTarget(targetNode.dataset.targetId, isCorrect);
    showToast(snapshot?.lastFeedback);
    stageRenderKey = "";
    render();
  }

  function cancelIngredientDrag() {
    window.removeEventListener("pointermove", moveIngredientGhost);
    dragState?.ghost?.remove();
    dragState = null;
  }

  function flashTarget(targetId, correct) {
    const node = refs.targets.querySelector(`[data-target-id="${targetId}"]`);
    if (!node) return;
    node.classList.remove("is-hit", "is-wrong");
    node.offsetHeight;
    node.classList.add(correct ? "is-hit" : "is-wrong");
  }

  function getStepKey(snapshot) {
    const step = snapshot.currentStep;
    if (!step) return snapshot.state;
    return `${snapshot.currentOrder?.instanceId}:${snapshot.currentStepIndex}:${step.type}:${step.actionType || step.ingredientId}:${step.label}`;
  }

  function renderHud(snapshot) {
    refs.level.textContent = snapshot.level?.levelName || REALTIME_LEVEL_NAME;
    refs.target.textContent = `\u670d\u52a1 ${snapshot.serviceTarget} \u4f4d`;
    refs.served.textContent = `${snapshot.servedCustomers}/${snapshot.serviceTarget}`;
    refs.walked.textContent = `${snapshot.walkedOutCustomers}/${snapshot.walkoutLimit}`;
    const order = snapshot.currentOrder;
    refs.patience.textContent = order ? `${seconds(order.remainingPatienceMs)}s` : "--";
  }

  function renderIntro(snapshot) {
    const level = snapshot.level || REALTIME_DEFAULT_LEVEL;
    const firstRecipe = getRealtimeNewRecipe(level);
    refs.introTitle.textContent = level.levelTitle || REALTIME_DEFAULT_LEVEL.levelTitle;
    refs.introDish.textContent = firstRecipe?.dishName || "";
    refs.introMeaning.textContent = (firstRecipe?.steps || []).map((step) => step.label).join(" \u2192 ");
    refs.introFlow.replaceChildren();
    getRealtimeRecipeFlow(firstRecipe).forEach((icon, index, icons) => {
      const chip = document.createElement("span");
      chip.textContent = icon;
      refs.introFlow.append(chip);
      if (index < icons.length - 1) {
        const arrow = document.createElement("i");
        arrow.textContent = "\u2192";
        refs.introFlow.append(arrow);
      }
    });
  }

  function renderCustomer(snapshot) {
    const order = snapshot.currentOrder;
    if (!order) {
      refs.customerName.textContent = COPY.todayBusiness;
      refs.dishName.textContent = COPY.waitResult;
      refs.stageDish.textContent = COPY.waitResult;
      refs.required.replaceChildren();
      refs.patienceFill.style.width = "0%";
      return;
    }
    refs.customerName.textContent = order.customerName;
    refs.dishName.textContent = order.dishName;
    refs.stageDish.textContent = order.dishName;
    refs.patienceFill.style.width = percent(order.remainingPatienceMs, order.patienceMs);
    refs.required.replaceChildren();
    snapshot.requiredIngredientIds.forEach((ingredientId) => {
      const ingredient = byId(REALTIME_INGREDIENTS, ingredientId);
      if (!ingredient) return;
      const chip = document.createElement("span");
      chip.textContent = ingredient.icon;
      chip.title = ingredient.label;
      refs.required.append(chip);
    });
  }

  function renderTargetHighlights(snapshot) {
    const step = snapshot.currentStep;
    const placedTargets = snapshot.currentOrder?.placedTargets || {};
    const plateVisible = shouldShowRealtimePlate(step) || Boolean(placedTargets.plate?.length);
    refs.targets.querySelectorAll("[data-target-id]").forEach((node) => {
      const targetId = node.dataset.targetId;
      node.classList.toggle("is-needed", step?.type === "ingredient" && targetId === step.targetId);
      node.classList.toggle("is-plate-active", targetId === "plate" && plateVisible);
      node.classList.toggle("is-plate-muted", targetId === "plate" && !plateVisible);
      node.classList.toggle("is-heating", targetId === "pan" && step?.actionType === REALTIME_ACTION_TYPES.HOLD);
      node.classList.toggle("is-mashing", targetId === "pan" && step?.actionType === REALTIME_ACTION_TYPES.MASH);
      const contents = node.querySelector("[data-target-contents]");
      if (!contents) return;
      contents.replaceChildren();
      (placedTargets[targetId] || []).forEach((ingredientId) => {
        const ingredient = byId(REALTIME_INGREDIENTS, ingredientId);
        if (!ingredient) return;
        const item = document.createElement("span");
        item.textContent = ingredient.icon;
        item.title = ingredient.label;
        contents.append(item);
      });
    });
  }

  function renderStep(snapshot) {
    refs.kitchen.dataset.stepTone = getStepTone(snapshot.currentStep);
    refs.result.hidden = snapshot.state !== "ended";
    const isTeaching = snapshot.state === "teaching";
    refs.intro.hidden = !isTeaching;
    refs.customerSection.hidden = isTeaching;
    refs.ingredientsSection.hidden = isTeaching;
    refs.kitchen.hidden = isTeaching;
    refs.controls.hidden = isTeaching;
    if (isTeaching) {
      renderIntro(snapshot);
      refs.progress.hidden = true;
      refs.result.hidden = true;
      return;
    }
    if (snapshot.state === "ended") {
      const result = snapshot.result;
      refs.stepKicker.textContent = COPY.todayClosed;
      refs.recipeTrack.replaceChildren();
      refs.stepFeedback.textContent = snapshot.lastFeedback;
      refs.progress.hidden = true;
      refs.controls.innerHTML = `<p>${COPY.seeResult}</p>`;
      refs.resultTitle.textContent = result.passed ? COPY.passed : COPY.failed;
      refs.finalServed.textContent = result.servedCustomers;
      refs.finalWalked.textContent = result.walkedOutCustomers;
      refs.finalCoins.textContent = result.coins;
      refs.finalState.textContent = result.passed ? COPY.passed : COPY.failed;
      refs.finalComment.textContent = result.comment;
      refs.nextLevel.hidden = !(result.passed && snapshot.hasNextLevel);
      return;
    }

    const step = snapshot.currentStep;
    if (!step) {
      refs.stepKicker.textContent = COPY.waitCustomer;
      refs.recipeTrack.replaceChildren();
      refs.stepFeedback.textContent = snapshot.lastFeedback;
      refs.progress.hidden = true;
      refs.controls.innerHTML = `<p>${COPY.customerOnRoad}</p>`;
      return;
    }

    const target = byId(REALTIME_TARGETS, step.targetId);
    refs.stepKicker.textContent = step.type === "ingredient"
      ? COPY.shortIngredient
      : step.actionType === REALTIME_ACTION_TYPES.SWIPE ? COPY.shortServe : COPY.shortAction;
    refs.recipeTrack.replaceChildren();
    snapshot.recipeSteps.forEach((recipeStep) => {
      const chip = document.createElement("span");
      chip.className = `realtime-recipe-chip is-${recipeStep.status}`;
      chip.textContent = recipeStep.status === "done" ? "\u2713" : recipeStep.icon;
      chip.title = recipeStep.label;
      refs.recipeTrack.append(chip);
    });
    refs.stepFeedback.textContent = step.type === "ingredient"
      ? target?.label || ""
      : REALTIME_ACTION_LABELS[step.actionType] || "";

    const nextKey = getStepKey(snapshot);
    if (stageRenderKey !== nextKey) {
      stageRenderKey = nextKey;
      renderControls(step);
    }
  }

  function resetProgress() {
    refs.progress.hidden = true;
    refs.progressZone.hidden = true;
    refs.progressZone.style.left = "0%";
    refs.progressZone.style.width = "0%";
    refs.progressFill.style.width = "0%";
  }

  function finishAction(beforeSnapshot, action) {
    const after = game.getSnapshot();
    showToast(after.lastFeedback);
    if (after.servedCustomers > beforeSnapshot.servedCustomers) {
      showCoinBurst(after.coins - beforeSnapshot.coins);
    }
    if (after.currentStepIndex === beforeSnapshot.currentStepIndex && after.state === "playing") {
      stageRenderKey = "";
    } else if (action !== "hold-fail") {
      stageRenderKey = "";
    }
    render();
  }

  function renderControls(step) {
    cleanupRuntimeInput();
    resetProgress();
    if (step.type === "ingredient") {
      refs.controls.innerHTML = `<p>${COPY.dragCorrect}</p>`;
      return;
    }
    if (step.actionType === REALTIME_ACTION_TYPES.TAP) {
      refs.controls.innerHTML = `<button class="realtime-action-button is-attention" type="button" data-realtime-tap>${COPY.tapOnce}</button>`;
      refs.controls.querySelector("[data-realtime-tap]").addEventListener("click", () => {
        const before = game.getSnapshot();
        game.completeTap();
        finishAction(before);
      });
      return;
    }
    if (step.actionType === REALTIME_ACTION_TYPES.HOLD) {
      const windowData = getHoldWindow(step);
      refs.progress.hidden = false;
      refs.progressZone.hidden = false;
      refs.progressZone.style.left = percent(windowData.startMs, windowData.maxMs);
      refs.progressZone.style.width = percent(windowData.endMs - windowData.startMs, windowData.maxMs);
      refs.controls.innerHTML = `<button class="realtime-action-button is-attention" type="button" data-realtime-hold>${COPY.holdRelease}</button>`;
      const button = refs.controls.querySelector("[data-realtime-hold]");
      const updateHold = () => {
        const elapsed = performance.now() - holdStartedAt;
        refs.progressFill.style.width = percent(elapsed, windowData.maxMs);
        holdRaf = window.requestAnimationFrame(updateHold);
      };
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        holdStartedAt = performance.now();
        stopHoldLoop();
        updateHold();
      });
      button.addEventListener("pointerup", (event) => {
        event.preventDefault();
        const elapsed = performance.now() - holdStartedAt;
        stopHoldLoop();
        const before = game.getSnapshot();
        game.completeHold(elapsed);
        finishAction(before, "hold-fail");
      });
      button.addEventListener("pointercancel", stopHoldLoop);
      return;
    }
    if (step.actionType === REALTIME_ACTION_TYPES.MASH) {
      refs.progress.hidden = false;
      mashTaps = 0;
      refs.controls.innerHTML = `<button class="realtime-action-button is-mash is-attention" type="button" data-realtime-mash>${COPY.mash} 0/${step.targetTaps}</button>`;
      const button = refs.controls.querySelector("[data-realtime-mash]");
      const updateMashLabel = () => {
        button.textContent = `${COPY.mash} ${mashTaps}/${step.targetTaps}`;
        refs.progressFill.style.width = percent(mashTaps, step.targetTaps);
      };
      button.addEventListener("click", () => {
        mashTaps += 1;
        button.classList.remove("is-popped");
        button.offsetHeight;
        button.classList.add("is-popped");
        updateMashLabel();
        if (mashTaps >= step.targetTaps) {
          window.clearTimeout(mashTimer);
          const before = game.getSnapshot();
          game.completeMash(mashTaps);
          finishAction(before);
        }
      });
      mashTimer = window.setTimeout(() => {
        if (game.getSnapshot().currentStep?.actionType === REALTIME_ACTION_TYPES.MASH) {
          const before = game.getSnapshot();
          game.completeMash(mashTaps);
          finishAction(before);
        }
      }, step.durationMs);
      return;
    }
    if (step.actionType === REALTIME_ACTION_TYPES.SWIPE) {
      refs.controls.innerHTML = `
        <div class="realtime-swipe-control is-attention" data-realtime-swipe-control>
          <strong>${COPY.swipeTitle}</strong>
          <div class="realtime-swipe-track" data-realtime-swipe-track>
            <i data-realtime-swipe-fill></i>
            <button class="realtime-swipe-thumb" type="button" data-realtime-swipe-thumb>\u{1F37D}\uFE0F</button>
          </div>
          <small data-realtime-swipe-copy>${COPY.swipeIdle}</small>
        </div>
      `;
      const control = refs.controls.querySelector("[data-realtime-swipe-control]");
      const track = refs.controls.querySelector("[data-realtime-swipe-track]");
      const fill = refs.controls.querySelector("[data-realtime-swipe-fill]");
      const thumb = refs.controls.querySelector("[data-realtime-swipe-thumb]");
      const copy = refs.controls.querySelector("[data-realtime-swipe-copy]");

      const setSwipeVisual = (distance) => {
        const required = Math.max(80, track.clientWidth - thumb.offsetWidth);
        const state = getSwipeProgress(distance, required);
        const x = state.ratio * required;
        fill.style.width = `${state.percent}%`;
        thumb.style.transform = `translateX(${x}px)`;
        control.classList.toggle("is-ready", state.ready);
        copy.textContent = state.ready ? COPY.swipeReady : COPY.swipeIdle;
        return state;
      };

      const onMove = (event) => {
        if (!swipeState) return;
        event.preventDefault();
        swipeState.distance = Math.max(0, event.clientX - swipeState.startX);
        setSwipeVisual(swipeState.distance);
      };

      const finishSwipe = (event) => {
        if (!swipeState) return;
        event.preventDefault();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", finishSwipe);
        window.removeEventListener("pointercancel", cancelSwipe);
        const required = Math.max(80, track.clientWidth - thumb.offsetWidth);
        const state = getSwipeProgress(swipeState.distance, required);
        swipeState = null;
        const before = game.getSnapshot();
        game.completeSwipe(state.ready ? step.minDistancePx : 0);
        finishAction(before);
      };

      const cancelSwipe = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", finishSwipe);
        window.removeEventListener("pointercancel", cancelSwipe);
        swipeState = null;
        setSwipeVisual(0);
      };

      const startSwipe = (event) => {
        event.preventDefault();
        swipeState = { startX: event.clientX, distance: 0 };
        setSwipeVisual(0);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", finishSwipe);
        window.addEventListener("pointercancel", cancelSwipe);
      };

      thumb.addEventListener("pointerdown", startSwipe);
      track.addEventListener("pointerdown", startSwipe);
    }
  }

  function render() {
    const snapshot = game.getSnapshot();
    renderHud(snapshot);
    renderCustomer(snapshot);
    renderTargetHighlights(snapshot);
    renderIngredientHighlights(snapshot);
    renderStep(snapshot);
  }

  renderStaticTargets();
  renderIngredients();
  refs.startBusiness.addEventListener("click", startBusiness);
  refs.nextLevel.addEventListener("click", goNextLevel);
  refs.restart.addEventListener("click", open);
  refs.homeButtons.forEach((button) => button.addEventListener("click", () => stop({ showHome: true })));
  triggerButton?.addEventListener("click", open);

  return {
    isActive: () => active,
    stop,
  };
}
