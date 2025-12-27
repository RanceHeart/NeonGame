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

      // Initialize arrays
      player.funnelBits = [];
      player.scissorBits = [];

      // Bits quantity increased to 14
      // 0-5: Always visible
      // 6-13: Hidden (Activated only during Trans-Am)
      const TOTAL_BITS = 14;

      // 1. Generate Funnel Bits
      for (let i = 0; i < TOTAL_BITS; i++) {
        const bit = createFunnelBit({ id: i, owner: player });
        player.funnelBits.push(bit);
        world.addEntity(bit);
      }

      // 2. Generate Scissor Bits
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
