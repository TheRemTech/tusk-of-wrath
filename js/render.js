/** Richer side-scroller drawing for Grand Theft Ivory */

export function drawWorld(ctx, stage, camera, t) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const [c0, c1] = stage.sky;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c0);
  g.addColorStop(0.55, c1);
  g.addColorStop(1, "#1a120c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Sun / moon
  ctx.fillStyle = stage.theme === "jungle" ? "rgba(243,230,200,0.15)" : "rgba(232,168,74,0.35)";
  ctx.beginPath();
  ctx.arc(w * 0.78, 90, stage.theme === "road" ? 42 : 28, 0, Math.PI * 2);
  ctx.fill();

  // Far hills
  ctx.save();
  ctx.translate(-camera.x * 0.2, 0);
  for (let i = 0; i < 14; i++) {
    const hx = i * 300 - 40;
    ctx.fillStyle = stage.theme === "village" ? "#2a1814" : "#0e2418";
    ctx.beginPath();
    ctx.moveTo(hx, 340);
    ctx.quadraticCurveTo(hx + 100, 160 + (i % 3) * 25, hx + 220, 340);
    ctx.fill();
  }
  ctx.restore();

  // Mid trees / poles
  ctx.save();
  ctx.translate(-camera.x * 0.5, 0);
  if (stage.theme === "road") drawRoadProps(ctx, t);
  else drawTrees(ctx, stage, t);
  ctx.restore();

  // Ground
  const groundTop = stage.groundY - camera.y;
  if (stage.theme === "road") {
    ctx.fillStyle = "#3a342c";
    ctx.fillRect(0, groundTop, w, h - groundTop);
    ctx.fillStyle = "#4a4438";
    ctx.fillRect(0, groundTop, w, 10);
    // lane dashes in world space
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    ctx.fillStyle = "#c8b060";
    for (let x = 0; x < stage.width; x += 70) {
      ctx.fillRect(x, stage.groundY + 18, 36, 5);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = stage.theme === "village" ? "#4a3828" : "#2a4a30";
    ctx.fillRect(0, groundTop, w, h - groundTop);
    ctx.fillStyle = stage.theme === "village" ? "#5a4830" : "#3a6a40";
    ctx.fillRect(0, groundTop, w, 8);
  }

  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  for (const p of stage.platforms) {
    ctx.fillStyle = "#2e241c";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = stage.foliage;
    ctx.fillRect(p.x, p.y, p.w, 5);
    ctx.fillStyle = "rgba(243,230,200,0.08)";
    ctx.fillRect(p.x, p.y, p.w, 2);
  }

  if (stage.theme === "village") drawTown(ctx, stage, t);
  if (stage.theme === "road") drawRoadSigns(ctx, stage);

  // Goal flag
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(stage.goalX, stage.groundY - 96, 8, 96);
  ctx.fillStyle = "#e8a84a";
  ctx.beginPath();
  ctx.moveTo(stage.goalX + 8, stage.groundY - 96);
  ctx.lineTo(stage.goalX + 54, stage.groundY - 80);
  ctx.lineTo(stage.goalX + 8, stage.groundY - 64);
  ctx.fill();
  ctx.restore();
}

function drawTrees(ctx, stage, t) {
  for (let i = 0; i < 20; i++) {
    const x = i * 210 + 20;
    const sway = Math.sin(t * 1.1 + i) * 5;
    ctx.fillStyle = "#241810";
    ctx.fillRect(x + 20, 200, 18, 270);
    ctx.fillStyle = stage.foliage;
    ctx.beginPath();
    ctx.ellipse(x + 28 + sway, 195, 72, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(x - 8 + sway, 230, 52, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawRoadProps(ctx, t) {
  for (let i = 0; i < 16; i++) {
    const x = i * 260 + 40;
    ctx.fillStyle = "#5a4030";
    ctx.fillRect(x, 250, 10, 210);
    ctx.fillStyle = "#c45c2a";
    ctx.beginPath();
    ctx.moveTo(x - 8, 250);
    ctx.lineTo(x + 5, 220 + Math.sin(t + i) * 3);
    ctx.lineTo(x + 18, 250);
    ctx.fill();
  }
}

function drawRoadSigns(ctx, stage) {
  const signs = [
    { x: 800, text: "IVORY →" },
    { x: 2400, text: "NO HERDS" },
    { x: 3500, text: "CHECKPOINT" },
  ];
  for (const s of signs) {
    ctx.fillStyle = "#2a2018";
    ctx.fillRect(s.x, stage.groundY - 100, 8, 100);
    ctx.fillStyle = "#6a3a18";
    ctx.fillRect(s.x - 30, stage.groundY - 130, 90, 36);
    ctx.fillStyle = "#f3e6c8";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(s.text, s.x - 22, stage.groundY - 108);
  }
}

function drawTown(ctx, stage, t) {
  const huts = [550, 1100, 1700, 2300, 2900, 3500, 4100];
  for (let i = 0; i < huts.length; i++) {
    const x = huts[i];
    const burn = i % 3 === 0;
    ctx.fillStyle = "#6a4a2a";
    ctx.fillRect(x, stage.groundY - 78, 100, 78);
    ctx.fillStyle = burn ? "#8b1e1e" : "#7a3020";
    ctx.beginPath();
    ctx.moveTo(x - 12, stage.groundY - 78);
    ctx.lineTo(x + 50, stage.groundY - 120);
    ctx.lineTo(x + 112, stage.groundY - 78);
    ctx.fill();
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(x + 38, stage.groundY - 48, 24, 48);
    if (burn) {
      ctx.fillStyle = `rgba(255,120,40,${0.35 + Math.sin(t * 8 + i) * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(x + 50, stage.groundY - 100, 18, 28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Warehouse
  const wx = 4300;
  ctx.fillStyle = "#4a3a2a";
  ctx.fillRect(wx, stage.groundY - 130, 200, 130);
  ctx.fillStyle = "#2a2018";
  ctx.fillRect(wx + 20, stage.groundY - 90, 50, 90);
  ctx.fillRect(wx + 90, stage.groundY - 90, 50, 90);
  ctx.fillStyle = "#e8a84a";
  ctx.font = "bold 16px Bebas Neue, sans-serif";
  ctx.fillText("IVORY CO.", wx + 40, stage.groundY - 100);
}

export function drawElephant(ctx, player, camera) {
  const x = player.x - camera.x;
  const y = player.y - camera.y;
  const f = player.facing;
  if (player.invuln > 0 && Math.floor(player.invuln * 14) % 2 === 0) return;

  ctx.save();
  ctx.translate(x + player.w / 2, y + player.h / 2);
  ctx.scale(f, 1);
  if (player.charge > 0) ctx.rotate(-0.08);
  ctx.translate(-player.w / 2, -player.h / 2);

  const body =
    player.age === "adult" ? "#6e6e78" : player.age === "teen" ? "#7c7c86" : "#8e8e98";
  const shade = "#4e4e58";

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(player.w / 2, player.h - 2, player.w * 0.38, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // body
  ctx.fillStyle = body;
  roundRect(ctx, 6, 10, player.w - 14, player.h - 16, 12);
  ctx.fill();

  // head
  ctx.beginPath();
  ctx.ellipse(player.w - 4, 15, 17, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // ear
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.ellipse(player.w - 24, 13, 13, 17, -0.35, 0, Math.PI * 2);
  ctx.fill();

  // trunk
  ctx.strokeStyle = shade;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  const swing = Math.sin(player.anim) * (player.charge > 0 ? 2 : 7);
  ctx.beginPath();
  ctx.moveTo(player.w + 6, 20);
  ctx.quadraticCurveTo(player.w + 26, 30 + swing, player.w + 20, 44 + swing * 0.4);
  ctx.stroke();

  if (player.age !== "calf") {
    ctx.strokeStyle = "#f3e6c8";
    ctx.lineWidth = player.age === "adult" ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(player.w + 2, 24);
    ctx.lineTo(player.w + 18, 36);
    ctx.stroke();
    if (player.age === "adult") {
      ctx.beginPath();
      ctx.moveTo(player.w, 26);
      ctx.lineTo(player.w + 14, 38);
      ctx.stroke();
    }
  }

  // legs
  ctx.fillStyle = shade;
  const gait = Math.sin(player.anim) * 5;
  ctx.fillRect(12, player.h - 14, 11, 14 + (player.onGround ? gait : 0));
  ctx.fillRect(player.w - 30, player.h - 14, 11, 14 - (player.onGround ? gait : 0));

  // eye
  ctx.fillStyle = "#1a1410";
  ctx.beginPath();
  ctx.arc(player.w + 4, 11, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8a84a";
  ctx.beginPath();
  ctx.arc(player.w + 5, 10.5, 1, 0, Math.PI * 2);
  ctx.fill();

  // charge dust
  if (player.charge > 0) {
    ctx.fillStyle = "rgba(200,180,140,0.45)";
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(-8 - i * 10, player.h - 8 + (i % 2) * 3, 8, 4);
    }
  }

  ctx.restore();

  if (player.slamFlash > 0) {
    const reach = 62;
    const hx = player.facing > 0 ? player.x + player.w - 8 : player.x - reach + 8;
    ctx.fillStyle = `rgba(232, 168, 74, ${player.slamFlash * 2.2})`;
    ctx.fillRect(hx - camera.x, player.y + 8 - camera.y, reach, player.h - 12);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawEnemy(ctx, e, camera) {
  if (!e.alive) return;
  const x = e.x - camera.x;
  const y = e.y - camera.y;
  ctx.save();
  ctx.translate(x + e.w / 2, y);
  ctx.scale(e.facing, 1);
  ctx.translate(-e.w / 2, 0);

  ctx.fillStyle = e.hurtTimer > 0 ? "#c45c2a" : e.color;
  ctx.fillRect(2, 10, e.w - 4, e.h - 10);
  ctx.fillStyle = e.type === "boss" ? "#8b1e1e" : "#2a2018";
  ctx.fillRect(4, 0, e.w - 8, 14);
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(e.w - 2, 22, 30, 4);
  if (e.type === "boss") {
    ctx.fillStyle = "#e8a84a";
    ctx.fillRect(6, 18, e.w - 12, 6);
  }
  ctx.restore();

  if (e.hp < e.maxHp) {
    ctx.fillStyle = "#2a2018";
    ctx.fillRect(x, y - 9, e.w, 4);
    ctx.fillStyle = "#c45c2a";
    ctx.fillRect(x, y - 9, e.w * (e.hp / e.maxHp), 4);
  }
}

export function drawTruck(ctx, tr, camera, t) {
  if (!tr.alive) return;
  const x = tr.x - camera.x;
  const y = tr.y - camera.y + Math.sin(t * 2 + tr.bob) * 1.5;
  ctx.fillStyle = "#3a4a38";
  ctx.fillRect(x, y + 12, tr.w, tr.h - 12);
  ctx.fillStyle = "#2a3028";
  ctx.fillRect(x + 8, y, 44, 22);
  ctx.fillStyle = "#1a1410";
  ctx.beginPath();
  ctx.arc(x + 22, y + tr.h - 4, 10, 0, Math.PI * 2);
  ctx.arc(x + tr.w - 22, y + tr.h - 4, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f3e6c8";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("IVORY", x + 58, y + 32);
  ctx.fillStyle = "#2a2018";
  ctx.fillRect(x, y - 8, tr.w, 5);
  ctx.fillStyle = "#c45c2a";
  ctx.fillRect(x, y - 8, tr.w * (tr.hp / tr.maxHp), 5);
}

export function drawProjectile(ctx, p, camera) {
  const x = p.x - camera.x;
  const y = p.y - camera.y;
  if (p.kind === "flame") {
    const alpha = Math.min(1, p.life * 1.4);
    ctx.fillStyle = `rgba(255, 100, 30, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, p.w * 0.6, p.h * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 200, 60, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.ellipse(x - p.facing * 6, y, p.w * 0.3, p.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === "knife") {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p.facing > 0 ? 0.2 : Math.PI - 0.2);
    ctx.fillStyle = p.color;
    ctx.fillRect(0, -2, 16, 4);
    ctx.fillStyle = "#8b1e1e";
    ctx.fillRect(12, -3, 6, 6);
    ctx.restore();
  } else {
    ctx.fillStyle = p.color;
    ctx.fillRect(x, y, p.w, p.h);
  }
}

export function drawPickup(ctx, p, camera, t) {
  if (p.taken) return;
  const bob = Math.sin(t * 3 + p.bob) * 5;
  const x = p.x - camera.x;
  const y = p.y - camera.y + bob;
  const colors = {
    knives: "#d8d0c0",
    gun: "#e8a84a",
    fire: "#ff6a2a",
    heal: "#3d7a4a",
  };
  ctx.fillStyle = "rgba(243,230,200,0.15)";
  ctx.beginPath();
  ctx.arc(x + 14, y + 14, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors[p.kind] || "#f3e6c8";
  ctx.fillRect(x, y, p.w, p.h);
  ctx.fillStyle = "#1a1410";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  const label = { knives: "K", gun: "G", fire: "F", heal: "+" }[p.kind] || "?";
  ctx.fillText(label, x + p.w / 2, y + 18);
  ctx.textAlign = "left";
}
