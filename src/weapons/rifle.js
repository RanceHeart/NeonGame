// src/weapons/rifle.js
function clampAngleToForward(rawAngle, originX, originY, aimX, aimY) {
  const playerFacing = -Math.PI / 2;
  const maxAngle = 45 * (Math.PI / 180);

  const min = playerFacing - maxAngle;
  const max = playerFacing + maxAngle;

  let a = rawAngle;

  // 原 HTML 那套“下方强制夹到边界”的手感
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

  return {
    name: 'RIFLE',

    update(g, owner) {
      const down = g.input.pointer.down;
      if (!down) {
        return;
      }

      const rate = g.state.mode === 'MARUTE' ? 2 : 5;
      if (g.time.frame - lastShotFrame < rate) {
        return;
      }
      lastShotFrame = g.time.frame;

      owner.recoilY += 2;
      g.camera.addShake(1.5);

      const muzzleY = -40;
      const spread = owner.transformFactor * 15;

      const offsets = [-22 - spread, 22 + spread];

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

        const speed = 55;
        const vx = Math.cos(ang + (Math.random() - 0.5) * 0.05) * speed;
        const vy = Math.sin(ang + (Math.random() - 0.5) * 0.05) * speed;

        const color = g.state.mode === 'MARUTE' ? '#ff003c' : '#cfff00';

        g.spawn.projectile({
          type: 'rifle',
          from: 'player',
          x: ox,
          y: oy,
          vx,
          vy,
          life: 150,
          color,
          width: 5,
          length: 80,
        });

        g.spawn.particle({ type: 'spark', x: ox, y: oy, color: '#fff' });
      }
    },
  };
}
