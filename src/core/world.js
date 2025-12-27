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

  // === 新增：暴露特效接口 ===
  function spawnHitEffect(x, y, type, color) {
    if (particles.spawnHitEffect) {
      particles.spawnHitEffect(x, y, type, color);
    }
  }

  function update(g) {
    for (const e of entities) {
      if (e.alive !== false && e.update) e.update(g);
    }
    projectiles.update(g);
    particles.update(g);
    collisions.update(g, { entities, projectiles });

    for (let i = entities.length - 1; i >= 0; i--) {
      if (entities[i].alive === false) entities.splice(i, 1);
    }
  }

  function render(g) {
    // 层级排序
    const getLayer = (e) => {
      if (e.tags.includes('funnel') || e.tags.includes('scissor_bit')) return 5;
      if (e.tags.includes('player')) return 10;
      if (e.tags.includes('boss')) return 2;
      if (e.tags.includes('enemy')) return 1;
      return 0;
    };
    const sorted = [...entities].sort((a, b) => getLayer(a) - getLayer(b));

    for (const e of sorted) {
      if (e.alive !== false && e.render) e.render(g);
    }
    projectiles.render(g);
    particles.render(g);
  }

  return {
    addEntity,
    spawnProjectile,
    spawnParticle,
    spawnHitEffect, // 导出
    update,
    render,
    debug: { entities, projectiles, particles },
  };
}
