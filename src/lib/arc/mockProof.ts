import { arcTestnet } from "@/lib/arc/chains";
import type { ArcProofRecord } from "@/lib/arc/types";

function randomByte() {
  return Math.floor(Math.random() * 256);
}

function randomBytes(length: number) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  return Uint8Array.from({ length }, randomByte);
}

export function createMockArcTxHash(): `0x${string}` {
  const bytes = randomBytes(32);
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `0x${hex}`;
}

export function createMockArcProof({
  specHash,
  publishedBy,
}: {
  specHash: string;
  publishedBy: string;
}): ArcProofRecord {
  return {
    specHash,
    chainId: arcTestnet.id,
    chainName: arcTestnet.name,
    txHash: createMockArcTxHash(),
    mode: "mock",
    publishedBy,
    createdAt: new Date().toISOString(),
  };
}
