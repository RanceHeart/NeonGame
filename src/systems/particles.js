export function createParticleSystem() {
  const list = [];

  function spawn(p) {
    list.push({ life: 1, ...p });
  }

  function update(g) {
    for (const p of list) {
      // TODO: 更丰富的粒子类型（smoke/spark/beamTrail）
      p.x += p.vx || 0;
      p.y += p.vy || 0;
      p.life -= p.decay || 0.03;
      if (p.life <= 0) {
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
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color || '#fff';
      ctx.fillRect(p.x, p.y, p.size || 2, p.size || 2);
    }
    ctx.globalAlpha = 1;
  }

  return { spawn, update, render, list };
}
