// src/systems/collisions.js
export function createCollisionSystem() {
  function checkCircle(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distSq = dx * dx + dy * dy;
    const rSum = c1.r + c2.r;
    return distSq < rSum * rSum;
  }

  function checkAABBvsCircle(aabb, circle) {
    const closestX = Math.max(
      aabb.x - aabb.w / 2,
      Math.min(circle.x, aabb.x + aabb.w / 2),
    );
    const closestY = Math.max(
      aabb.y - aabb.h / 2,
      Math.min(circle.y, aabb.y + aabb.h / 2),
    );
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return dx * dx + dy * dy < circle.r * circle.r;
  }

  function checkLineVsCircle(lineStart, lineEnd, lineWidth, circle) {
    const lx = lineEnd.x - lineStart.x;
    const ly = lineEnd.y - lineStart.y;
    const lenSq = lx * lx + ly * ly;
    if (lenSq === 0)
      return checkCircle(
        { x: lineStart.x, y: lineStart.y, r: lineWidth / 2 },
        circle,
      );
    const t =
      ((circle.x - lineStart.x) * lx + (circle.y - lineStart.y) * ly) / lenSq;
    const tClamped = Math.max(0, Math.min(1, t));
    const closestX = lineStart.x + tClamped * lx;
    const closestY = lineStart.y + tClamped * ly;
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distSq = dx * dx + dy * dy;
    const rSum = circle.r + lineWidth / 2;
    return distSq < rSum * rSum;
  }

  function checkLineVsAABB(start, end, width, aabb) {
    const radius = Math.hypot(aabb.w, aabb.h) / 2;
    return checkLineVsCircle(start, end, width, {
      x: aabb.x,
      y: aabb.y,
      r: radius,
    });
  }

  return {
    update(g, { entities, projectiles }) {
      const targets = entities.filter(
        (e) =>
          e.alive &&
          (e.tags.includes('enemy') || e.tags.includes('boss')) &&
          e.getHitShape,
      );

      for (const p of projectiles.list) {
        if (p.dead || p.from !== 'player') continue;

        for (const t of targets) {
          const tShape = t.getHitShape();
          let hit = false;

          if (p.type === 'railgun_beam') {
            const start = { x: p.x, y: p.y };
            const end = { x: p.tx, y: p.ty };
            if (tShape.type === 'circle')
              hit = checkLineVsCircle(start, end, p.width, tShape);
            else if (tShape.type === 'aabb')
              hit = checkLineVsAABB(start, end, p.width, tShape);
          } else {
            const pRadius = (p.width || 4) / 2 + 6;
            const pShape = { x: p.x, y: p.y, r: pRadius };
            if (tShape.type === 'circle') hit = checkCircle(tShape, pShape);
            else if (tShape.type === 'aabb')
              hit = checkAABBvsCircle(tShape, pShape);
          }

          if (hit) {
            let wType = 'RIFLE';
            if (p.type === 'missile') wType = 'MISSILE';
            else if (p.type === 'railgun_beam') wType = 'RAILGUN';
            else if (p.type === 'funnel_beam') wType = 'FUNNEL';
            else if (p.type === 'scissor_slash') wType = 'SCISSOR';

            if (g.spawn && g.spawn.spawnHitEffect) {
              if (wType === 'RAILGUN') {
                // === ⚡️ 修复 3: 计算 Railgun 准确命中点 ===
                // 计算光束在线段上的投影点 (Closest Point)
                const lx = p.tx - p.x;
                const ly = p.ty - p.y;
                const len2 = lx * lx + ly * ly;
                // tVal 是敌人在光束上的投影比例
                const tVal = ((t.x - p.x) * lx + (t.y - p.y) * ly) / len2;

                // 基础命中点
                const baseX = p.x + tVal * lx;
                const baseY = p.y + tVal * ly;

                // 随机偏移 (模拟接触面宽度)
                // 垂直于光束的向量
                const perpX = -ly / Math.sqrt(len2);
                const perpY = lx / Math.sqrt(len2);

                // 在敌人两侧随机生成
                const offset = (Math.random() - 0.5) * (tShape.r || 30) * 1.5;
                const hitX = baseX + perpX * offset;
                const hitY = baseY + perpY * offset;

                g.spawn.spawnHitEffect(hitX, hitY, wType, p.color || '#fff');
              } else {
                g.spawn.spawnHitEffect(p.x, p.y, wType, p.color || '#fff');
              }
            }

            if (p.type !== 'railgun_beam' && p.type !== 'scissor_slash') {
              p.dead = true;
            }

            if (t.hp !== undefined) {
              const dmg = p.type === 'railgun_beam' ? 2 : 10;
              t.hp -= dmg;
              if (t.hp <= 0) t.alive = false;
            }

            if (tShape.onHit) tShape.onHit();
            if (p.dead) break;
          }
        }
      }
    },
  };
}
