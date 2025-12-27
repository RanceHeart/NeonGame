import { createWorld } from '../core/world.js';
import { createHarutePlayer } from '../entities/player/harute.js';
import { createOmegaBoss } from '../entities/boss/omega.js';

export function createBossFightScene() {
  let world;

  return {
    init(g) {
      world = createWorld();
      g.spawn = {
        projectile: (p) => world.spawnProjectile(p),
        particle: (p) => world.spawnParticle(p),
      };
      g.state = { bossPhase: 1 };

      world.addEntity(createHarutePlayer());
      world.addEntity(createOmegaBoss());
    },
    update(g) {
      world.update(g);
    },
    render(g) {
      world.render(g);
    },
  };
}
