# bobo Backlog

记录暂时不做但需要记住的事项。

---

## Backlog items

### preserve user custom scale across startup resize
**问题**：BongoCat 原生 `useModel.handleResize` 在启动时会根据当前窗口尺寸反向计算 scale（公式：`currentWindow / modelNatural * 100`），覆盖用户设置的值。

**示例**：
- 用户设 scale=120（期望窗口 768x768）
- handleResize 启动时读取初始窗口（640x640），计算 scale=100
- 当前阶段 4.1 的 normalizeScale 看到 scale=100 在 [80,150] 内，不纠正
- 最终 scale=100，用户设置被覆盖

**影响**：scale=120 和 150 的用户设置在启动后被 BongoCat 默认行为覆盖。

**修复方向**（不在当前阶段做）：
- 选项 A：重构 `handleResize`，不在启动时反向计算 scale
- 选项 B：在 `handleResize` 完成后，根据 window/model 的关系重新计算 scale
- 选项 C：在 main page 启动时，先根据持久化的 scale 设置窗口大小，再让 handleResize 跑

**关联代码**：
- `src/composables/useModel.ts` - handleResize 函数
- `src/stores/cat.ts` - window.scale 字段

**记录人**：阶段 4.1 验收后

---

### 后续换 bobo 图标
**目标**：替换 src-tauri/icons/ 下 13 个 PNG + icon.icns + icon.ico，加 src-tauri/assets/logo.png、logo-mac.png、tray.png、tray-mac.png 的 4 个源图。

**当前状态**：阶段 5 故意不改图标，沿用 BongoCat 的图标资源。

**前置**：
- 准备 2 个源 PNG（logo.png 1024x1024、logo-mac.png 1024x1024 圆角）
- 准备 2 个托盘图标（tray.png 32x32、tray-mac.png 22x22 模板）

**执行步骤**：
1. 把源 PNG 放到 `src-tauri/assets/`
2. 运行 `pnpm tauri icon src-tauri/assets/logo-mac.png`（macOS）或 `pnpm tauri icon src-tauri/assets/logo.png`（其他）自动生成所有平台图标
3. 替换 `src-tauri/icons/` 下所有文件
4. 替换 `src-tauri/assets/` 下 4 个源文件
5. 验证应用图标和托盘图标都正确

**关联代码**：`scripts/buildIcon.ts`（已经支持 tauri icon 命令）

**记录人**：阶段 5 验收后

---

### 后续制作自己的真实猫猫模型
**目标**：找一只更合适的猫猫模型（最好是自己制作的 Live2D 模型），替换当前的罗小黑。

**选项**：
- A. 从社区模型库选一只更合适的（[Awesome-BongoCat](https://github.com/ayangweb/Awesome-BongoCat)）
- B. 用 Cubism Editor 自己做（最灵活但需要 Cubism 知识）
- C. 找人定制

**当前模型的问题**：
- 罗小黑是动画 IP 的猫形象，可能不是用户最终想要的
- 罗小黑 0 motions，所有动作靠伪动作系统合成
- 模型有"小嘿咻" mini cat，反应大猫不太明显

**前置**：
- 决定猫的种类（橘猫/白猫/英短/美短等）
- 准备好 .model3.json / .moc3 / 贴图 / expressions / motions
- 模型必须有完整的 Live2D 参数（ParamAngleX/Y/Z, ParamMouseX/Y, etc.）

**执行步骤**：
1. 拿到模型 .zip
2. 替换 `src-tauri/assets/models/{standard,keyboard,gamepad}/` 三个文件夹
3. 调整 catStore.background 默认值（如需要）
4. 验证所有动作和表情正常

**记录人**：阶段 5 验收后

---

### 后续实现场景背景切换
**目标**：实现 `catStore.background.mode = 'scene'`，让猫执行特定动作时自动切换背景。

**示例场景**：
- 猫"滑雪"动作 → 雪山背景
- 猫"睡觉"动作 → 夜晚卧室背景
- 猫"跳舞"动作 → 派对背景

**当前状态**：
- 阶段 2 已经在 catStore 加了 `background: { mode, scenesDirectory }`
- 阶段 2 在 main page 加了 `applyBackgroundForMotion()` 函数
- **接口已预留，未实现具体场景**

**实现步骤**：
1. 在模型 resources 目录下创建 `scenes/` 子目录
2. 为每个动作准备背景图（如 `scenes/CAT_motion_ski.png`）
3. 验证 `applyBackgroundForMotion()` 在 catStore.background.mode === 'scene' 时正确切换
4. 在偏好设置里加场景背景开关 UI

**关联代码**：
- `src/stores/cat.ts` - background 字段
- `src/pages/main/index.vue` - applyBackgroundForMotion 函数
- `src/composables/usePseudoMotion.ts` - 可扩展为触发场景切换

**记录人**：阶段 5 验收后

---

### 后续快捷键自定义
**目标**：让用户能在偏好设置里自定义全局快捷键（如把 1-4 绑到表情 0-3）。

**当前状态**：
- 原 BongoCat 默认 `modelStore.shortcuts` 把 Cmd+1-4 绑到 motion，Cmd+5-8 绑到 expression
- 罗小黑 0 motions，所以 Cmd+1-4 触发任何东西
- 用户按普通 1-4 数字键不响应

**实现步骤**：
1. 在 `src/pages/preference/` 加"快捷键"设置面板
2. 让用户能编辑 `modelStore.shortcuts` 里的快捷键
3. 可选：让用户能把任意键（包括 1-4 数字键）绑到任何动作/表情
4. 持久化用户的设置

**关联代码**：
- `src/stores/model.ts` - shortcuts 字段
- `src/composables/useTauriListen.ts` - 全局快捷键监听
- `src/pages/preference/` - 偏好设置面板

**记录人**：阶段 5 验收后

---

### 后续清理 CI / GitHub workflow
**目标**：决定是删除、重写、还是保留 BongoCat 的 GitHub workflow 文件。

**当前状态**：阶段 5 故意不改，保留了所有 BongoCat 的 CI 文件：
- `.github/CONTRIBUTING.md` - BongoCat 贡献指南
- `.github/DOWNLOAD_GUIDE.md` - BongoCat 下载指南
- `.github/ISSUE_TEMPLATE/` - 指向 ayangweb/BongoCat issues
- `.github/workflows/release.yml` - BongoCat release pipeline
- `.github/workflows/sync-to-gitee.yml` - 同步到 Gitee
- `.github/workflows/upgradelink.yml` - BongoCat release endpoint

**决策选项**：
- A. **删除所有**：bobo 是个人项目，不需要 CI、issue template、contributing guide
- B. **简化保留**：删 workflows（没有 release server），保留 issue template 改成自己的
- C. **全部重写**：写 bobo 自己的 CI 和贡献指南

**推荐**：选项 A（删除）—— bobo 是个人的 fork，不期望外部贡献者，CI 也不需要。

**执行步骤**（无论选哪个）：
1. 决定保留哪些
2. 删除/修改对应文件
3. 验证 git diff 干净

**记录人**：阶段 5 验收后

---
