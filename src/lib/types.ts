import type { ArcProofMode } from "@/lib/arc/types";

export type SourceType =
  | "manual"
  | "discord"
  | "tweet"
  | "article"
  | "non_english"
  | "github_signal";

export type MarketSpecStatus =
  | "blessed"
  | "needs_revision"
  | "rejected"
  | "challenged"
  | "published";

export type AmbiguityRisk = "low" | "medium" | "high";

export type AgentRole = "forger" | "critic" | "judge";

export type AgentRunStatus = "complete" | "reviewing" | "pending";

export interface MarketSpecPayload {
  question: string;
  outcomes: string[];
  deadline: string;
  category: string;
  resolutionSource: string;
  resolutionRule: string;
  edgeCases: string[];
}

export interface CriticOutput {
  objections: string[];
  ambiguityRisk: AmbiguityRisk;
  suggestedFixes: string[];
}

export interface JudgeOutput {
  verdict: MarketSpecStatus;
  finalQuestion: string;
  finalResolutionRule: string;
  reasoning: string[];
  confidence: number;
}

export interface MarketSpecScores {
  quality: number;
  tradability: number;
  resolutionClarity: number;
  ambiguity: number;
}

export interface AgentTraceStep {
  agentId: string;
  role: AgentRole;
  title: string;
  summary: string;
  status: AgentRunStatus;
  score?: number;
}

export interface MarketSpecRecord {
  hash: string;
  slug?: string;
  sourceClaim: string;
  canonicalClaim: string;
  sourceType: SourceType;
  marketSpec: MarketSpecPayload;
  critic: CriticOutput;
  judge: JudgeOutput;
  scores: MarketSpecScores;
  agentTrace: AgentTraceStep[];
  status: MarketSpecStatus;
  createdBy: string;
  createdAt: string;
  arcPublished: boolean;
  arcTxHash: string | null;
  arcPublishedAt?: string | null;
  arcMode?: ArcProofMode | null;
  challengeCount: number;
  rewardTotal: number;
  requirementIds: string[];
}

export interface AgentProfile {
  agentId: string;
  name: string;
  role: AgentRole;
  modelProvider: string;
  reputationScore: number;
  validationCount: number;
  identityMode: "ERC-8004 adapter";
  createdAt: string;
  specialties: string[];
  winRate: number;
  latestVerdict: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  delta: string;
  tone: "blue" | "green" | "violet" | "amber";
}

export interface ActivityEvent {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: "forge" | "challenge" | "proof" | "reward" | "payment";
}

export interface LeaderboardUser {
  uid: string;
  displayName: string;
  photoURL: string;
  credits: number;
  reputation: number;
  level: string;
  badges: string[];
  blessedSpecs: number;
  challenges: number;
}

export interface ChartPoint {
  label: string;
  blessed: number;
  challenged: number;
  proofs: number;
}
