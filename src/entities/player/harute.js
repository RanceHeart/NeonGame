// src/entities/player/harute.js
import { createRifleWeapon } from '../../weapons/rifle.js';
import { createVlsMissiles } from '../../weapons/missiles_vls.js';
import { createFunnelsWeapon } from '../../weapons/funnels.js';
import { createScissorWeapon } from '../../weapons/scissor.js';
import { createRailgunWeapon } from '../../weapons/railgun.js';

export function createHarutePlayer() {
  const weapons = {
    RIFLE: createRifleWeapon(),
    MISSILE: createVlsMissiles(),
    FUNNEL: createFunnelsWeapon(),
    SCISSOR: createScissorWeapon(),
    CANNON: createRailgunWeapon(),
  };

  const player = {
    id: 'player.harute',
    tags: ['player'],
    alive: true,

    // --- Physics ---
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    accel: 0.9,
    friction: 0.92,
    maxSpeed: 9.0,

    // --- Thrusters ---
    thrusters: {
      main: 0,
      brake: 0,
      leftSide: 0,
      rightSide: 0,
    },

    recoilY: 0,
    transformFactor: 0,
    missileOpen: 0,
    vlsIndex: 0,

    funnelBits: [],
    scissorBits: [],

    update(g) {
      if (!player.x) {
        player.x = g.screen.w / 2;
        player.y = g.screen.h - 180;
      }

      // --- Input ---
      const k = g.input.keys;
      let dx = 0;
      let dy = 0;

      if (k['KeyW'] || k['ArrowUp']) dy -= 1;
      if (k['KeyS'] || k['ArrowDown']) dy += 1;
      if (k['KeyA'] || k['ArrowLeft']) dx -= 1;
      if (k['KeyD'] || k['ArrowRight']) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
      }

      // --- Mode Logic ---
      const mode = g.state.mode;

      let speedMult = 1.0;
      if (mode === 'MARUTE') speedMult = 1.5;
      if (mode === 'BURST') speedMult = 2.5;

      // Apply Force
      player.vx += dx * player.accel * speedMult;
      player.vy += dy * player.accel * speedMult;

      const currentFriction = mode === 'BURST' ? 0.96 : player.friction;
      player.vx *= currentFriction;
      player.vy *= currentFriction;

      const currentSpeed = Math.hypot(player.vx, player.vy);
      const limit = player.maxSpeed * speedMult;
      if (currentSpeed > limit) {
        const scale = limit / currentSpeed;
        player.vx *= scale;
        player.vy *= scale;
      }

      player.x += player.vx;
      player.y += player.vy + player.recoilY;
      player.recoilY *= 0.9;

      player.x = Math.max(40, Math.min(g.screen.w - 40, player.x));
      player.y = Math.max(40, Math.min(g.screen.h - 40, player.y));

      // --- Thruster Control ---
      const rampUp = 0.2;
      const rampDown = 0.1;

      let targetMain = 0.2;
      if (dy < 0) targetMain = 1.0;
      if (mode === 'MARUTE') targetMain = Math.max(targetMain, 0.4);
      if (mode === 'BURST') targetMain = 2.0;

      player.thrusters.main +=
        (targetMain - player.thrusters.main) *
        (dy < 0 || mode === 'BURST' ? rampUp : rampDown);

      const inputDown = dy > 0;
      player.thrusters.brake +=
        ((inputDown ? 1.0 : 0.0) - player.thrusters.brake) * 0.2;

      const inputLeft = dx < 0;
      player.thrusters.rightSide +=
        ((inputLeft ? 1.0 : 0.0) - player.thrusters.rightSide) * 0.2;

      const inputRight = dx > 0;
      player.thrusters.leftSide +=
        ((inputRight ? 1.0 : 0.0) - player.thrusters.leftSide) * 0.2;

      emitGNParticles(g, player, mode);

      const targetTf = mode === 'MARUTE' || mode === 'BURST' ? 1 : 0;
      player.transformFactor += (targetTf - player.transformFactor) * 0.08;

      const targetMissile =
        g.state.weapon === 'MISSILE' && g.input.pointer.down ? 1 : 0;
      player.missileOpen += (targetMissile - player.missileOpen) * 0.2;

      const w = weapons[g.state.weapon] || weapons.RIFLE;
      w.update(g, player);
    },

    render(g) {
      const ctx = g.ctx2d.main;
      const mode = g.state.mode;

      ctx.save();
      ctx.translate(player.x, player.y);

      // 1. Main Central Thruster (Engine)
      drawMainThrusters(ctx, player, mode, g.time.frame);

      // 2. Main Body & Binders (Now includes Side Thrusters to prevent overlap)
      drawShipBody(ctx, player, mode);

      // 3. Weapons (Rifle geometry)
      weapons.RIFLE.render(g, player);

      // 4. Air Brakes (Top Layer)
      drawBrakeThrusters(ctx, player);

      ctx.restore();
    },

    getHitShape() {
      return { type: 'circle', x: player.x, y: player.y, r: 24 };
    },
  };

  return player;
}

