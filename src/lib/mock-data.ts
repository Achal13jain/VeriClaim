import type {
  ActivityEvent,
  AgentProfile,
  ChartPoint,
  DashboardMetric,
  MarketSpecRecord,
} from "@/lib/types";

export const sampleClaims = [
  "Arc mainnet will launch before Q4 2026.",
  "A top-5 L2 will announce native USDC settlement before Devconnect.",
  "The next CPI print will be under 3.0% year over year.",
  "A major AI lab will release a public agent identity standard this summer.",
  "A public DeFi protocol will ship x402-gated analytics before year-end.",
];

export const mockAgents: AgentProfile[] = [
  {
    agentId: "forger-001",
    name: "VeriClaim Forger",
    role: "forger",
    modelProvider: "Gemini demo adapter",
    reputationScore: 942,
    validationCount: 138,
    identityMode: "ERC-8004 adapter",
    createdAt: "2026-05-01T10:00:00.000Z",
    specialties: ["claim normalization", "binary framing", "deadline design"],
    winRate: 92,
    latestVerdict: "Converted 41 messy claims into market-ready drafts.",
  },
  {
    agentId: "critic-001",
    name: "VeriClaim Critic",
    role: "critic",
    modelProvider: "Groq demo adapter",
    reputationScore: 881,
    validationCount: 126,
    identityMode: "ERC-8004 adapter",
    createdAt: "2026-05-01T10:05:00.000Z",
    specialties: ["ambiguity attacks", "source audits", "edge-case discovery"],
    winRate: 88,
    latestVerdict: "Flagged 19 vague launch claims before publication.",
  },
  {
    agentId: "judge-001",
    name: "VeriClaim Judge",
    role: "judge",
    modelProvider: "OpenAI/OpenRouter demo adapter",
    reputationScore: 1016,
    validationCount: 152,
    identityMode: "ERC-8004 adapter",
    createdAt: "2026-05-01T10:10:00.000Z",
    specialties: ["verdict synthesis", "quality scoring", "challenge rulings"],
    winRate: 94,
    latestVerdict: "Blessed 12 specs and sent 3 back for revision.",
  },
];

