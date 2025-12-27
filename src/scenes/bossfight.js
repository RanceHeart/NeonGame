// src/scenes/bossfight.js
import { createWorld } from '../core/world.js';
import { createHarutePlayer } from '../entities/player/harute.js';
import { createOmegaBoss } from '../entities/boss/omega.js';
import { createHud } from '../ui/hud.js';
import { createFunnelBit } from '../entities/player/funnel_bit.js';
import { createScissorBit } from '../entities/player/scissor_bit.js';

export function createBossFightScene() {
  let world;
  let hud;
  let isActive = false;

  return {
    init(g) {
      world = createWorld();
      hud = createHud();
      hud.mount(g);

      // === 关键修改：绑定 spawnHitEffect ===
      g.spawn = {
        projectile: (p) => world.spawnProjectile(p),
        particle: (p) => world.spawnParticle(p),
        spawnHitEffect: (x, y, type, col) =>
          world.spawnHitEffect(x, y, type, col),
      };

      g.state = {
        ...g.state,
        mode: 'NORMAL',
        weapon: 'RIFLE',
        bossPhase: 1,
      };

      const player = createHarutePlayer();
      world.addEntity(player);

      player.funnelBits = [];
      player.scissorBits = [];
      for (let i = 0; i < 14; i++) {
        const bit = createFunnelBit({ id: i, owner: player });
        player.funnelBits.push(bit);
        world.addEntity(bit);
      }
      for (let i = 0; i < 6; i++) {
        const bit = createScissorBit({ id: i, owner: player });
        player.scissorBits.push(bit);
        world.addEntity(bit);
      }

      world.addEntity(createOmegaBoss());
    },

    show(g) {
      isActive = true;
      hud.show();
      if (g.state) g.state.activeScene = 'boss';
      hud.sync();
    },

    hide(g) {
      isActive = false;
      hud.hide();
    },

    update(g) {
      if (!isActive) return;
      hud.update(g);
      world.update(g);
    },

    render(g) {
      if (!isActive) return;
      world.render(g);
    },
  };
}
