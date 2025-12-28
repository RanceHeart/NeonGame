// src/weapons/rifle.js
/**
 * 将瞄准角 rawAngle 夹到“朝前扇形”内，避免玩家往下射导致手感怪。
 * 规则：
 * - 玩家朝向固定为 -PI/2（向上）
 * - 扇形角度 +-45°
 * - 如果 aim 在 origin 下方，强制夹到左右边界（保持原 HTML 手感）
 * @param {number} rawAngle
 * @param {number} originX
 * @param {number} originY
 * @param {number} aimX
 * @param {number} aimY
 * @returns {number} clamped angle
 */
function clampAngleToForward(rawAngle, originX, originY, aimX, aimY) {
  const playerFacing = -Math.PI / 2;
  const maxAngle = 45 * (Math.PI / 180);

  const min = playerFacing - maxAngle;
  const max = playerFacing + maxAngle;

  let a = rawAngle;

  if (aimY > originY) {
    a = aimX > originX ? max : min;
    return a;
  }

  if (a > max && a < Math.PI / 2) {
    a = max;
  } else if (a < min && a > -Math.PI * 1.5) {
    a = min;
  }

  return a;
}

export function createRifleWeapon() {
  let lastShotFrame = 0;
  let gunRecoil = 0;

  return {
    name: 'RIFLE',

    update(g, owner) {
      gunRecoil *= 0.85;

      const down = g.input.pointer.down;
      if (!down) return;

      const rate = g.state.mode === 'MARUTE' ? 10 : 30;
      if (g.time.frame - lastShotFrame < rate) return;

      lastShotFrame = g.time.frame;
      gunRecoil = 16;

      // Reduced recoil from 4 to 0.5 for smoother flight
      owner.recoilY += 0.5;
      g.camera.addShake(2); // Reduced shake from 4 to 2

      const spread = owner.transformFactor * 15;
      const muzzleY = -60;
      const offsets = [-26 - spread, 26 + spread];

      for (const offset of offsets) {
        const ox = owner.x + offset;
        const oy = owner.y + muzzleY;

        const raw = Math.atan2(g.input.pointer.y - oy, g.input.pointer.x - ox);
        const ang = clampAngleToForward(
          raw,
          ox,
          oy,
          g.input.pointer.x,
          g.input.pointer.y,
        );

        const speed = 15;
        const vx = Math.cos(ang) * speed;
        const vy = Math.sin(ang) * speed;

        const color =
          g.state.mode === 'MARUTE' || g.state.mode === 'BURST'
            ? '#ff003c'
            : '#00ffaa';

        g.spawn.projectile({
          type: 'rifle',
          from: 'player',
          x: ox,
          y: oy,
          vx,
          vy,
          life: 120,
          color,
          width: 14,
          length: 60,
        });

        g.spawn.particle({
          type: 'shockwave',
          x: ox,
          y: oy,
          color: '#fff',
          size: 10,
          maxSize: 30,
          life: 0.3,
        });

        g.spawn.particle({
          type: 'gn_smoke',
          x: ox,
          y: oy,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          size: 8,
          color: color,
        });
      }
    },

    render(g, owner) {
      const ctx = g.ctx2d.main;
      const tf = owner.transformFactor || 0;
      const spread = tf * 15;
      const mode = g.state.mode;

      const mainColor = '#ddd';
      const darkColor = '#555';
      const bladeColor = '#fff';
      const sensorColor =
        mode === 'MARUTE' || mode === 'BURST' ? '#ff003c' : '#00ffaa';

      [-1, 1].forEach((side) => {
        ctx.save();
        const bx = side * (26 + spread);
        const by = -20;
        ctx.translate(bx, by + gunRecoil);

        ctx.fillStyle = darkColor;
        ctx.fillRect(-4, 0, 8, 20);

        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(-6, -10);
        ctx.lineTo(6, -10);
        ctx.lineTo(8, 30);
        ctx.lineTo(-8, 30);
        ctx.fill();

        ctx.fillStyle = bladeColor;
        ctx.beginPath();
        ctx.moveTo(-3, -10);
        ctx.lineTo(-4, -60);
        ctx.lineTo(0, -65);
        ctx.lineTo(4, -60);
        ctx.lineTo(3, -10);
        ctx.fill();

        ctx.fillStyle = sensorColor;
        ctx.shadowColor = sensorColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(-1, -40, 2, 20);
        ctx.shadowBlur = 0;

        if (gunRecoil > 4) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = sensorColor;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(0, -62, 10 + Math.random() * 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      });
    },
  };
}
