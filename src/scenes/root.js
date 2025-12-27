// src/scenes/root.js
export function createRootScene({
  menuScene,
  sandboxScene,
  codexScene,
  bossScene,
}) {
  let activeSceneId = 'menu'; // 'menu' | 'sandbox' | 'codex' | 'boss'
  const scenes = {
    menu: menuScene,
    sandbox: sandboxScene,
    codex: codexScene,
    boss: bossScene,
  };

  function switchScene(g, nextId) {
    if (activeSceneId === nextId) return;

    // 1. Hide Current
    if (scenes[activeSceneId]) {
      scenes[activeSceneId].hide(g);
    }

    // 2. Update State
    activeSceneId = nextId;
    if (!g.state) g.state = {};
    g.state.activeScene = nextId;

    // 3. Show Next
    if (scenes[activeSceneId]) {
      scenes[activeSceneId].show(g);
    }
  }

  return {
    init(g) {
      // Initialize all sub-scenes
      Object.values(scenes).forEach((scene) => {
        if (scene) scene.init(g);
      });

      // Default start
      activeSceneId = 'menu';

      // Initial Visibility
      scenes.menu.show(g);
      if (scenes.sandbox) scenes.sandbox.hide(g);
      scenes.codex.hide(g);
      scenes.boss.hide(g);

      // Listen for routing events
      if (g.events && g.events.on) {
        g.events.on('scene.set', (next) => {
          switchScene(g, next);
        });
      }
    },

    update(g) {
      if (scenes[activeSceneId]) {
        scenes[activeSceneId].update(g);
      }
    },

    render(g) {
      if (scenes[activeSceneId]) {
        scenes[activeSceneId].render(g);
      }
    },
  };
}
