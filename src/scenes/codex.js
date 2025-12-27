// src/scenes/codex.js
import { createCodexUI } from '../ui/codex_ui.js';
import { createCodexEntries, drawCodexBG } from '../codex/entries.js';

export function createCodexScene() {
  let ui;
  let entries;
  let selectedIndex = 0;

  function setActiveByIndex(g, idx) {
    const n = entries.length;
    if (n <= 0) {
      return;
    }

    selectedIndex = idx;
    if (selectedIndex < 0) {
      selectedIndex = n - 1;
    }
    if (selectedIndex >= n) {
      selectedIndex = 0;
    }

    ui.setActive(entries[selectedIndex].id);
    if (!g.state.codex) {
      g.state.codex = {};
    }
    g.state.codex.activeId = entries[selectedIndex].id;
  }

  function prev(g) {
    setActiveByIndex(g, selectedIndex - 1);
  }

  function next(g) {
    setActiveByIndex(g, selectedIndex + 1);
  }

  return {
    init(g) {
      entries = createCodexEntries();
      ui = createCodexUI({ entries });

      ui.mount(g);

      g.state.codex = { activeId: entries[0].id };

      // ✅ 事件驱动：按钮点了就 emit
      if (g.events && g.events.on) {
        g.events.on('codex.prev', () => {
          prev(g);
        });
        g.events.on('codex.next', () => {
          next(g);
        });

        // 列表点击（UI 里会发 codex.select）
        g.events.on('codex.select', (id) => {
          const idx = entries.findIndex((e) => e.id === id);
          if (idx >= 0) {
            setActiveByIndex(g, idx);
          }
        });
      }
    },

    show(g) {
      ui.show();
      g.state.codexOpen = true;
    },

    hide(g) {
      ui.hide();
      g.state.codexOpen = false;
    },

    update(g) {
      // ✅ 不再读 ArrowUp/ArrowDown
    },

    render(g) {
      drawCodexBG(g);

      const ctx = g.ctx2d.main;
      ctx.save();

      // CRT scanline
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#000';
      for (let y = 0; y < g.screen.h; y += 3) {
        ctx.fillRect(0, y, g.screen.w, 1);
      }
      ctx.globalAlpha = 1;

      const activeId = g.state.codex?.activeId;
      const entry = entries.find((e) => e.id === activeId) || entries[0];
      entry.draw(ctx, g);

      ctx.restore();
    },
  };
}
