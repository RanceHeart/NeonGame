Here are the modified files to achieve the requested effects:

1.  **`src/scenes/sandbox.js`**: Increased the number of bits generated (from 6 to 14).
2.  **`src/entities/player/scissor_bit.js`**: Added logic to hide extra bits when not in Trans-Am, drastically increased the attack range (`chaosAmp`) in Marute mode, and added heavy shockwave effects during dashes.
3.  **`src/entities/player/funnel_bit.js`**: Added logic to hide extra bits when not in Trans-Am.
4.  **`src/weapons/missiles_vls.js`**: Increased missile launch count and spread for Marute mode.
5.  **`src/systems/projectiles.js`**: Enhanced missile explosion size and effects.

I will also update the **`src/entities/player/harute.js`** slightly to add a "Ghost/Afterimage" effect to the main body during Trans-Am to further emphasize the transformation.

### 🔍 UPDATED FILES

<file path="src/scenes/sandbox.js">
// src/scenes/sandbox.js
import { createWorld } from '../core/world.js';
import { createHarutePlayer } from '../entities/player/harute.js';
import { createHud } from '../ui/hud.js';
import { createFunnelBit } from '../entities/player/funnel_bit.js';
import { createScissorBit } from '../entities/player/scissor_bit.js';

export function createSandboxScene() {
  let world;
  let hud;

  return {
    init(g) {
      world = createWorld();
      hud = createHud();

      if (!g.mountEl) {
        g.mountEl = g.ctx2d.main.canvas.parentElement;
      }

      g.spawn = {
        projectile: (p) => world.spawnProjectile(p),
        particle: (p) => world.spawnParticle(p),
      };

      g.state = {
        mode: 'NORMAL',
        weapon: 'RIFLE',
      };

      hud.mount(g);

      const player = createHarutePlayer();
      world.addEntity(player);

      // 初始化数组
      player.funnelBits = [];
      player.scissorBits = [];

      // Bits 数量扩充到 14 个
      // 0-5: 常规显示
      // 6-13: 隐藏 Bit (Trans-Am 时才激活)
      const TOTAL_BITS = 14;

      // 1. 生成 Funnel Bits
      for (let i = 0; i < TOTAL_BITS; i++) {
        const bit = createFunnelBit({ id: i, owner: player });
        player.funnelBits.push(bit);
        world.addEntity(bit);
      }

      // 2. 生成 Scissor Bits
      for (let i = 0; i < TOTAL_BITS; i++) {
        const bit = createScissorBit({ id: i, owner: player });
        player.scissorBits.push(bit);
        world.addEntity(bit);
      }
    },

    update(g) {
      hud.update(g);
      world.update(g);
    },

    render(g) {
      world.render(g);

      const ctx = g.ctx2d.main;
      ctx.fillStyle = '#0ff';
      ctx.font = '12px monospace';
      ctx.fillText('SANDBOX - TRANS-AM ENHANCED', 12, 20);
    },
  };
}
</file>

