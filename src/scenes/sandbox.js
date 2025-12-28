// src/scenes/sandbox.js
import { createWorld } from '../core/world.js';
import { createHarutePlayer } from '../entities/player/harute.js';
import { createHud } from '../ui/hud.js';
import { createFunnelBit } from '../entities/player/funnel_bit.js';
import { createScissorBit } from '../entities/player/scissor_bit.js';
import { createSpawner } from '../core/spawn.js';

/**
 * Sandbox 场景：HUD + Harute + 12 个 funnel bits（用于武器演示）。
 * @returns {{init:(g:any)=>void, update:(g:any)=>void, render:(g:any)=>void}}
 */
export function createSandboxScene() {
  let world;
  let hud;
  let isActive = false;
  let sceneSpawn; // 保存当前场景的 spawner 引用

  return {
    init(g) {
      world = createWorld();
      hud = createHud();
      hud.mount(g);

      const spawner = createSpawner(world);

      // 创建并保存属于这个场景的 spawner
      sceneSpawn = {
        ...spawner,
        spawnHitEffect: (x, y, type, col) =>
          world.spawnHitEffect(x, y, type, col),
        spawnShipExplosion: (x, y, col) => world.spawnShipExplosion(x, y, col),
      };

      // 初始化时设置 (会被后续场景的 init 覆盖，所以 show/update 里需要恢复)
      g.spawn = sceneSpawn;

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

      // === NEW: Spawn Variety of Enemies ===

      // 1. Phalanx Wall (Frigates)
      for (let i = 0; i < 3; i++) {
        g.spawn.enemy('phalanx', { x: 100 + i * 120, y: 100 + i * 30 });
      }

      // 2. Vector Swarm (Interceptors)
      for (let i = 0; i < 5; i++) {
        g.spawn.enemy('vector', {
          x: Math.random() * g.screen.w,
          y: -Math.random() * 200,
        });
      }

      // 3. Gauss Sniper (Destroyer)
      g.spawn.enemy('gauss', { x: g.screen.w - 100, y: 150 });

      // Keep some original drones for comparison
      for (let i = 0; i < 5; i++) {
        g.spawn.enemy('drone', {
          x: 50 + i * 50,
          y: 300,
          phase: 0,
        });
      }

      isActive = true;
      hud.show();
    },

    show(g) {
      isActive = true;
      // === 关键修复：进入场景时，强制接管 g.spawn ===
      if (sceneSpawn) {
        g.spawn = sceneSpawn;
      }
      hud.show();
    },

    hide(g) {
      isActive = false;
      hud.hide();
      // === 关键修复：离开场景时清理子弹，避免残留 ===
      if (world) world.clearTransients();
    },

    update(g) {
      if (!isActive) return;

      // === 双重保险：确保 update 时 spawn 指向自己 ===
      if (sceneSpawn && g.spawn !== sceneSpawn) {
        g.spawn = sceneSpawn;
      }

      hud.update(g);
      world.update(g);
    },

    render(g) {
      if (!isActive) return;
      world.render(g);

      const ctx = g.ctx2d.main;
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText('ENEMIES: VECTOR / PHALANX / GAUSS / DRONE', 12, 20);
    },
  };
}
