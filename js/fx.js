/** Particles, screen shake, mission banners */

export function createFx() {
  return {
    particles: [],
    shake: 0,
    hitstop: 0,
    banners: [],
    flash: 0,
  };
}

export function shake(fx, amount = 6) {
  fx.shake = Math.max(fx.shake, amount);
}

export function hitstop(fx, t = 0.05) {
  fx.hitstop = Math.max(fx.hitstop, t);
}

export function flash(fx, a = 0.35) {
  fx.flash = Math.max(fx.flash, a);
}

export function burst(fx, x, y, color, count = 10, speed = 180) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.4 + Math.random() * 0.8);
    fx.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 40,
      life: 0.35 + Math.random() * 0.35,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

export function banner(fx, title, sub = "", style = "mission") {
  fx.banners.push({
    title,
    sub,
    style,
    life: 2.4,
    max: 2.4,
  });
}

export function updateFx(fx, dt) {
  if (fx.hitstop > 0) {
    fx.hitstop -= dt;
    return true; // frozen
  }
  if (fx.shake > 0) fx.shake = Math.max(0, fx.shake - dt * 28);
  if (fx.flash > 0) fx.flash = Math.max(0, fx.flash - dt * 1.8);

  for (const p of fx.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 420 * dt;
    p.life -= dt;
  }
  fx.particles = fx.particles.filter((p) => p.life > 0);

  for (const b of fx.banners) b.life -= dt;
  fx.banners = fx.banners.filter((b) => b.life > 0);
  return false;
}

export function drawFx(ctx, fx, camera) {
  for (const p of fx.particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - camera.x, p.y - camera.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(255, 220, 160, ${fx.flash})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  for (const b of fx.banners) {
    const k = b.life / b.max;
    const alpha = Math.min(1, k * 3, (1 - k) * 4 + 0.2);
    const y = 120 + (1 - Math.min(1, (b.max - b.life) * 3)) * -20;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = b.style === "wanted" ? "rgba(120, 20, 20, 0.85)" : "rgba(10, 40, 24, 0.88)";
    ctx.fillRect(ctx.canvas.width * 0.15, y, ctx.canvas.width * 0.7, 70);
    ctx.strokeStyle = b.style === "wanted" ? "#e8a84a" : "#5dca7a";
    ctx.lineWidth = 3;
    ctx.strokeRect(ctx.canvas.width * 0.15, y, ctx.canvas.width * 0.7, 70);
    ctx.fillStyle = "#f3e6c8";
    ctx.font = "700 28px Bebas Neue, Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(b.title, ctx.canvas.width / 2, y + 34);
    ctx.font = "14px Source Sans 3, sans-serif";
    ctx.fillStyle = "#c8b8a0";
    ctx.fillText(b.sub, ctx.canvas.width / 2, y + 56);
    ctx.restore();
  }
}

export function cameraOffset(fx) {
  if (fx.shake <= 0) return { x: 0, y: 0 };
  return {
    x: (Math.random() - 0.5) * fx.shake * 2,
    y: (Math.random() - 0.5) * fx.shake * 2,
  };
}
