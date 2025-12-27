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

    // beam trail
    if (Math.random() > 0.6) {
      g.spawn.particle({
        type: 'beam_trail',
        x: p.x,
        y: p.y,
        color: p.color,
      });
    }
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
      } else {
        // fallback
        p.x += p.vx || 0;
        p.y += p.vy || 0;
        p.life = (p.life || 60) - 1;
        if (p.life <= 0) {
          p.dead = true;
        }
      }

      // out of screen kill
      if (
        p.x < -200 ||
        p.x > g.screen.w + 200 ||
        p.y < -200 ||
        p.y > g.screen.h + 200
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

      // rifle / funnel_beam
      ctx.save();
      ctx.translate(p.x, p.y);
      const ang = Math.atan2(p.vy || 0, p.vx || -1);
      ctx.rotate(ang);

      ctx.shadowBlur = p.type === 'rifle' ? 15 : 10;
      ctx.shadowColor = p.color;

      ctx.globalCompositeOperation =
        p.type === 'rifle' ? 'lighter' : 'source-over';
      ctx.fillStyle = '#fff';
      ctx.fillRect(
        -(p.length || 40) / 2,
        -(p.width || 3) / 2,
        p.length || 40,
        p.width || 3,
      );

      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = p.color;
      if (p.type === 'rifle') {
        ctx.beginPath();
        ctx.ellipse(
          0,
          0,
          (p.length || 80) / 1.5,
          (p.width || 5) * 2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else {
        ctx.fillRect(
          -(p.length || 20) / 2 - 2,
          -(p.width || 2) / 2 - 2,
          (p.length || 20) + 4,
          (p.width || 2) + 4,
        );
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  return { spawn, update, render, list };
}
