export function createOmegaBoss() {
  const boss = {
    id: 'boss.omega',
    tags: ['boss'],
    alive: true,
    x: 0,
    y: 0,

    update(g) {
      // TODO: phase 行为/弹幕/入场
      if (!boss.x) {
        boss.x = g.screen.w / 2;
        boss.y = 180;
      }
    },

    render(g) {
      // TODO: 用你 boss1.html 的 Boss.draw 分层逻辑替换
      const ctx = g.ctx2d.main;
      ctx.save();
      ctx.translate(boss.x, boss.y);
      ctx.fillStyle = '#ff003c';
      ctx.fillRect(-120, -40, 240, 80);
      ctx.restore();
    },

    getHitShape() {
      return { type: 'aabb', x: boss.x, y: boss.y, w: 240, h: 80 };
    },
  };

  return boss;
}
