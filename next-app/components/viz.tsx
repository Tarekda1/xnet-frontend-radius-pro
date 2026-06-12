import React, { useEffect, useRef, useState } from "react";

/** Animated count-up for KPI values. */
export function useCountUp(target: number, durationMs = 700): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (target - from) * eased;
      setDisplay(value);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return display;
}

export const CountUpNumber = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  const display = useCountUp(value);
  return <span className="tabular-nums">{prefix}{Math.round(display).toLocaleString()}{suffix}</span>;
};

/** Minimal dependency-free sparkline. */
export const Sparkline = ({ data, strokeClass = "stroke-blue-500" }: { data: number[]; strokeClass?: string }) => {
  if (data.length < 2) return null;
  const width = 120;
  const height = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (width - 4) + 2;
      const y = height - 3 - ((v - min) / range) * (height - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-full" preserveAspectRatio="none" aria-hidden>
      <polyline
        points={points}
        fill="none"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeClass}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

/** Progress ring (SVG) with severity coloring by percentage.
 * tone="auto": high % is good (green). tone="inverse": high % is bad (red). */
export const ProgressRing = ({
  percent,
  size = 116,
  tone = "auto",
}: {
  percent: number;
  size?: number;
  tone?: "auto" | "inverse";
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const severity = tone === "inverse" ? 100 - clamped : clamped;
  const toneClass =
    severity >= 75 ? "stroke-emerald-500" : severity >= 45 ? "stroke-amber-500" : "stroke-red-500";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        className="stroke-muted"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={`${toneClass} transition-[stroke-dashoffset] duration-700 ease-out`}
      />
    </svg>
  );
};
