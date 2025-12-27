// src/weapons/funnels.js
export function createFunnelsWeapon() {
  return {
    name: 'FUNNEL',
    update(g, owner) {
      // bit 的持续行为由 entity 自己 update，这里不用做太多
      // 你想加“MARUTE 下额外 bits”也可以在 bit.update 里判断 id>=6
    },
  };
}
