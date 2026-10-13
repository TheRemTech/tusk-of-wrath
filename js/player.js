import { WEAPON_ORDER, starterWeapons } from "./weapons.js";
import { createProjectile } from "./entities.js";

export function createPlayer(spawn, age = "calf", unlocked) {
  const scale = age === "calf" ? 0.72 : age === "teen" ? 0.92 : 1.12;
  const baseW = 56;
  const baseH = 46;
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
    maxHp: age === "adult" ? 130 : 100,
    age,
    weapon: "slam",
    unlocked: new Set(unlocked ?? starterWeapons()),
    cooldown: 0,
    invuln: 0,
    slamFlash: 0,
    slamHit: false,
    charge: 0,
    chargeCool: 0,
    anim: 0,
  };
}

export function setAge(player, age, spawn) {
  const next = createPlayer(spawn, age, player.unlocked);
  next.hp = Math.min(player.hp + 30, next.maxHp);
  if (!next.unlocked.has(next.weapon)) {
    next.weapon = [...next.unlocked][0] || "slam";
  }
  return next;
}

export function updatePlayer(player, input, dt, stage, projectiles, hooks = {}) {
  const speed = player.age === "calf" ? 220 : player.age === "teen" ? 250 : 280;
  const jump = player.age === "calf" ? 430 : 470;

  if (player.charge > 0) {
    player.charge -= dt;
    player.vx = player.facing * (520 + (player.age === "adult" ? 80 : 0));
    player.vy = Math.min(player.vy, 200);
    if (hooks.onChargeFrame) hooks.onChargeFrame(player);
  } else {
    let move = 0;
    if (input.left) move -= 1;
    if (input.right) move += 1;
    player.vx = move * speed;
    if (move !== 0) player.facing = move;

    if (input.jump && player.onGround) {
      player.vy = -jump;
      player.onGround = false;
      hooks.onJump?.(player);
    }

    if (input.charge && player.chargeCool <= 0 && player.age !== "calf") {
      player.charge = 0.32;
      player.chargeCool = 1.1;
      player.invuln = Math.max(player.invuln, 0.2);
      hooks.onCharge?.(player);
    }
  }

  player.vy += 1450 * dt;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.onGround = false;
  if (player.y + player.h >= stage.groundY) {
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
  if (player.y > stage.groundY + 80) player.hp = 0;

  if (player.cooldown > 0) player.cooldown -= dt;
  if (player.invuln > 0) player.invuln -= dt;
  if (player.slamFlash > 0) player.slamFlash -= dt;
  if (player.chargeCool > 0) player.chargeCool -= dt;
  player.anim += dt * (Math.abs(player.vx) > 10 ? 12 : 3);

  for (let i = 0; i < WEAPON_ORDER.length; i++) {
    if (input.weapon[i] && player.unlocked.has(WEAPON_ORDER[i])) {
      player.weapon = WEAPON_ORDER[i];
    }
  }

  if (input.attack && player.cooldown <= 0 && player.charge <= 0) {
    fireWeapon(player, projectiles, hooks);
  }
}

function fireWeapon(player, projectiles, hooks) {
  const id = player.weapon;
  if (id === "slam") {
    player.cooldown = 0.4;
    player.slamFlash = 0.18;
    player.slamHit = false;
    hooks.onSlam?.(player);
    return;
  }
  projectiles.push(createProjectile(player, id, player.facing, "player"));
  const cds = { knives: 0.24, gun: 0.07, fire: 0.5 };
  player.cooldown = cds[id] || 0.3;
  hooks.onShoot?.(player, id);
}

export function meleeHitbox(player) {
  if (player.charge > 0) {
    return {
      x: player.facing > 0 ? player.x + player.w * 0.4 : player.x - 40,
      y: player.y + 6,
      w: 70,
      h: player.h - 8,
      damage: 28,
      knock: 380,
    };
  }
  if (!player.slamFlash || player.slamFlash <= 0) return null;
  const reach = 62;
  return {
    x: player.facing > 0 ? player.x + player.w - 8 : player.x - reach + 8,
    y: player.y + 8,
    w: reach,
    h: player.h - 12,
    damage: 20,
    knock: 260,
  };
}