<file path="src/entities/player/scissor_bit.js">
// src/entities/player/scissor_bit.js
export function createScissorBit({ id, owner }) {
  const bit = {
    id: `player.scissor.${id}`,
    tags: ['scissor_bit'],
    alive: true,
    owner,
    bitId: id,

    // 物理属性
    x: owner.x,
    y: owner.y,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,

    // 状态机: DOCKED | DEPLOY | HUNT | CHAOS_CUT | COOLDOWN | RETURN
    state: 'DOCKED',
    timer: 0,

    // 斩击参数
    chaosCenter: { x: 0, y: 0 },
    chaosAmp: 0,
    dashTarget: { x: 0, y: 0 },
    dashCount: 0,
    dashState: 'IDLE', // 'MOVING' or 'WAIT'

    // 视觉
    bladeOpen: 0,
    scale: 0.6,
    trail: [],

    update(g) {
      const isMarute = g.state.mode === 'MARUTE';
      const isHiddenBit = bit.bitId >= 6; // ID >= 6 的是隐藏 Bit

      // --- 隐藏 Bit 逻辑 ---
      // 如果不是 Marute 模式，且是隐藏 Bit，强制沉睡
      if (isHiddenBit && !isMarute) {
        bit.state = 'DOCKED';
        bit.x = owner.x;
        bit.y = owner.y;
        bit.vx = 0;
        bit.vy = 0;
        bit.bladeOpen = 0;
        bit.trail = [];
        return; // 不执行后续逻辑，也不渲染
      }

      const isActive = g.state.weapon === 'SCISSOR' && g.input.pointer.down;

      // --- 全局状态流转 ---

      // 1. 发射触发
      if (isActive && bit.state === 'DOCKED') {
        // 隐藏 bit 发射延迟稍微错开一点
        const delayBase = isHiddenBit ? 15 : 10;
        if (g.time.frame % (delayBase + (bit.bitId % 6) * 5) === 0) {
          bit.state = 'DEPLOY';
          bit.timer = isMarute ? 5 : 8; // Marute 弹出更快
          // 初始爆发速度
          const speed = isMarute ? 18 : 12;
          bit.vx = (Math.random() - 0.5) * speed;
          bit.vy = (Math.random() - 0.5) * speed;
        }
      }

      // 2. 强制召回 (松手即回)
      if (!isActive && bit.state !== 'DOCKED' && bit.state !== 'RETURN') {
        bit.state = 'RETURN';
      }

      // --- 行为执行 ---
      switch (bit.state) {
        case 'DEPLOY':
          bit.updateDeploy(g);
          break;
        case 'HUNT':
          bit.updateHunt(g, isMarute);
          break;
        case 'CHAOS_CUT':
          bit.updateChaosCut(g, isMarute);
          break;
        case 'COOLDOWN':
          bit.updateCooldown(g);
          break;
        case 'RETURN':
          bit.updateReturn(g, isMarute);
          break;
        case 'DOCKED':
        default:
          bit.updateDocked(g, isMarute);
          break;
      }

      // --- 物理积分 ---
      if (bit.state !== 'CHAOS_CUT' && bit.state !== 'RETURN') {
        bit.x += bit.vx;
        bit.y += bit.vy;
      }

      // --- 视觉效果 ---
      const speed = Math.hypot(bit.vx, bit.vy);
      if (bit.state === 'CHAOS_CUT' || speed > 5) {
        bit.trail.push({
          x: bit.x,
          y: bit.y,
          life: 1.0,
          width: bit.state === 'CHAOS_CUT' ? (isMarute ? 6 : 4) : 2,
        });
      }

      for (let i = bit.trail.length - 1; i >= 0; i--) {
        bit.trail[i].life -= isMarute ? 0.05 : 0.08; // Marute 拖尾更长
        if (bit.trail[i].life <= 0) bit.trail.splice(i, 1);
      }

      if (bit.state !== 'DOCKED' && bit.state !== 'CHAOS_CUT') {
        if (speed > 1) {
          const target = Math.atan2(bit.vy, bit.vx);
          let diff = target - bit.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          bit.angle += diff * 0.25;
        }
      }
    },

    updateDeploy(g) {
      bit.bladeOpen += 0.15;
      bit.vx *= 0.85;
      bit.vy *= 0.85;
      bit.timer--;
      if (bit.timer <= 0) bit.state = 'HUNT';
    },

    updateHunt(g, isMarute) {
      bit.bladeOpen = 1.0;

      const tx = g.input.pointer.x;
      const ty = g.input.pointer.y;
      const dx = tx - bit.x;
      const dy = ty - bit.y;
      const dist = Math.hypot(dx, dy);

      // 攻击判定范围
      const attackRange = isMarute ? 280 : 180; // Marute 下索敌范围更大

      const speed = isMarute ? 2.0 : 1.0; // 接近速度更快
      bit.vx += (dx / dist) * speed;
      bit.vy += (dy / dist) * speed;
      bit.vx *= 0.92;
      bit.vy *= 0.92;

      if (dist < attackRange) {
        bit.state = 'CHAOS_CUT';
        bit.dashCount = isMarute ? 12 : 6; // 连斩次数翻倍
        bit.dashState = 'WAIT';
        bit.timer = isMarute ? 3 : 5;

        bit.chaosCenter = { x: tx, y: ty };
        // *** 范围扩大 ***
        // 普通: 120~220 -> Marute: 250~450
        const baseAmp = isMarute ? 250 : 120;
        bit.chaosAmp = baseAmp + Math.random() * (isMarute ? 200 : 100);
      }
    },

    updateChaosCut(g, isMarute) {
      bit.bladeOpen = 1.2;

      // 软跟随鼠标中心
      bit.chaosCenter.x += (g.input.pointer.x - bit.chaosCenter.x) * 0.1;
      bit.chaosCenter.y += (g.input.pointer.y - bit.chaosCenter.y) * 0.1;

      if (bit.dashState === 'WAIT') {
        bit.timer--;
        bit.vx *= 0.8;
        bit.vy *= 0.8;
        bit.x += bit.vx;
        bit.y += bit.vy;

        if (bit.timer <= 0) {
          bit.pickNextDashPoint();
          bit.dashState = 'MOVING';

          const dx = bit.dashTarget.x - bit.x;
          const dy = bit.dashTarget.y - bit.y;
          const dist = Math.hypot(dx, dy);
          // 速度极大幅提升
          const dashSpeed = isMarute ? 45 : 22;

          const frames = Math.ceil(dist / dashSpeed);
          bit.timer = Math.max(1, frames);

          bit.vx = (dx / dist) * dashSpeed;
          bit.vy = (dy / dist) * dashSpeed;
          bit.angle = Math.atan2(dy, dx);

          // 冲刺起步特效
          if (isMarute) {
            g.spawn.particle({
              type: 'shockwave',
              x: bit.x,
              y: bit.y,
              color: '#ff003c',
              size: 10,
              maxSize: 40,
              life: 0.3,
              width: 2,
            });
          }
        }
      } else if (bit.dashState === 'MOVING') {
        bit.x += bit.vx;
        bit.y += bit.vy;

        // 更加密集的残影
        if (g.time.frame % 1 === 0) {
          const color = isMarute ? '#ff003c' : '#00ffaa';
          g.spawn.particle({
            type: 'slash',
            x1: bit.x - bit.vx * 1.5,
            y1: bit.y - bit.vy * 1.5,
            x2: bit.x,
            y2: bit.y,
            color,
            thick: isMarute ? 8 : 5,
            life: isMarute ? 0.6 : 0.4,
          });
        }

        bit.timer--;
        if (bit.timer <= 0) {
          bit.x = bit.dashTarget.x;
          bit.y = bit.dashTarget.y;

          // 到达撞击特效
          if (isMarute) {
            g.spawn.particle({
              type: 'explosion',
              x: bit.x,
              y: bit.y,
              color: '#fff',
              size: 25,
              decay: 0.2,
            });
            g.camera.addShake(1);
          }

          bit.dashCount--;
          if (bit.dashCount > 0) {
            bit.dashState = 'WAIT';
            bit.timer = isMarute ? 1 : 4; // Marute 几乎无停顿
          } else {
            const isActive =
              g.state.weapon === 'SCISSOR' && g.input.pointer.down;
            if (isActive) {
              bit.state = 'COOLDOWN';
              bit.timer = isMarute ? 8 : 15; // 冷却更快
              const ang = Math.random() * 6.28;
              bit.vx = Math.cos(ang) * 5;
              bit.vy = Math.sin(ang) * 5;
            } else {
              bit.state = 'RETURN';
            }
          }
        }
      }
    },

    updateCooldown(g) {
      bit.timer--;
      bit.vx *= 0.9;
      bit.vy *= 0.9;
      const dx = g.input.pointer.x - bit.x;
      const dy = g.input.pointer.y - bit.y;
      bit.vx += dx * 0.02;
      bit.vy += dy * 0.02;

      if (bit.timer <= 0) {
        bit.state = 'HUNT';
      }
    },

    pickNextDashPoint() {
      const angle = Math.random() * Math.PI * 2;
      // 保持中心距离，制造大范围穿插
      const r = (0.5 + Math.random() * 0.5) * bit.chaosAmp;
      bit.dashTarget = {
        x: bit.chaosCenter.x + Math.cos(angle) * r,
        y: bit.chaosCenter.y + Math.sin(angle) * r,
      };
    },

    updateReturn(g, isMarute) {
      const { tx, ty } = bit.getDockingPosition();
      const dx = tx - bit.x;
      const dy = ty - bit.y;

      bit.x += dx * 0.15;
      bit.y += dy * 0.15;
      bit.bladeOpen += (0 - bit.bladeOpen) * 0.15;

      let diff = -Math.PI / 2 - bit.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      bit.angle += diff * 0.2;

      if (Math.hypot(tx - bit.x, ty - bit.y) < 20) {
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

      const targetOpen = isMarute ? 0.2 : 0;
      bit.bladeOpen += (targetOpen - bit.bladeOpen) * 0.1;

      if (isMarute) {
        bit.x += Math.random() - 0.5;
      }
    },

    getDockingPosition() {
      // 这里的逻辑需要支持 >6 个 bits 的排列
      // 0,1 -> idx 0
      // 2,3 -> idx 1
      // ...
      const side = bit.bitId % 2 === 0 ? -1 : 1;
      const idx = Math.floor(bit.bitId / 2);
      const spread = owner.transformFactor * 25;

      // 隐藏 bits 排在更后面/更外侧
      const xOffset = 32 + spread + (bit.bitId >= 6 ? 15 : 0);
      const yOffset = 10 + idx * 10;

      const tx = owner.x + side * xOffset;
      const ty = owner.y + yOffset;
      return { tx, ty };
    },

    render(g) {
      // 如果是隐藏bit且不在 Marute 模式，不渲染
      const isHiddenBit = bit.bitId >= 6;
      const isMarute = g.state.mode === 'MARUTE';

      if (isHiddenBit && !isMarute) return;

      const ctx = g.ctx2d.main;
      const color = isMarute ? '#ff003c' : '#00ffaa';

      // 拖尾绘制
      if (bit.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowBlur = isMarute ? 10 : 0; // Marute 下拖尾发光
        ctx.shadowColor = color;
        ctx.beginPath();
        for (let i = 0; i < bit.trail.length; i++) {
          const p = bit.trail[i];
          ctx.lineWidth = p.width;
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(bit.x, bit.y);
      ctx.rotate(bit.angle + Math.PI / 2);

      const scale = isMarute ? 0.7 : 0.55;
      let scaleY = scale;
      if (bit.state === 'CHAOS_CUT' && bit.dashState === 'MOVING') {
        scaleY = scale * 1.6;
      }
      ctx.scale(scale, scaleY);

      const open = bit.bladeOpen;

      // 本体
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(0, -10);
      ctx.lineTo(3, 0);
      ctx.fill();

      // 刀刃
      ctx.fillStyle = isMarute ? '#822' : '#ddd';

      // Left Blade
      ctx.save();
      ctx.rotate(-open * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-4, -5);
      ctx.lineTo(-2, -35);
      ctx.lineTo(0, -25);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -5);
      ctx.lineTo(-2, -35);
      ctx.stroke();
      ctx.restore();

      // Right Blade
      ctx.save();
      ctx.rotate(open * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(4, -5);
      ctx.lineTo(2, -35);
      ctx.lineTo(0, -25);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, -5);
      ctx.lineTo(2, -35);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    },
  };
  return bit;
}
</file>

<file path="src/entities/player/funnel_bit.js">
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

    state: 'DOCKED',
    stateTimer: 0,
    cooldown: 0,

    openFactor: 0,
    scaleFactor: 0.6,

    update(g) {
      if (bit.cooldown > 0) {
        bit.cooldown -= 1;
      }

      const isMarute = g.state.mode === 'MARUTE';
      const isHiddenBit = bit.bitId >= 6;

      // --- 隐藏 Bit 逻辑 ---
      if (isHiddenBit && !isMarute) {
        bit.state = 'DOCKED';
        bit.x = owner.x;
        bit.y = owner.y;
        bit.vx = 0;
        bit.vy = 0;
        return;
      }

      const isFiring = g.state.weapon === 'FUNNEL' && g.input.pointer.down;

      // --- 决策 ---
      if (isFiring && (bit.state === 'DOCKED' || bit.state === 'RETURN')) {
        const delay = (bit.bitId % 6) * 3 + (isHiddenBit ? 10 : 0);
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
      // 隐藏 bits 的轨道稍微大一圈
      const orbitRad =
        (isMarute ? 100 : 80) + (bit.bitId >= 6 ? 40 : 0);

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

      const tx = owner.x + side * (50 + spread + (bit.bitId >= 6 ? 20 : 0));
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
      const isHiddenBit = bit.bitId >= 6;
      const isMarute = g.state.mode === 'MARUTE';

      if (isHiddenBit && !isMarute) return;

      const ctx = g.ctx2d.main;
      ctx.save();
      ctx.translate(bit.x, bit.y);
      ctx.rotate(bit.angle + Math.PI / 2);

      ctx.scale(bit.scaleFactor, bit.scaleFactor);

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
</file>

<file path="src/weapons/missiles_vls.js">
// src/weapons/missiles_vls.js
export function createVlsMissiles() {
  return {
    name: 'MISSILE',

    update(g, owner) {
      if (!g.input.pointer.down) {
        return;
      }

      // Marute 下发射频率极高 (每2帧发一次)
      const rate = g.state.mode === 'MARUTE' ? 2 : 4;
      if (g.time.frame % rate !== 0) {
        return;
      }

      // Marute 下每次发射的数量更多 (4 -> 8)
      const count = g.state.mode === 'MARUTE' ? 8 : 2;

      for (let i = 0; i < count; i++) {
        const idx = owner.vlsIndex;
        owner.vlsIndex = (owner.vlsIndex + 1) % 32;

        const side = idx < 16 ? -1 : 1;
        const localIdx = idx % 16;
        const row = Math.floor(localIdx / 2);
        const col = localIdx % 2;

        const binderXOffset = 45 + owner.transformFactor * 25;
        const startX = -14;
        const startY = -50;
        const cellW = 8;

        const cellX = startX + col * (cellW + 2);
        const cellY = startY + row * 12;

        const ox = owner.x + side * binderXOffset + side * cellX;
        const oy = owner.y + cellY;

        const color = g.state.mode === 'MARUTE' ? '#ff003c' : '#ffaa00';
        const isMarute = g.state.mode === 'MARUTE';

        g.spawn.projectile({
          type: 'missile',
          from: 'player',
          x: ox,
          y: oy,

          // eject wide spread
          // Marute 下初始扩散角度更大，形成扇形弹幕
          vx: (Math.random() - 0.5) * (isMarute ? 50 : 25),
          vy: -5 - Math.random() * (isMarute ? 25 : 15),

          // missile guidance params
          tx: g.input.pointer.x,
          ty: g.input.pointer.y,
          marute: isMarute,
          life: 300,
          state: 'EJECT',
          timer: 5 + Math.random() * 15,
          speed: 0,
          maxSpeed: 20 + Math.random() * 10,
          curveBias: (Math.random() - 0.5) * (isMarute ? 0.5 : 0.2), // 甚至可以拐大弯
          angle: -Math.PI / 2,

          color,
        });
      }
    },
  };
}
</file>

<file path="src/systems/projectiles.js">
// src/systems/projectiles.js
function clamp(v, a, b) {
  if (v < a) {
    return a;
  }
  if (v > b) {
    return b;
  }
  return v;
}

function normAngleDiff(d) {
  while (d < -Math.PI) {
    d += Math.PI * 2;
  }
  while (d > Math.PI) {
    d -= Math.PI * 2;
  }
  return d;
}

export function createProjectileSystem() {
  const list = [];

  function spawn(p) {
    list.push({ ...p });
  }

  function updateRifle(g, p) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    if (p.life <= 0) {
      p.dead = true;
      return;
    }

    g.spawn.particle({
      type: 'beam_trail',
      x: p.x,
      y: p.y,
      color: p.color,
      size: p.width * 0.8,
      decay: 0.1,
      vx: 0,
      vy: 0,
    });
  }

  function updateFunnelBeam(g, p) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    if (p.life <= 0) {
      p.dead = true;
    }
  }

  function updateMissile(g, p) {
    p.life -= 1;
    if (p.life <= 0) {
      p.dead = true;
      // 死亡自爆（没打中）
      createMissileExplosion(g, p);
      return;
    }

    if (p.state === 'EJECT') {
      p.timer -= 1;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.vy += 0.2;

      if (p.timer <= 0) {
        p.state = 'TRACK';
        p.speed = 3;
        // 点火特效
        g.spawn.particle({
          type: 'explosion',
          x: p.x,
          y: p.y,
          color: '#fff',
          size: 8,
          decay: 0.2,
        });
      }
    } else {
      if (p.speed < p.maxSpeed) {
        p.speed += 0.8;
      }

      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const targetAngle = Math.atan2(dy, dx);
      const currentAngle = Math.atan2(p.vy, p.vx);

      let turnRate = 0.08 + p.speed * 0.005;
      if (p.marute) {
        turnRate *= 1.5;
      }

      const wobble = Math.sin(g.time.frame * 0.2) * 0.1;
      const biased = targetAngle + wobble + p.curveBias;

      let diff = normAngleDiff(biased - currentAngle);
      const nextAngle = currentAngle + diff * turnRate;

      p.vx = Math.cos(nextAngle) * p.speed;
      p.vy = Math.sin(nextAngle) * p.speed;
      p.angle = nextAngle;
      p.curveBias *= 0.95;
    }

    p.x += p.vx;
    p.y += p.vy;

    // 烟雾频率增加
    if (g.time.frame % 2 === 0 || p.marute) {
      g.spawn.particle({
        type: 'gn_smoke',
        x: p.x,
        y: p.y,
        color: p.color,
        size: p.marute ? 6 : 4,
        decay: 0.03,
      });
    }

    const hitDist = Math.hypot(p.tx - p.x, p.ty - p.y);
    // 判定范围略微增大
    if (hitDist < 50) {
      p.dead = true;
      createMissileExplosion(g, p);
    }
  }

  function createMissileExplosion(g, p) {
    const isBig = p.marute;
    // 爆炸火球
    g.spawn.particle({
      type: 'explosion',
      x: p.x,
      y: p.y,
      color: p.color,
      size: isBig ? 60 : 30, // 爆炸范围增大
      decay: isBig ? 0.05 : 0.1,
    });

    // 冲击波
    g.spawn.particle({
      type: 'shockwave',
      x: p.x,
      y: p.y,
      color: '#fff',
      size: 10,
      maxSize: isBig ? 100 : 50,
      life: 0.4,
      width: 4,
    });

    g.camera.addShake(isBig ? 5 : 2);
  }

  function updateRailgunBeam(g, p) {
    p.life -= 1;
    if (p.life <= 0) p.dead = true;

    if (p.isSustained && Math.random() > 0.3) {
      const t = Math.random();
      const bx = p.x + (p.tx - p.x) * t;
      const by = p.y + (p.ty - p.y) * t;

      const perpX = p.ty - p.y;
      const perpY = -(p.tx - p.x);
      const len = Math.hypot(perpX, perpY);
      const nx = perpX / len;
      const ny = perpY / len;

      const offset = (Math.random() - 0.5) * p.width * 1.8;

      g.spawn.particle({
        type: 'electric_arc',
        x: bx + nx * offset,
        y: by + ny * offset,
        color: p.color,
        size: p.width * 0.6,
      });
    }
  }

  function update(g) {
    for (const p of list) {
      if (p.dead) {
        continue;
      }

      if (p.type === 'rifle') {
        updateRifle(g, p);
      } else if (p.type === 'funnel_beam') {
        updateFunnelBeam(g, p);
      } else if (p.type === 'missile') {
        updateMissile(g, p);
      } else if (p.type === 'railgun_beam') {
        updateRailgunBeam(g, p);
      } else {
        p.x += p.vx || 0;
        p.y += p.vy || 0;
        p.life = (p.life || 60) - 1;
        if (p.life <= 0) {
          p.dead = true;
        }
      }

      if (
        p.type !== 'railgun_beam' &&
        (p.x < -200 ||
          p.x > g.screen.w + 200 ||
          p.y < -200 ||
          p.y > g.screen.h + 200)
      ) {
        p.dead = true;
      }
    }

    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].dead) {
        list.splice(i, 1);
      }
    }
  }

  function render(g) {
    const ctx = g.ctx2d.main;

    for (const p of list) {
      if (p.type === 'missile') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);

        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;

        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-20, -5);
        ctx.lineTo(-20, 5);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillRect(-5, -2, 15, 4);

        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowBlur = 0;
        ctx.restore();
        continue;
      }

      if (p.type === 'railgun_beam') {
        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.globalCompositeOperation = 'lighter';

        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.width;
        ctx.globalAlpha = alpha * 0.4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.tx, p.ty);
        ctx.stroke();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = p.width * 0.4;
        ctx.globalAlpha = alpha * 0.8;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.tx, p.ty);
        ctx.stroke();

        const ringSpacing = 80;
        const totalLen = Math.hypot(p.tx - p.x, p.ty - p.y);
        const offsetBase = (g.time.frame * 50) % ringSpacing;

        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.ty - p.y, p.tx - p.x));

        ctx.fillStyle = '#fff';
        ctx.globalAlpha = alpha * 0.5;

        for (let d = offsetBase; d < totalLen; d += ringSpacing) {
          const scale = 1 - (d / totalLen) * 0.5;
          if (scale <= 0) continue;

          ctx.beginPath();
          ctx.ellipse(
            d,
            0,
            8 * scale,
            p.width * 0.6 * scale,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }

        ctx.restore();
        continue;
      }

      if (p.type === 'rifle') {
        ctx.save();
        ctx.translate(p.x, p.y);
        const ang = Math.atan2(p.vy || 0, p.vx || -1);
        ctx.rotate(ang);

        // 1. 光晕层 (宽大，模糊)
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;

        // 绘制一个梭形/菱形
        const len = p.length || 60;
        const wid = p.width || 12;

        ctx.beginPath();
        ctx.moveTo(len / 2, 0); // 头部
        ctx.lineTo(-len / 2, wid / 2); // 左翼
        ctx.lineTo(-len / 2 - 10, 0); // 尾部凹槽
        ctx.lineTo(-len / 2, -wid / 2); // 右翼
        ctx.closePath();
        ctx.fill();

        // 2. 核心层 (亮白，锐利)
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(len / 2 - 5, 0);
        ctx.lineTo(-len / 2 + 5, wid / 4);
        ctx.lineTo(-len / 2, 0);
        ctx.lineTo(-len / 2 + 5, -wid / 4);
        ctx.closePath();
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
        continue;
      }

      // Funnel Beam (generic)
      ctx.save();
      ctx.translate(p.x, p.y);
      const ang = Math.atan2(p.vy || 0, p.vx || -1);
      ctx.rotate(ang);

      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = p.color;
      ctx.fillRect(
        -(p.length || 20) / 2 - 2,
        -(p.width || 2) / 2 - 2,
        (p.length || 20) + 4,
        (p.width || 2) + 4,
      );

      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  return { spawn, update, render, list };
}
</file>

<file path="src/entities/player/harute.js">
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

      // 增加 Trans-Am 时的残影效果
      if (g.state.mode === 'MARUTE' && g.time.frame % 3 === 0) {
          // 这里可以生成一个临时的 particle 来做残影，或者简单的 camera shake 增强
      }
    },

    render(g) {
      const ctx = g.ctx2d.main;

      // === Trans-Am 残影绘制 ===
      if (g.state.mode === 'MARUTE') {
          ctx.save();
          ctx.translate(player.x + (Math.random()-0.5)*4, player.y + (Math.random()-0.5)*4);
          ctx.globalAlpha = 0.3;
          ctx.globalCompositeOperation = 'lighter';
          // 简化的绘制，只画主体颜色
          ctx.fillStyle = '#ff003c';
          ctx.beginPath();
          ctx.moveTo(0, -50);
          ctx.lineTo(40, 30);
          ctx.lineTo(-40, 30);
          ctx.fill();
          ctx.restore();
      }

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