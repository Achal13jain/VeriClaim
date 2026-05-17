"use client";

import { useEffect, useMemo, useState } from "react";
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
  leaderboard,
} from "@/lib/mock-data";
import { firebaseReady, listPublicSpecs } from "@/lib/firebase/firestore";
import type {
  ActivityEvent,
  ChartPoint,
  DashboardMetric,
  MarketSpecRecord,
} from "@/lib/types";
import { formatNumber } from "@/lib/utils";

function isBlessedSpec(spec: MarketSpecRecord) {
  return (
    spec.status === "blessed" ||
    spec.status === "published" ||
    spec.judge.verdict === "blessed"
  );
}

function buildMetrics(specs: MarketSpecRecord[], loading: boolean): DashboardMetric[] {
  const totalSpecs = specs.length;
  const blessedSpecs = specs.filter(isBlessedSpec).length;
  const challengedSpecs = specs.filter(
    (spec) => spec.status === "challenged" || spec.challengeCount > 0,
  ).length;
  const arcProofs = specs.filter((spec) => spec.arcPublished).length;

  return [
    {
      label: "Total specs",
      value: loading ? "..." : formatNumber(totalSpecs),
      delta: firebaseReady() ? "from Firestore" : "Firebase not configured",
      tone: "blue",
    },
    {
      label: "Blessed specs",
      value: loading ? "..." : formatNumber(blessedSpecs),
      delta: `${totalSpecs ? Math.round((blessedSpecs / totalSpecs) * 100) : 0}% blessing rate`,
      tone: "green",
    },
    {
      label: "Challenged specs",
      value: loading ? "..." : formatNumber(challengedSpecs),
      delta: "challengeCount or challenged status",
      tone: "amber",
    },
    {
      label: "Arc proofs",
      value: loading ? "..." : formatNumber(arcProofs),
      delta: "published on Arc",
      tone: "violet",
    },
  ];
}

function buildChartData(specs: MarketSpecRecord[]): ChartPoint[] {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;

    return {
      key,
      point: {
        label: date.toLocaleString("en", { month: "short" }),
        blessed: 0,
        challenged: 0,
        proofs: 0,
      } satisfies ChartPoint,
    };
  });
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket.point]));

  specs.forEach((spec) => {
    const date = new Date(spec.createdAt);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    const point = bucketMap.get(key);

    if (!point) {
      return;
    }

    if (isBlessedSpec(spec)) {
      point.blessed += 1;
    }
    if (spec.status === "challenged" || spec.challengeCount > 0) {
      point.challenged += 1;
    }
    if (spec.arcPublished) {
      point.proofs += 1;
    }
  });

  return buckets.map((bucket) => bucket.point);
}

function buildRecentActivity(specs: MarketSpecRecord[]): ActivityEvent[] {
  return specs.slice(0, 5).map((spec) => ({
    id: spec.hash,
    title: spec.arcPublished
      ? "Arc proof published"
      : spec.challengeCount > 0
        ? "Spec challenged"
        : "MarketSpec forged",
    detail: spec.marketSpec.question,
    timestamp: new Date(spec.createdAt).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    type: spec.arcPublished
      ? "proof"
      : spec.challengeCount > 0
        ? "challenge"
        : "forge",
  }));
}

export function DashboardPage() {
  const [specs, setSpecs] = useState<MarketSpecRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSpecs() {
      setLoading(true);
      setLoadError(null);

      try {
        const savedSpecs = await listPublicSpecs(100);

        if (active) {
          setSpecs(savedSpecs);
        }
      } catch (caughtError) {
        if (active) {
          setLoadError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not load dashboard stats.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSpecs();

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => buildMetrics(specs, loading), [loading, specs]);
  const chartData = useMemo(() => buildChartData(specs), [specs]);
  const recentActivity = useMemo(() => buildRecentActivity(specs), [specs]);
  const estimatedNetworkReputation = specs.reduce(
    (total, spec) => total + (isBlessedSpec(spec) ? 17 : 2),
    0,
  );

  return (
    <main className="page-shell space-y-8">
      <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="blue">REQ-GAME-006</Badge>
            <Badge variant="success">REQ-GAME-007</Badge>
            <Badge variant="glass">
              {firebaseReady() ? "Firestore analytics" : "Firebase not configured"}
            </Badge>
          </div>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">
            Dashboard.
          </h1>
          <p className="text-muted-foreground">
            Monitor MarketSpec quality, Arc proof activity, open challenges,
            credits, badges, and reputation leaderboards from saved public specs.
          </p>
        </div>
        <ReputationBadge
          reputation={estimatedNetworkReputation || 0}
          label="Network rep"
        />
      </section>

      {loadError ? (
        <Card className="glass-panel">
          <CardContent className="p-4 text-sm text-destructive">
            {loadError}
          </CardContent>
        </Card>
      ) : null}

      <DashboardStats metrics={metrics} />

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

        <ActivityFeed
          events={recentActivity.length ? recentActivity : activityEvents}
          badge={recentActivity.length ? "Firestore recent" : "mock fallback"}
        />
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
