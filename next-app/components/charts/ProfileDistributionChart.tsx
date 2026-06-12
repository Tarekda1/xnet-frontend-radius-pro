"use client";

import { useMemo } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import type { User } from "@/types/api";

const PIE_PALETTE = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

/** Pie chart of users per profile. Loaded via next/dynamic to keep recharts out of the main bundle. */
const ProfileDistributionChart = ({ users }: { users: User[] }) => {
  const chartData = useMemo(() => {
    const profileStats = users.reduce((acc, user) => {
      const profileName = user.profile.profileName;
      acc[profileName] = (acc[profileName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(profileStats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], index) => ({
        name,
        value,
        fill: PIE_PALETTE[index % PIE_PALETTE.length],
      }));
  }, [users]);

  return (
    <div className="h-64 relative">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-primary/10 dark:to-primary/5" />
      <div className="relative z-10 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '8px',
                color: 'white'
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProfileDistributionChart;
