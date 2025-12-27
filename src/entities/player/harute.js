import { createRifleWeapon } from '../../weapons/rifle.js';
// 你后面让 Gemini 生成更多武器
// import { createVlsMissiles } from '../../weapons/missiles_vls.js';

export function createHarutePlayer() {
  const weapons = {
    RIFLE: createRifleWeapon(),
    // MISSILES: createVlsMissiles(),
  };

  const player = {
    id: 'player.harute',
    tags: ['player'],
    alive: true,

    x: 0,
    y: 0,

    update(g) {
      // TODO: 读 g.input，移动/变形/能量
      if (!player.x) {
        player.x = g.screen.w / 2;
        player.y = g.screen.h - 160;
      }

      // TODO: 选武器
      const w = weapons[g.state.weapon] || weapons.RIFLE;
      w.update(g, player);
    },

    render(g) {
      // TODO: 用你 player1.html 的绘制逻辑替换
      const ctx = g.ctx2d.main;
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(14, 14);
      ctx.lineTo(0, 6);
      ctx.lineTo(-14, 14);
      ctx.fill();
      ctx.restore();
    },

    getHitShape() {
      // TODO: 给 collision 用
      return { type: 'circle', x: player.x, y: player.y, r: 12 };
    },
  };

  return player;
}
