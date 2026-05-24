"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Coins,
  Copy,
  FileCheck2,
  Gavel,
  Loader2,
  MessageSquareWarning,
  Send,
  ShieldCheck,
} from "lucide-react";

import { AgentCourtTimeline } from "@/components/vericlaim/agent-court-timeline";
import { ArcProofBadge } from "@/components/vericlaim/arc-proof-badge";
import { ArcProofPanel } from "@/components/spec/ArcProofPanel";
import { JSONPreview } from "@/components/vericlaim/json-preview";
import { PublishProofButton } from "@/components/spec/PublishProofButton";
import { QualityScoreBadge } from "@/components/vericlaim/quality-score-badge";
import { RewardToast } from "@/components/shared/RewardToast";
import { X402PaymentBadge } from "@/components/shared/X402PaymentBadge";
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
import {
  ChallengeResponseSchema,
  type ChallengeReasonCategory,
  type ChallengeResponse,
} from "@/lib/challenges/schemas";
import { useAuthState } from "@/lib/firebase/auth";
import {
  firebaseReady,
  saveChallengeCourtResult,
} from "@/lib/firebase/firestore";
import type { MarketSpecRecord } from "@/lib/types";
import { formatHash, statusLabel } from "@/lib/utils";
import { toSafeClientError } from "@/lib/utils/safeMessages";
import { getSpecUrlPath } from "@/lib/utils/slugify";

const challengeCategories: ChallengeReasonCategory[] = [
  "Ambiguous wording",
  "Weak deadline",
  "Bad resolution source",
  "Not binary",
  "Too subjective",
  "Missing edge case",
  "Other",
];

