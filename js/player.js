import { WEAPON_ORDER, starterWeapons } from "./weapons.js";
import { createProjectile } from "./entities.js";

export function createPlayer(spawn, age = "calf", unlocked) {
  const scale = age === "calf" ? 0.72 : age === "teen" ? 0.9 : 1.08;
  const baseW = 54;
  const baseH = 44;
  const gear = new Set(unlocked ?? starterWeapons());
  return {
    x: spawn.x,
    y: spawn.y,
    w: baseW * scale,
    h: baseH * scale,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    hp: 100,
    maxHp: 100,
    age,
    weapon: "slam",
    unlocked: gear,
    cooldown: 0,
    invuln: 0,
    slamFlash: 0,
    anim: 0,
  };
}

export function setAge(player, age, spawn) {
  const next = createPlayer(spawn, age, player.unlocked);
  next.hp = Math.min(player.hp + 25, next.maxHp);
  if (!next.unlocked.has(next.weapon)) {
    next.weapon = [...next.unlocked][0] || "slam";
  }
  return next;
}

export function updatePlayer(player, input, dt, stage, projectiles) {
  const speed = player.age === "calf" ? 210 : player.age === "teen" ? 240 : 265;
  const jump = player.age === "calf" ? 420 : 460;

  let move = 0;
  if (input.left) move -= 1;
  if (input.right) move += 1;
  player.vx = move * speed;
  if (move !== 0) player.facing = move;

  if (input.jump && player.onGround) {
    player.vy = -jump;
    player.onGround = false;
  }

  player.vy += 1400 * dt;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Ground + platforms
  player.onGround = false;
  const feet = player.y + player.h;
  if (feet >= stage.groundY) {
    player.y = stage.groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  }
  for (const p of stage.platforms) {
    const wasAbove = player.y + player.h - player.vy * dt <= p.y + 4;
    if (
      wasAbove &&
      player.vy >= 0 &&
      player.x + player.w > p.x &&
      player.x < p.x + p.w &&
      player.y + player.h >= p.y &&
      player.y + player.h <= p.y + p.h + 16
    ) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  player.x = Math.max(0, Math.min(stage.width - player.w, player.x));
  if (player.y > stage.groundY + 80) {
    player.hp = 0;
  }

  if (player.cooldown > 0) player.cooldown -= dt;
  if (player.invuln > 0) player.invuln -= dt;
  if (player.slamFlash > 0) player.slamFlash -= dt;
  player.anim += dt * (Math.abs(player.vx) > 10 ? 10 : 3);

  // Weapon select
  for (let i = 0; i < WEAPON_ORDER.length; i++) {
    if (input.weapon[i] && player.unlocked.has(WEAPON_ORDER[i])) {
      player.weapon = WEAPON_ORDER[i];
    }
  }

  if (input.attack && player.cooldown <= 0) {
    fireWeapon(player, projectiles);
  }
}

function fireWeapon(player, projectiles) {
  const id = player.weapon;
  if (id === "slam") {
    player.cooldown = 0.45;
    player.slamFlash = 0.18;
    player._melee = true;
    return;
  }
  const count = id === "gun" ? 1 : id === "knives" ? 1 : 1;
  for (let i = 0; i < count; i++) {
    projectiles.push(createProjectile(player, id, player.facing, "player"));
  }
  const cds = { knives: 0.28, gun: 0.08, fire: 0.55 };
  player.cooldown = cds[id] || 0.3;
}

export function meleeHitbox(player) {
  if (!player.slamFlash || player.slamFlash <= 0) return null;
  const reach = 58;
  return {
    x: player.facing > 0 ? player.x + player.w - 8 : player.x - reach + 8,
    y: player.y + 8,
    w: reach,
    h: player.h - 12,
  };
}
