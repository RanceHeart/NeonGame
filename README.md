# AI_INDEX.md — Neon Overdrive (Vite + Vanilla JS)

## 0) Repo Map (入口速览)
- `main.js`：应用入口，创建 Engine + RootScene，engine.start()
- `core/engine.js`：双 Canvas、RAF tick、resize、注入 g、驱动 active scene
- `scenes/root.js`：场景路由控制（menu/sandbox/codex/boss），监听 `scene.set`
- `core/world.js`：实体管线 + systems（projectiles / particles / collisions）
- `ui/*`：DOM HUD / Codex UI / Main menu UI（通过 events 驱动）
- `entities/*`：player/enemy/boss + bits
- `weapons/*`：武器逻辑（update/render），通过 g.spawn 生成 projectile/particle

---

## 1) Global Context `g` (模块间通信约定)
`core/engine.js` 构建：
- `g.mountEl`：挂载 DOM 容器（Engine 追加两层 canvas）
- `g.ctx2d.bg` / `g.ctx2d.main`：2D context（bg: alpha false，main: alpha true）
- `g.screen`：`{ w, h }`
- `g.time`：`{ frame, dt, now, prev }`
- `g.input`：
    - `pointer`: `{ x, y, down, justDown, justUp }`
    - `keys`, `keysJustDown`, `keysJustUp`
    - `beginFrame()`
- `g.camera`：shake + zoom（beginFrame/endFrame 包裹主画布 transform）
- `g.events`：event bus（on/emit）
- `g.state`：全局玩法状态（由 scenes 初始化/更新）
- `g.spawn`：由 scene 注入（桥接 world / spawner）

### g.spawn 约定（在不同 scene 中注入）
- `projectile(p)`：world.spawnProjectile(p)
- `particle(p)`：world.spawnParticle(p)
- `spawnHitEffect(x, y, type, color)`：world.spawnHitEffect(...) → particles.spawnHitEffect(...)
- sandbox 额外：
    - `boss(type, opts)` / `enemy(type, opts)`：来自 `core/spawn.js`

---

## 2) Scenes (场景)
### `scenes/root.js`
- 管理 activeSceneId: `'menu' | 'sandbox' | 'codex' | 'boss'`
- 监听事件：
    - `scene.set` payload: nextSceneId

### `scenes/main_menu.js`
- 背景：复用 Codex grid（`drawCodexBG(g)`）
- UI：`ui/main_menu_ui.js`（mount/show/hide）

### `scenes/codex.js`
- 数据：`codex/entries.js` → `createCodexEntries()`
- UI：`ui/codex_ui.js`（列表 + prev/next）
- 事件：
    - `codex.prev` → prev entry
    - `codex.next` → next entry
    - `codex.select` payload: entryId → 选中
- 状态：
    - `g.state.codex.activeId`
    - `g.state.codexOpen`

### `scenes/sandbox.js`
- world + hud
- 注入 `g.spawn`：含 `boss/enemy/projectile/particle/spawnHitEffect`
- 初始化 state（示例）：
    - `mode: 'NORMAL'`
    - `weapon: 'RIFLE'`
    - `bossPhase: 0`
- 默认演示：spawn 3 个 omega（phase 0/1/2）+ 多个 drone

### `scenes/bossfight.js`
- world + hud
- 注入 `g.spawn`：仅 projectile/particle/spawnHitEffect
- 初始化 state（示例）：
    - `mode: 'NORMAL'`
    - `weapon: 'RIFLE'`
    - `bossPhase: 1`
- 创建：player + funnelBits(14) + scissorBits(6) + omega boss

---

## 3) World Pipeline (实体/系统)
`core/world.js`
- entities: array（alive=false 会被清理）
- systems:
    - `systems/projectiles.js` → `projectiles.list`
    - `systems/particles.js` → `particles.list` + `spawnHitEffect`
    - `systems/collisions.js` → 处理 player projectile -> enemy/boss hit
- render layer（按 tags）：
    - funnel/scissor_bit: 20
    - player: 10
    - boss: 2
    - enemy: 1

---

## 4) Systems
### `systems/projectiles.js`
核心：`list`，`spawn(p)`，`update(g)`，`render(g)`
常见 projectile types（出现过的）：
- `'rifle'`
- `'missile'`
- `'railgun_beam'`
- `'funnel_beam'`
- `'scissor_slash'`（仅判定体：render 中明确 skip）

注：粒子 type 在粒子系统里会被强制 `.toUpperCase()`，projectile type **不做**大写转换。

### `systems/particles.js`
- `spawn(p)`：强制 `type` 大写存储
- `spawnHitEffect(x, y, weaponType, color)`：根据 weaponType 生成 FLASH/SPARK/SMOKE/SHOCKWAVE/SLASH 等
- render 时所有判断使用大写：
    - `ELECTRIC_ARC`, `SHOCKWAVE`, `SLASH`, `SPARK`, `SMOKE`, `GN_SMOKE`, `FLASH`, `BEAM_TRAIL`, `EXPLOSION`

