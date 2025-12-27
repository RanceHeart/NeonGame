// src/entities/player/funnel_bit.js
export function createFunnelBit({ id, owner }) {
  const bit = {
    id: `player.funnel.${id}`,
    tags: ['funnel'],
    alive: true,
    owner,
    bitId: id,

    // 物理属性
    x: owner.x,
    y: owner.y,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,

    // 状态机: DOCKED -> EJECT -> ATTACK -> RETURN
    state: 'DOCKED',
    stateTimer: 0,
    cooldown: 0,

    // 视觉变量
    openFactor: 0,
    scaleFactor: 0.6,

    update(g) {
      if (bit.cooldown > 0) {
        bit.cooldown -= 1;
      }

      const isMarute = g.state.mode === 'MARUTE';
      const isFiring = g.state.weapon === 'FUNNEL' && g.input.pointer.down;

      // --- 决策 ---
      if (isFiring && (bit.state === 'DOCKED' || bit.state === 'RETURN')) {
        const delay = (bit.bitId % 6) * 3;
        if (g.time.frame % (20 + delay) === 0) {
          bit.enterEject(g, isMarute);
        }
      }

      if (!isFiring && (bit.state === 'ATTACK' || bit.state === 'EJECT')) {
        bit.state = 'RETURN';
        bit.vx = 0;
        bit.vy = 0;
      }

      // --- 执行 ---
      if (bit.state === 'EJECT') {
        bit.updateEject(g);
      } else if (bit.state === 'ATTACK') {
        bit.updateAttack(g, isMarute);
      } else if (bit.state === 'RETURN') {
        bit.updateReturn(g, isMarute);
      } else {
        bit.updateDocked(g, isMarute);
      }

      // --- 物理 ---
      if (bit.state === 'EJECT' || bit.state === 'ATTACK') {
        bit.x += bit.vx;
        bit.y += bit.vy;

        const speed = Math.hypot(bit.vx, bit.vy);
        if (speed > 1) {
          const targetAngle = Math.atan2(bit.vy, bit.vx);
          let diff = targetAngle - bit.angle;
          while (diff > Math.PI) {
            diff -= Math.PI * 2;
          }
          while (diff < -Math.PI) {
            diff += Math.PI * 2;
          }
          bit.angle += diff * 0.15;
        }
      }
    },

    enterEject(g, isMarute) {
      bit.state = 'EJECT';
      bit.stateTimer = isMarute ? 15 : 25;

      const side = bit.x > owner.x ? 1 : -1;
      const ejectSpeed = isMarute ? 8 : 5;

      bit.vx = side * (ejectSpeed + Math.random() * 2);
      bit.vy = -2 - Math.random() * 3;

      // ✅ 删除：离开时的白色烟雾（用户要求去掉）
      // g.spawn.particle({
      //   type: 'gn_smoke',
      //   x: bit.x,
      //   y: bit.y,
      //   vx: -bit.vx * 0.5,
      //   vy: 2,
      //   color: '#fff',
      //   size: 4,
      // });
    },

    updateEject(g) {
      bit.vx *= 0.92;
      bit.vy *= 0.92;
      bit.scaleFactor += (1.0 - bit.scaleFactor) * 0.1;

      bit.stateTimer -= 1;
      if (bit.stateTimer <= 0) {
        bit.state = 'ATTACK';
      }
    },

    updateAttack(g, isMarute) {
      const orbitRad = isMarute ? 100 : 80;
      const t = g.time.frame * 0.05 + bit.bitId;
      const tx = g.input.pointer.x + Math.cos(t) * orbitRad;
      const ty = g.input.pointer.y + Math.sin(t) * (orbitRad * 0.6);

      const dx = tx - bit.x;
      const dy = ty - bit.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.001) {
        bit.vx *= 0.9;
        bit.vy *= 0.9;
        return;
      }

      const accel = isMarute ? 0.8 : 0.4;
      bit.vx += (dx / dist) * accel;
      bit.vy += (dy / dist) * accel;

      const maxSpeed = isMarute ? 12 : 8;
      const currentSpeed = Math.hypot(bit.vx, bit.vy);
      if (currentSpeed > maxSpeed) {
        bit.vx = (bit.vx / currentSpeed) * maxSpeed;
        bit.vy = (bit.vy / currentSpeed) * maxSpeed;
      }

      bit.vx *= 0.96;
      bit.vy *= 0.96;

      const rate = isMarute ? 15 : 40;
      if ((g.time.frame + bit.bitId * 7) % rate === 0) {
        const aimAngle = Math.atan2(
          g.input.pointer.y - bit.y,
          g.input.pointer.x - bit.x,
        );
        bit.fire(g, isMarute, aimAngle);
      }
    },

    getDockingPosition() {
      const side = bit.bitId % 2 === 0 ? -1 : 1;
      const idx = Math.floor(bit.bitId / 2);
      const spread = owner.transformFactor * 25;

      const tx = owner.x + side * (50 + spread);
      const ty = owner.y - 50 + idx * 10;

      return { tx, ty };
    },

    updateReturn(g, isMarute) {
      const { tx, ty } = bit.getDockingPosition();
      const dx = tx - bit.x;
      const dy = ty - bit.y;

      bit.x += dx * 0.1;
      bit.y += dy * 0.1;

      const targetScale = isMarute ? 0.8 : 0.55;
      bit.scaleFactor += (targetScale - bit.scaleFactor) * 0.1;

      let diff = -Math.PI / 2 - bit.angle;
      while (diff > Math.PI) {
        diff -= Math.PI * 2;
      }
      while (diff < -Math.PI) {
        diff += Math.PI * 2;
      }
      bit.angle += diff * 0.1;

      if (Math.hypot(dx, dy) < 2) {
        bit.state = 'DOCKED';
        bit.x = tx;
        bit.y = ty;
        bit.vx = 0;
        bit.vy = 0;
        bit.angle = -Math.PI / 2;
      }
    },

    updateDocked(g, isMarute) {
      const { tx, ty } = bit.getDockingPosition();

      bit.x = tx;
      bit.y = ty;
      bit.vx = 0;
      bit.vy = 0;
      bit.angle = -Math.PI / 2;

      const targetScale = isMarute ? 0.8 : 0.55;
      bit.scaleFactor += (targetScale - bit.scaleFactor) * 0.1;

      if (isMarute) {
        bit.x += (Math.random() - 0.5) * 3;
        bit.y += (Math.random() - 0.5) * 3;
      }
    },

    fire(g, isMarute, aimAngle) {
      const color = isMarute ? '#ff003c' : '#00ffaa';
      const kick = isMarute ? 2 : 1;
      bit.vx -= Math.cos(aimAngle) * kick;
      bit.vy -= Math.sin(aimAngle) * kick;

      g.spawn.particle({
        type: 'explosion',
        x: bit.x + Math.cos(aimAngle) * 10,
        y: bit.y + Math.sin(aimAngle) * 10,
        color: '#fff',
        size: isMarute ? 12 : 6,
        decay: 0.3,
      });

      g.spawn.projectile({
        type: 'funnel_beam',
        from: 'player',
        x: bit.x,
        y: bit.y,
        vx: Math.cos(aimAngle) * 25,
        vy: Math.sin(aimAngle) * 25,
        life: 50,
        color: color,
        width: isMarute ? 4 : 2,
        length: 30,
      });
    },

    render(g) {
      const ctx = g.ctx2d.main;

      ctx.save();
      ctx.translate(bit.x, bit.y);
      ctx.rotate(bit.angle + Math.PI / 2);

      ctx.scale(bit.scaleFactor, bit.scaleFactor);

      const isMarute = g.state.mode === 'MARUTE';
      const color = isMarute ? '#ff003c' : '#00ffaa';

      // 主体
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(-4, 5);
      ctx.lineTo(0, 8);
      ctx.lineTo(4, 5);
      ctx.fill();

      // 传感器发光
      ctx.fillStyle = color;
      ctx.fillRect(-1, -5, 2, 4);

      // 侧翼
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-8, 6);
      ctx.lineTo(-4, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(8, 6);
      ctx.lineTo(4, 8);
      ctx.fill();

      ctx.restore();
    },
  };

  return bit;
}
