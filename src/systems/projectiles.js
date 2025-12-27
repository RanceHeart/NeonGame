// src/systems/projectiles.js
function clamp(v, a, b) {
  if (v < a) return a;
  if (v > b) return b;
  return v;
}

function normAngleDiff(d) {
  while (d < -Math.PI) d += Math.PI * 2;
  while (d > Math.PI) d -= Math.PI * 2;
  return d;
}

export function createProjectileSystem() {
  const list = [];

  function spawn(p) {
    list.push({ ...p });
  }

  function updateRifle(g, p) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    if (p.life <= 0) {
      p.dead = true;
      return;
    }
    g.spawn.particle({
      type: 'beam_trail',
      x: p.x,
      y: p.y,
      color: p.color,
      size: p.width * 0.8,
      decay: 0.1,
      vx: 0,
      vy: 0,
    });
  }

  function updateFunnelBeam(g, p) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    if (p.life <= 0) p.dead = true;
  }

  function createMissileExplosion(g, p) {
    const isBig = p.marute;
    g.spawn.particle({
      type: 'explosion',
      x: p.x,
      y: p.y,
      color: p.color,
      size: isBig ? 60 : 30,
      decay: isBig ? 0.05 : 0.1,
    });
    g.spawn.particle({
      type: 'shockwave',
      x: p.x,
      y: p.y,
      color: '#fff',
      size: 10,
      maxSize: isBig ? 100 : 50,
      life: 0.4,
      width: 4,
    });
    g.camera.addShake(isBig ? 5 : 2);
  }

  function updateMissile(g, p) {
    p.life -= 1;
    if (p.life <= 0) {
      p.dead = true;
      createMissileExplosion(g, p);
      return;
    }

    if (p.state === 'EJECT') {
      p.timer -= 1;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.vy += 0.2;
      if (p.timer <= 0) {
        p.state = 'TRACK';
        p.speed = 3;
        g.spawn.particle({
          type: 'explosion',
          x: p.x,
          y: p.y,
          color: '#fff',
          size: 8,
          decay: 0.2,
        });
      }
    } else {
      if (p.speed < p.maxSpeed) p.speed += 0.8;
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const targetAngle = Math.atan2(dy, dx);
      const currentAngle = Math.atan2(p.vy, p.vx);
      let turnRate = 0.08 + p.speed * 0.005;
      if (p.marute) turnRate *= 1.5;
      const wobble = Math.sin(g.time.frame * 0.2) * 0.1;
      const biased = targetAngle + wobble + p.curveBias;
      let diff = normAngleDiff(biased - currentAngle);
      const nextAngle = currentAngle + diff * turnRate;
      p.vx = Math.cos(nextAngle) * p.speed;
      p.vy = Math.sin(nextAngle) * p.speed;
      p.angle = nextAngle;
      p.curveBias *= 0.95;
    }
    p.x += p.vx;
    p.y += p.vy;
    if (g.time.frame % 2 === 0 || p.marute) {
      g.spawn.particle({
        type: 'gn_smoke',
        x: p.x,
        y: p.y,
        color: p.color,
        size: p.marute ? 6 : 4,
        decay: 0.03,
      });
    }
    const hitDist = Math.hypot(p.tx - p.x, p.ty - p.y);
    if (hitDist < 50) {
      p.dead = true;
      createMissileExplosion(g, p);
    }
  }

  function updateRailgunBeam(g, p) {
    p.life -= 1;
    if (p.life <= 0) p.dead = true;
    if (p.isSustained && Math.random() > 0.3) {
      const t = Math.random();
      const bx = p.x + (p.tx - p.x) * t;
      const by = p.y + (p.ty - p.y) * t;
      const perpX = p.ty - p.y;
      const perpY = -(p.tx - p.x);
      const len = Math.hypot(perpX, perpY);
      const nx = perpX / len;
      const ny = perpY / len;
      const offset = (Math.random() - 0.5) * p.width * 1.8;
      // 注意：这里粒子系统现在统一用大写 type，这里要改一下或者让 spawn 自动处理
      g.spawn.particle({
        type: 'ELECTRIC_ARC',
        x: bx + nx * offset,
        y: by + ny * offset,
        color: p.color,
        size: p.width * 0.6,
      });
    }
  }

  function update(g) {
    for (const p of list) {
      if (p.dead) continue;
      if (p.type === 'rifle') updateRifle(g, p);
      else if (p.type === 'funnel_beam') updateFunnelBeam(g, p);
      else if (p.type === 'missile') updateMissile(g, p);
      else if (p.type === 'railgun_beam') updateRailgunBeam(g, p);
      // 注意：scissor_slash 不需要 update 逻辑，只需要存在即可
      else {
        p.x += p.vx || 0;
        p.y += p.vy || 0;
        p.life = (p.life || 60) - 1;
        if (p.life <= 0) p.dead = true;
      }
      if (
        p.type !== 'railgun_beam' &&
        (p.x < -200 ||
          p.x > g.screen.w + 200 ||
          p.y < -200 ||
          p.y > g.screen.h + 200)
      ) {
        p.dead = true;
      }
    }
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].dead) list.splice(i, 1);
    }
  }

  function render(g) {
    const ctx = g.ctx2d.main;

    for (const p of list) {
      // === ⚡️ 修复 1: 隐藏 Scissor 的伤害判定体 ===
      if (p.type === 'scissor_slash') continue;

      if (p.type === 'missile') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-20, -5);
        ctx.lineTo(-20, 5);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(-5, -2, 15, 4);
        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowBlur = 0;
        ctx.restore();
        continue;
      }

      if (p.type === 'railgun_beam') {
        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.width;
        ctx.globalAlpha = alpha * 0.4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.tx, p.ty);
        ctx.stroke();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = p.width * 0.4;
        ctx.globalAlpha = alpha * 0.8;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.tx, p.ty);
        ctx.stroke();

        // 环形特效
        const ringSpacing = 80;
        const totalLen = Math.hypot(p.tx - p.x, p.ty - p.y);
        const offsetBase = (g.time.frame * 50) % ringSpacing;
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.ty - p.y, p.tx - p.x));
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = alpha * 0.5;
        for (let d = offsetBase; d < totalLen; d += ringSpacing) {
          const scale = 1 - (d / totalLen) * 0.5;
          if (scale <= 0) continue;
          ctx.beginPath();
          ctx.ellipse(
            d,
            0,
            8 * scale,
            p.width * 0.6 * scale,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.restore();
        continue;
      }

      if (p.type === 'rifle') {
        ctx.save();
        ctx.translate(p.x, p.y);
        const ang = Math.atan2(p.vy || 0, p.vx || -1);
        ctx.rotate(ang);
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        const len = p.length || 60;
        const wid = p.width || 12;
        ctx.beginPath();
        ctx.moveTo(len / 2, 0);
        ctx.lineTo(-len / 2, wid / 2);
        ctx.lineTo(-len / 2 - 10, 0);
        ctx.lineTo(-len / 2, -wid / 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(len / 2 - 5, 0);
        ctx.lineTo(-len / 2 + 5, wid / 4);
        ctx.lineTo(-len / 2, 0);
        ctx.lineTo(-len / 2 + 5, -wid / 4);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
        continue;
      }

      // Funnel Beam (generic)
      ctx.save();
      ctx.translate(p.x, p.y);
      const ang = Math.atan2(p.vy || 0, p.vx || -1);
      ctx.rotate(ang);
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = p.color;
      ctx.fillRect(
        -(p.length || 20) / 2 - 2,
        -(p.width || 2) / 2 - 2,
        (p.length || 20) + 4,
        (p.width || 2) + 4,
      );
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  return { spawn, update, render, list };
}
