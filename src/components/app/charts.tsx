"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DailyBars({ data, label }: { data: { day: string; count: number }[]; label: string }) {
  const rows = data.map((d) => ({
    ...d,
    short: new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(d.day)),
  }));
  return (
    <div className="h-56 w-full" role="img" aria-label={`${label} per day for the last ${data.length} days`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid vertical={false} stroke="#E3E6F3" />
          <XAxis dataKey="short" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5A6189" }} interval="preserveStartEnd" minTickGap={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5A6189" }} />
          <Tooltip cursor={{ fill: "#EEF1FF" }} contentStyle={{ borderRadius: 12, border: "1px solid #E3E6F3", fontSize: 13 }}
            formatter={(v) => [v, label]} labelFormatter={(_, p) => p?.[0]?.payload?.short ?? ""} />
          <Bar dataKey="count" fill="#4A1FB8" radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
