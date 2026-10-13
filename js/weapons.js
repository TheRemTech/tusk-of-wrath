/** Trunk arsenal */

export const WEAPONS = {
  slam: {
    id: "slam",
    name: "Trunk Slam",
    starter: true,
    cooldown: 0.4,
    damage: 20,
    knockback: 260,
    color: "#c8b8a0",
  },
  knives: {
    id: "knives",
    name: "Trunk Knives",
    starter: false,
    cooldown: 0.24,
    damage: 14,
    speed: 560,
    spread: 0.1,
    color: "#d8d0c0",
    projectile: "knife",
  },
  gun: {
    id: "gun",
    name: "Machine Gun Trunk",
    starter: false,
    cooldown: 0.07,
    damage: 8,
    speed: 820,
    spread: 0.14,
    color: "#e8a84a",
    projectile: "bullet",
  },
  fire: {
    id: "fire",
    name: "Fire Breath",
    starter: false,
    cooldown: 0.5,
    damage: 24,
    speed: 360,
    life: 0.75,
    color: "#ff6a2a",
    projectile: "flame",
  },
};

export const WEAPON_ORDER = ["slam", "knives", "gun", "fire"];

export function starterWeapons() {
  return WEAPON_ORDER.filter((id) => WEAPONS[id].starter);
}
