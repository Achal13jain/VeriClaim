"use client";

import { motion } from "framer-motion";
import { Activity, BadgeCheck, Coins, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardMetric } from "@/lib/types";
import { cn } from "@/lib/utils";

const toneClass = {
  blue: "text-court-blue bg-sky-400/12 border-sky-400/30",
  green: "text-court-green bg-emerald-400/12 border-emerald-400/30",
  violet: "text-court-violet bg-violet-400/12 border-violet-400/30",
  amber: "text-court-amber bg-amber-400/12 border-amber-400/30",
};

const icons = [BadgeCheck, ShieldCheck, Activity, Coins];

export function DashboardStats({
  metrics,
  loading = false,
}: {
  metrics: DashboardMetric[];
  loading?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = icons[index % icons.length];

        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            className="h-full"
          >
            <Card className="glass-panel h-full">
              <CardContent className="flex min-h-[156px] items-center justify-between gap-5 p-5 sm:p-6">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {metric.label}
                  </p>
                  {loading ? (
                    <div className="mt-3 h-8 w-16 animate-pulse rounded-md bg-muted/70" />
                  ) : (
                    <p className="mt-2 font-mono text-3xl leading-none">
                      {metric.value}
                    </p>
                  )}
                  <p className="mt-3 max-w-[13rem] text-xs leading-5 text-muted-foreground">
                    {metric.delta}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-md border",
                    toneClass[metric.tone],
                  )}
                >
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
