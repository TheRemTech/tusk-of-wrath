import { STAGES } from "./levels.js";
import { WEAPONS, WEAPON_ORDER } from "./weapons.js";
import {
  createEnemy,
  createPickup,
  createTruck,
  createEnemyShot,
  aabb,
} from "./entities.js";
import {
  createPlayer,
  setAge,
  updatePlayer,
  meleeHitbox,
} from "./player.js";
import {
  drawWorld,
  drawElephant,
  drawEnemy,
  drawTruck,
  drawProjectile,
  drawPickup,
} from "./render.js";
import { unlockAudio, startMusic, sfx } from "./audio.js";
import {
  createFx,
  updateFx,
  drawFx,
  burst,
  shake,
  hitstop,
  flash,
  banner,
  cameraOffset,
} from "./fx.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const panelEyebrow = document.getElementById("panel-eyebrow");
const panelTitle = document.getElementById("panel-title");
const panelBody = document.getElementById("panel-body");
const startBtn = document.getElementById("start-btn");
const hud = document.getElementById("hud");
const hpFill = document.getElementById("hp-fill");
const ageLabel = document.getElementById("age-label");
const weaponName = document.getElementById("weapon-name");
const stageName = document.getElementById("stage-name");
const killCountEl = document.getElementById("kill-count");
const cashEl = document.getElementById("cash-count");
const wantedEl = document.getElementById("wanted-stars");
const missionEl = document.getElementById("mission-text");
const touchPad = document.getElementById("touch-pad");

const input = {
  left: false,
  right: false,
  jump: false,
  attack: false,
  charge: false,
  weapon: [false, false, false, false],
};

const keyMap = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "jump",
  KeyA: "left",
  KeyD: "right",
  KeyW: "jump",
  Space: "jump",
  KeyJ: "attack",
  KeyZ: "attack",
  KeyK: "charge",
  ShiftLeft: "charge",
};

window.addEventListener("keydown", (e) => {
  const k = keyMap[e.code];
  if (k) {
    input[k] = true;
    e.preventDefault();
  }
  if (e.code.startsWith("Digit")) {
    const n = Number(e.code.slice(5)) - 1;
    if (n >= 0 && n < 4) input.weapon[n] = true;
  }
});

window.addEventListener("keyup", (e) => {
  const k = keyMap[e.code];
  if (k) input[k] = false;
  if (e.code.startsWith("Digit")) {
    const n = Number(e.code.slice(5)) - 1;
    if (n >= 0 && n < 4) input.weapon[n] = false;
  }
});

function cycleWeapon() {
  const owned = WEAPON_ORDER.filter((id) => player.unlocked.has(id));
  if (!owned.length) return;
  const i = owned.indexOf(player.weapon);
  player.weapon = owned[(i + 1) % owned.length];
  syncHud();
}

function isTouchDevice() {
  return (
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window
  );
}

function bindTouchControls() {
  if (isTouchDevice()) {
    touchPad.classList.add("force-show");
    document.documentElement.classList.add("is-touch");
  }

  const held = new Map();
  const setAction = (action, down) => {
    if (["left", "right", "jump", "attack", "charge"].includes(action)) {
      input[action] = down;
      return;
    }
    if (action === "weapon" && down) cycleWeapon();
  };

  const pressBtn = (btn, id) => {
    if (!btn || held.has(id)) return;
    const action = btn.dataset.action;
    held.set(id, { action, btn });
    btn.classList.add("is-down");
    setAction(action, true);
  };

  const releaseId = (id) => {
    const state = held.get(id);
    if (!state) return;
    held.delete(id);
    state.btn.classList.remove("is-down");
    if (state.action !== "weapon") setAction(state.action, false);
  };

  touchPad.addEventListener(
    "touchstart",
    (e) => {
      for (const t of e.changedTouches) {
        const el = document.elementFromPoint(t.clientX, t.clientY);
        const btn = el?.closest?.("[data-action]");
        if (btn && touchPad.contains(btn)) {
          e.preventDefault();
          pressBtn(btn, `t${t.identifier}`);
        }
      }
    },
    { passive: false }
  );
  const endTouches = (e) => {
    for (const t of e.changedTouches) releaseId(`t${t.identifier}`);
  };
  touchPad.addEventListener("touchend", endTouches);
  touchPad.addEventListener("touchcancel", endTouches);

  touchPad.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    const btn = e.target.closest("[data-action]");
    if (!btn || !touchPad.contains(btn)) return;
    e.preventDefault();
    pressBtn(btn, `p${e.pointerId}`);
  });
  const endPointer = (e) => {
    if (e.pointerType === "touch") return;
    releaseId(`p${e.pointerId}`);
  };
  touchPad.addEventListener("pointerup", endPointer);
  touchPad.addEventListener("pointercancel", endPointer);

  document.querySelector(".stage-wrap").addEventListener(
    "touchmove",
    (e) => {
      if (mode === "playing") e.preventDefault();
    },
    { passive: false }
  );

  startBtn.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      handleStart();
    },
    { passive: false }
  );
}

