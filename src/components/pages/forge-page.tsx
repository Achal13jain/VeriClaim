"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  Coins,
  ExternalLink,
  Loader2,
  Play,
  Save,
} from "lucide-react";

import { PaymentModal } from "@/components/payments/PaymentModal";
import { X402PaymentBadge } from "@/components/shared/X402PaymentBadge";
import { AgentCourtTimeline } from "@/components/vericlaim/agent-court-timeline";
import { RewardToast } from "@/components/shared/RewardToast";
import { JSONPreview } from "@/components/vericlaim/json-preview";
import { MarketSpecCard } from "@/components/vericlaim/market-spec-card";
import { SampleClaimChips } from "@/components/vericlaim/sample-claim-chips";
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
import { ForgeResponseSchema, type ForgeResponse } from "@/lib/agents/schemas";
import { useAuthState } from "@/lib/firebase/auth";
import {
  consumeFreeForgeUse,
  firebaseReady,
  saveMarketSpec,
  saveMockPaymentUnlock,
  spendForgeCreditForUnlock,
} from "@/lib/firebase/firestore";
import { featuredSpec } from "@/lib/mock-data";
import { PaymentResponseSchema, FREE_FORGE_LIMIT } from "@/lib/payments/types";
import { X402_PRICE_USD } from "@/lib/payments/x402";
import type {
  AgentRole,
  AgentTraceStep,
  MarketSpecRecord,
  SourceType,
} from "@/lib/types";
import { getSpecUrlPath, slugify } from "@/lib/utils/slugify";

const forgePhases: Array<{
  event: string;
  label: string;
  role?: AgentRole;
  progress: number;
}> = [
  {
    event: "forger:running",
    label: "Forger running",
    role: "forger",
    progress: 25,
  },
  {
    event: "critic:running",
    label: "Critic running",
    role: "critic",
    progress: 55,
  },
  {
    event: "judge:running",
    label: "Judge running",
    role: "judge",
    progress: 82,
  },
  {
    event: "complete",
    label: "MarketSpec ready",
    progress: 100,
  },
];

const sourceTypes: SourceType[] = [
  "manual",
  "discord",
  "tweet",
  "article",
  "non_english",
  "github_signal",
];

const sourceLabels: Record<SourceType, string> = {
  manual: "Manual",
  discord: "Discord",
  tweet: "Tweet",
  article: "Article",
  non_english: "Non-English",
  github_signal: "GitHub signal",
};

function makeDisplayHash(input: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  const seed = (hash >>> 0).toString(16).padStart(8, "0");
  return `0x${seed.repeat(8).slice(0, 64)}`;
}

function traceSummary(trace: unknown, fallback: string) {
  if (
    trace &&
    typeof trace === "object" &&
    "summary" in trace &&
    typeof trace.summary === "string"
  ) {
    return trace.summary;
  }

  return fallback;
}

function responseToTimeline(response: ForgeResponse): AgentTraceStep[] {
  return [
    {
      agentId: "forger-001",
      role: "forger",
      title: "Forger output",
      summary: traceSummary(
        response.agent_trace.forger,
        `Canonicalized claim: ${response.canonical_claim}`,
      ),
      status: "complete",
      score: response.scores.quality,
    },
    {
      agentId: "critic-001",
      role: "critic",
      title: "Critic objections",
      summary: traceSummary(
        response.agent_trace.critic,
        response.critic.objections[0] ?? "Critic completed review.",
      ),
      status: "complete",
      score: 100 - response.scores.ambiguity,
    },
    {
      agentId: "judge-001",
      role: "judge",
      title: "Judge verdict",
      summary: traceSummary(
        response.agent_trace.judge,
        `${response.judge.verdict} with ${response.judge.confidence}% confidence.`,
      ),
      status: "complete",
      score: response.judge.confidence,
    },
  ];
}

