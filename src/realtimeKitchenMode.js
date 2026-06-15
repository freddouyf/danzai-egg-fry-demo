import {
  REALTIME_ACTION_LABELS,
  REALTIME_ACTION_TYPES,
} from "./realtimeKitchenData.js";
import { getHoldWindow, RealtimeKitchenGame } from "./realtimeKitchenGame.js";

function seconds(ms) {
  return Math.max(0, Math.ceil(ms / 1000));
}

function percent(value, max) {
  return `${Math.max(0, Math.min(100, (Number(value) / Math.max(1, Number(max))) * 100))}%`;
}

function createRealtimeOverlay() {
  const overlay = document.createElement("section");
  overlay.className = "overlay realtime-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="realtime-card">
      <header class="realtime-header">
        <div>
          <small>旦仔节奏厨房</small>
          <h2>实时厨房</h2>
        </div>
        <button class="secondary-button" type="button" data-realtime-home>返回首页</button>
      </header>

      <section class="realtime-hud">
        <span>时间 <strong data-realtime-time>60s</strong></span>
        <span>金币 <strong data-realtime-coins>0</strong></span>
        <span>混乱 <strong data-realtime-chaos>0</strong></span>
        <span>完成 <strong data-realtime-done>0</strong></span>
        <span>失败 <strong data-realtime-failed>0</strong></span>
      </section>

      <section class="realtime-orders">
        <h3>顾客订单</h3>
        <div class="realtime-order-list" data-realtime-orders></div>
      </section>

      <section class="realtime-stage">
        <div class="realtime-mascot">🍳</div>
        <div>
          <small data-realtime-stage-kicker>选择一个订单</small>
          <h3 data-realtime-stage-title>顾客正在等餐</h3>
          <p data-realtime-stage-feedback>点击订单开始制作。</p>
        </div>
        <div class="realtime-action-progress" data-realtime-progress hidden>
          <i data-realtime-progress-fill></i>
        </div>
      </section>

      <section class="realtime-controls" data-realtime-controls>
        <p>先选择一个订单。</p>
      </section>

      <section class="realtime-result" data-realtime-result hidden>
        <h3>今日厨房结算</h3>
        <dl>
          <div><dt>金币</dt><dd data-realtime-final-coins>0</dd></div>
          <div><dt>完成订单</dt><dd data-realtime-final-done>0</dd></div>
          <div><dt>失败订单</dt><dd data-realtime-final-failed>0</dd></div>
          <div><dt>混乱</dt><dd data-realtime-final-chaos>0</dd></div>
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
    time: overlay.querySelector("[data-realtime-time]"),
    coins: overlay.querySelector("[data-realtime-coins]"),
    chaos: overlay.querySelector("[data-realtime-chaos]"),
    done: overlay.querySelector("[data-realtime-done]"),
    failed: overlay.querySelector("[data-realtime-failed]"),
    orders: overlay.querySelector("[data-realtime-orders]"),
    stageKicker: overlay.querySelector("[data-realtime-stage-kicker]"),
    stageTitle: overlay.querySelector("[data-realtime-stage-title]"),
    stageFeedback: overlay.querySelector("[data-realtime-stage-feedback]"),
    progress: overlay.querySelector("[data-realtime-progress]"),
    progressFill: overlay.querySelector("[data-realtime-progress-fill]"),
    controls: overlay.querySelector("[data-realtime-controls]"),
    result: overlay.querySelector("[data-realtime-result]"),
    finalCoins: overlay.querySelector("[data-realtime-final-coins]"),
    finalDone: overlay.querySelector("[data-realtime-final-done]"),
    finalFailed: overlay.querySelector("[data-realtime-final-failed]"),
    finalChaos: overlay.querySelector("[data-realtime-final-chaos]"),
    finalComment: overlay.querySelector("[data-realtime-final-comment]"),
    restart: overlay.querySelector("[data-realtime-restart]"),
    homeButtons: overlay.querySelectorAll("[data-realtime-home], [data-realtime-result-home]"),
  };

  const game = new RealtimeKitchenGame();
  let active = false;
  let rafId = 0;
  let lastTick = 0;
  let holdStartedAt = 0;
  let holdRaf = 0;
  let mashTaps = 0;
  let mashTimer = 0;
  let swipeStart = null;
  let orderRenderKey = "";
  let stageRenderKey = "";

  function stopHoldLoop() {
    window.cancelAnimationFrame(holdRaf);
    holdRaf = 0;
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
    orderRenderKey = "";
    stageRenderKey = "";
    window.clearTimeout(mashTimer);
    stopHoldLoop();
    swipeStart = null;
    overlay.hidden = false;
    overlay.classList.add("is-visible");
    homeOverlay?.classList.remove("is-visible");
    render();
    rafId = window.requestAnimationFrame(tick);
  }

  function stop({ showHome = true } = {}) {
    active = false;
    window.cancelAnimationFrame(rafId);
    window.clearTimeout(mashTimer);
    stopHoldLoop();
    swipeStart = null;
    overlay.classList.remove("is-visible");
    overlay.hidden = true;
    if (showHome) homeOverlay?.classList.add("is-visible");
  }

  function renderOrders(snapshot) {
    const nextKey = snapshot.orders
      .map((order) => `${order.instanceId}:${order.instanceId === snapshot.activeOrder?.instanceId ? "active" : "idle"}`)
      .join("|");
    if (orderRenderKey === nextKey) {
      snapshot.orders.forEach((order) => {
        const card = [...refs.orders.querySelectorAll(".realtime-order-card")]
          .find((node) => node.dataset.orderId === order.instanceId);
        if (!card) return;
        card.classList.toggle("is-active", order.instanceId === snapshot.activeOrder?.instanceId);
        const patience = card.querySelector(".realtime-patience i");
        if (patience) patience.style.width = percent(order.remainingPatienceMs, order.patienceMs);
      });
      return;
    }
    orderRenderKey = nextKey;
    refs.orders.replaceChildren();
    snapshot.orders.forEach((order) => {
      const card = document.createElement("button");
      card.type = "button";
      card.dataset.orderId = order.instanceId;
      card.className = order.instanceId === snapshot.activeOrder?.instanceId ? "realtime-order-card is-active" : "realtime-order-card";
      card.innerHTML = `
        <span>${order.customerName}</span>
        <strong>${order.dishName}</strong>
        <small>+${order.rewardCoins} 金币 · ${order.actions.length} 步</small>
        <div class="realtime-patience"><i style="width:${percent(order.remainingPatienceMs, order.patienceMs)}"></i></div>
        <b>${order.instanceId === snapshot.activeOrder?.instanceId ? "制作中" : "开始制作"}</b>
      `;
      card.addEventListener("click", () => {
        game.selectOrder(order.instanceId);
        render();
      });
      refs.orders.append(card);
    });
  }

  function renderStage(snapshot) {
    const nextKey = snapshot.state === "ended"
      ? "ended"
      : snapshot.activeOrder && snapshot.activeAction
        ? `${snapshot.activeOrder.instanceId}:${snapshot.activeActionIndex}:${snapshot.activeAction.type}:${snapshot.activeAction.label}`
        : "idle";
    refs.result.hidden = snapshot.state !== "ended";
    if (snapshot.state === "ended") {
      const result = snapshot.result;
      refs.stageKicker.textContent = "营业结束";
      refs.stageTitle.textContent = "今日厨房结算";
      refs.stageFeedback.textContent = snapshot.lastFeedback;
      if (stageRenderKey !== nextKey) refs.controls.innerHTML = "<p>本局已经结束。</p>";
      stageRenderKey = nextKey;
      refs.progress.hidden = true;
      refs.finalCoins.textContent = result.coins;
      refs.finalDone.textContent = result.completedOrders;
      refs.finalFailed.textContent = result.failedOrders;
      refs.finalChaos.textContent = result.chaos;
      refs.finalComment.textContent = result.comment;
      return;
    }

    const order = snapshot.activeOrder;
    const action = snapshot.activeAction;
    if (!order || !action) {
      refs.stageKicker.textContent = "等待接单";
      refs.stageTitle.textContent = "选择一个顾客订单";
      refs.stageFeedback.textContent = snapshot.lastFeedback || "场上最多同时有 2 个顾客。";
      if (stageRenderKey !== nextKey) refs.controls.innerHTML = "<p>点击上方订单卡开始制作。</p>";
      stageRenderKey = nextKey;
      refs.progress.hidden = true;
      return;
    }

    refs.stageKicker.textContent = `当前菜品：${order.dishName}`;
    refs.stageTitle.textContent = `${REALTIME_ACTION_LABELS[action.type]} · ${action.label}`;
    refs.stageFeedback.textContent = snapshot.lastFeedback || "按下方控件完成动作。";
    if (stageRenderKey !== nextKey) {
      stageRenderKey = nextKey;
      renderControls(action);
    }
  }

  function renderControls(action) {
    refs.progress.hidden = true;
    refs.progressFill.style.width = "0%";
    if (action.type === REALTIME_ACTION_TYPES.TAP) {
      refs.controls.innerHTML = `<button class="realtime-action-button" type="button" data-realtime-tap>点击完成</button>`;
      refs.controls.querySelector("[data-realtime-tap]").addEventListener("click", () => {
        game.completeTap();
        render();
      });
      return;
    }
    if (action.type === REALTIME_ACTION_TYPES.HOLD) {
      const windowData = getHoldWindow(action);
      refs.progress.hidden = false;
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
        game.completeHold(elapsed);
        render();
      });
      button.addEventListener("pointercancel", stopHoldLoop);
      return;
    }
    if (action.type === REALTIME_ACTION_TYPES.MASH) {
      refs.progress.hidden = false;
      mashTaps = 0;
      refs.controls.innerHTML = `<button class="realtime-action-button is-mash" type="button" data-realtime-mash>狂点 0/${action.targetTaps}</button>`;
      const button = refs.controls.querySelector("[data-realtime-mash]");
      const updateMashLabel = () => {
        button.textContent = `狂点 ${mashTaps}/${action.targetTaps}`;
        refs.progressFill.style.width = percent(mashTaps, action.targetTaps);
      };
      button.addEventListener("click", () => {
        mashTaps += 1;
        updateMashLabel();
        if (mashTaps >= action.targetTaps) {
          window.clearTimeout(mashTimer);
          game.completeMash(mashTaps);
          render();
        }
      });
      window.clearTimeout(mashTimer);
      mashTimer = window.setTimeout(() => {
        if (game.getSnapshot().activeAction?.type === REALTIME_ACTION_TYPES.MASH) {
          game.completeMash(mashTaps);
          render();
        }
      }, action.durationMs);
      return;
    }
    if (action.type === REALTIME_ACTION_TYPES.SWIPE) {
      refs.progress.hidden = false;
      refs.controls.innerHTML = `<button class="realtime-action-button is-swipe" type="button" data-realtime-swipe>按住拖动出餐</button>`;
      const button = refs.controls.querySelector("[data-realtime-swipe]");
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        swipeStart = { x: event.clientX, y: event.clientY };
        refs.progressFill.style.width = "0%";
      });
      button.addEventListener("pointermove", (event) => {
        if (!swipeStart) return;
        const distance = Math.hypot(event.clientX - swipeStart.x, event.clientY - swipeStart.y);
        refs.progressFill.style.width = percent(distance, action.minDistancePx);
      });
      button.addEventListener("pointerup", (event) => {
        if (!swipeStart) return;
        const distance = Math.hypot(event.clientX - swipeStart.x, event.clientY - swipeStart.y);
        swipeStart = null;
        game.completeSwipe(distance);
        render();
      });
      button.addEventListener("pointercancel", () => {
        swipeStart = null;
      });
    }
  }

  function render() {
    const snapshot = game.getSnapshot();
    refs.time.textContent = `${seconds(snapshot.remainingMs)}s`;
    refs.coins.textContent = snapshot.coins;
    refs.chaos.textContent = snapshot.chaos;
    refs.done.textContent = snapshot.completedOrders;
    refs.failed.textContent = snapshot.failedOrders;
    renderOrders(snapshot);
    renderStage(snapshot);
  }

  refs.restart.addEventListener("click", open);
  refs.homeButtons.forEach((button) => button.addEventListener("click", () => stop({ showHome: true })));
  triggerButton?.addEventListener("click", open);

  return {
    isActive: () => active,
    stop,
  };
}
