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
  X,
} from "lucide-react";

import { ArcProofPanel } from "@/components/spec/ArcProofPanel";
import { PublishProofButton } from "@/components/spec/PublishProofButton";
import { RewardToast } from "@/components/shared/RewardToast";
import { X402PaymentBadge } from "@/components/shared/X402PaymentBadge";
import { AgentCourtTimeline } from "@/components/vericlaim/agent-court-timeline";
import { ArcProofBadge } from "@/components/vericlaim/arc-proof-badge";
import { JSONPreview } from "@/components/vericlaim/json-preview";
import { QualityScoreBadge } from "@/components/vericlaim/quality-score-badge";
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

function ChallengeActionButton({
  onClick,
  className = "",
  fullWidth = false,
}: {
  onClick: () => void;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={[
        "border-amber-400/45 bg-amber-400/12 text-amber-800 shadow-[0_0_22px_rgba(251,191,36,0.10)] hover:border-amber-300/70 hover:bg-amber-400/20 dark:text-amber-200",
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      <MessageSquareWarning />
      Challenge this spec
    </Button>
  );
}

function ChallengeModal({
  open,
  reasonCategory,
  challengeReason,
  challengeError,
  challengeResult,
  isChallenging,
  onCategoryChange,
  onReasonChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  reasonCategory: ChallengeReasonCategory;
  challengeReason: string;
  challengeError: string | null;
  challengeResult: ChallengeResponse | null;
  isChallenging: boolean;
  onCategoryChange: (value: ChallengeReasonCategory) => void;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/78 p-4 backdrop-blur-xl">
      <div className="glass-panel w-full max-w-2xl overflow-hidden rounded-lg shadow-glow">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 p-5">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-court-amber">
              <MessageSquareWarning className="size-5" />
              <p className="section-eyebrow text-amber-600 dark:text-amber-300">
                Challenge Court
              </p>
            </div>
            <h2 className="font-display text-3xl leading-none">
              Challenge this MarketSpec
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Flag ambiguity, weak sources, missing edge cases, or unclear
              resolution rules.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isChallenging}
            onClick={onClose}
            aria-label="Close challenge modal"
          >
            <X />
          </Button>
        </div>

        <div className="max-h-[calc(100vh-10rem)] space-y-4 overflow-y-auto p-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason category</label>
            <Select
              value={reasonCategory}
              onValueChange={(value) =>
                onCategoryChange(value as ChallengeReasonCategory)
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
              Explain the issue
            </label>
            <Textarea
              id="challenge-reason"
              value={challengeReason}
              maxLength={2000}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Explain the exact ambiguity, source weakness, deadline issue, or missing edge case."
              className="min-h-32"
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
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border/70 p-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isChallenging}
            onClick={onClose}
          >
            {challengeResult ? "Close" : "Cancel"}
          </Button>
          {!challengeResult ? (
            <Button
              type="button"
              variant="court"
              disabled={isChallenging}
              onClick={onSubmit}
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
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SpecDetailPage({
  spec: initialSpec,
}: {
  spec: MarketSpecRecord;
}) {
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

  function openChallenge() {
    if (!user) {
      router.push(
        `/login?next=${encodeURIComponent(getSpecUrlPath(spec.hash, spec.slug))}`,
      );
      return;
    }

    setChallengeError(null);
    setChallengeResult(null);
    setChallengeOpen(true);
  }

  function closeChallenge() {
    if (isChallenging) {
      return;
    }

    setChallengeOpen(false);
  }

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
      router.push(
        `/login?next=${encodeURIComponent(getSpecUrlPath(spec.hash, spec.slug))}`,
      );
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
    <main className="page-shell space-y-6">
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

      <ChallengeModal
        open={challengeOpen}
        reasonCategory={reasonCategory}
        challengeReason={challengeReason}
        challengeError={challengeError}
        challengeResult={challengeResult}
        isChallenging={isChallenging}
        onCategoryChange={(value) => {
          setReasonCategory(value);
          setChallengeError(null);
        }}
        onReasonChange={(value) => {
          setChallengeReason(value);
          setChallengeError(null);
        }}
        onClose={closeChallenge}
        onSubmit={submitChallenge}
      />

      <Button asChild variant="ghost" className="px-0">
        <Link href="/specs">
          <ArrowLeft />
          Back to gallery
        </Link>
      </Button>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="min-w-0 space-y-6">
          <Card className="glass-panel">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="blue">REQ-SPEC-001</Badge>
                <Badge
                  variant={spec.status === "challenged" ? "warning" : "success"}
                >
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

              <div className="space-y-3">
                <p className="section-eyebrow">Market question</p>
                <h1 className="max-w-5xl font-display text-4xl leading-[0.98] sm:text-5xl lg:text-6xl">
                  {spec.marketSpec.question}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Public MarketSpec page for hash{" "}
                  <span className="font-mono text-foreground">
                    {formatHash(spec.hash)}
                  </span>
                  . Saved specs can publish a clearly labeled Mock Arc proof
                  while real Arc contract publishing remains planned.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="court" onClick={copyShareLink}>
                  <Copy />
                  {copied ? "Copied" : "Share"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/forge">Forge another</Link>
                </Button>
                <ChallengeActionButton onClick={openChallenge} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck2 className="size-5 text-court-green" />
                Resolution details
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
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {spec.marketSpec.resolutionSource}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Resolution rule</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
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

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="size-5 text-court-violet" />
                  Judge reasoning
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
                <div className="grid gap-2">
                  {spec.judge.reasoning.map((reason) => (
                    <div
                      key={reason}
                      className="rounded-md border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground"
                    >
                      {reason}
                    </div>
                  ))}
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
          </section>

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

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-court-blue" />
                Verdict and scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="violet">{statusLabel(spec.judge.verdict)}</Badge>
                <QualityScoreBadge score={spec.scores.quality} />
              </div>
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
              <div className="grid grid-cols-2 gap-3 pt-1">
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
              <ChallengeActionButton fullWidth onClick={openChallenge} />
            </CardContent>
          </Card>

          <ArcProofPanel spec={spec} />

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Publish Mock Arc Proof</CardTitle>
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
                Forge Credits are in-app MVP credits. Mock x402 unlocks remain
                visually separate and do not move real money.
              </p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
