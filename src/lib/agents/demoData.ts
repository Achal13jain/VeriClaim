import type { ForgeRequest, ForgeResponse } from "@/lib/agents/schemas";
import {
  extractExplicitDeadline,
  fallbackFutureDeadline,
  inferRelativeDeadline,
  longDate,
} from "@/lib/agents/dateRules";
import {
  appendEntityListsToResolutionRule,
  extractLongParentheticalEntityLists,
  stripLongParentheticalEntityLists,
} from "@/lib/agents/questionReadability";
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

  if (
    (lower.includes("layer 2") || lower.includes("l2")) &&
    lower.includes("tvl")
  ) {
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

  if (lower.includes("gemini") || lower.includes("computer-use")) {
    return "AI Product Release";
  }

  if (lower.includes("browser")) {
    return "Consumer Software";
  }

  if (lower.includes("siri") || lower.includes("apple")) {
    return "Consumer AI";
  }

  if (lower.includes("x402") || lower.includes("defi analytics")) {
    return "Crypto Infrastructure";
  }

  if (lower.includes("repo rate") || lower.includes("rbi")) {
    return "Central Bank Policy";
  }

  return "Public Signals";
}

function inferDeadline(claim: string) {
  return (
    extractExplicitDeadline(claim)?.deadline ??
    inferRelativeDeadline(claim)?.deadline ??
    fallbackFutureDeadline()
  );
}