export const mockMarketSpecs: MarketSpecRecord[] = [
  {
    hash: "0x8f4b4c29d7f217e6b4d8119e5e52c1324fd2a1e93bd067f4d7b9aa2fbb61c90a",
    sourceClaim: "Arc mainnet will launch before Q4 2026.",
    canonicalClaim:
      "Arc mainnet will become publicly available before October 1, 2026.",
    sourceType: "manual",
    marketSpec: {
      question:
        "Will Arc mainnet become publicly available before October 1, 2026?",
      outcomes: ["YES", "NO"],
      deadline: "2026-10-01",
      category: "Crypto Infrastructure",
      resolutionSource: "Official Arc or Circle announcement",
      resolutionRule:
        "Resolves YES only if Arc mainnet is publicly available before the deadline. Testnet, devnet, invite-only pilots, or private beta access do not count.",
      edgeCases: [
        "A renamed public Arc chain counts if Circle identifies it as Arc mainnet.",
        "Testnet updates do not count.",
        "Private beta or partner-only access does not count.",
      ],
    },
    critic: {
      objections: [
        "The word launch was ambiguous because it could mean testnet, beta, or public mainnet.",
        "Resolution source needed a named official channel.",
      ],
      ambiguityRisk: "low",
      suggestedFixes: [
        "Use publicly available mainnet instead of launch.",
        "Require an official Arc or Circle announcement.",
      ],
    },
    judge: {
      verdict: "published",
      finalQuestion:
        "Will Arc mainnet become publicly available before October 1, 2026?",
      finalResolutionRule:
        "Resolves YES only if Arc mainnet is publicly available before the deadline. Testnet, devnet, invite-only pilots, or private beta access do not count.",
      reasoning: [
        "The final wording is binary, dated, and externally resolvable.",
        "The edge cases close common launch ambiguity.",
      ],
      confidence: 91,
    },
    scores: {
      quality: 94,
      tradability: 87,
      resolutionClarity: 96,
      ambiguity: 8,
    },
    agentTrace: [
      {
        agentId: "forger-001",
        role: "forger",
        title: "Drafted MarketSpec",
        summary:
          "Converted the social claim into a binary deadline-based infrastructure question.",
        status: "complete",
        score: 88,
      },
      {
        agentId: "critic-001",
        role: "critic",
        title: "Attacked launch ambiguity",
        summary:
          "Found that launch could mean testnet, beta, or mainnet and requested stricter wording.",
        status: "complete",
        score: 92,
      },
      {
        agentId: "judge-001",
        role: "judge",
        title: "Blessed and published",
        summary:
          "Accepted the revised public-mainnet wording and proof-ready metadata.",
        status: "complete",
        score: 94,
      },
    ],
    status: "published",
    createdBy: "demo-user",
    createdAt: "2026-05-15T14:22:00.000Z",
    arcPublished: true,
    arcTxHash:
      "0x7c21e0f26ad7ae0f5a55f454bf19fd8826c7d41bc4fd019cb46c8e2f04632a11",
    arcPublishedAt: "2026-05-15T14:31:00.000Z",
    arcMode: "mock",
    challengeCount: 3,
    rewardTotal: 42,
    requirementIds: ["REQ-LAND-003", "REQ-SPEC-002", "REQ-ARC-008"],
  },
  {
    hash: "0xb3c1e8a49cfd7f2e5a5a7c6179360e3f64d96f1b910b51716f092f17a616f477",
    sourceClaim:
      "A top-5 L2 will announce native USDC settlement before Devconnect.",
    canonicalClaim:
      "At least one L2 ranked top five by total value locked will announce native USDC settlement before November 16, 2026.",
    sourceType: "tweet",
    marketSpec: {
      question:
        "Will at least one top-five L2 by total value locked announce native USDC settlement before November 16, 2026?",
      outcomes: ["YES", "NO"],
      deadline: "2026-11-16",
      category: "Stablecoin Infrastructure",
      resolutionSource: "DefiLlama TVL ranking and official L2 or Circle posts",
      resolutionRule:
        "Resolves YES if an L2 that is top five by DefiLlama TVL at the announcement time officially announces native USDC settlement before the deadline.",
      edgeCases: [
        "Bridged USDC does not count.",
        "Rumors, leaks, and forum proposals do not count.",
        "If rankings differ by category, use all-chain DefiLlama TVL.",
      ],
    },
    critic: {
      objections: [
        "Top-five needs a timestamped ranking source.",
        "Native settlement needs to exclude bridged representations.",
      ],
      ambiguityRisk: "medium",
      suggestedFixes: [
        "Name DefiLlama and announcement-time ranking.",
        "Specify official L2 or Circle confirmation.",
      ],
    },
    judge: {
      verdict: "blessed",
      finalQuestion:
        "Will at least one top-five L2 by total value locked announce native USDC settlement before November 16, 2026?",
      finalResolutionRule:
        "Resolves YES if an L2 that is top five by DefiLlama TVL at the announcement time officially announces native USDC settlement before the deadline.",
      reasoning: [
        "The ranking source and timing are explicit.",
        "The rule excludes bridged USDC and non-official signals.",
      ],
      confidence: 84,
    },
    scores: {
      quality: 88,
      tradability: 82,
      resolutionClarity: 89,
      ambiguity: 18,
    },
    agentTrace: [
      {
        agentId: "forger-001",
        role: "forger",
        title: "Normalized L2 ranking",
        summary:
          "Bound the claim to DefiLlama TVL and converted the source to official announcements.",
        status: "complete",
        score: 86,
      },
      {
        agentId: "critic-001",
        role: "critic",
        title: "Separated native from bridged",
        summary:
          "Pressed for a rule that excludes bridged tokens and unofficial roadmap chatter.",
        status: "complete",
        score: 90,
      },
      {
        agentId: "judge-001",
        role: "judge",
        title: "Blessed with monitoring notes",
        summary:
          "Approved the spec with medium ambiguity risk due to ranking volatility.",
        status: "complete",
        score: 88,
      },
    ],
    status: "blessed",
    createdBy: "demo-user",
    createdAt: "2026-05-14T09:12:00.000Z",
    arcPublished: false,
    arcTxHash: null,
    arcPublishedAt: null,
    arcMode: null,
    challengeCount: 6,
    rewardTotal: 18,
    requirementIds: ["REQ-GALLERY-001", "REQ-COURT-002"],
  },
  {
    hash: "0xc5e33bd9f39a3e4ad9c8899d2b4b4e3e9d98c181871d399a335f1962cf7b19f1",
    sourceClaim:
      "The next CPI print will be under 3.0% year over year.",
    canonicalClaim:
      "The next U.S. CPI year-over-year headline inflation print published by BLS will be below 3.0%.",
    sourceType: "article",
    marketSpec: {
      question:
        "Will the next U.S. headline CPI year-over-year print published by BLS be below 3.0%?",
      outcomes: ["YES", "NO"],
      deadline: "2026-06-30",
      category: "Macroeconomic Data",
      resolutionSource: "U.S. Bureau of Labor Statistics CPI release",
      resolutionRule:
        "Resolves YES if the first published BLS headline CPI year-over-year percentage for the next release is below 3.0%. Later revisions do not alter settlement.",
      edgeCases: [
        "Use headline CPI, not core CPI.",
        "Use the first BLS publication, not media estimates.",
        "If publication is delayed, resolve when BLS publishes the release.",
      ],
    },
    critic: {
      objections: [
        "Next print needed a specific source and metric.",
        "Revisions could create settlement disputes.",
      ],
      ambiguityRisk: "low",
      suggestedFixes: [
        "Use first published BLS headline CPI.",
        "Ignore later revisions for settlement.",
      ],
    },
    judge: {
      verdict: "challenged",
      finalQuestion:
        "Will the next U.S. headline CPI year-over-year print published by BLS be below 3.0%?",
      finalResolutionRule:
        "Resolves YES if the first published BLS headline CPI year-over-year percentage for the next release is below 3.0%. Later revisions do not alter settlement.",
      reasoning: [
        "The spec is clear but has an active challenge around deadline handling.",
        "The challenge panel should preserve the current rule while the court reviews it.",
      ],
      confidence: 79,
    },
    scores: {
      quality: 83,
      tradability: 91,
      resolutionClarity: 87,
      ambiguity: 14,
    },
    agentTrace: [
      {
        agentId: "forger-001",
        role: "forger",
        title: "Specified BLS source",
        summary:
          "Converted a broad macro claim into an official BLS headline CPI rule.",
        status: "complete",
        score: 82,
      },
      {
        agentId: "critic-001",
        role: "critic",
        title: "Found revision risk",
        summary:
          "Requested first-publication settlement to avoid revision disputes.",
        status: "complete",
        score: 86,
      },
      {
        agentId: "judge-001",
        role: "judge",
        title: "Marked challenged",
        summary:
          "Kept the spec public while a deadline challenge awaits final ruling.",
        status: "reviewing",
        score: 83,
      },
    ],
    status: "challenged",
    createdBy: "demo-user",
    createdAt: "2026-05-13T16:40:00.000Z",
    arcPublished: true,
    arcTxHash:
      "0x12ff749251f8db66b50385ce41cc9ca19b94c9d127c763f0f987318553c41a71",
    arcPublishedAt: "2026-05-13T16:49:00.000Z",
    arcMode: "mock",
    challengeCount: 9,
    rewardTotal: 27,
    requirementIds: ["REQ-CHAL-001", "REQ-SPEC-008"],
  },
];

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Blessed specs",
    value: "128",
    delta: "+18 this week",
    tone: "green",
  },
  {
    label: "Arc proofs",
    value: "47",
    delta: "+9 mock proofs",
    tone: "blue",
  },
  {
    label: "Open challenges",
    value: "16",
    delta: "4 high-signal",
    tone: "amber",
  },
  {
    label: "Court reputation",
    value: "2,839",
    delta: "+241 net rep",
    tone: "violet",
  },
];

