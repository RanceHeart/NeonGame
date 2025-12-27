// src/entities/enemy/drone.js
export function createDroneEnemy(opts = {}) {
  const e = {
    id: opts.id || `enemy.drone.${Math.random().toString(16).slice(2)}`,
    tags: ['enemy'],
    alive: true,

    x: opts.x ?? 200,
    y: opts.y ?? 200,
    vx: 0,
    vy: 0,

    // 建模/行为参数（现在先当摆动）
    radius: opts.radius ?? 18,
    phase: opts.phase ?? 0,
    seed: Math.random() * 1000,

    update(g) {
      // 轻微悬浮 & 横向摆动：方便你看模型轮廓
      const t = g.time.frame * 0.03 + e.seed;
      e.x += Math.cos(t) * 0.6;
      e.y += Math.sin(t * 0.7) * 0.4;

      // phase 2 给一点“危险感”
      if (e.phase === 2 && g.time.frame % 10 === 0) {
        g.spawn.particle({
          type: 'spark',
          x: e.x,
          y: e.y,
          color: '#ff0055',
          size: 2,
          decay: 0.06,
        });
      }
    },

    render(g) {
      const ctx = g.ctx2d.main;
      ctx.save();
      ctx.translate(e.x, e.y);

      let col = '#00ffaa';
      if (e.phase === 1) {
        col = '#ffbb00';
      }
      if (e.phase === 2) {
        col = '#ff0055';
      }

      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = col;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    },

    getHitShape() {
      return { type: 'circle', x: e.x, y: e.y, r: e.radius };
    },
  };

  return e;
}
