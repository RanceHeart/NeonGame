// src/scenes/sandbox.js
import { createWorld } from '../core/world.js';
import { createHarutePlayer } from '../entities/player/harute.js';
import { createHud } from '../ui/hud.js';
import { createFunnelBit } from '../entities/player/funnel_bit.js';

export function createSandboxScene() {
  let world;
  let hud;

  return {
    init(g) {
      world = createWorld();
      hud = createHud();

      // 把 mountEl 透给 HUD 用（engine 那边也可以直接塞到 g 上）
      if (!g.mountEl) {
        // 你在 engine.createEngine 里最好直接 g.mountEl = mountEl
        // 这里兜底：通过 canvas 的 parent 找
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

      player.funnelBits = [];
      for (let i = 0; i < 12; i++) {
        const bit = createFunnelBit({ id: i, owner: player });
        player.funnelBits.push(bit);
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
      ctx.fillText('SANDBOX - HARUTE (HUD + weapons + systems wired)', 12, 20);
    },
  };
}
