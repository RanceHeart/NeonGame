// src/systems/particles.js
/**
 * 创建粒子系统：
 * - spawn: 进入列表
 * - update: 基于 type 补默认参数并积分
 * - render: 按 type 画不同特效
 * @returns {{ spawn:(p:any)=>void, spawnHitEffect:(x,y,type,col)=>void, spawnShipExplosion:(x,y,col)=>void, clear:()=>void, update:(g:any)=>void, render:(g:any)=>void, list:any[] }}
 */
export function createParticleSystem() {
  let list = [];

  function spawn(p) {
    const life = p.life || 30;
    list.push({
      ...p,
      type: (p.type || '').toUpperCase(),
      life: life,
      maxLife: p.maxLife || life,
      vx: p.vx || 0,
      vy: p.vy || 0,
      // Debris 专用属性
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.2,
      shape: Math.floor(Math.random() * 3), // 0:Tri, 1:Rect, 2:Shard
      w: p.w || Math.random() * 10 + 5,
      h: p.h || Math.random() * 10 + 5,
    });
  }

  // === 关键修复：添加清空方法 ===
  function clear() {
    list = [];
  }

  function spawnHitEffect(x, y, weaponType, color) {
    spawn({
      type: 'FLASH',
      x,
      y,
      life: 4,
      maxLife: 4,
      size: weaponType === 'RAILGUN' ? 25 : 12,
      color: '#fff',
    });
    spawn({
      type: 'FLASH',
      x,
      y,
      life: 4,
      maxLife: 4,
      size: weaponType === 'RAILGUN' ? 40 : 20,
      color: color,
    });

    if (weaponType === 'RIFLE' || weaponType === 'FUNNEL') {
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 5 + Math.random() * 8;
        spawn({
          type: 'SPARK',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 10 + Math.random() * 10,
          maxLife: 20,
          size: 2,
          color: '#fff',
        });
      }
    } else if (weaponType === 'RAILGUN') {
      // === 1. Railgun 爆炸散布修正 ===
      // 在中心点周围随机生成爆炸圈，而不是全部重叠在中心
      for (let i = 0; i < 4; i++) {
        const ox = (Math.random() - 0.5) * 50;
        const oy = (Math.random() - 0.5) * 50;
        spawn({
          type: 'SHOCKWAVE',
          x: x + ox,
          y: y + oy,
          life: 15,
          maxLife: 15,
          size: 30,
          color,
        });
      }
      // 大量火花散布
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 10 + Math.random() * 15;
        spawn({
          type: 'SPARK',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 20 + Math.random() * 10,
          maxLife: 30,
          size: 3,
          color,
        });
      }
      // 烟雾散布
      for (let i = 0; i < 5; i++) {
        spawn({
          type: 'SMOKE',
          x: x + (Math.random() - 0.5) * 60,
          y: y + (Math.random() - 0.5) * 60,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 30,
          maxLife: 30,
          size: 5,
          color,
        });
      }
    } else if (weaponType === 'SCISSOR') {
      const slashAngle = Math.random() * Math.PI * 2;
      spawn({
        type: 'SLASH',
        x,
        y,
        life: 10,
        maxLife: 10,
        size: 40,
        angle: slashAngle,
        color: '#fff',
      });
      spawn({
        type: 'SLASH',
        x,
        y,
        life: 10,
        maxLife: 10,
        size: 30,
        angle: slashAngle + Math.PI / 2,
        color,
      });
      for (let i = 0; i < 8; i++) {
        const baseA = slashAngle + Math.PI / 2;
        const a = baseA + (Math.random() - 0.5);
        const s = 5 + Math.random() * 10;
        spawn({
          type: 'SPARK',
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 15,
          maxLife: 15,
          size: 1,
          color,
        });
      }
    } else if (weaponType === 'MISSILE') {
      spawn({
        type: 'SHOCKWAVE',
        x,
        y,
        life: 20,
        maxLife: 20,
        size: 20,
        color: '#fff',
      });
      spawn({
        type: 'SHOCKWAVE',
        x,
        y,
        life: 20,
        maxLife: 20,
        size: 10,
        color,
      });
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        spawn({
          type: 'SMOKE',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 40 + Math.random() * 20,
          maxLife: 60,
          size: 5 + Math.random() * 10,
          color: i % 2 === 0 ? color : '#555',
        });
      }
    }
  }

  function spawnShipExplosion(x, y, color) {
    // === 3. 死亡特效：碎片 (Debris) + 大爆炸 ===
    spawn({
      type: 'SHOCKWAVE',
      x,
      y,
      size: 10,
      maxSize: 150,
      color: '#fff',
      life: 20,
    });
    spawn({
      type: 'SHOCKWAVE',
      x,
      y,
      size: 10,
      maxSize: 100,
      color: color,
      life: 25,
      width: 5,
    });

    // 碎片飞溅 (参考 HTML 代码)
    for (let i = 0; i < 25; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 6;
      spawn({
        type: 'DEBRIS',
        x: x,
        y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: i % 2 === 0 ? color : '#555', // 混合机体颜色和灰色
        life: 80 + Math.random() * 40,
        w: 5 + Math.random() * 10,
        h: 5 + Math.random() * 10,
      });
    }

    // 连环爆炸云
    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * 30;
      spawn({
        type: 'EXPLOSION',
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        size: 20 + Math.random() * 30,
        color: Math.random() > 0.5 ? color : '#fff',
        life: 30 + Math.random() * 20,
      });
    }
  }

  function update(g) {
    const FRICTION = 0.92;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life--;
      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'DEBRIS') {
        p.rot += p.rotSpd;
        p.vx *= 0.98;
        p.vy *= 0.98;
      } else if (p.type === 'SMOKE') {
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.size += 0.5;
      } else if (p.type === 'GN_SMOKE') {
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.size *= 0.94;
      } else if (
        p.type === 'SPARK' ||
        p.type === 'DEBRIS' ||
        p.type === 'EXPLOSION'
      ) {
        p.vx *= FRICTION;
        p.vy *= FRICTION;
      } else if (p.type === 'SLASH') {
        p.size *= 0.9;
      } else if (p.type === 'BEAM_TRAIL') {
        p.size *= 0.8;
      }

      if (p.life <= 0) list.splice(i, 1);
    }
  }

  function render(g) {
    const ctx = g.ctx2d.main;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of list) {
      const progress = p.life / (p.maxLife || 1);
      const alpha = Math.max(0, Math.min(1, progress));

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color || '#fff';
      ctx.strokeStyle = p.color || '#fff';

      if (p.type === 'DEBRIS') {
        // === 绘制碎片 ===
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 0) {
          // 三角
          ctx.beginPath();
          ctx.moveTo(-p.w / 2, p.h / 2);
          ctx.lineTo(0, -p.h / 2);
          ctx.lineTo(p.w / 2, p.h / 2);
          ctx.fill();
        } else if (p.shape === 1) {
          // 矩形
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          // 碎片条
          ctx.fillRect(-p.w / 2, -1, p.w, 2);
        }
        ctx.restore();
        continue;
      }

      if (p.type === 'ELECTRIC_ARC') {
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color;
        const segments = 3;
        const jagged = 10;
        const angle = Math.random() * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(
          p.x - (Math.cos(angle) * p.size) / 2,
          p.y - (Math.sin(angle) * p.size) / 2,
        );
        for (let k = 0; k < segments; k++) {
          ctx.lineTo(
            p.x +
              (Math.random() - 0.5) * p.size +
              (Math.random() - 0.5) * jagged,
            p.y +
              (Math.random() - 0.5) * p.size +
              (Math.random() - 0.5) * jagged,
          );
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (p.type === 'SHOCKWAVE') {
        ctx.beginPath();
        ctx.lineWidth = p.size * 0.1 * (1 - progress) * 4 + 1;
        const r = p.size * (1 + (1 - progress) * 2);
        ctx.arc(p.x, p.y, r > 0 ? r : 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'SLASH') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);
        ctx.beginPath();
        const len = p.size * 3;
        const wid = p.size * 0.3 * progress;
        ctx.moveTo(-len, 0);
        ctx.lineTo(0, wid);
        ctx.lineTo(len, 0);
        ctx.lineTo(0, -wid);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'SPARK') {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.stroke();
      } else if (
        p.type === 'SMOKE' ||
        p.type === 'GN_SMOKE' ||
        p.type === 'EXPLOSION' ||
        p.type === 'FLASH'
      ) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'BEAM_TRAIL') {
        const s = p.size;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      } else {
        // Fallback
        ctx.fillRect(p.x, p.y, p.size || 2, p.size || 2);
      }
    }
    ctx.restore();
  }

  return {
    spawn,
    clear,
    spawnHitEffect,
    spawnShipExplosion,
    update,
    render,
    list,
  };
}
