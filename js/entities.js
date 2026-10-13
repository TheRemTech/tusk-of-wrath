import { WEAPONS } from "./weapons.js";

export function createEnemy(def, groundY) {
  const sizes = {
    hunter: { w: 28, h: 52, color: "#6a4a2a", speed: 58, payout: 120 },
    guard: { w: 32, h: 56, color: "#4a3a28", speed: 44, payout: 200 },
    boss: { w: 48, h: 74, color: "#5a2018", speed: 78, payout: 2500 },
  };
  const s = sizes[def.type] || sizes.hunter;
  return {
    x: def.x,
    y: (def.y ?? groundY - s.h),
    w: s.w,
    h: s.h,
    vx: 0,
    type: def.type,
    hp: def.hp,
    maxHp: def.hp,
    speed: s.speed,
    color: s.color,
    payout: s.payout,
    facing: -1,
    shootTimer: 0.5 + Math.random() * 0.9,
    hurtTimer: 0,
    alive: true,
  };
}

export function createTruck(def, groundY) {
  return {
    x: def.x,
    y: groundY - 52,
    w: 110,
    h: 52,
    hp: def.hp,
    maxHp: def.hp,
    alive: true,
    bob: Math.random() * 10,
    payout: 800,
  };
}

export function createPickup(def) {
  return {
    x: def.x,
    y: def.y,
    w: 28,
    h: 28,
    kind: def.kind,
    taken: false,
    bob: Math.random() * Math.PI * 2,
  };
}

export function createProjectile(from, weaponId, facing, owner = "player") {
  const w = WEAPONS[weaponId];
  const spread = (Math.random() - 0.5) * (w.spread || 0) * 2;
  const speed = w.speed || 400;
  const isFlame = w.projectile === "flame";
  return {
    x: from.x + (facing > 0 ? from.w : -10),
    y: from.y + from.h * 0.35,
    vx: Math.cos(spread) * speed * facing,
    vy: Math.sin(spread) * speed * 0.35,
    w: isFlame ? 36 : w.projectile === "knife" ? 16 : 8,
    h: isFlame ? 22 : w.projectile === "knife" ? 6 : 4,
    damage: w.damage,
    life: w.life || 1.4,
    color: w.color,
    kind: w.projectile || "bolt",
    owner,
    facing,
  };
}

export function createEnemyShot(enemy) {
  return {
    x: enemy.facing > 0 ? enemy.x + enemy.w : enemy.x - 8,
    y: enemy.y + 18,
    vx: enemy.facing * (enemy.type === "boss" ? 340 : 270),
    vy: 0,
    w: 8,
    h: 4,
    damage: enemy.type === "boss" ? 15 : 9,
    life: 2,
    color: "#e8c84a",
    kind: "bullet",
    owner: "enemy",
    facing: enemy.facing,
  };
}

export function aabb(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
