# Build for Windows x64

The merged `main` branch contains the Windows tray, system double-click interval, single-instance behavior and Mini recovery code, alongside the shared English/Chinese interface. The current source version is 0.2.1; release packages retain their own recorded build commits.

## Preferred: build on Windows

Install the [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/): Rust with the MSVC toolchain, Visual Studio C++ Build Tools, WebView2, Node.js 22.12+ (or a newer supported release) and pnpm 10+.

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm tauri build
```

`src-tauri/tauri.windows.conf.json` selects NSIS packaging. For version 0.2.1, the expected output is:

```text
src-tauri/target/release/bundle/nsis/Flowglass_0.2.1_x64-setup.exe
```

The configuration selects per-user installation, Simplified Chinese installer text and a WebView2 bootstrapper download when needed. Validate those behaviors on the target machine rather than treating the configuration as test evidence.

For desktop development, use `pnpm tauri dev`. Its cross-platform Vite command uses port 5173, matching `devUrl`.

## Experimental: cross-build from macOS

The published 0.2.1 Windows package was cross-built from macOS. This route can produce an installer, but it does not replace testing it on Windows.

On Apple Silicon macOS, the project has used a Windows GNU target, mingw-w64 and NSIS:

```bash
rustup target add x86_64-pc-windows-gnu
brew install mingw-w64 makensis
pnpm install --frozen-lockfile
TAURI_NSIS_DIR=/opt/homebrew/share/nsis pnpm tauri build --target x86_64-pc-windows-gnu
```

The NSIS path above assumes Homebrew under `/opt/homebrew`; adjust it for the actual installation. Expected 0.2.1 output:

```text
src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/Flowglass_0.2.1_x64-setup.exe
```

With the GNU toolchain, verify that the installer contains both the executable and `WebView2Loader.dll`. `cargo check` only checks code; it does not establish that an installer links, installs or runs correctly. Prefer a native MSVC build when investigating differences specific to the cross-build.

## Before sharing a package

Record the source commit, version, target, full build command, toolchain, SHA256 and any signing status. Test installation and first launch, WebView2 presence/absence, tray recovery/quit, a second launch, Mini drag/menu behavior and display scaling. Include at least 100% and one non-integer scaling factor, and distinguish actual results from untested configurations.

The [known issues](KNOWN-ISSUES.md) include the current language-draft and Settings layout problems. The [original acceptance pack](requirements/00-开发与验收入口.md) is a 0.1.1 baseline, not a claim that all 0.2.1 platform cases passed.

## 中文说明

建议在 Windows 上使用 MSVC 工具链构建并验收。0.2.1 已有 macOS 交叉构建的实验性安装包，不能再将“尚无 Windows 包”作为当前状态；也不能因为能产出 EXE，就认为安装、托盘、缩放和多屏都已通过。交付时请附准确 commit、包哈希与实测环境。
