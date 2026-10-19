# Flowglass · Hourglass Pomodoro Timer

A quiet desktop companion for focused work: a main panel to watch the time, and a tiny always-on-top hourglass that stays on your desktop. Warm visuals, falling-sand animation, and a lightweight focus/break rhythm.

*English first · 中文说明见文末*

> Early beta. Packages are **unsigned** — see [Install notes](#install-notes) for Gatekeeper / SmartScreen guidance. Windows builds are cross-compiled and experimental.

## Features

- Main panel + always-on-top Mini widget sharing **one timer** (absolute-timestamp single source of truth — both windows always agree).
- Focus / break modes; duration settings only affect the **next** round.
- Mini gestures: **click** start/pause · **double-click** switch mode (idle) · **drag** to move · **right-click** for menu.
- Focus rounds & 7-day history — rounds count when time was actually invested, interruptions included; minutes count only real running time, never paused waiting.
- **English / 简体中文** interface, switchable in Settings (applies to both windows on save).
- Proportional UI: resize the window and the whole layout scales together, no reflow or cropping.

## Downloads

From [Releases](https://github.com/Sal-Cmbfmj/flowglass-app/releases):

| Package | Platform |
| --- | --- |
| `Flowglass_<v>_mac-arm64.zip` | macOS · Apple Silicon |
| `Flowglass_<v>_mac-x64.zip` / `.dmg` | macOS · Intel |
| `Flowglass_<v>_win-x64.exe` | Windows 10/11 x64 (experimental cross-build — see release notes) |

## Privacy

Flowglass keeps everything on your machine. Timer state, settings and the last 5000 session records live in the WebView's local storage — there are **no accounts, no cloud sync, no analytics and no telemetry**. Nothing is uploaded. (One network note: the stylesheet loads Google Fonts, so a font request may go out.)

## Install notes

- **macOS (unsigned)**: first launch may warn "cannot verify developer". Confirm the download source, then System Settings → Privacy & Security → **Open Anyway**. Do not disable security settings wholesale.
- **Windows**: SmartScreen may flag "unknown publisher" → More info → Run anyway. Requires WebView2 Runtime (the installer guides the download if missing). Closing the main window **hides** it — restore from the tray icon (left-click or menu); quit from the tray menu.
- Details: [docs/INSTALL.md](docs/INSTALL.md).

## Developer quickstart

Node.js 22, pnpm 10, Rust stable, plus the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform.

```bash
pnpm install --frozen-lockfile
pnpm dev                 # web preview on 8443; widget at /widget.html
pnpm tauri dev           # desktop dev (5173)
pnpm test                # isolated timer/menu regression
pnpm check               # TypeScript
pnpm tauri build         # native package for the host platform
```

Platform guides: [macOS Intel build](docs/BUILD-macos-intel.md) · [Windows build](docs/BUILD-windows.md)

## Structure

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | main window: timer, settings, history |
| `src/widget.tsx` | Mini rendering, gestures and menu |
| `src/timerStore.ts` | shared timer truth, frozen per-round duration, event log |
| `src/i18n.ts` | zh/en strings and language persistence |
| `src/index.css` | visual design and layout |
| `src-tauri/` | Rust shell: windows, tray (Windows), platform behaviors |
| `scripts/` | isolated regression checks |

## Known limitations

- Unsigned & un-notarized; no notifications or sounds; no auto-start; no export.
- Countdown derives from the wall clock; changing the system clock affects it.
- No transaction guarantees for two windows writing at the exact same instant (normal serial operations are deduplicated).
- The Windows NSIS installer is currently cross-compiled from macOS (experimental). Native Windows builds are preferred and documented.

## License

MIT — see [LICENSE](LICENSE). Icon is AI-assisted; the UI started from a Figma Make export and evolved.

---

# Flowglass · 沙漏番茄钟

一个安静陪伴专注的桌面小工具：主面板看时间，Mini 沙漏留在桌面。暖色界面、流沙动画，以及专注/休息的轻量节奏。

> 早期试用版。所有安装包**均未签名**，首次打开的引导见下方安装说明；Windows 包为交叉构建实验版。

## 功能

- 主面板 + 置顶 Mini 挂件共享**同一份计时真值**（绝对时间戳推导，两窗口永远一致）。
- 专注 / 休息模式；设置只影响**下一轮**。
- Mini 手势：**单击**开始/暂停 · **双击**切换模式（待开始）· **拖动**移动 · **右键**菜单。
- 专注轮数与近 7 天记录：有实际投入即记一轮（含提前结束）；分钟只累计真实运行时间，不含暂停等待。
- **中文 / English** 界面，在设置中切换（保存后两窗口同步生效）。
- 等比例缩放：调整窗口大小，整体布局同步缩放，不重排、不裁切。

## 下载

见 [Releases](https://github.com/Sal-Cmbfmj/flowglass-app/releases)：mac-arm64（Apple Silicon）、mac-x64（Intel）、win-x64（实验性交叉构建）。

## 隐私

所有数据保存在本机 WebView 的 localStorage（设置、当前轮次、最近 5000 条记录）。**无账号、无云同步、无统计上报**，不上传任何内容。（样式表加载 Google Fonts，可能产生一次字体网络请求。）

## 安装说明

- **macOS（未签名）**：首次打开如提示「无法验证开发者」，确认下载来源后到「系统设置 → 隐私与安全性 → 仍要打开」；请勿整体关闭系统安全设置。
- **Windows**：SmartScreen 提示「未知发布者」时选「更多信息 → 仍要运行」；依赖 WebView2（缺失时安装器引导下载）。主窗口关闭为**隐藏**，从托盘图标恢复（左键或菜单）；彻底退出用托盘菜单。
- 详细说明：[docs/INSTALL.md](docs/INSTALL.md)。

## 开发者快速开始

Node.js 22 + pnpm 10 + Rust stable 及对应平台 [Tauri 依赖](https://v2.tauri.app/start/prerequisites/)。

```bash
pnpm install --frozen-lockfile
pnpm dev                 # Web 预览 8443；挂件 /widget.html
pnpm tauri dev           # 桌面开发 5173
pnpm test                # 隔离计时/菜单回归
pnpm check               # TypeScript 检查
pnpm tauri build         # 构建当前平台安装包
```

平台指南：[macOS Intel 构建](docs/BUILD-macos-intel.md) · [Windows 构建](docs/BUILD-windows.md)

## 目录结构

| 路径 | 用途 |
| --- | --- |
| `src/App.tsx` | 主窗口：计时、设置、历史 |
| `src/widget.tsx` | Mini 渲染、手势与菜单 |
| `src/timerStore.ts` | 共享计时真值、冻结时长、事件日志 |
| `src/i18n.ts` | 中英文字典与语言持久化 |
| `src/index.css` | 视觉与布局 |
| `src-tauri/` | Rust 壳：窗口、托盘（Windows）、平台行为 |
| `scripts/` | 隔离回归检查 |

## 已知限制

- 未签名/未公证；无通知与提示音；无开机启动；无导出。
- 倒计时基于墙钟推导，修改系统时间会影响显示。
- 双窗口同一瞬间并发写入不做事务保障（常规串行操作已去重）。
- Windows NSIS 安装器目前为 macOS 交叉构建（实验性），建议按文档在 Windows 原生构建。

## 许可

MIT，见 [LICENSE](LICENSE)。图标为 AI 辅助生成；界面起始于 Figma Make 导出并继续开发。
