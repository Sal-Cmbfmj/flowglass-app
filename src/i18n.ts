// 界面文案（中/英）。语言仅影响显示字符串与日期/星期格式，
// 不触碰计时、统计与设置数值规则；真值仍由 timerStore 管理。
export type Lang = "zh" | "en";

const LANG_KEY = "flowglass-lang";

export const readLang = (): Lang => {
  try {
    const raw = JSON.parse(localStorage.getItem(LANG_KEY) || '""');
    if (raw === "en") return "en";
  } catch {
    // fall through
  }
  return "zh";
};

export const writeLang = (lang: Lang) => {
  localStorage.setItem(LANG_KEY, JSON.stringify(lang));
  // 与 timerStore 相同的广播模式：storage 事件只通知其他窗口，同窗口手动广播
  window.dispatchEvent(new Event("flowglass-lang"));
};

export const subscribeLang = (onChange: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === LANG_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("flowglass-lang", onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("flowglass-lang", onChange);
  };
};

const zh = {
  subtitle: "专注于此刻",
  openSettings: "打开设置",
  settingsTitle: "设置 (⌘,)",
  backToTimer: "返回计时器",
  back: "返回",
  focusArchive: "FOCUS ARCHIVE",
  historyTitle: "专注记录",
  historySubtitle: "每一次沉淀，都让时间变得清晰。",
  weekFocus: "近 7 天专注",
  roundsUnit: "轮",
  totalMinutes: "累计时长",
  minutesUnit: "分钟",
  activeDays: "活跃天数",
  ofSevenDays: "/ 7 天",
  dailyRounds: "每日专注轮数",
  legendIncludesEarly: "含提前结束的轮次",
  focusLabel: "专注",
  breakLabel: "休息",
  timeSuffix: "时间",
  runningFocusHint: "让思绪沉淀，保持你的节奏",
  runningBreakHint: "放松一下，让精力慢慢恢复",
  finishedHint: "这一轮已经完成",
  readyHint: "准备好后，开始这一轮",
  startFocus: "开始专注",
  pauseFocus: "暂停专注",
  startBreak: "开始休息",
  pauseBreak: "暂停休息",
  minutesSmall: "分钟",
  resetTimer: "重置当前计时",
  resetAria: "重置计时器",
  widgetTitle: "桌面挂件",
  hintClick: "单击",
  hintClickDesc: "开始 / 暂停",
  hintDouble: "双击",
  hintDoubleDesc: "切换专注 / 休息",
  hintDrag: "拖动",
  hintDragDesc: "移动位置",
  hintMenu: "右键",
  hintMenuDesc: "更多选项",
  focusRounds: "专注轮数",
  todayRoundsAria: (n: number): string => `今日已记录 ${n} 轮专注`,
  roundsCount: (n: number): string => `${n} 轮`,
  history: "历史",
  preferences: "PREFERENCES",
  settings: "设置",
  close: "关闭",
  closeSettingsAria: "关闭设置",
  focusLength: "专注时长",
  breakLength: "休息时长",
  rangeFocus: "1 – 120 分钟",
  rangeBreak: "1 – 60 分钟",
  decreaseFocus: "减少专注时长",
  increaseFocus: "增加专注时长",
  decreaseBreak: "减少休息时长",
  increaseBreak: "增加休息时长",
  language: "语言",
  cancel: "取消",
  save: "保存",
  finished: "完成",
  switchToFocus: "切换到专注",
  switchToBreak: "切换到休息",
  resume: "继续",
  pause: "暂停",
  start: "开始",
  switchToBreakMenu: "切换到休息",
  switchToFocusMenu: "切换到专注",
};

export type Strings = typeof zh;

const en: Strings = {
  subtitle: "Focus on this moment",
  openSettings: "Open settings",
  settingsTitle: "Settings (⌘,)",
  backToTimer: "Back to timer",
  back: "Back",
  focusArchive: "FOCUS ARCHIVE",
  historyTitle: "Focus Log",
  historySubtitle: "Every focused moment brings time into view.",
  weekFocus: "Focus · last 7 days",
  roundsUnit: "rounds",
  totalMinutes: "Total time",
  minutesUnit: "min",
  activeDays: "Active days",
  ofSevenDays: "of 7",
  dailyRounds: "Focus rounds per day",
  legendIncludesEarly: "Includes rounds ended early",
  focusLabel: "Focus",
  breakLabel: "Break",
  timeSuffix: " time",
  runningFocusHint: "Let your thoughts settle; keep your rhythm.",
  runningBreakHint: "Ease off and let your energy return.",
  finishedHint: "This round is complete.",
  readyHint: "Start this round whenever you're ready.",
  startFocus: "Start Focus",
  pauseFocus: "Pause Focus",
  startBreak: "Start Break",
  pauseBreak: "Pause Break",
  minutesSmall: "min",
  resetTimer: "Reset Current Timer",
  resetAria: "Reset timer",
  widgetTitle: "Widget",
  hintClick: "Click",
  hintClickDesc: "Start / Pause",
  hintDouble: "Double-click",
  hintDoubleDesc: "Switch Mode",
  hintDrag: "Drag",
  hintDragDesc: "Move",
  hintMenu: "Right-click",
  hintMenuDesc: "Options",
  focusRounds: "Focus Rounds",
  todayRoundsAria: (n: number) => `${n} focus round${n === 1 ? "" : "s"} completed today`,
  roundsCount: (n: number) => `${n} round${n === 1 ? "" : "s"}`,
  history: "History",
  preferences: "PREFERENCES",
  settings: "Settings",
  close: "Close",
  closeSettingsAria: "Close settings",
  focusLength: "Focus Length",
  breakLength: "Break Length",
  rangeFocus: "1 – 120 min",
  rangeBreak: "1 – 60 min",
  decreaseFocus: "Decrease focus length",
  increaseFocus: "Increase focus length",
  decreaseBreak: "Decrease break length",
  increaseBreak: "Increase break length",
  language: "Language",
  cancel: "Cancel",
  save: "Save",
  finished: "Done",
  switchToFocus: "Switch to Focus",
  switchToBreak: "Switch to Break",
  resume: "Resume",
  pause: "Pause",
  start: "Start",
  switchToBreakMenu: "Switch to Break",
  switchToFocusMenu: "Switch to Focus",
};

const DICT: Record<Lang, Strings> = { zh, en };

export const strings = (lang: Lang): Strings => DICT[lang];

// 星期标签：中文取「一/二/…」，英文取 Mon/Tue/…
export const weekdayShort = (date: Date, lang: Lang) =>
  date
    .toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { weekday: "short" })
    .replace("周", "")
    .replace("星期", "");