### `systems/collisions.js`
- targets：`tags includes enemy|boss && getHitShape`
- railgun 特判：line vs shape（circle/aabb）
- 其他弹体：把 projectile 当 circle（半径基于 p.width）
- 命中效果：
    - 识别武器类型 wType：RIFLE/MISSILE/RAILGUN/FUNNEL/SCISSOR
    - 调 `g.spawn.spawnHitEffect(...)`
    - railgun：额外计算 beam 上的投影命中点 + 垂直偏移
- 击中后：railgun_beam & scissor_slash 不会被标 dead；其他会 dead

---

## 5) Entities
### Player: `entities/player/harute.js`
- movement: WASD/Arrow keys（如果你要“不要键盘”，这里是入口）
- 核心状态字段：
    - `transformFactor`（0 normal → 1 marute）
    - `missileOpen`（weapon=MISSILE 且 pointer.down 时趋近 1）
    - `vlsIndex`（VLS 发射口索引）
    - thrusters: `{ main, brake, leftSide, rightSide }`
- weapon dispatch：
    - `const w = weapons[g.state.weapon] || weapons.RIFLE; w.update(g, player)`
- render：
    - 画机体 + `weapons.RIFLE.render(g, player)`（目前只固定调用 rifle.render）

### Funnel Bit: `entities/player/funnel_bit.js`
- tags: `['funnel']`
- state: `DOCKED | EJECT | ATTACK | RETURN`
- isFiring: `g.state.weapon==='FUNNEL' && g.input.pointer.down`
- 轨道追随 pointer + 定时 fire（spawn projectile `funnel_beam`）

### Scissor Bit: `entities/player/scissor_bit.js`
- tags: `['scissor_bit']`
- state: `DOCKED | DEPLOY | HUNT | CHAOS_CUT | COOLDOWN | RETURN`
- trail: 线条（会 push 点并衰减）
- CHAOS_CUT：
    - 每帧会 spawn：
        - particle: `slash`（注意：粒子系统会转成 `SLASH`）
        - projectile: `scissor_slash`（life=2，判定体）
- Hidden bits：bitId>=6 在 NORMAL 模式隐藏

### Boss: `entities/boss/omega.js`
- tags: `['boss']`
- state:
    - `phase`：可从 `g.state.bossPhase` 同步
    - phase 2 会 camera.addShake
- hit shape: aabb `w=240,h=80`

### Enemies
- `entities/enemy/drone.js`：circle hit，悬浮摆动，phase 2 会喷 spark
- `entities/enemy/turret.js`：aabb hit，朝 pointer 转
- `entities/enemy/test_enemy.js`：hitTimer flash（用于测试命中反馈）

---

## 6) Weapons
`entities/player/harute.js` 里注册：
- `RIFLE` → `weapons/rifle.js`
- `MISSILE` → `weapons/missiles_vls.js`
- `FUNNEL` → `weapons/funnels.js`
- `SCISSOR` → `weapons/scissor.js`
- `CANNON` → `weapons/railgun.js`

常见约定：
- 武器只用 `g.spawn.projectile / g.spawn.particle`
- 武器状态多挂在 `owner`（比如 vlsIndex / lastFiredFrame）

---

## 7) UI & Events
UI 模块应该：
- 只操作 DOM
- 点击后 `g.events.emit(type, payload)`，由 scene/logic 接收

已知事件：
- `scene.set` (payload: `'menu'|'sandbox'|'codex'|'boss'`)
- `codex.prev`
- `codex.next`
- `codex.select` (payload: entryId)

---

## 8) Codex Entries
`codex/entries.js`
- entries:
    - `enemy.vector`
    - `enemy.phalanx`
    - `enemy.gauss`
    - `enemy.hive`
    - `boss.izanami`（flat viewer 风格）
- `drawCodexBG(g)`：网格背景（随 frame 滚动）

---

## 9) “常见坑位”索引（改 Bug 时优先看）
1) **输入 beginFrame 被调用两次的风险**
- engine.tick() 里调用了 `g.input.beginFrame()`
- 但你 `world.js` 里没有再调用（✅ 当前实现没重复）
- 若未来有人在 `world.update()` 再调一次，会导致 `justDown/justUp` 被吞掉

2) **粒子 type 大小写**
- 粒子系统会强制 upper，所以外部传 `slash/beam_trail` 都能工作（内部会转 `SLASH/BEAM_TRAIL`）
- 但 render 判断必须按大写（你现在是对的）

3) **harute render 里只调用了 `weapons.RIFLE.render`**
- 如果切换武器要有枪口/特效渲染，通常应该改成 `w.render?.(g, player)` 或每个武器各自 render

4) **“不要键盘”入口**
- 直接改 `entities/player/harute.js`：去掉 WASD/Arrow，改成 pointer/虚拟摇杆/按钮事件驱动
