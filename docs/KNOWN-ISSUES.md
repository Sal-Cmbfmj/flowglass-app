# Known issues · 已知问题

Applies to **0.2.2** (2026-10-19). Issues found in the 0.2.1 review are fixed in this build unless noted; the table below reflects the current state. Listing something here does not mean it has been fixed.

| Issue | Status in 0.2.2 | What you may notice |
| --- | --- | --- |
| Language draft after canceling | **Fixed** (FG021-01) | Every entry point — button, ⌘, / Ctrl+, — re-initialises both drafts, so a cancelled language selection can no longer leak back. |
| Settings panel height | **Fixed** (FG021-02) | The sheet fits inside its overlay with the language row; verified in both languages at the default window size. |
| Small secondary text | **Improved** (r4 layer) | Text tiers enlarged with per-language compensation and a slimmer hourglass; tell us if any label still feels small on your screen. |
| Partial Windows localization | **Fixed in code, pending real-machine check** (FG021-03) | The tray menu rebuilds in the saved UI language and the shortcut hint shows Ctrl+, on Windows. Verified statically; not yet confirmed on a physical Windows machine. |
| Windows Mini off-screen recovery | **Improved, pending real-machine check** (FG021-04) | "Show Mini" now detects a widget outside existing monitors and pulls it back, and window-API errors are logged. Needs validation across monitor layouts. |

If something misbehaves on Windows, send `%TEMP%\flowglass-widget.log` along with your Windows version, screen resolution and scaling — it now records the widget's geometry and any API errors.

## Testing boundaries

Type checks, isolated timer/menu/language regressions and browser layout checks have been run on 0.2.2. Those checks do not replace native installation, tray, drag, focus, multi-monitor or display-scaling tests. The Windows release is still an experimental macOS cross-build. A complete Intel Mac / Windows compatibility matrix and minimum verified OS versions are not yet available.

Sleep and quitting do not pause a running timer. There are no sound alerts, system notifications, automatic cycles, cloud sync or export. These are current product boundaries, rather than unexpected failures.

## 中文说明

0.2.2 已知问题与状态：

- **取消的语言草稿回流**：已修复。所有打开入口（按钮、⌘,/Ctrl+,）都会重置全部草稿。
- **设置弹窗底部裁切**：已修复。含语言行的弹窗在默认窗口下完整显示（中英文均已验证）。
- **辅助文字偏小**：已改善（r4 可读性层）。若你的屏幕上仍觉字号不足，欢迎反馈。
- **Windows 翻译不完整**：代码已修复，待实机确认。托盘菜单随保存的语言重建，快捷键提示在 Windows 显示 Ctrl+,。
- **Mini 屏幕外恢复**：已改善，待实机确认。「显示 Mini」会把不在现存显示器内的窗口拉回，错误写入日志。

Windows 异常请附 `%TEMP%\flowglass-widget.log`、系统版本、分辨率与缩放比例反馈。

计时与菜单回归、浏览器检查通过不代表所有原生设备已验收；Intel 和 Windows 仍需要更多安装、拖动、托盘、缩放与跨屏测试。睡眠与退出不暂停计时；无提示音、系统通知、自动循环、云同步与导出——这些是当前产品边界，不是故障。