// ============================================================================
//   VISUALS
// ============================================================================

function emitGNParticles(g, player, mode) {
  let gnColor = '#00ffaa';
  if (mode === 'MARUTE') gnColor = '#ff003c';
  if (mode === 'BURST') gnColor = '#00ffff';

  // Main engine sparks
  if (player.thrusters.main > 0.3) {
    const multiplier = mode === 'BURST' ? 4 : 1;
    const count = Math.floor(player.thrusters.main * 2 * multiplier);

    for (let i = 0; i < count; i++) {
      g.spawn.particle({
        type: 'spark',
        x: player.x + (Math.random() - 0.5) * 12,
        y: player.y + 70,
        vx: (Math.random() - 0.5) * (mode === 'BURST' ? 10 : 2),
        vy: 4 + Math.random() * 6 + (mode === 'BURST' ? 10 : 0),
        color: gnColor,
        size: (2 + Math.random() * 2) * (mode === 'BURST' ? 1.5 : 1),
        decay: 0.06,
      });
    }
  }

  // Side thruster smoke (Visual only, distinct from flame geometry)
  const sideOpts = { type: 'gn_smoke', color: gnColor, size: 3, decay: 0.15 };
  if (player.thrusters.leftSide > 0.3 && g.time.frame % 2 === 0) {
    g.spawn.particle({
      ...sideOpts,
      x: player.x - 85, // Updated position
      y: player.y - 10,
      vx: -5,
    });
  }
  if (player.thrusters.rightSide > 0.3 && g.time.frame % 2 === 0) {
    g.spawn.particle({
      ...sideOpts,
      x: player.x + 85, // Updated position
      y: player.y - 10,
      vx: 5,
    });
  }
}

function drawMainThrusters(ctx, player, mode, frame) {
  const p = player.thrusters.main;
  if (p < 0.1) return;

  let color = '#00ffaa';
  if (mode === 'MARUTE') color = '#ff003c';
  if (mode === 'BURST') color = '#aaffff';

  ctx.save();
  ctx.translate(0, 80);

  const isBurst = mode === 'BURST';
  const beamLen = isBurst ? 300 + Math.random() * 50 : 30 + p * 90;
  const beamW = isBurst ? 25 + Math.random() * 5 : 10 + p * 8;

  const grad = ctx.createLinearGradient(0, 0, 0, beamLen);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.1, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.globalCompositeOperation = 'lighter';
  ctx.beginPath();
  ctx.moveTo(-beamW, 0);
  ctx.lineTo(0, beamLen);
  ctx.lineTo(beamW, 0);
  ctx.fill();
  ctx.restore();
}

