# Development

Flowglass uses React, TypeScript and Vite for the interface, with a Tauri 2 / Rust desktop shell. The public `main` branch includes the macOS and Windows work merged for 0.2.1.

## Run locally

Install Node.js 22.12+ (or a newer supported release), pnpm 10+, Rust stable and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your operating system.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The web preview runs at `http://127.0.0.1:8443`; Mini is at `/widget.html`. It is useful for layout and shared-state checks, but native dragging, tray controls and window behavior require the desktop app.

```bash
pnpm tauri dev
```

The desktop development command starts Vite on port 5173, matching `devUrl` in the Tauri configuration.

## Check a change

```bash
pnpm check
pnpm test
pnpm build
```

The current test scripts cover timer rules, menu isolation, completion rendering and language strings in an isolated harness. Browser checks and these tests do not establish native compatibility on their own.

For packages, use the platform guides: [macOS Intel](BUILD-macos-intel.md) · [Windows](BUILD-windows.md). For a host-platform build, use `pnpm tauri build`. Record the source commit, target, toolchain and package SHA256 when handing over a build.

## Find your way around

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Main timer, Settings and seven-day history |
| `src/widget.tsx` | Mini rendering, gestures and timer menu |
| `src/timerStore.ts` | Timer state, per-round duration and session records |
| `src/i18n.ts` | English/Chinese strings and saved language |
| `src/index.css` | Shared visual design and scaling |
| `src-tauri/src/lib.rs` | Native windows, platform events and Windows tray controls |
| `src-tauri/tauri*.conf.json` | Window and packaging configuration |
| `scripts/` | Isolated regression checks |
| `docs/requirements/` | Original 0.1.1 requirements and acceptance cases; see the version note below |

## Rules worth preserving

- Main and Mini use the same stored timer state; remaining time is derived from a deadline rather than two independent countdowns.
- A started round keeps its original duration. Settings affect a new round, including after a reset or mode switch.
- Ending a focus round early records time spent; paused time does not accumulate.
- Mini mode switches leave the next round ready to start. Dismissing a menu must not start or switch the timer.
- Completion settles once and replaces the numeric label with the completion message.

Normal serial operations are expected to avoid duplicate records. Strict transactions for near-simultaneous writes from both windows remain outside the current MVP scope.

## Documentation versions

[CHANGELOG.md](../CHANGELOG.md) describes shipped changes, and [known issues](KNOWN-ISSUES.md) records current limitations. The [original acceptance pack](requirements/00-开发与验收入口.md) freezes **FG-MVP-1.1 / 0.1.1**; it remains useful for timer rules and regression cases, but its old window dimensions, opacity values and platform-delivery status are not the current 0.2.1 specification. Do not silently rewrite that historical baseline to make a newer build appear to have passed it.

The [0.1.1 completion-fix record](COMPLETION-0.1.1.md) is historical too; its package hash refers to that build, not the current release.

## 开发说明

`main` 已合并三端代码。Web 预览用于界面与共享状态调试；原生窗口、拖动、托盘及安装仍需桌面环境验证。修改前先看[已知问题](KNOWN-ISSUES.md)，避免把旧问题当作本轮回归。

原需求包冻结于 0.1.1。计时规则仍有参考价值，但 0.2.x 的双语、窗口大小和透明度等变化以更新记录为准。提交与测试约定见[贡献说明](CONTRIBUTING.md)。
