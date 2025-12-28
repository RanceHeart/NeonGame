// src/core/world.js
import { createProjectileSystem } from '../systems/projectiles.js';
import { createParticleSystem } from '../systems/particles.js';
import { createCollisionSystem } from '../systems/collisions.js';

/**
 * 创建 World：实体列表 + 系统管线（projectiles/particles/collisions）。
 * 约定：
 * - entity.update/render 由 world 调用
 * - 生成子弹/粒子通过 world.spawn*（再由 scene 注入到 g.spawn）
 * @returns {{
 *  addEntity:(e:any)=>any,
 *  spawnProjectile:(p:any)=>void,
 *  spawnParticle:(p:any)=>void,
 *  spawnHitEffect:(x:number, y:number, type:string, color:string)=>void,
 *  spawnShipExplosion:(x:number, y:number, color:string)=>void,
 *  findRandomEnemy:(x:number, y:number, range:number)=>any,
 *  clearTransients:()=>void,
 *  update:(g:any)=>void,
 *  render:(g:any)=>void,
 *  debug:{entities:any[], projectiles:any, particles:any}
 * }}
 */
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

  function spawnHitEffect(x, y, type, color) {
    if (particles.spawnHitEffect) {
      particles.spawnHitEffect(x, y, type, color);
    }
  }

  function spawnShipExplosion(x, y, color) {
    if (particles.spawnShipExplosion) {
      particles.spawnShipExplosion(x, y, color);
    }
  }

  // === 新增：寻找范围内的随机敌人 ===
  function findRandomEnemy(x, y, range) {
    const targets = entities.filter(
      (e) => e.alive && (e.tags.includes('enemy') || e.tags.includes('boss')),
    );

    if (targets.length === 0) return null;

    let candidates = targets;
    if (range) {
      candidates = targets.filter((e) => {
        const dx = e.x - x;
        const dy = e.y - y;
        return dx * dx + dy * dy <= range * range;
      });
    }

    if (candidates.length === 0) return null;

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // === 关键修复：清理临时对象（子弹/粒子），防止跨场景残留 ===
  function clearTransients() {
    if (projectiles.clear) projectiles.clear();
    if (particles.clear) particles.clear();
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
      if (e.tags.includes('funnel') || e.tags.includes('scissor_bit'))
        return 20;
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
    spawnHitEffect,
    spawnShipExplosion,
    findRandomEnemy, // 导出此方法
    clearTransients, // 导出清理方法
    update,
    render,
    debug: { entities, projectiles, particles },
  };
}