function formatUsdTarget(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function extractUsdTarget(claim: string) {
  const match = claim.match(/\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\b/i);

  if (!match) {
    return null;
  }

  const base = Number(match[1].replace(/,/g, ""));
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

function arcMainnetSpec(deadline: string) {
  const deadlineText = longDate(deadline);

  return {
    canonicalClaim: `Arc mainnet becomes publicly available before ${deadlineText}`,
    question: `Will Arc mainnet become publicly available before ${deadlineText}?`,
    resolutionSource: "Official Arc or Circle announcement",
    resolutionRule: `Resolves YES if Arc or Circle publicly announces that Arc mainnet is live and generally available before 23:59 UTC on ${deadlineText}. Testnets, private betas, devnets, or partner-only pilots do not count. Otherwise resolves NO.`,
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

function x402DefiAnalyticsSpec(deadline: string) {
  const deadlineText = longDate(deadline);

  return {
    canonicalClaim: `A public DeFi analytics platform launches x402-gated API access before ${deadlineText}`,
    question: `Will a public DeFi analytics platform launch x402-gated API access before ${deadlineText}?`,
    resolutionSource:
      "Official documentation, changelog, pricing page, or announcement from the DeFi analytics platform",
    resolutionRule: `Resolves YES if a public DeFi analytics platform officially launches API access before 23:59 UTC on ${deadlineText} where x402 is used as the payment or access-control mechanism for API requests. The qualifying source must be the platform's official documentation, changelog, pricing page, blog, or verified social account. Generic subscription billing without x402 support does not count. Otherwise resolves NO.`,
    edgeCases: [
      "The platform must provide DeFi market, protocol, liquidity, wallet, or onchain analytics to public users.",
      "A private pilot, waitlist, or non-public partner integration does not count unless public API access is available.",
      "Mentions of planned x402 support do not count unless the API access is launched or officially made available.",
    ],
  };
}

function appleSiriSpec(deadline: string) {
  const deadlineText = longDate(deadline);

  return {
    canonicalClaim: `Apple announces a major Siri upgrade with agent-like task execution before ${deadlineText}`,
    question: `Will Apple announce a major Siri upgrade with agent-like task execution before ${deadlineText}?`,
    resolutionSource:
      "Apple Newsroom, Apple developer documentation, official Apple press release, or public Apple keynote",
    resolutionRule: `Resolves YES if Apple officially announces before 23:59 UTC on ${deadlineText} a Siri upgrade that can execute multi-step tasks or agent-like actions across apps, settings, or services. Vague statements about a smarter Siri, rumors, leaks, or third-party reports without official Apple confirmation do not count. Otherwise resolves NO.`,
    edgeCases: [
      "A minor Siri UI update, speech-quality improvement, or search enhancement does not count by itself.",
      "The announcement must describe task execution, multi-step assistance, or cross-app action capabilities.",
      "Features limited to a private beta count only if Apple publicly announces the capability before the deadline.",
    ],
  };
}

function geminiComputerUseSpec(deadline: string) {
  const deadlineText = longDate(deadline);

  return {
    canonicalClaim: `Google releases a Gemini model with native computer-use capabilities before ${deadlineText}`,
    question: `Will Google release a Gemini model with native computer-use capabilities before ${deadlineText}?`,
    resolutionSource:
      "Official Google AI blog, Gemini API documentation, Google product announcement, or Google Cloud release notes",
    resolutionRule: `Resolves YES if Google officially releases or makes publicly available before 23:59 UTC on ${deadlineText} a Gemini model that can directly operate computer interfaces, tools, browsers, or applications as a native model capability. Research demos, private tests, or third-party wrappers do not count without public Google release documentation. Otherwise resolves NO.`,
    edgeCases: [
      "A model that only writes code or instructions for a human to execute does not count.",
      "A browser-only assistant counts only if Google describes it as native computer-use or tool-use capability for Gemini.",
      "Private trusted-tester access does not count unless Google publicly documents availability.",
    ],
  };
}

function githubStarsSpec(input: ForgeRequest, deadline: string) {
  const deadlineText = longDate(deadline);
  const starTarget =
    input.claim.match(/\b(\d[\d,]*)\s*(?:github\s+)?stars?\b/i)?.[1] ??
    "100,000";

  return {
    canonicalClaim: `An open-source AI agent framework reaches ${starTarget} GitHub stars before ${deadlineText}`,
    question: `Will an open-source AI agent framework reach ${starTarget} GitHub stars before ${deadlineText}?`,
    resolutionSource: "GitHub repository star counts",
    resolutionRule: `Resolves YES if any public open-source repository primarily marketed as an AI agent framework reaches at least ${starTarget} GitHub stars before 23:59 UTC on ${deadlineText}, according to GitHub's displayed repository star count or GitHub API data. General machine-learning libraries that are not primarily agent frameworks do not count. Otherwise resolves NO.`,
    edgeCases: [
      "If a project changes repository URLs, use the repository identified by the maintainers as the primary project repository.",
      "Archived, deleted, or private repositories count only up to the last publicly verifiable GitHub star count before access changed.",
      "If GitHub corrects artificial star inflation, use the corrected star count.",
    ],
  };
}

function claimLooksLikeLayer2TvlRanking(claim: string) {
  return (
    /\b(top[-\s]?(five|5)|top\s*5)\b/i.test(claim) &&
    /\b(layer\s*2|l2)\b/i.test(claim) &&
    /\btvl\b/i.test(claim)
  );
}

function layer2TvlUsdcSpec(deadline: string) {
  const deadlineText = longDate(deadline);

  return {
    canonicalClaim: `At least one top-five Layer 2 network by TVL on L2Beat as of market creation announces native USDC settlement before ${deadlineText}`,
    question: `Will any Layer 2 network ranked in the top five by TVL on L2Beat as of market creation announce native USDC settlement before ${deadlineText}?`,
    resolutionSource:
      "L2Beat Layer 2 TVL rankings as of market creation, plus official project announcements",
    resolutionRule: `Resolves YES if at least one Layer 2 network ranked in the top five by TVL on L2Beat as of market creation publishes an official announcement before 23:59 UTC on ${deadlineText}, stating support for native USDC settlement. Valid sources include the project's official blog, documentation, governance forum, or verified social account. Otherwise resolves NO.`,
    edgeCases: [
      "The eligible set is fixed to the top five Layer 2 networks by TVL on L2Beat as of market creation.",
      "Announcements must come from an official project blog, documentation, governance forum, or verified social account.",
      "Bridged USDC, third-party integrations, rumors, or vague statements about future support do not count unless the announcement clearly states native USDC settlement.",
      "If L2Beat is unavailable at market creation, DefiLlama Layer 2 TVL rankings may be used only if the saved spec records the snapshot source and time.",
    ],
  };
}

function claimLooksLikeBrowserAgentFeature(claim: string) {
  return (
    /\b(browser|chrome|edge|safari|firefox|opera|brave)\b/i.test(claim) &&
    /\b(ai agent|agent browsing|browsing feature|built[- ]in ai)\b/i.test(
      claim,
    )
  );
}

function claimLooksTooVagueForMarketSpec(claim: string) {
  return (
    /\bmoon soon\b/i.test(claim) ||
    /\bai will replace developers\b/i.test(claim) ||
    /\bmarket will crash\b/i.test(claim) ||
    /\bbig company\b.+\bsomething\b/i.test(claim) ||
    /\bcrypto\b.+\bmainstream\b/i.test(claim)
  );
}

function vagueClaimSpec(input: ForgeRequest, deadline: string) {
  const deadlineText = longDate(deadline);
  const cleanClaim = input.claim.trim().replace(/[.?!]+$/, "");

  return {
    canonicalClaim: `${cleanClaim} needs objective clarification before it can become a MarketSpec`,
    question: `Can this claim be resolved objectively as written before ${deadlineText}?`,
    resolutionSource:
      "No objective source can be selected until the claim defines a specific entity, metric, threshold, and deadline",
    resolutionRule:
      "This claim should not be published as written. It needs a named entity set, measurable threshold, objective resolution source, and explicit deadline before a YES/NO MarketSpec can resolve it fairly.",
    edgeCases: [
      "Subjective phrases such as moon, replace developers, crash, big company, or mainstream are not resolution criteria by themselves.",
      "A revised spec must define the exact metric, threshold, source, and settlement deadline.",
      "The fallback response rejects the claim as written rather than inventing missing facts.",
    ],
  };
}

function browserAgentFeatureSpec(input: ForgeRequest, deadline: string) {
  const deadlineText = longDate(deadline);
  const qualifyingBrowsers =
    extractLongParentheticalEntityLists(input.claim)[0] ??
    "Google Chrome, Microsoft Edge, Apple Safari, Mozilla Firefox, Opera, and Brave";

  return {
    canonicalClaim: `At least one major web browser announces a built-in AI agent browsing feature before ${deadlineText}`,
    question: `Will at least one major web browser announce a built-in AI agent browsing feature before ${deadlineText}?`,
    resolutionSource:
      "Official browser vendor announcement, release notes, product documentation, or verified company blog",
    resolutionRule: `Resolves YES if one qualifying browser vendor officially announces or releases a built-in AI agent browsing feature before 23:59 UTC on ${deadlineText}. Qualifying entities: ${qualifyingBrowsers}. The feature must be built into the browser or its official browser assistant, not only a third-party extension. Otherwise resolves NO.`,
    edgeCases: [
      "A third-party extension or plugin does not count unless it is officially bundled or announced by the browser vendor.",
      "Private experiments, leaks, or roadmap rumors do not count without an official vendor source.",
      `Qualifying entity list for this market: ${qualifyingBrowsers}.`,
    ],
  };
}

function specializedSpec(input: ForgeRequest, deadline: string) {
  const lowerClaim = input.claim.toLowerCase();

  if (claimLooksTooVagueForMarketSpec(input.claim)) {
    return vagueClaimSpec(input, deadline);
  }

  if (claimLooksLikeLayer2TvlRanking(input.claim)) {
    return layer2TvlUsdcSpec(deadline);
  }

  if (claimLooksLikeBrowserAgentFeature(input.claim)) {
    return browserAgentFeatureSpec(input, deadline);
  }

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
    lowerClaim.includes("mainnet")
  ) {
    return /\bbefore\s+q4\b/i.test(lowerClaim)
      ? arcBeforeQ4Spec(deadline)
      : arcMainnetSpec(deadline);
  }

  if (lowerClaim.includes("india") && lowerClaim.includes("repo rate")) {
    return indiaRepoRateSpec(deadline);
  }

  if (lowerClaim.includes("x402") && lowerClaim.includes("defi")) {
    return x402DefiAnalyticsSpec(deadline);
  }

  if (lowerClaim.includes("apple") && lowerClaim.includes("siri")) {
    return appleSiriSpec(deadline);
  }

  if (lowerClaim.includes("google") && lowerClaim.includes("gemini")) {
    return geminiComputerUseSpec(deadline);
  }

  if (lowerClaim.includes("github") && lowerClaim.includes("stars")) {
    return githubStarsSpec(input, deadline);
  }

  return null;
}

function inferGenericResolutionSource(claim: string) {
  const lowerClaim = claim.toLowerCase();

  if (lowerClaim.includes("cpi") || lowerClaim.includes("bls")) {
    return "U.S. Bureau of Labor Statistics CPI releases";
  }

  if (lowerClaim.includes("federal reserve") || lowerClaim.includes("fed")) {
    return "Federal Reserve FOMC statements, implementation notes, and official target-rate releases";
  }

  if (lowerClaim.includes("icc") || lowerClaim.includes("tournament")) {
    return "International Cricket Council official tournament results";
  }

  if (lowerClaim.includes("premier league")) {
    return "Premier League official table and match results";
  }

  if (lowerClaim.includes("netflix")) {
    return "Netflix Top 10 public rankings";
  }

  if (lowerClaim.includes("apple") || lowerClaim.includes("vision pro")) {
    return "Apple Newsroom, Apple product pages, or official Apple event announcements";
  }

  if (lowerClaim.includes("github") || lowerClaim.includes("stars")) {
    return "GitHub repository star counts or GitHub API data";
  }

  if (lowerClaim.includes("version") || lowerClaim.includes("v1.0")) {
    return "Official project release notes, GitHub releases, npm package metadata, or documentation";
  }

  if (lowerClaim.includes("mcp") || lowerClaim.includes("registry")) {
    return "Official registry listing, registry API, or public registry documentation";
  }

  if (lowerClaim.includes("cloud provider") || lowerClaim.includes("x402")) {
    return "Official cloud provider documentation, changelog, pricing page, or product announcement";
  }

  if (lowerClaim.includes("circle") || lowerClaim.includes("usdc")) {
    return "Circle official announcements, Circle documentation, or verified network announcements";
  }

  if (lowerClaim.includes("users") || lowerClaim.includes("monthly active")) {
    return "Official company announcement, product metrics report, regulatory filing, or audited usage report";
  }

  return "Official announcement, official documentation, verified public dataset, or regulator/organizer source for the named claim domain";
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
  const cleanClaim = input.claim.trim().replace(/\s+/g, " ").replace(/[.?!]+$/, "");
  const canonicalClaim =
    tailoredSpec?.canonicalClaim ?? canonicalizeClaim(input.claim, deadline);
  const question =
    tailoredSpec?.question ??
    `Will the claim "${cleanClaim}" be objectively confirmed by ${longDate(deadline)}?`;
  const resolutionSource =
    tailoredSpec?.resolutionSource ?? inferGenericResolutionSource(input.claim);
  const resolutionRule =
    tailoredSpec?.resolutionRule ??
    `Resolves YES only if the selected resolution source objectively confirms this source claim before 23:59 UTC on ${longDate(deadline)}: "${cleanClaim}". Rumors, anonymous posts, prediction-market prices, or subjective interpretations do not count. Resolves NO if the deadline passes without qualifying confirmation.`;
  const edgeCases =
    tailoredSpec?.edgeCases ?? [
      "Unofficial leaks, deleted posts, or screenshots do not count unless later confirmed by a primary source.",
      "Partial rollouts, private betas, or ambiguous previews do not count unless the final rule explicitly includes them.",
      "If the source is unavailable at deadline, use the latest archived primary-source record available before settlement.",
    ];
  const entityLists = extractLongParentheticalEntityLists(input.claim);
  const readableQuestion = stripLongParentheticalEntityLists(question);
  const readableResolutionRule = appendEntityListsToResolutionRule(
    resolutionRule,
    entityLists,
  );
  const readableEdgeCases = [
    ...edgeCases,
    ...entityLists
      .map((list) => `Qualifying entity list for this market: ${list}.`)
      .filter((edgeCase) => !edgeCases.includes(edgeCase)),
  ];
  const isLayer2TvlRanking = claimLooksLikeLayer2TvlRanking(input.claim);
  const isVagueClaim = claimLooksTooVagueForMarketSpec(input.claim);

  const response: ForgeResponse = {
    source_claim: input.claim,
    canonical_claim: canonicalClaim,
    source_type: input.sourceType,
    market_spec: {
      question: readableQuestion,
      outcomes: ["YES", "NO"],
      deadline,
      category,
      resolution_source: resolutionSource,
      resolution_rule: readableResolutionRule,
      edge_cases: readableEdgeCases,
    },
    critic: {
      objections: isVagueClaim
        ? [
            "The claim lacks objective resolution criteria.",
            "The claim needs a named entity set, measurable threshold, source, and deadline before publication.",
          ]
        : isLayer2TvlRanking
          ? [
              "The original claim needs a fixed ranking source for top-five Layer 2 TVL.",
              "The original claim needs a ranking snapshot time so the eligible networks cannot change during the market.",
            'The word "support" can be vague unless the announcement states native USDC settlement.',
            "The acceptable announcement sources must be limited to official project channels.",
          ]
        : [
            "The original claim may not name a precise resolution source.",
            "The deadline and qualifying evidence need to be explicit to avoid subjective settlement.",
          ],
      ambiguity_risk: isVagueClaim || isLayer2TvlRanking ? "high" : "medium",
      suggested_fixes: isVagueClaim
        ? [
            "Rewrite the claim with a specific metric, source, threshold, and deadline.",
            "Use needs_revision or rejected until those details are supplied.",
          ]
        : isLayer2TvlRanking
          ? [
              "Use L2Beat as the ranking source and freeze the top-five set as of market creation.",
              "Require official project blog, documentation, governance forum, or verified social account evidence.",
            `Preserve the explicit deadline ${longDate(deadline)}.`,
          ]
        : [
            "Use a named primary source or authoritative dataset.",
            "Define what counts as public confirmation before the deadline.",
          ],
    },
    judge: {
      verdict: isVagueClaim ? "rejected" : "needs_revision",
      final_question: readableQuestion,
      final_resolution_rule: readableResolutionRule,
      reasoning: isVagueClaim
        ? [
            "The claim is too vague to settle objectively without adding facts not present in the claim.",
            "The fallback response rejects the claim as written and asks for a measurable rewrite.",
          ]
        : [
            "The demo fallback produced a binary, time-bound, and externally resolvable draft.",
            "The spec still asks for human review of the exact source before publication.",
          ],
      confidence: isVagueClaim ? 82 : 78,
    },
    scores: {
      quality: isVagueClaim ? 38 : isLayer2TvlRanking ? 68 : 82,
      tradability: isVagueClaim ? 35 : isLayer2TvlRanking ? 60 : 76,
      resolution_clarity: isVagueClaim ? 35 : isLayer2TvlRanking ? 70 : 80,
      ambiguity: isVagueClaim ? 88 : isLayer2TvlRanking ? 72 : 24,
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
  {
    claim:
      "At least one top-five Layer 2 network by TVL will announce native USDC settlement before November 30, 2026.",
    sourceType: "manual",
  },
] satisfies ForgeRequest[];
