# Flowglass · 沙漏番茄钟

一个安静陪伴专注的桌面小工具：主面板看时间，Mini 沙漏留在桌面。暖色界面、流沙动画，以及专注/休息的轻量切换。

**当前为早期试用版，测试包覆盖 Apple Silicon Mac 与 Intel Mac。** Windows 适配已完成开发（本分支源码），NSIS 安装包需在 Windows 实机构建与验收，尚未交付。预览包未完成 Developer ID 签名或公证。

当前源码版本 **0.1.1**：修复 Mini 在最后一秒切换“完成”时的文字残影风险。

## 能做什么

- 主面板 + 置顶 Mini 浮窗，共享倒计时状态。
- 自定义专注/休息时长；设置只影响下一轮。
- Mini 单击开始/暂停，双击切换且待开始，拖动移动，右键查看更多操作。
- 专注轮数与近 7 天记录：提前结束也记一轮，时长只累计实际投入。
- 主面板等比例放大；关闭主窗口为隐藏：macOS 点 Dock 图标恢复，Windows 由系统托盘恢复（左键托盘或菜单「显示主面板」；托盘菜单「退出 Flowglass」彻底退出）。

## 普通用户

当前小范围试用，安装包由作者按需提供；本仓库暂未发布正式 Release 或网盘地址。获取包后按 [安装说明](docs/INSTALL.md) 操作，无需安装 Git 或编译代码。如果喜欢，可以给项目一个 Star；这是自愿支持。

## 开发者快速开始

需要 Node.js 22、pnpm 10、Rust stable，以及对应平台的 [Tauri 开发依赖](https://v2.tauri.app/start/prerequisites/)。

```bash
git clone https://github.com/Sal-Cmbfmj/flowglass-app.git
cd flowglass-app
pnpm install --frozen-lockfile
pnpm dev                 # Web 预览，默认 8443；挂件为 /widget.html
pnpm tauri dev           # 桌面开发，自动使用 5173
pnpm build               # 前端构建
pnpm check               # TypeScript 检查
pnpm test                # 隔离计时和菜单事件回归
pnpm tauri build --bundles app  # macOS 应用包
```

Web 预览没有原生拖动/Dock/托盘行为，Web 与桌面存储互相独立。macOS 默认产出 App/DMG；Windows 通过 `tauri.windows.conf.json` 产出 NSIS 安装器（双击识别时长读取系统设置，缺失 WebView2 时安装器联网引导安装），详见 [Windows 构建说明](docs/BUILD-windows.md)。

## 结构

| 文件 | 用途 |
| --- | --- |
| `src/App.tsx` | 主窗口、设置和历史 |
| `src/widget.tsx` | Mini 渲染、鼠标手势与菜单 |
| `src/timerStore.ts` | 共享绝对时间戳、本轮冻结时长与事件记录 |
| `src/index.css` | 视觉和布局 |
| `src-tauri/` | Rust 桌面壳、窗口配置和图标 |
| `scripts/` | 隔离回归检查 |

## 数据与边界

数据保存在本机 localStorage：`flowglass-settings` 设置，`flowglass-live` 当前轮次，`flowglass-log` 最多 5000 条结束事件；旧 `flowglass-history` 按天计数由主窗口迁移。`completed` 区分自然完成与提前结束，专注轮数包含两者，只计有实际投入的轮次。

- 无账号、云同步或导出；不上传计时记录。Google Fonts 的字体加载可能访问网络。
- 完成只有视觉反馈，暂无系统通知或提示音；退出后无独立后台服务。
- 极限双窗口同时修改状态的事务保障本 MVP 暂不处理。
- 最低 macOS 版本、Intel 和 Windows 均未完成完整兼容性验收。
- 当前启用 macOS 透明窗口相关私有 API 配置；上 Mac App Store 前须另做 API/沙盒/签名合规改造与审核，购买开发者账号不等于可直接上架。

## 贡献与许可

欢迎提交带版本、系统、操作步骤的 Issue；请勿上传私人信息。参见 [贡献说明](docs/CONTRIBUTING.md)。

MIT，见 [LICENSE](LICENSE)。依赖仍遵循各自许可证。图标为 AI 辅助生成，界面起始于 Figma Make 导出并继续开发。
