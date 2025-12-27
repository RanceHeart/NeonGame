// src/scenes/sandbox.js
import { createWorld } from '../core/world.js';
import { createHarutePlayer } from '../entities/player/harute.js';
import { createHud } from '../ui/hud.js';
import { createFunnelBit } from '../entities/player/funnel_bit.js';
import { createScissorBit } from '../entities/player/scissor_bit.js';
import { createSpawner } from '../core/spawn.js';

export function createSandboxScene() {
  let world;
  let hud;
  let isActive = false;

  return {
    init(g) {
      world = createWorld();
      hud = createHud();
      hud.mount(g);

      const spawner = createSpawner(world);

      // === 关键修改：绑定 spawnHitEffect ===
      g.spawn = {
        ...spawner,
        spawnHitEffect: (x, y, type, col) =>
          world.spawnHitEffect(x, y, type, col),
      };

      g.state = {
        ...g.state,
        mode: 'NORMAL',
        weapon: 'RIFLE',
        bossPhase: 0,
      };

      const player = createHarutePlayer();
      world.addEntity(player);

      // Bits
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

      // Enemies
      g.spawn.boss('omega', { x: g.screen.w / 2, y: 160, phase: 0 });
      g.spawn.boss('omega', { x: g.screen.w / 2 - 240, y: 210, phase: 1 });
      g.spawn.boss('omega', { x: g.screen.w / 2 + 240, y: 210, phase: 2 });

      for (let i = 0; i < 10; i++) {
        g.spawn.enemy('drone', {
          x: 140 + i * 70,
          y: 360 + (i % 2) * 40,
          phase: i % 3,
        });
      }

      isActive = true;
      hud.show();
    },

    show(g) {
      isActive = true;
      hud.show();
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

      const ctx = g.ctx2d.main;
      ctx.fillStyle = '#0ff';
      ctx.font = '12px monospace';
      ctx.fillText('SANDBOX - HIT VFX ACTIVE', 12, 20);
    },
  };
}
