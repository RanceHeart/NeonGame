// src/codex/entries.js
const Colors = {
  main: '#0ff',
  warn: '#f05',
  gn: '#0f8',
};

function drawGridBG(g) {
  const ctx = g.ctx2d.main;
  const W = g.screen.w;
  const H = g.screen.h;

  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(0,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();

  const step = 60;
  const off = (g.time.frame * 2) % step;

  for (let x = 0; x < W; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = H - off; y > 0; y -= step) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }

  ctx.stroke();
}

function drawVector(ctx, t) {
  ctx.scale(1.5, 1.5);
  ctx.rotate(Math.sin(t * 0.05) * 0.1);

  ctx.fillStyle = '#ddd';
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(12, 15);
  ctx.lineTo(0, 8);
  ctx.lineTo(-12, 15);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 10;
  ctx.shadowColor = Colors.warn;
  ctx.fillStyle = Colors.warn;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(3, 10);
  ctx.lineTo(-3, 10);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawPhalanx(ctx, t) {
  ctx.scale(2, 2);
  ctx.translate(Math.cos(t * 0.02) * 5, 0);

  ctx.fillStyle = '#2a2a30';
  ctx.beginPath();
  ctx.moveTo(-20, -15);
  ctx.lineTo(20, -15);
  ctx.lineTo(30, 10);
  ctx.lineTo(15, 25);
  ctx.lineTo(-15, 25);
  ctx.lineTo(-30, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#667';
  ctx.fillRect(-15, -18, 30, 6);
  ctx.fillStyle = Colors.main;
  ctx.fillRect(-15, -18, 30, 2);

  ctx.fillStyle = '#222';
  ctx.save();
  ctx.translate(-20, 5);
  ctx.rotate(t * 0.05);
  ctx.fillRect(-3, -5, 6, 10);
  ctx.restore();

  ctx.save();
  ctx.translate(20, 5);
  ctx.rotate(-t * 0.05);
  ctx.fillRect(-3, -5, 6, 10);
  ctx.restore();
}

function drawGauss(ctx, t) {
  ctx.scale(2.5, 2.5);

  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(-10, -30, 20, 60);

  ctx.fillStyle = '#111';
  ctx.fillRect(8, -50, 6, 70);

  ctx.fillStyle = '#555';
  ctx.fillRect(-14, -10, 8, 30);

  const charge = (Math.sin(t * 0.2) + 1) / 2;

  ctx.shadowBlur = 15 * charge;
  ctx.shadowColor = Colors.gn;
  ctx.fillStyle = `rgba(0, 255, 128, ${charge})`;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(7, -40 + i * 10, 8, 2);
  }
  ctx.shadowBlur = 0;

  ctx.fillStyle = Colors.gn;
  ctx.fillRect(-8, 30, 16, 2);
}

function drawHive(ctx, t) {
  ctx.scale(3, 3);

  ctx.save();
  ctx.rotate(t * 0.01);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = Colors.warn;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(0, 30);
  ctx.moveTo(-30, 0);
  ctx.lineTo(30, 0);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 20;
  ctx.shadowColor = Colors.warn;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  for (let i = 0; i < 3; i++) {
    const ang = t * 0.05 + i * ((Math.PI * 2) / 3);
    ctx.save();
    ctx.translate(Math.cos(ang) * 45, Math.sin(ang) * 45);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = Colors.warn;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// --- Boss: Izanami（你第二段 HTML 的 flat ship）---
// 我只保留“核心观感”：大体轮廓 + turrets + VLS + hangar + 眼睛
function drawIzanami(ctx, g) {
  const frame = g.time.frame;
  const phase = 1; // 建模 viewer 不需要按钮，后面你要 phase 再加
  const Pal = {
    hull: '#14161a',
    plate: '#1e2129',
    dark: '#08080a',
    neon: '#0ff',
    warn: '#f33',
  };

  const hover = Math.sin(frame * 0.02) * 5;
  const bx = 0;
  const by = hover;

  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(1.0, 1.0);

  // Wings
  const drawWing = () => {
    ctx.save();
    ctx.translate(120, 0);
    ctx.beginPath();
    ctx.moveTo(0, -80);
    ctx.lineTo(200, -20);
    ctx.lineTo(200, 100);
    ctx.lineTo(0, 140);
    ctx.closePath();
    ctx.fillStyle = '#16181d';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#1c1f26';
    ctx.fillRect(40, 0, 120, 60);
    ctx.restore();
  };

  ctx.save();
  ctx.scale(-1, 1);
  drawWing();
  ctx.restore();
  drawWing();

  // Main body plate
  ctx.fillStyle = Pal.plate;
  ctx.fillRect(-120, -100, 240, 280);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(-120, -100, 240, 280);

  // Hangar
  ctx.save();
  ctx.translate(0, 20);
  ctx.fillStyle = '#050505';
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.fillRect(-40, 0, 80, 60);
  ctx.strokeRect(-40, 0, 80, 60);
  ctx.restore();

  // VLS blocks
  const drawVls = (x, y, rows, cols) => {
    ctx.save();
    ctx.translate(x, y);
    const w = 10;
    const h = 10;
    const gap = 3;
    const totalW = cols * (w + gap) + gap;
    const totalH = rows * (h + gap) + gap;

    ctx.fillStyle = '#101012';
    ctx.fillRect(0, 0, totalW, totalH);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(0, 0, totalW, totalH);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = gap + c * (w + gap);
        const oy = gap + r * (h + gap);
        ctx.fillStyle = '#000';
        ctx.fillRect(ox, oy, w, h);

        const active = Math.sin(frame * 0.2 + r * c) > 0.2;
        if (active) {
          ctx.fillStyle = Pal.warn;
          ctx.beginPath();
          ctx.arc(ox + w / 2, oy + h / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  };

  drawVls(-280, -30, 8, 4);
  drawVls(230, -30, 8, 4);
  drawVls(-100, -80, 6, 2);
  drawVls(80, -80, 6, 2);

  // Turrets (简化版)
  const drawTurret = (x, y, s) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    const sweep = Math.sin(frame * 0.05) * 0.2;
    ctx.rotate(Math.PI / 2 + sweep);

    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#444';
    ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.fillRect(-8, -8, 16, 16);

    ctx.fillStyle = '#050505';
    ctx.fillRect(-6, 0, 4, 35);
    ctx.fillRect(2, 0, 4, 35);

    ctx.restore();
  };

  drawTurret(-140, 100, 1.5);
  drawTurret(140, 100, 1.5);
  drawTurret(-260, 40, 1.2);
  drawTurret(260, 40, 1.2);
  drawTurret(-60, 160, 0.8);
  drawTurret(60, 160, 0.8);

  // Eye
  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(-70, 140, 140, 30);

  ctx.fillStyle = '#200';
  ctx.fillRect(-50, 150, 100, 10);

  const eyeX = Math.sin(frame * 0.05) * 40;
  ctx.fillStyle = Pal.warn;
  ctx.shadowColor = Pal.warn;
  ctx.shadowBlur = 10;
  ctx.fillRect(eyeX - 8, 148, 16, 14);
  ctx.shadowBlur = 0;

  ctx.restore();
}

export function createCodexEntries() {
  return [
    {
      id: 'enemy.vector',
      group: 'ENEMY',
      cls: 'CLASS D - INTERCEPTOR',
      name: 'VECTOR',
      desc: '轻型截击机。以极高的速度进行自杀式冲锋。装甲极薄。',
      draw(ctx, g) {
        ctx.save();
        ctx.translate(g.screen.w / 2, g.screen.h / 2);
        drawVector(ctx, g.time.frame);
        ctx.restore();
      },
    },
    {
      id: 'enemy.phalanx',
      group: 'ENEMY',
      cls: 'CLASS C - FRIGATE',
      name: 'PHALANX',
      desc: '重型护卫舰。前部装备有复合装甲，能够弹开轻型武器。',
      draw(ctx, g) {
        ctx.save();
        ctx.translate(g.screen.w / 2, g.screen.h / 2);
        drawPhalanx(ctx, g.time.frame);
        ctx.restore();
      },
    },
    {
      id: 'enemy.gauss',
      group: 'ENEMY',
      cls: 'CLASS B - DESTROYER',
      name: 'GAUSS-H',
      desc: '磁轨炮搭载舰。为了搭载巨大的磁轨炮而牺牲了机动性。',
      draw(ctx, g) {
        ctx.save();
        ctx.translate(g.screen.w / 2, g.screen.h / 2);
        drawGauss(ctx, g.time.frame);
        ctx.restore();
      },
    },
    {
      id: 'enemy.hive',
      group: 'ENEMY',
      cls: 'CLASS A - HIVE',
      name: 'HIVE-CARRIER',
      desc: '无人机母舰。本身不具备强力主炮，但拥有能量护盾。',
      draw(ctx, g) {
        ctx.save();
        ctx.translate(g.screen.w / 2, g.screen.h / 2);
        drawHive(ctx, g.time.frame);
        ctx.restore();
      },
    },
    {
      id: 'boss.izanami',
      group: 'BOSS',
      cls: 'OMEGA-CLASS DREADNOUGHT',
      name: 'IZANAMI MK-IV',
      desc: 'ORBITAL DROP PLATFORM // HANGAR ONLINE // 建模 viewer（flat）。',
      draw(ctx, g) {
        ctx.save();
        ctx.translate(g.screen.w / 2, g.screen.h / 2 - 40);
        ctx.scale(1.2, 1.2);
        drawIzanami(ctx, g);
        ctx.restore();
      },
    },
  ];
}

export function drawCodexBG(g) {
  drawGridBG(g);
}
