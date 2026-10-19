import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  finishIfDue,
  idleRemainingTo,
  resetCurrent,
  snapshot,
  subscribe,
  switchTo,
  toggleRun,
  windowId,
  type TimerMode,
} from "./timerStore";
import { readLang, strings, subscribeLang, weekdayShort, writeLang, type Lang } from "./i18n";

const MODES = {
  focus: { color: "#ff7048" },
  break: { color: "#59b9a5" },
} as const;

type Settings = { focus: number; break: number };

const readLogSync = (): SessionEvent[] => {
  try {
    const raw = JSON.parse(localStorage.getItem("flowglass-log") || "");
    if (Array.isArray(raw)) return raw;
  } catch {
    // ignore
  }
  return [];
};

const DEFAULT_SETTINGS: Settings = { focus: 25, break: 5 };
const SETTINGS_KEY = "flowglass-settings";

const clampMinutes = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value) || min));

const readSettings = (): Settings => {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "");
    return {
      focus: clampMinutes(Number(raw.focus) || 25, 1, 120),
      break: clampMinutes(Number(raw.break) || 5, 1, 60),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

type FocusHistory = Record<string, number>;

// 完整事件日志：每次专注/休息结束（完成或中断）都记录一条，
// 供累计时长精确统计与后续可视化迭代使用。
type SessionEvent = {
  t: number; // 结束时间戳
  mode: TimerMode;
  seconds: number; // 实际投入的秒数
  completed: boolean; // 自然走完 = true；切换/重置中断 = false
};

const LOG_KEY = "flowglass-log";
const HISTORY_KEY = "flowglass-history";

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const readHistory = (): FocusHistory => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
  } catch {
    return {};
  }
};

// 旧版只有按天计数（flowglass-history），无时长：迁移为按当前专注时长补齐的完成事件
const migrateLog = (defaultMinutes: number): SessionEvent[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(LOG_KEY) || "");
    if (Array.isArray(raw)) return raw;
  } catch {
    // fall through to legacy migration
  }
  const history = readHistory();
  return Object.entries(history).flatMap(([key, count]) =>
    Array.from({ length: count }, (_, i) => ({
      t: new Date(`${key}T12:00:00`).getTime() + i,
      mode: "focus" as TimerMode,
      seconds: defaultMinutes * 60,
      completed: true,
    })),
  );
};

const persistLog = (log: SessionEvent[]) => {
  localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-5000)));
};

