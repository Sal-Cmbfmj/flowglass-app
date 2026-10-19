# macOS Intel (x86_64) 构建说明

基线：`eaf3a13016b59397e5a8a88c233b05b750de7c11`（Apple Silicon 0.1.1）。
本分支不修改任何应用代码：Intel 版与 M 基线共享同一份前端与 Rust 源码，
仅以 `x86_64-apple-darwin` 目标重新编译。功能与视觉与 0.1.1 基线完全一致。

## 前置条件

- Node.js 22 + pnpm 10+（`pnpm install --frozen-lockfile`）
- Rust stable（本机默认工具链即可）
- Xcode Command Line Tools
- 已安装 x86_64 交叉目标：`rustup target add x86_64-apple-darwin`

Apple Silicon Mac 可直接交叉编译 x86_64 目标；在 Intel Mac 上原生构建命令相同。

## 构建命令

```bash
pnpm install --frozen-lockfile
pnpm tauri build --target x86_64-apple-darwin
```

产物位置：

- `src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Flowglass.app`
- `src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/Flowglass_0.1.1_x64.dmg`

## 架构验证

```bash
file src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Flowglass.app/Contents/MacOS/flowglass
# 期望：Mach-O 64-bit executable x86_64

lipo -info src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Flowglass.app/Contents/MacOS/flowglass
# 期望：Non-fat file with architecture x86_64
```

Apple Silicon Mac 上的运行验证属于 Rosetta 转译补充证据，不能替代 Intel 实机验收。

## Universal 包（可选）

如需同时覆盖两种架构：

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
pnpm tauri build --target universal-apple-darwin
```

## 已知限制

- 未做 Developer ID 签名/公证；首次安装受 Gatekeeper 限制，安装限制如实记录在交付文档。
- Intel 实机（最低系统版本、实机手势/性能）尚未验证，以实机证据为准。
