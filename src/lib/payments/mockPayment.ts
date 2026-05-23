import { X402_PRICE_USD } from "@/lib/payments/x402";
import type { PaymentRecord } from "@/lib/payments/types";

function randomPart() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));

    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  return Math.random().toString(16).slice(2).padEnd(16, "0");
}

export function createMockX402Reference(userId: string) {
  return `mock_x402_${Date.now().toString(36)}_${userId.slice(0, 6)}_${randomPart()}`;
}

export function createMockX402Payment(userId: string): PaymentRecord {
  return {
    userId,
    type: "forge_unlock",
    mode: "mock_x402",
    amountUsd: X402_PRICE_USD,
    creditsSpent: 0,
    txReference: createMockX402Reference(userId),
    status: "completed",
    createdAt: new Date().toISOString(),
  };
}

export function createForgeCreditPayment(userId: string): PaymentRecord {
  return {
    userId,
    type: "forge_unlock",
    mode: "forge_credit",
    amountUsd: 0,
    creditsSpent: 1,
    txReference: `forge_credit_${Date.now().toString(36)}_${randomPart()}`,
    status: "completed",
    createdAt: new Date().toISOString(),
  };
}