function GrainCanvas({
  progress,
  running,
  color,
}: {
  progress: number;
  running: boolean;
  color: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<
    Array<{ x: number; y: number; vx: number; vy: number; r: number; a: number }>
  >([]);
  const progressRef = useRef(progress);
  const runningRef = useRef(running);

  useEffect(() => {
    progressRef.current = progress;
    runningRef.current = running;
  }, [progress, running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let lastSpawn = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawSand = (
      width: number,
      height: number,
      elapsed: number,
      grainColor: string,
    ) => {
      const cx = width / 2;
      const top = height * 0.13;
      const neckTop = height * 0.47;
      const neckBottom = height * 0.53;
      const bottom = height * 0.87;
      const side = width * 0.29;
      const p = Math.max(0, Math.min(1, progressRef.current));
      const upperAmount = 1 - p;
      const upperSurfaceY =
        neckTop - (neckTop - top - 10) * Math.sqrt(upperAmount);
      const pileTop =
        bottom - (bottom - neckBottom - 8) * Math.sqrt(p) * 0.72;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - side, top);
      ctx.lineTo(cx + side, top);
      ctx.quadraticCurveTo(cx + side * 0.83, top + height * 0.2, cx + 7, neckTop);
      ctx.lineTo(cx + 7, neckBottom);
      ctx.quadraticCurveTo(
        cx + side * 0.83,
        bottom - height * 0.2,
        cx + side,
        bottom,
      );
      ctx.lineTo(cx - side, bottom);
      ctx.quadraticCurveTo(
        cx - side * 0.83,
        bottom - height * 0.2,
        cx - 7,
        neckBottom,
      );
      ctx.lineTo(cx - 7, neckTop);
      ctx.quadraticCurveTo(cx - side * 0.83, top + height * 0.2, cx - side, top);
      ctx.clip();

      // Sand softly illuminates the glass around whichever chamber holds it.
      ctx.globalCompositeOperation = "screen";
      const upperGlow = ctx.createRadialGradient(
        cx,
        upperSurfaceY,
        2,
        cx,
        upperSurfaceY,
        side * (0.42 + upperAmount * 0.48),
      );
      upperGlow.addColorStop(0, `${grainColor}${Math.round(70 + upperAmount * 45).toString(16)}`);
      upperGlow.addColorStop(0.5, `${grainColor}24`);
      upperGlow.addColorStop(1, `${grainColor}00`);
      ctx.fillStyle = upperGlow;
      ctx.fillRect(cx - side, top, side * 2, neckTop - top);

      if (p > 0.002) {
        const lowerGlow = ctx.createRadialGradient(
          cx,
          pileTop + 8,
          1,
          cx,
          pileTop + 8,
          side * (0.45 + p * 0.55),
        );
        lowerGlow.addColorStop(0, `${grainColor}${Math.round(55 + p * 65).toString(16)}`);
        lowerGlow.addColorStop(0.55, `${grainColor}24`);
        lowerGlow.addColorStop(1, `${grainColor}00`);
        ctx.fillStyle = lowerGlow;
        ctx.fillRect(cx - side, neckBottom, side * 2, bottom - neckBottom);
      }
      ctx.globalCompositeOperation = "source-over";

      const gradient = ctx.createLinearGradient(cx - side, 0, cx + side, 0);
      gradient.addColorStop(0, `${grainColor}b8`);
      gradient.addColorStop(0.45, grainColor);
      gradient.addColorStop(1, `${grainColor}a8`);
      ctx.fillStyle = gradient;

      if (p < 0.998) {
        const upperHeight = (neckTop - top - 10) * Math.sqrt(upperAmount);
        const surfaceY = neckTop - upperHeight;
        const surfaceHalf = 8 + (side - 12) * (upperHeight / (neckTop - top));
        ctx.beginPath();
        ctx.moveTo(cx - surfaceHalf, surfaceY);
        ctx.quadraticCurveTo(cx, surfaceY + 3, cx + surfaceHalf, surfaceY);
        ctx.lineTo(cx + 8, neckTop + 2);
        ctx.lineTo(cx - 8, neckTop + 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 236, 205, 0.68)";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(cx - surfaceHalf * 0.82, surfaceY + 0.5);
        ctx.quadraticCurveTo(cx, surfaceY + 3.5, cx + surfaceHalf * 0.7, surfaceY + 0.7);
        ctx.stroke();
      }

      if (p > 0.002) {
        const pileHeight = (bottom - neckBottom - 8) * Math.sqrt(p) * 0.72;
        const spread = Math.min(side - 4, 24 + pileHeight * 0.7);
        ctx.beginPath();
        ctx.moveTo(cx - side, bottom + 2);
        ctx.lineTo(cx + side, bottom + 2);
        ctx.lineTo(cx + spread, bottom - pileHeight * 0.2);
        ctx.quadraticCurveTo(
          cx + pileHeight * 0.3,
          bottom - pileHeight * 0.62,
          cx,
          bottom - pileHeight,
        );
        ctx.quadraticCurveTo(
          cx - pileHeight * 0.3,
          bottom - pileHeight * 0.62,
          cx - spread,
          bottom - pileHeight * 0.2,
        );
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 236, 205, 0.56)";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(cx - spread * 0.72, bottom - pileHeight * 0.28);
        ctx.quadraticCurveTo(cx, bottom - pileHeight - 1, cx + spread * 0.68, bottom - pileHeight * 0.3);
        ctx.stroke();
      }

      if (runningRef.current && p < 0.998 && elapsed - lastSpawn > 24) {
        lastSpawn = elapsed;
        for (let i = 0; i < 2; i += 1) {
          particlesRef.current.push({
            x: cx + (Math.random() - 0.5) * 5,
            y: neckTop - 5,
            vx: (Math.random() - 0.5) * 0.15,
            vy: 0.5 + Math.random() * 0.45,
            r: 0.7 + Math.random() * 1.25,
            a: 0.65 + Math.random() * 0.35,
          });
        }
      }

      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.vy += 0.035;
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.y > pileTop + Math.abs(particle.x - cx) * 0.8) return false;
        ctx.globalAlpha = particle.a;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
        return particle.y < bottom;
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = "rgba(119, 91, 70, 0.24)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cx - side, top);
      ctx.bezierCurveTo(
        cx - side * 0.96,
        top + height * 0.17,
        cx - side * 0.32,
        neckTop - height * 0.08,
        cx - 7,
        neckTop,
      );
      ctx.lineTo(cx - 7, neckBottom);
      ctx.bezierCurveTo(
        cx - side * 0.32,
        neckBottom + height * 0.08,
        cx - side * 0.96,
        bottom - height * 0.17,
        cx - side,
        bottom,
      );
      ctx.moveTo(cx + side, top);
      ctx.bezierCurveTo(
        cx + side * 0.96,
        top + height * 0.17,
        cx + side * 0.32,
        neckTop - height * 0.08,
        cx + 7,
        neckTop,
      );
      ctx.lineTo(cx + 7, neckBottom);
      ctx.bezierCurveTo(
        cx + side * 0.32,
        neckBottom + height * 0.08,
        cx + side * 0.96,
        bottom - height * 0.17,
        cx + side,
        bottom,
      );
      ctx.stroke();

      const glassShade = ctx.createLinearGradient(cx - side, 0, cx + side, 0);
      glassShade.addColorStop(0, "rgba(92, 73, 57, 0.08)");
      glassShade.addColorStop(0.18, "rgba(255, 255, 255, 0.12)");
      glassShade.addColorStop(0.72, "rgba(255, 255, 255, 0)");
      glassShade.addColorStop(1, "rgba(92, 73, 57, 0.1)");
      ctx.fillStyle = glassShade;
      ctx.globalCompositeOperation = "multiply";
      ctx.beginPath();
      ctx.ellipse(cx, bottom - 3, side * 0.78, 4 + p * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      const shine = ctx.createLinearGradient(cx - side, 0, cx + side, 0);
      shine.addColorStop(0, "rgba(255,255,255,0)");
      shine.addColorStop(0.24, "rgba(255,255,255,0.62)");
      shine.addColorStop(0.37, "rgba(255,255,255,0)");
      ctx.strokeStyle = shine;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx - side + 14, top + 14);
      ctx.quadraticCurveTo(cx - side * 0.54, top + height * 0.18, cx - 18, neckTop - 16);
      ctx.stroke();
      ctx.restore();
    };

    const render = (elapsed: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) resize();
      ctx.clearRect(0, 0, rect.width, rect.height);
      drawSand(rect.width, rect.height, elapsed, color);
      frame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [color]);

  return <canvas ref={canvasRef} className="grain-canvas" aria-hidden="true" />;
}

