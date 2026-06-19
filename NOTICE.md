# NOTICE

## Original project

**BongoCat** — a cross-platform desktop pet application
- Repository: https://github.com/ayangweb/BongoCat
- Copyright (c) 2025 ayangweb
- License: MIT (see [LICENSE](./LICENSE))

BongoCat is a desktop pet that mimics your keyboard and mouse input. It is
built on the Tauri framework and supports macOS, Windows, and Linux (x11).
The original project is also inspired by
[Bongo-Cat-Mver](https://github.com/MMmmmoko/Bongo-Cat-Mver) by MMmmmoko.

## This project (bobo)

**bobo** is a customized derivative/fork of BongoCat, maintained by rachel.

- Repository: https://github.com/4t6h828zyp-cell/bobo
- Copyright (c) 2026 rachel
- License: MIT (inherited from BongoCat; see [LICENSE](./LICENSE))

bobo inherits BongoCat's MIT license. The original copyright notice
(Copyright (c) 2025 ayangweb) is preserved in [LICENSE](./LICENSE) as
required by the MIT terms.

## What bobo adds or changes

The full development history is in
[docs/development-history.md](./docs/development-history.md).
A summary of fork-specific changes:

- **Replaced the default BongoCat model with 罗小黑 (Luo Xiaohei)**
  from [Awesome-BongoCat](https://github.com/ayangweb/Awesome-BongoCat)
- **Transparent background by default** with a reserved scene-based
  background interface for future use
- **Pseudo motion system**: idle breathing, random blink, idle sleep
  + wake-on-input, and a minimal typing nod (replaces the lack of
  baked-in motions in the adopted model)
- **Window state validation**: rejects off-screen / invalid saved
  window state on startup
- **Scale normalization**: resets invalid scale values (< 80 or > 150)
  on startup, preserving normal user values
- **Re-branding** to the bobo name and identifier (com.bobo.yy)

The original BongoCat project, source code, and feature set are credited
to ayangweb and the BongoCat contributors. See the upstream repository
for the full BongoCat changelog and contributor list.