function setTouchPadVisible(visible) {
  touchPad.classList.toggle("hidden", !visible);
  touchPad.setAttribute("aria-hidden", visible ? "false" : "true");
  if (visible && isTouchDevice()) touchPad.classList.add("force-show");
}

let mode = "title";
let stageIndex = 0;
let stage = STAGES[0];
let player = createPlayer(stage.spawn, stage.age);
let enemies = [];
let trucks = [];
let pickups = [];
let projectiles = [];
let camera = { x: 0, y: 0 };
let kills = 0;
let cash = 0;
let wanted = 0;
let trucksWrecked = 0;
let bossDown = false;
let time = 0;
let last = 0;
let fx = createFx();
let heatTimer = 0;
let heatKills = 0;

function showPanel({ chapter, title, body, button }) {
  panelEyebrow.textContent = chapter;
  panelTitle.textContent = title;
  panelBody.textContent = body;
  startBtn.textContent = button;
  overlay.classList.remove("hidden");
  hud.classList.add("hidden");
  hud.setAttribute("aria-hidden", "true");
  setTouchPadVisible(false);
  input.left = input.right = input.jump = input.attack = input.charge = false;
}

function hidePanel() {
  overlay.classList.add("hidden");
  hud.classList.remove("hidden");
  hud.setAttribute("aria-hidden", "false");
  setTouchPadVisible(true);
}

function loadStage(index) {
  stageIndex = index;
  stage = STAGES[index];
  const prev = player;
  player = setAge(prev, stage.age, stage.spawn);
  for (const id of prev.unlocked) player.unlocked.add(id);
  enemies = stage.enemies.map((e) => createEnemy(e, stage.groundY));
  trucks = (stage.trucks || []).map((t) => createTruck(t, stage.groundY));
  pickups = stage.pickups.map(createPickup);
  projectiles = [];
  camera.x = 0;
  trucksWrecked = 0;
  bossDown = false;
  wanted = stage.id === "village" || stage.id === "highway" ? 1 : 0;
  mode = "playing";
  player.invuln = 1.2;
  fx = createFx();
  banner(fx, "MISSION", stage.mission, "mission");
  sfx.mission();
  hidePanel();
  syncHud();
}

function starsHtml(n) {
  let s = "";
  for (let i = 1; i <= 5; i++) {
    s += `<span class="star ${i <= n ? "on" : ""}">★</span>`;
  }
  return s;
}

function syncHud() {
  hpFill.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
  ageLabel.textContent =
    player.age === "calf" ? "Calf" : player.age === "teen" ? "Juvenile" : "Bull";
  weaponName.textContent = WEAPONS[player.weapon].name;
  stageName.textContent = stage.name;
  killCountEl.textContent = `${kills} down`;
  cashEl.textContent = `$${cash.toLocaleString()}`;
  wantedEl.innerHTML = starsHtml(wanted);
  missionEl.textContent = stage.mission || "";
}

function resetGame() {
  stageIndex = 0;
  kills = 0;
  cash = 0;
  wanted = 0;
  player = createPlayer(STAGES[0].spawn, "calf");
  showPanel({
    chapter: STAGES[0].chapter,
    title: STAGES[0].title,
    body: STAGES[0].body,
    button: STAGES[0].button,
  });
  mode = "title";
}

let startLock = false;
function handleStart() {
  if (startLock) return;
  startLock = true;
  setTimeout(() => {
    startLock = false;
  }, 400);
  unlockAudio();
  startMusic();

  if (mode === "title" || mode === "stageclear") {
    loadStage(stageIndex);
  } else if (mode === "dead") {
    const kept = new Set(player.unlocked);
    for (let i = 0; i < stageIndex; i++) {
      for (const pk of STAGES[i].pickups) {
        if (pk.kind !== "heal") kept.add(pk.kind);
      }
    }
    // highway grants fire if cleared previously
    if (stageIndex > 2) kept.add("fire");
    player = createPlayer(stage.spawn, stage.age, kept);
    loadStage(stageIndex);
  } else if (mode === "win") {
    resetGame();
  }
}

startBtn.addEventListener("click", handleStart);

function bumpWanted(amount = 1) {
  const prev = wanted;
  wanted = Math.min(5, wanted + amount);
  if (wanted > prev) {
    sfx.starUp();
    if (wanted >= 3) banner(fx, "WANTED", `${wanted}★ — heat rising`, "wanted");
  }
}

function addCash(n) {
  cash += n;
}

