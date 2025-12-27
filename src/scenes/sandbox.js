// src/scenes/sandbox.js
import { createWorld } from '../core/world.js';
import { createHarutePlayer } from '../entities/player/harute.js';
import { createHud } from '../ui/hud.js';
import { createFunnelBit } from '../entities/player/funnel_bit.js';
import { createScissorBit } from '../entities/player/scissor_bit.js'; // 引入新文件

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

      // 1. 生成 Funnel Bits (负责射击) - 6个
      for (let i = 0; i < 6; i++) {
        const bit = createFunnelBit({ id: i, owner: player });
        player.funnelBits.push(bit);
        world.addEntity(bit);
      }

      // 2. 生成 Scissor Bits (负责近战) - 6个
      for (let i = 0; i < 6; i++) {
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
      ctx.fillText('SANDBOX - SCISSOR & FUNNEL SEPARATED', 12, 20);
    },
  };
}
