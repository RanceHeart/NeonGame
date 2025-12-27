// src/entities/enemy/test_enemy.js
export function createTestEnemy(opts = {}) {
  const e = {
    id: opts.id || 'enemy.test_dummy',
    tags: ['enemy'],
    alive: true,

    x: opts.x ?? 0,
    y: opts.y ?? 0,
    radius: 40,

    // Visual state
    hitTimer: 0,
    pulse: 0,

    update(g) {
      // Passive floating
      e.pulse += 0.05;

      if (e.hitTimer > 0) {
        e.hitTimer--;
      }
    },

    render(g) {
      const ctx = g.ctx2d.main;
      ctx.save();
      ctx.translate(e.x, e.y);

      // Hit flash effect
      if (e.hitTimer > 0) {
        ctx.scale(1.1, 1.1);
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fff';
      }

      // Outer Ring
      ctx.strokeStyle = '#556';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating Inner Ring
      ctx.save();
      ctx.rotate(e.pulse);
      ctx.strokeStyle = e.hitTimer > 0 ? '#f05' : '#0ff';
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, e.radius - 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Core
      ctx.fillStyle = '#223';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TARGET', 0, 4);

      ctx.restore();
    },

    getHitShape() {
      // When hit, trigger visual feedback
      return {
        type: 'circle',
        x: e.x,
        y: e.y,
        r: e.radius,
        onHit: () => {
          e.hitTimer = 5;
        },
      };
    },
  };

  return e;
}
