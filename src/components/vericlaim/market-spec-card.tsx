"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, CalendarClock, Coins, MessageSquareWarning } from "lucide-react";

import { ArcProofBadge } from "@/components/vericlaim/arc-proof-badge";
import { QualityScoreBadge } from "@/components/vericlaim/quality-score-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MarketSpecRecord } from "@/lib/types";
import { formatHash, statusLabel } from "@/lib/utils";

const statusVariant = {
  blessed: "success",
  published: "blue",
  challenged: "warning",
  needs_revision: "violet",
  rejected: "destructive",
} as const;

export function MarketSpecCard({
  spec,
  compact = false,
}: {
  spec: MarketSpecRecord;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45 }}
      className="h-full"
    >
      <Card className="glass-panel flex h-full flex-col overflow-hidden">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant[spec.status]}>
              {statusLabel(spec.status)}
            </Badge>
            <Badge variant="outline">{spec.marketSpec.category}</Badge>
            <QualityScoreBadge score={spec.scores.quality} />
          </div>
          <CardTitle className="text-xl leading-7">
            {spec.marketSpec.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          {!compact && (
            <p className="text-sm leading-6 text-muted-foreground">
              {spec.marketSpec.resolutionRule}
            </p>
          )}
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md border border-border/70 bg-background/50 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="size-4" />
                Deadline
              </div>
              <div className="mt-1 font-mono">{spec.marketSpec.deadline}</div>
            </div>
            <div className="rounded-md border border-border/70 bg-background/50 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquareWarning className="size-4" />
                Challenges
              </div>
              <div className="mt-1 font-mono">{spec.challengeCount}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ArcProofBadge
              published={spec.arcPublished}
              txHash={spec.arcTxHash}
            />
            <Badge variant="glass" className="gap-1.5">
              <Coins className="size-3.5" />
              {spec.rewardTotal} credits rewarded
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
            {formatHash(spec.hash)}
          </span>
          <Button asChild variant="outline" size="sm">
            <Link href={`/spec/${spec.hash}`}>
              Open
              <ArrowUpRight />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
