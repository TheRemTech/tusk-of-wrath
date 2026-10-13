import { STAGES } from "./levels.js";
import { WEAPONS } from "./weapons.js";
import {
  createEnemy,
  createPickup,
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
  drawProjectile,
  drawPickup,
  drawVignette,
} from "./render.js";

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

const input = {
  left: false,
  right: false,
  jump: false,
  attack: false,
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

let mode = "title"; // title | playing | stageclear | dead | win
let stageIndex = 0;
let stage = STAGES[0];
let player = createPlayer(stage.spawn, stage.age);
let enemies = [];
let pickups = [];
let projectiles = [];
let camera = { x: 0, y: 0 };
let kills = 0;
let time = 0;
let last = 0;

function showPanel({ chapter, title, body, button }) {
  panelEyebrow.textContent = chapter;
  panelTitle.textContent = title;
  panelBody.textContent = body;
  startBtn.textContent = button;
  overlay.classList.remove("hidden");
  hud.classList.add("hidden");
  hud.setAttribute("aria-hidden", "true");
}

function hidePanel() {
  overlay.classList.add("hidden");
  hud.classList.remove("hidden");
  hud.setAttribute("aria-hidden", "false");
}

function loadStage(index) {
  stageIndex = index;
  stage = STAGES[index];
  const prev = player;
  player = setAge(prev, stage.age, stage.spawn);
  // Carry unlocks from pickups across stages
  for (const id of prev.unlocked) player.unlocked.add(id);
  if (player.unlocked.has("fire")) player.weapon = player.weapon;
  enemies = stage.enemies.map((e) => createEnemy(e, stage.groundY));
  pickups = stage.pickups.map(createPickup);
  projectiles = [];
  camera.x = 0;
  mode = "playing";
  hidePanel();
  syncHud();
}

function syncHud() {
  hpFill.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
  ageLabel.textContent =
    player.age === "calf" ? "Calf" : player.age === "teen" ? "Juvenile" : "Bull";
  weaponName.textContent = WEAPONS[player.weapon].name;
  stageName.textContent = stage.name;
  killCountEl.textContent = `${kills} fallen`;
}

function resetGame() {
  stageIndex = 0;
  kills = 0;
  player = createPlayer(STAGES[0].spawn, "calf");
  showPanel({
    chapter: STAGES[0].chapter,
    title: STAGES[0].title,
    body: STAGES[0].body,
    button: STAGES[0].button,
  });
  mode = "title";
}

startBtn.addEventListener("click", () => {
  if (mode === "title" || mode === "stageclear") {
    loadStage(stageIndex);
  } else if (mode === "dead") {
    // Retry stage; keep weapons earned in earlier chapters
    const kept = new Set(player.unlocked);
    // Re-grant staged story pickups from completed stages only
    for (let i = 0; i < stageIndex; i++) {
      for (const pk of STAGES[i].pickups) {
        if (pk.kind !== "heal") kept.add(pk.kind);
      }
    }
    player = createPlayer(stage.spawn, stage.age, kept);
    loadStage(stageIndex);
  } else if (mode === "win") {
    resetGame();
  }
});

function hurtPlayer(amount) {
  if (player.invuln > 0) return;
  player.hp -= amount;
  player.invuln = 0.85;
  player.vx = -player.facing * 120;
  if (player.hp <= 0) {
    mode = "dead";
    showPanel({
      chapter: "Fallen",
      title: "The Herd Remembers",
      body: "You collapse in the dirt. The ivory trade does not pause. Rise again.",
      button: "Retry Stage",
    });
  }
  syncHud();
}

function update(dt) {
  if (mode !== "playing") return;
  time += dt;

  updatePlayer(player, input, dt, stage, projectiles);

  // Melee resolve
  const melee = meleeHitbox(player);
  if (melee) {
    for (const e of enemies) {
      if (e.alive && aabb(melee, e)) {
        damageEnemy(e, WEAPONS.slam.damage, player.facing * WEAPONS.slam.knockback);
      }
    }
  }

  // Enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    if (e.hurtTimer > 0) e.hurtTimer -= dt;

    const dx = player.x - e.x;
    e.facing = dx >= 0 ? 1 : -1;
    if (Math.abs(dx) > 80) {
      e.x += e.facing * e.speed * dt;
    }

    e.shootTimer -= dt;
    if (e.shootTimer <= 0 && Math.abs(dx) < 420) {
      projectiles.push(createEnemyShot(e));
      e.shootTimer = e.type === "boss" ? 0.55 : 1.1 + Math.random() * 0.6;
    }

    if (aabb(player, e) && player.invuln <= 0) {
      hurtPlayer(e.type === "boss" ? 18 : 12);
    }
  }

  // Projectiles
  for (const p of projectiles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.kind === "flame") {
      p.w += 40 * dt;
      p.h += 20 * dt;
    }
  }

  for (const p of projectiles) {
    if (p.life <= 0) continue;
    if (p.owner === "player") {
      for (const e of enemies) {
        if (e.alive && aabb(p, e)) {
          damageEnemy(e, p.damage, Math.sign(p.vx) * 140);
          if (p.kind !== "flame") p.life = 0;
        }
      }
    } else if (aabb(p, player)) {
      hurtPlayer(p.damage);
      p.life = 0;
    }
  }
  projectiles = projectiles.filter((p) => p.life > 0);

  // Pickups
  for (const pk of pickups) {
    if (pk.taken) continue;
    if (aabb(player, pk)) {
      pk.taken = true;
      if (pk.kind === "heal") {
        player.hp = Math.min(player.maxHp, player.hp + 35);
      } else {
        player.unlocked.add(pk.kind);
        player.weapon = pk.kind;
      }
      syncHud();
    }
  }

  // Camera
  camera.x = Math.max(
    0,
    Math.min(stage.width - canvas.width, player.x - canvas.width * 0.35)
  );

  // Goal
  if (player.x + player.w >= stage.goalX) {
    advanceStage();
  }

  syncHud();
}

function damageEnemy(e, dmg, knock) {
  e.hp -= dmg;
  e.hurtTimer = 0.12;
  e.x += knock * 0.02;
  if (e.hp <= 0) {
    e.alive = false;
    kills += 1;
  }
}

function advanceStage() {
  if (stageIndex >= STAGES.length - 1) {
    mode = "win";
    showPanel({
      chapter: "Epilogue",
      title: "Tusk of Wrath",
      body: `The village that traded in ivory falls silent. ${kills} hunters will not hunt again. The calf who ran is gone — only the bull remains.`,
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

function draw() {
  // Always paint a frame (menu still shows last world or title sky)
  if (mode === "title" && stageIndex === 0 && enemies.length === 0) {
    drawWorld(ctx, STAGES[0], { x: 0, y: 0 }, time);
  } else {
    drawWorld(ctx, stage, camera, time);
    for (const pk of pickups) drawPickup(ctx, pk, camera, time);
    for (const e of enemies) drawEnemy(ctx, e, camera);
    for (const p of projectiles) drawProjectile(ctx, p, camera);
    if (mode === "playing" || mode === "stageclear" || mode === "dead") {
      drawElephant(ctx, player, camera);
    }
    drawVignette(ctx, stage.vignette);
  }
}

function frame(ts) {
  const dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

resetGame();
requestAnimationFrame(frame);
