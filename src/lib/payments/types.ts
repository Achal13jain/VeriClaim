import { z } from "zod";

export const FREE_FORGE_LIMIT = 3;

export const PaymentModeSchema = z.enum(["mock_x402", "forge_credit"]);

export const PaymentTypeSchema = z.literal("forge_unlock");

export const PaymentStatusSchema = z.literal("completed");

export const PaymentRecordSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  type: PaymentTypeSchema,
  mode: PaymentModeSchema,
  amountUsd: z.number().min(0),
  creditsSpent: z.number().int().min(0),
  txReference: z.string().min(8),
  status: PaymentStatusSchema,
  createdAt: z.string().min(1),
});

export const PaymentRequestSchema = z.object({
  userId: z.string().min(1),
  type: PaymentTypeSchema,
  mode: z.literal("mock_x402"),
});

export const PaymentResponseSchema = PaymentRecordSchema.extend({
  note: z.string(),
});

export type PaymentMode = z.infer<typeof PaymentModeSchema>;
export type PaymentRecord = z.infer<typeof PaymentRecordSchema>;
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;
