import type { MarketSpecRecord } from "@/lib/types";
import { canonicalize } from "@/lib/utils/canonicalize";

export type StableMarketSpecContent = Pick<
  MarketSpecRecord,
  | "sourceClaim"
  | "canonicalClaim"
  | "sourceType"
  | "marketSpec"
  | "critic"
  | "judge"
  | "scores"
  | "agentTrace"
  | "status"
>;

export function getStableMarketSpecContent(
  spec: MarketSpecRecord,
): StableMarketSpecContent {
  return {
    sourceClaim: spec.sourceClaim,
    canonicalClaim: spec.canonicalClaim,
    sourceType: spec.sourceType,
    marketSpec: spec.marketSpec,
    critic: spec.critic,
    judge: spec.judge,
    scores: spec.scores,
    agentTrace: spec.agentTrace,
    status: spec.status,
  };
}

async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function canonicalizeMarketSpec(spec: MarketSpecRecord) {
  return canonicalize(getStableMarketSpecContent(spec));
}

export async function hashMarketSpec(spec: MarketSpecRecord) {
  return `0x${await sha256Hex(canonicalizeMarketSpec(spec))}`;
}
