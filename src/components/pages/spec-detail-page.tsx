"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  Copy,
  FileCheck2,
  MessageSquareWarning,
  ShieldCheck,
} from "lucide-react";

import { AgentCourtTimeline } from "@/components/vericlaim/agent-court-timeline";
import { ArcProofBadge } from "@/components/vericlaim/arc-proof-badge";
import { JSONPreview } from "@/components/vericlaim/json-preview";
import { QualityScoreBadge } from "@/components/vericlaim/quality-score-badge";
import { X402PaymentBadge } from "@/components/vericlaim/x402-payment-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { MarketSpecRecord } from "@/lib/types";
import { formatHash, statusLabel } from "@/lib/utils";

export function SpecDetailPage({ spec }: { spec: MarketSpecRecord }) {
  const [copied, setCopied] = useState(false);

  async function copyShareLink() {
    if (typeof window === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <main className="page-shell space-y-8">
      <Button asChild variant="ghost" className="px-0">
        <Link href="/specs">
          <ArrowLeft />
          Back to gallery
        </Link>
      </Button>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="blue">REQ-SPEC-001</Badge>
            <Badge variant={spec.status === "challenged" ? "warning" : "success"}>
              {statusLabel(spec.status)}
            </Badge>
            <Badge variant="warning">
              Ambiguity {spec.critic.ambiguityRisk}
            </Badge>
            <QualityScoreBadge score={spec.scores.quality} />
            <ArcProofBadge
              published={spec.arcPublished}
              txHash={spec.arcTxHash}
            />
          </div>
          <h1 className="max-w-5xl font-display text-5xl leading-none sm:text-6xl">
            {spec.marketSpec.question}
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Public demo page for MarketSpec hash{" "}
            <span className="font-mono text-foreground">
              {formatHash(spec.hash)}
            </span>
            . Only hashes and metadata references are designed to be anchored on
            Arc in later phases.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="court" onClick={copyShareLink}>
              <Copy />
              {copied ? "Copied" : "Share"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/forge">Forge another</Link>
            </Button>
          </div>
        </div>

        <Card className="glass-panel h-fit">
          <CardHeader>
            <CardTitle>Proof summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border/70 bg-background/60 p-3">
              <div className="text-sm text-muted-foreground">Hash</div>
              <div className="mt-1 break-all font-mono text-xs">{spec.hash}</div>
            </div>
            <div className="rounded-md border border-border/70 bg-background/60 p-3">
              <div className="text-sm text-muted-foreground">Arc tx</div>
              <div className="mt-1 break-all font-mono text-xs">
                {spec.arcTxHash ?? "pending"}
              </div>
            </div>
            <X402PaymentBadge />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck2 className="size-5 text-court-green" />
                Resolution logic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-medium">Resolution source</p>
                <p className="mt-2 text-muted-foreground">
                  {spec.marketSpec.resolutionSource}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Resolution rule</p>
                <p className="mt-2 leading-7 text-muted-foreground">
                  {spec.marketSpec.resolutionRule}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Edge cases</p>
                <div className="mt-3 grid gap-2">
                  {spec.marketSpec.edgeCases.map((edgeCase) => (
                    <div
                      key={edgeCase}
                      className="rounded-md border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground"
                    >
                      {edgeCase}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>AI Court trace</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentCourtTimeline steps={spec.agentTrace} />
            </CardContent>
          </Card>

          <JSONPreview
            data={{
              hash: spec.hash,
              sourceClaim: spec.sourceClaim,
              canonicalClaim: spec.canonicalClaim,
              marketSpec: spec.marketSpec,
              critic: spec.critic,
              judge: spec.judge,
              scores: spec.scores,
            }}
          />
        </div>

        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-court-blue" />
                Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Quality", spec.scores.quality],
                ["Tradability", spec.scores.tradability],
                ["Resolution clarity", spec.scores.resolutionClarity],
                ["Ambiguity risk", 100 - spec.scores.ambiguity],
              ].map(([label, value]) => (
                <div key={label as string} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-mono">{value}</span>
                  </div>
                  <Progress value={Number(value)} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareWarning className="size-5 text-court-amber" />
                Challenge panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border/70 bg-background/60 p-3">
                  <div className="text-xs text-muted-foreground">
                    Challenges
                  </div>
                  <div className="mt-1 font-mono text-2xl">
                    {spec.challengeCount}
                  </div>
                </div>
                <div className="rounded-md border border-border/70 bg-background/60 p-3">
                  <div className="text-xs text-muted-foreground">
                    Reward pool
                  </div>
                  <div className="mt-1 font-mono text-2xl">
                    {spec.rewardTotal}
                  </div>
                </div>
              </div>
              <Textarea
                placeholder="Mock challenge reason, for example: deadline source is weak."
                className="min-h-28"
              />
              <Button type="button" variant="outline" className="w-full">
                Preview challenge ruling
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="size-5 text-court-green" />
                Credits and rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Successful challenges reward +5 Forge Credits and +10
                reputation in the SRS gameplay loop.
              </p>
              <p>
                This foundation keeps the economy mocked and visually separate
                from the one-time x402 unlock state.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
