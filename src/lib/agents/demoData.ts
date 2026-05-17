import type { ForgeRequest, ForgeResponse } from "@/lib/agents/schemas";
import {
  fallbackFutureDeadline,
  inferRelativeDeadline,
  longDate,
} from "@/lib/agents/dateRules";
import { ForgeResponseSchema } from "@/lib/agents/schemas";

function inferCategory(claim: string) {
  const lower = claim.toLowerCase();

  if (
    lower.includes("bitcoin") ||
    lower.includes("btc") ||
    lower.includes("crypto")
  ) {
    return "Cryptocurrency Price";
  }

  if (lower.includes("arc") || lower.includes("mainnet")) {
    return "Crypto Infrastructure";
  }

  if (lower.includes("cpi") || lower.includes("inflation")) {
    return "Macroeconomic Data";
  }

  if (lower.includes("github") || lower.includes("release")) {
    return "Developer Signals";
  }

  if (lower.includes("openai") || lower.includes("gpt")) {
    return "AI Product Release";
  }

  if (lower.includes("repo rate") || lower.includes("rbi")) {
    return "Central Bank Policy";
  }

  return "Public Signals";
}

function inferDeadline(claim: string) {
  return inferRelativeDeadline(claim)?.deadline ?? fallbackFutureDeadline();
}

