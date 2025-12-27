// src/entities/player/harute.js
import { createRifleWeapon } from '../../weapons/rifle.js';
import { createVlsMissiles } from '../../weapons/missiles_vls.js';
import { createFunnelsWeapon } from '../../weapons/funnels.js';
import { createScissorWeapon } from '../../weapons/scissor.js';

export function createHarutePlayer() {
  const weapons = {
    RIFLE: createRifleWeapon(),
    MISSILE: createVlsMissiles(),
    FUNNEL: createFunnelsWeapon(),
    SCISSOR: createScissorWeapon(),
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

    // funnels bits 可以作为“子实体”独立加到 world（更符合架构）
    // 这里先留一个引用给 funnels/scissor weapon 用（scene init 时注入）
    funnelBits: [],

    update(g) {
      // 定位：固定中下（跟原 HTML）
      player.x = g.screen.w / 2;
      player.y =
        g.screen.h - 180 + Math.sin(g.time.frame * 0.04) * 10 + player.recoilY;

      player.recoilY *= 0.9;

      // mode tween（不引 gsap：用阻尼逼近）
      const targetTf = g.state.mode === 'MARUTE' ? 1 : 0;
      player.transformFactor += (targetTf - player.transformFactor) * 0.08;

      const targetMissileOpen =
        g.state.weapon === 'MISSILE' && g.input.pointer.down ? 1 : 0;
      player.missileOpen += (targetMissileOpen - player.missileOpen) * 0.2;

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

      // main thruster flame
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

      // side binders (VLS units)
      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.scale(side, 1);
        ctx.translate(45 + spread, 0);

        // binder body
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

        // vls cells
        const startX = -14;
        const startY = -50;
        const cellW = 8;
        const cellH = 10;

        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 2; c++) {
            const cx = startX + c * (cellW + 2);
            const cy = startY + r * (cellH + 2);
            const globalIdx = (side === -1 ? 0 : 16) + (r * 2 + c);

            const justFired =
              Math.abs(player.vlsIndex - globalIdx) < 4 &&
              g.input.pointer.down &&
              g.state.weapon === 'MISSILE';

            if (justFired) {
              ctx.fillStyle = '#ffaa00';
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#ffaa00';
            } else if (player.missileOpen > 0.5) {
              ctx.fillStyle = g.state.mode === 'MARUTE' ? '#511' : '#333';
              ctx.shadowBlur = 0;
            } else {
              ctx.fillStyle = '#111';
              ctx.shadowBlur = 0;
            }

            ctx.fillRect(cx, cy, cellW, cellH);
            ctx.shadowBlur = 0;
          }
        }

        // GN condenser
        ctx.fillStyle = g.state.mode === 'MARUTE' ? '#ff003c' : '#00ffaa';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(22, -20, 4, 60);
        ctx.shadowBlur = 0;

        ctx.restore();
      });

      // main body
      ctx.fillStyle = '#eee';
      ctx.beginPath();
      ctx.moveTo(0, -50);
      ctx.lineTo(30, 20);
      ctx.lineTo(0, 60);
      ctx.lineTo(-30, 20);
      ctx.fill();

      // nose split mechanism
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

      // marute face
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

      // cockpit
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
