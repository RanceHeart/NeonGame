// src/ui/hud.js
export function createHud() {
  let rootEl = null;
  let stModeEl = null;
  let stGnEl = null;
  let targetEl = null;

  let btnNormal = null;
  let btnMarute = null;
  let btnBurst = null; // New

  let btnZoomIn = null;
  let btnZoomOut = null;

  const weaponBtns = new Map();

  function setModeUI(mode) {
    if (stModeEl) stModeEl.textContent = mode;

    if (stGnEl) {
      if (mode === 'BURST') {
        stGnEl.textContent = 'MAX OUTPUT';
        stGnEl.classList.add('alert');
        stGnEl.style.color = '#fff';
        stGnEl.style.textShadow = '0 0 10px #fff, 0 0 20px #0ff';
        document.body.style.boxShadow = 'inset 0 0 50px rgba(0,255,255,0.3)';
      } else if (mode === 'MARUTE') {
        stGnEl.textContent = 'TRANS-AM';
        stGnEl.classList.add('alert');
        stGnEl.style.color = '';
        stGnEl.style.textShadow = '';
        document.body.style.boxShadow = 'inset 0 0 100px rgba(255,0,50,0.2)';
      } else {
        stGnEl.textContent = '100%';
        stGnEl.classList.remove('alert');
        stGnEl.style.color = '';
        stGnEl.style.textShadow = '';
        document.body.style.boxShadow = 'none';
      }
    }

    if (btnNormal && btnMarute && btnBurst) {
      btnNormal.className = mode === 'NORMAL' ? 'm-active' : '';
      btnMarute.className = mode === 'MARUTE' ? 'm-marute' : '';
      btnBurst.className = mode === 'BURST' ? 'm-burst' : '';
    }
  }

  function setWeaponUI(weapon) {
    for (const [k, el] of weaponBtns.entries()) {
      el.classList.toggle('active', k === weapon);
    }
  }

  function mount(g) {
    rootEl = document.createElement('div');
    rootEl.id = 'ui-layer';
    rootEl.innerHTML = `
      <div class="header">
        <div>
          <div style="color:var(--c-main); font-size:10px; font-weight:900;">GN-011 SVMS [MA MODE]</div>
          <h1>HARUTE <span style="font-size:14px; opacity:0.5; font-style:normal;">// FINAL MISSION</span></h1>
        </div>
        <div class="sys-status">
          <div>OUTPUT <span class="status-val" id="st-gn">100%</span></div>
          <div>MODE <span class="status-val" id="st-mode">NORMAL</span></div>
        </div>
      </div>

      <div class="controls">
        <div class="panel">
          <div class="panel-title">SYSTEM MODE</div>
          <div class="btn-group">
            <button id="btn-normal">CRUISE</button>
            <button id="btn-marute">MARUTE</button>
            <button id="btn-burst">BURST</button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">VIEW OPTICS</div>
          <div class="btn-group">
            <button id="btn-z-out" style="width:30px">-</button>
            <button id="btn-z-in" style="width:30px">+</button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">WEAPON SELECT</div>
          <div class="btn-group">
            <button id="w-rifle">RIFLE</button>
            <button id="w-scissor">SCISSOR</button>
            <button id="w-missile">MISSILE</button>
            <button id="w-funnel">FUNNEL</button>
            <button id="w-cannon">CANNON</button>
          </div>
        </div>
      </div>
      
      <style>
        /* Extra styles for new button */
        button.m-burst {
          background: #0ff;
          color: #000;
          box-shadow: 0 0 25px #0ff;
          border-color: #fff;
          animation: pulse-fast 0.2s infinite;
        }
        @keyframes pulse-fast {
          50% { opacity: 0.8; }
        }
      </style>
    `;

    targetEl = document.createElement('div');
    targetEl.id = 'target';
    g.mountEl.appendChild(targetEl);

    stModeEl = rootEl.querySelector('#st-mode');
    stGnEl = rootEl.querySelector('#st-gn');

    btnNormal = rootEl.querySelector('#btn-normal');
    btnMarute = rootEl.querySelector('#btn-marute');
    btnBurst = rootEl.querySelector('#btn-burst');

    btnZoomIn = rootEl.querySelector('#btn-z-in');
    btnZoomOut = rootEl.querySelector('#btn-z-out');

    weaponBtns.set('RIFLE', rootEl.querySelector('#w-rifle'));
    weaponBtns.set('SCISSOR', rootEl.querySelector('#w-scissor'));
    weaponBtns.set('MISSILE', rootEl.querySelector('#w-missile'));
    weaponBtns.set('FUNNEL', rootEl.querySelector('#w-funnel'));
    weaponBtns.set('CANNON', rootEl.querySelector('#w-cannon'));

    // Mode Handlers
    const setMode = (m) => {
      g.state.mode = m;
      setModeUI(m);
      g.events.emit('mode/change', { mode: m });
    };

    btnNormal.addEventListener('click', () => setMode('NORMAL'));
    btnMarute.addEventListener('click', () => setMode('MARUTE'));
    btnBurst.addEventListener('click', () => setMode('BURST'));

    // Zoom Handlers
    btnZoomIn.addEventListener('click', () => {
      g.camera.setZoom(g.camera.targetZoom + 0.25);
    });
    btnZoomOut.addEventListener('click', () => {
      g.camera.setZoom(g.camera.targetZoom - 0.25);
    });

    for (const [weapon, el] of weaponBtns.entries()) {
      el.addEventListener('click', () => {
        g.state.weapon = weapon;
        setWeaponUI(weapon);
        g.events.emit('weapon/change', { weapon });
      });
    }

    g.mountEl.appendChild(rootEl);

    setModeUI(g.state.mode || 'NORMAL');
    setWeaponUI(g.state.weapon || 'RIFLE');
  }

  function unmount(g) {
    if (rootEl) {
      rootEl.remove();
      rootEl = null;
    }
    if (targetEl) {
      targetEl.remove();
      targetEl = null;
    }
  }

  function update(g) {
    if (targetEl) {
      // Reticle positions need to account for Zoom if we wanted to be perfect,
      // but DOM overlay is screen-space, so pointer is fine.
      targetEl.style.left = `${g.input.pointer.x}px`;
      targetEl.style.top = `${g.input.pointer.y}px`;
      targetEl.classList.toggle('t-lock', g.input.pointer.down);
    }
  }

  return { mount, unmount, update };
}