function hurtPlayer(amount) {
  if (player.invuln > 0) return;
  player.hp -= amount;
  player.invuln = 0.85;
  player.vx = -player.facing * 140;
  sfx.hurt();
  shake(fx, 8);
  flash(fx, 0.25);
  if (player.hp <= 0) {
    mode = "dead";
    showPanel({
      chapter: "Wasted",
      title: "Herd Down",
      body: `$${cash.toLocaleString()} in the trunk. ${kills} scores settled. The ivory trade keeps rolling — unless you get back up.`,
      button: "Retry Mission",
    });
  }
  syncHud();
}

function damageEnemy(e, dmg, knock) {
  e.hp -= dmg;
  e.hurtTimer = 0.12;
  e.x += knock * 0.015;
  burst(fx, e.x + e.w / 2, e.y + e.h / 2, "#c45c2a", 8, 160);
  sfx.hit();
  if (e.hp <= 0) {
    e.alive = false;
    kills += 1;
    addCash(e.payout);
    burst(fx, e.x + e.w / 2, e.y + e.h / 2, "#e8a84a", 16, 220);
    shake(fx, 5);
    hitstop(fx, 0.04);
    if (e.type === "boss") {
      bossDown = true;
      bumpWanted(2);
      banner(fx, "TARGET DOWN", "Chief hunter eliminated", "mission");
      sfx.boom();
    } else if (e.type === "guard") {
      bumpWanted(1);
    } else {
      heatKills += 1;
      if (heatKills % 2 === 0) bumpWanted(1);
    }
  }
}

function damageTruck(tr, dmg) {
  if (!tr.alive) return;
  tr.hp -= dmg;
  burst(fx, tr.x + tr.w / 2, tr.y + 20, "#6a8a4a", 6, 120);
  if (tr.hp <= 0) {
    tr.alive = false;
    trucksWrecked += 1;
    addCash(tr.payout);
    burst(fx, tr.x + tr.w / 2, tr.y + 20, "#ff6a2a", 24, 260);
    shake(fx, 12);
    flash(fx, 0.4);
    sfx.boom();
    bumpWanted(1);
    banner(fx, "TRUCK WRECKED", `${trucksWrecked} / ${stage.goalTrucks || 3}`, "mission");
  }
}

function spawnHeat(dt) {
  if (wanted < 2 || stage.id === "clearing") return;
  heatTimer -= dt;
  if (heatTimer > 0) return;
  const alive = enemies.filter((e) => e.alive).length;
  if (alive > 10 + wanted) return;
  heatTimer = Math.max(1.8, 4.5 - wanted * 0.45);
  const x = camera.x + canvas.width + 40 + Math.random() * 80;
  enemies.push(
    createEnemy(
      {
        x: Math.min(stage.width - 60, x),
        type: wanted >= 4 ? "guard" : "hunter",
        hp: 40 + wanted * 8,
      },
      stage.groundY
    )
  );
}

function missionComplete() {
  if (stage.goalTrucks && trucksWrecked < stage.goalTrucks) return false;
  if (stage.goalBoss && !bossDown) return false;
  return player.x + player.w >= stage.goalX;
}

function advanceStage() {
  banner(fx, "MISSION PASSED", `+$${500 + stageIndex * 250} bonus`, "mission");
  addCash(500 + stageIndex * 250);
  sfx.mission();
  if (stageIndex >= STAGES.length - 1) {
    mode = "win";
    const best = Number(localStorage.getItem("gti_best") || 0);
    if (cash > best) localStorage.setItem("gti_best", String(cash));
    showPanel({
      chapter: "Epilogue",
      title: "Grand Theft Ivory",
      body: `Town's quiet. Trade's ash. ${kills} hunters retired. Bank: $${cash.toLocaleString()}. Best run: $${Math.max(cash, best).toLocaleString()}.`,
      button: "Play Again",
    });
    return;
  }
  mode = "stageclear";
  stageIndex += 1;
  const next = STAGES[stageIndex];
  showPanel({
    chapter: next.chapter,
    title: next.title,
    body: next.body,
    button: next.button,
  });
}

