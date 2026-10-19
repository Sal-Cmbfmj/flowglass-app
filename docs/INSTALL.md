# Install and use Flowglass

Current test release: **0.2.1**. Download from [GitHub Releases](https://github.com/Sal-Cmbfmj/flowglass-app/releases/tag/v0.2.1). For the app, choose a ZIP, DMG or EXE under **Assets**; the automatically generated “Source code” archives are for developers.

All packages are unsigned. Compatibility testing is ongoing; see the [known issues](KNOWN-ISSUES.md). Intel and Windows packages being available does not mean every system or display setup has been verified.

## macOS

1. Open **About This Mac**. If it shows an Apple M-series chip, choose `mac-arm64`. If it shows Intel, choose `mac-x64`.
2. Quit an existing Flowglass instance with **⌘Q** before updating.
3. Unzip the ZIP and move `Flowglass.app` into Applications. For the Intel DMG, open it and copy the app into Applications.
4. Open Flowglass from Applications. If macOS cannot verify the developer, confirm you downloaded the expected package, then follow [Apple's guidance](https://support.apple.com/en-gb/102445) in **System Settings → Privacy & Security → Open Anyway**. Do not turn off system-wide security protections or treat a malware warning as an ordinary unsigned-app prompt.

Closing the main window hides it. Click the Dock icon to reopen it; **⌘Q** quits both windows. Minimum supported macOS versions have not been established through a complete device test matrix.

## Windows x64

The 0.2.1 EXE is an experimental macOS cross-build. Native Windows builds are the preferred development path; this package is available for feedback from testers.

1. Download `Flowglass_0.2.1_win-x64_20261019.exe` and run it. If SmartScreen shows “unknown publisher,” confirm the package source before choosing **More info → Run anyway**, if that option is available. Do not disable security protections to install it.
2. The installer is configured for per-user installation and offers application shortcuts. It requires **WebView2 Runtime**; if missing, the installer is configured to download it. Offline machines need the runtime installed separately from [Microsoft](https://developer.microsoft.com/microsoft-edge/webview2/).
3. Start Flowglass from the installed shortcut. Closing the main window hides it. Left-click the tray icon, or choose **显示主面板** (“Show main window”), to reopen it.
4. Use **显示 Mini** to show the floating hourglass and **退出 Flowglass** to quit. These tray labels are currently Chinese even when the app interface is English.

If Mini is missing, clipped or behaves differently after changing monitors, include your Windows version, display resolution and scaling percentage in a report. The diagnostic file is `%TEMP%\flowglass-widget.log`; review its contents before sharing it. A complete Windows 10/11 compatibility and display-scaling matrix is not yet available.

## Everyday use

- Mini: click to start/pause/resume, double-click to switch mode ready to start, drag to move, right-click for its menu. A single click is intentionally delayed to distinguish it from a double-click.
- Settings: use the on-screen settings button. **⌘,** on Mac or **Ctrl+,** on Windows also toggles Settings, but 0.2.1 has a [language-draft bug](KNOWN-ISSUES.md) on that path.
- Choose 中文 or English and save. Cancel, Escape and clicking outside are intended to discard drafts; after canceling a language change, reopen with the on-screen button and check the selection before saving.
- Already-started sessions retain their original length. A reset or mode switch creates a new round using saved durations.
- Focus history includes interrupted rounds with time spent. Pauses do not add time. The app does not automatically begin the next round or play a sound.

## Updates and local records

Keep the same application identity when updating. On Mac, quit before replacing the app; on Windows, quit before running the newer installer. The app is designed to use the same local data location, but this beta has not completed a comprehensive upgrade/uninstall data-retention test matrix. Do not treat uninstalling as a backup or data-migration method.

Records are local to this computer; there is no cloud sync or export. Sleep or quitting does not pause a running timer. After quitting, there is no separate service to notify you when it ends.

---

## 中文安装说明

下载 [0.2.1 试用包](https://github.com/Sal-Cmbfmj/flowglass-app/releases/tag/v0.2.1)，展开 **Assets** 选择安装文件即可，不需要下载 Source code。

### Mac

在「关于本机」查看芯片：M 系列选 `mac-arm64.zip`，Intel 选 `mac-x64.zip` 或 `.dmg`。更新前用 **⌘Q** 退出旧版。ZIP 解压后将 `Flowglass.app` 放进「应用程序」；DMG 打开后将应用复制进去，再从「应用程序」打开。

包未签名/公证，首次打开若提示无法验证开发者，确认下载来源后按 [Apple 官方说明](https://support.apple.com/en-gb/102445)到「系统设置 → 隐私与安全性 → 仍要打开」。不要关闭全局安全设置，也不要把恶意软件警告一概当作普通未签名提示处理。

关闭主窗口只是隐藏，点击 Dock 图标恢复；彻底退出用 **⌘Q**。

### Windows

选择 `Flowglass_0.2.1_win-x64_20261019.exe`。这是供反馈的实验性交叉构建包，尚未覆盖所有 Windows 设备与缩放组合。若 SmartScreen 提示未知发布者，确认来源后，在系统允许的情况下选择「更多信息 → 仍要运行」。

安装器配置为按用户安装；依赖 WebView2，缺失时会尝试联网下载，离线机器需先从 [Microsoft](https://developer.microsoft.com/microsoft-edge/webview2/)安装运行时。

从安装后的快捷方式启动。关闭主窗口只是隐藏，左击托盘图标或选「显示主面板」恢复；「显示 Mini」用于显示挂件，「退出 Flowglass」彻底退出。若遇到 Mini 不可见或裁切，请反馈系统、分辨率、缩放比例；诊断文件为 `%TEMP%\flowglass-widget.log`，分享前先检查内容。

### 使用与更新

Mini 单击开始/暂停、双击切换并待开始、拖动移动、右键菜单。语言在设置中选择，保存生效。0.2.1 存在快捷键重开设置后复用已取消语言草稿的问题，建议用界面上的设置按钮打开并核对选择；完整说明见[已知问题](KNOWN-ISSUES.md)。设置面板可在遮罩内滚动。

更新前先退出应用。应用设计上沿用相同本地数据位置，但升级与卸载的数据保留尚未完成全面验证，请勿把卸载当作备份或迁移。记录保存在本机，没有同步或导出。睡眠或退出不会自动暂停计时，退出后也没有独立后台提醒。
