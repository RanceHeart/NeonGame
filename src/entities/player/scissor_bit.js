// src/entities/player/scissor_bit.js
/**
 * 创建 SCISSOR 武器：
 * - 按住触发定频率斩击
 * - 选择可用 bit 调用 bit.triggerSlash 做“十字斩”
 * @returns {{name:string, update:(g:any, owner:any)=>void}}
 */
export function createScissorBit({ id, owner }) {
  const bit = {
    id: `player.scissor.${id}`,
    tags: ['scissor_bit'],
    alive: true,
    owner,
    bitId: id,

    // Physics
    x: owner.x,
    y: owner.y,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,

    // State Machine: DOCKED | DEPLOY | HUNT | CHAOS_CUT | COOLDOWN | RETURN
    state: 'DOCKED',
    timer: 0,

    // Slash Parameters
    chaosCenter: { x: 0, y: 0 },
    chaosAmp: 0,
    dashTarget: { x: 0, y: 0 },
    dashCount: 0,
    dashState: 'IDLE', // 'MOVING' or 'WAIT'

    // Visuals
    bladeOpen: 0,
    scale: 0.6,
    trail: [],

    update(g) {
      const isMarute = g.state.mode === 'MARUTE';
      const isHiddenBit = bit.bitId >= 6; // ID >= 6 are hidden Bits

      // --- Hidden Bit Logic ---
      if (isHiddenBit && !isMarute) {
        bit.state = 'DOCKED';
        bit.x = owner.x;
        bit.y = owner.y;
        bit.vx = 0;
        bit.vy = 0;
        bit.bladeOpen = 0;
        bit.trail = [];
        return;
      }

      const isActive = g.state.weapon === 'SCISSOR' && g.input.pointer.down;

      // --- Global State Flow ---

      // 1. Launch Trigger
      if (isActive && bit.state === 'DOCKED') {
        const delayBase = isHiddenBit ? 15 : 10;
        if (g.time.frame % (delayBase + (bit.bitId % 6) * 5) === 0) {
          bit.state = 'DEPLOY';
          bit.timer = isMarute ? 5 : 8;
          const speed = isMarute ? 18 : 12;
          bit.vx = (Math.random() - 0.5) * speed;
          bit.vy = (Math.random() - 0.5) * speed;
        }
      }

      // 2. Forced Return
      if (!isActive && bit.state !== 'DOCKED' && bit.state !== 'RETURN') {
        bit.state = 'RETURN';
      }

      // --- Behavior Execution ---
      switch (bit.state) {
        case 'DEPLOY': {
          bit.updateDeploy(g);
          break;
        }
        case 'HUNT': {
          bit.updateHunt(g, isMarute);
          break;
        }
        case 'CHAOS_CUT': {
          bit.updateChaosCut(g, isMarute);
          break;
        }
        case 'COOLDOWN': {
          bit.updateCooldown(g);
          break;
        }
        case 'RETURN': {
          bit.updateReturn(g, isMarute);
          break;
        }
        case 'DOCKED':
        default: {
          bit.updateDocked(g, isMarute);
          break;
        }
      }

      // --- Physics Integration ---
      if (bit.state !== 'CHAOS_CUT' && bit.state !== 'RETURN') {
        bit.x += bit.vx;
        bit.y += bit.vy;
      }

      // --- Visual Effects ---
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
        bit.trail[i].life -= isMarute ? 0.05 : 0.08;
        if (bit.trail[i].life <= 0) {
          bit.trail.splice(i, 1);
        }
      }

      if (bit.state !== 'DOCKED' && bit.state !== 'CHAOS_CUT') {
        if (speed > 1) {
          const target = Math.atan2(bit.vy, bit.vx);
          let diff = target - bit.angle;
          while (diff > Math.PI) {
            diff -= Math.PI * 2;
          }
          while (diff < -Math.PI) {
            diff += Math.PI * 2;
          }
          bit.angle += diff * 0.25;
        }
      }
    },

    updateDeploy(g) {
      bit.bladeOpen += 0.15;
      bit.vx *= 0.85;
      bit.vy *= 0.85;
      bit.timer--;
      if (bit.timer <= 0) {
        bit.state = 'HUNT';
      }
    },

    updateHunt(g, isMarute) {
      bit.bladeOpen = 1.0;

      const tx = g.input.pointer.x;
      const ty = g.input.pointer.y;
      const dx = tx - bit.x;
      const dy = ty - bit.y;
      const dist = Math.hypot(dx, dy);

      const attackRange = isMarute ? 350 : 180;
      const speed = isMarute ? 2.5 : 1.0;

      if (dist > 0.0001) {
        bit.vx += (dx / dist) * speed;
        bit.vy += (dy / dist) * speed;
      }
      bit.vx *= 0.92;
      bit.vy *= 0.92;

      if (dist < attackRange) {
        bit.state = 'CHAOS_CUT';

        // 常态：切割节奏变慢（不是移动速度）
        bit.dashCount = isMarute ? 12 : 6;
        bit.dashState = 'WAIT';
        bit.timer = isMarute ? 3 : 10; // 常态：首次切割前间隔更长

        bit.chaosCenter = { x: tx, y: ty };

        // 常态：切割距离更大（chaosAmp 更大）
        const baseAmp = isMarute ? 300 : 240;
        bit.chaosAmp = baseAmp + Math.random() * (isMarute ? 200 : 160);
      }
    },

    updateChaosCut(g, isMarute) {
      bit.bladeOpen = 1.2;
      bit.chaosCenter.x += (g.input.pointer.x - bit.chaosCenter.x) * 0.1;
      bit.chaosCenter.y += (g.input.pointer.y - bit.chaosCenter.y) * 0.1;

      // ✅ 常态：每刀间隔更长（切割速度更慢）
      const waitFrames = isMarute ? 1 : 25;

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

          // ✅ dashSpeed 不动/接近不动：主要靠 waitFrames 控制“切割频率”
          const dashSpeed = isMarute ? 50 : 22;

          const safeDist = Math.max(0.0001, dist);
          const frames = Math.ceil(safeDist / dashSpeed);
          bit.timer = Math.max(1, frames);

          bit.vx = (dx / safeDist) * dashSpeed;
          bit.vy = (dy / safeDist) * dashSpeed;
          bit.angle = Math.atan2(dy, dx);

          if (isMarute) {
            g.spawn.particle({
              type: 'shockwave',
              x: bit.x,
              y: bit.y,
              color: '#ff003c',
              size: 10,
              maxSize: 60,
              life: 0.3,
              width: 3,
            });
          }
        }
      } else if (bit.dashState === 'MOVING') {
        bit.x += bit.vx;
        bit.y += bit.vy;

        // ============================================================
        // ✅ 还原“碰撞检测”：每一帧移动都生成伤害判定体（projectile）
        // 同时保留线条 slash 粒子（视觉）
        // ============================================================
        {
          const color = isMarute ? '#ff003c' : '#00ffaa';

          // 1) 线条粒子（保留）
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

          // 2) 伤害判定体（还原/保留）
          // 注意：你原来的 collisions.js 若是识别 type:'scissor_slash'，
          // 这段会继续触发；字段多给不影响，缺字段才会出问题。
          g.spawn.projectile({
            type: 'scissor_slash',
            from: 'player',
            x: bit.x,
            y: bit.y,
            vx: 0,
            vy: 0,
            width: 40,
            height: 40, // 兼容部分碰撞实现（如果用 AABB）
            life: 2, // ✅ 还原：极短存活，只为判定（你之前是 2）
            color,
          });
        }
        // ============================================================

        bit.timer--;
        if (bit.timer <= 0) {
          bit.x = bit.dashTarget.x;
          bit.y = bit.dashTarget.y;

          if (isMarute) {
            g.spawn.particle({
              type: 'explosion',
              x: bit.x,
              y: bit.y,
              color: '#fff',
              size: 30,
              decay: 0.2,
            });
            g.camera.addShake(2);
          }

          bit.dashCount--;
          if (bit.dashCount > 0) {
            bit.dashState = 'WAIT';
            bit.timer = waitFrames; // 常态：每刀之后停顿更久
          } else {
            const isActive =
              g.state.weapon === 'SCISSOR' && g.input.pointer.down;
            if (isActive) {
              bit.state = 'COOLDOWN';
              bit.timer = isMarute ? 5 : 15;
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

      // 常态：切割距离更大（半径更偏向大值）
      const ampBias = 0.75;
      const r = (ampBias + Math.random() * (1 - ampBias)) * bit.chaosAmp;

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
      while (diff > Math.PI) {
        diff -= Math.PI * 2;
      }
      while (diff < -Math.PI) {
        diff += Math.PI * 2;
      }
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
      bit.bladeOpen = 0;
      if (isMarute) {
        bit.x += (Math.random() - 0.5) * 1;
      }
    },

    getDockingPosition() {
      const side = bit.bitId % 2 === 0 ? -1 : 1;
      const idx = Math.floor(bit.bitId / 2);
      const spread = owner.transformFactor * 25;
      const binderEdgeX = 75 + spread;
      const yOffset = -20 + idx * 8;
      const xOffset = binderEdgeX + idx * 2;
      const tx = owner.x + side * xOffset;
      const ty = owner.y + yOffset;
      return { tx, ty };
    },

    render(g) {
      const isHiddenBit = bit.bitId >= 6;
      const isMarute = g.state.mode === 'MARUTE';

      // Don't render hidden bits in normal mode
      if (isHiddenBit && !isMarute) {
        return;
      }

      const ctx = g.ctx2d.main;
      const color = isMarute ? '#ff003c' : '#00ffaa';

      // --- Trail Rendering ---
      if (bit.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowBlur = isMarute ? 15 : 5;
        ctx.shadowColor = color;
        ctx.beginPath();
        for (let i = 0; i < bit.trail.length; i++) {
          const p = bit.trail[i];
          ctx.lineWidth = p.width;
          if (i === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.restore();
      }

      // --- Bit Geometry Rendering ---
      ctx.save();
      ctx.translate(bit.x, bit.y);
      ctx.rotate(bit.angle + Math.PI / 2);

      // Scale up slightly for presence
      const scale = isMarute ? 0.9 : 0.8;
      ctx.scale(scale, scale);

      // Styling Constants
      const open = bit.bladeOpen; // 0.0 ~ 1.2
      const innerColor = '#eee';

      // Create Gradient for Armor
      const grad = ctx.createLinearGradient(-10, 0, 10, 0);
      grad.addColorStop(0, '#ff9500');
      grad.addColorStop(1, '#cc7000');

      const drawHalf = (dir) => {
        ctx.save();
        ctx.rotate(dir * open * 0.4);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(dir * 8, -2);
        ctx.lineTo(dir * 10, 20);
        ctx.lineTo(dir * 2, 50);
        ctx.lineTo(0, 45);
        ctx.fill();

        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 45);
        ctx.lineTo(dir * -3, 30);
        ctx.lineTo(dir * -2, 0);
        ctx.fill();

        if (open > 0.1) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.moveTo(0, 5);
          ctx.lineTo(0, 45);
          ctx.lineTo(dir * 2, 50);
          ctx.fill();
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(dir * 4, 5);
        ctx.lineTo(dir * 6, 8);
        ctx.lineTo(dir * 6, 25);
        ctx.lineTo(dir * 3, 22);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dir * 8, -2);
        ctx.lineTo(dir * 4, 10);
        ctx.stroke();

        ctx.restore();
      };

      drawHalf(1);
      drawHalf(-1);

      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(0, -4, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(0, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
  };

  return bit;
}
