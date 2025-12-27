// src/entities/boss/omega.js
export function createOmegaBoss(opts = {}) {
  const boss = {
    id: opts.id || `boss.omega.${Math.random().toString(16).slice(2)}`,
    tags: ['boss'],
    alive: true,

    x: opts.x || 0,
    y: opts.y || 0,

    // 建模用：0/1/2 相位
    phase: opts.phase ?? 0,

    hp: opts.hp ?? 999999, // 先当模型，不做数值也行

    setPhase(p) {
      boss.phase = p;
    },

    update(g) {
      // 位置初始化
      if (!boss.x) {
        boss.x = g.screen.w / 2;
      }
      if (!boss.y) {
        boss.y = 180;
      }

      // 建模阶段：从全局状态同步相位（UI/脚本随便改 g.state）
      if (typeof g.state.bossPhase === 'number') {
        boss.phase = g.state.bossPhase;
      }
    },

    render(g) {
      const ctx = g.ctx2d.main;

      ctx.save();
      ctx.translate(boss.x, boss.y);

      // 轻微漂浮
      const yOff = Math.sin(g.time.frame * 0.02) * 10;
      ctx.translate(0, yOff);

      // 放大点显得“像 boss”
      ctx.scale(1.5, 1.5);

      // phase 色彩
      let col = '#00ffff';
      if (boss.phase === 1) {
        col = '#ffbb00';
      }
      if (boss.phase === 2) {
        col = '#ff0055';
      }

      // 先用几何块做建模（你后面可以把 HTML viewer 的 drawWing/drawBody 拆成方法搬进来）
      ctx.fillStyle = '#0a1014';
      ctx.fillRect(-120, -40, 240, 80);

      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = col;
      ctx.strokeRect(-120, -40, 240, 80);

      // phase 2 轻微抖动
      if (boss.phase === 2) {
        g.camera.addShake(0.6);
      }

      ctx.restore();
    },

    getHitShape() {
      return { type: 'aabb', x: boss.x, y: boss.y, w: 240, h: 80 };
    },
  };

  return boss;
}
