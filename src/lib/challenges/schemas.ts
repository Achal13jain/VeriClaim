import { z } from "zod";

export const ChallengeReasonCategorySchema = z.enum([
  "Ambiguous wording",
  "Weak deadline",
  "Bad resolution source",
  "Not binary",
  "Too subjective",
  "Missing edge case",
  "Other",
]);

export const ChallengeRequestSchema = z.object({
  specHash: z.string().min(1).max(140),
  marketSpec: z.record(z.unknown()),
  challengeReason: z.string().min(10).max(2_000),
  reasonCategory: ChallengeReasonCategorySchema,
});

export const ChallengeResponseSchema = z.object({
  ruling: z.enum(["accepted", "rejected", "needs_revision"]),
  summary: z.string().min(1),
  reasoning: z.array(z.string()).min(1),
  suggested_question: z.string().min(1),
  suggested_resolution_rule: z.string().min(1),
  credit_delta: z.number(),
  reputation_delta: z.number(),
});

export type ChallengeReasonCategory = z.infer<
  typeof ChallengeReasonCategorySchema
>;
export type ChallengeRequest = z.infer<typeof ChallengeRequestSchema>;
export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>;