function update(dt) {
  if (mode !== "playing") return;
  const frozen = updateFx(fx, dt);
  if (frozen) return;

  time += dt;

  const hooks = {
    onJump: () => sfx.jump(),
    onSlam: () => {
      sfx.slam();
      shake(fx, 3);
    },
    onShoot: (_p, id) => {
      if (id === "gun") sfx.shoot();
      else if (id === "knives") sfx.knife();
      else if (id === "fire") sfx.fire();
    },
    onCharge: () => {
      sfx.charge();
      shake(fx, 4);
    },
  };

  updatePlayer(player, input, dt, stage, projectiles, hooks);

  const melee = meleeHitbox(player);
  if (melee && (player.charge > 0 || !player.slamHit)) {
    let connected = false;
    for (const e of enemies) {
      if (e.alive && aabb(melee, e)) {
        damageEnemy(e, melee.damage, player.facing * melee.knock);
        connected = true;
      }
    }
    for (const tr of trucks) {
      if (tr.alive && aabb(melee, tr)) {
        damageTruck(tr, melee.damage * 1.2);
        connected = true;
      }
    }
    if (connected && player.charge <= 0) player.slamHit = true;
  }

  for (const e of enemies) {
    if (!e.alive) continue;
    if (e.hurtTimer > 0) e.hurtTimer -= dt;
    const dx = player.x - e.x;
    e.facing = dx >= 0 ? 1 : -1;
    const aggro = 70 - wanted * 4;
    if (Math.abs(dx) > aggro) e.x += e.facing * (e.speed + wanted * 4) * dt;

    e.shootTimer -= dt * (1 + wanted * 0.08);
    if (e.shootTimer <= 0 && Math.abs(dx) < 440 + wanted * 20) {
      projectiles.push(createEnemyShot(e));
      e.shootTimer = e.type === "boss" ? 0.5 : 1.05 + Math.random() * 0.55;
    }
    if (aabb(player, e) && player.invuln <= 0) {
      hurtPlayer(e.type === "boss" ? 18 : 11 + wanted);
    }
  }

  for (const tr of trucks) {
    if (!tr.alive) continue;
    if (aabb(player, tr) && player.charge > 0) {
      damageTruck(tr, 40 * dt);
    }
  }

  for (const p of projectiles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.kind === "flame") {
      p.w += 42 * dt;
      p.h += 22 * dt;
    }
  }

  for (const p of projectiles) {
    if (p.life <= 0) continue;
    if (p.owner === "player") {
      for (const e of enemies) {
        if (e.alive && aabb(p, e)) {
          damageEnemy(e, p.damage, Math.sign(p.vx) * 150);
          if (p.kind !== "flame") p.life = 0;
        }
      }
      for (const tr of trucks) {
        if (tr.alive && aabb(p, tr)) {
          damageTruck(tr, p.damage);
          if (p.kind !== "flame") p.life = 0;
        }
      }
    } else if (aabb(p, player)) {
      hurtPlayer(p.damage);
      p.life = 0;
    }
  }
  projectiles = projectiles.filter((p) => p.life > 0);

  for (const pk of pickups) {
    if (pk.taken) continue;
    if (aabb(player, pk)) {
      pk.taken = true;
      sfx.pickup();
      if (pk.kind === "heal") {
        player.hp = Math.min(player.maxHp, player.hp + 40);
        burst(fx, pk.x, pk.y, "#3d7a4a", 10, 120);
      } else {
        player.unlocked.add(pk.kind);
        player.weapon = pk.kind;
        banner(fx, "WEAPON", WEAPONS[pk.kind].name, "mission");
        burst(fx, pk.x, pk.y, WEAPONS[pk.kind].color, 14, 160);
      }
      syncHud();
    }
  }

  spawnHeat(dt);

  // wanted slowly cools in early stages
  if (wanted > 0 && stage.id !== "village" && kills > 0) {
    // no passive cool — heat stays for drama
  }

  camera.x = Math.max(
    0,
    Math.min(stage.width - canvas.width, player.x - canvas.width * 0.35)
  );

  if (missionComplete()) advanceStage();
  syncHud();
}

function draw() {
  const off = cameraOffset(fx);
  const cam = { x: camera.x - off.x, y: camera.y - off.y };

  if (mode === "title" && stageIndex === 0 && enemies.length === 0) {
    drawWorld(ctx, STAGES[0], { x: 0, y: 0 }, time);
  } else {
    drawWorld(ctx, stage, cam, time);
    for (const pk of pickups) drawPickup(ctx, pk, cam, time);
    for (const tr of trucks) drawTruck(ctx, tr, cam, time);
    for (const e of enemies) drawEnemy(ctx, e, cam);
    for (const p of projectiles) drawProjectile(ctx, p, cam);
    if (mode === "playing" || mode === "stageclear" || mode === "dead") {
      drawElephant(ctx, player, cam);
    }
    // mission strip
    ctx.fillStyle = "rgba(10, 8, 6, 0.55)";
    ctx.fillRect(16, canvas.height - 44, canvas.width - 32, 26);
    ctx.fillStyle = "#c8b8a0";
    ctx.font = "13px Source Sans 3, sans-serif";
    ctx.textAlign = "left";
    let tip = stage.vignette || "";
    if (stage.goalTrucks) tip = `Trucks wrecked: ${trucksWrecked}/${stage.goalTrucks} — ${tip}`;
    if (stage.goalBoss) tip = bossDown ? "Boss down — reach the flag" : tip;
    ctx.fillText(tip, 28, canvas.height - 26);
  }
  drawFx(ctx, fx, cam);
}

function frame(ts) {
  const dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

bindTouchControls();
resetGame();
requestAnimationFrame(frame);
