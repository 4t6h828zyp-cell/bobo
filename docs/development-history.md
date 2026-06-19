# bobo Development History

bobo 的开发按阶段递进，每个阶段单独 commit。

## 阶段 1 — 初始化

**Commit**: `96ff4a8 chore: initialize bobo from BongoCat`

- 从 [ayangweb/BongoCat](https://github.com/ayangweb/BongoCat) fork 到 [4t6h828zyp-cell/bobo](https://github.com/4t6h828zyp-cell/bobo)
- 装 Rust 工具链（rustup + USTC 镜像）
- 装前端依赖（pnpm）
- Tauri 编译通过，启动 bongo-cat 进程

## 阶段 2 — 模型替换 + 品牌化

**Commit**: `57087e7 feat: rebrand to bobo with new model and transparent background`

- Bundle identifier 改为 `com.bobo.bobo`（后改为 `com.bobo.yy`）
- 替换默认 BongoCat 模型 → 罗小黑（来自 Awesome-BongoCat）
- 3 个模式文件夹（standard / keyboard / gamepad）都用罗小黑
- catStore 加 `background: { mode, scenesDirectory }` 配置
- main page 重构背景加载逻辑，默认 transparent
- 预留 scene 模式接口（阶段 5+ 可扩展）

## 阶段 3 — 伪动作系统

**Commit**: `b1d7617 feat: add pseudo motion system for bobo-cat`

罗小黑 0 motions，所有动作靠代码合成：

- 新增 `src/composables/usePseudoMotion.ts`
- **idle breathing**：持续 ParamBreath 正弦波动
- **blink**：2-6 秒随机，闭眼 200ms
- **sleep**：无输入 10s（dev）/ 60s（prod）后闭眼
- **wakeUp**：任何输入立即睁眼
- **typing nod**：按键盘时 ParamAngleY 短暂点头（罗小黑骨骼弱，效果不明显）

复用现有 Tauri 事件流（`LISTEN_KEY.DEVICE_CHANGED`），不引入新依赖。

## 阶段 4 — 窗口稳定 + lint

**Commit**: `3c617d8 fix: stabilize bobo window and lint config`

- `useWindowState.ts` 加 `isValidWindowState()` 验证：中心点 + 60% 可见 + 尺寸合理
- 不在屏幕内的窗口自动重置到主屏中心（500x500）
- 修复 pre-commit lint hook：只 lint `src/**/*.{js,ts,vue,scss}`，排除 `src-tauri/assets/**`

## 阶段 4.1 — Scale 规范化

**Commit**: `eb2209f fix: normalize invalid bobo scale`

- 修复 scale=50 的历史脏数据问题
- 启动时 normalizeScale：< 80 或 > 150 重置为 100
- watch 拦截 handleResize 反向计算覆盖
- 已知限制：scale=120/150 在 BongoCat 原生 handleResize 下会被覆盖（详见 backlog）

## 阶段 5 — 品牌化

**Commit**: `c1e7d70 chore: rebrand app as bobo`

14 个文件改动（0 个 README/LICENSE/.github/icons/模型）：
- `package.json` name → bobo, author → rachel
- `src-tauri/Cargo.toml` name/lib/authors 全部改
- `src-tauri/tauri.conf.json` productName/title/shortDescription → bobo
- `src-tauri/tauri.linux.conf.json` desktopTemplate → bobo.desktop
- `BongoCat.desktop` → `bobo.desktop`（重命名 + StartupWMClass）
- `src-tauri/src/main.rs` `bongo_cat_lib::run()` → `bobo_lib::run()`
- `index.html` `<title>bobo</title>`
- `src/composables/useTray.ts` TRAY_ID → BOBO_TRAY
- `src/constants/index.ts` GITHUB_LINK → 4t6h828zyp-cell/bobo
- 5 个 locale 文件 BongoCat → bobo

未改：图标、README、LICENSE、.github、第三方 URL

## 阶段 6 — 文档整理

**Commit**: `（即将）docs: document bobo project and attribution`

- 保留 LICENSE（ayangweb 的 MIT）
- 新建 NOTICE.md：归属说明
- 重写 README.md：bobo 项目文档，明确 Based on BongoCat
- 完善 docs/backlog.md：6 个 backlog 项
- 新建 docs/development-history.md：本文档

未改：功能代码、模型、图标、CI

---

## 后续

- 详见 [backlog.md](./backlog.md)
- 原项目 BongoCat：https://github.com/ayangweb/BongoCat