function drawBrakeThrusters(ctx, player) {
  const p = player.thrusters.brake;
  if (p < 0.1) return;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  // Front air brake flaps
  const vents = [-1, 1];
  vents.forEach((side) => {
    ctx.beginPath();
    ctx.arc(side * 20, -30, 2 + p * 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawShipBody(ctx, player, mode) {
  const tf = player.transformFactor;
  const spread = tf * 25;
  const noseSplit = tf * 12;
  const isMaruteOrBurst = mode === 'MARUTE' || mode === 'BURST';
  const gnColor = isMaruteOrBurst ? '#ff003c' : '#00ffaa';

  // 1. Central Fuselage
  ctx.save();
  ctx.fillStyle = '#2a2a30';
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(12, 0);
  ctx.lineTo(8, 60);
  ctx.lineTo(-8, 60);
  ctx.lineTo(-12, 0);
  ctx.fill();

  // Rear Engine Block
  ctx.fillStyle = '#1a1a20';
  ctx.fillRect(-10, 50, 20, 30);
  ctx.restore();

  // 2. Large Weapon Binders (Integrated with Side Thrusters)
  [-1, 1].forEach((side) => {
    // Select the correct thruster value for this side
    // If side is -1 (Left), use leftSide thruster power
    // If side is 1 (Right), use rightSide thruster power
    const thrusterPower =
      side === -1 ? player.thrusters.leftSide : player.thrusters.rightSide;

    ctx.save();
    ctx.scale(side, 1);
    ctx.translate(45 + spread, 0);

    // Pass the thruster power to the binder drawing function
    drawWeaponBinder(ctx, player, mode, side, gnColor, thrusterPower);
    ctx.restore();
  });

  // 3. Nose Cone
  [-1, 1].forEach((side) => {
    ctx.save();
    ctx.translate(side * noseSplit, -35);

    ctx.fillStyle = '#eee';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * 14, 25);
    ctx.lineTo(side * 8, -65);
    ctx.lineTo(0, -75);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * 4, 10);
    ctx.lineTo(side * 2, -50);
    ctx.lineTo(0, -60);
    ctx.fill();

    // Sensor strip
    ctx.fillStyle = gnColor;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(side * 3, -42);
    ctx.lineTo(side * 3, -30);
    ctx.lineTo(0, -28);
    ctx.fill();
    ctx.restore();
  });

  // 4. Marute Face (Transformation Detail)
  if (tf > 0.2) {
    ctx.save();
    ctx.translate(0, -60);
    ctx.fillStyle = '#111';
    ctx.globalAlpha = tf;
    ctx.fillRect(-6, -10, 12, 20);
    const flicker = Math.random() > 0.9 ? 1.5 : 1;
    ctx.shadowBlur = 10 * flicker;
    ctx.shadowColor = '#f00';
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.arc(0, -2, 3, 0, Math.PI * 2);
    ctx.arc(-4, -6, 2, 0, Math.PI * 2);
    ctx.arc(4, -6, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 5. Cockpit Canopy
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.lineTo(8, -15);
  ctx.lineTo(0, -5);
  ctx.lineTo(-8, -15);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(3, -20);
  ctx.lineTo(0, -20);
  ctx.fill();
}

/**
 * Draws the Weapon Binder, Missile Hatches, AND the Side Thruster Pod.
 * All in one coordinate system to prevent overlapping.
 */
function drawWeaponBinder(ctx, player, mode, side, gnColor, thrusterPower) {
  // --- 1. Main Binder Body (Orange/White) ---
  const grad = ctx.createLinearGradient(-15, 0, 30, 0);
  grad.addColorStop(0, '#ddd');
  grad.addColorStop(0.4, '#ff9500');
  grad.addColorStop(1, '#cc7000');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-15, -55);
  ctx.lineTo(15, -55);
  ctx.lineTo(28, -20); // Top-right corner
  ctx.lineTo(28, 40); // Bottom-right corner
  ctx.lineTo(10, 60); // Bottom-center point
  ctx.lineTo(-10, 50); // Bottom-left
  ctx.lineTo(-15, -55);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // --- 2. Missile Hatch Array ---
  const hatchColor = player.missileOpen > 0.5 ? '#1a1a1a' : '#d0d0d0';
  ctx.fillStyle = hatchColor;

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 2; col++) {
      const mx = -10 + col * 10;
      const my = -35 + row * 12;
      ctx.fillRect(mx, my, 8, 10);
      if (player.missileOpen <= 0.5) {
        ctx.fillStyle = '#aaa';
        ctx.fillRect(mx + 3, my, 2, 10);
        ctx.fillStyle = hatchColor;
      }
    }
  }

  // --- 3. Inner Mechanism Details ---
  ctx.fillStyle = '#333';
  ctx.fillRect(-12, 10, 8, 35);
  ctx.fillStyle = '#111';
  ctx.fillRect(-10, 10, 4, 35);

  // --- 4. Outer Stabilizer Plate ---
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.moveTo(28, -20);
  ctx.lineTo(32, -20);
  ctx.lineTo(32, 40);
  ctx.lineTo(28, 40);
  ctx.fill();

  // --- 5. Condenser / Sensor Strip ---
  ctx.fillStyle = gnColor;
  ctx.shadowColor = gnColor;
  ctx.shadowBlur = 8;
  ctx.fillRect(18, -10, 4, 40);
  if (mode === 'MARUTE' || mode === 'BURST') {
    ctx.fillRect(-15, 20, 3, 20);
  }
  ctx.shadowBlur = 0;

  // --- 6. SIDE THRUSTER POD (NEW GEOMETRY) ---
  // A dedicated pod attached to the outer side to house the lateral thruster.
  // Located at x > 32 to clear the main body.
  const podColor = '#222';
  const podHighlight = '#444';

  ctx.save();
  ctx.translate(32, -5); // Position outside the binder block

  // Pod Housing
  ctx.fillStyle = podColor;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(12, -5); // Protrudes out
  ctx.lineTo(12, 25);
  ctx.lineTo(0, 30);
  ctx.fill();

  // Mechanical detail
  ctx.fillStyle = podHighlight;
  ctx.fillRect(0, 0, 8, 20);

  // Nozzle (Where the flame comes out)
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.moveTo(8, 2);
  ctx.lineTo(14, 5);
  ctx.lineTo(14, 15);
  ctx.lineTo(8, 18);
  ctx.fill();

  // --- 7. THE FLAME (Integrated) ---
  if (thrusterPower > 0.1) {
    let flameColor = mode === 'MARUTE' ? '#ff003c' : '#00ffaa';
    if (mode === 'BURST') flameColor = '#00ffff';

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = flameColor;
    ctx.shadowBlur = 15;
    ctx.shadowColor = flameColor;

    // Draw flame extending from the nozzle (x=14)
    ctx.beginPath();
    ctx.moveTo(14, 5);
    // Length depends on power
    const len = 14 + thrusterPower * 30 + Math.random() * 5;
    const wid = 5 + thrusterPower * 5;

    ctx.lineTo(len, 10); // Tip
    ctx.lineTo(14, 15);
    ctx.fill();

    // Inner white core
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(14, 8);
    ctx.lineTo(14 + len * 0.6, 10);
    ctx.lineTo(14, 12);
    ctx.fill();
  }

  ctx.restore();
}
