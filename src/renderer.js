import {
  chooseDanzaiAsset,
  chooseEggAsset,
  choosePanAsset,
} from "./assets.js";
import { classifyHeat, HEAT_STATUS } from "./game.js";

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 390;

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2;
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function getPanEvolution(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  const fixedThemes = [
    {
      name: "铁锅",
      body: "#4b3633",
      rim: "#806057",
      inner: "#352a29",
      handle: "#5b392e",
      accent: "#c39a83",
      glow: "rgba(255, 145, 62, 0.08)",
    },
    {
      name: "铜锅",
      body: "#a6532c",
      rim: "#ffb45f",
      inner: "#71391f",
      handle: "#8b4427",
      accent: "#ffe09a",
      glow: "rgba(255, 129, 42, 0.24)",
    },
    {
      name: "黄金锅",
      body: "#d89a1f",
      rim: "#fff078",
      inner: "#98600f",
      handle: "#b76d18",
      accent: "#fffbd0",
      glow: "rgba(255, 217, 50, 0.34)",
    },
    {
      name: "晶能锅",
      body: "#3679ad",
      rim: "#8ff7ff",
      inner: "#274c7a",
      handle: "#315f91",
      accent: "#e1ffff",
      glow: "rgba(66, 228, 255, 0.34)",
    },
  ];
  if (safeLevel <= fixedThemes.length) {
    return { ...fixedThemes[safeLevel - 1], level: safeLevel, tier: safeLevel };
  }
  const hue = (safeLevel * 37) % 360;
  return {
    level: safeLevel,
    tier: 5,
    name: "传奇锅",
    body: `hsl(${hue} 58% 43%)`,
    rim: `hsl(${(hue + 58) % 360} 96% 72%)`,
    inner: `hsl(${hue} 55% 25%)`,
    handle: `hsl(${hue} 48% 34%)`,
    accent: "#fff6a0",
    glow: `hsla(${(hue + 35) % 360}, 95%, 62%, 0.4)`,
  };
}

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.assets = {};
    this.equippedSkinKey = null;
    this.animations = {
      eggDropAt: -Infinity,
      burnAt: -Infinity,
      upgradeAt: -Infinity,
      costumeUntil: -Infinity,
      costumeIndex: 0,
      stageAt: -Infinity,
      eventAt: -Infinity,
      panUpgradeAt: -Infinity,
      panUpgradeLevel: 1,
      panUpgradeId: "iron-steady",
    };
    this.scorePopups = [];
    this.smokeParticles = [];
    this.sparkParticles = [];
    this.lastRenderAt = performance.now();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  setAssets(assets) {
    this.assets = assets;
  }

  setEquippedSkin(assetKey) {
    this.equippedSkinKey = assetKey === "danzaiStart" ? null : assetKey;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  triggerEggStart(now = performance.now()) {
    this.animations.eggDropAt = now;
  }

  triggerBurn(now = performance.now()) {
    this.animations.burnAt = now;
    for (let index = 0; index < 8; index += 1) {
      this.addSmokeParticle(true);
    }
  }

  triggerUpgrade(name, impact = "大幅强化", now = performance.now()) {
    this.animations.upgradeAt = now;
    this.addSparkBurst(46);
    this.scorePopups.push({
      label: `${name}！${impact}`,
      color: "#8f52c6",
      startedAt: now,
      duration: 1600,
      large: true,
    });
  }

  triggerEvent(effect, now = performance.now()) {
    this.animations.eventAt = now;
    const payoff = {
      "double-yolk": "双黄同屏 · 金币翻倍",
      "golden-heat": "金色完美区大扩张",
      "angry-fire": "烈火加速 · 本颗 ×4",
      "slow-egg": "慢速指针 · 稳稳命中",
      "lucky-scallion": "葱花雨 · 成功 +180",
      "spatula-critical": "双 Perfect 暴击 +500",
      "pan-crisis": "火力乱跳 · 成功 ×5",
      "danzai-cheer": "糊锅不掉连击",
      "time-warp": "成功恢复 1 颗心",
      jackpot: "超级大奖 · 金币 ×4",
      "devil-fire": "针眼火候 · 成功 ×8",
      "blind-heat": "过半致盲 · 成功 ×6",
    }[effect.id] || effect.title;
    this.scorePopups.push({
      label: payoff,
      color:
        effect.rarity === "legendary"
          ? "#e23883"
          : effect.rarity === "danger"
            ? "#e8452e"
            : "#7b4fbd",
      startedAt: now,
      duration: 1500,
      large: true,
    });
    if (effect.rarity === "legendary") {
      this.activateCostume(now, 1500);
      this.addSparkBurst(58);
    } else if (effect.rarity === "danger") {
      this.addSparkBurst(34);
    } else {
      this.addSparkBurst(22);
    }
  }

  triggerStageGoal(target, now = performance.now()) {
    this.addSparkBurst(64);
    this.activateCostume(now, 1500);
    this.scorePopups.push({
      label: `过关！目标 ${target} 已突破`,
      color: "#e54c6f",
      startedAt: now,
      duration: 1700,
      large: true,
    });
  }

  triggerStage(level, multiplier, panPerk = null, now = performance.now()) {
    this.animations.stageAt = now;
    this.animations.panUpgradeAt = now;
    this.animations.panUpgradeLevel = level;
    this.animations.panUpgradeId = panPerk?.id || "iron-steady";
    this.activateCostume(now, 1800, level - 1);
    const palette = {
      "iron-steady": ["#fff3d0", "#a98d7b", "#66544b"],
      "copper-guard": ["#fff0ad", "#ff9f43", "#bd562d"],
      "golden-feast": ["#fffbd0", "#ffd83d", "#f39b22"],
      "crystal-charge": ["#e7ffff", "#75efff", "#4a8cff"],
      "legendary-resonance": ["#fff477", "#ff6aac", "#9d70ff", "#62e4ff"],
    }[this.animations.panUpgradeId];
    this.addSparkBurst(58, palette);
    this.scorePopups.push({
      label: panPerk
        ? `新锅！${panPerk.name}`
        : `第 ${level} 关  火力升级`,
      color: "#e33c78",
      startedAt: now,
      duration: 1700,
      large: true,
    });
  }

  triggerPanPerk(trigger, now = performance.now()) {
    const palette = {
      "iron-steady": ["#fff8dc", "#a88f7d", "#625149"],
      "copper-guard": ["#fff1ad", "#ff9d43", "#cc5f32"],
      "golden-feast": ["#fffbd1", "#ffe33e", "#ff9a26"],
      "crystal-charge": ["#efffff", "#67eaff", "#537dff"],
      "legendary-resonance": ["#fff26d", "#ff5ca8", "#9b67ff", "#57e6ff"],
    }[trigger.kind] || ["#fff06b", "#ff6b92", "#8f74ff"];
    const color = palette[Math.min(1, palette.length - 1)];
    this.addSparkBurst(
      trigger.kind === "legendary-resonance" ? 64 : 34,
      palette,
    );
    if (["golden-feast", "legendary-resonance"].includes(trigger.kind)) {
      this.activateCostume(now, 1_250);
    }
    this.scorePopups.push({
      label: trigger.label,
      color,
      startedAt: now,
      duration: trigger.kind === "legendary-resonance" ? 1_450 : 1_050,
      large: ["golden-feast", "crystal-charge", "legendary-resonance"].includes(
        trigger.kind,
      ),
    });
  }

  activateCostume(now, duration, preferredIndex = null) {
    this.animations.costumeIndex =
      preferredIndex === null
        ? Math.floor(Math.random() * 7)
        : Math.abs(preferredIndex) % 7;
    this.animations.costumeUntil = now + duration;
  }

  triggerServe(result, now = performance.now()) {
    let label = `+${result.awardedScore}`;
    let color = "#ff7a35";
    if (result.awardedScore >= 1000) {
      label = `MEGA!  +${result.awardedScore}`;
      color = "#e63f82";
      this.activateCostume(now, 1400);
      this.addSparkBurst(44);
    } else if (result.awardedScore >= 500) {
      label = `暴击!  +${result.awardedScore}`;
      color = "#8f52c6";
      this.activateCostume(now, 1100);
      this.addSparkBurst(32);
    }
    if (result.isPerfect) {
      label = result.awardedScore >= 1000
        ? `PERFECT MEGA! +${result.awardedScore}`
        : `Perfect!  +${result.awardedScore}`;
      color = "#ef5d72";
      this.addSparkBurst();
    } else if (result.hitQuality === "good") {
      label = `Good!  +${result.awardedScore}`;
      color = "#35aa73";
      this.addSparkBurst(14, ["#d9ff91", "#6ed88b", "#fff06a"]);
    } else if (result.isBurnt) {
      label = result.preservedCombo ? "糊了，但连击保住！" : "糊锅啦！";
      color = "#734439";
      this.triggerBurn(now);
    }

    this.scorePopups.push({
      label,
      color,
      startedAt: now,
      duration: result.isPerfect ? 1200 : 900,
    });

    const buildTriggers = result.buildTriggers || [];
    if (buildTriggers.length > 0) {
      const dominantTrigger = buildTriggers[buildTriggers.length - 1];
      const palette = ["#fff8b5", "#ff8e45", "#ef4e83"];
      this.addSparkBurst(
        Math.min(72, 24 + buildTriggers.length * 12 + result.buildMultiplier * 2),
        palette,
      );
      if (result.buildMultiplier >= 4) {
        this.activateCostume(now, 1_350);
      }
      const multiplier = Number.isInteger(dominantTrigger.multiplier)
        ? dominantTrigger.multiplier
        : dominantTrigger.multiplier.toFixed(1);
      this.scorePopups.push({
        label: `${dominantTrigger.icon} ${dominantTrigger.label} ×${multiplier}`,
        color: palette[1],
        startedAt: now,
        duration: 1_250,
        large: result.buildMultiplier >= 4,
        offsetY: 34,
      });
    }
  }

  triggerComboMood(mood, streak, now = performance.now()) {
    const isFever = mood === "fever";
    this.addSparkBurst(
      isFever ? 72 : 38,
      isFever
        ? ["#fff36a", "#ff5b8f", "#6fe4ff", "#9a72ff", "#64df88"]
        : ["#fff36a", "#ff9c56", "#79dfff", "#ff79a8"],
    );
    this.activateCostume(now, isFever ? 1_900 : 1_100, streak);
    this.scorePopups.push({
      label: isFever
        ? `PERFECT x${streak}！大狂欢！`
        : `PERFECT x${streak}！活力开锅！`,
      color: isFever ? "#e93e86" : "#ff783f",
      startedAt: now,
      duration: isFever ? 1_800 : 1_350,
      large: true,
      offsetY: -26,
    });
  }

  render(snapshot, now = performance.now()) {
    const ctx = this.context;
    const rect = this.canvas.getBoundingClientRect();
    const deltaMs = Math.min(50, Math.max(0, now - this.lastRenderAt));
    this.lastRenderAt = now;
    const scale = Math.min(
      this.canvas.width / DESIGN_WIDTH,
      this.canvas.height / DESIGN_HEIGHT,
    );
    const offsetX = (this.canvas.width - DESIGN_WIDTH * scale) / 2;
    const offsetY = (this.canvas.height - DESIGN_HEIGHT * scale) / 2;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "#fff1c3";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.save();
    if (snapshot.baseEffect.crisis) {
      ctx.translate(Math.sin(now / 31) * 3.2, Math.cos(now / 43) * 2);
    } else if (["angry-fire", "devil-fire"].includes(snapshot.baseEffect.id)) {
      ctx.translate(Math.sin(now / 48) * 1.4, 0);
    }

    this.drawKitchen(ctx);
    this.drawLevelAtmosphere(ctx, snapshot.level, now);
    this.drawComboAtmosphere(ctx, snapshot.comboMood, now);

    const egg = snapshot.currentEgg;
    const currentHeat = egg?.heat ?? 0;
    this.drawEventAtmosphere(ctx, snapshot.baseEffect, now, currentHeat);
    const status = egg
      ? classifyHeat(currentHeat, snapshot.effect.perfectMin, snapshot.effect.perfectMax)
      : HEAT_STATUS.RAW;
    const mood = status === HEAT_STATUS.BURNT ? "fail" : "idle";

    this.drawDanzai(ctx, mood, now, snapshot.comboMood);
    this.drawFire(ctx, currentHeat, snapshot.effect, now);
    this.drawPan(ctx, snapshot.level, now);

    if (egg) {
      this.drawEgg(ctx, currentHeat, egg.phase, now, snapshot.baseEffect);
      if (status === HEAT_STATUS.BURNT) {
        const shouldAddSmoke = Math.random() < deltaMs / 90;
        if (shouldAddSmoke) {
          this.addSmokeParticle();
        }
      }
    }

    this.updateAndDrawParticles(ctx, deltaMs);
    this.drawPanUpgradeAnimation(ctx, now);
    this.drawScorePopups(ctx, now);
    ctx.restore();
  }

  drawKitchen(ctx) {
    if (this.assets.kitchenStage) {
      this.drawImageCover(ctx, this.assets.kitchenStage, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      return;
    }

    const wall = ctx.createLinearGradient(0, 0, 0, 270);
    wall.addColorStop(0, "#fff8d9");
    wall.addColorStop(1, "#ffe9ae");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, DESIGN_WIDTH, 285);

    ctx.strokeStyle = "rgba(210, 147, 75, 0.14)";
    ctx.lineWidth = 2;
    for (let y = 68; y < 270; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(DESIGN_WIDTH, y);
      ctx.stroke();
    }
    for (let x = 0; x < DESIGN_WIDTH; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 68);
      ctx.lineTo(x, 270);
      ctx.stroke();
    }

    ctx.fillStyle = "#ec8e4f";
    ctx.fillRect(0, 285, DESIGN_WIDTH, 105);
    ctx.fillStyle = "#f5aa67";
    ctx.fillRect(0, 285, DESIGN_WIDTH, 13);

    ctx.fillStyle = "rgba(255,255,255,0.16)";
    for (let x = 12; x < DESIGN_WIDTH; x += 42) {
      ctx.beginPath();
      ctx.ellipse(x, 321 + (x % 3) * 11, 15, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawEventAtmosphere(ctx, effect, now, heat = 0) {
    if (!effect || effect.rarity === "normal") return;
    ctx.save();
    if (effect.rarity === "danger" || effect.rarity === "legendary") {
      const pulse = 0.08 + (Math.sin(now / 90) + 1) * 0.035;
      const color = effect.rarity === "danger" ? `rgba(255, 47, 25, ${pulse})` : `rgba(255, 208, 35, ${pulse})`;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    }
    if (effect.id === "jackpot") {
      ctx.globalAlpha = 0.78;
      ctx.fillStyle = "#ffd23e";
      for (let index = 0; index < 22; index += 1) {
        const x = (index * 47 + now / 18) % 410 - 10;
        const y = 80 + ((index * 71 + now / 10) % 260);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(now / 350 + index);
        ctx.fillRect(-5, -2, 10, 4);
        ctx.restore();
      }
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#d42d7d";
      ctx.font = "1000 76px Microsoft YaHei";
      ctx.textAlign = "center";
      ctx.fillText("×10", 257, 178);
    } else if (effect.id === "golden-heat") {
      const glow = ctx.createRadialGradient(250, 250, 20, 250, 250, 175);
      glow.addColorStop(0, "rgba(255, 244, 92, 0.34)");
      glow.addColorStop(1, "rgba(255, 190, 42, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(40, 60, 350, 320);
      ctx.fillStyle = "#fff06c";
      for (let index = 0; index < 10; index += 1) {
        const angle = now / 520 + index * 0.9;
        ctx.beginPath();
        ctx.arc(
          250 + Math.cos(angle) * (92 + index * 5),
          244 + Math.sin(angle) * 70,
          3 + (index % 3),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    } else if (effect.id === "double-yolk") {
      ctx.globalAlpha = 0.18 + Math.sin(now / 120) * 0.04;
      ctx.fillStyle = "#ffbd2f";
      ctx.font = "1000 64px Microsoft YaHei";
      ctx.textAlign = "center";
      ctx.fillText("×3", 255, 180);
    } else if (effect.id === "slow-egg") {
      ctx.fillStyle = "rgba(92, 205, 255, 0.12)";
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      ctx.strokeStyle = "rgba(114, 218, 255, 0.68)";
      ctx.lineWidth = 3;
      for (let index = 0; index < 12; index += 1) {
        const x = (index * 47 + Math.sin(now / 400 + index) * 14) % DESIGN_WIDTH;
        const y = (index * 59 - now / 20) % 430;
        ctx.beginPath();
        ctx.arc(x, y, 5 + (index % 4) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (effect.id === "lucky-scallion") {
      ctx.fillStyle = "#63c95c";
      for (let index = 0; index < 18; index += 1) {
        const x = (index * 53 + now / 16) % 420 - 15;
        const y = (index * 71 + now / 9) % 400;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(index + now / 450);
        ctx.fillRect(-6, -2, 12, 4);
        ctx.restore();
      }
    } else if (effect.id === "spatula-critical") {
      ctx.strokeStyle = "rgba(181, 107, 255, 0.78)";
      ctx.lineWidth = 4;
      for (let index = 0; index < 5; index += 1) {
        const offset = Math.sin(now / 80 + index) * 10;
        ctx.beginPath();
        ctx.moveTo(178 + index * 34, 143);
        ctx.lineTo(164 + index * 34 + offset, 180);
        ctx.lineTo(186 + index * 34 - offset, 212);
        ctx.stroke();
      }
    } else if (effect.id === "pan-crisis") {
      ctx.strokeStyle = "rgba(238, 63, 37, 0.42)";
      ctx.lineWidth = 9;
      for (let index = -4; index < 9; index += 1) {
        const x = index * 58 + (now / 8) % 58;
        ctx.beginPath();
        ctx.moveTo(x, 390);
        ctx.lineTo(x + 150, 0);
        ctx.stroke();
      }
    } else if (effect.id === "danzai-cheer") {
      ctx.fillStyle = "rgba(255, 92, 135, 0.78)";
      ctx.font = "900 22px Microsoft YaHei";
      for (let index = 0; index < 8; index += 1) {
        const x = 42 + (index % 3) * 44 + Math.sin(now / 260 + index) * 8;
        const y = 120 + ((index * 47 - now / 24) % 170);
        ctx.fillText("♥", x, y);
      }
    } else if (effect.id === "time-warp") {
      ctx.strokeStyle = "rgba(61, 155, 224, 0.62)";
      ctx.lineWidth = 4;
      for (let index = 0; index < 4; index += 1) {
        ctx.beginPath();
        ctx.arc(252, 250, 80 + index * 15, now / 700 + index, now / 700 + index + 4.7);
        ctx.stroke();
      }
    } else if (effect.id === "angry-fire") {
      ctx.fillStyle = "rgba(255, 73, 27, 0.1)";
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      ctx.fillStyle = "rgba(255, 118, 28, 0.7)";
      for (let index = 0; index < 10; index += 1) {
        const x = 150 + index * 25;
        const height = 18 + Math.sin(now / 75 + index) * 12;
        ctx.beginPath();
        ctx.moveTo(x - 9, 360);
        ctx.quadraticCurveTo(x, 330 - height, x + 9, 360);
        ctx.fill();
      }
    } else if (effect.id === "devil-fire") {
      const devilGlow = ctx.createRadialGradient(250, 255, 20, 250, 255, 170);
      devilGlow.addColorStop(0, "rgba(255, 48, 68, 0.24)");
      devilGlow.addColorStop(0.65, "rgba(112, 39, 164, 0.18)");
      devilGlow.addColorStop(1, "rgba(54, 12, 70, 0)");
      ctx.fillStyle = devilGlow;
      ctx.fillRect(30, 60, 360, 330);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#7c279c";
      ctx.font = "1000 66px Microsoft YaHei";
      ctx.textAlign = "center";
      ctx.fillText("×8", 252, 182);
    } else if (effect.id === "blind-heat" && heat >= effect.hiddenHeatAfter) {
      const vignette = ctx.createRadialGradient(250, 250, 45, 250, 250, 220);
      vignette.addColorStop(0, "rgba(42, 26, 25, 0.05)");
      vignette.addColorStop(0.56, "rgba(42, 26, 25, 0.45)");
      vignette.addColorStop(1, "rgba(20, 12, 18, 0.88)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      ctx.fillStyle = "rgba(255,255,255,0.86)";
      ctx.font = "1000 24px Microsoft YaHei";
      ctx.textAlign = "center";
      ctx.fillText("凭感觉！", 252, 175);
    }
    ctx.restore();
  }

  drawLevelAtmosphere(ctx, level, now) {
    if (level <= 1) return;
    const hue = (20 + level * 31) % 360;
    const pulse = 0.025 + (Math.sin(now / 180) + 1) * 0.012;
    ctx.save();
    ctx.fillStyle = `hsla(${hue}, 85%, 55%, ${pulse})`;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    ctx.fillStyle = `hsla(${hue}, 95%, 62%, 0.7)`;
    for (let index = 0; index < Math.min(8, level - 1); index += 1) {
      ctx.beginPath();
      ctx.arc(184 + index * 17, 365, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawComboAtmosphere(ctx, comboMood, now) {
    if (comboMood === "normal") return;

    const isFever = comboMood === "fever";
    ctx.save();
    const pulse = 0.04 + (Math.sin(now / (isFever ? 85 : 145)) + 1) * 0.025;
    ctx.fillStyle = isFever
      ? `rgba(255, 62, 139, ${pulse})`
      : `rgba(255, 202, 55, ${pulse})`;
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    const count = isFever ? 18 : 8;
    const colors = ["#fff36a", "#ff6f91", "#65dfff", "#8be06f", "#9b75ff"];
    for (let index = 0; index < count; index += 1) {
      const travel = (now / (isFever ? 7 : 12) + index * 67) % 460;
      const x = index % 2 === 0 ? 10 + (index % 4) * 14 : DESIGN_WIDTH - 12 - (index % 4) * 13;
      const y = travel - 35;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(now / 250 + index);
      ctx.fillStyle = colors[index % colors.length];
      if (index % 3 === 0) {
        ctx.beginPath();
        ctx.arc(0, 0, isFever ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-4, -2, 8, 4);
      }
      ctx.restore();
    }
    if (isFever) this.drawFeverAura(ctx, now);
    ctx.restore();
  }

  drawDanzai(ctx, mood, now, comboMood = "normal") {
    const costumeKeys = [
      "costumeDrummer",
      "costumeSwordsman",
      "costumeLeafDancer",
      "costumeStoneAge",
      "costumeCarrot",
      "costumeDetective",
      "costumeStreetCap",
    ];
    const costume = now < this.animations.costumeUntil
      ? this.assets[costumeKeys[this.animations.costumeIndex]]
      : null;
    const equipped = this.equippedSkinKey
      ? this.assets[this.equippedSkinKey]
      : null;
    const image = costume || equipped || chooseDanzaiAsset(this.assets, mood);
    const bobAmplitude = comboMood === "fever" ? 8 : comboMood === "lively" ? 5 : 3;
    const bobSpeed = comboMood === "fever" ? 150 : comboMood === "lively" ? 260 : 420;
    const bob = Math.sin(now / bobSpeed) * bobAmplitude;
    const x = 17;
    const y = 117 + bob;
    const width = 142;
    const height = 171;

    if (image) {
      this.drawImageContain(ctx, image, x, y, width, height);
      return;
    }

    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(-0.06 + Math.sin(now / 600) * 0.025);
    ctx.translate(-width / 2, -height / 2);

    ctx.fillStyle = "rgba(125, 67, 30, 0.15)";
    ctx.beginPath();
    ctx.ellipse(width / 2, height - 3, 50, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fffdf2";
    ctx.strokeStyle = "#ad6334";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(width * 0.49, 5);
    ctx.bezierCurveTo(width * 0.76, 6, width * 0.89, 45, width * 0.84, 93);
    ctx.bezierCurveTo(width * 0.82, 140, width * 0.67, 160, width * 0.47, 161);
    ctx.bezierCurveTo(width * 0.18, 162, width * 0.08, 133, width * 0.12, 91);
    ctx.bezierCurveTo(width * 0.16, 46, width * 0.26, 10, width * 0.49, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffe7a3";
    ctx.beginPath();
    ctx.ellipse(76, 120, 35, 24, -0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#5b3627";
    if (mood === "fail") {
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#5b3627";
      for (const eyeX of [48, 92]) {
        ctx.beginPath();
        ctx.moveTo(eyeX - 5, 65);
        ctx.lineTo(eyeX + 5, 73);
        ctx.moveTo(eyeX + 5, 65);
        ctx.lineTo(eyeX - 5, 73);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.ellipse(48, 68, 6, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(93, 68, 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#5b3627";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (mood === "fail") {
      ctx.arc(71, 97, 12, Math.PI * 1.12, Math.PI * 1.88);
    } else {
      ctx.arc(71, 84, 14, 0.15, Math.PI - 0.15);
    }
    ctx.stroke();

    ctx.fillStyle = "#ff9ca2";
    ctx.beginPath();
    ctx.ellipse(31, 87, 10, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(110, 87, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Simple arms make the placeholder character feel active beside the pan.
    ctx.strokeStyle = "#ad6334";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(116, 109);
    ctx.quadraticCurveTo(145, 119, 155, 142);
    ctx.stroke();
    ctx.restore();
  }

  drawFire(ctx, heat, effect, now) {
    const eventIntensity = Math.min(
      1.9,
      Math.max(0.72, Math.sqrt(effect.speedMultiplier || 1)),
    );
    const intensity = (0.65 + heat / 180) * eventIntensity;
    const jitter = effect.crisis ? Math.sin(now / 55) * 8 : Math.sin(now / 120) * 3;
    const centerX = 252;
    const baseY = 319;
    const fireColors =
      effect.id === "devil-fire" || effect.id === "blind-heat"
        ? ["#b94bff", "#ff4d7f"]
        : effect.id === "slow-egg" || effect.id === "time-warp"
          ? ["#58c9ff", "#b9f5ff"]
          : effect.id === "golden-heat" || effect.id === "jackpot"
            ? ["#ff9d28", "#fff36a"]
            : ["#ff7035", "#ffc43f"];

    ctx.save();
    ctx.globalAlpha = 0.78;
    for (let index = -2; index <= 2; index += 1) {
      const height = (22 + Math.abs(index % 2) * 10 + jitter) * intensity;
      ctx.fillStyle = fireColors[Math.abs(index) % 2];
      ctx.beginPath();
      ctx.moveTo(centerX + index * 17 - 11, baseY);
      ctx.quadraticCurveTo(
        centerX + index * 17,
        baseY - height,
        centerX + index * 17 + 11,
        baseY,
      );
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawFeverAura(ctx, now) {
    const pulse = 0.84 + Math.sin(now / 100) * 0.1;
    const gradient = ctx.createRadialGradient(225, 245, 20, 225, 245, 155);
    gradient.addColorStop(0, `rgba(255, 244, 82, ${0.32 * pulse})`);
    gradient.addColorStop(0.55, `rgba(255, 74, 72, ${0.18 * pulse})`);
    gradient.addColorStop(1, "rgba(255, 42, 129, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(40, 80, 340, 290);

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "#fff07a";
    ctx.lineWidth = 4;
    for (let index = 0; index < 8; index += 1) {
      const angle = now / 420 + (Math.PI * 2 * index) / 8;
      const inner = 108;
      const outer = 128 + Math.sin(now / 90 + index) * 8;
      ctx.beginPath();
      ctx.moveTo(250 + Math.cos(angle) * inner, 250 + Math.sin(angle) * inner * 0.55);
      ctx.lineTo(250 + Math.cos(angle) * outer, 250 + Math.sin(angle) * outer * 0.55);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPan(ctx, level = 1, now = performance.now()) {
    const theme = getPanEvolution(level);
    const pulse = 0.82 + Math.sin(now / 140) * 0.18;
    const glow = ctx.createRadialGradient(248, 265, 28, 248, 265, 142);
    glow.addColorStop(0, theme.glow);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = glow;
    ctx.fillRect(96, 135, 294, 220);
    ctx.restore();

    if (theme.tier >= 4) {
      ctx.save();
      ctx.fillStyle = theme.rim;
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.moveTo(167, 248);
      ctx.lineTo(127, 216);
      ctx.lineTo(150, 267);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(329, 248);
      ctx.lineTo(355, 218);
      ctx.lineTo(346, 267);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const image = choosePanAsset(this.assets, level);
    if (image) {
      this.drawImageContain(ctx, image, 116, 153, 278, 205);
      ctx.save();
      ctx.globalAlpha = 0.68;
      ctx.strokeStyle = theme.rim;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(248, 266, 105, 59, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(0, 5);
      ctx.strokeStyle = theme.handle;
      ctx.lineWidth = 18;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(317, 249);
      ctx.lineTo(382, 211);
      ctx.stroke();

      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(332, 240);
      ctx.lineTo(378, 213);
      ctx.stroke();

      ctx.fillStyle = theme.body;
      ctx.strokeStyle = theme.rim;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(248, 266, 105, 59, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const panGlow = ctx.createRadialGradient(232, 238, 4, 248, 263, 88);
      panGlow.addColorStop(0, theme.rim);
      panGlow.addColorStop(0.28, theme.body);
      panGlow.addColorStop(1, theme.inner);
      ctx.fillStyle = panGlow;
      ctx.beginPath();
      ctx.ellipse(248, 254, 88, 45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    const ornamentCount = Math.min(5, Math.max(0, theme.level - 1));
    for (let index = 0; index < ornamentCount; index += 1) {
      const angle = Math.PI * (1.12 + index * 0.19);
      const x = 248 + Math.cos(angle) * 92;
      const y = 264 + Math.sin(angle) * 47;
      ctx.fillStyle = theme.accent;
      ctx.strokeStyle = "rgba(92,45,26,0.32)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, theme.tier >= 3 ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (theme.tier >= 5) {
      ctx.translate(248, 196);
      ctx.fillStyle = theme.accent;
      ctx.strokeStyle = "#a65b25";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-22, 14);
      ctx.lineTo(-17, -8);
      ctx.lineTo(-5, 4);
      ctx.lineTo(0, -12);
      ctx.lineTo(8, 4);
      ctx.lineTo(20, -8);
      ctx.lineTo(24, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(348, 224);
    ctx.fillStyle = theme.rim;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = theme.inner;
    ctx.font = "900 9px Microsoft YaHei";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`LV${theme.level}`, 0, 0);
    ctx.restore();
  }

  drawPanUpgradeAnimation(ctx, now) {
    const duration = 1_700;
    const elapsed = now - this.animations.panUpgradeAt;
    if (elapsed < 0 || elapsed >= duration) return;

    const progress = clamp01(elapsed / duration);
    const appear = Math.min(1, progress * 5);
    const fade = Math.min(1, (1 - progress) * 4);
    const alpha = appear * fade;
    const centerX = 248;
    const centerY = 255;
    const id = this.animations.panUpgradeId;
    const theme = getPanEvolution(this.animations.panUpgradeLevel);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";

    const ringRadius = 60 + easeOutBack(Math.min(1, progress * 1.4)) * 62;
    ctx.strokeStyle = theme.rim;
    ctx.lineWidth = 5 - progress * 2;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, ringRadius, ringRadius * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (id === "iron-steady") {
      ctx.strokeStyle = "#f7e6c5";
      ctx.lineWidth = 5;
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8 + progress * 0.35;
        const inner = 72;
        const outer = 98 + Math.sin(progress * Math.PI * 6 + index) * 6;
        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(angle) * inner,
          centerY + Math.sin(angle) * inner * 0.55,
        );
        ctx.lineTo(
          centerX + Math.cos(angle) * outer,
          centerY + Math.sin(angle) * outer * 0.55,
        );
        ctx.stroke();
      }
    } else if (id === "copper-guard") {
      ctx.strokeStyle = "#fff0a8";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 76, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 4);
      ctx.stroke();
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12 - Math.PI / 2;
        const radius = 82;
        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius * 0.58,
        );
        ctx.lineTo(
          centerX + Math.cos(angle) * (radius + 9),
          centerY + Math.sin(angle) * (radius + 9) * 0.58,
        );
        ctx.stroke();
      }
    } else if (id === "golden-feast") {
      for (let index = 0; index < 16; index += 1) {
        const x = 125 + ((index * 47) % 245);
        const y = 115 + ((progress * 310 + index * 37) % 220);
        ctx.fillStyle = index % 2 ? "#fff27a" : "#ffb52f";
        ctx.strokeStyle = "#d67a19";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, 7, 10, progress * 8 + index, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (id === "crystal-charge") {
      ctx.fillStyle = "#8ff7ff";
      ctx.strokeStyle = "#eaffff";
      ctx.lineWidth = 2;
      for (let index = 0; index < 10; index += 1) {
        const angle = (Math.PI * 2 * index) / 10 - progress * 1.8;
        const radius = 78 + Math.sin(progress * Math.PI * 4 + index) * 16;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius * 0.58;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.lineTo(7, 7);
        ctx.lineTo(0, 12);
        ctx.lineTo(-7, 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    } else {
      const colors = ["#fff16b", "#ff65ad", "#9d78ff", "#61e8ff"];
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12 + progress * 2.4;
        const radius = 86 + Math.sin(progress * Math.PI * 5 + index) * 12;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius * 0.56;
        ctx.fillStyle = colors[index % colors.length];
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillRect(-7, -3, 14, 6);
        ctx.restore();
      }
      ctx.fillStyle = "#fff275";
      ctx.strokeStyle = "#b65b2b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 28, centerY - 58);
      ctx.lineTo(centerX - 20, centerY - 88);
      ctx.lineTo(centerX - 7, centerY - 70);
      ctx.lineTo(centerX + 2, centerY - 94);
      ctx.lineTo(centerX + 13, centerY - 70);
      ctx.lineTo(centerX + 29, centerY - 88);
      ctx.lineTo(centerX + 34, centerY - 58);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawEgg(ctx, heat, phase, now, effect) {
    const dropProgress = clamp01((now - this.animations.eggDropAt) / 620);
    const dropY = dropProgress < 1 ? -105 * (1 - easeOutBack(dropProgress)) : 0;
    const x = 249;
    const y = 253 + dropY;
    const color = this.getEggColor(heat);

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 22, 62, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    const image = chooseEggAsset(this.assets, heat, effect);
    if (image) {
      this.drawImageContain(ctx, image, -72, -66, 144, 132);
    } else {
      ctx.fillStyle = color;
      ctx.strokeStyle = heat >= 96 ? "#4b2f2a" : "#e7c779";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-65, -2);
      ctx.bezierCurveTo(-59, -38, -28, -44, -4, -35);
      ctx.bezierCurveTo(24, -49, 65, -26, 66, 2);
      ctx.bezierCurveTo(68, 32, 32, 42, 7, 35);
      ctx.bezierCurveTo(-24, 48, -68, 30, -65, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const yolkColor = heat > 90 ? ["#ba5c22", "#843c20"] : ["#ffd85b", "#f0a927"];
      const yolkCenters = effect?.doubleYolk
        ? [
            { x: -22, y: -1, rx: 22, ry: 20 },
            { x: 22, y: 1, rx: 22, ry: 20 },
          ]
        : [{ x: 2, y: -1, rx: 29, ry: 25 }];
      for (const yolkCenter of yolkCenters) {
        const yolk = ctx.createRadialGradient(
          yolkCenter.x - 7,
          yolkCenter.y - 9,
          3,
          yolkCenter.x,
          yolkCenter.y,
          yolkCenter.rx,
        );
        yolk.addColorStop(0, yolkColor[0]);
        yolk.addColorStop(1, yolkColor[1]);
        ctx.fillStyle = yolk;
        ctx.beginPath();
        ctx.ellipse(
          yolkCenter.x,
          yolkCenter.y,
          yolkCenter.rx,
          yolkCenter.ry,
          0.1,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    ctx.restore();
  }

  getEggColor(heat) {
    if (heat >= 96) return "#4d332d";
    if (heat >= 86) return "#bf733c";
    if (heat >= 70) return "#ffd883";
    if (heat >= 40) return "#fff0ba";
    return "#fffdf3";
  }

  addSmokeParticle(burst = false) {
    this.smokeParticles.push({
      x: 247 + (Math.random() - 0.5) * 60,
      y: 235 + (Math.random() - 0.5) * 18,
      vx: (Math.random() - 0.5) * (burst ? 0.09 : 0.035),
      vy: -(0.025 + Math.random() * (burst ? 0.08 : 0.035)),
      size: 8 + Math.random() * 13,
      life: 1,
    });
  }

  addSparkBurst(
    count = 24,
    colors = ["#ff6b6b", "#ffd93d", "#6bdb87", "#6ca9ff", "#d48cff"],
  ) {
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.2;
      const speed = 0.06 + Math.random() * 0.1;
      this.sparkParticles.push({
        x: 248,
        y: 225,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.04,
        color: colors[index % colors.length],
        rotation: Math.random() * Math.PI,
        life: 1,
      });
    }
  }

  updateAndDrawParticles(ctx, deltaMs) {
    this.smokeParticles = this.smokeParticles.filter((particle) => {
      particle.x += particle.vx * deltaMs;
      particle.y += particle.vy * deltaMs;
      particle.size += deltaMs * 0.012;
      particle.life -= deltaMs / 1150;
      if (particle.life <= 0) return false;

      ctx.save();
      ctx.globalAlpha = particle.life * 0.5;
      ctx.fillStyle = "#6f6661";
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    });

    this.sparkParticles = this.sparkParticles.filter((particle) => {
      particle.x += particle.vx * deltaMs;
      particle.y += particle.vy * deltaMs;
      particle.vy += deltaMs * 0.00012;
      particle.rotation += deltaMs * 0.012;
      particle.life -= deltaMs / 900;
      if (particle.life <= 0) return false;

      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.fillRect(-4, -2, 8, 4);
      ctx.restore();
      return true;
    });
  }

  drawScorePopups(ctx, now) {
    this.scorePopups = this.scorePopups.filter((popup) => {
      const progress = (now - popup.startedAt) / popup.duration;
      if (progress >= 1) return false;

      const eased = easeOutCubic(clamp01(progress));
      ctx.save();
      ctx.translate(250, 205 + (popup.offsetY || 0) - eased * 55);
      ctx.scale(0.75 + Math.min(1, progress * 5) * 0.25, 0.75 + Math.min(1, progress * 5) * 0.25);
      ctx.globalAlpha = Math.min(1, (1 - progress) * 2.8);
      const isLarge = popup.large || popup.label.startsWith("Perfect");
      ctx.font = isLarge ? "900 24px Microsoft YaHei" : "900 20px Microsoft YaHei";
      ctx.textAlign = "center";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "white";
      ctx.lineWidth = 7;
      ctx.strokeText(popup.label, 0, 0);
      ctx.fillStyle = popup.color;
      ctx.fillText(popup.label, 0, 0);
      ctx.restore();
      return true;
    });
  }

  drawImageContain(ctx, image, x, y, width, height) {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    ctx.drawImage(
      image,
      x + (width - drawWidth) / 2,
      y + (height - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
  }

  drawImageCover(ctx, image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = (image.naturalHeight - sourceHeight) / 2;
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      x,
      y,
      width,
      height,
    );
  }
}
