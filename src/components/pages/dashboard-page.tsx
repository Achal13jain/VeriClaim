"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Crown, Trophy } from "lucide-react";

import { ActivityFeed } from "@/components/vericlaim/activity-feed";
import { DashboardStats } from "@/components/vericlaim/dashboard-stats";
import { ReputationBadge } from "@/components/vericlaim/reputation-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  activityEvents,
  chartData,
  dashboardMetrics,
  leaderboard,
} from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

export function DashboardPage() {
  return (
    <main className="page-shell space-y-8">
      <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="blue">REQ-GAME-006</Badge>
            <Badge variant="success">REQ-GAME-007</Badge>
            <Badge variant="glass">mock analytics</Badge>
          </div>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">
            Dashboard.
          </h1>
          <p className="text-muted-foreground">
            Monitor MarketSpec quality, Arc proof activity, open challenges,
            credits, badges, and reputation leaderboards without connecting live
            services yet.
          </p>
        </div>
        <ReputationBadge reputation={2839} label="Network rep" />
      </section>

      <DashboardStats metrics={dashboardMetrics} />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Spec throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -18, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="blessed"
                    stroke="#35f2a4"
                    fill="#35f2a4"
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="proofs"
                    stroke="#39a7ff"
                    fill="#39a7ff"
                    fillOpacity={0.16}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <ActivityFeed events={activityEvents} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-court-amber" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.name}
                className="flex items-center justify-between gap-4 rounded-md border border-border/70 bg-background/60 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-amber-400/30 bg-amber-400/12 font-mono text-sm text-amber-600 dark:text-amber-300">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{entry.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.role}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono">{formatNumber(entry.reputation)}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.credits} credits
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="size-5 text-court-violet" />
              Challenge mix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -18, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                  <Bar dataKey="challenged" fill="#ffca6a" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="proofs" fill="#9b7cff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
