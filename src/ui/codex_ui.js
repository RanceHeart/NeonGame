// src/ui/codex_ui.js
export function createCodexUI({ entries }) {
  const ui = {
    rootEl: null,
    listEl: null,
    titleEl: null,
    descEl: null,
    clsEl: null,
    activeId: entries[0]?.id,
    g: null,

    mount(g) {
      if (ui.rootEl) {
        return;
      }

      ui.g = g;

      const mountEl = g.mountEl || g.ctx2d.main.canvas.parentElement;

      const root = document.createElement('div');
      root.style.position = 'absolute';
      root.style.inset = '0';
      root.style.display = 'none';
      root.style.pointerEvents = 'auto';
      root.style.fontFamily = "'Segoe UI', monospace";
      root.style.color = '#fff';
      root.style.background = 'rgba(0,0,0,0.0)';

      root.innerHTML = `
        <div style="display:flex; height:100%;">
          <div style="
            width:260px; background: rgba(10,15,20,0.85); border-right:1px solid #333;
            padding:16px; box-shadow: 10px 0 30px rgba(0,0,0,0.5); box-sizing:border-box;
            display:flex; flex-direction:column;
          ">
            <div style="margin-bottom:14px; color:#666; font-size:12px; letter-spacing:2px;">NEON DATABASE_</div>

            <div style="display:flex; gap:8px; margin-bottom:12px;">
              <button data-codex-back style="
                flex:1; padding:8px 10px; font-weight:900; letter-spacing:1px;
                background:rgba(0,0,0,0.5); border:1px solid #f33; color:#fcc; cursor:pointer;
              ">EXIT</button>
            </div>

            <div style="display:flex; gap:8px; margin-bottom:12px;">
              <button data-codex-prev style="
                flex:1; padding:8px 10px; font-weight:900; letter-spacing:1px;
                background:rgba(0,0,0,0.5); border:1px solid #544; color:#866; cursor:pointer;
              ">PREV</button>
              <button data-codex-next style="
                flex:1; padding:8px 10px; font-weight:900; letter-spacing:1px;
                background:rgba(0,0,0,0.5); border:1px solid #544; color:#866; cursor:pointer;
              ">NEXT</button>
            </div>

            <div data-codex-list style="flex:1; overflow:auto;"></div>

            <div style="margin-top:12px; color:#666; font-size:11px; line-height:1.4;">
              <div>• Click item to select</div>
            </div>
          </div>

          <div style="flex:1; position:relative;">
            <div style="position:absolute; left:24px; top:24px; pointer-events:none;">
              <div data-codex-cls style="color:#0ff; font-weight:900; letter-spacing:4px;">CLASS</div>
              <div data-codex-title style="font-size:40px; font-weight:900; font-style:italic; letter-spacing:-1px; text-transform:uppercase;">NAME</div>
              <div data-codex-desc style="
                margin-top:10px; max-width:420px; line-height:1.5; font-size:14px; color:#88a;
                border-left:2px solid #f05; padding-left:10px;
              ">DESC</div>
            </div>
          </div>
        </div>
      `;

      mountEl.style.position = 'relative';
      mountEl.appendChild(root);

      ui.rootEl = root;
      ui.listEl = root.querySelector('[data-codex-list]');
      ui.titleEl = root.querySelector('[data-codex-title]');
      ui.descEl = root.querySelector('[data-codex-desc]');
      ui.clsEl = root.querySelector('[data-codex-cls]');

      const backBtn = root.querySelector('[data-codex-back]');
      const prevBtn = root.querySelector('[data-codex-prev]');
      const nextBtn = root.querySelector('[data-codex-next]');

      if (backBtn) {
        backBtn.addEventListener('click', () => {
          if (ui.g && ui.g.events && ui.g.events.emit) {
            // CHANGED: Go to menu, not sandbox
            ui.g.events.emit('scene.set', 'menu');
          }
        });
      }
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (ui.g && ui.g.events && ui.g.events.emit) {
            ui.g.events.emit('codex.prev');
          }
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (ui.g && ui.g.events && ui.g.events.emit) {
            ui.g.events.emit('codex.next');
          }
        });
      }

      ui.rebuildList();
      ui.setActive(ui.activeId);
    },

    show() {
      if (ui.rootEl) {
        ui.rootEl.style.display = 'block';
      }
    },

    hide() {
      if (ui.rootEl) {
        ui.rootEl.style.display = 'none';
      }
    },

    rebuildList() {
      if (!ui.listEl) {
        return;
      }

      ui.listEl.innerHTML = '';

      for (const e of entries) {
        const item = document.createElement('div');
        item.style.padding = '12px';
        item.style.marginBottom = '10px';
        item.style.border = '1px solid #333';
        item.style.cursor = 'pointer';
        item.style.transition = '0.2s';
        item.style.position = 'relative';
        item.style.overflow = 'hidden';

        item.innerHTML = `
          <div style="font-size:10px; color:#666; font-weight:900; letter-spacing:2px;">${e.group}</div>
          <div style="font-size:18px; font-weight:bold; color:#eee; margin-top:2px;">${e.name}</div>
        `;

        item.addEventListener('mouseenter', () => {
          item.style.background = 'rgba(255,255,255,0.05)';
          item.style.borderColor = '#666';
        });
        item.addEventListener('mouseleave', () => {
          item.style.background =
            e.id === ui.activeId ? 'rgba(0,255,255,0.05)' : 'transparent';
          item.style.borderColor = e.id === ui.activeId ? '#0ff' : '#333';
        });

        item.addEventListener('click', () => {
          if (ui.g && ui.g.events && ui.g.events.emit) {
            ui.g.events.emit('codex.select', e.id);
          }
        });

        ui.listEl.appendChild(item);
      }
    },

    setActive(id) {
      ui.activeId = id;

      if (ui.listEl) {
        const children = Array.from(ui.listEl.children);
        for (const el of children) {
          const nameEl = el.querySelector('div:nth-child(2)');
          const name = nameEl ? nameEl.textContent : '';
          const entry = entries.find((x) => x.name === name);
          if (entry && entry.id === id) {
            el.style.background = 'rgba(0,255,255,0.05)';
            el.style.borderColor = '#0ff';
          } else {
            el.style.background = 'transparent';
            el.style.borderColor = '#333';
          }
        }
      }

      const e = entries.find((x) => x.id === id) || entries[0];
      if (ui.titleEl) ui.titleEl.textContent = e.name;
      if (ui.descEl) ui.descEl.textContent = e.desc;
      if (ui.clsEl) ui.clsEl.textContent = e.cls;
    },
  };

  return ui;
}
