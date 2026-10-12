// 跨窗口共享的计时状态（主面板 + Mini 挂件共用一个真值来源）。
// 核心思路：localStorage 存「绝对时间戳」，各窗口只读并按本地时钟推导剩余时间，
// 从根本上避免两个窗口各自倒计时导致的状态打架。
export type TimerMode = "focus" | "break";

export type LiveState = {
  mode: TimerMode;
  running: boolean;
  endAt: number; // 运行中的结束时间戳（epoch ms）
  remainingMs: number; // 非运行态的剩余毫秒
  durationMs: number; // 本轮冻结时长，设置只影响下一轮
  started: boolean;
  finished: boolean;
  owner: string; // 最后一次操作发起的窗口，负责结算（写日志）
};

export type SessionEvent = {
  t: number;
  mode: TimerMode;
  seconds: number;
  completed: boolean;
};

const KEY = "flowglass-live";
const SETTINGS_KEY = "flowglass-settings";
const LOG_KEY = "flowglass-log";

export const windowId = window.location.pathname.endsWith("widget.html") ? "widget" : "main";

export const readSettings = (): { focus: number; break: number } => {
  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Math.round(v) || min));
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "");
    return {
      focus: clamp(Number(raw.focus) || 25, 1, 120),
      break: clamp(Number(raw.break) || 5, 1, 60),
    };
  } catch {
    return { focus: 25, break: 5 };
  }
};

export const appendEvent = (event: SessionEvent) => {
  try {
    const log = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    log.push(event);
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-5000)));
    window.dispatchEvent(new Event("flowglass-log"));
  } catch {
    localStorage.setItem(LOG_KEY, JSON.stringify([event]));
  }
};

const read = (): LiveState => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "");
    if (raw && (raw.mode === "focus" || raw.mode === "break")) {
      const durationMs = Number.isFinite(raw.durationMs) && raw.durationMs > 0
        ? raw.durationMs : Math.max(readSettings()[raw.mode as TimerMode] * 60000, raw.remainingMs || 0);
      return { ...raw, durationMs, started: raw.started ?? (raw.running || raw.finished || raw.remainingMs < durationMs) };
    }
  } catch {
    // fall through
  }
  return {
    mode: "focus",
    running: false,
    endAt: 0,
    remainingMs: readSettings().focus * 60000,
    durationMs: readSettings().focus * 60000,
    started: false,
    finished: false,
    owner: "main",
  };
};

const write = (state: LiveState) => {
  localStorage.setItem(KEY, JSON.stringify(state));
  // storage 事件只在「其他」窗口触发，同窗口手动广播一次
  window.dispatchEvent(new Event("flowglass-live"));
};

export const subscribe = (onChange: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === LOG_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("flowglass-live", onChange);
  window.addEventListener("flowglass-log", onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("flowglass-live", onChange);
    window.removeEventListener("flowglass-log", onChange);
  };
};

// 推导当前快照：任何窗口任何时刻都能算出一致的剩余秒数
export const snapshot = () => {
  const state = read();
  const secondsLeft = state.running
    ? Math.max(0, (state.endAt - Date.now()) / 1000)
    : state.finished
      ? 0
      : state.remainingMs / 1000;
  return { ...state, secondsLeft };
};

const logInterruption = (state: LiveState) => {
  if (state.finished || !state.started) return;
  const remaining = state.running ? Math.max(0, state.endAt - Date.now()) : state.remainingMs;
  const elapsed = Math.min(state.durationMs, Math.max(0, state.durationMs - remaining));
  if (elapsed > 0) appendEvent({ t: Date.now(), mode: state.mode, seconds: elapsed / 1000, completed: remaining <= 0 });
};

export const toggleRun = () => {
  finishIfDue();
  const state = read();
  if (state.running) {
    write({
      ...state,
      running: false,
      remainingMs: Math.max(0, state.endAt - Date.now()),
      owner: windowId,
    });
    return;
  }
  const settings = readSettings();
  const remainingMs =
    state.finished || state.remainingMs <= 0 ? settings[state.mode] * 60000 : state.remainingMs;
  write({ ...state, durationMs: state.finished || state.remainingMs <= 0 ? remainingMs : state.durationMs, started: true, running: true, endAt: Date.now() + remainingMs, remainingMs, finished: false, owner: windowId });
};

export const switchTo = (mode: TimerMode, options: { start?: boolean } = {}) => {
  const state = read();
  logInterruption(state);
  const ms = readSettings()[mode] * 60000;
  const running = options.start ?? true;
  write({ mode, running, durationMs: ms, started: running, endAt: running ? Date.now() + ms : 0, remainingMs: ms, finished: false, owner: windowId });
};

export const resetCurrent = () => {
  const state = read();
  logInterruption(state);
  const ms = readSettings()[state.mode] * 60000;
  write({ ...state, running: false, endAt: 0, durationMs: ms, started: false, remainingMs: ms, finished: false, owner: windowId });
};

// 空闲态下把剩余时长对齐到新设置（改设置后下一轮生效）
export const idleRemainingTo = (ms: number) => {
  const state = read();
  if (state.running || state.finished || state.started) return;
  write({ ...state, durationMs: ms, remainingMs: ms, owner: windowId });
};

// MVP：存活窗口均可补结算；每次重读已完成态，常规串行操作不会重复。极限并发暂不处理。
export const finishIfDue = () => {
  const state = read();
  if (!state.running || state.endAt > Date.now()) return false;
  write({ ...state, running: false, remainingMs: 0, finished: true, owner: windowId });
  appendEvent({ t: Date.now(), mode: state.mode, seconds: state.durationMs / 1000, completed: true });
  return true;
};
