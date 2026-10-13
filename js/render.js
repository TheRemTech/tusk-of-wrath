/** Canvas drawing for jungle / village side-scroller */

export function drawWorld(ctx, stage, camera, t) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const [c0, c1] = stage.sky;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Parallax canopy / hills
  ctx.save();
  ctx.translate(-camera.x * 0.25, 0);
  for (let i = 0; i < 12; i++) {
    const hx = i * 280 + 40;
    ctx.fillStyle = stage.id === "village" ? "#3a2818" : "#143024";
    ctx.beginPath();
    ctx.moveTo(hx, 320);
    ctx.quadraticCurveTo(hx + 90, 180 + Math.sin(i) * 30, hx + 200, 320);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(-camera.x * 0.55, 0);
  drawTrees(ctx, stage, t);
  ctx.restore();

  // Ground strip
  ctx.fillStyle = stage.id === "village" ? "#4a3828" : "#2a4a30";
  ctx.fillRect(0, stage.groundY - camera.y, w, h - (stage.groundY - camera.y));
  ctx.fillStyle = stage.id === "village" ? "#5a4830" : "#3a6a40";
  ctx.fillRect(0, stage.groundY - camera.y, w, 8);

  // Platforms in world space
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  for (const p of stage.platforms) {
    ctx.fillStyle = "#3a2e22";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = stage.foliage;
    ctx.fillRect(p.x, p.y, p.w, 4);
  }

  if (stage.id === "village") {
    drawHuts(ctx, stage);
  }

  // Goal marker
  ctx.fillStyle = "#e8a84a";
  ctx.fillRect(stage.goalX, stage.groundY - 90, 10, 90);
  ctx.beginPath();
  ctx.moveTo(stage.goalX + 10, stage.groundY - 90);
  ctx.lineTo(stage.goalX + 50, stage.groundY - 75);
  ctx.lineTo(stage.goalX + 10, stage.groundY - 60);
  ctx.fill();
  ctx.restore();
}

function drawTrees(ctx, stage, t) {
  for (let i = 0; i < 18; i++) {
    const x = i * 220 + 30;
    const sway = Math.sin(t * 1.2 + i) * 4;
    ctx.fillStyle = "#2a1e14";
    ctx.fillRect(x + 18, 220, 16, 250);
    ctx.fillStyle = stage.foliage;
    ctx.beginPath();
    ctx.ellipse(x + 26 + sway, 210, 70, 55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - 10 + sway, 240, 50, 40, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHuts(ctx, stage) {
  const huts = [600, 1200, 1900, 2500, 3100];
  for (const x of huts) {
    ctx.fillStyle = "#6a4a2a";
    ctx.fillRect(x, stage.groundY - 70, 90, 70);
    ctx.fillStyle = "#8b1e1e";
    ctx.beginPath();
    ctx.moveTo(x - 10, stage.groundY - 70);
    ctx.lineTo(x + 45, stage.groundY - 110);
    ctx.lineTo(x + 100, stage.groundY - 70);
    ctx.fill();
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(x + 35, stage.groundY - 40, 22, 40);
  }
}

export function drawElephant(ctx, player, camera) {
  const x = player.x - camera.x;
  const y = player.y - camera.y;
  const f = player.facing;
  const blink = player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0;
  if (blink) return;

  ctx.save();
  ctx.translate(x + player.w / 2, y + player.h / 2);
  ctx.scale(f, 1);
  ctx.translate(-player.w / 2, -player.h / 2);

  // Body
  ctx.fillStyle = player.age === "adult" ? "#6a6a72" : player.age === "teen" ? "#7a7a82" : "#8a8a94";
  roundRect(ctx, 8, 10, player.w - 16, player.h - 14, 10);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.ellipse(player.w - 6, 16, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ear
  ctx.fillStyle = "#5a5a64";
  ctx.beginPath();
  ctx.ellipse(player.w - 22, 14, 12, 16, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  ctx.strokeStyle = "#5a5a64";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  const trunkSwing = Math.sin(player.anim) * 6;
  ctx.beginPath();
  ctx.moveTo(player.w + 4, 20);
  ctx.quadraticCurveTo(
    player.w + 22,
    28 + trunkSwing,
    player.w + 18,
    42 + trunkSwing * 0.5
  );
  ctx.stroke();

  // Tusks (teen+)
  if (player.age !== "calf") {
    ctx.strokeStyle = "#f3e6c8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.w + 2, 24);
    ctx.lineTo(player.w + 16, 34);
    ctx.stroke();
  }

  // Legs
  ctx.fillStyle = "#5a5a64";
  const gait = Math.sin(player.anim) * 4;
  ctx.fillRect(14, player.h - 12, 10, 12 + (player.onGround ? gait : 0));
  ctx.fillRect(player.w - 28, player.h - 12, 10, 12 - (player.onGround ? gait : 0));

  // Eye
  ctx.fillStyle = "#1a1410";
  ctx.beginPath();
  ctx.arc(player.w + 2, 12, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Slam flash
  if (player.slamFlash > 0) {
    const reach = 58;
    const hx = player.facing > 0 ? player.x + player.w - 8 : player.x - reach + 8;
    ctx.fillStyle = `rgba(200, 180, 140, ${player.slamFlash * 2})`;
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
  ctx.fillRect(0, 8, e.w, e.h - 8);
  ctx.fillStyle = "#2a2018";
  ctx.fillRect(4, 0, e.w - 8, 14);
  // Rifle
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(e.w - 4, 22, 28, 4);
  ctx.restore();

  // HP pip
  if (e.hp < e.maxHp) {
    ctx.fillStyle = "#2a2018";
    ctx.fillRect(x, y - 8, e.w, 4);
    ctx.fillStyle = "#c45c2a";
    ctx.fillRect(x, y - 8, e.w * (e.hp / e.maxHp), 4);
  }
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
  ctx.fillStyle = colors[p.kind] || "#f3e6c8";
  ctx.fillRect(x, y, p.w, p.h);
  ctx.strokeStyle = "rgba(243, 230, 200, 0.5)";
  ctx.strokeRect(x + 0.5, y + 0.5, p.w - 1, p.h - 1);
  ctx.fillStyle = "#1a1410";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  const label = { knives: "K", gun: "G", fire: "F", heal: "+" }[p.kind] || "?";
  ctx.fillText(label, x + p.w / 2, y + 18);
}

export function drawVignette(ctx, text) {
  if (!text) return;
  ctx.fillStyle = "rgba(10, 8, 6, 0.55)";
  ctx.fillRect(20, ctx.canvas.height - 48, ctx.canvas.width - 40, 28);
  ctx.fillStyle = "#c8b8a0";
  ctx.font = "14px 'Source Sans 3', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(text, 32, ctx.canvas.height - 28);
}