export function SpecDetailPage({ spec: initialSpec }: { spec: MarketSpecRecord }) {
  const router = useRouter();
  const { configured, user } = useAuthState();
  const [spec, setSpec] = useState(initialSpec);
  const [copied, setCopied] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [reasonCategory, setReasonCategory] =
    useState<ChallengeReasonCategory>("Ambiguous wording");
  const [challengeReason, setChallengeReason] = useState("");
  const [challengeResult, setChallengeResult] =
    useState<ChallengeResponse | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [isChallenging, setIsChallenging] = useState(false);
  const [rewardToast, setRewardToast] = useState<{
    creditsDelta: number;
    reputationDelta: number;
    badgesAwarded: string[];
    message: string;
  } | null>(null);

  async function copyShareLink() {
    if (typeof window === "undefined" || !navigator.clipboard) {
      return;
    }

    const shareUrl = new URL(
      getSpecUrlPath(spec.hash, spec.slug),
      window.location.origin,
    ).toString();

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function submitChallenge() {
    if (!configured || !firebaseReady()) {
      setChallengeError("Firebase is not configured. Add env vars before challenging.");
      return;
    }

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(getSpecUrlPath(spec.hash, spec.slug))}`);
      return;
    }

    if (challengeReason.trim().length < 10) {
      setChallengeError("Add a specific challenge reason with at least 10 characters.");
      return;
    }

    setIsChallenging(true);
    setChallengeError(null);
    setChallengeResult(null);

    try {
      const response = await fetch("/api/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          specHash: spec.hash,
          marketSpec: spec.marketSpec,
          challengeReason,
          reasonCategory,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : "The Challenge Judge request failed.";
        throw new Error(message);
      }

      const parsed = ChallengeResponseSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error("The Challenge Judge returned an invalid ruling.");
      }

      const saved = await saveChallengeCourtResult({
        spec,
        user,
        challengeReason,
        reasonCategory,
        ruling: parsed.data,
      });

      setSpec(saved.updatedSpec);
      setChallengeResult(parsed.data);
      setRewardToast({
        creditsDelta: saved.creditDelta,
        reputationDelta: saved.reputationDelta,
        badgesAwarded: saved.badgesAwarded,
        message: "Challenge court reward",
      });
      window.setTimeout(() => setRewardToast(null), 3200);
    } catch (caughtError) {
      setChallengeError(
        toSafeClientError(
          caughtError,
          "Could not complete this challenge. Check sign-in and try again.",
        ),
      );
    } finally {
      setIsChallenging(false);
    }
  }

  return (
    <main className="page-shell space-y-8">
      <AnimatePresence>
        {rewardToast ? (
          <RewardToast
            creditsDelta={rewardToast.creditsDelta}
            reputationDelta={rewardToast.reputationDelta}
            badgesAwarded={rewardToast.badgesAwarded}
            message={rewardToast.message}
          />
        ) : null}
      </AnimatePresence>
      <Button asChild variant="ghost" className="px-0">
        <Link href="/specs">
          <ArrowLeft />
          Back to gallery
        </Link>
      </Button>

      <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
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
              mode={spec.arcMode}
            />
            <X402PaymentBadge state="disabled" />
          </div>
          <h1 className="max-w-5xl font-display text-5xl leading-none sm:text-6xl">
            {spec.marketSpec.question}
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Public MarketSpec page for hash{" "}
            <span className="font-mono text-foreground">
              {formatHash(spec.hash)}
            </span>
            . The current implementation saves a clearly labeled mock Arc
            Testnet proof while the real contract path remains planned.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="court" onClick={copyShareLink}>
              <Copy />
              {copied ? "Copied" : "Share"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/forge">Forge another</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!user) {
                  router.push(
                    `/login?next=${encodeURIComponent(getSpecUrlPath(spec.hash, spec.slug))}`,
                  );
                  return;
                }

                setChallengeOpen(true);
              }}
            >
              <MessageSquareWarning />
              Challenge this spec
            </Button>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <ArcProofPanel spec={spec} />
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Publish proof</CardTitle>
            </CardHeader>
            <CardContent>
              <PublishProofButton
                spec={spec}
                onPublished={setSpec}
                onReward={(reward) => {
                  setRewardToast(reward);
                  window.setTimeout(() => setRewardToast(null), 3200);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="min-w-0 space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck2 className="size-5 text-court-green" />
                Resolution logic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-border/70 bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Outcomes</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {spec.marketSpec.outcomes.map((outcome) => (
                      <Badge key={outcome} variant="outline">
                        {outcome}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-border/70 bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="mt-2 font-mono text-sm">
                    {spec.marketSpec.deadline}
                  </p>
                </div>
                <div className="rounded-md border border-border/70 bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="mt-2 text-sm">{spec.marketSpec.category}</p>
                </div>
              </div>
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
              arc: {
                published: spec.arcPublished,
                mode: spec.arcMode,
                txHash: spec.arcTxHash,
                publishedAt: spec.arcPublishedAt,
              },
            }}
          />
        </div>

        <div className="min-w-0 space-y-6">
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
                <Gavel className="size-5 text-court-violet" />
                Judge verdict
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant="violet">{statusLabel(spec.judge.verdict)}</Badge>
              <div>
                <p className="text-sm font-medium">Final question</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {spec.judge.finalQuestion}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Reasoning</p>
                <div className="mt-3 grid gap-2">
                  {spec.judge.reasoning.map((reason) => (
                    <div
                      key={reason}
                      className="rounded-md border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground"
                    >
                      {reason}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareWarning className="size-5 text-court-amber" />
                Critic objections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {spec.critic.objections.map((objection) => (
                <div
                  key={objection}
                  className="rounded-md border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground"
                >
                  {objection}
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
              {challengeOpen ? (
                <div className="space-y-3 rounded-md border border-border/70 bg-background/50 p-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reason category</label>
                    <Select
                      value={reasonCategory}
                      onValueChange={(value) =>
                        setReasonCategory(value as ChallengeReasonCategory)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {challengeCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="challenge-reason" className="text-sm font-medium">
                      Challenge reason
                    </label>
                    <Textarea
                      id="challenge-reason"
                      value={challengeReason}
                      maxLength={2000}
                      onChange={(event) => {
                        setChallengeReason(event.target.value);
                        setChallengeError(null);
                      }}
                      placeholder="Explain the exact ambiguity, source weakness, deadline issue, or missing edge case."
                      className="min-h-28"
                    />
                    <div className="text-right font-mono text-xs text-muted-foreground">
                      {challengeReason.length}/2000
                    </div>
                  </div>
                  {challengeError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {challengeError}
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="court"
                    className="w-full"
                    disabled={isChallenging}
                    onClick={submitChallenge}
                  >
                    {isChallenging ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Judge reviewing
                      </>
                    ) : (
                      <>
                        <Send />
                        Submit challenge
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
              {challengeResult ? (
                <div className="space-y-3 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success">
                      {statusLabel(challengeResult.ruling)}
                    </Badge>
                    <Badge variant="glass">
                      {challengeResult.reputation_delta > 0 ? "+" : ""}
                      {challengeResult.reputation_delta} rep
                    </Badge>
                    <Badge variant="blue">
                      {challengeResult.credit_delta > 0 ? "+" : ""}
                      {challengeResult.credit_delta} credits
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {challengeResult.summary}
                  </p>
                  <div className="grid gap-2">
                    {challengeResult.reasoning.map((reason) => (
                      <div
                        key={reason}
                        className="rounded-md border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground"
                      >
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {!challengeOpen ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setChallengeOpen(true)}
                >
                  <MessageSquareWarning />
                  Challenge this spec
                </Button>
              ) : null}
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
