# Changelog · 更新记录

User-facing changes are listed here. Installation files and checksums live in [Releases](https://github.com/Sal-Cmbfmj/flowglass-app/releases). Current unresolved problems are tracked in [known issues](docs/KNOWN-ISSUES.md).

## 0.2.1 · 2026-10-19

- Enlarged the default main window to 990×621 so the interface is easier to read.
- Added space between the history heading, summary and chart.
- Realigned the Mini gesture guide and made Mini more visible when not hovered.
- Added a Windows tray action to show Mini, diagnostic logging, a missing-window recovery path and size resets on display-scale changes. These changes still need testing across more Windows display setups.

主窗口放大，历史页间距更舒展，挂件说明重新对齐，Mini 静置时更清楚。Windows 增加「显示 Mini」、诊断日志和窗口恢复/缩放处理；跨设备效果仍需继续测试。

## 0.2.0 · 2026-10-19

- Added English and Simplified Chinese interface text, selected in Settings and applied on save.
- Widened the design canvas to 860×540 to give English labels more room.
- Kept gesture labels on one line and refined their spacing.
- Brought the Intel Mac and Windows packaging work together with the shared interface. Windows includes tray recovery/quit, the system double-click interval and a single-instance plugin.

新增中英切换，加宽英文布局，整理手势说明，并整合 Intel 与 Windows 平台适配。0.2.0 的变化随 0.2.1 包提供；本仓库没有单独的 v0.2.0 Release。

## 0.1.1 · 2026-10-13

- Changed Mini's countdown-to-completion rendering to remove the previous numeric element before showing the completion label.
- Gave the label a fixed drawing area and used color changes for the completion pulse; reduced-motion mode disables that animation.
- Corrected Mini's inherited page-width rules to keep the card inside its transparent window.
- Added isolated completion/restart checks for focus and break modes. Timer and statistics rules were unchanged.

修复 Mini 完成提示与最后一秒数字残影重叠的风险，固定文字绘制区域并修正小窗边界，补充两种模式完成与重新开始的回归检查。0.1.1 的后续交付另加入 Intel 测试包，见对应历史 Release。
