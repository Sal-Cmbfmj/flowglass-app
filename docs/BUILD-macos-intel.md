# Build for macOS Intel

The merged source includes the 0.2.1 interface and shared timer rules. Build it for `x86_64-apple-darwin` to produce an Intel app. The original port began at 0.1.1; that historical baseline is not the current UI version.

## Prerequisites

- Node.js 22.12+ (or a newer supported release) and pnpm 10+
- Rust stable and Xcode Command Line Tools
- The Intel target: `rustup target add x86_64-apple-darwin`

An Apple Silicon Mac can cross-build this target; an Intel Mac can build it natively.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm tauri build --target x86_64-apple-darwin
```

For version 0.2.1, expected outputs are:

```text
src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Flowglass.app
src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/Flowglass_0.2.1_x64.dmg
```

## Verify the package

```bash
file src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Flowglass.app/Contents/MacOS/flowglass
lipo -info src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Flowglass.app/Contents/MacOS/flowglass
```

The executable must contain x86_64. Record the source commit, version, build command, toolchain, package SHA256 and signing/notarization status. Testing under Rosetta on Apple Silicon is useful supplementary evidence; it does not establish Intel hardware or minimum-OS compatibility.

The current test packages are unsigned and not notarized. See [installation guidance](INSTALL.md) and [known issues](KNOWN-ISSUES.md).

## Optional: Universal build

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
pnpm tauri build --target universal-apple-darwin
```

This is a build option, not an additional package claimed to be present in the current release. Verify both architectures and test on the corresponding devices before sharing it.

## 中文说明

Intel 包来自同一套共享前端与计时逻辑，编译目标为 x86_64。架构输出、Rosetta 启动和 Intel 真机验证是不同层级的证据，应分别记录。当前界面版本为 0.2.1；最低系统版本和完整设备兼容性仍以实际测试为准。
