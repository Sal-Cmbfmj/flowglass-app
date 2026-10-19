# Contributing

Thanks for trying Flowglass. A clear bug report or a small, well-tested improvement is welcome.

## Report a problem

Check [known issues](KNOWN-ISSUES.md), then [open an issue](https://github.com/Sal-Cmbfmj/flowglass-app/issues/new/choose). Include:

- App version and the package you downloaded.
- Operating system, processor, display scaling and monitor setup if relevant.
- Steps to reproduce, what you expected, and what happened.
- A screenshot or short recording when it helps. Remove private information first.

For Windows Mini problems, `%TEMP%\flowglass-widget.log` may help; inspect it before attaching it. Do not upload personal timer records, credentials or unrelated system logs.

## Propose a change

Start from the current `main`, check for existing work, and keep each change focused. Explain the behavior before and after, and any compatibility tradeoff. For a new feature or a change to timer/statistics rules, discuss the intended behavior before implementing it.

Run the checks in the [developer guide](DEVELOPMENT.md). Changes to timer rules must cover both windows; gesture changes must show that closing a menu does not accidentally start or switch a timer. For completion rendering, check the last second, the completion label and restarting in both focus and break modes.

A native change also needs the corresponding platform build and, where available, native behavior checks. Describe what you could not test. An isolated test passing is not a claim of installation or hardware compatibility.

## Keep the public repository useful

Commit source, documentation and relevant test fixtures. Keep conversation transcripts, private paths, credentials, local app data, build output and personal screenshots out of commits. Check the staged diff before submitting.

The requirements folder is a frozen 0.1.1 baseline. Preserve its historical meaning; describe newer behavior in the changelog and current documentation instead of silently changing old acceptance evidence.

## 中文说明

欢迎提交清晰的反馈或范围明确的小改进。反馈时附版本、系统、芯片、缩放与复现步骤；截图和诊断日志分享前请去掉私人信息。

修改从当前 `main` 开始。先说明行为变化，再附检查结果及未测范围。计时改动要覆盖两窗口，手势改动要确认关闭菜单不会误启动；原生改动需要对应平台构建与可获得的实机验证。提交前检查 diff，不提交对话、凭据、个人数据或安装产物。
