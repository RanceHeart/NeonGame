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
      const isActive = g.state.weapon === 'SCISSOR' && g.input.pointer.down;

      // --- 全局状态流转 ---

      // 1. 发射触发
      if (isActive && bit.state === 'DOCKED') {
        if (g.time.frame % (10 + bit.bitId * 5) === 0) {
          bit.state = 'DEPLOY';
          bit.timer = 8;
          bit.vx = (Math.random() - 0.5) * 12; // 初始爆发速度快一点
          bit.vy = (Math.random() - 0.5) * 12;
        }
      }

      // 2. 强制召回 (松手即回)
      // 注意：如果是在 COOLDOWN (连斩间隙) 松手，也应该立刻回家
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
          break; // 新增：连斩间的调整
        case 'RETURN':
          bit.updateReturn(g, isMarute);
          break;
        case 'DOCKED':
        default:
          bit.updateDocked(g, isMarute);
          break;
      }

      // --- 物理积分 ---
      // CHAOS_CUT 自己控制位移，其他状态使用标准积分
      if (bit.state !== 'CHAOS_CUT' && bit.state !== 'RETURN') {
        bit.x += bit.vx;
        bit.y += bit.vy;
      }

      // --- 视觉效果 ---

      // 拖尾生成
      const speed = Math.hypot(bit.vx, bit.vy);
      if (bit.state === 'CHAOS_CUT' || speed > 5) {
        bit.trail.push({
          x: bit.x,
          y: bit.y,
          life: 1.0,
          width: bit.state === 'CHAOS_CUT' ? 4 : 2, // 斩击时拖尾更宽
        });
      }

      // 拖尾更新
      for (let i = bit.trail.length - 1; i >= 0; i--) {
        bit.trail[i].life -= 0.08;
        if (bit.trail[i].life <= 0) bit.trail.splice(i, 1);
      }

      // 角度控制 (斩击时由逻辑锁定，不自动旋转)
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

    // --- 状态方法 ---

    updateDeploy(g) {
      bit.bladeOpen += 0.15;
      bit.vx *= 0.85; // 快速减速，准备进入追踪
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
      const attackRange = 180;

      // 高速接近
      const speed = isMarute ? 1.5 : 1.0;
      bit.vx += (dx / dist) * speed;
      bit.vy += (dy / dist) * speed;
      bit.vx *= 0.92;
      bit.vy *= 0.92;

      if (dist < attackRange) {
        // 进入斩击模式
        bit.state = 'CHAOS_CUT';
        bit.dashCount = isMarute ? 8 : 6; // 六连斩
        bit.dashState = 'WAIT';
        bit.timer = 5;

        // 设定中心点
        bit.chaosCenter = { x: tx, y: ty };
        // 范围扩大 (120 ~ 220)
        bit.chaosAmp = 120 + Math.random() * 100;
      }
    },

    updateChaosCut(g, isMarute) {
      bit.bladeOpen = 1.2;

      // 软跟随鼠标中心
      bit.chaosCenter.x += (g.input.pointer.x - bit.chaosCenter.x) * 0.1;
      bit.chaosCenter.y += (g.input.pointer.y - bit.chaosCenter.y) * 0.1;

      if (bit.dashState === 'WAIT') {
        // 蓄力停顿
        bit.timer--;
        // 漂浮阻尼
        bit.vx *= 0.8;
        bit.vy *= 0.8;
        bit.x += bit.vx; // 此时还是允许微小移动
        bit.y += bit.vy;

        if (bit.timer <= 0) {
          bit.pickNextDashPoint();
          bit.dashState = 'MOVING';

          // 计算冲刺参数
          const dx = bit.dashTarget.x - bit.x;
          const dy = bit.dashTarget.y - bit.y;
          const dist = Math.hypot(dx, dy);
          const dashSpeed = isMarute ? 28 : 22; // 极快

          // 几帧到达？
          const frames = Math.ceil(dist / dashSpeed);
          bit.timer = Math.max(1, frames);

          bit.vx = (dx / dist) * dashSpeed;
          bit.vy = (dy / dist) * dashSpeed;
          bit.angle = Math.atan2(dy, dx); // 刀尖对准冲刺方向

          // 斩击音效/闪光可在此处添加
          g.spawn.particle({
            type: 'spark',
            x: bit.x,
            y: bit.y,
            color: '#fff',
            size: 3,
          });
        }
      } else if (bit.dashState === 'MOVING') {
        // 冲刺过程
        bit.x += bit.vx;
        bit.y += bit.vy;

        // 残影
        if (g.time.frame % 2 === 0) {
          const color = isMarute ? '#ff003c' : '#00ffaa';
          g.spawn.particle({
            type: 'slash',
            x1: bit.x - bit.vx,
            y1: bit.y - bit.vy,
            x2: bit.x,
            y2: bit.y,
            color,
            thick: 5,
            life: 0.4,
          });
        }

        bit.timer--;
        if (bit.timer <= 0) {
          // 强制到达终点
          bit.x = bit.dashTarget.x;
          bit.y = bit.dashTarget.y;

          bit.dashCount--;
          if (bit.dashCount > 0) {
            bit.dashState = 'WAIT';
            bit.timer = isMarute ? 2 : 4; // 顿帧
          } else {
            // === 连斩结束决策 ===
            const isActive =
              g.state.weapon === 'SCISSOR' && g.input.pointer.down;
            if (isActive) {
              // 如果还按着鼠标，进入冷却调整，准备下一轮
              bit.state = 'COOLDOWN';
              bit.timer = 15; // 休息 15 帧 (0.25秒)
              // 给一个散开的速度
              const ang = Math.random() * 6.28;
              bit.vx = Math.cos(ang) * 5;
              bit.vy = Math.sin(ang) * 5;
            } else {
              // 没按鼠标，回家
              bit.state = 'RETURN';
            }
          }
        }
      }
    },

    updateCooldown(g) {
      // 这是一个在目标附近盘旋的临时状态
      bit.timer--;
      bit.vx *= 0.9;
      bit.vy *= 0.9;

      // 稍微被鼠标吸引，防止飞太远
      const dx = g.input.pointer.x - bit.x;
      const dy = g.input.pointer.y - bit.y;
      bit.vx += dx * 0.02;
      bit.vy += dy * 0.02;

      if (bit.timer <= 0) {
        // 冷却结束，重新开始狩猎（几乎会立刻触发斩击，因为距离很近）
        bit.state = 'HUNT';
      }
    },

    pickNextDashPoint() {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * bit.chaosAmp; // 均匀分布
      bit.dashTarget = {
        x: bit.chaosCenter.x + Math.cos(angle) * r,
        y: bit.chaosCenter.y + Math.sin(angle) * r,
      };

      // 避免原地踏步
      if (Math.hypot(bit.dashTarget.x - bit.x, bit.dashTarget.y - bit.y) < 80) {
        bit.dashTarget.x = bit.chaosCenter.x + Math.cos(angle) * bit.chaosAmp;
        bit.dashTarget.y = bit.chaosCenter.y + Math.sin(angle) * bit.chaosAmp;
      }
    },

    updateReturn(g, isMarute) {
      const side = bit.bitId % 2 === 0 ? -1 : 1;
      const idx = Math.floor(bit.bitId / 2);
      const spread = owner.transformFactor * 25;

      const tx = owner.x + side * (32 + spread);
      const ty = owner.y + 10 + idx * 10;

      // 回归速度
      bit.x += (tx - bit.x) * 0.15;
      bit.y += (ty - bit.y) * 0.15;
      bit.bladeOpen += (0 - bit.bladeOpen) * 0.15;

      // 角度复位
      let diff = -Math.PI / 2 - bit.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      bit.angle += diff * 0.2;

      // *** 修复：判定范围从 3 增加到 20 ***
      // 这样即使飞船在移动，也能成功吸附 docking
      if (Math.hypot(tx - bit.x, ty - bit.y) < 20) {
        bit.state = 'DOCKED';
        bit.x = tx; // 强制吸附
        bit.y = ty;
        bit.vx = 0; // 清空速度
        bit.vy = 0;
        bit.angle = -Math.PI / 2;
      }
    },

    updateDocked(g, isMarute) {
      const side = bit.bitId % 2 === 0 ? -1 : 1;
      const idx = Math.floor(bit.bitId / 2);
      const spread = owner.transformFactor * 25;

      bit.x = owner.x + side * (32 + spread);
      bit.y = owner.y + 10 + idx * 10;
      bit.vx = 0;
      bit.vy = 0;
      bit.angle = -Math.PI / 2;

      const targetOpen = isMarute ? 0.2 : 0;
      bit.bladeOpen += (targetOpen - bit.bladeOpen) * 0.1;

      if (isMarute) {
        bit.x += Math.random() - 0.5;
      }
    },

    render(g) {
      const ctx = g.ctx2d.main;
      const isMarute = g.state.mode === 'MARUTE';
      const color = isMarute ? '#ff003c' : '#00ffaa';

      // 拖尾绘制
      if (bit.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
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

      // 冲刺时的视觉拉伸 (Squash & Stretch)
      let scaleY = scale;
      if (bit.state === 'CHAOS_CUT' && bit.dashState === 'MOVING') {
        scaleY = scale * 1.6; // 拉长
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
