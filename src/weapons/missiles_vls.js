// src/weapons/missiles_vls.js
/**
 * 创建 VLS 导弹武器：
 * - 按住 pointer 按频率发射
 * - 每次从 owner.vlsIndex 轮询一个发射单元
 * - projectile type: 'missile'（在 projectile system 里有对应逻辑）
 * @returns {{name:string, update:(g:any, owner:any)=>void}}
 */
export function createVlsMissiles() {
  return {
    name: 'MISSILE',

    update(g, owner) {
      if (!g.input.pointer.down) {
        return;
      }

      const isMarute = g.state.mode === 'MARUTE';
      const rate = isMarute ? 8 : 12;
      if (g.time.frame % rate !== 0) {
        return;
      }

      const count = isMarute ? 3 : 1;

      const tx = g.input.pointer.x;
      const ty = g.input.pointer.y;
      const color = isMarute ? '#ff003c' : '#ffaa00';

      const binderXOffset = 45 + owner.transformFactor * 25;

      for (let i = 0; i < count; i++) {
        const idx = owner.vlsIndex;
        owner.vlsIndex = (owner.vlsIndex + 1) % 16;

        owner.lastFiredVlsIndex = idx;
        owner.lastFiredFrame = g.time.frame;

        const side = idx < 8 ? -1 : 1;
        const localIdx = idx % 8;
        const row = (localIdx / 2) | 0;
        const col = localIdx & 1;

        const cellCenterRelX = -4 + col * 10; // 原来 -8 + ... +4 => 合并
        const cellCenterRelY = -40 + row * 12; // 原来 -45 + ... +5 => 合并

        const ox = owner.x + side * binderXOffset + side * cellCenterRelX;
        const oy = owner.y + cellCenterRelY;

        // 少一点 random 次数
        const r1 = Math.random() - 0.5;
        const r2 = Math.random();
        const r3 = Math.random();
        const r4 = Math.random() - 0.5;

        g.spawn.projectile({
          type: 'missile',
          from: 'player',
          x: ox,
          y: oy,
          vx: r1 * 10 + side * 5,
          vy: -5 - r2 * 10,
          tx,
          ty,
          life: 300,
          state: 'EJECT',
          timer: 10 + r3 * 10,
          speed: 0,
          maxSpeed: 20 + Math.random() * 10, // 想再省就也用 r2/r3
          curveBias: r4 * 0.2,
          angle: -Math.PI / 2,
          color,
        });
      }
    },
  };
}
