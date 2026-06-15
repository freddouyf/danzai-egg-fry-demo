import {
  REALTIME_ACTION_LABELS,
  REALTIME_ACTION_TYPES,
  REALTIME_INGREDIENTS,
  REALTIME_LEVEL_NAME,
  REALTIME_TARGETS,
} from "./realtimeKitchenData.js";
import { getHoldWindow, RealtimeKitchenGame } from "./realtimeKitchenGame.js";

function seconds(ms) {
  return Math.max(0, Math.ceil(ms / 1000));
}

function percent(value, max) {
  return `${Math.max(0, Math.min(100, (Number(value) / Math.max(1, Number(max))) * 100))}%`;
}

function byId(items, id) {
  return items.find((item) => item.id === id) || null;
}

function createRealtimeOverlay() {
  const overlay = document.createElement("section");
  overlay.className = "overlay realtime-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="realtime-card">
      <header class="realtime-header">
        <div>
          <small>实时厨房测试版</small>
          <h2>顾客倒计时厨房</h2>
        </div>
        <button class="secondary-button" type="button" data-realtime-home>返回首页</button>
      </header>

      <section class="realtime-hud">
        <span>关卡 <strong data-realtime-level>第 1 关</strong></span>
        <span>目标 <strong>服务 3 位</strong></span>
        <span>已服务 <strong data-realtime-served>0</strong></span>
        <span>走掉 <strong data-realtime-walked>0</strong></span>
        <span>耐心 <strong data-realtime-patience>0s</strong></span>
      </section>

      <section class="realtime-customer">
        <div>
          <small data-realtime-customer-name>顾客</small>
          <h3 data-realtime-dish-name>等待订单</h3>
        </div>
        <div class="realtime-required" data-realtime-required></div>
        <div class="realtime-patience"><i data-realtime-patience-fill></i></div>
      </section>

      <section class="realtime-kitchen">
        <div class="realtime-mascot">🥚</div>
        <div class="realtime-targets" data-realtime-targets></div>
        <div class="realtime-step-card">
          <small data-realtime-step-kicker>当前步骤</small>
          <h3 data-realtime-step-title>准备接单</h3>
          <p data-realtime-step-feedback>拖食材到发光区域，或完成下方动作。</p>
        </div>
        <div class="realtime-action-progress" data-realtime-progress hidden>
          <span data-realtime-progress-zone hidden></span>
          <i data-realtime-progress-fill></i>
        </div>
      </section>

      <section class="realtime-ingredients">
        <h3>食材框</h3>
        <div class="realtime-ingredient-list" data-realtime-ingredients></div>
      </section>

      <section class="realtime-controls" data-realtime-controls>
        <p>先按订单放入正确食材。</p>
      </section>

      <div class="realtime-toast" data-realtime-toast hidden></div>

      <section class="realtime-result" data-realtime-result hidden>
        <h3 data-realtime-result-title>今日结算</h3>
        <dl>
          <div><dt>已服务客人</dt><dd data-realtime-final-served>0</dd></div>
          <div><dt>走掉客人</dt><dd data-realtime-final-walked>0</dd></div>
          <div><dt>总金币</dt><dd data-realtime-final-coins>0</dd></div>
          <div><dt>结果</dt><dd data-realtime-final-state>--</dd></div>
        </dl>
        <p data-realtime-final-comment></p>
        <div class="realtime-result-actions">
          <button class="primary-button" type="button" data-realtime-restart><span>再来一局</span></button>
          <button class="secondary-button" type="button" data-realtime-result-home>返回首页</button>
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
    served: overlay.querySelector("[data-realtime-served]"),
    walked: overlay.querySelector("[data-realtime-walked]"),
    patience: overlay.querySelector("[data-realtime-patience]"),
    customerName: overlay.querySelector("[data-realtime-customer-name]"),
    dishName: overlay.querySelector("[data-realtime-dish-name]"),
    required: overlay.querySelector("[data-realtime-required]"),
    patienceFill: overlay.querySelector("[data-realtime-patience-fill]"),
    targets: overlay.querySelector("[data-realtime-targets]"),
    ingredients: overlay.querySelector("[data-realtime-ingredients]"),
    stepKicker: overlay.querySelector("[data-realtime-step-kicker]"),
    stepTitle: overlay.querySelector("[data-realtime-step-title]"),
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
  let swipeStart = null;
  let dragState = null;

  function stopHoldLoop() {
    window.cancelAnimationFrame(holdRaf);
    holdRaf = 0;
  }

  function cleanupRuntimeInput() {
    window.clearTimeout(mashTimer);
    stopHoldLoop();
    swipeStart = null;
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

  function open() {
    ensureAudio?.();
    game.reset();
    active = true;
    lastTick = 0;
    stageRenderKey = "";
    cleanupRuntimeInput();
    overlay.hidden = false;
    overlay.classList.add("is-visible");
    homeOverlay?.classList.remove("is-visible");
    render();
    showToast("顾客来了！");
    rafId = window.requestAnimationFrame(tick);
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
    REALTIME_TARGETS.forEach((target) => {
      const node = document.createElement("div");
      node.className = "realtime-target-zone";
      node.dataset.targetId = target.id;
      node.innerHTML = `<span>${target.icon}</span><strong>${target.label}</strong>`;
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

  function startIngredientDrag(event, ingredient) {
    const snapshot = game.getSnapshot();
    if (snapshot.currentStep?.type !== "ingredient") {
      showToast("现在先完成动作！");
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
      showToast("拖到锅、案板或盘子里。");
      return;
    }
    const before = game.getSnapshot();
    const snapshot = game.dropIngredient(ingredient.id, targetNode.dataset.targetId);
    flashTarget(targetNode.dataset.targetId, snapshot?.currentStepIndex !== before.currentStepIndex);
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
    refs.level.textContent = REALTIME_LEVEL_NAME;
    refs.served.textContent = `${snapshot.servedCustomers}/${snapshot.serviceTarget}`;
    refs.walked.textContent = `${snapshot.walkedOutCustomers}/${snapshot.walkoutLimit}`;
    const order = snapshot.currentOrder;
    refs.patience.textContent = order ? `${seconds(order.remainingPatienceMs)}s` : "--";
  }

  function renderCustomer(snapshot) {
    const order = snapshot.currentOrder;
    if (!order) {
      refs.customerName.textContent = "今日营业";
      refs.dishName.textContent = "等待结算";
      refs.required.replaceChildren();
      refs.patienceFill.style.width = "0%";
      return;
    }
    refs.customerName.textContent = order.customerName;
    refs.dishName.textContent = order.dishName;
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
    refs.targets.querySelectorAll("[data-target-id]").forEach((node) => {
      node.classList.toggle("is-needed", step?.type === "ingredient" && node.dataset.targetId === step.targetId);
    });
  }

  function renderStep(snapshot) {
    refs.result.hidden = snapshot.state !== "ended";
    if (snapshot.state === "ended") {
      const result = snapshot.result;
      refs.stepKicker.textContent = "今日打烊";
      refs.stepTitle.textContent = result.passed ? "通关成功" : "营业失败";
      refs.stepFeedback.textContent = snapshot.lastFeedback;
      refs.progress.hidden = true;
      refs.controls.innerHTML = "<p>查看结算，或再来一局。</p>";
      refs.resultTitle.textContent = result.passed ? "通关成功" : "挑战失败";
      refs.finalServed.textContent = result.servedCustomers;
      refs.finalWalked.textContent = result.walkedOutCustomers;
      refs.finalCoins.textContent = result.coins;
      refs.finalState.textContent = result.passed ? "通关" : "失败";
      refs.finalComment.textContent = result.comment;
      return;
    }

    const step = snapshot.currentStep;
    if (!step) {
      refs.stepKicker.textContent = "等待顾客";
      refs.stepTitle.textContent = "准备营业";
      refs.stepFeedback.textContent = snapshot.lastFeedback;
      refs.progress.hidden = true;
      refs.controls.innerHTML = "<p>顾客正在路上。</p>";
      return;
    }

    refs.stepKicker.textContent = step.type === "ingredient" ? "拖食材" : "做菜动作";
    refs.stepTitle.textContent = step.type === "ingredient"
      ? `${byId(REALTIME_INGREDIENTS, step.ingredientId)?.label || "食材"} → ${byId(REALTIME_TARGETS, step.targetId)?.label || "目标"}`
      : `${REALTIME_ACTION_LABELS[step.actionType]} · ${step.label}`;
    refs.stepFeedback.textContent = snapshot.lastFeedback;

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

  function renderControls(step) {
    cleanupRuntimeInput();
    resetProgress();
    if (step.type === "ingredient") {
      refs.controls.innerHTML = "<p>拖动正确食材到发光区域。</p>";
      return;
    }
    if (step.actionType === REALTIME_ACTION_TYPES.TAP) {
      refs.controls.innerHTML = `<button class="realtime-action-button" type="button" data-realtime-tap>点击一次</button>`;
      refs.controls.querySelector("[data-realtime-tap]").addEventListener("click", () => {
        game.completeTap();
        showToast(game.getSnapshot().lastFeedback);
        stageRenderKey = "";
        render();
      });
      return;
    }
    if (step.actionType === REALTIME_ACTION_TYPES.HOLD) {
      const windowData = getHoldWindow(step);
      refs.progress.hidden = false;
      refs.progressZone.hidden = false;
      refs.progressZone.style.left = percent(windowData.startMs, windowData.maxMs);
      refs.progressZone.style.width = percent(windowData.endMs - windowData.startMs, windowData.maxMs);
      refs.controls.innerHTML = `<button class="realtime-action-button" type="button" data-realtime-hold>按住，到绿色区松手</button>`;
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
        const before = game.getSnapshot().currentStepIndex;
        game.completeHold(elapsed);
        const after = game.getSnapshot();
        showToast(after.lastFeedback);
        if (after.currentStepIndex === before) stageRenderKey = "";
        render();
      });
      button.addEventListener("pointercancel", stopHoldLoop);
      return;
    }
    if (step.actionType === REALTIME_ACTION_TYPES.MASH) {
      refs.progress.hidden = false;
      mashTaps = 0;
      refs.controls.innerHTML = `<button class="realtime-action-button is-mash" type="button" data-realtime-mash>狂点 0/${step.targetTaps}</button>`;
      const button = refs.controls.querySelector("[data-realtime-mash]");
      const updateMashLabel = () => {
        button.textContent = `狂点 ${mashTaps}/${step.targetTaps}`;
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
          game.completeMash(mashTaps);
          showToast(game.getSnapshot().lastFeedback);
          stageRenderKey = "";
          render();
        }
      });
      mashTimer = window.setTimeout(() => {
        if (game.getSnapshot().currentStep?.actionType === REALTIME_ACTION_TYPES.MASH) {
          game.completeMash(mashTaps);
          showToast(game.getSnapshot().lastFeedback);
          stageRenderKey = "";
          render();
        }
      }, step.durationMs);
      return;
    }
    if (step.actionType === REALTIME_ACTION_TYPES.SWIPE) {
      refs.progress.hidden = false;
      refs.controls.innerHTML = `<button class="realtime-action-button is-swipe" type="button" data-realtime-swipe>按住拖动</button>`;
      const button = refs.controls.querySelector("[data-realtime-swipe]");
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        swipeStart = { x: event.clientX, y: event.clientY };
        refs.progressFill.style.width = "0%";
      });
      button.addEventListener("pointermove", (event) => {
        if (!swipeStart) return;
        const distance = Math.hypot(event.clientX - swipeStart.x, event.clientY - swipeStart.y);
        refs.progressFill.style.width = percent(distance, step.minDistancePx);
      });
      button.addEventListener("pointerup", (event) => {
        if (!swipeStart) return;
        const distance = Math.hypot(event.clientX - swipeStart.x, event.clientY - swipeStart.y);
        swipeStart = null;
        const before = game.getSnapshot().currentStepIndex;
        game.completeSwipe(distance);
        const after = game.getSnapshot();
        showToast(after.lastFeedback);
        if (after.currentStepIndex === before) stageRenderKey = "";
        render();
      });
      button.addEventListener("pointercancel", () => {
        swipeStart = null;
      });
    }
  }

  function render() {
    const snapshot = game.getSnapshot();
    renderHud(snapshot);
    renderCustomer(snapshot);
    renderTargetHighlights(snapshot);
    renderStep(snapshot);
  }

  renderStaticTargets();
  renderIngredients();
  refs.restart.addEventListener("click", open);
  refs.homeButtons.forEach((button) => button.addEventListener("click", () => stop({ showHome: true })));
  triggerButton?.addEventListener("click", open);

  return {
    isActive: () => active,
    stop,
  };
}