export const chartData: ChartPoint[] = [
  { label: "Mon", blessed: 18, challenged: 3, proofs: 5 },
  { label: "Tue", blessed: 22, challenged: 5, proofs: 8 },
  { label: "Wed", blessed: 16, challenged: 2, proofs: 6 },
  { label: "Thu", blessed: 27, challenged: 6, proofs: 11 },
  { label: "Fri", blessed: 31, challenged: 4, proofs: 13 },
  { label: "Sat", blessed: 14, challenged: 3, proofs: 4 },
];

export const activityEvents: ActivityEvent[] = [
  {
    id: "activity-001",
    title: "Mock Arc proof saved",
    detail: "Arc mainnet MarketSpec published to MVP proof history.",
    timestamp: "4 min ago",
    type: "proof",
  },
  {
    id: "activity-002",
    title: "Critic challenge accepted",
    detail: "Ambiguity around launch wording rewarded +10 reputation.",
    timestamp: "17 min ago",
    type: "challenge",
  },
  {
    id: "activity-003",
    title: "MarketSpec blessed",
    detail: "Native USDC settlement spec reached 88 quality score.",
    timestamp: "42 min ago",
    type: "forge",
  },
  {
    id: "activity-004",
    title: "Reward received",
    detail: "A public spec earned 12 Forge Credits from reviewers.",
    timestamp: "1 hr ago",
    type: "reward",
  },
];

export const leaderboard = [
  { name: "Achal", role: "Market Architect", reputation: 1240, credits: 186 },
  { name: "SpecSmith", role: "Ambiguity Hunter", reputation: 980, credits: 142 },
  { name: "CourtWatcher", role: "Top Critic", reputation: 875, credits: 120 },
  { name: "ProofPilot", role: "Arc Publisher", reputation: 812, credits: 98 },
];

export const featuredSpec = mockMarketSpecs[0];
