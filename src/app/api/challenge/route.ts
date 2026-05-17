import { NextRequest, NextResponse } from "next/server";

import { getJudgeModelConfig } from "@/lib/agents/modelConfig";
import { generateValidatedJson } from "@/lib/agents/providers";
import {
  ChallengeRequestSchema,
  ChallengeResponseSchema,
  type ChallengeRequest,
  type ChallengeResponse,
} from "@/lib/challenges/schemas";
import { calculateChallengeReward } from "@/lib/gamification/rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientId(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") ?? "local-dev";
}

function checkRateLimit(request: NextRequest) {
  const clientId = getClientId(request);
  const now = Date.now();
  const bucket = rateLimitBuckets.get(clientId);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - bucket.count };
}

function marketSpecText(request: ChallengeRequest) {
  return JSON.stringify(request.marketSpec, null, 2);
}

function deterministicChallengeFallback(
  request: ChallengeRequest,
): ChallengeResponse {
  const marketSpec = request.marketSpec as {
    question?: unknown;
    resolutionRule?: unknown;
    outcomes?: unknown;
  };
  const question =
    typeof marketSpec.question === "string"
      ? marketSpec.question
      : "Will the claim resolve YES under the clarified MarketSpec?";
  const resolutionRule =
    typeof marketSpec.resolutionRule === "string"
      ? marketSpec.resolutionRule
      : "Resolve using the named public source and the final clarified rule.";
  const outcomes = Array.isArray(marketSpec.outcomes)
    ? marketSpec.outcomes.map(String)
    : [];
  const notBinary =
    request.reasonCategory === "Not binary" &&
    (outcomes.length !== 2 || !outcomes.includes("YES") || !outcomes.includes("NO"));
  const clearFailure =
    request.reasonCategory === "Other" && request.challengeReason.length < 80;
  const ruling = clearFailure
    ? "rejected"
    : request.reasonCategory === "Missing edge case" ||
        request.reasonCategory === "Weak deadline" ||
        request.reasonCategory === "Bad resolution source"
      ? "needs_revision"
      : notBinary
        ? "accepted"
        : "accepted";
  const reward = calculateChallengeReward(ruling);

  return {
    ruling,
    summary:
      ruling === "rejected"
        ? "The challenge does not provide enough concrete resolution risk to overturn the spec."
        : "The challenge identifies a material MarketSpec quality issue that should be addressed before relying on the spec.",
    reasoning:
      ruling === "rejected"
        ? [
            "The objection is too general for the Judge to identify a concrete resolution failure.",
            "The current MarketSpec remains usable until a more specific challenge is filed.",
          ]
        : [
            `${request.reasonCategory} is a valid challenge category for prediction-market resolution quality.`,
            "The MarketSpec should make its question, deadline, source, and edge cases objectively auditable.",
          ],
    suggested_question:
      ruling === "rejected"
        ? question
        : question.replace(/\?$/, "") + " under the explicitly named public resolution source?",
    suggested_resolution_rule:
      ruling === "rejected"
        ? resolutionRule
        : `${resolutionRule} If the challenged ambiguity occurs, resolve according to the named source's first public final value and document the edge case before settlement.`,
    credit_delta: reward.creditsDelta,
    reputation_delta: reward.reputationDelta,
  };
}

function applyRuleDeltas(response: ChallengeResponse): ChallengeResponse {
  const reward = calculateChallengeReward(response.ruling);

  return {
    ...response,
    credit_delta: reward.creditsDelta,
    reputation_delta: reward.reputationDelta,
  };
}

async function runLiveJudge(request: ChallengeRequest) {
  const judge = getJudgeModelConfig();

  if (!judge) {
    return null;
  }

  const systemPrompt = `You are the VeriClaim Challenge Judge.
You do not create betting or trading advice.
You review whether a challenge exposes a real MarketSpec resolution failure.
Return only JSON matching the requested schema.
Rulings:
- accepted: the challenge shows a material flaw.
- needs_revision: the challenge is valid, but the spec can be repaired.
- rejected: the challenge is weak, vague, or does not affect objective resolution.`;

  const userPrompt = `Review this MarketSpec challenge.

MarketSpec hash:
${request.specHash}

MarketSpec:
${marketSpecText(request)}

Challenge category:
${request.reasonCategory}

Challenge reason:
${request.challengeReason}

Return this JSON shape:
{
  "ruling": "accepted | rejected | needs_revision",
  "summary": string,
  "reasoning": string[],
  "suggested_question": string,
  "suggested_resolution_rule": string,
  "credit_delta": number,
  "reputation_delta": number
}`;

  const response = await generateValidatedJson(
    judge,
    ChallengeResponseSchema,
    systemPrompt,
    userPrompt,
    "Challenge Judge",
  );

  return applyRuleDeltas(response);
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "Challenge rate limit reached. Please wait before running the Judge again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter ?? 60),
        },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedRequest = ChallengeRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        error: "Invalid challenge request.",
        issues: parsedRequest.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const liveResponse = await runLiveJudge(parsedRequest.data);

    return NextResponse.json(liveResponse ?? deterministicChallengeFallback(parsedRequest.data), {
      headers: {
        "x-vericlaim-mode": liveResponse ? "live" : "demo",
        "x-ratelimit-remaining": String(rateLimit.remaining),
      },
    });
  } catch {
    return NextResponse.json(deterministicChallengeFallback(parsedRequest.data), {
      headers: {
        "x-vericlaim-mode": "demo",
        "x-vericlaim-warning":
          "Live Judge failed. Returned deterministic demo challenge ruling.",
        "x-ratelimit-remaining": String(rateLimit.remaining),
      },
    });
  }
}
