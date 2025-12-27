export function createProjectileSystem() {
  const list = [];

  function spawn(p) {
    list.push({ ...p });
  }

  function update(g) {
    for (const p of list) {
      // TODO: 更复杂类型（missile/beam）
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
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
      ctx.fillStyle = p.color || '#fff';
      ctx.fillRect(p.x - 2, p.y - 6, 4, 12);
    }
  }

  return { spawn, update, render, list };
}
