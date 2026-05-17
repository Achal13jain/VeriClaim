import { z } from "zod";

export const sourceTypeValues = [
  "manual",
  "discord",
  "tweet",
  "article",
  "non_english",
  "github_signal",
] as const;

export const SourceTypeSchema = z.enum(sourceTypeValues);

export const ForgeRequestSchema = z
  .object({
    claim: z.string().trim().min(1, "Claim is required").max(5000),
    sourceType: SourceTypeSchema,
  })
  .strict();

export const MarketSpecSchema = z
  .object({
    question: z.string().min(1),
    outcomes: z.tuple([z.literal("YES"), z.literal("NO")]),
    deadline: z.string().min(1),
    category: z.string().min(1),
    resolution_source: z.string().min(1),
    resolution_rule: z.string().min(1),
    edge_cases: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const CriticSchema = z
  .object({
    objections: z.array(z.string().min(1)).min(1),
    ambiguity_risk: z.enum(["low", "medium", "high"]),
    suggested_fixes: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const JudgeSchema = z
  .object({
    verdict: z.enum(["blessed", "needs_revision", "rejected"]),
    final_question: z.string().min(1),
    final_resolution_rule: z.string().min(1),
    reasoning: z.array(z.string().min(1)).min(1),
    confidence: z.number().min(0).max(100),
  })
  .strict();

export const ScoresSchema = z
  .object({
    quality: z.number().min(0).max(100),
    tradability: z.number().min(0).max(100),
    resolution_clarity: z.number().min(0).max(100),
    ambiguity: z.number().min(0).max(100),
  })
  .strict();

const TraceObjectSchema = z.object({}).passthrough();

export const AgentTraceSchema = z
  .object({
    forger: TraceObjectSchema,
    critic: TraceObjectSchema,
    judge: TraceObjectSchema,
  })
  .strict();

export const ForgerModelOutputSchema = z
  .object({
    source_claim: z.string().min(1),
    canonical_claim: z.string().min(1),
    source_type: SourceTypeSchema,
    market_spec: MarketSpecSchema,
  })
  .strict();

export const CriticModelOutputSchema = z
  .object({
    critic: CriticSchema,
  })
  .strict();

export const JudgeModelOutputSchema = z
  .object({
    judge: JudgeSchema,
    scores: ScoresSchema,
  })
  .strict();

export const ForgeResponseSchema = z
  .object({
    source_claim: z.string().min(1),
    canonical_claim: z.string().min(1),
    source_type: SourceTypeSchema,
    market_spec: MarketSpecSchema,
    critic: CriticSchema,
    judge: JudgeSchema,
    scores: ScoresSchema,
    agent_trace: AgentTraceSchema,
  })
  .strict();

export type ForgeRequest = z.infer<typeof ForgeRequestSchema>;
export type ForgeResponse = z.infer<typeof ForgeResponseSchema>;
export type ForgerModelOutput = z.infer<typeof ForgerModelOutputSchema>;
export type CriticModelOutput = z.infer<typeof CriticModelOutputSchema>;
export type JudgeModelOutput = z.infer<typeof JudgeModelOutputSchema>;
