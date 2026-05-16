"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Coins, Loader2, Play } from "lucide-react";

import { AgentCourtTimeline } from "@/components/vericlaim/agent-court-timeline";
import { JSONPreview } from "@/components/vericlaim/json-preview";
import { MarketSpecCard } from "@/components/vericlaim/market-spec-card";
import { SampleClaimChips } from "@/components/vericlaim/sample-claim-chips";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { featuredSpec } from "@/lib/mock-data";
import type { AgentRole, SourceType } from "@/lib/types";

const forgePhases: Array<{
  event: string;
  label: string;
  role?: AgentRole;
}> = [
  { event: "forger:start", label: "Forger reading source claim", role: "forger" },
  { event: "forger:token", label: "Forger drafting canonical question", role: "forger" },
  { event: "forger:done", label: "Forger produced MarketSpec JSON", role: "forger" },
  { event: "critic:start", label: "Critic attacking ambiguity", role: "critic" },
  { event: "critic:token", label: "Critic testing edge cases", role: "critic" },
  { event: "critic:done", label: "Critic objections ready", role: "critic" },
  { event: "judge:start", label: "Judge reviewing revised spec", role: "judge" },
  { event: "judge:token", label: "Judge scoring confidence", role: "judge" },
  { event: "judge:done", label: "Judge verdict blessed", role: "judge" },
  { event: "persist:start", label: "Mock persistence prepared" },
  { event: "persist:done", label: "Public page preview ready" },
  { event: "complete", label: "Demo fallback complete" },
];

const sourceTypes: SourceType[] = [
  "manual",
  "discord",
  "news",
  "social",
  "rss",
  "research",
];

export function ForgePage() {
  const [claim, setClaim] = useState(featuredSpec.sourceClaim);
  const [sourceType, setSourceType] = useState<SourceType>("manual");
  const [isForging, setIsForging] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(forgePhases.length - 1);

  useEffect(() => {
    if (!isForging) {
      return;
    }

    const interval = window.setInterval(() => {
      setPhaseIndex((current) => {
        if (current >= forgePhases.length - 1) {
          window.clearInterval(interval);
          setIsForging(false);
          return current;
        }

        return current + 1;
      });
    }, 420);

    return () => window.clearInterval(interval);
  }, [isForging]);

  const previewSpec = useMemo(
    () => ({
      ...featuredSpec,
      sourceClaim: claim,
      sourceType,
    }),
    [claim, sourceType],
  );

  const activePhase = forgePhases[phaseIndex];
  const progress = Math.round(((phaseIndex + 1) / forgePhases.length) * 100);

  return (
    <main className="page-shell space-y-8">
      <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="blue">REQ-FORGE-001</Badge>
            <Badge variant="glass">Demo fallback mode</Badge>
            <X402PaymentBadge state="disabled" />
          </div>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">
            Forge a MarketSpec.
          </h1>
          <p className="text-muted-foreground">
            Paste a messy claim, choose a source type, and preview the AI Court
            flow with mock output. Live `/api/forge` streaming is reserved for
            the implementation phase after this foundation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success" className="gap-1.5">
            <Coins className="size-3.5" />
            100 Forge Credits
          </Badge>
          <Badge variant="violet" className="gap-1.5">
            <BadgeCheck className="size-3.5" />
            +2 rep per demo forge
          </Badge>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Claim intake</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="claim" className="text-sm font-medium">
                Source claim
              </label>
              <Textarea
                id="claim"
                value={claim}
                maxLength={5000}
                onChange={(event) => setClaim(event.target.value)}
                placeholder="Paste a claim from Discord, news, a post, or a manual market idea."
                className="min-h-44"
              />
              <div className="flex justify-between gap-3 font-mono text-xs text-muted-foreground">
                <span>Max 5,000 characters</span>
                <span>{claim.length}/5000</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Source type</label>
              <Select
                value={sourceType}
                onValueChange={(value) => setSourceType(value as SourceType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose source type" />
                </SelectTrigger>
                <SelectContent>
                  {sourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Sample claims</p>
              <SampleClaimChips onSelect={setClaim} />
            </div>

            <Button
              type="button"
              variant="court"
              size="lg"
              disabled={!claim.trim() || isForging}
              onClick={() => {
                setPhaseIndex(0);
                setIsForging(true);
              }}
              className="w-full"
            >
              {isForging ? (
                <>
                  <Loader2 className="animate-spin" />
                  Running AI Court
                </>
              ) : (
                <>
                  <Play />
                  Run AI Court
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <CardTitle>Live court progress</CardTitle>
                <Badge variant="glass" className="font-mono">
                  {activePhase.event}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <Progress value={progress} />
              <div className="flex items-center gap-3 rounded-md border border-border/70 bg-background/60 p-3">
                <ArrowRight className="size-4 text-court-green" />
                <span className="text-sm">{activePhase.label}</span>
              </div>
              <AgentCourtTimeline
                steps={previewSpec.agentTrace}
                activeRole={activePhase.role}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <MarketSpecCard spec={previewSpec} compact />
            <JSONPreview
              title="Validated mock response"
              data={{
                source_claim: previewSpec.sourceClaim,
                source_type: previewSpec.sourceType,
                market_spec: previewSpec.marketSpec,
                critic: previewSpec.critic,
                judge: previewSpec.judge,
                scores: previewSpec.scores,
                agent_trace: previewSpec.agentTrace,
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
