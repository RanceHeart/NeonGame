// src/entities/player/harute.js
import { createRifleWeapon } from '../../weapons/rifle.js';
import { createVlsMissiles } from '../../weapons/missiles_vls.js';
import { createFunnelsWeapon } from '../../weapons/funnels.js';
import { createScissorWeapon } from '../../weapons/scissor.js';
import { createRailgunWeapon } from '../../weapons/railgun.js';

export function createHarutePlayer() {
  const weapons = {
    RIFLE: createRifleWeapon(),
    MISSILE: createVlsMissiles(),
    FUNNEL: createFunnelsWeapon(),
    SCISSOR: createScissorWeapon(),
    CANNON: createRailgunWeapon(),
  };

  const player = {
    id: 'player.harute',
    tags: ['player'],
    alive: true,

    x: 0,
    y: 0,

    recoilY: 0,
    missileOpen: 0,
    transformFactor: 0,
    vlsIndex: 0,

    funnelBits: [],
    scissorBits: [],

    update(g) {
      player.x = g.screen.w / 2;
      player.y =
        g.screen.h - 180 + Math.sin(g.time.frame * 0.04) * 10 + player.recoilY;
      player.recoilY *= 0.9;

      const targetTf = g.state.mode === 'MARUTE' ? 1 : 0;
      player.transformFactor += (targetTf - player.transformFactor) * 0.08;

      const targetMissileOpen =
        g.state.weapon === 'MISSILE' && g.input.pointer.down ? 1 : 0;
      player.missileOpen += (targetMissileOpen - player.missileOpen) * 0.2;

      // 武器逻辑更新
      const w = weapons[g.state.weapon] || weapons.RIFLE;
      w.update(g, player);
    },

    render(g) {
      const ctx = g.ctx2d.main;
      ctx.save();
      ctx.translate(player.x, player.y);

      const tf = player.transformFactor;
      const spread = tf * 25;
      const noseSplit = tf * 15;

      // 1. 尾焰
      ctx.save();
      ctx.translate(0, 80);
      ctx.fillStyle = g.state.mode === 'MARUTE' ? '#f0f' : '#0ff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = ctx.fillStyle;
      const flameLen =
        40 + Math.random() * 20 + (g.input.pointer.down ? 20 : 0) + tf * 40;
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(0, flameLen);
      ctx.lineTo(20, 0);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      // 2. *** GN Rifle (枪) ***
      // 位于机体连接处下方，显眼的长管
      const rifleColor = '#444';
      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.translate(side * (22 + spread), -10); // 根据 spread 移动

        // 枪管
        ctx.fillStyle = rifleColor;
        ctx.fillRect(-4, -60, 8, 80); // 长长的枪管

        // 瞄准镜/传感器
        ctx.fillStyle = g.state.mode === 'MARUTE' ? '#ff003c' : '#00ffaa';
        ctx.fillRect(-1, -65, 2, 5);

        // 枪口发光 (开火时)
        if (
          g.state.weapon === 'RIFLE' &&
          g.input.pointer.down &&
          g.time.frame % 5 < 2
        ) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = ctx.fillStyle;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(0, -60, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      });

      // 3. Side Binders (侧面推进器/导弹舱)
      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.scale(side, 1);
        ctx.translate(45 + spread, 0);

        ctx.fillStyle = '#222';
        ctx.strokeStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(-20, -60);
        ctx.lineTo(20, -60);
        ctx.lineTo(25, 60);
        ctx.lineTo(-15, 50);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Missile Hatch
        const startX = -14;
        const startY = -50;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 2; c++) {
            const cx = startX + c * 10;
            const cy = startY + r * 12;
            const globalIdx = (side === -1 ? 0 : 16) + (r * 2 + c);
            const justFired =
              Math.abs(player.vlsIndex - globalIdx) < 4 &&
              g.input.pointer.down &&
              g.state.weapon === 'MISSILE';

            if (justFired) {
              ctx.fillStyle = '#ffaa00';
            } else if (player.missileOpen > 0.5) {
              ctx.fillStyle = g.state.mode === 'MARUTE' ? '#511' : '#333';
            } else {
              ctx.fillStyle = '#111';
            }
            ctx.fillRect(cx, cy, 8, 10);
          }
        }

        // GN Condenser (Green/Red Strip)
        ctx.fillStyle = g.state.mode === 'MARUTE' ? '#ff003c' : '#00ffaa';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(22, -20, 4, 60);
        ctx.shadowBlur = 0;

        ctx.restore();
      });

      // 4. 机身主体
      ctx.fillStyle = '#eee';
      ctx.beginPath();
      ctx.moveTo(0, -50);
      ctx.lineTo(30, 20);
      ctx.lineTo(0, 60);
      ctx.lineTo(-30, 20);
      ctx.fill();

      // 5. 机头分裂
      // Left
      ctx.save();
      ctx.translate(-noseSplit, -30);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-15, 20);
      ctx.lineTo(-10, -80);
      ctx.lineTo(0, -100);
      ctx.fill();
      ctx.fillStyle = g.state.mode === 'MARUTE' ? '#ff003c' : '#00ffaa';
      ctx.fillRect(-8, -60, 4, 20);
      ctx.restore();

      // Right
      ctx.save();
      ctx.translate(noseSplit, -30);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(15, 20);
      ctx.lineTo(10, -80);
      ctx.lineTo(0, -100);
      ctx.fill();
      ctx.fillStyle = g.state.mode === 'MARUTE' ? '#ff003c' : '#00ffaa';
      ctx.fillRect(4, -60, 4, 20);
      ctx.restore();

      // 6. Marute Face
      if (tf > 0.1) {
        ctx.fillStyle = '#222';
        ctx.fillRect(-5, -100, 10, 60);

        ctx.fillStyle = '#ff003c';
        ctx.globalAlpha = tf;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff003c';
        ctx.beginPath();
        ctx.arc(0, -80, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // 7. 驾驶舱
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.moveTo(0, -40);
      ctx.lineTo(10, -10);
      ctx.lineTo(0, 0);
      ctx.lineTo(-10, -10);
      ctx.fill();

      ctx.restore();
    },

    getHitShape() {
      return { type: 'circle', x: player.x, y: player.y, r: 18 };
    },
  };

  return player;
}
