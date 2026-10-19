# Known issues · 已知问题

Applies to **0.2.1**, reviewed on 2026-10-19. These notes describe the current build; listing an issue here does not mean it has been fixed.

| Issue | What you may notice | Workaround |
| --- | --- | --- |
| Language draft after canceling | Choose another language, cancel, then reopen Settings with ⌘, / Ctrl+, and save: the canceled language selection may be applied. | Reopen Settings with the on-screen settings button and check the language before saving. |
| Settings panel height | With the language selector added, the bottom of the panel extends beyond its initial visible area. Save remains clickable in the reviewed default layout. | Scroll inside the Settings overlay to see the complete panel. |
| Small secondary text | History dates and Mini gesture descriptions can be hard to read. | Enlarge the main window if useful; some labels still need a future typography adjustment. |
| Partial Windows localization | The tray menu uses Chinese labels; the settings tooltip shows a Mac shortcut even on Windows. | Use Ctrl+, on Windows. Tray labels: 显示主面板 = show main window; 显示 Mini = show Mini; 退出 Flowglass = quit. |

Windows Mini recovery still needs testing on more display setups. The existing “show Mini” action shows a hidden window but does not explicitly move an off-screen window back into the current display area. If this happens, report the monitor layout and scaling; reconnecting the previous display may let you move Mini back.

## Testing boundaries

Type checks, isolated timer/menu/language regressions and browser layout checks have been run. Those checks do not replace native installation, tray, drag, focus, multi-monitor or display-scaling tests. The Windows release is an experimental macOS cross-build. A complete Intel Mac / Windows compatibility matrix and minimum verified OS versions are not yet available.

Sleep and quitting do not pause a running timer. There are no sound alerts, system notifications, automatic cycles, cloud sync or export. These are current product boundaries, rather than unexpected failures.

## 中文说明

0.2.1 已知问题：

- **取消的语言草稿可能被重新应用**：选择另一种语言后取消，再用快捷键打开设置并保存，会应用旧草稿。临时用界面上的设置按钮重新打开，并确认语言后保存。
- **设置面板底部需要滚动查看**：加入语言选项后，弹窗初始显示不完整。已检查的默认布局中保存仍可点击，可在遮罩内滚动查看完整面板。
- **辅助文字偏小**：历史日期和手势说明还需要局部调整字号；放大主窗口可暂时改善。
- **Windows 的翻译不完整**：托盘仍是中文，设置提示仍写 Mac 快捷键。Windows 实际可用 Ctrl+,。
- **Mini 屏幕外恢复待完善**：托盘可以显示隐藏窗口，但没有明确将现存屏幕外窗口移回当前工作区的处理。多屏变化后若找不到 Mini，请反馈显示器布局和缩放；重新连接原显示器可能便于移回。

以上问题尚未在此版本修复。计时与菜单回归、浏览器检查通过不代表所有原生设备已验收；Intel 和 Windows 仍需要更多安装、拖动、托盘、缩放与跨屏测试。
