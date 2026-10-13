/** Trunk weapon definitions for Tusk of Wrath */

export const WEAPONS = {
  slam: {
    id: "slam",
    name: "Trunk Slam",
    starter: true,
    cooldown: 0.45,
    damage: 18,
    range: 58,
    knockback: 220,
    color: "#c8b8a0",
  },
  knives: {
    id: "knives",
    name: "Trunk Knives",
    starter: false,
    cooldown: 0.28,
    damage: 12,
    speed: 520,
    spread: 0.08,
    color: "#d8d0c0",
    projectile: "knife",
  },
  gun: {
    id: "gun",
    name: "Machine Gun Trunk",
    starter: false,
    cooldown: 0.08,
    damage: 7,
    speed: 780,
    spread: 0.12,
    color: "#e8a84a",
    projectile: "bullet",
  },
  fire: {
    id: "fire",
    name: "Fire Breath",
    starter: false,
    cooldown: 0.55,
    damage: 22,
    speed: 340,
    life: 0.7,
    color: "#ff6a2a",
    projectile: "flame",
  },
};

export const WEAPON_ORDER = ["slam", "knives", "gun", "fire"];

export function starterWeapons() {
  return WEAPON_ORDER.filter((id) => WEAPONS[id].starter);
}
