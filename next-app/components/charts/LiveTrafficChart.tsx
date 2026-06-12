"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

export type LiveTrafficPoint = {
  time: string;
  downKbps: number;
  upKbps: number;
};

/** Live session traffic line chart. Loaded via next/dynamic to keep recharts out of the main bundle. */
const LiveTrafficChart = ({ data }: { data: LiveTrafficPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="time" hide />
        <YAxis width={60} />
        <RechartsTooltip />
        <Line type="monotone" dataKey="downKbps" stroke="#2563eb" dot={false} name="Down (KB/s)" />
        <Line type="monotone" dataKey="upKbps" stroke="#16a34a" dot={false} name="Up (KB/s)" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LiveTrafficChart;
