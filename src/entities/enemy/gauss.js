// src/entities/enemy/gauss.js
export function createGaussEnemy(opts = {}) {
  const e = {
    id: opts.id || `enemy.gauss.${Math.random().toString(16).slice(2)}`,
    tags: ['enemy'],
    alive: true,
    hp: 40,

    x: opts.x ?? 0,
    y: opts.y ?? 0,
    charge: 0,

    update(g) {
      e.y += 0.2; // Very slow
      if (e.y > g.screen.h + 100) e.y = -100;

      // Charge logic
      e.charge = (Math.sin(g.time.frame * 0.1) + 1) / 2;

      // Charging Particles
      if (Math.random() < e.charge * 0.5) {
        g.spawn.particle({
          type: 'spark',
          x: e.x + (Math.random() - 0.5) * 20,
          y: e.y + 20,
          vx: 0,
          vy: -2,
          color: '#0f8',
          life: 10,
        });
      }
    },

    render(g) {
      const ctx = g.ctx2d.main;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(Math.PI);

      // Main Hull
      ctx.fillStyle = '#2a2a30';
      ctx.fillRect(-10, -30, 20, 60);

      // Rail
      ctx.fillStyle = '#111';
      ctx.fillRect(8, -50, 6, 70);

      // Side Pod
      ctx.fillStyle = '#555';
      ctx.fillRect(-14, -10, 8, 30);

      // Coils
      ctx.shadowBlur = 15 * e.charge;
      ctx.shadowColor = '#0f8';
      ctx.fillStyle = `rgba(0, 255, 128, ${e.charge})`;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(7, -40 + i * 10, 8, 2);
      }
      ctx.shadowBlur = 0;

      ctx.restore();
    },

    getHitShape() {
      return {
        type: 'aabb',
        x: e.x,
        y: e.y,
        w: 40,
        h: 80,
        onHit: () => {
          if (e.hp <= 0 && e.alive) {
            e.alive = false;
            g.spawn.spawnShipExplosion(e.x, e.y, '#0f8');
            g.camera.addShake(10);
          }
        },
      };
    },
  };
  return e;
}
