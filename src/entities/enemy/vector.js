// src/entities/enemy/vector.js
export function createVectorEnemy(opts = {}) {
  const e = {
    id: opts.id || `enemy.vector.${Math.random().toString(16).slice(2)}`,
    tags: ['enemy'],
    alive: true,
    hp: 20,

    x: opts.x ?? 0,
    y: opts.y ?? -50,
    vx: (Math.random() - 0.5) * 4,
    vy: 3 + Math.random() * 2, // Fast downward speed

    update(g) {
      e.x += e.vx;
      e.y += e.vy;

      // Bounce off walls
      if (e.x < 0 || e.x > g.screen.w) e.vx *= -1;

      // Respawn if off bottom
      if (e.y > g.screen.h + 50) {
        e.y = -50;
        e.x = Math.random() * g.screen.w;
      }

      // Trail
      if (g.time.frame % 4 === 0) {
        g.spawn.particle({
          type: 'spark',
          x: e.x,
          y: e.y - 15,
          vy: -2,
          color: '#f05',
          life: 20,
        });
      }
    },

    render(g) {
      const ctx = g.ctx2d.main;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.scale(1.2, 1.2);
      ctx.rotate(e.vx * 0.1); // Tilt based on movement

      // Draw Vector (from HTML reference)
      ctx.fillStyle = '#ddd';
      ctx.beginPath();
      ctx.moveTo(0, 20); // nose pointing down for game logic usually, but here visual says up?
      // Let's align with movement: VY is positive (down), so rotate 180 or draw pointing down
      ctx.rotate(Math.PI);

      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(12, 15);
      ctx.lineTo(0, 8);
      ctx.lineTo(-12, 15);
      ctx.closePath();
      ctx.fill();

      // Glow Engine
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#f05';
      ctx.fillStyle = '#f05';
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(3, 10);
      ctx.lineTo(-3, 10);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    },

    getHitShape() {
      return {
        type: 'circle',
        x: e.x,
        y: e.y,
        r: 15,
        onHit: () => {
          if (e.hp <= 0 && e.alive) {
            e.alive = false;
            g.spawn.spawnShipExplosion(e.x, e.y, '#f05');
            g.camera.addShake(5);
          }
        },
      };
    },
  };
  return e;
}
