// src/weapons/rifle.js
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

  // 视觉状态：枪管后坐力位移
  let gunRecoil = 0;

  return {
    name: 'RIFLE',

    update(g, owner) {
      // 1. 后坐力归位插值
      gunRecoil *= 0.85; // 回弹稍微慢一点，更有重量感

      const down = g.input.pointer.down;
      if (!down) {
        return;
      }

      // 2. 射速调整：大幅降低，制造“重炮”的点射感
      // MARUTE 模式每 5 帧一发，普通模式每 10 帧一发
      const rate = g.state.mode === 'MARUTE' ? 10 : 30;
      if (g.time.frame - lastShotFrame < rate) {
        return;
      }
      lastShotFrame = g.time.frame;

      // 触发视觉后坐力
      gunRecoil = 16;

      // 3. 增加震感
      owner.recoilY += 4; // 机体后退幅度加大
      g.camera.addShake(4);

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

        // 4. 核心修改：重写弹道参数
        // 速度 15：很慢，但是因为拖尾长，会感觉像是推出去的高能光束
        const speed = 15;
        const vx = Math.cos(ang) * speed;
        const vy = Math.sin(ang) * speed;

        const color = g.state.mode === 'MARUTE' ? '#ff003c' : '#00ffaa'; // 绿色改成经典的 GN 粒子绿

        g.spawn.projectile({
          type: 'rifle',
          from: 'player',
          x: ox,
          y: oy,
          vx,
          vy,
          life: 120, // 飞得慢，活得久
          maxLife: 120,
          color,
          width: 14, // 很宽
          length: 60,
        });

        // 枪口爆发
        g.spawn.particle({
          type: 'shockwave',
          x: ox,
          y: oy,
          color: '#fff',
          size: 10,
          maxSize: 30,
          life: 0.3,
        });

        // 侧向散逸烟雾
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

    // 武器立绘 (保持之前的更新)
    render(g, owner) {
      const ctx = g.ctx2d.main;
      const tf = owner.transformFactor || 0;
      const spread = tf * 15;

      const isMarute = g.state.mode === 'MARUTE';
      const mainColor = '#ddd';
      const darkColor = '#555';
      const bladeColor = '#fff';
      const sensorColor = isMarute ? '#ff003c' : '#00ffaa';

      [-1, 1].forEach((side) => {
        ctx.save();
        const bx = side * (26 + spread);
        const by = -20;
        const recoilY = gunRecoil;
        ctx.translate(bx, by + recoilY);

        // 机械结构
        ctx.fillStyle = darkColor;
        ctx.fillRect(-4, 0, 8, 20);

        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(-6, -10);
        ctx.lineTo(6, -10);
        ctx.lineTo(8, 30);
        ctx.lineTo(-8, 30);
        ctx.fill();

        // 剑刃
        ctx.fillStyle = bladeColor;
        ctx.beginPath();
        ctx.moveTo(-3, -10);
        ctx.lineTo(-4, -60);
        ctx.lineTo(0, -65);
        ctx.lineTo(4, -60);
        ctx.lineTo(3, -10);
        ctx.fill();

        // 传感器
        ctx.fillStyle = sensorColor;
        ctx.shadowColor = sensorColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(-1, -40, 2, 20);
        ctx.shadowBlur = 0;

        // 开火高亮
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