function responseToRecord(
  response: ForgeResponse,
  hashOverride?: string | null,
): MarketSpecRecord {
  return {
    hash: hashOverride ?? makeDisplayHash(JSON.stringify(response)),
    slug: slugify(response.market_spec.question),
    sourceClaim: response.source_claim,
    canonicalClaim: response.canonical_claim,
    sourceType: response.source_type,
    marketSpec: {
      question: response.market_spec.question,
      outcomes: response.market_spec.outcomes,
      deadline: response.market_spec.deadline,
      category: response.market_spec.category,
      resolutionSource: response.market_spec.resolution_source,
      resolutionRule: response.market_spec.resolution_rule,
      edgeCases: response.market_spec.edge_cases,
    },
    critic: {
      objections: response.critic.objections,
      ambiguityRisk: response.critic.ambiguity_risk,
      suggestedFixes: response.critic.suggested_fixes,
    },
    judge: {
      verdict: response.judge.verdict,
      finalQuestion: response.judge.final_question,
      finalResolutionRule: response.judge.final_resolution_rule,
      reasoning: response.judge.reasoning,
      confidence: response.judge.confidence,
    },
    scores: {
      quality: response.scores.quality,
      tradability: response.scores.tradability,
      resolutionClarity: response.scores.resolution_clarity,
      ambiguity: response.scores.ambiguity,
    },
    agentTrace: responseToTimeline(response),
    status: response.judge.verdict,
    createdBy: "api-forge",
    createdAt: new Date().toISOString(),
    arcPublished: false,
    arcTxHash: null,
    arcPublishedAt: null,
    arcMode: null,
    challengeCount: 0,
    rewardTotal: 0,
    requirementIds: [
      "REQ-FORGE-004",
      "REQ-FORGE-008",
      "REQ-COURT-001",
      "REQ-COURT-002",
      "REQ-COURT-003",
    ],
  };
}

function recordToPreviewResponse(spec: MarketSpecRecord): ForgeResponse {
  return {
    source_claim: spec.sourceClaim,
    canonical_claim: spec.canonicalClaim,
    source_type: spec.sourceType,
    market_spec: {
      question: spec.marketSpec.question,
      outcomes: ["YES", "NO"],
      deadline: spec.marketSpec.deadline,
      category: spec.marketSpec.category,
      resolution_source: spec.marketSpec.resolutionSource,
      resolution_rule: spec.marketSpec.resolutionRule,
      edge_cases: spec.marketSpec.edgeCases,
    },
    critic: {
      objections: spec.critic.objections,
      ambiguity_risk: spec.critic.ambiguityRisk,
      suggested_fixes: spec.critic.suggestedFixes,
    },
    judge: {
      verdict:
        spec.judge.verdict === "published" || spec.judge.verdict === "challenged"
          ? "blessed"
          : spec.judge.verdict,
      final_question: spec.judge.finalQuestion,
      final_resolution_rule: spec.judge.finalResolutionRule,
      reasoning: spec.judge.reasoning,
      confidence: spec.judge.confidence,
    },
    scores: {
      quality: spec.scores.quality,
      tradability: spec.scores.tradability,
      resolution_clarity: spec.scores.resolutionClarity,
      ambiguity: spec.scores.ambiguity,
    },
    agent_trace: {
      forger: { ...(spec.agentTrace[0] ?? {}) },
      critic: { ...(spec.agentTrace[1] ?? {}) },
      judge: { ...(spec.agentTrace[2] ?? {}) },
    },
  };
}

