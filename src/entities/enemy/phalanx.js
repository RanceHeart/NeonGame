// src/entities/enemy/phalanx.js
export function createPhalanxEnemy(opts = {}) {
  const e = {
    id: opts.id || `enemy.phalanx.${Math.random().toString(16).slice(2)}`,
    tags: ['enemy'],
    alive: true,
    hp: 80, // Tanky

    x: opts.x ?? 0,
    y: opts.y ?? 0,
    seed: Math.random() * 100,

    update(g) {
      const t = g.time.frame * 0.01 + e.seed;
      e.y += 0.5; // Slow drift down
      e.x += Math.sin(t) * 1;

      if (e.y > g.screen.h + 50) e.y = -50;
    },

    render(g) {
      const ctx = g.ctx2d.main;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(Math.PI); // Face down

      const t = g.time.frame;

      // Body
      ctx.fillStyle = '#2a2a30';
      ctx.beginPath();
      ctx.moveTo(-20, -15);
      ctx.lineTo(20, -15);
      ctx.lineTo(30, 10);
      ctx.lineTo(15, 25);
      ctx.lineTo(-15, 25);
      ctx.lineTo(-30, 10);
      ctx.closePath();
      ctx.fill();

      // Shield Strip
      ctx.fillStyle = '#667';
      ctx.fillRect(-15, -18, 30, 6);
      ctx.fillStyle = '#0ff';
      ctx.fillRect(-15, -18, 30, 2);

      // Turrets
      ctx.fillStyle = '#222';
      ctx.save();
      ctx.translate(-20, 5);
      ctx.rotate(t * 0.05);
      ctx.fillRect(-3, -5, 6, 10);
      ctx.restore();
      ctx.save();
      ctx.translate(20, 5);
      ctx.rotate(-t * 0.05);
      ctx.fillRect(-3, -5, 6, 10);
      ctx.restore();

      ctx.restore();
    },

    getHitShape() {
      return {
        type: 'aabb',
        x: e.x,
        y: e.y,
        w: 60,
        h: 50,
        onHit: () => {
          if (e.hp <= 0 && e.alive) {
            e.alive = false;
            g.spawn.spawnShipExplosion(e.x, e.y, '#0ff');
            g.camera.addShake(8);
          }
        },
      };
    },
  };
  return e;
}
