import { createWorld } from '../core/world.js';
import { createHarutePlayer } from '../entities/player/harute.js';

export function createSandboxScene() {
  let world;

  return {
    init(g) {
      world = createWorld();

      // 让实体/武器只通过 g.spawn 访问系统
      g.spawn = {
        projectile: (p) => world.spawnProjectile(p),
        particle: (p) => world.spawnParticle(p),
      };

      // TODO: UI/HUD 也可以挂在 g.ui
      g.state = { mode: 'NORMAL', weapon: 'RIFLE' };

      world.addEntity(createHarutePlayer());
    },
    update(g) {
      world.update(g);
    },
    render(g) {
      world.render(g);

      // 壳子：画个调试文本，证明运行正常
      const ctx = g.ctx2d.main;
      ctx.fillStyle = '#0ff';
      ctx.font = '12px monospace';
      ctx.fillText(
        'SANDBOX (player only) - TODO: implement weapons/render',
        12,
        20,
      );
    },
  };
}