export function ForgePage() {
  const { configured, user, profile } = useAuthState();
  const [claim, setClaim] = useState(featuredSpec.sourceClaim);
  const [sourceType, setSourceType] = useState<SourceType>("manual");
  const [isForging, setIsForging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState<"credit" | "mock" | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(forgePhases.length - 1);
  const [forgeResponse, setForgeResponse] = useState<ForgeResponse | null>(
    null,
  );
  const [responseMode, setResponseMode] = useState<"live" | "demo" | null>(
    null,
  );
  const [modeWarning, setModeWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedHash, setSavedHash] = useState<string | null>(null);
  const [rewardToast, setRewardToast] = useState<{
    creditsDelta: number;
    reputationDelta: number;
    badgesAwarded: string[];
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isForging) {
      return;
    }

    const interval = window.setInterval(() => {
      setPhaseIndex((current) => Math.min(current + 1, 2));
    }, 900);

    return () => window.clearInterval(interval);
  }, [isForging]);

  const previewSpec = useMemo(() => {
    if (forgeResponse) {
      return responseToRecord(forgeResponse, savedHash);
    }

    return {
      ...featuredSpec,
      sourceClaim: claim,
      sourceType,
    };
  }, [claim, forgeResponse, savedHash, sourceType]);

  const jsonPreview = forgeResponse ?? recordToPreviewResponse(previewSpec);
  const activePhase = forgePhases[phaseIndex];
  const freeForgesUsed = profile?.freeForgeUsed ?? 0;
  const freeForgesRemaining = Math.max(0, FREE_FORGE_LIMIT - freeForgesUsed);
  const creditBalance = profile?.credits ?? 0;
  const paymentBadgeState =
    !configured || !firebaseReady()
      ? "disabled"
      : freeForgesRemaining > 0
        ? "mock-unlocked"
        : creditBalance > 0
          ? "credit"
          : "required";

  async function executeForge() {
    setIsForging(true);
    setPhaseIndex(0);
    setError(null);
    setModeWarning(null);
    setForgeResponse(null);
    setResponseMode(null);
    setSaveMessage(null);
    setSavedHash(null);

    try {
      const response = await fetch("/api/forge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          claim,
          sourceType,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : "The AI Court request failed.";
        throw new Error(message);
      }

      const parsed = ForgeResponseSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error("The API returned an invalid MarketSpec payload.");
      }

      setForgeResponse(parsed.data);
      setResponseMode(
        response.headers.get("x-vericlaim-mode") === "live" ? "live" : "demo",
      );
      setModeWarning(response.headers.get("x-vericlaim-warning"));
      setSaveMessage(null);
      setSavedHash(null);
      setPhaseIndex(3);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The AI Court failed unexpectedly.",
      );
      setPhaseIndex(3);
    } finally {
      setIsForging(false);
    }
  }

  async function runForge() {
    if (!claim.trim() || claim.length > 5000 || isForging || unlockBusy) {
      return;
    }

    if (!configured || !firebaseReady()) {
      await executeForge();
      return;
    }

    if (!user) {
      setError("Sign in with Google or demo auth before using metered Forge.");
      return;
    }

    if (!profile) {
      setError("User profile is still loading. Try again in a moment.");
      return;
    }

    if (profile.freeForgeUsed < FREE_FORGE_LIMIT) {
      setUnlockBusy("mock");

      try {
        await consumeFreeForgeUse(user);
        await executeForge();
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not unlock this free Forge run.",
        );
      } finally {
        setUnlockBusy(null);
      }
      return;
    }

    setPaymentModalOpen(true);
  }

  async function runForgeAfterCreditUnlock() {
    if (!user) {
      setError("Sign in before spending Forge Credits.");
      return;
    }

    setUnlockBusy("credit");
    setError(null);

    try {
      await spendForgeCreditForUnlock(user);
      setPaymentModalOpen(false);
      setRewardToast({
        creditsDelta: -1,
        reputationDelta: 0,
        badgesAwarded: [],
        message: "Forge Credit spent",
      });
      window.setTimeout(() => setRewardToast(null), 3200);
      await executeForge();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not spend this Forge Credit.",
      );
    } finally {
      setUnlockBusy(null);
    }
  }

  async function runForgeAfterMockPayment() {
    if (!user) {
      setError("Sign in before using mock x402.");
      return;
    }

    setUnlockBusy("mock");
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          type: "forge_unlock",
          mode: "mock_x402",
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : "Mock x402 unlock failed.";
        throw new Error(message);
      }

      const parsed = PaymentResponseSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error("Mock x402 returned an invalid receipt.");
      }

      await saveMockPaymentUnlock(user, parsed.data);
      setPaymentModalOpen(false);
      setRewardToast({
        creditsDelta: 0,
        reputationDelta: 0,
        badgesAwarded: [],
        message: "Mock x402 payment completed",
      });
      window.setTimeout(() => setRewardToast(null), 3200);
      await executeForge();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not complete the mock x402 payment.",
      );
    } finally {
      setUnlockBusy(null);
    }
  }

  function selectSampleClaim(nextClaim: string) {
    setClaim(nextClaim);
    setForgeResponse(null);
    setResponseMode(null);
    setModeWarning(null);
    setError(null);
    setSaveMessage(null);
    setSavedHash(null);
    setPaymentModalOpen(false);
    setPhaseIndex(forgePhases.length - 1);
  }

  async function saveGeneratedSpec() {
    if (!forgeResponse) {
      return;
    }

    if (!configured || !firebaseReady()) {
      setError("Firebase is not configured. Add Firebase env vars before saving.");
      return;
    }

    if (!user) {
      setError("Sign in with Google or demo auth before saving a MarketSpec.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const result = await saveMarketSpec(previewSpec, user);
      const rewardText = result.reputationAwarded || result.creditAwarded
        ? ` +${result.reputationAwarded} reputation, +${result.creditAwarded} credits.`
        : "";
      setSavedHash(result.hash);
      setSaveMessage(
        result.alreadyExisted
          ? "This MarketSpec already exists. Public page is ready."
          : result.agentRunSaved
            ? `MarketSpec saved with agent run trace.${rewardText}`
            : `MarketSpec saved. Agent trace is embedded in the public spec.${rewardText}`,
      );
      setRewardToast({
        creditsDelta: result.creditAwarded,
        reputationDelta: result.reputationAwarded,
        badgesAwarded: result.badgesAwarded,
        message: "Forge reward",
      });
      window.setTimeout(() => setRewardToast(null), 3200);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save MarketSpec.",
      );
    } finally {
      setIsSaving(false);
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
      <PaymentModal
        open={paymentModalOpen}
        credits={creditBalance}
        priceUsd={X402_PRICE_USD}
        busy={unlockBusy}
        onClose={() => setPaymentModalOpen(false)}
        onUseCredit={runForgeAfterCreditUnlock}
        onMockPayment={runForgeAfterMockPayment}
      />
      <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="blue">REQ-FORGE-004</Badge>
            <Badge variant={responseMode === "live" ? "success" : "glass"}>
              {responseMode === "live"
                ? "Live AI Court"
                : responseMode === "demo"
                  ? "Demo fallback validated"
                  : "API ready"}
            </Badge>
            <X402PaymentBadge state={paymentBadgeState} />
          </div>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">
            Forge a MarketSpec.
          </h1>
          <p className="text-muted-foreground">
            Paste a messy claim, choose a source type, and run the AI Court.
            Gemini forges, Groq critiques, and the Judge returns a validated
            MarketSpec or deterministic demo fallback. First 3 Forge runs are
            free; later runs use 1 Forge Credit or a mock x402 unlock.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success" className="gap-1.5">
            <Coins className="size-3.5" />
            {profile ? creditBalance : 100} Forge Credits
          </Badge>
          <Badge variant="blue" className="gap-1.5">
            <BadgeDollarSign className="size-3.5" />
            {freeForgesRemaining} free forges left
          </Badge>
          <Badge variant="violet" className="gap-1.5">
            <BadgeCheck className="size-3.5" />
            +2 rep per forge
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
                onChange={(event) => {
                  setClaim(event.target.value);
                  setError(null);
                }}
                placeholder="Paste a claim from Discord, a tweet, article, GitHub signal, or a manual market idea."
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
                      {sourceLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Sample claims</p>
              <SampleClaimChips onSelect={selectSampleClaim} />
            </div>

            <div className="rounded-md border border-violet-400/25 bg-violet-400/10 p-3 text-sm leading-6 text-muted-foreground">
              <div className="mb-2 flex flex-wrap gap-2">
                <X402PaymentBadge state={paymentBadgeState} />
                <Badge variant="glass">
                  {freeForgesUsed}/{FREE_FORGE_LIMIT} free used
                </Badge>
              </div>
              VeriClaim currently uses mock x402. Real payment support is
              planned, and no real money moves.
            </div>

            {error ? (
              <div className="flex gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {modeWarning ? (
              <div className="flex gap-3 rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{modeWarning}</span>
              </div>
            ) : null}

            <Button
              type="button"
              variant="court"
              size="lg"
              disabled={!claim.trim() || claim.length > 5000 || isForging || unlockBusy !== null}
              onClick={runForge}
              className="w-full"
            >
              {isForging || unlockBusy ? (
                <>
                  <Loader2 className="animate-spin" />
                  {isForging ? "Running AI Court" : "Unlocking Forge"}
                </>
              ) : (
                <>
                  <Play />
                  Generate MarketSpec
                </>
              )}
            </Button>

            {forgeResponse ? (
              <div className="space-y-3 rounded-lg border border-border/70 bg-background/55 p-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isSaving || !user || !configured}
                  onClick={saveGeneratedSpec}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Saving MarketSpec
                    </>
                  ) : (
                    <>
                      <Save />
                      Save MarketSpec
                    </>
                  )}
                </Button>
                {!user ? (
                  <p className="text-xs leading-5 text-muted-foreground">
                    Sign in from the header with Google or demo auth to save.
                  </p>
                ) : null}
                {saveMessage ? (
                  <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                    {saveMessage}
                    {savedHash ? (
                      <Button
                        asChild
                        variant="link"
                        className="ml-2 h-auto p-0 text-emerald-700 dark:text-emerald-300"
                      >
                        <Link href={getSpecUrlPath(savedHash, previewSpec.slug)}>
                          Open public page
                          <ExternalLink />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
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
              <Progress value={activePhase.progress} />
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
            <MarketSpecCard
              spec={previewSpec}
              compact
              showOpen={Boolean(savedHash)}
            />
            <JSONPreview
              title={
                forgeResponse
                  ? "Validated API response"
                  : "Validated preview shape"
              }
              data={jsonPreview}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
