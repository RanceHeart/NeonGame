// src/core/spawn.js
import { createOmegaBoss } from '../entities/boss/omega.js';
import { createDroneEnemy } from '../entities/enemy/drone.js';
import { createTurretEnemy } from '../entities/enemy/turret.js';

export function createSpawner(world) {
  const registry = {
    boss: {
      omega: createOmegaBoss,
    },
    enemy: {
      drone: createDroneEnemy,
      turret: createTurretEnemy,
    },
  };

  function boss(type, opts = {}) {
    const fn = registry.boss[type];
    if (!fn) {
      throw new Error(`Unknown boss type: ${type}`);
    }
    const e = fn(opts);
    world.addEntity(e);
    return e;
  }

  function enemy(type, opts = {}) {
    const fn = registry.enemy[type];
    if (!fn) {
      throw new Error(`Unknown enemy type: ${type}`);
    }
    const e = fn(opts);
    world.addEntity(e);
    return e;
  }

  function projectile(p) {
    world.spawnProjectile(p);
  }

  function particle(p) {
    world.spawnParticle(p);
  }

  return { boss, enemy, projectile, particle, registry };
}
