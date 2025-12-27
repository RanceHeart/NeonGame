// src/systems/projectiles.js
function clamp(v, a, b) {
  if (v < a) {
    return a;
  }
  if (v > b) {
    return b;
  }
  return v;
}

function normAngleDiff(d) {
  while (d < -Math.PI) {
    d += Math.PI * 2;
  }
  while (d > Math.PI) {
    d -= Math.PI * 2;
  }
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

    // 核心修改：每一帧都生成拖尾，形成连续的光带
    g.spawn.particle({
      type: 'beam_trail',
      x: p.x,
      y: p.y,
      color: p.color,
      size: p.width * 0.8, // 拖尾略小于弹头
      decay: 0.1, // 消失得比较快，保持动态感
      vx: 0, // 留在原地，不随子弹移动
      vy: 0,
    });
  }

  function updateFunnelBeam(g, p) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    if (p.life <= 0) {
      p.dead = true;
    }
  }

  function updateMissile(g, p) {
    p.life -= 1;
    if (p.life <= 0) {
      p.dead = true;
      g.spawn.particle({
        type: 'explosion',
        x: p.x,
        y: p.y,
        color: p.color,
        size: 25,
      });
      g.camera.addShake(2);
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
          size: 5,
        });
      }
    } else {
      if (p.speed < p.maxSpeed) {
        p.speed += 0.8;
      }

      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const targetAngle = Math.atan2(dy, dx);
      const currentAngle = Math.atan2(p.vy, p.vx);

      let turnRate = 0.08 + p.speed * 0.005;
      if (p.marute) {
        turnRate *= 1.5;
      }

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

    g.spawn.particle({ type: 'gn_smoke', x: p.x, y: p.y, color: p.color });

    const hitDist = Math.hypot(p.tx - p.x, p.ty - p.y);
    if (hitDist < 40) {
      p.dead = true;
      g.spawn.particle({
        type: 'explosion',
        x: p.x,
        y: p.y,
        color: p.color,
        size: 25,
      });
      g.camera.addShake(2);
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

      g.spawn.particle({
        type: 'electric_arc',
        x: bx + nx * offset,
        y: by + ny * offset,
        color: p.color,
        size: p.width * 0.6,
      });
    }
  }

  function update(g) {
    for (const p of list) {
      if (p.dead) {
        continue;
      }

      if (p.type === 'rifle') {
        updateRifle(g, p);
      } else if (p.type === 'funnel_beam') {
        updateFunnelBeam(g, p);
      } else if (p.type === 'missile') {
        updateMissile(g, p);
      } else if (p.type === 'railgun_beam') {
        updateRailgunBeam(g, p);
      } else {
        p.x += p.vx || 0;
        p.y += p.vy || 0;
        p.life = (p.life || 60) - 1;
        if (p.life <= 0) {
          p.dead = true;
        }
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
      if (list[i].dead) {
        list.splice(i, 1);
      }
    }
  }

  function render(g) {
    const ctx = g.ctx2d.main;

    for (const p of list) {
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

      // 核心修改：Rifle 重绘为 GN 光束 (尖锐的菱形/箭头)
      if (p.type === 'rifle') {
        ctx.save();
        ctx.translate(p.x, p.y);
        const ang = Math.atan2(p.vy || 0, p.vx || -1);
        ctx.rotate(ang);

        // 1. 光晕层 (宽大，模糊)
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;

        // 绘制一个梭形/菱形
        const len = p.length || 60;
        const wid = p.width || 12;

        ctx.beginPath();
        ctx.moveTo(len / 2, 0); // 头部
        ctx.lineTo(-len / 2, wid / 2); // 左翼
        ctx.lineTo(-len / 2 - 10, 0); // 尾部凹槽
        ctx.lineTo(-len / 2, -wid / 2); // 右翼
        ctx.closePath();
        ctx.fill();

        // 2. 核心层 (亮白，锐利)
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
