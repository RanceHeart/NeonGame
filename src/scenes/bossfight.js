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
  let sceneSpawn; // 保存当前场景的 spawner 引用

  return {
    init(g) {
      world = createWorld();
      hud = createHud();
      hud.mount(g);

      sceneSpawn = {
        projectile: (p) => world.spawnProjectile(p),
        particle: (p) => world.spawnParticle(p),
        spawnHitEffect: (x, y, type, col) =>
          world.spawnHitEffect(x, y, type, col),
        spawnShipExplosion: (x, y, col) => world.spawnShipExplosion(x, y, col),
      };

      g.spawn = sceneSpawn;

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
      // === 关键修复：进入场景时，强制接管 g.spawn ===
      if (sceneSpawn) {
        g.spawn = sceneSpawn;
      }
      hud.show();
      if (g.state) g.state.activeScene = 'boss';
      hud.sync();
    },

    hide(g) {
      isActive = false;
      hud.hide();
      // === 关键修复：离开时清理 ===
      if (world) world.clearTransients();
    },

    update(g) {
      if (!isActive) return;

      // === 双重保险 ===
      if (sceneSpawn && g.spawn !== sceneSpawn) {
        g.spawn = sceneSpawn;
      }

      hud.update(g);
      world.update(g);
    },

    render(g) {
      if (!isActive) return;
      world.render(g);
    },
  };
}
