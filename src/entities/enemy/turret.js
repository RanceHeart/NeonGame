// src/entities/enemy/turret.js
export function createTurretEnemy(opts = {}) {
  const e = {
    id: opts.id || `enemy.turret.${Math.random().toString(16).slice(2)}`,
    tags: ['enemy'],
    alive: true,

    x: opts.x ?? 300,
    y: opts.y ?? 240,

    angle: 0,
    phase: opts.phase ?? 0,

    update(g) {
      // 先当模型：缓慢朝指针转
      const dx = g.input.pointer.x - e.x;
      const dy = g.input.pointer.y - e.y;
      const target = Math.atan2(dy, dx);
      let diff = target - e.angle;
      while (diff > Math.PI) {
        diff -= Math.PI * 2;
      }
      while (diff < -Math.PI) {
        diff += Math.PI * 2;
      }
      e.angle += diff * 0.05;
    },

    render(g) {
      const ctx = g.ctx2d.main;

      let col = '#0ff';
      if (e.phase === 1) {
        col = '#ffbb00';
      }
      if (e.phase === 2) {
        col = '#ff0055';
      }

      ctx.save();
      ctx.translate(e.x, e.y);

      // base
      ctx.fillStyle = '#0a0a10';
      ctx.fillRect(-20, -10, 40, 20);

      // gun
      ctx.rotate(e.angle);
      ctx.fillStyle = '#222';
      ctx.fillRect(0, -4, 30, 8);

      // glow ring
      ctx.rotate(-e.angle);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = col;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    },

    getHitShape() {
      return { type: 'aabb', x: e.x, y: e.y, w: 40, h: 20 };
    },
  };

  return e;
}
