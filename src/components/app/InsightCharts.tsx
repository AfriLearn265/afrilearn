"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type DailyPoint = { day: string; signups: number; videos: number; quizzes: number };

const series = [
  { key: "videos", label: "Videos watched", color: "#5A2AD9" },
  { key: "quizzes", label: "Quizzes taken", color: "#FF7A1A" },
  { key: "signups", label: "New accounts", color: "#18A058" },
] as const;

const short = (day: string) => new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(day));

/** Learning activity per day: videos watched, quizzes taken and new accounts. */
export function ActivityChart({ data }: { data: DailyPoint[] }) {
  const rows = data.map((d) => ({ ...d, short: short(d.day) }));
  return (
    <div className="h-72 w-full xl:h-[22rem]" role="img" aria-label={`Videos watched, quizzes taken and new accounts per day for the last ${data.length} days`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="#E6E0F5" />
          <XAxis dataKey="short" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#625884" }} interval="preserveStartEnd" minTickGap={18} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#625884" }} />
          <Tooltip contentStyle={{ borderRadius: 14, border: "2px solid #E6E0F5", fontSize: 13 }} labelFormatter={(_, p) => p?.[0]?.payload?.short ?? ""} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
          {series.map((s) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5} fill={`url(#fill-${s.key})`} dot={false} activeDot={{ r: 4 }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** A tiny trend line under a headline number. */
export function Sparkline({ values, color = "#5A2AD9" }: { values: number[]; color?: string }) {
  const rows = values.map((v, i) => ({ i, v }));
  return (
    <div className="h-10 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#spark-${color.slice(1)})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
