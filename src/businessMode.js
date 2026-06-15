import { BUSINESS_ACTION_LABELS, BUSINESS_COOKING_APPROACHES } from "./businessData.js";
import { TodayBusinessGame } from "./businessGame.js";

function tagText(tags = []) {
  return tags.map((tag) => `#${tag}`).join(" ");
}

function actionFlow(actions = []) {
  return actions.map((action) => BUSINESS_ACTION_LABELS[action] || action.toUpperCase()).join(" → ");
}

function formatSigned(value) {
  const numeric = Number(value) || 0;
  return numeric > 0 ? `+${numeric}` : `${numeric}`;
}

function createBusinessOverlay() {
  const overlay = document.createElement("section");
  overlay.className = "overlay business-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="business-card">
      <header class="business-header">
        <div>
          <small>旦仔节奏厨房</small>
          <h2>今日营业</h2>
        </div>
        <button class="secondary-button business-home" type="button" data-business-home>返回首页</button>
      </header>

      <section class="business-stats" aria-label="今日营业状态">
        <span>波次 <strong data-business-wave>1/3</strong></span>
        <span>金币 <strong data-business-coins>0</strong></span>
        <span>满意 <strong data-business-satisfaction>0</strong></span>
        <span>混乱 <strong data-business-chaos>0</strong></span>
      </section>

      <section class="business-build">
        <strong>当前构筑</strong>
        <div data-business-upgrades>暂无厨具</div>
      </section>

      <section class="business-panel" data-business-orders>
        <h3>选择这一波订单</h3>
        <p>先看标签和预估收益，再决定这局往哪条经营路线走。</p>
        <div class="business-order-list" data-business-order-list></div>
      </section>

      <section class="business-panel business-cooking" data-business-cooking hidden>
        <h3 data-business-cooking-title>开始做菜</h3>
        <p data-business-cooking-meta>动作流程</p>
        <div class="business-action-track" data-business-action-track></div>
        <p class="business-pending" data-business-pending>本单修正：正常</p>
        <div class="business-cooking-actions">
          <button class="business-approach-button is-steady" type="button" data-business-approach="steady">
            <strong>稳稳做</strong>
            <small>金币 -10% · 混乱 -1</small>
          </button>
          <button class="business-approach-button is-normal" type="button" data-business-approach="normal">
            <strong>正常做</strong>
            <small>正常收益</small>
          </button>
          <button class="business-approach-button is-quick" type="button" data-business-approach="quick">
            <strong>快手做</strong>
            <small>金币 +20% · 混乱 +1</small>
          </button>
        </div>
      </section>

      <section class="business-panel" data-business-upgrade-panel hidden>
        <h3>选择厨具强化</h3>
        <p data-business-last-reward>上一单收益</p>
        <div class="business-upgrade-list" data-business-upgrade-list></div>
      </section>

      <section class="business-panel business-result" data-business-result hidden>
        <h3>今日打烊</h3>
        <dl>
          <div><dt>完成订单</dt><dd data-business-final-orders>0</dd></div>
          <div><dt>总金币</dt><dd data-business-final-coins>0</dd></div>
          <div><dt>满意度</dt><dd data-business-final-satisfaction>0</dd></div>
          <div><dt>混乱值</dt><dd data-business-final-chaos>0</dd></div>
        </dl>
        <div class="business-final-build" data-business-final-build></div>
        <p data-business-final-comment></p>
        <div class="business-result-actions">
          <button class="primary-button" type="button" data-business-restart><span>再营业一次</span></button>
          <button class="secondary-button" type="button" data-business-result-home>返回首页</button>
        </div>
      </section>
    </div>
  `;
  return overlay;
}

export function createBusinessMode({
  root,
  triggerButton,
  homeOverlay,
  ensureAudio,
} = {}) {
  const overlay = createBusinessOverlay();
  root.append(overlay);

  const refs = {
    wave: overlay.querySelector("[data-business-wave]"),
    coins: overlay.querySelector("[data-business-coins]"),
    satisfaction: overlay.querySelector("[data-business-satisfaction]"),
    chaos: overlay.querySelector("[data-business-chaos]"),
    upgrades: overlay.querySelector("[data-business-upgrades]"),
    orders: overlay.querySelector("[data-business-orders]"),
    orderList: overlay.querySelector("[data-business-order-list]"),
    cooking: overlay.querySelector("[data-business-cooking]"),
    cookingTitle: overlay.querySelector("[data-business-cooking-title]"),
    cookingMeta: overlay.querySelector("[data-business-cooking-meta]"),
    actionTrack: overlay.querySelector("[data-business-action-track]"),
    pending: overlay.querySelector("[data-business-pending]"),
    approachButtons: overlay.querySelectorAll("[data-business-approach]"),
    upgradePanel: overlay.querySelector("[data-business-upgrade-panel]"),
    lastReward: overlay.querySelector("[data-business-last-reward]"),
    upgradeList: overlay.querySelector("[data-business-upgrade-list]"),
    result: overlay.querySelector("[data-business-result]"),
    finalOrders: overlay.querySelector("[data-business-final-orders]"),
    finalCoins: overlay.querySelector("[data-business-final-coins]"),
    finalSatisfaction: overlay.querySelector("[data-business-final-satisfaction]"),
    finalChaos: overlay.querySelector("[data-business-final-chaos]"),
    finalBuild: overlay.querySelector("[data-business-final-build]"),
    finalComment: overlay.querySelector("[data-business-final-comment]"),
    restart: overlay.querySelector("[data-business-restart]"),
    homeButtons: overlay.querySelectorAll("[data-business-home], [data-business-result-home]"),
  };

  const game = new TodayBusinessGame();
  let active = false;

  function open() {
    ensureAudio?.();
    game.reset();
    active = true;
    overlay.hidden = false;
    overlay.classList.add("is-visible");
    homeOverlay?.classList.remove("is-visible");
    render();
  }

  function stop({ showHome = true } = {}) {
    active = false;
    overlay.classList.remove("is-visible");
    overlay.hidden = true;
    if (showHome) homeOverlay?.classList.add("is-visible");
  }

  function renderStats(snapshot) {
    refs.wave.textContent = `${snapshot.wave}/${snapshot.maxWaves}`;
    refs.coins.textContent = snapshot.coins;
    refs.satisfaction.textContent = snapshot.satisfaction;
    refs.chaos.textContent = snapshot.chaos;
    refs.upgrades.textContent = snapshot.upgrades.length
      ? snapshot.upgrades.map((upgrade) => `${upgrade.icon} ${upgrade.name}`).join(" · ")
      : "暂无厨具";
  }

  function renderOrders(snapshot) {
    refs.orderList.replaceChildren();
    snapshot.orders.forEach((order) => {
      const reward = game.previewOrderReward(order.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "business-order-card";
      button.innerHTML = `
        <span>${order.customerName}</span>
        <strong>${order.dishName}</strong>
        <small>${tagText(order.tags)}</small>
        <em>${actionFlow(order.actions)}</em>
        <b>基础 ${order.baseCoins} → 预估 ${reward.coins} 金币</b>
        <i>满意 ${formatSigned(reward.satisfaction)} · 混乱 ${formatSigned(reward.chaosDelta)}</i>
        <mark>${reward.reasons.length ? `触发 ${reward.reasons.join(" / ")}` : "暂无厨具触发"}</mark>
      `;
      button.addEventListener("click", () => {
        game.chooseOrder(order.id);
        render();
      });
      refs.orderList.append(button);
    });
  }

  function renderCooking(snapshot) {
    const order = snapshot.selectedOrder;
    if (!order) return;
    const actionLabel = BUSINESS_ACTION_LABELS[snapshot.currentAction] || snapshot.currentAction;
    const modifiers = snapshot.pendingOrderModifiers;
    refs.cookingTitle.textContent = `${order.customerName} 点了：${order.dishName}`;
    refs.cookingMeta.textContent = `动作 ${snapshot.currentActionIndex + 1}/${order.actions.length}：${actionLabel}`;
    refs.pending.textContent = `本单修正：金币 x${modifiers.coinMultiplier.toFixed(1)} · 混乱 ${formatSigned(modifiers.chaosDelta)}`;
    refs.actionTrack.replaceChildren();
    order.actions.forEach((action, index) => {
      const chip = document.createElement("span");
      chip.className = index < snapshot.currentActionIndex ? "is-done" : index === snapshot.currentActionIndex ? "is-active" : "";
      chip.textContent = BUSINESS_ACTION_LABELS[action] || action.toUpperCase();
      refs.actionTrack.append(chip);
    });
  }

  function renderUpgrades(snapshot) {
    refs.lastReward.textContent = snapshot.lastReward
      ? `上一单：+${snapshot.lastReward.coins} 金币 · 满意 ${formatSigned(snapshot.lastReward.satisfaction)} · 混乱 ${formatSigned(snapshot.lastReward.chaosDelta)}${snapshot.lastReward.reasons.length ? ` · 触发 ${snapshot.lastReward.reasons.join(" / ")}` : ""}`
      : "选择一个厨具，决定这局的经营路线。";
    refs.upgradeList.replaceChildren();
    snapshot.upgradeOptions.forEach((upgrade) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "business-upgrade-card";
      button.innerHTML = `
        <span>${upgrade.icon}</span>
        <strong>${upgrade.name}</strong>
        <small>${upgrade.route}</small>
        <em>${upgrade.short}</em>
      `;
      button.addEventListener("click", () => {
        game.chooseUpgrade(upgrade.id);
        render();
      });
      refs.upgradeList.append(button);
    });
  }

  function renderResult(snapshot) {
    const result = snapshot.result;
    refs.finalOrders.textContent = result.completedOrders;
    refs.finalCoins.textContent = result.coins;
    refs.finalSatisfaction.textContent = result.satisfaction;
    refs.finalChaos.textContent = result.chaos;
    refs.finalBuild.textContent = result.upgrades.length
      ? result.upgrades.map((upgrade) => `${upgrade.icon} ${upgrade.name}`).join(" · ")
      : "本局暂无厨具";
    refs.finalComment.textContent = result.comment;
  }

  function render() {
    const snapshot = game.getSnapshot();
    renderStats(snapshot);
    refs.orders.hidden = snapshot.state !== "choosing-order";
    refs.cooking.hidden = snapshot.state !== "cooking";
    refs.upgradePanel.hidden = snapshot.state !== "choosing-upgrade";
    refs.result.hidden = snapshot.state !== "ended";

    if (snapshot.state === "choosing-order") renderOrders(snapshot);
    if (snapshot.state === "cooking") renderCooking(snapshot);
    if (snapshot.state === "choosing-upgrade") renderUpgrades(snapshot);
    if (snapshot.state === "ended") renderResult(snapshot);
  }

  refs.approachButtons.forEach((button) => {
    button.addEventListener("click", () => {
      game.chooseCookingApproach(button.dataset.businessApproach);
      render();
    });
  });
  refs.restart.addEventListener("click", open);
  refs.homeButtons.forEach((button) => button.addEventListener("click", () => stop({ showHome: true })));
  triggerButton?.addEventListener("click", open);

  return {
    isActive: () => active,
    stop,
  };
}
