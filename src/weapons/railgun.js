// src/weapons/railgun.js
/**
 * 创建 Railgun 武器：
 * - 状态机：IDLE -> CHARGING -> FIRING -> COOLDOWN
 * - CHARGING：按住蓄力（有震动/粒子/charging effect）
 * - FIRING：持续照射（消耗 charge，生成 railgun_beam 段）
 * - COOLDOWN：过热冷却（冒烟 + UI）
 * @returns {any}
 */
export function createRailgunWeapon() {
  // 状态枚举：IDLE, CHARGING, FIRING, COOLDOWN
  let state = 'IDLE';
  let charge = 0;
  let cdTimer = 0;

  // 配置参数
  const MAX_CHARGE = 100;
  const CHARGE_RATE = 0.9;
  const DRAIN_RATE = 0.35; // 稍微加快消耗速度，让衰减感更明显
  const COOLDOWN_TIME = 60;

  // 视觉参数
  let beamWidthFlicker = 0;

  return {
    name: 'RAILGUN',

    update(g, owner) {
      const isMarute = g.state.mode === 'MARUTE';
      const color = isMarute ? '#ff003c' : '#00ffaa';

      const currentChargeRate = isMarute ? CHARGE_RATE * 1.5 : CHARGE_RATE;

      // ----------------------------------------------------------------
      // 状态机逻辑
      // ----------------------------------------------------------------

      // 1. 待机与充能 (IDLE / CHARGING)
      if (state === 'IDLE' || state === 'CHARGING') {
        if (g.input.pointer.down) {
          state = 'CHARGING';
          charge += currentChargeRate;

          // 充能视觉与震动
          if (charge > 10) {
            const ratio = Math.min(charge / MAX_CHARGE, 1);
            g.camera.addShake(Math.pow(ratio, 3) * 4);

            // 粒子汇聚特效 (Implosion)
            if (g.time.frame % 2 === 0) {
              this.spawnChargeParticle(g, owner, color, ratio);
            }
          }

          this.drawChargeEffect(g, owner, charge, MAX_CHARGE, color);

          // 达到阈值，开始喷射
          if (charge >= MAX_CHARGE) {
            charge = MAX_CHARGE;
            state = 'FIRING';

            // 开火瞬间爆发特效
            // 位置修正：向上一点 (-85)
            const muzzleY = owner.y - 85;
            g.camera.addShake(20);
            g.spawn.particle({
              type: 'shockwave',
              x: owner.x,
              y: muzzleY,
              color: color,
              maxSize: 220,
              life: 0.5,
            });
          }
        } else {
          // 松开鼠标，电量快速衰减（取消蓄力）
          if (charge > 0) {
            charge = Math.max(0, charge - 5);
            this.drawChargeEffect(g, owner, charge, MAX_CHARGE, color);
          }
          state = 'IDLE';
        }
      }

      // 2. 持续照射 (FIRING)
      else if (state === 'FIRING') {
        if (!g.input.pointer.down || charge <= 0) {
          state = 'COOLDOWN';
          cdTimer = COOLDOWN_TIME;
          for (let i = 0; i < 8; i++) this.spawnVentSmoke(g, owner, true);
          return;
        }

        // --- 核心修改：基于剩余能量的动态参数 ---
        const rawEnergyRatio = Math.max(0, charge / MAX_CHARGE);

        // 能量系数：最低保留 0.4 的强度，避免最后太细看不见
        const powerScale = 0.4 + 0.6 * rawEnergyRatio;

        charge -= DRAIN_RATE;

        // 动态后坐力与震动 (随能量减弱)
        owner.recoilY += (isMarute ? 0.2 : 0.15) * powerScale * powerScale;
        g.camera.addShake((isMarute ? 5 : 3) * powerScale);

        // 发射光束段
        if (g.time.frame % 2 === 0) {
          this.fireBeamSegment(g, owner, color, isMarute, rawEnergyRatio);
        }

        // 炮口光晕也随能量缩小
        this.drawMuzzleFlash(g, owner, color, powerScale);
      }

      // 3. 过热冷却 (COOLDOWN)
      else if (state === 'COOLDOWN') {
        cdTimer--;

        // 持续冒烟散热 (Venting)
        if (cdTimer % 5 === 0) {
          this.spawnVentSmoke(g, owner, false);
        }

        // 绘制冷却条/过热提示
        this.drawCooldownUI(g, owner, cdTimer, COOLDOWN_TIME);

        if (cdTimer <= 0) {
          state = 'IDLE';
          charge = 0;
        }
      }
    },

    // --- Actions & VFX ---

    spawnChargeParticle(g, owner, color, ratio) {
      // 位置修正：向上一点 (-85)
      const muzzleY = owner.y - 85;
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + (1 - ratio) * 80; // 越充越近
      g.spawn.particle({
        type: 'spark', // 利用 spark 做向心运动
        x: owner.x + Math.cos(angle) * dist,
        y: muzzleY + Math.sin(angle) * dist,
        vx: -Math.cos(angle) * (15 + ratio * 20), // 极速吸入
        vy: -Math.sin(angle) * (15 + ratio * 20),
        color: Math.random() > 0.5 ? '#fff' : color,
        life: 0.2,
        size: 2,
      });
    },

    spawnVentSmoke(g, owner, isBurst) {
      // 散热位置：稍微靠下一点，类似两侧散热口 (-40)
      const side = Math.random() > 0.5 ? 1 : -1;
      const speed = isBurst ? 4 : 1;
      g.spawn.particle({
        type: 'gn_smoke',
        x: owner.x + side * (10 + Math.random() * 10),
        y: owner.y - 40,
        vx: side * (1 + Math.random()) * speed,
        vy: -(1 + Math.random() * 2) * speed,
        color: '#ccc',
        size: isBurst ? 8 + Math.random() * 8 : 4 + Math.random() * 4,
        decay: 0.02,
      });
    },

    fireBeamSegment(g, owner, color, isMarute, energyRatio = 1.0) {
      // 调整 1：位置修正，对准红点 (-85)
      const muzzleY = owner.y - 85;

      const maxW = isMarute ? 130 : 70; // 满能量宽度
      const minW = isMarute ? 40 : 20; // 空能量宽度

      // 调整 2：非线性宽度衰减 (Ease Out / Pow)
      // 使用平方根函数: Math.pow(x, 0.4)
      // 效果：能量 1.0 -> 0.5 时，宽度变化较小；0.5 -> 0.0 时，宽度快速下降
      const easedRatio = Math.pow(energyRatio, 0.4);

      // 线性插值计算当前宽度
      const currentBase = minW + (maxW - minW) * easedRatio;

      // 抖动幅度也随能量减小
      const flickerAmp = 20 * easedRatio;
      beamWidthFlicker = currentBase + (Math.random() - 0.5) * flickerAmp;

      g.spawn.projectile({
        type: 'railgun_beam',
        from: 'player',
        x: owner.x,
        y: muzzleY,
        // 目标：正上方极远处
        tx: owner.x + (Math.random() - 0.5) * 5, // 极小抖动
        ty: owner.y - 1200,
        width: beamWidthFlicker,
        color: color,
        life: 4, // 存活极短，依赖高频发射维持视觉
        maxLife: 4,
        isSustained: true, // 标记为持续光束
        powerRatio: energyRatio, // 传递原始能量比率用于其他特效
      });
    },

    drawChargeEffect(g, owner, charge, max, color) {
      if (charge <= 0) return;
      const ctx = g.ctx2d.main;
      const ratio = charge / max;
      // 位置修正：向上一点 (-85)
      const muzzleY = owner.y - 85;

      ctx.save();
      ctx.translate(owner.x, muzzleY);
      ctx.globalCompositeOperation = 'lighter';

      // 内核
      const size = ratio * 15 + Math.random() * 2;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 10 * ratio;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();

      // 电弧
      if (ratio > 0.3) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        const arcs = Math.floor(ratio * 5);
        for (let i = 0; i < arcs; i++) {
          const ang = Math.random() * Math.PI * 2;
          const len = 20 + ratio * 40;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
          ctx.stroke();
        }
      }
      ctx.restore();
    },

    drawMuzzleFlash(g, owner, color, scale = 1.0) {
      const ctx = g.ctx2d.main;
      // 位置修正：向上一点 (-85)
      const muzzleY = owner.y - 85;

      ctx.save();
      ctx.translate(owner.x, muzzleY);
      ctx.globalCompositeOperation = 'lighter';

      // 巨大的光晕
      ctx.shadowBlur = 40 * scale;
      ctx.shadowColor = color;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      const radius = (30 + Math.random() * 10) * scale;
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },

    drawCooldownUI(g, owner, current, max) {
      // 在机体上方显示小小的 "OVERHEAT" 或进度条
      const ctx = g.ctx2d.main;
      const pct = current / max;

      ctx.save();
      ctx.translate(owner.x, owner.y - 100); // 冷却条位置稍微再高一点

      // 红色警告条
      const w = 40;
      const h = 3;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-w / 2, 0, w, h);

      ctx.fillStyle = `rgb(255, ${255 * (1 - pct)}, 0)`; // 黄变红
      ctx.fillRect(-w / 2, 0, w * pct, h);

      if (Math.random() > 0.8) {
        ctx.fillStyle = '#f00';
        ctx.font = '8px monospace';
        ctx.fillText('OVERHEAT', -20, -5);
      }

      ctx.restore();
    },
  };
}
