# bobo

> 一个基于 [BongoCat](https://github.com/ayangweb/BongoCat) 改造的个人桌面宠物项目

`bobo` 是 [ayangweb/BongoCat](https://github.com/ayangweb/BongoCat) 的衍生项目。
保留了原项目的核心（Tauri 桌面壳 + Live2D 渲染 + 全局键鼠监听），并按个人偏好做了定制：
换上罗小黑模型、默认透明背景、加上伪动作系统、修复窗口状态等。

原项目使用 MIT License，本项目同样以 MIT License 发布，详见 [LICENSE](./LICENSE)
和 [NOTICE.md](./NOTICE.md)。

## 当前功能

- **桌面宠物显示**：透明窗口悬浮在桌面上
- **罗小黑 (Luo Xiaohei) 模型**：来自 [Awesome-BongoCat](https://github.com/ayangweb/Awesome-BongoCat)
- **透明背景**：默认不显示背景图（已预留场景背景接口）
- **呼吸动画 (idle breathing)**：持续 ParamBreath 正弦波动
- **随机眨眼 (blink)**：每 2-6 秒随机一次
- **闲置睡觉 (sleep)**：无输入 10 秒（dev）/ 60 秒（prod）后闭眼
- **输入后醒来 (wakeUp)**：任何键鼠输入立即睁眼
- **窗口状态保护**：启动时自动校验并恢复异常的窗口位置/大小
- **缩放保护**：启动时自动纠正异常的 scale 值（< 80 或 > 150 重置为 100）

## 本地开发

环境要求：Node.js、pnpm、Rust（rustup）、macOS / Windows / Linux。

```bash
# 1. 装前端依赖
pnpm install

# 2. 启动 dev 模式（首编译 ~10 分钟，热更新几秒）
pnpm tauri dev

# 3. 打包生产版本
pnpm tauri build
```

启动后桌面会出现一只罗小黑。鼠标移动 / 按键盘 / 静止 10 秒可以触发对应动作。

## 当前状态

这是**个人定制版**，还在持续开发中。已完成基础定制（模型替换、伪动作、窗口稳定），
还有多项 backlog 待做（图标、自有模型、场景背景、快捷键自定义等）。
详见 [docs/backlog.md](./docs/backlog.md)。

## 开发历史

按阶段递进，已完成阶段 1-5（初始化 → 模型替换 → 伪动作 → 窗口稳定 → 品牌化）。
详见 [docs/development-history.md](./docs/development-history.md)。

## Credits

### 基于的开源项目

- **[BongoCat](https://github.com/ayangweb/BongoCat)** by [ayangweb](https://github.com/ayangweb)
  - MIT License
  - 核心 Tauri 桌面壳、Live2D 渲染、全局键鼠监听、托盘菜单、偏好设置框架

- **[Bongo-Cat-Mver](https://github.com/MMmmmoko/Bongo-Cat-Mver)** by [MMmmmoko](https://github.com/MMmmmoko)
  - BongoCat 项目的灵感来源

- **[Tauri](https://github.com/tauri-apps/tauri)**
  - 跨平台桌面应用框架

- **[Live2D Cubism](https://www.live2d.com/)**
  - 桌面宠物模型的 Live2D 渲染

### 使用的第三方工具（未修改）

- **[bongocat.vteamer.cc](https://bongocat.vteamer.cc)** — Bongo-Cat-Mver 模型转换工具
- **[Awesome-BongoCat](https://github.com/ayangweb/Awesome-BongoCat)** — 社区模型资源库

### License

- 本项目：[MIT](./LICENSE)（继承自 BongoCat）
- 原项目：BongoCat (MIT, Copyright (c) 2025 ayangweb)
- 归属说明：[NOTICE.md](./NOTICE.md)

---

> 这不是 BongoCat 的官方分支，仅是个人 fork。
> 如需 BongoCat 的最新功能和支持，请访问 [ayangweb/BongoCat](https://github.com/ayangweb/BongoCat)。
