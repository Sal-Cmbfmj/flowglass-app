# Windows (x64) 构建说明

基线：`eaf3a13016b59397e5a8a88c233b05b750de7c11`（Apple Silicon 0.1.1）。
本分支在共用源码上做最小 Windows 适配，前端与计时/统计逻辑与基线完全一致；
macOS 行为不受影响（所有 Windows 代码均以 `cfg(target_os = "windows")` 隔离）。

## Windows 侧新增能力（对照 macOS 等效项）

| 能力 | macOS 基线 | Windows 实现 |
| --- | --- | --- |
| 双击识别时长 | `NSEvent.doubleClickInterval` | `GetDoubleClickTime()`（系统设置真实值） |
| 主窗口关闭为隐藏 | Dock 图标重开恢复 | 托盘菜单「显示主面板」，左键托盘亦恢复 |
| 彻底退出 | ⌘Q | 托盘菜单「退出 Flowglass」 |
| 二次启动 | 基线无单实例保障 | `tauri-plugin-single-instance`：聚焦既有实例并恢复主面板，不创建第二份窗口/计时真值 |

## 前置条件（在 Windows 机器上）

- Windows 10/11 x64（建议首版面向 Windows 11 x64；实机矩阵以交付文档为准）
- [Node.js 22](https://nodejs.org/) + pnpm 10（`corepack enable` 或 `npm i -g pnpm`）
- [Rust stable](https://rustup.rs/)（msvc 工具链，默认 host target `x86_64-pc-windows-msvc`）
- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)（含 Desktop C++ 工作负载）
- [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)：Windows 11 一般自带；
  缺失时 NSIS 安装器默认会下载安装（`webviewInstallMode: downloadBootstrapper`）。
  若目标机器离线，参见 [Tauri 前置依赖](https://v2.tauri.app/start/prerequisites/)。

## 构建命令（在 Windows 机器上）

```powershell
pnpm install --frozen-lockfile
pnpm tauri build
```

`tauri.windows.conf.json` 已把 Windows 的 bundle 目标设为 NSIS；产物：

- `src-tauri/target/release/bundle/nsis/Flowglass_0.1.1_x64-setup.exe`

开发调试：`pnpm tauri dev`（`beforeDevCommand` 已改为跨平台写法 `pnpm dev --port 5173`，
不再使用 POSIX 的 `PORT=5173` 前缀）。安装器为 per-user（`installMode: currentUser`），
无需管理员权限；安装器语言为简体中文。

## 安装器行为

- NSIS exe（未签名）：SmartScreen 可能提示「未知发布者」，选「仍要运行」；
  不要求用户关闭任何系统安全策略。
- 创建开始菜单项，并提供桌面快捷方式选项。
- 升级：直接运行新版安装器覆盖安装；应用标识 `com.salcmbfmj.flowglass` 与数据目录不变。
- 卸载从「设置 → 应用」进行。

## 已知限制（如实）

- 本分支的开发环境为 Apple Silicon macOS：Windows 侧已通过 `cargo check --target
  x86_64-pc-windows-gnu` 交叉类型检查，但**尚未在真实 Windows 机器上完成构建、安装与
  交互验收**；NSIS 安装包必须在 Windows 实机产出后才能交付。
- 任务栏最小化/恢复、100/125/150/200% DPI 缩放、非焦点首击、右键菜单、拖动释放等
  用例需在 Windows 实机执行并记录证据。
