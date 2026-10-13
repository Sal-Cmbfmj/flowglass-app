import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import {
  finishIfDue,
  readSettings,
  resetCurrent,
  snapshot,
  subscribe,
  switchTo,
  toggleRun,
  windowId,
  type TimerMode,
} from "./timerStore";
import "./index.css";

const COLORS: Record<TimerMode, string> = { focus: "#ff7048", break: "#59b9a5" };

/* ---------- 扁平几何沙漏（SVG + 渐变厚度感 + 沙粒下落） ---------- */
function MiniHourglass({
  progress,
  mode,
  running,
}: {
  progress: number;
  mode: TimerMode;
  running: boolean;
}) {
  const color = COLORS[mode];
  const p = Math.max(0, Math.min(1, progress));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ progress: p, running, color });
  stateRef.current = { progress: p, running, color };

  // 上室沙面
  const upperAmount = 1 - p;
  const surfaceY = 70 - 46 * upperAmount;
  const hwTop = 25 - 21 * ((surfaceY - 22) / 48);
  // 下室沙堆
  const pileH = 44 * p;
  const baseHalf = 25;
  const pileHalf = Math.max(4 + 21 * ((118 - pileH - 70) / 48), 8);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let lastSpawn = 0;
    let grains: Array<{ x: number; y: number; vy: number }> = [];

    const loop = (t: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) {
        raf = requestAnimationFrame(loop);
        return;
      }
      if (canvas.width !== Math.round(rect.width * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      const scale = rect.width / 100;
      const { progress: cp, running: cr, color: cc } = stateRef.current;
      const landY = (118 - 44 * cp) * scale;

      if (cr && cp < 0.998 && t - lastSpawn > 90) {
        lastSpawn = t;
        grains.push({ x: 50 + (Math.random() - 0.5) * 2.4, y: 70, vy: 10 });
      }
      grains = grains.filter((g) => {
        g.vy += 260 * 0.016;
        g.y += g.vy * 0.016;
        g.x += Math.sin(g.y * 0.35) * 0.06;
        if (g.y >= landY / scale) return false;
        ctx.fillStyle = cc;
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.arc(g.x * scale, g.y * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(g.x * scale, (g.y - g.vy * 0.02) * scale, 1.1 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="hg-holder">
      <svg viewBox="0 0 100 140" className="mini-hg" aria-hidden="true">
        <defs>
          <linearGradient id="glassEdge" x1="0" x2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="0.5" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="1" stopColor="rgba(120,100,85,0.35)" />
          </linearGradient>
          <linearGradient id="sandGrad" x1="0" x2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.82" />
            <stop offset="0.45" stopColor={color} />
            <stop offset="1" stopColor={color} stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id="woodGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#b98961" />
            <stop offset="1" stopColor="#8d5c39" />
          </linearGradient>
          <radialGradient id="aura" cx="0.5" cy="0.5">
            <stop offset="0" stopColor={color} stopOpacity="0.28" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="50" cy="70" rx="46" ry="44" fill="url(#aura)" />

        <rect x="18" y="8" width="64" height="10" rx="5" fill="url(#woodGrad)" />
        <rect x="18" y="122" width="64" height="10" rx="5" fill="url(#woodGrad)" />

        <path
          d="M25 20 H75 V30 C75 52 57 60 54 70 L54 70 C57 80 75 88 75 110 V120 H25 V110 C25 88 43 80 46 70 L46 70 C43 60 25 52 25 30 Z"
          fill="rgba(255,255,255,0.06)"
          stroke="url(#glassEdge)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        <path d={`M${50 - hwTop} ${surfaceY} L${50 + hwTop} ${surfaceY} L54 69 L46 69 Z`} fill="url(#sandGrad)" />
        <path
          d={`M${50 - baseHalf} 119 L${50 + baseHalf} 119 L${50 + baseHalf} 118
              Q${50 + pileHalf} ${118 - pileH * 0.45} 50 ${118 - pileH}
              Q${50 - pileHalf} ${118 - pileH * 0.45} ${50 - baseHalf} 118 Z`}
          fill="url(#sandGrad)"
        />
        <path
          d="M31 26 C31 44 38 50 41 58"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <canvas ref={canvasRef} className="hg-grains" aria-hidden="true" />
    </div>
  );
}

/* ---------- 挂件 ---------- */
function Widget() {
  const [live, setLive] = useState(snapshot);
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [flips, setFlips] = useState(0);
  const dragRef = useRef<{ x: number; y: number; armed: boolean } | null>(null);

  useEffect(
    () =>
      subscribe(() => {
        setLive(snapshot());
      }),
    [],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = snapshot();
      finishIfDue();
      setLive(snapshot());
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const mode = live.mode;
  const running = live.running;
  const secondsLeft = live.finished ? 0 : Math.ceil(live.secondsLeft);
  const durationSec = live.durationMs / 1000;
  const progress = Math.max(0, Math.min(1, 1 - live.secondsLeft / durationSec));

  // 只有「已经开始且中途停下」才算暂停态（倾斜）；从未开始的空闲态不倾斜
  const paused = !running && !live.finished && live.secondsLeft < durationSec - 0.5;
  const finished = live.finished;

  const doSwitch = (next: TimerMode) => {
    if (next !== mode) {
      switchTo(next, { start: false });
      setFlips((f) => f + 1);
    }
  };

  // 拖动：移动超过阈值时移交给系统窗口拖动；拖动后的 click 要吞掉
  const suppressClickRef = useRef(false);
  const clickTimerRef = useRef<number>(0);
  const clickDelayRef = useRef(550);
  useEffect(() => {
    let active = true;
    import("@tauri-apps/api/core").then(({ invoke }) => invoke<number>("double_click_interval_ms"))
      .then((ms) => { if (active && Number.isFinite(ms)) clickDelayRef.current = Math.max(100, ms) + 50; })
      .catch(() => {}); // Web 预览保留 550ms 回退。
    return () => { active = false; };
  }, []);

  const cancelClick = () => { window.clearTimeout(clickTimerRef.current); clickTimerRef.current = 0; };
  const menuRef = useRef<HTMLDivElement>(null);
  // 菜单关闭手势整个 click/dblclick 序列均被隔离。
  const dismissUntilRef = useRef(0);
  useEffect(() => {
    if (!menuOpen) return;
    cancelClick();
    const dismiss = () => { cancelClick(); dismissUntilRef.current = Date.now() + clickDelayRef.current; setMenuOpen(false); };
    const outside = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      e.preventDefault(); e.stopPropagation(); dragRef.current = null; dismiss();
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    document.addEventListener("pointerdown", outside, true);
    window.addEventListener("keydown", key);
    window.addEventListener("blur", dismiss);
    return () => { document.removeEventListener("pointerdown", outside, true); window.removeEventListener("keydown", key); window.removeEventListener("blur", dismiss); };
  }, [menuOpen]);
  useEffect(() => () => window.clearTimeout(clickTimerRef.current), []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || menuOpen || Date.now() < dismissUntilRef.current) return;
    suppressClickRef.current = false;
    dragRef.current = { x: e.clientX, y: e.clientY, armed: true };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d?.armed && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) {
      cancelClick();
      d.armed = false;
      suppressClickRef.current = true;
      import("@tauri-apps/api/window")
        .then(({ getCurrentWindow }) => getCurrentWindow().startDragging())
        .catch(() => {});
    }
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  // 单击等待 macOS 双击阈值后提交；第二次点击让位给双击切换，
  // 避免双击时先闪一次「暂停/继续」
  const onClickWidget = (e: React.MouseEvent) => {
    if (menuOpen || Date.now() < dismissUntilRef.current) { cancelClick(); return; }
    // 浏览器第二次 click 的 detail 为 2；不要重新安排单击动作。
    if (e.detail > 1) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = 0;
      return;
    }
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = 0;
      return;
    }
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = 0;
      toggleRun();
    }, clickDelayRef.current);
  };

  const onDoubleClickWidget = () => {
    if (menuOpen || suppressClickRef.current || Date.now() < dismissUntilRef.current) { cancelClick(); return; }
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = 0;
    }
    doSwitch(mode === "focus" ? "break" : "focus");
  };

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");
  const color = COLORS[mode];

  return (
    <div
      className={`fg-widget ${finished ? "finished" : ""} ${hover || menuOpen ? "engaged" : ""}`}
      style={{ "--sand": color } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        setHover(false);
        onPointerUp();
      }}
      onPointerEnter={() => setHover(true)}
      onClick={onClickWidget}
      onDoubleClick={onDoubleClickWidget}
      onContextMenu={(e) => {
        e.preventDefault();
        cancelClick();
        dragRef.current = null;
        setMenuOpen(true);
      }}
    >
      <div className="hg-tilt" style={{ transform: `rotate(${flips * 360}deg)` }}>
        <div className="hg-pause" style={{ transform: paused ? "rotate(75deg)" : "rotate(0deg)" }}>
          <MiniHourglass progress={progress} mode={mode} running={running} />
        </div>
      </div>

      {/* 完成切换必须卸载数字节点；透明 WebView 不复用旧字形图层。 */}
      <div className="w-time" data-state={finished ? "finished" : "countdown"}>
        {finished ? (
          <span key="finished" className="w-finished" role="status" aria-live="polite">完成</span>
        ) : (
          <span key="countdown" className="w-countdown" role="timer">{`${minutes}:${seconds}`}</span>
        )}
      </div>

      <div className={`w-dots ${hover || menuOpen ? "show" : ""}`}>
        {(["focus", "break"] as TimerMode[]).map((m) => (
          <button
            onPointerDown={(e) => { e.stopPropagation(); cancelClick(); }}
            onDoubleClick={(e) => e.stopPropagation()}
            key={m}
            className={`w-dot ${m} ${m === mode ? "on" : ""}`}
            title={m === "focus" ? "切换到专注" : "切换到休息"}
            onClick={(e) => {
              e.stopPropagation();
              cancelClick();
              if (menuOpen || Date.now() < dismissUntilRef.current) return;
              doSwitch(m);
            }}
          />
        ))}
      </div>

      {menuOpen && (
        <div ref={menuRef} className="w-menu" role="menu" onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); cancelClick(); dismissUntilRef.current = Date.now() + clickDelayRef.current; }}>
          <button onClick={() => { toggleRun(); setMenuOpen(false); }}>
            {running ? "暂停" : paused ? "继续" : "开始"}
          </button>
          <button onClick={() => { doSwitch(mode === "focus" ? "break" : "focus"); setMenuOpen(false); }}>
            切换到{mode === "focus" ? "休息" : "专注"}
          </button>
          <button onClick={() => { resetCurrent(); setMenuOpen(false); }}>重置当前计时</button>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("widget-root")!).render(<Widget />);
