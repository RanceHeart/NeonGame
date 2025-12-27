// src/entities/player/funnel_bit.js
export function createFunnelBit({ id, owner }) {
  const bit = {
    id: `player.funnel.${id}`,
    tags: ['funnel'],
    alive: true,

    owner,
    bitId: id,

    x: owner.x,
    y: owner.y,
    angle: 0,

    state: 'DOCKED',
    active: true,

    // slash tween 状态（替代 gsap timeline）
    slash: null,

    triggerSlash(g, x1, y1, x2, y2, color) {
      // 简化：用 particles 做 slash 线 + 爆炸 + shake
      g.spawn.particle({
        type: 'slash',
        x1,
        y1,
        x2,
        y2,
        color,
        thick: g.state.mode === 'MARUTE' ? 6 : 4,
      });
      g.spawn.particle({ type: 'explosion', x: x2, y: y2, color, size: 15 });
      g.camera.addShake(4);

      // 同时把自己位置瞬移/拉到 end（原来有动画，这里先用“瞬移 + 短暂冷却”）
      bit.x = x2;
      bit.y = y2;
      bit.state = 'RETURN';
      bit.cooldown = 10;
    },

    update(g) {
      // TODO: 把你 HTML Funnel.update 那套状态机搬过来
      // 这里先给一个最小“显示/围绕 owner”版本，让你先跑起来

      if (bit.cooldown > 0) {
        bit.cooldown -= 1;
      }

      const t = g.time.frame * 0.05 + id * (Math.PI / 3);
      const rad = g.state.mode === 'MARUTE' ? 140 : 160;
      const tx = owner.x + Math.cos(t) * rad;
      const ty = owner.y - 100 + Math.sin(t) * (rad * 0.4);

      bit.x += (tx - bit.x) * 0.1;
      bit.y += (ty - bit.y) * 0.1;

      bit.angle = -Math.PI / 2;

      // FUNNEL 模式下按住就喷 beam（原来 ATTACK/FIRE 很复杂，这里先最小版）
      if (g.state.weapon === 'FUNNEL' && g.input.pointer.down) {
        if (g.time.frame % 4 === 0) {
          const ang = Math.atan2(
            g.input.pointer.y - bit.y,
            g.input.pointer.x - bit.x,
          );
          const speed = 25;
          const vx = Math.cos(ang) * speed;
          const vy = Math.sin(ang) * speed;

          const color = g.state.mode === 'MARUTE' ? '#ff003c' : '#00ffaa';

          g.spawn.projectile({
            type: 'funnel_beam',
            from: 'player',
            x: bit.x,
            y: bit.y,
            vx,
            vy,
            life: 60,
            color,
            width: 2,
            length: 20,
          });
        }
      }
    },

    render(g) {
      if (!bit.active) {
        return;
      }

      const ctx = g.ctx2d.main;
      ctx.save();
      ctx.translate(bit.x, bit.y);
      ctx.rotate(bit.angle + Math.PI / 2);

      ctx.fillStyle = g.state.mode === 'MARUTE' ? '#ff003c' : '#ff9500';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(12, 8);
      ctx.lineTo(0, 4);
      ctx.lineTo(-12, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.fillRect(-2, -5, 4, 4);

      ctx.restore();
    },
  };

  return bit;
}
