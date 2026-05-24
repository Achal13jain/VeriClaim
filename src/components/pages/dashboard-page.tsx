"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

import { PaymentHistory } from "@/components/payments/PaymentHistory";
import { ActivityFeed } from "@/components/vericlaim/activity-feed";
import { DashboardStats } from "@/components/vericlaim/dashboard-stats";
import { ReputationBadge } from "@/components/vericlaim/reputation-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  firebaseReady,
  listUserPayments,
  listPublicSpecs,
  listRecentActivityEvents,
  listTopUsers,
} from "@/lib/firebase/firestore";
import { useAuthState } from "@/lib/firebase/auth";
import type { PaymentRecord } from "@/lib/payments/types";
import type {
  ActivityEvent,
  ChartPoint,
  DashboardMetric,
  LeaderboardUser,
  MarketSpecRecord,
} from "@/lib/types";
import { formatHash, formatNumber } from "@/lib/utils";
import { toSafeClientError } from "@/lib/utils/safeMessages";

function isBlessedSpec(spec: MarketSpecRecord) {
  return (
    spec.status === "blessed" ||
    spec.status === "published" ||
    spec.judge.verdict === "blessed"
  );
}

function buildMetrics(specs: MarketSpecRecord[]): DashboardMetric[] {
  const totalSpecs = specs.length;
  const blessedSpecs = specs.filter(isBlessedSpec).length;
  const challengedSpecs = specs.filter(
    (spec) => spec.status === "challenged" || spec.challengeCount > 0,
  ).length;
  const arcProofs = specs.filter((spec) => spec.arcPublished).length;

  return [
    {
      label: "Total specs",
      value: formatNumber(totalSpecs),
      delta: firebaseReady() ? "from Firestore" : "Firebase not configured",
      tone: "blue",
    },
    {
      label: "Blessed specs",
      value: formatNumber(blessedSpecs),
      delta: `${totalSpecs ? Math.round((blessedSpecs / totalSpecs) * 100) : 0}% blessing rate`,
      tone: "green",
    },
    {
      label: "Challenged specs",
      value: formatNumber(challengedSpecs),
      delta: "challenge signals",
      tone: "amber",
    },
    {
      label: "Arc proofs",
      value: formatNumber(arcProofs),
      delta: "Mock Arc proofs",
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
  const { user } = useAuthState();
  const [specs, setSpecs] = useState<MarketSpecRecord[]>([]);
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSpecs() {
      setLoading(true);
      setLoadError(null);

      try {
        const [savedSpecs, savedUsers, savedEvents, savedPayments] = await Promise.all([
          listPublicSpecs(100),
          listTopUsers(10),
          listRecentActivityEvents(8),
          user ? listUserPayments(user.uid, 8) : Promise.resolve([]),
        ]);

        if (active) {
          setSpecs(savedSpecs);
          setTopUsers(savedUsers);
          setEvents(savedEvents);
          setPayments(savedPayments);
        }
      } catch (caughtError) {
        if (active) {
          setLoadError(
            toSafeClientError(
              caughtError,
              "Could not load dashboard stats. Check Firestore access or browser privacy settings.",
            ),
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
  }, [user]);

  const metrics = useMemo(() => buildMetrics(specs), [specs]);
  const chartData = useMemo(() => buildChartData(specs), [specs]);
  const recentActivity = useMemo(() => buildRecentActivity(specs), [specs]);
  const blessedSpecs = useMemo(
    () =>
      specs
        .filter(isBlessedSpec)
        .sort((a, b) => b.scores.quality - a.scores.quality)
        .slice(0, 3),
    [specs],
  );
  const challengedSpecs = useMemo(
    () =>
      [...specs]
        .sort((a, b) => b.challengeCount - a.challengeCount)
        .slice(0, 3),
    [specs],
  );
  const estimatedNetworkReputation = specs.reduce(
    (total, spec) => total + (isBlessedSpec(spec) ? 17 : 2),
    0,
  );
  const displayedEvents = events.length
    ? events
    : recentActivity.length
      ? recentActivity
      : activityEvents;

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
            {!user ? <Badge variant="glass">Public preview</Badge> : null}
          </div>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">
            Dashboard.
          </h1>
          <p className="text-muted-foreground">
            Monitor public MarketSpec quality, Arc proof activity, open
            challenges, credits, badges, and reputation leaderboards.
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

      {!user ? (
        <Card className="glass-panel">
          <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold">Public dashboard view</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Sign in to see your Forge Credits, reputation, badges,
                challenges, mock payments, and saved MarketSpecs.
              </p>
            </div>
            <Button asChild variant="court" className="shrink-0">
              <Link href="/login?next=/dashboard">Sign in for my dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <DashboardStats metrics={metrics} loading={loading} />

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
          events={displayedEvents}
          badge={events.length ? "Firestore activity" : "mock fallback"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        {user ? (
          <PaymentHistory payments={payments} loading={loading} />
        ) : (
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Personal activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Your credits, badges, challenges, and payment receipts appear
                here after sign-in.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/login?next=/dashboard">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Mock x402 unlock layer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Forge gives each signed-in user 3 free MarketSpec generations.
              After that, VeriClaim asks for 1 Forge Credit or creates a mock
              x402 receipt worth $0.01.
            </p>
            <p>
              This is mock-mode accounting. Real x402 payment support is
              planned and no real money moves in the current build.
            </p>
          </CardContent>
        </Card>
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
            {(topUsers.length
              ? topUsers
              : leaderboard.map((entry, index) => ({
                  uid: entry.name,
                  displayName: entry.name,
                  photoURL: "",
                  credits: entry.credits,
                  reputation: entry.reputation,
                  level: entry.role,
                  badges: [],
                  blessedSpecs: Math.max(0, 5 - index),
                  challenges: index + 1,
                }))
            ).map((entry, index) => (
              <div
                key={entry.uid}
                className="flex items-center justify-between gap-4 rounded-md border border-border/70 bg-background/60 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-amber-400/30 bg-amber-400/12 font-mono text-sm text-amber-600 dark:text-amber-300">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{entry.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.level}
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
            {!topUsers.length && !loading ? (
              <p className="text-sm text-muted-foreground">
                Save specs and challenges to populate the live leaderboard.
              </p>
            ) : null}
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
            <div className="h-[240px]">
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
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Most blessed specs</p>
                {(blessedSpecs.length ? blessedSpecs : specs.slice(0, 3)).map(
                  (spec) => (
                    <div
                      key={`blessed-${spec.hash}`}
                      className="rounded-md border border-border/70 bg-background/60 p-3"
                    >
                      <p className="truncate text-sm font-medium">
                        {spec.marketSpec.question}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {formatHash(spec.hash)} - quality {spec.scores.quality}
                      </p>
                    </div>
                  ),
                )}
                {!specs.length && !loading ? (
                  <p className="text-sm text-muted-foreground">
                    No saved specs yet.
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Most challenged specs</p>
                {challengedSpecs.map((spec) => (
                  <div
                    key={`challenged-${spec.hash}`}
                    className="rounded-md border border-border/70 bg-background/60 p-3"
                  >
                    <p className="truncate text-sm font-medium">
                      {spec.marketSpec.question}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {formatHash(spec.hash)} - {spec.challengeCount} challenges
                    </p>
                  </div>
                ))}
                {!specs.length && !loading ? (
                  <p className="text-sm text-muted-foreground">
                    No challenged specs yet.
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