function PlayIcon({ paused = false }: { paused?: boolean }) {
  return paused ? (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 4.5v11M14 4.5v11" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m7 4.8 8 5.2-8 5.2Z" />
    </svg>
  );
}

export default function App() {
  const [live, setLive] = useState(snapshot);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [log, setLog] = useState<SessionEvent[]>(() => migrateLog(readSettings().focus));
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<Settings>(settings);
  const [draftLang, setDraftLang] = useState<Lang>(readLang);
  const [lang, setLang] = useState<Lang>(readLang);
  const s = strings(lang);
  const mode = live.mode;
  const running = live.running;
  const secondsLeft = live.finished ? 0 : Math.ceil(live.secondsLeft);
  const duration = live.durationMs / 1000;
  const progress = 1 - secondsLeft / duration;
  const today = dateKey(new Date());
  const completedOn = (key: string) =>
    log.filter((e) => e.seconds > 0 && e.mode === "focus" && dateKey(new Date(e.t)) === key).length;
  const focusSecondsOn = (key: string) =>
    log
      .filter((e) => e.mode === "focus" && dateKey(new Date(e.t)) === key)
      .reduce((sum, e) => sum + e.seconds, 0);
  const sessions = completedOn(today);

  const recentDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));
        return {
          key: dateKey(date),
          day: weekdayShort(date, lang),
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          count: completedOn(dateKey(date)),
          minutes: Math.round(focusSecondsOn(dateKey(date)) / 60),
          isToday: index === 6,
        };
      }),
    [log, lang],
  );
  const weekSessions = recentDays.reduce((sum, day) => sum + day.count, 0);
  const weekMinutes = recentDays.reduce((sum, day) => sum + day.minutes, 0);
  const activeDays = recentDays.filter((day) => day.count > 0).length;
  const maxSessions = Math.max(1, ...recentDays.map((day) => day.count));

  // 跨窗口共享计时：订阅变化 + 周期刷新（由绝对时间戳推导，主/挂件永远一致）
  useEffect(
    () =>
      subscribe(() => {
        setLive(snapshot());
        setLog(readLogSync());
      }),
    [],
  );

  // 语言：主面板保存后，两窗口同步切换显示语言
  useEffect(() => subscribeLang(() => setLang(readLang())), []);
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = snapshot();
      finishIfDue();
      setLive(snapshot());
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const chooseMode = (nextMode: TimerMode) => {
    if (nextMode === live.mode) {
      toggleRun();
      return;
    }
    switchTo(nextMode);
  };

  const openSettings = () => {
    setDraft(settings);
    setDraftLang(lang);
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    const next = {
      focus: clampMinutes(draft.focus, 1, 120),
      break: clampMinutes(draft.break, 1, 60),
    };
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    idleRemainingTo(next[mode] * 60000);
    writeLang(draftLang);
    setSettingsOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === ",") {
        event.preventDefault();
        setSettingsOpen((open) => {
          if (!open) setDraft(settings);
          return !open;
        });
      }
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settings]);

  const reset = () => {
    resetCurrent();
  };

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  const [scale, setScale] = useState(() => Math.min(window.innerWidth / 860, window.innerHeight / 540));
  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / 860, window.innerHeight / 540));
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div className="scaled-stage" style={{ width: 860 * scale, height: 540 * scale }}>
    <div className="design-stage" style={{ transform: `scale(${scale})` }}>
    <main
      className="app-shell"
      style={
        {
          "--sand-color": MODES[mode].color,
          "--sand-progress": progress,
          "--sand-remain": 1 - progress,
        } as CSSProperties
      }
    >
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          <span />
        </div>
        <div>
          <h1>Flowglass</h1>
          <p>{s.subtitle}</p>
        </div>
        <button
          className={`settings-entry ${settingsOpen ? "active" : ""}`}
          onClick={() => (settingsOpen ? setSettingsOpen(false) : openSettings())}
          aria-label={s.openSettings}
          title={s.settingsTitle}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 6h7M13.5 6H17M3 14h3.5M10 14h7" />
            <circle cx="11.5" cy="6" r="2" />
            <circle cx="8" cy="14" r="2" />
          </svg>
        </button>
      </header>

      {historyOpen ? (
        <section className="history-page">
          <div className="history-heading">
            <div>
              <span className="section-kicker">{s.focusArchive}</span>
              <h2>{s.historyTitle}</h2>
              <p>{s.historySubtitle}</p>
            </div>
            <button
              className="history-close"
              onClick={() => setHistoryOpen(false)}
              aria-label={s.backToTimer}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m12.5 5-5 5 5 5" />
              </svg>
              {s.back}
            </button>
          </div>

          <div className="history-summary">
            <div>
              <span>{s.weekFocus}</span>
              <strong>{weekSessions}<small> {s.roundsUnit}</small></strong>
            </div>
            <div>
              <span>{s.totalMinutes}</span>
              <strong>{weekMinutes}<small> {s.minutesUnit}</small></strong>
            </div>
            <div>
              <span>{s.activeDays}</span>
              <strong>{activeDays}<small> {s.ofSevenDays}</small></strong>
            </div>
          </div>

          <div className="history-chart">
            <div className="chart-topline">
              <span>{s.dailyRounds}</span>
              <span className="chart-legend"><i /> {s.legendIncludesEarly}</span>
            </div>
            <div className="bars">
              {recentDays.map((day) => (
                <div className={`bar-column ${day.isToday ? "today" : ""}`} key={day.key}>
                  <div className="bar-value">{day.count || ""}</div>
                  <div className="bar-track">
                    <span
                      style={{
                        height: day.count
                          ? `${Math.max(14, (day.count / maxSessions) * 100)}%`
                          : "3px",
                      }}
                    />
                  </div>
                  <strong>{day.day}</strong>
                  <small>{day.date}</small>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="workspace">
          <div className="ambient ambient-one" />
          <div className="ambient ambient-two" />

          <div className={`hourglass-wrap ${running ? "is-running" : ""}`}>
            <div className="hourglass-shadow" />
            <div className="sand-aura" />
            <div className="wood wood-top">
              <span className="wood-shine" />
            </div>
            <div className="hourglass-body">
              <GrainCanvas
                progress={progress}
                running={running}
                color={MODES[mode].color}
              />
            </div>
            <div className="wood wood-bottom">
              <span className="wood-shine" />
            </div>
          </div>

          <div className="timer-panel">
            <div className="mode-status">
              <span style={{ backgroundColor: MODES[mode].color }} />
              {mode === "focus" ? `${s.focusLabel}${s.timeSuffix}` : `${s.breakLabel}${s.timeSuffix}`}
            </div>
            <div className="time" aria-live="polite">
              <span>{minutes}</span>
              <b>:</b>
              <span>{seconds}</span>
            </div>
            <p className="hint">
              {running
                ? mode === "focus"
                  ? s.runningFocusHint
                  : s.runningBreakHint
                : secondsLeft === 0
                  ? s.finishedHint
                  : s.readyHint}
            </p>

            <div className="actions">
              <button
                className={`action focus-action ${mode === "focus" ? "active" : ""}`}
                onClick={() => chooseMode("focus")}
              >
                <span className="action-icon"><PlayIcon paused={mode === "focus" && running} /></span>
                <span><strong>{mode === "focus" && running ? s.pauseFocus : s.startFocus}</strong><small>{settings.focus} {s.minutesSmall}</small></span>
              </button>
              <button
                className={`action break-action ${mode === "break" ? "active" : ""}`}
                onClick={() => chooseMode("break")}
              >
                <span className="action-icon"><PlayIcon paused={mode === "break" && running} /></span>
                <span><strong>{mode === "break" && running ? s.pauseBreak : s.startBreak}</strong><small>{settings.break} {s.minutesSmall}</small></span>
              </button>
            </div>

            <button className="reset-button" onClick={reset} aria-label={s.resetAria}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M15.7 7.1A6 6 0 1 0 16 12M15.7 3.8v3.6h-3.6" />
              </svg>
              {s.resetTimer}
            </button>
            <div className="widget-hint">
              <span className="hint-title">{s.widgetTitle}</span>
              <div className="hint-groups">
                <div className="hint-group"><i>{s.hintClick}</i><small>{s.hintClickDesc}</small></div>
                <div className="hint-group"><i>{s.hintDouble}</i><small>{s.hintDoubleDesc}</small></div>
                <div className="hint-group"><i>{s.hintDrag}</i><small>{s.hintDragDesc}</small></div>
                <div className="hint-group"><i>{s.hintMenu}</i><small>{s.hintMenuDesc}</small></div>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className={historyOpen ? "history-footer" : undefined}>
        <span>{s.focusRounds}</span>
        <div className="session-dots" aria-label={s.todayRoundsAria(sessions)}>
          {[0, 1, 2, 3].map((index) => (
            <i key={index} className={index < sessions ? "filled" : ""} />
          ))}
        </div>
        <strong>{s.roundsCount(sessions)}</strong>
        <button
          className={`history-entry ${historyOpen ? "active" : ""}`}
          onClick={() => setHistoryOpen((value) => !value)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 15V9m4 6V5m4 10v-3m4 3V7" />
          </svg>
          {historyOpen ? s.back : s.history}
        </button>
      </footer>

      {settingsOpen ? (
        <div
          className="settings-mask"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSettingsOpen(false);
          }}
        >
          <section className="settings-sheet" aria-label={s.settings}>
            <header>
              <div>
                <span className="section-kicker">{s.preferences}</span>
                <h2>{s.settings}</h2>
              </div>
              <button
                className="history-close"
                onClick={() => setSettingsOpen(false)}
                aria-label={s.closeSettingsAria}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="m12.5 5-5 5 5 5" />
                </svg>
                {s.close}
              </button>
            </header>

            <div className="settings-field">
              <label>
                <i style={{ background: MODES.focus.color }} />
                {s.focusLength}
              </label>
              <div className="stepper">
                <button onClick={() => setDraft({ ...draft, focus: clampMinutes(draft.focus - 5, 1, 120) })} aria-label={s.decreaseFocus}>−5</button>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={draft.focus}
                  onChange={(event) => setDraft({ ...draft, focus: +event.target.value })}
                />
                <button onClick={() => setDraft({ ...draft, focus: clampMinutes(draft.focus + 5, 1, 120) })} aria-label={s.increaseFocus}>+5</button>
              </div>
              <small>{s.rangeFocus}</small>
            </div>

            <div className="settings-field">
              <label>
                <i style={{ background: MODES.break.color }} />
                {s.breakLength}
              </label>
              <div className="stepper">
                <button onClick={() => setDraft({ ...draft, break: clampMinutes(draft.break - 1, 1, 60) })} aria-label={s.decreaseBreak}>−1</button>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={draft.break}
                  onChange={(event) => setDraft({ ...draft, break: +event.target.value })}
                />
                <button onClick={() => setDraft({ ...draft, break: clampMinutes(draft.break + 1, 1, 60) })} aria-label={s.increaseBreak}>+1</button>
              </div>
              <small>{s.rangeBreak}</small>
            </div>

            <div className="settings-field">
              <label>
                <i className="lang-dot" />
                {s.language}
              </label>
              <div className="lang-seg" role="radiogroup" aria-label={s.language}>
                {(["zh", "en"] as Lang[]).map((code) => (
                  <button
                    key={code}
                    role="radio"
                    aria-checked={draftLang === code}
                    className={draftLang === code ? "active" : ""}
                    onClick={() => setDraftLang(code)}
                  >
                    {code === "zh" ? "中文" : "English"}
                  </button>
                ))}
              </div>
              <small>中文 / English</small>
            </div>

            <div className="sheet-footer">
              <button className="ghost" onClick={() => setSettingsOpen(false)}>{s.cancel}</button>
              <button className="primary" onClick={saveSettings}>{s.save}</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
    </div>
    </div>
  );
}
