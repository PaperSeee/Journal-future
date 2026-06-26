"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@/lib/stats";

export function EquityCurve({ data }: { data: EquityPoint[] }) {
  const last = data[data.length - 1]?.cumR ?? 0;
  const positive = last >= 0;
  const stroke = positive ? "#3FB78B" : "#E2575B";

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="index"
            tick={{ fill: "#6B7280", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#242A34" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => `${v}R`}
          />
          <Tooltip
            cursor={{ stroke: "#4EA8DE", strokeWidth: 1, strokeDasharray: "4 4" }}
            formatter={(value: number, name: string) => [
              `${value > 0 ? "+" : ""}${value.toFixed(2)}R`,
              name === "cumR" ? "R cumulé" : name === "drawdown" ? "Drawdown" : name,
            ]}
            labelFormatter={(l) => (l === 0 ? "Départ" : `Trade #${l}`)}
            contentStyle={{ color: "#E6EAF0" }}
          />
          <ReferenceLine y={0} stroke="#3a4150" strokeWidth={1} />
          <Area
            type="monotone"
            dataKey="cumR"
            stroke={stroke}
            strokeWidth={2}
            fill="url(#equityFill)"
            dot={false}
            activeDot={{ r: 4, fill: stroke, stroke: "#0A0C10", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
