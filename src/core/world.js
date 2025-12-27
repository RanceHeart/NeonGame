import { createProjectileSystem } from '../systems/projectiles.js';
import { createParticleSystem } from '../systems/particles.js';
import { createCollisionSystem } from '../systems/collisions.js';

export function createWorld() {
  const entities = [];
  const projectiles = createProjectileSystem();
  const particles = createParticleSystem();
  const collisions = createCollisionSystem();

  function addEntity(e) {
    entities.push(e);
    return e;
  }

  function spawnProjectile(p) {
    projectiles.spawn(p);
  }

  function spawnParticle(p) {
    particles.spawn(p);
  }

  function update(g) {
    // 输入 beginFrame：把 justDown/justUp reset
    g.input.beginFrame();

    // entities
    for (const e of entities) {
      if (e.alive !== false && e.update) {
        e.update(g);
      }
    }

    // systems
    projectiles.update(g);
    particles.update(g);
    collisions.update(g, { entities, projectiles });

    // cleanup（壳子：后面你可以更细）
    for (let i = entities.length - 1; i >= 0; i--) {
      if (entities[i].alive === false) {
        entities.splice(i, 1);
      }
    }
  }

  function render(g) {
    // entities
    for (const e of entities) {
      if (e.alive !== false && e.render) {
        e.render(g);
      }
    }

    // systems render
    projectiles.render(g);
    particles.render(g);
  }

  return {
    addEntity,
    spawnProjectile,
    spawnParticle,
    update,
    render,
    debug: { entities, projectiles, particles },
  };
}