function formatUsdTarget(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function extractUsdTarget(claim: string) {
  const match = claim.match(/\$?\s*(\d+(?:\.\d+)?)\s*(k|m)?\b/i);

  if (!match) {
    return null;
  }

  const base = Number(match[1]);
  const multiplier =
    match[2]?.toLowerCase() === "m"
      ? 1_000_000
      : match[2]?.toLowerCase() === "k"
        ? 1_000
        : 1;

  return base * multiplier;
}

function bitcoinPriceSpec(input: ForgeRequest, deadline: string) {
  const target = extractUsdTarget(input.claim) ?? 150_000;
  const formattedTarget = `${formatUsdTarget(target)} USD`;
  const deadlineText = longDate(deadline);

  return {
    canonicalClaim: `Bitcoin reaches or exceeds ${formattedTarget} before ${deadlineText}`,
    question: `Will Bitcoin reach or exceed ${formattedTarget} before ${deadlineText}?`,
    resolutionSource: "CoinGecko BTC/USD daily price data",
    resolutionRule: `Resolves YES if Bitcoin reaches or exceeds ${formattedTarget} at any time before 23:59 UTC on ${deadlineText}, according to CoinGecko BTC/USD daily price data. Otherwise resolves NO.`,
    edgeCases: [
      "Use CoinGecko BTC/USD data only unless a future saved spec explicitly selects another public source.",
      "Stablecoin depegs, derivatives, prediction-market prices, and synthetic index prices do not count.",
      "If CoinGecko is unavailable at settlement, use the latest archived CoinGecko BTC/USD record available before the deadline.",
    ],
  };
}

function openAiReleaseSpec(deadline: string) {
  const deadlineText = longDate(deadline);

  return {
    canonicalClaim: `OpenAI releases GPT-6 before ${deadlineText}`,
    question: `Will OpenAI release GPT-6 before ${deadlineText}?`,
    resolutionSource: "Official OpenAI announcement, blog post, product page, or release notes",
    resolutionRule: `Resolves YES if OpenAI publicly announces or releases a model explicitly named GPT-6 before 23:59 UTC on ${deadlineText}. Rumors, third-party leaks, unrelated model names, or private previews do not count. Otherwise resolves NO.`,
    edgeCases: [
      "A model with a different official name does not count unless OpenAI explicitly identifies it as GPT-6.",
      "Private alpha, closed partner previews, or benchmark rumors do not count without public OpenAI confirmation.",
      "If OpenAI releases a successor under a renamed branding scheme, the source must explicitly connect it to GPT-6.",
    ],
  };
}

function arcBeforeQ4Spec(deadline: string) {
  const deadlineText = longDate(deadline);

  return {
    canonicalClaim: `Arc mainnet launches before ${deadlineText}`,
    question: `Will Arc mainnet launch before ${deadlineText}?`,
    resolutionSource: "Official Arc or Circle announcement",
    resolutionRule: `Resolves YES if Arc or Circle publicly announces that Arc mainnet is live and publicly available before 00:00 UTC on ${deadlineText}. Testnets, private betas, devnets, or partner-only pilots do not count. Otherwise resolves NO.`,
    edgeCases: [
      "A testnet upgrade does not count as mainnet launch.",
      "Private or invite-only access does not count as public availability.",
      "If Arc is renamed, the announcement must clearly identify the renamed network as Arc mainnet.",
    ],
  };
}

function indiaRepoRateSpec(deadline: string) {
  const deadlineText = longDate(deadline);

  return {
    canonicalClaim: `Reserve Bank of India cuts the repo rate before ${deadlineText}`,
    question: `Will the Reserve Bank of India cut the repo rate before ${deadlineText}?`,
    resolutionSource: "Reserve Bank of India monetary policy statement or official RBI press release",
    resolutionRule: `Resolves YES if the Reserve Bank of India announces a reduction in the policy repo rate before 23:59 UTC on ${deadlineText}. Holds, hikes, liquidity operations, or non-repo-rate policy changes do not count. Otherwise resolves NO.`,
    edgeCases: [
      "A cut to a different policy rate does not count unless the repo rate is also reduced.",
      "Market expectations, analyst reports, or news rumors do not count without an official RBI release.",
      "If the announcement occurs in India Standard Time, convert the publication time to UTC for deadline comparison.",
    ],
  };
}

function specializedSpec(input: ForgeRequest, deadline: string) {
  const lowerClaim = input.claim.toLowerCase();

  if (
    (lowerClaim.includes("bitcoin") || lowerClaim.includes("btc")) &&
    (lowerClaim.includes("hit") ||
      lowerClaim.includes("reach") ||
      lowerClaim.includes("exceed"))
  ) {
    return bitcoinPriceSpec(input, deadline);
  }

  if (lowerClaim.includes("openai") && lowerClaim.includes("gpt-6")) {
    return openAiReleaseSpec(deadline);
  }

  if (
    lowerClaim.includes("arc") &&
    lowerClaim.includes("mainnet") &&
    /\bbefore\s+q4\b/i.test(lowerClaim)
  ) {
    return arcBeforeQ4Spec(deadline);
  }

  if (lowerClaim.includes("india") && lowerClaim.includes("repo rate")) {
    return indiaRepoRateSpec(deadline);
  }

  return null;
}

function canonicalizeClaim(claim: string, deadline: string) {
  const trimmed = claim.trim().replace(/\s+/g, " ");
  const withoutTrailing = trimmed.replace(/[.?!]+$/, "");

  return `${withoutTrailing} by ${deadline}`;
}

export function createDemoForgeResponse(
  input: ForgeRequest,
  reason = "Demo fallback mode used because live AI providers are not fully configured.",
): ForgeResponse {
  const deadline = inferDeadline(input.claim);
  const category = inferCategory(input.claim);
  const tailoredSpec = specializedSpec(input, deadline);
  const canonicalClaim =
    tailoredSpec?.canonicalClaim ?? canonicalizeClaim(input.claim, deadline);
  const question =
    tailoredSpec?.question ??
    `Will the claim "${input.claim.trim().replace(/[.?!]+$/, "")}" be objectively confirmed by ${deadline}?`;
  const resolutionSource =
    tailoredSpec?.resolutionSource ??
    "Official primary-source announcement or authoritative public dataset named in the final resolution rule";
  const resolutionRule =
    tailoredSpec?.resolutionRule ??
    "Resolves YES only if a primary source or authoritative public dataset confirms the claim before the deadline. Rumors, anonymous posts, prediction-market prices, or subjective interpretations do not count. Resolves NO if the deadline passes without qualifying confirmation.";
  const edgeCases =
    tailoredSpec?.edgeCases ?? [
      "Unofficial leaks, deleted posts, or screenshots do not count unless later confirmed by a primary source.",
      "Partial rollouts, private betas, or ambiguous previews do not count unless the final rule explicitly includes them.",
      "If the source is unavailable at deadline, use the latest archived primary-source record available before settlement.",
    ];

  const response: ForgeResponse = {
    source_claim: input.claim,
    canonical_claim: canonicalClaim,
    source_type: input.sourceType,
    market_spec: {
      question,
      outcomes: ["YES", "NO"],
      deadline,
      category,
      resolution_source: resolutionSource,
      resolution_rule: resolutionRule,
      edge_cases: edgeCases,
    },
    critic: {
      objections: [
        "The original claim may not name a precise resolution source.",
        "The deadline and qualifying evidence need to be explicit to avoid subjective settlement.",
      ],
      ambiguity_risk: "medium",
      suggested_fixes: [
        "Use a named primary source or authoritative dataset.",
        "Define what counts as public confirmation before the deadline.",
      ],
    },
    judge: {
      verdict: "needs_revision",
      final_question: question,
      final_resolution_rule: resolutionRule,
      reasoning: [
        "The demo fallback produced a binary, time-bound, and externally resolvable draft.",
        "The spec still asks for human review of the exact source before publication.",
      ],
      confidence: 78,
    },
    scores: {
      quality: 82,
      tradability: 76,
      resolution_clarity: 80,
      ambiguity: 24,
    },
    agent_trace: {
      forger: {
        mode: "demo",
        model: "deterministic-demo-forger",
        summary:
          "Converted the input claim into a binary MarketSpec with deadline, source, rule, and edge cases.",
        reason,
      },
      critic: {
        mode: "demo",
        model: "deterministic-demo-critic",
        summary:
          "Flagged weak source specificity and possible settlement ambiguity.",
        reason,
      },
      judge: {
        mode: "demo",
        model: "deterministic-demo-judge",
        summary:
          "Returned a safe needs_revision verdict with quality and ambiguity scores.",
        reason,
      },
    },
  };

  return ForgeResponseSchema.parse(response);
}

export const forgeDemoCases = [
  {
    claim: "Bitcoin will hit $150k this year",
    sourceType: "manual",
  },
  {
    claim: "OpenAI will release GPT-6 this year",
    sourceType: "manual",
  },
  {
    claim: "Arc mainnet launches before Q4",
    sourceType: "manual",
  },
  {
    claim: "India will cut repo rates next month",
    sourceType: "manual",
  },
] satisfies ForgeRequest[];
